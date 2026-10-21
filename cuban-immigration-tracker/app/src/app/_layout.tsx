/**
 * Root layout (07 §2, WP6 rules; 00 S13; artifact contract (c)).
 *
 * - A `Stack` with exactly three screens: `(tabs)`, `welcome` (presentation 'modal') and
 *   `+not-found` (which redirects to the home tab, so the page boots from any path).
 * - `@/i18n` is imported first: i18next is initialised synchronously in the stored or device
 *   language before any screen renders (owner requirement 1).
 * - `<DataProvider>` wraps everything: bundled sample → KV cache → network (`@/data`).
 * - The splash is held until `kv.ready` resolves, at most 300 ms (07 WP6). The tree renders
 *   underneath meanwhile, so web (synchronous storage) shows the first frame at once.
 * - Notifications are initialised only if the user opted in before (lazy import; 00 §7).
 */
import '@/i18n';
import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { hideAsync, preventAutoHideAsync } from 'expo-splash-screen';
import { DataProvider } from '@/data/DataProvider';
import { notifications } from '@/notifications';
import { kv } from '@/storage/kv';
import { readyWithin } from '@/storage/kvCore';
import { useThemeName } from '@/ui/useThemeName';

export { RouteErrorBoundary as ErrorBoundary } from '@/platform/RouteErrorBoundary';

preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const theme = useThemeName();

  useEffect(() => {
    let alive = true;
    readyWithin(kv).then(() => {
      if (alive) hideAsync().catch(() => undefined);
    });
    kv.ready.then(() => notifications.init()).catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  return (
    <DataProvider>
      <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="welcome" options={{ presentation: 'modal' }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </ThemeProvider>
    </DataProvider>
  );
}
