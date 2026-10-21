/**
 * The full disclaimer (00 §8; 05 §5.1: shown on S0, under every estimate, on the EAD and remedies
 * screens and in Más → Acerca de; WP8a also pins it at the foot of every data screen). The text is
 * `common:disclaimer.full`, so it switches language with the rest of the app (owner requirement 1).
 * `testID="disclaimer"` is the Prove selector (07 §9 P6 "the disclaimer").
 */
import { View } from 'react-native';
import { useLang } from '@/i18n/useLang';
import { AppText, useTheme } from '@/ui';

export function Disclaimer({ short = false }: { short?: boolean }) {
  const { t } = useLang();
  const theme = useTheme();
  return (
    <View style={{ paddingTop: theme.space(2), borderTopWidth: 1, borderTopColor: theme.colors.border }}>
      <AppText testID="disclaimer" size="xs" muted>
        {t(short ? 'common:disclaimer.short' : 'common:disclaimer.full')}
      </AppText>
    </View>
  );
}
