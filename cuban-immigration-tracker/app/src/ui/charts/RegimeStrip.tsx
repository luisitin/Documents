/**
 * `RegimeStrip { clock; regimes; receipt; today }` (07 §6.0; 00 F5 "Clock strip: calendar vs
 * adjudicable days by channel … UNKNOWN channel shows both clocks (CHNV 306 / CBP One 392)";
 * 00 S3 item 1; key facts §3 regimes; doc 16 §8.2).
 *
 * A timeline from the receipt date to today. The hold regimes the clock subtracted
 * (`clock.holdsApplied`, R1 2025-02-14→2025-06-09 and R3 2025-12-02→2026-06-12 by default) are
 * drawn over the waiting time, and every figure is rendered from `clock` (no hard-coded "≈10
 * months", 07 WP8b). Per-regime overlap days use case-rules `regimeOverlapDays`, the same
 * end-exclusive rule the clock uses, so the table adds up to `calendarDays − adjudicableDays`.
 * `unknownChannelClocks` (additive prop, also read from `clock`) shows both channel clocks.
 */
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { View } from 'react-native';
import type { EstimateOk, ISODate, Regime } from '@caa/data-schemas';
import { maxDate, minDate, regimeOverlapDays } from '@caa/case-rules';
import { localize } from '@caa/i18n-core';
import { AppText } from '../components/AppText';
import { useLang } from '../deps';
import { SVG_FONT_FAMILY, useTheme } from '../theme';
import { ChartFrame, Legend } from './ChartFrame';
import { AXIS_FONT, datePos, textWidth } from './scales';

export interface RegimeStripProps {
  clock: EstimateOk['clock'];
  regimes: Regime[];
  receipt: ISODate;
  today: ISODate;
  unknownChannelClocks?: { chnv: number; cbpOne: number };
  testID?: string;
}

export const STRIP_HEIGHT = 64;

export interface StripSegment {
  id: Regime['id'];
  from: ISODate;
  to: ISODate;
  days: number;
  x: number;
  w: number;
}

/** Hold segments clipped to [receipt, today), positioned on a strip [x0, x1] (pure). */
export function stripSegments(clock: EstimateOk['clock'], regimes: Regime[], receipt: ISODate, today: ISODate, x0: number, x1: number): StripSegment[] {
  const origin = receipt.slice(0, 7);
  const total = Math.max(1e-9, datePos(today, origin) - datePos(receipt, origin));
  const scale = (d: ISODate) => x0 + ((datePos(d, origin) - datePos(receipt, origin)) / total) * (x1 - x0);
  const out: StripSegment[] = [];
  for (const r of regimes) {
    if (!r.hold || r.start === null || clock.holdsApplied.indexOf(r.id) < 0) continue;
    const days = regimeOverlapDays(r, receipt, today, 'default');
    if (days <= 0) continue;
    const from = maxDate(receipt, r.start);
    const to = minDate(r.end ?? today, today);
    const a = scale(from);
    const b = scale(to);
    out.push({ id: r.id, from, to, days, x: a, w: Math.max(1, b - a) });
  }
  return out;
}

export function RegimeStrip({ clock, regimes, receipt, today, unknownChannelClocks, testID = 'regime-strip' }: RegimeStripProps) {
  const theme = useTheme();
  const { t, fmt, lang } = useLang();
  const holdDays = Math.max(0, clock.calendarDays - clock.adjudicableDays);
  const both = unknownChannelClocks ?? clock.unknownChannelClocks;
  const lines = [
    t('ui:strip.calendar', { n: fmt.int(clock.calendarDays) }),
    t('ui:strip.holds', { n: fmt.int(holdDays) }),
    t('ui:strip.adjudicable', { n: fmt.int(clock.adjudicableDays) }),
    ...(clock.adjudicableDaysAltOps !== clock.adjudicableDays ? [t('ui:strip.altOps', { n: fmt.int(clock.adjudicableDaysAltOps) })] : []),
    ...(both ? [t('ui:strip.unknownChannel', { chnv: fmt.int(both.chnv), cbpOne: fmt.int(both.cbpOne) })] : []),
    ...(clock.r1 === 'not_applied_low_confidence' ? [t('ui:strip.r1LowConfidence')] : []),
  ];
  const label = (id: Regime['id']) => {
    const r = regimes.find((x) => x.id === id);
    return r ? `${id} · ${localize(r.label, lang)}` : id;
  };
  const tableSegs = stripSegments(clock, regimes, receipt, today, 0, 1);
  const rows = tableSegs.map((s) => [label(s.id), fmt.date(s.from), fmt.date(s.to), fmt.int(s.days)]);
  const summary = t('ui:strip.a11y', { from: fmt.date(receipt), to: fmt.date(today), calendar: fmt.int(clock.calendarDays), adjudicable: fmt.int(clock.adjudicableDays), holds: fmt.int(holdDays) });
  return (
    <ChartFrame
      testID={testID}
      summary={summary}
      height={STRIP_HEIGHT}
      table={{ caption: t('ui:strip.caption'), columns: [t('ui:strip.col.hold'), t('ui:strip.col.from'), t('ui:strip.col.to'), t('ui:strip.col.days')], rows }}
      below={
        <View style={{ gap: theme.space(2) }}>
          <Legend
            items={[
              { color: theme.colors.chart1, label: t('ui:strip.legend.waiting') },
              { color: theme.colors.chart4, label: t('ui:strip.legend.hold') },
            ]}
          />
          <View style={{ gap: theme.space(1) }}>
            {lines.map((l) => (
              <AppText key={l} size="sm">
                {l}
              </AppText>
            ))}
          </View>
        </View>
      }
    >
      {(width) => {
        const x0 = 2;
        const x1 = width - 2;
        const segs = stripSegments(clock, regimes, receipt, today, x0, x1);
        const start = fmt.date(receipt);
        const end = t('ui:strip.today', { date: fmt.date(today) });
        const fits = textWidth(start) + textWidth(end) + 12 <= width;
        return (
          <Svg width={width} height={STRIP_HEIGHT} testID={`${testID}-svg`}>
            <Rect x={x0} y={18} width={Math.max(1, x1 - x0)} height={16} rx={4} fill={theme.colors.chart1} />
            {segs.map((s) => (
              <Rect key={`seg-${s.id}`} x={s.x} y={18} width={s.w} height={16} fill={theme.colors.chart4} stroke={theme.colors.surface} strokeWidth={2} />
            ))}
            {segs.map((s) =>
              s.w >= textWidth(s.id) + 4 ? (
                <SvgText fontFamily={SVG_FONT_FAMILY} key={`lbl-${s.id}`} x={s.x + s.w / 2} y={12} fontSize={AXIS_FONT} fill={theme.colors.textMuted} textAnchor="middle">
                  {s.id}
                </SvgText>
              ) : null,
            )}
            <SvgText fontFamily={SVG_FONT_FAMILY} x={x0} y={52} fontSize={AXIS_FONT} fill={theme.colors.textMuted} textAnchor="start">
              {start}
            </SvgText>
            {fits ? (
              <SvgText fontFamily={SVG_FONT_FAMILY} x={x1} y={52} fontSize={AXIS_FONT} fill={theme.colors.textMuted} textAnchor="end">
                {end}
              </SvgText>
            ) : null}
          </Svg>
        );
      }}
    </ChartFrame>
  );
}
