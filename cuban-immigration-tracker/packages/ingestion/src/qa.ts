/**
 * QA gates Q1–Q12 (03-data-pipeline.md §4). `fail` = do not publish that source's new output (it is
 * quarantined and the last good output is kept); `warn` = publish with a note. Every gate is a pure
 * function so each can be tested with a synthetic failing input; `runQa` aggregates.
 *
 * | Id | Check | Level |
 * |---|---|---|
 * | Q1 | zod valid; counts ≥ 0; dates not in the future; pendingOver6 ≤ pending | fail |
 * | Q2 | golden fixtures re-parse exactly (Aug 2026 row; FY26 Q3 Cuban row; Hialeah 37,486; MIA/NBC inquiry dates) | fail |
 * | Q3 | month continuity; a past month changes only with a new source sha → revision | fail on gap; warn on revision |
 * | Q4 | flow identity residual (historic ≤ 2.3 %, doc 08 §5.3) | warn > 3 %, fail > 10 % |
 * | Q5 | Σ 3 months vs the quarter for received/approved/denied | warn > 0.5 % |
 * | Q6 | monthly vs workbook pending gap (observed 3–4 %) | warn outside 1–6 % (data note) |
 * | Q7 | humanitarian national total = Cuban + Refugee + Asylum | warn |
 * | Q8 | mirror sha256 = direct sha256 when both fetched | fail (possible tampering) |
 * | Q9 | processing times: dates parseable; publication not older than the previous one | warn |
 * | Q10 | I-485 subtypes ⊆ the 7 known keys | warn + CAA_SUBTYPE_PRESENT candidate |
 * | Q11 | pending within ±25 % of the previous month | fail |
 * | Q12 | canary P(≤12) moved > 2 points without a new month or quarter | warn (human review) |
 */
import { parseDataFile, type DataFileName, type ISODate, type Localized, type MonthlyRow, type ProcessingTimeRecord, type QuarterRow } from '@caa/data-schemas';
import { KNOWN_I485_KEYS } from './constants';
import { monthsOfQuarter, quarterKey } from './util';

export type QaGateId = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Q5' | 'Q6' | 'Q7' | 'Q8' | 'Q9' | 'Q10' | 'Q11' | 'Q12';
export type QaLevel = 'pass' | 'warn' | 'fail';

export interface QaResult {
  id: QaGateId;
  /** Source key (03 §2.2) or data file the check is about. */
  source: string;
  level: QaLevel;
  message: string;
  /** Bilingual note published in `manifest.qa.notes` for warn/fail results shown to users. */
  note?: Localized;
}

const pass = (id: QaGateId, source: string, message: string): QaResult => ({ id, source, level: 'pass', message });

const MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthEs = (ym: string) => `${MES[Number(ym.slice(5, 7)) - 1]} de ${ym.slice(0, 4)}`;
const monthEn = (ym: string) => `${MON[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
const pctText = (x: number) => (Math.round(x * 1000) / 10).toFixed(1);

// ── Q1 ──────────────────────────────────────────────────────────────────────────────────────

/** Q1: the assembled file parses with its v1 schema (counts ≥ 0, pendingOver6 ≤ pending, …) and has no future dates. */
export function q1Validate(name: DataFileName, value: unknown, today: ISODate): QaResult {
  const r = parseDataFile(name, value);
  if (!r.ok) return { id: 'Q1', source: name, level: 'fail', message: `${name}.json fails its schema: ${r.issues.slice(0, 5).join('; ')}` };
  const thisMonth = today.slice(0, 7);
  const future: string[] = [];
  if (name === 'national') {
    const n = r.value as { rows: MonthlyRow[]; i765National: { ym: string }[] };
    for (const row of [...n.rows, ...n.i765National]) if (row.ym >= thisMonth) future.push(row.ym);
  }
  if (name === 'offices') {
    const o = r.value as { processingTimes: ProcessingTimeRecord[] };
    for (const p of o.processingTimes) if (p.publicationDate > today) future.push(p.publicationDate);
  }
  if (future.length) return { id: 'Q1', source: name, level: 'fail', message: `${name}.json has future periods: ${[...new Set(future)].join(', ')}` };
  return pass('Q1', name, `${name}.json valid`);
}

// ── Q2 (the expected values; the re-parse runs in qaFixtures.ts) ───────────────────────────

export const GOLDEN_FIXTURES = {
  monthlyAug2026: { ym: '2026-08', received: 1213, approved: 386, denied: 434, pending: 355520, pendingOver6: 345741, avgMonths: 20.6 },
  allFormsFy26Q3Cuban: { received: 6279, approved: 139, denied: 447, completions: 586, pendingWorkbook: 342360, medianMonths: 16.3 },
  byOfficeHialeahPending: 37486,
  inquiry: { MIA: '2023-06-17', HIA: '2024-07-05', KND: '2024-05-28', TAM: '2024-08-07', NBC_C9: '2025-06-13' },
} as const;

// ── Q3 ──────────────────────────────────────────────────────────────────────────────────────

const core = (r: MonthlyRow) => [r.received, r.approved, r.denied, r.pending, r.pendingOver6, r.avgMonths].join('|');

/**
 * Q3 for one parsed month against the published series: a new month must be `last + 1` (fail on a gap
 * inside the model window); a changed past month is a revision (warn) only when the source sha
 * changed; changed values from the SAME bytes mean the parser drifted (fail).
 */
export function q3Continuity(prev: MonthlyRow[], next: MonthlyRow, firstModelMonth: string, addMonth: (ym: string) => string): QaResult & { revision?: boolean } {
  const last = prev.at(-1);
  const existing = prev.find((r) => r.ym === next.ym);
  if (existing) {
    if (core(existing) === core(next)) return pass('Q3', 'uscis.monthly_csv', `${next.ym} unchanged`);
    if (existing.source.sha256 && next.source.sha256 && existing.source.sha256 === next.source.sha256) {
      return { id: 'Q3', source: 'uscis.monthly_csv', level: 'fail', message: `${next.ym}: values changed although the source sha is the same (parser drift)` };
    }
    return {
      id: 'Q3', source: 'uscis.monthly_csv', level: 'warn', revision: true, message: `${next.ym}: USCIS revised the month (new source file)`,
      note: { es: `USCIS revisó las cifras de ${monthEs(next.ym)}; se muestran las nuevas.`, en: `USCIS revised the ${monthEn(next.ym)} figures; the new ones are shown.` },
    };
  }
  if (!last || next.ym < last.ym) return pass('Q3', 'uscis.monthly_csv', `${next.ym} backfilled`);
  if (next.ym !== addMonth(last.ym) && last.ym >= firstModelMonth) {
    return { id: 'Q3', source: 'uscis.monthly_csv', level: 'fail', message: `gap: last published ${last.ym}, new ${next.ym}` };
  }
  return pass('Q3', 'uscis.monthly_csv', `${next.ym} follows ${last.ym}`);
}

// ── Q4 / Q11 ────────────────────────────────────────────────────────────────────────────────

/** Q4 flow identity |p_t − (p_{t−1} + received − approved − denied)| / p_t for consecutive months. */
export function q4FlowIdentity(prev: MonthlyRow, cur: MonthlyRow): QaResult {
  const expected = prev.pending + cur.received - cur.approved - cur.denied;
  const resid = cur.pending > 0 ? Math.abs(cur.pending - expected) / cur.pending : 0;
  const msg = `${cur.ym}: flow-identity residual ${pctText(resid)} %`;
  if (resid > 0.10) return { id: 'Q4', source: 'uscis.monthly_csv', level: 'fail', message: msg };
  if (resid > 0.03) {
    return { id: 'Q4', source: 'uscis.monthly_csv', level: 'warn', message: msg,
      note: { es: `En ${monthEs(cur.ym)} el inventario pendiente no cuadra con las entradas y salidas del mes (diferencia de ${pctText(resid)} %).`,
        en: `In ${monthEn(cur.ym)} the pending inventory does not match the month's flows (a ${pctText(resid)}% difference).` } };
  }
  return pass('Q4', 'uscis.monthly_csv', msg);
}

/** Q11: pending within ±25 % of the previous month. */
export function q11PendingJump(prev: MonthlyRow, cur: MonthlyRow): QaResult {
  const change = prev.pending > 0 ? (cur.pending - prev.pending) / prev.pending : 0;
  const msg = `${cur.ym}: pending ${prev.pending} → ${cur.pending} (${pctText(change)} %)`;
  return Math.abs(change) > 0.25 ? { id: 'Q11', source: 'uscis.monthly_csv', level: 'fail', message: msg } : pass('Q11', 'uscis.monthly_csv', msg);
}

// ── Q5 / Q6 / Q7 ────────────────────────────────────────────────────────────────────────────

/**
 * Q5: Σ of the quarter's 3 monthly rows vs the quarterly Cuban row, per flow. Tolerance 0.5 % with a
 * floor of 2 cases: the files agree to < 0.5 % in aggregate but differ by ±1 on tiny counts (FY26 Q2
 * denials 45 vs 46, doc 04 §1.1), which a purely relative test would flag.
 */
export function q5MonthlyVsQuarterly(monthly: MonthlyRow[], q: QuarterRow): QaResult {
  const months = monthsOfQuarter(q.quarter);
  const rows = months.map((m) => monthly.find((r) => r.ym === m));
  if (rows.some((r) => !r)) return pass('Q5', 'uscis.quarterly_all_forms', `${quarterKey(q.quarter)}: monthly rows incomplete, not compared`);
  const sum = (k: 'received' | 'approved' | 'denied') => rows.reduce((a, r) => a + r![k], 0);
  const bad: string[] = [];
  for (const k of ['received', 'approved', 'denied'] as const) {
    const m = sum(k);
    if (Math.abs(m - q[k]) > Math.max(0.005 * Math.max(m, q[k]), 2)) bad.push(`${k} monthly ${m} vs quarterly ${q[k]}`);
  }
  if (bad.length) return { id: 'Q5', source: 'uscis.quarterly_all_forms', level: 'warn', message: `${quarterKey(q.quarter)}: ${bad.join('; ')}`,
    note: { es: `Las cifras mensuales y trimestrales de ${quarterKey(q.quarter)} no coinciden del todo.`, en: `The monthly and quarterly ${quarterKey(q.quarter)} figures do not fully agree.` } };
  return pass('Q5', 'uscis.quarterly_all_forms', `${quarterKey(q.quarter)}: flows agree`);
}

/** Q6: (monthly pending at quarter end − workbook pending) / monthly pending, expected 1–6 %. */
export function q6PendingGap(monthly: MonthlyRow[], q: QuarterRow): QaResult {
  const end = monthsOfQuarter(q.quarter)[2]!;
  const m = monthly.find((r) => r.ym === end);
  if (!m || m.pending <= 0) return pass('Q6', 'uscis.quarterly_all_forms', `${quarterKey(q.quarter)}: no monthly row for ${end}`);
  const gap = (m.pending - q.pendingWorkbook) / m.pending;
  const msg = `${quarterKey(q.quarter)}: monthly ${m.pending} vs workbook ${q.pendingWorkbook} (gap ${pctText(gap)} %)`;
  if (gap < 0.01 || gap > 0.06) {
    return { id: 'Q6', source: 'uscis.quarterly_all_forms', level: 'warn', message: msg,
      note: { es: `El pendiente del informe trimestral (${quarterKey(q.quarter)}) difiere del mensual en ${pctText(gap)} %, fuera del margen habitual de 3–4 %.`,
        en: `The quarterly-report pending (${quarterKey(q.quarter)}) differs from the monthly one by ${pctText(gap)}%, outside the usual 3–4% gap.` } };
  }
  return pass('Q6', 'uscis.quarterly_all_forms', msg);
}

/** Q7: the by-office national humanitarian total equals Cuban + Refugee + Asylum of the all-forms workbook, to the unit. */
export function q7Humanitarian(total: { received: number | null; approved: number | null; denied: number | null; pending: number | null }, rows: QuarterRow[]): QaResult {
  const pick = (f: QuarterRow['form']) => rows.find((r) => r.form === f);
  const parts = [pick('I-485 (Cuban)'), pick('I-485 (Refugee)'), pick('I-485 (Asylum)')];
  if (parts.some((p) => !p)) return pass('Q7', 'uscis.i485_by_office', 'all-forms rows for the quarter not available; not compared');
  const s = (k: 'received' | 'approved' | 'denied' | 'pendingWorkbook') => parts.reduce((a, p) => a + p![k], 0);
  const diffs: string[] = [];
  if (total.received !== s('received')) diffs.push(`received ${total.received} ≠ ${s('received')}`);
  if (total.approved !== s('approved')) diffs.push(`approved ${total.approved} ≠ ${s('approved')}`);
  if (total.denied !== s('denied')) diffs.push(`denied ${total.denied} ≠ ${s('denied')}`);
  if (total.pending !== s('pendingWorkbook')) diffs.push(`pending ${total.pending} ≠ ${s('pendingWorkbook')}`);
  return diffs.length ? { id: 'Q7', source: 'uscis.i485_by_office', level: 'warn', message: `humanitarian total: ${diffs.join('; ')}` } : pass('Q7', 'uscis.i485_by_office', 'humanitarian total = Cuban + Refugee + Asylum');
}

// ── Q8 / Q9 / Q10 / Q12 ─────────────────────────────────────────────────────────────────────

export function q8MirrorSha(source: string, direct: string | undefined, mirror: string | undefined): QaResult {
  if (!direct || !mirror) return pass('Q8', source, 'mirror and direct not both fetched');
  if (direct !== mirror) return { id: 'Q8', source, level: 'fail', message: `mirror sha ${mirror.slice(0, 12)}… ≠ direct sha ${direct.slice(0, 12)}… (possible tampering)` };
  return pass('Q8', source, 'mirror is byte-identical to USCIS');
}

export function q9ProcessingTimes(records: ProcessingTimeRecord[], droppedRows: number, previousLatest: ISODate | null): QaResult {
  const issues: string[] = [];
  if (droppedRows > 0) issues.push(`${droppedRows} rows with unparseable dates or codes`);
  const latest = records.reduce<string | null>((m, r) => (m === null || r.publicationDate > m ? r.publicationDate : m), null);
  if (previousLatest && latest && latest < previousLatest) issues.push(`publication ${latest} is older than the previous ${previousLatest}`);
  if (records.some((r) => r.months80 !== null && (r.months80 <= 0 || r.months80 > 240))) issues.push('a months80 value is outside (0, 240]');
  return issues.length ? { id: 'Q9', source: 'mirror.jzebedee', level: 'warn', message: issues.join('; ') } : pass('Q9', 'mirror.jzebedee', `publication ${latest ?? 'none'}`);
}

export function q10Subtypes(keys: string[]): QaResult & { unknown: string[] } {
  const unknown = keys.filter((k) => !(KNOWN_I485_KEYS as readonly string[]).includes(k));
  return unknown.length
    ? { id: 'Q10', source: 'mirror.jzebedee', level: 'warn', unknown, message: `I-485 subtypes outside the 7 known keys: ${unknown.join(', ')} (CAA_SUBTYPE_PRESENT)` }
    : { ...pass('Q10', 'mirror.jzebedee', 'I-485 subtypes ⊆ known keys'), unknown };
}

export function q12Canary(prev: { pWithin12: number } | null, next: { pWithin12: number }, newMonthOrQuarter: boolean): QaResult {
  if (!prev) return pass('Q12', 'canary', 'no previous canary');
  const d = Math.abs(next.pWithin12 - prev.pWithin12);
  const msg = `canary P(≤12) ${prev.pWithin12.toFixed(5)} → ${next.pWithin12.toFixed(5)}`;
  return d > 0.02 && !newMonthOrQuarter ? { id: 'Q12', source: 'canary', level: 'warn', message: `${msg} without a new month or quarter (human review)` } : pass('Q12', 'canary', msg);
}

// ── aggregation ─────────────────────────────────────────────────────────────────────────────

export interface QaReport {
  status: 'ok' | 'degraded' | 'quarantined';
  results: QaResult[];
  notes: Localized[];
}

/** 07 WP5 `runQa`: aggregate gate results → manifest `qa.status` and the de-duplicated notes. */
export function runQa(results: QaResult[]): QaReport {
  const status = results.some((r) => r.level === 'fail') ? 'quarantined' : results.some((r) => r.level === 'warn') ? 'degraded' : 'ok';
  const notes: Localized[] = [];
  for (const r of results) if (r.note && r.level !== 'pass' && !notes.some((n) => n.en === r.note!.en)) notes.push(r.note);
  return { status, results, notes };
}
