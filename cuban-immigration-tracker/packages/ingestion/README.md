# @caa/ingestion

This is the data pipeline (`docs/planning/03-data-pipeline.md`, WP5). It runs on Node 22 with
`tsx`. The app never imports it.

| Command | What it does |
|---|---|
| `npm run data:refresh` | Runs the pipeline once into `data/` (the `caa-data-refresh` workflow runs the same command). Add `-- --dry-run` to parse and run QA without writing, and `-- --only uscis.monthly_csv,curated` to limit the sources |
| `npm run data:validate` | Checks `data/` and `data/curated/` against the strict schemas |
| `npm run data:sample` | Freezes `data/` into `app/src/data/sample/`, the bundled sample. It refuses unless the canary equals GOLDEN T15 |
| `npm run data:fixtures` | Downloads the mirror parser fixtures again and checks their sha256 |
| `npm run probe` | Runs the endpoint probes of doc 13 §12 into `probe-out/` |

## Sources

Each source is independent. When a source is blocked, the previous output is kept, with its
original `retrievedAt`.

- **P1 monthly CSV.** Tried in order: the portal href, then the constructed USCIS names, then the
  mirror.
- **P2 / P3 quarterly workbooks.** Same order as P1.
- **P4 processing times.** From the jzebedee/uscis SQLite release. When the release cannot be
  reached and nothing was published before, the 2026-10-15 values transcribed in the research are
  used instead, marked `fallback_used`.
- **P6 historic medians and C1 policy, alerts and content.** Curated by hand.
- **P7–P9 Federal Register, RSS, CourtListener.** Used only for alert candidates.

## QA and publishing

- **QA gates.** Q1–Q12 run in `src/qa.ts`. A source that fails is quarantined to
  `data/quarantine/<runId>/`.
- **Commit policy.** `src/commitPolicy.ts` commits when content changed, or as a 7-day heartbeat.
- **Raw archive.** Every USCIS file goes to `data/raw/<sourceId>/<period>/` with a `.meta.json`.
  A file is written only when its sha256 is new.
- **Fixtures.** See `test/fixtures/README.md`. `mirror/` holds real USCIS files. `synthetic/`
  holds labelled SAMPLE inputs.
