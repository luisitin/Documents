# `@caa/estimator` — VPH-1.1 (WP2)

Pure TypeScript, zero dependencies, deterministic: no I/O, never reads a clock, no language input.
Spec: `docs/planning/04-estimation-model.md` (EST-1…14); contract: 07 §6.0. Types come from
`@caa/data-schemas`; the package never imports `@caa/case-rules` (the clock and the flags arrive
in `EstimateInput`).

- `src/index.ts` — the contract v1 exports (`estimate`, `reconstructPool`, `fitBeta`,
  `fitObservationSigma`, `officeMultipliers`, `scenarioWeights`, `completionsPath`, `projectPath`,
  `mixAndCondition`, `stateMixture`, `structuralBand`, `drivers`, `quantile`, `lognormalCdf`,
  `predictiveCompletions`, `Vintage`, `Path`) plus additive helpers (`referenceCase()` = the T15
  fixture for "Ver un ejemplo", `officeGroup`, `computeGuards`, `littlesLawMonths`, KM/CRPS crowd
  utilities, …).
- `src/golden.ts` — the separate, **test-only** entry `@caa/estimator/golden` (`GOLDEN`). Never
  import it from app code: Metro does not tree-shake.
- `golden/vph1.golden.json` — written by `tools/oracle/golden_cases.py` (see its README). Never
  edit by hand.

```sh
npm run typecheck && npx vitest run packages/estimator && npm run golden:check
```

Tests: `test/golden.vitest.ts` (04 §9 T1–T32 incl. T23b, U1, U6, U7; ± 5e-4 on probabilities,
exact quantiles and days), `test/properties.vitest.ts` (monotone survival, probabilities in
[0, 1], posteriors sum to 1 ± 1e-12, holds never add adjudicable days, byte-identical output, no
clock reads), `test/performance.vitest.ts` (reference case with bands and the FL state mixture
< 150 ms; the timing is printed).

Behaviour notes for consumers:
- Modes `post_interview` / `post_expedite` return `perScenario: []`, both bands collapsed to the
  point P12 and zero drivers (the scenario grid is not used there; 04 §4).
- `opts.bands === false` skips the structural band and the state mixture (state-only cases then
  use the national path, `office.basis = 'national'`).
- `office.weak` is true when the multiplier rests on fewer than 50 completions or the office has
  no multiplier (then m = 1). m̂_o is applied only to offices in `params.officeGroup`; any other
  office (and any non-group office in a state mixture) uses m = 1 with `weak = true`.
- Month-granularity milestone dates later than today (day 15 of the current month) are read as
  today. `delays` is filled in every mode; in post_interview / post_expedite (and after t_D in
  interview_scheduled) a pending RFE/NOID holds S = 1 until its due date and the lognormal clock
  starts there, and a response after the clock start restarts it [I] (review round 1; awaiting an
  owner-approved 04 §4 line and oracle cases).
- `pByDate` in the month of today (31 Dec in December) interpolates by the days left instead of
  returning 0.
- Source constraint: no array destructuring and no default JSON imports in `src/` (jest-expo
  would need `@babel/runtime` helpers that only exist in `app/node_modules`).
