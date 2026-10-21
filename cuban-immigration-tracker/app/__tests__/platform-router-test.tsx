/**
 * 07 WP6 acceptance (router): an unknown path redirects to `/`; `/offices/MIA` and `/alerts/<id>`
 * render inside their tab (tab bar visible, `offices` / `alerts` tab focused) with a working back
 * action to the tab's index. The root layout, `+not-found` and the tab layout are the real WP6
 * files; the screens and the per-tab Stack layouts (WP8a/WP8b) are local stand-ins with the same
 * route names, so this test does not depend on screen work in progress.
 */
import { Text } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { act, renderRouter, screen, testRouter, waitFor } from 'expo-router/testing-library';
import { updateSettings } from '@/storage/settings';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'es-US', languageCode: 'es' }] }));

const stub = (id: string) =>
  function Stub() {
    return <Text testID={id}>{id}</Text>;
  };
function Detail({ prefix }: { prefix: string }) {
  const p = useLocalSearchParams<{ code?: string; id?: string }>();
  const id = `${prefix}-${p.code ?? p.id ?? ''}`;
  return <Text testID={id}>{id}</Text>;
}
const tabStack = { default: function TabStack() { return <Stack screenOptions={{ headerShown: false }} />; }, unstable_settings: { anchor: 'index' } };

const routes = {
  _layout: require('../src/app/_layout'),
  '+not-found': require('../src/app/+not-found'),
  '(tabs)/_layout': require('../src/app/(tabs)/_layout'),
  welcome: stub('screen-welcome'),
  '(tabs)/index': stub('screen-home'),
  '(tabs)/case/_layout': tabStack,
  '(tabs)/case/index': stub('screen-case'),
  '(tabs)/case/peers': stub('screen-case-peers'),
  '(tabs)/offices/_layout': tabStack,
  '(tabs)/offices/index': stub('screen-offices'),
  '(tabs)/offices/[code]': function Office() { return <Detail prefix="office" />; },
  '(tabs)/alerts/_layout': tabStack,
  '(tabs)/alerts/index': stub('screen-alerts'),
  '(tabs)/alerts/[id]': function AlertDetail() { return <Detail prefix="alert" />; },
  '(tabs)/more/_layout': tabStack,
  '(tabs)/more/index': stub('screen-more'),
  '(tabs)/more/method': stub('screen-more-method'),
};

const selected = (tab: string) => screen.getByTestId(`tab-${tab}`).props.accessibilityState?.selected === true;

beforeAll(() => {
  updateSettings({ onboardingDone: true });
});

describe('root Stack + five tabs', () => {
  it('redirects an unknown initial path (artifact boot from /x/y/z/index.html) to the home tab', async () => {
    const r = await renderRouter(routes, { initialUrl: '/x/y/z/index.html' });
    await waitFor(() => expect(r.getPathname()).toBe('/'));
    expect(screen.getByTestId('screen-home')).toBeTruthy();
    for (const t of ['index', 'case', 'offices', 'alerts', 'more']) expect(screen.getByTestId(`tab-${t}`)).toBeTruthy();
    expect(screen.getAllByText('Inicio').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Oficinas').length).toBeGreaterThan(0);
    expect(selected('index')).toBe(true);
  });

  it('/offices/MIA renders inside the offices tab and goes back to the tab index', async () => {
    const r = await renderRouter(routes, { initialUrl: '/offices' });
    await testRouter.push('/offices/MIA');
    expect(r.getPathname()).toBe('/offices/MIA');
    expect(screen.getByTestId('office-MIA')).toBeTruthy();
    expect(screen.getByTestId('tab-offices')).toBeTruthy(); // tab bar visible
    expect(selected('offices')).toBe(true);
    expect(selected('index')).toBe(false);
    await testRouter.back('/offices');
    expect(screen.getByTestId('screen-offices')).toBeTruthy();
  });

  it('a deep link to /alerts/<id> lands in the alerts tab with a back action to /alerts', async () => {
    const r = await renderRouter(routes, { initialUrl: '/alerts/2026-08-05-pa-2026-05' });
    expect(r.getPathname()).toBe('/alerts/2026-08-05-pa-2026-05');
    expect(screen.getByTestId('alert-2026-08-05-pa-2026-05')).toBeTruthy();
    expect(selected('alerts')).toBe(true);
    expect(testRouter.canGoBack()).toBe(true);
    await testRouter.back();
    expect(r.getPathname()).toBe('/alerts'); // the anchor keeps the id as a search param only
    expect(screen.getByTestId('screen-alerts')).toBeTruthy();
    expect(selected('alerts')).toBe(true);
  });
});

describe('first launch', () => {
  it('opens the welcome modal on native when onboarding is not done', async () => {
    updateSettings({ onboardingDone: false });
    const r = await renderRouter(routes, { initialUrl: '/' });
    await waitFor(() => expect(r.getPathname()).toBe('/welcome'));
    expect(screen.getByTestId('screen-welcome')).toBeTruthy();
    await act(async () => updateSettings({ onboardingDone: true }));
  });
});
