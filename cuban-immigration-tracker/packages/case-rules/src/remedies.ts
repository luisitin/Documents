/**
 * Delay remedies: the crude inquiry-date ETA and the "¿Qué puedo hacer? / What can I do?" ladder
 * (00-product-spec.md S7; research 15-delay-remedies.md §9.1 decision tree, steps 1–9; key facts §5).
 *
 * Facts (doc 15, as of 2026-10-20):
 * - Rung a, e-Request "case outside normal processing time": available only when the receipt date is
 *   EARLIER than the "receipt date for a case inquiry" for the form / subtype proxy / office (§2.1).
 *   There is no CAA subtype; the proxy is I-485 `131A-FAM` at the field office (§2.2) and I-765
 *   `147-C9` at the NBC for the (c)(9) EAD (§2.2: NBC 2025-06-13 as of 2026-10-15).
 * - Rung b, expedite: one of five documented criteria; "needing the work permit by itself is not an
 *   expedite reason" (§3; 00 S7).
 * - Rung d, congressional inquiry: always offered, but an office may decline a status inquiry while
 *   the case is within normal processing time (§5.1); FL-26/27/28 for Florida (§5.2).
 * - Rung c, Ombudsman DHS-7001: after rung a or d went ≥ 30 days without resolution AND (outside
 *   normal processing time OR hardship) (§9.1 step 5); "may never receive a substantive reply" (§4.1).
 * - Rung e, mandamus: practitioner rule of thumb, soft from 24 months, strong from 36 (§6.3; key
 *   facts §5); the Tampa suit (143 Cubans, M.D. Fla. 8:26-cv-1314) obtained no ordered acceleration
 *   (§6.2). Fee from `policy.fees` id `mandamusFiling` (405 USD, re-check after 2026-12-01; 00 S7).
 * - Rung f, appointments: only for a concrete need; Contact Center 1-800-375-5283, Spanish: press 2
 *   (§7).
 * - Denied → I-290B within 30 days (33 if mailed), not this ladder (§6.5, §9.1 step 9). The
 *   deadline dates are emitted only for a day-granularity decision date: a month-only date (stored
 *   as day 15, 00 S2) could put the real deadline up to ~2 weeks earlier, so then only the 30/33-day
 *   rule is shown and the person reads the date on the letter.
 * - A computed e-Request ETA on or before today (stale publication, receipt just after the inquiry
 *   date) is not shown as a past "not yet" month: the rung says `depends` with `eta_passed` ("may be
 *   soon; check the next publication").
 *
 * The ETA formula is pinned by 07 WP3 (supersedes doc 15's month-rounded arithmetic):
 * `rate = days(inq_first → inq_latest) / days(pub_first → pub_latest)`; `gap = days(inq_latest →
 * receipt)`; `etaDate = pub_latest + ceil(gap / rate)`. With the doc 15 §2.2 points and receipt
 * 2025-03-15: MIA 2028-01-30, HIA 2027-10-06, KND 2027-10-22, TAM 2027-07-28.
 *
 * Every step carries i18n keys in the `remedies` namespace (owned by WP8b; I18N-3) and plain params:
 * keys ending in `Date` are ISODate, keys ending in `Month` are YearMonth (the UI formats them with
 * `fmt`), numbers are raw numbers. No copy lives here.
 */
import type {
  CaseTimeline, DerivedFlags, ISODate, OfficesFile, PolicyFile, ProcessingTimeRecord, RemedyStep, YearMonth,
} from '@caa/data-schemas';
import { addDays, addMonths, daysBetween, endOfMonth, fullMonthsBetween, ym } from './dates';
import { decisionOf, eadOf } from './flags';

type InquiryHistory = OfficesFile['inquiryDateHistory'][number];

/** Proxy subtypes (doc 15 §2.2). */
export const I485_SUBTYPE = '131A-FAM';
export const C9_SUBTYPE = '147-C9';
/** The (c)(9) inquiry date is read at the National Benefits Center (doc 15 §2.2). */
export const C9_OFFICE = 'NBC';
/** Doc 15 §9.1 step 5: wait 30 days after an e-Request / congressional inquiry before the Ombudsman. */
export const OMBUDSMAN_WAIT_DAYS = 30;
/** Doc 15 §6.3 practitioner thresholds (months pending). */
export const MANDAMUS_SOFT_MONTHS = 24;
export const MANDAMUS_STRONG_MONTHS = 36;
/** USCIS Contact Center (doc 15 §7; key facts §5). */
export const CONTACT_CENTER_PHONE = '1-800-375-5283';
export const CONTACT_CENTER_TTY = '1-800-767-1833';
/** I-290B deadline after a denial: 30 days, 33 if the decision was mailed (key facts §1; doc 15 §6.5). */
export const I290B_DAYS = 30;
export const I290B_MAILED_DAYS = 33;

/**
 * Every i18n key `remedyLadder` can emit (`remedies` namespace, WP8b). WP8b's locale files must
 * contain all of them in es and en; a test in this package pins the list.
 */
export const REMEDY_KEYS = [
  'remedies:a_i485.title', 'remedies:a_i485.body.available', 'remedies:a_i485.body.not_yet', 'remedies:a_i485.body.no_eta',
  'remedies:a_i485.body.office_unknown', 'remedies:a_i485.body.no_inquiry_date', 'remedies:a_i485.body.same_month',
  'remedies:a_i485.body.eta_passed',
  'remedies:a_c9.title', 'remedies:a_c9.body.available', 'remedies:a_c9.body.not_yet', 'remedies:a_c9.body.no_eta',
  'remedies:a_c9.body.no_inquiry_date', 'remedies:a_c9.body.same_month', 'remedies:a_c9.body.ead_received',
  'remedies:a_c9.body.no_i765', 'remedies:a_c9.body.eta_passed',
  'remedies:b.title', 'remedies:b.body.hardship', 'remedies:b.body.no_hardship',
  'remedies:d.title', 'remedies:d.body.default', 'remedies:d.body.state_offices',
  'remedies:c.title', 'remedies:c.body.available', 'remedies:c.body.contact_uscis_first', 'remedies:c.body.within_normal',
  'remedies:e.title', 'remedies:e.body.strong', 'remedies:e.body.soft', 'remedies:e.body.hold_argument', 'remedies:e.body.not_yet',
  'remedies:f.title', 'remedies:f.body.default',
  'remedies:denial.title', 'remedies:denial.body.default',
  'remedies:decided.body',
] as const;
export type RemedyKey = (typeof REMEDY_KEYS)[number];

/** The most recent processing-time record for (form, subtype, office). */
export function latestRecord(
  offices: OfficesFile, form: 'I-485' | 'I-765', subtype: string, officeCode: string,
): ProcessingTimeRecord | null {
  let best: ProcessingTimeRecord | null = null;
  for (const r of offices.processingTimes) {
    if (r.form !== form || r.subtype !== subtype || r.officeCode !== officeCode) continue;
    if (best === null || r.publicationDate > best.publicationDate) best = r;
  }
  return best;
}

/** The inquiry-date history series for (office, subtype). */
export function historyFor(offices: OfficesFile, officeCode: string, subtype: string): InquiryHistory | null {
  for (const h of offices.inquiryDateHistory) if (h.officeCode === officeCode && h.subtype === subtype) return h;
  return null;
}

/**
 * 07 §6.0 `remedyEta(history, receipt)` — the pinned crude linear ETA (07 WP3). First and latest
 * point by publication date. Fewer than 2 points, a non-positive publication span, or a rate ≤ 0 →
 * `null` (the ladder then says `depends`). A receipt already before the latest inquiry date gives an
 * ETA on or before the latest publication (the e-Request is already available).
 */
export function remedyEta(h: InquiryHistory, receipt: ISODate): { etaDate: ISODate; etaMonth: YearMonth } | null {
  if (h.points.length < 2) return null;
  let first = h.points[0]!;
  let latest = h.points[0]!;
  for (const p of h.points) {
    if (p.publicationDate < first.publicationDate) first = p;
    if (p.publicationDate > latest.publicationDate) latest = p;
  }
  const pubSpan = daysBetween(first.publicationDate, latest.publicationDate);
  if (pubSpan <= 0) return null;
  const rate = daysBetween(first.inquiryDate, latest.inquiryDate) / pubSpan;
  if (!(rate > 0)) return null;
  const gap = daysBetween(latest.inquiryDate, receipt);
  const etaDate = addDays(latest.publicationDate, Math.ceil(gap / rate));
  return { etaDate, etaMonth: ym(etaDate) };
}

/**
 * Gate comparison "receipt earlier than the inquiry date" (doc 15 §2.1). A month-granularity
 * receipt (stored as day 15, 00 S2) is compared at month level: the whole month must be before the
 * inquiry date for 'before', the whole month on/after it for 'not_before'; otherwise 'same_month'.
 */
function compareToInquiry(receipt: ISODate, granularity: 'day' | 'month', inquiry: ISODate): 'before' | 'not_before' | 'same_month' {
  if (granularity === 'day') return receipt < inquiry ? 'before' : 'not_before';
  const first = `${ym(receipt)}-01`;
  const last = endOfMonth(ym(receipt));
  if (last < inquiry) return 'before';
  if (first >= inquiry) return 'not_before';
  return 'same_month';
}

function step(rung: RemedyStep['rung'], state: RemedyStep['state'], body: RemedyKey, params: RemedyStep['params'], extra?: Partial<RemedyStep>): RemedyStep {
  const title = `remedies:${rung}.title` as RemedyKey;
  const s: RemedyStep = { rung, state, titleKey: title, bodyKey: body, params };
  if (extra?.etaMonth !== undefined) s.etaMonth = extra.etaMonth;
  if (extra?.gate !== undefined) s.gate = extra.gate;
  return s;
}

function gateOf(rec: ProcessingTimeRecord | null): RemedyStep['gate'] {
  if (rec === null) return { inquiryDate: null };
  return { inquiryDate: rec.inquiryDate, retrievedAt: rec.source.retrievedAt };
}

/** Rung a (I-485): 131A-FAM inquiry date at the case's office. */
function rungI485(c: CaseTimeline, offices: OfficesFile, today: ISODate): RemedyStep {
  const receipt = c.i485ReceiptDate;
  const base = { receiptDate: receipt, subtype: I485_SUBTYPE };
  if (c.officeCode === undefined) {
    // 00 S6 / 07 WP3: no office → no inquiry date → no gate decision ("no disponible").
    return step('a_i485', 'depends', 'remedies:a_i485.body.office_unknown', base, { gate: { inquiryDate: null } });
  }
  const office = c.officeCode;
  const rec = latestRecord(offices, 'I-485', I485_SUBTYPE, office);
  const p = { ...base, officeCode: office } as RemedyStep['params'];
  if (rec === null || rec.inquiryDate === null) {
    if (rec !== null) p.publicationDate = rec.publicationDate;
    return step('a_i485', 'depends', 'remedies:a_i485.body.no_inquiry_date', p, { gate: gateOf(rec) });
  }
  p.inquiryDate = rec.inquiryDate;
  p.publicationDate = rec.publicationDate;
  const cmp = compareToInquiry(receipt, c.i485ReceiptDateGranularity, rec.inquiryDate);
  if (cmp === 'before') return step('a_i485', 'available', 'remedies:a_i485.body.available', p, { gate: gateOf(rec) });
  if (cmp === 'same_month') return step('a_i485', 'depends', 'remedies:a_i485.body.same_month', p, { gate: gateOf(rec) });
  const h = historyFor(offices, office, I485_SUBTYPE);
  const eta = h ? remedyEta(h, receipt) : null;
  if (eta === null) return step('a_i485', 'depends', 'remedies:a_i485.body.no_eta', p, { gate: gateOf(rec) });
  // Projected crossing already behind us, but the latest published inquiry date has not passed the receipt.
  if (eta.etaDate <= today) return step('a_i485', 'depends', 'remedies:a_i485.body.eta_passed', p, { gate: gateOf(rec) });
  p.etaMonth = eta.etaMonth;
  p.etaDate = eta.etaDate;
  return step('a_i485', 'not_yet', 'remedies:a_i485.body.not_yet', p, { gate: gateOf(rec), etaMonth: eta.etaMonth });
}

/** Rung a ((c)(9)): 147-C9 inquiry date at NBC; the I-765 is filed with the I-485 (concurrent). */
function rungC9(c: CaseTimeline, offices: OfficesFile, today: ISODate): RemedyStep {
  const receipt = c.i485ReceiptDate;
  const base: RemedyStep['params'] = { receiptDate: receipt, subtype: C9_SUBTYPE, officeCode: C9_OFFICE };
  const ead = eadOf(c);
  if (ead !== null) {
    if (ead.date !== null) base.eadDate = ead.date;
    return step('a_c9', 'not_applicable', 'remedies:a_c9.body.ead_received', base);
  }
  if (c.concurrentI765 === false) return step('a_c9', 'not_applicable', 'remedies:a_c9.body.no_i765', base);
  const rec = latestRecord(offices, 'I-765', C9_SUBTYPE, C9_OFFICE);
  if (rec === null || rec.inquiryDate === null) {
    if (rec !== null) base.publicationDate = rec.publicationDate;
    return step('a_c9', 'depends', 'remedies:a_c9.body.no_inquiry_date', base, { gate: gateOf(rec) });
  }
  base.inquiryDate = rec.inquiryDate;
  base.publicationDate = rec.publicationDate;
  const cmp = compareToInquiry(receipt, c.i485ReceiptDateGranularity, rec.inquiryDate);
  if (cmp === 'before') return step('a_c9', 'available', 'remedies:a_c9.body.available', base, { gate: gateOf(rec) });
  if (cmp === 'same_month') return step('a_c9', 'depends', 'remedies:a_c9.body.same_month', base, { gate: gateOf(rec) });
  const h = historyFor(offices, C9_OFFICE, C9_SUBTYPE);
  const eta = h ? remedyEta(h, receipt) : null;
  if (eta === null) return step('a_c9', 'depends', 'remedies:a_c9.body.no_eta', base, { gate: gateOf(rec) });
  if (eta.etaDate <= today) return step('a_c9', 'depends', 'remedies:a_c9.body.eta_passed', base, { gate: gateOf(rec) });
  base.etaMonth = eta.etaMonth;
  base.etaDate = eta.etaDate;
  return step('a_c9', 'not_yet', 'remedies:a_c9.body.not_yet', base, { gate: gateOf(rec), etaMonth: eta.etaMonth });
}

/** Rung b: expedite (doc 15 §3; §9.1 step 3). */
function rungExpedite(c: CaseTimeline): RemedyStep {
  const hardship = c.hardship ?? [];
  if (hardship.length > 0) {
    return step('b', 'available', 'remedies:b.body.hardship', { hardship: hardship.join(','), hardshipCount: hardship.length, phone: CONTACT_CENTER_PHONE });
  }
  return step('b', 'depends', 'remedies:b.body.no_hardship', { hardshipCount: 0, phone: CONTACT_CENTER_PHONE });
}

/** Rung d: congressional inquiry (doc 15 §5; §9.1 step 4). Always offered, with the caveat. */
function rungCongress(c: CaseTimeline, policy: PolicyFile): RemedyStep {
  const state = c.state;
  const list = state === undefined ? [] : policy.congressionalOffices.filter((o) => o.state === state);
  if (state !== undefined && list.length > 0) {
    return step('d', 'available', 'remedies:d.body.state_offices', {
      state, officeCount: list.length, districts: list.map((o) => o.district).join(', '),
    });
  }
  const p: RemedyStep['params'] = { officeCount: 0 };
  if (state !== undefined) p.state = state;
  return step('d', 'available', 'remedies:d.body.default', p);
}

/** Latest dated milestone of a key. */
function latestDated(c: CaseTimeline, key: CaseTimeline['milestones'][number]['key']): ISODate | null {
  let best: ISODate | null = null;
  for (const m of c.milestones) if (m.key === key && m.date !== null && (best === null || m.date > best)) best = m.date;
  return best;
}

/** Rung c: Ombudsman (doc 15 §4; §9.1 step 5). */
function rungOmbudsman(c: CaseTimeline, i485: RemedyStep, today: ISODate): RemedyStep {
  const er = latestDated(c, 'erequest');
  const ci = latestDated(c, 'congressional_inquiry');
  const used = [er, ci].filter((d): d is ISODate => d !== null);
  let oldest: ISODate | null = null;
  for (const d of used) if (oldest === null || d < oldest) oldest = d;
  const waited = oldest !== null && daysBetween(oldest, today) >= OMBUDSMAN_WAIT_DAYS;
  const p: RemedyStep['params'] = { waitDays: OMBUDSMAN_WAIT_DAYS };
  if (oldest !== null) {
    p.firstContactDate = oldest;
    p.eligibleFromDate = addDays(oldest, OMBUDSMAN_WAIT_DAYS);
  }
  if (!waited) return step('c', 'not_yet', 'remedies:c.body.contact_uscis_first', p);
  const outside = i485.state === 'available';
  const hardship = (c.hardship ?? []).length > 0;
  if (outside || hardship) return step('c', 'available', 'remedies:c.body.available', p);
  return step('c', 'depends', 'remedies:c.body.within_normal', p);
}

/** Rung e: mandamus (doc 15 §6; §9.1 step 6). */
function rungMandamus(c: CaseTimeline, flags: DerivedFlags, policy: PolicyFile, today: ISODate, holdsApplied: boolean): RemedyStep {
  const receipt = c.i485ReceiptDate;
  const months = Math.max(0, fullMonthsBetween(receipt, today));
  const fee = policy.fees.find((f) => f.id === 'mandamusFiling');
  const p: RemedyStep['params'] = {
    monthsPending: months,
    softDate: addMonths(receipt, MANDAMUS_SOFT_MONTHS),
    strongDate: addMonths(receipt, MANDAMUS_STRONG_MONTHS),
  };
  if (fee) {
    p.feeUsd = fee.usd;
    if (fee.asOf) p.feeAsOfDate = fee.asOf;
  }
  if (flags.redEagleAppearsInClass) p.redEagle = 1;
  if (months >= MANDAMUS_STRONG_MONTHS) return step('e', 'available', 'remedies:e.body.strong', p);
  if (months >= MANDAMUS_SOFT_MONTHS) return step('e', 'available', 'remedies:e.body.soft', p);
  // Doc 15 §9.1 step 6 "OR a hold-vacatur argument applies": days spent under the vacated holds.
  if (holdsApplied) return step('e', 'depends', 'remedies:e.body.hold_argument', p, { etaMonth: ym(addMonths(receipt, MANDAMUS_SOFT_MONTHS)) });
  return step('e', 'not_yet', 'remedies:e.body.not_yet', p, { etaMonth: ym(addMonths(receipt, MANDAMUS_SOFT_MONTHS)) });
}

/** Rung f: appointment / Contact Center (doc 15 §7; §9.1 step 8). */
function rungAppointment(): RemedyStep {
  return step('f', 'depends', 'remedies:f.body.default', { phone: CONTACT_CENTER_PHONE, tty: CONTACT_CENTER_TTY, spanishOption: 2 });
}

/** True when the receipt overlaps a hold regime that applies to the case (EST-12 scope). */
function heldUnderVacatedHold(c: CaseTimeline, policy: PolicyFile, today: ISODate): boolean {
  for (const r of policy.regimes) {
    if (!r.hold || r.start === null || r.end === null) continue;
    if (r.appliesTo.indexOf('ALL_CUBAN') < 0 && r.appliesTo.indexOf(c.entryChannel) < 0) continue;
    if (c.i485ReceiptDate < r.end && r.start < today) return true;
  }
  return false;
}

/**
 * 02 §5 `remedyLadder(case, flags, offices, policy, today)` — doc 15 §9.1 steps 1–9, in the S7
 * display order a(I-485), a((c)(9)), b, d, c, e, f.
 * - Denied (§9.1 step 9) → a single `denial` step (I-290B, 30/33 days; consult a lawyer).
 * - Approved / withdrawn / administratively closed → every rung `not_applicable` (`decided.body`).
 */
export function remedyLadder(c: CaseTimeline, flags: DerivedFlags, offices: OfficesFile, policy: PolicyFile, today: ISODate): RemedyStep[] {
  const decision = decisionOf(c);
  if (decision) {
    const outcome = decision.meta?.outcome;
    if (outcome === 'denied') {
      const p: RemedyStep['params'] = { days: I290B_DAYS, mailedDays: I290B_MAILED_DAYS };
      if (decision.date !== null && decision.dateGranularity === 'month') {
        // Day unknown: no deadline dates (they could be up to ~2 weeks late); the UI shows the 30/33-day rule only.
        p.decisionMonth = ym(decision.date);
      } else if (decision.date !== null) {
        p.decisionDate = decision.date;
        p.deadlineDate = addDays(decision.date, I290B_DAYS);
        p.deadlineMailedDate = addDays(decision.date, I290B_MAILED_DAYS);
      }
      return [step('denial', 'available', 'remedies:denial.body.default', p)];
    }
    const rungs: RemedyStep['rung'][] = ['a_i485', 'a_c9', 'b', 'd', 'c', 'e', 'f'];
    return rungs.map((r) => step(r, 'not_applicable', 'remedies:decided.body', { outcome: outcome ?? 'unknown' }));
  }
  const a = rungI485(c, offices, today);
  return [
    a,
    rungC9(c, offices, today),
    rungExpedite(c),
    rungCongress(c, policy),
    rungOmbudsman(c, a, today),
    rungMandamus(c, flags, policy, today, heldUnderVacatedHold(c, policy, today)),
    rungAppointment(),
  ];
}
