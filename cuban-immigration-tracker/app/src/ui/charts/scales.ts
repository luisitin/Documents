/**
 * Pure chart geometry (WP7 charts; dataviz mark specs: thin marks, 2 px lines, a 2 px surface gap
 * between stacked segments, recessive grid, selective labels; one y-axis only, never dual).
 *
 * Everything here is a pure function of the data and the measured width, so the "no overflow at
 * 358 px and 1,000 px" acceptance is tested on the numbers (app/__tests__/ui-charts-test.tsx),
 * independently of the SVG renderer. Labels are passed in already formatted (`fmt`), so the
 * geometry never formats numbers itself (I18N-2).
 */
import type { ISODate, MonthlyRow, Regime, YearMonth } from '@caa/data-schemas';
import { addMonths, monthIndex } from '../format';

export const CHART_HEIGHT = 220;
export const AXIS_FONT = 11;
const CHAR_W = 0.62; // average glyph width / font size for the system UI font (conservative)

/** Rough rendered width of a label in px (system font). */
export function textWidth(s: string, fontSize = AXIS_FONT): number {
  return Math.ceil(s.length * fontSize * CHAR_W);
}

/** A "nice" step (1, 2, 2.5, 5 × 10^k) so that about `count` steps cover `max`. */
export function niceStep(max: number, count = 4): number {
  if (!(max > 0) || !Number.isFinite(max)) return 1;
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  for (const m of [1, 2, 2.5, 5, 10]) if (raw <= m * mag) return m * mag;
  return 10 * mag;
}

/** Ticks 0, step, … up to the first tick ≥ max. */
export function niceTicks(max: number, count = 4): number[] {
  const step = niceStep(max, count);
  const out = [0];
  while ((out[out.length - 1] as number) < max - 1e-9) out.push(Number(((out.length) * step).toPrecision(12)));
  if (out.length === 1) out.push(step);
  return out;
}

export interface Plot {
  x0: number;
  x1: number;
  y0: number; // top
  y1: number; // bottom (baseline)
}

export interface XLabel {
  x: number;
  text: string;
  anchor: 'start' | 'middle' | 'end';
}

/**
 * Picks every n-th category label so labels never collide, and anchors the first/last label so
 * they never leave [0, width].
 */
export function xLabels(centers: number[], texts: string[], width: number, fontSize = AXIS_FONT): XLabel[] {
  if (centers.length === 0) return [];
  const widest = Math.max(...texts.map((t) => textWidth(t, fontSize)));
  const spacing = centers.length > 1 ? (centers[centers.length - 1]! - centers[0]!) / (centers.length - 1) : width;
  const stride = Math.max(1, Math.ceil((widest + 10) / Math.max(1, spacing)));
  const out: XLabel[] = [];
  // Anchor the stride on the LAST category so the newest month is always labelled.
  for (let i = centers.length - 1; i >= 0; i -= stride) {
    const x = centers[i]!;
    const text = texts[i]!;
    const w = textWidth(text, fontSize);
    let anchor: XLabel['anchor'] = 'middle';
    if (x - w / 2 < 0) anchor = 'start';
    else if (x + w / 2 > width) anchor = 'end';
    const label: XLabel = { x: anchor === 'start' ? Math.max(0, x - 4) : anchor === 'end' ? Math.min(width, x + 4) : x, text, anchor };
    // Edge anchoring can pull a label toward its neighbour: drop it rather than overlap.
    const next = out[0];
    if (next && labelExtent(label, fontSize)[1] + 4 > labelExtent(next, fontSize)[0]) continue;
    out.unshift(label);
  }
  return out;
}

/** The horizontal extent [left, right] a label occupies (for overflow checks). */
export function labelExtent(l: XLabel, fontSize = AXIS_FONT): [number, number] {
  const w = textWidth(l.text, fontSize);
  if (l.anchor === 'start') return [l.x, l.x + w];
  if (l.anchor === 'end') return [l.x - w, l.x];
  return [l.x - w / 2, l.x + w / 2];
}

// ── MonthlyChart ─────────────────────────────────────────────────────────────────────────────

export type MonthlyMetric = 'completions' | 'pending' | 'received';
export type SeriesKey = 'approved' | 'denied' | 'pending' | 'pendingOver6' | 'received';

export interface Bar {
  x: number;
  y: number;
  w: number;
  h: number;
  series: SeriesKey;
  ym: YearMonth;
}

export interface Line {
  series: SeriesKey;
  segments: { x: number; y: number }[][];
}

export interface Band {
  id: Regime['id'];
  x: number;
  w: number;
  hold: boolean;
}

export interface MonthlyLayout {
  plot: Plot;
  bars: Bar[];
  lines: Line[];
  yTicks: { y: number; value: number; text: string }[];
  xLabels: XLabel[];
  bands: Band[];
  columns: { ym: YearMonth; x: number; w: number }[]; // hit targets (one per month in the span)
  series: SeriesKey[];
}

/** Series drawn for each metric (one unit per chart: no dual axis). */
export const METRIC_SERIES: Readonly<Record<MonthlyMetric, SeriesKey[]>> = Object.freeze({
  completions: ['approved', 'denied'],
  pending: ['pending', 'pendingOver6'],
  received: ['received'],
});

/** Max of the plotted quantity for a metric (stacked for completions). */
function metricMax(rows: MonthlyRow[], metric: MonthlyMetric): number {
  let m = 0;
  for (const r of rows) {
    const v = metric === 'completions' ? r.approved + r.denied : metric === 'pending' ? Math.max(r.pending, r.pendingOver6 ?? 0) : r.received;
    if (v > m) m = v;
  }
  return m;
}

/** Fractional month position of an ISO date relative to `origin` (0 = start of origin month). */
export function datePos(d: ISODate, origin: YearMonth): number {
  const ymIdx = monthIndex(d.slice(0, 7)) - monthIndex(origin);
  const day = Number(d.slice(8, 10));
  return ymIdx + (Math.max(1, day) - 1) / 30.4375;
}

export function monthlyLayout(
  input: { rows: MonthlyRow[]; regimes: Regime[]; metric: MonthlyMetric },
  width: number,
  label: { month(ym: YearMonth): string; value(n: number): string },
  height = CHART_HEIGHT,
): MonthlyLayout {
  const rows = [...input.rows].sort((a, b) => (a.ym < b.ym ? -1 : a.ym > b.ym ? 1 : 0));
  const series = METRIC_SERIES[input.metric];
  const empty: MonthlyLayout = { plot: { x0: 0, x1: width, y0: 0, y1: height }, bars: [], lines: [], yTicks: [], xLabels: [], bands: [], columns: [], series };
  if (rows.length === 0 || !(width > 0)) return empty;
  const first = rows[0]!.ym;
  const span = monthIndex(rows[rows.length - 1]!.ym) - monthIndex(first) + 1;
  const ticks = niceTicks(metricMax(rows, input.metric));
  const tickTexts = ticks.map((v) => label.value(v));
  const left = Math.max(...tickTexts.map((s) => textWidth(s))) + 8;
  const plot: Plot = { x0: left, x1: width - 6, y0: 14, y1: height - 22 };
  const pw = Math.max(1, plot.x1 - plot.x0);
  const band = pw / span;
  const top = ticks[ticks.length - 1]!;
  const yOf = (v: number) => plot.y1 - (v / top) * (plot.y1 - plot.y0);
  const center = (ym: YearMonth) => plot.x0 + (monthIndex(ym) - monthIndex(first) + 0.5) * band;
  const barW = Math.max(1, Math.min(28, band * 0.68));

  const bars: Bar[] = [];
  const lines: Line[] = [];
  if (input.metric === 'completions' || input.metric === 'received') {
    for (const r of rows) {
      const cx = center(r.ym);
      const x = cx - barW / 2;
      if (input.metric === 'received') {
        bars.push({ x, y: yOf(r.received), w: barW, h: plot.y1 - yOf(r.received), series: 'received', ym: r.ym });
      } else {
        const ya = yOf(r.approved);
        bars.push({ x, y: ya, w: barW, h: plot.y1 - ya, series: 'approved', ym: r.ym });
        const yd = yOf(r.approved + r.denied);
        // 2 px surface gap between stacked segments (dataviz spacer rule).
        const h = Math.max(0, ya - yd - (r.approved > 0 ? 2 : 0));
        bars.push({ x, y: yd, w: barW, h, series: 'denied', ym: r.ym });
      }
    }
  } else {
    for (const key of ['pending', 'pendingOver6'] as const) {
      const segments: { x: number; y: number }[][] = [];
      let cur: { x: number; y: number }[] = [];
      let prev: YearMonth | null = null;
      for (const r of rows) {
        const v = r[key];
        const contiguous = prev !== null && monthIndex(r.ym) - monthIndex(prev) === 1;
        if (v === null || v === undefined) {
          if (cur.length) segments.push(cur);
          cur = [];
          prev = null;
          continue;
        }
        if (!contiguous && cur.length) {
          segments.push(cur); // a missing month (Aug 2024, 02 §2.2) breaks the line
          cur = [];
        }
        cur.push({ x: center(r.ym), y: yOf(v) });
        prev = r.ym;
      }
      if (cur.length) segments.push(cur);
      lines.push({ series: key, segments });
    }
  }

  const bands: Band[] = [];
  for (const rg of input.regimes) {
    const s = rg.start === null ? 0 : datePos(rg.start, first);
    const e = rg.end === null ? span : datePos(rg.end, first) + 1 / 30.4375;
    const a = Math.max(0, s);
    const b = Math.min(span, e);
    if (b <= a) continue;
    bands.push({ id: rg.id, x: plot.x0 + a * band, w: (b - a) * band, hold: rg.hold });
  }

  const allMonths: YearMonth[] = Array.from({ length: span }, (_, i) => addMonths(first, i));
  const columns = allMonths.map((ym, i) => ({ ym, x: plot.x0 + i * band, w: band }));
  const present = rows.map((r) => r.ym);
  const xl = xLabels(present.map(center), present.map(label.month), width);
  return {
    plot,
    bars,
    lines,
    yTicks: ticks.map((v, i) => ({ y: yOf(v), value: v, text: tickTexts[i]! })),
    xLabels: xl,
    bands,
    columns,
    series,
  };
}

// ── FanChart ─────────────────────────────────────────────────────────────────────────────────

export interface FanLayout {
  plot: Plot;
  points: { k: number; x: number; y: number; p: number }[];
  yTicks: { y: number; value: number }[];
  xLabels: XLabel[];
  step: number;
}

/** Cumulative P(decided by month k) = 1 − S(k) (04 §3.4; `survival` = S_c(0..72), S_c(0) = 1). */
export function cumulative(survival: number[]): number[] {
  return survival.map((s) => (Number.isFinite(s) ? Math.min(1, Math.max(0, 1 - s)) : 0));
}

export function fanLayout(survival: number[], startYm: YearMonth, width: number, label: { month(ym: YearMonth): string; pct(p: number): string }, height = CHART_HEIGHT): FanLayout {
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const left = Math.max(...ticks.map((t) => textWidth(label.pct(t)))) + 8;
  const plot: Plot = { x0: left, x1: width - 10, y0: 10, y1: height - 22 };
  const p = cumulative(survival);
  const H = Math.max(1, p.length - 1);
  const xOf = (k: number) => plot.x0 + (k / H) * (plot.x1 - plot.x0);
  const yOf = (v: number) => plot.y1 - v * (plot.y1 - plot.y0);
  const points = p.map((v, k) => ({ k, x: xOf(k), y: yOf(v), p: v }));
  // Year-spaced labels (every 12 months), thinned further when narrow.
  const ks: number[] = [];
  for (let k = 0; k <= H; k += 12) ks.push(k);
  const texts = ks.map((k) => label.month(addMonths(startYm, k)));
  const xl = width > 0 ? xLabels(ks.map(xOf), texts, width) : [];
  return { plot, points, yTicks: ticks.map((v) => ({ y: yOf(v), value: v })), xLabels: xl, step: H > 0 ? (plot.x1 - plot.x0) / H : 0 };
}

/** The table-twin horizons for the fan chart (subset of 0..H). */
export function fanTableHorizons(H: number): number[] {
  return [3, 6, 12, 24, 36, 48, 60, 72].filter((k) => k <= H);
}
