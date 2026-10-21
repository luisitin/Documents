/**
 * Small formatting helpers shared by the WP8a screens. Everything goes through the deterministic
 * `fmt` of `useLang()` (ADR I18N-2: no `Intl`) and locale templates, so numbers, dates and units
 * switch with the language (owner requirement 1).
 */
import type { FiscalQuarter, YearMonth } from '@caa/data-schemas';
import { pluralKey, type Fmt } from '@caa/i18n-core';
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
