/**
 * P3 — the quarterly I-485 workbook by field office (03-data-pipeline.md §3.3;
 * docs/research/04-uscis-data-sources.md §1.3 [F]).
 *
 * 1. Sheet `I485_by_State` (A1:V178 [F]).
 * 2. A STATE heading is a single-cell text row naming a state; office rows are
 *    `Office name | Field Office Code | 4 blocks × (Received, Approved, Denied, Pending) | Total block`;
 *    then a "Service Center" block (WSC California, NBC, NSC Nebraska, YSC Potomac, SSC Texas, ESC
 *    Vermont — some service centers are NAMED after a state, so a row with a code is never a heading).
 * 3. The THIRD block is "Humanitarian-based" (= Cuban + Refugee + Asylee exactly, doc 04 §1.3 [F]).
 *    A cell `D` ("Disclosure standards not met", files up to FY2025 Q2) → `suppressed: true`, value null.
 * 4. `offices[]` (code READ from the file, never hard-coded: KEN vs KND, key facts §6 rule 1) and
 *    `stateOffices[state] = codes[]` (field offices only), the verified state → office mapping of the
 *    state mixture (04 §5.3).
 * 5. The national humanitarian total (the "Total" row) is returned for Q7.
 * Fixture: Hialeah FY26 Q3 humanitarian pending 37,486.
 */
import type { FiscalQuarter, Office, OfficeQuarterStat } from '@caa/data-schemas';
import { CUBAN_FOCUS_OFFICES, STATE_CODES } from '../constants';
import { SourceError } from '../util';
import type { ParseRef } from './monthlyCsv';
import { countCell, quarterFromTitle, readWorkbook } from './xlsx';

/** Column index of the first cell of each block (A = 0): Family C, Employment G, Humanitarian K, Others O, Total S. */
export const BLOCK_START = { family: 2, employment: 6, humanitarian: 10, others: 14, total: 18 } as const;

export interface ByOfficeResult {
  quarter: FiscalQuarter;
  offices: Office[];
  stateOffices: Record<string, string[]>;
  stats: OfficeQuarterStat[];
  /** Humanitarian-based national total (Total row), for Q7. */
  nationalHumanitarian: { received: number | null; approved: number | null; denied: number | null; pending: number | null };
  /** Service-center rows whose state the file does not give (NBC, YSC): stats kept out of `offices`. */
  unplacedServiceCenters: string[];
}

const text = (v: unknown) => (v === null || v === undefined ? '' : String(v).replace(/\s+/g, ' ').trim());

/** Service-center name → state, only where the workbook's own label is a state name (doc 04 §1.3). */
function serviceCenterState(name: string): string | null {
  return STATE_CODES[name] ?? null;
}

/** 03 §3.3. */
export async function parseByOffice(bytes: Uint8Array, ref: ParseRef): Promise<ByOfficeResult> {
  const sheets = await readWorkbook(bytes);
  const sheet = sheets.find((s) => s.name === 'I485_by_State');
  if (!sheet) throw new SourceError(`sheet I485_by_State not found (sheets: ${sheets.map((s) => s.name).join(', ')})`);
  const grid = sheet.grid;
  const quarter = quarterFromTitle(grid);
  const source = { sourceId: 'uscis.i485_by_office' as const, url: ref.url, via: ref.via, period: quarter, retrievedAt: ref.retrievedAt, ...(ref.sha256 ? { sha256: ref.sha256 } : {}), evidence: 'F' as const };

  const block = (row: (string | number | null)[], start: number) => {
    const cells = [0, 1, 2, 3].map((i) => countCell(row[start + i]));
    return { received: cells[0]!, approved: cells[1]!, denied: cells[2]!, pending: cells[3]! };
  };

  const offices: Office[] = [];
  const stateOffices: Record<string, string[]> = {};
  const stats: OfficeQuarterStat[] = [];
  const unplaced: string[] = [];
  let nationalHumanitarian: ByOfficeResult['nationalHumanitarian'] | null = null;
  let state: string | null = null;
  let inServiceCenters = false;
  const seen = new Set<string>();

  for (const row of grid) {
    const a = text(row[0]);
    const code = text(row[1]);
    const rest = row.slice(2).filter((v) => v !== null && v !== '');
    if (!a) continue;
    if (a === 'Total' && !code && rest.length) {
      const h = block(row, BLOCK_START.humanitarian);
      nationalHumanitarian = { received: h.received.value, approved: h.approved.value, denied: h.denied.value, pending: h.pending.value };
      continue;
    }
    if (!code && rest.length === 0) {
      if (/^Service Centers?$/i.test(a)) { inServiceCenters = true; state = null; continue; }
      if (!inServiceCenters && STATE_CODES[a]) state = STATE_CODES[a]!;
      continue;
    }
    if (!/^[A-Z]{3}$/.test(code)) continue; // footnotes, headers
    if (seen.has(code)) throw new SourceError(`office code ${code} appears twice`);
    seen.add(code);
    const h = block(row, BLOCK_START.humanitarian);
    const suppressed = h.received.suppressed || h.approved.suppressed || h.denied.suppressed || h.pending.suppressed;
    const stat: OfficeQuarterStat = {
      officeCode: code, quarter,
      received: h.received.value, approved: h.approved.value, denied: h.denied.value, pending: h.pending.value,
      suppressed, source,
    };
    if (inServiceCenters) {
      const st = serviceCenterState(a);
      if (!st) { unplaced.push(code); continue; }
      offices.push({ code, name: a, state: st, cubanFocus: false, kind: 'service_center' });
      stats.push(stat);
      continue;
    }
    if (!state) throw new SourceError(`office row ${code} before any state heading`);
    offices.push({ code, name: a, state, cubanFocus: (CUBAN_FOCUS_OFFICES as readonly string[]).includes(code), kind: 'field_office' });
    (stateOffices[state] ??= []).push(code);
    stats.push(stat);
  }
  if (!nationalHumanitarian) throw new SourceError('"Total" row not found');
  if (!offices.some((o) => o.kind === 'field_office')) throw new SourceError('no field-office rows found');
  return { quarter, offices, stateOffices, stats, nationalHumanitarian, unplacedServiceCenters: unplaced };
}
