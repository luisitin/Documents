# Cuban Immigration Tracker (CAA Tracker)

A mobile app that tracks, in near-real time, how long **Cuban Adjustment Act (CAA)**
green-card applications are taking for people who entered the U.S. through the
**CHNV humanitarian parole program** (Cubans, Haitians, Nicaraguans, Venezuelans),
and estimates when a given person's case is likely to be approved.

## Why this exists

A relative of the project owner came from Cuba through the CHNV parole program,
waited the required one year and one day of physical presence, and filed for
permanent residence under the Cuban Adjustment Act in roughly March/April 2025.
He received his Employment Authorization Document (EAD) but, as of October 2026,
still has no green card. Several people who filed around the same time never got
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
