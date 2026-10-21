/**
 * `FanChart { survival; startYm }` (07 §6.0; 00 S3 item 6 "Fan chart (survival from today,
 * 72 months) with a 'ver como tabla' twin"; 04 §3.4, §8).
 *
 * Draws the cumulative probability that USCIS decides the I-485, 1 − S_c(k), for k = 0…72 months
 * from `startYm` (the estimate's month). It is a model estimate for the national pool, not a
 * promised date (04 §8 item 1): no single date is ever highlighted; the readout names a horizon
 * and its probability. The 50 % reference line is recessive.
 */
import { useState } from 'react';
import Svg, { G, Line as SvgLine, Path, Rect, Text as SvgText } from 'react-native-svg';
import type { YearMonth } from '@caa/data-schemas';
import { pluralKey } from '@caa/i18n-core';
import { AppText } from '../components/AppText';
import { useLang } from '../deps';
import { addMonths } from '../format';
import { SVG_FONT_FAMILY, useTheme } from '../theme';
import { ChartFrame, Legend } from './ChartFrame';
import { AXIS_FONT, CHART_HEIGHT, cumulative, fanLayout, fanTableHorizons } from './scales';

export interface FanChartProps {
  survival: number[];
  startYm: YearMonth;
  testID?: string;
}

export function FanChart({ survival, startYm, testID = 'fan-chart' }: FanChartProps) {
  const theme = useTheme();
  const { t, fmt } = useLang();
  const p = cumulative(survival);
  const H = Math.max(0, p.length - 1);
  const [k, setK] = useState(Math.min(12, H));
  const kk = Math.min(k, H);
  const horizonText = (n: number) => t(pluralKey('common:unit.month', n), { n: fmt.int(n) });
  const readout = t('ui:fan.readout', { horizon: horizonText(kk), month: fmt.month(addMonths(startYm, kk)), p: fmt.pct(p[kk] ?? NaN) });
  const summary = t('ui:fan.a11y', { months: fmt.int(H), from: fmt.month(startYm), p12: fmt.pct(p[Math.min(12, H)] ?? NaN) });
  const rows = fanTableHorizons(H).map((n) => [horizonText(n), fmt.month(addMonths(startYm, n)), fmt.pct(p[n] ?? NaN)]);
  return (
    <ChartFrame
      testID={testID}
      summary={summary}
      table={{ caption: t('ui:fan.caption'), columns: [t('ui:fan.horizon'), t('ui:fan.until'), t('ui:fan.probability')], rows }}
      above={
        <AppText testID={`${testID}-readout`} size="sm" weight="medium">
          {readout}
        </AppText>
      }
      below={<Legend items={[{ color: theme.colors.chart1, label: t('ui:fan.legend') }]} />}
    >
      {(width) => {
        const L = fanLayout(survival, startYm, width, { month: fmt.month, pct: fmt.pct });
        const { plot, points } = L;
        if (points.length === 0) return null;
        const line = points.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x},${pt.y}`).join(' ');
        const area = `${line} L${points[points.length - 1]!.x},${plot.y1} L${points[0]!.x},${plot.y1} Z`;
        const sel = points[kk];
        return (
          <Svg width={width} height={CHART_HEIGHT} testID={`${testID}-svg`}>
            {L.yTicks.map((tk) => (
              <G key={`y-${tk.value}`}>
                <SvgLine x1={plot.x0} x2={plot.x1} y1={tk.y} y2={tk.y} stroke={theme.colors.border} strokeWidth={1} strokeDasharray={tk.value === 0.5 ? '4 3' : undefined} />
                <SvgText fontFamily={SVG_FONT_FAMILY} x={plot.x0 - 6} y={tk.y + 4} fontSize={AXIS_FONT} fill={theme.colors.textMuted} textAnchor="end">
                  {fmt.pct(tk.value)}
                </SvgText>
              </G>
            ))}
            <Path d={area} fill={theme.colors.chart1} opacity={0.18} />
            <Path d={line} fill="none" stroke={theme.colors.chart1} strokeWidth={2} strokeLinejoin="round" />
            {sel ? <SvgLine x1={sel.x} x2={sel.x} y1={plot.y0} y2={plot.y1} stroke={theme.colors.textMuted} strokeWidth={1} strokeDasharray="2 3" /> : null}
            {sel ? <Rect x={sel.x - 4} y={sel.y - 4} width={8} height={8} rx={4} fill={theme.colors.chart1} stroke={theme.colors.surface} strokeWidth={2} /> : null}
            <SvgLine x1={plot.x0} x2={plot.x1} y1={plot.y1} y2={plot.y1} stroke={theme.colors.textMuted} strokeWidth={1} />
            {L.xLabels.map((l) => (
              <SvgText fontFamily={SVG_FONT_FAMILY} key={`x-${l.text}`} x={l.x} y={CHART_HEIGHT - 6} fontSize={AXIS_FONT} fill={theme.colors.textMuted} textAnchor={l.anchor}>
                {l.text}
              </SvgText>
            ))}
            {points.map((pt) => (
              <Rect
                key={`hit-${pt.k}`}
                testID={`${testID}-hit-${pt.k}`}
                x={pt.x - L.step / 2}
                y={plot.y0}
                width={Math.max(1, L.step)}
                height={plot.y1 - plot.y0}
                fill="transparent"
                onPress={() => setK(pt.k)}
              />
            ))}
          </Svg>
        );
      }}
    </ChartFrame>
  );
}
