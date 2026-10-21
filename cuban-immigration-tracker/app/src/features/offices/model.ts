/**
 * Pure office read-outs for S6 (00-product-spec.md S6; F10).
 *
 * - Office codes, names and states are READ from `offices.json` (the by-office workbook state
 *   headings, doc 04 §1.3 [F]); nothing is hard-coded (KEN vs KND, 02 §2.4).
 * - The yardstick is the I-485 `131A-FAM` (family-based) record: the closest published reference,
 *   because no Cuban-Adjustment subtype exists (doc 13 §1.3; key facts §6 rule 4).
 * - Humanitarian quarterly counts are Cuban + refugee + asylee together (doc 04 §1.3 [F]).
 * - The multiplier is the estimator's shrunk m̂_o with κ_o = `params.k0Office` (04 EST-11); fewer
 *   than `WEAK_OFFICE_N` (50) completions → "dato débil" (00 S6).
 */
import type { EstimatorParams, Office, OfficeQuarterStat, OfficesFile, ProcessingTimeRecord } from '@caa/data-schemas';
import { I485_SUBTYPE } from '@caa/case-rules';
import { WEAK_OFFICE_N } from '@caa/estimator';
import { quarterIndex } from '../home/shared/format';

export type OfficeMultiplier = EstimatorParams['officeMultipliers'][number];

export interface OfficeSummary {
  office: Office;
  /** The newest I-485 131A-FAM record for the office, or null. */
  yardstick: ProcessingTimeRecord | null;
  /** The office's quarterly humanitarian rows, oldest first. */
  quarters: OfficeQuarterStat[];
  latest: OfficeQuarterStat | null;
  multiplier: OfficeMultiplier | null;
  weak: boolean;
}

export function officeQuarters(file: OfficesFile, code: string): OfficeQuarterStat[] {
  return file.quarterly.filter((q) => q.officeCode === code).sort((a, b) => quarterIndex(a.quarter) - quarterIndex(b.quarter));
}

export function yardstickFor(file: OfficesFile, code: string): ProcessingTimeRecord | null {
  let best: ProcessingTimeRecord | null = null;
  for (const r of file.processingTimes) {
    if (r.form !== 'I-485' || r.subtype !== I485_SUBTYPE || r.officeCode !== code) continue;
    if (!best || r.publicationDate > best.publicationDate) best = r;
  }
  return best;
}

export function summarize(file: OfficesFile, params: EstimatorParams, office: Office): OfficeSummary {
  const quarters = officeQuarters(file, office.code);
  const multiplier = params.officeMultipliers.find((m) => m.code === office.code) ?? null;
  return {
    office,
    yardstick: yardstickFor(file, office.code),
    quarters,
    latest: quarters[quarters.length - 1] ?? null,
    multiplier,
    weak: multiplier ? multiplier.completions < WEAK_OFFICE_N : true,
  };
}

/** Latest humanitarian pending (for ordering; unknown → −1, last). */
function latestPending(s: OfficeSummary): number {
  return s.latest?.pending ?? -1;
}

/**
 * Cuban-focus offices first (key facts §6 list, flagged `cubanFocus` in the data), each group in
 * descending order of the latest humanitarian pending, then by name; the rest after them.
 */
export function orderedSummaries(file: OfficesFile, params: EstimatorParams): OfficeSummary[] {
  const all = file.offices.map((o) => summarize(file, params, o));
  const cmp = (a: OfficeSummary, b: OfficeSummary) => {
    if (a.office.cubanFocus !== b.office.cubanFocus) return a.office.cubanFocus ? -1 : 1;
    const d = latestPending(b) - latestPending(a);
    if (d !== 0) return d;
    return a.office.name < b.office.name ? -1 : a.office.name > b.office.name ? 1 : 0;
  };
  return all.sort(cmp);
}

/** The states present in a list, ordered by how many offices they have there (then A–Z). */
export function statesOf(list: OfficeSummary[]): string[] {
  const count = new Map<string, number>();
  for (const s of list) count.set(s.office.state, (count.get(s.office.state) ?? 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([st]) => st);
}

/** The 131A-FAM inquiry-date history of an office (doc 15 §2.2; for the crude ETA). */
export function inquiryHistory(file: OfficesFile, code: string): OfficesFile['inquiryDateHistory'][number] | null {
  return file.inquiryDateHistory.find((h) => h.officeCode === code && h.subtype === I485_SUBTYPE) ?? null;
}
