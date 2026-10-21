/**
 * The S2 form model (00-product-spec.md S2 "Mi caso: formulario"; 02-data-model.md §3, §8).
 *
 * Pure: a `CaseDraft` is what the five steps edit; `draftFromCase` / `caseFromDraft` convert to and
 * from the stored `CaseTimeline`; `validateDraft` applies the S2 / 02 §8 rules per step:
 * - the entry channel is required (it may be "No sé" = UNKNOWN);
 * - the I-485 receipt date is required ("Solo sé el mes" records day 15, month granularity);
 * - no future dates, except the card expiry, the scheduled interview, the response due date and
 *   the original I-94 end date (02 §8 exemptions);
 * - every milestone is on or after the receipt, except the parole termination notice (02 §8);
 *   the card expiry is after the EAD date; the due date and the scheduled interview are not
 *   before their notice; the decision is not before the interview;
 * - warnings, never blocks: receipt earlier than parole + 366 days ("un año y un día", key facts
 *   §1) and an original I-94 end date of 2026-04-24 (the April 2026 re-termination date, doc 16
 *   §8.1).
 *
 * Privacy (owner rule; 05 §1): there is no free-text field. The nickname is a preset token and only
 * the 3-letter receipt prefix can be chosen (never the receipt digits).
 */
import type { CaseTimeline, EntryChannel, ISODate, Milestone, MilestoneKey } from '@caa/data-schemas';
import { RE_TERMINATION_DATE, addDays } from '@caa/case-rules';
import type { I18nKey } from '@caa/i18n-core';

/** The milestones the S2 step 4 asks about, in display order (00 S2 step 4). */
export const FORM_MILESTONES = [
  'biometrics', 'ead_c9', 'ead_renewal_filed', 'interview_notice', 'interview', 'rfe', 'rfe_response', 'noid', 'noid_response',
  'expedite_request', 'expedite_outcome', 'erequest', 'congressional_inquiry', 'ombudsman', 'mandamus', 'parole_termination_notice', 'decision',
] as const satisfies readonly MilestoneKey[];
export type FormMilestoneKey = (typeof FORM_MILESTONES)[number];

/** S2 step 1 options, in the spec's order (00 S2 step 1). */
export const CHANNEL_OPTIONS: readonly EntryChannel[] = [
  'CHNV', 'CBP_ONE', 'FRP_CFRP', 'U4U', 'OTHER_PAROLE', 'VISA', 'I220A', 'EWI', 'CONDITIONAL_PAROLE_236', 'UNKNOWN',
];

/** Receipt prefixes the app accepts (02 §7 `receipt_prefix`); only the letters are ever stored. */
export const RECEIPT_PREFIXES = ['IOE', 'MSC', 'NBC', 'EAC', 'WAC', 'LIN', 'SRC', 'YSC'] as const;

export const HARDSHIPS = ['job_loss_documented', 'benefits_loss', 'medical_emergency', 'death_in_family', 'uscis_error'] as const;
export type HardshipId = (typeof HARDSHIPS)[number];

export const BASIC_DOCS = ['paroleRecord', 'nationalityProof', 'i693', 'photos', 'feeOrWaiver'] as const;
export type BasicDocId = (typeof BASIC_DOCS)[number];

/** Outcome choices per milestone (02 §3 `meta.outcome`). */
export const OUTCOMES: Partial<Record<FormMilestoneKey, NonNullable<Milestone['meta']>['outcome'][]>> = {
  expedite_outcome: ['granted', 'denied', 'pending'],
  decision: ['approved', 'denied', 'withdrawn'],
};

/** Which extra date a milestone carries (02 §3 `meta`). */
export const META_DATE: Partial<Record<FormMilestoneKey, 'cardExpiry' | 'scheduledFor' | 'dueDate'>> = {
  ead_c9: 'cardExpiry',
  interview_notice: 'scheduledFor',
  rfe: 'dueDate',
  noid: 'dueDate',
};

/** Miami-Dade offices (doc 12; key facts §6): Hialeah, Kendall, Miami. Codes must exist in the data. */
export const MIAMI_DADE_OFFICES = ['HIA', 'KND', 'MIA'] as const;

export type Granularity = 'day' | 'month';
export type DateSource = Milestone['dateSource'];

export interface MilestoneDraft {
  happened: boolean | null;
  date: ISODate | null;
  granularity: Granularity;
  source: DateSource;
  metaDate: ISODate | null;
  outcome: NonNullable<Milestone['meta']>['outcome'] | null;
}

export interface CaseDraft {
  localId: string;
  nickname: string;
  entryChannel: EntryChannel | null;
  paroleDate: ISODate | null;
  paroleEndDateOriginal: ISODate | null;
  receipt: ISODate | null;
  receiptGranularity: Granularity;
  state: string | null;
  miamiDade: boolean | null;
  officeCode: string | null;
  receiptPrefix: string | null;
  concurrentI765: boolean | null;
  milestones: Record<FormMilestoneKey, MilestoneDraft>;
  hardship: Record<HardshipId, boolean | null>;
  basicDocs: CaseTimeline['basicDocs'];
  /** Fields of the stored case the form does not edit (kept on save). */
  keep: Pick<CaseTimeline, 'role' | 'concurrentI131' | 'withAttorney'> & { derivativeOf?: string; createdAt?: string; otherMilestones: Milestone[] };
}

const emptyMilestone = (): MilestoneDraft => ({ happened: null, date: null, granularity: 'day', source: 'notice', metaDate: null, outcome: null });

/** A random RFC 4122 v4 id (device-local identifier only; not security-sensitive). */
export function newLocalId(rand: () => number = Math.random): string {
  const hex = (n: number) => Array.from({ length: n }, () => Math.floor(rand() * 16).toString(16)).join('');
  const variant = '89ab'[Math.floor(rand() * 4)];
  return `${hex(8)}-${hex(4)}-4${hex(3)}-${variant}${hex(3)}-${hex(12)}`;
}

/** An empty draft for a new case. */
export function emptyDraft(localId: string = newLocalId(), nickname = 'mine'): CaseDraft {
  const milestones = {} as Record<FormMilestoneKey, MilestoneDraft>;
  for (const k of FORM_MILESTONES) milestones[k] = emptyMilestone();
  const hardship = {} as Record<HardshipId, boolean | null>;
  for (const h of HARDSHIPS) hardship[h] = null;
  return {
    localId, nickname, entryChannel: null, paroleDate: null, paroleEndDateOriginal: null, receipt: null, receiptGranularity: 'day',
    state: null, miamiDade: null, officeCode: null, receiptPrefix: null, concurrentI765: null, milestones, hardship,
    basicDocs: { paroleRecord: null, nationalityProof: null, i693: null, photos: null, feeOrWaiver: null },
    keep: { role: 'principal', concurrentI131: null, withAttorney: null, otherMilestones: [] },
  };
}

/** The stored case → a draft (the first milestone of each form key is edited; others are kept). */
export function draftFromCase(c: CaseTimeline): CaseDraft {
  const d = emptyDraft(c.localId, c.nickname);
  d.entryChannel = c.entryChannel;
  d.paroleDate = c.paroleDate ?? null;
  d.paroleEndDateOriginal = c.paroleEndDateOriginal ?? null;
  d.receipt = c.i485ReceiptDate;
  d.receiptGranularity = c.i485ReceiptDateGranularity;
  d.state = c.state ?? null;
  d.officeCode = c.officeCode ?? null;
  d.miamiDade = c.officeCode && (MIAMI_DADE_OFFICES as readonly string[]).includes(c.officeCode) ? true : null;
  d.receiptPrefix = c.receiptPrefix ?? null;
  d.concurrentI765 = c.concurrentI765;
  d.basicDocs = { ...c.basicDocs };
  for (const h of c.hardship ?? []) d.hardship[h] = true;
  const seen = new Set<string>();
  const other: Milestone[] = [];
  for (const m of c.milestones) {
    const k = m.key as FormMilestoneKey;
    if (!(FORM_MILESTONES as readonly string[]).includes(m.key) || seen.has(m.key)) {
      other.push(m);
      continue;
    }
    seen.add(m.key);
    const metaKey = META_DATE[k];
    d.milestones[k] = {
      happened: true,
      date: m.date,
      granularity: m.dateGranularity,
      source: m.dateSource,
      metaDate: metaKey ? (m.meta?.[metaKey] ?? null) : null,
      outcome: m.meta?.outcome ?? null,
    };
  }
  d.keep = {
    role: c.role, concurrentI131: c.concurrentI131, withAttorney: c.withAttorney, createdAt: c.createdAt, otherMilestones: other,
    ...(c.derivativeOf !== undefined ? { derivativeOf: c.derivativeOf } : {}),
  };
  return d;
}

/** The draft → a `CaseTimeline` ready for `useCases().save` (which validates it again). Null without the required fields. */
export function caseFromDraft(d: CaseDraft, nowIso: string): CaseTimeline | null {
  if (d.entryChannel === null || d.receipt === null) return null;
  const milestones: Milestone[] = [];
  for (const k of FORM_MILESTONES) {
    const m = d.milestones[k];
    if (m.happened !== true) continue;
    const out: Milestone = { key: k, date: m.date, dateGranularity: m.granularity, dateSource: m.source };
    const meta: NonNullable<Milestone['meta']> = {};
    const metaKey = META_DATE[k];
    if (metaKey && m.metaDate) meta[metaKey] = m.metaDate;
    if (OUTCOMES[k] && m.outcome) meta.outcome = m.outcome;
    if (Object.keys(meta).length > 0) out.meta = meta;
    milestones.push(out);
  }
  milestones.push(...d.keep.otherMilestones);
  const hardship = HARDSHIPS.filter((h) => d.hardship[h] === true);
  const c: CaseTimeline = {
    schemaVersion: 1,
    localId: d.localId,
    nickname: d.nickname,
    role: d.keep.role,
    entryChannel: d.entryChannel,
    i485ReceiptDate: d.receipt,
    i485ReceiptDateGranularity: d.receiptGranularity,
    concurrentI765: d.concurrentI765,
    concurrentI131: d.keep.concurrentI131,
    withAttorney: d.keep.withAttorney,
    basicDocs: { ...d.basicDocs },
    milestones,
    createdAt: d.keep.createdAt ?? nowIso,
    updatedAt: nowIso,
  };
  if (d.keep.derivativeOf !== undefined) c.derivativeOf = d.keep.derivativeOf;
  if (d.paroleDate) c.paroleDate = d.paroleDate;
  if (d.paroleEndDateOriginal) c.paroleEndDateOriginal = d.paroleEndDateOriginal;
  if (d.state) c.state = d.state;
  if (d.officeCode) c.officeCode = d.officeCode;
  if (d.receiptPrefix) c.receiptPrefix = d.receiptPrefix;
  if (hardship.length > 0) c.hardship = hardship;
  return c;
}

export interface Problem {
  key: I18nKey;
  /** The ISO date the message refers to (the screen formats it with `fmt` as `{date}`). */
  date?: ISODate;
}

export interface Validation {
  /** field id → problem. Field ids: `entryChannel`, `receipt`, `paroleDate`, `m.<key>.date`, `m.<key>.meta`. */
  errors: Record<string, Problem>;
  warnings: Problem[];
  /** Step (1–5) → has blocking errors. */
  stepErrors: Record<number, boolean>;
}

const ym = (d: ISODate) => d.slice(0, 7);
/** Compares at month level when either side only knows the month (as `parseCase` does). */
function cmp(a: ISODate, ag: Granularity, b: ISODate, bg: Granularity): number {
  const month = ag === 'month' || bg === 'month';
  const x = month ? ym(a) : a;
  const y = month ? ym(b) : b;
  return x < y ? -1 : x > y ? 1 : 0;
}

/** The S2 rules (see the module comment). `today` is the device's local date. */
export function validateDraft(d: CaseDraft, today: ISODate): Validation {
  const errors: Record<string, Problem> = {};
  const warnings: Problem[] = [];
  const stepOf: Record<string, number> = {};
  const err = (field: string, step: number, p: Problem) => {
    if (errors[field]) return;
    errors[field] = p;
    stepOf[field] = step;
  };

  if (d.entryChannel === null) err('entryChannel', 1, { key: 'case:error.channelRequired' });

  if (d.receipt === null) err('receipt', 2, { key: 'case:error.receiptRequired' });
  else if (cmp(d.receipt, d.receiptGranularity, today, 'day') > 0) err('receipt', 2, { key: 'case:error.future' });
  if (d.paroleDate !== null && d.paroleDate > today) err('paroleDate', 2, { key: 'case:error.future' });

  if (d.paroleDate !== null && d.receipt !== null && d.receipt < addDays(d.paroleDate, 366)) {
    warnings.push({ key: 'case:warn.oneYear', date: d.paroleDate });
  }
  if (d.paroleEndDateOriginal === RE_TERMINATION_DATE) warnings.push({ key: 'case:warn.reTermination', date: RE_TERMINATION_DATE });

  for (const k of FORM_MILESTONES) {
    const m = d.milestones[k];
    if (m.happened !== true) continue;
    if (m.date !== null) {
      if (cmp(m.date, m.granularity, today, 'day') > 0) err(`m.${k}.date`, 4, { key: 'case:error.future' });
      else if (k !== 'parole_termination_notice' && d.receipt !== null && cmp(m.date, m.granularity, d.receipt, d.receiptGranularity) < 0) {
        err(`m.${k}.date`, 4, { key: 'case:error.beforeReceipt', date: d.receipt });
      }
    }
    const metaKey = META_DATE[k];
    if (metaKey && m.metaDate !== null && m.date !== null) {
      const bad = metaKey === 'cardExpiry' ? m.metaDate <= m.date : m.metaDate < m.date;
      if (bad) err(`m.${k}.meta`, 4, { key: 'case:error.beforeReceipt', date: m.date });
    }
  }
  const iv = d.milestones.interview;
  const dec = d.milestones.decision;
  if (iv.happened === true && dec.happened === true && iv.date !== null && dec.date !== null && cmp(dec.date, dec.granularity, iv.date, iv.granularity) < 0) {
    err('m.decision.date', 4, { key: 'case:error.decisionBeforeInterview', date: iv.date });
  }

  const stepErrors: Record<number, boolean> = { 1: false, 2: false, 3: false, 4: false, 5: false };
  for (const f of Object.keys(errors)) stepErrors[stepOf[f] ?? 1] = true;
  return { errors, warnings, stepErrors };
}
