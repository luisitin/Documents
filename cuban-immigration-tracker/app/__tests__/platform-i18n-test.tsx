/**
 * 07 WP6 acceptance (i18n): language persistence; the default comes from the mocked
 * `getLocales()`; changing the language triggers `notifications.rescheduleAll`. Plus the runtime
 * switch of every string, date and percentage through `useLang()` (owner requirement 1; 02 §9).
 */
import { Pressable, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useLang } from '@/i18n';
import { notifications } from '@/notifications';

// Shared AsyncStorage double: survives jest.isolateModules, so a "relaunch" sees what was stored.
const mockStore = new Map<string, string>();
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getAllKeys: async () => [...mockStore.keys()],
    multiGet: async (keys: string[]) => keys.map((k) => [k, mockStore.get(k) ?? null]),
    setItem: async (k: string, v: string) => void mockStore.set(k, v),
    multiRemove: async (keys: string[]) => keys.forEach((k) => mockStore.delete(k)),
  },
}));

let mockLocale = 'es-US';
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: mockLocale, languageCode: mockLocale.slice(0, 2) }] }));

type I18nMod = typeof import('@/i18n');
type SettingsMod = typeof import('@/storage/settings');
type NotifMod = typeof import('@/notifications');
type KvMod = typeof import('@/storage/kv');

/** A fresh "app launch": new module registry, same persisted storage. */
async function launch(): Promise<{ i18n: I18nMod; settings: SettingsMod; notif: NotifMod }> {
  let mods!: { i18n: I18nMod; settings: SettingsMod; notif: NotifMod; kv: KvMod };
  jest.isolateModules(() => {
    mods = {
      i18n: require('@/i18n'),
      settings: require('@/storage/settings'),
      notif: require('@/notifications'),
      kv: require('@/storage/kv'),
    };
  });
  await mods.kv.kv.ready;
  await new Promise((r) => setTimeout(r, 0));
  return mods;
}

beforeEach(() => {
  mockStore.clear();
  mockLocale = 'es-US';
});

describe('language default, persistence and reschedule', () => {
  it('defaults to Spanish for an es-* device and to English otherwise', async () => {
    let app = await launch();
    expect(app.settings.getSettings().lang).toBe('es');
    expect(app.i18n.i18n.t('notifications:shell.tab.index')).toBe('Inicio');
    mockLocale = 'en-GB';
    app = await launch();
    expect(app.settings.getSettings().lang).toBe('en');
    expect(app.i18n.i18n.t('notifications:shell.tab.index')).toBe('Home');
    mockLocale = 'fr-FR';
    app = await launch();
    expect(app.settings.getSettings().lang).toBe('en');
  });

  it('persists the choice and restores it on the next launch over the device default', async () => {
    let app = await launch();
    app.i18n.setAppLang('en');
    expect(JSON.parse(mockStore.get('caa:v1:settings') as string).lang).toBe('en');
    app = await launch(); // device still es-US
    expect(app.settings.getSettings().lang).toBe('en');
    expect(app.i18n.i18n.language).toBe('en');
    expect(app.i18n.tFor('es')('notifications:shell.tab.more')).toBe('Más');
  });

  it('changing the language calls notifications.rescheduleAll(newLang) once', async () => {
    const app = await launch();
    const spy = jest.spyOn(app.notif.notifications, 'rescheduleAll').mockResolvedValue(undefined);
    app.i18n.setAppLang('en');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('en');
    app.i18n.setAppLang('en'); // no change → no reschedule
    expect(spy).toHaveBeenCalledTimes(1);
    app.i18n.setAppLang('es');
    expect(spy).toHaveBeenLastCalledWith('es');
  });

  it('falls back to defaults when the stored settings are invalid (and removes them)', async () => {
    mockStore.set('caa:v1:settings', JSON.stringify({ lang: 'fr' }));
    const app = await launch();
    expect(app.settings.getSettings().lang).toBe('es');
    expect(mockStore.has('caa:v1:settings')).toBe(false);
  });
});

describe('useLang() switches strings, dates and percentages at runtime', () => {
  // Uses the top-level module registry (one React copy); the device default is es-US.
  it('es ↔ en without a restart', async () => {
    function View() {
      const { lang, setLang, t, fmt } = useLang();
      const line = `${t('notifications:shell.tab.index')} · ${fmt.date('2026-10-20')} · ${fmt.pct(0.0923)} · ${t('common:disclaimer.short')}`;
      return (
        <Pressable testID="toggle" onPress={() => setLang(lang === 'es' ? 'en' : 'es')}>
          <Text testID="line">{line}</Text>
        </Pressable>
      );
    }
    jest.spyOn(notifications, 'rescheduleAll').mockResolvedValue(undefined);
    await render(<View />);
    expect(screen.getByTestId('line').props.children).toBe('Inicio · 20 oct 2026 · 9 % · Esto no es asesoría legal.');
    await fireEvent.press(screen.getByTestId('toggle'));
    expect(screen.getByTestId('line').props.children).toBe('Home · Oct 20, 2026 · 9% · This is not legal advice.');
  });
});
