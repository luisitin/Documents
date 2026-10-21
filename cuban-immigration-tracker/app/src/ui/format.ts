/**
 * Pure label helpers shared by the kit (deterministic: only `createFmt` and the locale words,
 * no `Intl`, ADR I18N-2).
 */
import type { FiscalQuarter, ISODate, Lang, YearMonth } from '@caa/data-schemas';
import { interpolate, monthShortNames, translate, type Fmt } from '@caa/i18n-core';

/**
 * US federal fiscal quarter → calendar months (FY = Oct 1 – Sep 30; doc 04 §1.5 "Understanding
 * Our Data"): Q1 = Oct–Dec of FY−1, Q2 = Jan–Mar, Q3 = Apr–Jun, Q4 = Jul–Sep of FY.
 */
export function quarterMonths(q: FiscalQuarter): { year: number; from: number; to: number } {
  if (q.q === 1) return { year: q.fy - 1, from: 10, to: 12 };
  const from = (q.q - 2) * 3 + 1;
  return { year: q.fy, from, to: from + 2 };
}

/** "oct–dic 2025" / "Oct–Dec 2025" for FY2026 Q1 (00 S1 "oct–dic 2025 91.7 %"). */
export function quarterLabel(q: FiscalQuarter, lang: Lang): string {
  const names = monthShortNames(lang);
  const { year, from, to } = quarterMonths(q);
  return interpolate(translate(lang, 'ui:period.quarter'), { from: names[from - 1] as string, to: names[to - 1] as string, y: String(year) });
}

const YM = /^\d{4}-\d{2}$/;

/** A YearMonth, FiscalQuarter or ISODate period as display text. */
export function periodLabel(p: YearMonth | FiscalQuarter | ISODate, fmt: Fmt, lang: Lang): string {
  if (typeof p === 'object') return quarterLabel(p, lang);
  return YM.test(p) ? fmt.month(p) : fmt.date(p);
}

/** Months between two YearMonths (b − a), pure. */
export function monthIndex(ym: YearMonth): number {
  const y = Number(ym.slice(0, 4));
  const m = Number(ym.slice(5, 7));
  return y * 12 + (m - 1);
}

/** YearMonth `k` months after `ym` (k may be negative). */
export function addMonths(ym: YearMonth, k: number): YearMonth {
  const i = monthIndex(ym) + k;
  const y = Math.floor(i / 12);
  const m = i - y * 12 + 1;
  return `${y}-${String(m).padStart(2, '0')}`;
}
