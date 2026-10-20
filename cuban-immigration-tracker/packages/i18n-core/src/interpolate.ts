/**
 * Interpolation, plural choice and a pure `translate` (no i18next, no `Intl`; ADR I18N-2).
 *
 * The locale files use single-brace placeholders, `{name}` (07 §8 "use interpolation `{p}`,
 * `{fecha}`"; 00 §5.1 copy). The app's i18next instance must therefore be configured with
 * `I18NEXT_FORMAT_OPTIONS` (prefix `{`, suffix `}`, flat keys). `check-i18n.mjs` uses the same
 * placeholder grammar (`PLACEHOLDER`), so the checker and the runtime agree on what a variable is.
 */
import type { Lang } from '@caa/data-schemas';
import { splitKey, type I18nKey } from './keys';
import { resources } from './resources';

/** `{name}`: an ASCII identifier between single braces. Global; reset `lastIndex` or use `matchAll`. */
export const PLACEHOLDER = /\{([A-Za-z_][A-Za-z0-9_]*)\}/g;

/**
 * Formatting options the app's i18next instance must use so it reads these files exactly as
 * `translate` does (WP6 spreads this into `createInstance({...})`):
 * - `nsSeparator ':'` → keys are `namespace:key` (`I18nKey`);
 * - `keySeparator false` → a dot is part of a flat key (`disclaimer.full`), never a path;
 * - single-brace interpolation, no HTML escaping (React escapes).
 * Plurals: do not rely on i18next `count` suffixes (they call `Intl.PluralRules`, which differs
 * between engines and returns `many` in Spanish for 1,000,000). Use `pluralKey()` instead.
 */
export const I18NEXT_FORMAT_OPTIONS = {
  nsSeparator: ':',
  keySeparator: false,
  interpolation: { prefix: '{', suffix: '}', escapeValue: false },
} as const;

/** The sorted, de-duplicated placeholder names in `template`. */
export function interpolationVars(template: string): string[] {
  const names = new Set<string>();
  for (const m of template.matchAll(PLACEHOLDER)) names.add(m[1] as string);
  return [...names].sort();
}

/**
 * Replaces each `{name}` with `vars[name]`. Numbers are inserted with `String()`: callers format
 * them first with `createFmt(lang)` (07 §8: "write numbers with `fmt` only"). A placeholder with no
 * value is left as written, so a missing variable is visible in tests instead of silently empty.
 */
export function interpolate(template: string, vars?: Readonly<Record<string, string | number>>): string {
  if (!vars) return template;
  return template.replace(PLACEHOLDER, (whole, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : whole,
  );
}

/**
 * Plural category for both app languages. Deterministic and engine-independent (I18N-2):
 * exactly 1 → `one`, everything else (0, 2, 1.5, 1,000,000) → `other`. This matches CLDR for
 * es and en on the integers the app shows, except CLDR's Spanish `many` for millions, which the
 * app never displays as a counted noun.
 */
export function pluralCategory(n: number): 'one' | 'other' {
  return n === 1 ? 'one' : 'other';
}

/** `pluralKey('common:unit.month', 3)` → `'common:unit.month.other'`. */
export function pluralKey<K extends string>(base: K, n: number): `${K}.${'one' | 'other'}` {
  return `${base}.${pluralCategory(n)}`;
}

/**
 * Pure lookup + interpolation over `resources`, with i18next's missing-key behaviour (returns the
 * key itself). Used where no React tree exists (notification text, tests, tools); the app's screens
 * use `useLang().t`, which reads the same resources.
 */
export function translate(lang: Lang, key: I18nKey | string, vars?: Readonly<Record<string, string | number>>): string {
  const parts = splitKey(key);
  if (!parts) return key;
  const table = resources[lang][parts.ns];
  const template = Object.prototype.hasOwnProperty.call(table, parts.key) ? table[parts.key] : undefined;
  return template === undefined ? key : interpolate(template, vars);
}

/** True when `key` exists in both languages. */
export function hasKey(key: string): boolean {
  const parts = splitKey(key);
  if (!parts) return false;
  return (['es', 'en'] as const).every((l) => Object.prototype.hasOwnProperty.call(resources[l][parts.ns], parts.key));
}
