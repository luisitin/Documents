/**
 * WP8a acceptance — S6 Offices on the frozen bundled sample (00 S6):
 * - Cuban-focus offices first, "Ver todas" for the rest, state filters built from the data;
 * - per office: 131A-FAM yardstick labelled as a family-based proxy, inquiry date with the
 *   "≈93 %, según fuentes secundarias" kind chip, humanitarian counts labelled, multiplier with N
 *   and "dato débil" when N < 50;
 * - detail: the crude ETA uses the pinned case-rules formula (07 WP3: receipt 2025-03-15 → MIA
 *   2028-01, HIA 2027-10, KND 2027-10, TAM 2027-07); fewer than two published points → no ETA;
 * - unknown code → not-found card; the back action returns to the tab index.
 * The test case is a synthetic copy of the T15 reference timeline (04 §9.2), never real data.
 */
import { act, fireEvent, renderRouter, screen, waitFor, within } from 'expo-router/testing-library';
import type { CaseTimeline } from '@caa/data-schemas';
import { referenceCase } from '@caa/estimator';
import { kv } from '@/storage/kv';
import { reloadCases, saveCase } from '@/storage/cases';
import { reloadSettings, updateSettings } from '@/storage/settings';
import { T0, offlineFetch, screenRoutes } from '@/features/home/testing/harness';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'es-US', languageCode: 'es' }] }));

const NBSP = ' ';
const testCase = (): CaseTimeline => ({ ...referenceCase(), localId: '0b5c3f0e-1d2a-4c3b-9e8f-7a6b5c4d3e2f', nickname: 'Prueba' });

beforeEach(async () => {
  jest.spyOn(Date, 'now').mockReturnValue(T0);
  globalThis.fetch = offlineFetch() as unknown as typeof fetch;
  await act(async () => {
    kv.clear('caa:');
    reloadSettings();
    reloadCases();
    updateSettings({ lang: 'es', theme: 'light', onboardingDone: true, discreet: false });
  });
});
afterEach(() => jest.restoreAllMocks());

describe('Offices list (S6)', () => {
  it('lists the Cuban-focus offices first, read from the data, with labelled facts', async () => {
    await renderRouter(screenRoutes(), { initialUrl: '/offices' });
    const list = within(screen.getByTestId('offices-list'));
    for (const code of ['MIA', 'HIA', 'KND', 'TAM', 'HOU', 'NYC', 'CHI']) expect(list.getByTestId(`office-row-${code}`)).toBeTruthy();
    expect(list.queryByTestId('office-row-MGA')).toBeNull(); // Montgomery is not a Cuban-focus office
    expect(screen.getByText('Oficinas con más casos cubanos')).toBeTruthy();
    expect(screen.getByTestId('office-inquiry-MIA').props.children).toBe('Fecha de consulta: 17 jun 2023 (publicada el 15 oct 2026).');
    expect(screen.getAllByText('Familiar: la referencia más cercana; no existe categoría de Ajuste Cubano.').length).toBeGreaterThan(5);
    expect(screen.getAllByText('Casos humanitarios: incluye refugiados y asilados, no solo cubanos.').length).toBeGreaterThan(5);
    expect(screen.getByText('abr–jun 2026: pendientes 20,662 · aprobadas 21 · negadas 29')).toBeTruthy();
    // DAL has no 131A-FAM inquiry date in the data → "no disponible", no gate decision.
    expect(screen.getByTestId('office-inquiry-DAL').props.children).toMatch(/^Fecha de consulta no disponible \(/);
  });

  it('filters by state and shows every office with "Ver todas"', async () => {
    await renderRouter(screenRoutes(), { initialUrl: '/offices' });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('offices-state-TX'));
    });
    const tx = within(screen.getByTestId('offices-list'));
    expect(tx.getByTestId('office-row-HOU')).toBeTruthy();
    expect(tx.getByTestId('office-row-DAL')).toBeTruthy();
    expect(tx.queryByTestId('office-row-MIA')).toBeNull();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('offices-toggle-all'));
    });
    expect(screen.getByText('Todas las oficinas (97)')).toBeTruthy();
    expect(within(screen.getByTestId('offices-list')).getByTestId('office-row-MGA')).toBeTruthy();
  });

  it('marks weak multipliers (N < 50) as "dato débil"', async () => {
    await renderRouter(screenRoutes(), { initialUrl: '/offices' });
    expect(screen.getAllByText('dato débil').length).toBeGreaterThan(0);
  });

  it('switches to English with the header toggle', async () => {
    await renderRouter(screenRoutes(), { initialUrl: '/offices' });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('lang-toggle'));
    });
    expect(screen.getByText('USCIS offices')).toBeTruthy();
    expect(screen.getByTestId('office-inquiry-MIA').props.children).toBe('Case-inquiry date: Jun 17, 2023 (published Oct 15, 2026).');
    expect(screen.getAllByText('Offices').length).toBeGreaterThan(0);
  });
});

describe('Office detail (S6 /offices/[code])', () => {
  it.each([
    ['MIA', 'ene 2028'],
    ['HIA', 'oct 2027'],
    ['KND', 'oct 2027'],
    ['TAM', 'jul 2027'],
  ])('%s: the pinned ETA for a receipt of 2025-03-15 is ≈ %s', async (code, month) => {
    await act(async () => {
      expect(saveCase(testCase()).ok).toBe(true);
    });
    const r = await renderRouter(screenRoutes(), { initialUrl: `/offices/${code}` });
    expect(r.getPathname()).toBe(`/offices/${code}`);
    expect(screen.getByTestId(`screen-office-${code}`)).toBeTruthy();
    expect(screen.getByTestId('office-eta-result').props.children).toBe(
      `Si presentó el 15 mar 2025, la fecha de consulta tendría que llegar a ella: ≈ ${month} (cálculo aproximado).`,
    );
    expect(screen.getByTestId('office-trend-table')).toBeTruthy();
    expect(screen.getByTestId('office-history-table')).toBeTruthy();
    expect(screen.getAllByText(`Fecha de consulta (≈93${NBSP}%, según fuentes secundarias)`).length).toBeGreaterThan(0);
  });

  it('with no saved case it asks for a date; with one published point it gives no ETA', async () => {
    await renderRouter(screenRoutes(), { initialUrl: '/offices/MIA' });
    expect(screen.getByTestId('office-eta-result').props.children).toBe('Elija una fecha para hacer el cálculo.');
    await act(async () => {
      expect(saveCase(testCase()).ok).toBe(true);
    });
    await act(async () => {
      await screen.unmount();
    });
    await renderRouter(screenRoutes(), { initialUrl: '/offices/CHI' });
    expect(screen.getByTestId('office-eta-result').props.children).toBe('No hay suficientes publicaciones de la fecha de consulta para calcularlo (1); no podemos decir si ya llegó.');
  });

  it('discreet mode does not prefill the receipt date', async () => {
    await act(async () => {
      expect(saveCase(testCase()).ok).toBe(true);
      updateSettings({ discreet: true });
    });
    await renderRouter(screenRoutes(), { initialUrl: '/offices/MIA' });
    expect(screen.getByTestId('office-eta-result').props.children).toBe('Elija una fecha para hacer el cálculo.');
  });

  it('opens from the list inside the offices tab and the back action returns to the index', async () => {
    const r = await renderRouter(screenRoutes(), { initialUrl: '/offices' });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('office-row-HIA'));
    });
    await waitFor(() => expect(r.getPathname()).toBe('/offices/HIA'));
    expect(screen.getByTestId('tab-offices').props.accessibilityState?.selected).toBe(true);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('back-link'));
    });
    await waitFor(() => expect(r.getPathname()).toBe('/offices'));
    expect(screen.getByTestId('screen-offices')).toBeTruthy();
  });

  it('an unknown code shows the not-found card (codes are read from the data)', async () => {
    const r = await renderRouter(screenRoutes(), { initialUrl: '/offices/ZZZ' });
    expect(screen.getByTestId('office-not-found')).toBeTruthy();
    expect(screen.getByText('No encontramos la oficina «ZZZ» en los datos.')).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('back-link'));
    });
    await waitFor(() => expect(r.getPathname()).toBe('/offices'));
  });
});
