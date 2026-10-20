/**
 * Read-outs of a conditioned survival curve S_c(0..72) (04-estimation-model.md EST-8, EST-9, §8).
 */
import type { ISODate } from '@caa/data-schemas';
import { monthsBetween, ym } from './dates';

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

/** EST-9: P(by the end of the month of `date`) = 1 − S_c(months from ym(today) to that month). */
export function pByDate(S: number[], today: ISODate, date: ISODate): number {
  return pWithinMonths(S, monthsBetween(ym(today), ym(date)));
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
