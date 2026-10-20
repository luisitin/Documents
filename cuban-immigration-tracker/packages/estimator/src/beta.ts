/**
 * β fit and the observation σ (04-estimation-model.md EST-3, §3.2, §6.2).
 *
 * EST-3: targets = the last 3 rows with C = approved + denied ≥ 300 (today 2026-06/07/08); SSE of
 * (model mean completion age − avgMonths) over the full replay; ternary search on [0, 0.3], 60
 * iterations, β = midpoint. Fewer than 3 targets → 0.037 (doc 08 §11.4 step 3). Golden T14:
 * β̂ = 0.037391 (doc 08: 0.0374), SSE(β̂) < SSE(0) and < SSE(0.08).
 *
 * §6.2: σ = sample SD of month-to-month Δ ln C between consecutive NON-HOLD months (9 differences
 * today, SD 0.298 → σ = 0.30), rounded to 2 decimals, floor 0.25.
 */
import type { EstimatorParams, MonthlyRow, Regime, YearMonth } from '@caa/data-schemas';
import { reconstructPool } from './pool';
import { addDays, addMonths, endOfMonth, monthsBetween } from './dates';

export const BETA_FALLBACK = 0.037;
export const BETA_SEARCH: readonly [number, number] = [0, 0.3];
export const BETA_ITERATIONS = 60;
export const BETA_TARGET_MIN_COMPLETIONS = 300;

/** EST-3 target months: the last 3 rows with C ≥ 300 (and a reported avgMonths). */
export function betaTargets(rows: MonthlyRow[]): YearMonth[] {
  return rows.filter((r) => r.approved + r.denied >= BETA_TARGET_MIN_COMPLETIONS && r.avgMonths !== null).map((r) => r.ym).slice(-3);
}

/** EST-3: ternary search on [0, 0.3]; fewer than 3 targets → 0.037 (fallbackUsed). */
export function fitBeta(rows: MonthlyRow[]): EstimatorParams['beta'] {
  const targets = betaTargets(rows);
  const sse = (b: number) => reconstructPool(rows, b, targets).sse ?? 0;
  if (targets.length < 3) {
    return { value: BETA_FALLBACK, targets, sse: targets.length ? sse(BETA_FALLBACK) : 0, fallbackUsed: true };
  }
  let lo = BETA_SEARCH[0];
  let hi = BETA_SEARCH[1];
  for (let i = 0; i < BETA_ITERATIONS; i++) {
    const m1 = lo + (hi - lo) / 3;
    const m2 = hi - (hi - lo) / 3;
    if (sse(m1) < sse(m2)) hi = m2;
    else lo = m1;
  }
  const value = (lo + hi) / 2;
  return { value, targets, sse: sse(value), fallbackUsed: false };
}

export const SIGMA_FLOOR = 0.25;
/** Used only when fewer than 2 non-hold differences exist (04 §6.2 value of 2026-10-20). */
export const SIGMA_FALLBACK = 0.3;

/** True when the calendar month overlaps a hold regime [start, end) (EST-12 end-exclusive). */
export function isHoldMonth(m: YearMonth, regimes: Regime[]): boolean {
  const a0 = `${m}-01`;
  const a1 = addDays(endOfMonth(m), 1);
  return regimes.some((r) => r.hold && r.start !== null && r.end !== null && (a0 > r.start ? a0 : r.start) < (a1 < r.end ? a1 : r.end));
}

/** The Δ ln C values used by `fitObservationSigma` (exported for tests and the Method screen). */
export function nonHoldLogDiffs(rows: MonthlyRow[], regimes: Regime[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1]!;
    const b = rows[i]!;
    const ca = a.approved + a.denied;
    const cb = b.approved + b.denied;
    if (addMonths(a.ym, 1) !== b.ym || monthsBetween(a.ym, b.ym) !== 1) continue;
    if (ca <= 0 || cb <= 0 || isHoldMonth(a.ym, regimes) || isHoldMonth(b.ym, regimes)) continue;
    out.push(Math.log(cb) - Math.log(ca));
  }
  return out;
}

/** 04 §6.2: SD of Δ ln C over consecutive non-hold months, rounded to 0.01, floor 0.25. */
export function fitObservationSigma(rows: MonthlyRow[], regimes: Regime[]): number {
  const d = nonHoldLogDiffs(rows, regimes);
  if (d.length < 2) return SIGMA_FALLBACK;
  const mean = d.reduce((s, x) => s + x, 0) / d.length;
  const sd = Math.sqrt(d.reduce((s, x) => s + (x - mean) ** 2, 0) / (d.length - 1));
  return Math.max(SIGMA_FLOOR, Math.round(sd * 100) / 100);
}
