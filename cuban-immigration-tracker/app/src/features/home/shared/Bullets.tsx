/** A bulleted list of already-translated sentences (plain text, screen-reader friendly). */
import { View } from 'react-native';
import { AppText, useTheme } from '@/ui';

const BULLET = '\u2022';

export function Bullets({ items, testID, size = 'md' }: { items: string[]; testID?: string; size?: 'sm' | 'md' }) {
  const theme = useTheme();
  return (
    <View testID={testID} style={{ gap: theme.space(1.5) }}>
      {items.map((s) => (
        <View key={s} style={{ flexDirection: 'row', gap: theme.space(2) }}>
          <AppText size={size} muted>
            {BULLET}
          </AppText>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText size={size}>{s}</AppText>
          </View>
        </View>
      ))}
    </View>
  );
}
