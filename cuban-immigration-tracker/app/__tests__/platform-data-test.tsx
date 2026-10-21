/**
 * 07 WP6 acceptance (data layer):
 * - data transitions sample → live → cached; `published` on web when `artifactBuiltAt` is set;
 *   a schema-mismatch banner keeps the old data;
 * - fetch-rule tests with a mocked clock: second foreground within 6 h → no request; after 6 h →
 *   one conditional GET; during `backoffUntil` → no request even on "Actualizar";
 * - every response is zod-validated and sha256-verified; only changed files are fetched.
 * The served files are the bundled sample (a labelled SAMPLE; 02 §2), optionally altered.
 */
// Node built-ins through require: the app tsconfig has no @types/node (tests run in Node anyway).
/* eslint-disable @typescript-eslint/no-require-imports */
const { createHash } = require('crypto') as { createHash(alg: string): { update(d: unknown, enc?: string): { digest(f: 'hex'): string } } };
const { readFileSync } = require('fs') as { readFileSync(p: string, enc?: string): string };
const { join } = require('path') as { join(...p: string[]): string };
/* eslint-enable @typescript-eslint/no-require-imports */
declare const __dirname: string;
import { Text } from 'react-native';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { DataProvider } from '@/data/DataProvider';
import { MIN_CHECK_INTERVAL_MS, readRefreshState, refreshSnapshot, shouldCheck, type FetchLike } from '@/data/fetchers';
import { sha256 } from '@/data/sha256';
import { parseSnapshot, sampleSnapshot } from '@/data/snapshot';
import { useData } from '@/data/useData';
import { createMemoryKv, type Kv } from '@/storage/kvCore';

const SAMPLE_DIR = join(__dirname, '..', 'src', 'data', 'sample');
const NAMES = ['national', 'quarterly', 'offices', 'policy', 'alerts', 'content', 'params'] as const;
const read = (n: string) => readFileSync(join(SAMPLE_DIR, `${n}.json`), 'utf8');
const T0 = Date.parse('2026-10-20T12:00:00Z');
const H = 60 * 60 * 1000;
const BASE = 'https://data.example.test/data/';

/** A "live" manifest: the sample manifest without the sample origin, checked later. */
function liveManifest(over: Record<string, unknown> = {}) {
  const m = JSON.parse(read('manifest'));
  delete m.origin;
  m.qa.notes = [];
  m.lastCheckedAt = '2026-10-21T06:17:04Z';
  return { ...m, ...over };
}

interface Server {
  fetch: FetchLike & jest.Mock;
  files: Record<string, string>;
  manifest: string;
  status: number;
  headers: Record<string, string>;
  etag: string;
}

function server(manifest: unknown = liveManifest()): Server {
  const s: Server = {
    files: Object.fromEntries(NAMES.map((n) => [n, read(n)])),
    manifest: JSON.stringify(manifest),
    status: 200,
    headers: {},
    etag: '"v1"',
    fetch: jest.fn() as unknown as FetchLike & jest.Mock,
  };
  s.fetch.mockImplementation(async (url: string, init?: { headers?: Record<string, string> }) => {
    const name = url.slice(BASE.length).replace(/\.json$/, '');
    const hdr = (k: string) => s.headers[k.toLowerCase()] ?? null;
    if (name === 'manifest') {
      if (s.status !== 200) return { ok: false, status: s.status, headers: { get: hdr }, text: async () => '' };
      if (init?.headers?.['If-None-Match'] === s.etag) return { ok: false, status: 304, headers: { get: hdr }, text: async () => '' };
      return { ok: true, status: 200, headers: { get: (k: string) => (k.toLowerCase() === 'etag' ? s.etag : hdr(k)) }, text: async () => s.manifest };
    }
    const body = s.files[name];
    if (body === undefined) return { ok: false, status: 404, headers: { get: hdr }, text: async () => '' };
    return { ok: true, status: 200, headers: { get: hdr }, text: async () => body };
  });
  return s;
}

const opts = (kv: Kv, s: Server, nowMs: number, manual = false) => ({
  kv, fetchImpl: s.fetch, nowMs, bases: [BASE], manual, enforceInterval: true, appVersion: '0.1.0',
  copies: [sampleSnapshot()],
});

describe('bundled sample', () => {
  it('validates with the shared schemas and is labelled as a sample', () => {
    const raw = Object.fromEntries(['manifest', ...NAMES].map((n) => [n, JSON.parse(read(n))]));
    const r = parseSnapshot(raw as never);
    expect(r.ok).toBe(true);
    expect(sampleSnapshot().manifest.origin).toBe('bundled_sample');
    expect(sampleSnapshot().manifest.latestOfficialMonth).toBe('2026-08');
  });

  it('declares the sha256 of its own bytes (so sample files are reused instead of re-fetched)', () => {
    for (const n of NAMES) {
      const hex = createHash('sha256').update(readFileSync(join(SAMPLE_DIR, `${n}.json`))).digest('hex');
      expect(sha256(read(n))).toBe(hex);
      expect(sampleSnapshot().manifest.files[n].sha256).toBe(hex);
    }
  });

  it('sha256 matches node:crypto on multi-byte text', () => {
    for (const t of ['', 'abc', 'Más información — ñ, 9 %', '😀 emoji', 'x'.repeat(1000)]) {
      expect(sha256(t)).toBe(createHash('sha256').update(t, 'utf8').digest('hex'));
    }
  });
});

describe('fetch rule (mocked clock)', () => {
  it('gates on 6 h and on the backoff; manual bypasses only the 6 h limit', () => {
    const st = { lastAttemptAt: new Date(T0).toISOString(), consecutive429: 0 };
    expect(shouldCheck(null, T0, { manual: false, enforceInterval: true })).toBe(true);
    expect(shouldCheck(st, T0 + H, { manual: false, enforceInterval: true })).toBe(false);
    expect(shouldCheck(st, T0 + MIN_CHECK_INTERVAL_MS, { manual: false, enforceInterval: true })).toBe(true);
    expect(shouldCheck(st, T0 + H, { manual: true, enforceInterval: true })).toBe(true);
    const back = { ...st, backoffUntil: new Date(T0 + 2 * H).toISOString() };
    expect(shouldCheck(back, T0 + H, { manual: true, enforceInterval: true })).toBe(false);
    expect(shouldCheck(back, T0 + H, { manual: false, enforceInterval: false })).toBe(false);
  });

  it('cold start → one manifest GET (files reused by sha); second foreground within 6 h → no request; after 6 h → one conditional GET', async () => {
    const kv = createMemoryKv();
    const s = server();
    const r1 = await refreshSnapshot(opts(kv, s, T0));
    expect(r1.kind).toBe('updated');
    expect(s.fetch).toHaveBeenCalledTimes(1);
    if (r1.kind === 'updated') expect(r1.fetchedFiles).toEqual([]);

    const r2 = await refreshSnapshot({ ...opts(kv, s, T0 + 2 * H), etag: '"v1"' });
    expect(r2.kind).toBe('skipped');
    expect(s.fetch).toHaveBeenCalledTimes(1);

    const r3 = await refreshSnapshot({ ...opts(kv, s, T0 + 6 * H), etag: '"v1"' });
    expect(r3.kind).toBe('not_modified');
    expect(s.fetch).toHaveBeenCalledTimes(2);
    expect(s.fetch.mock.calls[1][1]).toEqual({ headers: { 'If-None-Match': '"v1"' } });
  });

  it('429 → exponential backoff honouring Retry-After; no request during backoffUntil, even on "Actualizar"', async () => {
    const kv = createMemoryKv();
    const s = server();
    s.status = 429;
    s.headers['retry-after'] = '7200';
    const r = await refreshSnapshot(opts(kv, s, T0));
    expect(r).toMatchObject({ kind: 'failed', reason: 'rate_limited' });
    const st = readRefreshState(kv);
    expect(st?.consecutive429).toBe(1);
    expect(Date.parse(st?.backoffUntil as string)).toBe(T0 + 2 * H); // Retry-After (2 h) > 15 min
    const manual = await refreshSnapshot(opts(kv, s, T0 + H, true));
    expect(manual.kind).toBe('skipped');
    expect(s.fetch).toHaveBeenCalledTimes(1);
    s.status = 200;
    const after = await refreshSnapshot(opts(kv, s, T0 + 2 * H + 1, true));
    expect(after.kind).toBe('updated');
    expect(readRefreshState(kv)?.consecutive429).toBe(0);
  });

  it('fetches only the files whose sha256 changed, and verifies the sha', async () => {
    const kv = createMemoryKv();
    const params = `${read('params')}\n`;
    const m = liveManifest();
    m.files.params = { ...m.files.params, sha256: sha256(params), bytes: params.length };
    const s = server(m);
    s.files.params = params;
    const r = await refreshSnapshot(opts(kv, s, T0));
    expect(r.kind).toBe('updated');
    if (r.kind === 'updated') expect(r.fetchedFiles).toEqual(['params']);
    expect(s.fetch.mock.calls.map((c) => c[0])).toEqual([`${BASE}manifest.json`, `${BASE}params.json`]);

    const kv2 = createMemoryKv();
    s.files.params = `${read('params')}\n\n`; // bytes no longer match the manifest
    const bad = await refreshSnapshot(opts(kv2, s, T0));
    expect(bad).toMatchObject({ kind: 'failed', reason: 'sha_mismatch' });
    expect(kv2.get('caa:v1:data:manifest')).toBeNull(); // nothing partial is cached
  });

  it('rejects an invalid manifest and an incompatible one (unknown schemaVersion / minAppVersion)', async () => {
    const bad = await refreshSnapshot(opts(createMemoryKv(), server(liveManifest({ latestOfficialMonth: '2026-13' })), T0));
    expect(bad).toMatchObject({ kind: 'failed', reason: 'invalid' });
    const v2 = await refreshSnapshot(opts(createMemoryKv(), server(liveManifest({ schemaVersion: 2 })), T0));
    expect(v2).toEqual({ kind: 'incompatible', reason: 'schema_version' });
    const old = await refreshSnapshot(opts(createMemoryKv(), server(liveManifest({ minAppVersion: '9.0.0' })), T0));
    expect(old).toEqual({ kind: 'incompatible', reason: 'min_app_version' });
  });

  it('a network failure is reported, the attempt is recorded, and the next base is tried', async () => {
    const kv = createMemoryKv();
    const down = jest.fn(async () => { throw new TypeError('Network request failed'); });
    const r = await refreshSnapshot({ ...opts(kv, server(), T0), fetchImpl: down as unknown as FetchLike });
    expect(r).toMatchObject({ kind: 'failed', reason: 'network' });
    expect(readRefreshState(kv)?.lastAttemptAt).toBe('2026-10-20T12:00:00Z');

    const s = server();
    const both: FetchLike = async (url, init) => (url.startsWith('https://down.test/') ? Promise.reject(new TypeError('x')) : s.fetch(url, init));
    const r2 = await refreshSnapshot({ ...opts(createMemoryKv(), s, T0), fetchImpl: both, bases: ['https://down.test/', BASE] });
    expect(r2.kind).toBe('updated');
  });
});

function Probe() {
  const d = useData();
  const line = `${d.status}|${d.asOf.latestOfficialMonth}|${d.notice?.kind ?? 'none'}|${d.guards.map((g) => g.id).join(',')}`;
  return <Text testID="probe">{line}</Text>;
}

async function mount(props: { store: Kv; fetchImpl: FetchLike; now: number }) {
  await render(
    <DataProvider store={props.store} fetchImpl={props.fetchImpl} now={() => props.now} bases={[BASE]} enforceInterval>
      <Probe />
    </DataProvider>,
  );
  await waitFor(() => expect(screen.getByTestId('probe').props.children).not.toMatch(/^$/));
  // let the cold-start refresh settle
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

const probe = () => String(screen.getByTestId('probe').props.children);
const offline: FetchLike = async () => {
  throw new TypeError('Network request failed');
};

describe('<DataProvider> transitions', () => {
  it('sample → live → cached', async () => {
    const store = createMemoryKv();
    await mount({ store, fetchImpl: offline, now: T0 });
    await waitFor(() => expect(probe()).toMatch(/^sample\|2026-08\|none\|.*sample_data/));
    await screen.unmount();

    await mount({ store, fetchImpl: server().fetch, now: T0 + 7 * H });
    await waitFor(() => expect(probe()).toMatch(/^live\|2026-08\|none/));
    expect(probe()).not.toMatch(/sample_data/);
    await screen.unmount();

    await mount({ store, fetchImpl: offline, now: T0 + 14 * H });
    await waitFor(() => expect(probe()).toMatch(/^cached\|2026-08\|update_failed/));
  });

  it('`published` when the shipped manifest carries artifactBuiltAt (web artifact)', async () => {
    const s = server(liveManifest({ artifactBuiltAt: '2026-10-21T08:00:00Z' }));
    await mount({ store: createMemoryKv(), fetchImpl: s.fetch, now: T0 + 20 * H });
    await waitFor(() => expect(probe()).toMatch(/^published\|2026-08\|none/));
  });

  it('a schema mismatch shows the "update the app" notice and keeps the old data', async () => {
    const store = createMemoryKv();
    await mount({ store, fetchImpl: server().fetch, now: T0 });
    await waitFor(() => expect(probe()).toMatch(/^live\|2026-08/));
    await screen.unmount();
    const next = server(liveManifest({ schemaVersion: 2, latestOfficialMonth: '2026-09' }));
    next.etag = '"v2"';
    await mount({ store, fetchImpl: next.fetch, now: T0 + 7 * H });
    await waitFor(() => expect(probe()).toMatch(/^cached\|2026-08\|app_too_old/));
  });

  it('"Actualizar" bypasses the 6 h limit but not the backoff', async () => {
    const store = createMemoryKv();
    const s = server();
    let ctx: ReturnType<typeof useData> | null = null;
    function Grab() {
      ctx = useData();
      return null;
    }
    await render(
      <DataProvider store={store} fetchImpl={s.fetch} now={() => T0} bases={[BASE]} enforceInterval>
        <Grab />
      </DataProvider>,
    );
    await waitFor(() => expect(s.fetch).toHaveBeenCalledTimes(1));
    await act(async () => {
      await (ctx as unknown as ReturnType<typeof useData>).refresh();
    });
    expect(s.fetch).toHaveBeenCalledTimes(2);
    s.status = 429;
    await act(async () => {
      await (ctx as unknown as ReturnType<typeof useData>).refresh();
    });
    expect(s.fetch).toHaveBeenCalledTimes(3);
    await act(async () => {
      await (ctx as unknown as ReturnType<typeof useData>).refresh();
    });
    expect(s.fetch).toHaveBeenCalledTimes(3); // in backoff
  });
});
