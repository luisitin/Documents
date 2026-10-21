/**
 * WP8a acceptance — S8 Alerts on the frozen bundled sample (00 S8):
 * - the 12 curated alerts newest first, each with severity, kind, date, "qué significa para
 *   usted", "a quién afecta" and "qué cambió en su estimado";
 * - the litigation table renders from `policy.json` (WP8a acceptance);
 * - "mi caso / todas" uses the active saved case; "Marcar como leídas" persists in the KV;
 * - `/alerts/[id]` shows the sources and the related court case, marks the alert read, and the
 *   back action returns to the tab index; an unknown id shows the not-found card.
 */
import { act, fireEvent, renderRouter, screen, waitFor, within } from 'expo-router/testing-library';
import type { CaseTimeline, PolicyFile } from '@caa/data-schemas';
import { localize } from '@caa/i18n-core';
import { referenceCase } from '@caa/estimator';
import { ALERTS_READ_KEY } from '@/features/alerts/readState';
import { kv } from '@/storage/kv';
import { reloadCases, saveCase } from '@/storage/cases';
import { reloadSettings, updateSettings } from '@/storage/settings';
import { T0, offlineFetch, screenRoutes } from '@/features/home/testing/harness';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'es-US', languageCode: 'es' }] }));

const policy = require('../src/data/sample/policy.json') as PolicyFile;
const testCase = (): CaseTimeline => ({ ...referenceCase(), localId: '0b5c3f0e-1d2a-4c3b-9e8f-7a6b5c4d3e2f', nickname: 'Prueba' });

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

const ids = () =>
  within(screen.getByTestId('alerts-list'))
    .getAllByTestId(/^alert-\d{4}-/)
    .map((n) => String(n.props.testID).slice('alert-'.length));

describe('Alerts (S8)', () => {
  it('lists the curated alerts newest first with their parts, and the litigation table from policy.json', async () => {
    await renderRouter(screenRoutes(), { initialUrl: '/alerts' });
    expect(screen.getByText('Alertas: políticas, tribunales y datos')).toBeTruthy();
    const list = ids();
    expect(list).toHaveLength(12);
    expect(list[list.length - 1]).toBe('2026-05-22-pm-602-0199');
    expect([...list].sort().reverse().map((x) => x.slice(0, 10))).toEqual(list.map((x) => x.slice(0, 10)));
    const pa = within(screen.getByTestId('alert-2026-08-05-pa-2026-05'));
    expect(pa.getByText('Importancia alta')).toBeTruthy();
    expect(pa.getByText('Política')).toBeTruthy();
    expect(pa.getByText('5 ago 2026')).toBeTruthy();
    expect(pa.getByText('Qué significa para usted')).toBeTruthy();
    expect(pa.getByText('A quién afecta')).toBeTruthy();
    expect(pa.getByText('Todos los cubanos con I-485')).toBeTruthy();
    expect(screen.getByTestId('alerts-unread').props.children).toBe('12 alertas sin leer');
    // Litigation table: every curated case, with its status as of its date.
    const lit = within(screen.getByTestId('litigation'));
    for (const c of policy.litigation) {
      expect(lit.getAllByText(c.caption).length).toBeGreaterThan(0);
      expect(lit.getAllByText(`Al 20 oct 2026: ${localize(c.status, 'es')}`).length).toBeGreaterThan(0);
    }
    expect(JSON.stringify(screen.toJSON())).not.toMatch(/inconstitucional/i);
  });

  it('"Marcar como leídas" persists the read ids in the KV', async () => {
    await renderRouter(screenRoutes(), { initialUrl: '/alerts' });
    expect(screen.getAllByText('Nueva').length).toBe(12);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('alerts-mark-read'));
    });
    expect(screen.getByTestId('alerts-unread').props.children).toBe('No hay alertas sin leer.');
    expect(screen.queryAllByText('Nueva')).toHaveLength(0);
    expect(JSON.parse(kv.get(ALERTS_READ_KEY) ?? '[]')).toHaveLength(12);
  });

  it('"Mi caso" keeps only the alerts that affect the active case', async () => {
    await renderRouter(screenRoutes(), { initialUrl: '/alerts' });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('alerts-filter-mine'));
    });
    expect(screen.getByTestId('alerts-no-case')).toBeTruthy(); // no case saved yet → all alerts
    expect(ids()).toHaveLength(12);
    await act(async () => {
      expect(saveCase(testCase()).ok).toBe(true);
    });
    const mine = ids();
    expect(mine).not.toContain('2026-10-20-i220a-parole-scam'); // I-220A only
    expect(mine).toContain('2026-08-11-chirla-stay-vacated'); // CHNV and CBP One
    expect(mine).toContain('2026-10-14-ead-auto-extension-rule'); // case has a (c)(9) EAD
    expect(mine).toHaveLength(11);
  });

  it('opens an alert inside the tab with sources and the related court case, marks it read, and goes back', async () => {
    const r = await renderRouter(screenRoutes(), { initialUrl: '/alerts' });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('alert-open-2026-10-05-aaup-v-mullin'));
    });
    await waitFor(() => expect(r.getPathname()).toBe('/alerts/2026-10-05-aaup-v-mullin'));
    expect(screen.getByTestId('tab-alerts').props.accessibilityState?.selected).toBe(true);
    expect(screen.getByText('Fuentes')).toBeTruthy();
    expect(screen.getByTestId('alert-related')).toBeTruthy();
    expect(JSON.parse(kv.get(ALERTS_READ_KEY) ?? '[]')).toContain('2026-10-05-aaup-v-mullin');
    await act(async () => {
      await fireEvent.press(screen.getByTestId('back-link'));
    });
    await waitFor(() => expect(r.getPathname()).toBe('/alerts'));
    expect(screen.getByTestId('alerts-unread').props.children).toBe('11 alertas sin leer');
  });

  it('a deep link to an unknown alert shows the not-found card', async () => {
    await renderRouter(screenRoutes(), { initialUrl: '/alerts/no-such-alert' });
    expect(screen.getByTestId('alert-not-found')).toBeTruthy();
  });

  it('switches to English with the header toggle', async () => {
    await renderRouter(screenRoutes(), { initialUrl: '/alerts' });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('lang-toggle'));
    });
    expect(screen.getByText('Alerts: policy, courts and data')).toBeTruthy();
    const pa = within(screen.getByTestId('alert-2026-08-05-pa-2026-05'));
    expect(pa.getByText('Aug 5, 2026')).toBeTruthy();
    expect(pa.getByText('High importance')).toBeTruthy();
    expect(screen.getByText('Court cases to watch')).toBeTruthy();
    expect(screen.getByTestId('alerts-unread').props.children).toBe('12 unread alerts');
  });
});
