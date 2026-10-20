# @caa/data-schemas — contract v1

Owner: WP1 (`docs/planning/07-implementation-plan.md` §6). Source of truth for every published data
file and for the device case timeline (`docs/planning/02-data-model.md` §1–§5, §7): zod 4.6.5
schemas with inferred TypeScript types. Pure TypeScript, imports only `zod` (ARCH-1). Changes after
the `contract: data-schemas v1` commit are **additive only** (07 §10 rule 3).

## Entries

| Import | Contents | Used by |
|---|---|---|
| `@caa/data-schemas` | schemas, types, `FIELD_KINDS`, `parseDataFile`, `parseManifest`, `parseCase`, warnings and cross-checks | app, estimator, case-rules, i18n-core, ingestion |
| `@caa/data-schemas/node` | `validateDataDir(dir)`, `jsonSchemaFiles()`, `checkJsonSchemaDir(dir)` (Node only: `fs`, `crypto`) | ingestion CLI, `scripts/export-schema.mjs`, tests. **Never imported by app/** |

## Files

| File | 02 section | Curated (strict) or pipeline (passthrough) |
|---|---|---|
| `src/zod.ts` | — | the one `zod` import; runs `z.config({ jitless: true })` before any schema exists |
| `src/primitives.ts` | §1 | ISODate, YearMonth, ISODateTime, Lang, Localized, Evidence, FiscalQuarter, StatisticKind, SourceId, SourceRef, `Result<T>` |
| `src/national.ts` | §2.2 | pipeline |
| `src/quarterly.ts` | §2.3 | pipeline |
| `src/offices.ts` | §2.4 | pipeline |
| `src/policy.ts` | §2.5 | **curated** |
| `src/alerts.ts` | §2.6 | **curated** (`AlertCandidate`: pipeline) |
| `src/content.ts` | §2.7 | **curated** |
| `src/params.ts` | §2.8 | pipeline |
| `src/manifest.ts` | §2.1 | pipeline; `files` requires the 7 v1 names, `community` optional (v1.1) |
| `src/case.ts` | §3–§5, §7 | device data (unknown keys stripped); `DerivedFlags`, `EstimateInput/Result/Ok`, `RemedyStep`, `EadStatus`, `ApprovalCard`; `SharedTimelineSchema` (strict) |
| `src/community.ts`, `src/ledger.ts` | §2.9, §2.10 | pipeline (v1.1) |
| `src/fieldKinds.ts` | §1 | `FIELD_KINDS` |
| `src/validate.ts` | §8 | `parseDataFile`, `parseManifest`, `dataFileWarnings`, `schemaWarnings`, `crossCheckSnapshot` |
| `src/node.ts` | — | `validateDataDir`, JSON Schema export |

## Rules the schemas enforce (02 §8)

- Counts are whole and ≥ 0; `pendingOver6 ≤ pending`; monthly `ym` strictly increasing and gap-free
  from `firstModelMonth` (the Aug 2024 gap before the model window is allowed, 04 EST-1).
- Every `Localized` has two non-blank strings. `es === en` is a **warning** (proper names allowed).
- Curated files reject unknown keys; pipeline files keep them and report a warning.
- Case timeline: no future dates except `interview_notice.meta.scheduledFor`, `meta.dueDate`,
  `ead_c9.meta.cardExpiry` and `paroleEndDateOriginal`; the receipt precedes every milestone except
  `parole_termination_notice`; decision after interview; "solo sé el mes" = day 15.

## Deliberate deviations from 02 (owner rules win)

- **No full receipt number.** 02 §3 lists `receiptFullLocal`; the owner rule is "never store names
  or full receipt numbers", so the case schema has no such field and `parseCase` strips it if an
  old value appears. Only `receiptPrefix` (`^[A-Z]{3}$`) exists.
- `parseCase(json, opts?: { today?: ISODate })`: the optional `today` (additive to the 07 §6.0
  signature) pins the clock; without it the device's local date is used.
- `validateDataDir` also returns `warnings` (additive).
- `policy.fees[]`: `since` may be `null` (key facts §4 has "—" for several rows) and an optional
  `id` / `asOf` exist so the app can find `mandamusFiling` (07 WP9).

## Constraints for code in `packages/*/src`

- Import `z` from `./zod` (inside this package), never construct a schema before it.
- **No array destructuring** (`const [a, b] = …`, `for (const [k, v] of …)`) until `app/package.json`'s
  jest config maps `@babel/runtime`: jest-expo compiles it to a `@babel/runtime/helpers/slicedToArray`
  require that jest cannot resolve from `../packages` (Metro can).

## Commands

```
npm run typecheck && npx vitest run packages/data-schemas && npm run schema:export -- --check
npm run schema:export          # regenerate data/schema/*.schema.json after a schema change
```

Fixtures: `test/fixtures/valid/*.json` (one or more per schema), `test/fixtures/invalid/*.json`
(patch specs: `base` + `set`/`delete` + the expected issue regex), and G0 in
`test/fixtures/sample-handbuilt/` (see its README; it is labelled sample data).
