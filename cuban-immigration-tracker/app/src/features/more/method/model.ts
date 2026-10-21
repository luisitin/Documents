/**
 * Pure read-outs for S11 Cómo calculamos y datos / Method and data (00-product-spec.md S11, F22).
 *
 * Little's law (doc 08 §5.1 [T]; 04 §6.1 "Research conflict (S2 label)"; golden T12, 04 §9.2):
 * months to clear the pending pool = pending ÷ completions per month, shown ONLY here and always
 * as a set of single-pace lines, never as a forecast (00 S1 must-fix). On the frozen sample:
 * - latest month: 355,520 / 820 = 433.56 → "~434";
 * - the most recent complete fiscal year in the data: FY2025 (Oct 2024–Sep 2025) 78,291 / 12 =
 *   6,524.25 per month → 54.49 → "~54";
 * - the late-2024 pace = the plateau of scenario S2 (9,200 per month; 04 §6.1) → 38.64 → "~39".
 * The three lines are computed from the data and policy files, so they follow new months.
 */
import type { MonthlyRow, NationalFile, PolicyFile, ScenarioDef, YearMonth } from '@caa/data-schemas';
import { littlesLawMonths } from '@caa/estimator';
import { byYm } from '../../home/shared/format';

export interface LittleLine {
  /** Completions per month used for the line. */
  perMonth: number;
  /** pending / perMonth, in months. */
  months: number;
}

export interface LittlesLaw {
  pending: number;
  month: YearMonth;
  latest: LittleLine;
  /** The most recent complete federal fiscal year (Oct–Sep) in the series, or null. */
  fiscalYear: (LittleLine & { fy: number }) | null;
  /** The plateau of the late-2024-pace scenario (S2), or null if it has no ramp. */
  scenario: (LittleLine & { def: ScenarioDef }) | null;
}

const completions = (r: MonthlyRow) => r.approved + r.denied;

/** Federal fiscal year of a month: Oct–Dec belong to the next calendar year's FY. */
export function fiscalYearOf(ym: YearMonth): number {
  const y = Number(ym.slice(0, 4));
  const m = Number(ym.slice(5, 7));
  return m >= 10 ? y + 1 : y;
}

/** Average monthly completions of the most recent fiscal year that has all 12 rows. */
export function latestCompleteFiscalYear(rows: readonly MonthlyRow[]): { fy: number; perMonth: number } | null {
  const byFy = new Map<number, MonthlyRow[]>();
  for (const r of rows) {
    const fy = fiscalYearOf(r.ym);
    byFy.set(fy, [...(byFy.get(fy) ?? []), r]);
  }
  const complete = [...byFy.entries()].filter(([, rs]) => new Set(rs.map((r) => r.ym)).size === 12).sort((a, b) => b[0] - a[0]);
  const first = complete[0];
  if (!first) return null;
  const total = first[1].reduce((s, r) => s + completions(r), 0);
  return { fy: first[0], perMonth: total / 12 };
}

export function littlesLaw(national: NationalFile, policy: PolicyFile): LittlesLaw | null {
  const rows = byYm(national.rows);
  const last = rows[rows.length - 1];
  if (!last) return null;
  const line = (perMonth: number): LittleLine | null => {
    const months = littlesLawMonths(last.pending, perMonth);
    return months === null ? null : { perMonth, months };
  };
  const latest = line(completions(last));
  if (!latest) return null;
  const fyAvg = latestCompleteFiscalYear(rows);
  const fyLine = fyAvg ? line(fyAvg.perMonth) : null;
  const s2 = policy.scenarios.find((s) => s.id === 'S2');
  const s2Line = s2 && s2.path.kind === 'ramp' ? line(s2.path.to) : null;
  return {
    pending: last.pending,
    month: last.ym,
    latest,
    fiscalYear: fyAvg && fyLine ? { ...fyLine, fy: fyAvg.fy } : null,
    scenario: s2 && s2Line ? { ...s2Line, def: s2 } : null,
  };
}
