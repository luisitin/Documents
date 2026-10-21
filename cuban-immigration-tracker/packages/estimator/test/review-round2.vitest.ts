/**
 * Regression tests for the estimator review, round 2 (synthetic SAMPLE/TEST cases on the golden
 * fixture; no names, no receipt numbers). In the lognormal modes the bands collapse to [p12, p12]
 * (golden T28/T29, EST-13), so `headlineRange` must hide them and offer a non-degenerate q10–q90
 * time range with an as-of month instead ("every estimate shows a range and an as-of date").
 */
import { describe, expect, it } from 'vitest';
import type { EstimateOk } from '@caa/data-schemas';
import { estimate, headlineRange } from '@caa/estimator';
import { GOLDEN } from '@caa/estimator/golden';
import { goldenSnapshot, inputFor, ok, toCase, type GoldenCaseSpec } from './helpers';

const SNAP = goldenSnapshot();
const TODAY = GOLDEN.meta.today; // 2026-10-20

type MS = GoldenCaseSpec['milestones'];
const BASE: MS = [
  { key: 'biometrics', date: '2025-07-15', granularity: 'month' },
  { key: 'ead_c9', date: '2025-09-15', granularity: 'month' },
];
const spec = (extra: MS): GoldenCaseSpec => ({
  channel: 'CHNV', receipt: '2025-03-15', receiptGranularity: 'day', state: null, office: null, inClass: true,
  milestones: [...BASE, ...extra],
});
const est = (s: GoldenCaseSpec, opts?: { bands?: boolean }): EstimateOk =>
  ok(estimate(inputFor(toCase(s), SNAP, TODAY, opts ? { opts } : {})));

const expectRealTimeRange = (r: EstimateOk) => {
  const h = headlineRange(r);
  expect(h.months.loMonths).not.toBeNull();
  expect(h.months.loMonths!).toBeGreaterThanOrEqual(1);
  // hi null = "more than 72 months", still a range; otherwise it must be strictly wider than lo
  if (h.months.hiMonths !== null) expect(h.months.hiMonths).toBeGreaterThan(h.months.loMonths!);
  expect(h.asOf).toBe(r.dataThrough);
  expect(h.asOf).toMatch(/^\d{4}-\d{2}$/);
  return h;
};

describe('headlineRange: lognormal modes never show a zero-width band', () => {
  it('post_interview (interviewed 2026-09-20): bands hidden, q10–q90 range, low confidence', () => {
    const r = est(spec([{ key: 'interview', date: '2026-09-20', granularity: 'day' }]));
    expect(r.mode).toBe('post_interview');
    expect(r.policyBand12[0]).toBe(r.policyBand12[1]); // the collapsed band the UI used to print
    const h = expectRealTimeRange(r);
    expect(h.showPolicyBand).toBe(false);
    expect(h.showStructuralBand).toBe(false);
    expect(h.showDriversAndGroup).toBe(false);
    expect(h.timeRangeIsPrimary).toBe(true);
    expect(h.lowConfidence).toBe(true);
  });

  it('post_expedite (granted 2026-10-01): bands hidden, q10–q90 range, low confidence', () => {
    const r = est(spec([
      { key: 'expedite_request', date: '2026-09-15', granularity: 'day' },
      { key: 'expedite_outcome', date: '2026-10-01', granularity: 'day', meta: { outcome: 'granted' } },
    ]));
    expect(r.mode).toBe('post_expedite');
    const h = expectRealTimeRange(r);
    expect(h.showPolicyBand || h.showStructuralBand || h.showDriversAndGroup).toBe(false);
    expect(h.lowConfidence).toBe(true);
  });
});

describe('headlineRange: grid modes', () => {
  it('queue mode with real bands shows them and the drivers', () => {
    const r = est(spec([]));
    expect(r.mode).toBe('queue');
    const h = headlineRange(r);
    expect(h.showPolicyBand).toBe(r.policyBand12[1] - r.policyBand12[0] >= 0.01);
    expect(h.showStructuralBand).toBe(true);
    expect(h.showDriversAndGroup).toBe(true);
    expect(h.timeRangeIsPrimary).toBe(!h.showPolicyBand && !h.showStructuralBand);
    expect(h.asOf).toBe(r.dataThrough);
  });

  it('bands: false collapses the structural band, which is then hidden', () => {
    const r = est(spec([]), { bands: false });
    expect(r.structuralBand12[0]).toBe(r.structuralBand12[1]);
    const h = headlineRange(r);
    expect(h.showStructuralBand).toBe(false);
    if (h.timeRangeIsPrimary) expectRealTimeRange(r);
  });

  it('a band narrower than minWidth is treated as degenerate', () => {
    const r = est(spec([]));
    const fake: EstimateOk = { ...r, policyBand12: [0.5, 0.504], structuralBand12: [0.5, 0.5] };
    const h = headlineRange(fake);
    expect(h.showPolicyBand).toBe(false);
    expect(h.showStructuralBand).toBe(false);
    expect(h.timeRangeIsPrimary).toBe(true);
    expect(headlineRange(fake, 0.001).showPolicyBand).toBe(true);
  });
});
