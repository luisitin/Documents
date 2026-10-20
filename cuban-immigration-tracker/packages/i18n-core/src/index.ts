/**
 * @caa/i18n-core (WP4) — locale resources, deterministic formatting and the shared words.
 *
 * Contract v1 (07-implementation-plan.md §6.0): `Namespace`, `NAMESPACES`, `resources`, `I18nKey`,
 * `Fmt`, `createFmt(lang)`, `probWord(p, lang)`, `localize(l, lang)`. Everything else exported here
 * is additive (pure helpers the app, notifications and tools can share).
 *
 * Pure: imports only `@caa/data-schemas` types and its own JSON (ARCH-1). No `Intl` in any output
 * path (I18N-2). Spanish is first-class and uses **usted** (I18N-1; STYLE-GUIDE.md).
 */
import type { Lang, Localized } from '@caa/data-schemas';
import { commonWord, probBand } from './words';

/** 02 §1: the two app languages; Spanish is first-class. Defined in @caa/data-schemas. */
export type { Lang };

export { NAMESPACES, NAMESPACE_OWNERS, NS_SEPARATOR, isNamespace, splitKey } from './keys';
export type { I18nKey, Namespace } from './keys';
export { resources } from './resources';
export type { CommonKey, KeyOf, KnownI18nKey, ResourceShape } from './resources';
export { createFmt } from './fmt';
export type { Fmt } from './fmt';
export {
  I18NEXT_FORMAT_OPTIONS, PLACEHOLDER, hasKey, interpolate, interpolationVars, pluralCategory, pluralKey, translate,
} from './interpolate';
export { PROB_THRESHOLDS, monthNames, monthShortNames, probBand } from './words';
export type { ProbBand } from './words';

/** The languages in display order (Spanish first, 00 §3.1). */
export const LANGS: readonly Lang[] = ['es', 'en'] as const;

/**
 * Device-locale default (00 S0 step 1: "es* → es, else en"; owner requirement 1). Accepts BCP-47
 * tags or bare language codes (`'es-US'`, `'es'`, `'en-GB'`); anything else → `'en'`.
 */
export function langFromLocale(tag: string | null | undefined): Lang {
  return typeof tag === 'string' && /^es(?:$|[-_])/i.test(tag.trim()) ? 'es' : 'en';
}

/** The other language (the LangToggle target). */
export function otherLang(lang: Lang): Lang {
  return lang === 'es' ? 'en' : 'es';
}

/**
 * 04 §8 item 2 word label for a probability: < 5 % muy poco probable / very unlikely; 5–20 % poco
 * probable / unlikely; 20–50 % posible / possible; 50–80 % probable / likely; > 80 % muy probable /
 * very likely. Non-finite input → the "missing" dash.
 */
export function probWord(p: number, lang: Lang): string {
  const band = probBand(p);
  return band === null ? commonWord(lang, 'fmt.missing') : commonWord(lang, `prob.${band}`);
}

/**
 * Picks one side of a data-file `Localized` (02 §1). The schema requires both sides non-empty
 * (02 §8); if a side is nevertheless blank (an older cached file), the other side is shown rather
 * than an empty string.
 */
export function localize(l: Localized, lang: Lang): string {
  const own = l[lang];
  if (typeof own === 'string' && own.trim() !== '') return own;
  const other = l[otherLang(lang)];
  return typeof other === 'string' ? other : '';
}
