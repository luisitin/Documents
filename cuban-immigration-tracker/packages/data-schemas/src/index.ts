/**
 * @caa/data-schemas — WP0 SKELETON (07-implementation-plan.md §2, declared ownership exception 2).
 *
 * WP1 replaces this file in the `contract: data-schemas v1` commit with every schema of
 * 02-data-model.md §1–§5 and the exact §6.0 signatures. Until then it carries only what the
 * WP0 spikes need (V6/V8 and acceptance (e)): `SCHEMA_VERSION`, `Result<T>` and a faithful
 * `parseManifest` for the 02 §2.1 `Manifest` envelope, so the app bundle and jest both exercise
 * zod through a `@caa/*` import. Pure: imports only `zod` (ARCH-1).
 */
import { z } from 'zod';

/**
 * Artifact CSP (contract b) has no 'unsafe-eval'. zod's JIT probe (`new Function`) is caught, but
 * Chromium still reports it as a `securitypolicyviolation` (Prove P3 requires zero). `jitless`
 * must be set before the first schema is constructed, so it stays the first statement of this
 * module. WP1 keeps it when replacing the skeleton.
 */
z.config({ jitless: true });

/** 02 §2.1: `manifest.schemaVersion` is the integer 1 for v1; unknown → "Actualice la app". */
export const SCHEMA_VERSION = 1 as const;

/** 07 §6.0: the shared parse result. */
export type Result<T> = { ok: true; value: T } | { ok: false; issues: string[] };

/** 02 §1 primitives. */
export const ISODateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const YearMonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
export const ISODateTimeSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);
export const LocalizedSchema = z.strictObject({ es: z.string().min(1), en: z.string().min(1) });
export const FiscalQuarterSchema = z.strictObject({
  fy: z.number().int(),
  q: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
});

/** 02 §2.1: the 7 v1 data files (`community` is v1.1, additive). */
export const DATA_FILE_NAMES = ['national', 'quarterly', 'offices', 'policy', 'alerts', 'content', 'params'] as const;
export type DataFileName = (typeof DATA_FILE_NAMES)[number];

const FileEntrySchema = z.looseObject({
  path: z.string().min(1),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  bytes: z.number().int().nonnegative(),
});

const SourceStatusSchema = z.looseObject({
  id: z.string().min(1),
  url: z.string(),
  status: z.enum([
    'ok', 'not_modified', 'not_yet', 'blocked_cloudflare', 'blocked_drupal_antibot', 'http_error',
    'network_error', 'schema_mismatch', 'skipped_no_secret', 'fallback_used', 'quarantined',
  ]),
});

/** 02 §2.1 `Manifest` (pipeline file → passthrough of unknown keys, 02 §8). */
export const ManifestSchema = z.looseObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  minAppVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  dataChangedAt: ISODateTimeSchema,
  lastCheckedAt: ISODateTimeSchema,
  generatedBy: z.looseObject({ runId: z.string(), ref: z.string(), sha: z.string() }),
  latestOfficialMonth: YearMonthSchema,
  latestOfficialQuarter: FiscalQuarterSchema,
  latestProcessingTimesPublication: ISODateSchema.nullable(),
  files: z.strictObject(
    Object.fromEntries(DATA_FILE_NAMES.map((n) => [n, FileEntrySchema])) as Record<DataFileName, typeof FileEntrySchema>,
  ),
  sources: z.array(SourceStatusSchema),
  qa: z.looseObject({
    status: z.enum(['ok', 'degraded', 'quarantined']),
    lastGoodRunId: z.string(),
    notes: z.array(LocalizedSchema),
  }),
  canary: z.looseObject({
    caseId: z.literal('T15'),
    pWithin12: z.number().min(0).max(1),
    q50: z.number().int().nullable(),
    computedWith: z.literal('VPH-1.1'),
  }),
  artifactBuiltAt: ISODateTimeSchema.optional(),
  origin: z.enum(['pipeline', 'bundled_sample']).optional(),
});
export type Manifest = z.infer<typeof ManifestSchema>;

function toResult<T>(r: { success: true; data: T } | { success: false; error: z.ZodError }): Result<T> {
  return r.success
    ? { ok: true, value: r.data }
    : { ok: false, issues: r.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`) };
}

/** 07 §6.0 `parseManifest(json: unknown): Result<Manifest>`. */
export function parseManifest(json: unknown): Result<Manifest> {
  return toResult(ManifestSchema.safeParse(json));
}
