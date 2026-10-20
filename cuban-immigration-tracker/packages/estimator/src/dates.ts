/**
 * Calendar helpers for the estimator (internal; 04-estimation-model.md EST-5, EST-9, EST-10).
 *
 * Pure integer arithmetic on ISO strings: no `Date`, no time zone, no clock (07 §6.0 "never reads a
 * clock"). `@caa/case-rules` has its own `dates` (WP3); the estimator never imports case-rules
 * (07 WP2 "Consumes"), so the few helpers it needs live here.
 */
import type { ISODate, YearMonth } from '@caa/data-schemas';

/** EST-10: one average Gregorian month in days. */
export const DAYS_PER_MONTH = 30.4375;

/** Days from 1970-01-01 to y-m-d (proleptic Gregorian; H. Hinnant's days_from_civil). */
function daysFromCivil(y: number, m: number, d: number): number {
  const yy = m <= 2 ? y - 1 : y;
  const era = Math.floor(yy / 400);
  const yoe = yy - era * 400;
  const mp = (m + 9) % 12;
  const doy = Math.floor((153 * mp + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

function civilFromDays(z0: number): { y: number; m: number; d: number } {
  const z = z0 + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp < 10 ? mp + 3 : mp - 9;
  return { y: yoe + era * 400 + (m <= 2 ? 1 : 0), m, d };
}

const pad = (n: number, w: number) => String(n).padStart(w, '0');

/** Epoch day of an ISO date (first 10 characters, so an ISODateTime also works). */
export function epochDay(d: ISODate): number {
  return daysFromCivil(Number(d.slice(0, 4)), Number(d.slice(5, 7)), Number(d.slice(8, 10)));
}

/** b − a in days (positive when b is later). */
export function daysBetween(a: ISODate, b: ISODate): number {
  return epochDay(b) - epochDay(a);
}

export function addDays(d: ISODate, n: number): ISODate {
  const c = civilFromDays(epochDay(d) + n);
  return `${pad(c.y, 4)}-${pad(c.m, 2)}-${pad(c.d, 2)}`;
}

export function ym(d: ISODate): YearMonth {
  return d.slice(0, 7);
}

/** Whole months from YearMonth a to YearMonth b (b − a). */
export function monthsBetween(a: YearMonth, b: YearMonth): number {
  return (Number(b.slice(0, 4)) - Number(a.slice(0, 4))) * 12 + (Number(b.slice(5, 7)) - Number(a.slice(5, 7)));
}

export function addMonths(a: YearMonth, n: number): YearMonth {
  const t = Number(a.slice(0, 4)) * 12 + Number(a.slice(5, 7)) - 1 + n;
  return `${pad(Math.floor(t / 12), 4)}-${pad((t % 12 + 12) % 12 + 1, 2)}`;
}

export function endOfMonth(a: YearMonth): ISODate {
  return addDays(`${addMonths(a, 1)}-01`, -1);
}

/** EST-10: "hazard zero until a future date" → ceil(days / 30.4375). */
export function monthsCeil(days: number): number {
  return Math.ceil(days / DAYS_PER_MONTH);
}

/** EST-10: "boost lasts N months since an event" → floor(days / 30.4375). */
export function monthsSince(days: number): number {
  return Math.floor(days / DAYS_PER_MONTH);
}

/** Last calendar month of a fiscal quarter (FY = Oct 1 – Sep 30; 02 §1). */
export function quarterEndMonth(q: { fy: number; q: 1 | 2 | 3 | 4 }): YearMonth {
  return q.q === 1 ? `${pad(q.fy - 1, 4)}-12` : `${pad(q.fy, 4)}-${pad(q.q * 3 - 3, 2)}`;
}

/** Compare fiscal quarters (negative when a is earlier). */
export function cmpQuarter(a: { fy: number; q: number }, b: { fy: number; q: number }): number {
  return a.fy !== b.fy ? a.fy - b.fy : a.q - b.q;
}
