# 04 — Estimation model: VPH-1.1 (final)

Written 2026-10-20. **VPH-1.1** is doc 08's VPH-1 vintage-pool hazard model (doc 08 §11), changed in three ways:

1. **(a) The ambiguous choices are pinned by ADRs** (§2). The golden outputs come from a stdlib-Python reference implementation (Appendix A), which this plan ran today [V].
2. **(b) The must-fix amendments from the judges are applied:**
   - RFE/NOID as a delay;
   - one rule for a scheduled interview;
   - state conditioning as a mixture of survival curves;
   - a structural band for class mix and the EAD multiplier;
   - data-updated scenario weights, with a defined observation model and a weight ledger;
   - deterministic composition of alert rules.
3. **(c) The Round-2 research amendments are kept** (research README §2.6):
   - mandamus ×1.3 for 4 months;
   - R1 subtracted only for CHNV/FRP_CFRP/U4U, with CBP One = 0 at low confidence;
   - the approval range 70–90 % shown only with basic documents and never in the headline.

The package `packages/estimator` is pure TypeScript, has zero dependencies and is deterministic. The pipeline uses the same code for its parameter fits and the canary.

---

## 1. Inputs

| Input | From | Used for |
|---|---|---|
| `national.rows` (Sep 2024 → latest) | monthly CSV [F] | pool reconstruction, β, observed completions for the weights |
| `params` (β, office multipliers, σ_obs, weights + ledger, grids) | pipeline fit | projection |
| `offices` (state → offices, humanitarian pending, 131A-FAM yardstick) | workbook [F] + jzebedee | office or state mixture, yardstick |
| `policy` (regimes, scenarios, alert rules, class facts, PA-2026-05) | curated | clock, scenarios, conditions |
| `alerts` (published, with `ruleIds`, `supersedes`, `expires`) | curated | weight effects |
| `CaseTimeline` + `DerivedFlags` | device | vintage, channel, office/state, milestones |
| `today` | device clock (date only, local) | k₀ (`kOrigin`), horizons, deadlines, alert validity |
| `clock` | `case-rules` `clockFor()` (passed in by the app's `useEstimate`) | `EstimateOk.clock`, echoed unchanged |
| `quarterly`, `data` (`status`, `manifest`) | the app's data layer | guards T20b, `pipeline_late`, `artifact_old`, `qa_degraded`, `sample_data` |

**Naming (two different k₀s in the research).** In this document **k₀ always means the time origin** (EST-5; code name `kOrigin`). The office-shrinkage prior strength in EST-11 is written **κ_o** (code name `kappaOffice`, stored as `params.k0Office = 50`). Agents must never pass one where the other is expected.

**Not inputs:**
- Anything crowdsourced (v1.1+).
- Entry channel as a hazard covariate (the pool is one class; doc 08 §5.6).
- The EAD as a speed-up: the point estimate uses 1.0, and the EAD enters only the structural band.
- The approval prior: it never touches timing.

## 2. ADRs that pin the spec (single source of truth: this section plus the golden file)

| ADR | Decision | Why |
|---|---|---|
| **EST-1 Series start and pool init** | Model rows start at **2024-09**. The reason is the **missing Aug 2024 file** (doc 04 §1.0): Jul 2024 also has `pendingOver6` (90,723 [F], doc 04 §1.1), but the series has no continuous month-to-month replay across the Aug 2024 gap, so the first row after the gap is the pool origin. Legacy vintages: `legacy>6mo` = pendingOver6 at age 12; `legacy<6mo` = pending − pendingOver6 at age 3 | doc 08 §5.3; doc 04 §1.0 |
| **EST-2 Monthly update order** | For each later row: (1) every vintage age += 1; (2) push a receipts vintage of age 0.5 labelled `ym`; (3) **(fit only)** record the model mean age of completions *now*; (4) remove `C = approved + denied` in proportion to `n·e^{βa}`, flooring each vintage at 0; (5) rescale every vintage to the official pending total | doc 08 §11.5 |
| **EST-3 β fit** | Targets = the last 3 rows with C ≥ 300 (today Jun/Jul/Aug 2026). SSE of (model mean age − `avgMonths`) uses the full replay. Ternary search on [0, 0.3], 60 iterations, β = midpoint. Fewer than 3 targets → 0.037 | doc 08 §11.4 step 3 |
| **EST-4 Grid order** | Loops nest as scenario (S0, S1, S2, S3) → β multiplier (½, 1, 2; weights ¼, ½, ¼) → office multiplier (0.8, 1, 1.25; ¼, ½, ¼) → structural extra (only in band runs). Path prior = product of weights. Order matters only for float summation; tests use tolerance 5e-4 | removes the "grid order" ambiguity (data-rigor K1) |
| **EST-5 Time origin k₀** | Path step k = 1 is the month after `dataThrough`. **k₀ = whole months from `dataThrough` to the month of `today`** (2 for Aug 2026 data on 2026-10-20). Path length **H = k₀ + 72**, so every result covers 72 months from today | ship-fast `72 + k0`; doc 08 used H = 72 |
| **EST-6 Conditioning and mixing** | Posterior path weight ∝ prior × S_path(k₀). Mixture `S_c(t) = Σ post_i · S_i(k₀+t)/S_i(k₀)`, t = 0..72 | doc 08 §4.6, §11.5 |
| **EST-7 Hazard and cap** | `h_k = min(0.95, C_k · e^{β·a_u} / Σ_v n_v e^{β a_v} · m_total(k))`. The cap is applied **after** all multipliers: office × grid × structural × milestone(t). Milestone multipliers act only for t = k − k₀ ≥ 1 | data-rigor K1 |
| **EST-8 Quantiles** | q_x = the smallest whole month t ∈ [1, 72] with `1 − S_c(t) ≥ x − 1e-12`, else `null` ("más de 6 años") | data-rigor; removes the 53/54 ambiguity |
| **EST-9 Calendar dates** | P(by end of month M) = 1 − S_c(months from `ym(today)` to M). For 31 Dec 2026 on 2026-10-20 that is t = 2. **Known bias (design note, not changed in v1):** conditioning on S(k₀) assumes the case survives the whole month of `today` (including the 11 days after 2026-10-20), so P(by 31 Dec 2026) covers only Nov–Dec. S3 is re-anchored to `dataThrough`, so its 6 freeze months nominally include Sep–Oct 2026, which already passed without a hold memo. Anchoring the freeze at `ym(today)` would be more honest; that change regenerates the golden file and needs owner approval (EST-13) | consistent with EST-5 |
| **EST-10 Day ↔ month conversion** | `monthsCeil(days) = ceil(days / 30.4375)` for "hazard zero until a future date"; `monthsSince(days) = floor(days / 30.4375)` for "boost lasts N months since an event"; continuous `days/30.4375` for the lognormal post-interview and post-expedite clocks | removes rounding ambiguity |
| **EST-11 Office multiplier** | `r_o = (y_o/E_o)/r_G`; `m̂_o = clamp((κ_o + y_o·r_o)/(κ_o + y_o), 0.5, 2)`, with κ_o = 50 (`params.k0Office`; not the time origin k₀), y = approvals in the last two quarters (MVP basis; switching to approvals + denials regenerates the golden file), E = mean of the two quarters' humanitarian pending, group G = cubanFocus offices with data in both quarters. **The key-facts §3 values (HIA 0.947 … TAM 1.936) are already the shrunk m̂_o** (T6: raw r for HIA = 0.055), despite the "raw; shrink before use" label there. Never shrink them a second time | doc 08 §11.5 form (matches T6) |
| **EST-12 Adjudicable days** | `calendar(receipt, today) − Σ overlap([max(receipt, start), min(end, today)))`, end-exclusive, over hold regimes whose `appliesTo` contains ALL_CUBAN or the channel. Defaults R1 2025-02-14→2025-06-09 and R3 2025-12-02→2026-06-12; altOps ends 2025-06-25 / 2026-07-16 | key facts §3; T11/T19/T21/T22 |
| **EST-13 Golden supremacy** | The committed `packages/estimator/golden/vph1.golden.json` is the acceptance target. It is generated by the oracle (`tools/oracle/golden_cases.py`, which imports the Appendix A core `vph1.py`) and must match the TS implementation within 5e-4 on probabilities and **exactly** on quantiles. Doc 08's prose numbers (9.4 %, q50 53, Tampa 16.9 %) are **superseded** (independent reproductions by data-rigor and by this plan both give 9.23 %, 54, 16.6 %). **Precedence:** if the WP2 oracle (core + harness) disagrees with any number written in §9, the agent **stops and escalates to the owner**; it must not silently regenerate the golden file to match its own code. Only an owner-approved edit of §9 followed by `golden:write` changes the golden file | must-fix #1 |

## 3. Core algorithm

### 3.1 Pool reconstruction

Pseudo-code is in Appendix A `reconstruct()`. Today's results [V]:

- Σn = 355,520 over 25 vintages.
- Minimum vintage 1,210.8.
- Monthly scale factors 0.9932–1.0025.
- The March 2025 vintage is at age 17.5 with n ≈ 23,097.
- About 175,221 pending cases are older.
- Mean pool age is 19.48.

### 3.2 β

β̂ = **0.037391** [V] (doc 08: 0.0374).

### 3.3 Projection of one path (scenario s, β·b, multiplier m)

```
pool ← copy(pool_dataThrough); u ← vintage(case)        // 'legacy>6mo' if receipt < 2024-09; '2025-03' for the reference case
S[0] ← 1
for k in 1..H:
    for v in pool: v.age += 1
    pool.push({age: 0.5, n: receiptsForecast (1000), label: 'f'+k})
    C ← completions_s(offset + k)                        // §6.2; offset = months(anchorMonth → dataThrough), 0 today
    W ← Σ_v v.n · e^{βb·v.age}
    t ← k − k₀
    h ← min(0.95, C · e^{βb·u.age} / W · m · milestoneMult(t))     // milestoneMult(t ≤ 0) = 1
    for v in pool: v.n ← max(0, v.n − C · v.n e^{βb·v.age} / W)
    S[k] ← S[k−1] · (1 − h)
```

### 3.4 Mixture

The grid produces 36 paths (4 scenarios × 3 β × 3 office) with priors `w_s·w_b·w_o`. The scenario weights `w_s` are the output of `scenarioWeights()` (§6), not raw priors. Conditioning and mixing follow ADR EST-6. Outputs are computed from S_c as follows:

- `pWithin` and `byDate` (EST-9);
- `quantiles` (EST-8);
- `perScenario` (mixture restricted to each scenario's paths);
- `policyBand12` = [min, max] of the per-scenario P(≤12);
- `drivers` (§8).

## 4. Milestone states (precedence top → bottom)

| State (`mode`) | Condition | Rule | Tag |
|---|---|---|---|
| decided | `decision` milestone | no estimate; show outcome; denial branch | — |
| no_estimate | channel ∈ {I220A, EWI, CONDITIONAL_PAROLE_236} | no numbers (S9) | key facts §1 |
| post_interview | `interview` with a date ≤ today and no decision | lognormal(median 3 mo, σ 0.857) conditioned on s = days since interview / 30.4375: `P(≤t) = (F(s+t) − F(s)) / (1 − F(s))`. Label: "informes de abogados; confianza baja" | doc 08 §7.5 [S′]; **[I] low confidence** |
| post_expedite | `expedite_outcome = granted` | same form, median 2 mo, σ 0.857, from the grant date | doc 15 §9.3 [I] |
| interview_scheduled | `interview_notice.meta.scheduledFor = D`, D > today | **ADR-EST-14 [I], low confidence:** `t_D = monthsCeil(D − today)`; `S(t) = S_queue(t)` for t < t_D; `S(t) = S_queue(t_D) · (1 − F(t − t_D))` for t ≥ t_D. The queue hazard is **not** set to zero before D (a decision without the interview is possible but rare). The post-interview clock starts at D. If D ≤ today and no `interview` milestone is recorded, the case is treated as post_interview from D, with the prompt "¿Ya tuvo la entrevista?" | replaces ship-fast's invented "hazard 0 before D"; most 2025+ filers are expected to be interviewed (P ≥ 0.8, doc 12) |
| queue | otherwise | VPH grid with the milestone multipliers below | doc 08 §11 |

**Queue milestone multipliers.** `milestoneMult(t)` is the product of the following terms, with t ≥ 1 (months after today):

| Event | Multiplier | Tag |
|---|---|---|
| **RFE pending** (rfe date r, no `rfe_response`). Due date `d = meta.dueDate ?? r + 84 days` (PA-2026-05: ≤ 12 weeks; doc 14 §4) | **0 for t ≤ monthsCeil(d − today)**, then **1.5** for the next 3 months. If d ≤ today with no response recorded: assume the response was at d (`delays.assumedResponseAt = d`), apply the boost for whatever is left of the 3 months after d, and set `delays.nonResponseRisk = true`. The UI then says "Si no respondió a tiempo, USCIS puede negar el caso; si respondió, registre la fecha." | **must-fix (no more P = 0 forever)**; replaces doc 08 T18 [I] |
| **NOID pending** | Same, with `d = n + 33 days` (30 + 3 mail) | doc 14 §4 |
| RFE/NOID answered at x | 1.5 for t ≤ 3 − monthsSince(today − x) | doc 08 §7.5 |
| Mandamus filed at f | 1.3 for t ≤ 4 − monthsSince(today − f) | doc 15 §9.3 (not ×3) |
| No biometrics, receipt > 4 months old, and no EAD | 0.7 (all t). A `biometrics` milestone with `date: null` ("happened, date unknown") counts as biometrics done | doc 08 §7.5; user-first refinement |
| EAD received | 1.0 in the point estimate; {0.9, 1.0, 1.2} in the structural band | doc 08 §7.5 |
| e-Request, congressional inquiry, Ombudsman | 1.0 | doc 15 §9.3 |

## 5. Conditioning on filing date, channel, office and state

| Input | Effect | Shown to the user |
|---|---|---|
| Filing date | Selects the vintage (its age, the count of older cases, the same-month count). Receipts before 2024-09 → `legacy>6mo` | "Presentar antes ayuda un poco: USCIS no decide en estricto orden de llegada" (golden: Oct 2025 vintage P12 7.15 % < Mar 2025 9.23 %) |
| Entry channel | **Clock and eligibility only** (EST-12). UNKNOWN → both clocks (CHNV 306 / CBP One 392 for the reference filing). No hazard change | "Aún no podemos medir si CHNV y CBP One avanzan a ritmos distintos" |
| Office known | m̂_o (EST-11) plus the yardstick | Office line with N and "dato débil" when N < 50 |

### 5.3 State known, office unknown (must-fix: mixture of survival curves)

1. Candidate offices are `O = offices.stateOffices[state]` that have humanitarian pending > 0 in the latest quarter. If |O| > 8, keep the 8 largest by pending and fold the rest into one pseudo-office with m = 1 and their summed pending.
2. Prior office weight: `w_o = pending_o / Σ pending`.
3. For each office, run the full grid with its m̂_o (1.0 if it has no multiplier). This gives the conditioned mixture `S_o(t)` and the unconditional survival to today, `U_o = Σ_paths prior·S(k₀)`.
4. Posterior office weight: `π_o ∝ w_o · U_o`. The result is **`S(t) = Σ_o π_o S_o(t)`**. Averaging multipliers is **wrong** and is not done.
5. `office.basis = 'state_mixture'`, with copy "Aproximado: no sabemos su oficina; mezcla de las oficinas de {estado}".
6. Neither office nor state known → national (m = 1 in the grid).
7. **Known limitation (v1).** The posterior office weight uses only `U_o` = survival from `dataThrough` to today (k₀ = 2 months), because the pool is not tracked per office. It barely moves the prior (HIA 0.2796 → 0.2799) even though a case pending 19 months is strong evidence against fast offices such as TAM. v1.1 may condition on survival since filing (golden regeneration). The Method screen states this limitation.
8. "Miami-Dade + No sé" uses the all-Florida mixture in v1 (not one restricted to HIA/KND/MIA).

**Golden fixture FL-4** (offices HIA/KND/MIA/TAM, multipliers 0.947/0.829/0.963/1.936, FY26 Q3 pending 37,486/41,248/20,662/34,695):
- π = 0.2799 / 0.3082 / 0.1543 / 0.2576.
- P12 = 10.49 %, q50 = 51.
- The averaged-multiplier contrast (m = 1.169) gives 10.64 %, which is why averaging is ruled out.

## 6. Scenario weights: one pure function, one ledger (must-fix)

### 6.1 Definitions (doc 08 §8.2; anchored to `anchorMonth = 2026-08`)

| Id | ES / EN | Path `completions(k)` (k = months after anchor) | Prior | Updated by data? |
|---|---|---|---|---|
| S0 | Estancamiento / Status quo | 800 flat | 0.30 | yes |
| S1 | Recuperación parcial / Partial recovery | 800 + 3,800·min(k,12)/12 | 0.40 | yes |
| S2 | Ritmo de fines de 2024 (oct–dic 2024, ~9,200/mes) / Late-2024 pace (Oct–Dec 2024, ~9,200/mo) | 800 + 8,400·min(k,6)/6 | 0.15 | yes |
| S3 | Nueva pausa / Re-freeze | **re-anchored**: 0 for the first 6 projected months after `dataThrough`, then S1(offset + j − 6) | 0.15 | **no** (alerts only) |

**Research conflict (S2 label), resolved 2026-10-20.** Docs 07 §3.2 and 08 §5.1/§8.2 attribute 27,602 completions to Apr–Jun 2025 (FY25 Q3) and call S2 "FY2025 pace". The app's own [F] monthly series contradicts this: Apr–Jun 2025 completions = 5,944 + 3,602 + 1,924 = **11,470**, while Oct–Dec 2024 (FY25 Q1) = **27,673**. Immiva, the secondary source behind 27,602, compares "FY2025 Q1" with FY2026 Q3 [S: https://immiva.com/blog/uscis-processing-times-by-form]. So 27,602 is the FY25 Q1 figure. The S2 **numbers are unchanged** (golden file unchanged); only the label changes. The true FY2025 (Oct 2024–Sep 2025) average is 78,291 / 12 = **6,524/month** [F-derived], which Method shows as an extra Little's-law line (355,520 / 6,524 ≈ 54 months). Doc 14's "about 1,900 FY25 Q3 denials" should read **785** (282 + 226 + 277 from the monthly CSV); its conclusion still holds because 447 < 785.

S3 represents a *future* freeze risk. If it were likelihood-updated, one normal month would "refute" a freeze that has not happened, so it is re-anchored every month and is not updated by data.

### 6.2 Observation model (defines the forecast-ledger PIT and log score)

- **Model:** `ln C_obs(m) ~ Normal(ln max(μ_s(k_m), 50), σ²)` for s ∈ {S0, S1, S2}, where k_m = months from the anchor to month m.
- **σ:** the sample SD of month-to-month log changes of completions between consecutive **non-hold** months. Today that is 9 differences, SD 0.298 → **σ = 0.30** [V]. The floor is 0.25. σ is refitted when a month arrives.
- **Tempering:** λ = 0.5. A single month is treated as half an observation, because the model is mis-specified (mixed pool). The effective σ is 0.424.

### 6.3 `scenarioWeights(policy, alerts, observedRows, flags, observation, today)`

Signature (frozen in contract v1, `07` §6.0): `scenarioWeights(policy: PolicyFile, alerts: AlertsFile, observed: MonthlyRow[], flags: DerivedFlags | null, observation: EstimatorParams['observation'], today: ISODate)`. σ, λ (`tempering`), the level floor (`floorLevel`) and the weight floor (`weightFloor`) all come from `observation`; alert validity uses `today`. The function never reads a clock.

Pure and deterministic. Steps:

1. `w ← priors`.
2. **Alert effects.** Take every published, non-retracted alert with `date ≤ today`, `expires` absent or ≥ today, and not superseded by a later published alert's `supersedes`. Process them sorted by (date, id). For each `ruleId` the alert activates, look up the `AlertRule` and apply each effect whose condition holds: `w[s] *= factor`. Then normalize.

   Conditions:
   - `always`
   - `redEagleProtects` = `flags.redEagleAppearsInClass && policy.litigationState.redEagle.piInForce`
   - `redEagleNotProtecting` = the negation of `redEagleProtects`
   - `dorcasPending` = `policy.litigationState.dorcas == 'vacatur_in_force_appeal_pending'`

3. **Likelihood.** For each observed monthly row m after `anchorMonth`, in order: `L_s = exp(−½·λ·z_s²)` for s ∈ {S0, S1, S2}, with `z_s = (ln C_obs − ln max(μ_s, floorLevel)) / σ`. Then, exactly in this order: (i) multiply `w[s] · L_s` for s ∈ {S0, S1, S2}; (ii) **normalize S0–S2 to sum 1**; (iii) **floor each at `weightFloor` = 0.02** (a fraction of the S0–S2 sub-mass, not of the total); (iv) renormalize S0–S2 to sum 1; (v) **multiply by (1 − w[S3])**. S3 is untouched. (Verified 2026-10-20: this reproduces every row of the table below; flooring at 0.02 of the full mass does not.)
4. Every multiplication appends `{reason, ruleId, alertId, observedMonth, before, after}` to the trace.
   - The pipeline writes the case-independent trace (flags = null, i.e. using only `always` and `dorcasPending` conditions) into `params.weightLedger`.
   - The device recomputes the case-dependent part, the class conditions, and shows it under "ver historial".

**Rule table** (seeded in `policy.alertRules`; key facts §3, with doc 08 §8.4 where it is more specific):

| ruleId | Effects | Note |
|---|---|---|
| `DORCAS_AFFIRMED` | S3 ÷ 3 (always) | |
| `DORCAS_REVERSED` | S3 × 3 if `redEagleNotProtecting`; S3 × 1.5 if `redEagleProtects` | class-aware: a filer after 2026-08-24 gets × 3 |
| `FIRST_CIR_STAY_BENEFITS_HOLD` | same as `DORCAS_REVERSED` | doc 08 §8.4 |
| `RED_EAGLE_DISSOLVED` | S3 × 2 if `dorcasPending` | if Dorcas was already reversed, `DORCAS_REVERSED` automatically switches to × 3, so the two never compound past × 3 |
| `NEW_HOLD_MEMO_CUBA` | S3 × 3 (always) | also trips the "policy uncertainty" banner |
| `AAUP_RELIEF_DENIAL_POLICY` | none on timing; `approvalCardFlag: 'reestimate'` | relief against the AOS Policy alone → informational |
| ~~`COMPLETIONS_GE_2000_TWO_MONTHS`~~ | **retired** | superseded by the likelihood update (otherwise the same evidence would be counted twice) |

**Today:**
- No rule is active: none of the triggers has happened as of 2026-10-20 (master timeline, status row).
- There is no observed month after the anchor.
- So the weights = priors 0.30 / 0.40 / 0.15 / 0.15. After survival-conditioning the posterior is 0.3006 / 0.3998 / 0.1487 / 0.1509, matching doc 08 T5 exactly [V].

**Golden (T31): weights after the September 2026 CSV arrives (σ_eff 0.424, S3 fixed 0.15, floor = 0.02 of the S0–S2 sub-mass, so the floored value shows as 0.02 × 0.85 ≈ 0.017), by observed C_Sep:**

| C_Sep | S0 | S1 | S2 | S3 |
|---|---|---|---|---|
| 600 | 0.5292 | 0.3040 | 0.0167 | 0.15 |
| 820 | 0.4114 | 0.4216 | 0.0169 | 0.15 |
| 1,100 | 0.2891 | 0.5105 | 0.0504 | 0.15 |
| 1,500 | 0.1655 | 0.5194 | 0.1651 | 0.15 |
| 2,200 | 0.0533 | 0.3397 | 0.4570 | 0.15 |
| 3,000 | 0.0169 | 0.1564 | 0.6767 | 0.15 |

## 7. Structural uncertainty (must-fix: class mix and EAD range in the band)

Completions include denials: 434 of 820 in Aug 2026 [F]. Those denials are plausibly concentrated on I-220A and hold-era cases (doc 07 §8). A clean parolee's relevant throughput can therefore differ by about 2× in either direction (doc 08 §5.6).

- **Class-mix axis:** κ ∈ {0.5, 1, 2} with weights ¼, ½, ¼.
- **EAD axis** (only when an EAD was received): {0.9, 1.0, 1.2}.

The **point estimate uses κ = 1 and EAD = 1**. The **structural band** is the point-estimate machinery rerun at the extreme combined multipliers:

- **No EAD:** κ ∈ {0.5, 2}.
- **EAD received:** {0.5·0.9, 2·1.2} = {0.45, 2.4}.

**Golden values:**
- Reference case (EAD received): **[4.35 %, 19.80 %]**.
- Same case without an EAD: [4.82 %, 17.02 %].
- The full κ mixture (diagnostic only) gives P12 10.06 %, q50 53.

The band is displayed next to the policy band on the result card ("Según qué casos decida USCIS: entre 4 % y 20 %"), never in a footnote.

**Test U7:** the point-estimate I-485 probabilities are identical for CHNV, CBP One, VISA, UNKNOWN, with and without an EAD, and with and without biometrics when an EAD exists. Only the clock, the cards and the structural band differ.

## 8. Uncertainty presentation (rules enforced by tests)

1. **No headline contains a calendar date or a single "expected date".** A test scans the rendered headline.
2. **Lead with P(≤12 months)** plus the word label. Thresholds: < 5 % muy poco probable / very unlikely; 5–20 % poco probable / unlikely; 20–50 % posible / possible; 50–80 % probable / likely; > 80 % muy probable / very likely. The bands come right after: policy and structural.
3. **Ladder** at 3/6/12/24/36 months, and calendar dates at 31 Dec of this year, the next and the one after.
4. **Median** only if q50 ≤ 72. Otherwise "más de 6 años". The sentence is phrased for "el promedio del grupo nacional de I-485 cubanos", never "casos como el suyo".
5. **Scenario cards** show the weight, the posterior weight, P12 and q50, with a link to the ledger.
6. **Driver bar.** The shares are main-effect variance shares of per-path P(≤12) under the posterior weights:
   - `share_f = Σ_g W_g (mean_g − mean)² / Var` for each factor f ∈ {scenario, β, office}.
   - Golden: **scenario 0.941, office 0.028, β 0.009** → "Política 94 % · Oficina 3 % · Orden de la cola 1 %".
7. **Every chart has a "ver como tabla" table twin.**
8. **Status chips:** "No validado" and `confidence` (§10.3).
9. **The approval card is separate.** It comes from `case-rules`, never from the estimator.

## 9. Golden tests (values from Appendix A, run 2026-10-20 [V])

### 9.1 Files and tolerances

- **Fixture:** the 24 monthly rows Sep 2024 → Aug 2026 (doc 04 §1.1 [F]); today = 2026-10-20; k₀ = 2; default scenarios; receipts 1,000; office unknown unless stated.
- **File:** the Python oracle writes `packages/estimator/golden/vph1.golden.json`.
- **Tolerances:**
  - probabilities ± 5e-4 (TS vs golden), unless stated otherwise;
  - quantiles exact;
  - days exact.
- **CI:** CI re-runs the oracle and fails on any difference > 1e-6 between the oracle output and the committed golden file.

### 9.2 Cases

| # | Case | Expected |
|---|---|---|
| T1 | β = 0, flat 800, receipts 0, vintage 2025-03, m = 1 | h₁ = 800/355,520 = 0.0022502; S(12) = 0.9730 |
| T2 | S3 path, any β | h₁…h₆ = 0 exactly; S(6) = 1 |
| T3 | β = 1.0, S1 | S_2025-03(24) = 0.99966; S_legacy>6mo(12) = 0.39291 (ordering legacy ≪ 2025-03). This **replaces** doc 08's "S(12) = 0", which the pinned floor-at-0 removal does not reproduce |
| T4 | S1 only, β̂, m = 1, k₀ = 2 | S_c(12) = S(14)/S(2) = **0.89755**; cross-check S_c(10) = S(12)/S(2) = **0.92072** (this is doc 08's "S_c(12)", which used S(12)/S(2) with a different index) |
| T5 | posterior after conditioning (no alerts, no observations) | (0.3006, 0.3998, 0.1487, 0.1509) ± 1e-4; sums to 1 ± 1e-12 |
| T6 | Office shrink HIA 3/37,084, group 244/166,179 | r = 0.055, m̂ = 0.947; TAM 117/34,105 → 1.936; clamp 5 → 2, 0.1 → 0.5 |
| T7–T9 | KM, conditional KM, discrete CRPS (v1.1 crowd utils) | as doc 08 §11.9 (Ŝ(3) .8333, Ŝ(5) .6667, Ŝ(8) .4444, Ŝ(12) 0; Ŝ(8\|5) .6667; CRPS 0.375) |
| T10 | Lognormal median 3, σ 0.857 | F(1) 0.0999, F(3) 0.5000, F(6) 0.7907, F(9) 0.9001; P(≤3 \| 3 since) 0.5814 |
| T11 | Clock CHNV, receipt 2025-03-15 | calendar 584; R1 86; R3 192; adjudicable **306**; altOps **256** |
| T12 | Little's law | 355,520/820 = 433.56; /4,600 = 77.29; /6,524.25 (FY2025 average) = 54.49; /9,200 (late-2024 pace) = 38.64; /16,876 = 21.07 |
| T13 | Pool invariants | Σn = 355,520 ± 1; 25 vintages; min ≥ 0 (1,210.8); scales ∈ [0.99, 1.01]; Mar-2025 n = 23,096.5; older = 175,220.8 |
| T14 | β fit | 0.037391 ± 1e-5; SSE(β̂) < SSE(0) and < SSE(0.08) |
| **T15** | **Reference case** — the exact fixture: CHNV, receipt 2025-03-15 (day), **biometrics 2025-07 (month granularity, i.e. 2025-07-15)**, EAD (c)(9) 2025-09 (month), `concurrentI765 = true`, **`state` and `officeCode` undefined** (national path), no other milestones. The biometrics milestone is pinned because March 2025 CHNV filers' biometrics clustered Jun–Aug 2025 (research README §2.4) and an EAD implies biometrics were taken [I]; it does not change T15 (the 0.7 rule is off when an EAD exists) but keeps T23 identical | P3 **0.01484**, P6 **0.03665**, P12 **0.09229**, P18 0.15517, P24 **0.22050**, P36 **0.35453**, P60 0.55396; q10 **13**, q25 **27**, q50 **54**, q75 **null**, q90 null; byDate 2026-12-31 0.00906, 2027-03-31 0.02884, 2027-06-30 0.05366, 2027-12-31 0.11271, 2028-12-31 0.24265 |
| T15b | Per scenario | S0 P12 0.02325 (q50 null); S1 0.10054 (46); S2 0.25970 (22); S3 0.04289 (51); policyBand12 [0.02325, 0.25970] |
| T15c | Drivers | scenario 0.94135, office 0.02796, β 0.00920 |
| T15d | Structural band (EAD received) | [0.04352, 0.19801]; without EAD [0.04815, 0.17021] |
| T16 | Offices (P12; q50) | TAM 0.16559 (36) > HOU 0.10399 (50) > unknown 0.09229 (54) > MIA 0.08915 (55) > HIA 0.08779 (55) > KND 0.07761 (59) |
| T17 | Vintage 2025-10 | P12 0.07152 < 0.09229; q50 62 |
| **T18'** | **RFE received 2026-10-01, no response, due 2026-12-24** (65 days → zero t ≤ 3, ×1.5 t = 4..6) | P3 **0.0**, P6 0.03347, P12 **0.08942**, q50 54; `delays.rfeZeroUntil = 2026-12-24`; **P(≤36) > 0** (no longer "P = 0 forever") |
| T18b | RFE answered 2026-10-10 | P3 0.02215, P12 0.09852, q50 53 |
| T18c | Mandamus filed 2026-10-01 | P3 0.01924, P12 0.09773, q50 53 |
| T18d | RFE due date passed (r = 2026-06-01, no response) | `assumedResponseAt = 2026-08-24`; `nonResponseRisk = true`; estimate finite |
| T19 | VISA, 2025-03-15 | adjudicable 392 (R1 not subtracted); **eligible** (estimate computed) |
| T20 | Guards | (a) today − end of latest month > 75 days → LOW + banner (with Aug 2026 data the trip date is 2026-11-15); (b) monthly Oct 2026 vs quarterly through Jun 2026 → "sin contraste trimestral"; Aug vs Jun passes |
| T21 | CBP One, 2025-03-15 | 392; `r1: 'not_applied_low_confidence'` |
| T22 | CBP One, parole 2024-02-01, receipt 2025-02-05 | calendar 622; adjudicable 430; oneYearWarning false |
| T23 | Peer without EAD (same as T15 minus `ead_c9`; **keeps the biometrics milestone**) | identical P/q to T15; remedy rung `a_c9` = available (2025-03-15 < NBC 147-C9 2025-06-13); peer reasons ⊇ {`ead_swept_r3`, `c9_erequest_available`} |
| T23b | Peer without EAD **and** without biometrics (T15 minus `ead_c9` minus `biometrics`; the 0.7 rule applies) | P3 0.01042, P6 0.02590, P12 **0.06619**, P24 0.16437, P36 0.28154; q10 17, q25 34, q50 **64** [V oracle 2026-10-20] |
| T24 | CBP One peer (T15 fixture, channel CBP_ONE) | identical P/q to T15; clock 392; peer reasons ⊇ {`cbp_one_no_r1`} |
| T25 | Filed 2026-09-01 | `redEagleAppearsInClass = false`; with an active `DORCAS_REVERSED` alert the S3 weight gets × 3 (vs × 1.5 for T15) |
| T26 | I-220A | `no_estimate` 'i220a'; no numbers rendered anywhere (UI test) |
| T27 | Interview scheduled 2026-12-15 (t_D = 2) | P3 0.10809, P6 0.63479, P12 0.92070; q50 5 ("confianza baja") |
| T28 | Interview done 2026-09-20 (s = 0.98563) | P(≤3) 0.59010, P(≤6) 0.82060, P(≤12) 0.95165 |
| T29 | Expedite granted 2026-10-10 (s = 0.32854; median 2) | P(≤3) 0.71895, P(≤6) 0.90895, P(≤12) 0.98279 |
| T30 | State mixture FL-4 | §5.3 values; π sums to 1 |
| T31 | Likelihood update | §6.3 table (± 1e-4), with the sub-mass floor of §6.3 step 3 |
| T32 | Alert composition | `DORCAS_REVERSED` + `RED_EAGLE_DISSOLVED` with `dorcasPending = false`, class member → S3 factor × 3 (not × 6); retracted or superseded alert → no effect; expired alert → no effect; ledger entries in (date, id) order |
| U1 | Language invariance | `estimate()` output is byte-identical for es and en; only rendered strings differ; locale key parity |
| U2 | Peer reasons exact sets (all cases with `concurrentI765 = true`, office unknown) | T15 → {`chnv_r1`, `ead_before_r3`, `non_fifo`}; CBP One twin → {`cbp_one_no_r1`, `ead_before_r3`, `non_fifo`}; no-EAD twin → {`chnv_r1`, `ead_swept_r3`, `c9_erequest_available`, `non_fifo`}; + `office_diff` iff office known |
| U6 | Offline | the bundled sample reproduces T15 |
| U7 | Channel/EAD invariance | §7 |
| U8 | Copy guards | the rendered estimate contains no "casos como el suyo"/"cases like yours"; the approval range appears only when `basicDocsComplete === true` and never in the headline or share text |

## 10. Backtesting, scoring and confidence

### 10.1 What is observable

Individual decision times are **not** observable from official data. What can be scored is listed below (data-rigor graft):

1. **National monthly completions.** From v1.1, every NEW_MONTH run writes `data/forecasts/<dataThrough>.json`: the predictive mixture (lognormal components with the §6.2 σ, weighted by the scenario weights) for the next 6 months. When each CSV lands, the job records the PIT and the log score in `scorecard.json`. The ledger is append-only; CI forbids edits.
2. **Mean age of completions.** A posterior-predictive check of β: model vs `avgMonths` each month.
3. **`pendingOver6`.** Model (reconstructed pool) vs official each month.

### 10.2 Historical backtest (rolling origins, regime-aware; doc 08 §10.2)

- **Origins:** each month from 2024-12 to (latest − 6).
- **Method:** truncate the series, refit β, and **replay the realized completions** (the scenario part cannot be backtested honestly before scenarios existed).
- **Score:**
  - the mean age of completions (MAE);
  - `pendingOver6` (relative error);
  - vintage completion fractions implied by the P6 tracer (doc 08 §5.4.3).
- **Acceptance for `validated_r0r2`:** MAE ≤ 1.5 months and `pendingOver6` error ≤ 3 % on R0/R2 origins.
- R3/R4 origins are reported as "resolución insuficiente", never claimed as calibrated.
- **Run:** `npm run backtest` writes `data/backtest.json` (Should in the MVP, Must in v1.1).

### 10.3 Confidence gates

| Level | Conditions |
|---|---|
| **LOW** (default) | Default, and always while T20a trips or the sample is in use |
| **MEDIUM** | ≥ 6 months of R4 data (dataThrough ≥ 2026-12), completions-forecast PIT not rejected (KS p > 0.05 over ≥ 6 scored months), and ≥ 30 delayed-entry crowd decisions in the user's office group |
| **HIGH** | MEDIUM plus the historical backtest passing plus 12 scored months |

`validated` = `params.validation.status === 'validated_current'`.

## 11. Crowdsourced data (v1.1): methods only

- **Delayed-entry Kaplan–Meier** per transition and cell.
  - Each shared row enters the risk set at its age at `registeredAt` (left truncation) and leaves at its event or censoring.
  - Formula: `Ŝ(t) = Π_{t_j ≤ t} (1 − d_j / |R(t_j)|)` with `R(t) = {i : entry_i < t ≤ exit_i}`.
  - Approval vs denial: **Aalen–Johansen** cumulative incidence.
  - Naive medians or trimmed quantiles of completed durations are **banned** (must-fix).
- **Thresholds:**
  - n < 5 → not emitted;
  - 5–9 → display with N, never used;
  - ≥ 10 → office-group display estimates;
  - ≥ 30 events per transition → milestone sub-model input;
  - ≥ 100 decisions with channel → channel-specific pool share (v2.2).
- **Controls:**
  - evidence weights: notice 1.0, online status 0.8, memory 0.5;
  - post-stratification to the official humanitarian-pending frame by office group × filing quarter, with weights trimmed at 5×;
  - **benchmark gate:** crowd-implied monthly hazard / official (C/pending) ∉ [0.5, 2] with ≥ 30 events → "esta muestra no es representativa" and not used;
  - an influence cap of 5 % per office-month cell.
- The first questions to test are the channel effect on EAD timing (two clusters expected, doc 16 §8.3) and mandamus outcomes (n ≥ 20 to revisit ×1.3, doc 15 §9.3).

## 12. Model risks

| # | Risk | Treatment |
|---|---|---|
| M1 | Scenario-dominated (94 % of the variance) | Show the policy band and weights; data-driven weights with a ledger; alert rules by PR |
| M2 | Mixed pool (class mix) | Structural band; v2.2 multi-class pool from crowd `entry_channel` |
| M3 | Office proxy (humanitarian column, approvals-only, hold-straddling quarters) | Shrinkage, clamp, "dato débil"; denials added (with golden regeneration) |
| M4 | Post-interview lognormal from attorney anecdotes; 2026 reports of long post-interview waits (doc 07 §7) | "Confianza baja" label; replace with crowd data at ≥ 30 events |
| M5 | Approval range [I], unvalidated after PA-2026-05 | Never in the headline; basic-docs gate; unmodelled-factor list; re-estimate on FY26 Q4 (≈ Dec 2026) |
| M6 | Jul/Aug 2026 rows un-cross-checked [F only] | T20b banner; the canary flags revisions |
| M7 | σ_obs fitted on 9 differences | Floor 0.25 and tempering 0.5; refit monthly; scored by PIT |

## 13. v2 path (doc 08 §12, reordered)

1. **v1.1:**
   - Denials in the office multipliers.
   - CUSUM change-point monitor on the completions residuals from §6.2. A trip (|CUSUM| > 4) shows the "incertidumbre de política" banner and widens the weights toward the extremes.
   - Forecast ledger and scorecard; backtest Must.
2. **v2.0:** Crowd milestone sub-models (Aalen–Johansen, ≥ 30 events), replacing the post-interview lognormal.
3. **v2.1:** Hierarchical office effects fitted in CI, shipping τ.
4. **v2.2:** Multi-class pool (parolee share of completions from crowd decisions, ≥ 100).
5. **v2.3:** Seeded Monte Carlo (fixed seed, 2,000 draws) over ramp speed, hold timing, β and m.
6. **v2.4:** Competing risks once the FY26 Q4 / FY27 Q1 decision mixes are observable.
7. **v2.5:** Promotion of the confidence levels per §10.3.
8. **v2.6:** A (c)(9) EAD sub-model **only** once ≥ 30 crowd EAD events exist. Until then, no EAD hazard model (must-fix).

---

## Appendix A — Reference oracle (`tools/oracle/vph1.py`, stdlib only, run with `python3 -I`)

This is the exact core that produced §9 [V]. WP-EST copies it verbatim into `tools/oracle/vph1.py`. The case harness lives in `tools/oracle/golden_cases.py`, **which is the entry point** for `golden:check` / `golden:write`. Because `python3 -I` implies `-P` (the script's directory is not on `sys.path`; verified on Python 3.13), its first lines must be `import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))` and only then `import vph1`. The harness adds (milestone `mfun`, state mixture, structural extras, likelihood update, alert composition), as specified in §4–§7, so that the oracle writes every row of the golden file.

```python
import math, json, sys
ROWS_TXT = """2024-09 10833 13464 202 151425 97685 6.7
2024-10 17448 10807 299 157703 98392 8.9
2024-11 19892 7269 326 169727 101700 10.1
2024-12 20685 8663 309 181390 104912 8.8
2025-01 22880 10034 275 194437 106558 8.3
2025-02 24385 10984 298 207564 109059 8.2
2025-03 26187 8065 302 225208 114521 8.3
2025-04 27173 5662 282 246689 123202 8.5
2025-05 23881 3376 226 267090 136077 9.5
2025-06 21510 1647 277 286309 148186 11.6
2025-07 19354 2265 207 302775 167277 11.6
2025-08 13748 2784 190 312913 191660 11.7
2025-09 11152 3529 215 318763 212644 11.4
2025-10 9059 1954 186 323471 235832 12.9
2025-11 7265 2111 175 327987 254767 12.9
2025-12 8598 41 14 336589 274207 19.4
2026-01 7086 15 4 343656 291001 27.8
2026-02 4813 10 21 348318 302719 23.8
2026-03 3439 25 21 351423 312848 21.3
2026-04 2665 23 38 353450 321681 29.8
2026-05 1846 27 129 354649 329417 23.2
2026-06 1774 89 281 355371 336679 21.5
2026-07 1355 308 318 355379 342636 22.2
2026-08 1213 386 434 355520 345741 20.6"""   # ym received approved denied pending pendingOver6 avgMonths  [F doc 04 §1.1]
ROWS=[dict(zip(['ym','rec','app','den','pend','p6','avg'],[p[0]]+[int(x) for x in p[1:6]]+[float(p[6])])) for p in (l.split() for l in ROWS_TXT.splitlines())]

def init_pool(rows):
    f=rows[0]; return [[12.0,float(f['p6']),'legacy>6mo'],[3.0,float(f['pend']-f['p6']),'legacy<6mo']]
def remove(pool,C,beta):
    w=[v[1]*math.exp(beta*v[0]) for v in pool]; W=sum(w)
    for v,wi in zip(pool,w): v[1]=max(0.0,v[1]-C*wi/W)
def mean_age(pool,beta):
    w=[v[1]*math.exp(beta*v[0]) for v in pool]; W=sum(w)
    return sum(wi*v[0] for v,wi in zip(pool,w))/W
def reconstruct(rows,beta,targets=None):
    pool=init_pool(rows); err=0.0; scales=[]
    for r in rows[1:]:
        for v in pool: v[0]+=1
        pool.append([0.5,float(r['rec']),r['ym']])
        if targets is not None and r['ym'] in targets: err+=(mean_age(pool,beta)-r['avg'])**2
        remove(pool,r['app']+r['den'],beta)
        s=r['pend']/sum(v[1] for v in pool); scales.append(s)
        for v in pool: v[1]*=s
    return pool,err,scales
def fit_beta(rows):
    t=[r['ym'] for r in rows if r['app']+r['den']>=300][-3:]
    if len(t)<3: return 0.037
    sse=lambda b: reconstruct(rows,b,set(t))[1]
    lo,hi=0.0,0.3
    for _ in range(60):
        m1=lo+(hi-lo)/3; m2=hi-(hi-lo)/3
        if sse(m1)<sse(m2): hi=m2
        else: lo=m1
    return (lo+hi)/2
def ramp(a,b,n): return lambda k: a+(b-a)*min(k,n)/n
SCEN={'S0':(0.30,lambda k:800.0),'S1':(0.40,ramp(800,4600,12)),'S2':(0.15,ramp(800,9200,6)),'S3':(0.15,lambda k:0.0 if k<=6 else ramp(800,4600,12)(k-6))}
def project(pool0,label,beta,comp,m,H,receipts=1000.0,mfun=None,k0=2):
    pool=[v[:] for v in pool0]; u=next(v for v in pool if v[2]==label); S=[1.0]
    for k in range(1,H+1):
        for v in pool: v[0]+=1
        pool.append([0.5,receipts,'f%d'%k])
        C=comp(k); w=[v[1]*math.exp(beta*v[0]) for v in pool]; W=sum(w)
        mm=m*(mfun(k-k0) if mfun else 1.0)          # mfun(t) must return 1.0 for t <= 0
        h=min(0.95, C*math.exp(beta*u[0])/W*mm) if W>0 else 0.0
        for v,wi in zip(pool,w): v[1]=max(0.0,v[1]-C*wi/W)
        S.append(S[-1]*(1-h))
    return S
BG=[(0.5,0.25),(1.0,0.5),(2.0,0.25)]; OG=[(0.8,0.25),(1.0,0.5),(1.25,0.25)]
def grid(pool0,label,beta,m_office,H,k0,scen=SCEN,extra=[(1.0,1.0)],mfun=None):
    paths=[]
    for sid,(sw,comp) in scen.items():
        for bm,bw in BG:
            for om,ow in OG:
                for xm,xw in extra:
                    S=project(pool0,label,beta*bm,comp,m_office*om*xm,H,mfun=mfun,k0=k0)
                    paths.append(dict(sid=sid,prior=sw*bw*ow*xw,S=S))
    return paths
def mix(paths,k0):
    post=[p['prior']*p['S'][k0] for p in paths]; Z=sum(post); post=[x/Z for x in post]
    H=len(paths[0]['S'])-1
    S=[sum(pw*p['S'][k]/p['S'][k0] for pw,p in zip(post,paths)) for k in range(k0,H+1)]
    return S,post
def quant(S,q):
    for t in range(1,len(S)):
        if 1-S[t]>=q-1e-12: return t
    return None
def summary(S):
    return dict(p3=1-S[3],p6=1-S[6],p12=1-S[12],p18=1-S[18],p24=1-S[24],p36=1-S[36],p60=1-S[60],
                q10=quant(S,.1),q25=quant(S,.25),q50=quant(S,.5),q75=quant(S,.75),q90=quant(S,.9))
# Reference case: beta=fit_beta(ROWS); pool,_,_=reconstruct(ROWS,beta);
# S,post=mix(grid(pool,'2025-03',beta,1.0,74,2),2); summary(S) → T15.
# Milestone example (T18'): mfun=lambda t: 1.0 if t<1 else (0.0 if t<=3 else (1.5 if t<=6 else 1.0)).
# Structural band: extra=[(0.45,1.0)] and extra=[(2.4,1.0)].
# State mixture: per-office grid with m̂_o; weight ∝ pending_o * Σ prior·S(k0); mix the conditioned curves.
```
