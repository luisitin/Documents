/**
 * Calendar helpers for @caa/case-rules (07-implementation-plan.md §6.0 `dates`; WP3).
 *
 * UTC-safe and time-zone-free: pure integer arithmetic on ISO strings ("YYYY-MM-DD" and "YYYY-MM").
 * No `Date` object is ever constructed, so the device's time zone and DST can never shift a day
 * (02-data-model.md §1: ISO dates are plain calendar days). The `today` argument of every rule is a
 * local calendar date supplied by the caller (04-estimation-model.md §1 "today").
 *
 * EST-10 (04 §2): one average month = 30.4375 days; `monthsCeil` for "zero until a future date",
 * `monthsSince` for "lasts N months since an event".
 *
 * Source constraint (data-schemas/src/index.ts note): no ARRAY destructuring in packages/ src,
 * because jest-expo's Babel turns it into an `@babel/runtime` require that jest cannot resolve from
 * ../packages.
 */
import type { ISODate, YearMonth } from '@caa/data-schemas';

/** EST-10: one average Gregorian month in days (365.25 / 12). */
export const DAYS_PER_MONTH = 30.4375;

/** Days from 1970-01-01 to y-m-d in the proleptic Gregorian calendar (H. Hinnant's days_from_civil). */
function daysFromCivil(y: number, m: number, d: number): number {
  const yy = m <= 2 ? y - 1 : y;
  const era = Math.floor(yy / 400);
  const yoe = yy - era * 400;
  const mp = (m + 9) % 12;
  const doy = Math.floor((153 * mp + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

/** Inverse of `daysFromCivil`. */
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

const pad = (n: number, w: number): string => String(n).padStart(w, '0');

function daysInMonth(y: number, m: number): number {
  if (m === 2) return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28;
  return m === 4 || m === 6 || m === 9 || m === 11 ? 30 : 31;
}

/** Epoch day of an ISO date (only the first 10 characters are read, so an ISODateTime also works). */
export function epochDay(d: ISODate): number {
  return daysFromCivil(Number(d.slice(0, 4)), Number(d.slice(5, 7)), Number(d.slice(8, 10)));
}

/** ISO date of an epoch day. */
export function fromEpochDay(n: number): ISODate {
  const c = civilFromDays(n);
  return `${pad(c.y, 4)}-${pad(c.m, 2)}-${pad(c.d, 2)}`;
}

/** b − a in calendar days (positive when b is later). `daysBetween('2025-03-15', '2026-10-20') === 584` (T11). */
export function daysBetween(a: ISODate, b: ISODate): number {
  return epochDay(b) - epochDay(a);
}

/** `d` plus `n` days (n may be negative). */
export function addDays(d: ISODate, n: number): ISODate {
  return fromEpochDay(epochDay(d) + n);
}

/** `YYYY-MM` of an ISO date. */
export function ym(d: ISODate): YearMonth {
  return d.slice(0, 7);
}

/** Whole months from YearMonth a to YearMonth b (b − a): `monthsBetween('2026-08', '2026-10') === 2` (EST-5). */
export function monthsBetween(a: YearMonth, b: YearMonth): number {
  return (Number(b.slice(0, 4)) - Number(a.slice(0, 4))) * 12 + (Number(b.slice(5, 7)) - Number(a.slice(5, 7)));
}

/** YearMonth `a` plus `n` months. */
export function addMonthsYm(a: YearMonth, n: number): YearMonth {
  const t = Number(a.slice(0, 4)) * 12 + Number(a.slice(5, 7)) - 1 + n;
  const y = Math.floor(t / 12);
  return `${pad(y, 4)}-${pad(t - y * 12 + 1, 2)}`;
}

/** Last calendar day of a month: `endOfMonth('2024-02') === '2024-02-29'`. */
export function endOfMonth(a: YearMonth): ISODate {
  const y = Number(a.slice(0, 4));
  const m = Number(a.slice(5, 7));
  return `${a}-${pad(daysInMonth(y, m), 2)}`;
}

/**
 * Calendar-month addition on a day date, clamped to the month end (2025-08-31 + 6 → 2026-02-28).
 * Used for the EAD validity periods (00 S5) and the mandamus 24/36-month marks (doc 15 §6.3).
 */
export function addMonths(d: ISODate, n: number): ISODate {
  const target = addMonthsYm(ym(d), n);
  const last = Number(endOfMonth(target).slice(8, 10));
  const day = Math.min(Number(d.slice(8, 10)), last);
  return `${target}-${pad(day, 2)}`;
}

/**
 * Whole calendar months elapsed from a to b (2025-03-15 → 2027-03-14 is 23, → 2027-03-15 is 24):
 * the "24 months" / "36 months" mandamus marks of doc 15 §6.3 (reference case: 2027-03-15 and
 * 2028-03-15).
 */
export function fullMonthsBetween(a: ISODate, b: ISODate): number {
  let m = monthsBetween(ym(a), ym(b));
  if (m > 0 && addMonths(a, m) > b) m -= 1;
  else if (m < 0 && addMonths(a, m) < b) m += 1;
  return m;
}

/** EST-10: "hazard zero until a future date" → ceil(days / 30.4375). */
export function monthsCeil(days: number): number {
  return Math.ceil(days / DAYS_PER_MONTH);
}

/** EST-10: "boost lasts N months since an event" → floor(days / 30.4375). Also "19 meses" in 00 S3. */
export function monthsSince(days: number): number {
  return Math.floor(days / DAYS_PER_MONTH);
}

/** The earlier / later of two ISO dates (lexicographic order equals calendar order). */
export function minDate(a: ISODate, b: ISODate): ISODate {
  return a < b ? a : b;
}
export function maxDate(a: ISODate, b: ISODate): ISODate {
  return a > b ? a : b;
}

/** 07 §6.0 `dates` object (the frozen contract), plus the additive helpers above as named exports. */
export const dates: {
  daysBetween(a: ISODate, b: ISODate): number; monthsBetween(a: YearMonth, b: YearMonth): number; monthsCeil(days: number): number;
  monthsSince(days: number): number; endOfMonth(ym: YearMonth): ISODate; addDays(d: ISODate, n: number): ISODate; ym(d: ISODate): YearMonth;
} = { daysBetween, monthsBetween, monthsCeil, monthsSince, endOfMonth, addDays, ym };
