/**
 * Milestone states and queue multipliers (04-estimation-model.md §4; ADR-EST-14).
 *
 * Mode precedence (top → bottom): decided → no_estimate (I-220A, EWI, INA 236 conditional parole;
 * key facts §1) → post_interview (interview held, no decision) → post_expedite (expedite granted)
 * → interview_scheduled (notice with a future date) → queue.
 *
 * Queue `milestoneMult(t)`, t ≥ 1 months after today, is the product of:
 * - RFE pending (date r, no response): due d = meta.dueDate ?? r + 84 days (PA-2026-05: ≤ 12
 *   weeks; doc 14 §4). 0 for t ≤ monthsCeil(d − today), then 1.5 for the next 3 months. If
 *   d ≤ today: assume the response at d (`delays.assumedResponseAt`), boost what is left of the
 *   3 months after d, `delays.nonResponseRisk = true` (golden T18', T18d).
 * - NOID pending: same with d = n + 33 days (30 + 3 mail; doc 14 §4).
 * - RFE/NOID answered at x: 1.5 for t ≤ 3 − monthsSince(today − x) (doc 08 §7.5; T18b).
 * - Mandamus filed at f: 1.3 for t ≤ 4 − monthsSince(today − f) (doc 15 §9.3, not ×3; T18c).
 * - No biometrics, receipt > 4 months old and no EAD: 0.7 for all t (doc 08 §7.5). A biometrics
 *   milestone with `date: null` counts as done (T23b vs T23).
 * - EAD received: 1.0 in the point estimate (its {0.9, 1, 1.2} range lives in the structural band).
 * - e-Request, congressional inquiry, Ombudsman: 1.0 (doc 15 §9.3).
 *
 * Interview scheduled for D > today (ADR-EST-14 [I], low confidence): t_D = monthsCeil(D − today);
 * S(t) = S_queue(t) for t < t_D and S_queue(t_D)·(1 − F(t − t_D)) for t ≥ t_D, F = the
 * post-interview lognormal. If D ≤ today and no interview is recorded → post_interview from D.
 *
 * Month granularity ("Solo sé el mes" stores day 15): wherever a milestone date is compared with
 * today, a month-granularity date later than today (the 15th of the current month) is read as
 * today (`effectiveMilestones`), so "this month" never counts as "in the future".
 *
 * RFE/NOID in the lognormal modes [I] (review round 1; needs an owner-approved 04 §4 line and an
 * oracle case, EST-13): USCIS cannot decide before a pending RFE/NOID response is due, so in
 * post_interview / post_expedite S(t) = 1 for t ≤ monthsCeil(due − today) and the lognormal clock
 * starts at the due date; an answered (or overdue, assumed-answered) RFE/NOID dated after the clock
 * start restarts the clock at the response date. interview_scheduled starts its post-interview
 * clock at max(t_D, monthsCeil(due − today)). `delays` is filled in every mode.
 */
import type { CaseTimeline, DerivedFlags, EstimatorParams, ISODate, Milestone, MilestoneKey, PolicyFile } from '@caa/data-schemas';
import { DAYS_PER_MONTH, addDays, daysBetween, monthsCeil, monthsSince } from './dates';
import { lognormalCdf } from './lognormal';

export type Mode = 'queue' | 'interview_scheduled' | 'post_interview' | 'post_expedite';
export type ModeDecision =
  | { kind: 'decided'; outcome: string; date: ISODate | null }
  | { kind: 'no_estimate'; reason: DerivedFlags['noEstimateReason'] }
  | { kind: 'estimate'; mode: Mode; start?: ISODate };

const NO_ESTIMATE_CHANNELS: Record<string, DerivedFlags['noEstimateReason']> = {
  I220A: 'i220a', EWI: 'ewi', CONDITIONAL_PAROLE_236: 'conditional_parole_236',
};

function latest(ms: Milestone[], key: MilestoneKey, datedOnly = true): Milestone | null {
  let best: Milestone | null = null;
  for (const m of ms) {
    if (m.key !== key || (datedOnly && m.date === null)) continue;
    if (!best || (m.date ?? '') >= (best.date ?? '')) best = m;
  }
  return best;
}

/**
 * Milestones with month-granularity dates clamped to today: "Solo sé el mes" in the current month
 * stores day 15, which may be after today (review round 1).
 */
export function effectiveMilestones(ms: Milestone[], today: ISODate): Milestone[] {
  return ms.map((m) => (m.date !== null && m.dateGranularity === 'month' && m.date > today ? { ...m, date: today } : m));
}

/** 04 §4 mode precedence. `flags.noEstimateReason` (case-rules) wins; the channel is a fallback. */
export function decideMode(c: CaseTimeline, flags: DerivedFlags | null, today: ISODate): ModeDecision {
  const ms = effectiveMilestones(c.milestones, today);
  const decision = latest(ms, 'decision', false);
  if (decision) return { kind: 'decided', outcome: decision.meta?.outcome ?? 'unknown', date: decision.date };
  if (flags?.noEstimateReason === 'decided') return { kind: 'decided', outcome: 'unknown', date: null };
  const reason = flags?.noEstimateReason ?? NO_ESTIMATE_CHANNELS[c.entryChannel] ?? null;
  if (reason) return { kind: 'no_estimate', reason };

  const notice = latest(ms, 'interview_notice', false);
  const scheduled = notice?.meta?.scheduledFor;
  const interview = latest(ms, 'interview', false);
  if (interview) {
    // "Happened, date unknown": start at the scheduled date if it has passed, else today.
    const start = interview.date ?? (scheduled !== undefined && scheduled <= today ? scheduled : today);
    if (start <= today) return { kind: 'estimate', mode: 'post_interview', start };
  }
  let grant: ISODate | null = null;
  for (const m of ms) {
    if (m.key === 'expedite_outcome' && m.meta?.outcome === 'granted') {
      const d = m.date ?? today;
      if (grant === null || d > grant) grant = d;
    }
  }
  if (grant !== null && grant <= today) return { kind: 'estimate', mode: 'post_expedite', start: grant };
  if (scheduled !== undefined) {
    return scheduled > today ? { kind: 'estimate', mode: 'interview_scheduled', start: scheduled } : { kind: 'estimate', mode: 'post_interview', start: scheduled };
  }
  return { kind: 'estimate', mode: 'queue' };
}

export interface Delays { rfeZeroUntil?: ISODate; assumedResponseAt?: ISODate; nonResponseRisk?: boolean }

/** One RFE/NOID: answered at a known date, pending with a future due date, or overdue (assumed answered at `due`). */
export type RfeNoidEvent = { kind: 'answered'; at: ISODate } | { kind: 'pending'; due: ISODate } | { kind: 'overdue'; due: ISODate };

/** The latest RFE and the latest NOID, read as 04 §4 does (answered on an unknown date → no event). */
export function rfeNoidEvents(ms: Milestone[], today: ISODate, policy: PolicyFile): RfeNoidEvent[] {
  const out: RfeNoidEvent[] = [];
  const kinds: { notice: MilestoneKey; response: MilestoneKey; days: number }[] = [
    { notice: 'rfe', response: 'rfe_response', days: policy.pa202605.rfeMaxDays },
    { notice: 'noid', response: 'noid_response', days: policy.pa202605.noidDays + policy.pa202605.noidMailDays },
  ];
  for (const k of kinds) {
    const n = latest(ms, k.notice, false);
    if (!n) continue;
    // Month level when either date has month granularity (02 §8, as parseCase compares them).
    const after = (m: Milestone, nd: ISODate) => m.date! >= nd || ((m.dateGranularity === 'month' || n.dateGranularity === 'month') && m.date!.slice(0, 7) >= nd.slice(0, 7));
    const responses = ms.filter((m) => m.key === k.response && (m.date === null || n.date === null || after(m, n.date)));
    if (responses.length) {
      let x: ISODate | null = null;
      for (const m of responses) if (m.date !== null && (x === null || m.date > x)) x = m.date;
      if (x !== null) out.push({ kind: 'answered', at: x }); // answered on an unknown date → no boost (no timing information)
      continue;
    }
    const due = n.meta?.dueDate ?? (n.date !== null ? addDays(n.date, k.days) : null);
    if (due === null) continue;
    out.push(due > today ? { kind: 'pending', due } : { kind: 'overdue', due });
  }
  return out;
}

/** Queue-mode milestone multiplier (null when every term is 1) and the `delays` record (valid in every mode). */
export function milestoneMultiplier(c: CaseTimeline, today: ISODate, params: EstimatorParams, policy: PolicyFile):
  { mult: ((t: number) => number) | null; delays: Delays } {
  const ms = effectiveMilestones(c.milestones, today);
  const terms: ((t: number) => number)[] = [];
  const delays: Delays = {};
  const boostAnswered = params.milestone.rfeAnswered.mult;
  const boostMonths = params.milestone.rfeAnswered.months;
  const answeredTerm = (x: ISODate) => {
    const left = boostMonths - monthsSince(daysBetween(x, today));
    terms.push((t) => (t <= left ? boostAnswered : 1));
  };
  for (const e of rfeNoidEvents(ms, today, policy)) {
    if (e.kind === 'answered') {
      answeredTerm(e.at);
    } else if (e.kind === 'pending') {
      const z = monthsCeil(daysBetween(today, e.due));
      terms.push((t) => (t <= z ? 0 : t <= z + boostMonths ? boostAnswered : 1));
      if (delays.rfeZeroUntil === undefined || e.due > delays.rfeZeroUntil) delays.rfeZeroUntil = e.due;
    } else {
      if (delays.assumedResponseAt === undefined || e.due > delays.assumedResponseAt) delays.assumedResponseAt = e.due;
      delays.nonResponseRisk = true;
      answeredTerm(e.due);
    }
  }
  const mandamus = latest(ms, 'mandamus');
  if (mandamus && mandamus.date !== null) {
    const left = params.milestone.mandamus.months - monthsSince(daysBetween(mandamus.date, today));
    const mult = params.milestone.mandamus.mult;
    terms.push((t) => (t <= left ? mult : 1));
  }
  const has = (key: MilestoneKey) => ms.some((m) => m.key === key);
  if (!has('biometrics') && !has('ead_c9') && daysBetween(c.i485ReceiptDate, today) / DAYS_PER_MONTH > 4) {
    const v = params.milestone.noBiometricsAfter4mo;
    terms.push(() => v);
  }
  if (!terms.length) return { mult: null, delays };
  return {
    mult: (t: number) => {
      if (t < 1) return 1;
      let v = 1;
      for (const f of terms) v *= f(t);
      return v;
    },
    delays,
  };
}

/**
 * ADR-EST-14 transform of a conditioned curve for an interview scheduled t_D months ahead. The
 * post-interview clock starts at `tStart` ≥ t_D (default t_D; later when a pending RFE/NOID is due
 * after the interview), so S stays at S_queue(t_D) until then.
 */
export function interviewTransform(tD: number, median: number, sigma: number, tStart: number = tD): (c: number[]) => number[] {
  const t0 = Math.max(tD, tStart);
  return (c: number[]) => c.map((v, t) => (t < tD ? v : c[tD]! * (1 - lognormalCdf(t - t0, median, sigma))));
}

/**
 * Lognormal-mode clock with the RFE/NOID rule (module comment): from the mode start and the
 * RFE/NOID events, either a pending due date (zero window, clock from the due date) or the
 * effective clock start (max of the mode start and the latest response / assumed response).
 */
export function lognormalClock(start: ISODate, events: RfeNoidEvent[]): { pendingDue: ISODate | null; clockStart: ISODate } {
  let pendingDue: ISODate | null = null;
  let clockStart = start;
  for (const e of events) {
    if (e.kind === 'pending') { if (pendingDue === null || e.due > pendingDue) pendingDue = e.due; }
    else {
      const at = e.kind === 'answered' ? e.at : e.due;
      if (at > clockStart) clockStart = at;
    }
  }
  return { pendingDue, clockStart };
}
