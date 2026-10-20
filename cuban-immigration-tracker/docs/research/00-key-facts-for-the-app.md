# 00 — Key Facts for the App (machine-friendly) — Round 2

Compact list of what the app must encode. Distilled from research docs 01–16 on 2026-10-20 (Round 2 adds docs 14 discretion-memo scope, 15 delay remedies, 16 CBP One cohort). Tags: [S] seen in a page/search result · [S-sec] secondary/news only · [F] read from a USCIS data file · [T] training knowledge · [I] inferred. Dates ISO-8601. Money USD. Every value should be stored with an `as_of` and a `source` field in the app's data files.

## 1. Eligibility rules (Cuban Adjustment Act, Pub. L. 89-732)

```yaml
caa_eligibility:
  statute: "Pub. L. 89-732 (1966), 8 U.S.C. 1255 note"          # [S] doc 02; discretionary "may ... in his discretion" (same formula as INA 245(a)) [T] doc 14
  nationality: native_or_citizen_of_cuba                        # Cuban passport, birth certificate or citizenship proof
  entry: inspected_and_admitted_or_paroled                       # I-94 shows admission or "paroled" (class DT for CBP One; CHNV; FRP/CFRP)
  entry_is_historical: true                                      # the test is "WAS paroled"; expired/terminated/revoked parole still satisfies it [S]/[I] docs 02, 03, 16 §5
  excluded_entry_channels:
    - I220A            # Order of Release on Recognizance; NOT parole (Matter of Cabrera-Fernandez, 28 I&N Dec. 747 (BIA 2023)); 11th Cir. remand 2026-02-23 did not change this; Bello-Rubio (S.D. Fla.) survives MTD 2026-09-10 but no holding yet [S]
    - EWI              # entered without inspection
    - CONDITIONAL_PAROLE_236   # INA 236(a)(2)(B) conditional parole is not 212(d)(5) parole [S-sec] doc 16
  physical_presence_min_days: 365                                # file on/after day 366 ("un año y un día") [S] doc 02; presence, not status, is counted [I]
  admissible: true                                               # inadmissibility grounds apply; I-601 waivers where available
  public_charge_test: exempt                                     # Policy Manual table 2026-08-18 [S] docs 10/11 (91 FR 45324 cite [U])
  visa_number_required: false
  priority_date_required: false
  parole_still_valid_required: false
  discretion:
    statutory: true                                              # always discretionary [T]
    policy_manual_vol7_partA_ch10: applies                       # rewrite 2025-11-27; negative factors incl. "parole history" since 2025-08-19 [S] docs 11/14
    pm_602_0199_applies_to_caa: false                            # likely; memo silent on CAA, gov't told M.D. Fla. it does not apply, court found persuasive [I ~80% / S-sec] doc 14
    pa_2026_05_applies_to_caa: true                              # all benefit requests pending on/after 2026-08-05 [S] doc 14
  derivatives:
    who: spouse_or_unmarried_child_under_21_of_principal
    nationality: any
    requirement: residing_with_principal_in_US
    class_codes: {principal: CU6, derivative: CU7}               # [S] docs 02/05
  rollback_months_max: 30                                        # LPR date = later of (arrival) or (approval - 30 months) [S] doc 02
  nta_on_denial: true                                            # PM-602-0187 (2025-02-28) [S] doc 11
  denial_remedy: I-290B motion to reopen/reconsider (30 days, 33 mailed); no AAO appeal; renew before IJ if in proceedings  # [S]/[T] docs 14/15
entry_channel_enum: [CHNV, CBP_ONE, FRP_CFRP, U4U, I220A, VISA, OTHER_PAROLE, EWI]
```

Flags the app must set per case:
- `is_parole_based = entry_channel in {CHNV, CBP_ONE, FRP_CFRP, U4U, OTHER_PAROLE}`; `caa_paroled_element_met = is_parole_based` **regardless of termination** [S]/[I] doc 16 §5.
- `r1_hold_applies = entry_channel in {CHNV, FRP_CFRP, U4U}` (Davidson memo names only U4U/CHNV/FRP); `CBP_ONE` → 0 R1 hold days with `confidence: low` [S]+[I] doc 16 §3.
- `frp_i485_carveout = (entry_channel == FRP_CFRP) and (i485_filed_on <= 2025-12-15)` → parole continues until expiry or final I-485 decision [S] 90 FR 58032 (govinfo, confirmed 2026-10-20).
- `red_eagle_class_member = cuban_national and i485_not_finally_adjudicated_as_of_2026-08-24` [S] N.D. Cal. 3:26-cv-04850 — any channel.
- `doe_dhs_class_member = (entry_channel == CBP_ONE) and (2023-05-15 <= parole_date <= 2025-01-19) and received_april_2025_email and in_US` [S] doc 16 §4.3 (window start May 15 vs 16 unresolved).
- `parole_end_date_original`: capture from the original I-94; an I-94 end date of **2026-04-24** is the April-2026 re-termination, not the original date [S] doc 16 §8.1. `termination_notice_dates[]` enum `{EMAIL_APR_2025, CHNV_JUN_2025, INDIVIDUAL_APR_2026, FRP_JAN_2026, OTHER}`.
- `expedited_removal_shield = false` since 2026-08-11 (*CHIRLA* stay vacated, D.C. Cir. 25-5289) → amber warning copy for any terminated-parole user [S] doc 16 §6.
- `i220a_warning = (entry_channel == I220A)` → "not CAA-eligible under current BIA precedent; BIA remand decision expected late 2026; *Bello-Rubio* class certification pending" and no estimate.
- `packet_complete` (I-94/parole record, Cuban nationality proof, I-693, photos, fee) → conditions the approval prior under PA-2026-05 [I] doc 14 §8.

## 2. Milestone sequence (I-485 CAA, 2025+ filers)

| # | Milestone key | EN | ES | Typical timing (R0 / current) | Notes |
|---|---|---|---|---|---|
| 1 | `filed` | Package mailed / e-filed | Paquete enviado | day 0 | Lockbox by state; I-485 edition 09/18/26 mandatory from 2026-09-18 |
| 2 | `receipt` | Receipt notice (I-797C) | Aviso de recibo | 2–4 weeks | Prefix IOE / MSC / SRC / WAC / EAC / LIN; "MSC 2490…" block ≈ Oct 2023–Aug 2024 filings [S] doc 10 |
| 3 | `biometrics` | Biometrics appointment (ASC) | Cita biométrica | 3–8 weeks (R0); Jun–Aug 2025 for Mar-2025 CHNV filers (R1 release) | Reuse stopped 2025-12-12 [S′]; CBP One filers were not R1-held → earlier biometrics possible [I] doc 16 |
| 4 | `ead_c9` | EAD (c)(9) card | Permiso de trabajo (c)(9) | 3–6 mo (R0); 6 mo reference case (Sep 2025); 12–13 mo for later cohorts [S] | Validity 5 yr if issued before 2025-12-05, 18 mo after; no auto-extension for renewals filed ≥ 2025-10-30 (final rule 2026-10-14) [S]. I-765 147-C9 inquiry date 2025-06-13 (NBC) → a (c)(9) filed Mar 2025 **can** file an e-Request today [F/I] doc 15 |
| 5 | `ap_i131` | Advance parole (optional) | Permiso de viaje | with EAD | Travel strongly discouraged after parole termination [T] |
| 6 | `interview_notice` | Interview notice | Aviso de entrevista | 6–12 mo (R0); now expected for most 2025+ filers (P ≥ 0.8) [I] doc 12 | Field office by ZIP; attorneys in person only since 2026-05-18 [S] doc 15 |
| 7 | `interview` | Interview | Entrevista | +4–8 weeks | Do **not** prep users for "why not consular processing" (that is the §245(a) question); keep discretionary-factor checklist incl. parole history [I] doc 14 §8 |
| 8 | `rfe` / `noid` | Request for Evidence / Notice of Intent to Deny | Solicitud de evidencia / Intención de negar | any time | PA-2026-05 (2026-08-05): RFE ≤ 12 weeks, NOID 30 days (+3 mail), no extensions, **denial without RFE/NOID possible** when initial evidence missing or burden unmet [S] doc 14 |
| 9 | `decision` | Approval / Denial | Aprobación / Negación | FY2025 median 7.0 mo; FY2026 11.8 mo (cut 2026-07-31) [S]; quarterly median 16.3 (Apr–Jun 2026) [F] | Approval share FY26 Q3 23.7% (139/586) — show with Q1 91.7% / Q2 52.6% / FYTD 83% baselines [F] doc 14 |
| 10 | `card` | Green card produced/mailed | Tarjeta de residencia | +2–4 weeks | Rollback up to 30 months |
| 11 | `re_review` | Post-approval re-review (PA-2025-26) | Re-revisión | — | Re-review policy stayed back into effect by 1st Cir. 2026-08-14 (partial stay) [S] |
| 12 | `naturalization_eligible` | N-400 eligible | Elegible para ciudadanía | LPR date + 5 yr (rollback counts) | PA-2026-10 neighbourhood checks for N-400 [S] |

Remedy milestones (doc 15 §9.2; all optional, suppressed at n < 5): `erequest_date/type/response_date/response`, `expedite_request_date/basis/outcome/outcome_date`, `congressional_inquiry_date/office/response_date`, `ombudsman_date/request_number_present/response_date`, `mandamus_filed_date/court/outcome/outcome_date`, `red_eagle_class_member` (derived).

## 3. Regime breakpoints (exact dates for the estimator)

```json
{
  "regimes": [
    {"id":"R0","label":"fast lane","start":null,"end":"2025-02-13","hold":false,"appliesTo":["ALL_CUBAN"]},
    {"id":"R1","label":"parolee benefit hold (Davidson memo)","start":"2025-02-14","end":"2025-06-09","hold":true,
     "appliesTo":["CHNV","FRP_CFRP","U4U"],"notAppliedTo":["CBP_ONE","VISA","I220A","OTHER_PAROLE"],"confidence_CBP_ONE_exempt":"low",
     "alt_end":{"legal":"2025-05-28","ops_reports":["2025-06-19","2025-06-25"]},
     "instruments":["USCIS memo 2025-02-14 (U4U/CHNV/FRP)"],"source":"doc 16 §3; USCIS FOIA reading-room copy"},
    {"id":"R2","label":"catch-up","start":"2025-06-09","end":"2025-12-01","hold":false,"appliesTo":["ALL_CUBAN"],"instruments":["USCIS memo 2025-06-09"]},
    {"id":"R3","label":"country hold-and-review","start":"2025-12-02","end":"2026-06-12","hold":true,"appliesTo":["ALL_CUBAN"],
     "alt_end":{"legal":"2026-06-05","judgment":"2026-06-11","ops_reports":["2026-07-16"]},"instruments":["PM-602-0192","PM-602-0194","PA-2025-26"]},
    {"id":"R4","label":"general-discretion + evidentiary-denial regime","start":"2026-06-12","policy_start":"2026-05-21","end":null,"hold":false,"appliesTo":["ALL_CUBAN"],
     "instruments":[
       {"id":"PolicyManual-Vol7-PtA-Ch10","date":"2025-11-27","applies_to_caa":true},
       {"id":"NegativeFactors-ParoleHistory","date":"2025-08-19","applies_to_caa":true},
       {"id":"PM-602-0199","date":"2026-05-21","public":"2026-05-22","applies_to_caa":false,"confidence":"likely","source":"doc 14 §3, §6"},
       {"id":"PA-2026-05","date":"2026-08-05","applies_to_caa":true,"confidence":"high","source":"doc 14 §4"},
       {"id":"RedEagle-PI","date":"2026-08-24"},{"id":"1stCir-partial-stay-rereview","date":"2026-08-14"},{"id":"I-485-edition-09/18/26","date":"2026-09-18"}]}
  ],
  "sub_breakpoints": [
    {"date":"2025-01-23","event":"DHS/ICE: expedited removal usable against paroled arriving aliens"},
    {"date":"2025-04-07","event":"CBP One round-1 e-mail terminations (to 04-11)"},
    {"date":"2025-05-30","event":"SCOTUS stay 24A1079: CHNV parole termination proceeds"},
    {"date":"2025-06-12","event":"CHNV termination notices; (c)(11) EADs revoked"},
    {"date":"2025-08-01","event":"CHIRLA ER stay for port-of-entry parolees (vacated 2026-08-11)"},
    {"date":"2025-08-19","event":"parole history listed as negative discretionary factor"},
    {"date":"2025-10-30","event":"no EAD auto-extension for renewals filed on/after"},
    {"date":"2025-12-05","event":"EAD max validity 18 months"},
    {"date":"2025-12-15","event":"FRP termination; I-485-on-file carve-out"},
    {"date":"2026-01-01","event":"PM-602-0194: 39 countries; PA-2025-26 re-review"},
    {"date":"2026-03-31","event":"Doe v. DHS: April-2025 CBP One terminations vacated (class)"},
    {"date":"2026-04-24","event":"CBP One individualized re-termination notices; I-94 end dates rewritten"},
    {"date":"2026-05-18","event":"attorneys in person only at field-office interviews"},
    {"date":"2026-05-22","event":"PM-602-0199 public (file-dated 05-21); applies_to_caa false (likely)"},
    {"date":"2026-06-05","event":"Dorcas vacatur (legal end of R3)"},
    {"date":"2026-08-05","event":"PA-2026-05 deny-without-RFE (applies to CAA)"},
    {"date":"2026-08-11","event":"CHIRLA stay vacated: ER exposure returns for former parolees"},
    {"date":"2026-08-14","event":"1st Cir partial stay: re-review policy back"},
    {"date":"2026-08-24","event":"Red Eagle class PI"},
    {"date":"2026-09-18","event":"I-485 edition 09/18/26 mandatory; public-charge rule effective (CAA exempt)"},
    {"date":"2026-10-05","event":"AAUP v. Mullin filed (PM-602-0199 + PA-2026-05)"},
    {"date":"2026-10-14","event":"EAD auto-extension removal final rule"}
  ],
  "adjudicable_days_rule": "calendar_days(filed, today) - sum(overlap_days(regime) for regime in regimes if regime.hold and (ALL_CUBAN in regime.appliesTo or case.entryChannel in regime.appliesTo))",
  "reference_cases": [
    {"id":"T11","entryChannel":"CHNV","filedOn":"2025-03-15","today":"2026-10-20","calendar_days":584,"r1_overlap":86,"r3_overlap":192,"adjudicable_days_default":306,"adjudicable_days_alt_ops_ends":256},
    {"id":"T19","entryChannel":"VISA","filedOn":"2025-03-15","today":"2026-10-20","calendar_days":584,"adjudicable_days_default":392},
    {"id":"T21","entryChannel":"CBP_ONE","filedOn":"2025-03-15","today":"2026-10-20","calendar_days":584,"adjudicable_days_default":392,"r1_confidence":"low"},
    {"id":"T22","entryChannel":"CBP_ONE","paroleDate":"2024-02-01","filedOn":"2025-02-05","today":"2026-10-20","calendar_days":622,"adjudicable_days_default":430}
  ]
}
```

Estimator defaults (doc 08 VPH-1, amended by docs 14–16): horizon H = 72 months; β_age = 0.0374/month; receipts forecast 1,000/month; office shrinkage k₀ = 50, clamp [0.5, 2.0]; post-interview decision lognormal median 3 mo, σ 0.857; multipliers: EAD received 1.0, no biometrics after 4 mo 0.7, RFE pending 0, RFE answered 1.5, **mandamus filed 1.3 for 4 months (doc 15; was 3.0 in doc 08)**, expedite granted → post-interview-like distribution; e-Request / congressional / Ombudsman: no hazard change. Scenarios: S0 800/mo flat (p 0.30); S1 ramp 800→4,600 over 12 mo (0.40); S2 ramp 800→9,200 over 6 mo (0.15); S3 six-month re-freeze then S1 (0.15). Office multipliers from FY26 Q2+Q3 (approvals / mean pending): HIA 0.947, KND 0.829, MIA 0.963, TAM 1.936, HOU 1.140 (raw; shrink before use). Approval-given-decision prior for a clean CHNV/CBP One CAA case: **70–90%** (centre 85%; conditioned on `packet_complete`; widen until Sep–Nov 2026 CSVs show post-PA-2026-05 behaviour); population shares to display beside it: Jul 2026 49% (308/626), Aug 2026 47% (386/820) [F]. Pending-pool prior: ≈175k pre-Mar-2025 cases still pending; parole-based CAA filer universe ≈ 110,240 CHNV + ≈100,000 CBP One (70k–130k) Cubans [I] doc 16 §8.3. Alert re-weighting: Dorcas affirmed → S3 ÷ 3; Dorcas reversed → S3 × 3 (× 1.5 while Red Eagle PI in force); Red Eagle PI dissolved → S3 × 2; new hold memo naming Cuba → S3 × 3; AAUP relief against the **Denial Policy** → raise approval prior; relief against the AOS Policy alone → informational only; monthly completions ≥ 2,000 for two months → S0 ÷ 2, S1 × 1.5. Data-vintage guard T20: monthly file > 75 days old → LOW; monthly rows > one quarter beyond the latest workbook → banner.

## 4. Fees (USCIS, paper filing) and remedy costs

| Form / item | Fee | Since | Note | Source |
|---|---|---|---|---|
| I-485 (age 14+) | $1,440 | 2024-04-01 | biometrics included; no H.R.1 surcharge; no FY2026/FY2027 change | 89 FR 6194 [S′] docs 02/11 |
| I-485 (under 14, with parent) | $950 | 2024-04-01 | | same |
| I-765 (c)(9) initial/renewal | $260 | 2024-04-01 | no longer free with I-485 | same |
| I-131 advance parole (with I-485) | $630 | 2024-04-01 | | same |
| I-912 fee waiver | $0 | — | CAA I-485 fee waivable [T] | doc 02 |
| I-765 (c)(11) parole EAD initial / renewal | $550 / $275 → $560 / $280 (2026-01-01) → $570 / $280 (2026-10-16) | 2025-07-22 | H.R.1 statutory, not waivable; re-parole side-path only | FR 2025-13738, 2025-20622 [S] doc 11 |
| Parole / re-parole (I-131) | $1,000 → $1,020 → $1,050 (2026-10-16) | 2025-07-22 | | same |
| I-589 asylum | $100 + $100/yr → $102 → $105/yr | 2025-07-22 | side-path | same |
| TPS (I-821) | $500 | 2025-07-22 | not available to Cubans | same |
| I-246 stay of removal | $155 (proposed $755, NPRM 2026-05-07) | — | removal context | doc 11 |
| I-290B motion to reopen/reconsider | see USCIS fee schedule [T] | — | denial remedy; 30 days (33 mailed) | docs 14/15 |
| e-Request, expedite request, DHS-7001 (Ombudsman), congressional inquiry | $0 | — | | doc 15 |
| Mandamus/APA suit | $405 federal filing fee [T] + attorney ≈ $3,000–8,000 individual [T/I]; EAJA fees only if prevailing | — | no 2026 CAA figure found | doc 15 §6.3 |

Form edition: I-485 edition **09/18/26** mandatory for filings postmarked/e-filed on/after 2026-09-18, no grace period [S]. I-693 must be filed with the I-485 (since 2024-12-02) and is valid only while that I-485 is pending (since 2025-06-11) [S′]. Premium processing (I-907) does not exist for I-485 or (c)(9) [T].

## 5. Remedy ladder (doc 15) — gates, forms, turnaround

| Rung | Channel | Gate | Form / endpoint | Turnaround | Effect on estimate |
|---|---|---|---|---|---|
| a | e-Request "case outside normal processing time" | `receipt_date < service_request_date(form, subtype proxy, office)` — I-485: `131A-FAM` at office; I-765 (c)(9): `147-C9` at NBC | `https://egov.uscis.gov/e-request` (paper) / myUSCIS account (online) [T] | template reply ≈ 30 (–60) days [S-sec]; call Contact Center after 30 days with confirmation number | none |
| b | Expedite request | documented severe financial loss (job loss, benefits loss — "need for an EAD alone is not enough"), emergency/humanitarian, nonprofit, government interest, clear USCIS error (e.g. case still flagged under a vacated hold) | call 1-800-375-5283 (ES: oprima 2) or online-account secure message [S] | days–weeks for yes/no [T]; no appeal | granted → post-interview-like distribution |
| c | CIS Ombudsman DHS-7001 | contact USCIS first; generally not within processing time; online filing | `https://www.dhs.gov/topic/cis-ombudsman/7001`; status via go.dhs.gov/34R | confirmation ≤ 24 h; **substantive reply may never come** (office near-dormant since the 2025-03-21 RIF) [S-sec] | none |
| d | Congressional inquiry | member's privacy release (5 U.S.C. §552a(b)); offices may decline status inquiries within normal time | member website form; USCIS OLA standard: initial reply ≤ 5 days, meaningful ≤ 30 days [S] | 2–8 weeks [T] | none |
| e | Mandamus / APA §706(1) suit | no statutory threshold; practitioner rule of thumb > 2 yrs (reference case: 2027-03-15), ~3 yrs (2028-03-15); TRAC factors; hold-vacatur argument available | district court; 28 U.S.C. §1361; 5 U.S.C. §§555(b), 706(1) | government answer 60 days; *Acosta Reynoso*: filed 05-04 → TRO denied 07-03 → PI denied 07-30 2026 (no acceleration ordered) | ×1.3 for 4 months (provisional) |
| f | Field-office appointment / Contact Center | specific need only (ADIT stamp, emergency travel, proof of status); no walk-ins; InfoPass replaced by online request `my.uscis.gov/appointment` [T] | 1-800-375-5283 / TTY 1-800-767-1833 | Contact Center confirms; not guaranteed | none |

Red Eagle compliance channel: **none published**; if a reply says "on hold pending guidance," keep it, quote the USCIS 2026-08-28 alert + *Dorcas* vacatur + *Red Eagle* case number in the next inquiry, monitor `https://clearinghouse.net/case/48417/` and `https://uscis-pause-tracker.com/` [I] doc 15 §6.4.

Case-inquiry dates (I-485 `131A-FAM`, published 2026-10-15 [F]) and crude linear ETA for a 2025-03-15 receipt to become "outside normal" [I] doc 15 §2.2: MIA 2023-06-17 (≈ Feb 2028); HIA 2024-07-05 (≈ Oct 2027); KND 2024-05-28 (≈ Oct/Nov 2027); TAM 2024-08-07 (≈ Aug 2027); ORL 2024-01-28 (≈ Mar 2028); WPB 2024-05-18 (≈ Sep 2027); OFM 2024-05-11 (≈ Jul 2027). I-765 `147-C9` NBC 2025-06-13 / SCD 2025-06-24; `147-C11` 2025-04-26. Recompute from the live tool each refresh.

## 6. Field offices (Cuban-relevant subset; codes as used by the Processing Times tool)

| Code | Office | State | Aug 2026 family-based 80% time (mo) [S yiminshuju] | 131A-FAM case-inquiry date (2026-10-15) [F] | Counties (indicative, [T]) |
|---|---|---|---|---|---|
| MIA | Miami | FL | 21.5 | 2023-06-17 | Miami-Dade (city/north; sub-county by ZIP) |
| HIA | Hialeah | FL | n/q | 2024-07-05 | Miami-Dade (Hialeah/NW) |
| KND | Kendall | FL | n/q | 2024-05-28 | Miami-Dade (south/west) |
| OKL | Oakland Park | FL | n/q ("Hollywood FL" in some sources = this office) | 2023-07-19 | Broward |
| WPB | West Palm Beach | FL | n/q | 2024-05-18 | Palm Beach, Martin, St. Lucie, Indian River, Okeechobee |
| OFM | Fort Myers | FL | n/q | 2024-05-11 | Lee, Collier, Charlotte, Hendry, Glades |
| TAM | Tampa | FL | 17.0 | 2024-08-07 | Hillsborough, Pinellas, Pasco, Polk, Manatee, Sarasota, Hernando |
| ORL | Orlando | FL | 18.5 | 2024-01-28 | Orange, Osceola, Seminole, Brevard, Volusia, Lake, Flagler |
| JAC | Jacksonville | FL | 17.0 | 2024-02-08 | Duval, Clay, Nassau, St. Johns, Alachua, Marion, panhandle |
| HOU | Houston | TX | 18.0 | 2023-10-29 | Harris + SE Texas |
| DAL | Dallas | TX | 13.5 | n/a | DFW |
| SNA | San Antonio | TX | n/q | 2024-10-11 | |
| LOU | Louisville | KY | 12.5 | 2024-10-03 | KY |
| LVG | Las Vegas | NV | 19.0 | 2023-10-31 | Clark |
| NEW | Newark | NJ | 22.0 | n/a | N NJ (Union City/West New York) |
| NYC | New York City | NY | n/q | 2024-01-13 | Manhattan/Bronx/Staten Island |
| CLT | Charlotte | NC | 18.0 | n/a | |
| ATL | Atlanta | GA | ~16.5 | n/a | |
| CHI | Chicago | IL | n/q | 2023-06-13 | |

Rules: (1) the tool lists 90 `131A-FAM` offices; load at runtime from `formoffices/I-485/131A-FAM` (or the jzebedee SQLite); never hard-code; (2) ZIP → county (HUD USPS crosswalk) → office, Miami-Dade split by ZIP into MIA/HIA/KND [I] doc 12; (3) addresses are [T] — link to `https://www.uscis.gov/about-us/find-a-uscis-office/field-offices`; (4) no CAA subtype — label 131A-FAM as "proxy (family-based)"; (5) CBP One Cubans settle like CHNV Cubans (FL/TX) — no channel-specific office effect known [T] doc 16; (6) Cuban-district congressional offices for rung d: FL-27 Salazar, FL-28 Giménez, FL-26 Díaz-Balart [S] doc 15.

Cuban geography (Pew 2024, doc 12): 2.9 M Cuban-origin; 1.67 M Cuban immigrants; 76% in Florida, 60% greater Miami; Tampa 6%, NY 5%, TX 5%, NJ 3%. CBSA codes: Miami 33100, Tampa 45300, Orlando 36740, Jacksonville 27260, Houston 26420, Dallas 19100, Louisville 31140, Las Vegas 29820, NY-Newark 35620, Charlotte 16740, Atlanta 12060.

## 7. National series (anchor values, [F] from USCIS files)

Monthly Cuban I-485 (received / approved / denied / pending at month end; average pending age where stated):

```
2025-01 22880 10034 275 194437
2025-02 24385 10984 298 207564
2025-03 26187  8065 302 225208
2025-04 27173  5662 282 246689
2025-05 23881  3376 226 267090
2025-06 21510  1647 277 286309
2025-07 19354  2265 207 302775
2025-08 13748  2784 190 312913
2025-09 11152  3529 215 318763
2025-10  9059  1954 186 323471
2025-11  7265  2111 175 327987
2025-12  8598    41  14 336589  age 19.4
2026-01  7086    15   4 343656  age 27.8
2026-02  4813    10  21 348318
2026-03  3439    25  21 351423
2026-04  2665    23  38 353450
2026-05  1846    27 129 354649  age 23.2
2026-06  1774    89 281 355371  pending>6mo 336679  age 21.5
2026-07  1355   308 318 355379
2026-08  1213   386 434 355520  pending>6mo 345741  age 20.6
```

Quarterly workbook (received / approved / denied / completions / pending / median months): FY26 Q1 24,909 / 4,098 / 373 / — / 327,255 / 10.4 (approval share 91.7%); FY26 Q2 15,312 / 50 / 45 / 95 / 341,232 / 19.5 (52.6%); FY26 Q3 6,279 / 139 / 447 / 586 / 342,360 / 16.3 (23.7%); FY-to-date through Q3 4,287 / 865 (83%). Annual medians (historic-pt): FY2023 3.3, FY2024 4.6, FY2025 7.0, FY2026 YTD 11.8 (cut 2026-07-31; 12.3 at 2026-08-30 cut). Headline pending = monthly CSV only. Cohort denominators: CHNV Cubans 110,240 (CBP, Dec 2024); FY2024 CHNV Cubans 59,815 (House testimony); CBP One Cubans ≈100,000 (70k–130k) [I]; *Doe v. DHS* class ≈900,000 all nationalities; CHNV nationals with CBP One registrations 582,800 (FR 2025-05128); CBP One appointments 904,530 (Jan 2023–Nov 2024). Next expected files: September 2026 CSV (not out 2026-10-20); FY26 Q4 workbook ≈ early Dec 2026 — first data able to show a PA-2026-05 effect.

## 8. Data-source endpoints (from doc 13 probes; docs 14–16 add court dockets)

HTTP policy for all USCIS hosts: browser `User-Agent`, `Accept: application/json` or `text/html`, `Referer` set to the host's landing page, cookie jar, 15 s timeout, 3 retries with backoff; classify as `ok | schema_mismatch | blocked_cloudflare | http_error | network_error | skipped_no_secret`. Cloudflare markers: "Just a moment..." / "Attention Required! | Cloudflare" / "Sorry, you have been blocked", or header `cf-mitigated: challenge`. **Probe status column:** "file read [F]" = a Round-1 researcher downloaded and parsed the file; "plan only" = defined in doc 13 §12 but not yet executed (the `packages/ingestion` probe has not been run; this environment cannot reach the host).

| Key | Endpoint / URL pattern | Auth | Response shape (essentials) | Cadence | Probe status |
|---|---|---|---|---|---|
| `portal.monthly` | `GET https://www.uscis.gov/sites/default/files/document/data/appropriation_requirement_<month>_<year>_v1.0.csv` (month lowercase English; latest `august_2026`; next `september_2026`); older `Appropriation_Requirement_<Month>_<Year>.csv`, `…%20<year>.csv`, dirs `data/reports/resource-information-center-queries` | none; browser UA | CSV; rows keyed by form + category incl. `I-485 (Cuban)`: received, approved, denied, pending, pending >6 months, average months | monthly, 4–8 weeks lag | file read [F] |
| `portal.quarterly` | `GET https://www.uscis.gov/sites/default/files/document/data/quarterly_all_forms_fy<YYYY>_q<N>_v1.xlsx` (latest `fy2026_q3`) | none; browser UA | XLSX; sheet per form; CAA row receipts/approvals/denials/pending/median | quarterly, ~10 weeks lag | file read [F] |
| `portal.i485office` | `GET https://www.uscis.gov/sites/default/files/document/data/i485_performance_data_fy<YYYY>_q<N>_v1.xlsx` (stem changed four times — list the directory, do not guess) | none; browser UA | XLSX; by field office: receipts, approvals, denials, pending | quarterly | file read [F] |
| `portal.index` | `GET https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data` | none; browser UA | HTML list | — | plan only |
| `pt.formtypes` | `GET https://egov.uscis.gov/processing-times/api/formtypes/I-485` | browser headers + `Referer: https://egov.uscis.gov/processing-times/` | JSON `data.subtypes[]{form_key, form_name}`; keys `131A, 131A-FAM, 131A-HRIFA, 131B, 131C, 131T, 131U` (no CAA) | ~monthly | plan only; expected `blocked_cloudflare` from cloud IPs |
| `pt.offices` | `GET https://egov.uscis.gov/processing-times/api/formoffices/I-485/131A-FAM` | same | JSON `data.offices[]{office_code, office_description}` (90) | same | plan only |
| `pt.time` | `GET https://egov.uscis.gov/processing-times/api/processingtime/I-485/<OFFICE>/131A-FAM` ; I-765 `147-C9`, `147-C11` | same | JSON `data.processing_time{form_name, office_code, subtypes[]{form_type, range[]{value, unit}, service_request_date, publication_date}}` | same | plan only |
| `pt.nextaction` | `GET https://egov.uscis.gov/processing-times` → chunk `/processing-times/_next/static/chunks/*.js` → action id; `POST https://egov.uscis.gov/processing-times` headers `Next-Action: <id>`, `Accept: text/x-component`, body `["I-485","131A-FAM","MIA"]` | same | React Flight stream | ids rotate per deploy | plan only |
| `pt.historic` | `GET https://egov.uscis.gov/processing-times/historic-pt` | browser UA | HTML table of FY medians (CAA row) | annual + in-year | plan only (values [S-sec] via press) |
| `pt.moreinfo` | `GET https://egov.uscis.gov/processing-times/more-info` | browser UA | HTML (80% definition, inquiry-date rule) | — | plan only |
| `mirror.jzebedee` | `GET https://api.github.com/repos/jzebedee/uscis/releases/latest` → `https://github.com/jzebedee/uscis/releases/download/<YYYY-MM-DD>/<YYYY-MM-DD>.db` (builds 04:30 UTC) | optional `GITHUB_TOKEN` | SQLite: forms, form_types, offices, processing_times (value/unit, service_request_date, publication_date) | daily | release diff read in Round 1 (2026-10-15 inquiry dates) [F]; host reachable |
| `mirror.visualizer` | `GET https://raw.githubusercontent.com/omairqazi29/visualizer/master/data/USCIS_I485/<file>` | none | XLSX/CSV copies of portal files | weekly | host reachable; plan only |
| `torch.token` | `POST https://api-int.uscis.gov/oauth/accesstoken` (prod `https://api.uscis.gov/oauth/accesstoken`), `grant_type=client_credentials&scope=read`, basic auth `USCIS_CLIENT_ID:USCIS_CLIENT_SECRET` | secrets | JSON `{access_token, token_type:"BearerToken", expires_in:1800}` | per 30 min | `skipped_no_secret` |
| `torch.case` | `GET https://api-int.uscis.gov/case-status/<RECEIPT>` (prod `api.uscis.gov`), `Authorization: Bearer` | secrets | JSON `case_status{receiptNumber, formType, submittedDate, modifiedDate, current_case_status_text_en/es, current_case_status_desc_en/es, hist_case_status[]{date, completed_text_en, completed_text_es}}` (alt `historicalCaseStatuses[]` — sniff both); errors 401/404/422/429/503 | real time; sandbox 5 TPS / 1,000/day; prod 10 TPS, 400,000/day (or 150,000 — conflict) | `skipped_no_secret` |
| `csol.web` | `https://egov.uscis.gov/casestatus/landing.do`; `https://egov.uscis.gov/csol-api/case-statuses/<RECEIPT>` | none | JSON (unofficial) | real time | expected `blocked_cloudflare` |
| `ohss.monthly` | index `https://ohss.dhs.gov/topics/immigration/immigration-enforcement/monthly-tables`; file `https://ohss.dhs.gov/sites/default/files/<YYYY-MM>/<YYYY_MMDD>_ohss_immigration-enforcement-and-legal-processes-tables-<month>-<year>.xlsx` | none | XLSX; CHNV sheets; look for a CBP One-by-citizenship sheet (cohort prior, doc 16) | monthly, ~third Thursday | plan only; file names seen [S] |
| `ohss.yearbook` | `https://ohss.dhs.gov/sites/default/files/2026-06/2026_0604_ohss_yearbook_lawful_permanent_residents_fy2024.xlsx` | none | XLSX; LPR by class (CU6/CU7) and state (`LPRsupptable1`) | annual | plan only |
| `cbp.monthly` | `https://www.cbp.gov/newsroom/national-media-release/cbp-releases-<month>-<year>-monthly-update` | browser UA | HTML; regex `([\d,]+) Cubans, ([\d,]+) Haitians, ([\d,]+) Nicaraguans, and ([\d,]+) Venezuelans` → 110,240 / 211,040 / 93,070 / 117,330 | series ended Jan 2025 | plan only |
| `fr.search` | `GET https://www.federalregister.gov/api/v1/documents.json?conditions[term]=<q>&conditions[agencies][]=homeland-security-department&conditions[agencies][]=u-s-citizenship-and-immigration-services&order=newest&per_page=20` | none | JSON `{count, results[]{document_number, title, publication_date, type, html_url, pdf_url, agencies[]}}` | daily ~06:00 ET | plan only |
| `fr.doc` | `GET https://www.federalregister.gov/api/v1/documents/<document_number>.json` (assert `2025-05128`, `2025-22744`, `2025-20622`, `2025-13738`, `2025-18562`, `2026-20955`) | none | JSON | — | plan only |
| `cl.docket` | `GET https://www.courtlistener.com/api/rest/v4/dockets/<id>/` — ids: Doe v. Noem **69695790** (mad 1:25-cv-10495); Dorcas 1st Cir **73477958** (26-1703); Red Eagle **73380879** (cand 3:26-cv-04850); AAUP v. Mullin **74919678** (mad 1:26-cv-14527); Doe v. DHS **71085922** (mad 1:25-cv-12245); lookups by `court` + `docket_number` for D.R.I. 1:26-cv-00132, M.D. Fla. 8:26-cv-01314, S.D. Fla. 1:25-cv-23665 (Bello-Rubio), D.D.C. 1:25-cv-00872, D.C. Cir. 25-5289 / 25-5320 | `Authorization: Token <COURTLISTENER_TOKEN>` (anon → 401) | JSON `{id, case_name, docket_number, court, date_filed, pacer_case_id, ...}` | real time | `skipped_no_secret` |
| `cl.entries` | `GET https://www.courtlistener.com/api/rest/v4/docket-entries/?docket=<id>&order_by=-date_filed` | token; 5/min, 50/hr, 125/day | JSON `{count, next, results[]{id, date_filed, entry_number, description, recap_documents[]}}` | real time | `skipped_no_secret` |
| `cl.alert` | `POST https://www.courtlistener.com/api/rest/v4/docket-alerts/` body `docket=<id>` | token | JSON | — | `skipped_no_secret` |
| `clearinghouse.case` | `https://clearinghouse.net/case/<id>/` — 48417 Red Eagle; 48515 AAUP; 46889 Doe v. DHS; 46285 CHIRLA | none | HTML (no API) | event-driven | plan only |
| `tracker.pressunpause` | `https://uscis-pause-tracker.com/` ; `/cases/<uuid>` (Dorcas dfdb50fe-…; Red Eagle f9143399-…; CHIRLA 786112b9-…) | none | HTML | event-driven | plan only |
| `census.cuba` | `GET https://api.census.gov/data/<vintage>/acs/acs1?get=NAME,B05006_143E,B05006_143M&for=metropolitan statistical area/micropolitan statistical area:33100` ; resolve by label `…Caribbean:!!Cuba` from `/groups/B05006.json` (id drifts: _094 2007, _128 2014–18, _143 2022+); PUMS POBP=327 | optional `CENSUS_API_KEY` (≤500/day keyless) | JSON array-of-arrays | annual | plan only |
| `rss.alerts` | `https://www.uscis.gov/news/rss-feed/22984` (alerts); `23269` news; `59144`/`60288` all news; `93166` fact sheets; `97790` stakeholder; `https://www.uscis.gov/forms/forms-updates/rss-feed`; Policy Manual updates `https://www.uscis.gov/policy-manual/updates` (diff daily) | browser UA | RSS 2.0 / HTML | event-driven | plan only |
| `foia.metrics` | `GET https://first.uscis.gov/api/public/foia-metrics` with `Referer: https://first.uscis.gov/` | none | JSON | daily | unknown |

Pipeline cadence (doc 09): GitHub Actions `17 6 * * *` and `17 18 * * *` UTC snapshots; probes `17 13 * * 1-5`; GitHub Pages `manifest.json` with `schema_version, generated_at, latest_snapshot, snapshots[], sources[], national_monthly[], quarterly_median_months[], by_state_quarterly[], processing_times[], community_aggregates[], estimator_params, alerts[]`. Secrets: `USCIS_CLIENT_ID`, `USCIS_CLIENT_SECRET`, `COURTLISTENER_TOKEN`, `CENSUS_API_KEY`, `GITHUB_TOKEN`. Keep the public repo's cron alive (60-day inactivity disable). Regression fixtures: FY26 Q3 Cuban row 6,279/139/447/586/342,360/16.3; Aug 2026 1,213/386/434/355,520/345,741/20.6.

## 9. Litigation watch list (for alert rules)

| Case | Court / No. | Status 2026-10-20 | Alert effect |
|---|---|---|---|
| Doe v. Noem (now Mullin) — CHNV/FRP | D. Mass. 1:25-cv-10495-IT; 1st Cir. 25-1384; SCOTUS 24A1079; CL 69695790 | May 28 2025 benefits order final (appeal dismissed 2025-11-04); CHNV SJ motion pending; FRP TRO 01-10 / PI 01-24 2026 (still in force? unconfirmed) | none for R1; `frp_i485_carveout` flag |
| Dorcas Int'l Inst. of R.I. v. USCIS | D.R.I. 1:26-cv-00132; 1st Cir. 26-1703; CL 73477958 | Vacatur in force; stay denied 07-15 (D.R.I.); partial stay (re-review only) 08-14; **no briefing/argument/merits found** | affirmed → S3 ÷ 3; reversed → S3 × 3 (× 1.5 while Red Eagle holds) |
| Red Eagle Law v. Edlow | N.D. Cal. 3:26-cv-04850-CRB; CL 73380879; Clearinghouse 48417 | Class PI 08-24 in force; USCIS alert 08-28; case stayed 08-28; status conf. 09-25 (unknown); named-plaintiff 30-day deadline ≈09-23 (compliance unknown); no Ninth Circuit appeal found | PI dissolved → S3 × 2 |
| AAUP v. Mullin | D. Mass. 1:26-cv-14527; CL 74919678; Clearinghouse 48515 | Filed **2026-10-05** [S]; no TRO/PI motion or ruling; latest entry 10-11; M.J. Cabell referral | relief vs Denial Policy (PA-2026-05) → raise approval prior; vs AOS Policy alone → informational |
| Acosta Reynoso v. USCIS | M.D. Fla. 8:26-cv-01314-KKM-NHA (Mizelle) | TRO denied 07-03; PI denied 07-30 (irreparable harm); 08-13 adjudication report unseen; gov't position: PM-602-0199 does not apply to CAA | mandamus multiplier 1.3; cite for "courts have not ordered USCIS to speed up CAA cases" |
| Doe v. DHS (CBP One class) | D. Mass. 1:25-cv-12245 (Burroughs); CL 71085922; Clearinghouse 46889 | 03-31 vacatur of April-2025 terminations; DHS "timely complying" (order, RECAP 48); 04-24 individualized re-terminations; 05-06 hearing — one report says re-termination allowed with limited sanctions [S single source]; last filing 08-04; no appeal found | enforcement-risk copy only |
| CHIRLA v. Noem / Mullin (expedited removal) | D.D.C. 1:25-cv-00872; D.C. Cir. 25-5289 | ER stay 2025-08-01 **vacated 2026-08-11** (standing); mandate/rehearing unconfirmed | `expedited_removal_shield=false` warning |
| Make the Road New York v. Mullin | D.C. Cir. 25-5320 (June 2026 opinion, unread) | nationwide ER expansion appeal | I-220A cohort copy |
| Bello-Rubio v. Noem (I-220A) | S.D. Fla. 1:25-cv-23665 (Becerra); 992 plaintiffs | MTD denied 09-10; 2nd amended complaint 09-18; class-cert brief 10-20; no I-220A = parole holding | I-220A eligibility flip (with Labrada-Hechavarria BIA remand, expected Oct–Nov 2026) |
| Labrada-Hechavarria | 11th Cir. 23-13664 / 24-10645 | remand 2026-02-23; BIA decision pending | I-220A eligibility flip |
| D. Md. (Russell) 83 plaintiffs; Medani v. Trump | D. Md. | 04-24 resumption order (individual); PM-602-0193 DV hold vacated 08-28 | none |
| Mullin v. Doe (SCOTUS) | — | TPS case — not CHNV; key watchers on docket numbers, not captions (Noem → Mullin renames) | none |

## 10. Glossary EN / ES

| Term | EN | ES | Definition |
|---|---|---|---|
| CAA | Cuban Adjustment Act | Ley de Ajuste Cubano | 1966 statute allowing paroled/admitted Cubans to adjust after one year |
| CHNV | CHNV parole | Parole humanitario CHNV | 2023–2025 parole process for Cubans, Haitians, Nicaraguans, Venezuelans (I-134A, airport) |
| CBP One parole | CBP One land-port parole (I-94 "DT") | Parole por cita de CBP One | Jan 2023–Jan 2025 port-of-entry parole after a CBP One appointment |
| Parole | Humanitarian parole | Parole / Permiso de Permanencia Temporal | Discretionary entry under INA 212(d)(5); counts for CAA even after termination |
| I-94 | Arrival/Departure Record | Registro I-94 | Shows class "DT"/"parole" and parole dates (original vs rewritten 2026-04-24) |
| I-134A | Declaration of Financial Support | Declaración de apoyo financiero | Supporter form for CHNV |
| I-485 | Application to Register Permanent Residence or Adjust Status | Solicitud de residencia permanente (ajuste de estatus) | The green-card application |
| I-765 (c)(9) | EAD, pending adjustment | Permiso de trabajo por ajuste pendiente | Work permit while I-485 pending |
| I-765 (c)(11) | EAD, parole | Permiso de trabajo por parole | Tied to parole; revoked 2025-06-12 (CHNV) / 2026-04-24 (CBP One) |
| I-131 | Advance parole / travel document | Permiso de viaje (advance parole) | Travel while pending |
| I-693 | Medical exam | Examen médico | Filed with I-485 |
| I-797C | Receipt notice | Notificación / aviso de recibo | Proof of filing; receipt number |
| ASC / biometrics | Application Support Center | Centro de biométricos / cita de huellas | Fingerprints, photo |
| RFE | Request for Evidence | Solicitud de Evidencia (RFE) | ≤ 12 weeks to respond since 2026-08-05 |
| NOID | Notice of Intent to Deny | Notificación de Intención de Denegar (NOID) | 30 days |
| NTA | Notice to Appear | Notificación de comparecencia | Starts removal proceedings |
| I-220A | Order of Release on Recognizance | Orden de liberación bajo palabra (I-220A) | Not parole; CAA-ineligible |
| EWI | Entry without inspection | Entrada sin inspección | CAA-ineligible |
| LPR | Lawful permanent resident | Residente permanente legal | Green-card holder |
| Rollback | Rollback of residence date | Retroactividad de la fecha de residencia | Up to 30 months earlier |
| CU6 / CU7 | Class of admission codes | Códigos de clase de admisión | Principal / derivative CAA |
| Hold / freeze | Adjudication hold | Congelamiento / pausa de adjudicación | R1 (parolees) and R3 (countries) |
| Hold-and-review | Country hold and re-review | Pausa y re-revisión por país | PM-602-0192/0194 |
| Vacatur | Court vacates a policy | Anulación judicial | Dorcas 2026-06-05 |
| PI / TRO | Preliminary injunction / temporary restraining order | Medida cautelar (orden preliminar) / orden de restricción temporal | Red Eagle 2026-08-24 |
| Class member | Member of a certified class | Miembro de la clase certificada | Red Eagle; Doe v. DHS |
| Discretion | Discretionary adjudication | Discreción (del oficial) | CAA is discretionary by statute; Policy Manual factors apply |
| Processing time (80%) | Time within which 80% of cases completed | Tiempo de procesamiento (80 %) | USCIS tool figure |
| Case-inquiry date | Receipt date for a case inquiry | Fecha de recibo para una consulta de caso | From tool `service_request_date` (~93rd percentile, secondary) |
| e-Request | Case outside normal processing time | Consulta de caso fuera del tiempo normal de procesamiento | Rung a |
| Expedite request | Expedite request / criteria | Solicitud de procesamiento expedito / Criterios para el procesamiento expedito | Rung b: pérdida financiera grave; emergencias y razones humanitarias urgentes; error claro de USCIS |
| Ombudsman | CIS Ombudsman, Form DHS-7001 | Oficina del Ombudsman de Servicios de Ciudadanía e Inmigración; Formulario DHS-7001, Solicitud de Asistencia de Caso | Rung c (near-dormant) |
| Congressional inquiry | Constituent casework; privacy release | Consulta congresional / carta del congresista; formulario de autorización de privacidad | Rung d |
| Mandamus | Writ of mandamus / unreasonable delay | Demanda (recurso) de mandamus / demora irrazonable | Rung e |
| Contact Center | USCIS Contact Center (1-800-375-5283) | Centro de Contacto de USCIS | Spanish: "oprima 2"; virtual assistant Emma |
| Field office | USCIS field office | Oficina local (de campo) de USCIS | Interview location; appointment only, no walk-ins |
| Expedited removal | Expedited removal | Deportación acelerada ("expedited removal") | Exposure for former port-of-entry parolees since 2026-08-11 |
| NBC | National Benefits Center | Centro Nacional de Beneficios | Pre-processing; (c)(9) proxy office |
| Lockbox | USCIS Lockbox | Lockbox (centro de recepción) | Intake |
| Public charge | Public charge ground | Carga pública | CAA exempt |
| Adjudicable days | Days not inside a hold | Días adjudicables | Estimator input (CHNV 306 vs CBP One 392 for the reference filing) |
| Regime | Policy regime (R0–R4) | Régimen de política | Estimator stratum |
| Premium processing | Premium processing (I-907) | Procesamiento prioritario | Not available for I-485 / (c)(9) |
