/**
 * WP7 component acceptance (07 WP7): render and snapshot tests in both languages and both themes;
 * LangToggle hit area ≥ 48 and the 00 §5 accessibility labels; DataStatusChip texts of 00 §5.1
 * (Prove P8: sample → "Muestra" + "ago 2026"; published → "Publicado …"); in-app Sheet instead of
 * confirm(); form controls; the probability ladder on the T15 golden values (04 §9.2).
 *
 * The WP6 hooks are replaced by src/ui/__mocks__/deps.tsx (real i18n-core strings and the bundled
 * SAMPLE snapshot), so these tests exercise only the kit.
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { StyleSheet, View } from 'react-native';
import type { SourceRef } from '@caa/data-schemas';
import { GOLDEN } from '@caa/estimator/golden';
import * as deps from '@/ui/deps';
import {
  AppHeader, Banner, Button, Card, Checklist, Chip, ConfidenceChip, DataStatusChip, DateField, FormField, LangToggle,
  ProbabilityLadder, Screen, Select, Sheet, StatTile, TableTwin, Tile, composeIso, rangeError, statusLine,
} from '@/ui';

jest.mock('@/ui/deps', () => require('../src/ui/__mocks__/deps'));
const fake = (deps as unknown as { __fake: typeof import('../src/ui/__mocks__/deps').__fake }).__fake;

const NOW = Date.parse('2026-10-20T12:00:00Z');
const SRC: SourceRef = {
  sourceId: 'uscis.monthly_csv',
  url: 'https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data',
  via: 'direct',
  period: '2026-08',
  retrievedAt: '2026-10-20T06:00:00Z',
  evidence: 'F',
};

async function setup(patch: Parameters<typeof fake.set>[0]) {
  await act(async () => {
    fake.reset();
    fake.set(patch);
  });
}

beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(NOW);
});
afterEach(async () => {
  jest.restoreAllMocks();
  await act(async () => fake.reset());
});

const T15 = (GOLDEN.cases as unknown as Record<string, { pWithin: Record<string, number> }>).T15!;
const LADDER = [3, 6, 12, 24, 36].map((m) => ({ months: m, p: T15.pWithin[`m${m}`]! }));

function KitchenSink() {
  return (
    <Screen testID="screen">
      <AppHeader title="Inicio" />
      <Card title="Card" tone="info">
        <Chip label="chip" />
      </Card>
      <Banner tone="warning" text="banner" action={{ label: 'go', onPress: () => {} }} />
      <Tile title="tile" onPress={() => {}} />
      <StatTile value={355520} fieldKey="national.rows[].pending" period="2026-08" source={SRC} format="int" />
      <ConfidenceChip level="LOW" validated={false} />
      <ProbabilityLadder rows={LADDER} />
      <Button label="ok" onPress={() => {}} />
    </Screen>
  );
}

describe.each([
  ['es', 'light'],
  ['es', 'dark'],
  ['en', 'light'],
  ['en', 'dark'],
] as const)('kit renders in %s / %s', (lang, theme) => {
  it('matches the snapshot', async () => {
    await setup({ lang, theme });
    const r = await render(<KitchenSink />);
    expect(r.toJSON()).toMatchSnapshot();
    const bg = StyleSheet.flatten(screen.getByTestId('screen').props.style).backgroundColor;
    expect(bg).toBe(theme === 'dark' ? '#111317' : '#f7f7f5');
  });
});

describe('LangToggle', () => {
  it('has a ≥ 48 × 48 hit area, the 00 §5 labels, and switches the language in one tap', async () => {
    await setup({ lang: 'es' });
    await render(<LangToggle />);
    const btn = screen.getByTestId('lang-toggle');
    const style = StyleSheet.flatten(typeof btn.props.style === 'function' ? btn.props.style({ pressed: false }) : btn.props.style);
    expect(style.minHeight).toBeGreaterThanOrEqual(48);
    expect(style.minWidth).toBeGreaterThanOrEqual(48);
    expect(btn.props.accessibilityLabel).toBe('Cambiar el idioma a inglés');
    expect(btn.props.accessibilityRole).toBe('button');
    await fireEvent.press(btn);
    expect(fake.get().lang).toBe('en');
    expect(screen.getByTestId('lang-toggle').props.accessibilityLabel).toBe('Switch language to Spanish');
    await fireEvent.press(screen.getByTestId('lang-toggle'));
    expect(fake.get().lang).toBe('es');
  });

  it('shows ES | EN with the active language bold', async () => {
    await setup({ lang: 'en' });
    await render(<LangToggle />);
    const en = screen.getByText('EN');
    const es = screen.getByText('ES');
    expect(StyleSheet.flatten(en.props.style).fontWeight).toBe('700');
    expect(StyleSheet.flatten(es.props.style).fontWeight).toBe('400');
  });
});

describe('DataStatusChip', () => {
  it('sample: "Muestra" with the USCIS month ago 2026 (Prove P8), English "Sample · … Aug 2026"', async () => {
    await setup({ lang: 'es', status: 'sample' });
    await render(<DataStatusChip />);
    expect(screen.getByTestId('data-status')).toHaveTextContent('○ Muestra · datos de ejemplo incluidos · USCIS hasta ago 2026');
    await act(async () => fake.set({ lang: 'en' }));
    expect(screen.getByTestId('data-status')).toHaveTextContent('○ Sample · example data bundled · USCIS through Aug 2026');
  });

  it('published (web): "Publicado {fecha} · USCIS hasta {mes}", never a bare "En vivo"', async () => {
    await setup({ lang: 'es', status: 'published', artifactBuiltAt: '2026-10-20T08:00:00Z' });
    await render(<DataStatusChip />);
    expect(screen.getByTestId('data-status')).toHaveTextContent('◆ Publicado 20 oct 2026 · USCIS hasta ago 2026');
    expect(screen.getByTestId('data-status')).not.toHaveTextContent(/En vivo/);
  });

  it('live and cached lines follow 00 §5.1', () => {
    const m = { lastCheckedAt: '2026-10-20T09:00:00Z', dataChangedAt: '2026-10-19T00:00:00Z' };
    const asOf = { latestOfficialMonth: '2026-08', dataChangedAt: m.dataChangedAt };
    expect(statusLine({ status: 'live', manifest: m, asOf }, 'es', NOW)).toBe('● En vivo · USCIS hasta ago 2026 · revisado hace 3 h');
    expect(statusLine({ status: 'live', manifest: m, asOf }, 'en', NOW)).toBe('● Live · USCIS through Aug 2026 · checked 3 h ago');
    expect(statusLine({ status: 'cached', manifest: m, asOf }, 'es', NOW)).toBe('◐ Guardado · USCIS hasta ago 2026 · última conexión 20 oct 2026');
    expect(statusLine({ status: 'cached', manifest: m, asOf }, 'en', NOW)).toBe('◐ Saved · USCIS through Aug 2026 · last online Oct 20, 2026');
  });

  it('opens the provenance sheet with sources and dates, and closes it', async () => {
    await setup({ lang: 'es', status: 'sample' });
    await render(<DataStatusChip />);
    await fireEvent.press(screen.getByTestId('data-status'));
    const sheet = screen.getByTestId('provenance-sheet');
    expect(within(sheet).getByText('De dónde vienen los datos')).toBeTruthy();
    expect(within(sheet).getByText('Último mes oficial de USCIS: agosto de 2026')).toBeTruthy();
    expect(within(sheet).getByText(/Muestra: no hay conexión/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('provenance-close'));
    expect(screen.queryByTestId('provenance-sheet')).toBeNull();
  });
});

describe('AppHeader', () => {
  it('holds the title, the language button and the status chip', async () => {
    await setup({ lang: 'es' });
    await render(<AppHeader title="Inicio" />);
    expect(screen.getByRole('header', { name: 'Inicio' })).toBeTruthy();
    expect(screen.getByTestId('lang-toggle')).toBeTruthy();
    expect(screen.getByTestId('data-status')).toBeTruthy();
  });
});

describe('Sheet (in-app confirm, never window.confirm)', () => {
  it('calls onConfirm / onCancel; destructive puts Cancel first', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const confirmSpy = jest.fn();
    (globalThis as Record<string, unknown>).confirm = confirmSpy;
    await render(<Sheet visible title="Borrar mis datos" body="¿Seguro?" confirmLabel="Borrar" cancelLabel="Cancelar" destructive onConfirm={onConfirm} onCancel={onCancel} />);
    const labels = screen.getAllByRole('button').map((b) => b.props.accessibilityLabel);
    expect(labels.indexOf('Cancelar', 1)).toBeLessThan(labels.indexOf('Borrar'));
    await fireEvent.press(screen.getByTestId('sheet-confirm'));
    await fireEvent.press(screen.getByTestId('sheet-cancel'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(confirmSpy).not.toHaveBeenCalled();
    delete (globalThis as Record<string, unknown>).confirm;
  });
  it('renders nothing when hidden', async () => {
    await render(<Sheet visible={false} title="x" body="y" confirmLabel="a" cancelLabel="b" onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.queryByTestId('sheet-confirm')).toBeNull();
  });
});

describe('StatTile', () => {
  it('shows the value, period, kind chip and source (00 §3 principle 3)', async () => {
    await setup({ lang: 'es' });
    await render(
      <View>
        <StatTile value={355520} fieldKey="national.rows[].pending" period="2026-08" source={SRC} format="int" />
        <StatTile value={20.6} fieldKey="national.rows[].avgMonths" period="2026-08" source={SRC} format="dec1" />
        <StatTile value={0.237} fieldKey="quarterly.approvalBaselines[].share" period={{ fy: 2026, q: 3 }} source={{ ...SRC, sourceId: 'uscis.quarterly_all_forms' }} format="pct" />
      </View>,
    );
    expect(screen.getByText('355,520')).toBeTruthy();
    expect(screen.getByText('Pendientes al cierre del período')).toBeTruthy();
    expect(screen.getByText('20.6 meses')).toBeTruthy();
    expect(screen.getByText('Promedio de los casos terminados')).toBeTruthy();
    expect(screen.getByText('24 %')).toBeTruthy();
    expect(screen.getByText('abr–jun 2026')).toBeTruthy();
    expect(screen.getAllByText('ago 2026').length).toBe(2);
    expect(screen.getAllByText('Fuente: USCIS, informe mensual (CSV)').length).toBe(2);
  });
  it('labels the inquiry date as ≈93 %, secondary (doc 15 §2.2)', async () => {
    await setup({ lang: 'en' });
    await render(<StatTile value={1} fieldKey="offices.processingTimes[].inquiryDate" period="2026-10" source={{ ...SRC, sourceId: 'mirror.jzebedee', via: 'mirror.jzebedee' }} format="int" />);
    expect(screen.getByText('Inquiry date (≈93%, according to secondary sources)')).toBeTruthy();
    expect(screen.getByText('Source: community mirror of the processing times, via a community mirror')).toBeTruthy();
  });
});

describe('ProbabilityLadder (T15 golden, 04 §9.2 / 00 S3 §3)', () => {
  it('es: 1/4/9/22/35 % with word labels', async () => {
    await setup({ lang: 'es' });
    await render(<ProbabilityLadder rows={LADDER} />);
    const expected = [
      ['3', '3 meses', '1\u00a0%', 'muy poco probable'],
      ['6', '6 meses', '4\u00a0%', 'muy poco probable'],
      ['12', '12 meses', '9\u00a0%', 'poco probable'],
      ['24', '24 meses', '22\u00a0%', 'posible'],
      ['36', '36 meses', '35\u00a0%', 'posible'],
    ];
    for (const [m, h, p, w] of expected) {
      expect(screen.getByTestId(`ladder-row-${m}`).props.accessibilityLabel).toBe(`En ${h}: ${p}, ${w}`);
    }
  });
  it('en: 9% unlikely at 12 months', async () => {
    await setup({ lang: 'en' });
    await render(<ProbabilityLadder rows={LADDER} />);
    expect(screen.getByTestId('ladder-row-12').props.accessibilityLabel).toBe('Within 12 months: 9%, unlikely');
  });
});

describe('form controls', () => {
  it('Select opens an in-app list and reports the choice', async () => {
    await setup({ lang: 'es' });
    const onChange = jest.fn();
    await render(<Select testID="ch" label="Entrada" value={null} options={[{ value: 'CHNV', label: 'CHNV' }, { value: 'CBP_ONE', label: 'CBP One' }]} onChange={onChange} />);
    expect(screen.getByTestId('ch').props.accessibilityLabel).toBe('Entrada: Elegir…');
    await fireEvent.press(screen.getByTestId('ch'));
    await fireEvent.press(screen.getByTestId('ch-option-CBP_ONE'));
    expect(onChange).toHaveBeenCalledWith('CBP_ONE');
  });

  it('Checklist answers Sí / No / No sé (null)', async () => {
    await setup({ lang: 'es' });
    const onChange = jest.fn();
    await render(<Checklist items={[{ key: 'i693', label: 'I-693', value: null }]} onChange={onChange} />);
    await fireEvent.press(screen.getByTestId('checklist-i693-yes'));
    await fireEvent.press(screen.getByTestId('checklist-i693-unknown'));
    expect(onChange.mock.calls).toEqual([['i693', true], ['i693', null]]);
    expect(screen.getByTestId('checklist-i693-unknown').props.accessibilityState).toMatchObject({ checked: true });
    expect(screen.getByText('No sé')).toBeTruthy();
  });

  it('DateField: day granularity, "Solo sé el mes" records day 15, range errors in both languages', async () => {
    await setup({ lang: 'es' });
    const onChange = jest.fn();
    const r = await render(<DateField testID="rc" label="Recibo del I-485" value="2025-03-15" granularity="day" max="2026-10-20" onChange={onChange} />);
    await fireEvent.press(screen.getByTestId('rc-only-month'));
    expect(onChange).toHaveBeenLastCalledWith('2025-03-15', 'month');
    await fireEvent.press(screen.getByTestId('rc-month'));
    await fireEvent.press(screen.getByTestId('rc-month-option-02'));
    expect(onChange).toHaveBeenLastCalledWith('2025-02-15', 'day');
    expect(screen.getAllByText('febrero').length).toBeGreaterThan(0);
    await r.rerender(<DateField testID="rc" label="Recibo del I-485" value="2026-11-02" granularity="day" max="2026-10-20" onChange={onChange} />);
    expect(screen.getByText('La fecha no puede ser posterior al 20 oct 2026.')).toBeTruthy();
    await act(async () => fake.set({ lang: 'en' }));
    expect(screen.getByText('The date cannot be after Oct 20, 2026.')).toBeTruthy();
    expect(screen.getAllByText('November').length).toBeGreaterThan(0);
  });

  it('date helpers are pure and timezone-free', () => {
    expect(composeIso({ y: 2024, m: 2, d: 31 }, 'day')).toBe('2024-02-29');
    expect(composeIso({ y: 2025, m: 3, d: null }, 'month')).toBe('2025-03-15');
    expect(composeIso({ y: 2025, m: null, d: 1 }, 'day')).toBeNull();
    expect(rangeError('2026-10-31', 'month', undefined, '2026-10-20')).toBeNull();
    expect(rangeError('2026-11-15', 'month', undefined, '2026-10-20')).toBe('max');
    expect(rangeError('2019-01-01', 'day', '2020-01-01')).toBe('min');
  });

  it('FormField shows help and error text', async () => {
    await render(
      <FormField label="Apodo" help="Solo en este teléfono" error="Demasiado largo">
        <View />
      </FormField>,
    );
    expect(screen.getByText('Solo en este teléfono')).toBeTruthy();
    expect(screen.getByText('Demasiado largo')).toBeTruthy();
  });
});

describe('TableTwin', () => {
  const cols = ['Mes', 'Aprobadas'];
  const rows = [['jul 2026', '308'], ['ago 2026', '386']];
  it('stacks rows as cards under 480 px (00 §5) and draws a grid above', async () => {
    await render(<TableTwin testID="tt" caption="Tabla" columns={cols} rows={rows} />);
    await fireEvent(screen.getByTestId('tt'), 'layout', { nativeEvent: { layout: { width: 358, height: 100, x: 0, y: 0 } } });
    expect(screen.getByTestId('tt-stacked')).toBeTruthy();
    await fireEvent(screen.getByTestId('tt'), 'layout', { nativeEvent: { layout: { width: 560, height: 100, x: 0, y: 0 } } });
    expect(screen.getByTestId('tt-grid')).toBeTruthy();
    expect(screen.getByLabelText('Mes: ago 2026, Aprobadas: 386')).toBeTruthy();
  });
});
