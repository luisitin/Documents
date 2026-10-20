/// <reference types="vite/client" />
/**
 * Test helpers for @caa/data-schemas (WP1). Fixtures are loaded with Vite's `import.meta.glob`
 * (no Node built-ins: the root ESLint purity rule bans `node:*` under packages/, except src/node.ts).
 */
import {
  AlertCandidatesFileSchema, AlertsFileSchema, CommunityFileSchema, ContentFileSchema, EstimatorParamsSchema,
  ForecastLedgerEntrySchema, ManifestSchema, NationalFileSchema, OfficesFileSchema, PolicyFileSchema, QuarterlyFileSchema,
  ScorecardSchema, SharedTimelineSchema, formatIssues, parseCase, type Result,
} from '@caa/data-schemas';

type Parser = (json: unknown, today: string) => Result<unknown>;
const viaSchema = (s: { safeParse(v: unknown): { success: true; data: unknown } | { success: false; error: import('zod').ZodError } }): Parser =>
  (json) => {
    const r = s.safeParse(json);
    return r.success ? { ok: true, value: r.data } : { ok: false, issues: formatIssues(r.error) };
  };

/** Every schema under test, keyed by the fixture base name (`valid/<key>.json`). */
export const PARSERS: Record<string, Parser> = {
  manifest: viaSchema(ManifestSchema),
  national: viaSchema(NationalFileSchema),
  quarterly: viaSchema(QuarterlyFileSchema),
  offices: viaSchema(OfficesFileSchema),
  policy: viaSchema(PolicyFileSchema),
  alerts: viaSchema(AlertsFileSchema),
  content: viaSchema(ContentFileSchema),
  params: viaSchema(EstimatorParamsSchema),
  case: (json, today) => parseCase(json, { today }),
  'shared-timeline': viaSchema(SharedTimelineSchema),
  community: viaSchema(CommunityFileSchema),
  'forecast-ledger-entry': viaSchema(ForecastLedgerEntrySchema),
  scorecard: viaSchema(ScorecardSchema),
  'alert-candidates': viaSchema(AlertCandidatesFileSchema),
};

/** `valid/case.t15.json` → parser key `case`. */
export const parserKeyOf = (fixtureBase: string) => fixtureBase.split('.')[0]!;

const strip = (p: string) => p.replace(/^.*\/fixtures\//, '').replace(/\.json$/, '');
const load = (m: Record<string, unknown>) => Object.fromEntries(Object.entries(m).map(([k, v]) => [strip(k), v]));

/** `{ 'valid/national': json, … }` */
export const VALID: Record<string, unknown> = load(import.meta.glob('./fixtures/valid/*.json', { eager: true, import: 'default' }));
/** `{ 'invalid/national.gap-in-window': spec, … }` */
export const INVALID = load(import.meta.glob('./fixtures/invalid/*.json', { eager: true, import: 'default' })) as Record<string, InvalidSpec>;
/** `{ 'sample-handbuilt/national': json, … }` (G0). */
export const G0: Record<string, unknown> = load(import.meta.glob('./fixtures/sample-handbuilt/*.json', { eager: true, import: 'default' }));

export interface InvalidSpec { description: string; base: string; set: Record<string, unknown>; delete: string[]; today: string; expect: string }

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const seg = (s: string): string | number => (/^\d+$/.test(s) ? Number(s) : s);

/** Sets `a.b.0.c` on a deep clone, creating objects/arrays as needed. */
export function setPath(obj: unknown, path: string, value: unknown): void {
  const parts = path.split('.').map(seg);
  let cur = obj as Record<string | number, unknown>;
  parts.slice(0, -1).forEach((p, i) => {
    if (cur[p] === undefined || cur[p] === null) cur[p] = typeof parts[i + 1] === 'number' ? [] : {};
    cur = cur[p] as Record<string | number, unknown>;
  });
  cur[parts.at(-1)!] = value;
}

export function deletePath(obj: unknown, path: string): void {
  const parts = path.split('.').map(seg);
  let cur = obj as Record<string | number, unknown>;
  for (const p of parts.slice(0, -1)) cur = cur[p] as Record<string | number, unknown>;
  delete cur[parts.at(-1)!];
}

/** Materializes an invalid fixture from its base and patch. */
export function buildInvalid(spec: InvalidSpec): unknown {
  const base = VALID[spec.base.replace(/\.json$/, '')];
  if (base === undefined) throw new Error(`missing base ${spec.base}`);
  const v = clone(base);
  for (const [p, x] of Object.entries(spec.set)) setPath(v, p, x);
  for (const p of spec.delete) deletePath(v, p);
  return v;
}

export { clone };
