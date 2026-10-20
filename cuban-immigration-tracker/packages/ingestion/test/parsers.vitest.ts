/**
 * Parser fixtures (03 §3, Q2): the real mirror files reproduce the documented values exactly; malformed
 * inputs are `schema_mismatch` (SourceError), never a crash. Synthetic fixtures cover the sources the
 * sandbox cannot reach (portal index, jzebedee SQLite, Federal Register, RSS, CourtListener).
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NationalFileSchema, OfficesFileSchema, QuarterlyFileSchema } from '@caa/data-schemas';
import { describe, expect, it } from 'vitest';
import { DOCKETS, MIRROR_DIR } from '../src/constants';
import { runGoldenFixtures, syntheticJzebedeeDb } from '../src/fixtures';
import { clCandidates } from '../src/sources/courtListener';
import { frCandidates, frSearchUrl, parseFrSearch } from '../src/sources/federalRegister';
import { parseByOffice } from '../src/sources/i485ByOffice';
import { parseMonthlyCsv } from '../src/sources/monthlyCsv';
import { classifyPortalHref, findMonthLink, findQuarterLink, parsePortalIndex } from '../src/sources/portalIndex';
import { pickReleaseAsset, readProcessingTimes, seedProcessingTimes, toMonths, updateInquiryHistory } from '../src/sources/processingTimes';
import { approvalBaselines, parseAllForms } from '../src/sources/quarterlyAllForms';
import { parseRss, rssCandidates, rssMatches } from '../src/sources/uscisRss';
import { SourceError, parseUsDate, quarterOfMonth, monthsOfQuarter } from '../src/util';
import { FIX, fixture } from './helpers';

const ref = (file: string) => ({ url: `${MIRROR_DIR}${file}`, via: 'mirror.visualizer' as const, retrievedAt: '2026-10-20T00:00:00Z' });

describe('Q2 golden fixtures', () => {
  it('every golden fixture re-parses exactly (runGoldenFixtures)', async () => {
    const r = await runGoldenFixtures();
    expect(r.map((x) => [x.source, x.level])).toEqual([
      ['uscis.monthly_csv', 'pass'], ['uscis.quarterly_all_forms', 'pass'], ['uscis.i485_by_office', 'pass'], ['mirror.jzebedee', 'pass'],
    ]);
  });
});

describe('P1 parseMonthlyCsv (03 §3.1)', () => {
  it('August 2026 → 1213 / 386 / 434 / 355,520 / 345,741 / 20.6, queried September 2026 (BOM + CRLF)', async () => {
    const r = parseMonthlyCsv(await fixture('mirror/monthly_august_2026.csv'), ref('monthly_august_2026.csv'));
    expect(r.month).toBe('2026-08');
    expect(r.queried).toBe('September 2026');
    const { source, ...row } = r.cuban;
    expect(row).toEqual({ ym: '2026-08', received: 1213, approved: 386, denied: 434, pending: 355520, pendingOver6: 345741, avgMonths: 20.6 });
    expect(source).toMatchObject({ sourceId: 'uscis.monthly_csv', via: 'mirror.visualizer', period: '2026-08', evidence: 'F' });
    expect(r.i765).toMatchObject({ ym: '2026-08', received: 130329, approved: 125318, denied: 29906, pending: 1921541, avgMonths: 6.8 });
    expect(r.i765.caveat).toBeUndefined();
    expect(r.footnotes.length).toBe(11);
  });
  it('February 2026 has a trailing comma on every line and still parses', async () => {
    const r = parseMonthlyCsv(await fixture('mirror/monthly_february_2026.csv'), ref('monthly_february_2026.csv'));
    expect([r.cuban.received, r.cuban.approved, r.cuban.denied, r.cuban.pending]).toEqual([4813, 10, 21, 348318]);
  });
  it('April 2025 I-765 row carries the footnote-12 caveat (c)(11) status flips', async () => {
    const r = parseMonthlyCsv(await fixture('mirror/monthly_april_2025.csv'), ref('monthly_april_2025.csv'));
    expect(r.i765.caveat).toBe('cxi_status_flips_2025_03_04');
    expect(r.footnotes.some((f) => f.startsWith('12)'))).toBe(true);
  });
  it('July 2024 (first seed month) has pendingOver6 90,723', async () => {
    const r = parseMonthlyCsv(await fixture('mirror/monthly_july_2024.csv'), ref('monthly_july_2024.csv'));
    expect(r.cuban.pendingOver6).toBe(90723);
  });
  it('rejects a changed header, a missing Cuban row and a non-numeric cell (schema_mismatch)', async () => {
    const text = new TextDecoder().decode(await fixture('mirror/monthly_august_2026.csv'));
    expect(() => parseMonthlyCsv(text.replace('Pending Over 6 Months', 'Pending >6'), ref('x.csv'))).toThrow(SourceError);
    expect(() => parseMonthlyCsv(text.replace('(Cuban)', '(Other2)'), ref('x.csv'))).toThrow(/Cuban/);
    expect(() => parseMonthlyCsv(text.replace('"355,520"', '"n/a"'), ref('x.csv'))).toThrow(/not a number/);
    expect(() => parseMonthlyCsv('hello', ref('x.csv'))).toThrow(/title line/);
  });
});

describe('P2 parseAllForms (03 §3.2)', () => {
  it('FY26 Q3 Cuban = 6279 / 139 / 447 / 586 / 342,360 / 16.3, plus Refugee, Asylum and both I-765 rows', async () => {
    const r = await parseAllForms(await fixture('mirror/quarterly_all_forms_fy2026_q3_v1.xlsx'), ref('quarterly_all_forms_fy2026_q3_v1.xlsx'));
    expect(r.quarter).toEqual({ fy: 2026, q: 3 });
    expect(r.sheet).toBe('FY26Q3_All_Forms');
    const c = r.rows.find((x) => x.form === 'I-485 (Cuban)')!;
    expect([c.received, c.approved, c.denied, c.completions, c.pendingWorkbook, c.medianMonths]).toEqual([6279, 139, 447, 586, 342360, 16.3]);
    expect(c.fytd).toEqual({ received: 46500, approved: 4287, denied: 865, completions: 5152 });
    expect(r.rows.map((x) => x.form)).toEqual(['I-485 (Cuban)', 'I-485 (Refugee)', 'I-485 (Asylum)', 'I-765 (Adjustment Of Status)', 'I-765 (All Other)']);
    expect(r.rows.find((x) => x.form === 'I-765 (Adjustment Of Status)')!.pendingWorkbook).toBe(671362);
    expect(QuarterlyFileSchema.safeParse({ rows: r.rows, historicMedians: [], approvalBaselines: approvalBaselines(r.rows) }).success).toBe(true);
  });
  it('approval baselines: Q3 139/586 and FYTD 4,287/5,152 (key facts §7: 23.7 %, 83 %)', async () => {
    const r = await parseAllForms(await fixture('mirror/quarterly_all_forms_fy2026_q3_v1.xlsx'), ref('q.xlsx'));
    const b = approvalBaselines(r.rows);
    expect(b.map((x) => [x.numerator, x.denominator, Math.round(x.share * 1000) / 10])).toEqual([[139, 586, 23.7], [4287, 5152, 83.2]]);
    expect(b[0]!.label).toEqual({ es: 'Año fiscal 2026, trimestre 3 (abr–jun 2026)', en: 'FY2026 Q3 (Apr–Jun 2026)' });
  });
  it('a CSV (not an XLSX) is schema_mismatch', async () => {
    await expect(parseAllForms(await fixture('mirror/monthly_august_2026.csv'), ref('x'))).rejects.toThrow(SourceError);
  });
});

describe('P3 parseByOffice (03 §3.3)', () => {
  it('Hialeah FY26 Q3 humanitarian pending 37,486; FL state offices; national total = 38,239 / 2,592 / 784 / 618,097', async () => {
    const r = await parseByOffice(await fixture('mirror/i485_performance_data_fy2026_q3_v1.xlsx'), ref('i485_performance_data_fy2026_q3_v1.xlsx'));
    expect(r.quarter).toEqual({ fy: 2026, q: 3 });
    const hia = r.stats.find((s) => s.officeCode === 'HIA')!;
    expect([hia.received, hia.approved, hia.denied, hia.pending, hia.suppressed]).toEqual([661, 1, 3, 37486, false]);
    expect(r.stateOffices.FL).toEqual(['HIA', 'JAC', 'KND', 'MIA', 'OFM', 'OKL', 'ORL', 'TAM', 'WPB']);
    expect(r.nationalHumanitarian).toEqual({ received: 38239, approved: 2592, denied: 784, pending: 618097 });
    // doc 04 §1.3 table (FY26 Q3 pending): KND 41,248; MIA 20,662; TAM 34,695; HOU 34,665
    expect(['KND', 'MIA', 'TAM', 'HOU'].map((c) => r.stats.find((s) => s.officeCode === c)!.pending)).toEqual([41248, 20662, 34695, 34665]);
    expect(r.offices.find((o) => o.code === 'HIA')).toMatchObject({ name: 'Hialeah', state: 'FL', cubanFocus: true, kind: 'field_office' });
    expect(r.offices.find((o) => o.code === 'SSC')).toMatchObject({ state: 'TX', kind: 'service_center', cubanFocus: false });
    expect(r.stateOffices.TX).not.toContain('SSC'); // service centers never enter the state mixture
    expect(r.unplacedServiceCenters).toEqual(['NBC', 'YSC']);
    expect(OfficesFileSchema.safeParse({ offices: r.offices, stateOffices: r.stateOffices, processingTimes: [], quarterly: r.stats, inquiryDateHistory: [] }).success).toBe(true);
  });
});

describe('portal index (03 P1/P3 discovery)', () => {
  it('extracts and classifies document links (synthetic page)', async () => {
    const links = parsePortalIndex(await readFile(join(FIX, 'synthetic', 'portal-index.html'), 'utf8'));
    expect(links.map((l) => l.kind)).toEqual(['monthly_csv', 'quarterly_all_forms', 'i485_by_office', 'monthly_csv', 'i765_category']);
    expect(findMonthLink(links, '2026-08')!.href).toBe('https://www.uscis.gov/sites/default/files/document/data/appropriation_requirement_august_2026_v1.0.csv');
    expect(findMonthLink(links, '2023-06')!.href).toMatch(/Appropriation_Requirement_June%202023\.csv$/);
    expect(findQuarterLink(links, 'i485_by_office', { fy: 2026, q: 3 })).toBeDefined();
    expect(classifyPortalHref('/x/i485_performancedata_fy2023_qtr3.xlsx')).toBe('i485_by_office');
  });
});

describe('P4 readProcessingTimes (03 §3.4; synthetic SQLite)', () => {
  it('131A-FAM MIA 2023-06-17, HIA 2024-07-05, KND 2024-05-28, TAM 2024-08-07; 147-C9 NBC 2025-06-13 (newest publication kept)', async () => {
    const r = await readProcessingTimes(await syntheticJzebedeeDb(), { url: 'https://github.com/jzebedee/uscis/releases/download/2026-10-15/2026-10-15.db', retrievedAt: '2026-10-20T00:00:00Z' });
    const get = (f: string, s: string, o: string) => r.records.find((x) => x.form === f && x.subtype === s && x.officeCode === o)!;
    expect(['MIA', 'HIA', 'KND', 'TAM'].map((o) => get('I-485', '131A-FAM', o).inquiryDate)).toEqual(['2023-06-17', '2024-07-05', '2024-05-28', '2024-08-07']);
    expect(get('I-485', '131A-FAM', 'MIA')).toMatchObject({ publicationDate: '2026-10-15', months80: 30, isProxyForCaa: true });
    expect(get('I-765', '147-C9', 'NBC')).toMatchObject({ inquiryDate: '2025-06-13', months80: 5.98, isProxyForCaa: false }); // 26 weeks ÷ 4.345
    expect(r.records.some((x) => x.subtype === '131A')).toBe(false);
    expect(r.unknownI485Keys).toEqual([]);
    expect(r.latestPublication).toBe('2026-10-15');
  });
  it('a database that is not SQLite is schema_mismatch', async () => {
    await expect(readProcessingTimes(new TextEncoder().encode('not a db'), { url: 'https://x', retrievedAt: '2026-10-20T00:00:00Z' })).rejects.toThrow(SourceError);
  });
  it('units, dates and the release asset picker', () => {
    expect(toMonths(26, 'Weeks')).toBe(5.98);
    expect(toMonths(7, 'Months')).toBe(7);
    expect(toMonths(null, 'Months')).toBeNull();
    expect(parseUsDate('Jun 17 2023')).toBe('2023-06-17');
    expect(parseUsDate('October 18, 2024')).toBe('2024-10-18');
    expect(parseUsDate('2024-10-18')).toBe('2024-10-18');
    expect(parseUsDate('soon')).toBeNull();
    expect(pickReleaseAsset({ tag_name: '2026-10-15', assets: [{ name: 'notes.txt', browser_download_url: 'https://x/notes.txt' }, { name: '2026-10-15.db', browser_download_url: 'https://x/2026-10-15.db' }] }))
      .toEqual({ tag: '2026-10-15', url: 'https://x/2026-10-15.db', name: '2026-10-15.db' });
    expect(pickReleaseAsset({ assets: [] })).toBeNull();
  });
  it('inquiry-date history: seeded with the 2024-10-18 point, appended only for a NEW publication', () => {
    const seed = seedProcessingTimes('2026-10-20T00:00:00Z');
    expect(seed.every((s) => s.source.via === 'curated' && s.months80 === null)).toBe(true);
    const h1 = updateInquiryHistory([], seed);
    const mia = h1.find((h) => h.officeCode === 'MIA' && h.subtype === '131A-FAM')!;
    expect(mia.points).toEqual([{ publicationDate: '2024-10-18', inquiryDate: '2020-10-07' }, { publicationDate: '2026-10-15', inquiryDate: '2023-06-17' }]);
    expect(updateInquiryHistory(h1, seed)).toEqual(h1);
  });
});

describe('P7–P9 candidates (synthetic payloads)', () => {
  it('Federal Register: finds 2025-05128; query URL carries the 03 P7 conditions', async () => {
    const docs = parseFrSearch(JSON.parse(await readFile(join(FIX, 'synthetic', 'fr-search.json'), 'utf8')));
    const c = frCandidates(docs, '2026-10-20T00:00:00Z');
    expect(c.map((x) => x.id)).toContain('fr:2025-05128');
    expect(c.find((x) => x.id === 'fr:2025-05128')!.matchedTerms).toEqual(expect.arrayContaining(['Cuban', 'parole']));
    const u = decodeURIComponent(frSearchUrl('2026-10-01'));
    expect(u).toContain('conditions[agencies][]=u-s-citizenship-and-immigration-services');
    expect(u).toContain('conditions[publication_date][gte]=2026-10-01');
    expect(() => parseFrSearch({ results: 'x' })).toThrow(SourceError);
  });
  it('RSS: keyword filter keeps hold / CAA / PA-20xx items only', async () => {
    const p = parseRss(await readFile(join(FIX, 'synthetic', 'rss-alerts.xml'), 'utf8'));
    expect(p.channelTitle).toBe('Alerts');
    const c = rssCandidates(p.items, '2026-10-20T00:00:00Z');
    expect(c.map((x) => x.url)).toEqual(['https://www.uscis.gov/newsroom/alerts/sample-one', 'https://www.uscis.gov/newsroom/alerts/sample-three']);
    expect(rssMatches('Threshold changes')).toEqual([]); // "hold" is matched as a whole word only
    expect(rssMatches('Cuban Adjustment Act (CAA) under PA-2026-05')).toEqual(['Cuban', 'CAA', 'PA-20']);
    expect(() => parseRss('<html></html>')).toThrow(SourceError);
  });
  it('CourtListener: entries since the last run, keyed on the docket NUMBER', async () => {
    const json = JSON.parse(await readFile(join(FIX, 'synthetic', 'cl-entries.json'), 'utf8'));
    const c = clCandidates(json, DOCKETS[0], '2026-10-01', '2026-10-20T00:00:00Z');
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ id: 'cl:26-1703:900000002', docketNumber: '26-1703', source: 'courtlistener.v4' });
  });
});

describe('fiscal-quarter helpers', () => {
  it('FY = Oct 1 – Sep 30', () => {
    expect(quarterOfMonth('2025-10')).toEqual({ fy: 2026, q: 1 });
    expect(quarterOfMonth('2026-06')).toEqual({ fy: 2026, q: 3 });
    expect(monthsOfQuarter({ fy: 2026, q: 1 })).toEqual(['2025-10', '2025-11', '2025-12']);
    expect(monthsOfQuarter({ fy: 2026, q: 4 })).toEqual(['2026-07', '2026-08', '2026-09']);
  });
  it('national schema accepts the parsed rows (Jul 2024 + Sep 2024 gap before the model window)', async () => {
    const jul = parseMonthlyCsv(await fixture('mirror/monthly_july_2024.csv'), ref('a'));
    const aug = parseMonthlyCsv(await fixture('mirror/monthly_august_2026.csv'), ref('b'));
    expect(NationalFileSchema.safeParse({ rows: [jul.cuban], i765National: [jul.i765, aug.i765], firstModelMonth: '2024-09' }).success).toBe(true);
  });
});
