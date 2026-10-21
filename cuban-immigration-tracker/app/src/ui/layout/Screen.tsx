/**
 * `Screen { children; scroll?; testID? }` (07 §6.0; 00 §5 "Layout: content column maxWidth: 560,
 * centered, 16 px gutters … no horizontal scroll at 390 px"; contract (h)).
 *
 * The full-bleed background uses the theme `bg` (the fragment `<style>` paints the same value on
 * `body` and `#root`, contract (f)). The column is centred on wide screens. Safe-area insets come
 * from the nearest SafeAreaProvider (Expo Router's root provides one); without a provider (tests,
 * a bare web page) the insets are zero instead of throwing.
 */
import { useContext, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { CONTENT_MAX_WIDTH, GUTTER, useTheme } from '../theme';

export interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  testID?: string;
}

const ZERO = { top: 0, right: 0, bottom: 0, left: 0 };

export function Screen({ children, scroll = true, testID }: ScreenProps) {
  const theme = useTheme();
  const insets = useContext(SafeAreaInsetsContext) ?? ZERO;
  const column = (
    <View
      style={{
        width: '100%',
        maxWidth: CONTENT_MAX_WIDTH + 2 * GUTTER,
        alignSelf: 'center',
        paddingHorizontal: GUTTER + Math.max(insets.left, insets.right),
        paddingTop: theme.space(2) + insets.top,
        paddingBottom: theme.space(6) + insets.bottom,
        gap: theme.space(3),
      }}
    >
      {children}
    </View>
  );
  return (
    <View testID={testID} style={{ flex: 1, backgroundColor: theme.colors.bg, overflow: 'hidden' }}>
      {scroll ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          {column}
        </ScrollView>
      ) : (
        column
      )}
    </View>
  );
}
