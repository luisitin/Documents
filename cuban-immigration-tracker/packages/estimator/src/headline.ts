/**
 * Which range the headline must show (fixed rule: "every estimate shows a range and an as-of date").
 *
 * In the lognormal modes (post_interview / post_expedite) the estimator returns
 * policyBand12 = structuralBand12 = [p12, p12], drivers all 0 and perScenario [] (golden T28/T29
 * pin that, TODO(EST-13) in estimate.ts). With `opts.bands === false` the structural band also
 * collapses. A collapsed band rendered as "entre 62 % y 62 %" is not a range, and crediting it to
 * policy scenarios / case mix is wrong in modes that model neither. This pure helper tells the UI
 * what to render instead: the q10–q90 time range in months (`null` hi = "more than 72 months"),
 * flagged low-confidence in the lognormal modes, plus the as-of month (`dataThrough`).
 * It reads only the result, so it changes no estimator number and no golden value.
 */
import type { EstimateOk, YearMonth } from '@caa/data-schemas';

/** Default minimum width for a band to count as a range: 1 percentage point (the UI rounds to whole %). */
export const MIN_BAND_WIDTH = 0.01;

export interface HeadlineRange {
  /** Show the policy-scenario band line (S1–S4 spread of P12). */
  showPolicyBand: boolean;
  /** Show the structural (case-mix) band line. */
  showStructuralBand: boolean;
  /** Show the driver bar and the "national group" sentence (only meaningful in the grid modes). */
  showDriversAndGroup: boolean;
  /** Time range in months, q10–q90 (`hiMonths: null` = beyond the 72-month horizon). Always present. */
  months: { loMonths: number | null; hiMonths: number | null };
  /** True when the time range is the only range shown (no non-degenerate band). */
  timeRangeIsPrimary: boolean;
  /** The lognormal modes rest on attorney/community reports: always shown as low confidence. */
  lowConfidence: boolean;
  /** As-of month of the data behind the estimate. */
  asOf: YearMonth;
}

const isLognormal = (r: EstimateOk): boolean => r.mode === 'post_interview' || r.mode === 'post_expedite';
const isRange = (b: [number, number], minWidth: number): boolean => Math.abs(b[1] - b[0]) >= minWidth;

export function headlineRange(r: EstimateOk, minWidth: number = MIN_BAND_WIDTH): HeadlineRange {
  const ln = isLognormal(r);
  const showPolicyBand = !ln && isRange(r.policyBand12, minWidth);
  const showStructuralBand = !ln && isRange(r.structuralBand12, minWidth);
  return {
    showPolicyBand,
    showStructuralBand,
    showDriversAndGroup: !ln,
    months: { loMonths: r.quantiles.q10, hiMonths: r.quantiles.q90 },
    timeRangeIsPrimary: !showPolicyBand && !showStructuralBand,
    lowConfidence: ln || r.confidence === 'LOW',
    asOf: r.dataThrough,
  };
}
