/**
 * `@caa/estimator/golden` — the oracle's golden file (04-estimation-model.md §9, EST-13).
 *
 * TEST-ONLY entry (07 §6.0): never imported by app/ code (the app ESLint config bans it), because
 * Metro does not tree-shake and the golden JSON must stay out of the bundle. The file is written by
 * `npm run golden:write` (tools/oracle/golden_cases.py, core = 04 Appendix A) and checked in CI by
 * `npm run golden:check` (tolerance 1e-6). TS tests compare against it within 5e-4 on
 * probabilities and exactly on quantiles and days (04 §9.1). Never edit it by hand.
 *
 * Named imports of the JSON's top-level keys (not a default import): under jest-expo, Babel turns a
 * default import into `@babel/runtime/helpers/interopRequireDefault`, which jest cannot resolve
 * from ../packages (it lives in app/node_modules only); named imports compile to plain property
 * reads. test/golden-file.vitest.ts checks that this list covers every key the oracle writes.
 */
import {
  meta, inputs, cases, ledger,
  T1, T2, T3, T4, T5, T6, T6sigma, T7, T8, T9, T10, T11, T12, T13, T14, T15d, T19, T20, T21, T22, T25, T28, T29, T30, T31, T32,
} from '../golden/vph1.golden.json';

export const GOLDEN = {
  meta, inputs, T1, T2, T3, T4, cases, T5, T6, T6sigma, T7, T8, T9, T10, T11, T19, T21, T22, T12, T13, T14, T15d, T20, T25, T32, T30, T31, T28, T29, ledger,
};

export type GoldenFile = typeof GOLDEN;
