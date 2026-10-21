/**
 * `Chip { label; tone?; accessibilityLabel? }` (07 §6.0). Small, non-interactive label. Tones are
 * never colour alone: the label text always states the meaning.
 */
import { View } from 'react-native';
import { toneColor, toneWash, useTheme, type Tone } from '../theme';
import { AppText } from './AppText';

export interface ChipProps {
  label: string;
  tone?: Tone;
  accessibilityLabel?: string;
  testID?: string;
}

export function Chip({ label, tone = 'neutral', accessibilityLabel, testID }: ChipProps) {
  const theme = useTheme();
  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel={accessibilityLabel ?? label}
      style={{
        alignSelf: 'flex-start',
        flexShrink: 1,
        backgroundColor: toneWash(theme, tone),
        borderColor: tone === 'neutral' ? theme.colors.border : toneColor(theme, tone),
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: theme.space(2.5),
        paddingVertical: theme.space(0.5),
      }}
    >
      <AppText size="xs" weight="medium" tone={tone} muted={tone === 'neutral'}>
        {label}
      </AppText>
    </View>
  );
}
