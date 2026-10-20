/**
 * @caa/estimator — contract v1 STUBS (07-implementation-plan.md §6.0; written by WP1 in the
 * `contract: data-schemas v1` commit under declared ownership exception 2). WP2 owns this package
 * from now on and replaces every `notImplemented` body with VPH-1.1 (04-estimation-model.md).
 *
 * Pure: no I/O, never reads a clock (07 §6.0). Types come from `@caa/data-schemas` only; the
 * estimator never imports `@caa/case-rules` (07 WP2 "Consumes"). `GOLDEN` lives in the separate
 * entry `@caa/estimator/golden` (src/golden.ts) so Metro never bundles it into the app.
 */
import type {
  AlertsFile, DerivedFlags, EstimateInput, EstimateOk, EstimateResult, EstimatorParams, ISODate, MonthlyRow,
  OfficeQuarterStat, PolicyFile, Regime, ScenarioDef, ScenarioId, YearMonth,
} from '@caa/data-schemas';

export type { ScenarioId };

/** A pool vintage: label 'legacy>6mo' | 'legacy<6mo' | YearMonth | `f${k}` (04 §3.1, §3.3). */
export interface Vintage { label: string; age: number; n: number }

/** One projected grid path (04 §3.4, EST-4); S[0..H]. */
export interface Path { sid: ScenarioId; betaMult: number; officeMult: number; extraMult: number; prior: number; S: number[] }

function notImplemented(name: string, ...args: unknown[]): never {
  void args;
  throw new Error(`@caa/estimator.${name}: not implemented (contract v1 stub; WP2 implements it)`);
}

/** 02 §4: pure, deterministic; computes the guards from input.data / quarterly / today; echoes input.clock. */
export function estimate(input: EstimateInput): EstimateResult {
  return notImplemented('estimate', input);
}

/** 04 §3.1 / EST-1, EST-2: replay the monthly rows into the vintage pool. */
export function reconstructPool(rows: MonthlyRow[], beta: number): { pool: Vintage[]; scales: number[]; sse?: number } {
  return notImplemented('reconstructPool', rows, beta);
}

/** EST-3: ternary search on [0, 0.3] against the last 3 rows with C ≥ 300; fallback 0.037. */
export function fitBeta(rows: MonthlyRow[]): EstimatorParams['beta'] {
  return notImplemented('fitBeta', rows);
}

/** 04 §6.2: SD of Δ ln C over consecutive non-hold months; floor 0.25. */
export function fitObservationSigma(rows: MonthlyRow[], regimes: Regime[]): number {
  return notImplemented('fitObservationSigma', rows, regimes);
}

/** EST-11: shrunk office multipliers (κ_o = kappaOffice, clamp). */
export function officeMultipliers(stats: OfficeQuarterStat[], group: string[], kappaOffice: number, clamp: [number, number]): EstimatorParams['officeMultipliers'] {
  return notImplemented('officeMultipliers', stats, group, kappaOffice, clamp);
}

/** 04 §6.3: alert composition + tempered likelihood update with the sub-mass floor. */
export function scenarioWeights(
  policy: PolicyFile, alerts: AlertsFile, observed: MonthlyRow[], flags: DerivedFlags | null,
  observation: EstimatorParams['observation'], today: ISODate,
): { weights: Record<ScenarioId, number>; trace: EstimateOk['weightTrace'] } {
  return notImplemented('scenarioWeights', policy, alerts, observed, flags, observation, today);
}

/** 04 §6.1: completions(k) for a scenario; offset = months(anchorMonth → dataThrough). */
export function completionsPath(def: ScenarioDef, offset: number): (k: number) => number {
  return notImplemented('completionsPath', def, offset);
}

/** 04 §3.3: survival S[0..H] of one path. */
export function projectPath(a: {
  pool: Vintage[]; vintage: string; beta: number; completions: (k: number) => number; multiplier: number;
  H: number; kOrigin: number; receipts: number; milestoneMult?: (t: number) => number;
}): number[] {
  return notImplemented('projectPath', a);
}

/** EST-6: posterior ∝ prior × S(k₀); S_c(t) = Σ post·S(k₀+t)/S(k₀), t = 0..72. */
export function mixAndCondition(paths: Path[], kOrigin: number): { S: number[]; posterior: number[] } {
  return notImplemented('mixAndCondition', paths, kOrigin);
}

/** 04 §5.3: mixture of per-office survival curves for a known state, unknown office. */
export function stateMixture(perOffice: { code: string; pending: number; paths: Path[] }[], kOrigin: number): { S: number[]; weights: Record<string, number> } {
  return notImplemented('stateMixture', perOffice, kOrigin);
}

/** 04 §7: extremes {0.5, 2} (no EAD) or {0.45, 2.4} (EAD received). */
export function structuralBand(runP12: (extraMult: number) => number, hasEad: boolean): [number, number] {
  return notImplemented('structuralBand', runP12, hasEad);
}

/** 04 §8 item 6: main-effect variance shares of per-path P(≤12). */
export function drivers(paths: Path[], posterior: number[], kOrigin: number, horizon: 12): { scenario: number; beta: number; office: number } {
  return notImplemented('drivers', paths, posterior, kOrigin, horizon);
}

/**
 * EST-8 (04-estimation-model.md §2): q_x is the smallest whole month t ∈ [1, 72] with
 * 1 − S_c(t) ≥ x − 1e-12, else null ("más de 6 años"). `S` is S_c(0..72). (Implemented by WP0.)
 */
export function quantile(S: number[], q: number): number | null {
  const last = Math.min(72, S.length - 1);
  for (let t = 1; t <= last; t++) {
    const s = S[t];
    if (s !== undefined && 1 - s >= q - 1e-12) return t;
  }
  return null;
}

/** Lognormal CDF F(t) with the given median and σ (04 §4 post-interview / post-expedite; T10). */
export function lognormalCdf(t: number, median: number, sigma: number): number {
  return notImplemented('lognormalCdf', t, median, sigma);
}

/** v1.1 forecast ledger: predictive lognormal mixture of national completions (04 §10.1). */
export function predictiveCompletions(params: EstimatorParams, policy: PolicyFile, months: number):
  { ym: YearMonth; components: { sid: ScenarioId; weight: number; mu: number; sigma: number }[] }[] {
  return notImplemented('predictiveCompletions', params, policy, months);
}
