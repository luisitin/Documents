/**
 * @caa/data-schemas — contract v1 (07-implementation-plan.md §6.0, WP1; tag `contract: data-schemas v1`).
 *
 * The source of truth for every data file and the device case timeline (02-data-model.md §1–§5,
 * §7): zod schemas with inferred TypeScript types, `FIELD_KINDS`, and the parse entry points
 * shared by the app and the pipeline. Pure: imports only `zod` (ARCH-1). The Node-only helper
 * `validateDataDir` lives in the separate entry `@caa/data-schemas/node` (src/node.ts) so the app
 * never bundles `fs`.
 *
 * Changes after the freeze are additive only (07 §10 rule 3).
 *
 * Source constraint (until app/package.json maps `@babel/runtime`): no ARRAY destructuring in
 * packages/ src. Under jest-expo, Babel turns `const [a, b] = …` into a require of
 * `@babel/runtime/helpers/slicedToArray`, which jest cannot resolve from ../packages (it lives in
 * app/node_modules only). Metro resolves it (nodeModulesPaths), so only jest breaks.
 */
// './zod' MUST be the first import: it runs `z.config({ jitless: true })` before any schema
// module constructs an object schema (CSP / Prove P3; see src/zod.ts for why it is a module).
import { z } from './zod';

// Idempotent; kept as the first statement for readers of the WP0 hand-over note. The effective
// call is the one in ./zod, which runs before every schema module below.
z.config({ jitless: true });

export * from './primitives';
export * from './national';
export * from './quarterly';
export * from './offices';
export * from './policy';
export * from './alerts';
export * from './content';
export * from './params';
export * from './manifest';
export * from './case';
export * from './community';
export * from './ledger';
export * from './fieldKinds';
export * from './validate';
