/**
 * A localized route error boundary (00 §5.1 "Error boundary: one per tab"; Prove P5 "render
 * without an error boundary"). Expo Router renders the `ErrorBoundary` export of a layout or route
 * when a screen below it throws; its built-in one shows English-only text, so the app re-exports
 * this one instead (root layout, tab layout; WP8 tab Stack layouts can `export { RouteErrorBoundary
 * as ErrorBoundary } from '@/platform/RouteErrorBoundary'`).
 *
 * Text comes from i18n; it never shows the raw error (it may contain case data) and offers only an
 * in-app retry (no reload, no alert: artifact contract (e)).
 */
import { Pressable, Text, View } from 'react-native';
import type { ErrorBoundaryProps } from 'expo-router';
import { useLang } from '@/i18n/useLang';
import { useTheme } from '@/ui/theme';

export function RouteErrorBoundary({ retry }: ErrorBoundaryProps) {
  const { t } = useLang();
  const { colors } = useTheme();
  const c = { bg: colors.bg, text: colors.text, muted: colors.textMuted, border: colors.border, accent: colors.accent };
  const title = t('notifications:shell.error.title');
  const body = t('notifications:shell.error.body');
  const retryLabel = t('common:action.retry');
  return (
    <View testID="route-error-boundary" style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <View style={{ width: '100%', maxWidth: 560, gap: 12 }}>
        <Text accessibilityRole="header" style={{ color: c.text, fontSize: 18, fontWeight: '600' }}>{title}</Text>
        <Text style={{ color: c.muted, fontSize: 14 }}>{body}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void retry()}
          style={{ alignSelf: 'flex-start', minHeight: 48, minWidth: 48, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: c.border }}
        >
          <Text style={{ color: c.accent, fontSize: 14, fontWeight: '600' }}>{retryLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}
