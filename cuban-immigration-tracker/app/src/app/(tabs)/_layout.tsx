/**
 * Tab layout (07 §2, WP6 rules): exactly five tabs — `index`, `case`, `offices`, `alerts`, `more`.
 * Each of `case`, `offices`, `alerts` and `more` is a folder with its own Stack `_layout` (WP8a,
 * WP8b), so detail routes such as `/offices/MIA` stay inside their tab with a back action.
 *
 * Labels come from i18n and switch with the language at runtime (Prove P6 "Inicio" ↔ "Home").
 * Icons are WP7's in-repo SVG `Icon` (react-native-svg; no icon fonts, ARCH-3); colours are WP7 theme tokens.
 *
 * First launch (00 S0): on native, the welcome modal opens once onboarding is not done. On web the
 * artifact stays on the home tab (its header carries the language toggle, and the host never shows
 * URL changes; Prove P2 expects `/` after boot); WP8a's Home shows the first-launch content there.
 */
import { useEffect } from 'react';
import { Platform, View, type ColorValue } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { useUnreadAlertCount } from '@/features/alerts/readState';
import { useLang } from '@/i18n/useLang';
import { kv } from '@/storage/kv';
import { getSettings } from '@/storage/settings';
import { Icon, type IconName } from '@/ui/icons';
import { useTheme } from '@/ui/theme';

export { RouteErrorBoundary as ErrorBoundary } from '@/platform/RouteErrorBoundary';

/** Opens the welcome modal on first launch (native only), once the stored settings are known. */
function useFirstLaunch(): void {
  const router = useRouter();
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let alive = true;
    kv.ready.then(() => {
      if (alive && !getSettings().onboardingDone) router.push('/welcome');
    });
    return () => {
      alive = false;
    };
  }, [router]);
}

type TabName = 'index' | 'case' | 'offices' | 'alerts' | 'more';

/** Tab route → WP7 icon (07 §6.0 `IconName`). */
const TAB_ICON: Record<TabName, IconName> = { index: 'home', case: 'case', offices: 'offices', alerts: 'alerts', more: 'more' };

const icon = (name: TabName) =>
  function TabBarIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Icon name={TAB_ICON[name]} color={typeof color === 'string' ? color : undefined} size={size} testID={`tab-icon-${name}`} />;
  };

/**
 * Alerts tab icon with the "dot when unread" of 00 §5. The dot is drawn, not text, so the tab's
 * visible label stays exactly "Alertas"/"Alerts" (Prove P6 reads it); the count is announced
 * through the tab's accessibility label instead.
 */
function AlertsTabIcon({ color, size }: { color: ColorValue; size: number }) {
  const unread = useUnreadAlertCount();
  const theme = useTheme();
  return (
    <View>
      <Icon name="alerts" color={typeof color === 'string' ? color : undefined} size={size} testID="tab-icon-alerts" />
      {unread > 0 ? (
        <View
          testID="tab-alerts-unread-dot"
          style={{ position: 'absolute', top: 0, right: -2, width: 9, height: 9, borderRadius: 5, backgroundColor: theme.colors.deadline, borderWidth: 1, borderColor: theme.colors.surface }}
        />
      ) : null}
    </View>
  );
}

const ICONS = {
  index: icon('index'),
  case: icon('case'),
  offices: icon('offices'),
  alerts: AlertsTabIcon,
  more: icon('more'),
} as const;

export default function TabLayout() {
  const { t, fmt } = useLang();
  const theme = useTheme();
  const unread = useUnreadAlertCount();
  useFirstLaunch();
  const opts = (name: TabName) => {
    const title = t(`notifications:shell.tab.${name}`);
    const a11y =
      name === 'alerts' && unread > 0
        ? `${title}, ${t(unread === 1 ? 'alerts:unread.one' : 'alerts:unread.other', { n: fmt.int(unread) })}`
        : title;
    return { title, tabBarAccessibilityLabel: a11y, tabBarButtonTestID: `tab-${name}`, tabBarIcon: ICONS[name] };
  };
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
      }}
    >
      <Tabs.Screen name="index" options={opts('index')} />
      <Tabs.Screen name="case" options={opts('case')} />
      <Tabs.Screen name="offices" options={opts('offices')} />
      <Tabs.Screen name="alerts" options={opts('alerts')} />
      <Tabs.Screen name="more" options={opts('more')} />
    </Tabs>
  );
}
