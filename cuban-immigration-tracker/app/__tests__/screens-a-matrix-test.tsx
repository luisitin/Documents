/**
 * WP8a acceptance — every WP8a screen renders against the bundled sample in es and en, light and
 * dark, without an error boundary, with the header (title, language button, data-status chip: the
 * "as of" date and live/sample status on every screen, owner requirement 2), the theme background
 * and no hard-coded copy of the other language. Detail screens stay inside their tab.
 */
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { act, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import type { Lang } from '@caa/data-schemas';
import { DARK_COLORS, LIGHT_COLORS } from '@/ui';
import { kv } from '@/storage/kv';
import { reloadCases } from '@/storage/cases';
import { reloadSettings, updateSettings } from '@/storage/settings';
import { T0, offlineFetch, screenRoutes } from '@/features/home/testing/harness';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'es-US', languageCode: 'es' }] }));

const SCREENS: { url: string; id: string; tab: string }[] = [
  { url: '/', id: 'screen-home', tab: 'index' },
  { url: '/offices', id: 'screen-offices', tab: 'offices' },
  { url: '/offices/MIA', id: 'screen-office-MIA', tab: 'offices' },
  { url: '/alerts', id: 'screen-alerts', tab: 'alerts' },
  { url: '/alerts/2026-08-24-red-eagle-pi', id: 'screen-alert-2026-08-24-red-eagle-pi', tab: 'alerts' },
  { url: '/more', id: 'screen-more', tab: 'more' },
  { url: '/more/settings', id: 'screen-more-settings', tab: 'more' },
  { url: '/more/method', id: 'screen-more-method', tab: 'more' },
  { url: '/more/myths', id: 'screen-more-myths', tab: 'more' },
  { url: '/more/glossary', id: 'screen-more-glossary', tab: 'more' },
  { url: '/more/about', id: 'screen-more-about', tab: 'more' },
  { url: '/more/privacy', id: 'screen-more-privacy', tab: 'more' },
];

/** Phrases that must never appear in the other language's UI (a sign of hard-coded copy). */
const FOREIGN: Record<Lang, RegExp> = {
  es: /\b(Sample|Published|Live|Settings|Offices|Alerts|Back to|Source:|pending|approved)\b/,
  en: /\b(Muestra|Publicado|En vivo|Ajustes|Oficinas|Alertas|Volver a|Fuente:|pendientes|aprobadas)\b/,
};

/* eslint-disable @typescript-eslint/no-require-imports */
const SOURCE_LABELS: string[] = [
  ...(require('../src/data/sample/alerts.json') as { alerts: { sources: { label: string }[] }[] }).alerts.flatMap((a) => a.sources.map((x) => x.label)),
  ...(require('../src/data/sample/content.json') as { myths: { sources: { label: string }[] }[] }).myths.flatMap((m) => m.sources.map((x) => x.label)),
];
/* eslint-enable @typescript-eslint/no-require-imports */

type Node = { props?: Record<string, unknown>; children?: (Node | string)[] | null } | string;

/** Visible text and accessibility labels under the node with `testID` (never prop names). */
function texts(root: Node | Node[] | null, testID: string): string[] {
  const out: string[] = [];
  const walk = (n: Node, inside: boolean) => {
    if (typeof n === 'string') {
      if (inside) out.push(n);
      return;
    }
    const here = inside || n.props?.testID === testID;
    const label = n.props?.accessibilityLabel;
    if (here && typeof label === 'string') out.push(label);
    for (const c of n.children ?? []) walk(c, here);
  };
  for (const n of Array.isArray(root) ? root : root ? [root] : []) walk(n, false);
  return out;
}

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

describe.each([
  ['es', 'light'],
  ['es', 'dark'],
  ['en', 'light'],
  ['en', 'dark'],
] as const)('every WP8a screen (%s, %s)', (lang, theme) => {
  it('renders with its header, status chip, theme background and only its own language', async () => {
    await act(async () => updateSettings({ lang, theme, onboardingDone: true }));
    const r = await renderRouter(screenRoutes(), { initialUrl: '/' });
    for (const s of SCREENS) {
      if (s.url !== '/') {
        await act(async () => {
          router.push(s.url as never);
        });
      }
      await waitFor(() => expect(r.getPathname()).toBe(s.url));
      const root = screen.getByTestId(s.id);
      expect(screen.queryByTestId('route-error-boundary')).toBeNull();
      expect(screen.getByTestId('app-header')).toBeTruthy();
      expect(screen.getByTestId('lang-toggle')).toBeTruthy();
      const chip = String(screen.getByTestId('data-status').props.accessibilityLabel);
      expect(chip).toContain(lang === 'es' ? 'Muestra' : 'Sample');
      expect(chip).toContain(lang === 'es' ? 'ago 2026' : 'Aug 2026');
      expect(StyleSheet.flatten(root.props.style).backgroundColor).toBe(theme === 'dark' ? DARK_COLORS.bg : LIGHT_COLORS.bg);
      expect(screen.getByTestId(`tab-${s.tab}`).props.accessibilityState?.selected).toBe(true);
      // Proper names from the data are exempt: court captions, and the citation titles of sources
      // (a plain `label` in the curated files, 02 §2.6). The check looks for translated chrome words.
      const PROPER = /Dorcas|Red Eagle|AAUP|Acosta|Doe v|CHIRLA|Make the Road|Bello|Labrada/;
      const shown = texts(screen.toJSON() as Node | Node[] | null, s.id).filter((x) => !PROPER.test(x) && !SOURCE_LABELS.some((l) => x.startsWith(l)));
      expect(shown.length).toBeGreaterThan(5);
      const scrubbed = shown.filter((x) => FOREIGN[lang].test(x));
      expect(scrubbed).toEqual([]);
    }
  });
});
