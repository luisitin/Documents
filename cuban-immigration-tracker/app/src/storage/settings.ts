/**
 * Settings (`caa:v1:settings`; 02-data-model.md §6; 07 §6.0 `Settings` / `useSettings()`).
 *
 * - `lang` defaults to the device locale: `es*` → es, anything else → en (00 S0 step 1; owner
 *   requirement 1). The user's choice is persisted and restored on the next launch.
 * - `theme` is honoured on native only; on web the host's `data-theme` wins (WP7 `useThemeName`).
 * - `notifications` are off until the user opts in from Settings (00 §7: never ask at launch).
 * - The stored JSON is zod-validated on read; an invalid value is removed (02 §6) and defaults
 *   are used.
 */
import { useCallback, useSyncExternalStore } from 'react';
import { getLocales } from 'expo-localization';
import { LangSchema, type Lang } from '@caa/data-schemas';
import { langFromLocale } from '@caa/i18n-core';
import { z } from 'zod';
import { kv } from './kv';
import { readJson, writeJson } from './kvCore';
import { createStore } from './store';

/** 07 §6.0 `Settings` (02 §6). */
export type Settings = {
  lang: Lang;
  theme: 'system' | 'light' | 'dark';
  onboardingDone: boolean;
  disclaimerVersion: number;
  discreet: boolean;
  notifications: { enabled: boolean; dataMonths: boolean };
};

/** Bump when the disclaimer text changes materially, so it is shown again (00 §8). */
export const DISCLAIMER_VERSION = 1;

export const SETTINGS_KEY = 'caa:v1:settings' as const;

const SettingsSchema = z.object({
  lang: LangSchema,
  theme: z.enum(['system', 'light', 'dark']),
  onboardingDone: z.boolean(),
  disclaimerVersion: z.number().int().nonnegative(),
  discreet: z.boolean(),
  notifications: z.object({ enabled: z.boolean(), dataMonths: z.boolean() }),
});

/** The device language (00 S0: es* → es, else en). Never throws. */
export function deviceLang(): Lang {
  try {
    const first = getLocales()[0];
    return langFromLocale(first?.languageTag ?? first?.languageCode ?? null);
  } catch {
    return 'es';
  }
}

export function defaultSettings(lang: Lang = deviceLang()): Settings {
  return {
    lang,
    theme: 'system',
    onboardingDone: false,
    disclaimerVersion: 0,
    discreet: false,
    notifications: { enabled: false, dataMonths: false },
  };
}

function load(): Settings {
  const stored = readJson(kv, SETTINGS_KEY, (v) => {
    const r = SettingsSchema.safeParse(v);
    return r.success ? (r.data as Settings) : null;
  });
  return stored ?? defaultSettings();
}

const store = createStore<Settings>(load());

// Native hydrates asynchronously: re-read once the mirror is complete. A value the user already
// changed in memory before that point is kept (the KV core never lets storage overwrite it).
kv.ready.then(() => store.set(load()));

/** Current settings (synchronous). */
export function getSettings(): Settings {
  return store.get();
}

/** Applies a patch, persists it and notifies subscribers. Nested objects are replaced whole. */
export function updateSettings(patch: Partial<Settings>): void {
  const next = { ...store.get(), ...patch };
  writeJson(kv, SETTINGS_KEY, next);
  store.set(next);
}

/** Subscribe to settings changes (`(next, prev)`); returns the unsubscribe function. */
export function subscribeSettings(listener: (next: Settings, prev: Settings) => void): () => void {
  return store.subscribe(listener);
}

/**
 * After "Borrar mis datos" (`kv.clear('caa:')`): back to defaults in memory, nothing persisted.
 * The current language is kept for the rest of the session so the screen does not switch
 * language under the user's finger; the next launch uses the device default again.
 */
export function resetSettingsAfterClear(): void {
  store.set(defaultSettings(store.get().lang));
}

/** Re-reads settings from the KV (tests; after an external change). */
export function reloadSettings(): void {
  store.set(load());
}

/** 07 §6.0 `useSettings()`. */
export function useSettings(): { settings: Settings; update(patch: Partial<Settings>): void } {
  const settings = useSyncExternalStore(store.subscribe, store.get, store.get);
  const update = useCallback((patch: Partial<Settings>) => updateSettings(patch), []);
  return { settings, update };
}
