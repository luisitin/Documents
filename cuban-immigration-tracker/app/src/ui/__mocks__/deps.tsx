/**
 * Jest manual mock of `@/ui/deps` (activated by `jest.mock('@/ui/deps')` in app/__tests__/ui-*).
 *
 * A test-only stand-in for the WP6 hooks, built on the real @caa/i18n-core `translate` and
 * `createFmt`, so kit tests check the real locale strings in both languages without depending on
 * WP6's providers (07 §5 Wave 3). Never imported by app code; Metro never bundles it.
 *
 * The data is the bundled sample snapshot (app/src/data/sample, WP5) — labelled sample data, not
 * live data.
 */
import { useSyncExternalStore } from 'react';
import type { DataStatus, Lang, Manifest } from '@caa/data-schemas';
import { createFmt, translate, type I18nKey } from '@caa/i18n-core';
import type { ThemeSetting } from '../themeName';

const sampleManifest = require('../../data/sample/manifest.json') as Manifest;

interface FakeState {
  lang: Lang;
  theme: ThemeSetting;
  status: DataStatus;
  manifest: Manifest;
  artifactBuiltAt?: string;
}

const initial = (): FakeState => ({ lang: 'es', theme: 'system', status: 'sample', manifest: sampleManifest });

let state: FakeState = initial();
const listeners = new Set<() => void>();
const emit = () => {
  for (const l of listeners) l();
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const snapshot = () => state;

/** Test control surface (import from '@/ui/deps' after jest.mock; typed via `fakeDeps`). */
export const __fake = {
  reset(): void {
    state = initial();
    emit();
  },
  set(patch: Partial<FakeState>): void {
    state = { ...state, ...patch };
    emit();
  },
  get(): FakeState {
    return state;
  },
};

export function useLang() {
  const s = useSyncExternalStore(subscribe, snapshot, snapshot);
  return {
    lang: s.lang,
    setLang(l: Lang) {
      __fake.set({ lang: l });
    },
    t: (key: I18nKey, vars?: Record<string, string | number>) => translate(s.lang, key, vars),
    fmt: createFmt(s.lang),
  };
}

export function useSettings() {
  const s = useSyncExternalStore(subscribe, snapshot, snapshot);
  return {
    settings: {
      lang: s.lang,
      theme: s.theme,
      onboardingDone: true,
      disclaimerVersion: 1,
      discreet: false,
      notifications: { enabled: false, dataMonths: false },
    },
    update(patch: { lang?: Lang; theme?: ThemeSetting }) {
      __fake.set({ ...(patch.lang ? { lang: patch.lang } : {}), ...(patch.theme ? { theme: patch.theme } : {}) });
    },
  };
}

export function useData() {
  const s = useSyncExternalStore(subscribe, snapshot, snapshot);
  return {
    status: s.status,
    manifest: s.manifest,
    asOf: {
      latestOfficialMonth: s.manifest.latestOfficialMonth,
      dataChangedAt: s.manifest.dataChangedAt,
      ...(s.artifactBuiltAt ? { artifactBuiltAt: s.artifactBuiltAt } : {}),
    },
    refreshing: false,
    refresh: async () => {},
  };
}
