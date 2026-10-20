/**
 * @caa/case-rules — contract v1 STUBS (07-implementation-plan.md §6.0 and 02-data-model.md §5;
 * written by WP1 in the `contract: data-schemas v1` commit under declared ownership exception 2).
 * WP3 owns this package from now on and replaces every `notImplemented` body.
 *
 * Pure: imports only `@caa/data-schemas` types (ARCH-1). Dates are ISO strings handled without a
 * time zone (07 WP3 `dates`).
 */
import type {
  ApprovalCard, CaseTimeline, DerivedFlags, EadStatus, EntryChannel, EstimateOk, ISODate, Lang, NationalFile, OfficesFile,
  PeerReasonId, PolicyFile, QuarterlyFile, Regime, RegimeId, RemedyStep, YearMonth,
} from '@caa/data-schemas';

function notImplemented(name: string, ...args: unknown[]): never {
  void args;
  throw new Error(`@caa/case-rules.${name}: not implemented (contract v1 stub; WP3 implements it)`);
}

/** 02 §3 eligibility gate and flags (key facts §1). */
export function deriveFlags(c: CaseTimeline, policy: PolicyFile, today: ISODate): DerivedFlags {
  return notImplemented('deriveFlags', c, policy, today);
}

/** EST-12: calendar days minus end-exclusive overlaps with applicable hold regimes. */
export function adjudicableDays(receipt: ISODate, today: ISODate, regimes: Regime[], channel: EntryChannel, ends: 'default' | 'altOps'): { days: number; holds: RegimeId[] } {
  return notImplemented('adjudicableDays', receipt, today, regimes, channel, ends);
}

/** 07 §6.0: the clock card (both ends, R1 handling, UNKNOWN → both channel clocks). */
export function clockFor(c: CaseTimeline, policy: PolicyFile, today: ISODate): EstimateOk['clock'] {
  return notImplemented('clockFor', c, policy, today);
}

/** 07 WP3 pinned crude linear ETA for the 131A-FAM inquiry date to pass the receipt (doc 15 §2.2). */
export function remedyEta(h: OfficesFile['inquiryDateHistory'][number], receipt: ISODate): { etaDate: ISODate; etaMonth: YearMonth } | null {
  return notImplemented('remedyEta', h, receipt);
}

/** Doc 15 §9.1 decision tree, steps 1–9. */
export function remedyLadder(c: CaseTimeline, flags: DerivedFlags, offices: OfficesFile, policy: PolicyFile, today: ISODate): RemedyStep[] {
  return notImplemented('remedyLadder', c, flags, offices, policy, today);
}

/** 00 S4 / U2: the exact peer-reason sets. */
export function peerReasons(c: CaseTimeline, flags: DerivedFlags, offices: OfficesFile, today: ISODate): PeerReasonId[] {
  return notImplemented('peerReasons', c, flags, offices, today);
}

/** 00 S5: (c)(9) validity rule, expiry, renewal and reminders (key facts §2 row 4). */
export function eadStatus(c: CaseTimeline, policy: PolicyFile, today: ISODate): EadStatus {
  return notImplemented('eadStatus', c, policy, today);
}

/** 02 §4 note: the approval card is separate from the timing estimate (04 §7, M5). */
export function approvalCard(c: CaseTimeline, q: QuarterlyFile, n: NationalFile, policy: PolicyFile): ApprovalCard {
  return notImplemented('approvalCard', c, q, n, policy);
}

/** 00 S12: month-level share code; no receipt digits, no day dates (05 §6). */
export function shareCode(c: CaseTimeline, est: EstimateOk | null, lang: Lang): string {
  return notImplemented('shareCode', c, est, lang);
}

export function parseShareCode(text: string): Partial<CaseTimeline> | null {
  return notImplemented('parseShareCode', text);
}

/** 07 §6.0 date helpers (UTC-safe, timezone-free, on ISO strings; EST-10 for monthsCeil/monthsSince). */
export const dates: {
  daysBetween(a: ISODate, b: ISODate): number; monthsBetween(a: YearMonth, b: YearMonth): number; monthsCeil(days: number): number;
  monthsSince(days: number): number; endOfMonth(ym: YearMonth): ISODate; addDays(d: ISODate, n: number): ISODate; ym(d: ISODate): YearMonth;
} = {
  daysBetween: (a, b) => notImplemented('dates.daysBetween', a, b),
  monthsBetween: (a, b) => notImplemented('dates.monthsBetween', a, b),
  monthsCeil: (days) => notImplemented('dates.monthsCeil', days),
  monthsSince: (days) => notImplemented('dates.monthsSince', days),
  endOfMonth: (ym) => notImplemented('dates.endOfMonth', ym),
  addDays: (d, n) => notImplemented('dates.addDays', d, n),
  ym: (d) => notImplemented('dates.ym', d),
};
