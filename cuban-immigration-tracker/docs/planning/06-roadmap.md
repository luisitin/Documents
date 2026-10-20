# 06 — Roadmap (final)

Written 2026-10-20. Effort is counted in focused **person-days (pd)**. "Wall-clock" assumes the work packages (WPs) in `07-implementation-plan.md` run in parallel with coding agents, with one human reviewing. The figures are honest: the judges found ship-fast's 19 pd not credible. They include i18n copy, the Spanish review, the artifact build and Prove, and device testing.

## Phase W0 — Foundation and de-risking (week 1)

| Item | pd | Exit |
|---|---|---|
| WP0: repo skeleton; root tooling package; Expo SDK 58 app scaffold with `asyncRoutes: false` and `web.output: "single"`; Metro `watchFolders` for `../packages`; re-run spikes V1–V8 in the real repo (`01` §9) | 2 | `npm run build:artifact && npm run prove` green on a hello-world with one package import, under the host CSP, from a deep path |
| WP0: skeletons of `caa-data-refresh.yml`, `caa-ci.yml`, `caa-probe.yml`, `caa-staleness.yml` on the feature branch, then the `handoff: workflow skeletons` commit to WP5/WP11; **owner merges a workflow-only PR to `main`** | 0.5 | `workflow_dispatch` visible; the guard step gives a green no-op on `main` |
| WP5 (moved from WP0): first `caa-probe` run or local `npm run probe` → `PROBE-REPORT.md` classifies every doc 13 §12.4 source | 0.5 | every "plan only" row now has a classification |
| Owner decisions (no agent work) | — | listed below |

**Owner decisions in W0:**
- Remove the four public personal PDFs, and purge them from history if needed (`05` §2).
- Branch-protection setting for the data bot.
- Code and data licence.
- Who curates alerts (owner, or an agent session plus owner review).
- Confirm SDK 58 support in Expo Go, or choose an EAS dev build.
- Open the Apple and Google developer accounts.
- Open an issue on `jzebedee/uscis` asking permission for derived fields.
- Optionally create a CourtListener token.

## Phase MVP — v1.0 (weeks 1–5)

| WP | Scope | pd |
|---|---|---|
| WP1 | `packages/data-schemas`: zod, types, `FIELD_KINDS`, JSON Schema export | 2 |
| WP2 | `packages/estimator` VPH-1.1 + `tools/oracle/vph1.py` + golden file + T1–T32/U-tests | 5 |
| WP3 | `packages/case-rules`: flags, clock, remedy ladder, peer reasons, EAD rules, approval card, share code | 3 |
| WP4 | `packages/i18n-core`: deterministic `fmt`, probability words, locale JSON skeleton, `check-i18n.mjs` | 2 |
| WP5 | `packages/ingestion`: P1–P4 + curated + QA Q1–Q12 + fit + canary + commit policy; P7/P8 candidates (Should) | 5 |
| WP6 | App platform: KV adapters, DataProvider, theme hook, web guard and prelude contract, notifications module (native/web) | 3 |
| WP7 | UI kit + SVG charts (Monthly, Fan, RegimeStrip, Bars) with table twins + SVG icons | 4 |
| WP8a | Screens S1 Home, S6 Offices, S8 Alerts, S10/S11 More/Method, S0 Welcome | 3 |
| WP8b | Screens S2 form, S3 estimate, S4 peers, S5 EAD, S7 remedies, S9 ineligible, S12 share (Should) | 4 |
| WP9 | Curated content: `policy.json`, seed alerts, `content.json` (myths, peer copy), full ES/EN copy; **native Cuban-Spanish review** | 4 |
| WP10 | `scripts/build-artifact.mjs` + `scripts/prove-artifact.mjs` (full assertion list) | 2 |
| WP11 | Integration: real data commit on the branch, confirm the G1 frozen sample (WP5, `07` §5), end-to-end tests, device runs (iOS + Android), accessibility pass (font scale 200 %, screen-reader labels) | 3 |
| **Total** | | **≈ 40 pd solo (≈ 8 weeks)**; **≈ 3–4 weeks wall-clock with parallel agents** |

**MVP gates (all required):**
1. The golden file is green: TS and oracle agree.
2. Prove passes the full list in `07` §9.
3. The Spanish reviewer has signed off.
4. The data job has run green on `main` for 14 days, with the badge truthful in every state.
5. The app runs on one iOS and one Android device (Expo Go or a dev build).
6. The privacy page and disclaimers are live.
7. The artifact is published and its URL is recorded in the README.

**Store submission** is a v1.0 task after the gates (≈ 2 pd). Review takes calendar time.

## Phase v1.1 (weeks 6–10, ≈ 20 pd)

| Item | pd | Depends on |
|---|---|---|
| Forecast ledger + scorecard (PIT/log score of completions, mean age, `pendingOver6`) | 3 | September 2026 CSV |
| Historical backtest promoted to Must; `validated_r0r2` status | 2 | — |
| CUSUM change-point monitor + "incertidumbre de política" banner | 1 | ledger |
| Office multipliers with approvals **and** denials (golden regenerated) | 1 | FY26 Q4 workbook (≈ early Dec 2026) |
| Approval-card re-estimate on post-PA-2026-05 data (Sep–Nov 2026 CSVs, FY26 Q4) | 1 | data |
| ZIP → county → office lookup (HUD crosswalk + Miami-Dade split; ZIP never stored) | 2 | doc 12 §3 |
| CourtListener watcher with token; FR/RSS watchers open draft-alert **issues** (no PR automation) | 1 | token |
| GitHub Pages hosting of `data/` (separate `pages` job) + jsDelivr fallback in `baseUrls` | 1 | owner enables Pages |
| Supabase opt-in shared timelines: consent, RLS, `delete_my_account`, delayed-entry KM aggregates, benchmark gate → `community.json` | 6 | privacy policy update, store forms |
| App lock (`expo-local-authentication`) | 1 | — |
| Local notifications, if they slipped from MVP | 1 | — |

## Phase v2 (months 3–6, ≈ 35 pd; gated by data)

| Item | Gate |
|---|---|
| Remote push via EAS + topic filters (tier C) | dev build; token table with RLS |
| Crowd milestone sub-models (replace the post-interview lognormal) | ≥ 30 events per transition |
| Multi-class pool (parolee share of completions) | ≥ 100 crowd decisions with channel |
| Hierarchical office effects (τ shipped) | ≥ 10 decisions in ≥ 5 offices |
| Seeded Monte Carlo fan charts | — |
| Competing risks (approval vs denial) | FY26 Q4 / FY27 Q1 mixes |
| (c)(9) EAD sub-model | ≥ 30 crowd EAD events |
| Torch Case Status opt-in | USCIS production access |
| OHSS/Census cohort context | — |

## Data calendar that drives the roadmap

| Expected | Event | Model consequence |
|---|---|---|
| Late Oct – Nov 2026 | September 2026 monthly CSV (`appropriation_requirement_september_2026_v1.0.csv`) | First likelihood update of S0–S2; β refit; T20a would otherwise trip on 2026-11-15 |
| ≈ early Dec 2026 | FY26 Q4 workbooks | Office multipliers refreshed; first post-PA-2026-05 quarter in view (doc 14 §8.1) |
| Monthly | jzebedee processing-time releases | Inquiry dates; e-Request gates; ETAs |
| ≈ Feb 2027 (data through Dec 2026) | 6 months of R4 data | MEDIUM confidence possible (`04` §10.3) |
| Any time | *Dorcas* 1st Cir. 26-1703 ruling; *Red Eagle* changes; new hold memo; *AAUP* relief; BIA I-220A remand | Curated alert activates a rule → weights move by the ledger, with no app release |

## Risk-driven contingencies

| If… | Then… |
|---|---|
| WP0 spike fails in the real repo | Fall back to copying `packages/*/src` into `app/src/vendor/` at build time (keep the package boundary in lint); do not start screens until the fallback is decided |
| Expo Go does not support SDK 58 | EAS development build for testers; web artifact for demos |
| uscis.gov blocks runners | Mirror plus sha check; the probe documents it; the data still flows via the mirror (weekly cadence) |
| The jzebedee maintainer refuses | Hide the inquiry-date and 80 % yardstick ("no disponible"); remedy gates show "verifique en la herramienta de USCIS"; the estimator is unaffected |
| raw.githubusercontent.com 429s | Bring v1.1 Pages hosting forward |
