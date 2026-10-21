/**
 * Web data base URL (ADR WEB-1; artifact contract (b)): the artifact prelude captures
 * `window.__CAA_DATA_BASE__ = new URL('./data/', document.baseURI).href` BEFORE anything changes
 * the URL, because the page boots from an unknown path and the history shim may rewrite it. The
 * data layer on web uses only that value, falling back to the relative `./data/` (07 WP6). The host
 * CSP blocks every other origin (GitHub raw included), so the web build never fetches remotely.
 */
declare global {
  // Set by the artifact prelude (scripts/build-artifact.mjs) before the bundle runs.
  var __CAA_DATA_BASE__: string | undefined;
}

export const DEFAULT_DATA_CONFIG = { baseUrls: [] as string[], ref: '', path: '' } as const;

/** 07 §6.0 `dataBaseUrl()`: web `window.__CAA_DATA_BASE__ ?? './data/'`. */
export function dataBaseUrl(): string {
  try {
    const b = globalThis.__CAA_DATA_BASE__;
    if (typeof b === 'string' && b.length > 0) return b.endsWith('/') ? b : `${b}/`;
  } catch {
    /* fall through */
  }
  return './data/';
}

export function dataBaseUrls(): string[] {
  return [dataBaseUrl()];
}

export const DATA_ORIGIN: 'remote' | 'shipped' = 'shipped';
