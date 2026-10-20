/**
 * G0 — the hand-built sample (07-implementation-plan.md §5 gates; WP1 acceptance "G0 validates with
 * every schema"). Also checks that the transcribed numbers equal their documented sources, so the
 * sample cannot drift from the research:
 * - national rows = 04-estimation-model.md Appendix A `ROWS_TXT` (doc 04 §1.1 [F]);
 * - β = 0.037391 (04 §3.2, T14) and the shrunk office multipliers of 04 §5.3 FL-4
 *   (0.947 / 0.829 / 0.963 / 1.936) and doc 08 §7.3 (HOU 1.140), recomputed with EST-11;
 * - the pinned remedy ETAs of 07 WP3 (MIA 2028-01-30, HIA 2027-10-06, KND 2027-10-22, TAM 2027-07-28);
 * - manifest canary = GOLDEN T15 (P12 0.09229, q50 54; 04 §9.2).
 */
import { describe, expect, it } from 'vitest';
import {
  DATA_FILE_NAMES, crossCheckSnapshot, parseDataFile, parseManifest,
  type DataFileName, type EstimatorParams, type Manifest, type NationalFile, type OfficesFile, type PolicyFile, type QuarterlyFile,
} from '@caa/data-schemas';
import { validateDataDir } from '@caa/data-schemas/node';
import { G0 } from './helpers';

const doc04 = Object.values(import.meta.glob('../../../docs/planning/04-estimation-model.md', { query: '?raw', import: 'default', eager: true }))[0] as string;

const file = <T>(n: string) => G0[`sample-handbuilt/${n}`] as T;
const national = file<NationalFile>('national');
const quarterly = file<QuarterlyFile>('quarterly');
const offices = file<OfficesFile>('offices');
const policy = file<PolicyFile>('policy');
const params = file<EstimatorParams>('params');
const manifest = file<Manifest>('manifest');

describe('G0 validates', () => {
  it.each(DATA_FILE_NAMES)('%s parses with its v1 schema', (n) => {
    const r = parseDataFile(n as DataFileName, G0[`sample-handbuilt/${n}`]);
    if (!r.ok) throw new Error(r.issues.join('\n'));
  });

  it('manifest parses, is labelled as a sample and carries GOLDEN T15 as canary', () => {
    const r = parseManifest(manifest);
    expect(r.ok).toBe(true);
    expect(manifest.origin).toBe('bundled_sample');
    expect(manifest.qa.notes[0]?.en).toMatch(/sample/i);
    expect(manifest.qa.notes[0]?.es).toMatch(/muestra/i);
    expect(manifest.canary).toEqual({ caseId: 'T15', pWithin12: 0.09229, q50: 54, computedWith: 'VPH-1.1' });
    expect(manifest.latestOfficialMonth).toBe('2026-08');
    expect(manifest.latestOfficialQuarter).toEqual({ fy: 2026, q: 3 });
  });

  it('validateDataDir: every file valid, sha256 and bytes match the manifest, cross-checks pass', async () => {
    const r = await validateDataDir(new URL('./fixtures/sample-handbuilt/', import.meta.url));
    expect(r.issues).toEqual({});
    expect(r.ok).toBe(true);
    // The only expected warning: the (c)(9) yardstick sits at NBC, a service center not listed as an office.
    expect(Object.values(r.warnings).flat()).toEqual(['processingTimes office NBC (I-765 147-C9) is not listed in offices']);
  });

  it('crossCheckSnapshot finds no issue', () => {
    expect(crossCheckSnapshot({ manifest, national, quarterly, offices, policy, params }).issues).toEqual({});
  });
});

describe('G0 matches its documented sources', () => {
  it('national rows = 04 Appendix A ROWS_TXT (24 rows Sep 2024 → Aug 2026)', () => {
    const txt = /ROWS_TXT = """([\s\S]*?)"""/.exec(doc04)?.[1];
    expect(txt).toBeDefined();
    const want = txt!.trim().split('\n').map((l) => l.trim().split(/\s+/));
    expect(national.rows).toHaveLength(24);
    national.rows.forEach((r, i) => {
      const [ym, rec, app, den, pend, p6, avg] = want[i]!;
      expect([r.ym, r.received, r.approved, r.denied, r.pending, r.pendingOver6, r.avgMonths])
        .toEqual([ym, Number(rec), Number(app), Number(den), Number(pend), Number(p6), Number(avg)]);
    });
    expect(national.firstModelMonth).toBe('2024-09');
    // 04 §3.1 / T13: Σn = 355,520 pending at Aug 2026; 820 completions in Aug 2026 (434 denials).
    expect(national.rows.at(-1)).toMatchObject({ pending: 355520, approved: 386, denied: 434 });
  });

  it('quarterly Cuban rows = doc 04 §1.2 / key facts §7 (FY26 Q3 6,279 / 139 / 447 / 586 / 342,360 / 16.3)', () => {
    const q3 = quarterly.rows.find((r) => r.form === 'I-485 (Cuban)' && r.quarter.q === 3)!;
    expect([q3.received, q3.approved, q3.denied, q3.completions, q3.pendingWorkbook, q3.medianMonths]).toEqual([6279, 139, 447, 586, 342360, 16.3]);
    expect(q3.fytd).toEqual({ received: 46500, approved: 4287, denied: 865 });
    // Baselines 91.7 / 52.6 / 23.7 / 83 % (key facts §2 row 9; 07 WP3 approval card).
    expect(quarterly.approvalBaselines.map((b) => Math.round(b.share * 1000) / 10)).toEqual([91.7, 52.6, 23.7, 83.2]);
  });

  it('params: β fit 0.037391 (T14) with the Jun/Jul/Aug 2026 targets (EST-3)', () => {
    expect(params.beta.value).toBeCloseTo(0.037391, 5);
    expect(params.beta.targets).toEqual(['2026-06', '2026-07', '2026-08']);
    expect(params.beta.fallbackUsed).toBe(false);
    expect(params.dataThrough).toBe('2026-08');
    expect(params.observation.sigma).toBe(0.3); // 04 §6.2
    expect(params.scenarioWeights.weights).toEqual({ S0: 0.3, S1: 0.4, S2: 0.15, S3: 0.15 }); // 04 §6.3 "Today"
  });

  it('office multipliers: EST-11 on the G0 office rows reproduces 04 §5.3 / doc 08 §7.3 (T6)', () => {
    const k = params.k0Office;
    const stats = (c: string) => offices.quarterly.filter((s) => s.officeCode === c);
    const y = (c: string) => stats(c).reduce((a, s) => a + (s.approved ?? 0), 0);
    const E = (c: string) => stats(c).reduce((a, s) => a + (s.pending ?? 0), 0) / 2;
    const G = params.officeGroup;
    const rG = G.reduce((a, c) => a + y(c), 0) / G.reduce((a, c) => a + E(c), 0);
    expect(G.reduce((a, c) => a + y(c), 0)).toBe(244);
    expect(G.reduce((a, c) => a + E(c), 0)).toBe(166179);
    const want: Record<string, number> = { HIA: 0.947, KND: 0.829, MIA: 0.963, TAM: 1.936, HOU: 1.14 };
    for (const m of params.officeMultipliers) {
      const r = y(m.code) / E(m.code) / rG;
      const shrunk = Math.min(2, Math.max(0.5, (k + y(m.code) * r) / (k + y(m.code))));
      expect(m.raw).toBeCloseTo(r, 12);
      expect(m.shrunk).toBeCloseTo(shrunk, 12);
      expect(m.shrunk).toBeCloseTo(want[m.code]!, 3);
    }
    expect(params.officeMultipliers.find((m) => m.code === 'HIA')!.raw).toBeCloseTo(0.055, 3);
  });

  it('FL-4 state offices and FY26 Q3 humanitarian pending 37,486 / 41,248 / 20,662 / 34,695 (04 §5.3)', () => {
    expect(offices.stateOffices.FL).toEqual(['HIA', 'KND', 'MIA', 'TAM']);
    const p3 = (c: string) => offices.quarterly.find((s) => s.officeCode === c && s.quarter.q === 3)!.pending;
    expect(['HIA', 'KND', 'MIA', 'TAM'].map(p3)).toEqual([37486, 41248, 20662, 34695]);
  });

  it('inquiry-date history reproduces the pinned remedy ETAs of 07 WP3 (receipt 2025-03-15)', () => {
    const day = (d: string) => Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10))) / 86400000;
    const iso = (n: number) => new Date(n * 86400000).toISOString().slice(0, 10);
    const eta = (code: string) => {
      const h = offices.inquiryDateHistory.find((x) => x.officeCode === code && x.subtype === '131A-FAM')!;
      const [f, l] = [h.points[0]!, h.points.at(-1)!];
      const rate = (day(l.inquiryDate) - day(f.inquiryDate)) / (day(l.publicationDate) - day(f.publicationDate));
      return iso(day(l.publicationDate) + Math.ceil((day('2025-03-15') - day(l.inquiryDate)) / rate));
    };
    expect(['MIA', 'HIA', 'KND', 'TAM'].map(eta)).toEqual(['2028-01-30', '2027-10-06', '2027-10-22', '2027-07-28']);
  });

  it('policy: hold regimes R1 2025-02-14 → 2025-06-09 and R3 2025-12-02 → 2026-06-12 (EST-12; key facts §3)', () => {
    const r = (id: string) => policy.regimes.find((x) => x.id === id)!;
    expect([r('R1').start, r('R1').end, r('R1').appliesTo, r('R1').lowConfidenceExempt]).toEqual(['2025-02-14', '2025-06-09', ['CHNV', 'FRP_CFRP', 'U4U'], ['CBP_ONE']]);
    expect([r('R3').start, r('R3').end, r('R3').appliesTo]).toEqual(['2025-12-02', '2026-06-12', ['ALL_CUBAN']]);
    expect(r('R1').altEnds?.ops?.at(-1)).toBe('2025-06-25');
    expect(r('R3').altEnds?.ops?.at(-1)).toBe('2026-07-16');
    expect(policy.regimes.filter((x) => x.hold).map((x) => x.id)).toEqual(['R1', 'R3']);
  });

  it('policy: scenarios of 04 §6.1 and the alert-rule table of 04 §6.3', () => {
    expect(policy.scenarios.map((s) => [s.id, s.prior, s.path])).toEqual([
      ['S0', 0.3, { kind: 'flat', level: 800 }],
      ['S1', 0.4, { kind: 'ramp', from: 800, to: 4600, months: 12 }],
      ['S2', 0.15, { kind: 'ramp', from: 800, to: 9200, months: 6 }],
      ['S3', 0.15, { kind: 'freezeThen', freezeMonths: 6, then: 'S1' }],
    ]);
    const rule = (id: string) => policy.alertRules.find((r) => r.ruleId === id)!;
    expect(rule('DORCAS_AFFIRMED').effects).toEqual([{ scenario: 'S3', factor: 1 / 3, condition: 'always' }]);
    expect(rule('DORCAS_REVERSED').effects.map((e) => [e.factor, e.condition])).toEqual([[3, 'redEagleNotProtecting'], [1.5, 'redEagleProtects']]);
    expect(rule('RED_EAGLE_DISSOLVED').effects).toEqual([{ scenario: 'S3', factor: 2, condition: 'dorcasPending' }]);
    expect(rule('AAUP_RELIEF_DENIAL_POLICY').approvalCardFlag).toBe('reestimate');
    expect(policy.litigationState).toEqual({ dorcas: 'vacatur_in_force_appeal_pending', redEagle: { piInForce: true }, asOf: '2026-10-20' });
  });

  it('copy rules: no "inconstitucional"/"unconstitutional", no tú register, Dorcas described as an APA vacatur', () => {
    const all = JSON.stringify(G0);
    expect(all).not.toMatch(/inconstitucional|unconstitutional/i);
    expect(all).not.toMatch(/\b(tú|tu caso|puedes)\b/i);
    expect(all).not.toMatch(/casos como el suyo|cases like yours/i);
    const dorcas = policy.litigation.find((l) => l.id === 'dorcas')!;
    expect(dorcas.status.es).toMatch(/APA/);
    expect(dorcas.status.en).toMatch(/Administrative Procedure Act/);
  });

  it('alerts are an empty list in G0 (07 §5)', () => {
    expect(G0['sample-handbuilt/alerts']).toEqual({ alerts: [] });
  });
});
