/**
 * The app's i18next instance (01-architecture.md §2 `src/i18n/`; SDK notes §4) over the shared
 * locale resources of `@caa/i18n-core` (ADR I18N-3: `locales/{es,en}/<namespace>.json`).
 *
 * - Keys are `namespace:key` with flat keys and single-brace placeholders
 *   (`I18NEXT_FORMAT_OPTIONS`), so i18next reads the files exactly like the pure `translate()` used
 *   by notifications and tests.
 * - Initialised synchronously (`initAsync: false`) with the stored language (or the device
 *   default), so the very first render is already in the right language.
 * - The language lives in the settings store (`caa:v1:settings.lang`); this module keeps i18next,
 *   and on web `<html lang>`, in sync with it. Formatting never goes through i18next or `Intl`:
 *   `useLang().fmt` is the deterministic `createFmt(lang)` (ADR I18N-2).
 */
import { Platform } from 'react-native';
import { createInstance, type i18n as I18n } from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Lang } from '@caa/data-schemas';
import { I18NEXT_FORMAT_OPTIONS, NAMESPACES, resources } from '@caa/i18n-core';
import { notifications } from '@/notifications';
import { getSettings, subscribeSettings, updateSettings } from '@/storage/settings';

/** i18next resource shape: `{ es: { common: {...}, ui: {...}, ... }, en: {...} }`. */
const i18nextResources = { es: { ...resources.es }, en: { ...resources.en } };

export const i18n: I18n = createInstance({
  resources: i18nextResources,
  lng: getSettings().lang,
  fallbackLng: false,
  supportedLngs: ['es', 'en'],
  ns: [...NAMESPACES],
  defaultNS: 'common',
  initAsync: false,
  returnNull: false,
  ...I18NEXT_FORMAT_OPTIONS,
  interpolation: { ...I18NEXT_FORMAT_OPTIONS.interpolation },
});
void i18n.use(initReactI18next).init();

function syncDocumentLang(lang: Lang): void {
  if (Platform.OS !== 'web') return;
  try {
    const el = (globalThis as { document?: { documentElement?: { lang: string } } }).document?.documentElement;
    if (el) el.lang = lang;
  } catch {
    /* no DOM */
  }
}
syncDocumentLang(getSettings().lang);

// Keep i18next in sync with the settings store (hydration on native, "Borrar mis datos", setLang).
subscribeSettings((next, prev) => {
  if (next.lang === prev.lang) return;
  if (i18n.language !== next.lang) void i18n.changeLanguage(next.lang);
  syncDocumentLang(next.lang);
});

/**
 * Switches the whole app's language at runtime (owner requirement 1): persists the choice,
 * calls `i18n.changeLanguage`, and cancels and reschedules every notification so its text
 * switches too (00 §7). Every `useLang()` consumer re-renders with the new `t` and `fmt`.
 */
export function setAppLang(lang: Lang): void {
  if (getSettings().lang === lang && i18n.language === lang) return;
  updateSettings({ lang });
  if (i18n.language !== lang) void i18n.changeLanguage(lang);
  void notifications.rescheduleAll(lang);
}

export default i18n;
