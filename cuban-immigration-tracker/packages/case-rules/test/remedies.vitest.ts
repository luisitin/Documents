/**
 * Remedy tests (07 WP3 acceptance "Remedy tests (RC6)"; 00 S7; doc 15 §2.2, §9.1).
 *
 * The ETA expectations are the exact values pinned in 07 WP3 [V computed 2026-10-20]:
 * MIA 2028-01-30 → 2028-01; HIA 2027-10-06 → 2027-10; KND 2027-10-22 → 2027-10; TAM 2027-07-28 → 2027-07,
 * from the doc 15 §2.2 points (2024-10-18 → 2026-10-15) and receipt 2025-03-15.
 */
import { describe, expect, it } from 'vitest';
import type { OfficesFile, RemedyStep } from '@caa/data-schemas';
import { deriveFlags, remedyEta, remedyLadder, REMEDY_KEYS } from '@caa/case-rules';
import { TODAY, ms, offices, policy, t15, variant } from './helpers';

const ladder = (c: ReturnType<typeof t15>, today = TODAY, off: OfficesFile = offices) => remedyLadder(c, deriveFlags(c, policy, today), off, policy, today);
const rung = (steps: RemedyStep[], r: RemedyStep['rung']) => {
  const s = steps.find((x) => x.rung === r);
  if (!s) throw new Error(`no rung ${r}`);
  return s;
};

describe('remedyEta (pinned formula)', () => {
  it.each([
    ['MIA', '2028-01-30', '2028-01'],
    ['HIA', '2027-10-06', '2027-10'],
    ['KND', '2027-10-22', '2027-10'],
    ['TAM', '2027-07-28', '2027-07'],
  ])('%s → %s (%s)', (code, etaDate, etaMonth) => {
    const h = offices.inquiryDateHistory.find((x) => x.officeCode === code && x.subtype === '131A-FAM')!;
    expect(remedyEta(h, '2025-03-15')).toEqual({ etaDate, etaMonth });
  });

  it('fewer than 2 points, or rate ≤ 0 → null', () => {
    const one = { officeCode: 'MIA', subtype: '131A-FAM', points: [{ publicationDate: '2026-10-15', inquiryDate: '2023-06-17' }] };
    expect(remedyEta(one, '2025-03-15')).toBeNull();
    const flat = { officeCode: 'MIA', subtype: '131A-FAM', points: [
      { publicationDate: '2024-10-18', inquiryDate: '2023-06-17' }, { publicationDate: '2026-10-15', inquiryDate: '2023-06-17' }] };
    expect(remedyEta(flat, '2025-03-15')).toBeNull();
    const backwards = { officeCode: 'MIA', subtype: '131A-FAM', points: [
      { publicationDate: '2024-10-18', inquiryDate: '2023-06-17' }, { publicationDate: '2026-10-15', inquiryDate: '2023-01-01' }] };
    expect(remedyEta(backwards, '2025-03-15')).toBeNull();
  });

  it('uses the first and the latest point by publication date, whatever the array order', () => {
    const h = offices.inquiryDateHistory.find((x) => x.officeCode === 'MIA')!;
    const mid = { publicationDate: '2025-10-01', inquiryDate: '2021-01-01' };
    const shuffled = { ...h, points: [h.points[1]!, mid, h.points[0]!] };
    expect(remedyEta(shuffled, '2025-03-15')).toEqual({ etaDate: '2028-01-30', etaMonth: '2028-01' });
  });
});

describe('remedyLadder', () => {
  it('order and shape: a_i485, a_c9, b, d, c, e, f; every key is in REMEDY_KEYS', () => {
    const steps = ladder(t15());
    expect(steps.map((s) => s.rung)).toEqual(['a_i485', 'a_c9', 'b', 'd', 'c', 'e', 'f']);
    for (const s of steps) {
      expect(REMEDY_KEYS).toContain(s.titleKey);
      expect(REMEDY_KEYS).toContain(s.bodyKey);
      for (const v of Object.values(s.params)) expect(['string', 'number']).toContain(typeof v);
    }
  });

  it.each([
    ['MIA', '2028-01', '2023-06-17'],
    ['HIA', '2027-10', '2024-07-05'],
    ['KND', '2027-10', '2024-05-28'],
    ['TAM', '2027-07', '2024-08-07'],
  ])('on 2026-10-20 the I-485 rung is not_yet at %s with ETA %s', (code, etaMonth, inquiry) => {
    const s = rung(ladder(variant({ officeCode: code, state: 'FL' })), 'a_i485');
    expect(s.state).toBe('not_yet');
    expect(s.etaMonth).toBe(etaMonth);
    expect(s.gate).toEqual({ inquiryDate: inquiry, retrievedAt: '2026-10-20T00:00:00Z' });
    expect(s.params.inquiryDate).toBe(inquiry);
    expect(s.params.officeCode).toBe(code);
    expect(s.bodyKey).toBe('remedies:a_i485.body.not_yet');
  });

  it('reference case (office unknown): I-485 rung depends, "no disponible", no gate decision', () => {
    const s = rung(ladder(t15()), 'a_i485');
    expect(s.state).toBe('depends');
    expect(s.gate).toEqual({ inquiryDate: null });
    expect(s.etaMonth).toBeUndefined();
    expect(s.bodyKey).toBe('remedies:a_i485.body.office_unknown');
  });

  it('office known but no inquiry date → depends with no gate decision', () => {
    const noDate: OfficesFile = { ...offices, processingTimes: offices.processingTimes.map((r) => (r.officeCode === 'MIA' ? { ...r, inquiryDate: null } : r)) };
    const s = rung(ladder(variant({ officeCode: 'MIA' }), TODAY, noDate), 'a_i485');
    expect(s.state).toBe('depends');
    expect(s.gate?.inquiryDate).toBeNull();
    expect(s.bodyKey).toBe('remedies:a_i485.body.no_inquiry_date');
    const missing = rung(ladder(variant({ officeCode: 'ORL' })), 'a_i485');
    expect(missing.state).toBe('depends');
    expect(missing.gate).toEqual({ inquiryDate: null });
  });

  it('receipt before the inquiry date → available; no history → depends (no_eta)', () => {
    const early = rung(ladder(variant({ officeCode: 'MIA', i485ReceiptDate: '2023-01-10' }, { drop: ['biometrics', 'ead_c9'] })), 'a_i485');
    expect(early.state).toBe('available');
    const houNoHistory = rung(ladder(variant({ officeCode: 'HOU', state: 'TX' })), 'a_i485');
    expect(houNoHistory.state).toBe('depends');
    expect(houNoHistory.bodyKey).toBe('remedies:a_i485.body.no_eta');
    expect(houNoHistory.gate?.inquiryDate).toBe('2023-10-29');
  });

  it('month-granularity receipt is compared at month level', () => {
    const sameMonth = rung(ladder(variant({ officeCode: 'MIA', i485ReceiptDate: '2023-06-15', i485ReceiptDateGranularity: 'month' }, { drop: ['biometrics', 'ead_c9'] })), 'a_i485');
    expect(sameMonth.state).toBe('depends');
    expect(sameMonth.bodyKey).toBe('remedies:a_i485.body.same_month');
    const before = rung(ladder(variant({ officeCode: 'MIA', i485ReceiptDate: '2023-05-15', i485ReceiptDateGranularity: 'month' }, { drop: ['biometrics', 'ead_c9'] })), 'a_i485');
    expect(before.state).toBe('available');
  });

  it('(c)(9) rung: not applicable with an EAD (reference case); available without one (T23 twin)', () => {
    expect(rung(ladder(t15()), 'a_c9').state).toBe('not_applicable');
    expect(rung(ladder(t15()), 'a_c9').bodyKey).toBe('remedies:a_c9.body.ead_received');
    const t23 = variant({}, { drop: ['ead_c9'] });
    const s = rung(ladder(t23), 'a_c9');
    expect(s.state).toBe('available'); // 2025-03-15 < NBC 147-C9 2025-06-13
    expect(s.gate?.inquiryDate).toBe('2025-06-13');
    // Filed after the NBC inquiry date: not yet, and with no 147-C9 history → depends.
    const late = rung(ladder(variant({ i485ReceiptDate: '2025-08-01' }, { drop: ['ead_c9', 'biometrics'] })), 'a_c9');
    expect(late.state).toBe('depends');
    expect(late.bodyKey).toBe('remedies:a_c9.body.no_eta');
    expect(rung(ladder(variant({ concurrentI765: false }, { drop: ['ead_c9'] })), 'a_c9').state).toBe('not_applicable');
  });

  it('expedite: available with a documented hardship; otherwise depends ("needing the work permit alone is not a reason")', () => {
    expect(rung(ladder(t15()), 'b').state).toBe('depends');
    expect(rung(ladder(t15()), 'b').bodyKey).toBe('remedies:b.body.no_hardship');
    const s = rung(ladder(variant({ hardship: ['job_loss_documented'] })), 'b');
    expect(s.state).toBe('available');
    expect(s.params.hardship).toBe('job_loss_documented');
  });

  it('congressional: always offered; FL lists FL-26/27/28', () => {
    expect(rung(ladder(t15()), 'd').state).toBe('available');
    const fl = rung(ladder(variant({ state: 'FL' })), 'd');
    expect(fl.bodyKey).toBe('remedies:d.body.state_offices');
    expect(fl.params.districts).toBe('FL-26, FL-27, FL-28');
    expect(rung(ladder(variant({ state: 'TX' })), 'd').bodyKey).toBe('remedies:d.body.default');
  });

  it('Ombudsman: not yet before an e-Request / congressional inquiry ≥ 30 days old; then depends or available', () => {
    expect(rung(ladder(t15()), 'c').state).toBe('not_yet');
    const recent = rung(ladder(variant({}, { add: [ms('congressional_inquiry', '2026-10-01')] })), 'c');
    expect(recent.state).toBe('not_yet');
    expect(recent.params.eligibleFromDate).toBe('2026-10-31');
    expect(rung(ladder(variant({}, { add: [ms('congressional_inquiry', '2026-09-01')] })), 'c').state).toBe('depends');
    expect(rung(ladder(variant({ hardship: ['medical_emergency'] }, { add: [ms('congressional_inquiry', '2026-09-01')] })), 'c').state).toBe('available');
  });

  it('mandamus: soft from 24 months, strong from 36; before that, the hold-vacatur argument or not yet', () => {
    const ref = rung(ladder(t15()), 'e'); // 19 months, held under R1 + R3
    expect(ref.state).toBe('depends');
    expect(ref.bodyKey).toBe('remedies:e.body.hold_argument');
    expect(ref.params.softDate).toBe('2027-03-15');
    expect(ref.params.strongDate).toBe('2028-03-15');
    expect(ref.params.feeUsd).toBe(405);
    expect(ref.etaMonth).toBe('2027-03');
    expect(rung(ladder(t15(), '2027-03-14'), 'e').bodyKey).toBe('remedies:e.body.hold_argument');
    const soft = rung(ladder(t15(), '2027-03-15'), 'e');
    expect(soft.state).toBe('available');
    expect(soft.bodyKey).toBe('remedies:e.body.soft');
    expect(rung(ladder(t15(), '2028-03-14'), 'e').bodyKey).toBe('remedies:e.body.soft');
    expect(rung(ladder(t15(), '2028-03-15'), 'e').bodyKey).toBe('remedies:e.body.strong');
    const fresh = rung(ladder(variant({ i485ReceiptDate: '2026-07-01' }, { drop: ['biometrics', 'ead_c9'] })), 'e');
    expect(fresh.state).toBe('not_yet');
    expect(fresh.etaMonth).toBe('2028-07');
  });

  it('appointments: depends (concrete needs only), with the Contact Center number', () => {
    const f = rung(ladder(t15()), 'f');
    expect(f.state).toBe('depends');
    expect(f.params.phone).toBe('1-800-375-5283');
    expect(f.params.spanishOption).toBe(2);
  });

  it('denial branch: a single I-290B step with 30/33-day deadlines (doc 15 §6.5, §9.1 step 9)', () => {
    const steps = ladder(variant({}, { add: [ms('decision', '2026-10-01', { outcome: 'denied' })] }));
    expect(steps).toHaveLength(1);
    expect(steps[0]).toMatchObject({ rung: 'denial', state: 'available', bodyKey: 'remedies:denial.body.default' });
    expect(steps[0]!.params).toMatchObject({ deadlineDate: '2026-10-31', deadlineMailedDate: '2026-11-03', days: 30, mailedDays: 33 });
  });

  it('denial with a month-only decision date: no deadline dates (they could be ~2 weeks late), only the 30/33-day rule', () => {
    const steps = ladder(variant({}, { add: [ms('decision', '2026-09-15', { outcome: 'denied' }, 'month')] }));
    expect(steps).toHaveLength(1);
    const p = steps[0]!.params;
    expect(p).toMatchObject({ days: 30, mailedDays: 33, decisionMonth: '2026-09' });
    expect(p.deadlineDate).toBeUndefined();
    expect(p.deadlineMailedDate).toBeUndefined();
    expect(p.decisionDate).toBeUndefined();
  });

  it('e-Request ETA on or before today (stale publication): depends / eta_passed, never a past "not yet" month', () => {
    // Synthetic TEST history: pub 2026-01-15 inq 2024-01-01 → pub 2026-08-15 inq 2024-07-05; receipt 2024-07-06 → ETA 2026-08-17.
    const stale: OfficesFile = {
      ...offices,
      processingTimes: offices.processingTimes.map((r) => (r.form === 'I-485' && r.subtype === '131A-FAM' && r.officeCode === 'MIA'
        ? { ...r, inquiryDate: '2024-07-05', publicationDate: '2026-08-15' } : r)),
      inquiryDateHistory: offices.inquiryDateHistory.filter((h) => !(h.officeCode === 'MIA' && h.subtype === '131A-FAM')).concat([
        { officeCode: 'MIA', subtype: '131A-FAM', points: [
          { publicationDate: '2026-01-15', inquiryDate: '2024-01-01' }, { publicationDate: '2026-08-15', inquiryDate: '2024-07-05' }] }]),
    };
    const c = variant({ officeCode: 'MIA', i485ReceiptDate: '2024-07-06' });
    expect(remedyEta(stale.inquiryDateHistory.find((h) => h.officeCode === 'MIA')!, '2024-07-06')!.etaDate).toBe('2026-08-17');
    const s = rung(ladder(c, '2026-10-21', stale), 'a_i485');
    expect(s.state).toBe('depends');
    expect(s.bodyKey).toBe('remedies:a_i485.body.eta_passed');
    expect(s.etaMonth).toBeUndefined();
    expect(s.params.etaMonth).toBeUndefined();
    expect(s.params.etaDate).toBeUndefined();
    expect(s.gate).toMatchObject({ inquiryDate: '2024-07-05' });
    // G0 sample: HIA receipt 2024-07-08 → ETA 2026-10-20, i.e. today: also eta_passed, not "not yet (Oct 2026)".
    expect(rung(ladder(variant({ officeCode: 'HIA', i485ReceiptDate: '2024-07-08' })), 'a_i485').bodyKey).toBe('remedies:a_i485.body.eta_passed');
    // A future ETA stays not_yet.
    expect(rung(ladder(variant({ officeCode: 'HIA', i485ReceiptDate: '2024-07-08' }), '2026-10-19'), 'a_i485').state).toBe('not_yet');
  });

  it('approved case: every rung not applicable', () => {
    const steps = ladder(variant({}, { add: [ms('decision', '2026-10-01', { outcome: 'approved' })] }));
    expect(steps.every((s) => s.state === 'not_applicable')).toBe(true);
    expect(steps).toHaveLength(7);
  });
});

describe('REMEDY_KEYS (i18n contract for the `remedies` namespace, WP8b)', () => {
  it('every key is reachable and the ladder emits nothing else', () => {
    const nbcHistory: OfficesFile = {
      ...offices,
      inquiryDateHistory: offices.inquiryDateHistory.concat([{ officeCode: 'NBC', subtype: '147-C9', points: [
        { publicationDate: '2025-10-15', inquiryDate: '2025-01-10' }, { publicationDate: '2026-10-15', inquiryDate: '2025-06-13' }] }]),
    };
    const noDates: OfficesFile = { ...offices, processingTimes: offices.processingTimes.map((r) => ({ ...r, inquiryDate: null })) };
    const noEad = { drop: ['ead_c9' as const, 'biometrics' as const] };
    const runs: RemedyStep[][] = [
      ladder(t15()),
      ladder(variant({ officeCode: 'MIA', state: 'FL', hardship: ['uscis_error'] }, { add: [ms('erequest', '2026-08-01')] })),
      ladder(variant({ officeCode: 'MIA', i485ReceiptDate: '2023-01-10' }, { drop: ['biometrics', 'ead_c9'], add: [ms('erequest', '2026-08-01')] }), '2026-10-20'),
      ladder(variant({ officeCode: 'HOU', state: 'TX' }, { add: [ms('congressional_inquiry', '2026-08-01')] })),
      ladder(variant({ officeCode: 'MIA', i485ReceiptDate: '2023-06-15', i485ReceiptDateGranularity: 'month' }, noEad)),
      ladder(variant({ officeCode: 'MIA' }, { drop: ['ead_c9'] }), TODAY, noDates),
      ladder(variant({ i485ReceiptDate: '2025-06-15', i485ReceiptDateGranularity: 'month' }, noEad)),
      ladder(variant({ i485ReceiptDate: '2025-08-01' }, noEad)),
      ladder(variant({ i485ReceiptDate: '2025-08-01' }, noEad), TODAY, nbcHistory),
      ladder(variant({ concurrentI765: false, i485ReceiptDate: '2026-07-01' }, noEad)),
      ladder(t15(), '2027-04-01'),
      ladder(t15(), '2028-04-01'),
      ladder(variant({}, { add: [ms('decision', '2026-10-01', { outcome: 'denied' })] })),
      ladder(variant({}, { add: [ms('decision', '2026-10-01', { outcome: 'approved' })] })),
      ladder(variant({ officeCode: 'HIA', i485ReceiptDate: '2024-07-08' })),
      ladder(variant({ i485ReceiptDate: '2025-06-14' }, noEad), TODAY, nbcHistory),
    ];
    const seen = new Set<string>();
    for (const steps of runs) for (const s of steps) { seen.add(s.titleKey); seen.add(s.bodyKey); }
    expect([...seen].sort()).toEqual([...REMEDY_KEYS].sort());
    const c9 = rung(ladder(variant({ i485ReceiptDate: '2025-08-01' }, noEad), TODAY, nbcHistory), 'a_c9');
    expect(c9.state).toBe('not_yet');
    expect(c9.etaMonth).toMatch(/^\d{4}-\d{2}$/);
    // (c)(9) regression: receipt one day after the NBC inquiry date → ETA 2026-10-18, before today.
    const c9Passed = rung(ladder(variant({ i485ReceiptDate: '2025-06-14' }, noEad), TODAY, nbcHistory), 'a_c9');
    expect(c9Passed).toMatchObject({ state: 'depends', bodyKey: 'remedies:a_c9.body.eta_passed' });
    expect(c9Passed.etaMonth).toBeUndefined();
  });
});
