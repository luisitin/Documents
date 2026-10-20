/**
 * 02-data-model.md §3 / §8 case-timeline rules, the privacy rule (no full receipt number is ever
 * kept; 05-privacy-security-legal.md §1, §4) and the reference case = the T15 fixture
 * (04-estimation-model.md §9.2: CHNV, I-485 receipt 2025-03-15 (day), biometrics 2025-07 (month),
 * EAD (c)(9) 2025-09 (month), concurrentI765 = true, state and office undefined; today 2026-10-20).
 */
import { describe, expect, expectTypeOf, it } from 'vitest';
import type { z } from 'zod';
import { CaseTimelineSchema, caseTimelineIssues, parseCase, type CaseTimeline } from '@caa/data-schemas';
import { VALID, clone } from './helpers';

const TODAY = '2026-10-20';
const t15 = () => clone(VALID['valid/case.t15']) as CaseTimeline;

describe('parseCase', () => {
  it('accepts the reference case (T15 fixture) exactly as pinned in 04 §9.2', () => {
    const r = parseCase(t15(), { today: TODAY });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const c = r.value;
    expect(c.entryChannel).toBe('CHNV');
    expect(c.i485ReceiptDate).toBe('2025-03-15');
    expect(c.i485ReceiptDateGranularity).toBe('day');
    expect(c.state).toBeUndefined();
    expect(c.officeCode).toBeUndefined();
    expect(c.concurrentI765).toBe(true);
    expect(c.milestones.map((m) => [m.key, m.date, m.dateGranularity])).toEqual([
      ['biometrics', '2025-07-15', 'month'],
      ['ead_c9', '2025-09-15', 'month'],
    ]);
  });

  it('strips a full receipt number (legacy receiptFullLocal) so it is never re-persisted', () => {
    const r = parseCase({ ...t15(), receiptFullLocal: 'IOE0000000000' }, { today: TODAY });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).not.toHaveProperty('receiptFullLocal');
  });

  it('keeps only a 3-letter receipt prefix', () => {
    expect(parseCase({ ...t15(), receiptPrefix: 'IOE' }, { today: TODAY }).ok).toBe(true);
    const r = parseCase({ ...t15(), receiptPrefix: 'IOE0000000000' }, { today: TODAY });
    expect(r.ok).toBe(false);
  });

  it('rejects a receipt in the future; month granularity compares at month level', () => {
    expect(parseCase({ ...t15(), i485ReceiptDate: '2026-10-21' }, { today: TODAY }).ok).toBe(false);
    // "Solo sé el mes" in the current month records day 15, which is after the 10th but not a future month.
    const c = { ...t15(), i485ReceiptDate: '2026-10-15', i485ReceiptDateGranularity: 'month', milestones: [] };
    expect(parseCase(c, { today: '2026-10-10' }).ok).toBe(true);
  });

  it('allows the scheduled interview, RFE due date and original parole end in the future (02 §8)', () => {
    const c = t15();
    c.paroleEndDateOriginal = '2027-01-10';
    c.milestones.push(
      { key: 'interview_notice', date: '2026-10-01', dateGranularity: 'day', dateSource: 'notice', meta: { scheduledFor: '2026-12-15' } },
      { key: 'rfe', date: '2026-10-01', dateGranularity: 'day', dateSource: 'notice', meta: { dueDate: '2026-12-24' } },
    );
    const r = parseCase(c, { today: TODAY });
    if (!r.ok) throw new Error(r.issues.join('\n'));
  });

  it('treats a biometrics milestone with date null as "happened, date unknown"', () => {
    const c = t15();
    c.milestones[0] = { key: 'biometrics', date: null, dateGranularity: 'day', dateSource: 'memory' };
    expect(parseCase(c, { today: TODAY }).ok).toBe(true);
  });

  it('rejects an EAD before the receipt and a card expiry before the EAD', () => {
    const early = t15();
    early.milestones[1] = { key: 'ead_c9', date: '2025-02-15', dateGranularity: 'month', dateSource: 'memory' };
    expect(parseCase(early, { today: TODAY }).ok).toBe(false);
    const exp = t15();
    exp.milestones[1] = { key: 'ead_c9', date: '2025-09-15', dateGranularity: 'day', dateSource: 'notice', meta: { cardExpiry: '2025-09-01' } };
    expect(parseCase(exp, { today: TODAY }).ok).toBe(false);
  });

  it('uses the device date when no today is passed (a 2025 case is in the past either way)', () => {
    expect(parseCase(t15()).ok).toBe(true);
  });

  it('caseTimelineIssues lists every future date', () => {
    const c = t15();
    c.milestones[1]!.date = '2026-12-15';
    expect(caseTimelineIssues(c, TODAY)).toEqual(['milestones.1.date: ead_c9 2026-12-15 is in the future']);
  });

  it('the hand-written CaseTimeline interface matches the schema output', () => {
    type Inferred = z.infer<typeof CaseTimelineSchema>;
    expectTypeOf<CaseTimeline>().toExtend<Inferred>();
    expectTypeOf<Inferred>().toExtend<CaseTimeline>();
  });
});
