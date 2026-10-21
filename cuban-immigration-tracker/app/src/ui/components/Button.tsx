/**
 * `Button { label; onPress(); variant?; disabled?; accessibilityHint? }` (07 §6.0).
 * Minimum touch target 48 × 48 (00 §5). `link` is a text button (still 48 px tall).
 */
import { Pressable } from 'react-native';
import { MIN_TOUCH, useTheme } from '../theme';
import { AppText } from './AppText';

export interface ButtonProps {
  label: string;
  onPress(): void;
  variant?: 'primary' | 'secondary' | 'link';
  disabled?: boolean;
  accessibilityHint?: string;
  testID?: string;
}

export function Button({ label, onPress, variant = 'primary', disabled = false, accessibilityHint, testID }: ButtonProps) {
  const theme = useTheme();
  const c = theme.colors;
  const primary = variant === 'primary';
  const link = variant === 'link';
  const fg = primary ? (theme.name === 'dark' ? c.bg : '#ffffff') : c.accent;
  return (
    <Pressable
      testID={testID}
      accessibilityRole={link ? 'link' : 'button'}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => ({
        minHeight: MIN_TOUCH,
        minWidth: MIN_TOUCH,
        paddingHorizontal: link ? theme.space(1) : theme.space(4),
        borderRadius: theme.radius,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: link ? 'flex-start' : 'stretch',
        backgroundColor: primary ? c.accent : link ? 'transparent' : c.surface,
        borderWidth: primary || link ? 0 : 1,
        borderColor: c.border,
        opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
      })}
    >
      <AppText weight="medium" style={{ color: fg, textAlign: 'center', textDecorationLine: link ? 'underline' : 'none' }}>
        {label}
      </AppText>
    </Pressable>
  );
}
