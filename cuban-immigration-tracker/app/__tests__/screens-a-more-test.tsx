/**
 * WP8a acceptance — S10 More and S11 Method on the frozen bundled sample:
 * - Method: the Little's-law lines (only here; golden T12: 355,520/820 = 433.56 → ~434,
 *   /6,524.25 (FY2025 average) = 54.49 → ~54, /9,200 (late-2024 pace) = 38.64 → ~39), β, κ_o = 50,
 *   weights and ledger, limitations, validation, canary (T15 0.09229 → "9 %"), sources, medians;
 * - Myths render from `content.json`; the glossary is searchable in both languages;
 * - Settings: language first; theme (native); "Borrar todos mis datos" runs through the in-app
 *   two-step `Sheet` (never `confirm()`), and clears the KV and the cases;
 * - About and Privacy render with the disclaimer.
 */
import { StyleSheet } from 'react-native';
import { act, fireEvent, renderRouter, screen, waitFor, within } from 'expo-router/testing-library';
import type { CaseTimeline, ContentFile } from '@caa/data-schemas';
import { localize } from '@caa/i18n-core';
import { referenceCase } from '@caa/estimator';
import { GOLDEN } from '@caa/estimator/golden';
import { DARK_COLORS } from '@/ui';
import { kv } from '@/storage/kv';
import { getCases, reloadCases, saveCase } from '@/storage/cases';
import { getSettings, reloadSettings, updateSettings } from '@/storage/settings';
import { T0, offlineFetch, screenRoutes } from '@/features/home/testing/harness';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'es-US', languageCode: 'es' }] }));

const NBSP = ' ';
const content = require('../src/data/sample/content.json') as ContentFile;
const testCase = (): CaseTimeline => ({ ...referenceCase(), localId: '0b5c3f0e-1d2a-4c3b-9e8f-7a6b5c4d3e2f', nickname: 'Prueba' });
const text = () => JSON.stringify(screen.toJSON());

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

describe('More (S10)', () => {
  it('lists the sub-screens with Settings first and opens Method inside the tab', async () => {
    const r = await renderRouter(screenRoutes(), { initialUrl: '/more' });
    const rows = screen.getAllByTestId(/^more-row-/).map((n) => n.props.testID);
    expect(rows).toEqual(['more-row-settings', 'more-row-myths', 'more-row-glossary', 'more-row-method', 'more-row-about', 'more-row-privacy']);
    expect(screen.getByTestId('more-scam')).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('more-row-method'));
    });
    await waitFor(() => expect(r.getPathname()).toBe('/more/method'));
    expect(screen.getByTestId('tab-more').props.accessibilityState?.selected).toBe(true);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('back-link'));
    });
    await waitFor(() => expect(r.getPathname()).toBe('/more'));
  });
});

describe('Method (S11)', () => {
  it('shows the Little\'s-law lines from the data (golden T12), the parameters and the canary', async () => {
    await renderRouter(screenRoutes(), { initialUrl: '/more/method' });
    const little = within(screen.getByTestId('method-little-lines'));
    expect(little.getByText('al ritmo de ago 2026 (820 decisiones): ~434 meses')).toBeTruthy();
    expect(little.getByText('al promedio del año fiscal 2025 (~6,524 al mes): ~54 meses')).toBeTruthy();
    expect(little.getByText('al ritmo del escenario «Ritmo de fines de 2024 (oct–dic 2024)» (~9,200 al mes): ~39 meses')).toBeTruthy();
    expect(screen.getByText('Es un promedio del grupo, no un pronóstico para su caso: cada línea supone un solo ritmo, constante.')).toBeTruthy();
    const params = within(screen.getByTestId('method-params'));
    expect(params.getByText('Ventaja por antigüedad (β): 0.0374 por mes')).toBeTruthy();
    expect(params.getByText('Peso del promedio al ajustar cada oficina (κ): 50 casos')).toBeTruthy();
    expect(params.getByTestId('method-ledger-empty')).toBeTruthy();
    const t15 = (GOLDEN.cases as unknown as Record<string, { pWithin: { m12: number } }>).T15!;
    expect(Math.abs(t15.pWithin.m12 - 0.09229)).toBeLessThan(5e-4);
    expect(String(screen.getByTestId('method-canary').props.children)).toContain(`9${NBSP}%`);
    expect(String(screen.getByTestId('method-canary').props.children)).toContain('54 meses');
    expect(screen.getByText('No validado: todavía no hay suficientes meses del régimen actual para comprobar el modelo.')).toBeTruthy();
    expect(screen.getAllByText('Confianza: baja').length).toBeGreaterThan(0);
    expect(within(screen.getByTestId('method-limits')).getByText(/mezclamos las oficinas del estado/)).toBeTruthy();
    expect(screen.getByTestId('method-medians-table')).toBeTruthy();
    expect(screen.getAllByText('31 jul 2026').length).toBeGreaterThan(0); // FY2026 median 11.8 cut 2026-07-31
    expect(screen.getByTestId('method-source-uscis.monthly_csv')).toBeTruthy();
    expect(screen.getByTestId('disclaimer')).toBeTruthy();
  });

  it('in English', async () => {
    await act(async () => updateSettings({ lang: 'en' }));
    await renderRouter(screenRoutes(), { initialUrl: '/more/method' });
    const little = within(screen.getByTestId('method-little-lines'));
    expect(little.getByText('at the Aug 2026 pace (820 decisions): ~434 months')).toBeTruthy();
    expect(little.getByText('at the fiscal year 2025 average (~6,524 per month): ~54 months')).toBeTruthy();
    expect(String(screen.getByTestId('method-canary').props.children)).toContain('9%');
  });
});

describe('Myths and glossary', () => {
  it('renders every myth from content.json with its verdict', async () => {
    await renderRouter(screenRoutes(), { initialUrl: '/more/myths' });
    for (const m of content.myths) {
      const card = within(screen.getByTestId(`myth-${m.id}`));
      expect(card.getByText(localize(m.claim, 'es'))).toBeTruthy();
      expect(card.getByText(localize(m.explanation, 'es'))).toBeTruthy();
    }
    expect(screen.getByTestId('myth-verdict-may-memo-ended-caa').props.accessibilityLabel).toBe('Falso');
    expect(screen.getByTestId('myth-verdict-ead-speeds-green-card').props.accessibilityLabel).toBe('No hay evidencia');
    expect(screen.getByTestId('myths-scam')).toBeTruthy();
    expect(text()).not.toMatch(/inconstitucional/i);
  });

  it('the glossary searches both languages, accent-insensitive, with an empty state', async () => {
    await renderRouter(screenRoutes(), { initialUrl: '/more/glossary' });
    expect(screen.getByTestId('glossary-count').props.children).toBe(`${content.glossaryExtra.length} términos`);
    await act(async () => {
      await fireEvent.changeText(screen.getByTestId('glossary-search'), 'adjudicacion');
    });
    expect(screen.getByTestId('glossary-list')).toBeTruthy();
    expect(text()).toMatch(/adjudicación/);
    await act(async () => {
      await fireEvent.changeText(screen.getByTestId('glossary-search'), 'expedited removal');
    });
    expect(screen.getAllByText(/Deportación acelerada/).length).toBeGreaterThan(0);
    await act(async () => {
      await fireEvent.changeText(screen.getByTestId('glossary-search'), 'zzzz');
    });
    expect(screen.getByText('No encontramos «zzzz» en el glosario.')).toBeTruthy();
  });
});

describe('Settings', () => {
  it('"Borrar todos mis datos" runs through the two-step in-app Sheet and clears the device data', async () => {
    const confirmSpy = jest.fn();
    (globalThis as { confirm?: unknown }).confirm = confirmSpy;
    await act(async () => {
      expect(saveCase(testCase()).ok).toBe(true);
    });
    await renderRouter(screenRoutes(), { initialUrl: '/more/settings' });
    expect(screen.getByText('Prueba')).toBeTruthy();
    expect(screen.getByText('Presentado en mar 2025')).toBeTruthy();
    expect(kv.get('caa:v1:cases')).not.toBeNull();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('settings-delete-open'));
    });
    expect(screen.getByTestId('sheet-delete-1')).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('sheet-delete-1-confirm'));
    });
    expect(screen.getByTestId('sheet-delete-2')).toBeTruthy();
    expect(getCases().cases).toHaveLength(1); // nothing deleted before the second step
    await act(async () => {
      await fireEvent.press(screen.getByTestId('sheet-delete-2-confirm'));
    });
    await waitFor(() => expect(screen.getByTestId('settings-delete-done')).toBeTruthy());
    expect(getCases().cases).toHaveLength(0);
    expect(kv.get('caa:v1:cases')).toBeNull();
    expect(screen.getByTestId('settings-cases-empty')).toBeTruthy();
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('cancelling the first step deletes nothing; a single case can be deleted through its own Sheet', async () => {
    await act(async () => {
      expect(saveCase(testCase()).ok).toBe(true);
    });
    await renderRouter(screenRoutes(), { initialUrl: '/more/settings' });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('settings-delete-open'));
    });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('sheet-delete-1-cancel'));
    });
    expect(getCases().cases).toHaveLength(1);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('settings-case-delete-0'));
    });
    expect(screen.getByText('¿Borrar «Prueba»?')).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('sheet-case-delete-confirm'));
    });
    expect(getCases().cases).toHaveLength(0);
  });

  it('language is the first setting and switches the app; the theme switches to dark', async () => {
    await renderRouter(screenRoutes(), { initialUrl: '/more/settings' });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('settings-lang-en'));
    });
    expect(getSettings().lang).toBe('en');
    expect(screen.getAllByText('Settings').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Delete all my data').length).toBe(2); // card title and button
    await act(async () => {
      await fireEvent.press(screen.getByTestId('settings-theme-dark'));
    });
    expect(getSettings().theme).toBe('dark');
    expect(StyleSheet.flatten(screen.getByTestId('screen-more-settings').props.style).backgroundColor).toBe(DARK_COLORS.bg);
    expect(screen.getByTestId('settings-data-status')).toBeTruthy();
    expect(String(screen.getByTestId('settings-data-status').props.children)).toContain('Sample');
  });

  it('discreet mode hides the case nickname and month', async () => {
    await act(async () => {
      expect(saveCase(testCase()).ok).toBe(true);
      updateSettings({ discreet: true });
    });
    await renderRouter(screenRoutes(), { initialUrl: '/more/settings' });
    expect(screen.queryByText('Prueba')).toBeNull();
    expect(screen.queryByText('Presentado en mar 2025')).toBeNull();
    expect(screen.getByText('Caso 1')).toBeTruthy();
  });
});

describe('About and Privacy', () => {
  it('About carries the full disclaimer, the evidence tags and the repository link', async () => {
    await renderRouter(screenRoutes(), { initialUrl: '/more/about' });
    expect(screen.getByTestId('disclaimer').props.children).toMatch(/^CAA Tracker es una herramienta independiente y no oficial/);
    expect(screen.getByText('[F] dato de un archivo de USCIS')).toBeTruthy();
    expect(screen.getByTestId('about-repo')).toBeTruthy();
  });

  it('Privacy lists what is stored and never stored, and links to Settings', async () => {
    const r = await renderRouter(screenRoutes(), { initialUrl: '/more/privacy' });
    expect(screen.getByText('Su nombre, número A, fecha de nacimiento, dirección, código postal, teléfono o correo.')).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('privacy-settings'));
    });
    await waitFor(() => expect(r.getPathname()).toBe('/more/settings'));
  });
});
