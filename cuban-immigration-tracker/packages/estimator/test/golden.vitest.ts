/**
 * 04-estimation-model.md §9 against the oracle's golden file (EST-13): every row T1–T32 (incl.
 * T23b), U1, U6, U7. Probabilities ± 5e-4, quantiles exact, days exact (04 §9.1).
 */
import { describe, expect, it } from 'vitest';
import type { AlertsFile, EstimateOk, MonthlyRow, PolicyFile, ScenarioId } from '@caa/data-schemas';
import {
  calendarDates, completionsPath, computeGuards, conditionalLognormalSurvival, discreteCrps, drivers, estimate, fitBeta,
  fitObservationSigma, kaplanMeier, kmAt, kmConditional, littlesLawMonths, lognormalCdf, mixAndCondition, nonHoldLogDiffs,
  officeMultipliers, pathRatios, pByDate, predictiveCompletions, projectPath, quantile, reconstructPool, referenceCase,
  scenarioWeights, shrinkMultiplier, stateMixture, structuralBand, survivalFromRatios, type Path,
} from '@caa/estimator';
import { GOLDEN } from '@caa/estimator/golden';
import { BUNDLED, G0, PROB_TOL, goldenRows, goldenSnapshot, inputFor, ok, testAdjudicable, testFlags, toCase, type GoldenCaseSpec } from './helpers';

const TODAY = GOLDEN.meta.today;
const SNAP = goldenSnapshot();
const ROWS = goldenRows();
const BETA = GOLDEN.T14.beta;
const POOL = reconstructPool(ROWS, BETA).pool;
const K0 = 2;
const H = K0 + 72;
const DEFS = SNAP.policy.scenarios;
const def = (id: ScenarioId) => DEFS.find((d) => d.id === id)!;
const near = (got: number, want: number, tol = PROB_TOL) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThanOrEqual(tol);
type GCase = { case: GoldenCaseSpec; kind: string } & Record<string, unknown>;
const CASES = GOLDEN.cases as unknown as Record<string, GCase>;
const run = (name: string, over: Parameters<typeof inputFor>[3] = {}) => estimate(inputFor(toCase(CASES[name]!.case), SNAP, TODAY, over));

/** The national grid with arbitrary extras (for T15d's κ mixture and T30's averaged contrast). */
function grid(label: string, m: number, extras: [number, number][], weights: Record<ScenarioId, number>): Path[] {
  const out: Path[] = [];
  for (const d of DEFS) for (const bg of SNAP.params.grids.beta) {
    const r = pathRatios({ pool: POOL, vintage: label, beta: BETA * bg[0], completions: completionsPath(d, 0, DEFS), H, receipts: 1000 });
    for (const og of SNAP.params.grids.office) for (const x of extras) {
      out.push({ sid: d.id, betaMult: bg[0], officeMult: og[0], extraMult: x[0], prior: weights[d.id] * bg[1] * og[1] * x[1], S: survivalFromRatios(r, m * og[0] * x[0], K0) });
    }
  }
  return out;
}
const PRIORS = { S0: 0.3, S1: 0.4, S2: 0.15, S3: 0.15 } as Record<ScenarioId, number>;

describe('fixture integrity', () => {
  it('the golden rows are the G0 national rows (doc 04 §1.1 [F]) and the oracle core β', () => {
    expect(G0.national.rows.map((r) => [r.ym, r.received, r.approved, r.denied, r.pending, r.pendingOver6, r.avgMonths]))
      .toEqual(ROWS.map((r) => [r.ym, r.received, r.approved, r.denied, r.pending, r.pendingOver6, r.avgMonths]));
    near(G0.params.beta.value, BETA, 1e-12);
  });
});

describe('T1–T4 single paths', () => {
  it('T1 β = 0, flat 800, receipts 0: h₁ = 800/355,520; S(12) = 0.9730', () => {
    const S = projectPath({ pool: POOL, vintage: '2025-03', beta: 0, completions: () => 800, multiplier: 1, H: 12, kOrigin: 0, receipts: 0 });
    near(1 - S[1]!, GOLDEN.T1.h1, 1e-9);
    near(S[12]!, GOLDEN.T1.S12, 1e-9);
    GOLDEN.T1.S.forEach((v: number, k: number) => near(S[k]!, v, 1e-9));
  });
  it('T2 S3 path: h₁…h₆ = 0 exactly; S(6) = 1', () => {
    for (const b of [0, BETA, 1]) {
      const S = projectPath({ pool: POOL, vintage: '2025-03', beta: b, completions: completionsPath(def('S3'), 0, DEFS), multiplier: 1, H, kOrigin: K0, receipts: 1000 });
      for (let k = 1; k <= 6; k++) expect(S[k]).toBe(1);
      expect(S[7]!).toBeLessThan(1);
    }
  });
  it('T3 β = 1.0, S1: S_2025-03(24) = 0.99966 ≫ S_legacy>6mo(12) = 0.39291', () => {
    const s1 = completionsPath(def('S1'), 0, DEFS);
    const a = projectPath({ pool: POOL, vintage: '2025-03', beta: 1, completions: s1, multiplier: 1, H: 24, kOrigin: 0, receipts: 1000 });
    const b = projectPath({ pool: POOL, vintage: 'legacy>6mo', beta: 1, completions: s1, multiplier: 1, H: 12, kOrigin: 0, receipts: 1000 });
    near(a[24]!, GOLDEN.T3.S_2025_03_24, 1e-6);
    near(b[12]!, GOLDEN.T3.S_legacy_12, 1e-6);
  });
  it('T4 S1, β̂, k₀ = 2: S_c(12) = S(14)/S(2) = 0.89755; S(12)/S(2) = 0.92072', () => {
    const S = projectPath({ pool: POOL, vintage: '2025-03', beta: BETA, completions: completionsPath(def('S1'), 0, DEFS), multiplier: 1, H, kOrigin: K0, receipts: 1000 });
    near(S[14]! / S[2]!, GOLDEN.T4.Sc12, 1e-9);
    near(S[12]! / S[2]!, GOLDEN.T4.Sc10, 1e-9);
  });
});

describe('T5–T14 components', () => {
  it('T5 posterior after conditioning = (0.3006, 0.3998, 0.1487, 0.1509), sum 1 ± 1e-12', () => {
    const r = ok(run('T15'));
    for (const p of r.perScenario) near(p.posteriorWeight, (GOLDEN.T5.posterior as Record<string, number>)[p.id]!, 1e-4);
    expect(Math.abs(r.perScenario.reduce((a, p) => a + p.posteriorWeight, 0) - 1)).toBeLessThanOrEqual(1e-12);
    const m = mixAndCondition(grid('2025-03', 1, [[1, 1]], PRIORS), K0);
    expect(Math.abs(m.posterior.reduce((a, x) => a + x, 0) - 1)).toBeLessThanOrEqual(1e-12);
  });
  it('T6 office shrink (EST-11): HIA r 0.055 → 0.947; TAM → 1.936; clamp 5 → 2, 0.1 → 0.5', () => {
    const om = officeMultipliers(G0.offices.quarterly, G0.offices.offices.filter((o) => o.cubanFocus).map((o) => o.code), 50, [0.5, 2]);
    const by = (c: string) => om.find((m) => m.code === c)!;
    const g = GOLDEN.T6.multipliers as Record<string, { completions: number; avgPending: number; raw: number; shrunk: number }>;
    for (const code of Object.keys(g)) {
      expect(by(code).completions).toBe(g[code]!.completions);
      near(by(code).avgPending, g[code]!.avgPending, 1e-9);
      near(by(code).raw, g[code]!.raw, 1e-9);
      near(by(code).shrunk, g[code]!.shrunk, 1e-9);
    }
    near(by('HIA').raw, 0.055, 5e-4);
    near(by('HIA').shrunk, 0.947, 5e-4);
    near(by('TAM').shrunk, 1.936, 5e-4);
    expect(shrinkMultiplier(1e9, 5, 50, [0.5, 2])).toBe(2);
    expect(shrinkMultiplier(1e9, 0.1, 50, [0.5, 2])).toBe(0.5);
    // the G0 params (WP1) carry the same EST-11 values
    for (const m of G0.params.officeMultipliers) near(m.shrunk, by(m.code).shrunk, 1e-9);
  });
  it('§6.2 observation σ: 9 non-hold differences, SD 0.298 → σ = 0.30', () => {
    const d = nonHoldLogDiffs(ROWS, G0.policy.regimes);
    expect(d.length).toBe(GOLDEN.T6sigma.n);
    expect(fitObservationSigma(ROWS, G0.policy.regimes)).toBe(GOLDEN.T6sigma.sigma);
  });
  it('T7–T9 crowd utilities (v1.1): KM, conditional KM, discrete CRPS', () => {
    const km = kaplanMeier([[3, 1], [5, 1], [5, 0], [8, 1], [10, 0], [12, 1]].map((x) => ({ t: x[0]!, event: x[1] === 1 })));
    near(kmAt(km, 3), GOLDEN.T7.S3, 1e-12); near(kmAt(km, 5), GOLDEN.T7.S5, 1e-12);
    near(kmAt(km, 8), GOLDEN.T7.S8, 1e-12); near(kmAt(km, 12), GOLDEN.T7.S12, 1e-12);
    expect(km.map((s) => s.atRisk)).toEqual(GOLDEN.T7.riskSets);
    near(kmConditional(km, 8, 5), GOLDEN.T8.S8given5, 1e-12);
    expect(discreteCrps([0.25, 0.5, 0.75, 1], 2)).toBe(0.375);
    expect(discreteCrps([0, 0, 1, 1], 3)).toBe(0);
  });
  it('T10 lognormal median 3, σ 0.857', () => {
    const t = GOLDEN.T10;
    near(lognormalCdf(1, 3, 0.857), t.F1, 1e-6); near(lognormalCdf(3, 3, 0.857), t.F3, 1e-6);
    near(lognormalCdf(6, 3, 0.857), t.F6, 1e-6); near(lognormalCdf(9, 3, 0.857), t.F9, 1e-6);
    near(1 - conditionalLognormalSurvival(3, 3, 0.857, 72)[3]!, t.cond3given3, 1e-6);
    expect(lognormalCdf(0, 3, 0.857)).toBe(0);
  });
  it('T11/T19/T21/T22 clocks (EST-12 cross-check for WP3; the estimator echoes input.clock)', () => {
    const R = G0.policy.regimes;
    expect(testAdjudicable('2025-03-15', TODAY, R, 'CHNV', 'default').days).toBe(GOLDEN.T11.adjudicable);
    expect(testAdjudicable('2025-03-15', TODAY, R, 'CHNV', 'altOps').days).toBe(GOLDEN.T11.altOps);
    expect(testAdjudicable('2025-03-15', TODAY, R, 'VISA', 'default').days).toBe(GOLDEN.T19.adjudicable);
    expect(testAdjudicable('2025-03-15', TODAY, R, 'CBP_ONE', 'default').days).toBe(GOLDEN.T21.adjudicable);
    expect(testAdjudicable('2025-02-05', TODAY, R, 'CBP_ONE', 'default').days).toBe(GOLDEN.T22.adjudicable);
    const input = inputFor(referenceCase(), SNAP, TODAY);
    const r = ok(estimate(input));
    expect(r.clock).toBe(input.clock);
    expect(r.clock.calendarDays).toBe(GOLDEN.T11.calendar);
    expect(r.clock.adjudicableDays).toBe(306);
    expect(r.clock.calendarDays - r.clock.adjudicableDays).toBe(278);
  });
  it('T12 Little’s law (Method screen only)', () => {
    const P = ROWS[ROWS.length - 1]!.pending;
    near(littlesLawMonths(P, 820)!, GOLDEN.T12.c820, 1e-9);
    near(littlesLawMonths(P, 4600)!, GOLDEN.T12.c4600, 1e-9);
    near(littlesLawMonths(P, 78291 / 12)!, GOLDEN.T12.c6524_25, 1e-9);
    near(littlesLawMonths(P, 9200)!, GOLDEN.T12.c9200, 1e-9);
    near(littlesLawMonths(P, 16876)!, GOLDEN.T12.c16876, 1e-9);
    expect(littlesLawMonths(P, 0)).toBeNull();
  });
  it('T13 pool invariants', () => {
    const rp = reconstructPool(ROWS, BETA);
    const t = GOLDEN.T13;
    expect(rp.pool.length).toBe(t.count);
    near(rp.pool.reduce((a, v) => a + v.n, 0), t.sum, 1e-6);
    expect(Math.min(...rp.pool.map((v) => v.n))).toBeGreaterThanOrEqual(0);
    near(Math.min(...rp.pool.map((v) => v.n)), t.min, 1e-6);
    for (const s of rp.scales) { expect(s).toBeGreaterThanOrEqual(0.99); expect(s).toBeLessThanOrEqual(1.01); }
    t.pool.forEach((v: { label: string; age: number; n: number }, i: number) => {
      expect(rp.pool[i]!.label).toBe(v.label); expect(rp.pool[i]!.age).toBe(v.age); near(rp.pool[i]!.n, v.n, 1e-6);
    });
    const mar = rp.pool.find((v) => v.label === '2025-03')!;
    near(mar.n, t.mar2025, 1e-6);
    expect(mar.age).toBe(17.5);
    near(rp.pool.filter((v) => v.age > mar.age).reduce((a, v) => a + v.n, 0), t.older, 1e-6);
  });
  it('T14 β fit: 0.037391 ± 1e-5; SSE(β̂) < SSE(0), SSE(0.08)', () => {
    const b = fitBeta(ROWS);
    near(b.value, GOLDEN.T14.beta, 1e-8); // 04 T14 tolerance is 1e-5; float summation order differs from Python
    expect(b.targets).toEqual(GOLDEN.T14.targets);
    expect(b.fallbackUsed).toBe(false);
    near(b.sse, GOLDEN.T14.sse, 1e-8);
    const sse = (x: number) => reconstructPool(ROWS, x, b.targets).sse!;
    near(sse(0), GOLDEN.T14.sse0, 1e-9); near(sse(0.08), GOLDEN.T14.sse008, 1e-9);
    expect(b.sse).toBeLessThan(sse(0)); expect(b.sse).toBeLessThan(sse(0.08));
    const few = fitBeta(ROWS.map((r, i) => (i < 22 ? { ...r, approved: 100, denied: 0 } : r))); // only Jul/Aug 2026 reach C ≥ 300
    expect(few.fallbackUsed).toBe(true);
    expect(few.value).toBe(0.037);
    expect(few.targets).toEqual(['2026-07', '2026-08']);
  });
});

/** Compare an estimate with a golden case entry. */
function expectCase(name: string, r: EstimateOk) {
  const g = CASES[name] as unknown as {
    mode: string; survival: number[]; pWithin: Record<string, number>; quantiles: Record<string, number | null>;
    byDate: { date: string; p: number }[]; perScenario: { id: string; weight: number; posteriorWeight: number; p12: number; q50: number | null }[];
    policyBand12: number[]; structuralBand12: number[]; drivers: Record<string, number>; delays: Record<string, unknown>;
    office: { basis: string; stateWeights?: Record<string, number> };
  };
  expect(r.mode).toBe(g.mode);
  expect(r.survival.length).toBe(73);
  g.survival.forEach((v, t) => near(r.survival[t]!, v));
  for (const k of ['m3', 'm6', 'm12', 'm24', 'm36'] as const) near(r.pWithin[k], g.pWithin[k]!);
  near(1 - r.survival[18]!, g.pWithin.m18!); near(1 - r.survival[60]!, g.pWithin.m60!);
  expect(r.quantiles).toEqual(g.quantiles);
  for (const b of g.byDate) near(pByDate(r.survival, TODAY, b.date), b.p);
  expect(r.byDate.map((b) => b.date)).toEqual(calendarDates(TODAY));
  r.byDate.forEach((b) => near(b.p, g.byDate.find((x) => x.date === b.date)!.p));
  expect(r.perScenario.length).toBe(g.perScenario.length);
  r.perScenario.forEach((p, i) => {
    const q = g.perScenario[i]!;
    expect(p.id).toBe(q.id); near(p.weight, q.weight, 1e-9); near(p.posteriorWeight, q.posteriorWeight); near(p.p12, q.p12); expect(p.q50).toBe(q.q50);
  });
  near(r.policyBand12[0], g.policyBand12[0]!); near(r.policyBand12[1], g.policyBand12[1]!);
  near(r.structuralBand12[0], g.structuralBand12[0]!); near(r.structuralBand12[1], g.structuralBand12[1]!);
  for (const k of ['scenario', 'beta', 'office'] as const) near(r.drivers[k], g.drivers[k]!);
  expect(r.delays).toEqual(g.delays);
  expect(r.office.basis).toBe(g.office.basis);
  if (g.office.stateWeights) for (const c of Object.keys(g.office.stateWeights)) near(r.office.stateWeights![c]!, g.office.stateWeights[c]!, 1e-4);
}

describe('T15 reference case (the exact 04 §9.2 fixture = "Ver un ejemplo")', () => {
  it('referenceCase() is the golden T15 spec', () => {
    const c = referenceCase();
    const s = CASES.T15!.case;
    expect(c.entryChannel).toBe(s.channel);
    expect(c.i485ReceiptDate).toBe(s.receipt);
    expect(c.state).toBeUndefined(); expect(c.officeCode).toBeUndefined();
    expect(c.concurrentI765).toBe(true);
    expect(c.milestones.map((m) => [m.key, m.date, m.dateGranularity])).toEqual(s.milestones.map((m) => [m.key, m.date, m.granularity]));
  });
  it('T15 P3 .01484 P6 .03665 P12 .09229 P24 .22050 P36 .35453; q 13/27/54/null/null; byDate', () => {
    const r = ok(estimate(inputFor(referenceCase(), SNAP, TODAY)));
    expectCase('T15', r);
    near(r.pWithin.m12, 0.09229); expect(r.quantiles).toEqual({ q10: 13, q25: 27, q50: 54, q75: null, q90: null });
    near(r.byDate[0]!.p, 0.00906);
  });
  it('T15b per scenario, policy band [0.02325, 0.25970]; T15c drivers 0.941/0.028/0.009; T15d band [0.04352, 0.19801]', () => {
    const r = ok(estimate(inputFor(referenceCase(), SNAP, TODAY)));
    near(r.policyBand12[0], 0.02325); near(r.policyBand12[1], 0.2597);
    near(r.drivers.scenario, 0.94135); near(r.drivers.office, 0.02796); near(r.drivers.beta, 0.0092);
    near(r.structuralBand12[0], 0.04352); near(r.structuralBand12[1], 0.19801);
    expect(r.queue).toMatchObject({ pendingTotal: 355520, completionsLastMonth: 820 });
    near(r.queue.olderThanYou, GOLDEN.T13.older, 1e-6); near(r.queue.sameMonthAsYou, GOLDEN.T13.mar2025, 1e-6);
    expect(r.office).toEqual({ basis: 'national' });
    expect(r.yardstick).toMatchObject({ form: 'I-485', subtype: '131A-FAM', months80: null, inquiryDate: null, isProxy: true });
    expect(r.confidence).toBe('LOW'); expect(r.validated).toBe(false);
    expect(r.k0).toBe(2); expect(r.dataThrough).toBe('2026-08'); expect(r.modelVersion).toBe('VPH-1.1');
  });
  it('T15d κ mixture (diagnostic): P12 10.06 %, q50 53; structuralBand() helper', () => {
    const m = mixAndCondition(grid('2025-03', 1, [[0.5, 0.25], [1, 0.5], [2, 0.25]], PRIORS), K0);
    near(1 - m.S[12]!, GOLDEN.T15d.kappaMixture.p12); expect(quantile(m.S, 0.5)).toBe(GOLDEN.T15d.kappaMixture.q50);
    const p12 = (x: number) => 1 - mixAndCondition(grid('2025-03', 1, [[x, 1]], PRIORS), K0).S[12]!;
    const band = structuralBand(p12, true);
    near(band[0], 0.04352); near(band[1], 0.19801);
    const noEad = structuralBand(p12, false);
    near(noEad[0], 0.04815); near(noEad[1], 0.17021);
  });
  it('T15c via drivers() on raw paths', () => {
    const paths = grid('2025-03', 1, [[1, 1]], PRIORS);
    const d = drivers(paths, mixAndCondition(paths, K0).posterior, K0, 12);
    near(d.scenario, 0.94135); near(d.office, 0.02796); near(d.beta, 0.0092);
  });
});

describe('T16–T30 case variants', () => {
  it('T16 offices: TAM .16559 (36) > HOU .10399 (50) > unknown .09229 (54) > MIA .08915 (55) > HIA .08779 (55) > KND .07761 (59)', () => {
    const order = ['T16_TAM', 'T16_HOU', 'T15', 'T16_MIA', 'T16_HIA', 'T16_KND'].map((n) => ok(run(n)));
    ['T16_TAM', 'T16_HOU', 'T15', 'T16_MIA', 'T16_HIA', 'T16_KND'].forEach((n, i) => expectCase(n, order[i]!));
    for (let i = 1; i < order.length; i++) expect(order[i - 1]!.pWithin.m12).toBeGreaterThan(order[i]!.pWithin.m12);
    const hia = ok(run('T16_HIA'));
    expect(hia.office).toMatchObject({ basis: 'office', code: 'HIA', state: 'FL', nCompletions: 3, weak: true });
    near(hia.office.multiplier!, 0.947, 1e-12);
    expect(hia.yardstick).toMatchObject({ officeCode: 'HIA', inquiryDate: '2024-07-05', publicationDate: '2026-10-15', isProxy: true });
  });
  it('T17 vintage 2025-10: P12 .07152 < .09229, q50 62', () => { expectCase('T17', ok(run('T17'))); });
  it("T18' RFE 2026-10-01, no response, due 2026-12-24: P3 0, P6 .03347, P12 .08942, q50 54; P(≤36) > 0", () => {
    const r = ok(run('T18p'));
    expectCase('T18p', r);
    expect(r.pWithin.m3).toBe(0);
    expect(r.delays.rfeZeroUntil).toBe('2026-12-24');
    expect(r.pWithin.m36).toBeGreaterThan(0);
  });
  it('T18b RFE answered 2026-10-10; T18c mandamus 2026-10-01; T18d due date passed', () => {
    expectCase('T18b', ok(run('T18b')));
    expectCase('T18c', ok(run('T18c')));
    const d = ok(run('T18d'));
    expectCase('T18d', d);
    expect(d.delays).toEqual({ assumedResponseAt: '2026-08-24', nonResponseRisk: true });
    expect(Number.isFinite(d.pWithin.m12)).toBe(true);
  });
  it('T20 guards: T20a trips on 2026-11-15 (not 11-14); T20b Oct vs Jun trips, Aug vs Jun passes', () => {
    const base = { dataThrough: '2026-08', quarterly: SNAP.quarterly, status: 'published' as const, manifest: SNAP.manifest };
    const at = (today: string) => computeGuards({ ...base, today, manifest: { ...SNAP.manifest, lastCheckedAt: `${today}T00:00:00Z` } }).map((g) => g.id);
    expect(at('2026-11-14')).not.toContain('T20a');
    expect(at(GOLDEN.T20.tripDate)).toContain('T20a');
    expect(computeGuards({ ...base, today: TODAY }).map((g) => g.id)).toEqual([]);
    const oct = computeGuards({ ...base, today: '2026-12-01', dataThrough: '2026-10', manifest: { ...SNAP.manifest, latestOfficialMonth: '2026-10', lastCheckedAt: '2026-12-01T00:00:00Z' } });
    expect(oct.find((g) => g.id === 'T20b')?.months).toEqual(GOLDEN.T20.t20bTrip.months);
    // the estimate is still computed, and T20a forces LOW
    const late = ok(estimate(inputFor(referenceCase(), SNAP, GOLDEN.T20.tripDate)));
    expect(late.guards.map((g) => g.id)).toContain('T20a');
    expect(late.confidence).toBe('LOW');
    const extra = computeGuards({ ...base, today: TODAY, status: 'sample', manifest: { ...SNAP.manifest, lastCheckedAt: '2026-10-01T00:00:00Z', artifactBuiltAt: '2026-09-01T00:00:00Z', qa: { ...SNAP.manifest.qa, status: 'degraded' } } });
    expect(extra.map((g) => g.id)).toEqual(['pipeline_late', 'artifact_old', 'qa_degraded', 'sample_data']);
  });
  it('T23 peer without EAD keeps biometrics → identical P/q to T15; T23b (no EAD, no biometrics) P12 .06619, q50 64', () => {
    const t23 = ok(run('T23'));
    expectCase('T23', t23);
    const t15 = ok(run('T15'));
    expect(t23.survival).toEqual(t15.survival);
    expect(t23.quantiles).toEqual(t15.quantiles);
    near(t23.structuralBand12[0], 0.04815); near(t23.structuralBand12[1], 0.17021);
    expectCase('T23b', ok(run('T23b')));
  });
  it('T24 CBP One twin: identical P/q to T15', () => {
    const r = ok(run('T24'));
    expectCase('T24', r);
    expect(r.survival).toEqual(ok(run('T15')).survival);
  });
  it('T25 filed 2026-09-01: with DORCAS_REVERSED the S3 weight gets ×3 (×1.5 for T15)', () => {
    const t25 = GOLDEN.T25;
    const alerts = { alerts: [alertOf(t25.alert)] } as AlertsFile;
    const member = scenarioWeights(SNAP.policy, alerts, [], testFlags(referenceCase()), SNAP.params.observation, TODAY);
    const late = { ...referenceCase(), i485ReceiptDate: '2026-09-01', milestones: [] };
    const flags = testFlags(late);
    expect(flags.redEagleAppearsInClass).toBe(false);
    const non = scenarioWeights(SNAP.policy, alerts, [], flags, SNAP.params.observation, TODAY);
    for (const k of ['S0', 'S1', 'S2', 'S3'] as const) {
      near(member.weights[k], (t25.memberWeights as Record<string, number>)[k]!, 1e-12);
      near(non.weights[k], (t25.nonMemberWeights as Record<string, number>)[k]!, 1e-12);
    }
    const factor = (w: Record<string, number>) => (w.S3! / (1 - w.S3!)) / (0.15 / 0.85);
    near(factor(member.weights), 1.5, 1e-12); near(factor(non.weights), 3, 1e-12);
    // the filed-after-dataThrough case (forecast vintage f1) still estimates
    const r = ok(estimate(inputFor(late, SNAP, TODAY, { flags, alerts })));
    expect(r.perScenario.find((p) => p.id === 'S3')!.weight).toBeCloseTo(non.weights.S3, 12);
    expect(r.queue.sameMonthAsYou).toBe(0);
    expect(r.queue.olderThanYou).toBeCloseTo(355520, 6);
  });
  it('T26 I-220A → no_estimate "i220a", no numbers', () => {
    const r = run('T26_I220A');
    expect(r.kind).toBe('no_estimate');
    if (r.kind === 'no_estimate') expect(r.reason).toBe('i220a');
    expect(JSON.stringify(r)).not.toMatch(/pWithin|survival|quantiles/);
  });
  it('T27 interview scheduled 2026-12-15 (t_D = 2): P3 .10809 P6 .63479 P12 .92070, q50 5', () => { expectCase('T27', ok(run('T27'))); });
  it('T28 interview done 2026-09-20 (s = 0.98563): P3 .59010 P6 .82060 P12 .95165', () => {
    const r = ok(run('T28'));
    expectCase('T28', r);
    expect(r.perScenario).toEqual([]);
  });
  it('T29 expedite granted 2026-10-10 (s = 0.32854, median 2): P3 .71895 P6 .90895 P12 .98279', () => { expectCase('T29', ok(run('T29'))); });
  it('T30 FL-4 state mixture: π .2799/.3082/.1543/.2576, P12 10.49 %, q50 51; averaging multipliers gives 10.64 %', () => {
    const r = ok(run('T30_FL4'));
    expectCase('T30_FL4', r);
    expect(r.office.basis).toBe('state_mixture');
    expect(r.office.state).toBe('FL');
    const w = r.office.stateWeights!;
    expect(Math.abs(Object.values(w).reduce((a, x) => a + x, 0) - 1)).toBeLessThanOrEqual(1e-12);
    const avg = mixAndCondition(grid('2025-03', GOLDEN.T30.averagedMultiplier, [[1, 1]], PRIORS), K0);
    near(1 - avg.S[12]!, GOLDEN.T30.averagedP12);
    expect(Math.abs(1 - avg.S[12]! - r.pWithin.m12)).toBeGreaterThan(1e-3);
    // stateMixture() contract helper gives the same curve and weights
    const fm = GOLDEN.inputs.fixtureMultipliers as Record<string, number>;
    const per = ['TAM', 'HIA', 'KND', 'MIA'].map((code) => ({ code, pending: SNAP.offices.quarterly.find((q) => q.officeCode === code && q.quarter.q === 3)!.pending!, paths: grid('2025-03', fm[code]!, [[1, 1]], PRIORS) }));
    const sm = stateMixture(per, K0);
    sm.S.forEach((v, t) => near(v, r.survival[t]!, 1e-12));
    for (const c of Object.keys(w)) near(sm.weights[c]!, w[c]!, 1e-12);
    // without bands the state mixture is not computed (07 WP2 step 6) → national
    expect(ok(run('T30_FL4', { opts: { bands: false } })).office).toEqual({ basis: 'national', state: 'FL' });
  });
});

/** Golden alert spec → a schema-shaped Alert (synthetic, labelled test data). */
function alertOf(a: { id: string; date: string; status: string; ruleIds?: string[]; supersedes?: string[]; expires?: string }): AlertsFile['alerts'][number] {
  return {
    id: a.id, date: a.date, kind: 'court', severity: 'info', title: { es: 'Alerta de prueba', en: 'Test alert' }, body: { es: 'Datos de prueba.', en: 'Test data.' },
    affects: {}, ...(a.ruleIds ? { ruleIds: a.ruleIds } : {}), ...(a.supersedes ? { supersedes: a.supersedes } : {}), ...(a.expires ? { expires: a.expires } : {}),
    sources: [{ label: 'test', url: 'https://example.org/test', evidence: 'I' }], reviewedBy: 'test', status: a.status as 'published' | 'retracted',
  };
}
const alertsOf = (xs: Parameters<typeof alertOf>[0][]): AlertsFile => ({ alerts: xs.map(alertOf) });
const withLit = (dorcas: PolicyFile['litigationState']['dorcas'], pi: boolean): PolicyFile => ({ ...SNAP.policy, litigationState: { ...SNAP.policy.litigationState, dorcas, redEagle: { piInForce: pi } } });

describe('T31–T32 scenario weights', () => {
  it('T31 likelihood update after the Sep 2026 CSV (σ_eff 0.424, sub-mass floor) ± 1e-4', () => {
    const t31 = GOLDEN.T31 as Record<string, Record<string, unknown>>;
    for (const key of Object.keys(t31)) {
      const C = Number(key.slice(1));
      const row: MonthlyRow = { ...ROWS[ROWS.length - 1]!, ym: '2026-09', approved: C, denied: 0 };
      const r = scenarioWeights(SNAP.policy, { alerts: [] }, [...ROWS, row], null, SNAP.params.observation, TODAY);
      for (const s of ['S0', 'S1', 'S2', 'S3'] as const) near(r.weights[s], t31[key]![s] as number, 1e-9);
      expect(r.trace.length).toBe(1);
      expect(r.trace[0]).toMatchObject({ reason: 'likelihood', observedMonth: '2026-09', observedCompletions: C });
      expect(Math.abs(Object.values(r.weights).reduce((a, x) => a + x, 0) - 1)).toBeLessThanOrEqual(1e-12);
    }
  });
  it('today: no active rule and no observed month → weights = priors, empty trace', () => {
    const r = scenarioWeights(SNAP.policy, SNAP.alerts, SNAP.national.rows, testFlags(referenceCase()), SNAP.params.observation, TODAY);
    expect(r.weights).toEqual({ S0: 0.3, S1: 0.4, S2: 0.15, S3: 0.15 });
    expect(r.trace).toEqual([]);
  });
  it('T32 DORCAS_REVERSED + RED_EAGLE_DISSOLVED, dorcasPending false, class member → S3 × 3 (not × 6)', () => {
    const t = GOLDEN.T32;
    const flags = testFlags(referenceCase());
    const r = scenarioWeights(withLit('reversed', false), alertsOf(t.alerts), [], flags, SNAP.params.observation, t.today);
    for (const s of ['S0', 'S1', 'S2', 'S3'] as const) near(r.weights[s], (t.weights as Record<string, number>)[s]!, 1e-12);
    near((r.weights.S3 / (1 - r.weights.S3)) / (0.15 / 0.85), 3, 1e-12);
    expect(r.trace.map((x) => x.alertId)).toEqual(t.traceOrder);
    // the same when the curated litigation state lags behind the alerts (effective-state rule)
    const lag = scenarioWeights(withLit('vacatur_in_force_appeal_pending', true), alertsOf(t.alerts), [], testFlags({ ...referenceCase(), i485ReceiptDate: '2026-09-01', milestones: [] }), SNAP.params.observation, t.today);
    near(lag.weights.S3, (t.laggingStateNonMember.weights as Record<string, number>).S3!, 1e-12);
  });
  it('T32 retracted, superseded or expired alerts have no effect; the trace follows (date, id)', () => {
    const t = GOLDEN.T32;
    const flags = testFlags({ ...referenceCase(), i485ReceiptDate: '2026-09-01', milestones: [] });
    for (const k of ['retracted', 'superseded', 'expired'] as const) {
      const r = scenarioWeights(SNAP.policy, alertsOf(t[k].alerts), [], flags, SNAP.params.observation, t.today);
      expect(r.weights).toEqual(t[k].weights);
      expect(r.trace).toEqual([]);
    }
    const o = scenarioWeights(SNAP.policy, alertsOf(t.order.alerts), [], null, SNAP.params.observation, t.today);
    expect(o.trace.map((x) => x.alertId)).toEqual(t.order.traceOrder);
    for (const s of ['S0', 'S1', 'S2', 'S3'] as const) near(o.weights[s], (t.order.weights as Record<string, number>)[s]!, 1e-12);
    expect(o.trace.map((x) => x.ruleId)).toEqual(['DORCAS_AFFIRMED', 'NEW_HOLD_MEMO_CUBA']);
  });
});

describe('v1.1 ledger, U1, U6, U7', () => {
  it('predictiveCompletions: next 6 months, one lognormal per scenario', () => {
    const p = predictiveCompletions(SNAP.params, SNAP.policy, 6);
    expect(p.map((x) => x.ym)).toEqual(GOLDEN.ledger.map((x: { ym: string }) => x.ym));
    p.forEach((m, j) => m.components.forEach((c, i) => {
      const g = GOLDEN.ledger[j]!.components[i]!;
      expect(c.sid).toBe(g.sid); near(c.weight, g.weight, 1e-12); near(c.mu, g.mu, 1e-12); expect(c.sigma).toBe(g.sigma);
    }));
  });
  it('U1 language invariance: no Localized text changes the output (byte-identical)', () => {
    const swap = (x: unknown): unknown => {
      if (Array.isArray(x)) return x.map(swap);
      if (x && typeof x === 'object') {
        const o = x as Record<string, unknown>;
        if (typeof o.es === 'string' && typeof o.en === 'string' && Object.keys(o).length === 2) return { es: `${o.en} (EN)`, en: `${o.es} (ES)` };
        const out: Record<string, unknown> = {};
        for (const k of Object.keys(o)) out[k] = swap(o[k]);
        return out;
      }
      return x;
    };
    const a = JSON.stringify(estimate(inputFor(referenceCase(), SNAP, TODAY)));
    const b = JSON.stringify(estimate(inputFor(referenceCase(), { ...SNAP, policy: swap(SNAP.policy) as PolicyFile, manifest: swap(SNAP.manifest) as typeof SNAP.manifest }, TODAY)));
    expect(b).toBe(a);
  });
  it(`U6 offline: the bundled sample reproduces T15 (${BUNDLED.source})`, () => {
    const snap = BUNDLED.snapshot;
    const r = ok(estimate(inputFor(referenceCase(), snap, TODAY, { data: { status: 'sample', manifest: snap.manifest } })));
    expectCase('T15', r);
    expect(r.guards.map((g) => g.id)).toContain('sample_data');
    expect(r.confidence).toBe('LOW');
    near(snap.manifest.canary.pWithin12, r.pWithin.m12, 5e-6);
    expect(snap.manifest.canary.q50).toBe(r.quantiles.q50);
  });
  it('U7 channel/EAD invariance: CHNV, CBP One, VISA, UNKNOWN, ± EAD, ± biometrics with an EAD → same point estimate', () => {
    const base = ok(run('T15'));
    const variants = [
      { ...referenceCase(), entryChannel: 'CBP_ONE' as const }, { ...referenceCase(), entryChannel: 'VISA' as const },
      { ...referenceCase(), entryChannel: 'UNKNOWN' as const }, { ...referenceCase(), milestones: referenceCase().milestones.filter((m) => m.key !== 'ead_c9') },
      { ...referenceCase(), milestones: referenceCase().milestones.filter((m) => m.key !== 'biometrics') },
    ];
    for (const v of variants) {
      const r = ok(estimate(inputFor(v, SNAP, TODAY)));
      expect(r.survival).toEqual(base.survival);
      expect(r.pWithin).toEqual(base.pWithin);
      expect(r.quantiles).toEqual(base.quantiles);
    }
    // only the clock and the structural band differ
    expect(ok(estimate(inputFor(variants[1]!, SNAP, TODAY))).clock.adjudicableDays).toBe(392);
    expect(ok(estimate(inputFor(variants[3]!, SNAP, TODAY))).structuralBand12).not.toEqual(base.structuralBand12);
  });
});
