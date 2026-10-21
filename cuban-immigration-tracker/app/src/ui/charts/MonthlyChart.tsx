/**
 * `MonthlyChart { rows; regimes; metric? }` (07 §6.0 / WP7; 00 S1 "MonthlyChart: approved and
 * denied bars, a pending line, and an R0–R4 band, with a 'ver como tabla' twin. Axis labels are
 * i18n"; data: monthly CSV row "I-485 (Cuban)", doc 04 §1.1 [F]).
 *
 * One measure family per chart, one y-axis (never dual): `completions` = approved + denied stacked
 * bars; `pending` = pending and pending > 6 months lines (headline pending is the monthly CSV,
 * 00 §3 principle 4); `received` = received bars. The regime strip runs along the top (R0–R4,
 * key facts §3) and hold regimes (R1, R3) shade the plot behind the marks. The missing Aug 2024
 * month (02 §2.2) leaves a gap. Tapping a month shows its values in the readout above the chart;
 * the newest month is selected by default (a selective direct label).
 */
import { useState } from 'react';
import Svg, { G, Line as SvgLine, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import type { MonthlyRow, Regime, YearMonth } from '@caa/data-schemas';
import { AppText } from '../components/AppText';
import { useLang } from '../deps';
import { SVG_FONT_FAMILY, useTheme } from '../theme';
import { ChartFrame, Legend } from './ChartFrame';
import { AXIS_FONT, CHART_HEIGHT, monthlyLayout, type MonthlyMetric, type SeriesKey } from './scales';

export interface MonthlyChartProps {
  rows: MonthlyRow[];
  regimes: Regime[];
  metric?: MonthlyMetric;
  testID?: string;
}

const SERIES_KEY: Record<SeriesKey, 'ui:chart.approved' | 'ui:chart.denied' | 'ui:chart.pending' | 'ui:chart.pendingOver6' | 'ui:chart.received'> = {
  approved: 'ui:chart.approved',
  denied: 'ui:chart.denied',
  pending: 'ui:chart.pending',
  pendingOver6: 'ui:chart.pendingOver6',
  received: 'ui:chart.received',
};

function seriesValue(r: MonthlyRow, s: SeriesKey): number | null {
  switch (s) {
    case 'approved':
      return r.approved;
    case 'denied':
      return r.denied;
    case 'pending':
      return r.pending;
    case 'pendingOver6':
      return r.pendingOver6;
    default:
      return r.received;
  }
}

export function MonthlyChart({ rows, regimes, metric = 'completions', testID = 'monthly-chart' }: MonthlyChartProps) {
  const theme = useTheme();
  const { t, fmt } = useLang();
  const sorted = [...rows].sort((a, b) => (a.ym < b.ym ? -1 : 1));
  const [selected, setSelected] = useState<YearMonth | null>(null);
  const color: Record<SeriesKey, string> = {
    approved: theme.colors.chart1,
    denied: theme.colors.chart2,
    pending: theme.colors.chart1,
    pendingOver6: theme.colors.chart3,
    received: theme.colors.chart1,
  };
  const series = metric === 'completions' ? (['approved', 'denied'] as const) : metric === 'pending' ? (['pending', 'pendingOver6'] as const) : (['received'] as const);
  const first = sorted[0]?.ym;
  const last = sorted[sorted.length - 1];
  const metricName = t(`ui:chart.metric.${metric}`);
  const summary = first && last ? t('ui:chart.monthly.a11y', { metric: metricName, from: fmt.month(first), to: fmt.month(last.ym) }) : t('common:state.empty');

  const sel = sorted.find((r) => r.ym === (selected ?? last?.ym));
  const readout = sel
    ? `${fmt.month(sel.ym)}: ${series.map((s) => `${t(SERIES_KEY[s])} ${seriesValue(sel, s) === null ? fmt.int(NaN) : fmt.int(seriesValue(sel, s) as number)}`).join(' · ')}`
    : '';

  const columns = [t('ui:chart.month'), ...series.map((s) => t(SERIES_KEY[s])), ...(metric === 'completions' ? [t('ui:chart.decisions')] : [])];
  const tableRows = sorted.map((r) => [
    fmt.month(r.ym),
    ...series.map((s) => {
      const v = seriesValue(r, s);
      return v === null ? fmt.int(NaN) : fmt.int(v);
    }),
    ...(metric === 'completions' ? [fmt.int(r.approved + r.denied)] : []),
  ]);
  const holdLabel = t('ui:chart.hold');

  return (
    <ChartFrame
      testID={testID}
      summary={summary}
      table={{ caption: t('ui:chart.monthly.caption', { metric: metricName }), columns, rows: tableRows }}
      above={
        <AppText testID={`${testID}-readout`} size="sm" weight="medium">
          {readout}
        </AppText>
      }
      below={
        <Legend
          items={[
            ...series.map((s) => ({ color: color[s], label: t(SERIES_KEY[s]), dashed: metric === 'pending' })),
            { color: theme.colors.border, label: holdLabel },
          ]}
        />
      }
    >
      {(width) => {
        const L = monthlyLayout({ rows: sorted, regimes, metric }, width, { month: fmt.month, value: fmt.int });
        const { plot } = L;
        return (
          <Svg width={width} height={CHART_HEIGHT} testID={`${testID}-svg`}>
            {L.bands.map((b) =>
              b.hold ? <Rect key={`h-${b.id}`} x={b.x} y={plot.y0} width={b.w} height={plot.y1 - plot.y0} fill={theme.colors.border} opacity={0.55} /> : null,
            )}
            {L.bands.map((b) => (
              <G key={`s-${b.id}`}>
                <Rect x={b.x} y={0} width={Math.max(0, b.w - 1)} height={10} fill={b.hold ? theme.colors.textMuted : theme.colors.border} opacity={b.hold ? 0.55 : 1} rx={2} />
                {b.w > 22 ? (
                  <SvgText fontFamily={SVG_FONT_FAMILY} x={b.x + b.w / 2} y={plot.y0 + 10} fontSize={AXIS_FONT - 1} fill={theme.colors.textMuted} textAnchor="middle">
                    {b.id}
                  </SvgText>
                ) : null}
              </G>
            ))}
            {L.yTicks.map((tk) => (
              <G key={`y-${tk.value}`}>
                <SvgLine x1={plot.x0} x2={plot.x1} y1={tk.y} y2={tk.y} stroke={theme.colors.border} strokeWidth={1} />
                <SvgText fontFamily={SVG_FONT_FAMILY} x={plot.x0 - 6} y={tk.y + 4} fontSize={AXIS_FONT} fill={theme.colors.textMuted} textAnchor="end">
                  {tk.text}
                </SvgText>
              </G>
            ))}
            {L.bars.map((b) =>
              b.h > 0 ? <Rect key={`${b.series}-${b.ym}`} x={b.x} y={b.y} width={b.w} height={b.h} rx={Math.min(3, b.w / 3)} fill={color[b.series]} /> : null,
            )}
            {L.lines.map((ln) =>
              ln.segments.map((seg, i) => (
                <Polyline
                  key={`${ln.series}-${i}`}
                  points={seg.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke={color[ln.series]}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeDasharray={ln.series === 'pendingOver6' ? '5 3' : undefined}
                />
              )),
            )}
            <SvgLine x1={plot.x0} x2={plot.x1} y1={plot.y1} y2={plot.y1} stroke={theme.colors.textMuted} strokeWidth={1} />
            {L.xLabels.map((l) => (
              <SvgText fontFamily={SVG_FONT_FAMILY} key={`x-${l.text}`} x={l.x} y={CHART_HEIGHT - 6} fontSize={AXIS_FONT} fill={theme.colors.textMuted} textAnchor={l.anchor}>
                {l.text}
              </SvgText>
            ))}
            {L.columns.map((c) => (
              <Rect
                key={`hit-${c.ym}`}
                testID={`${testID}-hit-${c.ym}`}
                x={c.x}
                y={plot.y0}
                width={c.w}
                height={plot.y1 - plot.y0}
                fill="transparent"
                stroke={c.ym === (selected ?? last?.ym) ? theme.colors.textMuted : 'none'}
                strokeDasharray="2 3"
                onPress={() => setSelected(c.ym)}
              />
            ))}
          </Svg>
        );
      }}
    </ChartFrame>
  );
}
