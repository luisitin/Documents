/**
 * Response classification (03-data-pipeline.md §2.1; doc 13 §12.3; key facts §8):
 * `ok | not_modified | not_yet | blocked_cloudflare | blocked_drupal_antibot | http_error |
 * network_error | schema_mismatch | skipped_no_secret`.
 *
 * - `blocked_cloudflare`: 403/503 AND (a `cf-mitigated` header, or a body containing
 *   "Just a moment...", "Attention Required! | Cloudflare" or "Sorry, you have been blocked")
 *   — the markers jzebedee/uscis's collector checks (doc 13 §1.2).
 * - `blocked_drupal_antibot`: 403 on www.uscis.gov without those markers (doc 13 §3.1).
 * - `not_yet`: 404 on a PREDICTED file name (e.g. next month's CSV, 03 P1).
 * A blocked endpoint is a finding, never a crash (03 §1 principle 2).
 */
export type Classification =
  | 'ok' | 'not_modified' | 'not_yet' | 'blocked_cloudflare' | 'blocked_drupal_antibot'
  | 'http_error' | 'network_error' | 'schema_mismatch' | 'skipped_no_secret';

export const CLOUDFLARE_BODY_MARKERS = ['Just a moment...', 'Attention Required! | Cloudflare', 'Sorry, you have been blocked'] as const;

export interface ClassifyInput {
  url: string;
  /** null when no HTTP response was received (DNS, TLS, proxy CONNECT refusal, timeout). */
  status: number | null;
  headers?: Record<string, string>;
  /** The first bytes of the body as text (only needed for 403/503). */
  bodyText?: string;
  /** True when the URL is a constructed guess, so a 404 means "not published yet". */
  predicted?: boolean;
}

/** True for 403/503 responses that carry a Cloudflare marker. */
export function isCloudflareBlock(status: number | null, headers: Record<string, string> = {}, bodyText = ''): boolean {
  if (status !== 403 && status !== 503) return false;
  const h = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return 'cf-mitigated' in h || CLOUDFLARE_BODY_MARKERS.some((m) => bodyText.includes(m));
}

function hostOf(url: string): string {
  const m = /^https?:\/\/([^/:?#]+)/i.exec(url);
  return m ? m[1]!.toLowerCase() : '';
}

/** 03 §2.1 classification of one HTTP exchange. */
export function classify(i: ClassifyInput): Classification {
  if (i.status === null) return 'network_error';
  if (i.status === 304) return 'not_modified';
  if (i.status >= 200 && i.status < 300) return 'ok';
  if (i.status === 404 && i.predicted) return 'not_yet';
  if (isCloudflareBlock(i.status, i.headers, i.bodyText)) return 'blocked_cloudflare';
  if (i.status === 403 && hostOf(i.url) === 'www.uscis.gov') return 'blocked_drupal_antibot';
  return 'http_error';
}

/** Outcomes that mean "the source answered with usable bytes". */
export const isUsable = (c: Classification) => c === 'ok';
