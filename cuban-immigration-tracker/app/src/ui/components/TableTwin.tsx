/**
 * `TableTwin { caption; columns; rows }` (07 §6.0; 04 §8 item 7 "Every chart has a 'ver como
 * tabla' table twin"; 00 §5 "Tables become stacked cards under 480 px").
 *
 * Plain text cells (already formatted by the caller with `fmt`). The width is measured with
 * `onLayout`; under 480 px each row becomes a stacked card of "column: value" lines, so there is
 * never horizontal scroll at 390 px (contract (h)). Each row is one accessible element whose label
 * reads every column with its value.
 */
import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { useTheme } from '../theme';
import { AppText } from './AppText';

export interface TableTwinProps {
  caption: string;
  columns: string[];
  rows: string[][];
  testID?: string;
}

/** Below this width the table is drawn as stacked cards (00 §5). */
export const STACK_BELOW = 480;

export function rowLabel(columns: string[], row: string[]): string {
  return columns.map((c, i) => `${c}: ${row[i] ?? ''}`).join(', ');
}

export function TableTwin({ caption, columns, rows, testID }: TableTwinProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width));
  const stacked = width < STACK_BELOW;
  const id = testID ?? 'table';
  return (
    <View testID={id} onLayout={onLayout} style={{ gap: theme.space(2), width: '100%' }}>
      <AppText size="sm" weight="medium" muted>
        {caption}
      </AppText>
      {stacked ? (
        <View testID={`${id}-stacked`} style={{ gap: theme.space(2) }}>
          {rows.map((row, r) => (
            <View
              key={`${r}-${row[0] ?? ''}`}
              accessible
              accessibilityLabel={rowLabel(columns, row)}
              style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius - 4, padding: theme.space(2.5), gap: theme.space(0.5) }}
            >
              {columns.map((c, i) => (
                <View key={c} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(2) }}>
                  <AppText size="sm" muted style={{ minWidth: 96, flexShrink: 1 }}>
                    {c}
                  </AppText>
                  <AppText size="sm" weight={i === 0 ? 'medium' : 'regular'} style={{ flexShrink: 1 }}>
                    {row[i] ?? ''}
                  </AppText>
                </View>
              ))}
            </View>
          ))}
        </View>
      ) : (
        <View testID={`${id}-grid`} style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius - 4 }}>
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
            {columns.map((c) => (
              <View key={c} style={{ flex: 1, padding: theme.space(2), minWidth: 0 }}>
                <AppText size="sm" weight="bold">
                  {c}
                </AppText>
              </View>
            ))}
          </View>
          {rows.map((row, r) => (
            <View
              key={`${r}-${row[0] ?? ''}`}
              accessible
              accessibilityLabel={rowLabel(columns, row)}
              style={{ flexDirection: 'row', borderBottomWidth: r === rows.length - 1 ? 0 : 1, borderBottomColor: theme.colors.border }}
            >
              {columns.map((c, i) => (
                <View key={c} style={{ flex: 1, padding: theme.space(2), minWidth: 0 }}>
                  <AppText size="sm">{row[i] ?? ''}</AppText>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
