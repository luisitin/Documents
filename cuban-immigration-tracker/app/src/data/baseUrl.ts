/**
 * Native data base URL (ADR ARCH-5; 01-architecture.md §7): `app.json` →
 * `extra.data = { baseUrls: [...], ref, path }`. The first base is used; the others are fallbacks,
 * so the data can move to a dedicated repo or to Pages later without code changes. Preview builds
 * override `ref`. raw.githubusercontent.com serves the files with `access-control-allow-origin: *`,
 * an ETag and `max-age=300` (01 §9 V9).
 *
 * Metro picks `baseUrl.web.ts` on web; this base file is the native implementation and the one
 * `tsc` resolves (07 §2 platform note).
 */
import Constants from 'expo-constants';

/** ARCH-5 defaults, identical to `app.json` `extra.data` (used if the config is unreadable). */
export const DEFAULT_DATA_CONFIG = {
  baseUrls: ['https://raw.githubusercontent.com/luisitin/Documents'],
  ref: 'main',
  path: 'cuban-immigration-tracker/data',
} as const;

interface DataConfig {
  baseUrls: readonly string[];
  ref: string;
  path: string;
}

function config(): DataConfig {
  try {
    const extra = (Constants.expoConfig?.extra ?? {}) as { data?: Partial<DataConfig> };
    const d = extra.data;
    const baseUrls = Array.isArray(d?.baseUrls) && d.baseUrls.every((u) => typeof u === 'string' && /^https:\/\//.test(u)) && d.baseUrls.length
      ? d.baseUrls
      : DEFAULT_DATA_CONFIG.baseUrls;
    return {
      baseUrls,
      ref: typeof d?.ref === 'string' && d.ref ? d.ref : DEFAULT_DATA_CONFIG.ref,
      path: typeof d?.path === 'string' && d.path ? d.path : DEFAULT_DATA_CONFIG.path,
    };
  } catch {
    return DEFAULT_DATA_CONFIG;
  }
}

const trim = (s: string) => s.replace(/^\/+|\/+$/g, '');

/** Every configured base, in order, each ending with `/` (`<base>/<ref>/<path>/`). */
export function dataBaseUrls(): string[] {
  const c = config();
  return c.baseUrls.map((b) => `${b.replace(/\/+$/, '')}/${trim(c.ref)}/${trim(c.path)}/`);
}

/** 07 §6.0 `dataBaseUrl()`: native `baseUrls[0]/ref/path/`. */
export function dataBaseUrl(): string {
  return dataBaseUrls()[0] as string;
}

/** Whether this build fetches from a configured remote (native) or ships its files (web). */
export const DATA_ORIGIN: 'remote' | 'shipped' = 'remote';
