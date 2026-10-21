/**
 * The in-screen back action of a detail screen. The tab Stacks hide the native header (each
 * screen draws `AppHeader` with the language button and the data chip), so detail screens carry
 * this link; it returns to the tab index (07 WP6 rules; Prove P5 "the back action returns to the
 * tab index"), also when the screen was opened by a deep link with no history.
 */
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Icon, MIN_TOUCH, useTheme } from '@/ui';
import { goBackOr } from './nav';

export interface BackLinkProps {
  label: string;
  fallback: string;
  testID?: string;
}

export function BackLink({ label, fallback, testID = 'back-link' }: BackLinkProps) {
  const router = useRouter();
  const theme = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => goBackOr(router, fallback)}
      hitSlop={4}
      style={({ pressed }) => ({ minHeight: MIN_TOUCH, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: theme.space(1), opacity: pressed ? 0.7 : 1 })}
    >
      <Icon name="chevron-left" size={20} color={theme.colors.accent} />
      <AppText weight="medium" style={{ color: theme.colors.accent }}>
        {label}
      </AppText>
    </Pressable>
  );
}
