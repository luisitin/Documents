/**
 * Review round 2 regression: cited-source labels switch language (owner requirement 1; 02 §1).
 * Curated labels carried English dates ("(June 12, 2026)") that stayed English in the Spanish UI;
 * `sourceLabel` formats them with the reader's `fmt`. Runs on the frozen bundled SAMPLE snapshot
 * (labelled sample data), today = 2026-10-20.
 */
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { createFmt } from '@caa/i18n-core';
import { kv } from '@/storage/kv';
import { reloadCases } from '@/storage/cases';
import { reloadSettings, updateSettings } from '@/storage/settings';
import { sourceLabel } from '@/features/home/shared';
import { T0, offlineFetch, screenRoutes } from '@/features/home/testing/harness';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories must be synchronous
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'es-US', languageCode: 'es' }] }));

const es = createFmt('es');
const en = createFmt('en');

describe('sourceLabel', () => {
  it('re-formats a trailing English day or month date in the reader language', () => {
    expect(sourceLabel({ label: 'USCIS, PM-602-0199 (May 21, 2026)' }, 'es', es)).toBe(`USCIS, PM-602-0199 (${es.date('2026-05-21')})`);
    expect(sourceLabel({ label: 'USCIS, PM-602-0199 (May 21, 2026)' }, 'en', en)).toBe(`USCIS, PM-602-0199 (${en.date('2026-05-21')})`);
    expect(sourceLabel({ label: 'Cyrus Mehta blog: Dorcas v. USCIS (June 2026)' }, 'es', es)).toBe('Cyrus Mehta blog: Dorcas v. USCIS (junio de 2026)');
    expect(sourceLabel({ label: 'Wolfsdorf: Dorcas on appeal (Aug 2026)' }, 'es', es)).toBe(`Wolfsdorf: Dorcas on appeal (${es.monthLong('2026-08')})`);
    expect(sourceLabel({ label: 'CiberCuba: solo 139 cubanos (Oct 20, 2026)' }, 'es', es)).toBe('CiberCuba: solo 139 cubanos (20 oct 2026)');
  });

  it('keeps labels without a parseable date, and prefers a Localized label and a date field', () => {
    expect(sourceLabel({ label: 'First Circuit docket 26-1703 (Justia)' }, 'es', es)).toBe('First Circuit docket 26-1703 (Justia)');
    expect(sourceLabel({ label: 'X (Foo 12, 2026)' }, 'es', es)).toBe('X (Foo 12, 2026)');
    expect(sourceLabel({ label: { es: 'Alerta de USCIS', en: 'USCIS alert' }, date: '2026-08-28' }, 'es', es)).toBe(`Alerta de USCIS (${es.date('2026-08-28')})`);
    expect(sourceLabel({ label: { es: 'Alerta de USCIS', en: 'USCIS alert' }, date: '2026-08-28' }, 'en', en)).toBe(`USCIS alert (${en.date('2026-08-28')})`);
  });
});

describe('alert detail sources', () => {
  beforeEach(async () => {
    jest.spyOn(Date, 'now').mockReturnValue(T0);
    globalThis.fetch = offlineFetch() as unknown as typeof fetch;
    await act(async () => {
      kv.clear('caa:');
      reloadSettings();
      reloadCases();
      updateSettings({ lang: 'es', theme: 'light', onboardingDone: true });
    });
  });
  afterEach(() => jest.restoreAllMocks());

  it('shows the source dates in Spanish, and in English after the language toggle', async () => {
    await renderRouter(screenRoutes(), { initialUrl: '/alerts/2026-06-05-dorcas-vacatur' });
    let page = JSON.stringify(screen.toJSON());
    expect(page).toContain(`(${es.date('2026-06-12')})`);
    expect(page).not.toContain('June 12, 2026');
    await act(async () => {
      await fireEvent.press(screen.getByTestId('lang-toggle'));
    });
    page = JSON.stringify(screen.toJSON());
    expect(page).toContain(`(${en.date('2026-06-12')})`);
  });

  it('shows the myth source dates in the reader language', async () => {
    await renderRouter(screenRoutes(), { initialUrl: '/more/myths' });
    const page = JSON.stringify(screen.toJSON());
    expect(page).not.toMatch(/\((Jan|Feb|Mar|Apr|May|June?|July?|Aug|Sept?|Oct|Nov|Dec)[a-z]*\.? (\d{1,2}, )?\d{4}\)/);
    expect(page).toContain(`(${es.date('2026-05-21')})`);
  });
});
