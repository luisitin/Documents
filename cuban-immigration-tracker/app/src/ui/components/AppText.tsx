/**
 * Themed text (additive kit export). Every visible string in the kit goes through it so the type
 * scale and the light/dark text tokens stay consistent. Text never wears a series colour
 * (dataviz rule: text uses text tokens; colour marks carry identity).
 */
import type { ReactNode } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';
import { toneColor, useTheme, type FontToken, type Tone } from '../theme';

export interface AppTextProps {
  children: ReactNode;
  size?: FontToken;
  weight?: 'regular' | 'medium' | 'bold';
  muted?: boolean;
  tone?: Tone;
  header?: boolean;
  numberOfLines?: number;
  selectable?: boolean;
  style?: StyleProp<TextStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

const WEIGHT: Record<NonNullable<AppTextProps['weight']>, TextStyle['fontWeight']> = { regular: '400', medium: '600', bold: '700' };

export function AppText({ children, size = 'md', weight = 'regular', muted, tone, header, numberOfLines, selectable, style, testID, accessibilityLabel }: AppTextProps) {
  const theme = useTheme();
  const color = tone && tone !== 'neutral' ? toneColor(theme, tone) : muted ? theme.colors.textMuted : theme.colors.text;
  const fontSize = theme.font[size];
  return (
    <Text
      accessibilityRole={header ? 'header' : undefined}
      accessibilityLabel={accessibilityLabel}
      numberOfLines={numberOfLines}
      selectable={selectable}
      testID={testID}
      style={[{ color, fontSize, lineHeight: Math.round(fontSize * 1.4), fontWeight: WEIGHT[weight] }, style]}
    >
      {children}
    </Text>
  );
}
