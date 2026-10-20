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
cuban-immigration-tracker/
├── README.md                 ← you are here
├── docs/
│   ├── research/             ← all background research (program, law, data sources, litigation)
│   └── planning/             ← product plan, architecture, estimation model, roadmap
└── app/                      ← the mobile app and data pipeline (added after the planning phase)
```

## Status

- [x] Phase 0: repository and problem statement
- [ ] Phase 1: research (program history, Cuban Adjustment Act, the 2025 freeze and
      the litigation that ended it, every usable public data source, estimation methods)
- [ ] Phase 2: planning (product spec, architecture, data model, estimation model)
- [ ] Phase 3: implementation (mobile app, data ingestion, estimator, tests)

## Disclaimer

This project is not legal advice and is not affiliated with USCIS, DHS, or any
government agency. Estimates are statistical projections from public data and
community-reported timelines; individual cases vary.
