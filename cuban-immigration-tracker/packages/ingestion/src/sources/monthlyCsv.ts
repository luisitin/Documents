/**
 * P1 — the monthly "Report to Congress — Number of Service-Wide Forms by Month, Form Status, and
 * Processing Time" CSV (03-data-pipeline.md §3.1; docs/research/04-uscis-data-sources.md §1.1 [F]).
 *
 * 1. UTF-8, leading BOM stripped, lines split on `\r?\n` (CRLF seen [F]).
 * 2. Title `For the Month of <Month> <YYYY>` → `ym`.
 * 3. Header must equal `Form Number,Description,Forms Received,Approvals,Denials,Pending,Pending Over
 *    6 Months,Avg. Processing Time` after trimming/collapsing whitespace (trailing empty cells, as in
 *    the Feb 2026 file, are ignored); otherwise `schema_mismatch`.
 * 4. `csv-parse` handles quotes and quoted thousands (`"355,520"`).
 * 5. Cuban row: Form Number `I-485` and Description ending with `(Cuban)` [F].
 * 6. I-765: the single national line, all categories; Mar–Apr 2025 rows carry
 *    `caveat: 'cxi_status_flips_2025_03_04'` (footnote 12: (c)(11) EAD status flips after the CHNV
 *    termination notices and the Doe v. Noem stay, doc 04 §1.1).
 * 7. Numbers: `,` removed; empty → null.  8. Source line `queried <Month YYYY>`.
 * Fixture (Q2): the August 2026 file parses to 1213 / 386 / 434 / 355520 / 345741 / 20.6.
 */
import { parse } from 'csv-parse/sync';
import type { I765NationalRow, MonthlyRow, SourceRef, YearMonth } from '@caa/data-schemas';
import { SourceError, monthNumber } from '../util';

export const MONTHLY_HEADER = ['Form Number', 'Description', 'Forms Received', 'Approvals', 'Denials', 'Pending', 'Pending Over 6 Months', 'Avg. Processing Time'];

/** Provenance attached to every parsed row (02 §1 SourceRef, minus `sourceId`/`period`/`evidence`, which the parser sets). */
export interface ParseRef {
  url: string;
  via: SourceRef['via'];
  retrievedAt: string;
  sha256?: string;
}

export interface MonthlyCsvResult {
  month: YearMonth;
  queried?: string;
  cuban: MonthlyRow;
  i765: I765NationalRow;
  footnotes: string[];
}

const norm = (s: unknown) => String(s ?? '').replace(/\s+/g, ' ').trim();

function decode(bytes: Uint8Array | string): string {
  const t = typeof bytes === 'string' ? bytes : new TextDecoder('utf-8').decode(bytes);
  return t.charCodeAt(0) === 0xfeff ? t.slice(1) : t;
}

/** `"355,520"` → 355520; `""` → null; anything else non-numeric → SourceError. */
export function parseCount(cell: unknown, what: string): number | null {
  const s = norm(cell).replace(/,/g, '');
  if (s === '') return null;
  const n = Number(s);
  if (!Number.isFinite(n)) throw new SourceError(`${what}: "${norm(cell)}" is not a number`);
  return n;
}

function requireCount(cell: unknown, what: string): number {
  const n = parseCount(cell, what);
  if (n === null || !Number.isInteger(n) || n < 0) throw new SourceError(`${what}: expected a non-negative whole number, got "${norm(cell)}"`);
  return n;
}

/** 03 §3.1. Pure function of the bytes plus the provenance `ref`. */
export function parseMonthlyCsv(bytes: Uint8Array | string, ref: ParseRef): MonthlyCsvResult {
  const text = decode(bytes);
  const lines = text.split(/\r?\n/);
  const titleIdx = lines.findIndex((l) => /For the Month of ([A-Za-z]+) (\d{4})/.test(l));
  if (titleIdx < 0) throw new SourceError('title line "For the Month of <Month> <YYYY>" not found');
  const tm = /For the Month of ([A-Za-z]+) (\d{4})/.exec(lines[titleIdx]!)!;
  const mo = monthNumber(tm[1]!);
  if (!mo) throw new SourceError(`unknown month name "${tm[1]}"`);
  const month: YearMonth = `${tm[2]}-${String(mo).padStart(2, '0')}`;

  const records = parse(lines.slice(titleIdx + 1).join('\n'), { relax_column_count: true, skip_empty_lines: true, bom: true }) as string[][];
  const hi = records.findIndex((r) => norm(r[0]) === 'Form Number');
  if (hi < 0) throw new SourceError('header line not found');
  const header = records[hi]!.map(norm);
  while (header.length && header[header.length - 1] === '') header.pop();
  if (header.join(',') !== MONTHLY_HEADER.join(',')) throw new SourceError(`header mismatch: "${header.join(',')}"`);

  const body = records.slice(hi + 1);
  const cubanRows = body.filter((r) => norm(r[0]) === 'I-485' && /\(Cuban\)$/.test(norm(r[1])));
  if (cubanRows.length !== 1) throw new SourceError(`expected exactly one "I-485 … (Cuban)" row, found ${cubanRows.length}`);
  const i765Rows = body.filter((r) => norm(r[0]) === 'I-765');
  if (i765Rows.length !== 1) throw new SourceError(`expected exactly one "I-765" row, found ${i765Rows.length}`);

  const source: SourceRef = { sourceId: 'uscis.monthly_csv', url: ref.url, via: ref.via, period: month, retrievedAt: ref.retrievedAt, ...(ref.sha256 ? { sha256: ref.sha256 } : {}), evidence: 'F' };
  const c = cubanRows[0]!;
  const cuban: MonthlyRow = {
    ym: month,
    received: requireCount(c[2], 'Cuban received'),
    approved: requireCount(c[3], 'Cuban approved'),
    denied: requireCount(c[4], 'Cuban denied'),
    pending: requireCount(c[5], 'Cuban pending'),
    pendingOver6: parseCount(c[6], 'Cuban pending over 6 months'),
    avgMonths: parseCount(c[7], 'Cuban avg months'),
    source,
  };
  const e = i765Rows[0]!;
  const i765: I765NationalRow = {
    ym: month,
    received: requireCount(e[2], 'I-765 received'),
    approved: requireCount(e[3], 'I-765 approved'),
    denied: requireCount(e[4], 'I-765 denied'),
    pending: requireCount(e[5], 'I-765 pending'),
    avgMonths: parseCount(e[7], 'I-765 avg months'),
    ...(month === '2025-03' || month === '2025-04' ? { caveat: 'cxi_status_flips_2025_03_04' as const } : {}),
    source: { ...source },
  };

  const footnotes = body.map((r) => norm(r[0])).filter((s) => /^\d+\)/.test(s));
  const queriedLine = body.map((r) => norm(r[0])).find((s) => /queried (\w+ \d{4})/.test(s));
  const queried = queriedLine ? /queried (\w+ \d{4})/.exec(queriedLine)![1] : undefined;
  return { month, ...(queried ? { queried } : {}), cuban, i765, footnotes };
}
