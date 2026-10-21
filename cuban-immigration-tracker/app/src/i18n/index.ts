/**
 * `@/i18n` (07 §6.0 `useLang()`; ADR I18N-3). Importing this module initialises the app's
 * i18next instance synchronously (see `./instance`); the root layout imports it first.
 */
export { i18n, setAppLang } from './instance';
export { tFor, useLang } from './useLang';
export type { TFunction } from './useLang';
export { default } from './instance';
