/**
 * WP8a acceptance — the LIVE-LIKE variant (07 WP8a; Prove §9 "live" variant): the data layer
 * fetches a manifest whose latest month and canary differ from the frozen sample, and the
 * assertions are DERIVED from that manifest with the same `createFmt` the app uses
 * (`fmt.month(manifest.latestOfficialMonth)`, `fmt.pct(manifest.canary.pWithin12)`), never
 * literals. A new USCIS month therefore never breaks these tests while the code is correct.
 */
import { act, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { createFmt } from '@caa/i18n-core';
import { kv } from '@/storage/kv';
import { reloadCases } from '@/storage/cases';
import { reloadSettings, updateSettings } from '@/storage/settings';
import { T0, liveLikeManifest, servingFetch, screenRoutes } from '@/features/home/testing/harness';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'es-US', languageCode: 'es' }] }));

const manifest = liveLikeManifest();
let server: ReturnType<typeof servingFetch>;

beforeEach(async () => {
  jest.spyOn(Date, 'now').mockReturnValue(T0);
  server = servingFetch(manifest);
  globalThis.fetch = server as unknown as typeof fetch;
  await act(async () => {
    kv.clear('caa:');
    reloadSettings();
    reloadCases();
    updateSettings({ lang: 'es', theme: 'light', onboardingDone: true });
  });
});
afterEach(() => jest.restoreAllMocks());

const chipLabel = () => String(screen.getByTestId('data-status').props.accessibilityLabel);

describe.each(['es', 'en'] as const)('live-like data (%s)', (lang) => {
  const fmt = createFmt(lang);

  it('Home shows the fetched manifest month in its status, and "live" instead of "sample"', async () => {
    await act(async () => updateSettings({ lang }));
    await renderRouter(screenRoutes(), { initialUrl: '/' });
    await waitFor(() => expect(chipLabel()).toContain(fmt.month(manifest.latestOfficialMonth)));
    expect(chipLabel()).toContain(lang === 'es' ? 'En vivo' : 'Live');
    expect(chipLabel()).not.toContain(lang === 'es' ? 'Muestra' : 'Sample');
    expect(screen.queryByTestId('banner-sample_data')).toBeNull();
    expect(server.calls.some((u) => u.endsWith('/manifest.json'))).toBe(true);
    // The file shas are unchanged, so only the manifest was requested (01 §3 step 7).
    expect(server.calls.every((u) => u.endsWith('/manifest.json'))).toBe(true);
  });

  it('Method shows the canary of the fetched manifest, formatted by fmt', async () => {
    await act(async () => updateSettings({ lang }));
    await renderRouter(screenRoutes(), { initialUrl: '/more/method' });
    await waitFor(() => expect(chipLabel()).toContain(fmt.month(manifest.latestOfficialMonth)));
    const canary = String(screen.getByTestId('method-canary').props.children);
    expect(canary).toContain(fmt.pct(manifest.canary.pWithin12));
    expect(canary).toContain(fmt.month(manifest.latestOfficialMonth));
  });
});
