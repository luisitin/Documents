/**
 * 02-data-model.md §2.5 — `policy.json` (CURATED file: strict, PR-reviewed; copied from
 * `data/curated/policy.json`).
 *
 * Facts encoded by the schema itself (literal types in 02 §2.5, so a change needs a contract
 * change, 07 §10 rule 3):
 * - Red Eagle class: Cuban with an I-485 not finally adjudicated on 2026-08-24, N.D. Cal.
 *   3:26-cv-04850-CRB (key facts §1 flags; §9).
 * - Doe v. DHS (CBP One class): parole 2023-05-15 → 2025-01-19, window start uncertain,
 *   D. Mass. 1:25-cv-12245 (key facts §1; doc 16 §4.3).
 * - FRP carve-out: I-485 pending by 2025-12-15, FR 2025-22744 (key facts §1; 90 FR 58032).
 * - Cohort: 110,240 CHNV Cubans (CBP, Dec 2024); CBP One Cubans ≈100,000 (70k–130k), low
 *   confidence [I] (key facts §3, §7; doc 16 §8.3).
 * - Approval prior 70–90 % only with basic documents (key facts §3; 04 §7, M5).
 * - EAD: 5-year validity if issued before 2025-12-05, 18 months from then; no auto-extension for
 *   renewals filed on/after 2025-10-30; final rule 2026-10-14 (key facts §2 row 4).
 * - PA-2026-05: effective 2026-08-05, RFE ≤ 84 days (12 weeks), NOID 30 days + 3 mail
 *   (key facts §2 row 8; doc 14 §4).
 */
import { z } from './zod';
import {
  ISODateSchema, LocalizedSchema, NonEmptyStringSchema, UrlSchema, YearMonthSchema, curatedObject,
} from './primitives';

/** 02 §2.5 entry channels (key facts §1 + INA 236 conditional parole + UNKNOWN). */
export const EntryChannelSchema = z.enum([
  'CHNV', 'CBP_ONE', 'FRP_CFRP', 'U4U', 'OTHER_PAROLE', 'VISA', 'I220A', 'EWI', 'CONDITIONAL_PAROLE_236', 'UNKNOWN',
]);
export type EntryChannel = z.infer<typeof EntryChannelSchema>;
export const ENTRY_CHANNELS = EntryChannelSchema.options;

/** Channel set used by regimes and alerts: a channel or every Cuban filer. */
export const ChannelOrAllSchema = z.union([EntryChannelSchema, z.literal('ALL_CUBAN')]);
export type ChannelOrAll = z.infer<typeof ChannelOrAllSchema>;

export const RegimeIdSchema = z.enum(['R0', 'R1', 'R2', 'R3', 'R4']);
export type RegimeId = z.infer<typeof RegimeIdSchema>;

/** A legal instrument attached to a regime (memo, policy alert, court order). */
export const RegimeInstrumentSchema = curatedObject({
  id: NonEmptyStringSchema,
  date: ISODateSchema,
  appliesToCaa: z.boolean().nullable(),
  confidence: z.enum(['high', 'likely', 'low']),
  sourceUrl: UrlSchema,
});

/**
 * 02 §2.5 `Regime` — key facts §3 JSON, verbatim dates. Operational defaults: R1
 * 2025-02-14 → 2025-06-09; R3 2025-12-02 → 2026-06-12 (end-exclusive overlap, 04 EST-12).
 */
export const RegimeSchema = curatedObject({
  id: RegimeIdSchema,
  label: LocalizedSchema,
  start: ISODateSchema.nullable(),
  end: ISODateSchema.nullable(),
  hold: z.boolean(),
  appliesTo: z.array(ChannelOrAllSchema).min(1),
  lowConfidenceExempt: z.array(EntryChannelSchema).optional(), // R1: ['CBP_ONE'] (doc 16 §3)
  altEnds: curatedObject({
    legal: ISODateSchema.optional(),
    judgment: ISODateSchema.optional(),
    ops: z.array(ISODateSchema).optional(),
  }).optional(),
  instruments: z.array(RegimeInstrumentSchema),
  suspendedBy: z.array(curatedObject({
    id: NonEmptyStringSchema, // 'DORCAS_VACATUR' | 'RED_EAGLE_PI' | …
    date: ISODateSchema,
    court: NonEmptyStringSchema,
    docket: NonEmptyStringSchema,
  })).optional(),
}).superRefine((r, ctx) => {
  if (r.hold && (r.start === null || r.end === null)) {
    ctx.addIssue({ code: 'custom', path: ['end'], message: 'a hold regime needs both start and end (04 EST-12)' });
  }
  if (r.start !== null && r.end !== null && r.end < r.start) {
    ctx.addIssue({ code: 'custom', path: ['end'], message: `end ${r.end} before start ${r.start}` });
  }
});
export type Regime = z.infer<typeof RegimeSchema>;

/** 02 §2.5 `SubBreakpoint` (key facts §3 `sub_breakpoints`, Localized). */
export const SubBreakpointSchema = curatedObject({
  date: ISODateSchema,
  event: LocalizedSchema,
  kind: z.enum(['policy', 'court', 'ead', 'fees', 'enforcement', 'forms']),
  effect: z.enum(['copy', 'approval_card', 'scenario', 'eligibility']),
});
export type SubBreakpoint = z.infer<typeof SubBreakpointSchema>;

export const ScenarioIdSchema = z.enum(['S0', 'S1', 'S2', 'S3']);
export type ScenarioId = z.infer<typeof ScenarioIdSchema>;

/** 02 §2.5 `ScenarioPath` (04 §6.1; S3 is re-anchored at the last data month, 04 §6.2). */
export const ScenarioPathSchema = z.discriminatedUnion('kind', [
  curatedObject({ kind: z.literal('flat'), level: z.number().nonnegative() }),
  curatedObject({ kind: z.literal('ramp'), from: z.number().nonnegative(), to: z.number().nonnegative(), months: z.number().int().positive() }),
  curatedObject({ kind: z.literal('freezeThen'), freezeMonths: z.number().int().positive(), then: z.literal('S1') }),
]);
export type ScenarioPath = z.infer<typeof ScenarioPathSchema>;

/** 02 §2.5 `ScenarioDef`; priors 0.30 / 0.40 / 0.15 / 0.15 (04 §6.1; doc 08 §8.2). */
export const ScenarioDefSchema = curatedObject({
  id: ScenarioIdSchema,
  label: LocalizedSchema,
  prior: z.number().min(0).max(1),
  path: ScenarioPathSchema,
  anchorMonth: YearMonthSchema, // "2026-08": k = 1 is 2026-09 for S0–S2
  likelihoodUpdated: z.boolean(), // true S0–S2; false S3 (alert-only)
});
export type ScenarioDef = z.infer<typeof ScenarioDefSchema>;

/** Rule ids seeded by 04 §6.3 (COMPLETIONS_GE_2000 is retired); other ids are allowed. */
export const KNOWN_RULE_IDS = [
  'DORCAS_AFFIRMED', 'DORCAS_REVERSED', 'FIRST_CIR_STAY_BENEFITS_HOLD', 'RED_EAGLE_DISSOLVED',
  'NEW_HOLD_MEMO_CUBA', 'AAUP_RELIEF_DENIAL_POLICY',
] as const;

/** 02 §2.5 `AlertRule` — deterministic composition (04 §6.3). */
export const AlertRuleSchema = curatedObject({
  ruleId: NonEmptyStringSchema.refine((s) => s !== 'COMPLETIONS_GE_2000_TWO_MONTHS', 'retired rule (04 §6.3)'),
  effects: z.array(curatedObject({
    scenario: ScenarioIdSchema,
    factor: z.number().positive(),
    condition: z.enum(['always', 'redEagleProtects', 'redEagleNotProtecting', 'dorcasPending']).optional(),
  })),
  approvalCardFlag: z.literal('reestimate').optional(),
});
export type AlertRule = z.infer<typeof AlertRuleSchema>;

/** 02 §2.5 `LitigationCase` (key facts §9; watchers key on docket numbers, not captions). */
export const LitigationCaseSchema = curatedObject({
  id: NonEmptyStringSchema,
  caption: NonEmptyStringSchema, // display only (Noem → Mullin renames)
  court: NonEmptyStringSchema,
  docket: NonEmptyStringSchema,
  courtListenerId: z.number().int().positive().optional(),
  clearinghouseId: z.number().int().positive().optional(),
  status: LocalizedSchema,
  statusAsOf: ISODateSchema,
  whatWouldChange: LocalizedSchema,
  ruleIds: z.array(NonEmptyStringSchema),
});
export type LitigationCase = z.infer<typeof LitigationCaseSchema>;

/** A fee row (key facts §4). `since` is null where the research has no date ("—"). */
export const FeeSchema = curatedObject({
  id: z.string().regex(/^[a-zA-Z][a-zA-Z0-9]*$/).optional(), // stable lookup key, e.g. "mandamusFiling"
  form: NonEmptyStringSchema,
  usd: z.number().nonnegative(),
  since: ISODateSchema.nullable(),
  asOf: ISODateSchema.optional(),
  note: LocalizedSchema,
  source: NonEmptyStringSchema,
});
export type Fee = z.infer<typeof FeeSchema>;

/** 02 §2.5 `PolicyFile`. */
export const PolicyFileSchema = curatedObject({
  version: NonEmptyStringSchema,
  reviewedAt: ISODateSchema,
  regimes: z.array(RegimeSchema).min(1),
  subBreakpoints: z.array(SubBreakpointSchema),
  scenarios: z.array(ScenarioDefSchema),
  alertRules: z.array(AlertRuleSchema),
  litigation: z.array(LitigationCaseSchema),
  litigationState: curatedObject({
    dorcas: z.enum(['vacatur_in_force_appeal_pending', 'affirmed', 'reversed']),
    redEagle: curatedObject({ piInForce: z.boolean() }),
    asOf: ISODateSchema,
  }),
  classes: curatedObject({
    redEagle: curatedObject({ notFinallyAdjudicatedOn: z.literal('2026-08-24'), docket: z.literal('3:26-cv-04850-CRB') }),
    doeDhs: curatedObject({
      channel: z.literal('CBP_ONE'), paroleFrom: z.literal('2023-05-15'), paroleTo: z.literal('2025-01-19'),
      windowStartUncertain: z.literal(true), docket: z.literal('1:25-cv-12245'),
    }),
    frpCarveout: curatedObject({ i485PendingBy: z.literal('2025-12-15'), fr: z.literal('2025-22744') }),
  }),
  cohort: curatedObject({
    chnvCubans: z.literal(110240),
    cbpOneCubans: curatedObject({ central: z.literal(100000), low: z.literal(70000), high: z.literal(130000), confidence: z.literal('low') }),
  }),
  approval: curatedObject({
    cleanPrior: curatedObject({ low: z.literal(0.7), high: z.literal(0.9) }),
    requiresBasicDocs: z.literal(true),
    unmodelledFactors: z.array(LocalizedSchema).min(1),
  }),
  ead: curatedObject({
    fiveYearIfIssuedBefore: z.literal('2025-12-05'),
    eighteenMonthsFrom: z.literal('2025-12-05'),
    noAutoExtensionIfRenewalFiledOnOrAfter: z.literal('2025-10-30'),
    finalRule: z.literal('2026-10-14'),
  }),
  pa202605: curatedObject({ effective: z.literal('2026-08-05'), rfeMaxDays: z.literal(84), noidDays: z.literal(30), noidMailDays: z.literal(3) }),
  fees: z.array(FeeSchema),
  congressionalOffices: z.array(curatedObject({ state: z.string().regex(/^[A-Z]{2}$/), district: NonEmptyStringSchema, name: NonEmptyStringSchema })),
}).superRefine((p, ctx) => {
  const ids = p.regimes.map((r) => r.id);
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: 'custom', path: ['regimes'], message: 'duplicate regime id' });

  const sids = p.scenarios.map((s) => s.id).sort().join(',');
  if (sids !== 'S0,S1,S2,S3') ctx.addIssue({ code: 'custom', path: ['scenarios'], message: `scenarios must be exactly S0–S3, got ${sids}` });
  const priorSum = p.scenarios.reduce((a, s) => a + s.prior, 0);
  if (Math.abs(priorSum - 1) > 1e-9) ctx.addIssue({ code: 'custom', path: ['scenarios'], message: `priors sum to ${priorSum}, not 1` });
  p.scenarios.forEach((s, i) => {
    if (s.path.kind === 'freezeThen' && s.likelihoodUpdated) {
      ctx.addIssue({ code: 'custom', path: ['scenarios', i, 'likelihoodUpdated'], message: 'a freeze scenario is alert-only (04 §6.1)' });
    }
  });

  const ruleIds = new Set<string>();
  p.alertRules.forEach((r, i) => {
    if (ruleIds.has(r.ruleId)) ctx.addIssue({ code: 'custom', path: ['alertRules', i, 'ruleId'], message: `duplicate rule ${r.ruleId}` });
    ruleIds.add(r.ruleId);
  });
  p.litigation.forEach((l, i) => l.ruleIds.forEach((id, j) => {
    if (!ruleIds.has(id)) ctx.addIssue({ code: 'custom', path: ['litigation', i, 'ruleIds', j], message: `unknown rule ${id}` });
  }));

  for (let i = 1; i < p.subBreakpoints.length; i++) {
    if (p.subBreakpoints[i]!.date < p.subBreakpoints[i - 1]!.date) {
      ctx.addIssue({ code: 'custom', path: ['subBreakpoints', i, 'date'], message: 'sub-breakpoints must be sorted by date' });
    }
  }
  const feeIds = p.fees.flatMap((f) => (f.id ? [f.id] : []));
  if (new Set(feeIds).size !== feeIds.length) ctx.addIssue({ code: 'custom', path: ['fees'], message: 'duplicate fee id' });
});
export type PolicyFile = z.infer<typeof PolicyFileSchema>;
