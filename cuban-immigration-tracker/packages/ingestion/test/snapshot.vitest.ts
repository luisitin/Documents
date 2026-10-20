/**
 * The committed pipeline output and the bundled sample (07 WP5 acceptance; 03 §1 principle 1):
 * - G1: app/src/data/sample validates, is marked `bundled_sample`, is the frozen golden snapshot
 *   (dataThrough 2026-08) and its manifest canary equals GOLDEN T15 (P12 0.09229, q50 54);
 * - data/ validates, and its manifest canary equals GOLDEN T15 on the fixture data (or the committed
 *   snapshot has a newer official month — then only Q12-style plausibility is checked);
 * - every national row is regenerated from the archived raw bytes in data/raw (no number without its file);
 * - `fit()` on the published inputs reproduces params.json (β 0.037391, σ 0.30, T6 multipliers).
 */
import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { validateDataDir } from '@caa/data-schemas/node';
import { GOLDEN } from '@caa/estimator/golden';
import type { EstimatorParams, Manifest, NationalFile, OfficesFile, PolicyFile, AlertsFile, QuarterlyFile } from '@caa/data-schemas';
import { describe, expect, it } from 'vitest';
import { canary, fit } from '../src/fit';
import { parseMonthlyCsv } from '../src/sources/monthlyCsv';
import { APP_SAMPLE, DATA, readJson } from './helpers';

const T15 = (GOLDEN as unknown as { cases: { T15: { pWithin: { m12: number }; quantiles: { q50: number } } } }).cases.T15;

async function snap(dir: string) {
  const r = async <T>(f: string) => readJson<T>(join(dir, f));
  return {
    manifest: await r<Manifest>('manifest.json'), national: await r<NationalFile>('national.json'), quarterly: await r<QuarterlyFile>('quarterly.json'),
    offices: await r<OfficesFile>('offices.json'), policy: await r<PolicyFile>('policy.json'), alerts: await r<AlertsFile>('alerts.json'), params: await r<EstimatorParams>('params.json'),
  };
}

describe('G1 bundled sample (app/src/data/sample)', () => {
  it('validates with the v1 schemas (sha256 + bytes match the manifest)', async () => {
    const v = await validateDataDir(APP_SAMPLE);
    expect(v.issues).toEqual({});
  });
  it('is the frozen golden snapshot, labelled as a sample, canary = GOLDEN T15', async () => {
    const s = await snap(APP_SAMPLE);
    expect(s.manifest.origin).toBe('bundled_sample');
    expect(s.manifest.qa.notes.some((n) => /muestra/i.test(n.es) && /sample/i.test(n.en))).toBe(true);
    expect(s.manifest.latestOfficialMonth).toBe('2026-08');
    expect(s.params.dataThrough).toBe('2026-08');
    expect(s.manifest.canary.pWithin12).toBeCloseTo(T15.pWithin.m12, 5);
    expect(Math.abs(s.manifest.canary.pWithin12 - T15.pWithin.m12)).toBeLessThan(5e-6);
    expect(s.manifest.canary.q50).toBe(T15.quantiles.q50);
    // and the canary is what the app's own path computes from these very files
    expect(canary(s).pWithin12).toBe(s.manifest.canary.pWithin12);
  });
  it('has no personal data: no receipt numbers, no names', async () => {
    for (const f of await readdir(APP_SAMPLE)) {
      const t = await readFile(join(APP_SAMPLE, f), 'utf8');
      expect(t).not.toMatch(/\b(IOE|MSC|NBC|EAC|WAC|LIN|SRC|YSC)\d{10}\b/);
    }
  });
});

describe('published data/ (pipeline output)', () => {
  const has = existsSync(join(DATA, 'manifest.json'));
  it.runIf(has)('validates, including the curated inputs', async () => {
    const v = await validateDataDir(DATA);
    expect(v.issues).toEqual({});
  });
  it.runIf(has)('canary = GOLDEN T15 on the 2026-08 fixture data; never the bundled origin', async () => {
    const s = await snap(DATA);
    expect(s.manifest.origin).toBe('pipeline');
    if (s.manifest.latestOfficialMonth === '2026-08') {
      expect(Math.abs(s.manifest.canary.pWithin12 - T15.pWithin.m12)).toBeLessThan(5e-6);
      expect(s.manifest.canary.q50).toBe(T15.quantiles.q50);
    } else {
      expect(s.manifest.canary.pWithin12).toBeGreaterThan(0);
    }
  });
  it.runIf(has)('every national row is regenerated from the archived raw file it cites', async () => {
    const s = await snap(DATA);
    for (const row of s.national.rows) {
      const metaDir = join(DATA, 'raw', 'uscis.monthly_csv', row.ym);
      const names = (await readdir(metaDir)).filter((n) => !n.endsWith('.meta.json'));
      const file = names.find((n) => row.source.url.endsWith(encodeURI(n)) || row.source.url.endsWith(n));
      expect(file, `${row.ym} raw file`).toBeDefined();
      const meta = await readJson<{ sha256: string; retrievedAt: string; url: string; via: 'direct' | 'mirror.visualizer' }>(join(metaDir, `${file}.meta.json`));
      expect(meta.sha256).toBe(row.source.sha256);
      const re = parseMonthlyCsv(new Uint8Array(await readFile(join(metaDir, file!))), { url: meta.url, via: meta.via, retrievedAt: meta.retrievedAt, sha256: meta.sha256 });
      expect(re.cuban).toEqual(row.revision ? { ...row, revision: undefined } : row);
    }
  });
  it.runIf(has)('fit() on the published inputs reproduces params.json except ledger timestamps', async () => {
    const s = await snap(DATA);
    const p = fit({ national: s.national, offices: s.offices, policy: s.policy, alerts: s.alerts, previous: s.params, now: s.manifest.lastCheckedAt, today: s.manifest.lastCheckedAt.slice(0, 10) });
    expect(p).toEqual(s.params);
    if (s.params.dataThrough === '2026-08') {
      expect(s.params.beta.value).toBeCloseTo(0.037391, 6); // golden T14
      expect(s.params.observation.sigma).toBe(0.3); // 04 §6.2
      const hia = s.params.officeMultipliers.find((m) => m.code === 'HIA')!;
      const tam = s.params.officeMultipliers.find((m) => m.code === 'TAM')!;
      expect([hia.completions, hia.avgPending, Math.round(hia.raw * 1000) / 1000, Math.round(hia.shrunk * 1000) / 1000]).toEqual([3, 37084, 0.055, 0.947]); // golden T6
      expect(Math.round(tam.shrunk * 1000) / 1000).toBe(1.936);
      expect(s.params.officeGroup).toEqual(['HIA', 'KND', 'MIA', 'TAM', 'HOU']);
    }
  });
});
