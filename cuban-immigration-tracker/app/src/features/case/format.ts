/**
 * Pure display helpers for the case screens (WP8b; 00-product-spec.md S2–S5, S7, S9, S12).
 *
 * Every number and date goes through the deterministic `fmt` (ADR I18N-2, 02 §9) and every word
 * through `t`, so the whole case tab switches language at runtime (owner requirement 1). Nothing
 * here reads a clock: `today` always comes from the data layer (`useData().today`).
 */
import type { CaseTimeline, EntryChannel, ISODate, Lang, OfficesFile, PolicyFile, RegimeId, RemedyStep } from '@caa/data-schemas';
import { DAYS_PER_MONTH } from '@caa/case-rules';
import { pluralKey, type Fmt, type I18nKey } from '@caa/i18n-core';

export type T = (key: I18nKey, vars?: Record<string, string | number>) => string;

/** "19 meses" / "19 months" (common unit plurals, WP4). */
export function monthsLabel(n: number, t: T, fmt: Fmt): string {
  return t(pluralKey('common:unit.month', n), { n: fmt.int(n) });
}

/** "278 días" / "278 days". */
export function daysLabel(n: number, t: T, fmt: Fmt): string {
  return t(pluralKey('common:unit.day', n), { n: fmt.int(n) });
}

/** Days → whole months, rounded (≈ months in the clock card; 30.4375 days per month, EST-12). */
export function approxMonths(days: number): number {
  return Math.round(days / DAYS_PER_MONTH);
}

/** Rounds a pool count to the nearest hundred for the "≈" queue facts (00 S3 item 9: ≈175,200). */
export function approxHundred(n: number): number {
  return Math.round(n / 100) * 100;
}

/**
 * The median phrase of 04 §8 item 4 / 00 S3 item 5: null (beyond 72 months) → "más de 6 años";
 * 24 months or more → "más de N años" (54 → "más de 4 años"); below 24 → "unos N meses".
 */
export function medianPhrase(q50: number | null, t: T, fmt: Fmt): string {
  if (q50 === null) return t('common:unit.moreThanSixYears');
  if (q50 >= 24) return t('estimate:median.overYears', { n: fmt.int(Math.floor(q50 / 12)) });
  return t('estimate:median.about', { months: monthsLabel(q50, t, fmt) });
}

/** The S2 channel option label. */
export function channelLabel(ch: EntryChannel, t: T): string {
  return t(`case:channel.${ch}`);
}

/** Preset nickname tokens: the app never stores free-text names (owner rule; 05 §1). */
export const NICKNAMES = ['mine', 'family', 'case2', 'case3'] as const;
export type NicknameToken = (typeof NICKNAMES)[number];

/** Display label of a case: preset tokens are translated; anything else is shown as stored. */
export function nicknameLabel(c: CaseTimeline, t: T, isExample = false): string {
  if (isExample) return t('case:nickname.example');
  return (NICKNAMES as readonly string[]).includes(c.nickname) ? t(`case:nickname.${c.nickname}`) : c.nickname;
}

/** Office display name from the data (codes are read from data, never hard-coded; 00 S6). */
export function officeName(code: string, offices: OfficesFile): string {
  const o = offices.offices.find((x) => x.code === code);
  return o ? `${o.name} (${o.code})` : code;
}

/**
 * The hold periods behind `clock.holdsApplied`, as "14 feb 2025–9 jun 2025" ranges joined with
 * " y " / " and " (00 S3 item 1). Dates are the curated regime dates (key facts §3; policy.json).
 */
export function holdRanges(policy: PolicyFile, holds: RegimeId[], t: T, fmt: Fmt): string {
  const parts: string[] = [];
  for (const id of holds) {
    const r = policy.regimes.find((x) => x.id === id);
    if (!r || r.start === null || r.end === null) continue;
    parts.push(t('estimate:clock.range', { from: fmt.date(r.start), to: fmt.date(r.end) }));
  }
  return parts.join(t('estimate:clock.rangeJoin'));
}

/**
 * Formats the plain params of a `remedyLadder()` step for its i18n template (case-rules
 * remedies.ts contract): keys ending in `Date` are ISO dates, keys ending in `Month` are
 * YearMonths, `feeUsd` is dollars, `hardship` is a comma-joined id list, `outcome` an outcome id,
 * `state` a 2-letter code; other numbers are integers.
 */
export function remedyVars(step: RemedyStep, t: T, fmt: Fmt): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(step.params)) {
    if (typeof v === 'number') {
      out[k] = k === 'feeUsd' ? t('common:money.usd', { amount: fmt.int(v) }) : fmt.int(v);
    } else if (k.endsWith('Date')) {
      out[k] = fmt.date(v as ISODate);
    } else if (k.endsWith('Month')) {
      out[k] = fmt.month(v);
    } else if (k === 'hardship') {
      out[k] = v.split(',').filter(Boolean).map((h) => t(`case:hardship.${h}`)).join(', ');
    } else if (k === 'outcome') {
      out[k] = t(`case:outcome.${v}`);
    } else {
      out[k] = v;
    }
  }
  return out;
}

/** The state label of a ladder rung (00 S7: ✓ disponible / ✕ aún no (ETA) / ⚠ depende / — no aplica). */
export function rungStateLabel(step: RemedyStep, t: T, fmt: Fmt): string {
  if (step.state === 'not_yet' && step.etaMonth !== undefined) return t('remedies:state.not_yetEta', { month: fmt.month(step.etaMonth) });
  return t(`remedies:state.${step.state}`);
}

/** Official pages for the ladder rungs (research 00-key-facts §5; doc 15 §2.3, §3, §4). */
export const REMEDY_URLS: Partial<Record<RemedyStep['rung'], Record<Lang, string>>> = {
  a_i485: { es: 'https://egov.uscis.gov/e-request', en: 'https://egov.uscis.gov/e-request' },
  a_c9: { es: 'https://egov.uscis.gov/e-request', en: 'https://egov.uscis.gov/e-request' },
  b: { es: 'https://uscis.gov/es/formularios/criterios-para-el-procesamiento-expedito', en: 'https://uscis.gov/es/formularios/criterios-para-el-procesamiento-expedito' },
  c: { es: 'https://www.dhs.gov/topic/cis-ombudsman/7001', en: 'https://www.dhs.gov/topic/cis-ombudsman/7001' },
};

/** The rungs whose copy ends with "consulte a un abogado o representante acreditado" (00 §3 principle 7). */
export const LEGAL_RUNGS: readonly RemedyStep['rung'][] = ['b', 'e'];
