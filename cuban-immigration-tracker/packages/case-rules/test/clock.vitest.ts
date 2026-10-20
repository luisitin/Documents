/**
 * Clock tests (07 WP3 acceptance; 04-estimation-model.md §9.2 T11, T19, T21, T22; EST-12;
 * key facts §3 `reference_cases`). Today = 2026-10-20.
 */
import { describe, expect, it } from 'vitest';
import { adjudicableDays, clockFor, regimeOverlapDays } from '@caa/case-rules';
import { TODAY, curatedPolicy, ms, policy, variant } from './helpers';

const R1 = policy.regimes.find((r) => r.id === 'R1')!;
const R3 = policy.regimes.find((r) => r.id === 'R3')!;

describe.each([
  ['G0 sample policy', policy],
  ['curated policy (data/curated)', curatedPolicy],
])('clockFor with the %s', (_label, pol) => {
  it('T11: CHNV, receipt 2025-03-15 → calendar 584, adjudicable 306, altOps 256, R1 applied', () => {
    const c = variant({ entryChannel: 'CHNV' });
    const k = clockFor(c, pol, TODAY);
    expect(k.calendarDays).toBe(584);
    expect(k.adjudicableDays).toBe(306);
    expect(k.adjudicableDaysAltOps).toBe(256);
    expect(k.holdsApplied).toEqual(['R1', 'R3']);
    expect(k.r1).toBe('applied');
    expect(k.unknownChannelClocks).toBeUndefined();
    expect(k.calendarDays - k.adjudicableDays).toBe(278); // 00 S3 clock card: 278 hold days
  });

  it('T19: VISA, 2025-03-15 → 392 (R1 not subtracted)', () => {
    const k = clockFor(variant({ entryChannel: 'VISA' }), pol, TODAY);
    expect(k.calendarDays).toBe(584);
    expect(k.adjudicableDays).toBe(392);
    expect(k.holdsApplied).toEqual(['R3']);
    expect(k.r1).toBe('not_applied');
  });

  it("T21: CBP One, 2025-03-15 → 392, r1 'not_applied_low_confidence'", () => {
    const k = clockFor(variant({ entryChannel: 'CBP_ONE' }), pol, TODAY);
    expect(k.adjudicableDays).toBe(392);
    expect(k.r1).toBe('not_applied_low_confidence');
    expect(k.holdsApplied).toEqual(['R3']);
  });

  it('T22: CBP One, parole 2024-02-01, receipt 2025-02-05 → calendar 622, adjudicable 430', () => {
    const c = variant({ entryChannel: 'CBP_ONE', paroleDate: '2024-02-01', i485ReceiptDate: '2025-02-05' });
    const k = clockFor(c, pol, TODAY);
    expect(k.calendarDays).toBe(622);
    expect(k.adjudicableDays).toBe(430);
    expect(k.r1).toBe('not_applied_low_confidence');
  });

  it('UNKNOWN → both clocks (CHNV 306 / CBP One 392), r1 both_shown', () => {
    const k = clockFor(variant({ entryChannel: 'UNKNOWN' }), pol, TODAY);
    expect(k.r1).toBe('both_shown');
    expect(k.unknownChannelClocks).toEqual({ chnv: 306, cbpOne: 392 });
    expect(k.adjudicableDays).toBe(392); // EST-12 literally: only ALL_CUBAN holds for UNKNOWN
  });
});

describe('EST-12 details', () => {
  it('overlaps are end-exclusive: R1 86 days and R3 192 days for the reference filing', () => {
    expect(regimeOverlapDays(R1, '2025-03-15', TODAY, 'default')).toBe(86);
    expect(regimeOverlapDays(R3, '2025-03-15', TODAY, 'default')).toBe(192);
    // altOps uses the latest operational end report (2025-06-25 / 2026-07-16).
    expect(regimeOverlapDays(R1, '2025-03-15', TODAY, 'altOps')).toBe(102);
    expect(regimeOverlapDays(R3, '2025-03-15', TODAY, 'altOps')).toBe(226);
    // A hold ending on day X does not count day X.
    expect(regimeOverlapDays(R1, '2025-06-08', '2025-06-10', 'default')).toBe(1);
  });

  it('a filing after both holds has no hold days; CHNV filed after R1 is not_applied', () => {
    const c = variant({ entryChannel: 'CHNV', i485ReceiptDate: '2026-07-01' }, { drop: ['biometrics', 'ead_c9'] });
    const k = clockFor(c, policy, TODAY);
    expect(k.calendarDays).toBe(111);
    expect(k.adjudicableDays).toBe(111);
    expect(k.holdsApplied).toEqual([]);
    expect(k.r1).toBe('not_applied');
    expect(clockFor(variant({ entryChannel: 'CBP_ONE', i485ReceiptDate: '2026-07-01' }, { drop: ['biometrics', 'ead_c9'] }), policy, TODAY).r1).toBe('not_applied');
  });

  it('a case pending only part of a hold counts only that part (holds never add days)', () => {
    const r = adjudicableDays('2026-01-01', '2026-03-01', policy.regimes, 'CHNV', 'default');
    expect(r).toEqual({ days: 0, holds: ['R3'] });
    for (const ch of ['CHNV', 'CBP_ONE', 'VISA', 'U4U', 'FRP_CFRP', 'OTHER_PAROLE'] as const) {
      const x = adjudicableDays('2024-12-01', TODAY, policy.regimes, ch, 'default');
      expect(x.days).toBeLessThanOrEqual(688); // calendar days 2024-12-01 → 2026-10-20
      expect(x.days).toBeGreaterThanOrEqual(0);
    }
  });

  it('receipt after today gives 0; a decided case stops the clock at the decision date', () => {
    expect(adjudicableDays('2026-11-01', TODAY, policy.regimes, 'CHNV', 'default')).toEqual({ days: 0, holds: [] });
    const c = variant({}, { add: [ms('decision', '2026-09-01', { outcome: 'approved' })] });
    const k = clockFor(c, policy, TODAY);
    expect(k.calendarDays).toBe(535);
    expect(k.adjudicableDays).toBe(535 - 86 - 192);
  });
});
