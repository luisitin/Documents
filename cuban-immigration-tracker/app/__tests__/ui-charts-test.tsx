/**
 * WP7 chart acceptance (07 WP7): charts render at 358 px (390 px phone minus 16 px gutters) and
 * 1,000 px widths with no overflow; axis labels come from `fmt` and switch with the language; every
 * chart has a TableTwin; figures are rendered from the inputs (clock 306/278, T15 drivers
 * "Política 94 % · Oficina 3 % · Orden de la cola 1 %", 04 §8 item 6; scenario weights of 04 §6.1).
 *
 * Data: the bundled SAMPLE snapshot (app/src/data/sample, WP5) and the golden file (04 §9).
 */
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import type { EstimateOk, MonthlyRow, Regime } from '@caa/data-schemas';
import { createFmt } from '@caa/i18n-core';
import { GOLDEN } from '@caa/estimator/golden';
import * as deps from '@/ui/deps';
import {
  DriverBar, FanChart, MonthlyChart, RegimeStrip, ScenarioBars, driverSegments, fanLayout, labelExtent, monthlyLayout, niceTicks,
  stripSegments, textWidth, type MonthlyMetric,
} from '@/ui';

jest.mock('@/ui/deps', () => require('../src/ui/__mocks__/deps'));
const fake = (deps as unknown as { __fake: typeof import('../src/ui/__mocks__/deps').__fake }).__fake;

const national = require('../src/data/sample/national.json') as { rows: MonthlyRow[] };
const policy = require('../src/data/sample/policy.json') as { regimes: Regime[] };
type GoldenCase = { survival: number[]; perScenario: EstimateOk['perScenario']; drivers: EstimateOk['drivers'] };
const T15 = (GOLDEN.cases as unknown as Record<string, GoldenCase>).T15!;
const T11 = GOLDEN.T11 as { calendar: number; r1: number; r3: number; adjudicable: number; altOps: number; holds: string[] };

const CLOCK: EstimateOk['clock'] = {
  calendarDays: T11.calendar,
  adjudicableDays: T11.adjudicable,
  adjudicableDaysAltOps: T11.altOps,
  holdsApplied: T11.holds as EstimateOk['clock']['holdsApplied'],
  r1: 'applied',
};
const WIDTHS = [358, 1000];

afterEach(async () => {
  await act(async () => fake.reset());
});

async function layout(testID: string, width: number) {
  await fireEvent(screen.getByTestId(testID), 'layout', { nativeEvent: { layout: { width, height: 220, x: 0, y: 0 } } });
}

function noOverlap(ext: [number, number][]) {
  for (let i = 1; i < ext.length; i++) expect(ext[i]![0]).toBeGreaterThan(ext[i - 1]![1]);
}

describe('geometry: no overflow at 358 px and 1,000 px', () => {
  const fmt = createFmt('es');
  it.each(WIDTHS.flatMap((w) => (['completions', 'pending', 'received'] as MonthlyMetric[]).map((m) => [w, m] as const)))('MonthlyChart %i px · %s', (width, metric) => {
    const L = monthlyLayout({ rows: national.rows, regimes: policy.regimes, metric }, width, { month: fmt.month, value: fmt.int });
    expect(L.plot.x0).toBeGreaterThan(0);
    expect(L.plot.x1).toBeLessThanOrEqual(width);
    for (const b of L.bars) {
      expect(b.x).toBeGreaterThanOrEqual(L.plot.x0);
      expect(b.x + b.w).toBeLessThanOrEqual(L.plot.x1 + 1e-9);
      expect(b.y).toBeGreaterThanOrEqual(L.plot.y0 - 1e-9);
      expect(b.y + b.h).toBeLessThanOrEqual(L.plot.y1 + 1e-9);
    }
    for (const ln of L.lines) for (const seg of ln.segments) for (const p of seg) {
      expect(p.x).toBeGreaterThanOrEqual(L.plot.x0);
      expect(p.x).toBeLessThanOrEqual(L.plot.x1);
      expect(p.y).toBeGreaterThanOrEqual(L.plot.y0 - 1e-9);
    }
    for (const b of L.bands) {
      expect(b.x).toBeGreaterThanOrEqual(L.plot.x0 - 1e-9);
      expect(b.x + b.w).toBeLessThanOrEqual(L.plot.x1 + 1e-9);
    }
    const ext = L.xLabels.map((l) => labelExtent(l));
    for (const [a, b] of ext) {
      expect(a).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(width);
    }
    noOverlap(ext);
    for (const t of L.yTicks) expect(L.plot.x0 - 6 - textWidth(t.text)).toBeGreaterThanOrEqual(0);
    // The newest month is always labelled; the y-axis covers the data.
    expect(L.xLabels[L.xLabels.length - 1]!.text).toBe('ago 2026');
    expect(L.yTicks[L.yTicks.length - 1]!.value).toBeGreaterThanOrEqual(metric === 'pending' ? 355520 : 0);
  });

  it('the missing Aug 2024 month breaks the pending line (02 §2.2)', () => {
    const L = monthlyLayout({ rows: national.rows, regimes: policy.regimes, metric: 'pending' }, 358, { month: fmt.month, value: fmt.int });
    const pending = L.lines.find((l) => l.series === 'pending')!;
    expect(pending.segments.length).toBe(2);
    expect(pending.segments[0]!.length).toBe(1); // Jul 2024 alone
  });

  it('hold regimes R1 and R3 are shaded; R0–R4 all appear in the strip', () => {
    const L = monthlyLayout({ rows: national.rows, regimes: policy.regimes, metric: 'completions' }, 1000, { month: fmt.month, value: fmt.int });
    expect(L.bands.map((b) => b.id)).toEqual(['R0', 'R1', 'R2', 'R3', 'R4']);
    expect(L.bands.filter((b) => b.hold).map((b) => b.id)).toEqual(['R1', 'R3']);
  });

  it.each(WIDTHS)('FanChart %i px', (width) => {
    const L = fanLayout(T15.survival, '2026-10', width, { month: fmt.month, pct: fmt.pct });
    for (const p of L.points) {
      expect(p.x).toBeGreaterThanOrEqual(L.plot.x0);
      expect(p.x).toBeLessThanOrEqual(width);
      expect(p.y).toBeGreaterThanOrEqual(L.plot.y0 - 1e-9);
      expect(p.y).toBeLessThanOrEqual(L.plot.y1 + 1e-9);
    }
    const ext = L.xLabels.map((l) => labelExtent(l));
    for (const [a, b] of ext) {
      expect(a).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(width);
    }
    noOverlap(ext);
  });

  it.each(WIDTHS)('RegimeStrip %i px: hold segments inside the strip; days add up to the clock (T11)', (width) => {
    const segs = stripSegments(CLOCK, policy.regimes, '2025-03-15', '2026-10-20', 2, width - 2);
    expect(segs.map((s) => [s.id, s.days])).toEqual([['R1', T11.r1], ['R3', T11.r3]]);
    expect(segs.reduce((a, s) => a + s.days, 0)).toBe(CLOCK.calendarDays - CLOCK.adjudicableDays); // 278
    for (const s of segs) {
      expect(s.x).toBeGreaterThanOrEqual(2);
      expect(s.x + s.w).toBeLessThanOrEqual(width - 2 + 1e-9);
    }
  });

  it.each(WIDTHS)('DriverBar %i px: segments fill the width without overflow', (width) => {
    const segs = driverSegments(T15.drivers, width);
    expect(segs.map((s) => s.key)).toEqual(['scenario', 'office', 'beta', 'other']);
    const last = segs[segs.length - 1]!;
    expect(last.x + last.w).toBeLessThanOrEqual(width);
    expect(segs.reduce((a, s) => a + s.share, 0)).toBeCloseTo(1, 12);
  });

  it('niceTicks covers the maximum', () => {
    expect(niceTicks(355520)).toEqual([0, 100000, 200000, 300000, 400000]);
    expect(niceTicks(820)).toEqual([0, 250, 500, 750, 1000]);
    expect(niceTicks(0)).toEqual([0, 1]);
  });
});

describe('rendered charts', () => {
  it.each(WIDTHS)('MonthlyChart renders an SVG of the measured width (%i px), readout, legend, table twin, es→en', async (width) => {
    await act(async () => fake.set({ lang: 'es' }));
    await render(<MonthlyChart rows={national.rows} regimes={policy.regimes} />);
    expect(screen.queryByTestId('monthly-chart-svg')).toBeNull(); // nothing drawn before onLayout
    await layout('monthly-chart-frame', width);
    const svg = screen.getByTestId('monthly-chart-svg');
    const w = svg.props.width ?? StyleSheet.flatten(svg.props.style)?.width;
    expect(Number(w)).toBe(width);
    expect(screen.getByTestId('monthly-chart-readout')).toHaveTextContent('ago 2026: Aprobadas 386 · Negadas 434');
    expect(screen.getByTestId('monthly-chart-frame').props.accessibilityLabel).toMatch(/^Gráfico mensual de decisiones/);
    await fireEvent.press(screen.getByTestId('monthly-chart-hit-2025-03'));
    expect(screen.getByTestId('monthly-chart-readout')).toHaveTextContent(/^mar 2025: Aprobadas/);
    await fireEvent.press(screen.getByTestId('monthly-chart-table-toggle'));
    expect(screen.getByTestId('monthly-chart-table')).toBeTruthy();
    expect(screen.getByLabelText('Mes: ago 2026, Aprobadas: 386, Negadas: 434, Decisiones: 820')).toBeTruthy();
    await act(async () => fake.set({ lang: 'en' }));
    expect(screen.getByTestId('monthly-chart-readout')).toHaveTextContent(/^Mar 2025: Approved/);
    expect(screen.getByLabelText('Month: Aug 2026, Approved: 386, Denied: 434, Decisions: 820')).toBeTruthy();
    expect(screen.getByText('Hide the table')).toBeTruthy();
  });

  it('MonthlyChart pending metric reads the monthly-CSV headline pending', async () => {
    await render(<MonthlyChart rows={national.rows} regimes={policy.regimes} metric="pending" />);
    await layout('monthly-chart-frame', 358);
    expect(screen.getByTestId('monthly-chart-readout')).toHaveTextContent('ago 2026: Pendientes 355,520 · Pendientes > 6 meses 345,741');
  });

  it.each(WIDTHS)('FanChart (T15) at %i px: readout at 12 months = 9 %, table twin', async (width) => {
    await act(async () => fake.set({ lang: 'es' }));
    await render(<FanChart survival={T15.survival} startYm="2026-10" />);
    await layout('fan-chart-frame', width);
    expect(screen.getByTestId('fan-chart-svg')).toBeTruthy();
    expect(screen.getByTestId('fan-chart-readout')).toHaveTextContent('En 12 meses (hasta oct 2027): 9 %');
    await fireEvent.press(screen.getByTestId('fan-chart-hit-24'));
    expect(screen.getByTestId('fan-chart-readout')).toHaveTextContent('En 24 meses (hasta oct 2028): 22 %');
    await fireEvent.press(screen.getByTestId('fan-chart-table-toggle'));
    expect(screen.getByLabelText('Plazo: 36 meses, Hasta: oct 2029, Probabilidad: 35 %')).toBeTruthy();
    await act(async () => fake.set({ lang: 'en' }));
    expect(screen.getByTestId('fan-chart-readout')).toHaveTextContent('Within 24 months (through Oct 2028): 22%');
  });

  it('RegimeStrip renders every figure from clock (306 / 278 / 256)', async () => {
    await act(async () => fake.set({ lang: 'es' }));
    await render(<RegimeStrip clock={CLOCK} regimes={policy.regimes} receipt="2025-03-15" today="2026-10-20" />);
    await layout('regime-strip-frame', 358);
    expect(screen.getByText('Días desde que presentó el I-485: 584')).toBeTruthy();
    expect(screen.getByText('Días bajo pausas de adjudicación: 278')).toBeTruthy();
    expect(screen.getByText('Días adjudicables (sin las pausas): 306')).toBeTruthy();
    expect(screen.getByText('Con las fechas operativas más tardías: 256 días adjudicables')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('regime-strip-table-toggle'));
    expect(screen.getByLabelText(/^Pausa: R1 · Pausa para beneficiarios de parole.*Desde: 15 mar 2025, Hasta: 9 jun 2025, Días en su caso: 86$/)).toBeTruthy();
    await act(async () => fake.set({ lang: 'en' }));
    expect(screen.getByText('Adjudicable days (holds excluded): 306')).toBeTruthy();
  });

  it('RegimeStrip with an UNKNOWN channel shows both clocks (CHNV 306 / CBP One 392)', async () => {
    await render(
      <RegimeStrip clock={{ ...CLOCK, r1: 'both_shown', unknownChannelClocks: { chnv: 306, cbpOne: 392 } }} regimes={policy.regimes} receipt="2025-03-15" today="2026-10-20" />,
    );
    expect(screen.getByText(/con parole CHNV serían 306 días adjudicables; con parole por cita de CBP One, 392/)).toBeTruthy();
  });

  it('ScenarioBars shows weights, P12 and medians (T15)', async () => {
    await act(async () => fake.set({ lang: 'es' }));
    await render(<ScenarioBars perScenario={T15.perScenario} />);
    await fireEvent(screen.getByTestId('scenario-bars'), 'layout', { nativeEvent: { layout: { width: 358, height: 300, x: 0, y: 0 } } });
    expect(screen.getByText('Estancamiento')).toBeTruthy();
    expect(screen.getByText('Ritmo de fines de 2024 (oct–dic 2024)')).toBeTruthy();
    expect(screen.getByTestId('scenario-bars-S0').props.accessibilityLabel).toContain('Peso 30 %');
    expect(screen.getByTestId('scenario-bars-S0').props.accessibilityLabel).toContain('decisión en 12 meses: 2 %');
    expect(screen.getByTestId('scenario-bars-S0').props.accessibilityLabel).toContain('mediana: más de 6 años');
    expect(screen.getByTestId('scenario-bars-S2').props.accessibilityLabel).toContain('decisión en 12 meses: 26 %');
    expect(screen.getByTestId('scenario-bars-S2').props.accessibilityLabel).toContain('mediana: 22 meses');
    await act(async () => fake.set({ lang: 'en' }));
    expect(screen.getByText('Late-2024 pace (Oct–Dec 2024)')).toBeTruthy();
    expect(screen.getByTestId('scenario-bars-S1').props.accessibilityLabel).toContain('decision within 12 months: 10%');
  });

  // 04 §8 item 6 writes "Orden de la cola 1 %"; β's share is 0.0092, and fmt.pct renders every
  // 0 < p < 0.01 as "<1 %" (02 §9, WP4 acceptance pct(0.00906)), so the bar shows "<1 %".
  it('DriverBar (T15): "Política 94 % · Oficina 3 % · Orden de la cola <1 %" (04 §8 item 6, via fmt.pct)', async () => {
    await act(async () => fake.set({ lang: 'es' }));
    await render(<DriverBar drivers={T15.drivers} />);
    expect(screen.getByText('Política 94 %')).toBeTruthy();
    expect(screen.getByText('Oficina 3 %')).toBeTruthy();
    expect(screen.getByText('Orden de la cola <1 %')).toBeTruthy();
    expect(screen.getByLabelText('De dónde viene la incertidumbre del estimado: Política 94 % · Oficina 3 % · Orden de la cola <1 %')).toBeTruthy();
    await act(async () => fake.set({ lang: 'en' }));
    expect(screen.getByText('Policy 94%')).toBeTruthy();
  });
});
