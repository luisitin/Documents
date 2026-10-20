/**
 * Parser fixtures and the Q2 golden re-parse (03-data-pipeline.md §4 Q2, §8 `npm run data:fixtures`).
 *
 * `test/fixtures/mirror/` holds byte-identical copies of USCIS files from the public mirror
 * (docs/research/04-uscis-data-sources.md §1.0; raw.githubusercontent.com is reachable from the build
 * sandbox). `npm run data:fixtures` re-downloads them and verifies each sha256 below.
 * `test/fixtures/synthetic/` holds SYNTHETIC inputs (labelled as samples in each file) for sources the
 * sandbox cannot reach: the jzebedee SQLite (built from SQL at run time), the portal index, Federal
 * Register, RSS and CourtListener payloads.
 */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MIRROR_DIR } from './constants';
import { GOLDEN_FIXTURES, type QaResult } from './qa';
import { parseMonthlyCsv } from './sources/monthlyCsv';
import { parseAllForms } from './sources/quarterlyAllForms';
import { parseByOffice } from './sources/i485ByOffice';
import { loadSqlJs, readProcessingTimes } from './sources/processingTimes';

export const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'test', 'fixtures');

/** Mirror fixtures (name, source URL, sha256 of the bytes fetched 2026-10-20). */
export const FIXTURE_FILES = [
  { name: 'monthly_august_2026.csv', sha256: '74aa7bce317fa19860b5ee59a29da0b432d5a2556ea13594fc0d4cfae7c96d8c' },
  { name: 'monthly_july_2024.csv', sha256: 'e62b92889aa29239e6f0ca2f5b36911fd274ac13853b8d8475c63639dc28e26c' },
  { name: 'monthly_february_2026.csv', sha256: 'b1b6dda0b78e7d88bca359b2ddb1ccafad0b7a4a355abb382b15de6601c2cbe3' },
  { name: 'monthly_april_2025.csv', sha256: 'aaf933867dfd060122abece0c368abe9577f0edd7917d0e6eab236c4f6c0ddd5' },
  { name: 'quarterly_all_forms_fy2026_q3_v1.xlsx', sha256: '7e9b8fb9e89ee2f4b5815b09ed26a893101af68a15486675d8589c70a2bc5148' },
  { name: 'i485_performance_data_fy2026_q3_v1.xlsx', sha256: '54db6464ba925bc5788cc05655be0b5a54c3f783afd9925d42f8c45a845c1784' },
].map((f) => ({ ...f, url: `${MIRROR_DIR}${f.name}` }));

export async function readFixture(rel: string, dir = FIXTURES_DIR): Promise<Uint8Array> {
  return new Uint8Array(await readFile(join(dir, rel)));
}

/** The synthetic jzebedee DB (SQL → sql.js database bytes). */
export async function syntheticJzebedeeDb(dir = FIXTURES_DIR): Promise<Uint8Array> {
  const SQL = await loadSqlJs();
  const db = new SQL.Database();
  try {
    db.exec(await readFile(join(dir, 'synthetic', 'jzebedee.sql'), 'utf8'));
    return db.export();
  } finally {
    db.close();
  }
}

const REF = { via: 'mirror.visualizer' as const, retrievedAt: '2026-10-20T00:00:00Z' };

/** Q2: the golden fixtures must re-parse exactly with the current parser code. */
export async function runGoldenFixtures(dir = FIXTURES_DIR): Promise<QaResult[]> {
  const out: QaResult[] = [];
  const check = async (what: string, fn: () => Promise<string[]>) => {
    try {
      const bad = await fn();
      out.push(bad.length ? { id: 'Q2', source: what, level: 'fail', message: `${what}: ${bad.join('; ')}` } : { id: 'Q2', source: what, level: 'pass', message: `${what} re-parses exactly` });
    } catch (e) {
      out.push({ id: 'Q2', source: what, level: 'fail', message: `${what}: ${(e as Error).message}` });
    }
  };
  const diff = (got: Record<string, unknown>, want: Record<string, unknown>) =>
    Object.keys(want).filter((k) => got[k] !== want[k]).map((k) => `${k} ${String(got[k])} ≠ ${String(want[k])}`);

  await check('uscis.monthly_csv', async () => {
    const r = parseMonthlyCsv(await readFixture('mirror/monthly_august_2026.csv', dir), { ...REF, url: `${MIRROR_DIR}monthly_august_2026.csv` });
    return diff(r.cuban as unknown as Record<string, unknown>, GOLDEN_FIXTURES.monthlyAug2026);
  });
  await check('uscis.quarterly_all_forms', async () => {
    const r = await parseAllForms(await readFixture('mirror/quarterly_all_forms_fy2026_q3_v1.xlsx', dir), { ...REF, url: `${MIRROR_DIR}quarterly_all_forms_fy2026_q3_v1.xlsx` });
    const c = r.rows.find((x) => x.form === 'I-485 (Cuban)');
    if (!c) return ['no Cuban row'];
    return [...(r.quarter.fy === 2026 && r.quarter.q === 3 ? [] : ['quarter ≠ FY2026 Q3']), ...diff(c as unknown as Record<string, unknown>, GOLDEN_FIXTURES.allFormsFy26Q3Cuban)];
  });
  await check('uscis.i485_by_office', async () => {
    const r = await parseByOffice(await readFixture('mirror/i485_performance_data_fy2026_q3_v1.xlsx', dir), { ...REF, url: `${MIRROR_DIR}i485_performance_data_fy2026_q3_v1.xlsx` });
    const h = r.stats.find((s) => s.officeCode === 'HIA');
    return h?.pending === GOLDEN_FIXTURES.byOfficeHialeahPending ? [] : [`HIA pending ${h?.pending} ≠ ${GOLDEN_FIXTURES.byOfficeHialeahPending}`];
  });
  await check('mirror.jzebedee', async () => {
    const r = await readProcessingTimes(await syntheticJzebedeeDb(dir), { url: 'https://github.com/jzebedee/uscis/releases', retrievedAt: REF.retrievedAt });
    const get = (form: string, sub: string, code: string) => r.records.find((x) => x.form === form && x.subtype === sub && x.officeCode === code)?.inquiryDate;
    const g = GOLDEN_FIXTURES.inquiry;
    return diff(
      { MIA: get('I-485', '131A-FAM', 'MIA'), HIA: get('I-485', '131A-FAM', 'HIA'), KND: get('I-485', '131A-FAM', 'KND'), TAM: get('I-485', '131A-FAM', 'TAM'), NBC_C9: get('I-765', '147-C9', 'NBC') },
      g,
    );
  });
  return out;
}
