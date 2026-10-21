/**
 * `Tile { title; children; onPress?() }` (07 §6.0). A tappable summary card; with `onPress` it
 * shows a chevron and is announced as a button.
 */
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from '../icons';
import { MIN_TOUCH, useTheme } from '../theme';
import { AppText } from './AppText';

export interface TileProps {
  title: string;
  children?: ReactNode;
  onPress?(): void;
  testID?: string;
}

export function Tile({ title, children, onPress, testID }: TileProps) {
  const theme = useTheme();
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space(2) }}>
      <View style={{ flex: 1, gap: theme.space(1), minWidth: 0 }}>
        <AppText size="sm" weight="medium" muted>
          {title}
        </AppText>
        {children}
      </View>
      {onPress ? <Icon name="chevron-right" color={theme.colors.textMuted} size={20} /> : null}
    </View>
  );
  const style = {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: theme.space(3),
    minHeight: MIN_TOUCH,
  } as const;
  if (!onPress) {
    return (
      <View testID={testID} style={style}>
        {body}
      </View>
    );
  }
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [style, { opacity: pressed ? 0.85 : 1 }]}>
      {body}
    </Pressable>
  );
}
