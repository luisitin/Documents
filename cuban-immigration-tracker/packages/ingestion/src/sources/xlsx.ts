/**
 * Shared XLSX reading for the two USCIS workbooks (exceljs 4.4.0; 03-data-pipeline.md §3.2–§3.3).
 * Cells may be numbers, strings, rich text (headers with superscript footnote marks) or formulas.
 */
import ExcelJS from 'exceljs';
import type { FiscalQuarter } from '@caa/data-schemas';
import { SourceError, monthNumber } from '../util';

export type Grid = (string | number | null)[][];

type CellLike = ExcelJS.CellValue;

/** The plain value of one cell: numbers stay numbers, everything else becomes trimmed text. */
export function cellValue(v: CellLike): string | number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return v.replace(/\s+/g, ' ').trim();
  if (typeof v === 'boolean') return String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const o = v as unknown as Record<string, unknown>;
  if (Array.isArray(o.richText)) return (o.richText as { text: string }[]).map((t) => t.text).join('').replace(/\s+/g, ' ').trim();
  if ('result' in o) return cellValue(o.result as CellLike);
  if (typeof o.text === 'string') return o.text.replace(/\s+/g, ' ').trim();
  return null;
}

/** Loads a workbook and returns each sheet as a dense grid (row 1 → index 0, column A → index 0). */
export async function readWorkbook(bytes: Uint8Array): Promise<{ name: string; grid: Grid }[]> {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength) as unknown as ExcelJS.Buffer);
  } catch (e) {
    throw new SourceError(`not a readable XLSX workbook (${(e as Error).message})`);
  }
  return wb.worksheets.map((ws) => {
    const grid: Grid = [];
    ws.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      const vals = (row.values as CellLike[]).slice(1).map(cellValue);
      grid[rowNumber - 1] = vals;
    });
    for (let i = 0; i < grid.length; i++) grid[i] ??= [];
    return { name: ws.name, grid };
  });
}

/** A count cell: number → integer; `D` (disclosure standards not met) → suppressed; blank/N/A → null. */
export function countCell(v: string | number | null | undefined): { value: number | null; suppressed: boolean } {
  if (v === null || v === undefined || v === '') return { value: null, suppressed: false };
  if (typeof v === 'number') return { value: v, suppressed: false };
  const s = v.trim();
  if (s === 'D') return { value: null, suppressed: true };
  if (/^n\/?a$/i.test(s) || s === '-' || s === '') return { value: null, suppressed: false };
  const n = Number(s.replace(/,/g, ''));
  if (!Number.isFinite(n)) throw new SourceError(`"${s}" is not a count`);
  return { value: n, suppressed: false };
}

const PERIOD = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s*(\d{4})\s*[-–—]\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s*(\d{4})/i;

/**
 * The fiscal quarter of a title such as "April 1, 2026 - June 30, 2026" (FY = Oct 1 – Sep 30;
 * doc 04 §1.5). Requires a three-month span that ends on a quarter end.
 */
export function quarterFromTitle(grid: Grid): FiscalQuarter {
  for (const row of grid.slice(0, 8)) {
    for (const cell of row) {
      if (typeof cell !== 'string') continue;
      const m = PERIOD.exec(cell);
      if (!m) continue;
      const endMonth = monthNumber(m[4]!)!;
      const endYear = Number(m[6]);
      const startMonth = monthNumber(m[1]!)!;
      if (![3, 6, 9, 12].includes(endMonth) || (endMonth - startMonth + 12) % 12 !== 2) throw new SourceError(`period "${m[0]}" is not a fiscal quarter`);
      const fy = endMonth >= 10 ? endYear + 1 : endYear;
      const q = (endMonth === 12 ? 1 : endMonth === 3 ? 2 : endMonth === 6 ? 3 : 4) as FiscalQuarter['q'];
      return { fy, q };
    }
  }
  throw new SourceError('period line "<Month> <D>, <YYYY> - <Month> <D>, <YYYY>" not found in the title rows');
}
