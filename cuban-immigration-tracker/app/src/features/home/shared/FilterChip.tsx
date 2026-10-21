/**
 * A selectable filter pill (state filters on Offices, "mi caso / todas" on Alerts, the chart
 * metric on Home). The kit's `Chip` is a non-interactive label, so this is the pressable variant:
 * 48 px touch target (00 §5), selection stated in text weight and `accessibilityState`, never by
 * colour alone.
 */
import { Pressable } from 'react-native';
import { AppText, MIN_TOUCH, toneWash, useTheme } from '@/ui';

export interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress(): void;
  testID?: string;
  accessibilityLabel?: string;
}

export function FilterChip({ label, selected, onPress, testID, accessibilityLabel }: FilterChipProps) {
  const theme = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: MIN_TOUCH,
        justifyContent: 'center',
        paddingHorizontal: theme.space(3.5),
        borderRadius: 999,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? theme.colors.accent : theme.colors.border,
        backgroundColor: selected ? toneWash(theme, 'info') : theme.colors.surface,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <AppText size="sm" weight={selected ? 'bold' : 'regular'} style={selected ? { color: theme.colors.accent } : undefined}>
        {label}
      </AppText>
    </Pressable>
  );
}
