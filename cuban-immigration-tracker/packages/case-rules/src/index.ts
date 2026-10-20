/**
 * @caa/case-rules (WP3) — the device-side case rules of 02-data-model.md §3, §5 and
 * 07-implementation-plan.md §6.0: eligibility gate and flags, the adjudicable-days clock, the
 * remedy ladder and its inquiry-date ETA, the peer-reason sets, the (c)(9) EAD status, the approval
 * card and the month-level share code.
 *
 * Pure and deterministic: imports only `@caa/data-schemas` types (ARCH-1); no I/O, no clock (every
 * function takes `today` as an ISO date), no `Date`, no `Intl`. The estimator never imports this
 * package and vice versa; the app passes `deriveFlags()` and `clockFor()` into `estimate()`
 * (07 WP2 "Consumes"; WP6 `useEstimate`).
 *
 * Exports beyond the frozen §6.0 contract are additive (07 §10 rule 3): extra date helpers, the
 * remedy i18n key list (`REMEDY_KEYS`, for WP8b's `remedies` namespace), `eadExpirySource`,
 * `monthlyShare`, and the optional 4th `opts` argument of `shareCode`.
 */
export { deriveFlags, basicDocsComplete, decisionOf, eadOf, PAROLE_CHANNELS, NO_ESTIMATE_CHANNELS, RE_TERMINATION_DATE } from './flags';
export { adjudicableDays, clockFor, clockEnd, regimeAppliesTo, regimeOverlapDays } from './clock';
export {
  remedyEta, remedyLadder, latestRecord, historyFor, REMEDY_KEYS, I485_SUBTYPE, C9_SUBTYPE, C9_OFFICE, OMBUDSMAN_WAIT_DAYS,
  MANDAMUS_SOFT_MONTHS, MANDAMUS_STRONG_MONTHS, CONTACT_CENTER_PHONE, CONTACT_CENTER_TTY, I290B_DAYS, I290B_MAILED_DAYS,
} from './remedies';
export type { RemedyKey } from './remedies';
export { peerReasons, PEER_REASON_ORDER, R1_START, R1_END, R3_START, NO_AUTO_EXTENSION_FROM } from './peers';
export { eadStatus, eadValidityRule, eadExpirySource, EAD_REMINDER_OFFSETS, EAD_RENEW_LEAD_DAYS } from './ead';
export { approvalCard, monthlyShare, monthLabel } from './approval';
export { shareCode, parseShareCode, SHARE_HASHTAG } from './share';
export {
  dates, daysBetween, addDays, addMonths, addMonthsYm, monthsBetween, fullMonthsBetween, monthsCeil, monthsSince, endOfMonth, ym,
  epochDay, fromEpochDay, minDate, maxDate, DAYS_PER_MONTH,
} from './dates';
