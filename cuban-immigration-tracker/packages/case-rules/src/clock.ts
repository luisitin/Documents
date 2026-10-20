/**
 * The adjudicable-days clock (04-estimation-model.md EST-12; 02-data-model.md §5; 07 §6.0 `clockFor`).
 *
 * EST-12: `calendar(receipt, today) − Σ overlap([max(receipt, start), min(end, today)))`, END-EXCLUSIVE,
 * over the hold regimes whose `appliesTo` contains ALL_CUBAN or the case's channel. The regimes come
 * from `policy.json` (key facts §3, verbatim dates): R1 2025-02-14 → 2025-06-09 for CHNV / FRP_CFRP /
 * U4U only (Davidson memo; CBP One NOT named → 0 R1 days at low confidence, doc 16 §3, §8.2), R3
 * 2025-12-02 → 2026-06-12 for every Cuban filer. "altOps" uses the latest operational end report
 * (R1 2025-06-25, R3 2026-07-16; key facts §3 `alt_end.ops_reports`).
 *
 * Golden clock cases (04 §9.2; key facts §3 `reference_cases`), today 2026-10-20:
 * - T11 CHNV, receipt 2025-03-15: calendar 584, R1 86, R3 192 → adjudicable 306; altOps 256.
 * - T19 VISA, 2025-03-15: 392 (R1 not subtracted).
 * - T21 CBP One, 2025-03-15: 392, `r1: 'not_applied_low_confidence'`.
 * - T22 CBP One, receipt 2025-02-05: calendar 622, adjudicable 430.
 *
 * The holds were vacated under the APA (Dorcas, D.R.I., 2026-06-05) and enjoined (Red Eagle, N.D.
 * Cal., 2026-08-24); this module only counts the days a case spent under them.
 */
import type { CaseTimeline, EntryChannel, EstimateOk, ISODate, PolicyFile, Regime, RegimeId } from '@caa/data-schemas';
import { daysBetween, maxDate, minDate } from './dates';

/** The end date a regime uses for the chosen convention. */
function regimeEnd(r: Regime, ends: 'default' | 'altOps'): ISODate | null {
  if (ends === 'altOps') {
    const ops = r.altEnds?.ops;
    if (ops && ops.length > 0) {
      let latest = ops[0]!;
      for (const d of ops) if (d > latest) latest = d;
      return latest;
    }
  }
  return r.end;
}

/** True when a hold regime applies to the channel (EST-12: ALL_CUBAN or the channel itself). */
export function regimeAppliesTo(r: Regime, channel: EntryChannel): boolean {
  return r.appliesTo.indexOf('ALL_CUBAN') >= 0 || r.appliesTo.indexOf(channel) >= 0;
}

/** End-exclusive overlap in days of [from, to) with a regime's [start, end). 0 when disjoint. */
export function regimeOverlapDays(r: Regime, from: ISODate, to: ISODate, ends: 'default' | 'altOps'): number {
  const end = regimeEnd(r, ends);
  if (!r.hold || r.start === null || end === null) return 0;
  const a = maxDate(from, r.start);
  const b = minDate(end, to);
  return a < b ? daysBetween(a, b) : 0;
}

/**
 * 02 §5 / EST-12: adjudicable days from `receipt` to `today` for a channel, and the hold regimes
 * that were subtracted (those with a positive overlap), in policy order. A receipt after `today`
 * gives 0 days.
 */
export function adjudicableDays(
  receipt: ISODate, today: ISODate, regimes: Regime[], channel: EntryChannel, ends: 'default' | 'altOps',
): { days: number; holds: RegimeId[] } {
  const calendar = Math.max(0, daysBetween(receipt, today));
  let days = calendar;
  const holds: RegimeId[] = [];
  if (calendar === 0) return { days: 0, holds };
  for (const r of regimes) {
    if (!r.hold || !regimeAppliesTo(r, channel)) continue;
    const o = regimeOverlapDays(r, receipt, today, ends);
    if (o > 0) {
      days -= o;
      holds.push(r.id);
    }
  }
  return { days: Math.max(0, days), holds };
}

/**
 * The day the clock stops: `today`, or the decision date when the case was decided earlier
 * (a decided case is no longer waiting; 04 §4 "decided").
 */
export function clockEnd(c: CaseTimeline, today: ISODate): ISODate {
  let end = today;
  for (const m of c.milestones) {
    if (m.key === 'decision' && m.date !== null && m.date < end) end = m.date;
  }
  return end;
}

/**
 * Regimes that carry a low-confidence exemption (R1 for CBP_ONE: "the Feb 14 2025 memo names only
 * U4U/CHNV/FRP", doc 16 §3.3). Data-driven so a curated change needs no code change.
 */
function lowConfidenceExemptRegimes(policy: PolicyFile, channel: EntryChannel): Regime[] {
  return policy.regimes.filter((r) => r.hold && (r.lowConfidenceExempt ?? []).indexOf(channel) >= 0);
}

/** Regimes with a channel-specific scope (not ALL_CUBAN), i.e. R1 today. */
function channelScopedHolds(policy: PolicyFile): Regime[] {
  return policy.regimes.filter((r) => r.hold && r.appliesTo.indexOf('ALL_CUBAN') < 0);
}

/**
 * 07 §6.0 `clockFor(case, policy, today)` → `EstimateOk['clock']` (00 S3 clock card).
 *
 * - `r1`: 'applied' when a channel-scoped hold was subtracted; 'not_applied_low_confidence' for a
 *   channel listed in a regime's `lowConfidenceExempt` whose filing overlapped it (CBP One, T21);
 *   'both_shown' for UNKNOWN; otherwise 'not_applied'.
 * - UNKNOWN (02 §3 gate: "UNKNOWN gets an estimate shown with both clocks"; 04 §5 "CHNV 306 / CBP
 *   One 392 for the reference filing"): `unknownChannelClocks = { chnv, cbpOne }`. The headline
 *   `adjudicableDays` follows EST-12 literally for UNKNOWN (only ALL_CUBAN holds are subtracted, i.e.
 *   it equals the CBP One clock); the UI shows both values.
 * - Decided cases stop the clock at the decision date (`clockEnd`).
 */
export function clockFor(c: CaseTimeline, policy: PolicyFile, today: ISODate): EstimateOk['clock'] {
  const receipt = c.i485ReceiptDate;
  const end = clockEnd(c, today);
  const channel = c.entryChannel;
  const d = adjudicableDays(receipt, end, policy.regimes, channel, 'default');
  const alt = adjudicableDays(receipt, end, policy.regimes, channel, 'altOps');
  const scoped = channelScopedHolds(policy);
  const appliedScoped = scoped.some((r) => d.holds.indexOf(r.id) >= 0);
  const exemptOverlap = lowConfidenceExemptRegimes(policy, channel).some((r) => regimeOverlapDays(r, receipt, end, 'default') > 0);

  let r1: EstimateOk['clock']['r1'];
  if (channel === 'UNKNOWN') r1 = 'both_shown';
  else if (appliedScoped) r1 = 'applied';
  else if (exemptOverlap) r1 = 'not_applied_low_confidence';
  else r1 = 'not_applied';

  const clock: EstimateOk['clock'] = {
    calendarDays: Math.max(0, daysBetween(receipt, end)),
    adjudicableDays: d.days,
    adjudicableDaysAltOps: alt.days,
    holdsApplied: d.holds,
    r1,
  };
  if (channel === 'UNKNOWN') {
    clock.unknownChannelClocks = {
      chnv: adjudicableDays(receipt, end, policy.regimes, 'CHNV', 'default').days,
      cbpOne: adjudicableDays(receipt, end, policy.regimes, 'CBP_ONE', 'default').days,
    };
  }
  return clock;
}
