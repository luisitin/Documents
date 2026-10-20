/**
 * `@caa/data-schemas/node` — Node-only helpers (07-implementation-plan.md §6.0 / WP1). Never
 * imported by app/ (the app tsconfig excludes this file; the root ESLint purity rule allows Node
 * built-ins here only).
 *
 * - `validateDataDir(dir)`: validates a published snapshot directory (the 7 v1 files plus the
 *   manifest, 02 §2) with the same schemas the app uses, verifies each file's sha256 and byte
 *   length against the manifest, runs the cross-file checks, and validates the optional v1.1
 *   files and the human-edited `curated/` inputs (strict) when present. Used by
 *   `npm run data:validate` (WP5 CLI) and by the WP1 tests on the hand-built sample (G0).
 * - `jsonSchemaFiles()` / `checkJsonSchemaDir(dir)`: the deterministic JSON Schema export behind
 *   `npm run schema:export [-- --check]` (02 intro: "CI fails on drift").
 */
import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from './zod';
import {
  AlertCandidatesFileSchema, AlertSchema, AlertsFileSchema, CaseTimelineSchema, CommunityFileSchema, ContentFileSchema,
  DATA_FILE_NAMES, DATA_FILE_SCHEMAS, EstimatorParamsSchema, ForecastLedgerEntrySchema, HistoricMedianSchema, ManifestSchema,
  NationalFileSchema, OfficesFileSchema, PolicyFileSchema, QuarterlyFileSchema, ScorecardSchema, SharedTimelineSchema,
  crossCheckSnapshot, formatIssues, schemaWarnings, type Manifest, type Snapshot,
} from './index';

export interface DataDirReport {
  ok: boolean;
  /** Errors keyed by the file's path relative to `dir` (or by snapshot file name for cross-checks). */
  issues: Record<string, string[]>;
  /** Non-fatal findings (unknown passthrough keys, es === en, unlisted service centers…). Additive to 07 §6.0. */
  warnings: Record<string, string[]>;
}

const toPath = (d: string | URL) => (typeof d === 'string' ? d : fileURLToPath(d));

async function exists(p: string): Promise<boolean> {
  try { await stat(p); return true; } catch { return false; }
}

/**
 * 07 §6.0 `validateDataDir(dir): Promise<{ ok, issues }>` (plus `warnings`). A missing required
 * file is an issue; optional files (community, scorecard, forecasts, candidates, curated) are
 * validated only when present.
 */
export async function validateDataDir(dir: string | URL): Promise<DataDirReport> {
  const root = toPath(dir);
  const issues: Record<string, string[]> = {};
  const warnings: Record<string, string[]> = {};
  const push = (bag: Record<string, string[]>, k: string, msgs: string[]) => { if (msgs.length) (bag[k] ??= []).push(...msgs); };

  /** Reads + JSON-parses + validates one file; returns the parsed value or undefined. */
  async function check<T>(rel: string, schema: z.ZodType<T>, required: boolean): Promise<{ value: T; bytes: Buffer } | undefined> {
    const p = join(root, rel);
    if (!(await exists(p))) {
      if (required) push(issues, rel, ['(file): missing']);
      return undefined;
    }
    const bytes = await readFile(p);
    let json: unknown;
    try { json = JSON.parse(bytes.toString('utf8')); } catch (e) { push(issues, rel, [`(file): invalid JSON (${(e as Error).message})`]); return undefined; }
    const r = schema.safeParse(json);
    if (!r.success) { push(issues, rel, formatIssues(r.error)); return undefined; }
    push(warnings, rel, schemaWarnings(schema as unknown as z.ZodType, json));
    return { value: r.data, bytes };
  }

  const snapshot: Snapshot = {};
  const manifest = await check<Manifest>('manifest.json', ManifestSchema as unknown as z.ZodType<Manifest>, true);
  if (manifest) snapshot.manifest = manifest.value;

  for (const name of DATA_FILE_NAMES) {
    const rel = manifest?.value.files[name].path ?? `${name}.json`;
    const got = await check(rel, DATA_FILE_SCHEMAS[name] as unknown as z.ZodType<unknown>, true);
    if (!got) continue;
    (snapshot as Record<string, unknown>)[name] = got.value;
    if (manifest) {
      const entry = manifest.value.files[name];
      const sha = createHash('sha256').update(got.bytes).digest('hex');
      if (sha !== entry.sha256) push(issues, rel, [`(file): sha256 ${sha} ≠ manifest ${entry.sha256}`]);
      if (got.bytes.length !== entry.bytes) push(issues, rel, [`(file): ${got.bytes.length} bytes ≠ manifest ${entry.bytes}`]);
    }
  }

  // v1.1 and pipeline side files (optional).
  if (manifest?.value.files.community) await check(manifest.value.files.community.path, CommunityFileSchema, true);
  else await check('community.json', CommunityFileSchema, false);
  await check('scorecard.json', ScorecardSchema, false);
  await check('candidates/alert-candidates.json', AlertCandidatesFileSchema, false);
  if (await exists(join(root, 'forecasts'))) {
    for (const f of (await readdir(join(root, 'forecasts'))).filter((x) => x.endsWith('.json')).sort()) {
      const got = await check(`forecasts/${f}`, ForecastLedgerEntrySchema, true);
      if (got && `${got.value.dataThrough}.json` !== f) push(issues, `forecasts/${f}`, [`(file): name must be ${got.value.dataThrough}.json`]);
    }
  }

  // Human-edited inputs (strict), 03 §6.3 "validates data/ and data/curated/ with strict zod".
  if (await exists(join(root, 'curated'))) {
    await check('curated/policy.json', PolicyFileSchema, false);
    await check('curated/content.json', ContentFileSchema, false);
    await check('curated/historic_medians.json', z.array(HistoricMedianSchema), false);
    const alertsDir = join(root, 'curated', 'alerts');
    if (await exists(alertsDir)) {
      const seen = new Map<string, string>();
      for (const f of (await readdir(alertsDir)).filter((x) => x.endsWith('.json')).sort()) {
        const got = await check(`curated/alerts/${f}`, AlertSchema, true);
        if (!got) continue;
        if (`${got.value.id}.json` !== f) push(warnings, `curated/alerts/${f}`, [`(file): file name differs from id ${got.value.id}`]);
        const prev = seen.get(got.value.id);
        if (prev) push(issues, `curated/alerts/${f}`, [`(file): duplicate alert id ${got.value.id} (also in ${prev})`]);
        seen.set(got.value.id, f);
      }
    }
  }

  const cross = crossCheckSnapshot(snapshot);
  for (const [k, v] of Object.entries(cross.issues)) push(issues, `${k}.json`, v);
  for (const [k, v] of Object.entries(cross.warnings)) push(warnings, `${k}.json`, v);

  return { ok: Object.keys(issues).length === 0, issues, warnings };
}

// ── JSON Schema export (deterministic) ─────────────────────────────────────────────────────

/** Exported schemas: `data/schema/<name>.schema.json`. Order is fixed. */
export const JSON_SCHEMA_EXPORTS: readonly (readonly [string, z.ZodType])[] = [
  ['manifest', ManifestSchema as unknown as z.ZodType],
  ['national', NationalFileSchema as unknown as z.ZodType],
  ['quarterly', QuarterlyFileSchema as unknown as z.ZodType],
  ['offices', OfficesFileSchema as unknown as z.ZodType],
  ['policy', PolicyFileSchema as unknown as z.ZodType],
  ['alerts', AlertsFileSchema as unknown as z.ZodType],
  ['alert', AlertSchema as unknown as z.ZodType],
  ['content', ContentFileSchema as unknown as z.ZodType],
  ['params', EstimatorParamsSchema as unknown as z.ZodType],
  ['historic-medians', z.array(HistoricMedianSchema) as unknown as z.ZodType],
  ['community', CommunityFileSchema as unknown as z.ZodType],
  ['forecast-ledger-entry', ForecastLedgerEntrySchema as unknown as z.ZodType],
  ['scorecard', ScorecardSchema as unknown as z.ZodType],
  ['alert-candidates', AlertCandidatesFileSchema as unknown as z.ZodType],
  ['case-timeline', CaseTimelineSchema as unknown as z.ZodType],
  ['shared-timeline', SharedTimelineSchema as unknown as z.ZodType],
];

/** Recursively sorts object keys so the output never depends on insertion order. */
function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, sortKeys((v as Record<string, unknown>)[k])]));
  }
  return v;
}

/**
 * `{ "<name>.schema.json": "<content>" }` for every exported schema. Content is JSON with sorted
 * keys, 2-space indent and a trailing newline (03 §5 conventions), so it is byte-stable. Custom
 * refinements (02 §8 cross-field rules) are not representable in JSON Schema and are omitted; the
 * zod schemas remain the source of truth.
 */
export function jsonSchemaFiles(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, schema] of JSON_SCHEMA_EXPORTS) {
    const js = z.toJSONSchema(schema, { target: 'draft-2020-12', io: 'output', unrepresentable: 'any' }) as Record<string, unknown>;
    const doc = { ...js, $id: `https://raw.githubusercontent.com/luisitin/Documents/main/cuban-immigration-tracker/data/schema/${name}.schema.json`, title: name, 'x-generatedBy': 'scripts/export-schema.mjs (@caa/data-schemas v1)' };
    out[`${name}.schema.json`] = `${JSON.stringify(sortKeys(doc), null, 2)}\n`;
  }
  return out;
}

/** Drift between `dir` and `jsonSchemaFiles()`: missing, changed and stale `*.schema.json` files. */
export async function checkJsonSchemaDir(dir: string | URL): Promise<string[]> {
  const root = toPath(dir);
  const want = jsonSchemaFiles();
  const drift: string[] = [];
  const have = (await exists(root)) ? (await readdir(root)).filter((f) => f.endsWith('.schema.json')) : [];
  for (const [f, content] of Object.entries(want)) {
    if (!have.includes(f)) drift.push(`${f}: missing`);
    else if ((await readFile(join(root, f), 'utf8')) !== content) drift.push(`${f}: differs from the zod schema`);
  }
  for (const f of have) if (!(f in want)) drift.push(`${f}: stale (no such schema)`);
  return drift;
}
