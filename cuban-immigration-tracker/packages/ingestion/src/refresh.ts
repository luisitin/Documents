/**
 * `cli.ts refresh` — one pipeline run (03-data-pipeline.md §2–§7).
 *
 * 1. Read the previously published snapshot (`data/*.json`) and the curated inputs (`data/curated/`).
 * 2. Ingest each source independently (03 §1 principle 2): a blocked or failing source keeps its
 *    previous output and its ORIGINAL `retrievedAt`; the job never fails because a site blocks us.
 *    - P1 monthly CSV: portal href → constructed USCIS names → mirror (backfill from 2024-07 when no
 *      national.json exists; otherwise the latest month is re-checked and the next two are tried).
 *    - P2 all-forms workbook and P3 by-office workbook: same pattern per fiscal quarter.
 *    - P4 jzebedee release (GitHub API) → SQLite → processing times + inquiry-date history.
 *    - P6 historic medians and C1 policy / alerts / content: curated (strict zod).
 *    - P7 Federal Register, P8 USCIS RSS, P9 CourtListener: alert candidates only.
 * 3. QA gates Q1–Q12 (03 §4): a failing source's new output is quarantined (`data/quarantine/<runId>/`)
 *    and its last good output kept; `manifest.qa.status` = ok | degraded | quarantined.
 * 4. Fit (03 §3.5): β, σ, case-independent weights + ledger, office multipliers; canary = T15.
 * 5. Commit policy (ARCH-6): write only when content changed or the 7-day heartbeat is due.
 *    `--dry-run` parses and runs QA but writes nothing.
 * 6. GitHub outputs: should_commit, new_month, new_quarter, qa_status, alerts_changed, data_month, summary.
 */
import { execFileSync } from 'node:child_process';
import { appendFile } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  AlertCandidate, AlertsFile, ContentFile, DataFileName, EstimatorParams, FiscalQuarter, I765NationalRow, ISODate, ISODateTime, Manifest,
  MonthlyRow, NationalFile, Office, OfficeQuarterStat, OfficesFile, PolicyFile, ProcessingTimeRecord, QuarterRow, QuarterlyFile, SourceId, SourceRef,
  SourceStatus, YearMonth,
} from '@caa/data-schemas';
import { DATA_FILE_NAMES } from '@caa/data-schemas';
import type { Classification } from './classify';
import { decideCommit, type CommitDecision } from './commitPolicy';
import {
  DOCKETS, FIRST_MODEL_MONTH, JZEBEDEE_LATEST_RELEASE, JZEBEDEE_RELEASES, MONTHLY_BACKFILL_FROM, OFFICE_QUARTERS_KEPT, PORTAL_INDEX_URL,
  QUARTERLY_BACKFILL_FROM, RSS_FEEDS, allFormsUrls, byOfficeUrls, monthlyCsvDirectUrls, monthlyCsvMirrorUrl,
} from './constants';
import { FIXTURES_DIR, runGoldenFixtures } from './fixtures';
import { canary, fit } from './fit';
import { HttpClient, bodyJson, bodyText } from './http';
import {
  q1Validate, q3Continuity, q4FlowIdentity, q5MonthlyVsQuarterly, q6PendingGap, q7Humanitarian, q8MirrorSha, q9ProcessingTimes, q10Subtypes,
  q11PendingJump, q12Canary, runQa, type QaReport, type QaResult,
} from './qa';
import { fileNameOf, listRawMetas, planRaw, writeRaw, type RawMeta } from './raw';
import {
  buildManifest, loadPublished, mergeCandidates, publish, pruneQuarantine, serializeFiles, writeAtomic, writeQuarantine,
  type PreviousSnapshot, type PublishedFiles,
} from './publish';
import { authHeaders, clCandidates, docketEntriesUrl, MAX_REQUESTS_PER_RUN } from './sources/courtListener';
import { loadCurated } from './sources/curated';
import { frCandidates, frSearchUrl, parseFrSearch } from './sources/federalRegister';
import { parseByOffice, type ByOfficeResult } from './sources/i485ByOffice';
import { parseMonthlyCsv } from './sources/monthlyCsv';
import { findMonthLink, findQuarterLink, parsePortalIndex, type PortalLink } from './sources/portalIndex';
import { pickReleaseAsset, readProcessingTimes, seedProcessingTimes, updateInquiryHistory } from './sources/processingTimes';
import { approvalBaselines, mergeQuarterRows, parseAllForms } from './sources/quarterlyAllForms';
import { parseRss, rssCandidates } from './sources/uscisRss';
import {
  SourceError, addMonthsYm, cmpQuarter, isoSeconds, sha256Hex, monthRange, prevQuarter, quarterKey, quarterOfMonth, quarterRange, nextQuarter, sameQuarter, serializeJson,
} from './util';

/** Source keys accepted by `--only` (03 §2.2 table, plus `curated`). */
export const SOURCE_KEYS = [
  'uscis.monthly_csv', 'uscis.quarterly_all_forms', 'uscis.i485_by_office', 'mirror.jzebedee', 'fr.api', 'uscis.rss', 'courtlistener.v4', 'curated',
] as const;
export type SourceKey = (typeof SOURCE_KEYS)[number];

export interface RefreshOptions {
  out: string;
  curatedDir?: string;
  fixturesDir?: string;
  only?: string[];
  dryRun?: boolean;
  now?: Date;
  client?: HttpClient;
  env?: Record<string, string | undefined>;
  log?: (line: string) => void;
  githubOutput?: string;
  /** Git provenance override (tests). */
  generatedBy?: { runId: string; ref: string; sha: string };
}

export interface RefreshResult {
  decision: CommitDecision;
  manifest: Manifest;
  files: PublishedFiles;
  qa: QaReport;
  newMonth: boolean;
  newQuarter: boolean;
  alertsChanged: boolean;
  summary: string;
  written: string[];
  rawNew: RawMeta[];
  quarantineDir: string | null;
  candidates: AlertCandidate[];
}

interface FetchCandidate { url: string; via: SourceRef['via']; predicted: boolean }
interface Fetched { url: string; via: SourceRef['via']; bytes: Uint8Array; status: number; headers: Record<string, string> }
interface FetchFileResult { file: Fetched | null; notModified: boolean; attempts: { url: string; classification: Classification; status: number | null; error?: string }[] }

interface Ctx {
  out: string;
  now: Date;
  nowIso: ISODateTime;
  today: ISODate;
  runId: string;
  client: HttpClient;
  env: Record<string, string | undefined>;
  log: (line: string) => void;
  raw: { meta: RawMeta; bytes: Uint8Array; isNew: boolean }[];
  quarantine: { file: string; bytes: Uint8Array }[];
  qa: QaResult[];
  candidates: AlertCandidate[];
  portal: PortalLink[] | null;
}

const ym = (d: ISODate) => d.slice(0, 7);
const last = <T>(a: T[]) => a[a.length - 1];

function gitInfo(env: Record<string, string | undefined>): { ref: string; sha: string } {
  const git = (args: string[]) => { try { return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };
  return { ref: env.GITHUB_REF_NAME || git(['rev-parse', '--abbrev-ref', 'HEAD']) || 'local', sha: env.GITHUB_SHA || git(['rev-parse', 'HEAD']) || 'unknown' };
}

/** Tries direct candidates in order, then the mirror (03 P1–P3 failure handling). */
async function fetchFile(ctx: Ctx, cands: FetchCandidate[], validators?: { url: string; etag?: string; lastModified?: string }): Promise<FetchFileResult> {
  const attempts: FetchFileResult['attempts'] = [];
  for (const c of cands) {
    const v = validators && validators.url === c.url ? validators : undefined;
    const r = await ctx.client.fetch({ url: c.url, predicted: c.predicted, accept: '*/*', etag: v?.etag ?? null, lastModified: v?.lastModified ?? null });
    attempts.push({ url: c.url, classification: r.classification, status: r.status, ...(r.error ? { error: r.error } : {}) });
    if (r.classification === 'not_modified') return { file: null, notModified: true, attempts };
    if (r.classification === 'ok' && r.body && r.status !== null) return { file: { url: c.url, via: c.via, bytes: r.body, status: r.status, headers: r.headers }, notModified: false, attempts };
  }
  return { file: null, notModified: false, attempts };
}

/** The most informative failure of a fetch sequence (for the manifest status). */
function failureClass(attempts: FetchFileResult['attempts']): SourceStatus['status'] {
  const order: Classification[] = ['blocked_cloudflare', 'blocked_drupal_antibot', 'http_error', 'network_error', 'schema_mismatch', 'not_yet'];
  for (const c of order) if (attempts.some((a) => a.classification === c)) return c as SourceStatus['status'];
  return 'network_error';
}

function attemptNote(attempts: FetchFileResult['attempts']): string {
  const direct = attempts.filter((a) => !a.url.includes('raw.githubusercontent.com') && a.classification !== 'ok' && a.classification !== 'not_modified');
  if (!direct.length) return '';
  const a = direct[0]!;
  const why = a.error?.startsWith('skipped:') ? 'host unreachable from this run' : a.error?.slice(0, 80);
  return `USCIS direct: ${a.classification}${a.status ? ` ${a.status}` : ''}${why ? ` (${why})` : ''}`;
}

async function archive(ctx: Ctx, sourceId: SourceId, period: string, f: Fetched): Promise<RawMeta> {
  const plan = await planRaw(ctx.out, { sourceId, period, url: f.url, via: f.via, status: f.status, headers: f.headers, bytes: f.bytes, retrievedAt: ctx.nowIso });
  if (plan.isNew) ctx.raw.push(plan);
  return plan.meta;
}

function quarantineAttempt(ctx: Ctx, sourceId: string, period: string, f: Fetched): void {
  ctx.quarantine.push({ file: `${sourceId}/${period}/${fileNameOf(f.url)}`, bytes: f.bytes });
}

/** The latest archived validators (ETag / Last-Modified) for one period. */
async function validatorsFor(ctx: Ctx, sourceId: SourceId, period: string): Promise<{ url: string; etag?: string; lastModified?: string } | undefined> {
  const m = (await listRawMetas(ctx.out, sourceId, period))[0];
  if (!m) return undefined;
  return { url: m.url, ...(m.headers.etag ? { etag: m.headers.etag } : {}), ...(m.headers['last-modified'] ? { lastModified: m.headers['last-modified'] } : {}) };
}

async function loadPortal(ctx: Ctx): Promise<SourceStatus> {
  const r = await ctx.client.fetch({ url: PORTAL_INDEX_URL, accept: 'text/html,application/xhtml+xml' });
  if (r.classification === 'ok') {
    ctx.portal = parsePortalIndex(bodyText(r));
    return { id: 'uscis.portal_index', url: PORTAL_INDEX_URL, status: 'ok', lastSuccessAt: ctx.nowIso, note: `${ctx.portal.length} document links` };
  }
  ctx.portal = [];
  return { id: 'uscis.portal_index', url: PORTAL_INDEX_URL, status: r.classification as SourceStatus['status'], note: `${r.status ?? ''} ${r.error ?? ''}`.trim().slice(0, 200) || undefined };
}

const prevStatus = (prev: PreviousSnapshot, id: SourceId) => prev.manifest?.sources.find((s) => s.id === id);

function statusFor(id: SourceId, url: string, obtained: Fetched | null, notModified: boolean, attempts: FetchFileResult['attempts'], ctx: Ctx, prev: PreviousSnapshot, extra: Partial<SourceStatus>): SourceStatus {
  const p = prevStatus(prev, id);
  const status: SourceStatus['status'] = obtained ? (obtained.via === 'direct' ? 'ok' : 'fallback_used') : notModified ? 'not_modified' : failureClass(attempts);
  const lastSuccessAt = obtained || notModified ? ctx.nowIso : p?.lastSuccessAt;
  return { id, url: obtained?.url ?? url, status, ...(lastSuccessAt ? { lastSuccessAt } : {}), ...extra };
}

// ── P1 monthly ──────────────────────────────────────────────────────────────────────────────

async function ingestMonthly(ctx: Ctx, prev: PreviousSnapshot): Promise<{ national: NationalFile; status: SourceStatus; newMonths: YearMonth[] }> {
  const rows: MonthlyRow[] = (prev.national?.rows ?? []).slice();
  const i765: I765NationalRow[] = (prev.national?.i765National ?? []).slice();
  const lastComplete = addMonthsYm(ym(ctx.today), -1);
  const latest = last(rows)?.ym;
  const portalMonths = (ctx.portal ?? []).filter((l) => l.kind === 'monthly_csv' && l.ym && (!latest || l.ym > latest) && l.ym <= lastComplete).map((l) => l.ym!);
  const targets = [...new Set([...(latest ? [latest, addMonthsYm(latest, 1), addMonthsYm(latest, 2)].filter((m) => m <= lastComplete) : monthRange(MONTHLY_BACKFILL_FROM, lastComplete)), ...portalMonths])].sort();

  const newMonths: YearMonth[] = [];
  const allAttempts: FetchFileResult['attempts'] = [];
  const missing: YearMonth[] = [];
  let obtainedLatest: Fetched | null = null;
  let anyNotModified = false;
  let latestSha: string | undefined;

  for (const m of targets) {
    const link = ctx.portal ? findMonthLink(ctx.portal, m) : undefined;
    const direct: FetchCandidate[] = [...(link ? [{ url: link.href, via: 'direct' as const, predicted: false }] : []), ...monthlyCsvDirectUrls(m).filter((u) => u !== link?.href).map((url) => ({ url, via: 'direct' as const, predicted: true }))];
    const r = await fetchFile(ctx, [...direct, { url: monthlyCsvMirrorUrl(m), via: 'mirror.visualizer', predicted: true }], await validatorsFor(ctx, 'uscis.monthly_csv', m));
    allAttempts.push(...r.attempts);
    if (r.notModified) { anyNotModified = true; continue; }
    if (!r.file) { if (!latest || m <= latest) missing.push(m); continue; }
    // Q8 (fail = possible tampering): a month fetched directly is compared with the mirror copy — the
    // published mirror-sourced row's sha when there is one, else the mirror file when it has the month.
    if (r.file.via === 'direct') {
      const pub = rows.find((x) => x.ym === m);
      let mirrorSha = pub?.source.via === 'mirror.visualizer' ? pub.source.sha256 : undefined;
      if (!pub) {
        const mr = await ctx.client.fetch({ url: monthlyCsvMirrorUrl(m), predicted: true });
        if (mr.classification === 'ok' && mr.body) mirrorSha = sha256Hex(mr.body);
      }
      const q8 = q8MirrorSha('uscis.monthly_csv', sha256Hex(r.file.bytes), mirrorSha);
      if (mirrorSha) ctx.qa.push(q8);
      if (q8.level === 'fail') { quarantineAttempt(ctx, 'uscis.monthly_csv', m, r.file); continue; }
    }
    const meta = await archive(ctx, 'uscis.monthly_csv', m, r.file);
    let parsed;
    try {
      parsed = parseMonthlyCsv(r.file.bytes, { url: meta.url, via: meta.via, retrievedAt: meta.retrievedAt, sha256: meta.sha256 });
    } catch (e) {
      if (!(e instanceof SourceError)) throw e;
      ctx.qa.push({ id: 'Q1', source: 'uscis.monthly_csv', level: 'fail', message: `${m}: schema_mismatch: ${e.message}` });
      quarantineAttempt(ctx, 'uscis.monthly_csv', m, r.file);
      continue;
    }
    if (parsed.month !== m) {
      ctx.qa.push({ id: 'Q1', source: 'uscis.monthly_csv', level: 'fail', message: `${fileNameOf(r.file.url)} is titled ${parsed.month}, expected ${m}` });
      quarantineAttempt(ctx, 'uscis.monthly_csv', m, r.file);
      continue;
    }
    const row = parsed.cuban;
    const q3 = q3Continuity(rows, row, FIRST_MODEL_MONTH, (x) => addMonthsYm(x, 1));
    const gates: QaResult[] = [q3];
    const prevRow = rows.find((x) => x.ym === addMonthsYm(m, -1));
    const changed = !rows.some((x) => x.ym === m) || q3.revision === true;
    if (prevRow && changed) gates.push(q4FlowIdentity(prevRow, row), q11PendingJump(prevRow, row));
    ctx.qa.push(...gates.filter((g) => g.level !== 'pass' || changed));
    if (gates.some((g) => g.level === 'fail')) { quarantineAttempt(ctx, 'uscis.monthly_csv', m, r.file); continue; }
    const existing = rows.find((x) => x.ym === m);
    let final: MonthlyRow = row;
    if (q3.revision && existing) {
      const { ym: y, received, approved, denied, pending, pendingOver6, avgMonths } = existing;
      final = { ...row, revision: { previous: { ym: y, received, approved, denied, pending, pendingOver6, avgMonths }, detectedAt: ctx.nowIso } };
    } else if (existing?.revision) {
      final = { ...row, revision: existing.revision }; // unchanged values: keep the recorded revision
    }
    const idx = rows.findIndex((x) => x.ym === m);
    if (idx >= 0) rows[idx] = final; else { rows.push(final); if (!latest || m > latest) newMonths.push(m); }
    const j = i765.findIndex((x) => x.ym === m);
    if (j >= 0) i765[j] = parsed.i765; else i765.push(parsed.i765);
    if (!latest || m >= latest) { obtainedLatest = r.file; latestSha = meta.sha256; }
  }
  rows.sort((a, b) => (a.ym < b.ym ? -1 : 1));
  i765.sort((a, b) => (a.ym < b.ym ? -1 : 1));
  const lastRow = last(rows);
  const nextTried = targets.filter((m) => !lastRow || m > lastRow.ym);
  const notes = [
    attemptNote(allAttempts),
    newMonths.length ? `new: ${newMonths.length > 3 ? `${newMonths[0]} … ${last(newMonths)} (${newMonths.length} months)` : newMonths.join(', ')}` : 'no new month',
    nextTried.length ? `${nextTried.join(', ')} not published yet` : '',
    missing.filter((m) => m < (lastRow?.ym ?? '')).length ? `not found at USCIS or the mirror: ${missing.filter((m) => m < (lastRow?.ym ?? '')).join(', ')}` : '',
  ].filter(Boolean);
  const status = statusFor('uscis.monthly_csv', monthlyCsvDirectUrls(lastRow?.ym ?? lastComplete)[0]!, obtainedLatest, anyNotModified, allAttempts, ctx, prev, {
    ...(lastRow ? { publishedPeriod: lastRow.ym } : {}), ...(latestSha ?? lastRow?.source.sha256 ? { sha256: (latestSha ?? lastRow?.source.sha256)! } : {}), note: notes.join('; ').slice(0, 500),
  });
  if (!rows.length) throw new Error('monthly: no national rows could be obtained and none were published before (cannot build national.json)');
  return { national: { rows, i765National: i765, firstModelMonth: FIRST_MODEL_MONTH }, status, newMonths };
}

// ── P2 all-forms ────────────────────────────────────────────────────────────────────────────

function lastCompleteQuarter(today: ISODate): FiscalQuarter {
  return prevQuarter(quarterOfMonth(ym(today)));
}

async function ingestAllForms(ctx: Ctx, prev: PreviousSnapshot): Promise<{ rows: QuarterRow[]; status: SourceStatus; newQuarters: FiscalQuarter[]; parsed: QuarterRow[] }> {
  let rows: QuarterRow[] = (prev.quarterly?.rows ?? []).slice();
  const cuban = rows.filter((r) => r.form === 'I-485 (Cuban)').sort((a, b) => cmpQuarter(a.quarter, b.quarter));
  const latest = last(cuban)?.quarter;
  const lcq = lastCompleteQuarter(ctx.today);
  const targets = latest ? [latest, nextQuarter(latest)].filter((q) => cmpQuarter(q, lcq) <= 0) : quarterRange(QUARTERLY_BACKFILL_FROM, lcq);
  const newQuarters: FiscalQuarter[] = [];
  const parsedRows: QuarterRow[] = [];
  const attempts: FetchFileResult['attempts'] = [];
  let obtained: Fetched | null = null;
  let anyNotModified = false;
  let sha: string | undefined;
  for (const q of targets) {
    const u = allFormsUrls(q);
    const link = ctx.portal ? findQuarterLink(ctx.portal, 'quarterly_all_forms', q) : undefined;
    const cands: FetchCandidate[] = [
      ...(link ? [{ url: link.href, via: 'direct' as const, predicted: false }] : []),
      ...u.direct.filter((x) => x !== link?.href).map((url) => ({ url, via: 'direct' as const, predicted: true })),
      ...u.mirror.map((url) => ({ url, via: 'mirror.visualizer' as const, predicted: true })),
    ];
    const r = await fetchFile(ctx, cands, await validatorsFor(ctx, 'uscis.quarterly_all_forms', quarterKey(q).replace(' ', '-')));
    attempts.push(...r.attempts);
    if (r.notModified) { anyNotModified = true; continue; }
    if (!r.file) continue;
    const period = quarterKey(q).replace(' ', '-');
    const isNew = !rows.some((x) => x.form === 'I-485 (Cuban)' && sameQuarter(x.quarter, q));
    if (r.file.via === 'direct') {
      const pub = rows.find((x) => x.form === 'I-485 (Cuban)' && sameQuarter(x.quarter, q));
      let mirrorSha = pub?.source.via === 'mirror.visualizer' ? pub.source.sha256 : undefined;
      if (!pub) {
        const mr = await ctx.client.fetch({ url: u.mirror[0]!, predicted: true });
        if (mr.classification === 'ok' && mr.body) mirrorSha = sha256Hex(mr.body);
      }
      const q8 = q8MirrorSha('uscis.quarterly_all_forms', sha256Hex(r.file.bytes), mirrorSha);
      if (mirrorSha) ctx.qa.push(q8);
      if (q8.level === 'fail') { quarantineAttempt(ctx, 'uscis.quarterly_all_forms', period, r.file); continue; }
    }
    const meta = await archive(ctx, 'uscis.quarterly_all_forms', period, r.file);
    try {
      const p = await parseAllForms(r.file.bytes, { url: meta.url, via: meta.via, retrievedAt: meta.retrievedAt, sha256: meta.sha256 });
      if (!sameQuarter(p.quarter, q)) throw new SourceError(`workbook is ${quarterKey(p.quarter)}, expected ${quarterKey(q)}`);
      rows = mergeQuarterRows(rows, p.rows);
      parsedRows.push(...p.rows);
      if (isNew) newQuarters.push(q);
      if (!latest || cmpQuarter(q, latest) >= 0) { obtained = r.file; sha = meta.sha256; }
    } catch (e) {
      if (!(e instanceof SourceError)) throw e;
      ctx.qa.push({ id: 'Q1', source: 'uscis.quarterly_all_forms', level: 'fail', message: `${quarterKey(q)}: schema_mismatch: ${e.message}` });
      quarantineAttempt(ctx, 'uscis.quarterly_all_forms', period, r.file);
    }
  }
  const lq = last(rows.filter((r) => r.form === 'I-485 (Cuban)').sort((a, b) => cmpQuarter(a.quarter, b.quarter)))?.quarter;
  const status = statusFor('uscis.quarterly_all_forms', allFormsUrls(lq ?? lcq).direct[0]!, obtained, anyNotModified, attempts, ctx, prev, {
    ...(lq ? { publishedPeriod: quarterKey(lq) } : {}), ...(sha ? { sha256: sha } : prevStatus(prev, 'uscis.quarterly_all_forms')?.sha256 ? { sha256: prevStatus(prev, 'uscis.quarterly_all_forms')!.sha256! } : {}),
    note: [attemptNote(attempts), newQuarters.length ? `new: ${newQuarters.map(quarterKey).join(', ')}` : 'no new quarter'].filter(Boolean).join('; '),
  });
  return { rows, status, newQuarters, parsed: parsedRows };
}

// ── P3 by office ────────────────────────────────────────────────────────────────────────────

async function ingestByOffice(ctx: Ctx, prev: PreviousSnapshot): Promise<{ offices: Office[]; stateOffices: Record<string, string[]>; stats: OfficeQuarterStat[]; status: SourceStatus; parsed: ByOfficeResult[] }> {
  let stats: OfficeQuarterStat[] = (prev.offices?.quarterly ?? []).slice();
  let offices = prev.offices?.offices ?? [];
  let stateOffices = prev.offices?.stateOffices ?? {};
  const quarters = [...new Map(stats.map((s) => [quarterKey(s.quarter), s.quarter])).values()].sort(cmpQuarter);
  const latest = last(quarters);
  const lcq = lastCompleteQuarter(ctx.today);
  // Backfill walks back from the last complete quarter and stops after OFFICE_QUARTERS_KEPT workbooks.
  const targets = latest ? [latest, nextQuarter(latest)].filter((q) => cmpQuarter(q, lcq) <= 0) : quarterRange(QUARTERLY_BACKFILL_FROM, lcq).reverse();
  const parsed: ByOfficeResult[] = [];
  const attempts: FetchFileResult['attempts'] = [];
  let obtained: Fetched | null = null;
  let anyNotModified = false;
  let sha: string | undefined;
  for (const q of targets) {
    if (!latest && parsed.length >= OFFICE_QUARTERS_KEPT) break;
    const u = byOfficeUrls(q);
    const link = ctx.portal ? findQuarterLink(ctx.portal, 'i485_by_office', q) : undefined;
    const cands: FetchCandidate[] = [
      ...(link ? [{ url: link.href, via: 'direct' as const, predicted: false }] : []),
      ...u.direct.filter((x) => x !== link?.href).map((url) => ({ url, via: 'direct' as const, predicted: true })),
      ...u.mirror.map((url) => ({ url, via: 'mirror.visualizer' as const, predicted: true })),
    ];
    const period = quarterKey(q).replace(' ', '-');
    const r = await fetchFile(ctx, cands, await validatorsFor(ctx, 'uscis.i485_by_office', period));
    attempts.push(...r.attempts);
    if (r.notModified) { anyNotModified = true; continue; }
    if (!r.file) continue;
    const meta = await archive(ctx, 'uscis.i485_by_office', period, r.file);
    try {
      const p = await parseByOffice(r.file.bytes, { url: meta.url, via: meta.via, retrievedAt: meta.retrievedAt, sha256: meta.sha256 });
      if (!sameQuarter(p.quarter, q)) throw new SourceError(`workbook is ${quarterKey(p.quarter)}, expected ${quarterKey(q)}`);
      parsed.push(p);
      stats = [...stats.filter((s) => !sameQuarter(s.quarter, q)), ...p.stats];
      if (!parsed.slice(0, -1).some((x) => cmpQuarter(x.quarter, q) > 0) && (!latest || cmpQuarter(q, latest) >= 0)) { obtained = r.file; sha = meta.sha256; offices = p.offices; stateOffices = p.stateOffices; }
    } catch (e) {
      if (!(e instanceof SourceError)) throw e;
      ctx.qa.push({ id: 'Q1', source: 'uscis.i485_by_office', level: 'fail', message: `${quarterKey(q)}: schema_mismatch: ${e.message}` });
      quarantineAttempt(ctx, 'uscis.i485_by_office', period, r.file);
    }
  }
  // Keep the last OFFICE_QUARTERS_KEPT quarters, and only offices listed in the newest workbook.
  const keptQ = [...new Map(stats.map((s) => [quarterKey(s.quarter), s.quarter])).values()].sort(cmpQuarter).slice(-OFFICE_QUARTERS_KEPT);
  const codes = new Set(offices.map((o) => o.code));
  stats = stats
    .filter((s) => keptQ.some((q) => sameQuarter(q, s.quarter)) && codes.has(s.officeCode))
    .sort((a, b) => cmpQuarter(a.quarter, b.quarter) || offices.findIndex((o) => o.code === a.officeCode) - offices.findIndex((o) => o.code === b.officeCode));
  const lq = last(keptQ);
  const unplaced = last(parsed)?.unplacedServiceCenters ?? [];
  const status = statusFor('uscis.i485_by_office', obtained?.url ?? byOfficeUrls(lq ?? lcq).direct[0]!, obtained, anyNotModified, attempts, ctx, prev, {
    ...(lq ? { publishedPeriod: quarterKey(lq) } : {}), ...(sha ? { sha256: sha } : prevStatus(prev, 'uscis.i485_by_office')?.sha256 ? { sha256: prevStatus(prev, 'uscis.i485_by_office')!.sha256! } : {}),
    note: [attemptNote(attempts), `${offices.length} offices`, unplaced.length ? `service centers without a state in the file, not listed: ${unplaced.join(', ')}` : ''].filter(Boolean).join('; '),
  });
  if (!offices.length) throw new Error('by-office: no offices could be obtained and none were published before (cannot build offices.json)');
  return { offices, stateOffices, stats, status, parsed };
}

// ── P4 processing times ─────────────────────────────────────────────────────────────────────

async function ingestProcessingTimes(ctx: Ctx, prev: PreviousSnapshot): Promise<{ records: ProcessingTimeRecord[]; history: OfficesFile['inquiryDateHistory']; status: SourceStatus }> {
  const prevRecords = prev.offices?.processingTimes ?? [];
  const prevHistory = prev.offices?.inquiryDateHistory ?? [];
  const prevLatest = prevRecords.reduce<string | null>((m, r) => (m === null || r.publicationDate > m ? r.publicationDate : m), null);
  const p = prevStatus(prev, 'mirror.jzebedee');
  const token = ctx.env.GITHUB_TOKEN;
  const rel = await ctx.client.fetch({ url: JZEBEDEE_LATEST_RELEASE, accept: 'application/vnd.github+json', headers: token ? { authorization: `Bearer ${token}`, 'x-github-api-version': '2022-11-28' } : {} });
  const keep = (status: SourceStatus['status'], note: string): { records: ProcessingTimeRecord[]; history: OfficesFile['inquiryDateHistory']; status: SourceStatus } => {
    if (prevRecords.length) return { records: prevRecords, history: prevHistory, status: { id: 'mirror.jzebedee', url: p?.url ?? JZEBEDEE_RELEASES, status, ...(p?.lastSuccessAt ? { lastSuccessAt: p.lastSuccessAt } : {}), ...(p?.publishedPeriod ? { publishedPeriod: p.publishedPeriod } : {}), note: `${note}; previous output kept (retrievedAt carried forward)` } };
    const seeded = seedProcessingTimes(ctx.nowIso);
    return {
      records: seeded, history: updateInquiryHistory(prevHistory, seeded),
      status: { id: 'mirror.jzebedee', url: `${JZEBEDEE_RELEASES}/tag/2026-10-15`, status: 'fallback_used', publishedPeriod: '2026-10-15',
        note: `${note}; SEEDED from the research transcription of the 2026-10-15 release diff (docs/research/04-uscis-data-sources.md §2.4), not a fresh download; months80 unknown` },
    };
  };
  if (rel.classification !== 'ok') return keep(rel.classification as SourceStatus['status'], `GitHub release API ${rel.classification}${rel.status ? ` ${rel.status}` : ''}`);
  const asset = pickReleaseAsset(bodyJson(rel));
  if (!asset) return keep('schema_mismatch', 'latest release has no .db asset');
  if (p?.publishedPeriod === asset.tag && prevRecords.length) {
    return { records: prevRecords, history: prevHistory, status: { id: 'mirror.jzebedee', url: asset.url, status: 'not_modified', lastSuccessAt: ctx.nowIso, publishedPeriod: asset.tag, note: 'release unchanged' } };
  }
  const db = await ctx.client.fetch({ url: asset.url, accept: 'application/octet-stream', maxBytes: 512 * 1024 * 1024 });
  if (db.classification !== 'ok' || !db.body) return keep(db.classification as SourceStatus['status'], `release asset ${db.classification}`);
  try {
    const r = await readProcessingTimes(db.body, { url: asset.url, retrievedAt: ctx.nowIso, releaseTag: asset.tag });
    ctx.qa.push(q9ProcessingTimes(r.records, 0, prevLatest));
    const q10 = q10Subtypes(r.i485FormKeys);
    ctx.qa.push(q10);
    for (const k of q10.unknown) ctx.candidates.push({ id: `subtype:${k}`, foundAt: ctx.nowIso, source: 'mirror.jzebedee', title: `CAA_SUBTYPE_PRESENT: new I-485 processing-times subtype ${k}`, url: asset.url, matchedTerms: ['CAA_SUBTYPE_PRESENT'] });
    if (!r.records.length) return keep('schema_mismatch', 'no tracked rows in the database');
    // Keep the original retrievedAt for records whose publication did not change.
    const records = r.records.map((rec) => {
      const old = prevRecords.find((x) => x.form === rec.form && x.subtype === rec.subtype && x.officeCode === rec.officeCode && x.publicationDate === rec.publicationDate);
      return old && old.inquiryDate === rec.inquiryDate && old.months80 === rec.months80 ? old : rec;
    });
    return { records, history: updateInquiryHistory(prevHistory, records), status: { id: 'mirror.jzebedee', url: asset.url, status: 'ok', lastSuccessAt: ctx.nowIso, publishedPeriod: asset.tag, note: `${records.length} records; derived fields only, DB not stored (no LICENSE upstream)` } };
  } catch (e) {
    if (!(e instanceof SourceError)) throw e;
    ctx.qa.push({ id: 'Q1', source: 'mirror.jzebedee', level: 'fail', message: `schema_mismatch: ${e.message}` });
    return keep('schema_mismatch', e.message);
  }
}

// ── P7–P9 candidates ────────────────────────────────────────────────────────────────────────

async function ingestCandidates(ctx: Ctx, prev: PreviousSnapshot, run: (k: SourceKey) => boolean): Promise<SourceStatus[]> {
  const out: SourceStatus[] = [];
  const since = (prev.manifest?.lastCheckedAt ?? '2025-01-01T00:00:00Z').slice(0, 10);
  if (run('fr.api')) {
    const url = frSearchUrl(since);
    const r = await ctx.client.fetch({ url, accept: 'application/json' });
    if (r.classification === 'ok') {
      try {
        const c = frCandidates(parseFrSearch(bodyJson(r)), ctx.nowIso);
        ctx.candidates.push(...c);
        out.push({ id: 'fr.api', url, status: 'ok', lastSuccessAt: ctx.nowIso, note: `${c.length} documents since ${since}` });
      } catch (e) { out.push({ id: 'fr.api', url, status: 'schema_mismatch', note: (e as Error).message.slice(0, 200) }); }
    } else out.push({ id: 'fr.api', url, status: r.classification as SourceStatus['status'], ...(prevStatus(prev, 'fr.api')?.lastSuccessAt ? { lastSuccessAt: prevStatus(prev, 'fr.api')!.lastSuccessAt! } : {}), note: 'skipped' });
  } else { const s = prevStatus(prev, 'fr.api'); if (s) out.push(s); }

  if (run('uscis.rss')) {
    let ok = 0; let firstFail: SourceStatus['status'] | null = null; let found = 0;
    for (const f of RSS_FEEDS) {
      const r = await ctx.client.fetch({ url: f.url, accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.8' });
      if (r.classification !== 'ok') { firstFail ??= r.classification as SourceStatus['status']; continue; }
      try { const c = rssCandidates(parseRss(bodyText(r)).items, ctx.nowIso); ctx.candidates.push(...c); found += c.length; ok++; } catch { firstFail ??= 'schema_mismatch'; }
    }
    out.push({ id: 'uscis.rss', url: RSS_FEEDS[0].url, status: ok ? 'ok' : firstFail ?? 'network_error', ...(ok ? { lastSuccessAt: ctx.nowIso } : prevStatus(prev, 'uscis.rss')?.lastSuccessAt ? { lastSuccessAt: prevStatus(prev, 'uscis.rss')!.lastSuccessAt! } : {}), note: ok ? `${ok}/${RSS_FEEDS.length} feeds, ${found} matching items` : 'skipped' });
  } else { const s = prevStatus(prev, 'uscis.rss'); if (s) out.push(s); }

  if (run('courtlistener.v4')) {
    const token = ctx.env.COURTLISTENER_TOKEN;
    if (!token) out.push({ id: 'courtlistener.v4', url: 'https://www.courtlistener.com/api/rest/v4/', status: 'skipped_no_secret', note: 'COURTLISTENER_TOKEN not set' });
    else {
      let ok = 0; let fail: SourceStatus['status'] | null = null;
      for (const d of DOCKETS.slice(0, MAX_REQUESTS_PER_RUN)) {
        const r = await ctx.client.fetch({ url: docketEntriesUrl(d.id), accept: 'application/json', headers: authHeaders(token) });
        if (r.classification !== 'ok') { fail ??= r.classification as SourceStatus['status']; continue; }
        try { ctx.candidates.push(...clCandidates(bodyJson(r), d, since, ctx.nowIso)); ok++; } catch { fail ??= 'schema_mismatch'; }
      }
      out.push({ id: 'courtlistener.v4', url: 'https://www.courtlistener.com/api/rest/v4/docket-entries/', status: ok ? 'ok' : fail ?? 'network_error', ...(ok ? { lastSuccessAt: ctx.nowIso } : {}), note: `${ok}/${Math.min(DOCKETS.length, MAX_REQUESTS_PER_RUN)} dockets` });
    }
  } else { const s = prevStatus(prev, 'courtlistener.v4'); if (s) out.push(s); }
  return out;
}

// ── main ────────────────────────────────────────────────────────────────────────────────────

/** 07 WP5 `cli.ts refresh --out data [--only] [--dry-run] [--github-output <file>]`. */
export async function refresh(o: RefreshOptions): Promise<RefreshResult> {
  const now = o.now ?? new Date();
  const env = o.env ?? process.env;
  const log = o.log ?? ((l: string) => console.log(l));
  const nowIso = isoSeconds(now);
  const ctx: Ctx = {
    out: o.out, now, nowIso, today: nowIso.slice(0, 10), runId: o.generatedBy?.runId ?? env.GITHUB_RUN_ID ?? `local-${nowIso.replace(/[-:]/g, '').replace('T', 't').toLowerCase()}`,
    client: o.client ?? new HttpClient({ mode: 'refresh' }), env, log, raw: [], quarantine: [], qa: [], candidates: [], portal: null,
  };
  const only = (o.only ?? []).map((s) => s.trim()).filter(Boolean);
  for (const k of only) if (!(SOURCE_KEYS as readonly string[]).includes(k)) throw new Error(`--only: unknown source key "${k}" (known: ${SOURCE_KEYS.join(', ')})`);
  const run = (k: SourceKey) => only.length === 0 || only.includes(k);

  const prev = await loadPublished(o.out);
  const curated = await loadCurated(o.curatedDir ?? join(o.out, 'curated'));
  log(`[refresh] run ${ctx.runId}; previous snapshot: ${prev.manifest ? `${prev.manifest.latestOfficialMonth} (checked ${prev.manifest.lastCheckedAt})` : 'none'}${only.length ? `; only ${only.join(',')}` : ''}${o.dryRun ? '; DRY RUN' : ''}`);

  // Q2 first: if the parsers no longer reproduce the golden fixtures, no new parse is trusted.
  const q2 = await runGoldenFixtures(o.fixturesDir ?? FIXTURES_DIR);
  ctx.qa.push(...q2);
  const parsersOk = q2.every((r) => r.level === 'pass');

  const statuses: SourceStatus[] = [];
  const needPortal = parsersOk && (run('uscis.monthly_csv') || run('uscis.quarterly_all_forms') || run('uscis.i485_by_office'));
  if (needPortal) statuses.push(await loadPortal(ctx));
  else { const s = prevStatus(prev, 'uscis.portal_index'); if (s) statuses.push(s); }

  // P1
  let national = prev.national;
  let newMonths: YearMonth[] = [];
  if (run('uscis.monthly_csv') && parsersOk) {
    const m = await ingestMonthly(ctx, prev);
    national = m.national; newMonths = m.newMonths; statuses.push(m.status);
  } else { const s = prevStatus(prev, 'uscis.monthly_csv'); if (s) statuses.push(s); }
  if (!national) throw new Error('no national.json: run without --only (or with the monthly source) first');

  // P2
  let qRows = prev.quarterly?.rows ?? [];
  let newQuarters: FiscalQuarter[] = [];
  if (run('uscis.quarterly_all_forms') && parsersOk) {
    const q = await ingestAllForms(ctx, prev);
    qRows = q.rows; newQuarters = q.newQuarters; statuses.push(q.status);
    for (const r of q.parsed.filter((x) => x.form === 'I-485 (Cuban)')) ctx.qa.push(q5MonthlyVsQuarterly(national.rows, r), q6PendingGap(national.rows, r));
  } else { const s = prevStatus(prev, 'uscis.quarterly_all_forms'); if (s) statuses.push(s); }

  // P3
  let offices: Office[] = prev.offices?.offices ?? [];
  let stateOffices = prev.offices?.stateOffices ?? {};
  let stats = prev.offices?.quarterly ?? [];
  if (run('uscis.i485_by_office') && parsersOk) {
    const b = await ingestByOffice(ctx, prev);
    offices = b.offices; stateOffices = b.stateOffices; stats = b.stats; statuses.push(b.status);
    for (const p of b.parsed) ctx.qa.push(q7Humanitarian(p.nationalHumanitarian, qRows.filter((r) => sameQuarter(r.quarter, p.quarter))));
  } else { const s = prevStatus(prev, 'uscis.i485_by_office'); if (s) statuses.push(s); }

  // P4
  let processingTimes = prev.offices?.processingTimes ?? [];
  let history = prev.offices?.inquiryDateHistory ?? [];
  if (run('mirror.jzebedee')) {
    const pt = await ingestProcessingTimes(ctx, prev);
    processingTimes = pt.records; history = pt.history; statuses.push(pt.status);
  } else { const s = prevStatus(prev, 'mirror.jzebedee'); if (s) statuses.push(s); }

  // P6 + C1
  const curatedOk = Object.keys(curated.issues).length === 0;
  const policy: PolicyFile | undefined = (run('curated') && curated.policy) || prev.policy || curated.policy || undefined;
  const alerts: AlertsFile | undefined = (run('curated') && curated.alerts) || prev.alerts || curated.alerts || undefined;
  const content: ContentFile | undefined = (run('curated') && curated.content) || prev.content || curated.content || undefined;
  const historicMedians = (run('curated') && curated.historicMedians) || prev.quarterly?.historicMedians || curated.historicMedians || [];
  if (!policy || !alerts || !content) throw new Error(`curated inputs invalid and nothing published before: ${JSON.stringify(curated.issues)}`);
  statuses.push({ id: 'uscis.historic_pt', url: 'https://egov.uscis.gov/processing-times/historic-pt', status: 'fallback_used', publishedPeriod: `FY${Math.max(...historicMedians.map((h) => h.fy), 0)}`, note: 'curated from press reports [S-sec] (data/curated/historic_medians.json); the page is Cloudflare-gated (03 P6)' });
  statuses.push({
    id: 'curated', url: 'https://github.com/luisitin/Documents/tree/main/cuban-immigration-tracker/data/curated',
    status: curatedOk ? 'ok' : 'schema_mismatch', lastSuccessAt: curatedOk ? nowIso : prevStatus(prev, 'curated')?.lastSuccessAt ?? nowIso,
    note: curatedOk ? `policy ${policy.version} reviewed ${policy.reviewedAt}; ${alerts.alerts.length} alerts` : `invalid curated input kept out (previous copy published): ${Object.keys(curated.issues).join(', ')}`.slice(0, 500),
  });
  if (!curatedOk) for (const [k, v] of Object.entries(curated.issues)) ctx.qa.push({ id: 'Q1', source: 'curated', level: 'fail', message: `curated/${k}: ${v.slice(0, 3).join('; ')}` });

  // P7–P9
  statuses.push(...(await ingestCandidates(ctx, prev, run)));

  // ── assemble + Q1 ─────────────────────────────────────────────────────────────────────────
  const quarterly: QuarterlyFile = { rows: qRows, historicMedians, approvalBaselines: approvalBaselines(qRows) };
  const officesFile: OfficesFile = { offices, stateOffices, processingTimes, quarterly: stats, inquiryDateHistory: history };
  const draft: Omit<PublishedFiles, 'params'> = { national, quarterly, offices: officesFile, policy, alerts, content };
  for (const n of ['national', 'quarterly', 'offices', 'policy', 'alerts', 'content'] as const) {
    const g = q1Validate(n, draft[n], ctx.today);
    ctx.qa.push(g);
    if (g.level === 'fail') {
      const p = prev[n];
      if (!p) throw new Error(`assembled ${n}.json is invalid and there is no previous copy: ${g.message}`);
      (draft as Record<string, unknown>)[n] = p;
    }
  }
  const params: EstimatorParams = fit({ national: draft.national, offices: draft.offices, policy: draft.policy, alerts: draft.alerts, previous: prev.params ?? null, now: nowIso, today: ctx.today });
  const g1 = q1Validate('params', params, ctx.today);
  ctx.qa.push(g1);
  if (g1.level === 'fail') throw new Error(`fitted params.json is invalid: ${g1.message}`);
  const files: PublishedFiles = { ...draft, params };
  const serialized = serializeFiles(files);

  // ── canary (needs a manifest for the guard inputs) ────────────────────────────────────────
  const latestOfficialMonth = last(files.national.rows)!.ym;
  const cubanQ = files.quarterly.rows.filter((r) => r.form === 'I-485 (Cuban)').sort((a, b) => cmpQuarter(a.quarter, b.quarter));
  if (!cubanQ.length) throw new Error('quarterly.json has no "I-485 (Cuban)" row');
  const latestOfficialQuarter = last(cubanQ)!.quarter;
  const latestPub = files.offices.processingTimes.reduce<string | null>((m, r) => (m === null || r.publicationDate > m ? r.publicationDate : m), null);
  const git = o.generatedBy ?? { runId: ctx.runId, ...gitInfo(env) };
  const provisional = (canaryValue: Manifest['canary'], qa: Manifest['qa'], d: { dataChangedAt: string; lastCheckedAt: string }) => buildManifest({
    ...d, generatedBy: git, latestOfficialMonth, latestOfficialQuarter, latestProcessingTimesPublication: latestPub, serialized, sources: statuses, qa, canary: canaryValue,
  });
  const placeholder = provisional({ caseId: 'T15', pWithin12: 0, q50: null, computedWith: 'VPH-1.1' }, { status: 'ok', lastGoodRunId: ctx.runId, notes: [] }, { dataChangedAt: nowIso, lastCheckedAt: nowIso });
  const can = canary({ ...files, manifest: placeholder });
  const newMonth = !prev.manifest || latestOfficialMonth > prev.manifest.latestOfficialMonth;
  const newQuarter = !prev.manifest || cmpQuarter(latestOfficialQuarter, prev.manifest.latestOfficialQuarter) > 0;
  ctx.qa.push(q12Canary(prev.manifest?.canary ?? null, can, newMonth || newQuarter || newMonths.length > 0 || newQuarters.length > 0));
  const qa = runQa(ctx.qa);

  // ── commit decision ──────────────────────────────────────────────────────────────────────
  const shas = Object.fromEntries(DATA_FILE_NAMES.map((n) => [n, serialized[n].sha256])) as Record<DataFileName, string>;
  const candidates = mergeCandidates(prev.candidates ?? [], ctx.candidates);
  const candidatesChanged = serializeJson(candidates) !== serializeJson(prev.candidates ?? []) && candidates.length > 0;
  const rawNew = ctx.raw.filter((r) => r.isNew);
  const failed = qa.results.filter((r) => r.level === 'fail');
  const decision = decideCommit({ previous: prev.manifest ?? null, shas, now: nowIso, sideFilesChanged: rawNew.length > 0 || candidatesChanged || failed.length > 0 });
  const prevLastGood = prev.manifest?.qa.lastGoodRunId;
  const manifest = provisional(can, { status: qa.status, lastGoodRunId: qa.status === 'ok' ? ctx.runId : prevLastGood ?? ctx.runId, notes: qa.notes }, { dataChangedAt: decision.dataChangedAt, lastCheckedAt: decision.lastCheckedAt });
  const alertsChanged = !!prev.manifest && prev.manifest.files.alerts.sha256 !== shas.alerts;

  // ── write ────────────────────────────────────────────────────────────────────────────────
  const written: string[] = [];
  let quarantineDir: string | null = null;
  if (!o.dryRun && decision.shouldCommit) {
    for (const r of rawNew) written.push(await writeRaw(o.out, r));
    if (failed.length) {
      quarantineDir = await writeQuarantine(o.out, ctx.runId, { at: nowIso, runId: ctx.runId, status: qa.status, results: qa.results.filter((r) => r.level !== 'pass') }, ctx.quarantine);
      written.push(quarantineDir);
    }
    if (candidates.length) { const p = join(o.out, 'candidates', 'alert-candidates.json'); await writeAtomic(p, serializeJson(candidates)); written.push(p); }
    written.push(...(await publish(o.out, serialized, manifest)));
  }
  if (!o.dryRun) for (const id of await pruneQuarantine(o.out, now)) written.push(join(o.out, 'quarantine', id));

  const summary = [
    decision.reason,
    newMonths.length ? `month ${last(newMonths)}` : '',
    newQuarters.length ? `quarter ${quarterKey(last(newQuarters)!)}` : '',
    decision.changedFiles.length && decision.reason !== 'first_run' ? `changed ${decision.changedFiles.join(',')}` : '',
    `qa ${qa.status}`,
  ].filter(Boolean).join('; ').replace(/[^\w ;,.:()-]/g, '');

  for (const r of qa.results.filter((x) => x.level !== 'pass')) log(`[qa] ${r.level.toUpperCase()} ${r.id} ${r.source}: ${r.message}`);
  for (const s of statuses) log(`[source] ${s.id}: ${s.status}${s.publishedPeriod ? ` (${s.publishedPeriod})` : ''}${s.note ? ` — ${s.note}` : ''}`);
  log(`[refresh] canary T15 P12 ${can.pWithin12.toFixed(5)} q50 ${can.q50}; decision ${decision.reason} (${decision.shouldCommit ? 'commit' : 'no commit'})${o.dryRun ? ' [dry run: nothing written]' : ''}`);

  if (o.githubOutput) {
    const out = {
      should_commit: String(!o.dryRun && decision.shouldCommit), new_month: String(decision.shouldCommit && newMonth), new_quarter: String(decision.shouldCommit && newQuarter),
      qa_status: qa.status, alerts_changed: String(decision.shouldCommit && alertsChanged), data_month: latestOfficialMonth, summary,
    };
    await appendFile(o.githubOutput, Object.entries(out).map(([k, v]) => `${k}=${v}\n`).join(''));
  }
  return { decision, manifest, files, qa, newMonth, newQuarter, alertsChanged, summary, written, rawNew: rawNew.map((r) => r.meta), quarantineDir, candidates };
}
