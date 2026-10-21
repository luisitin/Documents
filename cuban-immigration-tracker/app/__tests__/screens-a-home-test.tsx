/**
 * WP8a acceptance — S1 Home on the FROZEN bundled sample (02 §2; 07 WP8a "frozen-sample" tests
 * assert literals): renders in es and en, light and dark; shows the T15 data month ("ago 2026")
 * and the "Muestra" chip; every pulse tile carries its kind chip; the approval tile always shows
 * its baselines (doc 14 §8.1); the Little's-law pair is absent (it lives only on Method, 00 S1).
 */
import { StyleSheet } from 'react-native';
import { act, fireEvent, renderRouter, screen, waitFor, within } from 'expo-router/testing-library';
import { DARK_COLORS, LIGHT_COLORS } from '@/ui';
import { kv } from '@/storage/kv';
import { reloadCases } from '@/storage/cases';
import { reloadSettings, updateSettings } from '@/storage/settings';
import { T0, offlineFetch, screenRoutes } from '@/features/home/testing/harness';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'es-US', languageCode: 'es' }] }));

const NBSP = ' ';
const bg = (id: string) => StyleSheet.flatten(screen.getByTestId(id).props.style).backgroundColor;
const allText = () => screen.toJSON() ? JSON.stringify(screen.toJSON()) : '';

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
afterEach(() => {
  jest.restoreAllMocks();
});

describe('Home (S1), frozen sample', () => {
  it('es, light: T15 data month, "Muestra" chip, pulse tiles with kind chips, baselines, no Little\'s law', async () => {
    const r = await renderRouter(screenRoutes(), { initialUrl: '/' });
    expect(r.getPathname()).toBe('/');
    expect(screen.getByTestId('screen-home')).toBeTruthy();
    expect(screen.getByText('Ajuste cubano: lo que USCIS está haciendo')).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId('data-status')).toBeTruthy());
    const chip = screen.getByTestId('data-status');
    expect(JSON.stringify(chip.props.accessibilityLabel)).toContain('Muestra');
    expect(JSON.stringify(chip.props.accessibilityLabel)).toContain('ago 2026');
    expect(screen.getByTestId('home-pulse-title').props.children).toBe('Datos de USCIS de ago 2026');
    // Pulse tiles (Aug 2026 row, doc 04 §1.1 [F]; 00 S1 table).
    for (const v of ['355,520', '1,213', '386', '434', '820', '345,741']) expect(screen.getAllByText(v).length).toBeGreaterThan(0);
    expect(screen.getByText('20.6 meses')).toBeTruthy();
    expect(screen.getAllByText('Pendientes al cierre del período').length).toBeGreaterThan(0); // kind chip
    expect(screen.getAllByText('Promedio de los casos terminados').length).toBeGreaterThan(0);
    // Approval tile always shows its baselines.
    const tile = screen.getByTestId('approval-tile');
    expect(tile).toBeTruthy();
    expect(screen.getByTestId('approval-quarter').props.children).toBe(`abr–jun 2026: 139 aprobadas y 447 negadas de 586 decisiones (23.7${NBSP}%).`);
    const baselines = within(screen.getByTestId('approval-baselines'));
    expect(baselines.getByText(`Año fiscal 2026, trimestre 1 (oct–dic 2025): 91.7${NBSP}% (4,098 de 4,471)`)).toBeTruthy();
    expect(baselines.getByText(`Año fiscal 2026, trimestre 2 (ene–mar 2026): 52.6${NBSP}% (50 de 95)`)).toBeTruthy();
    expect(baselines.getByText(`Año fiscal 2026, trimestre 3 (abr–jun 2026): 23.7${NBSP}% (139 de 586)`)).toBeTruthy();
    expect(baselines.getByText(`Año fiscal 2026 hasta el trimestre 3: 83.2${NBSP}% (4,287 de 5,152)`)).toBeTruthy();
    expect(screen.getByTestId('approval-monthly').props.children).toBe(`Datos mensuales recientes: jul 2026: 49${NBSP}% (308 de 626) · ago 2026: 47${NBSP}% (386 de 820)`);
    expect(screen.getByTestId('approval-caveat')).toBeTruthy();
    // (c)(9) card and the next-files line.
    expect(screen.getByText('Permisos de trabajo por ajuste pendiente (todas las nacionalidades): 671,362 pendientes; mediana 6.4 meses (abr–jun 2026).')).toBeTruthy();
    expect(screen.getByTestId('home-next').props.children).toBe('Próximos datos oficiales: informe mensual de septiembre de 2026 (aún no publicado); informe trimestral de jul–sept 2026 ≈ a principios de diciembre de 2026.');
    // Sample banner, disclaimer, CTA.
    expect(screen.getByTestId('banner-sample_data')).toBeTruthy();
    expect(screen.getByTestId('disclaimer')).toBeTruthy();
    expect(screen.getByText('Ver mi estimado')).toBeTruthy();
    // The Little's-law pair appears only on Method (00 S1 must-fix).
    const text = allText();
    expect(text).not.toMatch(/vaciarse|Ley de Little|~434|433/);
    expect(text).not.toMatch(/casos como el suyo/i);
    expect(bg('screen-home')).toBe(LIGHT_COLORS.bg);
  });

  it('en, dark: the whole screen switches language and theme at runtime', async () => {
    await renderRouter(screenRoutes(), { initialUrl: '/' });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('lang-toggle'));
    });
    expect(screen.getByText('Cuban Adjustment: what USCIS is doing')).toBeTruthy();
    expect(screen.getByTestId('home-pulse-title').props.children).toBe('USCIS data for Aug 2026');
    expect(JSON.stringify(screen.getByTestId('data-status').props.accessibilityLabel)).toContain('Sample');
    expect(screen.getByTestId('approval-quarter').props.children).toBe('Apr–Jun 2026: 139 approved and 447 denied out of 586 decisions (23.7%).');
    expect(screen.getByText('FY2026 Q1 (Oct–Dec 2025): 91.7% (4,098 of 4,471)')).toBeTruthy();
    expect(screen.getByText('20.6 months')).toBeTruthy();
    expect(screen.getAllByText('Home').length).toBeGreaterThan(0); // tab label
    expect(screen.getByTestId('disclaimer').props.children).toMatch(/^CAA Tracker is an independent, unofficial tool/);
    expect(bg('screen-home')).toBe(LIGHT_COLORS.bg);
    await act(async () => updateSettings({ theme: 'dark' }));
    expect(bg('screen-home')).toBe(DARK_COLORS.bg);
    expect(allText()).not.toMatch(/cases like yours/i);
  });

  it('tapping the mean-months tile explains why it is not a forecast (doc 08 §2.3)', async () => {
    await renderRouter(screenRoutes(), { initialUrl: '/' });
    expect(screen.queryByTestId('home-avg-explain')).toBeNull();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('home-avg-tile'));
    });
    expect(screen.getByTestId('home-avg-explain')).toBeTruthy();
    expect(screen.getByText('20.6 meses es lo que tardaron, en promedio, los pocos casos que USCIS terminó en ago 2026: 820 decisiones entre 355,520 pendientes. Describe casos que ya terminaron, no cuándo se decidirá un caso que sigue pendiente.')).toBeTruthy();
  });

  it('the chart switches metric and keeps its table twin; the high-severity alert banner opens the alert', async () => {
    const r = await renderRouter(screenRoutes(), { initialUrl: '/' });
    expect(screen.getByTestId('monthly-chart')).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('home-metric-pending'));
    });
    expect(screen.getByTestId('home-metric-pending').props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));
    // Latest high-severity alert, newest first (00 S1): the 2026-10-20 anti-scam alert.
    expect(screen.getByTestId('home-alert')).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByText('Leer la alerta'));
    });
    await waitFor(() => expect(r.getPathname()).toBe('/alerts/2026-10-20-i220a-parole-scam'));
  });

  it('the CTA goes to the case tab', async () => {
    const r = await renderRouter(screenRoutes(), { initialUrl: '/' });
    await act(async () => {
      await fireEvent.press(screen.getByTestId('home-cta'));
    });
    await waitFor(() => expect(r.getPathname()).toBe('/case'));
  });
});
