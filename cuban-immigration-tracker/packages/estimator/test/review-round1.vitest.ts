/**
 * Regression tests for the estimator review, round 1 (synthetic SAMPLE/TEST cases on the golden
 * fixture; no names, no receipt numbers). None of these cases is in the golden file (EST-13): they
 * cover inputs the oracle does not exercise.
 * 1. Month-granularity milestones in the current month ("Solo sé el mes" = day 15, maybe > today).
 * 2. RFE/NOID after the interview (lognormal modes) and a pending RFE due after a scheduled interview.
 * 3. pByDate in the month of today (31 Dec in December was always 0).
 * 4. Office multipliers only for params.officeGroup.
 */
import { describe, expect, it } from 'vitest';
import type { EstimateOk } from '@caa/data-schemas';
import { estimate, pByDate } from '@caa/estimator';
import { GOLDEN } from '@caa/estimator/golden';
import { PROB_TOL, goldenSnapshot, inputFor, ok, toCase, type GoldenCaseSpec } from './helpers';

const SNAP = goldenSnapshot();
const TODAY = GOLDEN.meta.today; // 2026-10-20
const near = (got: number, want: number, tol = PROB_TOL) => expect(Math.abs(got - want), `got ${got}, want ${want}`).toBeLessThanOrEqual(tol);

type MS = GoldenCaseSpec['milestones'];
const BASE: MS = [
  { key: 'biometrics', date: '2025-07-15', granularity: 'month' },
  { key: 'ead_c9', date: '2025-09-15', granularity: 'month' },
];
const spec = (extra: MS, over: Partial<GoldenCaseSpec> = {}): GoldenCaseSpec => ({
  channel: 'CHNV', receipt: '2025-03-15', receiptGranularity: 'day', state: null, office: null, inClass: true,
  milestones: [...BASE, ...extra], ...over,
});
const est = (s: GoldenCaseSpec, today = TODAY, snap = SNAP): EstimateOk => ok(estimate(inputFor(toCase(s), snap, today)));

describe('1. month-granularity milestones in the current month are read as today', () => {
  const T = '2026-10-05';
  it('interview "this month" (stored 2026-10-15, entered 2026-10-05) → post_interview from today', () => {
    const month = est(spec([{ key: 'interview', date: '2026-10-15', granularity: 'month' }]), T);
    const day = est(spec([{ key: 'interview', date: T, granularity: 'day' }]), T);
    expect(month.mode).toBe('post_interview');
    expect(month.survival).toEqual(day.survival);
  });
  it('expedite granted "this month" → post_expedite', () => {
    const month = est(spec([
      { key: 'expedite_request', date: '2026-10-01', granularity: 'day' },
      { key: 'expedite_outcome', date: '2026-10-15', granularity: 'month', meta: { outcome: 'granted' } },
    ]), T);
    expect(month.mode).toBe('post_expedite');
    near(month.pWithin.m3, 1 - month.survival[3]!, 1e-12);
  });
  it('mandamus "this month" boosts like a mandamus filed today (no negative elapsed days)', () => {
    const month = est(spec([{ key: 'mandamus', date: '2026-10-15', granularity: 'month' }]), T);
    const day = est(spec([{ key: 'mandamus', date: T, granularity: 'day' }]), T);
    const none = est(spec([]), T);
    expect(month.survival).toEqual(day.survival);
    expect(month.pWithin.m3).toBeGreaterThan(none.pWithin.m3);
  });
  it('an RFE answered "in September" (09-15) after a notice of 09-20 counts as answered (month-level ordering)', () => {
    const r = est(spec([
      { key: 'rfe', date: '2026-09-20', granularity: 'day' },
      { key: 'rfe_response', date: '2026-09-15', granularity: 'month' },
    ]), T);
    expect(r.delays).toEqual({});
    expect(r.pWithin.m3).toBeGreaterThan(0);
  });
});

describe('2. RFE/NOID in the lognormal modes', () => {
  const T28 = spec([{ key: 'interview', date: '2026-09-20', granularity: 'day' }]);
  it('interview 2026-09-20 then RFE 2026-10-01 pending (due 2026-12-24): zero until due, clock from the due date', () => {
    const base = est(T28);
    const r = est(spec([
      { key: 'interview', date: '2026-09-20', granularity: 'day' },
      { key: 'rfe', date: '2026-10-01', granularity: 'day' },
    ]));
    expect(r.mode).toBe('post_interview');
    expect(r.delays.rfeZeroUntil).toBe('2026-12-24');
    expect(r.pWithin.m3).toBe(0); // 65 days → monthsCeil = 3
    expect(r.pWithin.m6).toBeGreaterThan(0);
    expect(r.pWithin.m12).toBeLessThan(base.pWithin.m12);
    expect(r.quantiles.q50!).toBeGreaterThan(base.quantiles.q50!);
  });
  it('NOID after the interview, overdue → nonResponseRisk and the clock restarts at the assumed response', () => {
    const base = est(spec([{ key: 'interview', date: '2026-09-10', granularity: 'day' }]));
    const r = est(spec([
      { key: 'interview', date: '2026-09-10', granularity: 'day' },
      { key: 'noid', date: '2026-09-12', granularity: 'day' }, // due 2026-10-15 (+33 d) < today
    ]));
    expect(r.delays).toEqual({ assumedResponseAt: '2026-10-15', nonResponseRisk: true });
    const restart = est(spec([{ key: 'interview', date: '2026-10-15', granularity: 'day' }]));
    expect(r.survival).toEqual(restart.survival);
    expect(r.pWithin.m3).not.toBe(base.pWithin.m3);
  });
  it('RFE answered after the interview restarts the clock at the response date', () => {
    const r = est(spec([
      { key: 'interview', date: '2026-09-20', granularity: 'day' },
      { key: 'rfe', date: '2026-09-25', granularity: 'day' },
      { key: 'rfe_response', date: '2026-10-10', granularity: 'day' },
    ]));
    const restart = est(spec([{ key: 'interview', date: '2026-10-10', granularity: 'day' }]));
    expect(r.survival).toEqual(restart.survival);
  });
  it('an RFE answered before the interview changes nothing (golden T28 behaviour)', () => {
    const r = est(spec([
      { key: 'rfe', date: '2026-06-01', granularity: 'day' },
      { key: 'rfe_response', date: '2026-07-01', granularity: 'day' },
      { key: 'interview', date: '2026-09-20', granularity: 'day' },
    ]));
    expect(r.survival).toEqual(est(T28).survival);
  });
  it('expedite granted with an RFE pending: zero window too', () => {
    const r = est(spec([
      { key: 'expedite_outcome', date: '2026-10-10', granularity: 'day', meta: { outcome: 'granted' } },
      { key: 'rfe', date: '2026-10-12', granularity: 'day' },
    ]));
    expect(r.mode).toBe('post_expedite');
    expect(r.delays.rfeZeroUntil).toBe('2027-01-04');
    expect(r.pWithin.m3).toBe(0);
  });
  it('interview scheduled 2026-12-15 (t_D = 2) with an RFE due 2027-01-20 (4 months): post-interview clock starts at 4', () => {
    const notice = { key: 'interview_notice', date: '2026-10-15', granularity: 'day', meta: { scheduledFor: '2026-12-15' } };
    const base = est(spec([notice]));
    const r = est(spec([notice, { key: 'rfe', date: '2026-10-16', granularity: 'day', meta: { dueDate: '2027-01-20' } }]));
    expect(r.mode).toBe('interview_scheduled');
    expect(r.delays.rfeZeroUntil).toBe('2027-01-20');
    expect(r.survival[3]).toBe(r.survival[2]);
    expect(r.survival[4]).toBe(r.survival[2]);
    expect(r.survival[5]!).toBeLessThan(r.survival[4]!);
    expect(base.survival[3]!).toBeLessThan(base.survival[2]!); // without the RFE the clock starts at t_D
  });
});

describe('3. pByDate in the month of today', () => {
  it('interpolates the first month by the days left', () => {
    const S = [1, 0.5, 0.4];
    near(pByDate(S, '2026-12-01', '2026-12-31'), (30 / 30.4375) * 0.5, 1e-12);
    expect(pByDate(S, '2026-12-31', '2026-12-31')).toBe(0);
    expect(pByDate(S, '2026-12-02', '2026-11-30')).toBe(0);
    near(pByDate(S, '2026-12-02', '2027-01-31'), 0.5, 1e-12); // t ≥ 1 unchanged (EST-9)
  });
  it('31 Dec is no longer 0 % for the whole of December (post_interview and queue)', () => {
    const pi = est(spec([{ key: 'interview', date: '2026-11-20', granularity: 'day' }]), '2026-12-02');
    expect(pi.byDate[0]!.date).toBe('2026-12-31');
    expect(pi.byDate[0]!.p).toBeGreaterThan(0.1);
    expect(pi.byDate[0]!.p).toBeLessThan(pi.byDate[1]!.p);
    const q = est(spec([]), '2026-12-02');
    expect(q.byDate[0]!.p).toBeGreaterThan(0);
  });
});

describe('4. office multipliers apply only to params.officeGroup', () => {
  const tam = SNAP.params.officeMultipliers.find((m) => m.code === 'TAM')!;
  const snap = {
    ...SNAP,
    params: { ...SNAP.params, officeMultipliers: [...SNAP.params.officeMultipliers, { ...tam, code: 'NYC', raw: 9.2, shrunk: 2, completions: 73 }] },
  };
  it('a non-group office (NYC, clamped at 2) falls back to m = 1 and dato débil', () => {
    expect(snap.params.officeGroup).not.toContain('NYC');
    const r = est(spec([], { office: 'NYC' }), TODAY, snap);
    const national = est(spec([]), TODAY, snap);
    expect(r.office.multiplier).toBe(1);
    expect(r.office.weak).toBe(true);
    expect(r.office.nCompletions).toBeUndefined();
    near(r.pWithin.m12, national.pWithin.m12, 1e-12);
  });
  it('a group office keeps its m̂_o (golden T16 TAM)', () => {
    const r = est(spec([], { office: 'TAM' }), TODAY, snap);
    expect(r.office.multiplier).toBe(tam.shrunk);
    near(r.pWithin.m12, 0.16559);
  });
});
