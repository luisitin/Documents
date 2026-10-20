/**
 * Office multipliers (04-estimation-model.md EST-11; doc 08 §11.5) and the office helpers of §5.
 *
 * r_o = (y_o / E_o) / r_G;  m̂_o = clamp((κ_o + y_o·r_o) / (κ_o + y_o), 0.5, 2), κ_o = 50
 * (`params.k0Office`; NOT the time origin k₀). y = approvals in the last two quarters (MVP basis),
 * E = mean of the two quarters' humanitarian pending ("Humanitarian-based" = Cuban + Refugee +
 * Asylee, doc 04 §1.3 [F]), G = cubanFocus offices with data in both quarters (key facts §6).
 * Golden T6: HIA 3 / 37,084 with G = 244 / 166,179 → r = 0.055, m̂ = 0.947; TAM 117 / 34,105 →
 * 1.936; clamp 5 → 2, 0.1 → 0.5. The key-facts §3 values are ALREADY shrunk: never shrink twice.
 */
import type { EstimatorParams, FiscalQuarter, Office, OfficeQuarterStat, OfficesFile, ProcessingTimeRecord } from '@caa/data-schemas';
import { cmpQuarter } from './dates';

/** EST-11 shrinkage + clamp. */
export function shrinkMultiplier(y: number, r: number, kappaOffice: number, clamp: readonly [number, number]): number {
  const m = (kappaOffice + y * r) / (kappaOffice + y);
  return Math.min(clamp[1], Math.max(clamp[0], m));
}

/** The last `n` distinct quarters present in `stats`, oldest first. */
export function lastQuarters(stats: OfficeQuarterStat[], n: number): FiscalQuarter[] {
  const seen = new Map<string, FiscalQuarter>();
  for (const s of stats) seen.set(`${s.quarter.fy}-${s.quarter.q}`, s.quarter);
  return Array.from(seen.values()).sort(cmpQuarter).slice(-n);
}

interface OfficeTotals { code: string; y: number; E: number; quarters: FiscalQuarter[] }

/** Offices with usable approvals and pending (> 0) in BOTH of the last two quarters. */
function completeOffices(stats: OfficeQuarterStat[]): OfficeTotals[] {
  const qs = lastQuarters(stats, 2);
  if (qs.length < 2) return [];
  const codes: string[] = [];
  for (const s of stats) if (!codes.includes(s.officeCode)) codes.push(s.officeCode);
  const out: OfficeTotals[] = [];
  for (const code of codes) {
    const rows = qs.map((q) => stats.find((s) => s.officeCode === code && cmpQuarter(s.quarter, q) === 0));
    if (rows.some((r) => !r || r.suppressed || r.approved === null || r.pending === null || r.pending <= 0)) continue;
    const ok = rows as OfficeQuarterStat[];
    out.push({ code, y: ok.reduce((a, r) => a + (r.approved ?? 0), 0), E: ok.reduce((a, r) => a + (r.pending ?? 0), 0) / ok.length, quarters: qs });
  }
  return out;
}

/**
 * EST-11 office multipliers. `group` = the candidate codes for G (cubanFocus offices); r_G uses only
 * group offices with complete data; a multiplier is returned for EVERY office with complete data in
 * both quarters (relative to r_G). Empty when G has no data.
 */
export function officeMultipliers(stats: OfficeQuarterStat[], group: string[], kappaOffice: number, clamp: [number, number]): EstimatorParams['officeMultipliers'] {
  const all = completeOffices(stats);
  const G = all.filter((o) => group.includes(o.code));
  const yG = G.reduce((a, o) => a + o.y, 0);
  const EG = G.reduce((a, o) => a + o.E, 0);
  if (!(yG > 0) || !(EG > 0)) return [];
  const rG = yG / EG;
  return all.map((o) => {
    const raw = o.y / o.E / rG;
    return { code: o.code, completions: o.y, avgPending: o.E, raw, shrunk: shrinkMultiplier(o.y, raw, kappaOffice, clamp), quarters: o.quarters, basis: 'approvals' as const };
  });
}

/** `params.officeGroup`: cubanFocus offices (key facts §6) with complete data in both quarters. */
export function officeGroup(offices: Office[], stats: OfficeQuarterStat[]): string[] {
  const complete = new Set(completeOffices(stats).map((o) => o.code));
  return offices.filter((o) => o.cubanFocus && complete.has(o.code)).map((o) => o.code);
}

/** Humanitarian pending of an office in the latest quarter of the file (04 §5.3 step 1), or null. */
export function latestPending(offices: OfficesFile, code: string): number | null {
  const q = lastQuarters(offices.quarterly, 1)[0];
  if (!q) return null;
  const row = offices.quarterly.find((s) => s.officeCode === code && cmpQuarter(s.quarter, q) === 0);
  return row && !row.suppressed && row.pending !== null ? row.pending : null;
}

/** EST-11 `dato débil` threshold (00 S3 item 10, S6): fewer than 50 completions. */
export const WEAK_OFFICE_N = 50;

/** The latest 131A-FAM record of an office (the I-485 yardstick proxy; doc 13 §1.3). */
export function yardstickRecord(records: ProcessingTimeRecord[], officeCode: string): ProcessingTimeRecord | null {
  let best: ProcessingTimeRecord | null = null;
  for (const r of records) {
    if (r.form !== 'I-485' || r.subtype !== '131A-FAM' || r.officeCode !== officeCode) continue;
    if (!best || r.publicationDate > best.publicationDate) best = r;
  }
  return best;
}
