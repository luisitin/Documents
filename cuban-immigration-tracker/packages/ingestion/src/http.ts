/**
 * The common HTTP policy (03-data-pipeline.md §2.1; doc 13 §12.3; key facts §8), built on Node's
 * built-in `fetch` (undici):
 *
 * - Government hosts get the browser `User-Agent`, `Accept-Language: en-US,en;q=0.9` and a
 *   `Referer` set to the host's landing page; `Accept` is set per endpoint.
 * - 30 s timeout. Refresh mode: 1 retry after a 2 s backoff (network errors, 5xx, 429). Probe mode:
 *   0 retries, because the first response is what gets classified and Cloudflare must not be hammered.
 * - At most one request at a time per host, with a gap of at least 1 s.
 * - `blocked_drupal_antibot` is retried once with a different UA (both modes).
 * - Conditional requests: `If-None-Match` / `If-Modified-Since` when an ETag / Last-Modified is known.
 * - Refresh mode only: a per-host circuit breaker. After a host gives `network_error` (DNS, proxy
 *   refusal, timeout), later requests to it in the same run return at once, so a blocked host costs
 *   one timeout instead of one per file.
 *
 * Every exchange is recorded in `client.exchanges` (no bodies, no secrets) for the run log.
 */
import { classify, type Classification } from './classify';
import {
  ACCEPT_LANGUAGE, ALT_BROWSER_UA, BROWSER_UA, GOVERNMENT_HOSTS, HOST_GAP_MS, REFRESH_RETRIES, RETRY_BACKOFF_MS, TIMEOUT_MS, TOOL_UA,
} from './constants';

export type FetchMode = 'refresh' | 'probe';

export interface FetchRequest {
  url: string;
  method?: 'GET' | 'HEAD' | 'POST';
  /** `Accept` for this endpoint (03 §2.1 "Accept set per endpoint"). */
  accept?: string;
  headers?: Record<string, string>;
  body?: string;
  /** Conditional request validators from the last successful fetch. */
  etag?: string | null;
  lastModified?: string | null;
  /** A constructed file name: a 404 means `not_yet`. */
  predicted?: boolean;
  /** Bytes kept at most (default 64 MB); longer bodies are an `http_error`. */
  maxBytes?: number;
}

export interface FetchOutcome {
  url: string;
  method: 'GET' | 'HEAD' | 'POST';
  status: number | null;
  classification: Classification;
  /** Response headers, lower-case names. */
  headers: Record<string, string>;
  body: Uint8Array | null;
  ms: number;
  attempts: number;
  error?: string;
}

/** What is logged per exchange (no bodies, no request headers, so no tokens). */
export type ExchangeRecord = Omit<FetchOutcome, 'body' | 'headers'> & { contentType?: string; bytes?: number };

export interface HttpClientOptions {
  mode: FetchMode;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  timeoutMs?: number;
  retries?: number;
  backoffMs?: number;
  hostGapMs?: number;
  /** Default: on in refresh mode, off in probe mode. */
  breaker?: boolean;
}

const realSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function hostOf(url: string): string {
  const m = /^https?:\/\/([^/:?#]+)/i.exec(url);
  return m ? m[1]!.toLowerCase() : '';
}

/** True when the request must look like a browser (03 §2.1). */
export function isGovernmentHost(host: string): boolean {
  return host in GOVERNMENT_HOSTS || /(^|\.)(uscis|dhs|cbp|census|federalregister)\.gov$/.test(host);
}

/** URL with secret-looking query values replaced (logs and reports never carry keys or tokens). */
export function redactUrl(url: string): string {
  return url.replace(/([?&](?:key|api_key|apikey|token|access_token|client_secret|client_id)=)[^&#]*/gi, '$1REDACTED');
}

export class HttpClient {
  readonly mode: FetchMode;
  readonly exchanges: ExchangeRecord[] = [];
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly now: () => number;
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly backoffMs: number;
  private readonly hostGapMs: number;
  private readonly breaker: boolean;
  private readonly tails = new Map<string, Promise<void>>();
  private readonly lastAt = new Map<string, number>();
  private readonly openHosts = new Map<string, string>();

  constructor(o: HttpClientOptions) {
    this.mode = o.mode;
    this.fetchImpl = o.fetchImpl ?? ((...a: Parameters<typeof fetch>) => fetch(...a));
    this.sleep = o.sleep ?? realSleep;
    this.now = o.now ?? (() => Date.now());
    this.timeoutMs = o.timeoutMs ?? TIMEOUT_MS;
    this.retries = o.retries ?? (o.mode === 'refresh' ? REFRESH_RETRIES : 0);
    this.backoffMs = o.backoffMs ?? RETRY_BACKOFF_MS;
    this.hostGapMs = o.hostGapMs ?? HOST_GAP_MS;
    this.breaker = o.breaker ?? o.mode === 'refresh';
  }

  /** One request at a time per host, ≥ hostGapMs between the end of one and the start of the next. */
  private async slot<T>(host: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.tails.get(host) ?? Promise.resolve();
    let release!: () => void;
    const mine = new Promise<void>((r) => { release = r; });
    this.tails.set(host, prev.then(() => mine));
    await prev;
    try {
      const last = this.lastAt.get(host);
      if (last !== undefined) {
        const wait = last + this.hostGapMs - this.now();
        if (wait > 0) await this.sleep(wait);
      }
      return await fn();
    } finally {
      this.lastAt.set(host, this.now());
      release();
    }
  }

  private headersFor(req: FetchRequest, host: string, ua?: string): Record<string, string> {
    const gov = isGovernmentHost(host);
    const h: Record<string, string> = {
      'user-agent': ua ?? (gov ? BROWSER_UA : TOOL_UA),
      accept: req.accept ?? '*/*',
    };
    if (gov) {
      h['accept-language'] = ACCEPT_LANGUAGE;
      h.referer = GOVERNMENT_HOSTS[host] ?? `https://${host}/`;
    }
    if (req.etag) h['if-none-match'] = req.etag;
    if (req.lastModified) h['if-modified-since'] = req.lastModified;
    for (const [k, v] of Object.entries(req.headers ?? {})) h[k.toLowerCase()] = v;
    return h;
  }

  private async once(req: FetchRequest, host: string, ua?: string): Promise<Omit<FetchOutcome, 'attempts'>> {
    const method = req.method ?? 'GET';
    const t0 = this.now();
    try {
      const res = await this.fetchImpl(req.url, {
        method, headers: this.headersFor(req, host, ua), body: req.body, redirect: 'follow', signal: AbortSignal.timeout(this.timeoutMs),
      });
      const headers: Record<string, string> = {};
      res.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
      const setCookies = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
      if (setCookies.length) headers['set-cookie'] = setCookies.join('\n');
      let body: Uint8Array | null = null;
      if (method !== 'HEAD' && res.status !== 304) {
        const buf = new Uint8Array(await res.arrayBuffer());
        if (buf.byteLength > (req.maxBytes ?? 64 * 1024 * 1024)) {
          return { url: req.url, method, status: res.status, classification: 'http_error', headers, body: null, ms: this.now() - t0, error: `body larger than ${req.maxBytes ?? 64 * 1024 * 1024} bytes` };
        }
        body = buf;
      }
      const bodyText = body && (res.status === 403 || res.status === 503) ? new TextDecoder().decode(body.subarray(0, 8192)) : '';
      const classification = classify({ url: req.url, status: res.status, headers, bodyText, predicted: req.predicted });
      return { url: req.url, method, status: res.status, classification, headers, body, ms: this.now() - t0 };
    } catch (e) {
      const err = e as Error & { cause?: { code?: string; message?: string } };
      const error = [err.name, err.message, err.cause?.code ?? err.cause?.message].filter(Boolean).join(': ');
      return { url: req.url, method, status: null, classification: 'network_error', headers: {}, body: null, ms: this.now() - t0, error };
    }
  }

  /** 03 §2.1 policy for one logical request (retries and the Drupal UA retry included). */
  async fetch(req: FetchRequest): Promise<FetchOutcome> {
    const host = hostOf(req.url);
    const method = req.method ?? 'GET';
    const open = this.openHosts.get(host);
    if (this.breaker && open) {
      const out: FetchOutcome = { url: req.url, method, status: null, classification: 'network_error', headers: {}, body: null, ms: 0, attempts: 0, error: `skipped: ${host} unreachable earlier in this run (${open})` };
      this.record(out);
      return out;
    }
    let attempts = 0;
    let uaRetried = false;
    let ua: string | undefined;
    let last: Omit<FetchOutcome, 'attempts'> | null = null;
    for (let retry = 0; ; ) {
      attempts++;
      last = await this.slot(host, () => this.once(req, host, ua));
      const c = last.classification;
      if (c === 'ok' || c === 'not_modified' || c === 'not_yet') break;
      if (c === 'blocked_drupal_antibot' && !uaRetried) { uaRetried = true; ua = ALT_BROWSER_UA; continue; }
      const retryable = c === 'network_error' || (c === 'http_error' && last.status !== null && (last.status >= 500 || last.status === 429));
      if (retryable && retry < this.retries) { retry++; await this.sleep(this.backoffMs); continue; }
      break;
    }
    const out: FetchOutcome = { ...last!, attempts };
    if (this.breaker && out.classification === 'network_error') this.openHosts.set(host, out.error ?? 'network_error');
    this.record(out);
    return out;
  }

  private record(o: FetchOutcome): void {
    const { body, headers, ...rest } = o;
    this.exchanges.push({ ...rest, url: redactUrl(rest.url), contentType: headers['content-type'], bytes: body?.byteLength });
  }
}

export function createHttpClient(o: HttpClientOptions): HttpClient {
  return new HttpClient(o);
}

const shared: Partial<Record<FetchMode, HttpClient>> = {};

/** Library entry point (07 WP5 "fetchWithPolicy"): one shared client per mode, so pacing spans calls. */
export function fetchWithPolicy(req: FetchRequest | string, mode: FetchMode = 'refresh'): Promise<FetchOutcome> {
  const client = (shared[mode] ??= new HttpClient({ mode }));
  return client.fetch(typeof req === 'string' ? { url: req } : req);
}

/** Body as UTF-8 text without a BOM. */
export function bodyText(o: { body: Uint8Array | null }): string {
  if (!o.body) return '';
  const t = new TextDecoder('utf-8').decode(o.body);
  return t.charCodeAt(0) === 0xfeff ? t.slice(1) : t;
}

/** Body parsed as JSON, or undefined. */
export function bodyJson(o: { body: Uint8Array | null }): unknown {
  try { return JSON.parse(bodyText(o)); } catch { return undefined; }
}
