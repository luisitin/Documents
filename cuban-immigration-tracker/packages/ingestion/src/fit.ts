/**
 * Fitting (03-data-pipeline.md §3.5): the pipeline calls the SAME functions of `@caa/estimator` the
 * app uses, so params.json is reproducible from national/offices/policy/alerts.
 *
 * When a monthly row arrives: `fitBeta(rows)` (04 EST-3 §3.2), `fitObservationSigma(rows, regimes)`
 * (04 §6.2), `scenarioWeights()` with flags = null (the case-independent part, 04 §6.3 step 4),
 * whose trace is appended to `params.weightLedger` (append-only; 03 §1 principle 4 "no silent
 * re-tuning"). When a quarter arrives: `officeMultipliers(lastTwoQuarters, group, κ_o = 50, [0.5, 2])`
 * with `basis: 'approvals'` (MVP default matching doc 08 §7.3 and golden T6).
 * Every run: `estimate(T15)` → `manifest.canary` (04 §9.2: GOLDEN T15 P12 0.09229, q50 54).
 */
import { clockFor, deriveFlags } from '@caa/case-rules';
import type {
  AlertsFile, EstimatorParams, ISODate, ISODateTime, Manifest, NationalFile, OfficesFile, PolicyFile, QuarterlyFile, WeightLedgerEntry,
} from '@caa/data-schemas';
import { REFERENCE_TODAY, estimate, fitBeta, fitObservationSigma, modelRows, officeGroup, officeMultipliers, referenceCase, scenarioWeights } from '@caa/estimator';
import { MULTIPLIER_GROUP } from './constants';

/** Constants fixed by 04 (EST-4, EST-5, EST-11, §4, §6.2–§6.3) and the params schema literals. */
export const PARAM_CONSTANTS = {
  horizonMonths: 72 as const,
  receiptsForecast: 1000 as const,
  k0Office: 50 as const,
  clampOffice: [0.5, 2] as [0.5, 2],
  grids: {
    beta: [[0.5, 0.25], [1, 0.5], [2, 0.25]],
    office: [[0.8, 0.25], [1, 0.5], [1.25, 0.25]],
    classMix: [[0.5, 0.25], [1, 0.5], [2, 0.25]],
    ead: [[0.9, 0.25], [1, 0.5], [1.2, 0.25]],
  } as EstimatorParams['grids'],
  milestone: {
    noBiometricsAfter4mo: 0.7, rfeAnswered: { mult: 1.5, months: 3 }, mandamus: { mult: 1.3, months: 4 },
    postInterview: { medianMonths: 3, sigma: 0.857 }, expediteGranted: { medianMonths: 2, sigma: 0.857 },
  } as EstimatorParams['milestone'],
  tempering: 0.5 as const,
  floorLevel: 50 as const,
  weightFloor: 0.02 as const,
};

/** Rules whose effect depends on class membership (conditions on Red Eagle protection, 04 §6.3). */
export function caseDependentRules(policy: PolicyFile): string[] {
  return policy.alertRules
    .filter((r) => r.effects.some((e) => e.condition === 'redEagleProtects' || e.condition === 'redEagleNotProtecting'))
    .map((r) => r.ruleId);
}

/** Months of R4 data: monthly rows that start on or after the R4 start (2026-06-12 → Jul, Aug 2026 = 2). */
export function r4MonthsOfData(national: NationalFile, policy: PolicyFile): number {
  const r4 = policy.regimes.find((r) => r.id === 'R4');
  if (!r4?.start) return 0;
  return national.rows.filter((r) => `${r.ym}-01` >= r4.start!).length;
}

const ledgerKey = (e: { reason: string; ruleId?: string; alertId?: string; observedMonth?: string }) =>
  `${e.reason}|${e.ruleId ?? ''}|${e.alertId ?? ''}|${e.observedMonth ?? ''}`;

export interface FitInput {
  national: NationalFile;
  offices: OfficesFile;
  policy: PolicyFile;
  alerts: AlertsFile;
  previous: EstimatorParams | null;
  now: ISODateTime;
  /** Alert validity date for the case-independent weights (the run date). */
  today: ISODate;
}

/** 07 WP5 `fit`: params.json from the published inputs. Deterministic given the inputs and `now`. */
export function fit(i: FitInput): EstimatorParams {
  const rows = modelRows(i.national.rows, i.national.firstModelMonth);
  if (!rows.length) throw new Error('fit: no monthly rows in the model window');
  const dataThrough = rows[rows.length - 1]!.ym;
  const beta = fitBeta(rows);
  const sigma = fitObservationSigma(rows, i.policy.regimes);
  const observation: EstimatorParams['observation'] = {
    model: 'lognormal', sigma, tempering: PARAM_CONSTANTS.tempering, floorLevel: PARAM_CONSTANTS.floorLevel, weightFloor: PARAM_CONSTANTS.weightFloor,
  };
  const sw = scenarioWeights(i.policy, i.alerts, rows, null, observation, i.today);

  const ledger: WeightLedgerEntry[] = (i.previous?.weightLedger ?? []).slice();
  const seen = new Set(ledger.map(ledgerKey));
  for (const t of sw.trace) {
    const k = ledgerKey(t);
    if (seen.has(k)) continue;
    seen.add(k);
    ledger.push({
      at: i.now, reason: t.reason,
      ...(t.ruleId ? { ruleId: t.ruleId } : {}), ...(t.alertId ? { alertId: t.alertId } : {}),
      ...(t.observedMonth ? { observedMonth: t.observedMonth } : {}), ...(t.observedCompletions !== undefined ? { observedCompletions: t.observedCompletions } : {}),
      before: t.before, after: t.after,
    });
  }

  const groupCandidates = i.offices.offices.map((o) => ({ ...o, cubanFocus: (MULTIPLIER_GROUP as readonly string[]).includes(o.code) }));
  const group = officeGroup(groupCandidates, i.offices.quarterly);
  const multipliers = officeMultipliers(i.offices.quarterly, group, PARAM_CONSTANTS.k0Office, PARAM_CONSTANTS.clampOffice);

  return {
    modelVersion: 'VPH-1.1',
    dataThrough,
    beta,
    horizonMonths: PARAM_CONSTANTS.horizonMonths,
    receiptsForecast: PARAM_CONSTANTS.receiptsForecast,
    officeGroup: group,
    officeMultipliers: multipliers,
    k0Office: PARAM_CONSTANTS.k0Office,
    clampOffice: PARAM_CONSTANTS.clampOffice,
    grids: PARAM_CONSTANTS.grids,
    milestone: PARAM_CONSTANTS.milestone,
    observation,
    scenarioWeights: { asOf: dataThrough, weights: sw.weights, caseDependentRules: caseDependentRules(i.policy) },
    weightLedger: ledger,
    validation: i.previous?.validation ?? { status: 'not_validated' },
    confidenceGates: {
      r4MonthsOfData: r4MonthsOfData(i.national, i.policy),
      pitNotRejectedMonths: i.previous?.confidenceGates.pitNotRejectedMonths ?? 0,
      crowdDecisionsByOfficeGroup: i.previous?.confidenceGates.crowdDecisionsByOfficeGroup ?? {},
    },
  };
}

export interface CanarySnapshot {
  national: NationalFile; quarterly: QuarterlyFile; offices: OfficesFile; policy: PolicyFile; alerts: AlertsFile; params: EstimatorParams; manifest: Manifest;
}

/**
 * `manifest.canary`: the reference case T15 (= the app's "Ver un ejemplo") through the full app path
 * (case-rules `deriveFlags` → `clockFor` → estimator `estimate`). `today` defaults to the golden date
 * 2026-10-20 (`REFERENCE_TODAY`), which is also the fixed clock of the Prove harness (07 §9 P6–P7), so
 * the canary isolates DATA changes (Q12) and Prove's live variant can assert it literally.
 */
export function canary(s: CanarySnapshot, today: ISODate = REFERENCE_TODAY): Manifest['canary'] {
  const c = referenceCase();
  const flags = deriveFlags(c, s.policy, today);
  const clock = clockFor(c, s.policy, today);
  const r = estimate({
    case: c, flags, clock, national: s.national, quarterly: s.quarterly, offices: s.offices, policy: s.policy, params: s.params, alerts: s.alerts,
    data: { status: 'published', manifest: s.manifest }, today,
  });
  if (r.kind !== 'estimate') throw new Error(`canary: T15 gave ${r.kind}`);
  return { caseId: 'T15', pWithin12: r.pWithin.m12, q50: r.quantiles.q50, computedWith: 'VPH-1.1' };
}
