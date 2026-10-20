/**
 * Locale namespaces and key types (07-implementation-plan.md §6.0, ADR I18N-3).
 *
 * Every namespace is one pair of files `locales/{es,en}/<namespace>.json` with exactly one owning
 * WP: `common` → WP4, `ui` → WP7, `notifications` → WP6, the screen namespaces → WP8a/WP8b
 * (07 §1 I18N-3, §2). `scripts/check-i18n.mjs` keeps its own copy of this list; a test asserts
 * the two are identical.
 */

/** 07 §6.0 / I18N-3: locale namespaces, one owning WP each. */
export type Namespace =
  | 'common' | 'ui' | 'home' | 'case' | 'estimate' | 'peers' | 'ead' | 'remedies'
  | 'offices' | 'alerts' | 'more' | 'method' | 'notifications' | 'welcome';

/** The 14 namespaces of 07 §2, in the order of the layout table. */
export const NAMESPACES: readonly Namespace[] = [
  'common', 'ui', 'home', 'case', 'estimate', 'peers', 'ead', 'remedies',
  'offices', 'alerts', 'more', 'method', 'notifications', 'welcome',
] as const;

/** Which WP writes each namespace (07 §1 I18N-3). Documentation for tooling and reviewers. */
export const NAMESPACE_OWNERS: Readonly<Record<Namespace, string>> = {
  common: 'WP4', ui: 'WP7', notifications: 'WP6',
  home: 'WP8a', offices: 'WP8a', alerts: 'WP8a', more: 'WP8a', method: 'WP8a', welcome: 'WP8a',
  case: 'WP8b', estimate: 'WP8b', peers: 'WP8b', ead: 'WP8b', remedies: 'WP8b',
};

/**
 * `namespace:key` (07 §6.0). Keys are flat: a dot inside a key is part of the key, not a path
 * (configure i18next with `keySeparator: false`, see `I18NEXT_FORMAT_OPTIONS`).
 */
export type I18nKey = `${Namespace}:${string}`;

/** The separator between namespace and key in an `I18nKey`. */
export const NS_SEPARATOR = ':';

/** True when `ns` is one of the 14 namespaces. */
export function isNamespace(ns: string): ns is Namespace {
  return (NAMESPACES as readonly string[]).includes(ns);
}

/**
 * Splits `"common:disclaimer.full"` into `{ ns: 'common', key: 'disclaimer.full' }`.
 * Returns `null` when the namespace is unknown or the key part is empty.
 */
export function splitKey(k: string): { ns: Namespace; key: string } | null {
  const i = k.indexOf(NS_SEPARATOR);
  if (i <= 0) return null;
  const ns = k.slice(0, i);
  const key = k.slice(i + 1);
  if (!isNamespace(ns) || key.length === 0) return null;
  return { ns, key };
}
