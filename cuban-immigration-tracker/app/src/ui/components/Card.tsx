/**
 * `Card { title?; tone?; children }` (07 §6.0). The tone shows as a left accent bar plus the
 * title colour; `deadline` (the only red, 00 §3 principle 8) is reachable only through this prop.
 */
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { toneColor, useTheme, type Tone } from '../theme';
import { AppText } from './AppText';

export interface CardProps {
  title?: string;
  tone?: Tone;
  children?: ReactNode;
  testID?: string;
}

export function Card({ title, tone = 'neutral', children, testID }: CardProps) {
  const theme = useTheme();
  const accent = tone === 'neutral' ? theme.colors.border : toneColor(theme, tone);
  return (
    <View
      testID={testID}
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderLeftWidth: tone === 'neutral' ? 1 : 4,
        borderLeftColor: accent,
        borderRadius: theme.radius,
        padding: theme.space(4),
        gap: theme.space(2),
      }}
    >
      {title ? (
        <AppText header size="lg" weight="bold" tone={tone}>
          {title}
        </AppText>
      ) : null}
      {children}
    </View>
  );
}
