/**
 * Regression (review round 2): an RFE / NOID entered with "Solo sé el mes" is stored as day 15 (a
 * placeholder). The derived response deadline must start from the FIRST day of that month, so the
 * stated date is the earliest possible one and the −21 / −7 reminders never fire after the real
 * deadline. Pure planner only (no expo-notifications import).
 */
import type { CaseTimeline, Milestone } from '@caa/data-schemas';
import { referenceCase } from '@caa/estimator';
import { sampleSnapshot } from '@/data/snapshot';
import { planCaseReminders, responseDue } from '../schedule';

const policy = sampleSnapshot().policy;
const NOW = new Date(2026, 9, 20, 9, 30, 0);

function caseWith(milestones: Milestone[]): CaseTimeline {
  return { ...referenceCase(), localId: '22222222-2222-4222-8222-222222222222', milestones };
}

describe('responseDue with month-granularity notices', () => {
  it('RFE "Oct 2026" (month only) → due 84 days after 2026-10-01, not after the day-15 placeholder', () => {
    const c = caseWith([{ key: 'rfe', date: '2026-10-15', dateGranularity: 'month', dateSource: 'memory' }]);
    expect(policy.pa202605.rfeMaxDays).toBe(84);
    expect(responseDue(c, 'rfe', policy)).toBe('2026-12-24');
    const p = planCaseReminders(c, policy, 'es', NOW);
    expect(p.map((x) => `${x.kind} ${x.fireAt}`)).toEqual(['rfe_due 2026-12-03T10:00:00', 'rfe_due 2026-12-17T10:00:00']);
    for (const x of p) expect(x.body).not.toMatch(/7 ene/);
  });

  it('matches the exact-day result for a notice dated the 1st (the earliest possible date)', () => {
    const month = caseWith([{ key: 'rfe', date: '2026-10-15', dateGranularity: 'month', dateSource: 'memory' }]);
    const day = caseWith([{ key: 'rfe', date: '2026-10-01', dateGranularity: 'day', dateSource: 'notice' }]);
    expect(responseDue(month, 'rfe', policy)).toBe(responseDue(day, 'rfe', policy));
  });

  it('NOID "Oct 2026" (month only) → 30 + 3 days after 2026-10-01', () => {
    const c = caseWith([{ key: 'noid', date: '2026-10-15', dateGranularity: 'month', dateSource: 'memory' }]);
    expect(responseDue(c, 'noid', policy)).toBe('2026-11-03');
  });

  it('exact-day notices are unchanged', () => {
    const c = caseWith([{ key: 'rfe', date: '2026-10-15', dateGranularity: 'day', dateSource: 'notice' }]);
    expect(responseDue(c, 'rfe', policy)).toBe('2027-01-07');
  });

  it("the notice's own dueDate always wins", () => {
    const c = caseWith([{ key: 'rfe', date: '2026-10-15', dateGranularity: 'month', dateSource: 'memory', meta: { dueDate: '2026-12-01' } }]);
    expect(responseDue(c, 'rfe', policy)).toBe('2026-12-01');
  });
});
