/**
 * Shared chart shell: measures its width with `onLayout` (07 WP7 "measure their width with
 * onLayout"), renders the SVG only once a width is known, exposes a one-sentence accessible
 * summary, and owns the "Ver como tabla" toggle for the chart's TableTwin (04 §8 item 7).
 */
import { useState, type ReactNode } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { TableTwin } from '../components/TableTwin';
import { useLang } from '../deps';
import { CHART_HEIGHT } from './scales';
import { useTheme } from '../theme';

export interface ChartFrameProps {
  testID: string;
  summary: string;
  height?: number;
  table: { caption: string; columns: string[]; rows: string[][] };
  children(width: number): ReactNode;
  above?: ReactNode;
  below?: ReactNode;
}

export function ChartFrame({ testID, summary, height = CHART_HEIGHT, table, children, above, below }: ChartFrameProps) {
  const theme = useTheme();
  const { t } = useLang();
  const [width, setWidth] = useState(0);
  const [showTable, setShowTable] = useState(false);
  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.floor(e.nativeEvent.layout.width);
    if (w !== width) setWidth(w);
  };
  return (
    <View testID={testID} style={{ gap: theme.space(2), width: '100%' }}>
      {above}
      <View testID={`${testID}-frame`} onLayout={onLayout} accessible accessibilityRole="image" accessibilityLabel={summary} style={{ width: '100%', height, overflow: 'hidden' }}>
        {width > 0 ? children(width) : null}
      </View>
      {below}
      <Button
        testID={`${testID}-table-toggle`}
        variant="link"
        label={showTable ? t('ui:table.hide') : t('ui:table.show')}
        accessibilityHint={t('ui:table.hint')}
        onPress={() => setShowTable((v) => !v)}
      />
      {showTable ? <TableTwin testID={`${testID}-table`} caption={table.caption} columns={table.columns} rows={table.rows} /> : null}
    </View>
  );
}

/** Legend row: a swatch and a text label per series (identity never colour-alone). */
export function Legend({ items }: { items: { color: string; label: string; dashed?: boolean }[] }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(3) }}>
      {items.map((i) => (
        <View key={i.label} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space(1.5) }}>
          <View style={{ width: 14, height: i.dashed ? 3 : 10, borderRadius: 2, backgroundColor: i.color }} />
          <AppText size="sm" muted>
            {i.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}
