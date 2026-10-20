/**
 * Publishing (03-data-pipeline.md §5, §7): the 7 v1 files plus `manifest.json`, written with the
 * canonical serializer (stable key order, 2-space indent, trailing newline) so sha256 values are
 * deterministic; the manifest records each file's sha256 and byte length (02 §2.1). Writes are atomic
 * (tmp + rename). Also: reading the previously published snapshot, and the side files
 * (`candidates/alert-candidates.json`, `quarantine/<runId>/`).
 */
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  AlertCandidatesFileSchema, DATA_FILE_NAMES, ManifestSchema, SCHEMA_VERSION, parseDataFile,
  type AlertCandidate, type DataFileMap, type DataFileName, type FiscalQuarter, type ISODate, type ISODateTime, type Localized, type Manifest, type SourceStatus, type YearMonth,
} from '@caa/data-schemas';
import { MIN_APP_VERSION, QUARANTINE_KEEP_DAYS } from './constants';
import { serializeJson, sha256Hex } from './util';

export type PublishedFiles = { [N in DataFileName]: DataFileMap[N] };
export type PreviousSnapshot = Partial<PublishedFiles> & { manifest?: Manifest; candidates?: AlertCandidate[] };

export async function writeAtomic(path: string, data: string | Uint8Array): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.tmp-${process.pid}`;
  await writeFile(tmp, data);
  await rename(tmp, path);
}

async function readJson(path: string): Promise<unknown> {
  try { return JSON.parse(await readFile(path, 'utf8')); } catch { return undefined; }
}

/** The previously published snapshot in `dir` (each file parsed with its v1 schema; invalid → absent). */
export async function loadPublished(dir: string): Promise<PreviousSnapshot> {
  const out: PreviousSnapshot = {};
  const m = ManifestSchema.safeParse(await readJson(join(dir, 'manifest.json')));
  if (m.success) out.manifest = m.data;
  for (const n of DATA_FILE_NAMES) {
    const json = await readJson(join(dir, `${n}.json`));
    if (json === undefined) continue;
    const r = parseDataFile(n, json);
    if (r.ok) (out as Record<string, unknown>)[n] = r.value;
  }
  const c = AlertCandidatesFileSchema.safeParse(await readJson(join(dir, 'candidates', 'alert-candidates.json')));
  if (c.success) out.candidates = c.data;
  return out;
}

/** Canonical text + sha256 + byte length of each file. */
export function serializeFiles(files: PublishedFiles): Record<DataFileName, { text: string; sha256: string; bytes: number }> {
  const out = {} as Record<DataFileName, { text: string; sha256: string; bytes: number }>;
  for (const n of DATA_FILE_NAMES) {
    const text = serializeJson(files[n]);
    out[n] = { text, sha256: sha256Hex(text), bytes: Buffer.byteLength(text) };
  }
  return out;
}

export interface ManifestInput {
  dataChangedAt: ISODateTime;
  lastCheckedAt: ISODateTime;
  generatedBy: { runId: string; ref: string; sha: string };
  latestOfficialMonth: YearMonth;
  latestOfficialQuarter: FiscalQuarter;
  latestProcessingTimesPublication: ISODate | null;
  serialized: Record<DataFileName, { sha256: string; bytes: number }>;
  sources: SourceStatus[];
  qa: { status: 'ok' | 'degraded' | 'quarantined'; lastGoodRunId: string; notes: Localized[] };
  canary: Manifest['canary'];
}

/** 02 §2.1 manifest (pipeline origin). */
export function buildManifest(i: ManifestInput): Manifest {
  const files = {} as Manifest['files'];
  for (const n of DATA_FILE_NAMES) (files as Record<string, unknown>)[n] = { path: `${n}.json`, sha256: i.serialized[n].sha256, bytes: i.serialized[n].bytes };
  return {
    schemaVersion: SCHEMA_VERSION,
    minAppVersion: MIN_APP_VERSION,
    dataChangedAt: i.dataChangedAt,
    lastCheckedAt: i.lastCheckedAt,
    generatedBy: i.generatedBy,
    latestOfficialMonth: i.latestOfficialMonth,
    latestOfficialQuarter: i.latestOfficialQuarter,
    latestProcessingTimesPublication: i.latestProcessingTimesPublication,
    files,
    sources: i.sources,
    qa: i.qa,
    canary: i.canary,
    origin: 'pipeline',
  };
}

/** 07 WP5 `publish`: writes the 7 files, then the manifest last (readers see a consistent set). */
export async function publish(dir: string, serialized: Record<DataFileName, { text: string }>, manifest: Manifest): Promise<string[]> {
  const written: string[] = [];
  for (const n of DATA_FILE_NAMES) {
    const p = join(dir, `${n}.json`);
    await writeAtomic(p, serialized[n].text);
    written.push(p);
  }
  const mp = join(dir, 'manifest.json');
  await writeAtomic(mp, serializeJson(manifest));
  written.push(mp);
  return written;
}

/** Candidate merge: keep the first sighting of each id, newest first, at most `cap`. */
export function mergeCandidates(prev: AlertCandidate[], found: AlertCandidate[], cap = 300): AlertCandidate[] {
  const byId = new Map<string, AlertCandidate>();
  for (const c of prev) byId.set(c.id, c);
  for (const c of found) if (!byId.has(c.id)) byId.set(c.id, c);
  return [...byId.values()].sort((a, b) => (a.foundAt < b.foundAt ? 1 : a.foundAt > b.foundAt ? -1 : a.id < b.id ? -1 : 1)).slice(0, cap);
}

/** Quarantine (03 §4 "On fail" step 1): the failed attempt's raw bytes plus `qa-report.json`. */
export async function writeQuarantine(dir: string, runId: string, report: unknown, attempts: { file: string; bytes: Uint8Array }[]): Promise<string> {
  const q = join(dir, 'quarantine', runId);
  for (const a of attempts) await writeAtomic(join(q, a.file), a.bytes);
  await writeAtomic(join(q, 'qa-report.json'), serializeJson(report));
  return q;
}

/** Removes quarantine runs older than 30 days (03 §4). Returns the removed run ids. */
export async function pruneQuarantine(dir: string, now: Date, keepDays = QUARANTINE_KEEP_DAYS): Promise<string[]> {
  const root = join(dir, 'quarantine');
  let names: string[] = [];
  try { names = await readdir(root); } catch { return []; }
  const removed: string[] = [];
  for (const n of names) {
    const p = join(root, n);
    const report = (await readJson(join(p, 'qa-report.json'))) as { at?: string } | undefined;
    const at = report?.at ? Date.parse(report.at) : (await stat(p)).mtimeMs;
    if (now.getTime() - at > keepDays * 86_400_000) {
      await rm(p, { recursive: true, force: true });
      removed.push(n);
    }
  }
  return removed;
}
