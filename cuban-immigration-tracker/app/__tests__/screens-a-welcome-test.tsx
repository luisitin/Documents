/**
 * WP8a acceptance — S0 Welcome (00 S0): language first (device locale preselected, applied at
 * once and persisted), then the three cards, then "Entendido" → Home and "Configurar mi caso" →
 * the case form. The welcome itself has the header with the language button and the data chip.
 */
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { kv } from '@/storage/kv';
import { reloadCases } from '@/storage/cases';
import { getSettings, reloadSettings, SETTINGS_KEY } from '@/storage/settings';
import { T0, offlineFetch, screenRoutes } from '@/features/home/testing/harness';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'es-US', languageCode: 'es' }] }));

beforeEach(async () => {
  jest.spyOn(Date, 'now').mockReturnValue(T0);
  globalThis.fetch = offlineFetch() as unknown as typeof fetch;
  await act(async () => {
    kv.clear('caa:');
    reloadSettings();
    reloadCases();
  });
});
afterEach(() => jest.restoreAllMocks());

describe('Welcome (S0)', () => {
  it('opens on first launch with the device language preselected, switches language at once and persists it', async () => {
    expect(getSettings().onboardingDone).toBe(false);
    const r = await renderRouter(screenRoutes(), { initialUrl: '/' });
    await waitFor(() => expect(r.getPathname()).toBe('/welcome')); // WP6 tab layout, native first launch
    expect(screen.getByTestId('screen-welcome')).toBeTruthy();
    expect(screen.getByTestId('welcome-lang-es').props.accessibilityState).toEqual(expect.objectContaining({ checked: true }));
    expect(screen.getByText('Primero, elija su idioma')).toBeTruthy();
    expect(screen.getByTestId('lang-toggle')).toBeTruthy();
    expect(screen.getByTestId('data-status')).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('welcome-lang-en'));
    });
    expect(screen.getByText('First, choose your language')).toBeTruthy();
    expect(JSON.parse(kv.get(SETTINGS_KEY) ?? '{}').lang).toBe('en');
    await act(async () => {
      await fireEvent.press(screen.getByTestId('welcome-continue'));
    });
    expect(screen.getByText('An independent, unofficial tool. We are not USCIS.')).toBeTruthy();
    expect(screen.getByText('Statistical estimates from public data; not legal advice.')).toBeTruthy();
    expect(screen.getByText(/^Your data stays on your phone/)).toBeTruthy();
    expect(screen.getByTestId('disclaimer')).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('welcome-ok'));
    });
    await waitFor(() => expect(r.getPathname()).toBe('/'));
    expect(getSettings().onboardingDone).toBe(true);
    expect(getSettings().disclaimerVersion).toBeGreaterThan(0);
    expect(screen.getByText('Cuban Adjustment: what USCIS is doing')).toBeTruthy();
  });

  it('"Configurar mi caso" goes to the case form', async () => {
    const r = await renderRouter(screenRoutes(), { initialUrl: '/welcome' });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('welcome-continue'));
    });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('welcome-setup'));
    });
    await waitFor(() => expect(r.getPathname()).toBe('/case/edit'));
    expect(getSettings().onboardingDone).toBe(true);
  });
});
