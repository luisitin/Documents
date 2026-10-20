/**
 * The one `zod` import of @caa/data-schemas. Every schema module imports `z` from here, never from
 * 'zod' directly, so the configuration below runs before ANY schema is constructed.
 *
 * Why a module and not the first statement of index.ts: ES modules evaluate their imports before
 * the importing module's body, so a `z.config()` call in index.ts would run only after
 * primitives.ts, national.ts, … had already built their object schemas. zod 4.6.5 reads
 * `globalConfig.jitless` and probes `allowsEval` (a `new Function("")` call) inside the
 * `$ZodObject` constructor (node_modules/zod/v4/core/schemas.js), i.e. at construction time.
 *
 * The artifact CSP (owner contract (b); 07-implementation-plan.md §9 P3) has no 'unsafe-eval':
 * the probe's throw is caught, but Chromium still reports a `securitypolicyviolation`, which
 * fails Prove P3. `jitless: true` skips the probe entirely (WP0 report, "Must keep").
 */
import { z } from 'zod';

z.config({ jitless: true });

export { z };
