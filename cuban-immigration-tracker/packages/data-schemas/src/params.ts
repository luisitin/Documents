/**
 * 02-data-model.md §2.8 — `params.json` (pipeline file, passthrough; produced by the fit in
 * `packages/ingestion` with `@caa/estimator`'s fit functions).
 *
 * Pinned constants are literal types (04-estimation-model.md): horizon 72 months and 1,000
 * receipts/month (EST-5, §3.3); κ_o = 50 and clamp [0.5, 2] (EST-11); grids (EST-4, §7);
 * milestone multipliers (§4: no biometrics after 4 months 0.7, RFE answered ×1.5 for 3 months,
 * mandamus ×1.3 for 4 months, post-interview lognormal median 3 σ 0.857, expedite median 2);
 * observation model (§6.2: lognormal, σ ≥ 0.25, tempering 0.5, level floor 50, weight floor
 * 0.02 of the S0–S2 sub-mass, §6.3 step 3).
 */
import { z } from './zod';
import {
  FiscalQuarterSchema, ISODateTimeSchema, NonEmptyStringSchema, YearMonthSchema, pipelineObject,
} from './primitives';
import { OfficeCodeSchema } from './offices';
import { ScenarioIdSchema } from './policy';

const pair = <A extends number, B extends number>(a: A, b: B) => z.tuple([z.literal(a), z.literal(b)]);

/** `Record<'S0'|'S1'|'S2'|'S3', number>` with every key required. */
export const ScenarioWeightsSchema = z.record(ScenarioIdSchema, z.number().min(0).max(1));

/** 02 §2.8 `WeightLedgerEntry` (append-only, 04 §6.3 step 4). */
export const WeightLedgerEntrySchema = pipelineObject({
  at: ISODateTimeSchema,
  reason: z.enum(['alert_rule', 'likelihood', 'prior_reset', 'supersede']),
  ruleId: NonEmptyStringSchema.optional(),
  alertId: NonEmptyStringSchema.optional(),
  observedMonth: YearMonthSchema.optional(),
  observedCompletions: z.number().int().nonnegative().optional(),
  before: z.record(z.string(), z.number()),
  after: z.record(z.string(), z.number()),
});
export type WeightLedgerEntry = z.infer<typeof WeightLedgerEntrySchema>;

/** One office multiplier (EST-11: r_o = (y_o/E_o)/r_G; m̂ = clamp((κ + y·r)/(κ + y), 0.5, 2)). */
export const OfficeMultiplierSchema = pipelineObject({
  code: OfficeCodeSchema,
  completions: z.number().int().nonnegative(), // y_o (approvals in the last two quarters, MVP basis)
  avgPending: z.number().nonnegative(), // E_o (mean of the two quarters' humanitarian pending)
  raw: z.number().nonnegative(), // r_o
  shrunk: z.number().min(0.5).max(2), // m̂_o — already shrunk; never shrink twice (EST-11)
  quarters: z.array(FiscalQuarterSchema),
  basis: z.enum(['approvals', 'approvals_and_denials']),
});
export type OfficeMultiplier = z.infer<typeof OfficeMultiplierSchema>;

/** 02 §2.8 `EstimatorParams`. */
export const EstimatorParamsSchema = pipelineObject({
  modelVersion: z.literal('VPH-1.1'),
  dataThrough: YearMonthSchema, // last monthly row used
  beta: pipelineObject({
    value: z.number().min(0).max(0.3), // EST-3 ternary search on [0, 0.3]; 0.037391 today
    targets: z.array(YearMonthSchema),
    sse: z.number().nonnegative(),
    fallbackUsed: z.boolean(), // fewer than 3 targets → 0.037
  }),
  horizonMonths: z.literal(72),
  receiptsForecast: z.literal(1000),
  officeGroup: z.array(OfficeCodeSchema),
  officeMultipliers: z.array(OfficeMultiplierSchema),
  k0Office: z.literal(50),
  clampOffice: pair(0.5, 2),
  grids: pipelineObject({
    beta: z.tuple([pair(0.5, 0.25), pair(1, 0.5), pair(2, 0.25)]),
    office: z.tuple([pair(0.8, 0.25), pair(1, 0.5), pair(1.25, 0.25)]),
    classMix: z.tuple([pair(0.5, 0.25), pair(1, 0.5), pair(2, 0.25)]),
    ead: z.tuple([pair(0.9, 0.25), pair(1, 0.5), pair(1.2, 0.25)]),
  }),
  milestone: pipelineObject({
    noBiometricsAfter4mo: z.literal(0.7),
    rfeAnswered: pipelineObject({ mult: z.literal(1.5), months: z.literal(3) }),
    mandamus: pipelineObject({ mult: z.literal(1.3), months: z.literal(4) }),
    postInterview: pipelineObject({ medianMonths: z.literal(3), sigma: z.literal(0.857) }),
    expediteGranted: pipelineObject({ medianMonths: z.literal(2), sigma: z.literal(0.857) }),
  }),
  observation: pipelineObject({
    model: z.literal('lognormal'),
    sigma: z.number().min(0.25), // fitted, floor 0.25; 0.30 today (04 §6.2)
    tempering: z.literal(0.5),
    floorLevel: z.literal(50),
    weightFloor: z.literal(0.02), // fraction of the S0–S2 sub-mass (04 §6.3 step 3)
  }),
  scenarioWeights: pipelineObject({
    asOf: YearMonthSchema,
    weights: ScenarioWeightsSchema, // case-independent part
    caseDependentRules: z.array(NonEmptyStringSchema), // rules whose factor depends on class membership
  }),
  weightLedger: z.array(WeightLedgerEntrySchema),
  validation: pipelineObject({
    status: z.enum(['not_validated', 'validated_r0r2', 'validated_current']),
    backtestRunId: NonEmptyStringSchema.optional(),
  }),
  confidenceGates: pipelineObject({
    r4MonthsOfData: z.number().int().nonnegative(),
    pitNotRejectedMonths: z.number().int().nonnegative(),
    crowdDecisionsByOfficeGroup: z.record(z.string(), z.number().int().nonnegative()),
  }),
}).superRefine((p, ctx) => {
  const sum = Object.values(p.scenarioWeights.weights).reduce((a, w) => a + w, 0);
  if (Math.abs(sum - 1) > 1e-9) ctx.addIssue({ code: 'custom', path: ['scenarioWeights', 'weights'], message: `weights sum to ${sum}, not 1` });
  const codes = p.officeMultipliers.map((m) => m.code);
  if (new Set(codes).size !== codes.length) ctx.addIssue({ code: 'custom', path: ['officeMultipliers'], message: 'duplicate office multiplier' });
  if (p.beta.targets.some((t) => t > p.dataThrough)) ctx.addIssue({ code: 'custom', path: ['beta', 'targets'], message: 'β target after dataThrough' });
});
export type EstimatorParams = z.infer<typeof EstimatorParamsSchema>;
