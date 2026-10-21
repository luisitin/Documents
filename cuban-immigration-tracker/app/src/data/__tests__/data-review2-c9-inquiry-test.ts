/**
 * Regression test for review round 2 of `app/src/data`: the 00 §7 foreground notification
 * "(c)(9) pending and receipt now before the NBC inquiry date" was never queued. `foregroundEvents`
 * must emit `c9_inquiry` when rung a_c9 becomes `available` between two snapshots.
 * The snapshots are the bundled SAMPLE (a labelled sample; 02 §2), with the 147-C9 NBC inquiry
 * date moved back in the "previous" copy; the case is the T15 reference fixture, altered.
 */
import type { CaseTimeline } from '@caa/data-schemas';
import { referenceCase } from '@caa/estimator';
import { foregroundEvents } from '@/data/DataProvider';
import { sampleSnapshot, type DataSnapshot } from '@/data/snapshot';

const TODAY = '2026-10-20';

/** The sample with every I-765 147-C9 NBC inquiry date set to `inquiryDate`. */
function withC9Inquiry(inquiryDate: string): DataSnapshot {
  const s = JSON.parse(JSON.stringify(sampleSnapshot())) as DataSnapshot;
  for (const r of s.offices.processingTimes) {
    if (r.form === 'I-765' && r.subtype === '147-C9' && r.officeCode === 'NBC') r.inquiryDate = inquiryDate;
  }
  return s;
}

/** P2 of 00 §2: receipt 2025-03-15, (c)(9) still pending. */
function noEadCase(over: Partial<CaseTimeline> = {}): CaseTimeline {
  const c = referenceCase();
  return { ...c, localId: '00000000-0000-4000-8000-0000000000c9', milestones: c.milestones.filter((m) => m.key !== 'ead_c9'), ...over };
}

describe('review round 2: c9_inquiry foreground event', () => {
  const prev = withC9Inquiry('2025-01-10'); // receipt 2025-03-15 is after it: not yet available
  const next = sampleSnapshot(); // NBC 147-C9 inquiry date 2025-06-13: receipt is before it

  it('queues c9_inquiry when the (c)(9) e-Request becomes available after a refresh', () => {
    const c = noEadCase();
    const ev = foregroundEvents(prev, next, TODAY, [c]);
    expect(ev).toContainEqual({ kind: 'c9_inquiry', caseId: c.localId });
  });

  it('does not queue it again when it was already available before the refresh', () => {
    const ev = foregroundEvents(next, next, TODAY, [noEadCase()]);
    expect(ev.some((e) => e.kind === 'c9_inquiry')).toBe(false);
  });

  it('does not queue it when the EAD was received or no I-765 was filed', () => {
    const withEad = referenceCase();
    const noI765 = noEadCase({ concurrentI765: false });
    const ev = foregroundEvents(prev, next, TODAY, [withEad, noI765]);
    expect(ev.some((e) => e.kind === 'c9_inquiry')).toBe(false);
  });

  it('does not queue it when the receipt is still after the inquiry date', () => {
    const late = noEadCase({ i485ReceiptDate: '2025-09-01' });
    const ev = foregroundEvents(prev, next, TODAY, [late]);
    expect(ev.some((e) => e.kind === 'c9_inquiry')).toBe(false);
  });
});
