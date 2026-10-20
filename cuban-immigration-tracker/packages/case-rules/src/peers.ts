/**
 * "¿Por qué a otros sí y a mí no? / Why did others get it and not me?" — possible reasons
 * (00-product-spec.md S4; 02-data-model.md §5 `peerReasons`; exact sets pinned by U2 in
 * 04-estimation-model.md §9.2). The screen never says which reason applies; it lists the
 * candidates with confidence chips (copy and chips come from `content.json` `peerReasons`).
 *
 * Rule table (00 S4), with the research behind each date:
 * - `chnv_r1`: channel ∈ {CHNV, FRP_CFRP, U4U} and the case was pending during R1
 *   2025-02-14 → 2025-06-09 (Davidson memo; doc 16 §3; key facts §3).
 * - `cbp_one_no_r1`: channel CBP_ONE and pending during R1 (memo did not name CBP One; low
 *   confidence; doc 16 §3.3).
 * - `ead_before_r3`: (c)(9) EAD received before 2025-12-02, the R3 country hold (doc 07 §5.1).
 * - `ead_swept_r3`: no EAD, I-765 filed with the I-485 before 2025-12-02 (doc 07 §5.1).
 * - `c9_erequest_available`: no EAD and receipt earlier than the I-765 147-C9 NBC inquiry date
 *   (2025-06-13 as of 2026-10-15; doc 15 §2.2).
 * - `renewal_no_autoext`: an EAD renewal filed on or after 2025-10-30 (no automatic extension; final
 *   rule 2026-10-14; key facts §2 row 4).
 * - `non_fifo`: always when an estimate exists (USCIS does not decide in strict filing order; doc 08
 *   §5.4–5.5).
 * - `office_diff`: office known (doc 08 §7.3).
 *
 * The signature (02 §5) has no `policy` argument, so the regime dates are the key-facts constants
 * below; the channel part of the R1 rules is read from `flags.r1HoldApplies`, which `deriveFlags`
 * computes from the curated regimes.
 */
import type { CaseTimeline, DerivedFlags, ISODate, OfficesFile, PeerReasonId } from '@caa/data-schemas';
import { decisionOf, eadOf } from './flags';
import { C9_OFFICE, C9_SUBTYPE, latestRecord } from './remedies';

/** Key facts §3: R1 operational default dates (end-exclusive). */
export const R1_START: ISODate = '2025-02-14';
export const R1_END: ISODate = '2025-06-09';
/** Key facts §3: R3 start (PM-602-0192). */
export const R3_START: ISODate = '2025-12-02';
/** Key facts §2 row 4: no automatic extension for renewals filed on/after this date. */
export const NO_AUTO_EXTENSION_FROM: ISODate = '2025-10-30';

/** The S4 table order (also the order of the returned list). */
export const PEER_REASON_ORDER: readonly PeerReasonId[] = [
  'chnv_r1', 'cbp_one_no_r1', 'ead_before_r3', 'ead_swept_r3', 'c9_erequest_available', 'renewal_no_autoext', 'non_fifo', 'office_diff',
];

/** Pending during [R1_START, R1_END): filed before R1 ended and R1 had started by today (and not decided before R1). */
function pendingDuringR1(c: CaseTimeline, today: ISODate): boolean {
  if (!(c.i485ReceiptDate < R1_END && R1_START < today)) return false;
  const d = decisionOf(c);
  return !(d && d.date !== null && d.date <= R1_START);
}

/** 02 §5 `peerReasons(case, flags, offices, today)` — the exact U2 sets, in S4 order. */
export function peerReasons(c: CaseTimeline, flags: DerivedFlags, offices: OfficesFile, today: ISODate): PeerReasonId[] {
  const out = new Set<PeerReasonId>();
  const r1 = pendingDuringR1(c, today);
  if (r1 && flags.r1HoldApplies === true) out.add('chnv_r1');
  if (r1 && flags.r1HoldApplies === 'low_confidence') out.add('cbp_one_no_r1');

  const ead = eadOf(c);
  if (ead !== null) {
    if (ead.date !== null && ead.date < R3_START) out.add('ead_before_r3');
  } else if (c.concurrentI765 !== false) {
    // ead_swept_r3 needs the I-765 to have been filed with the I-485 (00 S4), so `true` only;
    // the e-Request rung is evaluated unless the user said no I-765 was filed (same rule as remedies a_c9).
    if (c.concurrentI765 === true && c.i485ReceiptDate < R3_START && R3_START <= today) out.add('ead_swept_r3');
    const rec = latestRecord(offices, 'I-765', C9_SUBTYPE, C9_OFFICE);
    if (rec !== null && rec.inquiryDate !== null && c.i485ReceiptDate < rec.inquiryDate) out.add('c9_erequest_available');
  }

  if (c.milestones.some((m) => m.key === 'ead_renewal_filed' && m.date !== null && m.date >= NO_AUTO_EXTENSION_FROM)) out.add('renewal_no_autoext');
  if (flags.noEstimateReason === null) out.add('non_fifo');
  if (c.officeCode !== undefined) out.add('office_diff');
  return PEER_REASON_ORDER.filter((id) => out.has(id));
}
