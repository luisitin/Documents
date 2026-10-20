/**
 * Data guards and confidence (02-data-model.md §4; 04-estimation-model.md §9 T20, §10.3;
 * 00-product-spec.md banner table).
 *
 * - T20a: today − end(latestOfficialMonth) > 75 days ("USCIS no ha publicado datos mensuales
 *   nuevos desde {mes}"); with Aug 2026 data it trips on 2026-11-15. Confidence → LOW.
 * - T20b: the latest monthly row is more than one quarter past the latest quarterly file
 *   (Aug 2026 vs FY26 Q3 = Jun 2026 passes; Oct 2026 vs Jun 2026 trips); `months` lists the
 *   un-cross-checked months.
 * - pipeline_late: today − manifest.lastCheckedAt > 10 days.
 * - artifact_old: manifest.artifactBuiltAt older than 35 days (web artifact only).
 * - qa_degraded: manifest.qa.status ≠ 'ok'.  · sample_data: data.status = 'sample'.
 * Confidence (§10.3): LOW by default and always while T20a trips or the sample is in use; MEDIUM
 * needs ≥ 6 months of R4 data, ≥ 6 PIT-not-rejected scored months and ≥ 30 crowd decisions in the
 * user's office group; HIGH additionally needs the backtest (validated_current) and 12 scored months.
 */
import type { DataStatus, EstimateOk, EstimatorParams, FiscalQuarter, ISODate, Manifest, QuarterlyFile, YearMonth } from '@caa/data-schemas';
import { addMonths, cmpQuarter, daysBetween, endOfMonth, monthsBetween, quarterEndMonth } from './dates';

export type Guard = EstimateOk['guards'][number];

export const T20A_MAX_DAYS = 75;
export const T20B_MAX_MONTHS = 3;
export const PIPELINE_LATE_DAYS = 10;
export const ARTIFACT_OLD_DAYS = 35;

/** The latest I-485 (Cuban) quarter of the quarterly file, else the manifest's. */
export function latestQuarter(quarterly: QuarterlyFile, manifest: Manifest): FiscalQuarter {
  let best: FiscalQuarter | null = null;
  for (const r of quarterly.rows) {
    if (r.form !== 'I-485 (Cuban)') continue;
    if (!best || cmpQuarter(r.quarter, best) > 0) best = r.quarter;
  }
  return best ?? manifest.latestOfficialQuarter;
}

/** 02 §4 guards, computed from the data layer's status and files and `today` only. */
export function computeGuards(a: { today: ISODate; dataThrough: YearMonth; quarterly: QuarterlyFile; status: DataStatus; manifest: Manifest }): Guard[] {
  const out: Guard[] = [];
  const latest = a.manifest.latestOfficialMonth > a.dataThrough ? a.manifest.latestOfficialMonth : a.dataThrough;
  if (daysBetween(endOfMonth(latest), a.today) > T20A_MAX_DAYS) out.push({ id: 'T20a', months: [latest] });
  const qEnd = quarterEndMonth(latestQuarter(a.quarterly, a.manifest));
  const gap = monthsBetween(qEnd, a.dataThrough);
  if (gap > T20B_MAX_MONTHS) {
    const months: YearMonth[] = [];
    for (let i = 1; i <= gap; i++) months.push(addMonths(qEnd, i));
    out.push({ id: 'T20b', months });
  }
  if (daysBetween(a.manifest.lastCheckedAt.slice(0, 10), a.today) > PIPELINE_LATE_DAYS) out.push({ id: 'pipeline_late' });
  if (a.manifest.artifactBuiltAt !== undefined && daysBetween(a.manifest.artifactBuiltAt.slice(0, 10), a.today) > ARTIFACT_OLD_DAYS) out.push({ id: 'artifact_old' });
  if (a.manifest.qa.status !== 'ok') out.push({ id: 'qa_degraded' });
  if (a.status === 'sample') out.push({ id: 'sample_data' });
  return out;
}

/** 04 §10.3 confidence level; `groupKeys` are the case's office-group keys to look up crowd counts. */
export function confidenceLevel(guards: Guard[], params: EstimatorParams, groupKeys: string[]): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (guards.some((g) => g.id === 'T20a' || g.id === 'sample_data')) return 'LOW';
  const gates = params.confidenceGates;
  let crowd = 0;
  for (const k of groupKeys) crowd = Math.max(crowd, gates.crowdDecisionsByOfficeGroup[k] ?? 0);
  const medium = gates.r4MonthsOfData >= 6 && gates.pitNotRejectedMonths >= 6 && crowd >= 30;
  if (!medium) return 'LOW';
  return params.validation.status === 'validated_current' && gates.pitNotRejectedMonths >= 12 ? 'HIGH' : 'MEDIUM';
}
