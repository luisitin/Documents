/**
 * `Banner { tone; text; action? }` (07 §6.0; 00 §5.1 banners). Icon + text, so the tone is never
 * colour alone. Announced politely; `deadline` banners are the only red ones.
 */
import { View } from 'react-native';
import { Icon, type IconName } from '../icons';
import { toneColor, toneWash, useTheme, type Tone } from '../theme';
import { AppText } from './AppText';
import { Button } from './Button';

export interface BannerProps {
  tone: Tone;
  text: string;
  action?: { label: string; onPress(): void };
  testID?: string;
}

const ICON: Record<Tone, IconName> = { neutral: 'info', info: 'info', warning: 'warning', deadline: 'clock' };

export function Banner({ tone, text, action, testID }: BannerProps) {
  const theme = useTheme();
  const fg = tone === 'neutral' ? theme.colors.text : toneColor(theme, tone);
  return (
    <View
      testID={testID}
      accessibilityLiveRegion="polite"
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.space(2),
        backgroundColor: toneWash(theme, tone),
        borderColor: tone === 'neutral' ? theme.colors.border : fg,
        borderWidth: 1,
        borderRadius: theme.radius,
        padding: theme.space(3),
      }}
    >
      <View style={{ paddingTop: 1 }}>
        <Icon name={ICON[tone]} color={fg} size={20} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: theme.space(1) }}>
        <AppText size="sm" tone={tone}>
          {text}
        </AppText>
        {action ? <Button variant="link" label={action.label} onPress={action.onPress} /> : null}
      </View>
    </View>
  );
}
