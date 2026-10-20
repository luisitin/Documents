/**
 * 02-data-model.md §3–§5 — the device-only case timeline, the derived flags, the estimator I/O and
 * the case-rules outputs; 02 §7 — the optional (v1.1) shared-timeline row.
 *
 * Privacy (05-privacy-security-legal.md §1, §4; owner rule "never store names or full receipt
 * numbers"): the schema has NO full-receipt-number field. 02 §3 lists an optional
 * `receiptFullLocal`; this package deliberately omits it, and because the case object strips
 * unknown keys, a stray `receiptFullLocal` (or any other extra field) is dropped by `parseCase`
 * and therefore never re-persisted. Only the 3-letter prefix is kept (`receiptPrefix`, ^[A-Z]{3}$).
 * The nickname is device-only, never shared (05 §4), defaults to "Mi caso" in the UI and should not
 * be a person's name.
 *
 * Validation rules (02 §8):
 * - No dates in the future, except `interview_notice.meta.scheduledFor`, `meta.dueDate` (rfe /
 *   noid), `ead_c9.meta.cardExpiry` and `paroleEndDateOriginal` (checked by `caseTimelineIssues`,
 *   which needs `today`).
 * - The receipt comes before every other milestone except `parole_termination_notice` (e.g. CBP One
 *   e-mail terminations 2025-04-07..11, CHNV notices 2025-06-12, for later filers); `paroleDate`
 *   and `paroleEndDateOriginal` are exempt too. The EAD comes after the receipt. A decision comes
 *   after the interview, when there is one.
 * - "Solo sé el mes" records day 15 with granularity 'month' (00 S2); comparisons involving a
 *   month-granularity date are made at month level.
 */
import { z } from './zod';
import {
  ISODateSchema, ISODateTimeSchema, NonEmptyStringSchema, localToday, ymOf,
  type ISODate, type ISODateTime, type Localized, type Result, type YearMonth,
} from './primitives';
import { EntryChannelSchema, type EntryChannel, type PolicyFile, type RegimeId, type ScenarioId } from './policy';
import type { NationalFile } from './national';
import type { ApprovalBaseline, QuarterlyFile } from './quarterly';
import type { OfficesFile } from './offices';
import type { AlertsFile } from './alerts';
import type { EstimatorParams } from './params';
import type { Manifest } from './manifest';

// ── 02 §3 milestones ────────────────────────────────────────────────────────────────────────

/** 02 §3 milestone keys (key facts §2 sequence + doc 15 §9.2 remedy milestones). */
export const MilestoneKeySchema = z.enum([
  'receipt', 'biometrics', 'ead_c9', 'ead_renewal_filed', 'ap_i131', 'transfer',
  'interview_notice', 'interview', 'rfe', 'rfe_response', 'noid', 'noid_response',
  'erequest', 'erequest_response', 'expedite_request', 'expedite_outcome',
  'congressional_inquiry', 'ombudsman', 'mandamus', 'parole_termination_notice',
  'decision', 'card',
]);
export type MilestoneKey = z.infer<typeof MilestoneKeySchema>;

export const DateGranularitySchema = z.enum(['day', 'month']);

/** 02 §3 `Milestone`. `date: null` = "happened, date unknown". */
export const MilestoneSchema = z.object({
  key: MilestoneKeySchema,
  date: ISODateSchema.nullable(),
  dateGranularity: DateGranularitySchema,
  dateSource: z.enum(['notice', 'online_status', 'memory']),
  meta: z.object({
    cardExpiry: ISODateSchema.optional(), // ead_c9
    scheduledFor: ISODateSchema.optional(), // interview_notice
    dueDate: ISODateSchema.optional(), // rfe / noid (else derived: +84 d / +33 d)
    outcome: z.enum(['approved', 'denied', 'withdrawn', 'admin_closed', 'granted', 'no_response', 'pending', 'pi_denied', 'dismissed']).optional(),
    basis: z.enum(['financial', 'humanitarian', 'govt', 'nonprofit', 'uscis_error']).optional(), // expedite
    erequestType: z.enum(['outside_processing', 'no_notice', 'no_card', 'typo', 'other']).optional(),
    terminationNotice: z.enum(['EMAIL_APR_2025', 'CHNV_JUN_2025', 'INDIVIDUAL_APR_2026', 'FRP_JAN_2026', 'OTHER']).optional(),
  }).optional(),
});
export type Milestone = z.infer<typeof MilestoneSchema>;

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const nullableBool = z.boolean().nullable();

type IssueCtx = { addIssue(i: { code: 'custom'; path: (string | number)[]; message: string }): void };

/** Compare two dated points; month level when either side has month granularity. */
function cmpDates(a: string, ag: 'day' | 'month', b: string, bg: 'day' | 'month'): number {
  const monthLevel = ag === 'month' || bg === 'month';
  const x = monthLevel ? ymOf(a) : a;
  const y = monthLevel ? ymOf(b) : b;
  return x < y ? -1 : x > y ? 1 : 0;
}

/** Today-free ordering rules of 02 §8 (also run by `CaseTimelineSchema`). */
function orderingIssues(c: CaseTimeline, ctx: IssueCtx): void {
  const R = c.i485ReceiptDate;
  const Rg = c.i485ReceiptDateGranularity;
  if (Rg === 'month' && !R.endsWith('-15')) ctx.addIssue({ code: 'custom', path: ['i485ReceiptDate'], message: 'month granularity records day 15 (00 S2)' });
  if (c.role === 'principal' && c.derivativeOf !== undefined) ctx.addIssue({ code: 'custom', path: ['derivativeOf'], message: 'only a derivative links to a principal' });
  if (c.updatedAt < c.createdAt) ctx.addIssue({ code: 'custom', path: ['updatedAt'], message: 'updatedAt before createdAt' });

  c.milestones.forEach((m, i) => {
    const at = (k: string) => ['milestones', i, k];
    if (m.date !== null && m.dateGranularity === 'month' && !m.date.endsWith('-15')) {
      ctx.addIssue({ code: 'custom', path: at('date'), message: 'month granularity records day 15 (00 S2)' });
    }
    if (m.date !== null && m.key !== 'parole_termination_notice' && cmpDates(m.date, m.dateGranularity, R, Rg) < 0) {
      ctx.addIssue({ code: 'custom', path: at('date'), message: `${m.key} ${m.date} is before the I-485 receipt ${R} (02 §8)` });
    }
    const meta = m.meta;
    if (meta?.cardExpiry !== undefined && m.date !== null && meta.cardExpiry <= m.date) {
      ctx.addIssue({ code: 'custom', path: [...at('meta'), 'cardExpiry'], message: 'card expiry must be after the EAD date' });
    }
    if (meta?.dueDate !== undefined && m.date !== null && meta.dueDate < m.date) {
      ctx.addIssue({ code: 'custom', path: [...at('meta'), 'dueDate'], message: 'due date before the notice date' });
    }
    if (meta?.scheduledFor !== undefined && m.date !== null && meta.scheduledFor < m.date) {
      ctx.addIssue({ code: 'custom', path: [...at('meta'), 'scheduledFor'], message: 'interview scheduled before the notice date' });
    }
  });

  const interviews = c.milestones.filter((m) => m.key === 'interview' && m.date !== null);
  c.milestones.forEach((m, i) => {
    if (m.key !== 'decision' || m.date === null) return;
    for (const iv of interviews) {
      if (cmpDates(m.date, m.dateGranularity, iv.date!, iv.dateGranularity) < 0) {
        ctx.addIssue({ code: 'custom', path: ['milestones', i, 'date'], message: `decision ${m.date} before the interview ${iv.date} (02 §8)` });
      }
    }
  });
}

/** 02 §3 `CaseTimeline` (device only; minus `receiptFullLocal`, see the module comment). */
export const CaseTimelineSchema = z.object({
  schemaVersion: z.literal(1),
  localId: z.string().regex(UUID_V4, 'expected a uuid v4'),
  nickname: NonEmptyStringSchema.max(40),
  role: z.enum(['principal', 'derivative']),
  derivativeOf: z.string().regex(UUID_V4).optional(), // CU7 link
  entryChannel: EntryChannelSchema,
  paroleDate: ISODateSchema.optional(),
  paroleEndDateOriginal: ISODateSchema.optional(), // 2026-04-24 → flagged as re-termination (doc 16 §8.1)
  i485ReceiptDate: ISODateSchema,
  i485ReceiptDateGranularity: DateGranularitySchema,
  receiptPrefix: z.string().regex(/^[A-Z]{3}$/, 'only the 3-letter receipt prefix is stored').optional(),
  state: z.string().regex(/^[A-Z]{2}$/).optional(), // undefined = unknown → state mixture or national
  officeCode: z.string().regex(/^[A-Z]{3}$/).optional(),
  concurrentI765: nullableBool,
  concurrentI131: nullableBool,
  withAttorney: nullableBool,
  basicDocs: z.object({
    paroleRecord: nullableBool, nationalityProof: nullableBool, i693: nullableBool, photos: nullableBool, feeOrWaiver: nullableBool,
  }),
  hardship: z.array(z.enum(['job_loss_documented', 'benefits_loss', 'medical_emergency', 'death_in_family', 'uscis_error'])).optional(),
  milestones: z.array(MilestoneSchema),
  createdAt: ISODateTimeSchema,
  updatedAt: ISODateTimeSchema,
}).superRefine((c, ctx) => orderingIssues(c as CaseTimeline, ctx));

/** Plain interface (kept in sync with the schema by a type test) so the type reads like 02 §3. */
export interface CaseTimeline {
  schemaVersion: 1;
  localId: string;
  nickname: string;
  role: 'principal' | 'derivative';
  derivativeOf?: string;
  entryChannel: EntryChannel;
  paroleDate?: ISODate;
  paroleEndDateOriginal?: ISODate;
  i485ReceiptDate: ISODate;
  i485ReceiptDateGranularity: 'day' | 'month';
  receiptPrefix?: string;
  state?: string;
  officeCode?: string;
  concurrentI765: boolean | null;
  concurrentI131: boolean | null;
  withAttorney: boolean | null;
  basicDocs: { paroleRecord: boolean | null; nationalityProof: boolean | null; i693: boolean | null; photos: boolean | null; feeOrWaiver: boolean | null };
  hardship?: ('job_loss_documented' | 'benefits_loss' | 'medical_emergency' | 'death_in_family' | 'uscis_error')[];
  milestones: Milestone[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/**
 * The today-dependent rules of 02 §8: no future dates except the listed exemptions. Returns
 * human-readable issues (empty = valid). Month-granularity dates compare at month level.
 */
export function caseTimelineIssues(c: CaseTimeline, today: ISODate): string[] {
  const out: string[] = [];
  const future = (d: string, g: 'day' | 'month') => cmpDates(d, g, today, 'day') > 0;
  if (future(c.i485ReceiptDate, c.i485ReceiptDateGranularity)) out.push(`i485ReceiptDate: ${c.i485ReceiptDate} is in the future`);
  if (c.paroleDate !== undefined && future(c.paroleDate, 'day')) out.push(`paroleDate: ${c.paroleDate} is in the future`);
  c.milestones.forEach((m, i) => {
    if (m.date !== null && future(m.date, m.dateGranularity)) out.push(`milestones.${i}.date: ${m.key} ${m.date} is in the future`);
  });
  return out;
}

function issuesOf(error: z.ZodError): string[] {
  return error.issues.map((i) => `${i.path.map(String).join('.') || '(root)'}: ${i.message}`);
}

/**
 * 07 §6.0 `parseCase(json): Result<CaseTimeline>` — schema + 02 §8 rules. `opts.today` (ISO date)
 * pins the clock for tests and for the estimator path; without it the device's local date is used.
 * Unknown keys (including a legacy `receiptFullLocal`) are stripped from the returned value.
 */
export function parseCase(json: unknown, opts?: { today?: ISODate }): Result<CaseTimeline> {
  const r = CaseTimelineSchema.safeParse(json);
  if (!r.success) return { ok: false, issues: issuesOf(r.error) };
  const value = r.data as CaseTimeline;
  const today = opts?.today ?? localToday();
  const issues = caseTimelineIssues(value, today);
  return issues.length ? { ok: false, issues } : { ok: true, value };
}

// ── 02 §3 derived flags (packages/case-rules deriveFlags(); never stored) ───────────────────

export interface DerivedFlags {
  isParoleBased: boolean; // CHNV, CBP_ONE, FRP_CFRP, U4U, OTHER_PAROLE
  admittedOrParoled: boolean; // isParoleBased || VISA → CAA entry element
  noEstimateReason: null | 'i220a' | 'ewi' | 'conditional_parole_236' | 'decided';
  r1HoldApplies: boolean | 'low_confidence' | 'unknown_channel';
  frpI485Carveout: boolean;
  redEagleAppearsInClass: boolean; // Cuban, not finally adjudicated on 2026-08-24 ("parece estar")
  doeDhsAppearsInClass: boolean | 'unknown';
  expeditedRemovalWarning: boolean; // terminated parole or original end date < today (doc 16 §8.4)
  reTerminationDateSuspicious: boolean; // paroleEndDateOriginal == 2026-04-24
  oneYearWarning: boolean; // receipt < paroleDate + 366 d
  basicDocsComplete: boolean | null;
  filedAfterRedEagle: boolean; // receipt > 2026-08-24
}

// ── 02 §4 estimator I/O (packages/estimator) ───────────────────────────────────────────────

/** 02 §4 data status of the app's data layer (07 §6.0 `DataStatus`). */
export type DataStatus = 'live' | 'cached' | 'published' | 'sample';

export interface EstimateOk {
  kind: 'estimate'; modelVersion: 'VPH-1.1'; dataThrough: YearMonth; k0: number;
  mode: 'queue' | 'interview_scheduled' | 'post_interview' | 'post_expedite';
  clock: {
    calendarDays: number; adjudicableDays: number; adjudicableDaysAltOps: number; holdsApplied: RegimeId[];
    r1: 'applied' | 'not_applied' | 'not_applied_low_confidence' | 'both_shown';
    unknownChannelClocks?: { chnv: number; cbpOne: number };
  };
  pWithin: { m3: number; m6: number; m12: number; m24: number; m36: number };
  byDate: { date: ISODate; p: number }[]; // 31 Dec of this year, +1, +2
  quantiles: { q10: number | null; q25: number | null; q50: number | null; q75: number | null; q90: number | null }; // null = > 72
  survival: number[]; // S_c(0..72), S_c(0) = 1
  policyBand12: [number, number];
  structuralBand12: [number, number];
  perScenario: { id: ScenarioId; weight: number; posteriorWeight: number; p12: number; q50: number | null }[];
  drivers: { scenario: number; beta: number; office: number }; // variance shares, sum ≤ 1
  queue: { pendingTotal: number; olderThanYou: number; sameMonthAsYou: number; completionsLastMonth: number; beta: number };
  office: {
    basis: 'office' | 'state_mixture' | 'national'; code?: string; state?: string; multiplier?: number; nCompletions?: number;
    weak?: boolean; stateWeights?: Record<string, number>;
  };
  yardstick: {
    form: 'I-485'; subtype: '131A-FAM'; officeCode?: string; months80: number | null; inquiryDate: ISODate | null;
    publicationDate: ISODate | null; retrievedAt: ISODateTime | null; isProxy: true;
  };
  delays: { rfeZeroUntil?: ISODate; assumedResponseAt?: ISODate; nonResponseRisk?: boolean };
  confidence: 'LOW' | 'MEDIUM' | 'HIGH'; validated: boolean;
  guards: { id: 'T20a' | 'T20b' | 'pipeline_late' | 'artifact_old' | 'qa_degraded' | 'sample_data'; months?: YearMonth[] }[];
  weightTrace: { ruleId?: string; reason: string; before: Record<string, number>; after: Record<string, number> }[];
}

export type EstimateResult =
  | { kind: 'no_estimate'; reason: DerivedFlags['noEstimateReason']; flags: DerivedFlags }
  | { kind: 'decided'; outcome: string; date: ISODate | null }
  | EstimateOk;

export interface EstimateInput {
  case: CaseTimeline; flags: DerivedFlags;
  clock: EstimateOk['clock']; // from case-rules clockFor(case, policy, today); echoed unchanged
  national: NationalFile; quarterly: QuarterlyFile; offices: OfficesFile; policy: PolicyFile; params: EstimatorParams; alerts: AlertsFile;
  data: { status: DataStatus; manifest: Manifest }; // for the guards
  today: ISODate; // the estimator never calls Date.now
  opts?: { bands?: boolean }; // default true: structural band + state mixture
}

// ── 02 §5 case-rules outputs ────────────────────────────────────────────────────────────────

export interface RemedyStep {
  rung: 'a_i485' | 'a_c9' | 'b' | 'c' | 'd' | 'e' | 'f' | 'denial';
  state: 'available' | 'not_yet' | 'depends' | 'not_applicable';
  etaMonth?: YearMonth;
  gate?: { inquiryDate: ISODate | null; retrievedAt?: ISODateTime };
  titleKey: string; bodyKey: string; params: Record<string, string | number>;
}

export interface EadStatus {
  validityRule: '5y' | '18m' | 'unknown'; expiry?: ISODate; renewBy?: ISODate; autoExtension: boolean; reminders: ISODate[];
}

export interface ApprovalCard {
  populationShares: ApprovalBaseline[];
  baselines: ApprovalBaseline[];
  cleanRange: [number, number] | null;
  unmodelledFactors: Localized[];
}


// ── 02 §7 optional shared timeline (v1.1; native only) ──────────────────────────────────────

/** Days since receipt, per allowed milestone (the SQL trigger's key list), 0–3650. */
const OffsetKeySchema = z.enum(['biometrics', 'ead_c9', 'interview_notice', 'interview', 'rfe', 'rfe_response', 'decision', 'card']);

/**
 * 02 §7 `public.shared_timelines` row as sent by the client (snake_case, mirroring the SQL
 * columns; server-filled `id`, `owner_id`, `registered_at`, timestamps are not sent). Stricter than
 * doc 09 §6.3: no receipt digits (prefix only), filing month + day offsets (no absolute day dates),
 * no ZIP. Strict: any extra field (a name, a full receipt number, free text) is rejected.
 */
export const SharedTimelineSchema = z.strictObject({
  consent_version: z.number().int().min(1),
  schema_version: z.literal(1),
  entry_channel: z.enum(['CHNV', 'CBP_ONE', 'FRP_CFRP', 'U4U', 'OTHER_PAROLE', 'VISA', 'I220A']),
  receipt_prefix: z.enum(['IOE', 'MSC', 'NBC', 'EAC', 'WAC', 'LIN', 'SRC', 'YSC']).nullable(),
  state: z.string().regex(/^[A-Z]{2}$/),
  office_code: z.string().regex(/^[A-Z]{3}$/).nullable(),
  filed_month: ISODateSchema.refine((d) => d.endsWith('-01') && d >= '2023-01-01', 'first day of a month, 2023-01 or later'),
  offsets_days: z.partialRecord(OffsetKeySchema, z.number().int().min(0).max(3650)),
  decision: z.enum(['approved', 'denied', 'withdrawn', 'admin_closed']).nullable(),
  with_attorney: z.boolean().nullable(),
  evidence_level: z.enum(['notice', 'online_status', 'memory']),
  plausibility_flags: z.array(NonEmptyStringSchema),
});
export type SharedTimeline = z.infer<typeof SharedTimelineSchema>;
