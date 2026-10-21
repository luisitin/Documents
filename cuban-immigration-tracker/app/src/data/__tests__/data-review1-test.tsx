/**
 * Regression tests for review round 1 of `app/src/data`:
 * 1. native cold start with an async-hydrating KV: a 'skipped' (or backoff) refresh must not
 *    overwrite the hydrated cached snapshot with the bundled sample;
 * 2. a half-written cache (new manifest beside an old file body) is not a valid copy: it is
 *    rejected on read and the stale file is fetched again.
 * The served files are the bundled sample (a labelled SAMPLE; 02 §2), optionally altered.
 */
import { Text } from 'react-native';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { DataProvider } from '@/data/DataProvider';
import { readCachedSnapshot, refreshSnapshot, type FetchLike } from '@/data/fetchers';
import { sha256 } from '@/data/sha256';
import { sampleSnapshot } from '@/data/snapshot';
import { useData } from '@/data/useData';
import { createKv, createMemoryKv, type Kv, type KvKey } from '@/storage/kvCore';

/* eslint-disable @typescript-eslint/no-require-imports */
const { readFileSync } = require('fs') as { readFileSync(p: string, enc?: string): string };
const { join } = require('path') as { join(...p: string[]): string };
/* eslint-enable @typescript-eslint/no-require-imports */
declare const __dirname: string;

const SAMPLE_DIR = join(__dirname, '..', 'sample');
const NAMES = ['national', 'quarterly', 'offices', 'policy', 'alerts', 'content', 'params'] as const;
const read = (n: string) => readFileSync(join(SAMPLE_DIR, `${n}.json`), 'utf8');
const T0 = Date.parse('2026-10-20T12:00:00Z');
const H = 60 * 60 * 1000;
const BASE = 'https://data.example.test/data/';
const KEYS: KvKey[] = ['caa:v1:data:manifest', ...NAMES.map((n) => `caa:v1:data:${n}` as KvKey), 'caa:v1:refresh'];

function liveManifest() {
  const m = JSON.parse(read('manifest'));
  delete m.origin;
  m.qa.notes = [];
  m.lastCheckedAt = '2026-10-21T06:17:04Z';
  return m;
}

/** A static server for `manifest` and the files in `files`; records every URL. */
function server(manifest: unknown, files: Record<string, string>) {
  const fetch = jest.fn(async (url: string) => {
    const name = url.slice(BASE.length).replace(/\.json$/, '');
    const body = name === 'manifest' ? JSON.stringify(manifest) : files[name];
    const get = (k: string) => (k.toLowerCase() === 'etag' && name === 'manifest' ? '"v1"' : null);
    if (body === undefined) return { ok: false, status: 404, headers: { get }, text: async () => '' };
    return { ok: true, status: 200, headers: { get }, text: async () => body };
  });
  return fetch as unknown as FetchLike & jest.Mock;
}

const allFiles = () => Object.fromEntries(NAMES.map((n) => [n, read(n)]));
const dump = (kv: Kv) => Object.fromEntries(KEYS.flatMap((k) => (kv.get(k) === null ? [] : [[k, kv.get(k) as string]])));

function Probe() {
  const d = useData();
  const line = `${d.status}|${String(d.refreshing)}`;
  return <Text testID="probe">{line}</Text>;
}
const probe = () => String(screen.getByTestId('probe').props.children);

describe('review round 1 regressions', () => {
  it('async-hydrating KV + skipped refresh keeps the cached snapshot (not the sample)', async () => {
    // A previous session cached a live snapshot and checked at T0.
    const seed = createMemoryKv();
    const r = await refreshSnapshot({
      kv: seed, fetchImpl: server(liveManifest(), allFiles()), nowMs: T0, bases: [BASE], manual: false,
      enforceInterval: true, appVersion: '0.1.0', copies: [sampleSnapshot()],
    });
    expect(r.kind).toBe('updated');
    const stored = dump(seed);

    // Relaunch 1 h later: the native backend hydrates asynchronously.
    const store = createKv({
      load: () => new Promise((res) => setTimeout(() => res(stored), 5)),
      write: () => undefined,
      erase: () => undefined,
    });
    const fetchImpl = jest.fn(async () => {
      throw new TypeError('should not be called');
    }) as unknown as FetchLike & jest.Mock;
    await render(
      <DataProvider store={store} fetchImpl={fetchImpl} now={() => T0 + H} bases={[BASE]} enforceInterval>
        <Probe />
      </DataProvider>,
    );
    await act(async () => {
      await store.ready;
      await new Promise((res) => setTimeout(res, 10));
    });
    expect(readCachedSnapshot(store)).not.toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
    await waitFor(() => expect(probe()).toBe('cached|false'));
  });

  it('a new manifest beside an old file body is rejected and the file is fetched again', async () => {
    // Cache v1 (the sample bytes).
    const kv = createMemoryKv();
    const base = { bases: [BASE], manual: true, enforceInterval: true, appVersion: '0.1.0' };
    const v1 = await refreshSnapshot({ ...base, kv, fetchImpl: server(liveManifest(), allFiles()), nowMs: T0, copies: [sampleSnapshot()] });
    expect(v1.kind).toBe('updated');
    const oldNational = kv.get('caa:v1:data:national');

    // v2 changes `national`; its cache write is interrupted after the manifest: the old body stays.
    const national2 = `${read('national')}\n`;
    const m2 = liveManifest();
    m2.files.national = { ...m2.files.national, sha256: sha256(national2), bytes: national2.length };
    const files2 = { ...allFiles(), national: national2 };
    const v2 = await refreshSnapshot({ ...base, kv, fetchImpl: server(m2, files2), nowMs: T0 + H, copies: [sampleSnapshot()] });
    expect(v2.kind).toBe('updated');
    kv.set('caa:v1:data:national', oldNational as string);

    // The mixed copy is not a valid cache…
    expect(readCachedSnapshot(kv)).toBeNull();
    expect(kv.get('caa:v1:data:national')).toBeNull();

    // …so the next refresh fetches `national` again instead of reusing the stale body.
    const fetchImpl = server(m2, files2);
    const v3 = await refreshSnapshot({ ...base, kv, fetchImpl, nowMs: T0 + 2 * H, copies: [sampleSnapshot()] });
    expect(v3.kind).toBe('updated');
    if (v3.kind === 'updated') expect(v3.fetchedFiles).toEqual(['national']);
    expect(fetchImpl.mock.calls.map((c) => c[0])).toEqual([`${BASE}manifest.json`, `${BASE}national.json`]);
    expect(readCachedSnapshot(kv)?.snapshot.manifest.files.national.sha256).toBe(sha256(national2));
  });
});
