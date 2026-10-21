/**
 * `refresh` end to end against an in-memory network, starting from the frozen bundled sample (G1) as
 * the previously published snapshot:
 * - blocked sources keep their previous output and ORIGINAL retrievedAt; nothing is committed;
 * - a SYNTHETIC September 2026 file → new month, β/σ refit, a likelihood entry in the weight ledger
 *   that reproduces golden T31 (C_Sep = 820 → 0.4114 / 0.4216 / 0.0169 / 0.15);
 * - quarantine: a malformed or implausible new month is quarantined, the last good output kept,
 *   `qa.status = 'quarantined'`;
 * - dry run writes nothing; the 7-day heartbeat commits with only lastCheckedAt changed;
 * - the manifest validates with ManifestSchema; the canary stays GOLDEN T15 on the fixture data.
 */
import { readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ManifestSchema, type Manifest, type MonthlyRow } from '@caa/data-schemas';
import { validateDataDir } from '@caa/data-schemas/node';
import { scenarioWeights } from '@caa/estimator';
import { GOLDEN } from '@caa/estimator/golden';
import { afterEach, describe, expect, it } from 'vitest';
import { DOCKETS, FR_DOCUMENTS, JZEBEDEE_LATEST_RELEASE, MIRROR_DIR } from '../src/constants';
import { syntheticJzebedeeDb } from '../src/fixtures';
import { candidateWindowStart, refresh } from '../src/refresh';
import { FIX, fastClient, fixture, mockFetch, readJson, sampleDataDir, syntheticMonthCsv, type Route } from './helpers';

const NOW = new Date('2026-10-21T06:17:04Z');
const gen = { runId: 'test-run', ref: 'test', sha: 'test' };
const dirs: string[] = [];
afterEach(async () => { for (const d of dirs.splice(0)) await rm(d, { recursive: true, force: true }); });

async function prepared(): Promise<string> {
  const d = await sampleDataDir();
  dirs.push(d);
  return d;
}

/** uscis.gov unreachable (as from the sandbox); everything else 404 unless routed. */
function network(extra: [string | RegExp, Route][] = []) {
  const routes = new Map<string | RegExp, Route>([...extra, [/^https:\/\/(www|egov)\.uscis\.gov\//, 'network_error']]);
  return fastClient(mockFetch(routes));
}

const T15 = (GOLDEN as unknown as { cases: { T15: { pWithin: { m12: number }; quantiles: { q50: number } } } }).cases.T15;

describe('refresh', () => {
  it('blocked sources: keeps every previous output and its original retrievedAt; no commit', async () => {
    const d = await prepared();
    const before = await readFile(join(d, 'national.json'), 'utf8');
    const r = await refresh({ out: d, now: NOW, client: network(), env: {}, log: () => {}, generatedBy: gen });
    expect(r.decision).toMatchObject({ shouldCommit: false, reason: 'no_change' });
    expect(r.written).toEqual([]);
    expect(await readFile(join(d, 'national.json'), 'utf8')).toBe(before);
    const lastRow = r.files.national.rows.at(-1) as MonthlyRow;
    expect(lastRow.source.retrievedAt).toBe((JSON.parse(before).rows.at(-1) as MonthlyRow).source.retrievedAt);
    const monthly = r.manifest.sources.find((s) => s.id === 'uscis.monthly_csv')!;
    expect(monthly.status).toBe('network_error');
    expect(r.manifest.canary.pWithin12).toBeCloseTo(T15.pWithin.m12, 6);
    expect(r.manifest.canary.q50).toBe(T15.quantiles.q50);
    expect(ManifestSchema.safeParse(r.manifest).success).toBe(true);
  });

  it('new month (SYNTHETIC Sep 2026, C = 820) → commit, refit, ledger entry = golden T31; manifest + snapshot validate', async () => {
    const d = await prepared();
    const sep = await syntheticMonthCsv('September', 2026, { received: 1100, approved: 400, denied: 420, pending: 355800, over6: 347000, avg: 20.1 });
    const gh = join(d, 'gh.txt');
    const r = await refresh({ out: d, now: NOW, client: network([[`${MIRROR_DIR}monthly_september_2026.csv`, sep]]), env: {}, log: () => {}, generatedBy: gen, githubOutput: gh });
    expect(r.decision).toMatchObject({ shouldCommit: true, reason: 'content_changed' });
    expect(r.decision.changedFiles).toEqual(expect.arrayContaining(['national', 'params']));
    expect(r.newMonth).toBe(true);
    expect(r.files.national.rows.at(-1)).toMatchObject({ ym: '2026-09', approved: 400, denied: 420, source: { via: 'mirror.visualizer' } });
    expect(r.files.params.dataThrough).toBe('2026-09');
    const lik = r.files.params.weightLedger.find((e) => e.reason === 'likelihood' && e.observedMonth === '2026-09')!;
    expect(lik.observedCompletions).toBe(820);
    // The ledger holds exactly the estimator's case-independent weights for the refitted σ (03 §3.5)…
    const p = r.files.params;
    const sw = scenarioWeights(r.files.policy, r.files.alerts, r.files.national.rows, null, p.observation, '2026-10-21');
    expect(lik.after).toEqual(sw.trace.find((t) => t.observedMonth === '2026-09')!.after);
    expect(p.scenarioWeights.weights).toEqual(sw.weights);
    expect(p.observation.sigma).toBeGreaterThanOrEqual(0.25);
    // …and with σ held at 0.30 the same observation reproduces golden T31 (C_Sep = 820 row).
    const t31 = scenarioWeights(r.files.policy, r.files.alerts, r.files.national.rows, null, { ...p.observation, sigma: 0.3 }, '2026-10-21').weights;
    for (const [k, v] of Object.entries({ S0: 0.4114, S1: 0.4216, S2: 0.0169, S3: 0.15 })) expect(t31[k as 'S0']).toBeCloseTo(v, 3);
    const m = await readJson<Manifest>(join(d, 'manifest.json'));
    expect(ManifestSchema.safeParse(m).success).toBe(true);
    expect(m.latestOfficialMonth).toBe('2026-09');
    expect(m.dataChangedAt).toBe('2026-10-21T06:17:04Z');
    expect(m.sources.find((s) => s.id === 'uscis.monthly_csv')).toMatchObject({ status: 'fallback_used', publishedPeriod: '2026-09' });
    // the raw archive got the new file + meta
    const raw = await readdir(join(d, 'raw', 'uscis.monthly_csv', '2026-09'));
    expect(raw).toEqual(['monthly_september_2026.csv', 'monthly_september_2026.csv.meta.json']);
    const v = await validateDataDir(d);
    expect(v.issues).toEqual({});
    const out = await readFile(gh, 'utf8');
    expect(out).toContain('should_commit=true');
    expect(out).toContain('new_month=true');
    expect(out).toContain('data_month=2026-09');
  });

  it('quarantine: a malformed new month keeps the last good output and sets qa.status = quarantined', async () => {
    const d = await prepared();
    const bad = (await syntheticMonthCsv('September', 2026, { received: 1, approved: 1, denied: 1, pending: 355800, over6: 1, avg: 1 })).replace('Pending Over 6 Months', 'Pending >6');
    const r = await refresh({ out: d, now: NOW, client: network([[`${MIRROR_DIR}monthly_september_2026.csv`, bad]]), env: {}, log: () => {}, generatedBy: gen });
    expect(r.files.national.rows.at(-1)!.ym).toBe('2026-08');
    expect(r.qa.status).toBe('quarantined');
    expect(r.manifest.qa.status).toBe('quarantined');
    expect(r.manifest.qa.lastGoodRunId).not.toBe('test-run');
    expect(r.decision.shouldCommit).toBe(true); // the quarantine record itself is committed
    const q = r.quarantineDir!;
    expect(await readdir(q)).toEqual(expect.arrayContaining(['qa-report.json', 'uscis.monthly_csv']));
    const rep = await readJson<{ results: { id: string; level: string }[] }>(join(q, 'qa-report.json'));
    expect(rep.results.some((x) => x.id === 'Q1' && x.level === 'fail')).toBe(true);
    expect((await readJson<{ rows: unknown[] }>(join(d, 'national.json'))).rows).toHaveLength(r.files.national.rows.length);
  });

  it('quarantine: an implausible pending jump (Q11 > 25 %) is not published', async () => {
    const d = await prepared();
    const jump = await syntheticMonthCsv('September', 2026, { received: 1100, approved: 400, denied: 420, pending: 500000, over6: 347000, avg: 20.1 });
    const r = await refresh({ out: d, now: NOW, client: network([[`${MIRROR_DIR}monthly_september_2026.csv`, jump]]), env: {}, log: () => {}, generatedBy: gen, dryRun: true });
    expect(r.files.national.rows.at(-1)!.ym).toBe('2026-08');
    expect(r.qa.results.filter((x) => x.level === 'fail').map((x) => x.id)).toEqual(expect.arrayContaining(['Q4', 'Q11']));
  });

  it('Q8: the USCIS copy replaces the mirror copy when byte-identical; a copy differing from the live mirror is quarantined', async () => {
    const aug = await fixture('mirror/monthly_august_2026.csv');
    const direct = 'https://www.uscis.gov/sites/default/files/document/data/appropriation_requirement_august_2026_v1.0.csv';
    // uscis.gov answers (portal index 404, other files 404); only the August file exists, plus the mirror copy.
    const client = (body: Uint8Array | string) => fastClient(mockFetch(new Map<string | RegExp, Route>([[direct, body], [`${MIRROR_DIR}monthly_august_2026.csv`, aug]])));
    const d1 = await prepared();
    const ok = await refresh({ out: d1, now: NOW, client: client(aug), env: {}, log: () => {}, generatedBy: gen, dryRun: true });
    expect(ok.qa.results.find((x) => x.id === 'Q8')).toMatchObject({ level: 'pass' });
    expect(ok.files.national.rows.at(-1)!.source).toMatchObject({ via: 'direct', url: direct, sha256: '74aa7bce317fa19860b5ee59a29da0b432d5a2556ea13594fc0d4cfae7c96d8c' });
    expect(ok.manifest.sources.find((s) => s.id === 'uscis.monthly_csv')!.status).toBe('ok');
    const d2 = await prepared();
    const tampered = new TextDecoder().decode(aug).replace('"355,520"', '"355,529"');
    const bad = await refresh({ out: d2, now: NOW, client: client(tampered), env: {}, log: () => {}, generatedBy: gen, dryRun: true });
    expect(bad.qa.results.find((x) => x.id === 'Q8')).toMatchObject({ level: 'fail' });
    expect(bad.qa.status).toBe('quarantined');
    expect(bad.files.national.rows.at(-1)).toMatchObject({ pending: 355520, source: { via: 'mirror.visualizer' } });
  });

  it('regression Q8: a USCIS revision that the live mirror also carries is a Q3 revision (warn), not tampering', async () => {
    const aug = await fixture('mirror/monthly_august_2026.csv');
    const direct = 'https://www.uscis.gov/sites/default/files/document/data/appropriation_requirement_august_2026_v1.0.csv';
    // SYNTHETIC revision of the published (mirror-seeded) August row; the mirror has caught up too.
    const revised = new TextDecoder().decode(aug).replace('"355,520"', '"355,521"');
    const d = await prepared();
    const r = await refresh({ out: d, now: NOW, client: fastClient(mockFetch(new Map<string | RegExp, Route>([[direct, revised], [`${MIRROR_DIR}monthly_august_2026.csv`, revised]]))), env: {}, log: () => {}, generatedBy: gen, dryRun: true });
    expect(r.qa.results.find((x) => x.id === 'Q8')).toMatchObject({ level: 'pass' });
    expect(r.qa.status).not.toBe('quarantined');
    expect(r.qa.results.find((x) => x.id === 'Q3')).toMatchObject({ level: 'warn' });
    expect(r.files.national.rows.at(-1)).toMatchObject({ ym: '2026-08', pending: 355521, source: { via: 'direct' }, revision: { previous: { pending: 355520 } } });
    expect(r.decision.reason).toBe('content_changed');
    // Mirror unreachable → Q8 is skipped (not compared with the old published sha).
    const d2 = await prepared();
    const r2 = await refresh({ out: d2, now: NOW, client: fastClient(mockFetch(new Map<string | RegExp, Route>([[direct, revised]]))), env: {}, log: () => {}, generatedBy: gen, dryRun: true });
    expect(r2.qa.results.find((x) => x.id === 'Q8')).toBeUndefined();
    expect(r2.files.national.rows.at(-1)).toMatchObject({ pending: 355521 });
  });

  it('regression: a malformed escape on the portal index does not abort the run', async () => {
    const d = await prepared();
    const html = '<a href="/sites/default/files/document/reports/FY24_100%_review.pdf">x</a>';
    const fr = await readFile(join(FIX, 'synthetic', 'fr-search.json'), 'utf8');
    const r = await refresh({ out: d, now: NOW, client: network([['https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data', html], [/^https:\/\/www\.federalregister\.gov\/api\/v1\/documents\.json/, fr]]), env: {}, log: () => {}, generatedBy: gen, dryRun: true });
    expect(r.manifest.sources.find((s) => s.id === 'fr.api')!.status).toBe('ok');
    expect(r.manifest.sources.find((s) => s.id === 'uscis.portal_index')).toMatchObject({ status: 'ok', note: '1 document links' });
  });

  it('dry run: parses and runs QA but writes nothing', async () => {
    const d = await prepared();
    const sep = await syntheticMonthCsv('September', 2026, { received: 1100, approved: 400, denied: 420, pending: 355800, over6: 347000, avg: 20.1 });
    const before = await stat(join(d, 'manifest.json'));
    const r = await refresh({ out: d, now: NOW, client: network([[`${MIRROR_DIR}monthly_september_2026.csv`, sep]]), env: {}, log: () => {}, generatedBy: gen, dryRun: true });
    expect(r.decision.shouldCommit).toBe(true);
    expect(r.written).toEqual([]);
    expect((await stat(join(d, 'manifest.json'))).mtimeMs).toBe(before.mtimeMs);
    await expect(stat(join(d, 'raw'))).rejects.toThrow();
  });

  it('heartbeat: no change for ≥ 7 days → commit with only lastCheckedAt changed', async () => {
    const d = await prepared();
    const prev = await readJson<Manifest>(join(d, 'manifest.json'));
    const later = new Date(Date.parse(prev.lastCheckedAt) + 8 * 86_400_000);
    const r = await refresh({ out: d, now: later, client: network(), env: {}, log: () => {}, generatedBy: gen });
    expect(r.decision.reason).toBe('heartbeat');
    const m = await readJson<Manifest>(join(d, 'manifest.json'));
    expect(m.dataChangedAt).toBe(prev.dataChangedAt);
    expect(m.lastCheckedAt).not.toBe(prev.lastCheckedAt);
    expect(m.files).toEqual(prev.files);
  });

  it('processing times: a reachable jzebedee release replaces the seed and extends the inquiry history; candidates are collected', async () => {
    const d = await prepared();
    const db = await syntheticJzebedeeDb();
    const release = JSON.stringify({ tag_name: '2026-10-21', assets: [{ name: '2026-10-21.db', browser_download_url: 'https://github.com/jzebedee/uscis/releases/download/2026-10-21/2026-10-21.db' }] });
    const fr = await readFile(join(FIX, 'synthetic', 'fr-search.json'), 'utf8');
    const r = await refresh({
      out: d, now: NOW, env: {}, log: () => {}, generatedBy: gen, dryRun: true,
      client: network([[JZEBEDEE_LATEST_RELEASE, release], ['https://github.com/jzebedee/uscis/releases/download/2026-10-21/2026-10-21.db', db], [/^https:\/\/www\.federalregister\.gov\/api\/v1\/documents\.json/, fr]]),
    });
    const pt = r.manifest.sources.find((s) => s.id === 'mirror.jzebedee')!;
    expect(pt).toMatchObject({ status: 'ok', publishedPeriod: '2026-10-21' });
    expect(r.files.offices.processingTimes.find((x) => x.officeCode === 'MIA' && x.subtype === '131A-FAM')).toMatchObject({ months80: 30, source: { via: 'mirror.jzebedee', evidence: 'F' } });
    expect(r.candidates.map((c) => c.id)).toEqual(expect.arrayContaining(['fr:2025-05128']));
    expect(r.manifest.sources.find((s) => s.id === 'fr.api')!.status).toBe('ok');
  });

  it('regression: the jzebedee SEED with the same release tag is replaced by a download, a real release is not re-downloaded', async () => {
    const d = await prepared();
    expect((await readJson<Manifest>(join(d, 'manifest.json'))).sources.find((s) => s.id === 'mirror.jzebedee')).toMatchObject({ status: 'fallback_used', publishedPeriod: '2026-10-15' });
    const db = await syntheticJzebedeeDb();
    const asset = 'https://github.com/jzebedee/uscis/releases/download/2026-10-15/2026-10-15.db';
    const release = JSON.stringify({ tag_name: '2026-10-15', assets: [{ name: '2026-10-15.db', browser_download_url: asset }] });
    const calls: { url: string }[] = [];
    const client = () => fastClient(mockFetch(new Map<string | RegExp, Route>([[JZEBEDEE_LATEST_RELEASE, release], [asset, db], [/^https:\/\/(www|egov)\.uscis\.gov\//, 'network_error']]), calls));
    const r = await refresh({ out: d, now: NOW, client: client(), env: {}, log: () => {}, generatedBy: gen });
    expect(calls.some((c) => c.url === asset)).toBe(true);
    expect(r.manifest.sources.find((s) => s.id === 'mirror.jzebedee')).toMatchObject({ status: 'ok', publishedPeriod: '2026-10-15' });
    expect(r.files.offices.processingTimes.find((x) => x.officeCode === 'MIA' && x.subtype === '131A-FAM')).toMatchObject({ months80: 30, source: { via: 'mirror.jzebedee', evidence: 'F' } });
    // Second run against the now-real release output: the shortcut applies and the .db is not fetched.
    calls.length = 0;
    const r2 = await refresh({ out: d, now: new Date(NOW.getTime() + 3_600_000), client: client(), env: {}, log: () => {}, generatedBy: gen, dryRun: true });
    expect(calls.some((c) => c.url === asset)).toBe(false);
    expect(r2.manifest.sources.find((s) => s.id === 'mirror.jzebedee')).toMatchObject({ status: 'not_modified', note: 'release unchanged' });
  });

  it('regression: FR / CourtListener windows start at each source\'s own last success (minus overlap), not lastCheckedAt; FR pages are followed', async () => {
    expect(candidateWindowStart(undefined)).toBe('2025-01-01');
    expect(candidateWindowStart('2026-09-05T00:00:00Z')).toBe('2026-08-29');
    expect(candidateWindowStart('2025-01-03T00:00:00Z')).toBe('2025-01-01');
    const d = await prepared();
    const mp = join(d, 'manifest.json');
    const m = await readJson<Manifest>(mp);
    expect(m.lastCheckedAt.slice(0, 10)).toBe('2026-10-20'); // the heartbeat moved past an FR / CL outage
    for (const s of m.sources) if (s.id === 'fr.api' || s.id === 'courtlistener.v4') { s.status = 'ok'; s.lastSuccessAt = '2026-09-05T00:00:00Z'; }
    await writeFile(mp, JSON.stringify(m));
    const page1 = JSON.parse(await readFile(join(FIX, 'synthetic', 'fr-search.json'), 'utf8'));
    const next = `${FR_DOCUMENTS}?page=2&per_page=100`;
    page1.next_page_url = next; page1.total_pages = 2;
    const page2 = { count: 1, total_pages: 2, next_page_url: null, results: [{ document_number: '2026-99999', title: 'SYNTHETIC page-2 notice on parole', publication_date: '2026-09-10', html_url: 'https://www.federalregister.gov/d/2026-99999' }] };
    const cl = await readFile(join(FIX, 'synthetic', 'cl-entries.json'), 'utf8');
    const calls: { url: string }[] = [];
    const client = fastClient(mockFetch(new Map<string | RegExp, Route>([
      [next, JSON.stringify(page2)], [/^https:\/\/www\.federalregister\.gov\/api\/v1\/documents\.json/, JSON.stringify(page1)],
      [new RegExp(`docket-entries/\\?docket=${DOCKETS[0].id}&`), { status: 500 }], [/courtlistener\.com\/api\/rest\/v4\/docket-entries/, cl],
      [/^https:\/\/(www|egov)\.uscis\.gov\//, 'network_error'],
    ]), calls));
    const r = await refresh({ out: d, now: NOW, client, env: { COURTLISTENER_TOKEN: 'test-token' }, log: () => {}, generatedBy: gen, dryRun: true });
    const frCall = decodeURIComponent(calls.find((c) => c.url.startsWith(FR_DOCUMENTS) && c.url.includes('publication_date'))!.url);
    expect(frCall).toContain('conditions[publication_date][gte]=2026-08-29');
    expect(calls.some((c) => c.url === next)).toBe(true);
    const ids = r.candidates.map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining(['fr:2025-05128', 'fr:2026-99999']));
    // The 2026-09-01 entry falls inside the outage window that lastCheckedAt (2026-10-20) would have skipped.
    expect(ids).toEqual(expect.arrayContaining([`cl:${DOCKETS[1].docketNumber}:900000001`, `cl:${DOCKETS[1].docketNumber}:900000002`]));
    expect(r.manifest.sources.find((s) => s.id === 'fr.api')).toMatchObject({ status: 'ok', lastSuccessAt: '2026-10-21T06:17:04Z' });
    // One docket failed: the CourtListener window does not advance.
    expect(r.manifest.sources.find((s) => s.id === 'courtlistener.v4')).toMatchObject({ status: 'ok', lastSuccessAt: '2026-09-05T00:00:00Z' });
  });

  it('--only rejects unknown keys and leaves other sources untouched', async () => {
    const d = await prepared();
    await expect(refresh({ out: d, now: NOW, client: network(), env: {}, log: () => {}, only: ['nope'] })).rejects.toThrow(/unknown source key/);
    const r = await refresh({ out: d, now: NOW, client: network(), env: {}, log: () => {}, only: ['curated'], generatedBy: gen, dryRun: true });
    expect(r.manifest.sources.find((s) => s.id === 'uscis.monthly_csv')).toEqual((await readJson<Manifest>(join(d, 'manifest.json'))).sources.find((s) => s.id === 'uscis.monthly_csv'));
  });
});
