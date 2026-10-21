/**
 * Small formatting helpers shared by the WP8a screens. Everything goes through the deterministic
 * `fmt` of `useLang()` (ADR I18N-2: no `Intl`) and locale templates, so numbers, dates and units
 * switch with the language (owner requirement 1).
 */
import type { FiscalQuarter, ISODate, Lang, Localized, YearMonth } from '@caa/data-schemas';
import { localize, pluralKey, type Fmt } from '@caa/i18n-core';
import type { TFunction } from '@/i18n/useLang';

/**
 * A share with one decimal ("23.7 %" / "23.7%"), for approval shares quoted to one decimal in the
 * quarterly report (00 S1 "23.7 %"; doc 14 §8.1). `fmt.pct` rounds to whole percents, so this
 * uses `fmt.dec` and the `home:pct1` template (Spanish carries a no-break space, 02 §9).
 */
export function pct1(t: TFunction, fmt: Fmt, share: number): string {
  return t('home:pct1', { n: fmt.dec(share * 100, 1) });
}

/** "6.4 meses" / "6.4 months" (plural from `common:unit.month.*`). */
export function monthsText(t: TFunction, fmt: Fmt, n: number, dp = 1): string {
  return t(pluralKey('common:unit.month', n), { n: dp === 0 ? fmt.int(Math.round(n)) : fmt.dec(n, dp) });
}

/** "12 días" / "12 days". */
export function daysText(t: TFunction, fmt: Fmt, n: number): string {
  return t(pluralKey('common:unit.day', n), { n: fmt.int(n) });
}

/** Compares fiscal quarters (FY = Oct 1 – Sep 30). */
export function quarterIndex(q: FiscalQuarter): number {
  return q.fy * 4 + (q.q - 1);
}

/** The fiscal quarter after `q`. */
export function nextQuarter(q: FiscalQuarter): FiscalQuarter {
  return q.q === 4 ? { fy: q.fy + 1, q: 1 } : { fy: q.fy, q: (q.q + 1) as 1 | 2 | 3 | 4 };
}

/** Sorts YearMonth-keyed rows ascending without mutating the input. */
export function byYm<T extends { ym: YearMonth }>(rows: readonly T[]): T[] {
  return [...rows].sort((a, b) => (a.ym < b.ym ? -1 : a.ym > b.ym ? 1 : 0));
}

/** The first characters of a sha256, for display ("huella" / "fingerprint"). */
export function shortSha(sha: string | undefined): string | null {
  return typeof sha === 'string' && sha.length >= 12 ? sha.slice(0, 12) : null;
}

/** Accent- and case-insensitive text for search (glossary). */
export function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

const EN_MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5, jun: 6, june: 6,
  jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11,
  dec: 12, december: 12,
};
/** A trailing English date in a label: "(May 21, 2026)", "(Aug 28, 2026)", "(June 2026)". */
const TRAILING_EN_DATE = /\s*\(([A-Za-z]+)\.?\s+(?:(\d{1,2}),\s*)?(\d{4})\)\s*$/;
const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * A cited source's label in the reader's language (owner requirement 1; 02 §1). The label may be
 * `Localized` (forward-compatible with an additive `CitedSource` change) or a plain proper title.
 * A `date` field is formatted with `fmt`; otherwise a trailing English date written into a plain
 * label ("(June 12, 2026)") is parsed and re-formatted, so it no longer stays English in the
 * Spanish UI. Unparseable text is kept as written.
 * TODO(WP1/WP9): add `date?: ISODate` (and `label: Localized | string`) to CitedSourceSchema and
 * move the dates out of the curated labels; this parser is then only a fallback for cached files.
 */
export function sourceLabel(s: { label: string | Localized; date?: ISODate }, lang: Lang, fmt: Fmt): string {
  const label = typeof s.label === 'string' ? s.label : localize(s.label, lang);
  if (s.date) return `${label.replace(TRAILING_EN_DATE, '')} (${fmt.date(s.date)})`;
  const m = TRAILING_EN_DATE.exec(label);
  const month = m ? EN_MONTHS[(m[1] ?? '').toLowerCase()] : undefined;
  if (!m || !month) return label;
  const y = m[3] as string;
  const day = m[2] ? Number(m[2]) : null;
  if (day !== null && (day < 1 || day > 31)) return label;
  const when = day === null ? fmt.monthLong(`${y}-${pad2(month)}`) : fmt.date(`${y}-${pad2(month)}-${pad2(day)}`);
  return `${label.slice(0, m.index)} (${when})`;
}
