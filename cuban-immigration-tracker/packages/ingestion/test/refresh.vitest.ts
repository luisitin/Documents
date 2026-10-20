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
import { readFile, readdir, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { ManifestSchema, type Manifest, type MonthlyRow } from '@caa/data-schemas';
import { validateDataDir } from '@caa/data-schemas/node';
import { scenarioWeights } from '@caa/estimator';
import { GOLDEN } from '@caa/estimator/golden';
import { afterEach, describe, expect, it } from 'vitest';
import { JZEBEDEE_LATEST_RELEASE, MIRROR_DIR } from '../src/constants';
import { syntheticJzebedeeDb } from '../src/fixtures';
import { refresh } from '../src/refresh';
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

  it('Q8: the USCIS copy replaces the mirror copy when byte-identical; a differing copy is quarantined', async () => {
    const aug = await fixture('mirror/monthly_august_2026.csv');
    const direct = 'https://www.uscis.gov/sites/default/files/document/data/appropriation_requirement_august_2026_v1.0.csv';
    // uscis.gov answers (portal index 404, other files 404); only the August file exists.
    const client = (body: Uint8Array | string) => fastClient(mockFetch(new Map<string | RegExp, Route>([[direct, body]])));
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

  it('--only rejects unknown keys and leaves other sources untouched', async () => {
    const d = await prepared();
    await expect(refresh({ out: d, now: NOW, client: network(), env: {}, log: () => {}, only: ['nope'] })).rejects.toThrow(/unknown source key/);
    const r = await refresh({ out: d, now: NOW, client: network(), env: {}, log: () => {}, only: ['curated'], generatedBy: gen, dryRun: true });
    expect(r.manifest.sources.find((s) => s.id === 'uscis.monthly_csv')).toEqual((await readJson<Manifest>(join(d, 'manifest.json'))).sources.find((s) => s.id === 'uscis.monthly_csv'));
  });
});
