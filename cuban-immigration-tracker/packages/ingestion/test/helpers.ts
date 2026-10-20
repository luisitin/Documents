/**
 * Test scaffolding for @caa/ingestion: an in-memory "network" (a `fetch` replacement routing URLs to
 * fixture bytes), a fast HttpClient (no pacing / backoff), temp directories, and the frozen bundled
 * sample (app/src/data/sample = G1) as a ready-made "previous snapshot".
 */
import { cp, mkdtemp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HttpClient, type HttpClientOptions } from '../src/http';

export const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HERE, '..', '..', '..');
export const FIX = join(HERE, 'fixtures');
export const APP_SAMPLE = join(ROOT, 'app', 'src', 'data', 'sample');
export const DATA = join(ROOT, 'data');

export type Route = Uint8Array | string | { status: number; body?: Uint8Array | string; headers?: Record<string, string> } | (() => Response | Promise<Response>) | 'network_error';

/** A `fetch` that answers from `routes` (exact URL, else the first matching RegExp key), 404 otherwise. */
export function mockFetch(routes: Map<string | RegExp, Route>, calls: { url: string; init?: RequestInit }[] = []): typeof fetch {
  return (async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    calls.push({ url, init });
    let route: Route | undefined = routes.get(url);
    if (route === undefined) for (const [k, v] of routes) if (k instanceof RegExp && k.test(url)) { route = v; break; }
    if (route === undefined) return new Response('not found', { status: 404 });
    if (route === 'network_error') throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'ENOTFOUND' } });
    if (typeof route === 'function') return route();
    if (typeof route === 'string' || route instanceof Uint8Array) return new Response(route, { status: 200 });
    const nullBody = route.status === 204 || route.status === 304;
    return new Response(nullBody ? null : route.body ?? '', { status: route.status, headers: route.headers ?? {} });
  }) as typeof fetch;
}

export function fastClient(fetchImpl: typeof fetch, o: Partial<HttpClientOptions> = {}): HttpClient {
  return new HttpClient({ mode: 'refresh', fetchImpl, sleep: async () => {}, hostGapMs: 0, backoffMs: 0, ...o });
}

export async function tempDir(prefix = 'caa-ingest-'): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix));
}

export const fixture = async (rel: string) => new Uint8Array(await readFile(join(FIX, rel)));

/**
 * A data dir whose published files are the frozen bundled sample (G1) and whose `curated/` holds the
 * sample's own policy / alerts / content / historic medians (so WP9 edits never change test outcomes).
 */
export async function sampleDataDir(): Promise<string> {
  const dir = await tempDir();
  for (const f of await readdir(APP_SAMPLE)) if (f.endsWith('.json')) await cp(join(APP_SAMPLE, f), join(dir, f));
  const cur = join(dir, 'curated');
  await mkdir(join(cur, 'alerts'), { recursive: true });
  const read = async (f: string) => JSON.parse(await readFile(join(APP_SAMPLE, f), 'utf8'));
  await writeFile(join(cur, 'policy.json'), JSON.stringify(await read('policy.json')));
  await writeFile(join(cur, 'content.json'), JSON.stringify(await read('content.json')));
  await writeFile(join(cur, 'historic_medians.json'), JSON.stringify((await read('quarterly.json')).historicMedians));
  for (const a of (await read('alerts.json')).alerts) await writeFile(join(cur, 'alerts', `${a.id}.json`), JSON.stringify(a));
  return dir;
}

/** A SYNTHETIC monthly CSV built from the August 2026 file with the Cuban row replaced (tests only). */
export async function syntheticMonthCsv(month: string, year: number, cuban: { received: number; approved: number; denied: number; pending: number; over6: number; avg: number }): Promise<string> {
  const aug = new TextDecoder().decode(await fixture('mirror/monthly_august_2026.csv')).replace(/^﻿/, '');
  const fmt = (n: number) => `"${n.toLocaleString('en-US')}"`;
  return `SYNTHETIC TEST FIXTURE - not USCIS data,,,,,,,\r\n${aug
    .replace('For the Month of August 2026', `For the Month of ${month} ${year}`)
    .replace(/^I-485,Application to Register Permanent Residence or Adjust Status \(Cuban\),.*$/m,
      `I-485,Application to Register Permanent Residence or Adjust Status (Cuban),${fmt(cuban.received)},${fmt(cuban.approved)},${fmt(cuban.denied)},${fmt(cuban.pending)},${fmt(cuban.over6)},${cuban.avg}\r`)}`;
}

export async function readJson<T = unknown>(p: string): Promise<T> {
  return JSON.parse(await readFile(p, 'utf8')) as T;
}
