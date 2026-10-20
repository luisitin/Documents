/**
 * 02-data-model.md §2.1 — `manifest.json` (pipeline file, passthrough).
 *
 * - `schemaVersion` is the integer 1; an unknown version makes the app keep its old data and show
 *   "Actualice la app" (02 §2.1; 03 §7).
 * - `files` requires exactly the 7 v1 names. `community` is NOT a v1 name: v1.1 adds it as an
 *   optional key (additive), so a manifest with or without it is valid.
 * - `canary` is the reference case T15 recomputed by the pipeline (GOLDEN T15 = P12 0.09229,
 *   q50 54 on the frozen snapshot; 04 §9.2).
 * - `artifactBuiltAt` exists only in `web-artifact/data/manifest.json` (set by build-artifact).
 */
import { z } from './zod';
import {
  FiscalQuarterSchema, ISODateSchema, ISODateTimeSchema, LocalizedSchema, NonEmptyStringSchema, Sha256Schema,
  ShareSchema, SourceIdSchema, UrlSchema, YearMonthSchema, pipelineObject,
} from './primitives';
import type { NationalFile } from './national';
import type { QuarterlyFile } from './quarterly';
import type { OfficesFile } from './offices';
import type { PolicyFile } from './policy';
import type { AlertsFile } from './alerts';
import type { ContentFile } from './content';
import type { EstimatorParams } from './params';

/** 02 §2.1: manifest `schemaVersion` for v1. */
export const SCHEMA_VERSION = 1 as const;

/** 02 §2.1: the 7 v1 data files, in manifest order. */
export const DATA_FILE_NAMES = ['national', 'quarterly', 'offices', 'policy', 'alerts', 'content', 'params'] as const;
export type DataFileName = (typeof DATA_FILE_NAMES)[number];

/** 02 §2.1 `DataFileMap`: file name → parsed type. */
export interface DataFileMap {
  national: NationalFile;
  quarterly: QuarterlyFile;
  offices: OfficesFile;
  policy: PolicyFile;
  alerts: AlertsFile;
  content: ContentFile;
  params: EstimatorParams;
}

/** One `files` entry: relative path, sha256 of the exact bytes, byte length. */
export const FileEntrySchema = pipelineObject({
  path: z.string().regex(/^[a-z0-9][a-z0-9_/.-]*\.json$/, 'expected a relative .json path'),
  sha256: Sha256Schema,
  bytes: z.number().int().nonnegative(),
});
export type FileEntry = z.infer<typeof FileEntrySchema>;

/** 02 §2.1 `SourceStatus` (classification of 03 §2 / key facts §8 HTTP policy). */
export const SourceStatusSchema = pipelineObject({
  id: SourceIdSchema,
  url: UrlSchema,
  status: z.enum([
    'ok', 'not_modified', 'not_yet', 'blocked_cloudflare', 'blocked_drupal_antibot', 'http_error',
    'network_error', 'schema_mismatch', 'skipped_no_secret', 'fallback_used', 'quarantined',
  ]),
  lastSuccessAt: ISODateTimeSchema.optional(),
  publishedPeriod: NonEmptyStringSchema.optional(),
  sha256: Sha256Schema.optional(),
  note: z.string().optional(),
});
export type SourceStatus = z.infer<typeof SourceStatusSchema>;

const filesShape = {
  national: FileEntrySchema,
  quarterly: FileEntrySchema,
  offices: FileEntrySchema,
  policy: FileEntrySchema,
  alerts: FileEntrySchema,
  content: FileEntrySchema,
  params: FileEntrySchema,
  community: FileEntrySchema.optional(), // v1.1, additive
};

/** 02 §2.1 `Manifest`. */
export const ManifestSchema = pipelineObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  minAppVersion: z.string().regex(/^\d+\.\d+\.\d+$/, 'expected semver x.y.z'),
  dataChangedAt: ISODateTimeSchema, // last time ANY data file content changed ("datos nuevos")
  lastCheckedAt: ISODateTimeSchema, // last committed pipeline check (heartbeat ≤ 7 d)
  generatedBy: pipelineObject({ runId: NonEmptyStringSchema, ref: NonEmptyStringSchema, sha: NonEmptyStringSchema }),
  latestOfficialMonth: YearMonthSchema,
  latestOfficialQuarter: FiscalQuarterSchema,
  latestProcessingTimesPublication: ISODateSchema.nullable(),
  files: pipelineObject(filesShape),
  sources: z.array(SourceStatusSchema),
  qa: pipelineObject({
    status: z.enum(['ok', 'degraded', 'quarantined']),
    lastGoodRunId: NonEmptyStringSchema,
    notes: z.array(LocalizedSchema),
  }),
  canary: pipelineObject({
    caseId: z.literal('T15'),
    pWithin12: ShareSchema,
    q50: z.number().int().min(1).max(72).nullable(), // EST-8: null = more than 72 months
    computedWith: z.literal('VPH-1.1'),
  }),
  artifactBuiltAt: ISODateTimeSchema.optional(),
  origin: z.enum(['pipeline', 'bundled_sample']).optional(),
}).superRefine((m, ctx) => {
  if (m.lastCheckedAt < m.dataChangedAt) {
    ctx.addIssue({ code: 'custom', path: ['lastCheckedAt'], message: 'lastCheckedAt is before dataChangedAt' });
  }
  for (const n of DATA_FILE_NAMES) {
    if (m.files[n].path !== `${n}.json`) ctx.addIssue({ code: 'custom', path: ['files', n, 'path'], message: `expected ${n}.json` });
  }
});
export type Manifest = z.infer<typeof ManifestSchema>;
