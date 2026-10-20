/**
 * Every endpoint, header and seed constant of the pipeline, each cited to the research
 * (07-implementation-plan.md §10 rule 4: never invent an endpoint, number or date).
 *
 * - URLs and patterns: 03-data-pipeline.md §2.2 (P1–P9), docs/research/13-live-data-endpoints-and-probe-plan.md
 *   §1–§9, docs/research/04-uscis-data-sources.md §1.0–§2.6, key facts §8.
 * - Office lists: key facts §6 (Cuban-relevant subset) and doc 08 §7.3 (multiplier group).
 */
import type { FiscalQuarter, YearMonth } from '@caa/data-schemas';

// ── HTTP policy (03 §2.1; doc 13 §12.3) ─────────────────────────────────────────────────────

/** Browser UA for every government host (www.uscis.gov's Drupal anti-bot 403s default agents, doc 13 §3.1). */
export const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36';
/** The "different UA" of the single `blocked_drupal_antibot` retry (03 §2.1). */
export const ALT_BROWSER_UA = 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0';
/** Non-government hosts (GitHub, CourtListener) get an honest tool UA. */
export const TOOL_UA = 'caa-tracker-ingestion/1.0 (+https://github.com/luisitin/Documents)';
export const ACCEPT_LANGUAGE = 'en-US,en;q=0.9';
/** 30 s timeout; refresh 1 retry after 2 s; probe 0 retries; ≥ 1 s gap per host (03 §2.1). */
export const TIMEOUT_MS = 30_000;
export const REFRESH_RETRIES = 1;
export const RETRY_BACKOFF_MS = 2_000;
export const HOST_GAP_MS = 1_000;

/** Hosts that get the browser UA and a landing-page Referer (03 §2.1). */
export const GOVERNMENT_HOSTS: Record<string, string> = {
  'www.uscis.gov': 'https://www.uscis.gov/',
  'uscis.gov': 'https://www.uscis.gov/',
  'egov.uscis.gov': 'https://egov.uscis.gov/processing-times/',
  'first.uscis.gov': 'https://first.uscis.gov/',
  'api-int.uscis.gov': 'https://developer.uscis.gov/',
  'api.uscis.gov': 'https://developer.uscis.gov/',
  'ohss.dhs.gov': 'https://ohss.dhs.gov/',
  'www.dhs.gov': 'https://www.dhs.gov/',
  'www.cbp.gov': 'https://www.cbp.gov/',
  'www.federalregister.gov': 'https://www.federalregister.gov/',
  'api.census.gov': 'https://api.census.gov/',
};

// ── P1 monthly CSV (03 §2.2 P1; doc 04 §1.1; doc 13 §3.2) ────────────────────────────────────

export const MONTHS_EN = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'] as const;
export const USCIS_DATA_DIR = 'https://www.uscis.gov/sites/default/files/document/data/';
/** Portal index (doc 04 §1; doc 13 §3.1). Links only the newest month, so URLs are also constructed. */
export const PORTAL_INDEX_URL = 'https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data';
/** Public mirror of the USCIS files, byte-identical (doc 04 §1.0; 03 P1–P3 fallback). */
export const MIRROR_DIR = 'https://raw.githubusercontent.com/omairqazi29/visualizer/master/data/USCIS_I485/';

const monthName = (ym: YearMonth) => MONTHS_EN[Number(ym.slice(5, 7)) - 1]!;
const year = (ym: YearMonth) => ym.slice(0, 4);

/**
 * Direct candidates for one month, newest naming first (03 P1): `…/document/data/appropriation_requirement_<month>_<year>_v1.0.csv`;
 * 2024-era space-encoded `…/document/data/appropriation_requirement_<month>%20<year>.csv` (doc 13 §3.2).
 */
export function monthlyCsvDirectUrls(ym: YearMonth): string[] {
  const m = monthName(ym);
  const y = year(ym);
  const out = [`${USCIS_DATA_DIR}appropriation_requirement_${m}_${y}_v1.0.csv`];
  if (ym < '2024-09') out.push(`${USCIS_DATA_DIR}appropriation_requirement_${m}%20${y}.csv`);
  return out;
}
/** Mirror name for one month: `monthly_<month>_<year>.csv` (doc 04 §1.0, "renamed only in the monthly case"). */
export function monthlyCsvMirrorUrl(ym: YearMonth): string {
  return `${MIRROR_DIR}monthly_${monthName(ym)}_${year(ym)}.csv`;
}

// ── P2 / P3 quarterly workbooks (03 §2.2; doc 04 §1.2–§1.3) ──────────────────────────────────

export const qLabel = (q: FiscalQuarter) => `fy${q.fy}_q${q.q}`;
/** `quarterly_all_forms_fy<YYYY>_q<N>_v1.xlsx` (doc 04 §1.2); mirror keeps the same name (doc 04 §1.0). */
export function allFormsUrls(q: FiscalQuarter): { direct: string[]; mirror: string[] } {
  const f = `quarterly_all_forms_${qLabel(q)}_v1.xlsx`;
  return { direct: [`${USCIS_DATA_DIR}${f}`], mirror: [`${MIRROR_DIR}${f}`] };
}
/**
 * The by-office workbook stem changed 4× in two years (doc 04 §1.3; doc 13 §3.2): the real href comes
 * from the portal index; these constructed names are only guesses (03 P3), newest stem first.
 */
export function byOfficeFileNames(q: FiscalQuarter): string[] {
  const l = qLabel(q);
  return [`i485_performance_data_${l}_v1.xlsx`, `i485_performance_${l}.xlsx`, `i485_performancedata_${l}.xlsx`];
}
export function byOfficeUrls(q: FiscalQuarter): { direct: string[]; mirror: string[] } {
  const names = byOfficeFileNames(q);
  return { direct: names.map((n) => `${USCIS_DATA_DIR}${n}`), mirror: names.map((n) => `${MIRROR_DIR}${n}`) };
}

// ── Backfill windows (02 §2.2: seed rows Jul 2024 and Sep 2024 → latest) ─────────────────────

/** First month fetched when no national.json exists yet (02 §2.2; Aug 2024 is absent from the mirror, doc 04 §1.0). */
export const MONTHLY_BACKFILL_FROM: YearMonth = '2024-07';
/** 04 EST-1: the pool origin. */
export const FIRST_MODEL_MONTH: YearMonth = '2024-09';
/** First quarter fetched when no quarterly.json exists yet (the G0 / key facts §7 rows are FY2026 Q1–Q3). */
export const QUARTERLY_BACKFILL_FROM: FiscalQuarter = { fy: 2026, q: 1 };
/** Quarters of per-office stats kept (EST-11 uses the last two; keeps offices.json near the 02 §2 size). */
export const OFFICE_QUARTERS_KEPT = 2;

// ── P4 jzebedee processing times (03 P4; doc 13 §1.6) ───────────────────────────────────────

export const JZEBEDEE_LATEST_RELEASE = 'https://api.github.com/repos/jzebedee/uscis/releases/latest';
export const JZEBEDEE_RELEASES = 'https://github.com/jzebedee/uscis/releases';
/** The 7 known I-485 subtypes; anything else → candidate `CAA_SUBTYPE_PRESENT` (03 §3.4 step 6, Q10). */
export const KNOWN_I485_KEYS = ['131A', '131A-FAM', '131A-HRIFA', '131B', '131C', '131T', '131U'] as const;

// ── Offices (key facts §6; doc 08 §7.3) ──────────────────────────────────────────────────────

/** `Office.cubanFocus`: the key facts §6 "Cuban-relevant subset" (19 offices). */
export const CUBAN_FOCUS_OFFICES = ['MIA', 'HIA', 'KND', 'OKL', 'WPB', 'OFM', 'TAM', 'ORL', 'JAC', 'HOU', 'DAL', 'SNA', 'LOU', 'LVG', 'NEW', 'NYC', 'CLT', 'ATL', 'CHI'] as const;
/**
 * EST-11 group G for r_G: the five Cuban-dominated offices of doc 08 §7.3 (HIA, KND, MIA, TAM, HOU).
 * This is the group that reproduces golden T6 (G = 244 approvals / 166,179 mean pending → HIA 0.947,
 * TAM 1.936; 04 §9.2). The wider cubanFocus list would change r_G and every multiplier, which would
 * need a regenerated golden file (07 §10 rule 3), so the group stays at the T6 set.
 */
export const MULTIPLIER_GROUP = ['HIA', 'KND', 'MIA', 'TAM', 'HOU'] as const;

/** Full state / territory names in the by-office workbook → USPS codes (workbook headings, doc 04 §1.3). */
export const STATE_CODES: Record<string, string> = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA', Colorado: 'CO', Connecticut: 'CT',
  Delaware: 'DE', 'District of Columbia': 'DC', Florida: 'FL', Georgia: 'GA', Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL',
  Indiana: 'IN', Iowa: 'IA', Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD', Massachusetts: 'MA',
  Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS', Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND',
  Ohio: 'OH', Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD',
  Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT', Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV',
  Wisconsin: 'WI', Wyoming: 'WY', Guam: 'GU', 'U.S. Virgin Islands': 'VI', 'Puerto Rico': 'PR',
  'Northern Mariana Islands': 'MP', 'American Samoa': 'AS',
};

// ── P7 Federal Register (03 P7; doc 13 §6) ──────────────────────────────────────────────────

export const FR_DOCUMENTS = 'https://www.federalregister.gov/api/v1/documents.json';
export const FR_TERM = '(Cuban OR Cubans OR "Cuban Adjustment Act" OR parole OR parolees OR CHNV)';
export const FR_AGENCIES = ['homeland-security-department', 'u-s-citizenship-and-immigration-services', 'u-s-customs-and-border-protection'] as const;
/** Regression fixture (doc 13 §6): the CHNV termination notice, published 2025-03-25. */
export const FR_FIXTURE_DOC = '2025-05128';

// ── P8 USCIS RSS (03 P8; doc 13 §9) ─────────────────────────────────────────────────────────

export const RSS_FEEDS = [
  { id: '22984', url: 'https://www.uscis.gov/news/rss-feed/22984', label: 'Alerts' },
  { id: '23269', url: 'https://www.uscis.gov/news/rss-feed/23269', label: 'News Releases' },
] as const;
/** 03 P8 keyword filter (case-insensitive; whole-word for the short ones). */
export const RSS_KEYWORDS = ['Cuba', 'Cuban', 'CAA', 'parole', 'hold', 'pause', 'adjudication', 'PM-602', 'PA-20'] as const;

// ── P9 CourtListener (03 P9; key facts §8–§9; doc 13 §7) ────────────────────────────────────

export const COURTLISTENER_API = 'https://www.courtlistener.com/api/rest/v4/';
/** Watched dockets, keyed on DOCKET NUMBER, never caption (captions change: Noem → Mullin). ≤ 5 requests per run. */
export const DOCKETS = [
  { id: 73477958, court: '1st Cir.', docketNumber: '26-1703', label: 'Dorcas (appeal)' },
  { id: 73380879, court: 'N.D. Cal.', docketNumber: '3:26-cv-04850', label: 'Red Eagle' },
  { id: 74919678, court: 'D. Mass.', docketNumber: '1:26-cv-14527', label: 'AAUP v. Mullin' },
  { id: 71085922, court: 'D. Mass.', docketNumber: '1:25-cv-12245', label: 'Doe v. DHS' },
  { id: 69695790, court: 'D. Mass.', docketNumber: '1:25-cv-10495', label: 'Doe v. Noem (now Doe v. Mullin)' },
] as const;

// ── Commit policy / canary (03 §6.1 notes; ARCH-6; 04 §9.2) ─────────────────────────────────

export const HEARTBEAT_DAYS = 7;
export const QUARANTINE_KEEP_DAYS = 30;
export const MIN_APP_VERSION = '0.1.0';
