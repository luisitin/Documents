/**
 * 07 WP8b + Prove P5: the real `(tabs)/case/**` route files inside the real root and tab layouts
 * (WP6). `/case` renders the tab index; "Ver un ejemplo" shows the T15 estimate; `/case/peers`
 * (pushed, or deep-linked) renders inside the case tab (tab bar visible, `case` focused) with a
 * back action to the tab index. Other tabs are local stand-ins so this test does not depend on WP8a.
 */
import { Text } from 'react-native';
import { act, fireEvent, renderRouter, screen, testRouter, waitFor } from 'expo-router/testing-library';
import { setAppLang } from '@/i18n';
import { clearAllData } from '@/storage/cases';
import { updateSettings } from '@/storage/settings';
import { selectCaseSubject } from '@/features/case';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'es-US', languageCode: 'es' }] }));

const stub = (id: string) =>
  function Stub() {
    return <Text testID={id}>{id}</Text>;
  };

const routes = {
  _layout: require('../src/app/_layout'),
  '+not-found': require('../src/app/+not-found'),
  '(tabs)/_layout': require('../src/app/(tabs)/_layout'),
  welcome: stub('screen-welcome'),
  '(tabs)/index': stub('screen-home'),
  '(tabs)/case/_layout': require('../src/app/(tabs)/case/_layout'),
  '(tabs)/case/index': require('../src/app/(tabs)/case/index'),
  '(tabs)/case/edit': require('../src/app/(tabs)/case/edit'),
  '(tabs)/case/peers': require('../src/app/(tabs)/case/peers'),
  '(tabs)/case/ead': require('../src/app/(tabs)/case/ead'),
  '(tabs)/case/remedies': require('../src/app/(tabs)/case/remedies'),
  '(tabs)/case/ineligible': require('../src/app/(tabs)/case/ineligible'),
  '(tabs)/case/share': require('../src/app/(tabs)/case/share'),
  '(tabs)/offices/index': stub('screen-offices'),
  '(tabs)/alerts/index': stub('screen-alerts'),
  '(tabs)/more/index': stub('screen-more'),
};

const selected = (tab: string) => screen.getByTestId(`tab-${tab}`).props.accessibilityState?.selected === true;

beforeAll(async () => {
  await clearAllData();
  updateSettings({ onboardingDone: true });
  setAppLang('es');
});

describe('case tab routes', () => {
  it('/case → example → /case/peers inside the tab → back to the tab index', async () => {
    selectCaseSubject(null);
    const r = await renderRouter(routes, { initialUrl: '/case' });
    await waitFor(() => expect(screen.getByTestId('screen-case')).toBeTruthy());
    expect(selected('case')).toBe(true);
    await fireEvent.press(screen.getByTestId('case-example-button'));
    expect(screen.getByTestId('estimate-headline-pct')).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByTestId('case-nav-peers'));
    });
    await waitFor(() => expect(r.getPathname()).toBe('/case/peers'));
    expect(screen.getByTestId('screen-case-peers')).toBeTruthy();
    expect(screen.getByTestId('peer-chnv_r1')).toBeTruthy();
    expect(selected('case')).toBe(true);
    expect(screen.getByTestId('tab-index')).toBeTruthy(); // tab bar visible
    await act(async () => {
      await fireEvent.press(screen.getByTestId('case-back'));
    });
    await waitFor(() => expect(r.getPathname()).toBe('/case'));
    await act(async () => selectCaseSubject(null));
  });

  it('a deep link to /case/remedies lands in the case tab with a back action to /case', async () => {
    const r = await renderRouter(routes, { initialUrl: '/case/remedies' });
    await waitFor(() => expect(screen.getByTestId('screen-case-remedies')).toBeTruthy());
    expect(r.getPathname()).toBe('/case/remedies');
    expect(selected('case')).toBe(true);
    expect(testRouter.canGoBack()).toBe(true);
    await act(async () => {
      await fireEvent.press(screen.getByTestId('case-back'));
    });
    await waitFor(() => expect(r.getPathname()).toBe('/case'));
    expect(screen.getByTestId('screen-case')).toBeTruthy();
  });
});
