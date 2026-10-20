/**
 * @caa/i18n-core — contract v1 STUBS (07-implementation-plan.md §6.0; written by WP1 in the
 * `contract: data-schemas v1` commit under declared ownership exception 2). WP4 owns this package
 * from now on: `resources` (merged locales/{es,en}/<namespace>.json), `createFmt` (02 §9, no `Intl`
 * in the output path, I18N-2), `probWord` (04 §8 thresholds) and `localize`.
 *
 * Pure: imports only `@caa/data-schemas` types (ARCH-1).
 */
import type { ISODate, Lang, Localized, YearMonth } from '@caa/data-schemas';

/** 02 §1: the two app languages; Spanish is first-class. Defined in @caa/data-schemas. */
export type { Lang };

/** 07 §6.0 / I18N-3: locale namespaces, one owning WP each. */
export type Namespace =
  | 'common' | 'ui' | 'home' | 'case' | 'estimate' | 'peers' | 'ead' | 'remedies'
  | 'offices' | 'alerts' | 'more' | 'method' | 'notifications' | 'welcome';

export const NAMESPACES: readonly Namespace[] = [
  'common', 'ui', 'home', 'case', 'estimate', 'peers', 'ead', 'remedies',
  'offices', 'alerts', 'more', 'method', 'notifications', 'welcome',
] as const;

/** `namespace:key` (07 §6.0). */
export type I18nKey = `${Namespace}:${string}`;

/** 02 §9 deterministic formatter (contract v1). */
export interface Fmt {
  int(n: number): string; dec(n: number, dp: number): string; pct(p: number): string; date(d: ISODate): string;
  month(ym: YearMonth): string; monthLong(ym: YearMonth): string; relative(hours: number): string;
}

function notImplemented(name: string, ...args: unknown[]): never {
  void args;
  throw new Error(`@caa/i18n-core.${name}: not implemented (contract v1 stub; WP4 implements it)`);
}

const emptyNamespaces = (): Record<Namespace, Record<string, string>> =>
  Object.fromEntries(NAMESPACES.map((n) => [n, {}])) as Record<Namespace, Record<string, string>>;

/** Merged locale resources. Stub: every namespace is empty until WP4 lands the locale files. */
export const resources: Record<Lang, Record<Namespace, Record<string, string>>> = { es: emptyNamespaces(), en: emptyNamespaces() };

/** 02 §9: `createFmt(lang)`; there is no language-less fmt. */
export function createFmt(lang: Lang): Fmt {
  return notImplemented('createFmt', lang);
}

/** 04 §8 item 2 thresholds: < 5 % · 5–20 % · 20–50 % · 50–80 % · > 80 %. */
export function probWord(p: number, lang: Lang): string {
  return notImplemented('probWord', p, lang);
}

/** Picks one side of a data-file `Localized` (02 §1). */
export function localize(l: Localized, lang: Lang): string {
  return notImplemented('localize', l, lang);
}
