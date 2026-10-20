/**
 * @caa/ingestion — WP0 SKELETON (07-implementation-plan.md §2, declared ownership exception 2).
 *
 * WP5 owns this package: `src/cli.ts` (refresh / validate / fixtures / probe), the sources, QA
 * gates and publishing of 03-data-pipeline.md §2–§7, plus its own `tsconfig.json`. The npm
 * scripts `data:*` and `probe` point at `src/cli.ts`, which does not exist until WP5 lands; the
 * workflow skeletons guard on that file. Node built-ins are allowed in this package only.
 */
export {};
