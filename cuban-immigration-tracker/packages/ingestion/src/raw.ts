/**
 * Raw archive before parse (03-data-pipeline.md §1 principle 1; 02 §2 `raw/<sourceId>/<period>/<file>`):
 * every fetched USCIS file (public domain, 17 U.S.C. § 105, doc 04 §0) is written to
 * `data/raw/<sourceId>/<period>/<file>` with a `.meta.json` (URL, status, selected headers, sha256,
 * retrieval time, `via`). A file is (re)written ONLY when its sha256 is new, so an unchanged file keeps
 * its original `retrievedAt` and git sees no change. Parsers are pure functions of these bytes, so
 * every published number can be regenerated from git.
 *
 * The jzebedee SQLite is NEVER archived: its repository has no LICENSE (doc 13 §1.6); only derived
 * rows plus attribution are kept (03 P4).
 */
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { ISODateTime, SourceId, SourceRef } from '@caa/data-schemas';
import { serializeJson, sha256Hex } from './util';

export interface RawMeta {
  sourceId: SourceId;
  period: string;
  file: string;
  url: string;
  via: SourceRef['via'];
  status: number;
  sha256: string;
  bytes: number;
  retrievedAt: ISODateTime;
  headers: Record<string, string>;
}

/** Response headers worth keeping (no cookies, nothing user-specific). */
const KEEP_HEADERS = ['content-type', 'content-length', 'etag', 'last-modified', 'date', 'cf-mitigated'];

export function pickHeaders(h: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of KEEP_HEADERS) if (h[k] !== undefined) out[k] = h[k]!;
  return out;
}

/** The file name part of a URL, percent-decoded (`appropriation_requirement_august%202024.csv` → with a space). */
export function fileNameOf(url: string): string {
  const path = url.split(/[?#]/)[0]!;
  return decodeURIComponent(path.slice(path.lastIndexOf('/') + 1));
}

export function rawPaths(outDir: string, sourceId: SourceId, period: string, file: string): { file: string; meta: string } {
  const p = join(outDir, 'raw', sourceId, period, file);
  return { file: p, meta: `${p}.meta.json` };
}

async function writeAtomic(path: string, data: Uint8Array | string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.tmp-${process.pid}`;
  await writeFile(tmp, data);
  await rename(tmp, path);
}

/** The archived meta of one raw file, or null. */
export async function readRawMeta(outDir: string, sourceId: SourceId, period: string, file: string): Promise<RawMeta | null> {
  try {
    return JSON.parse(await readFile(rawPaths(outDir, sourceId, period, file).meta, 'utf8')) as RawMeta;
  } catch {
    return null;
  }
}

/** All archived metas of one source and period (newest retrieval first). */
export async function listRawMetas(outDir: string, sourceId: SourceId, period: string): Promise<RawMeta[]> {
  const dir = join(outDir, 'raw', sourceId, period);
  let names: string[] = [];
  try { names = await readdir(dir); } catch { return []; }
  const metas: RawMeta[] = [];
  for (const n of names.filter((x) => x.endsWith('.meta.json'))) {
    try { metas.push(JSON.parse(await readFile(join(dir, n), 'utf8')) as RawMeta); } catch { /* ignore a broken meta */ }
  }
  return metas.sort((a, b) => (a.retrievedAt < b.retrievedAt ? 1 : -1));
}

export async function readRawBytes(outDir: string, meta: RawMeta): Promise<Uint8Array | null> {
  try { return new Uint8Array(await readFile(rawPaths(outDir, meta.sourceId, meta.period, meta.file).file)); } catch { return null; }
}

/**
 * Plans the archive entry for fetched bytes. When the same sha is already archived, the existing meta
 * (with its ORIGINAL retrievedAt) is returned and nothing needs writing (03 §1: committed only when new).
 */
export async function planRaw(
  outDir: string,
  a: { sourceId: SourceId; period: string; url: string; via: SourceRef['via']; status: number; headers: Record<string, string>; bytes: Uint8Array; retrievedAt: ISODateTime },
): Promise<{ meta: RawMeta; isNew: boolean; bytes: Uint8Array }> {
  const file = fileNameOf(a.url);
  const sha = sha256Hex(a.bytes);
  const prev = await readRawMeta(outDir, a.sourceId, a.period, file);
  if (prev && prev.sha256 === sha) return { meta: prev, isNew: false, bytes: a.bytes };
  const meta: RawMeta = {
    sourceId: a.sourceId, period: a.period, file, url: a.url, via: a.via, status: a.status, sha256: sha,
    bytes: a.bytes.byteLength, retrievedAt: a.retrievedAt, headers: pickHeaders(a.headers),
  };
  return { meta, isNew: true, bytes: a.bytes };
}

/** Writes a planned raw entry (bytes first, then meta). */
export async function writeRaw(outDir: string, entry: { meta: RawMeta; bytes: Uint8Array }): Promise<string> {
  const p = rawPaths(outDir, entry.meta.sourceId, entry.meta.period, entry.meta.file);
  await writeAtomic(p.file, entry.bytes);
  await writeAtomic(p.meta, serializeJson(entry.meta));
  return p.file;
}
