/**
 * WP8a acceptance — loading, empty and error states (00 §5.1 common states and banners), with the
 * data layer's value overridden per test (the real WP6 `useData` underneath, so everything else is
 * the real app). Error = never blank: the screen keeps the data and says why (00 §5.1).
 */
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import type { DataContextValue } from '@/data/useData';
import { kv } from '@/storage/kv';
import { reloadCases } from '@/storage/cases';
import { reloadSettings, updateSettings } from '@/storage/settings';
import { T0, offlineFetch, screenRoutes } from '@/features/home/testing/harness';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'es-US', languageCode: 'es' }] }));

let mockOverride: ((v: DataContextValue) => DataContextValue) | null = null;
jest.mock('@/data/useData', () => {
  const actual = jest.requireActual('@/data/useData');
  return {
    ...actual,
    useData: () => {
      const v = actual.useData();
      return mockOverride ? mockOverride(v) : v;
    },
  };
});

beforeEach(async () => {
  mockOverride = null;
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

describe('loading state', () => {
  it('first launch: a note while the first check runs over the bundled sample', async () => {
    mockOverride = (v) => ({ ...v, status: 'sample', refreshing: true, asOf: { ...v.asOf, fetchedAt: null } });
    await renderRouter(screenRoutes(), { initialUrl: '/' });
    expect(screen.getByTestId('data-loading').props.children).toBe('Buscando datos más recientes…');
    expect(screen.getByTestId('home-pulse')).toBeTruthy(); // the sample still renders underneath
  });
});

describe('error states (never blank)', () => {
  it('a failed update keeps the saved data and says so, dismissibly', async () => {
    mockOverride = (v) => ({ ...v, status: 'cached', notice: { kind: 'update_failed', at: '2026-10-19T08:00:00Z' } });
    await renderRouter(screenRoutes(), { initialUrl: '/offices' });
    expect(screen.getByText('No pudimos actualizar; mostramos los datos guardados del 19 oct 2026.')).toBeTruthy();
    expect(screen.getByTestId('offices-list')).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByText('Cerrar'));
    });
    expect(screen.queryByTestId('banner-update_failed')).toBeNull();
  });

  it('an incompatible manifest shows "Actualice la app" and keeps the old data', async () => {
    mockOverride = (v) => ({ ...v, notice: { kind: 'app_too_old' } });
    await renderRouter(screenRoutes(), { initialUrl: '/alerts' });
    expect(screen.getByText('Actualice la app para ver los datos nuevos.')).toBeTruthy();
    expect(screen.getByTestId('alerts-list')).toBeTruthy();
  });

  it('the data guards of 00 §5.1 show their banners', async () => {
    mockOverride = (v) => ({
      ...v,
      guards: [{ id: 'T20a', months: ['2026-08'] }, { id: 'T20b', months: ['2026-07', '2026-08'] }, { id: 'pipeline_late' }, { id: 'qa_degraded' }],
      asOf: { ...v.asOf, lastCheckedAt: '2026-10-01T00:00:00Z' },
    });
    await renderRouter(screenRoutes(), { initialUrl: '/more/method' });
    expect(screen.getByText('USCIS no ha publicado datos mensuales nuevos desde ago 2026.')).toBeTruthy();
    expect(screen.getByText('Datos mensuales de jul 2026, ago 2026 aún sin contraste trimestral.')).toBeTruthy();
    expect(screen.getByText('La revisión automática de datos está atrasada (19 días).')).toBeTruthy();
    expect(screen.getByText('Datos oficiales en revisión; mostramos la última versión verificada.')).toBeTruthy();
  });

  it('web artifact older than 35 days', async () => {
    mockOverride = (v) => ({ ...v, status: 'published', guards: [{ id: 'artifact_old' }], asOf: { ...v.asOf, artifactBuiltAt: '2026-09-01T00:00:00Z' } });
    await renderRouter(screenRoutes(), { initialUrl: '/' });
    expect(screen.getByText('Esta página se publicó hace 49 días; la app móvil puede tener datos más nuevos.')).toBeTruthy();
    expect(String(screen.getByTestId('data-status').props.accessibilityLabel)).toContain('Publicado 1 sept 2026');
  });
});

describe('empty states', () => {
  it('Home with no monthly rows', async () => {
    mockOverride = (v) => ({ ...v, national: { ...v.national, rows: [] } });
    await renderRouter(screenRoutes(), { initialUrl: '/' });
    expect(screen.getByTestId('home-empty')).toBeTruthy();
  });

  it('Alerts with no alerts and no litigation', async () => {
    mockOverride = (v) => ({ ...v, alerts: { alerts: [] }, policy: { ...v.policy, litigation: [] } });
    await renderRouter(screenRoutes(), { initialUrl: '/alerts' });
    expect(screen.getByText('Sin alertas nuevas desde 20 oct 2026.')).toBeTruthy();
    expect(screen.getByTestId('litigation-empty')).toBeTruthy();
  });

  it('Offices with no offices', async () => {
    mockOverride = (v) => ({ ...v, offices: { ...v.offices, offices: [] } });
    await renderRouter(screenRoutes(), { initialUrl: '/offices' });
    expect(screen.getByTestId('offices-empty')).toBeTruthy();
  });

  it('Myths with no entries', async () => {
    mockOverride = (v) => ({ ...v, content: { ...v.content, myths: [] } });
    await renderRouter(screenRoutes(), { initialUrl: '/more/myths' });
    expect(screen.getByTestId('myths-empty')).toBeTruthy();
    expect(screen.getByTestId('myths-scam')).toBeTruthy(); // the anti-scam card is permanent
  });
});
