/**
 * P4 — USCIS Processing Times via the jzebedee/uscis SQLite releases (03-data-pipeline.md §3.4;
 * docs/research/13-live-data-endpoints-and-probe-plan.md §1.2, §1.6; doc 04 §2.3–§2.4).
 *
 * The egov.uscis.gov tool is Cloudflare-gated against cloud IPs (doc 13 §1.2), so the guaranteed-
 * reachable source is the community SQLite (schema README v0.5: `processing_time(form_name,
 * office_code, form_subtype, publication_date, range_upper, range_upper_unit, range_lower,
 * range_lower_unit, service_request_date, …)`, `offices(code, description)`, `form_types(form_name,
 * form_key, …)`). The repository has no LICENSE: only derived fields plus attribution are kept, the
 * DB itself is never stored (03 §1 principle 1).
 *
 * 1. sql.js (wasm).  2. I-485 `131A-FAM` and I-765 `147-C9` / `147-C11` rows.  3. offices + I-485 form keys.
 * 4. `months80 = range_upper` in Months; Weeks ÷ 4.345; a missing `range_lower` is accepted.
 * 5. Dates `Mon DD YYYY` / `Month D, YYYY` → ISO.  6. Q10: any I-485 key outside the 7 known →
 *    `CAA_SUBTYPE_PRESENT` candidate.  7. Fixture: 131A-FAM MIA 2023-06-17, HIA 2024-07-05, KND
 *    2024-05-28, TAM 2024-08-07; 147-C9 NBC 2025-06-13 (doc 04 §2.4 [F]).
 * 8. `inquiryDateHistory` gains a point when `publicationDate` is new; seeded with the 2024-10-18
 *    values of doc 04 §2.4 (used by the crude remedy ETA of doc 15 §2.2).
 *
 * TODO(WP5→owner): 03 P4 asks for a "week-0 issue" requesting jzebedee/uscis's permission to republish
 * these derived fields with attribution. No issue was opened (orchestrator override 2: no issues/PRs);
 * the owner should ask before the first public release.
 */
import { createRequire } from 'node:module';
import initSqlJs, { type SqlJsStatic, type SqlValue } from 'sql.js';
import type { ISODate, OfficesFile, ProcessingTimeRecord, SourceRef } from '@caa/data-schemas';
import { JZEBEDEE_RELEASES, KNOWN_I485_KEYS } from '../constants';
import { SourceError, parseUsDate } from '../util';

let sqlPromise: Promise<SqlJsStatic> | null = null;
/** sql.js with its wasm resolved from node_modules (no network, no native build). */
export function loadSqlJs(): Promise<SqlJsStatic> {
  if (!sqlPromise) {
    const require = createRequire(import.meta.url);
    const wasm = require.resolve('sql.js/dist/sql-wasm.wasm');
    sqlPromise = initSqlJs({ locateFile: () => wasm });
  }
  return sqlPromise;
}

export const WEEKS_PER_MONTH = 4.345;
export const TRACKED_SUBTYPES = { 'I-485': ['131A-FAM'], 'I-765': ['147-C9', '147-C11'] } as const;

export interface ProcessingTimesResult {
  records: ProcessingTimeRecord[];
  offices: { code: string; description: string }[];
  i485FormKeys: string[];
  /** I-485 keys outside KNOWN_I485_KEYS (Q10 → CAA_SUBTYPE_PRESENT). */
  unknownI485Keys: string[];
  latestPublication: ISODate | null;
}

/** Range value + unit → months (03 §3.4 step 4). */
export function toMonths(value: SqlValue, unit: SqlValue): number | null {
  if (value === null || value === '' || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const u = String(unit ?? 'Months').toLowerCase();
  if (u.startsWith('week')) return Math.round((n / WEEKS_PER_MONTH) * 100) / 100;
  if (u.startsWith('month')) return n;
  if (u.startsWith('day')) return Math.round((n / 30.4375) * 100) / 100;
  return null;
}

function rows(db: { exec(sql: string): { columns: string[]; values: SqlValue[][] }[] }, sql: string): Record<string, SqlValue>[] {
  const res = db.exec(sql)[0];
  if (!res) return [];
  return res.values.map((v) => Object.fromEntries(res.columns.map((c, i) => [c, v[i] ?? null])));
}

/** 03 §3.4. `ref.url` should be the release asset URL; `via` is `mirror.jzebedee`. */
export async function readProcessingTimes(dbBytes: Uint8Array, ref: { url: string; retrievedAt: string; releaseTag?: string }): Promise<ProcessingTimesResult> {
  const SQL = await loadSqlJs();
  let db;
  try { db = new SQL.Database(dbBytes); } catch (e) { throw new SourceError(`not a SQLite database (${(e as Error).message})`); }
  try {
    let pt: Record<string, SqlValue>[];
    try {
      pt = rows(db, `SELECT form_name, office_code, form_subtype, publication_date, range_upper, range_upper_unit, range_lower, range_lower_unit, service_request_date
        FROM processing_time WHERE (form_name='I-485' AND form_subtype='131A-FAM') OR (form_name='I-765' AND form_subtype IN ('147-C9','147-C11'))`);
    } catch (e) {
      throw new SourceError(`processing_time table missing or changed (${(e as Error).message})`);
    }
    let offices: { code: string; description: string }[] = [];
    try { offices = rows(db, 'SELECT code, description FROM offices').map((r) => ({ code: String(r.code), description: String(r.description ?? '') })); } catch { /* optional table */ }
    let keys: string[] = [];
    try { keys = rows(db, "SELECT form_key FROM form_types WHERE form_name='I-485'").map((r) => String(r.form_key)); } catch { /* optional table */ }

    const records: ProcessingTimeRecord[] = [];
    for (const r of pt) {
      const publicationDate = parseUsDate(r.publication_date === null ? null : String(r.publication_date));
      if (!publicationDate) continue; // Q9 reports unparseable dates; a row without a publication date is unusable
      const code = String(r.office_code ?? '').toUpperCase();
      if (!/^[A-Z]{3}$/.test(code)) continue;
      const form = String(r.form_name) as 'I-485' | 'I-765';
      const subtype = String(r.form_subtype);
      const lower = toMonths(r.range_lower, r.range_lower_unit);
      const source: SourceRef = { sourceId: 'mirror.jzebedee', url: ref.url, via: 'mirror.jzebedee', period: publicationDate, retrievedAt: ref.retrievedAt, evidence: 'F' };
      records.push({
        form, subtype, officeCode: code,
        months80: toMonths(r.range_upper, r.range_upper_unit),
        ...(lower !== null ? { monthsLowerLegacy: lower } : {}),
        inquiryDate: parseUsDate(r.service_request_date === null ? null : String(r.service_request_date)),
        publicationDate,
        isProxyForCaa: form === 'I-485' && subtype === '131A-FAM',
        source,
      });
    }
    // Keep the newest publication per (form, subtype, office).
    const best = new Map<string, ProcessingTimeRecord>();
    for (const rec of records) {
      const k = `${rec.form}|${rec.subtype}|${rec.officeCode}`;
      const cur = best.get(k);
      if (!cur || rec.publicationDate > cur.publicationDate) best.set(k, rec);
    }
    const out = [...best.values()].sort((a, b) => (a.form + a.subtype + a.officeCode < b.form + b.subtype + b.officeCode ? -1 : 1));
    const latestPublication = out.reduce<ISODate | null>((m, r) => (m === null || r.publicationDate > m ? r.publicationDate : m), null);
    const unknown = [...new Set(keys)].filter((k) => !(KNOWN_I485_KEYS as readonly string[]).includes(k)).sort();
    return { records: out, offices, i485FormKeys: [...new Set(keys)].sort(), unknownI485Keys: unknown, latestPublication };
  } finally {
    db.close();
  }
}

/** The `.db` asset of a GitHub "latest release" payload (name expected `<YYYY-MM-DD>.db` [I], never constructed). */
export function pickReleaseAsset(release: unknown): { tag: string; url: string; name: string; publishedAt?: string } | null {
  if (!release || typeof release !== 'object') return null;
  const r = release as { tag_name?: unknown; published_at?: unknown; assets?: { name?: unknown; browser_download_url?: unknown }[] };
  const asset = (r.assets ?? []).find((a) => typeof a.browser_download_url === 'string' && /\.db$/i.test(a.browser_download_url));
  if (!asset) return null;
  return {
    tag: String(r.tag_name ?? ''), url: String(asset.browser_download_url), name: String(asset.name ?? ''),
    ...(typeof r.published_at === 'string' ? { publishedAt: r.published_at } : {}),
  };
}

// ── inquiry-date history (03 §3.4 step 8; doc 15 §2.2) ───────────────────────────────────────

/**
 * Seed points published 2024-10-18 (doc 04 §2.4, VERIFIED-FILE from coatless-r-n-d/uscis-processing
 * `data-raw/*-2024-10-30.csv`): `131A-FAM` MIA Oct 07 2020, HIA Feb 03 2023, KND Nov 06 2022,
 * TAM Jan 24 2023, ORL Jun 24 2022, WPB Jul 13 2022, OFM Jan 29 2022, OKL Oct 28 2021, JAC Sep 26 2021,
 * HOU Mar 27 2022; `147-C9` NBC Apr 13 2024; `147-C11` NBC Jun 27 2024.
 */
export const INQUIRY_SEED_2024_10_18: { officeCode: string; subtype: string; inquiryDate: ISODate }[] = [
  { officeCode: 'MIA', subtype: '131A-FAM', inquiryDate: '2020-10-07' },
  { officeCode: 'HIA', subtype: '131A-FAM', inquiryDate: '2023-02-03' },
  { officeCode: 'KND', subtype: '131A-FAM', inquiryDate: '2022-11-06' },
  { officeCode: 'TAM', subtype: '131A-FAM', inquiryDate: '2023-01-24' },
  { officeCode: 'ORL', subtype: '131A-FAM', inquiryDate: '2022-06-24' },
  { officeCode: 'WPB', subtype: '131A-FAM', inquiryDate: '2022-07-13' },
  { officeCode: 'OFM', subtype: '131A-FAM', inquiryDate: '2022-01-29' },
  { officeCode: 'OKL', subtype: '131A-FAM', inquiryDate: '2021-10-28' },
  { officeCode: 'JAC', subtype: '131A-FAM', inquiryDate: '2021-09-26' },
  { officeCode: 'HOU', subtype: '131A-FAM', inquiryDate: '2022-03-27' },
  { officeCode: 'NBC', subtype: '147-C9', inquiryDate: '2024-04-13' },
  { officeCode: 'NBC', subtype: '147-C11', inquiryDate: '2024-06-27' },
];
export const INQUIRY_SEED_PUBLICATION: ISODate = '2024-10-18';

/**
 * Last-resort seed when the jzebedee release cannot be reached and no previous offices.json exists:
 * the `service_request_date` values of the 2026-10-15 release diff (doc 04 §2.4, VERIFIED-CODE from
 * the sqldiff release notes; key facts §6). `months80` is null: the research has no 80 % value for that
 * publication from this source. The records are marked `via: 'curated'` and the manifest source status
 * `fallback_used`, so nobody mistakes them for a fresh download.
 */
export const RELEASE_2026_10_15_SEED: { form: 'I-485' | 'I-765'; subtype: string; officeCode: string; inquiryDate: ISODate }[] = [
  ...[['MIA', '2023-06-17'], ['HIA', '2024-07-05'], ['KND', '2024-05-28'], ['TAM', '2024-08-07'], ['ORL', '2024-01-28'], ['WPB', '2024-05-18'],
    ['OFM', '2024-05-11'], ['OKL', '2023-07-19'], ['JAC', '2024-02-08'], ['HOU', '2023-10-29'], ['SNA', '2024-10-11'], ['LOU', '2024-10-03'],
    ['LVG', '2023-10-31'], ['NYC', '2024-01-13'], ['CHI', '2023-06-13']].map(([officeCode, inquiryDate]) => ({ form: 'I-485' as const, subtype: '131A-FAM', officeCode: officeCode!, inquiryDate: inquiryDate! })),
  { form: 'I-765', subtype: '147-C9', officeCode: 'NBC', inquiryDate: '2025-06-13' },
  { form: 'I-765', subtype: '147-C11', officeCode: 'NBC', inquiryDate: '2025-04-26' },
];
export const RELEASE_2026_10_15 = { publicationDate: '2026-10-15', url: `${JZEBEDEE_RELEASES}/tag/2026-10-15` } as const;

export function seedProcessingTimes(retrievedAt: string): ProcessingTimeRecord[] {
  return RELEASE_2026_10_15_SEED.map((s) => ({
    form: s.form, subtype: s.subtype, officeCode: s.officeCode, months80: null, inquiryDate: s.inquiryDate,
    publicationDate: RELEASE_2026_10_15.publicationDate, isProxyForCaa: s.form === 'I-485' && s.subtype === '131A-FAM',
    source: { sourceId: 'mirror.jzebedee', url: RELEASE_2026_10_15.url, via: 'curated', period: RELEASE_2026_10_15.publicationDate, retrievedAt, evidence: 'S' },
  }));
}

/** Adds one point per (office, subtype) when the record's publication date is new (03 §3.4 step 8). */
export function updateInquiryHistory(history: OfficesFile['inquiryDateHistory'], records: ProcessingTimeRecord[], seed = true): OfficesFile['inquiryDateHistory'] {
  const out = history.map((h) => ({ ...h, points: h.points.slice() }));
  const get = (officeCode: string, subtype: string) => {
    let h = out.find((x) => x.officeCode === officeCode && x.subtype === subtype);
    if (!h) {
      h = { officeCode, subtype, points: [] };
      const s = seed ? INQUIRY_SEED_2024_10_18.find((x) => x.officeCode === officeCode && x.subtype === subtype) : undefined;
      if (s) h.points.push({ publicationDate: INQUIRY_SEED_PUBLICATION, inquiryDate: s.inquiryDate });
      out.push(h);
    }
    return h;
  };
  for (const r of records) {
    if (!r.inquiryDate) continue;
    const h = get(r.officeCode, r.subtype);
    if (h.points.some((p) => p.publicationDate === r.publicationDate)) continue;
    if (h.points.length && h.points.at(-1)!.publicationDate > r.publicationDate) continue; // never rewrite the past
    h.points.push({ publicationDate: r.publicationDate, inquiryDate: r.inquiryDate });
  }
  return out.sort((a, b) => (a.subtype + a.officeCode < b.subtype + b.officeCode ? -1 : 1));
}
