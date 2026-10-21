/**
 * A source link (00 §3 principle 3: every number carries its source). On native it opens the
 * system browser through `openUrl` (WP6). In the web artifact external navigation is blocked and
 * `window.open` is never offered (artifact contract (e)), so the URL is shown as selectable text
 * instead (00 S7 "On web, external links render as plain-text URLs").
 */
import { Pressable, View } from 'react-native';
import { useLang } from '@/i18n/useLang';
import { CAN_OPEN_URLS, openUrl } from '@/platform/openUrl';
import { AppText, Icon, MIN_TOUCH, useTheme } from '@/ui';

export interface ExternalLinkProps {
  label: string;
  url: string;
  testID?: string;
}

export function ExternalLink({ label, url, testID }: ExternalLinkProps) {
  const { t } = useLang();
  const theme = useTheme();
  if (!CAN_OPEN_URLS) {
    return (
      <View testID={testID} style={{ gap: theme.space(0.5) }}>
        <AppText size="sm">{label}</AppText>
        <AppText size="xs" muted selectable accessibilityLabel={t('home:link.copyHint', { url })}>
          {url}
        </AppText>
      </View>
    );
  }
  return (
    <Pressable
      testID={testID}
      accessibilityRole="link"
      accessibilityLabel={label}
      accessibilityHint={t('home:link.openHint')}
      onPress={() => {
        void openUrl(url);
      }}
      style={({ pressed }) => ({ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: theme.space(1.5), opacity: pressed ? 0.7 : 1 })}
    >
      <View style={{ flexShrink: 1 }}>
        <AppText size="sm" style={{ color: theme.colors.accent, textDecorationLine: 'underline' }}>
          {label}
        </AppText>
      </View>
      <Icon name="external" size={16} color={theme.colors.accent} />
    </Pressable>
  );
}
