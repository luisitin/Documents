/**
 * Read-outs of a conditioned survival curve S_c(0..72) (04-estimation-model.md EST-8, EST-9, §8).
 */
import type { ISODate } from '@caa/data-schemas';
import { DAYS_PER_MONTH, daysBetween, monthsBetween, ym } from './dates';

/**
 * EST-8: q_x is the smallest whole month t ∈ [1, 72] with 1 − S_c(t) ≥ x − 1e-12, else null
 * ("más de 6 años"). `S` is S_c(0..72). (Implemented by WP0.)
 */
export function quantile(S: number[], q: number): number | null {
  const last = Math.min(72, S.length - 1);
  for (let t = 1; t <= last; t++) {
    const s = S[t];
    if (s !== undefined && 1 - s >= q - 1e-12) return t;
  }
  return null;
}

/** P(decision within t months) = 1 − S_c(t), t clamped to the curve. */
export function pWithinMonths(S: number[], t: number): number {
  const i = Math.max(0, Math.min(S.length - 1, t));
  return 1 - S[i]!;
}

/**
 * EST-9: P(by the end of the month of `date`) = 1 − S_c(months from ym(today) to that month).
 * Same month as today (t = 0, e.g. 31 Dec in December): 1 − S_c(0) would always be 0, so the
 * first month is interpolated linearly by the days left, (days(today → date) / 30.4375)·(1 − S_c(1))
 * (review round 1; t ≥ 1 unchanged); a date before today gives 0.
 */
export function pByDate(S: number[], today: ISODate, date: ISODate): number {
  const t = monthsBetween(ym(today), ym(date));
  if (t === 0 && S.length > 1) {
    const frac = Math.min(1, Math.max(0, daysBetween(today, date)) / DAYS_PER_MONTH);
    return frac * (1 - S[1]!);
  }
  return pWithinMonths(S, t);
}

/** 04 §8 item 3: 31 Dec of this year, the next and the one after. */
export function calendarDates(today: ISODate): ISODate[] {
  const y = Number(today.slice(0, 4));
  return [0, 1, 2].map((i) => `${y + i}-12-31`);
}

/** Little's law (T12; Method screen only, 00 S11): months to clear `pending` at `perMonth`. */
export function littlesLawMonths(pending: number, perMonth: number): number | null {
  return perMonth > 0 ? pending / perMonth : null;
}
