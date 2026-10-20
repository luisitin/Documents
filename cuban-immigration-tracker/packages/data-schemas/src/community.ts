/**
 * 02-data-model.md §2.9 — `community.json` (v1.1, pipeline file, passthrough).
 *
 * Methods only (04-estimation-model.md §11): delayed-entry Kaplan–Meier per transition and cell,
 * Aalen–Johansen for approval vs denial; naive medians of completed durations are banned.
 * Thresholds: n < 5 is never emitted; 5–9 display only; ≥ 10 usable (04 §11; 05 §6 re-identification).
 */
import { z } from './zod';
import { ISODateTimeSchema, pipelineObject } from './primitives';
import { EntryChannelSchema } from './policy';

const quantileDays = z.number().nonnegative().nullable();

/** 02 §2.9 `CommunityAggregate`. */
export const CommunityAggregateSchema = pipelineObject({
  cell: pipelineObject({
    filingQuarter: z.union([z.string().regex(/^\d{4}Q[1-4]$/, 'expected e.g. 2025Q1'), z.literal('all')]),
    officeGroup: z.enum(['MIAMI_DADE', 'REST_FL', 'TX', 'OTHER', 'all']),
    channel: z.union([EntryChannelSchema, z.literal('all')]),
  }),
  transition: z.enum(['receipt→biometrics', 'receipt→ead_c9', 'receipt→interview', 'interview→decision', 'receipt→decision']),
  method: z.enum(['delayed_entry_km', 'aalen_johansen']), // NEVER naive medians
  n: z.number().int().min(5), // n < 5 not emitted
  nEvents: z.number().int().nonnegative(),
  quantilesDays: pipelineObject({ p25: quantileDays, p50: quantileDays, p75: quantileDays }),
  weighting: z.enum(['none', 'poststrat_official_frame']),
  benchmark: pipelineObject({
    crowdMonthlyHazard: z.number().nonnegative(),
    officialMonthlyHazard: z.number().nonnegative(),
    ratio: z.number().nonnegative(),
    representative: z.boolean(),
  }),
}).superRefine((a, ctx) => {
  if (a.nEvents > a.n) ctx.addIssue({ code: 'custom', path: ['nEvents'], message: 'nEvents > n' });
});
export type CommunityAggregate = z.infer<typeof CommunityAggregateSchema>;

/** 02 §2.9 `CommunityFile`. */
export const CommunityFileSchema = pipelineObject({
  generatedAt: ISODateTimeSchema,
  consentVersions: z.array(z.number().int().min(1)),
  aggregates: z.array(CommunityAggregateSchema),
});
export type CommunityFile = z.infer<typeof CommunityFileSchema>;
