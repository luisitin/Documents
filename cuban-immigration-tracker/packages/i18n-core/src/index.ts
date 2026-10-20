/**
 * @caa/i18n-core — WP0 SKELETON (07-implementation-plan.md §2, declared ownership exception 2).
 *
 * WP1 writes the §6.0 stubs and WP4 implements `resources`, `createFmt`, `probWord`, `localize`
 * (02-data-model.md §9; I18N-1…3). Pure: no `Intl` in the output path (I18N-2).
 */

/** 02 §1: the two app languages; Spanish is first-class. */
export type Lang = 'es' | 'en';

/** 07 §6.0 / I18N-3: locale namespaces, one owning WP each. */
export type Namespace =
  | 'common' | 'ui' | 'home' | 'case' | 'estimate' | 'peers' | 'ead' | 'remedies'
  | 'offices' | 'alerts' | 'more' | 'method' | 'notifications' | 'welcome';

export const NAMESPACES: readonly Namespace[] = [
  'common', 'ui', 'home', 'case', 'estimate', 'peers', 'ead', 'remedies',
  'offices', 'alerts', 'more', 'method', 'notifications', 'welcome',
] as const;
