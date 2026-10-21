/**
 * @caa/estimator — VPH-1.1 (04-estimation-model.md; 07-implementation-plan.md §6.0 contract v1, WP2).
 *
 * Pure TypeScript, zero dependencies, deterministic: no I/O, never reads a clock (`today` is always
 * an input), never imports `@caa/case-rules` (the clock and the flags are passed in through
 * `EstimateInput`). Types come from `@caa/data-schemas` only. The golden values live in the
 * separate entry `@caa/estimator/golden` (src/golden.ts), so Metro never bundles them into the app.
 * The pipeline (WP5) uses the same fit functions (`fitBeta`, `fitObservationSigma`,
 * `officeMultipliers`, `scenarioWeights`) and `estimate` for the manifest canary (T15).
 *
 * Source constraint: no array destructuring in this package (jest-expo would require
 * @babel/runtime helpers that only exist in app/node_modules; see packages/data-schemas/src/index.ts).
 */
export type { ScenarioId } from '@caa/data-schemas';
export type { Vintage, Path } from './types';

// ── contract v1 (07 §6.0) ────────────────────────────────────────────────────────────────────
export { estimate } from './estimate';
export { reconstructPool } from './pool';
export { fitBeta, fitObservationSigma } from './beta';
export { officeMultipliers } from './office';
export { scenarioWeights, predictiveCompletions } from './weights';
export { completionsPath, projectPath } from './project';
export { mixAndCondition } from './mix';
export { stateMixture } from './stateMix';
export { structuralBand } from './structural';
export { drivers } from './drivers';
export { quantile } from './quantiles';
export { lognormalCdf } from './lognormal';

// ── additive helpers (07 §10 rule 3: additive only) ─────────────────────────────────────────
export type { WeightTraceEntry } from './weights';
export { activeAlerts, orderedScenarios, SCENARIO_IDS } from './weights';
export { betaTargets, isHoldMonth, nonHoldLogDiffs, BETA_FALLBACK, SIGMA_FLOOR } from './beta';
export { officeGroup, shrinkMultiplier, latestPending, yardstickRecord, WEAK_OFFICE_N } from './office';
export { modelRows, vintageLabel } from './pool';
export { pathRatios, survivalFromRatios } from './project';
export { conditionedCurve, posteriorWeights, HORIZON } from './mix';
export { stateCandidates, stateMixtureDetailed, STATE_MIX_MAX_OFFICES } from './stateMix';
export { driverShares } from './drivers';
export { STRUCTURAL_EXTREMES_EAD, STRUCTURAL_EXTREMES_NO_EAD } from './structural';
export { calendarDates, littlesLawMonths, pByDate, pWithinMonths } from './quantiles';
export { conditionalLognormalSurvival, lognormalSurvival, normalCdf } from './lognormal';
export { decideMode, interviewTransform, milestoneMultiplier } from './milestones';
export type { Delays, Mode, ModeDecision } from './milestones';
export { computeGuards, confidenceLevel, latestQuarter, ARTIFACT_OLD_DAYS, PIPELINE_LATE_DAYS, T20A_MAX_DAYS, T20B_MAX_MONTHS } from './guards';
export type { Guard } from './guards';
export { discreteCrps, kaplanMeier, kmAt, kmConditional } from './crowd';
export type { KmStep } from './crowd';
export { referenceCase, REFERENCE_CASE_ID, REFERENCE_TODAY } from './reference';
export { DAYS_PER_MONTH } from './dates';
export { headlineRange, MIN_BAND_WIDTH } from './headline';
export type { HeadlineRange } from './headline';
