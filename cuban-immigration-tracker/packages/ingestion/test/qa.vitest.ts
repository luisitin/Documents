/**
 * QA gates Q1–Q12 (03 §4): each gate passes on the real data and trips on a synthetic failing input.
 */
import type { MonthlyRow, ProcessingTimeRecord, QuarterRow } from '@caa/data-schemas';
import { describe, expect, it } from 'vitest';
import { runGoldenFixtures } from '../src/fixtures';
import {
  q1Validate, q3Continuity, q4FlowIdentity, q5MonthlyVsQuarterly, q6PendingGap, q7Humanitarian, q8MirrorSha, q9ProcessingTimes, q10Subtypes,
  q11PendingJump, q12Canary, runQa,
} from '../src/qa';
import { addMonthsYm } from '../src/util';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { APP_SAMPLE, FIX, readJson } from './helpers';

const src = { sourceId: 'uscis.monthly_csv' as const, url: 'https://x.test/a.csv', via: 'direct' as const, retrievedAt: '2026-10-20T00:00:00Z', evidence: 'F' as const };
const row = (ym: string, o: Partial<MonthlyRow> = {}): MonthlyRow => ({ ym, received: 1213, approved: 386, denied: 434, pending: 355520, pendingOver6: 345741, avgMonths: 20.6, source: { ...src, sha256: 'a'.repeat(64) }, ...o });
const next = (ym: string) => addMonthsYm(ym, 1);
const qrow = (o: Partial<QuarterRow> = {}): QuarterRow => ({ quarter: { fy: 2026, q: 3 }, form: 'I-485 (Cuban)', received: 6279, approved: 139, denied: 447, completions: 586, pendingWorkbook: 342360, medianMonths: 16.3, source: { ...src, sourceId: 'uscis.quarterly_all_forms' }, ...o });

describe('Q1 schema + no future dates', () => {
  it('passes the bundled national.json and fails a negative count or a future month', async () => {
    const n = await readJson<{ rows: MonthlyRow[] }>(join(APP_SAMPLE, 'national.json'));
    expect(q1Validate('national', n, '2026-10-20').level).toBe('pass');
    const neg = structuredClone(n); neg.rows[0]!.received = -1;
    expect(q1Validate('national', neg, '2026-10-20').level).toBe('fail');
    const over = structuredClone(n); over.rows[0]!.pendingOver6 = over.rows[0]!.pending + 1;
    expect(q1Validate('national', over, '2026-10-20').level).toBe('fail');
    expect(q1Validate('national', n, '2026-08-15').level).toBe('fail'); // Aug 2026 row is in the "future"
  });
});

describe('Q2 golden re-parse', () => {
  it('fails when a fixture no longer reproduces the golden numbers', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'caa-q2-'));
    await cp(FIX, dir, { recursive: true });
    const text = (await readFile(join(FIX, 'mirror', 'monthly_august_2026.csv'), 'utf8')).replace('"355,520"', '"355,521"');
    await writeFile(join(dir, 'mirror', 'monthly_august_2026.csv'), text);
    const r = await runGoldenFixtures(dir);
    expect(r.find((x) => x.source === 'uscis.monthly_csv')).toMatchObject({ level: 'fail', message: expect.stringContaining('pending 355521 ≠ 355520') });
    expect(r.filter((x) => x.level === 'pass')).toHaveLength(3);
    await rm(dir, { recursive: true, force: true });
  });
});

describe('Q3 continuity / revisions', () => {
  const series = [row('2026-07', { pending: 355379 }), row('2026-08')];
  it('passes the next month, fails a gap inside the model window', () => {
    expect(q3Continuity(series, row('2026-09'), '2024-09', next).level).toBe('pass');
    expect(q3Continuity(series, row('2026-10'), '2024-09', next)).toMatchObject({ level: 'fail', message: expect.stringContaining('gap') });
    expect(q3Continuity([row('2024-07')], row('2024-09'), '2024-09', next).level).toBe('pass'); // Aug 2024 gap is before the window
  });
  it('a past month with a NEW sha is a revision (warn, with a bilingual note); same sha + new values is parser drift (fail)', () => {
    const revised = row('2026-08', { pending: 355600, source: { ...src, sha256: 'b'.repeat(64) } });
    expect(q3Continuity(series, revised, '2024-09', next)).toMatchObject({ level: 'warn', revision: true, note: { es: expect.stringContaining('agosto de 2026') } });
    expect(q3Continuity(series, row('2026-08', { pending: 355600 }), '2024-09', next).level).toBe('fail');
    expect(q3Continuity(series, row('2026-08'), '2024-09', next).level).toBe('pass');
  });
});

describe('Q4 flow identity, Q11 pending jump', () => {
  it('real Jul → Aug 2026 passes (residual ≈ 0.07 %)', () => {
    expect(q4FlowIdentity(row('2026-07', { pending: 355379 }), row('2026-08')).level).toBe('pass');
    expect(q11PendingJump(row('2026-07', { pending: 355379 }), row('2026-08')).level).toBe('pass');
  });
  it('warn above 3 %, fail above 10 %; pending ±25 % fails Q11', () => {
    const prev = row('2026-07', { pending: 355379 });
    expect(q4FlowIdentity(prev, row('2026-08', { pending: 355772 * 1.05 | 0 })).level).toBe('warn');
    expect(q4FlowIdentity(prev, row('2026-08', { pending: 400000 })).level).toBe('fail');
    expect(q11PendingJump(prev, row('2026-08', { pending: 460000 })).level).toBe('fail');
  });
});

describe('Q5–Q7 cross-product checks', () => {
  const months = [row('2026-04', { received: 2665, approved: 23, denied: 38, pending: 353450 }), row('2026-05', { received: 1846, approved: 27, denied: 129, pending: 354649 }), row('2026-06', { received: 1774, approved: 89, denied: 281, pending: 355371 })];
  it('Q5: FY26 Q3 monthly sums 6,285 / 139 / 448 agree with the workbook 6,279 / 139 / 447; a big gap warns', () => {
    expect(q5MonthlyVsQuarterly(months, qrow()).level).toBe('pass');
    expect(q5MonthlyVsQuarterly(months, qrow({ received: 7000 })).level).toBe('warn');
    expect(q5MonthlyVsQuarterly(months.slice(0, 2), qrow()).level).toBe('pass'); // incomplete → not compared
  });
  it('Q6: gap 3.7 % passes; outside 1–6 % warns with a data note', () => {
    expect(q6PendingGap(months, qrow()).level).toBe('pass');
    const w = q6PendingGap(months, qrow({ pendingWorkbook: 355000 }));
    expect(w.level).toBe('warn');
    expect(w.note!.es).toContain(' %');
  });
  it('Q7: humanitarian total = Cuban + Refugee + Asylum to the unit', () => {
    const rows = [qrow(), qrow({ form: 'I-485 (Refugee)', received: 16819, approved: 103, denied: 45, pendingWorkbook: 149470 }), qrow({ form: 'I-485 (Asylum)', received: 15141, approved: 2350, denied: 292, pendingWorkbook: 126267 })];
    expect(q7Humanitarian({ received: 38239, approved: 2592, denied: 784, pending: 618097 }, rows).level).toBe('pass');
    expect(q7Humanitarian({ received: 38239, approved: 2592, denied: 784, pending: 618098 }, rows).level).toBe('warn');
  });
});

describe('Q8–Q12', () => {
  it('Q8: mirror sha ≠ direct sha fails (possible tampering)', () => {
    expect(q8MirrorSha('x', 'a', 'a').level).toBe('pass');
    expect(q8MirrorSha('x', 'a', undefined).level).toBe('pass');
    expect(q8MirrorSha('x', 'a'.repeat(64), 'b'.repeat(64)).level).toBe('fail');
  });
  it('Q9: an older publication than the previous one, or dropped rows, warn', () => {
    const rec = { form: 'I-485', subtype: '131A-FAM', officeCode: 'MIA', months80: 30, inquiryDate: '2023-06-17', publicationDate: '2026-10-15', isProxyForCaa: true, source: { ...src, sourceId: 'mirror.jzebedee' } } as ProcessingTimeRecord;
    expect(q9ProcessingTimes([rec], 0, '2026-09-25').level).toBe('pass');
    expect(q9ProcessingTimes([rec], 0, '2026-11-01').level).toBe('warn');
    expect(q9ProcessingTimes([rec], 2, null).level).toBe('warn');
  });
  it('Q10: an I-485 key outside the 7 known → warn + CAA_SUBTYPE_PRESENT', () => {
    expect(q10Subtypes(['131A', '131A-FAM']).level).toBe('pass');
    const r = q10Subtypes(['131A-FAM', '131A-CAA']);
    expect(r).toMatchObject({ level: 'warn', unknown: ['131A-CAA'], message: expect.stringContaining('CAA_SUBTYPE_PRESENT') });
  });
  it('Q12: canary moving > 2 points without a new month or quarter warns', () => {
    expect(q12Canary({ pWithin12: 0.0923 }, { pWithin12: 0.13 }, false).level).toBe('warn');
    expect(q12Canary({ pWithin12: 0.0923 }, { pWithin12: 0.13 }, true).level).toBe('pass');
    expect(q12Canary({ pWithin12: 0.0923 }, { pWithin12: 0.095 }, false).level).toBe('pass');
  });
  it('runQa: fail → quarantined, warn → degraded, else ok; notes de-duplicated', () => {
    const warn = q10Subtypes(['X']);
    expect(runQa([q8MirrorSha('x', 'a', 'a')]).status).toBe('ok');
    expect(runQa([warn]).status).toBe('degraded');
    expect(runQa([warn, q8MirrorSha('x', 'a', 'b')]).status).toBe('quarantined');
    const n = q6PendingGap([row('2026-06', { pending: 355371 })], qrow({ pendingWorkbook: 355000 }));
    expect(runQa([n, n]).notes).toHaveLength(1);
  });
});
