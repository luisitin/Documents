/**
 * Parsing entry points shared by the app and the pipeline (03-data-pipeline.md §1 "one
 * contract": the same zod schemas validate on the device and in CI).
 *
 * - `parseDataFile(name, json)` / `parseManifest(json)` — 07 §6.0 signatures; issues are
 *   `"<path>: <message>"` strings.
 * - `dataFileWarnings(name, json)` — non-fatal findings for pipeline files: unknown keys kept by
 *   passthrough parsing (02 §8 "ignored … with a warning") and `Localized` values whose `es` equals
 *   `en` (allowed only for proper names, 02 §8).
 * - `crossCheckSnapshot(files)` — consistency between the 8 published files of one snapshot.
 */
import { z } from './zod';
import { LocalizedSchema, type Result } from './primitives';
import { NationalFileSchema } from './national';
import { QuarterlyFileSchema } from './quarterly';
import { OfficesFileSchema } from './offices';
import { PolicyFileSchema } from './policy';
import { AlertsFileSchema } from './alerts';
import { ContentFileSchema } from './content';
import { EstimatorParamsSchema } from './params';
import { DATA_FILE_NAMES, ManifestSchema, type DataFileMap, type DataFileName, type Manifest } from './manifest';

/** zod issues → `"a.b.0: message"` strings. */
export function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((i) => `${i.path.map(String).join('.') || '(root)'}: ${i.message}`);
}

/** `safeParse` result → 07 §6.0 `Result<T>`. */
export function toResult<T>(r: { success: true; data: T } | { success: false; error: z.ZodError }): Result<T> {
  return r.success ? { ok: true, value: r.data } : { ok: false, issues: formatIssues(r.error) };
}

/** Schema per v1 data file name (02 §2). Curated: policy, alerts, content (strict). */
export const DATA_FILE_SCHEMAS = {
  national: NationalFileSchema,
  quarterly: QuarterlyFileSchema,
  offices: OfficesFileSchema,
  policy: PolicyFileSchema,
  alerts: AlertsFileSchema,
  content: ContentFileSchema,
  params: EstimatorParamsSchema,
} as const;

/** Which files are curated (strict) vs pipeline (passthrough), 02 §2 / §8. */
export const CURATED_FILES: readonly DataFileName[] = ['policy', 'alerts', 'content'];

/** 07 §6.0 `parseDataFile<N extends DataFileName>(name, json): Result<DataFileMap[N]>`. */
export function parseDataFile<N extends DataFileName>(name: N, json: unknown): Result<DataFileMap[N]> {
  const schema = DATA_FILE_SCHEMAS[name] as unknown as z.ZodType<DataFileMap[N]>;
  if (!schema) return { ok: false, issues: [`(root): unknown data file "${String(name)}"`] };
  return toResult(schema.safeParse(json));
}

/** 07 §6.0 `parseManifest(json): Result<Manifest>`. */
export function parseManifest(json: unknown): Result<Manifest> {
  return toResult(ManifestSchema.safeParse(json));
}

// ── warnings: unknown keys (passthrough) and es === en ─────────────────────────────────────

type AnyDef = {
  type: string; shape?: Record<string, z.ZodType>; catchall?: z.ZodType; element?: z.ZodType; innerType?: z.ZodType;
  options?: z.ZodType[]; valueType?: z.ZodType; items?: z.ZodType[]; rest?: z.ZodType | null; in?: z.ZodType; getter?: () => z.ZodType;
};
const defOf = (s: z.ZodType): AnyDef => (s as unknown as { _zod: { def: AnyDef } })._zod.def;
const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const join = (path: string, key: string | number) => (typeof key === 'number' ? `${path}[${key}]` : path ? `${path}.${key}` : key);

/**
 * Walks `value` alongside `schema` and reports (1) keys an object schema does not declare but
 * keeps (passthrough), (2) Localized values with `es === en`. Call it on data that already parsed.
 */
export function schemaWarnings(schema: z.ZodType, value: unknown, path = ''): string[] {
  const out: string[] = [];
  const walk = (s: z.ZodType, v: unknown, p: string): void => {
    if (s === (LocalizedSchema as unknown as z.ZodType) && isPlainObject(v) && v.es === v.en) {
      out.push(`${p || '(root)'}: es equals en ("${String(v.es)}"); allowed only for proper names (02 §8)`);
    }
    const d = defOf(s);
    switch (d.type) {
      case 'object': {
        if (!isPlainObject(v) || !d.shape) return;
        for (const key of Object.keys(v)) {
          const sub = d.shape[key];
          if (sub) walk(sub, v[key], join(p, key));
          else if (d.catchall && defOf(d.catchall).type === 'unknown') out.push(`${join(p, key)}: unknown key kept by passthrough parsing (02 §8)`);
        }
        return;
      }
      case 'array':
        if (Array.isArray(v) && d.element) v.forEach((x, i) => walk(d.element!, x, join(p, i)));
        return;
      case 'tuple':
        if (Array.isArray(v) && d.items) v.forEach((x, i) => { const it = d.items![i] ?? d.rest; if (it) walk(it, x, join(p, i)); });
        return;
      case 'record':
        if (isPlainObject(v) && d.valueType) for (const key of Object.keys(v)) walk(d.valueType, v[key], join(p, key));
        return;
      case 'optional': case 'nullable': case 'default': case 'prefault': case 'readonly': case 'catch': case 'nonoptional':
        if (v !== undefined && v !== null && d.innerType) walk(d.innerType, v, p);
        return;
      case 'union': {
        const opt = d.options?.find((o) => o.safeParse(v).success);
        if (opt) walk(opt, v, p);
        return;
      }
      case 'pipe':
        if (d.in) walk(d.in, v, p);
        return;
      case 'lazy':
        if (d.getter) walk(d.getter(), v, p);
        return;
      default:
        return;
    }
  };
  walk(schema, value, path);
  return out;
}

/** Warnings for one data file (call after a successful parse). */
export function dataFileWarnings(name: DataFileName | 'manifest', json: unknown): string[] {
  const schema = name === 'manifest' ? ManifestSchema : DATA_FILE_SCHEMAS[name];
  return schemaWarnings(schema as unknown as z.ZodType, json);
}

// ── cross-file consistency of one snapshot ─────────────────────────────────────────────────

export type Snapshot = Partial<DataFileMap> & { manifest?: Manifest };

/**
 * Consistency rules between the files of one snapshot. `issues` are errors; `warnings` are
 * reported but do not fail validation. Keys are file names.
 */
export function crossCheckSnapshot(s: Snapshot): { issues: Record<string, string[]>; warnings: Record<string, string[]> } {
  const issues: Record<string, string[]> = {};
  const warnings: Record<string, string[]> = {};
  const add = (bag: Record<string, string[]>, file: string, msg: string) => { (bag[file] ??= []).push(msg); };

  const lastYm = s.national?.rows.at(-1)?.ym;
  if (s.manifest && lastYm && s.manifest.latestOfficialMonth !== lastYm) {
    add(issues, 'manifest', `latestOfficialMonth ${s.manifest.latestOfficialMonth} ≠ last national row ${lastYm}`);
  }
  if (s.params && lastYm && s.params.dataThrough !== lastYm) {
    add(issues, 'params', `dataThrough ${s.params.dataThrough} ≠ last national row ${lastYm}`);
  }
  if (s.manifest && s.quarterly) {
    const { fy, q } = s.manifest.latestOfficialQuarter;
    if (!s.quarterly.rows.some((r) => r.form === 'I-485 (Cuban)' && r.quarter.fy === fy && r.quarter.q === q)) {
      add(issues, 'manifest', `latestOfficialQuarter FY${fy} Q${q} has no "I-485 (Cuban)" row in quarterly.json`);
    }
  }
  if (s.offices) {
    const codes = new Set(s.offices.offices.map((o) => o.code));
    if (s.params) {
      for (const c of s.params.officeGroup) if (!codes.has(c)) add(issues, 'params', `officeGroup ${c} is not in offices.json`);
      for (const m of s.params.officeMultipliers) if (!codes.has(m.code)) add(issues, 'params', `officeMultipliers ${m.code} is not in offices.json`);
    }
    for (const r of s.offices.processingTimes) {
      if (!codes.has(r.officeCode)) add(warnings, 'offices', `processingTimes office ${r.officeCode} (${r.form} ${r.subtype}) is not listed in offices`);
    }
    const latestPub = s.offices.processingTimes.reduce<string | null>((a, r) => (a === null || r.publicationDate > a ? r.publicationDate : a), null);
    if (s.manifest && latestPub !== null && s.manifest.latestProcessingTimesPublication !== latestPub) {
      add(warnings, 'manifest', `latestProcessingTimesPublication ${s.manifest.latestProcessingTimesPublication} ≠ newest record ${latestPub}`);
    }
  }
  if (s.policy && s.alerts) {
    const rules = new Set(s.policy.alertRules.map((r) => r.ruleId));
    const ids = new Set(s.alerts.alerts.map((a) => a.id));
    for (const a of s.alerts.alerts) {
      for (const r of a.ruleIds ?? []) if (!rules.has(r)) add(issues, 'alerts', `${a.id}: unknown rule ${r}`);
      for (const x of a.supersedes ?? []) if (!ids.has(x)) add(issues, 'alerts', `${a.id}: supersedes unknown alert ${x}`);
    }
  }
  return { issues, warnings };
}

/** The 8 file names of a published snapshot, manifest first. */
export const SNAPSHOT_FILE_NAMES: readonly ('manifest' | DataFileName)[] = ['manifest', ...DATA_FILE_NAMES];
