/**
 * Snapshot fetching and caching: the single fetch rule of 01-architecture.md §3 step 7 and
 * 07 WP6 "Rules", as pure functions over an injected `fetch`, clock and KV (the Jest fetch-rule
 * tests drive them with a mocked clock).
 *
 * Fetch rule:
 * - On cold start and on foreground, check `manifest.json` only if `caa:v1:refresh.lastAttemptAt`
 *   is ≥ 6 h old (or absent) AND `backoffUntil` has passed. The manual "Actualizar" bypasses the
 *   6 h limit but never the backoff. (The 6 h limit protects raw.githubusercontent.com's
 *   unauthenticated limits, 01 §10 R2; the web build reads files shipped next to the page, so it
 *   checks on every cold start, still honouring the backoff.)
 * - Send `If-None-Match` with the cached manifest's ETag (304 → keep the cache).
 * - Fetch only the files whose sha256 changed (the bundled sample and the cache count as copies).
 * - zod-validate every response and verify every file's sha256 against the manifest.
 * - On 429, back off exponentially and honour `Retry-After`.
 * - With no network, the caller keeps showing the cached data, or the bundled sample.
 * - An unknown `schemaVersion` or a `minAppVersion` newer than the app keeps the old data
 *   ("Actualice la app", 00 §5.1; 03 §7).
 *
 * The snapshot is stored only when the manifest and all 7 files validated, so the cache is always a
 * complete, consistent snapshot (02 §6 `caa:v1:data:<file>`).
 */
import {
  DATA_FILE_NAMES, ISODateTimeSchema, SCHEMA_VERSION, parseDataFile, parseManifest,
  type DataFileName, type ISODateTime, type Manifest,
} from '@caa/data-schemas';
import { z } from 'zod';
import { readJson, writeJson, type Kv, type KvKey } from '@/storage/kvCore';
import { sha256 } from './sha256';
import type { DataSnapshot } from './snapshot';

export const REFRESH_KEY = 'caa:v1:refresh' as const;
/** 01 §3 step 7: at most one automatic manifest check per 6 hours. */
export const MIN_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
/** 429 backoff: 15 min × 2^(n−1), capped at 24 h, never shorter than `Retry-After`. */
export const BACKOFF_BASE_MS = 15 * 60 * 1000;
export const BACKOFF_MAX_MS = 24 * 60 * 60 * 1000;

/** 02 §6 `caa:v1:refresh` (+ additive `lastSuccessAt`). */
export interface RefreshState {
  lastAttemptAt: ISODateTime;
  backoffUntil?: ISODateTime;
  consecutive429: number;
  lastSuccessAt?: ISODateTime;
}

const RefreshStateSchema = z.object({
  lastAttemptAt: ISODateTimeSchema,
  backoffUntil: ISODateTimeSchema.optional(),
  consecutive429: z.number().int().nonnegative(),
  lastSuccessAt: ISODateTimeSchema.optional(),
});

/** 02 §6 `caa:v1:data:<file>` value. */
export interface CachedFile<T> {
  etag?: string;
  sha256: string;
  fetchedAt: ISODateTime;
  body: T;
}

const CachedEnvelopeSchema = z.object({
  etag: z.string().optional(),
  sha256: z.string(),
  fetchedAt: ISODateTimeSchema,
  body: z.unknown(),
});

const dataKey = (n: DataFileName | 'manifest'): KvKey => `caa:v1:data:${n}`;

export const iso = (ms: number): ISODateTime => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');

export function readRefreshState(kv: Kv): RefreshState | null {
  return readJson(kv, REFRESH_KEY, (v) => {
    const r = RefreshStateSchema.safeParse(v);
    return r.success ? (r.data as RefreshState) : null;
  });
}

export function writeRefreshState(kv: Kv, s: RefreshState): void {
  writeJson(kv, REFRESH_KEY, s);
}

/**
 * The fetch rule's gate. `enforceInterval` is true for the native remote fetch and false for the
 * web build's shipped files; the backoff always applies.
 */
export function shouldCheck(state: RefreshState | null, nowMs: number, opts: { manual: boolean; enforceInterval: boolean }): boolean {
  if (state?.backoffUntil && nowMs < Date.parse(state.backoffUntil)) return false;
  if (opts.manual || !opts.enforceInterval || !state) return true;
  return nowMs - Date.parse(state.lastAttemptAt) >= MIN_CHECK_INTERVAL_MS;
}

/** `Retry-After` (seconds or HTTP date) → milliseconds from `nowMs`, or 0. */
export function retryAfterMs(header: string | null, nowMs: number): number {
  if (!header) return 0;
  const s = header.trim();
  if (/^\d+$/.test(s)) return Number(s) * 1000;
  const t = Date.parse(s);
  return Number.isFinite(t) ? Math.max(0, t - nowMs) : 0;
}

/** Backoff length after the n-th consecutive 429 (n ≥ 1). */
export function backoffMs(n: number, retryAfter: number): number {
  const exp = Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** Math.max(0, n - 1));
  return Math.min(BACKOFF_MAX_MS, Math.max(exp, retryAfter));
}

/** semver `a < b` for `x.y.z` strings (anything unparsable compares as 0.0.0). */
export function semverLess(a: string, b: string): boolean {
  const p = (v: string) => (/^\d+\.\d+\.\d+/.test(v) ? v.split('.').slice(0, 3).map((x) => parseInt(x, 10)) : [0, 0, 0]);
  const x = p(a);
  const y = p(b);
  for (let i = 0; i < 3; i++) {
    if ((x[i] as number) !== (y[i] as number)) return (x[i] as number) < (y[i] as number);
  }
  return false;
}

/** The cached snapshot, only when all 8 entries exist and validate (else null). */
export function readCachedSnapshot(kv: Kv): { snapshot: DataSnapshot; fetchedAt: ISODateTime; etag?: string } | null {
  const env = (n: DataFileName | 'manifest') =>
    readJson(kv, dataKey(n), (v) => {
      const r = CachedEnvelopeSchema.safeParse(v);
      return r.success ? (r.data as CachedFile<unknown>) : null;
    });
  const m = env('manifest');
  if (!m) return null;
  const pm = parseManifest(m.body);
  if (!pm.ok) {
    kv.remove(dataKey('manifest'));
    return null;
  }
  const out: Record<string, unknown> = { manifest: pm.value };
  for (const n of DATA_FILE_NAMES) {
    const e = env(n);
    if (!e) return null;
    // The 8 keys are written one by one (native persists asynchronously; a web quota error is
    // swallowed), so an interrupted write can leave a new manifest beside an old body. Such a mixed
    // copy must never be reused as if it matched the manifest (review round 1).
    if (e.sha256 !== pm.value.files[n].sha256) {
      kv.remove(dataKey(n));
      return null;
    }
    const r = parseDataFile(n, e.body);
    if (!r.ok) {
      kv.remove(dataKey(n));
      return null;
    }
    out[n] = r.value;
  }
  return { snapshot: out as unknown as DataSnapshot, fetchedAt: m.fetchedAt, etag: m.etag };
}

/** Stores a complete validated snapshot (all 8 entries). */
export function writeCachedSnapshot(kv: Kv, s: DataSnapshot, fetchedAt: ISODateTime, etag?: string): void {
  writeJson(kv, dataKey('manifest'), { ...(etag ? { etag } : {}), sha256: '', fetchedAt, body: s.manifest } satisfies CachedFile<Manifest>);
  for (const n of DATA_FILE_NAMES) {
    writeJson(kv, dataKey(n), { sha256: s.manifest.files[n].sha256, fetchedAt, body: s[n] } satisfies CachedFile<unknown>);
  }
}

/** Touches only `fetchedAt` of the cached manifest (a 304 means "checked, unchanged"). */
function touchCachedManifest(kv: Kv, fetchedAt: ISODateTime): void {
  const m = readJson(kv, dataKey('manifest'), (v) => {
    const r = CachedEnvelopeSchema.safeParse(v);
    return r.success ? (r.data as CachedFile<unknown>) : null;
  });
  if (m) writeJson(kv, dataKey('manifest'), { ...m, fetchedAt });
}

export type FetchLike = (url: string, init?: { headers?: Record<string, string> }) => Promise<{
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
}>;

export type RefreshOutcome =
  | { kind: 'skipped' }
  | { kind: 'not_modified'; fetchedAt: ISODateTime }
  | { kind: 'updated'; snapshot: DataSnapshot; fetchedAt: ISODateTime; fetchedFiles: DataFileName[]; base: string }
  | { kind: 'failed'; reason: 'network' | 'http' | 'invalid' | 'sha_mismatch' | 'rate_limited'; detail?: string }
  | { kind: 'incompatible'; reason: 'schema_version' | 'min_app_version' };

export interface RefreshOptions {
  kv: Kv;
  fetchImpl: FetchLike;
  nowMs: number;
  bases: string[];
  manual: boolean;
  enforceInterval: boolean;
  appVersion: string;
  /** Copies the files may be reused from when their sha256 matches (cache first, then sample). */
  copies: DataSnapshot[];
  /** ETag of the cached manifest, sent as `If-None-Match` when a complete cache exists. */
  etag?: string;
}

/** One manifest check + the changed files, following the fetch rule above. */
export async function refreshSnapshot(o: RefreshOptions): Promise<RefreshOutcome> {
  const prev = readRefreshState(o.kv);
  if (!shouldCheck(prev, o.nowMs, { manual: o.manual, enforceInterval: o.enforceInterval })) return { kind: 'skipped' };
  const now = iso(o.nowMs);
  const attempt: RefreshState = { ...(prev ?? { consecutive429: 0 }), lastAttemptAt: now };
  delete attempt.backoffUntil;
  writeRefreshState(o.kv, attempt);

  const fail = (reason: Extract<RefreshOutcome, { kind: 'failed' }>['reason'], detail?: string): RefreshOutcome => ({ kind: 'failed', reason, detail });

  // 1. The manifest, from the first base that answers.
  let base: string | null = null;
  let res: Awaited<ReturnType<FetchLike>> | null = null;
  let lastError: RefreshOutcome = fail('network');
  for (const b of o.bases) {
    try {
      const r = await o.fetchImpl(`${b}manifest.json`, o.etag ? { headers: { 'If-None-Match': o.etag } } : undefined);
      if (r.status === 429) {
        const n = attempt.consecutive429 + 1;
        const wait = backoffMs(n, retryAfterMs(r.headers.get('retry-after'), o.nowMs));
        writeRefreshState(o.kv, { ...attempt, consecutive429: n, backoffUntil: iso(o.nowMs + wait) });
        return fail('rate_limited', `429; backoff ${Math.round(wait / 60000)} min`);
      }
      if (r.status === 304 || r.ok) {
        base = b;
        res = r;
        break;
      }
      lastError = fail('http', `manifest HTTP ${r.status}`);
    } catch (e) {
      lastError = fail('network', String(e));
    }
  }
  if (!res || base === null) return lastError;
  writeRefreshState(o.kv, { ...attempt, consecutive429: 0 });

  if (res.status === 304) {
    touchCachedManifest(o.kv, now);
    writeRefreshState(o.kv, { ...attempt, consecutive429: 0, lastSuccessAt: now });
    return { kind: 'not_modified', fetchedAt: now };
  }

  let json: unknown;
  try {
    json = JSON.parse(await res.text());
  } catch (e) {
    return fail('invalid', `manifest: ${String(e)}`);
  }
  const version = (json as { schemaVersion?: unknown } | null)?.schemaVersion;
  if (version !== SCHEMA_VERSION) return { kind: 'incompatible', reason: 'schema_version' };
  const pm = parseManifest(json);
  if (!pm.ok) return fail('invalid', `manifest: ${pm.issues.slice(0, 3).join('; ')}`);
  const manifest = pm.value;
  if (semverLess(o.appVersion, manifest.minAppVersion)) return { kind: 'incompatible', reason: 'min_app_version' };
  const etag = res.headers.get('etag') ?? undefined;

  // 2. Only the files whose sha256 changed.
  const out: Record<string, unknown> = { manifest };
  const fetchedFiles: DataFileName[] = [];
  for (const n of DATA_FILE_NAMES) {
    const entry = manifest.files[n];
    const copy = o.copies.find((c) => c.manifest.files[n].sha256 === entry.sha256);
    if (copy) {
      out[n] = copy[n];
      continue;
    }
    let text: string;
    try {
      const r = await o.fetchImpl(`${base}${entry.path}`);
      if (!r.ok) return fail('http', `${n} HTTP ${r.status}`);
      text = await r.text();
    } catch (e) {
      return fail('network', `${n}: ${String(e)}`);
    }
    if (sha256(text) !== entry.sha256) return fail('sha_mismatch', n);
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch (e) {
      return fail('invalid', `${n}: ${String(e)}`);
    }
    const r = parseDataFile(n, body);
    if (!r.ok) return fail('invalid', `${n}: ${r.issues.slice(0, 3).join('; ')}`);
    out[n] = r.value;
    fetchedFiles.push(n);
  }

  const snapshot = out as unknown as DataSnapshot;
  writeCachedSnapshot(o.kv, snapshot, now, etag);
  writeRefreshState(o.kv, { lastAttemptAt: now, consecutive429: 0, lastSuccessAt: now });
  return { kind: 'updated', snapshot, fetchedAt: now, fetchedFiles, base };
}
