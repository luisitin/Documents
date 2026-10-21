# Cuban Immigration Tracker (CAA Tracker)

A mobile app that tracks, in near-real time, how long **Cuban Adjustment Act (CAA)**
green-card applications are taking for people who entered the U.S. through the
**CHNV humanitarian parole program** (Cubans, Haitians, Nicaraguans, Venezuelans),
and estimates when a given person's case is likely to be approved.

## Why this exists

A relative of the project owner came from Cuba through the CHNV parole program,
waited the required one year and one day of physical presence, and filed for
permanent residence under the Cuban Adjustment Act in roughly March/April 2025.
He received his Employment Authorization Document (EAD) in September 2025, about
six months after filing, but, as of October 2026, still has no green card. Several people who filed around the same time never got
an EAD at all, while others did. That inconsistency lines up with the
government-wide pause ("freeze") on benefit adjudications for CHNV parolees that
began in early 2025 and was later struck down in federal court.

The goal is to replace guesswork and rumor with data:

- **How many** CAA / parole-based adjustment applications are pending, received,
  approved, and denied, by period and (where data exists) by office or state.
- **How long** cases are currently taking, broken down by filing date, field
  office / state, and which milestones have already happened (receipt notice,
  biometrics, EAD, interview, RFE, etc.).
- **A personal estimate** for any given person: "you filed on X, you live in Y,
  you already have Z, so your expected decision window is ...", with an honest
  confidence range.
- **Alerts** when official data, policy, or court rulings change.
- **English and Spanish**, switchable with one button inside the app; the whole interface
  follows the chosen language.
- **Runs on iOS, Android, and the web.** The web build is packaged as a single HTML
  file so it can be published as a shareable Claude artifact.

## Reference case (used throughout the research, planning, and tests)

| Milestone | Date | Notes |
|---|---|---|
| Entered the U.S. on CHNV parole | 2023–2024 | exact date not needed for the model |
| One year and one day of physical presence reached | early 2025 | CAA eligibility threshold |
| Form I-485 (Cuban Adjustment Act) filed | March 2025 | with I-765 (c)(9) work permit request |
| EAD received | September 2025 | ~6 months; others who filed at the same time never got one |
| Green card (I-485 decision) | pending as of October 2026 | ~19 months and counting |

## Project layout

```
/home/user/Documents/ (git root = github.com/luisitin/Documents)
├── .github/
│   ├── CODEOWNERS              ← owner review for workflows, ingestion, estimator, curated data, scripts
│   └── workflows/caa-*.yml     ← CI, data refresh, endpoint probe, staleness check
└── cuban-immigration-tracker/
    ├── README.md  LICENSE
    ├── app/                    ← the Expo SDK 58 app (iOS, Android, web); routes in app/src/app/
    │   └── src/data/sample/    ← bundled SAMPLE snapshot (frozen, USCIS data through Aug 2026)
    ├── packages/               ← pure TypeScript libraries shared by the app and the tools
    │   ├── data-schemas/       ← zod schemas for every data file (the contract)
    │   ├── estimator/          ← VPH-1.1 estimator (ranges, golden tests)
    │   ├── case-rules/         ← case flags, clock, remedies, peers, EAD rules
    │   ├── i18n-core/          ← es/en strings, deterministic date/number formatting
    │   └── ingestion/          ← data pipeline (USCIS, Federal Register, CourtListener, curated)
    ├── data/                   ← published JSON snapshots + manifest; curated/ is human-reviewed
    ├── scripts/                ← artifact build + Prove, i18n check, schema export, personal-files guard
    ├── tools/oracle/           ← independent Python oracle for the estimator's golden values
    ├── test/                   ← root foundation and integration tests
    └── docs/
        ├── research/           ← background research (program, law, data sources, litigation)
        └── planning/           ← product spec, architecture, data model, pipeline, estimator,
                                  privacy, roadmap, implementation plan, adr-log.md
```

## Status

- [x] Phase 0: repository and problem statement
- [x] Phase 1: research (program history, Cuban Adjustment Act, the 2025 freeze and
      the litigation that ended it, every usable public data source, estimation methods)
- [x] Phase 2: planning (product spec, architecture, data model, estimation model)
- [x] Phase 3: implementation (mobile app, data ingestion, estimator, tests), on the branch
      `claude/cuban-immigration-tracker-b6y4b1`. All checks pass locally (2026-10-21): root
      `npm run check` (vitest 477 passed), `cd app && npm run check` (jest 244 passed),
      `npm run build:artifact` (one 2.55 MB fragment) and `npm run prove` (P1–P14, 641 checks,
      0 failures).
- [x] Build report and screenshots: [`docs/planning/08-build-report.md`](docs/planning/08-build-report.md)
      (what was built, commands, Expo Go vs dev build, sample vs live data, owner steps) and
      [`docs/screenshots/`](docs/screenshots/) (every tab, the estimate and the language toggle,
      in Spanish and English, at 390×844).
- [ ] CI observed green on the branch, and the first real data refresh on GitHub's runners
      (the orchestrator touches `data/.refresh-request`).
- [ ] Native device test (Expo Go or a development build) on one iOS and one Android phone.
- [ ] Native Cuban-Spanish review of every string, alert, notification and disclaimer.
- [ ] Workflows merged to `main`, so the scheduled data refresh runs.
- [ ] Web artifact published, with its URL recorded below.
- [ ] Owner decision on the personal PDFs at the repository root.
- Details for every open item: [`docs/planning/adr-log.md`](docs/planning/adr-log.md) §D.

## Data and the web artifact

- **Published data** (generated by the `caa-data-refresh` workflow; validated with zod and
  sha256-checked on device):
  `https://raw.githubusercontent.com/luisitin/Documents/<ref>/cuban-immigration-tracker/data/manifest.json`
  and the files it lists. The app uses `ref = main` (`app/app.json` `extra.data`). Until the
  data reaches `main`, the app shows the bundled sample, labelled "Muestra" / "Sample".
- **Web artifact**: *not published yet.* `npm run build:artifact` writes one self-contained
  HTML fragment, `web-artifact/index.html`, plus `web-artifact/data/`. `npm run prove` checks it
  in headless Chromium under the artifact host's rules. Publish it with the runbook in
  [`docs/planning/03-data-pipeline.md`](docs/planning/03-data-pipeline.md) §9, always to the
  same URL, and record that URL here.
- Every screen shows the data's "as of" date and whether the data is live, saved, published or
  a sample. Every estimate is a range.

## Development

Node ≥ 22.13 and Python ≥ 3.12 (standard library only).

```sh
cd cuban-immigration-tracker
npm ci && (cd app && npm ci)
npm run check                          # typecheck, lint, tests, golden, i18n, data, personal files
(cd app && EXPO_OFFLINE=1 npm run check)
npm run build:artifact && npm run prove
(cd app && npx expo start)             # run the app (Expo dev build or Expo Go)
```

## Licence

Code: MIT. Data and written content produced here: CC BY 4.0. U.S. Government data is not
copyrighted. See [`LICENSE`](LICENSE).

## Disclaimer

This project is not legal advice and is not affiliated with USCIS, DHS, or any
government agency. Estimates are statistical projections from public data and
community-reported timelines; individual cases vary.
