/**
 * Jest harness for the WP8a screen tests (`app/__tests__/screens-a-*`). Test-only: nothing in the
 * app imports this file, so Metro never bundles it.
 *
 * - `screenRoutes()`: the real root layout, `+not-found`, tab layout and every WP8a route, plus
 *   stand-ins for WP8b's case routes (so these tests never depend on parallel work).
 * - `offlineFetch()`: every request fails → the app stays on the bundled SAMPLE ("Muestra").
 * - `servingFetch(manifest)`: serves a live-like manifest with the bundled files (same sha256), so
 *   the data layer reports "live" with that manifest (07 WP8a "live-like" variant).
 *
 * The bundled sample is the frozen golden snapshot (02 §2; labelled sample data, never presented
 * as live).
 */
import { View } from 'react-native';
import { Stack } from 'expo-router';
import type { renderRouter } from 'expo-router/testing-library';
import type { Manifest } from '@caa/data-schemas';

/** The route-map argument of `renderRouter`. */
export type RouteMap = Exclude<Parameters<typeof renderRouter>[0], undefined>;

/* eslint-disable @typescript-eslint/no-require-imports */
const sample = {
  manifest: require('../../../data/sample/manifest.json') as Manifest,
  national: require('../../../data/sample/national.json') as unknown,
  quarterly: require('../../../data/sample/quarterly.json') as unknown,
  offices: require('../../../data/sample/offices.json') as unknown,
  policy: require('../../../data/sample/policy.json') as unknown,
  alerts: require('../../../data/sample/alerts.json') as unknown,
  content: require('../../../data/sample/content.json') as unknown,
  params: require('../../../data/sample/params.json') as unknown,
};

export const SAMPLE_MANIFEST: Manifest = sample.manifest;

/** 2026-10-20T12:00:00Z — the reference "today" (04 §9.1; Prove P6 fixed clock). */
export const T0 = Date.parse('2026-10-20T12:00:00Z');

const stub = (id: string) =>
  function Stub() {
    return <View testID={id} />;
  };
const caseStack = {
  default: function CaseStack() {
    return <Stack screenOptions={{ headerShown: false }} />;
  },
  unstable_settings: { anchor: 'index' },
};

/** The route map for `renderRouter` (expo-router/testing-library). */
export function screenRoutes(): RouteMap {
  return {
    _layout: require('../../../app/_layout'),
    '+not-found': require('../../../app/+not-found'),
    '(tabs)/_layout': require('../../../app/(tabs)/_layout'),
    welcome: require('../../../app/welcome'),
    '(tabs)/index': require('../../../app/(tabs)/index'),
    '(tabs)/case/_layout': caseStack,
    '(tabs)/case/index': stub('screen-case'),
    '(tabs)/case/edit': stub('screen-case-edit'),
    '(tabs)/case/ead': stub('screen-case-ead'),
    '(tabs)/offices/_layout': require('../../../app/(tabs)/offices/_layout'),
    '(tabs)/offices/index': require('../../../app/(tabs)/offices/index'),
    '(tabs)/offices/[code]': require('../../../app/(tabs)/offices/[code]'),
    '(tabs)/alerts/_layout': require('../../../app/(tabs)/alerts/_layout'),
    '(tabs)/alerts/index': require('../../../app/(tabs)/alerts/index'),
    '(tabs)/alerts/[id]': require('../../../app/(tabs)/alerts/[id]'),
    '(tabs)/more/_layout': require('../../../app/(tabs)/more/_layout'),
    '(tabs)/more/index': require('../../../app/(tabs)/more/index'),
    '(tabs)/more/settings': require('../../../app/(tabs)/more/settings'),
    '(tabs)/more/method': require('../../../app/(tabs)/more/method'),
    '(tabs)/more/myths': require('../../../app/(tabs)/more/myths'),
    '(tabs)/more/glossary': require('../../../app/(tabs)/more/glossary'),
    '(tabs)/more/about': require('../../../app/(tabs)/more/about'),
    '(tabs)/more/privacy': require('../../../app/(tabs)/more/privacy'),
  } as RouteMap;
}
/* eslint-enable @typescript-eslint/no-require-imports */

interface FakeResponse {
  ok: boolean;
  status: number;
  headers: { get(k: string): string | null };
  text(): Promise<string>;
}

const noHeaders = { get: () => null };

/** Every request fails (no network): the app keeps the bundled sample. */
export function offlineFetch(): (url: string) => Promise<FakeResponse> {
  return () => Promise.reject(new Error('offline (test)'));
}

/**
 * A live-like data source: the given manifest plus the bundled files, matched by file name.
 * Requests are recorded in `calls`.
 */
export function servingFetch(manifest: unknown): ((url: string) => Promise<FakeResponse>) & { calls: string[] } {
  const calls: string[] = [];
  const f = async (url: string): Promise<FakeResponse> => {
    calls.push(url);
    const name = (url.split('/').pop() ?? '').replace(/\?.*$/, '').replace(/\.json$/, '');
    const body = name === 'manifest' ? manifest : (sample as Record<string, unknown>)[name];
    if (body === undefined) return { ok: false, status: 404, headers: noHeaders, text: async () => '' };
    return { ok: true, status: 200, headers: noHeaders, text: async () => JSON.stringify(body) };
  };
  return Object.assign(f, { calls });
}

/**
 * A live-like manifest: the sample manifest without the sample origin, with a different latest
 * month and canary, checked "now" (so the pipeline-late banner stays off).
 */
export function liveLikeManifest(over: Partial<Manifest> = {}): Manifest {
  const m = JSON.parse(JSON.stringify(SAMPLE_MANIFEST)) as Manifest & { origin?: string };
  delete m.origin;
  m.qa = { ...m.qa, notes: [] };
  m.lastCheckedAt = '2026-10-20T06:00:00Z';
  m.dataChangedAt = '2026-10-20T06:00:00Z';
  m.latestOfficialMonth = '2026-09';
  m.canary = { ...m.canary, pWithin12: 0.1234, q50: 48 };
  return { ...m, ...over };
}
