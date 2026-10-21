/**
 * `useLang()` (07 §6.0): the current language, the runtime switch, `t` and the deterministic
 * formatter.
 *
 * - `t(key, vars)` takes `namespace:key` (`I18nKey`) and single-brace `{var}` placeholders; pass
 *   numbers already formatted with `fmt` (07 §8 "write numbers with fmt only").
 * - `fmt = createFmt(lang)` (02 §9; ADR I18N-2): numbers, percentages, dates, months and relative
 *   times switch with the language, with no `Intl`.
 * - `setLang(l)` persists, calls `i18n.changeLanguage` and reschedules every notification
 *   (07 WP6: "emits to the notification reschedule").
 */
import { useCallback, useMemo } from 'react';
import type { Lang } from '@caa/data-schemas';
import { createFmt, type Fmt, type I18nKey } from '@caa/i18n-core';
import { useSettings } from '@/storage/settings';
import { i18n, setAppLang } from './instance';

export type TFunction = (key: I18nKey, vars?: Record<string, string | number>) => string;

/** A `t` bound to one language (outside React: notification text, share text, tests). */
export function tFor(lang: Lang): TFunction {
  return (key, vars) => i18n.t(key, { ...(vars ?? {}), lng: lang }) as string;
}

export function useLang(): { lang: Lang; setLang(l: Lang): void; t: TFunction; fmt: Fmt } {
  const { settings } = useSettings();
  const lang = settings.lang;
  const t = useMemo(() => tFor(lang), [lang]);
  const fmt = useMemo(() => createFmt(lang), [lang]);
  const setLang = useCallback((l: Lang) => setAppLang(l), []);
  return { lang, setLang, t, fmt };
}
