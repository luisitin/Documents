/**
 * Property tests (07 WP2 acceptance): S non-increasing; probabilities in [0, 1]; posterior weights
 * sum to 1 ± 1e-12; holds never increase adjudicable days; the same input gives byte-identical
 * output; and the estimator never reads a clock or mutates its input. A deterministic seeded sweep
 * (no Math.random) covers receipts 2023-01 → 2026-10, every channel, offices, states and milestones.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CaseTimeline, EntryChannel, EstimateOk, Milestone } from '@caa/data-schemas';
import { estimate, posteriorWeights, referenceCase, vintageLabel } from '@caa/estimator';
import { GOLDEN } from '@caa/estimator/golden';
import { G0, goldenSnapshot, inputFor, ok, testAdjudicable, toCase, type GoldenCaseSpec } from './helpers';

const TODAY = '2026-10-20';
const SNAP = goldenSnapshot();

/** mulberry32: a tiny deterministic PRNG for the sweep. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)]!;
const pad = (n: number) => String(n).padStart(2, '0');
const addDays = (d: string, n: number) => new Date(Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10)) + n)).toISOString().slice(0, 10);

function randomCase(r: () => number): CaseTimeline {
  const y = pick(r, [2023, 2024, 2025, 2026]);
  const m = y === 2026 ? 1 + Math.floor(r() * 9) : 1 + Math.floor(r() * 12);
  const receipt = `${y}-${pad(m)}-${pad(1 + Math.floor(r() * 28))}`;
  const c: CaseTimeline = { ...referenceCase(), entryChannel: pick(r, ['CHNV', 'CBP_ONE', 'VISA', 'UNKNOWN', 'FRP_CFRP', 'U4U', 'OTHER_PAROLE'] as EntryChannel[]), i485ReceiptDate: receipt, milestones: [] };
  const after = (lo: number, hi: number) => {
    const d = addDays(receipt, lo + Math.floor(r() * (hi - lo)));
    return d > TODAY ? TODAY : d;
  };
  const ms: Milestone[] = [];
  if (r() < 0.6) ms.push({ key: 'biometrics', date: r() < 0.2 ? null : after(20, 200), dateGranularity: 'day', dateSource: 'memory' });
  if (r() < 0.5) ms.push({ key: 'ead_c9', date: after(60, 400), dateGranularity: 'day', dateSource: 'notice' });
  const roll = r();
  if (roll < 0.1) ms.push({ key: 'rfe', date: addDays(TODAY, -Math.floor(r() * 200)), dateGranularity: 'day', dateSource: 'notice' });
  else if (roll < 0.15) ms.push({ key: 'noid', date: addDays(TODAY, -Math.floor(r() * 60)), dateGranularity: 'day', dateSource: 'notice' });
  else if (roll < 0.2) ms.push({ key: 'mandamus', date: addDays(TODAY, -Math.floor(r() * 200)), dateGranularity: 'day', dateSource: 'notice' });
  else if (roll < 0.25) ms.push({ key: 'interview_notice', date: addDays(TODAY, -10), dateGranularity: 'day', dateSource: 'notice', meta: { scheduledFor: addDays(TODAY, Math.floor(r() * 400) - 30) } });
  else if (roll < 0.28) ms.push({ key: 'interview', date: addDays(TODAY, -Math.floor(r() * 300)), dateGranularity: 'day', dateSource: 'notice' });
  c.milestones = ms.filter((x) => x.date === null || x.date >= receipt);
  const where = r();
  if (where < 0.3) c.officeCode = pick(r, ['HIA', 'KND', 'MIA', 'TAM', 'HOU', 'ZZZ']);
  else if (where < 0.5) c.state = pick(r, ['FL', 'TX', 'NJ']);
  return c;
}

function checkInvariants(r: EstimateOk, label: string) {
  const S = r.survival;
  expect(S.length, label).toBe(73);
  expect(S[0], label).toBe(1);
  for (let t = 1; t < S.length; t++) {
    expect(S[t]!, `${label} S non-increasing at ${t}`).toBeLessThanOrEqual(S[t - 1]! + 1e-15);
    expect(S[t]!, label).toBeGreaterThanOrEqual(0);
  }
  const probs = [...Object.values(r.pWithin), ...r.byDate.map((b) => b.p), ...r.policyBand12, ...r.structuralBand12, ...r.perScenario.map((p) => p.p12)];
  for (const p of probs) { expect(Number.isFinite(p), label).toBe(true); expect(p, label).toBeGreaterThanOrEqual(0); expect(p, label).toBeLessThanOrEqual(1); }
  expect(r.policyBand12[0]).toBeLessThanOrEqual(r.policyBand12[1]);
  expect(r.structuralBand12[0]).toBeLessThanOrEqual(r.structuralBand12[1]);
  const d = r.drivers;
  for (const v of [d.scenario, d.beta, d.office]) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1 + 1e-12); }
  expect(d.scenario + d.beta + d.office).toBeLessThanOrEqual(1 + 1e-9);
  if (r.perScenario.length) expect(Math.abs(r.perScenario.reduce((a, p) => a + p.posteriorWeight, 0) - 1), label).toBeLessThanOrEqual(1e-12);
  if (r.office.stateWeights) expect(Math.abs(Object.values(r.office.stateWeights).reduce((a, x) => a + x, 0) - 1), label).toBeLessThanOrEqual(1e-12);
  const q = r.quantiles;
  const qs = [q.q10, q.q25, q.q50, q.q75, q.q90];
  for (let i = 1; i < qs.length; i++) if (qs[i] !== null) { expect(qs[i - 1]).not.toBeNull(); expect(qs[i]!).toBeGreaterThanOrEqual(qs[i - 1]!); }
}

describe('invariants on every golden case', () => {
  for (const name of Object.keys(GOLDEN.cases)) {
    const spec = (GOLDEN.cases as unknown as Record<string, { case: GoldenCaseSpec; kind: string }>)[name]!;
    if (spec.kind !== 'estimate') continue;
    it(name, () => checkInvariants(ok(estimate(inputFor(toCase(spec.case), SNAP, TODAY))), name));
  }
});

describe('seeded sweep (300 synthetic cases)', () => {
  it('finite, monotone, in [0, 1]; posterior sums to 1', () => {
    const r = rng(20261020);
    let n = 0;
    for (let i = 0; i < 300; i++) {
      const c = randomCase(r);
      const res = estimate(inputFor(c, SNAP, TODAY));
      if (res.kind !== 'estimate') continue;
      checkInvariants(res, `${c.entryChannel} ${c.i485ReceiptDate} ${c.officeCode ?? c.state ?? '-'} ${c.milestones.map((m) => m.key).join(',')}`);
      n++;
    }
    expect(n).toBeGreaterThan(250);
  });
  it('posteriorWeights() sums to 1 ± 1e-12', () => {
    const r = ok(estimate(inputFor(referenceCase(), SNAP, TODAY)));
    const paths = r.perScenario.map((p) => ({ sid: p.id, betaMult: 1, officeMult: 1, extraMult: 1, prior: p.weight, S: [1, 0.99, 0.98, 0.9] }));
    expect(Math.abs(posteriorWeights(paths, 2).reduce((a, x) => a + x, 0) - 1)).toBeLessThanOrEqual(1e-12);
  });
});

describe('clock: holds never increase adjudicable days (EST-12)', () => {
  it('adjudicable ≤ calendar; later (altOps) ends never add days; dropping a regime never removes days', () => {
    const r = rng(7);
    const regimes = G0.policy.regimes;
    const channels: EntryChannel[] = ['CHNV', 'CBP_ONE', 'VISA', 'UNKNOWN', 'FRP_CFRP', 'U4U'];
    for (let i = 0; i < 500; i++) {
      const receipt = addDays('2024-06-01', Math.floor(r() * 860));
      const today = addDays(receipt, Math.floor(r() * 900));
      const ch = pick(r, channels);
      const cal = (Date.parse(today) - Date.parse(receipt)) / 86400000;
      const d = testAdjudicable(receipt, today, regimes, ch, 'default').days;
      const alt = testAdjudicable(receipt, today, regimes, ch, 'altOps').days;
      expect(d).toBeLessThanOrEqual(cal); expect(d).toBeGreaterThanOrEqual(0);
      expect(alt).toBeLessThanOrEqual(d);
      for (const drop of regimes) expect(testAdjudicable(receipt, today, regimes.filter((x) => x !== drop), ch, 'default').days).toBeGreaterThanOrEqual(d);
    }
  });
  it('the estimator echoes the clock and its probabilities do not depend on it', () => {
    const input = inputFor(referenceCase(), SNAP, TODAY);
    const a = ok(estimate(input));
    const b = ok(estimate({ ...input, clock: { ...input.clock, adjudicableDays: 1, holdsApplied: [] } }));
    expect(b.clock.adjudicableDays).toBe(1);
    expect(b.survival).toEqual(a.survival);
  });
});

describe('determinism and purity', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });
  const deepFreeze = <T>(x: T): T => {
    if (x && typeof x === 'object' && !Object.isFrozen(x)) { Object.freeze(x); for (const k of Object.keys(x)) deepFreeze((x as Record<string, unknown>)[k]); }
    return x;
  };
  it('the same input gives byte-identical output, and the input is never mutated', () => {
    const input = deepFreeze(inputFor(toCase((GOLDEN.cases as unknown as Record<string, { case: GoldenCaseSpec }>).T30_FL4!.case), goldenSnapshot(), TODAY));
    const a = JSON.stringify(estimate(input));
    const b = JSON.stringify(estimate(input));
    expect(b).toBe(a);
  });
  it('never reads a clock: Date.now / new Date / performance.now throw during estimate()', () => {
    const input = inputFor(referenceCase(), SNAP, TODAY);
    vi.spyOn(Date, 'now').mockImplementation(() => { throw new Error('Date.now called'); });
    const RealDate = Date;
    vi.stubGlobal('Date', new Proxy(RealDate, { construct() { throw new Error('new Date() called'); } }));
    vi.spyOn(performance, 'now').mockImplementation(() => { throw new Error('performance.now called'); });
    expect(() => estimate(input)).not.toThrow();
    vi.unstubAllGlobals();
  });
  it('today moves k₀ (EST-5): 2026-10-20 → k₀ = 2; 2026-11-01 → 3; vintage labels (EST-1)', () => {
    expect(ok(estimate(inputFor(referenceCase(), SNAP, '2026-11-01'))).k0).toBe(3);
    const mb = (a: string, b: string) => (Number(b.slice(0, 4)) - Number(a.slice(0, 4))) * 12 + Number(b.slice(5, 7)) - Number(a.slice(5, 7));
    expect(vintageLabel('2023-12', '2024-09', '2026-08', mb)).toBe('legacy>6mo');
    expect(vintageLabel('2024-05', '2024-09', '2026-08', mb)).toBe('legacy<6mo');
    expect(vintageLabel('2024-09', '2024-09', '2026-08', mb)).toBe('legacy<6mo');
    expect(vintageLabel('2024-10', '2024-09', '2026-08', mb)).toBe('2024-10');
    expect(vintageLabel('2025-03', '2024-09', '2026-08', mb)).toBe('2025-03');
    expect(vintageLabel('2026-10', '2024-09', '2026-08', mb)).toBe('f2');
  });
  it('decided cases return the decision, never numbers', () => {
    const c = { ...referenceCase(), milestones: [...referenceCase().milestones, { key: 'decision' as const, date: '2026-10-01', dateGranularity: 'day' as const, dateSource: 'notice' as const, meta: { outcome: 'approved' as const } }] };
    expect(estimate(inputFor(c, SNAP, TODAY))).toEqual({ kind: 'decided', outcome: 'approved', date: '2026-10-01' });
    for (const ch of ['EWI', 'CONDITIONAL_PAROLE_236'] as const) {
      const r = estimate(inputFor({ ...referenceCase(), entryChannel: ch }, SNAP, TODAY));
      expect(r.kind).toBe('no_estimate');
    }
  });
  it('an unknown office falls back to m = 1 with "dato débil"', () => {
    const r = ok(estimate(inputFor({ ...referenceCase(), officeCode: 'ZZZ' }, SNAP, TODAY)));
    expect(r.office).toEqual({ basis: 'office', code: 'ZZZ', multiplier: 1, weak: true });
    expect(r.survival).toEqual(ok(estimate(inputFor(referenceCase(), SNAP, TODAY))).survival);
  });
});
