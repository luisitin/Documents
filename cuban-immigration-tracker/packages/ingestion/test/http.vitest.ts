/**
 * 03 §2.1 HTTP policy: classification, headers, pacing, retries, the Drupal UA retry, conditional
 * requests and the refresh-mode circuit breaker.
 */
import { describe, expect, it } from 'vitest';
import { classify, isCloudflareBlock } from '../src/classify';
import { ALT_BROWSER_UA, BROWSER_UA, TOOL_UA } from '../src/constants';
import { HttpClient } from '../src/http';
import { fastClient, mockFetch } from './helpers';

describe('classify (03 §2.1)', () => {
  it('maps statuses to the 9 classes', () => {
    expect(classify({ url: 'https://www.uscis.gov/x', status: 200 })).toBe('ok');
    expect(classify({ url: 'https://www.uscis.gov/x', status: 304 })).toBe('not_modified');
    expect(classify({ url: 'https://www.uscis.gov/x.csv', status: 404, predicted: true })).toBe('not_yet');
    expect(classify({ url: 'https://www.uscis.gov/x.csv', status: 404 })).toBe('http_error');
    expect(classify({ url: 'https://egov.uscis.gov/p', status: 403, headers: { 'CF-Mitigated': 'challenge' } })).toBe('blocked_cloudflare');
    expect(classify({ url: 'https://egov.uscis.gov/p', status: 503, bodyText: '<title>Just a moment...</title>' })).toBe('blocked_cloudflare');
    expect(classify({ url: 'https://egov.uscis.gov/p', status: 403, bodyText: 'Sorry, you have been blocked' })).toBe('blocked_cloudflare');
    expect(classify({ url: 'https://www.uscis.gov/tools', status: 403, bodyText: 'Access denied' })).toBe('blocked_drupal_antibot');
    expect(classify({ url: 'https://egov.uscis.gov/p', status: 403, bodyText: 'Access denied' })).toBe('http_error');
    expect(classify({ url: 'https://x', status: null })).toBe('network_error');
    expect(isCloudflareBlock(200, { 'cf-mitigated': 'x' })).toBe(false);
  });
});

describe('HttpClient', () => {
  it('sends the browser UA, Accept-Language and Referer to government hosts, a tool UA elsewhere', async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const c = fastClient(mockFetch(new Map([[/./, 'ok']]), calls));
    await c.fetch({ url: 'https://www.uscis.gov/a', accept: 'text/csv' });
    await c.fetch({ url: 'https://raw.githubusercontent.com/a' });
    const h0 = calls[0]!.init!.headers as Record<string, string>;
    expect(h0['user-agent']).toBe(BROWSER_UA);
    expect(h0['accept-language']).toBe('en-US,en;q=0.9');
    expect(h0.referer).toBe('https://www.uscis.gov/');
    expect(h0.accept).toBe('text/csv');
    expect((calls[1]!.init!.headers as Record<string, string>)['user-agent']).toBe(TOOL_UA);
  });

  it('retries once with a different UA on blocked_drupal_antibot', async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    let n = 0;
    const f = mockFetch(new Map([['https://www.uscis.gov/a', () => (n++ === 0 ? new Response('denied', { status: 403 }) : new Response('csv', { status: 200 }))]]), calls);
    const r = await new HttpClient({ mode: 'probe', fetchImpl: f, sleep: async () => {}, hostGapMs: 0 }).fetch({ url: 'https://www.uscis.gov/a' });
    expect(r.classification).toBe('ok');
    expect(r.attempts).toBe(2);
    expect((calls[1]!.init!.headers as Record<string, string>)['user-agent']).toBe(ALT_BROWSER_UA);
  });

  it('refresh mode: 1 retry after the backoff on 5xx; probe mode: 0 retries', async () => {
    const sleeps: number[] = [];
    const f = mockFetch(new Map([['https://x.test/a', { status: 503, body: 'down' }]]));
    const r1 = await new HttpClient({ mode: 'refresh', fetchImpl: f, sleep: async (ms) => { sleeps.push(ms); }, hostGapMs: 0 }).fetch({ url: 'https://x.test/a' });
    expect(r1.attempts).toBe(2);
    expect(sleeps).toContain(2000);
    const r2 = await new HttpClient({ mode: 'probe', fetchImpl: f, sleep: async () => {}, hostGapMs: 0 }).fetch({ url: 'https://x.test/a' });
    expect(r2.attempts).toBe(1);
    expect(r2.classification).toBe('http_error');
  });

  it('keeps ≥ 1 s between requests to one host (one at a time), none across hosts', async () => {
    let t = 0;
    const sleeps: number[] = [];
    const c = new HttpClient({ mode: 'probe', fetchImpl: mockFetch(new Map([[/./, 'ok']])), now: () => t, sleep: async (ms) => { sleeps.push(ms); t += ms; } });
    await Promise.all([c.fetch({ url: 'https://a.test/1' }), c.fetch({ url: 'https://a.test/2' }), c.fetch({ url: 'https://b.test/1' })]);
    expect(sleeps).toEqual([1000]);
  });

  it('sends If-None-Match / If-Modified-Since and classifies 304 as not_modified', async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const c = fastClient(mockFetch(new Map([['https://x.test/a', { status: 304 }]]), calls));
    const r = await c.fetch({ url: 'https://x.test/a', etag: 'W/"abc"', lastModified: 'Tue, 20 Oct 2026 00:00:00 GMT' });
    expect(r.classification).toBe('not_modified');
    const h = calls[0]!.init!.headers as Record<string, string>;
    expect(h['if-none-match']).toBe('W/"abc"');
    expect(h['if-modified-since']).toBe('Tue, 20 Oct 2026 00:00:00 GMT');
  });

  it('refresh mode opens a per-host breaker after a network error; probe mode does not', async () => {
    const calls: { url: string }[] = [];
    const f = mockFetch(new Map<string | RegExp, 'network_error' | string>([[/www\.uscis\.gov/, 'network_error'], [/./, 'ok']]), calls);
    const c = fastClient(f);
    const a = await c.fetch({ url: 'https://www.uscis.gov/1' });
    const b = await c.fetch({ url: 'https://www.uscis.gov/2' });
    const other = await c.fetch({ url: 'https://raw.githubusercontent.com/x' });
    expect(a.classification).toBe('network_error');
    expect(a.error).toMatch(/ENOTFOUND/);
    expect(b.attempts).toBe(0);
    expect(b.error).toMatch(/unreachable earlier/);
    expect(other.classification).toBe('ok');
    expect(calls.filter((x) => x.url.includes('uscis')).length).toBe(2); // 1 try + 1 retry, then nothing
    const p = new HttpClient({ mode: 'probe', fetchImpl: f, sleep: async () => {}, hostGapMs: 0 });
    await p.fetch({ url: 'https://www.uscis.gov/1' });
    expect((await p.fetch({ url: 'https://www.uscis.gov/2' })).attempts).toBe(1);
  });

  it('records exchanges without bodies or request headers (no secrets in logs)', async () => {
    const c = fastClient(mockFetch(new Map([[/./, 'body']])));
    await c.fetch({ url: 'https://x.test/a', headers: { authorization: 'Token SECRET' } });
    expect(JSON.stringify(c.exchanges)).not.toContain('SECRET');
    expect(c.exchanges[0]!.bytes).toBe(4);
  });
});
