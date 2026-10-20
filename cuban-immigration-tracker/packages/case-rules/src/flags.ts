/**
 * `deriveFlags` — the eligibility gate and per-case flags (02-data-model.md §3 `DerivedFlags`;
 * research 00-key-facts-for-the-app.md §1 "Flags the app must set per case"). Never stored.
 *
 * Facts (all as of 2026-10-20):
 * - CAA entry element = "inspected and admitted or paroled"; a parole that later expired or was
 *   terminated still counts (key facts §1 `entry_is_historical`; doc 16 §5). VISA = inspected and
 *   admitted → eligible (02 §3 gate, avoiding data-rigor's `!caaParoledElementMet` bug).
 * - Excluded channels: I-220A (Matter of Cabrera-Fernandez, 28 I&N Dec. 747 (BIA 2023)), EWI, and
 *   INA 236(a)(2)(B) conditional parole (key facts §1 `excluded_entry_channels`) → no estimate (S9).
 * - R1 named only CHNV / FRP / U4U; CBP One → 0 R1 days at low confidence (key facts §1; doc 16 §3).
 * - FRP carve-out: FRP_CFRP with an I-485 filed on/before 2025-12-15 keeps parole until expiry or a
 *   final I-485 decision (90 FR 58032, FR doc 2025-22744; key facts §1).
 * - Red Eagle class: Cuban with an I-485 not finally adjudicated on 2026-08-24, any channel (N.D. Cal.
 *   3:26-cv-04850-CRB; key facts §1; doc 15 §6.4). Copy says "parece estar".
 * - Doe v. DHS class: CBP One, paroled 2023-05-15 → 2025-01-19 (start May 15 vs 16 unresolved),
 *   terminated by the April 2025 e-mail, in the U.S. (D. Mass. 1:25-cv-12245; doc 16 §4.3).
 * - An I-94 end date of 2026-04-24 is the April 2026 re-termination, not the original end date
 *   (doc 16 §8.1).
 * - Expedited-removal warning: terminated parole or original end date before today; the CHIRLA
 *   stay was vacated 2026-08-11 (D.C. Cir. 25-5289; doc 16 §6, §8.4).
 * - One-year presence: file on/after day 366, "un año y un día" (key facts §1; 00 S2 warning).
 */
import type { CaseTimeline, DerivedFlags, EntryChannel, ISODate, PolicyFile } from '@caa/data-schemas';
import { addDays } from './dates';

/** 02 §3: the parole-based channels. */
export const PAROLE_CHANNELS: readonly EntryChannel[] = ['CHNV', 'CBP_ONE', 'FRP_CFRP', 'U4U', 'OTHER_PAROLE'];

/** 02 §3 gate: channels that get no estimate, and their reason. */
export const NO_ESTIMATE_CHANNELS: Partial<Record<EntryChannel, 'i220a' | 'ewi' | 'conditional_parole_236'>> = {
  I220A: 'i220a',
  EWI: 'ewi',
  CONDITIONAL_PAROLE_236: 'conditional_parole_236',
};

/** Doc 16 §8.1: the I-94 end date DHS wrote in April 2026 re-terminations. */
export const RE_TERMINATION_DATE: ISODate = '2026-04-24';

/** First decision milestone with an outcome, if any. */
export function decisionOf(c: CaseTimeline): CaseTimeline['milestones'][number] | null {
  for (const m of c.milestones) if (m.key === 'decision') return m;
  return null;
}

/** The (c)(9) EAD milestone, if recorded. */
export function eadOf(c: CaseTimeline): CaseTimeline['milestones'][number] | null {
  for (const m of c.milestones) if (m.key === 'ead_c9') return m;
  return null;
}

function hasMilestone(c: CaseTimeline, key: CaseTimeline['milestones'][number]['key']): boolean {
  return c.milestones.some((m) => m.key === key);
}

/** Basic-documents checklist (00 S2 step 5): true only when all five are true, false if any is false. */
export function basicDocsComplete(c: CaseTimeline): boolean | null {
  const v = c.basicDocs;
  const all = [v.paroleRecord, v.nationalityProof, v.i693, v.photos, v.feeOrWaiver];
  if (all.some((x) => x === false)) return false;
  if (all.every((x) => x === true)) return true;
  return null;
}

/**
 * Red Eagle: "not finally adjudicated" on the certification date. A case decided on or before that
 * day, or filed after it, is outside the class; the class did not exist before that day.
 */
function redEagleMember(c: CaseTimeline, policy: PolicyFile, today: ISODate): boolean {
  const on = policy.classes.redEagle.notFinallyAdjudicatedOn;
  if (today < on) return false;
  if (c.i485ReceiptDate > on) return false;
  const d = decisionOf(c);
  if (d && d.date !== null && d.date <= on) return false;
  if (d && d.date === null) return false; // decided, date unknown: cannot place it after the cut-off
  return true;
}

/** Doe v. DHS (doc 16 §4.3): CBP One + parole window + April 2025 e-mail termination. */
function doeDhsMember(c: CaseTimeline, policy: PolicyFile): boolean | 'unknown' {
  const k = policy.classes.doeDhs;
  if (c.entryChannel !== k.channel) return false;
  if (c.paroleDate === undefined) return 'unknown';
  if (c.paroleDate < k.paroleFrom || c.paroleDate > k.paroleTo) return false;
  const notices = c.milestones.filter((m) => m.key === 'parole_termination_notice');
  const emailed = notices.some((m) => m.meta?.terminationNotice === 'EMAIL_APR_2025');
  if (!emailed) return 'unknown'; // in the window, but we do not know whether the April 2025 e-mail came
  // 2023-05-15 vs 05-16 is unresolved (windowStartUncertain): the first day stays 'unknown'.
  if (k.windowStartUncertain && c.paroleDate === k.paroleFrom) return 'unknown';
  return true;
}

/** 02 §3 `deriveFlags(case, policy, today)`. Pure; `today` is the caller's local date. */
export function deriveFlags(c: CaseTimeline, policy: PolicyFile, today: ISODate): DerivedFlags {
  const ch = c.entryChannel;
  const isParoleBased = PAROLE_CHANNELS.indexOf(ch) >= 0;
  const decision = decisionOf(c);

  // 04 §4 precedence: decided first, then the channel gate.
  const noEstimateReason: DerivedFlags['noEstimateReason'] = decision ? 'decided' : (NO_ESTIMATE_CHANNELS[ch] ?? null);

  // R1 scope from the curated regimes (key facts §3): appliesTo → true; lowConfidenceExempt → 'low_confidence'.
  let r1HoldApplies: DerivedFlags['r1HoldApplies'] = false;
  if (ch === 'UNKNOWN') r1HoldApplies = 'unknown_channel';
  else {
    for (const r of policy.regimes) {
      if (!r.hold || r.appliesTo.indexOf('ALL_CUBAN') >= 0) continue;
      if (r.appliesTo.indexOf(ch) >= 0) { r1HoldApplies = true; break; }
      if ((r.lowConfidenceExempt ?? []).indexOf(ch) >= 0) r1HoldApplies = 'low_confidence';
    }
  }

  const terminated = hasMilestone(c, 'parole_termination_notice');
  const endPassed = c.paroleEndDateOriginal !== undefined && c.paroleEndDateOriginal < today;
  const approved = decision?.meta?.outcome === 'approved';

  return {
    isParoleBased,
    admittedOrParoled: isParoleBased || ch === 'VISA',
    noEstimateReason,
    r1HoldApplies,
    frpI485Carveout: ch === 'FRP_CFRP' && c.i485ReceiptDate <= policy.classes.frpCarveout.i485PendingBy,
    redEagleAppearsInClass: redEagleMember(c, policy, today),
    doeDhsAppearsInClass: doeDhsMember(c, policy),
    expeditedRemovalWarning: isParoleBased && !approved && (terminated || endPassed),
    reTerminationDateSuspicious: c.paroleEndDateOriginal === RE_TERMINATION_DATE,
    oneYearWarning: c.paroleDate !== undefined && c.i485ReceiptDate < addDays(c.paroleDate, 366),
    basicDocsComplete: basicDocsComplete(c),
    filedAfterRedEagle: c.i485ReceiptDate > policy.classes.redEagle.notFinallyAdjudicatedOn,
  };
}
