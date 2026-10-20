/**
 * 02-data-model.md §2.10 — forecast ledger `data/forecasts/<dataThrough>.json` (v1.1,
 * append-only; CI forbids edits, 03 §7) and `scorecard.json`.
 *
 * The predictive distribution of next month's national completions is a mixture of lognormals,
 * one per likelihood-updated scenario, with the 04 §6.2 observation σ (04 §10.1 item 1).
 */
import { z } from './zod';
import { ISODateTimeSchema, NonEmptyStringSchema, Sha256Schema, ShareSchema, YearMonthSchema, pipelineObject } from './primitives';

/** 02 §2.10 `ForecastLedgerEntry`. */
export const ForecastLedgerEntrySchema = pipelineObject({
  issuedAt: ISODateTimeSchema,
  dataThrough: YearMonthSchema,
  modelVersion: NonEmptyStringSchema,
  paramsSha256: Sha256Schema,
  weights: z.record(z.string(), z.number().min(0).max(1)),
  nationalCompletions: z.array(pipelineObject({
    ym: YearMonthSchema,
    median: z.number().nonnegative(),
    p10: z.number().nonnegative(),
    p90: z.number().nonnegative(),
    logPredictive: z.array(pipelineObject({ mu: z.number(), sigma: z.number().positive(), weight: ShareSchema })).min(1),
  })).max(6), // next 6 months
  meanAgeOfCompletions: z.array(pipelineObject({ ym: YearMonthSchema, predicted: z.number().nonnegative() })),
  pendingOver6: z.array(pipelineObject({ ym: YearMonthSchema, predicted: z.number().nonnegative() })),
  referenceCase: pipelineObject({ pWithin12: ShareSchema, q50: z.number().int().min(1).max(72).nullable() }),
}).superRefine((e, ctx) => {
  e.nationalCompletions.forEach((c, i) => {
    if (!(c.p10 <= c.median && c.median <= c.p90)) ctx.addIssue({ code: 'custom', path: ['nationalCompletions', i], message: 'expected p10 ≤ median ≤ p90' });
    if (c.ym <= e.dataThrough) ctx.addIssue({ code: 'custom', path: ['nationalCompletions', i, 'ym'], message: 'forecast month must be after dataThrough' });
    const w = c.logPredictive.reduce((a, x) => a + x.weight, 0);
    if (Math.abs(w - 1) > 1e-6) ctx.addIssue({ code: 'custom', path: ['nationalCompletions', i, 'logPredictive'], message: `mixture weights sum to ${w}` });
  });
});
export type ForecastLedgerEntry = z.infer<typeof ForecastLedgerEntrySchema>;

const predObs = pipelineObject({ ym: YearMonthSchema, predicted: z.number().nonnegative(), observed: z.number().nonnegative() });

/** 02 §2.10 `Scorecard`. */
export const ScorecardSchema = pipelineObject({
  updatedAt: ISODateTimeSchema,
  completions: z.array(pipelineObject({ ym: YearMonthSchema, pit: ShareSchema, logScore: z.number() })),
  meanAge: z.array(predObs),
  pendingOver6: z.array(predObs),
  ksPValue: ShareSchema.nullable(),
  monthsScored: z.number().int().nonnegative(),
});
export type Scorecard = z.infer<typeof ScorecardSchema>;
