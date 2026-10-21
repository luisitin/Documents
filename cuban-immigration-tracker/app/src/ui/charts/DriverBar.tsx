/**
 * `DriverBar { drivers }` (07 §6.0; 04 §8 item 6: main-effect variance shares of per-path
 * P(≤12) under the posterior weights; golden scenario 0.941, office 0.028, β 0.009 →
 * "Política 94 % · Oficina 3 % · Orden de la cola 1 %"; 00 S3 item 8).
 *
 * A single stacked bar with a 2 px surface gap between segments; the remainder (interactions,
 * shares sum ≤ 1) is a neutral "otros factores" segment. The legend carries every share as text.
 */
import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import type { EstimateOk } from '@caa/data-schemas';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { TableTwin } from '../components/TableTwin';
import { useLang } from '../deps';
import { useTheme } from '../theme';

export interface DriverBarProps {
  drivers: EstimateOk['drivers'];
  testID?: string;
}

export interface DriverSegment {
  key: 'scenario' | 'office' | 'beta' | 'other';
  share: number;
  x: number;
  w: number;
}

/** Segment geometry over [0, width] with 2 px gaps (pure). Order: policy, office, queue, other. */
export function driverSegments(d: EstimateOk['drivers'], width: number): DriverSegment[] {
  const clamp = (v: number) => (Number.isFinite(v) ? Math.max(0, v) : 0);
  const parts: { key: DriverSegment['key']; share: number }[] = [
    { key: 'scenario', share: clamp(d.scenario) },
    { key: 'office', share: clamp(d.office) },
    { key: 'beta', share: clamp(d.beta) },
  ];
  const sum = parts.reduce((a, p) => a + p.share, 0);
  const scale = sum > 1 ? 1 / sum : 1;
  for (const p of parts) p.share *= scale;
  parts.push({ key: 'other', share: Math.max(0, 1 - parts.reduce((a, p) => a + p.share, 0)) });
  const out: DriverSegment[] = [];
  let x = 0;
  for (const p of parts) {
    const w = p.share * width;
    if (w > 0) out.push({ key: p.key, share: p.share, x, w: Math.max(0, w - 2) });
    x += w;
  }
  return out;
}

const LABEL = { scenario: 'ui:driver.scenario', office: 'ui:driver.office', beta: 'ui:driver.beta', other: 'ui:driver.other' } as const;

export function DriverBar({ drivers, testID = 'driver-bar' }: DriverBarProps) {
  const theme = useTheme();
  const { t, fmt } = useLang();
  const [width, setWidth] = useState(0);
  const [showTable, setShowTable] = useState(false);
  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.floor(e.nativeEvent.layout.width));
  const color = { scenario: theme.colors.chart1, office: theme.colors.chart2, beta: theme.colors.chart3, other: theme.colors.border };
  const named = (['scenario', 'office', 'beta'] as const).map((k) => ({ k, text: `${t(LABEL[k])} ${fmt.pct(drivers[k])}` }));
  const line = named.map((n) => n.text).join(' · ');
  const segs = driverSegments(drivers, width);
  return (
    <View testID={testID} style={{ gap: theme.space(2), width: '100%' }}>
      <View onLayout={onLayout} accessible accessibilityRole="image" accessibilityLabel={t('ui:driver.a11y', { line })} style={{ width: '100%', height: 14 }}>
        {width > 0 ? (
          <Svg width={width} height={14} testID={`${testID}-svg`}>
            {segs.map((s) => (
              <Rect key={s.key} x={s.x} y={0} width={Math.max(1, s.w)} height={14} rx={4} fill={color[s.key]} />
            ))}
          </Svg>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(3) }}>
        {named.map((n) => (
          <View key={n.k} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space(1.5) }}>
            <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: color[n.k] }} />
            <AppText size="sm">{n.text}</AppText>
          </View>
        ))}
      </View>
      <AppText size="xs" muted>
        {t('ui:driver.note')}
      </AppText>
      <Button testID={`${testID}-table-toggle`} variant="link" label={showTable ? t('ui:table.hide') : t('ui:table.show')} onPress={() => setShowTable((v) => !v)} />
      {showTable ? (
        <TableTwin
          testID={`${testID}-table`}
          caption={t('ui:driver.caption')}
          columns={[t('ui:driver.col.factor'), t('ui:driver.col.share')]}
          rows={(['scenario', 'office', 'beta'] as const).map((k) => [t(LABEL[k]), fmt.pct(drivers[k])])}
        />
      ) : null}
    </View>
  );
}
