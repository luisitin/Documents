/**
 * WP11 integration (00 §5 "Alertas … dot when unread"): the alerts tab shows a drawn dot while
 * any live alert of the bundled SAMPLE snapshot is unread, announces the count in its
 * accessibility label (es and en), keeps its visible label exactly "Alertas", and the dot goes
 * away once every alert is marked read. Real root and tab layouts; screens are stand-ins.
 */
import { Text } from 'react-native';
import { Stack } from 'expo-router';
import { act, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { ALERTS_READ_KEY, markRead } from '@/features/alerts/readState';
import { setAppLang } from '@/i18n';
import { isLive } from '@/features/home/model';
import { kv } from '@/storage/kv';
import { updateSettings } from '@/storage/settings';
import sampleAlerts from '@/data/sample/alerts.json';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'es-US', languageCode: 'es' }] }));

const stub = (id: string) =>
  function Stub() {
    return <Text testID={id}>{id}</Text>;
  };
const tabStack = { default: function TabStack() { return <Stack screenOptions={{ headerShown: false }} />; }, unstable_settings: { anchor: 'index' } };

const routes = {
  _layout: require('../src/app/_layout'),
  '+not-found': require('../src/app/+not-found'),
  '(tabs)/_layout': require('../src/app/(tabs)/_layout'),
  welcome: stub('screen-welcome'),
  '(tabs)/index': stub('screen-home'),
  '(tabs)/case/_layout': tabStack,
  '(tabs)/case/index': stub('screen-case'),
  '(tabs)/offices/_layout': tabStack,
  '(tabs)/offices/index': stub('screen-offices'),
  '(tabs)/alerts/_layout': tabStack,
  '(tabs)/alerts/index': stub('screen-alerts'),
  '(tabs)/more/_layout': tabStack,
  '(tabs)/more/index': stub('screen-more'),
};

const a11y = () => String(screen.getByTestId('tab-alerts').props.accessibilityLabel ?? '');

beforeAll(() => {
  updateSettings({ onboardingDone: true });
  kv.remove(ALERTS_READ_KEY);
});

describe('alerts tab unread dot (sample snapshot)', () => {
  it('shows the dot and a bilingual unread count, switches language at runtime, and hides the dot after markRead', async () => {
    // Today is real time in this test; only alerts the tab would list count.
    const today = new Date().toISOString().slice(0, 10);
    const live = sampleAlerts.alerts.filter((a) => isLive(a as never, today as never));
    await renderRouter(routes, { initialUrl: '/' });
    await waitFor(() => expect(screen.getByTestId('screen-home')).toBeTruthy());
    if (live.length === 0) {
      expect(screen.queryByTestId('tab-alerts-unread-dot')).toBeNull();
      return;
    }
    // The tab bar renders active and inactive icon layers, so there may be two dots.
    expect(screen.getAllByTestId('tab-alerts-unread-dot').length).toBeGreaterThan(0);
    expect(a11y()).toMatch(/^Alertas, \d+ alertas? sin leer$/);
    expect(screen.getAllByText('Alertas').length).toBeGreaterThan(0);

    await act(async () => setAppLang('en'));
    await waitFor(() => expect(screen.getAllByText('Alerts').length).toBeGreaterThan(0));
    expect(a11y()).toMatch(/^Alerts, \d+ unread alerts?$/);

    act(() => markRead(sampleAlerts.alerts.map((a) => a.id)));
    await waitFor(() => expect(screen.queryByTestId('tab-alerts-unread-dot')).toBeNull());
    expect(a11y()).toBe('Alerts');
    await act(async () => setAppLang('es'));
  });
});
