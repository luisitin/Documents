# 08 — Estimation methodology: how to turn official aggregates and crowdsourced timelines into an honest personal estimate

**Project:** Cuban Immigration Tracker (CAA Tracker)
**Research date:** 2026-10-20 (every [S] URL was surfaced by a web search on this date)
**Author:** research agent (Phase 1, topic 08), written for a smart non-lawyer who will implement the estimator in TypeScript. Not legal advice.
**Builds on:** `03-the-2025-freeze-and-litigation.md`, `04-uscis-data-sources.md`, `06-community-and-third-party-data.md`, `07-reported-timelines-2024-2026.md`, `11-policy-and-rules-master-timeline.md`, `12-field-offices-states-and-geography.md` (same folder). Numbers from those documents are reused with their original verification tag.

---

## 0. How this document was produced, and how to read the tags

**Method.** Most of this document is statistical method (survival analysis, queueing, hierarchical Bayes, scoring rules), which is textbook material. The web-search allowance for this topic was **6 calls (all 6 used)**; they were spent only on confirming (a) USCIS's current processing-time methodology, (b) how the commercial trackers (Lawfully, Trackitt, Boundless/myProgress) build their estimates, (c) whether any published source already applies survival analysis to immigration backlogs, (d) what USCIS says about the order in which it works cases, and (e) Spanish-language explanations of the official statistics for the bilingual copy. Direct page fetches are blocked in this environment, so every [S] claim rests on a search-result summary of the cited page. **All numeric results in §5, §11.8 and §11.9 were recomputed in this session from the official monthly series that doc 04 read directly from the USCIS files**; the computation is reproducible from the pseudo-code in §11.5.

| Tag | Meaning |
|---|---|
| **[S]** | Stated in a web-search result seen today; URL cited and listed in §14. The full page was not opened. |
| **[S′]** | Stated in a search result seen by an earlier research agent (docs 03, 04, 06, 07, 11, 12) and reused here with that document's citation. |
| **[F]** | A number the doc-04 agent read directly from a USCIS data file (its "VERIFIED-FILE" tag). Strongest evidence in the project. |
| **[T]** | Training knowledge (textbook statistics or well-known references); not confirmed by a search today. Formulas tagged [T] are standard and can be checked in any survival-analysis text. |
| **[I]** | Inferred or computed by the author from tagged facts; the computation is shown. |
| **[S-absent]** | Searched for today and **not** found. |

---

## 1. Executive summary — the twelve things the estimator must get right

1. **Every published "processing time" is a statistic of *completed* cases, and for this cohort that is the wrong population.** USCIS's Processing Times tool shows the time within which 80% of cases *completed in the previous six months* were finished [S]; the quarterly file reports the *median* of completions [F]; the monthly Report-to-Congress file reports the *mean* of completions [F]. In August 2026, 355,520 Cuban I-485s were pending, 345,741 (97%) of them for more than six months, while only 820 were completed that month [F]. A statistic computed on 820 completions says almost nothing about 355,520 pending files. [I]
2. **Pending cases are right-censored observations, not missing ones.** The correct tools are survival analysis (Kaplan–Meier, discrete-time hazards, Cox/AFT) and queue/inventory accounting. Dropping or ignoring pending cases produces the "11.8-month median" that the Cuban press rightly says "no fija una fecha de respuesta para una solicitud pendiente" [S: periodicocubano.com; directoriocubano.info]. §4 and §5.
3. **The binding constraint is national throughput, not the applicant's office or milestones.** Little's law on August 2026 numbers: 355,520 pending ÷ 820 completions per month = **434 months** to clear the inventory at the current pace; ÷ 9,200 (FY2025 pace) = 39 months; ÷ 16,876 (FY2024 pace) = 21 months. [F][I] Office effects and milestones move an individual estimate by tens of percent; the policy regime moves it by an order of magnitude.
4. **A vintage reconstruction of the pending pool (§5.3) shows ~175,000 cases filed *before* March 2025 are still pending** (not the 35–70k "front of the queue" assumed in doc 07 §11.1), and the March-2025 filing month alone still has ~23,100 of its 26,187 receipts pending. [F][I] The reference case is in the *middle* of the inventory, not at its front.
5. **Adjudication order is close to age-neutral, not first-in-first-out.** The mean age of completed cases (20.6–22.2 months, Jun–Aug 2026 [F]) is only slightly above the reconstructed mean age of the pending pool (≈19.6 months [I]). Fitting an age-priority parameter β (hazard ∝ e^{β·age}) gives **β ≈ 0.037 per month** — weak priority for older cases. In the 2024–25 "fast lane" β ≈ 0 fits the data too. [I] No official USCIS statement that I-485s are worked FIFO was found [S-absent]; USCIS's only FIFO statement found today concerns I-526 petitions, which it moved *away* from FIFO in 2020 [S: uscis.gov EB-5 Q&A].
6. **Five hard regime breakpoints must be modelled as piecewise hazards** (doc 11 §2.1, exact dates in §6.1 here): R0 fast lane → **2025-02-14** parolee hold → **2025-06-09** catch-up → **2025-12-02** Cuba hold-and-review → **2026-06-05/12** vacatur → **2026-05-21/22 onward** "discretion" regime with denials exceeding approvals (Aug 2026: 386 approved / 434 denied [F]). Inside a hold the decision hazard is ≈ 0 and the case's clock is paused ("adjudicable time").
7. **Recommended v1 model (§11): a *vintage-pool hazard model with a policy-scenario grid* ("VPH-1").** It reconstructs the pending pool by filing month from the official monthly file, fits β, projects the pool forward under four throughput scenarios (status quo, partial recovery, FY2025 pace, re-freeze), and derives the applicant's monthly decision hazard as his vintage's share of projected completions, times a shrunken office multiplier and milestone multipliers. It runs on-device in well under 100 ms with no network call, and every output is a probability, never a single date.
8. **Worked result for the reference case** (filed March 2025, EAD September 2025, pending 2026-10-20, office unknown, default scenario weights): probability of an I-485 decision within **3 / 6 / 12 / 24 / 36 months of today = 1.5% / 3.7% / 9.4% / 22% / 36%**; the 10th percentile is 13 months, the median is **~53 months and the 75th percentile is beyond the 72-month horizon**. Under the optimistic FY2025-pace scenario alone the median is 22 months (10th–90th: 6–37). [I] To give this applicant a 50% chance of a decision within a year, USCIS would have to complete ≈ **21,800 Cuban I-485s per month**, above its 2024 peak. [I] These numbers contradict doc 07 §11.2 (median 9–10 months); §13 explains why and which assumption drives the gap.
9. **The milestone a user already has is informative mainly as a *state*, not as a speed-up.** "Interview completed, awaiting decision" switches the model to a post-interview distribution (median 3 months, 10th–90th 1–9 months, from attorney reports in doc 07 [S′]); "RFE received" zeroes the hazard until the response is filed; "EAD received" confirms biometrics/background processing but has no measured effect on the I-485 hazard yet (multiplier 1.0 until crowdsourced data say otherwise). [I]
10. **Office effects must be pooled (shrunk) toward the national prior.** Official per-office data exist only as a "Humanitarian-based" column (Cuban + refugee + asylee) [F]; in the Cuban-dominated offices the FY2026 Q2+Q3 approval rates per pending case range from 0.008% (Hialeah: 3 approvals on ~37,000 pending) to 0.34% (Tampa) [F][I]. A Gamma–Poisson shrinkage with 50 pseudo-completions turns these into multipliers of 0.83 (Kendall) to 1.94 (Tampa) — informative but not dominant. §7.
11. **Crowdsourced timelines are useful only with delayed-entry (left-truncation) handling, benchmarking to official totals, and suppression of cells with N < 10.** Lawfully's own method — count registered cases "with similar application file dates … behind and ahead of yours" with "the same form type, service center, and filing date" [S] — is a FIFO ranking among *self-selected* users and, by the company's own admission, breaks "if the trend suddenly changed" [S], which is exactly what happened in 2025–2026. §9.
12. **Validate with proper scoring rules, not with anecdotes.** Report interval coverage, PIT histograms, Brier scores for "decision within 12 months" and the discrete-time CRPS; backtest on rolling origins inside each regime (there are enough decisions in R0 and R2 to test; R3/R4 have too few). §10.

---

## 2. What the published numbers actually measure

### 2.1 USCIS's three official statistics and the third-party estimators

| Statistic | Where | Definition | Population | Granularity | Tag |
|---|---|---|---|---|---|
| **Processing time (tool)** | `https://egov.uscis.gov/processing-times/` | The time within which **80%** of cases of that form/subtype/office were completed over the **previous six months**; the displayed *range* runs from the **median (50th percentile)** to the 80th percentile; refreshed monthly | Completed cases only | Form × subtype × office; **no CAA subtype exists** (I-485 subtypes are Employment/Family/HRIFA/Asylee/Refugee/T/U) | [S: cliniclegal.org; lighthousehq.com; visacasetimes.com; nnuimmigration.com; fedlaws.org] [S′ doc 04 §2.4 for the subtype list] |
| **"Receipt date for a case inquiry"** | same tool | The receipt date before which a pending case is "outside normal processing" and an e-Request may be filed; set at a higher percentile than the displayed 80%, **~93%** of completions ("generally tied to 93 percent"; "often around 93 percent or more") | Completed cases | same | [S: cliniclegal.org; fedlaws.org; nnuimmigration.com] [S′ doc 04 §2.1: USCIS orphan/Hague FAQ says 93%] |
| **Quarterly "Processing Time"** | `quarterly_all_forms_fy2026_q3_v1.xlsx`, row "I-485 (Cuban)" | "the **median** which is the time it took to complete 50% of all the cases processed in the quarter" (footnote 6, verbatim) | Completed in the quarter | National, Cuban row | [F] doc 04 §1.2 |
| **Monthly "Avg. Processing Time"** | Report to Congress CSV, row "I-485 (Cuban)" | "**mean** months from receipt to completion over all cases completed in the month" | Completed in the month | National, Cuban row, monthly | [F] doc 04 §1.1 |
| **Historic national median** | `https://egov.uscis.gov/processing-times/historic-pt` | Median months by fiscal year (FY-to-date for the current year); has a row "I-485 — Based on Cuban Adjustment Act of 1966 (CAA)" | Completed in the FY | National | [S′ doc 04 §2.6] |
| **myProgress (USCIS online account)** | `https://content.govdelivery.com/accounts/USDHSCIS/bulletins/364ce40` | "estimated time until case decision", "based on historical patterns of cases with similar specifics" / "based on case type and historical USCIS data"; "not a guarantee"; may over- or under-estimate; expanded to I-765 and I-131 in July 2023 | Historical cases | Per applicant, only for e-filed/linked forms; **CAA I-485 not among the forms listed** | [S: govdelivery; jdsupra.com; fredlaw.com; webflow.boundless.com] [S′ doc 06 §3.5] |
| **Lawfully "Case Analysis Pro"** | `https://lawfully-official.medium.com/new-feature-case-analysis-pro-d03977c41f54` | "counts the number of cases with similar application file dates to your case behind and ahead of yours" (e.g., "25th of 93"); comparison set = "same form type, service center, and filing date"; shows cases per step and 7-day changes; "AI technology" for approval timing and RFE probability; caveat: "the result might be different from today's cases, if the trend suddenly changed" | Users who registered cases in the app since 2018-12-01 | Form × service center × filing date; no Cuban category observed | [S: lawfully.com/resources/start-case-analysis-pro; lawfully.com/resources/what-distinguishes-case-analysis-pro-from-other-case-trackers] [S′ doc 06 §3.2] |
| **Trackitt** | `https://www.trackitt.com/usa-immigration-trackers/i485-fb` | User-entered date columns (receipt, biometrics, RFE, interview, approval) with derived "days between" and simple averages; no model | Self-reported, EB-heavy user base | Free-text nationality | [T] (methodology not found today [S-absent]); [S′ doc 06 §3.1 for columns] |
| **Boundless / aggregators** | `https://webflow.boundless.com/blog/understanding-uscis-myprogress` | Republish the USCIS tool and explain myProgress; no independent estimate | — | — | [S][S′ doc 06 §3.5] |
| **Age-of-pending trackers (inmigreat, immiva)** | `https://inmigreat.com` (doc 07) | Compute "age of pending inventory" or "theoretical time to clear" = pending ÷ completions from the USCIS files (e.g., 23.2 months, May 2026) | Pending cases | National | [S′ doc 07 §3.3, §5.2] |
| **American Immigration Council dashboard** | `https://www.americanimmigrationcouncil.org/blog/uscis-backlogs-processing-trends-dashboard/` | "backlog clearance time" = pending ÷ quarterly completion capacity, e.g., 13.8 months (Jul–Sep 2025), 12.5 → 24.1 months (FY2025 Q2 → FY2026 Q2), all forms | Pending cases | National, all forms | [S] |

Spanish-language explanation available for the app's help screen: the Claxton Law Group glossary (updated May 2026) explains the 80%-over-six-months rule as "un indicador retrospectivo, no una garantía a futuro" [S: claxtonlawgroup.com/es/immigration-glossary/uscis-processing-times-2026/]; Periódico Cubano explains the median: "la mitad de los casos completados durante el período tardó ese tiempo o menos, mientras la otra mitad demoró más" [S: periodicocubano.com].

### 2.2 The bias catalogue (why each statistic misleads for a pending case)

| Bias | Mechanism | Effect on this cohort | Fix |
|---|---|---|---|
| **Completion-only sampling** (a form of survivorship bias) | Only cases that *finished* enter the statistic; cases that are stuck never do | With 820 completions vs 355,520 pending (Aug 2026 [F]) the statistic describes 0.2% of the files | Treat pending cases as right-censored (§4.1) |
| **Length-biased sampling in reverse** | In a freeze, the few completions are atypical (clear denials, abandoned files, non-parolee Cubans) | FY2026 Q2: 50 approved / 45 denied, median 19.5 months [F]; approval share collapsed to 52.6% then 23.7% [S′ doc 07 §3.4] — a selection artefact, not a change in the eligibility of the cohort | Report "when" and "whether" separately; do not apply 2026 approval shares to clean CHNV cases (doc 07 §11.2) |
| **Immortal-time bias** | Measuring from filing while the case could not legally be decided for ~10 months (R1 + R3) | 584 calendar days since a 2025-03-15 filing but only 256–306 "adjudicable" days [S′ doc 03 §11.2; recomputed §11.9 T11] | Use adjudicable time for display and for the age regressor in the R0/R2-fitted components |
| **Regime lag** | Any estimator fitted on past completions keeps predicting the past | Lawfully's own caveat [S]; user review complaining the estimate "still showing 15 months while it was changed to 15.5 last week" [S′ doc 06 §3.2] | Piecewise hazards with an explicit regime variable; change-point monitor (§6.5) |
| **Aggregation bias** | The tool's I-485 subtypes exclude CAA; the per-office file lumps Cuban with refugee and asylee | A "Miami 21.5-month" family-based figure [S′ doc 07 §4] is a different queue | Use office figures only as *relative* indices, shrunk (§7) |
| **Reporting lag** | Monthly CSV is published ~1 month after the month; quarterly ~10 weeks after the quarter [F] | Today (2026-10-20) the latest month is August 2026 | Condition on "still pending today" (§4.6) and show the data vintage |

### 2.3 A numeric illustration of why the median of completions is not a forecast

Take the August 2026 Cuban I-485 row: 1,213 received, 386 approved, 434 denied, 355,520 pending, 345,741 pending > 6 months, mean age of completions 20.6 months [F]. If order of service were random, each pending case's chance of being decided in a month would be 820 / 355,520 = **0.23%**, so the probability of a decision within 12 months would be 1 − (1 − 0.0023)^12 = **2.7%** [I]. The published "11.8-month FY2026 median" [S′ doc 04 §2.6] is therefore not even in the right order of magnitude for a pending file; the two numbers answer different questions ("how old were the few cases we finished?" vs "when will mine finish?").

---

## 3. What data the estimator can actually use (summary matrix)

| Source (doc) | What it gives | Resolution | Used in the model for | Tag |
|---|---|---|---|---|
| Monthly Report-to-Congress CSV (doc 04 §1.1) | Cuban I-485 received / approved / denied / pending / pending>6mo / mean months, Jul 2024 → Aug 2026 | National, monthly | Pool reconstruction by vintage; β fit; throughput level and trend; approval share | [F] |
| Quarterly all-forms XLSX (doc 04 §1.2) | Cuban I-485 quarterly counts and **median** months; (c)(9) I-765 counts and median | National, quarterly | Cross-check of the monthly series; EAD sub-model; median-of-completions backtest | [F] |
| Quarterly I-485 by field office XLSX (doc 04 §1.3) | Humanitarian-based received / approved / denied / pending per office per quarter | Office, quarterly | Office multipliers (shrunk) | [F] |
| Processing Times tool JSON (doc 04 §2) | 80th-percentile months and case-inquiry date per office for 131A-FAM; 147-C9 / 147-C11 for EADs | Office, monthly-ish | Office *relative* index (secondary); "outside normal processing" flag; EAD sub-model | [S′] |
| Historic national medians (doc 04 §2.6) | CAA median by FY: 3.3 / 4.6 / 7.0 / 11.8 (FY23–FY26 YTD) | National, annual | Shape prior for R0; backtest target | [S′] |
| Regime table (doc 11 §2.1; doc 03 §15) | Exact breakpoint dates and what changed | National | Piecewise hazards; adjudicable-time clock; scenario definitions | [S′][F] |
| Crowdsourced entries (doc 06 §8 schema) | Per-case milestone dates, office, entry channel, source type | Individual | Milestone sub-models; office effects (v2); validation | — (not yet collected) |
| Cuban press and attorney reports (docs 06 §3.9, 07 §9) | Post-interview waits, EAD waits, anecdotes | Qualitative | Priors for milestone sub-models; alert copy | [S′] |

---

## 4. Survival analysis: the right framework for "how long until my decision?"

### 4.1 Right-censoring, and why pending cases are censored rather than ignored [T]

Let T be the time from filing to decision. For a decided case we observe T exactly. For a pending case we only know **T > t** where t is its current age; that is a *right-censored* observation. It is still informative: a case that has survived 19 months tells us the probability of a decision within 19 months is lower than a sample of decided cases would suggest. Dropping censored cases (what every "median of completions" does) biases the estimate toward short durations; the bias grows with the share of censoring, and here censoring is 97% [F].

Two assumptions matter:
- **Non-informative censoring:** the reason a case is still pending at the data cut-off (calendar time) must not itself predict T beyond the covariates in the model. Administrative censoring at a fixed date is non-informative. *Self-selected* reporting in crowdsourced data is **not** (§9).
- **Independent increments across cases** — violated when a policy hold freezes everyone at once; this is handled by making the hazard a function of calendar time (§6), not by discarding cases.

### 4.2 Kaplan–Meier and Nelson–Aalen estimators [T]

With event times t₁ < t₂ < …, nⱼ cases at risk just before tⱼ and dⱼ decisions at tⱼ:

- **Kaplan–Meier survival:** Ŝ(t) = ∏_{tⱼ ≤ t} (1 − dⱼ / nⱼ)
- **Nelson–Aalen cumulative hazard:** Ĥ(t) = Σ_{tⱼ ≤ t} dⱼ / nⱼ, with Ŝ(t) ≈ exp(−Ĥ(t))
- **Greenwood variance:** Var[Ŝ(t)] ≈ Ŝ(t)² Σ_{tⱼ ≤ t} dⱼ / (nⱼ (nⱼ − dⱼ)); use log(−log Ŝ) confidence bands for small n.

Censored cases stay in nⱼ until their censoring time and then leave. (Kaplan & Meier, *JASA* 53:457–481, 1958 [T].) Toy example used in the unit tests (§11.9 T7): six cases with (months, event) = (3,1), (5,1), (5,0), (8,1), (10,0), (12,1) give Ŝ(3) = 0.8333, Ŝ(5) = 0.6667, Ŝ(8) = 0.4444, Ŝ(12) = 0 [I].

### 4.3 Discrete-time hazard models (the practical workhorse) [T]

USCIS data arrive monthly, so model the **monthly hazard** hₖ = P(decided in month k | pending at start of month k). Then S(k) = ∏_{j ≤ k} (1 − hⱼ) and P(decided by k) = 1 − S(k). Any covariate structure can be put on hₖ through a logit or complementary-log-log link: cloglog(hₖ) = αₖ + xᵀβ reproduces a proportional-hazards model in discrete time. The v1 model (§11) is a discrete-time hazard model whose hazard is *derived from inventory accounting* rather than fitted to individual records — because there are no individual records yet.

### 4.4 Cox proportional hazards [T]

h(t | x) = h₀(t) · exp(xᵀβ). Strengths: the baseline h₀ is left unspecified; covariates (office, entry channel, milestones as time-varying indicators) enter multiplicatively; partial likelihood handles censoring. Weakness: the proportional-hazards assumption fails across regime changes (a hold multiplies *everyone's* hazard by ≈ 0, which is proportional, but the *recovery* is not proportional across offices). Use it in v2 on crowdsourced records with **calendar-month stratification** (one baseline per regime) and time-varying milestone covariates. (Cox, *JRSS-B* 34:187–220, 1972 [T].)

### 4.5 Accelerated failure time (AFT) models [T]

log T = μ + xᵀβ + σ ε with ε ~ logistic (log-logistic), extreme-value (Weibull) or normal (log-normal). AFT gives directly interpretable "time ratios" (an office with β = 0.3 takes e^{0.3} = 1.35× as long) and a parametric tail, which matters when the median is beyond the data horizon (as it is now). The post-interview sub-model in v1 is a log-normal AFT with no covariates: median 3 months, σ = 0.857 so that the 10th–90th percentiles are 1–9 months [I from doc 07 §11.2].

### 4.6 Conditional survival ("already pending N months with milestone M") [T]

The quantity the app must show is not S(t) but the **conditional** probability of a decision in the next k months given the case is still pending at age a:

P(decided by a + k | pending at a) = 1 − S(a + k) / S(a).

Equivalently, restart the hazard product at month a + 1. When the model is a mixture over scenarios s with prior weights wₛ, conditioning also **updates the weights**: wₛ′ ∝ wₛ · Sₛ(a) — scenarios under which the case "should" have been decided already lose weight. In §11.8 this update is negligible (hazards are tiny) but the code does it because it matters when throughput is high. Milestone M enters by switching sub-model (interview done → post-interview AFT) or by a multiplier on the hazard (RFE pending → 0).

### 4.7 Competing risks: approval vs denial [T]

A decision is an approval **or** a denial; these are competing events. The probability of *approval* by time t is the **cumulative incidence** F_approve(t) = Σ_{tⱼ ≤ t} Ŝ(tⱼ₋) · d_approve,ⱼ / nⱼ (Aalen–Johansen), **not** 1 − KM treating denials as censored (that overstates approvals). For v1, factor the problem: P(decision by t) from the hazard model × P(approval | decision, profile) as a separate, clearly-caveated number (doc 07 §11.2 recommends ≈ 85–90% for a clean CHNV parolee pending post-freeze data [S′]; the headline 23.7% Q3 FY2026 share [F] is a selection artefact of the freeze, §2.2).

### 4.8 Multi-state (milestone) models [T]

Represent the case as a state machine: `filed → biometrics → (EAD) → interview scheduled → interview done → decision`, with RFE/NOID as a detour state. Each transition has its own hazard; the time to decision is the convolution of the remaining transitions. In v1 only two states are modelled explicitly (pre-interview, post-interview) because only those have any data; the others are recorded as fields in the crowdsourced schema (doc 06 §8.1) so v2 can fit them. Estimation of a multi-state model with censoring is the Aalen–Johansen estimator again, one transition at a time.

### 4.9 Left truncation (delayed entry) — essential for crowdsourced data [T]

A user who registers a case 14 months after filing was **not at risk of being observed** during months 1–13; a case decided in month 6 that never registered is invisible. Standard KM/Cox on such data overstates durations (the "waiting-time paradox"). The fix is to enter each case into the risk set only at its registration age (delayed entry): nⱼ counts cases with entry ≤ tⱼ ≤ exit. Store `registered_at` for every crowdsourced entry (doc 06 §8.1 has `report_date`) and never fit without it.

### 4.10 Two time scales: case age vs calendar time [T]

The hazard depends on **both** the case's age (an interview is not scheduled in month 1) and the **calendar month** (a hold in Jan 2026 stops everyone). This is the classic Lexis-diagram problem. The v1 solution is the product form hₖ(a) = λ_calendar(k) · g(age a), where λ_calendar is the scenario throughput and g is the age kernel e^{βa} normalized over the pool (§5.5). In v2, fit a discrete-time model with both age splines and calendar-month fixed effects (identifiable because filing cohorts overlap in calendar time).

---

## 5. Queueing and inventory accounting: what the aggregate files can tell us

### 5.1 Little's law [T]

For a stable queue, mean time in system W = L / λ, where L is the mean number in the system (pending) and λ the throughput (completions per unit time, equal to arrivals in steady state). Applied to the latest Cuban I-485 month [F][I]:

| Throughput assumption | Completions / month | W = 355,520 ÷ C (months) |
|---|---:|---:|
| August 2026 actual | 820 (386 + 434) | **433.6** |
| Summer-2026 trend continues to 4,600 (doc 07 scenario B) | 4,600 | 77.3 |
| FY2025 pace (27,602 / quarter) | 9,200 | 38.6 |
| FY2024 pace (50,627 / quarter) | 16,876 | 21.1 |

This is the same ratio the American Immigration Council calls "backlog clearance time" (all forms: 12.5 → 24.1 months from FY2025 Q2 to FY2026 Q2 [S]) and the Cuban press calls "tiempo teórico para despejar" (I-765 with I-485 pending: 9.4 → 18.6 months [S′ doc 07 §5.2]). It is a *population-average* wait, not a forecast for one case; its value is to show that **no reordering, office effect or milestone can rescue a 2025 filer while C stays near 800** [I].

### 5.2 Backlog ÷ completion rate, and its two failure modes [T][I]

- It assumes the queue is served FIFO; under age-neutral service (which the data suggest, §5.5) the *individual* wait is geometric with mean P/C but with enormous dispersion (the 10th percentile is 0.1 × P/C, the 90th 2.3 × P/C).
- It assumes C is constant; here C has changed by two orders of magnitude within 18 months (10,984 approvals in Feb 2025 → 10 in Feb 2026 → 386 in Aug 2026 [F]). The only honest treatment of C is a *scenario distribution* (§8).

### 5.3 Vintage (cohort) reconstruction of the pending pool [I from F]

The monthly file does not give the age distribution of pending cases, but it gives enough to reconstruct it: receipts by month, completions by month, the pending total (which absorbs administrative closures and transfers, footnote in the file [F]), and "pending > 6 months". Method (exactly what §11.5 `reconstructPool` does):

1. Start at September 2024 (pending 151,425, of which 97,685 older than six months [F]). Create two legacy vintages: 97,685 at representative age 12 months and 53,740 at age 3 months.
2. For each later month: age every vintage by one month; add a new vintage of that month's receipts at age 0.5; remove that month's completions from the vintages in proportion to nᵥ · e^{β·ageᵥ}; rescale all vintages so they sum to the official pending total (this absorbs closures/transfers; the monthly scale factors are 0.998–0.9993 [I], i.e., the flow identity holds to within 2.3% over two years: 151,425 + 297,408 receipts − 84,901 completions = 363,932 vs 355,520 official).

Results at the end of August 2026 (β = 0.037) [I]:

| Quantity | Value |
|---|---:|
| Pending, total (official) | 355,520 |
| Pending, filed before March 2025 | ≈ 175,200 |
| Pending, filed March 2025 or later | ≈ 180,300 |
| March-2025 vintage still pending | ≈ 23,100 of 26,187 received (88%) |
| Mean age of the pool | ≈ 19.6 months |
| Mean age of completions, model vs official (Jun / Jul / Aug 2026) | 20.0–21.9 vs 21.5 / 22.2 / 20.6 |

Lower bound without any model: 191,660 pre-March-2025 cases were pending at end-August 2025 (the "pending > 6 months" column [F]); total completions of *all* vintages from September 2025 to August 2026 were only 10,354 [F]; so **at least 181,000 minus closures ≈ 175,000 cases older than the reference case remain pending** [I]. Doc 07's assumption that the March/April 2025 cohort is "at or near the front" of a 35–70k queue [S′ doc 07 §11.1] is therefore not supported by the official files; see §13.

### 5.4 Detecting non-FIFO adjudication: three diagnostics [I]

1. **"Pending > 6 months" vs the published median.** In February 2025 the FY2024 CAA median was 4.6 months [S′], the mean age of completions 8.2 months [F], yet 109,059 of 207,564 pending cases (53%) were older than six months [F]. Under FIFO with a 4.6-month median almost nothing would be older than six months. Conclusion: even in the "fast lane" there were two lanes — quick central approvals and a slow tail (interview-routed, flagged, I-220A entrants) [I].
2. **Mean age of completions vs mean age of the pool.** FIFO ⇒ completions are the oldest cases, so their mean age ≫ pool mean age. Random order ⇒ equal. Observed: 20.6–22.2 vs ≈ 19.6 (Aug 2026); ≈ 8.3 vs ≈ 8.7 (Oct 2024–Feb 2025, model with β = 0). Both regimes are close to age-neutral [I].
3. **Cohort completion fractions.** Using the P6 column as a cohort tracer: of the 207,564 cases pending at end-Feb 2025, 15,904 (7.7%) completed in Mar–Aug 2025, which was 63% of all completions in that window; of the 267,090 pending at end-May 2025, 12,323 completed in Jun–Nov 2025, i.e., 79% of R2 completions went to cases filed by May 2025 [F][I]. So older cases *are* favoured, mildly — consistent with β ≈ 0.02–0.05, not with FIFO.

Official statements: USCIS says for I-526 that "under a strict FIFO process, we would process … in the order received" and that it abandoned FIFO for a visa-availability approach on 2020-03-31 [S: uscis.gov EB-5 Q&A; gtlaw.com]; a 2023 complaint alleges asylum moved to last-in-first-out in 2018 [S: tahirih.org, an allegation]; a practitioner blog states I-485s are not processed "in simple first-in, first-out order" [S: peterchu.com, non-authoritative]. No official I-485 ordering policy was found [S-absent]. Doc 03 §11.3 reached the same "unknown" [S′].

### 5.5 The service-discipline parameter β [I]

Model the chance that a completion in month k falls on vintage v as proportional to nᵥ · e^{β aᵥ}. β = 0 is random order; β → ∞ is FIFO. Then an individual case of age a has monthly hazard

h = C_k · e^{β a} / Σᵥ nᵥ e^{β aᵥ}

and the implied mean age of completions is Σᵥ nᵥ aᵥ e^{β aᵥ} / Σᵥ nᵥ e^{β aᵥ}. Fitting β by least squares to the official mean ages for June–August 2026 gives **β̂ = 0.0374 / month** (sum of squared errors 4.9 vs 24.1 at β = 0 and 27.0 at β = 0.08) [I]. Sensitivity of the reference-case 12-month probability to β: 8.1% (β = 0), 7.4% (0.037), 5.6% (0.10), 2.3% (0.30) — see §11.8. Caveat: the fit uses all completions; denials (53% of August's) may be younger than approvals, so β for *approvals* could be somewhat higher. Refit every month when the CSV arrives; it is one line of bisection.

### 5.6 Multi-class queues [T][I]

The inventory is not one line. It contains at least: CHNV parolees (the app's users), other parolees, Cubans who entered with I-220A (large block, many held or denied — doc 07 §11.2), visa entrants, re-filers and derivatives. Completions can be concentrated on one class (e.g., mass I-220A denials would raise C without touching parolees; a *Red Eagle*-driven push on parolee cases [S′ doc 03 §11] would do the opposite). v1 cannot separate the classes from official data; it exposes the class mix as a scenario parameter and lets crowdsourced decisions (which carry `entry_channel`) estimate the parolee share of completions in v2.

---

## 6. Regime changes: piecewise hazards and the adjudicable-time clock

### 6.1 The breakpoints (from doc 11 §2.1 and doc 03 §15; exact dates)

| Regime | Start | End | Decision hazard for a Cuban CHNV parolee's I-485 | Evidence | Tag |
|---|---|---|---|---|---|
| **R0 fast lane** | cohort start (2023-01-05 arrivals; CAA filings from Jan 2024) | **2025-02-13** | High for a "clean" subset (7,000–13,500 approvals / month), low for a slow tail | monthly file; FY23/24 medians 3.3 / 4.6 | [F][S′] |
| **R1 parolee hold** | **2025-02-14** | **2025-06-09** (legal end 2025-05-28; systems clean-up to ~2025-06-25) | ≈ 0 for parolees (cases already in the pipeline finished: 8,065 → 1,647 approvals / month) | Davidson memo; *Doe v. Noem* orders; 2025-06-09 memo | [S′][F] |
| **R2 catch-up with extra vetting** | **2025-06-09** (operationally 2025-06-25) | **2025-12-01** | Moderate: 1,647–3,529 approvals / month; (c)(9) EADs issued (reference case, Sept 2025) | monthly file | [F][S′] |
| **R3 Cuba hold-and-review** | **2025-12-02** | **2026-06-05** (vacatur) / **2026-06-11–12** (judgment, compliance alert) / **2026-07-16** (operational) | ≈ 0 (41, 15, 10, 25, 23, 27 approvals / month) | PM-602-0192 / -0194; *Dorcas* | [S′][F] |
| **R4 discretion regime** | **2026-05-21/22** (PM-602-0199; PA-2026-05 on 2026-08-05) | open | Low and rising: 370 → 626 → 820 completions / month; denials > approvals | monthly file; sub-breakpoints 2026-08-05, 2026-08-14, 2026-09-18 | [F][S′] |

Status/EAD/fee breakpoints that do **not** change the I-485 hazard but must be displayed (2025-10-30 no auto-extension for renewals; 2025-12-05 18-month EAD validity; 2026-09-18 new I-485 edition) are in doc 11 §2.2 [S′].

Placeholders the task mentioned ("Feb 14 2025, May 28 2025, Dec 2 2025, Jan 2026, Jun 5 2026") map to: R1 start 2025-02-14 ✔; R1 legal end 2025-05-28 (use 2025-06-09 operational) ✔; R3 start 2025-12-02 ✔; "Jan 2026" = PM-602-0194 widening on 2026-01-01 (no change in hazard for Cubans, already held) ✔; R3 end 2026-06-05 legal / 2026-06-12 compliance ✔. The exact dates above are confirmed in docs 03 and 11 [S′]; use the operational ends (2025-06-09, 2026-06-12) as defaults and the legal ends as a sensitivity toggle.

### 6.2 Piecewise hazards [T]

Write the calendar-time hazard as λ(k) = λ_r(k) for k in regime r, with λ_r ≈ 0 inside holds. In the vintage model, λ enters through C_k (completions per month): C_k is set to the regime's observed level for the past and to the scenario path for the future. In a crowdsourced Cox model, stratify the baseline by regime or include regime indicators as time-varying covariates; in a KM on crowdsourced data, holds appear as flat segments of Ŝ(t) *only if the time axis is calendar time*; on the age axis they are smeared across ages, which is why the age-only KM must not be used for this cohort.

### 6.3 Adjudicable time [I]

For display and for any component fitted on R0/R2 data, use **adjudicable age** = calendar age − days inside holds that applied to the user's population (R1 applies to CHNV/U4U/FRP parolees; R3 to all Cuban-born applicants — doc 03 §15.2 [S′]). Reference case (filed 2025-03-15): 584 calendar days to 2026-10-20, minus 86 (R1 to 2025-06-09) minus 192 (R3 to 2026-06-12) = **306 adjudicable days**; with the later operational ends (2025-06-25, 2026-07-16) it is 256 [I; matches doc 03 §11.2].

### 6.4 Censoring intervals in crowdsourced data [T][I]

During a hold, a reported case contributes exposure time but no events; this is correct, not a problem, as long as calendar time is a covariate. What must be avoided is treating a hold month as evidence of a low *age-specific* hazard for all time. Implementation: store milestone dates as calendar dates and convert to (age, calendar-month) pairs at fit time.

### 6.5 Online change-point detection (the "Lawfully failure" guard) [T][I]

Each month, compare observed completions C_obs with the model's expectation under the current scenario mixture; run a CUSUM on the standardized residuals (Poisson: (C_obs − C_exp)/√C_exp) and a ratio test on the last-60-day crowdsourced hazard vs fitted (doc 06 §9.3 [S′]). A trip (|CUSUM| > 4, or ratio outside 0.5–2 with N ≥ 30 events) switches the UI to a "policy uncertainty" banner and widens the scenario weights toward the extremes until two consecutive months agree with one scenario. Court/policy alerts (doc 03 §15.5 list) re-weight scenarios directly (§8.4).

---

## 7. Bayesian hierarchical pooling of sparse office data toward a national prior

### 7.1 Why pooling is unavoidable [I]

Hialeah's humanitarian column shows **1** approval in FY2026 Q3 against 37,486 pending [F]; Kendall 25 / 41,248; Miami 21 / 20,662; Tampa 84 / 34,695; Houston 24 / 34,665 [F]. A raw office rate from one approval is noise. Crowdsourced per-office counts will be smaller still for months. The standard remedy is partial pooling: estimate each office's rate as a compromise between its own data and the group, with the compromise weight set by how much data the office has (Gelman et al., *Bayesian Data Analysis*, ch. 5 [T]).

### 7.2 Conjugate Gamma–Poisson shrinkage (v1) [T]

Let office o complete yₒ cases over exposure Eₒ (pending case-months) and let the group rate be r_G. Model yₒ ~ Poisson(mₒ · r_G · Eₒ) with mₒ ~ Gamma(k₀, k₀) (prior mean 1, prior "pseudo-completions" k₀). Posterior mean of the multiplier:

m̂ₒ = (k₀ + yₒ) / (k₀ + r_G Eₒ) — equivalently m̂ₒ = (k₀·1 + yₒ·rₒ) / (k₀ + yₒ) with rₒ = (yₒ/Eₒ)/r_G when written in the "weighted average of 1 and the raw ratio" form used in §11.5.

k₀ sets how many office completions it takes to move halfway from the prior; **k₀ = 50** for official data (quarterly, contaminated by refugee/asylee cases), **k₀ = 20** for crowdsourced data (cleaner population, but self-selected). Clamp m̂ₒ to [0.5, 2.0] in v1 so a single bad quarter cannot swing an estimate by more than 2×.

### 7.3 Worked office multipliers (FY2026 Q2 + Q3, approvals-only proxy) [F][I]

Group = offices where the humanitarian column is Cuban-dominated and for which doc 04 extracted approvals (HIA, KND, MIA, TAM, HOU); exposure = average of Q2 and Q3 pending.

| Office | Approvals Q2+Q3 | Avg pending | Rate | rₒ = rate / group rate | m̂ₒ (k₀ = 50) |
|---|---:|---:|---:|---:|---:|
| Hialeah (HIA) | 3 | 37,084 | 0.0081% | 0.055 | **0.947** |
| Kendall (KND) | 35 | 40,752 | 0.0859% | 0.585 | **0.829** |
| Miami (MIA) | 27 | 20,532 | 0.1315% | 0.896 | **0.963** |
| Tampa (TAM) | 117 | 34,105 | 0.3431% | 2.336 | **1.936** |
| Houston (HOU) | 62 | 33,707 | 0.1839% | 1.253 | **1.140** |
| Group | 244 | 166,179 | 0.1468% | 1 | 1 |

Reading: Hialeah's near-zero rate is almost entirely shrunk away because 3 completions carry little information; Tampa's 117 completions are enough to earn a 1.9× multiplier. These are **illustrative**: they use approvals only (the file also has denials, which the ingestion job must include), two quarters that straddle a hold, and a humanitarian column that is a proxy for CAA. v2 replaces them with the hierarchical model in §7.4 fitted on crowdsourced decisions.

### 7.4 Full hierarchical model (v2) [T]

log hazard for case i in office o, month k, age a: cloglog(h_ik) = f(a) + γ_k + u_o + xᵢᵀβ, with u_o ~ Normal(0, τ²) (office random effects), γ_k calendar-month effects tied to the regime table, f(a) a monotone spline, x milestones and entry channel. Fit by penalized likelihood (equivalent to empirical Bayes) server-side; ship the posterior means and τ to the device. The office effect for an office with no data is 0 (multiplier 1) with uncertainty τ; the app can show "we have N = 7 reported decisions from your office; the office effect is still mostly the national average".

### 7.5 Prior choices and where they come from [I]

| Parameter | Prior / default | Basis |
|---|---|---|
| Office multiplier mₒ | Gamma(k₀, k₀), k₀ = 50 (official) / 20 (crowd); clamp [0.5, 2] | §7.2; doc 07 §11.2's "Florida penalty +2–3 months" is a weaker version of the same idea |
| Age-priority β | fitted monthly; fallback 0.037 | §5.5 |
| EAD-received multiplier | 1.0 (range 0.9–1.2 for sensitivity) | no evidence of an I-485 speed-up; EAD is a separate (c)(9) queue [F doc 04 §1.2] |
| Biometrics not done after 4 months | 0.7 | ASC scheduling is NBC-driven and usually fast [S′ doc 12 §7.9]; a long gap signals a routing problem |
| Interview done, awaiting decision | switch to log-normal AFT, median 3 mo, σ = 0.857 | attorney reports of 1–6-month post-interview waits [S′ doc 07 §11.2] |
| RFE / NOID pending | hazard 0 until response filed; then ×1.5 for 3 months | doc 07 §11.2 "add 2–6 months" |
| Mandamus filed | ×3 for 4 months then ×1 | practitioner experience that mandamus often triggers action in 60–120 days [T; doc 12 §6] |
| Approval share given decision (clean CHNV profile) | 0.85–0.90 | doc 07 §11.2 [S′]; re-estimate on FY2026 Q4 / FY2027 Q1 data |

---

## 8. Policy scenarios and Monte Carlo

### 8.1 Why scenarios rather than a trend [I]

Completions went 10,984 (Feb 2025) → 1,647 (Jun) → 3,529 (Sep) → 41 (Dec 2025) → 10 (Feb 2026) → 386 (Aug 2026) approvals per month [F]. No time-series model extrapolates that; the future depends on discrete events (the *Dorcas* appeal in the First Circuit, No. 26-1703; *AAUP v. Mullin*, 1:26-cv-14527; new USCIS memos; staffing — doc 03 §7, doc 11 §10 [S′]). The honest representation is a small set of named scenarios with weights that the owner can edit and that alerts update.

### 8.2 Default scenarios (national CAA completions per month, C_k, k = 1 is September 2026) [I]

| Scenario | ES / EN label | Path | Default weight | Rationale |
|---|---|---|---:|---|
| **S0** | *Estancamiento* / Status quo | 800 flat | 0.30 | August 2026 level [F] |
| **S1** | *Recuperación parcial* / Partial recovery | linear ramp 800 → 4,600 over 12 months, then flat | 0.40 | doc 07 scenario B (half of FY2025 pace); attorneys report "nuevas decisiones" in Sept–Oct 2026 [S′ doc 07 §9]; Directorio Cubano: "aumentan las aprobaciones … desde junio" [S] |
| **S2** | *Ritmo de 2025* / FY2025 pace | ramp 800 → 9,200 over 6 months, then flat | 0.15 | 27,602 completions / quarter in Apr–Jun 2025 [S′ doc 07 §3.2] |
| **S3** | *Nueva pausa* / Re-freeze | 0 for 6 months, then S1 from its start | 0.15 | First-Circuit reversal risk [S′ doc 03 §11.3] |

The weights are judgments, flagged as such in the UI ("escenarios de política: pesos editables"). A return to the FY2024 pace (16,876 / month) is deliberately *not* a default scenario; the sensitivity table in §11.8 shows what it would take.

### 8.3 v1: deterministic scenario grid (quasi-Monte Carlo) [I]

Instead of random draws, enumerate scenario × β ∈ {β̂/2, β̂, 2β̂} × office multiplier ∈ {m̂ₒ·0.8, m̂ₒ, m̂ₒ·1.25} with product weights (scenario weight × {0.25, 0.5, 0.25} × {0.25, 0.5, 0.25}) — 36 paths × 72 months × ≤ 60 vintages ≈ 150k multiply-adds, well under 100 ms on a phone. Deterministic outputs make unit tests exact. The mixture survival is the weighted average of path survivals, conditioned per path on "still pending today" (§4.6).

### 8.4 v2: seeded Monte Carlo [T][I]

Draw per simulation: scenario (categorical), hold start ~ Uniform(1, 12) and duration ~ Uniform(3, 9) months for S3, ramp speed ~ log-normal around the default, β ~ Normal(β̂, 0.02) truncated at 0, log mₒ ~ Normal(log m̂ₒ, τ), receipts path, approval share ~ Beta. 2,000 draws with a fixed seed; report quantiles of the decision-month distribution and the *probability of each scenario given survival* (the posterior weights). Alerts (court rulings, memos) update the scenario weights by a published rule, e.g., "*Dorcas* affirmed → S3 weight ÷ 3; reversed → S3 weight × 3" — the rule, not the model, is what the owner edits.

---

## 9. Crowdsourced data: self-selection and how to contain it

### 9.1 The biases [T][I]

| Bias | Mechanism | Direction |
|---|---|---|
| **Registration self-selection** | People who are worried (long waits) or elated (just approved) register; the median case does not | Fat tails both ways; approvals over-represented among *completed* entries |
| **Survivorship / attrition** | Users stop updating after a decision (especially denials) or after losing interest | Decisions under-reported → KM without delayed entry overstates waits; denials under-reported → approval share overstated |
| **Delayed entry** | Registration months after filing | Handled by left truncation (§4.9); ignoring it biases durations upward |
| **Platform population** | Trackitt is "EB-heavy, Indian/Chinese-dominated"; Lawfully has no Cuban category [S′ doc 06 §1, §3.2] | Near-zero CAA coverage; cannot be used as the CAA sample |
| **Date errors and duplicates** | Wrong receipt date (notice date vs received date), same case entered twice, family members entered as one | Noise; duplicates inflate N |
| **Rumour cascades** | Community groups amplify single cases ("approved in 2 weeks after mandamus") | Over-weights rare events |

### 9.2 Controls (implementable in the data pipeline) [I]

1. **Delayed entry always** (`registered_at` is a required field; the risk set starts there).
2. **Benchmark to official totals monthly:** the crowdsourced sample's implied national completions and approval share must be compared with the CSV; if the sample shows 30% decided in a month when USCIS completed 0.23% of the inventory, the sample is not representative and the UI says so (doc 06 §9.2 [S′]).
3. **Post-stratification / inverse-probability weights** by office × filing quarter × entry channel using the official pending counts as the frame (the per-office humanitarian pending column is the only official frame; use it with the caveats of §7.3).
4. **Completeness and source weights:** entries with receipt-notice evidence (receipt number format check, doc 04 §3.3) weigh 1.0; free-text reports 0.5; journalist-reported anecdotes 0.3 (doc 06 §9.4 [S′]).
5. **Cell suppression:** never show an office × filing-quarter estimate with N < 10 decisions; show N behind every number.
6. **Cap influence:** no single office-month cell contributes more than 5% of the national likelihood.
7. **Privacy:** store receipt numbers hashed; never display individual rows; aggregate to ≥ 10 before export.

### 9.3 What crowdsourced data are *good* for, even when small [I]

Milestone sub-models (biometrics lag, interview scheduling lag, post-interview lag, RFE frequency) need only dozens of events, are not strongly selected on, and are exactly what the official files lack. Office effects need hundreds. National throughput needs none — the CSV is better.

---

## 10. Calibration, backtesting and scoring

### 10.1 Metrics [T]

- **Interval coverage:** the share of realized decision months falling inside the forecast's 50% / 80% / 90% intervals should be ≈ 50 / 80 / 90%. Under-coverage means over-confidence.
- **PIT histogram:** F̂(y) for each realized y should be Uniform(0, 1); a U-shape means too narrow, a hump means too wide.
- **Brier score** for the binary forecast "decision within 12 months": mean of (p̂ − 1{y ≤ 12})²; decompose into reliability and resolution.
- **Log score:** −log f̂(y) for the predicted month; proper, but punishes zeros — floor the predictive mass at 10⁻⁴ per month.
- **Discrete-time CRPS:** for a monthly forecast CDF F̂(k) and realized month y, CRPS = Σ_k (F̂(k) − 1{y ≤ k})², summed over the horizon; the censored version for still-pending cases uses the survival-CRPS of Gneiting & Ranjan / the censored CRPS of the survival-forecasting literature (sum only up to the censoring month) [T]. Toy check (§11.9 T9): uniform forecast over months 1–4 and y = 2 gives CRPS = 0.375.
- Reference for proper scoring rules: Gneiting & Raftery, *JASA* 102:359–378, 2007 [T].

### 10.2 Backtest protocol (rolling origins, regime-aware) [I]

1. For each origin month m from October 2024 to the latest month with ≥ 6 months of follow-up, truncate the monthly series at m and run the full v1 pipeline (pool reconstruction, β fit, scenario grid) **as it would have run then**, with the scenario weights the owner would have chosen at the time (record them; do not use hindsight weights).
2. Score against what the next 1–24 months of official completions by vintage *imply* (vintage-level realized hazards from the same reconstruction run forward with the realized C) and, once available, against crowdsourced decisions.
3. Report scores separately by regime of the origin month. Expect R0 and R2 origins to be scorable; R3 origins have ~55 completions per month and will show near-zero resolution — say so rather than claim calibration.
4. Acceptance for shipping v1: 90% interval coverage between 80% and 97% on R0/R2 origins; Brier for "decision within 12 months" better than the climatological forecast (constant p = observed share).

### 10.3 What cannot be validated today [I]

Nothing about the R4 regime can be validated before FY2026 Q4 (published ≈ January 2027 [F doc 04 cadence]) and the next two monthly files. The UI must label every R4-period estimate "no validado — basado en 3 meses de datos" / "not yet validated — based on 3 months of data".

---

## 11. Recommended v1 model: VPH-1 (vintage-pool hazard with a policy-scenario grid)

### 11.1 One-paragraph description

Reconstruct the national pending pool by filing month from the official monthly file (§5.3); fit the age-priority β to the official mean age of completions (§5.5); project the pool forward 72 months under each policy scenario (§8.2); the applicant's monthly hazard is his vintage's share of projected completions, times a shrunken office multiplier (§7.2) and milestone multipliers (§7.5); condition on "still pending today" (§4.6); mix over the scenario grid (§8.3); output probabilities by horizon, quantiles (or "beyond horizon"), posterior scenario weights, the adjudicable-time strip, and a separately-caveated approval share. Everything is pure TypeScript on arrays; data are two small JSON files shipped with the app and refreshed from the ingestion job.

### 11.2 Inputs (types)

```ts
type YearMonth = string;                      // "2026-08"
interface MonthlyRow {                        // doc 04 §1.1, I-485 (Cuban)
  ym: YearMonth; received: number; approved: number; denied: number;
  pending: number; pendingOver6: number; avgMonths: number;
}
interface Regime { id: 'R0'|'R1'|'R2'|'R3'|'R4'; start: string; end: string|null;
  hold: boolean; appliesTo: ('CHNV'|'ALL_CUBAN')[]; }
interface Scenario { id: string; labelEs: string; labelEn: string; weight: number;
  completions: (k: number) => number; }      // k = 1.. months after the last official month
interface OfficeStat { code: string; completions: number; avgPending: number; }   // doc 04 §1.3
interface CaseInput {
  filedOn: string;                            // ISO date of I-485 receipt
  officeCode?: string;                        // from ZIP (doc 12 §3); undefined = national
  entryChannel: 'CHNV'|'CBP_ONE'|'I220A'|'VISA'|'OTHER';
  milestones: { biometricsOn?: string; eadOn?: string; interviewScheduledFor?: string;
                interviewOn?: string; rfeOn?: string; rfeRespondedOn?: string;
                mandamusOn?: string; };
  today: string;
}
interface ModelParams { beta?: number; k0Office: number; clampOffice: [number, number];
  horizonMonths: number; receiptsForecast: number; postInterview: { medianMonths: number; sigma: number };
  multipliers: { ead: number; noBiometricsAfter4mo: number; rfePending: number; rfeAnswered: number; mandamus: number }; }
```

### 11.3 Outputs

```ts
interface Estimate {
  asOfData: YearMonth;                        // "2026-08" — shown on screen
  monthsPendingCalendar: number; adjudicableDays: number; holdsApplied: Regime['id'][];
  pDecisionWithin: { m3: number; m6: number; m12: number; m24: number; m36: number };
  quantilesMonths: { q10: number|null; q25: number|null; q50: number|null; q75: number|null; q90: number|null }; // null = beyond horizon
  survivalCurve: number[];                    // S(0..H) from today, for the fan chart
  perScenario: { id: string; posteriorWeight: number; pWithin12: number; medianMonths: number|null }[];
  officeMultiplier: { value: number; nCompletions: number; source: 'official'|'crowd'|'none' };
  approvalShareGivenDecision: { value: number; caveat: 'selection' };
  queue: { pendingTotal: number; olderThanYou: number; sameMonthAsYou: number; completionsLastMonth: number; beta: number };
  confidence: 'LOW'|'MEDIUM'|'HIGH'; validated: boolean;
}
```

### 11.4 Algorithm (step by step)

1. **Clean the series** (parse "355,520" strings, BOM, trailing commas — doc 04 §1.1); drop months before the first month that has `pendingOver6`.
2. **Reconstruct the pool** (`reconstructPool`): two legacy vintages at the first month, then per month: age +1, add vintage (receipts, age 0.5), remove completions ∝ n·e^{βa}, rescale to official pending.
3. **Fit β** by minimizing Σ (model mean age of completions − official avgMonths)² over the last three months with ≥ 300 completions; bisection/ternary search on [0, 0.3]; fallback 0.037 if fewer than three qualifying months.
4. **Locate the applicant's vintage** = filing month; if filed before the series starts, use the legacy vintage. Compute `olderThanYou` = Σ n over vintages with age > applicant's age.
5. **Office multiplier** from `OfficeStat` with Gamma–Poisson shrinkage and clamping; 1.0 if no office.
6. **Milestone state:** if `interviewOn` and no decision → post-interview AFT (skip steps 7–8 for the hazard; use the log-normal CDF shifted by months since interview, conditioned on survival to today); else compute multipliers (EAD, biometrics gap, RFE, mandamus) as in §7.5.
7. **Project** each (scenario, β, m) path: for k = 1..H: age +1, add receipts vintage, C_k = scenario, hazard h_k = min(0.95, C_k·e^{βa_u}/W · m_office · m_milestone), remove completions, S_k = S_{k−1}(1 − h_k).
8. **Condition on today:** k₀ = months from the last official month to today (rounded down; 2 for 2026-10-20 vs August data); per path S_c(k) = S(k)/S(k₀) for k ≥ k₀; posterior path weight ∝ prior weight × S(k₀).
9. **Mix** and extract probabilities at k₀ + {3, 6, 12, 24, 36} and quantiles (first k with 1 − S_c ≥ q, else null).
10. **Approval share** = profile prior (0.85–0.90 for a clean CHNV parolee) with the selection caveat; never multiply it into the timing curve.
11. **Confidence label:** LOW while the latest regime has < 6 months of data or crowdsourced N < 30 for the office; MEDIUM when both pass; HIGH only after a backtest (§10.2) passes.

### 11.5 TypeScript pseudo-code (mirrors the Python used to produce §11.8–11.9 exactly)

```ts
interface Vintage { age: number; n: number; label: string }

export function reconstructPool(rows: MonthlyRow[], beta: number): Vintage[] {
  const first = rows[0];
  const pool: Vintage[] = [
    { age: 12, n: first.pendingOver6, label: 'legacy>6mo' },
    { age: 3,  n: first.pending - first.pendingOver6, label: 'legacy<6mo' },
  ];
  for (const r of rows.slice(1)) {
    for (const v of pool) v.age += 1;
    pool.push({ age: 0.5, n: r.received, label: r.ym });
    removeCompletions(pool, r.approved + r.denied, beta);
    const scale = r.pending / pool.reduce((s, v) => s + v.n, 0);
    for (const v of pool) v.n *= scale;                       // absorbs closures/transfers
  }
  return pool;
}

function removeCompletions(pool: Vintage[], C: number, beta: number): void {
  const w = pool.map(v => v.n * Math.exp(beta * v.age));
  const W = w.reduce((a, b) => a + b, 0);
  pool.forEach((v, i) => { v.n = Math.max(0, v.n - C * w[i] / W); });
}

export function meanAgeOfCompletions(pool: Vintage[], beta: number): number {
  const w = pool.map(v => v.n * Math.exp(beta * v.age));
  const W = w.reduce((a, b) => a + b, 0);
  return pool.reduce((s, v, i) => s + w[i] * v.age, 0) / W;
}

export function fitBeta(rows: MonthlyRow[]): number {
  const targets = rows.filter(r => r.approved + r.denied >= 300).slice(-3);
  if (targets.length < 3) return 0.037;
  const sse = (b: number) => {
    // replay reconstruction, recording the model mean age in each target month BEFORE removal
    let err = 0; const pool: Vintage[] = [/* as in reconstructPool */];
    /* ... same loop; when r.ym is a target month: err += (meanAgeOfCompletions(pool,b) - r.avgMonths)**2 ... */
    return err;
  };
  let lo = 0, hi = 0.3;                                       // ternary search, 60 iterations
  for (let i = 0; i < 60; i++) { const m1 = lo + (hi-lo)/3, m2 = hi - (hi-lo)/3; if (sse(m1) < sse(m2)) hi = m2; else lo = m1; }
  return (lo + hi) / 2;
}

export function officeMultiplier(o: OfficeStat|undefined, group: OfficeStat[], k0 = 50, clamp: [number,number] = [0.5, 2]): number {
  if (!o) return 1;
  const gRate = group.reduce((s,x)=>s+x.completions,0) / group.reduce((s,x)=>s+x.avgPending,0);
  const r = (o.completions / o.avgPending) / gRate;
  const m = (k0 + o.completions * r) / (k0 + o.completions);
  return Math.min(clamp[1], Math.max(clamp[0], m));
}

export function projectPath(pool0: Vintage[], userLabel: string, beta: number, scen: Scenario,
                            m: number, H: number, receipts: number): number[] {
  const pool = pool0.map(v => ({ ...v }));
  const u = pool.find(v => v.label === userLabel)!;
  const S: number[] = [1];
  for (let k = 1; k <= H; k++) {
    for (const v of pool) v.age += 1;
    pool.push({ age: 0.5, n: receipts, label: `f${k}` });
    const C = scen.completions(k);
    const w = pool.map(v => v.n * Math.exp(beta * v.age));
    const W = w.reduce((a, b) => a + b, 0);
    const h = Math.min(0.95, C * Math.exp(beta * u.age) / W * m);
    pool.forEach((v, i) => { v.n = Math.max(0, v.n - C * w[i] / W); });
    S.push(S[k - 1] * (1 - h));
  }
  return S;
}

export function mixAndCondition(paths: { S: number[]; prior: number }[], k0: number): { S: number[]; post: number[] } {
  const post = paths.map(p => p.prior * p.S[k0]);           // scenario weights updated by survival to today
  const Z = post.reduce((a, b) => a + b, 0);
  const H = paths[0].S.length - 1;
  const S: number[] = [];
  for (let k = k0; k <= H; k++) S.push(paths.reduce((s, p, i) => s + (post[i] / Z) * p.S[k] / p.S[k0], 0));
  return { S, post: post.map(x => x / Z) };                  // S[0] = today
}

export function postInterviewCdf(monthsSinceInterview: number, ahead: number, median = 3, sigma = 0.857): number {
  const F = (t: number) => t <= 0 ? 0 : Phi((Math.log(t) - Math.log(median)) / sigma);
  const S0 = 1 - F(monthsSinceInterview);
  return 1 - (1 - F(monthsSinceInterview + ahead)) / S0;      // conditional on no decision yet
}

export function adjudicableDays(filedOn: Date, today: Date, regimes: Regime[], channel: CaseInput['entryChannel']): number {
  let days = daysBetween(filedOn, today);
  for (const r of regimes.filter(r => r.hold && (r.appliesTo.includes('ALL_CUBAN') || (channel === 'CHNV' && r.appliesTo.includes('CHNV'))))) {
    days -= overlapDays(filedOn, today, new Date(r.start), r.end ? new Date(r.end) : today);
  }
  return days;
}

export function scenariosDefault(): Scenario[] {
  const ramp = (from: number, to: number, months: number) => (k: number) => from + (to - from) * Math.min(k, months) / months;
  return [
    { id: 'S0', labelEs: 'Estancamiento', labelEn: 'Status quo', weight: 0.30, completions: () => 800 },
    { id: 'S1', labelEs: 'Recuperación parcial', labelEn: 'Partial recovery', weight: 0.40, completions: ramp(800, 4600, 12) },
    { id: 'S2', labelEs: 'Ritmo de 2025', labelEn: 'FY2025 pace', weight: 0.15, completions: ramp(800, 9200, 6) },
    { id: 'S3', labelEs: 'Nueva pausa', labelEn: 'Re-freeze', weight: 0.15, completions: (k) => k <= 6 ? 0 : ramp(800, 4600, 12)(k - 6) },
  ];
}
```

Defaults: `H = 72`, `receiptsForecast = 1000`, `k0Office = 50`, `clampOffice = [0.5, 2]`, `postInterview = {medianMonths: 3, sigma: 0.857}`, `multipliers = {ead: 1.0, noBiometricsAfter4mo: 0.7, rfePending: 0, rfeAnswered: 1.5, mandamus: 3}`.

### 11.6 Data files shipped with the app

- `caa_monthly.json`: the `MonthlyRow[]` series (currently 24 rows, Sep 2024 → Aug 2026; ~2 KB), refreshed by the ingestion job from the Report-to-Congress CSV (doc 04 §1.1).
- `regimes.json`: the table in §6.1 with `hold`, `appliesTo` and alternative end dates.
- `offices.json`: `OfficeStat[]` from the quarterly by-office workbook (doc 04 §1.3), Cuban-dominated group flagged (doc 12 §2).
- `scenarios.json`: §8.2, editable; the alert feed may patch `weight`.
- `beta.json`: the last server-side fit, used as the fallback.

### 11.7 Presenting uncertainty (rules and bilingual copy)

Rules: (1) never show a single date; (2) lead with probabilities by horizon; (3) show the median only if it is inside the horizon, otherwise say "more than N years"; (4) always show the data vintage, the queue numbers and N; (5) show the scenario weights with a toggle; (6) show the adjudicable-time strip ("what happened to your case"); (7) show approval share in a separate card with the selection caveat; (8) label validation status.

| Element | Español | English |
|---|---|---|
| Headline | **Probabilidad de decisión de su I-485 en los próximos 12 meses: 9% (entre 2% y 26% según el escenario de política).** | **Chance of an I-485 decision in the next 12 months: 9% (2–26% depending on the policy scenario).** |
| Horizons | En 6 meses: 4% · En 2 años: 22% · En 3 años: 36% | Within 6 months: 4% · 2 years: 22% · 3 years: 36% |
| Median | La mitad de los casos como el suyo tardaría **más de 4 años** al ritmo actual mezclado; con el ritmo de 2025 serían unos 22 meses. | Half of cases like yours would take **more than 4 years** under the blended outlook; at the 2025 pace, about 22 months. |
| Queue | Pendientes a nivel nacional: 355,520 (agosto 2026). Más antiguos que el suyo: ≈175,000. Presentados el mismo mes: ≈23,100. Decisiones el mes pasado: 820. | Pending nationally: 355,520 (Aug 2026). Older than yours: ≈175,000. Filed the same month: ≈23,100. Decisions last month: 820. |
| Clock | Su caso lleva 19 meses presentado, de los cuales ≈10 estuvieron bajo pausas (14 feb–9 jun 2025; 2 dic 2025–12 jun 2026). Tiempo "adjudicable": ≈10 meses. | Pending 19 months, ≈10 of them under holds (Feb 14–Jun 9 2025; Dec 2 2025–Jun 12 2026). "Adjudicable" time: ≈10 months. |
| Scenario card | Escenarios (pesos editables): estancamiento 30% · recuperación parcial 40% · ritmo de 2025 15% · nueva pausa 15%. | Scenarios (editable weights): status quo 30% · partial recovery 40% · FY2025 pace 15% · re-freeze 15%. |
| Approval card | Si se decide, probabilidad de aprobación para un parole CHNV con expediente limpio: ≈85–90%. La tasa publicada de 2026 (24%) refleja qué casos se decidieron durante la pausa, no su elegibilidad. | If decided, approval chance for a clean CHNV parolee: ≈85–90%. The published 2026 rate (24%) reflects which cases were decided during the hold, not your eligibility. |
| Caveat | Estimación estadística con datos oficiales hasta agosto 2026; no es asesoría legal; **no validada** para el régimen actual (3 meses de datos). | Statistical estimate from official data through August 2026; not legal advice; **not yet validated** for the current regime (3 months of data). |
| Office line | Oficina: Hialeah. Multiplicador de velocidad 0.95 (3 aprobaciones en 2 trimestres; dato débil, ajustado hacia el promedio nacional). | Office: Hialeah. Speed multiplier 0.95 (3 approvals in 2 quarters; weak data, pulled toward the national average). |

### 11.8 Worked example: the owner's reference case

Inputs: filed 2025-03-15 (vintage 2025-03); EAD received September 2025; biometrics done (implied by the EAD); no interview, no RFE; entry channel CHNV; office unknown (also shown for five offices); today 2026-10-20; latest official month August 2026 (k₀ = 2); β̂ = 0.0374; default scenarios and weights; receipts forecast 1,000 / month; horizon 72 months.

**Pool facts at August 2026** [F][I]: pending 355,520; older than the applicant ≈ 175,200; same vintage ≈ 23,100 of 26,187; completions last month 820; mean pool age ≈ 19.6 months; applicant's calendar age 19 months, adjudicable ≈ 306 days.

**Posterior scenario weights after conditioning on "still pending in October 2026":** S0 0.301, S1 0.400, S2 0.149, S3 0.151 (essentially the priors; survival to today is likely under every scenario) [I].

**Probability of an I-485 decision within N months of 2026-10-20** [I]:

| Case | 3 mo | 6 mo | 12 mo | 18 mo | 24 mo | 36 mo | 60 mo | q10 | q25 | q50 | q75 | q90 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **Mixture, office unknown** | 1.5% | 3.7% | **9.4%** | 15.7% | 22.3% | 35.6% | 55.4% | 13 | 27 | **53** | >72 | >72 |
| S0 status quo only | 0.6% | 1.2% | 2.4% | 3.6% | 4.7% | 7.1% | 11.9% | 51 | >72 | >72 | >72 | >72 |
| S1 partial recovery only | 1.5% | 3.8% | 10.2% | 17.3% | 24.4% | 38.9% | 69.2% | 12 | 25 | 45 | 65 | >72 |
| S2 FY2025 pace only | 4.8% | 11.9% | 26.3% | 41.2% | 56.7% | 88.3% | 100% | 6 | 12 | 22 | 31 | 37 |
| S3 re-freeze only | 0.0% | 0.6% | 4.4% | 10.8% | 17.7% | 31.9% | 61.6% | 18 | 31 | 51 | >72 | >72 |
| Mixture, Hialeah (m = 0.947) | 1.4% | 3.5% | 8.9% | 15.0% | 21.3% | 34.5% | 54.1% | 14 | 28 | 55 | >72 | >72 |
| Mixture, Kendall (m = 0.829) | 1.3% | 3.1% | 7.9% | 13.3% | 19.1% | 31.6% | 51.0% | 15 | 30 | 59 | >72 | >72 |
| Mixture, Miami (m = 0.963) | 1.5% | 3.6% | 9.1% | 15.2% | 21.6% | 34.8% | 54.5% | 13 | 28 | 55 | >72 | >72 |
| Mixture, Tampa (m = 1.936) | 2.9% | 7.0% | 16.9% | 26.9% | 36.2% | 51.2% | 70.1% | 8 | 17 | 35 | 70 | >72 |
| Mixture, Houston (m = 1.140) | 1.7% | 4.2% | 10.6% | 17.6% | 24.7% | 38.6% | 58.5% | 12 | 25 | 49 | >72 | >72 |
| Comparison: filed Oct 2025, office unknown | 1.2% | 2.9% | 7.4% | 12.5% | 18.0% | 30.1% | 49.3% | 16 | 32 | 61 | >72 | >72 |

Calendar translation for the mixture: P(decision by 31 Dec 2026) ≈ 0.9%; by 31 Mar 2027 ≈ 2.9%; by 30 Jun 2027 ≈ 5.5%; by 31 Dec 2027 ≈ 11.5%; by 31 Dec 2028 ≈ 24.5% [I].

**Sensitivity** [I]:

| Change | P(≤ 12 mo) | median |
|---|---:|---:|
| β = 0 (random order) | 8.1% | 56 |
| β = 0.10 (stronger age priority) | 5.6% | 55 |
| β = 0.30 (near-FIFO) | 2.3% | 53 |
| Optimistic weights (S0 .15 / S1 .40 / S2 .30 / S3 .15) | 13.0% | 38 |
| Pessimistic weights (S0 .45 / S1 .30 / S2 .05 / S3 .20) | 6.3% | 70 |
| S2 certain | 26.3% | 22 |
| Throughput needed for P(≤ 12 mo) = 50% | — | ≈ 21,800 completions / month (above the FY2024 peak of 16,876) |

Reading for the owner: the difference between Hialeah and Houston is 2 points of probability; the difference between "status quo" and "FY2025 pace" is 24 points. The two things worth watching are the monthly completions row of the CSV and the court dockets — not the office.

### 11.9 Unit tests with expected outputs (tolerances in brackets; all values reproduced in this session)

| # | Test | Setup | Expected |
|---|---|---|---|
| T1 | Constant-hazard sanity | β = 0, scenario flat 800, receipts 0, pool as of Aug 2026, vintage 2025-03, m = 1 | h₁ = 800/355,520 = 0.0022502 [±1e-7]; S(12) = 0.973 [±0.001] (closed form (1−h)^12 = 0.97333; the model's S(12) is 0.9730 because the pool shrinks by 800/month) |
| T2 | Hold scenario | S3, any β | h₁…h₆ = 0 exactly; S(6) = 1.0 exactly |
| T3 | FIFO limit | β = 1.0, S1 | vintage 2025-03: h₁ = 2.3e-9, S(24) = 0.9934 [±0.001]; legacy>6mo vintage: h₁ = 0.0906 [±0.001], S(12) = 0.0 [< 1e-6] (older cases are consumed first) |
| T4 | Conditional survival | S1, β̂, k₀ = 2 | S_c(2) = 1 exactly; S_c(12) = S(12)/S(2) = 0.92072 [±1e-4] |
| T5 | Mixture weights | priors (0.30, 0.40, 0.15, 0.15), k₀ = 2 | posterior sums to 1 [±1e-12]; posterior = (0.3006, 0.3998, 0.1487, 0.1509) [±0.001] |
| T6 | Office shrinkage | HIA: 3 completions / 37,084 pending; group 244 / 166,179; k₀ = 50 | r = 0.055 [±0.002]; m = 0.947 [±0.002]; TAM 117 / 34,105 → m = 1.936 [±0.002]; clamp: m = 5 → 2.0, m = 0.1 → 0.5 |
| T7 | Kaplan–Meier | (3,1),(5,1),(5,0),(8,1),(10,0),(12,1) | Ŝ(3) = 0.8333, Ŝ(5) = 0.6667, Ŝ(8) = 0.4444, Ŝ(12) = 0 [±1e-4]; risk sets 6, 5, 3, 1 |
| T8 | Conditional from KM | same data | Ŝ(8 | 5) = 0.4444/0.6667 = 0.6667 [±1e-4] |
| T9 | Discrete CRPS | forecast uniform on months 1–4, realized y = 2 | 0.375 exactly; forecast point mass at 3, y = 3 → 0 |
| T10 | Post-interview AFT | median 3, σ = 0.857 | F(1) = 0.10, F(3) = 0.50, F(6) = 0.79, F(9) = 0.90 [±0.005]; conditional: P(decision within 3 | 3 months since interview) = (F(6)−F(3))/(1−F(3)) = 0.58 [±0.01] |
| T11 | Adjudicable days | filed 2025-03-15, today 2026-10-20, CHNV | calendar 584; R1 overlap 86; R3 overlap 192; adjudicable **306**; with alternative ends (2025-06-25, 2026-07-16) **256** |
| T12 | Little's law | pending 355,520; C = 820 / 9,200 / 16,876 | 433.6 / 38.6 / 21.1 months [±0.1] |
| T13 | Pool invariants | reconstruction with β̂ through Aug 2026 | Σ n = 355,520 [±1]; min vintage ≥ 0 (actual min 1,210.8); 25 vintages; all monthly scale factors in [0.99, 1.01] |
| T14 | β fit | official series | β̂ = 0.0374 [±0.003]; SSE(β̂) < SSE(0) and < SSE(0.08) |
| T15 | Reference case end-to-end | §11.8 inputs, office unknown | P(≤12) = 0.094 [±0.003]; P(≤24) = 0.223 [±0.005]; q10 = 13, q25 = 27, q50 = 53, q75 = null [exact months] |
| T16 | Office ordering | same case, TAM vs KND | P_TAM(≤12) = 0.169 > P_HOU = 0.106 > P_unknown = 0.094 > P_HIA = 0.089 > P_KND = 0.079 [±0.003 each] |
| T17 | Vintage ordering under β̂ | filed Oct 2025 vs Mar 2025 | P_Oct2025(≤12) = 0.074 < P_Mar2025(≤12) = 0.094 (older vintage slightly favoured) |
| T18 | RFE state | rfeOn set, no response | hazard 0 for all k until `rfeRespondedOn`; P(≤12) = 0 |
| T19 | Regime applicability | entry channel VISA (Cuban-born, not parolee) | R1 not subtracted, R3 subtracted: adjudicable = 584 − 192 = 392 |
| T20 | Data-vintage guard | monthly file older than 75 days | `confidence = 'LOW'`, UI banner "datos desactualizados"; estimates still computed |

### 11.10 Performance and size [I]

Pool ≤ 60 vintages × 72 months × 36 grid paths ≈ 155k inner-loop iterations with one `Math.exp` each (cacheable per age): < 20 ms on a 2020-era phone, no allocation beyond a few arrays. Data files < 20 KB total. No network call is needed to compute; the network is only for refreshing the JSON files.

---

## 12. v2 upgrade path

| Step | What | Needs | Payoff |
|---|---|---|---|
| v1.1 | Include denials in the office file; fit β separately for approvals and denials once the quarterly file gives per-category medians | next quarterly release | cleaner β, better office multipliers |
| v1.2 | Online change-point monitor (§6.5) and alert-driven scenario weights (§8.4) | alert feed from doc 03 §15.5 | removes the "Lawfully lag" |
| v2.0 | Crowdsourced milestone sub-models with delayed entry (biometrics lag, interview scheduling lag, post-interview lag, RFE rate) — Aalen–Johansen per transition | ≥ 30 events per transition | milestone-conditional estimates that are actually measured |
| v2.1 | Hierarchical office effects (§7.4) fitted server-side; τ shipped to device | ≥ 10 decisions in ≥ 5 offices | office line with honest N |
| v2.2 | Multi-class pool (parolee vs I-220A vs other) using `entry_channel` in crowdsourced decisions to estimate the parolee share of completions | ≥ 100 crowdsourced decisions | fixes the biggest known mis-specification of v1 (§5.6) |
| v2.3 | Seeded Monte Carlo (§8.4) with uncertainty on ramp speed, hold timing, β, mₒ, receipts | none | smoother fan charts; proper predictive intervals |
| v2.4 | Competing-risks output (approval vs denial cumulative incidence) once post-freeze decision mixes are observable | FY2026 Q4 / FY2027 Q1 files | "whether" and "when" in one consistent model |
| v2.5 | Backtest dashboard (§10.2) with coverage/PIT/Brier/CRPS by regime; promote `confidence` to MEDIUM/HIGH only on passing | 6+ months of R4 data | earned trust |
| v3 | Discrete-time model with age splines + calendar effects + office random effects on individual crowdsourced records (§4.10), replacing the vintage approximation | thousands of records | the full Lexis model |

---

## 13. Discrepancies with earlier documents and open questions

1. **Doc 07 §11.2 vs this document.** Doc 07 gives a median of 9–10 months from today for a Florida filer (LOW confidence) by assuming (a) the March/April 2025 cohort has only 35–70k cases ahead of it and (b) throughput moves to ~4,600 / month. The official files support neither "front of the queue" (§5.3: ≈175k older cases pending) nor a FIFO service discipline (§5.4–5.5); under assumption (b) alone (scenario S1) the model gives a median of 45 months and a 10% chance within 12 months. The two documents agree on the direction of every qualitative factor (office, interview, RFE, policy) and on the LOW confidence. **Recommendation:** adopt the probability-by-horizon presentation of §11.7 and retire the "median 9–10 months" line until a backtest supports something shorter. [I]
2. **Is the pool really age-neutral for parolees?** β is fitted on all Cuban completions, including denials and non-parolee classes. If USCIS is in fact working parolee cases oldest-first (as the *Red Eagle* "resume normal adjudication" order might encourage [S′ doc 03 §11]), the parolee-class β could be much larger and the reference case better placed than §11.8 shows. Only crowdsourced decisions with `entry_channel` can answer this. [I]
3. **September 2026 monthly file.** Expected in October 2026 [F cadence]; if completions jumped (attorney reports of "nuevas decisiones" [S′ doc 07 §9]; Directorio Cubano's "aumentan las aprobaciones" [S]), the S1 weight should rise and the S0 weight fall. The model refits in one step. [I]
4. **Exact percentile behind the case-inquiry date.** Secondary sources say ~93% "generally" [S]; the USCIS orphan/Hague FAQ says 93% [S′ doc 04 §2.1]; the general FAQ page could not be opened. Confirm from `https://egov.uscis.gov/processing-times/processing-times-faqs` on a normal connection. The app uses the inquiry date only as a flag, so the exact percentile is cosmetic.
5. **Trackitt's computation.** Not found today [S-absent]; from training it is simple averaging of user-entered dates [T]. Irrelevant for data (near-zero CAA rows) but worth a look for column design.
6. **Pending-count discrepancy** (342,360 quarterly vs 355,371 monthly for June 2026 [F]; doc 04 §1.1 attributes it to query timing and footnotes 9–10). The vintage model uses the monthly series; switching to the quarterly total changes every hazard by ~4%. Record both.
7. **No published survival-analysis treatment of USCIS backlogs was found** [S-absent]; the AIC dashboard and the Cuban press use backlog ÷ capacity ratios [S]. CRS's immigration-court reports cite TRAC's "average pending time" (933 days, Oct 2021) and median pending times by detention status [S: congress.gov R47077] — pending-age statistics, which is the right instinct, but no censoring model. The method in this document is therefore the project's own; §10 is how to earn trust for it.

---

## 14. Sources

### 14.1 URLs surfaced by today's six searches ([S])

Processing-time methodology (80% / six months / median lower bound / ~93% inquiry threshold):
- https://www.cliniclegal.org/resources/when-cases-stall-practitioners-guide-outside-normal-processing-time
- https://www.lighthousehq.com/blog/uscis-processing-times
- https://www.immigrationdirect.com/blog/form-i-485-processing-time/
- https://www.visacasetimes.com/guides/uscis-processing-times-explained
- https://greencardtracker.com/tools/processing-times
- https://www.novo-legal.com/immigration-law/processing-times/i-765
- https://fedlaws.org/uscis-processing-times-how-to-check-read-and-escalate/
- https://www.nnuimmigration.com/uscis-processing-times/
- https://mandamuslawyers.com/uscis-processing-times-why-case-taking-years/

Lawfully Case Analysis Pro (cases ahead/behind; same form, service center, filing date; trend caveat):
- https://lawfully-official.medium.com/new-feature-case-analysis-pro-d03977c41f54
- https://www.lawfully.com/resources/start-case-analysis-pro
- https://www.lawfully.com/
- https://lawfully-official.medium.com/start-case-analysis-pro-and-stay-updated-with-your-case-status-fcd23dba516c
- https://apps.apple.com/us/app/lawfully-case-tracker/id1435063223
- https://www.lawfully.com/pro
- https://www.lawfully.com/resources/what-distinguishes-case-analysis-pro-from-other-case-trackers
- https://www.lawfully.com/case-tracker
- (unrelated result returned by the same search, not used) https://arxiv.org/pdf/2409.18644

USCIS myProgress ("based on historical data", not a guarantee; expanded to I-765 / I-131 July 2023):
- https://content.govdelivery.com/accounts/USDHSCIS/bulletins/364ce40
- https://www.jdsupra.com/legalnews/uscis-update-myprogress-tool-expands-to-5028283
- https://fredlaw.com/alert-uscis-expands-personalized-processing-times-to-work-authorization-and-travel-document-applications
- https://www.lighthousehq.com/blog/my-progress-usci
- https://iacoimmigration.org/en/uscis-extends-myprogress-tool-to-more-processing-forms/
- https://ogletree.com/?p=41001
- https://berardiimmigrationlaw.com/uscis-expands-myprogress-to-form-i-765-and-form-i-131/
- https://berardiimmigrationlaw.com/?p=18954
- https://www.eb5insights.com/?p=8341
- https://webflow.boundless.com/blog/understanding-uscis-myprogress

Backlog / pending-age statistics (no survival-analysis treatment found):
- https://www.congress.gov/crs-product/R47077
- https://www.americanimmigrationcouncil.org/blog/uscis-backlogs-processing-trends-dashboard/
- https://ctmirror.org/2025/09/19/us-immigration-court-case-backlog/
- https://www.newsweek.com/us-immigration-backlog-hits-all-time-high-2095846
- https://www.jeelani-law.com/articles/USCIS-processing-delays-deepen
- https://www.congress.gov/crs-product/IN12492
- https://tracreports.org/whatsnew/email.250320.html
- https://www.americanimmigrationcouncil.org/blog/uscis-immigration-processing-trends-2026/
- https://www.justice.gov/eoir/strategic-plan/strategic-context/current-operating-enviroment

Order of processing (FIFO) statements:
- https://www.gtlaw.com/pl/insights/2020/1/published-articles/uscis-abandons-firstin-firstout-processing-order-for-i526-petitions
- https://www.gtlaw.com/ar/insights/2020/1/published-articles/uscis-abandons-firstin-firstout-processing-order-for-i526-petitions
- https://visajourney.com/forums/topic/780920-ead-and-aos-taking-a-while
- https://www.immihelp.com/forum/adjustment-of-status-i-485/708937-order-in-which-cases-are-processed?p=708968
- https://donosolaw.com/?p=1725
- https://donosolaw.com/eb-5-update-uscis-eb-5-processing-not-quite-first-first
- https://peterchu.com/blogs/medium-feed/i-485-processing-time-san-francisco-field-office
- https://uscis.gov/working-united-states/permanent-workers/employment-based-immigration-fifth-preference-eb-5/questions-and-answers-eb-5-immigrant-investor-program-visa-availability-approach
- https://www.tahirih.org/wp-content/uploads/2023/04/2023.04.07-DE-1-COMPLAINT-against-All-Defendants-Part-1.pdf

Spanish-language explanations and Cuban-community reporting of the statistics:
- https://www.directoriocubano.info/?p=148315 (Aumentan las aprobaciones por la Ley de Ajuste Cubano desde junio)
- https://www.periodicocubano.com/?p=798566
- https://www.claxtonlawgroup.com/es/immigration-glossary/uscis-processing-times-2026/
- https://www.justice.gov/eoir/media/1404086/dl
- https://www.directoriocubano.info/?p=155214 (Demoras en la green card … esto está pasando)
- https://americanimmigrationcouncil.org/blog/uscis-immigration-processing-trends-2026
- https://www.americanimmigrationcouncil.org/?p=56636
- https://www.directoriocubano.info/tag/ley-de-ajuste-cubano/
- https://www.directoriocubano.info/?p=149618 (USCIS aprobó 308 Green Cards para cubanos en julio)

### 14.2 URLs and files reused from earlier project documents ([S′] / [F])

- USCIS Immigration and Citizenship Data portal (monthly Report-to-Congress CSV; quarterly all-forms XLSX `quarterly_all_forms_fy2026_q3_v1.xlsx`; quarterly I-485 by office `i485_performance_data_fy2026_q3_v1.xlsx`): https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data — numbers read from the files by doc 04 ([F]).
- USCIS Processing Times tool and FAQ: https://egov.uscis.gov/processing-times/ ; https://egov.uscis.gov/processing-times/processing-times-faqs ; orphan/Hague FAQ (93% inquiry point): https://www.uscis.gov/sites/default/files/document/questions-and-answers/Frequently_Asked_Questions_on_USCIS_Processing_Times_for_Orphan_and_Hague_Adoption_Cases.pdf (doc 04 §2.1).
- Historic national medians: https://egov.uscis.gov/processing-times/historic-pt ; fact sheet https://www.uscis.gov/sites/default/files/document/fact-sheets/historical_pt_factsheet_fy16_to_fy24.pdf (doc 04 §2.6).
- Quarterly CAA counts and medians as reported: https://en.cibercuba.com/noticias/2026-10-20-u1-e135253-s27061-nid343309-solo-139-cubanos-obtuvieron-residencia-ley-ajuste ; https://en.cibercuba.com/noticias/2026-10-06-u1-e135253-s27061-nid342034-green-card-ley-ajuste-cubano-tarda-casi-ano-tiempo ; https://www.mariopenton.com/residencia-por-ajuste-cubano-tarda-cada-vez-mas-el-plazo-alcanza-su-peor-registro-en-seis-anos/ (docs 06 §3.9, 07 §3).
- Trackitt trackers: https://www.trackitt.com/usa-immigration-trackers/i485-fb ; https://www.trackitt.com/usa-immigration-trackers/i485-eb (doc 06 §3.1).
- Boundless processing-time pages: https://www.boundless.com/blog/you-can-now-track-your-work-and-travel-permit-wait-time-online/ ; https://www.boundless.com/lp/importance-of-immigration-processing-times (doc 06 §3.5).
- Post-interview and EAD waits reported by attorneys: https://en.cibercuba.com/noticias/2026-06-11-u1-e208574-s27061-nid331888-trece-meses-esperando-permiso-trabajo-abogada ; https://www.directoriocubano.info/estados-unidos/demoras-residencia-ajuste-cubano-entrevista/ (doc 07 §5, §9).
- Regime dates and litigation: *Dorcas Int'l Inst. of R.I. v. USCIS* (D.R.I.; 1st Cir. No. 26-1703) https://law.justia.com/cases/federal/appellate-courts/ca1/26-1703/26-1703-2026-08-14-0.html ; *AAUP v. Mullin* 1:26-cv-14527 (D. Mass.) https://bizlegalservices.com/2026/10/07/lawsuit-challenging-uscis-green-card-policies-filed/ ; *Svitlana Doe v. Noem* 1:25-cv-10495 (D. Mass.) (docs 03, 11).

### 14.3 Textbook references ([T]; standard, not searched today)

- Kaplan, E. L. & Meier, P. (1958). Nonparametric estimation from incomplete observations. *JASA* 53:457–481.
- Cox, D. R. (1972). Regression models and life-tables. *JRSS-B* 34:187–220.
- Kalbfleisch, J. D. & Prentice, R. L. *The Statistical Analysis of Failure Time Data* (2nd ed., Wiley, 2002) — censoring, AFT, left truncation.
- Andersen, Borgan, Gill & Keiding, *Statistical Models Based on Counting Processes* (Springer, 1993) — Nelson–Aalen, Aalen–Johansen, multi-state models.
- Little, J. D. C. (1961). A proof for the queuing formula L = λW. *Operations Research* 9(3):383–387.
- Gelman, Carlin, Stern, Dunson, Vehtari & Rubin, *Bayesian Data Analysis* (3rd ed., CRC, 2013), ch. 5 — hierarchical models and partial pooling.
- Gneiting, T. & Raftery, A. E. (2007). Strictly proper scoring rules, prediction, and estimation. *JASA* 102:359–378 — CRPS, Brier, log score, calibration.
- Singer, J. D. & Willett, J. B. *Applied Longitudinal Data Analysis* (Oxford, 2003), part II — discrete-time hazard models.
