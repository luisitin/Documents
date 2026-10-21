/**
 * 07 WP6 `useEstimate(caseId | 'example')` and `useCases()`:
 * - 'example' is the T15 fixture; on the frozen bundled sample with today = 2026-10-20 it gives
 *   GOLDEN T15 (04-estimation-model.md §9.2: P(≤12) 0.09229, q50 54, bands, 306 adjudicable days);
 * - it is never written to the KV;
 * - cases are validated, capped at 3 and never keep a name-like extra field or a full receipt.
 */
import { Text } from 'react-native';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { GOLDEN } from '@caa/estimator/golden';
import { referenceCase } from '@caa/estimator';
import type { CaseTimeline } from '@caa/data-schemas';
import { DataProvider } from '@/data/DataProvider';
import type { FetchLike } from '@/data/fetchers';
import { useEstimate } from '@/data/useEstimate';
import { kv } from '@/storage/kv';
import { EXAMPLE_LOCAL_ID, MAX_CASES, clearAllData, getCases, saveCase, useCases } from '@/storage/cases';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'es-US', languageCode: 'es' }] }));

const T0 = Date.parse('2026-10-20T12:00:00Z');
const offline: FetchLike = async () => {
  throw new TypeError('Network request failed');
};
const T15 = GOLDEN.cases.T15 as unknown as {
  pWithin: { m12: number; m3: number; m24: number };
  quantiles: { q50: number | null };
  policyBand12: [number, number];
  structuralBand12: [number, number];
};

let last: ReturnType<typeof useEstimate> | null = null;
function Probe({ id }: { id: string }) {
  last = useEstimate(id);
  const r = last.result;
  const line = r && r.kind === 'estimate' ? `${r.pWithin.m12.toFixed(5)}|${r.quantiles.q50}|${r.clock.adjudicableDays}` : String(r?.kind ?? 'none');
  return <Text testID="est">{line}</Text>;
}

async function mount(id: string) {
  await render(
    <DataProvider fetchImpl={offline} now={() => T0} bases={['https://x.test/']} enforceInterval>
      <Probe id={id} />
    </DataProvider>,
  );
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

describe("useEstimate('example') = T15 on the frozen sample", () => {
  it('reproduces GOLDEN T15 and the 306-day clock', async () => {
    await mount('example');
    await waitFor(() => expect(screen.getByTestId('est').props.children).toMatch(/\|/));
    const r = last?.result;
    expect(r?.kind).toBe('estimate');
    if (r?.kind !== 'estimate') return;
    expect(Math.abs(r.pWithin.m12 - T15.pWithin.m12)).toBeLessThan(5e-4);
    expect(Math.abs(r.pWithin.m3 - T15.pWithin.m3)).toBeLessThan(5e-4);
    expect(Math.abs(r.pWithin.m24 - T15.pWithin.m24)).toBeLessThan(5e-4);
    expect(r.quantiles.q50).toBe(T15.quantiles.q50);
    expect(r.quantiles.q50).toBe(54);
    expect(Math.abs(r.policyBand12[0] - T15.policyBand12[0])).toBeLessThan(5e-4);
    expect(Math.abs(r.structuralBand12[1] - T15.structuralBand12[1])).toBeLessThan(5e-4);
    expect(r.clock.adjudicableDays).toBe(306);
    expect(r.dataThrough).toBe('2026-08');
    expect(r.guards.map((g) => g.id)).toContain('sample_data');
    expect(last?.flags?.noEstimateReason).toBeNull();
    expect(last?.peers.length).toBeGreaterThan(0);
    expect(last?.remedies.length).toBeGreaterThan(0);
  });

  it('never writes the example to the KV', async () => {
    await mount('example');
    expect(kv.get('caa:v1:cases')).toBeNull();
    expect(saveCase(referenceCase()).ok).toBe(false);
    expect(referenceCase().localId).toBe(EXAMPLE_LOCAL_ID);
    expect(kv.get('caa:v1:cases')).toBeNull();
  });

  it('an unknown id gives empty results; an I-220A case gets no numbers', async () => {
    await mount('00000000-0000-4000-8000-0000000000aa');
    expect(last).toEqual({ flags: null, clock: null, result: null, remedies: [], peers: [] });
    await screen.unmount();
    const i220a: CaseTimeline = { ...referenceCase(), localId: '22222222-2222-4222-8222-222222222222', entryChannel: 'I220A' };
    expect(saveCase(i220a).ok).toBe(true);
    await mount(i220a.localId);
    expect(last?.result?.kind).toBe('no_estimate');
    await act(async () => clearAllData());
  });
});

describe('useCases()', () => {
  const mk = (n: number): CaseTimeline => ({ ...referenceCase(), localId: `3333333${n}-3333-4333-8333-333333333333`, nickname: 'Mi caso' });

  it('validates, keeps at most 3 cases and strips unknown fields (no names, no full receipt)', async () => {
    await act(async () => clearAllData());
    for (let i = 0; i < MAX_CASES; i++) expect(saveCase(mk(i)).ok).toBe(true);
    const fourth = saveCase(mk(9));
    expect(fourth.ok).toBe(false);
    expect(getCases().cases).toHaveLength(3);

    const leaky = { ...mk(0), receiptFullLocal: 'IOE0000000000', fullName: 'Nombre Apellido' } as unknown as CaseTimeline;
    expect(saveCase(leaky).ok).toBe(true);
    const stored = kv.get('caa:v1:cases') as string;
    expect(stored).not.toMatch(/IOE0000000000|Nombre Apellido|receiptFullLocal|fullName/);

    const bad = saveCase({ ...mk(1), i485ReceiptDate: '2027-01-01' }); // in the future (02 §8)
    expect(bad.ok).toBe(false);
  });

  it('hook: active case, setActive, remove, clearAll', async () => {
    let api: ReturnType<typeof useCases> | null = null;
    function H() {
      api = useCases();
      return <Text testID="n">{String(api.cases.length)}</Text>;
    }
    await render(<H />);
    const a = () => api as unknown as ReturnType<typeof useCases>;
    expect(a().active?.localId).toBe(mk(0).localId);
    await act(async () => a().setActive(mk(2).localId));
    expect(a().active?.localId).toBe(mk(2).localId);
    await act(async () => a().remove(mk(2).localId));
    expect(a().cases).toHaveLength(2);
    expect(a().active?.localId).toBe(mk(0).localId);
    await act(async () => a().clearAll());
    expect(screen.getByTestId('n').props.children).toBe('0');
    expect(kv.get('caa:v1:cases')).toBeNull();
  });
});
