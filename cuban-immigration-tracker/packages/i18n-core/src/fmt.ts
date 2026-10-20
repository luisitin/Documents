/**
 * Deterministic formatting (02-data-model.md §9; ADR I18N-2).
 *
 * Output never depends on the engine's `Intl`: Hermes and V8 may differ [T], and Chromium's es-US
 * output ("9%") differs from the "9 %" this app uses [V, 02 §9]. Every pattern and word comes from
 * `locales/{es,en}/common.json` (`fmt.*`, `month.*`, `monthShort.*`, `relative.*`), so switching the
 * language switches every number, date and month label too (owner requirement 1; 00 F12).
 *
 * ADR-I18N-2 conventions:
 * - numbers use the US convention in both languages (`355,520`, `20.6`), because users live in the
 *   US and USCIS documents use it;
 * - Spanish percentages carry a no-break space (`9 %`, U+00A0, RAE usage), English does not (`9%`);
 * - percentages have 0 decimals; 0 < p < 0.01 → `<1 %` / `<1%` (07 WP4 acceptance, `pct(0.00906)`),
 *   and, symmetrically, 0.99 < p < 1 → `>99 %` / `>99%`, so a not-quite-certain probability is never
 *   rounded up to 100 % (04 §8: estimates never promise).
 * Rounding is half away from zero on the decimal value (`dec(20.65, 1)` → `20.7`), computed through
 * `toPrecision(15)`, whose output ECMA-262 defines exactly, so every engine gives the same string.
 */
import type { ISODate, Lang, YearMonth } from '@caa/data-schemas';
import { interpolate } from './interpolate';
import { commonWord, monthNames, monthShortNames } from './words';

/** 02 §9 deterministic formatter (contract v1, 07 §6.0). */
export interface Fmt {
  int(n: number): string;
  dec(n: number, dp: number): string;
  pct(p: number): string;
  date(d: ISODate): string;
  month(ym: YearMonth): string;
  monthLong(ym: YearMonth): string;
  relative(hours: number): string;
}

/** |x| · 10^dp rounded half away from zero, as a non-negative integer. */
function roundedMagnitude(x: number, dp: number): number {
  const scaled = Math.abs(x) * 10 ** dp;
  return Math.round(Number(scaled.toPrecision(15)));
}

/** "1234567" → "1,234,567" (US grouping in both languages, ADR-I18N-2). */
function group(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const MAX_DP = 10;

function formatDecimal(n: number, dp: number, missing: string): string {
  if (!Number.isFinite(n)) return missing;
  const places = Number.isFinite(dp) ? Math.min(MAX_DP, Math.max(0, Math.trunc(dp))) : 0;
  const r = roundedMagnitude(n, places);
  if (!Number.isSafeInteger(r)) return missing;
  const digits = String(r).padStart(places + 1, '0');
  const intPart = places === 0 ? digits : digits.slice(0, -places);
  const frac = places === 0 ? '' : `.${digits.slice(-places)}`;
  const sign = n < 0 && r !== 0 ? '-' : '';
  return `${sign}${group(intPart)}${frac}`;
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})/;
const MONTH_RE = /^(\d{4})-(\d{2})/;

function parseYm(s: string): { y: string; m: number } | null {
  const match = MONTH_RE.exec(s);
  if (!match) return null;
  const m = Number(match[2]);
  if (m < 1 || m > 12) return null;
  return { y: match[1] as string, m };
}

interface Words {
  months: readonly string[];
  monthsShort: readonly string[];
  w: (key: string) => string;
}

const cache: Partial<Record<Lang, Fmt>> = {};

function build(lang: Lang): Fmt {
  const words: Words = {
    months: monthNames(lang),
    monthsShort: monthShortNames(lang),
    w: (key) => commonWord(lang, key),
  };
  const missing = words.w('fmt.missing');

  const int = (n: number): string => formatDecimal(n, 0, missing);
  const dec = (n: number, dp: number): string => formatDecimal(n, dp, missing);

  const pct = (p: number): string => {
    if (!Number.isFinite(p)) return missing;
    if (p > 0 && p < 0.01) return words.w('fmt.pctBelowOne');
    if (p > 0.99 && p < 1) return words.w('fmt.pctAboveNinetyNine');
    const clamped = Math.min(1, Math.max(0, p));
    return interpolate(words.w('fmt.pct'), { n: String(roundedMagnitude(clamped, 2)) });
  };

  /** Accepts an ISODate or the date part of an ISODateTime (UTC calendar day). Malformed → unchanged. */
  const date = (d: ISODate): string => {
    const match = DATE_RE.exec(d);
    if (!match) return d;
    const m = Number(match[2]);
    const day = Number(match[3]);
    if (m < 1 || m > 12 || day < 1 || day > 31) return d;
    return interpolate(words.w('fmt.date'), { d: String(day), mon: words.monthsShort[m - 1] as string, y: match[1] as string });
  };

  /** Accepts a YearMonth (or an ISODate, whose month is used). Malformed → unchanged. */
  const month = (ym: YearMonth): string => {
    const p = parseYm(ym);
    if (!p) return ym;
    return interpolate(words.w('fmt.month'), { mon: words.monthsShort[p.m - 1] as string, y: p.y });
  };

  const monthLong = (ym: YearMonth): string => {
    const p = parseYm(ym);
    if (!p) return ym;
    return interpolate(words.w('fmt.monthLong'), { month: words.months[p.m - 1] as string, y: p.y });
  };

  /**
   * Elapsed time, given in hours (00 §5.1 "revisado hace 3 h"; 02 §9 `hace 3 h` / `hace 2 días`).
   * < 1 h → "hace menos de 1 h"; < 24 h → whole hours; otherwise whole days. Negative or non-finite
   * input (clock skew) is treated as 0.
   */
  const relative = (hours: number): string => {
    const h = Number.isFinite(hours) && hours > 0 ? hours : 0;
    if (h < 1) return words.w('relative.underHour');
    if (h < 24) return interpolate(words.w('relative.hours'), { n: int(Math.floor(h)) });
    const days = Math.floor(h / 24);
    return days === 1 ? words.w('relative.day') : interpolate(words.w('relative.days'), { n: int(days) });
  };

  return Object.freeze({ int, dec, pct, date, month, monthLong, relative });
}

/** 02 §9: `createFmt(lang)`. There is no language-less fmt; the app reads `useLang().fmt`. */
export function createFmt(lang: Lang): Fmt {
  const hit = cache[lang];
  if (hit) return hit;
  if (lang !== 'es' && lang !== 'en') throw new Error(`@caa/i18n-core.createFmt: unknown language ${String(lang)}`);
  const made = build(lang);
  cache[lang] = made;
  return made;
}
