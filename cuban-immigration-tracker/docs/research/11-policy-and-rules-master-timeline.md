# 11 — Master timeline of policy, rules, fees, court rulings and operational changes affecting Cuban CHNV parolees seeking a green card under the Cuban Adjustment Act (January 2023 – October 20, 2026)

**Project:** Cuban Immigration Tracker (CAA Tracker)
**Research date:** 2026-10-20 (all search results seen on this date)
**Author:** research agent (automated), written for a smart non-lawyer. Not legal advice.
**Builds on:** `01-chnv-parole-program.md`, `02-cuban-adjustment-act.md`, `04-uscis-data-sources.md` (same folder). Events already established there are reused with their original citations; this document adds what they lacked (late-2025 and 2026 developments, fee and EAD rules, the full litigation map) and, above all, turns everything into **one dated sequence with explicit estimator breakpoints**.

---

## 0. How to read this document

### 0.1 Tags on every factual claim

| Tag | Meaning |
|---|---|
| **[S]** | Stated in a web-search result I saw today; the URL is cited in the row and listed in §12. |
| **[S′]** | Stated in a web-search result seen today by one of the earlier research agents (docs 01, 02 or 04) and reused here with its citation; I did not re-see the page. |
| **[F]** | A number read directly from a USCIS data file by the doc-04 agent (its "VERIFIED-FILE" tag); the strongest evidence in this project. |
| **[T]** | From training knowledge; not confirmed by any search today. Treat as "probably right, confirm before relying." |
| **[I]** | Inferred by me from the tagged facts around it. |
| **[S″]** | Stated in a web-search result seen on 2026-10-20 during the editorial pass (§13) — either by the adversarial fact-checker or by the editor's own two searches; the URL is cited in the row. |

Where a secondary source (law-firm blog, Cuban-community outlet) is the only evidence, the row says so. Where sources conflict (e.g., 05-21 vs 05-22 for PM-602-0199), both dates are given.

### 0.2 Environment caveat

The sandbox could not open uscis.gov, dhs.gov, federalregister.gov, court sites or news sites; every fact comes from search-result snippets and search-engine summaries of those pages (30 searches, the per-agent budget). Primary URLs are given so that a later agent or human with normal web access can verify the exact text. An editorial pass on 2026-10-20 (the fact-checker's findings plus two further searches) corrected the date of the EAD final rule, replaced a superseded URL and added the items tagged [S″]; the pass is logged in §13.

### 0.3 What "regime change / breakpoint" means here

A **breakpoint** is a date on which the *rate at which USCIS decides Cuban CAA I-485s* (or the probability of approval, or the meaning of a milestone such as "EAD received") changed abruptly for the whole cohort, so that an estimator fitted to data from before the date must not be used after it without a regime variable. Breakpoints are marked **B** in the tables and collected in §2. Dates that matter to an individual applicant's *status, fees or paperwork* but do not change the adjudication rate are marked **S** (status/paperwork). Everything else is marked **—** (context).

---

## 1. Executive summary — the ten things an estimator must know

1. **There have been three distinct adjudication regimes for this cohort, separated by five hard breakpoints:** (a) the Biden-era "fast lane" until **2025-02-13** (median 3.3–4.6 months, 7,000–13,000 Cuban approvals a month) [F][S′]; (b) the **parolee hold of 2025-02-14 → 2025-06-09** (Davidson memo; lifted by Judge Talwani's 2025-05-28 order and USCIS's 2025-06-09 memo) [S′]; (c) a **post-hold catch-up with "additional vetting" 2025-06-09 → 2025-12-01** (1,600–3,500 approvals/month) [F]; (d) the **Cuba-specific "hold and review" of 2025-12-02 → 2026-06-05/11** (PM-602-0192/0194; 10–41 approvals/month; vacated in *Dorcas*) [F][S]; and (e) the **current "discretion" regime from 2026-05-21/22** (PM-602-0199, then PA-2026-05 on 2026-08-05) in which decisions have resumed at a few hundred a month but **denials exceed approvals** (Jul 2026: 308 approved / 318 denied; Aug 2026: 386 / 434) [F]. The regime list with exact dates is in §2.
2. **The Cuban Adjustment Act itself has not been repealed, amended, suspended or made the subject of any executive order.** No 2025–2026 repeal bill was found; attorneys quoted in the Cuban press in April, May and September 2026 agree the statute stands and that the change is administrative ("dismantle without repealing"). [S] (CiberCuba 2026-04-29, 2026-05-23, 2026-09-04; Casais Law 2026)
3. **CHNV parole is gone for everyone.** Terminated by the 2025-03-25 Federal Register notice, effective 2025-04-24, stayed by Talwani on 2025-04-14, un-stayed by the Supreme Court on 2025-05-30, individual termination notices and (c)(11) EAD revocations sent from 2025-06-12, and the First Circuit held on 2025-09-12 that mass termination was likely lawful. [S′][S] A pending CAA I-485 survived all of this; the (c)(11) work permit did not.
4. **Work-permit rules changed four times in 13 months:** (c)(11) parole EADs revoked 2025-06-12 [S]; H.R.1 surcharge of $550 on new (c)(11)/asylum/TPS EADs from 2025-07-22 (not on the (c)(9) EAD that CAA applicants use) [S]; **no more automatic extension of expiring EADs for renewals filed on or after 2025-10-30** (interim final rule, finalised **without change** by a final rule published in the Federal Register and **effective 2026-10-14**; an extension already triggered by a renewal filed before 2025-10-30 is preserved) [S][S″]; and **maximum (c)(9) EAD validity cut from 5 years to 18 months effective 2025-12-05** [S]. For a March-2025 filer whose (c)(9) card arrived in September 2025, a renewal is due in early 2027 and must be filed ~180 days early.
5. **Fees moved on four dates:** 2024-04-01 (I-485 $1,440 / $950 for a child; (c)(9) I-765 $260 no longer free) [S′]; 2025-07-22 (H.R.1 statutory fees, not waivable: parole $1,000, parolee/asylum/TPS EAD $550 initial / $275 renewal, asylum $100 + $100 a year) [S]; 2026-01-01 (inflation: $560/$280, parole $1,020, asylum $102) [S]; 2026-10-16 (FY2027: $570, parole $1,050, asylum $105) [S]. **None of the H.R.1 fees attaches to the CAA I-485 or the (c)(9) EAD.** No 2026 rule raising the I-485 fee was found. [S]
6. **The litigation map has six live fronts** (§7): *Doe v. Noem* (CHNV merits, D. Mass., renewed summary-judgment motion fully briefed 2025-12-08, no ruling found) [S]; *Dorcas v. USCIS* (D.R.I. vacatur 2026-06-05, final judgment 2026-06-11, stay denied 2026-07-15, **First Circuit 2026-08-14 revived only the "Comprehensive Re-Review" policy pending appeal**, merits undecided) [S]; *Red Eagle Law v. Edlow* (N.D. Cal. class-wide preliminary injunction 2026-08-24; case otherwise stayed 2026-08-28 pending *Dorcas*) [S]; *AAUP v. Mullin* (D. Mass. 1:26-cv-14527, filed 2026-10-05 against PM-602-0199 and PA-2026-05) [S]; *Acosta Reynoso v. USCIS* (M.D. Fla. 8:26-cv-1314, 143 Cuban CAA delay plaintiffs, filed 2026-05-04, order 2026-07-30 of unknown content) [S]; and the I-220A line (*Labrada-Hechavarria*, 11th Cir. 2026-02-23, BIA remand pending) [S′].
7. **Vetting and discretion tightened in five steps that apply to pending CAA cases:** NTA-on-denial memo PM-602-0187 (2025-02-28) [S]; antisemitism/social-media factor (2025-04-09) [S′]; "anti-American ideology, antisemitism, **parole history**, social media" as negative discretionary factors (2025-08-19) [S′]; the Vol. 7 Part A Ch. 10 discretion rewrite (2025-11-27) [S]; PM-602-0199 "adjustment is extraordinary relief" (2026-05-21/22) [S]; and PA-2026-05 allowing denial **without an RFE or NOID** and capping RFE response time at 12 weeks (2026-08-05) [S]. Social-media handles are now collected on the I-485 (OMB approval reported Feb 2026, through 2027-02-28) [S′].
8. **Already-approved Cubans are now exposed too:** Director Edlow ordered a "full-scale, rigorous re-examination of every green card" held by nationals of the 19 Proclamation-10949 countries (Cuba included) on 2025-11-27 [S]; the re-review policy (PA-2025-26) was vacated in *Dorcas* but **revived by the First Circuit on 2026-08-14 pending appeal** [S]. No rescission notices to Cuban LPRs were found in any source. [S]
9. **The other parole cohorts had their own calendars** that an app with Cuban users must not confuse with CHNV: CBP One land-port parolees got termination e-mails on 2025-04-11 ("leave within seven days"), which a D. Mass. class ruling of 2026-03-31 vacated while letting DHS re-terminate properly [S]; Cuban Family Reunification Parole (CFRP) was terminated by notice on 2025-12-15 effective 2026-01-14, with an exception for anyone whose I-485 was on file by 2025-12-15, and Talwani enjoined that termination on 2026-01-24 [S′][S].
10. **The national numbers behind all of this (USCIS monthly file, Cuban I-485 row):** approvals 10,984 (Feb 2025) → 1,647 (Jun 2025) → 3,529 (Sep 2025) → 41 (Dec 2025) → 15 (Jan 2026) → 10 (Feb 2026) → 89 (Jun 2026) → 308 (Jul 2026) → 386 (Aug 2026); pending 207,564 (Feb 2025) → 355,520 (Aug 2026), of which 345,741 (97%) older than six months. [F] The reference case (filed March 2025) has therefore spent roughly **10 of its 19 months inside a hard hold** and the remaining 9 in regimes that cleared a few hundred to a few thousand cases a month against a queue of 300,000+. [I]

---

## 2. The breakpoints an estimator must model

### 2.1 Adjudication regimes for the Cuban CAA I-485 (the primary clock)

| Regime | Start (exact) | End (exact) | Trigger at start | Trigger at end | What the data show | Tag |
|---|---|---|---|---|---|---|
| **R0 "fast lane"** | 2023-01-05 (first CHNV arrivals; CAA filings from Jan 2024) | **2025-02-13** | Biden-era policy of deciding CAA cases centrally at NBC, mostly without interview | Davidson memo | Median 3.3 mo (FY2023), 4.6 (FY2024); 7,000–13,500 approvals/month; denials ~300/month | [F][S′] |
| **R1 "parolee hold"** | **2025-02-14** | **2025-06-09** (legal end 2025-05-28; systems clean-up reported 2025-06-19 and ~06-25) | USCIS memo *Administrative Hold on All USCIS Benefit Requests Filed by Parolees Under U4U, CHNV or FRP* | Talwani "Second Stay Order" (Dkt. 107) + USCIS 2025-06-09 memo authorising adjudication "once … additional vetting" is complete | Approvals 8,065 (Mar) → 5,662 (Apr) → 3,376 (May) → 1,647 (Jun 2025): cases already in the pipeline finished, new ones froze | [S′][F] |
| **R2 "catch-up with extra vetting"** | **2025-06-09** | **2025-12-01** | 2025-06-09 memo | PM-602-0192 | Approvals 2,265 (Jul) → 2,784 → 3,529 (Sep) → 1,954 (Oct) → 2,111 (Nov 2025); (c)(9) EADs issued in this window (the reference case's Sept-2025 EAD); "parole history" negative factor from 2025-08-19 | [F][S′] |
| **R3 "Cuba hold-and-review"** | **2025-12-02** | **2026-06-05** (vacatur) / **2026-06-11** (final judgment; USCIS compliance alert) / operational resumption reported **2026-07-16** | PM-602-0192 (19 countries incl. Cuba), widened 2026-01-01 by PM-602-0194 (39 countries) | *Dorcas Int'l Inst. of R.I. v. USCIS* (D.R.I.) vacatur; *Red Eagle* class injunction 2026-08-24 as belt-and-braces | Approvals 41, 15, 10, 25, 23, 27 (Dec 2025 – May 2026); mean months of the few completions 19–30 | [S′][S][F] |
| **R4 "discretion regime"** (current) | **2026-05-21/22** (overlaps the tail of R3) | open | PM-602-0199 *Adjustment of Status is a Matter of Discretion and Administrative Grace, and an Extraordinary Relief*; sharpened by PA-2026-05 (2026-08-05, deny without RFE) | Possible: *AAUP v. Mullin* injunction; *Dorcas* First Circuit merits; a new USCIS memo | Approvals 89 (Jun) → 308 (Jul) → 386 (Aug 2026); **denials 281 → 318 → 434**; Q3 FY2026 approval share 23.7%; quarterly median of completions 16.3 months | [S][F] |

Sub-breakpoints inside R4 that may matter once enough data exist: **2026-08-05** (PA-2026-05: denials without RFE, so "no RFE" is no longer a good sign), **2026-08-14** (re-review policy revived for already-approved cases), **2026-09-18** (new I-485 edition and public-charge framework for *new* filings only). [S][I]

### 2.2 Status / EAD / fee breakpoints (secondary clocks the app must display)

| Date | Clock | Change | Tag |
|---|---|---|---|
| 2024-04-01 | fees | I-485 $1,440 incl. biometrics ($950 child <14); (c)(9) I-765 $260 instead of free; I-131 $630 | [S′][T] |
| 2025-01-13 | EAD | 540-day automatic extension for timely renewals made permanent (final rule published 2024-12-19) | [S] |
| 2025-03-25 → 2025-04-24 | status | CHNV parole terminated; all remaining paroles to end 2025-04-24 (then stayed 04-14 → 05-30) | [S′] |
| 2025-04-11 | status (CBP One cohort only) | DHS e-mails terminating CBP One parole, "leave within seven days" | [S] |
| 2025-06-12 | status + EAD | Individual CHNV termination notices; (c)(11) EAD "revoked as of the date of this notice"; CBP Home self-deportation with $1,000 stipend | [S] |
| 2025-07-22 | fees | H.R.1 fees in force (parole $1,000; (c)(11)/(c)(8)/TPS EAD $550 initial, $275 renewal; asylum $100 + $100/yr; TPS $500; SIJ $250); not waivable | [S] |
| 2025-10-30 | EAD | No automatic extension for renewal I-765s filed on/after this date (IFR) | [S] |
| 2025-12-05 | EAD | Max validity of (c)(9), refugee, asylee, TPS and other humanitarian EADs cut to 18 months (guidance of 2025-12-04) | [S] |
| 2026-01-01 | fees | FY2026 inflation: EAD $560/$280; parole $1,020; asylum $102 | [S] |
| 2026-01-14 | status (CFRP cohort only) | CFRP parole termination effective (enjoined 2026-01-24) | [S′][S] |
| 2026-09-18 | paperwork | New I-485 edition mandatory, no grace period; 2022 public-charge rule rescinded; CAA applicants remain public-charge-exempt per the 2026-08-18 Policy Manual table | [S][S′] |
| 2026-10-13 (public inspection) / **2026-10-14** (published, 91 FR 65306; **effective the same day**) | EAD | Final rule *Removal of Automatic Extensions for Certain Employment Authorization Documents* (RIN 1615-AD05, USCIS-2025-0271, FR doc. 2026-20955) adopts the 2025-10-30 IFR as final without change; extensions already triggered by renewals filed before 2025-10-30 are preserved | [S″] |
| 2026-10-16 | fees | FY2027 inflation: EAD $570; parole $1,050; asylum annual $105 | [S] |

---

## 3. 2023 — launch of the cohort

| Date | Actor | What happened | Who it affected | Source | Tag | Type |
|---|---|---|---|---|---|---|
| 2023-01-05 | White House / DHS | Announces extension of the Oct-2022 Venezuela parole process to Cuba, Haiti and Nicaragua; 30,000 travel authorisations per month across the four nationalities, parole up to two years, U.S. supporter files Form I-134A, beneficiary flies to a U.S. airport. | Every future CHNV Cuban | AIC fact sheet; Wikipedia (doc 01 S-14, S-15) | [S′]/[T] | — (cohort start) |
| 2023-01-09 | DHS (Federal Register) | *Implementation of a Parole Process for Cubans*, 88 FR 1266, doc. 2023-00252. "The Secretary retains the sole discretion to terminate the Parole Process for Cubans at any point." | Same | https://www.federalregister.gov/documents/2023/01/09/2023-00252/implementation-of-a-parole-process-for-cubans | [S′] | — |
| 2023-04-27/28 | DHS | Notice making Cubans interdicted at sea after 2023-04-27 ineligible for CHNV (FR doc. 2023-09014). | Would-be beneficiaries | https://www.govinfo.gov/content/pkg/FR-2023-04-28/pdf/2023-09014.pdf | [S′] | — |
| 2023-05 | USCIS | Switches I-134A selection to half random / half oldest-first each month. | Supporters in the queue | AIC (doc 01) | [T] | — |
| end Jun 2023 | DHS | "Nearly 160,000" CHNV arrivals in six months, >35,000 Cubans. | Cohort size | U.S. Embassy Venezuela fact sheet (doc 01 S-17) | [S′] | — |
| 2023-07-10 / 2023-08-11 | DHS | Family Reunification Parole notices adopt I-134A; Cuban FRP changes (FR doc. 2023-17376). | CFRP Cubans (a different cohort) | https://www.federalregister.gov/documents/2023/08/11/2023-17376/implementation-of-changes-to-the-cuban-family-reunification-parole-process | [S′] | — |
| Sep 2023 | BIA | *Matter of Cabrera-Fernández*, 28 I&N Dec. 747: release on Form I-220A is not INA 212(d)(5) parole, so it does not satisfy the CAA. | Border-released Cubans, not CHNV parolees | AIC blog (doc 02) | [S′] | — (defines who is *not* in the app's cohort) |
| 2023-11-01 | USCIS | I-693 signed on/after this date valid indefinitely (later narrowed, see 2025-06-11). | All I-485 filers | USCIS alert (doc 02) | [S′] | S |
| FY2023 (Oct 2022–Sep 2023) | USCIS data | National median for completed CAA I-485s: **3.3 months** — the fastest year on record. | Benchmark for R0 | USCIS historic-pt page via CiberCuba 2026-10-06 (doc 02/04) | [S′] | — |

---

## 4. 2024 — the eligibility wave begins; fees and re-parole

| Date | Actor | What happened | Who it affected | Source | Tag | Type |
|---|---|---|---|---|---|---|
| Jan 2024 → | (statutory) | First CHNV Cubans (Jan-2023 arrivals) pass one year of physical presence and can file the CAA I-485; the wave runs through late 2025, peaking in early 2025 (Hialeah humanitarian receipts: 4,146 → 5,796 → 7,709 → 7,254 per quarter FY24Q4–FY25Q3). | Whole cohort | doc 04 §1.3 | [F][I] | — |
| end Feb 2024 | DHS/CIS | ~79,000 Cubans paroled to date. | Cohort size | CIS (doc 01 S-18) | [S′] | — |
| **2024-04-01** | USCIS (fee rule 89 FR 6194) | I-485 **$1,440** (biometrics folded in), **$950** child under 14 with parent; **I-765 (c)(9) $260** (no longer free with the I-485); I-131 $630. | Every CAA filer from this date | doc 02 §3.1 (multiple 2026 fee guides) | [S′]/[T] | S (fee) |
| Jul–late Aug 2024 | DHS | Pause in new advance-travel authorisations after sponsor-fraud review; resumes with added vetting. | Late-2024 arrivals | CBP Oct-2024 update (doc 01 S-11) | [S′]/[T] | — |
| end Sep 2024 | CBP | >531,000 CHNV arrivals; >110,000 Cubans — the Cuban count is essentially flat from here. | Cohort size closed | https://www.cbp.gov/newsroom/national-media-release/cbp-releases-september-2024-monthly-update | [S′] | — |
| 2024-10-04 | USCIS | FAQ: no re-parole *process* for CHNV; parolees should seek TPS, asylum, a visa or a green card or leave at expiry. Shortly after, FAQ revised to say individual re-parole via Form I-131 is "a potential option." | Parolees nearing two years | CLINIC; IRAP (doc 01 S-19, S-24) | [S′] | — |
| 2024-11-20 | House Judiciary (majority) | Report calling CHNV "fraud-ridden." | Political context for 2025 | doc 01 sources | [S′] | — |
| 2024-12-02 | USCIS | Form I-693 must be submitted **with** the I-485. | All I-485 filers | doc 02 §3.1 | [S′] | S |
| 2024-12-19 (published) / **2025-01-13** (effective) | DHS final rule | 540-day automatic extension of expiring EADs on timely renewal made permanent. | (c)(9) and (c)(11) EAD holders | https://www.mintz.com/insights-center/viewpoints/2806/2024-12-19-dhs-publishes-final-rule-authorizing-automatic-ead ; https://www.rnlawgroup.com/dhs-announces-permanent-540-day-automatic-extension-period-for-certain-ead-renewals | [S] | S (EAD) |
| end Dec 2024 | CBP | Final cumulative: **110,240 Cubans** arrived and paroled (110,970 authorised) of 531,690 CHNV. | Cohort size | https://www.cbp.gov/newsroom/national-media-release/cbp-releases-december-2024-monthly-update | [S′] | — |
| FY2024 | USCIS data | CAA median 4.6 months; Apr–Jun 2024 approvals 49,965; monthly Cuban approvals 6,920 (Jul 2024), 13,464 (Sep 2024). | Benchmark | doc 04 §1.1; doc 02 §6 | [F][S′] | — |

---

## 5. 2025 — month by month

### January 2025

| Date | Actor | What happened | Who it affected | Source | Tag | Type |
|---|---|---|---|---|---|---|
| 2025-01-13 | DHS | 540-day EAD auto-extension rule takes effect (see Dec 2024). | EAD holders | as above | [S] | S |
| **2025-01-20** | President | **EO 14165 *Securing Our Borders*** §7(b): terminate categorical parole programs "including … CHNV"; §7(a): stop using CBP One for parole (app's scheduling switched off the same day). **EO 14161** orders enhanced vetting of all applicants (later cited for social-media collection). Cuba re-designated a state sponsor of terrorism the same day. | Whole cohort; CBP One cohort | https://www.presidency.ucsb.edu/documents/executive-order-14165-securing-our-borders ; doc 02 §4.5 | [S′] (EOs) / [T] (SST) | — (announces R1) |
| 2025-01-28 | USCIS | Pauses acceptance of Form I-134A "until we review all categorical parole processes." | New supporters | doc 01 S-26 | [S′] | — |
| Jan 2025 data | USCIS | Cuban I-485: 22,880 received / 10,034 approved / 275 denied / 194,437 pending. | — | doc 04 | [F] | — |

### February 2025

| Date | Actor | What happened | Who it affected | Source | Tag | Type |
|---|---|---|---|---|---|---|
| **2025-02-14** | USCIS (Acting Deputy Director Andrew Davidson) | Memo *Administrative Hold on All USCIS Benefit Requests Filed by Parolees Under U4U, CHNV or FRP*: "immediate USCIS-wide administrative hold on all pending benefit requests filed by aliens who are or were paroled" under those programs, "pending fraud and security vetting"; covers I-485, I-765, I-131, asylum, TPS, re-parole; no end date. Intake continued (receipts issued, fees taken). | **Every Cuban CHNV parolee with any pending filing, including CAA I-485s** | https://www.uscis.gov/sites/default/files/document/foia/AdministrativeHoldonAllUSCISBenefitRequestsFiledbyParoleesUnderU4U_CHNVorFRP.pdf ; mirror https://ukrainetaskforce.org/wp-content/uploads/2025/03/USCIS-Parolee-Benefits-Pause-Memo-February-14-2025.pdf | [S′] | **B — R1 starts** |
| 2025-02-28 | Plaintiffs (JAC, Human Rights First) | *Svitlana Doe v. Noem*, No. 1:25-cv-10495-IT (D. Mass., Judge Talwani) filed as a class action over the parole pauses and the benefit hold. | Whole cohort | https://justiceactioncenter.org/case/svitlana-doe-v-noem/ | [S′]/[T] (date) | — |
| **2025-02-28** | USCIS | **PM-602-0187** *Issuance of Notices to Appear in Cases Involving Inadmissible and Deportable Aliens*: NTA to be issued when a benefit request is denied and the person is not lawfully present; also for criminal history or fraud; withdrawal does not avoid it; effective immediately. Mirrors the June-2018 policy. | Any Cuban whose I-485 is denied after parole ended → immigration court | https://uscis.gov/sites/default/files/document/policy-alerts/NTA_Policy_FINAL_2.28.25_FINAL.pdf ; https://uscis.gov/legal-resources/notice-appear-policy-memorandum ; https://immpolicytracking.org/policies/uscis-releases-policy-memo-on-issuance-of-ntas-in-cases-involving-inadmissible-and-removable-noncitizens/ | [S] | S (consequence of denial) |
| Feb 2025 data | USCIS | 24,385 received / **10,984 approved** / 298 denied / 207,564 pending — the last normal month. | — | doc 04 | [F] | — |

### March 2025

| Date | Actor | What happened | Who it affected | Source | Tag | Type |
|---|---|---|---|---|---|---|
| 2025-03-05 | USCIS (Federal Register) | 60-day notice proposing collection of social-media identifiers on I-485, I-131, N-400 and other forms (FR doc. 2025-03492). | All I-485 filers | https://www.federalregister.gov/documents/2025/03/05/2025-03492/agency-information-collection-activities-new-collection-generic-clearance-for-the-collection-of | [S′] | — |
| 2025-03-21 (announced) / **2025-03-25** (published) | DHS (Federal Register) | ***Termination of Parole Processes for Cubans, Haitians, Nicaraguans, and Venezuelans***, **90 FR 13611, doc. 2025-05128**: programs terminated; "parole periods not already expired by April 24, 2025 will terminate on that date unless the Secretary makes an individual determination to the contrary"; parole-based EADs end with parole; pending I-134A/ATA cancelled; parolees "without a lawful basis to remain" told to depart via CBP Home. | Every Cuban still holding CHNV parole (arrivals from ~May 2023 on); earlier arrivals' parole had already expired | https://www.federalregister.gov/documents/2025/03/25/2025-05128/termination-of-parole-processes-for-cubans-haitians-nicaraguans-and-venezuelans ; https://www.govinfo.gov/content/pkg/FR-2025-03-25/pdf/2025-05128.pdf ; Telemundo 51 https://www.telemundo51.com/noticias/local/hacen-oficial-el-fin-del-parole-humanitario-para-cubanos-venezolanos-haitianos-y-nicaraguenses/2642089/ | [S′] | **S (status) — the "parole ended" milestone** |
| 2025-03 (reference case) | — | The project owner's relative files the CAA I-485 + (c)(9) I-765 **into the Davidson hold**. | Reference case | README | [I] | — |
| 2025-03-28 | CEDA | Reports detentions of Cubans and some CAA applications "on hold." | — | https://www.weareceda.org/en/us-cuba-news-brief/march-28-2025 | [S′] | — |
| Mar 2025 data | USCIS | 26,187 received / 8,065 approved / 302 denied / 225,208 pending. USCIS footnote: termination notices "reverted previously approved (c)(11) EADs to a pending status" in March, then back to approved after the April stay — the I-765 line for Mar–Apr 2025 is distorted. | — | doc 04 §1.1 | [F] | — |

### April 2025

| Date | Actor | What happened | Who it affected | Source | Tag | Type |
|---|---|---|---|---|---|---|
| 2025-04-07/08 → **2025-04-11** | DHS | Parole-termination e-mails to people paroled at CBP One appointments (up to ~936,000–985,000 notices): parole ends, "leave within seven days," use CBP Home. **Separate from CHNV.** | CBP One ("DT") Cubans — a different cohort the app must distinguish | https://immpolicytracking.org/policies/reported-dhs-sends-parole-termination-and-self-deportation-notices-to-people-paroled-at-cbp-one-appointments/ ; https://www.kaxe.org/news/2025-04-08/migrants-who-entered-the-u-s-via-cbp-one-app-should-leave-immediately-dhs-says ; https://natlawreview.com/node/298082/printable/print | [S] | S (CBP One cohort) |
| 2025-04-09 | DHS/USCIS | Antisemitism policy: social-media content supporting designated terrorist organisations is a negative discretionary factor. | All applicants | Boundless (doc 02) | [S′] | — |
| **2025-04-14** | D. Mass. (Talwani) | Dkt. 97: stays the FRN "insofar as it revokes, without case-by-case review, the previously granted parole and work authorization" of CHNV parolees and stays the myUSCIS termination notices; **class certified** (all CHNV parole grantees). | Whole cohort | https://docs.justia.com/cases/federal/district-courts/massachusetts/madce/1:2025cv10495/281389/97 ; https://justiceactioncenter.org/wp-content/uploads/2025/04/0097-Order-Granting-Stay-of-CHNV-Revocations.pdf | [S′] | S (parole kept alive ~6 weeks) |
| 2025-04-17 | USCIS | Litigation update: termination notices stayed, not in effect; no new CHNV requests processed. | — | https://www.aila.org/library/uscis-provides-litigation-related-update-on-chnv | [S′] | — |
| 2025-04-24 | (scheduled) | Original parole end date — did not bite because of the stay. | — | FRN | [S′] | — |
| Apr 2025 data | USCIS | 27,173 received (the peak filing month) / 5,662 approved / 282 denied / 246,689 pending. | — | doc 04 | [F] | — |

### May 2025

| Date | Actor | What happened | Who it affected | Source | Tag | Type |
|---|---|---|---|---|---|---|
| 2025-05-05 | 1st Cir. | Denies the government a stay pending appeal of the April 14 order. | — | JAC tracker | [S′] | — |
| 2025-05-08 | Solicitor General | Application for a stay to the Supreme Court, No. 24A1079. | — | https://www.supremecourt.gov/DocketPDF/24/24A1079/358354/20250508121118618_Kristi_Noem_v_Svitlana_Doe_et_al_%20application_stay.pdf | [S′] | — |
| 2025-05-15 | BIA | *Matter of Q. Li*: anyone detained on arrival is under INA 235(b) and can only be released by 212(d)(5) parole — fuel for the I-220A litigation. | I-220A Cubans | CLINIC (doc 02) | [S′] | — |
| **2025-05-28** | D. Mass. (Talwani) | Dkt. 107 "Second Stay Order": stays the 2025-02-14 memo "insofar as it suspended adjudications" of re-parole, military parole in place and **benefit requests of U4U/FRP/CHNV parolees**; rejects case-by-case release; compliance report due 2025-06-09. Never overturned; the government dropped its appeal on 2025-11-04. | **Every pending Cuban CAA I-485/I-765 filed by a CHNV parolee** | https://justiceactioncenter.org/wp-content/uploads/2025/05/107-Second-Stay-Order.pdf ; CBS https://www.cbsnews.com/news/judge-indira-talwani-directs-trump-officials-lift-pause-certain-immigration-applications/ | [S′] | **B — legal end of R1** |
| **2025-05-30** | Supreme Court | *Noem v. Doe*, No. 24A1079: stays the April 14 order (Jackson, joined by Sotomayor, dissenting). Mass termination of CHNV parole may proceed. | Whole cohort's *status* (not their pending cases) | https://www.supremecourt.gov/opinions/24pdf/24a1079_p86b.pdf | [S′] | S |
| May 2025 data | USCIS | 23,881 received / 3,376 approved / 226 denied / 267,090 pending. | — | doc 04 | [F] | — |

### June 2025

| Date | Actor | What happened | Who it affected | Source | Tag | Type |
|---|---|---|---|---|---|---|
| **2025-06-04** (effective 06-09) | President | **Proclamation 10949**: full entry suspension for 12 countries; partial (B-1/B-2, F, M, J, immigrant visas) for 7 **including Cuba**. The ban governs *entry*, not adjustment — but it defines the "high-risk" list USCIS later used for the December hold. | All Cuban nationals | doc 01 S-68/69; https://www.fredlaw.com/alert-alert-uscis-announces-immediate-hold-on-asylum-applications-and-immigration-benefits-for-foreign-nationals-of-19-high-risk-countries | [S′] | — (sets up R3) |
| 2025-06-06 | USCIS | Alert: after the Supreme Court stay DHS may terminate CHNV parole and revoke parole-based EADs; affected people will be notified via myUSCIS. | — | https://www.uscis.gov/newsroom/alerts/litigation-related-update-supreme-court-stay-of-chnv-preliminary-injunction | [S′] | — |
| **2025-06-09** | USCIS | Memo authorising officers to adjudicate pending benefit requests of those "who are or were paroled" under U4U/CHNV/FRP "to a final agency action once USCIS has completed the additional vetting requirement"; initial-parole and I-134A requests stay on hold. Secondary reports: holds cleared in systems by 06-19, stragglers ~06-25; 8,855 cases processed by late June. | Same | Littler https://www.littler.com/news-analysis/asap/uscis-lifts-administrative-pause-immigration-applications-filed-uniting-ukraine ; Hacking Law https://hackinglawpractice.com/uscis-resumes-u4u-application-processing-after-lawsuit-forces-action/ ; Migrant Insider (doc 02) | [S′] | **B — R2 starts (operational)** |
| 2025-06-11 | USCIS | I-693 signed on/after 2023-11-01 valid **only while the application it was filed with is pending**; a denied or withdrawn I-485 means a new exam. | All I-485 filers | https://www.uscis.gov/newsroom/alerts/uscis-changes-validity-period-for-any-form-i-693-signed-on-or-after-nov-1-2023 | [S′] | S |
| **2025-06-12** | DHS | Press release *DHS Issues Notices of Termination for the CHNV Parole Program, Encourages Parolees to Self-Deport Immediately*; e-mails to ~530,000 parolees: parole terminated and parole-based EAD "revoked as of the date of this notice"; CBP Home with travel assistance and a $1,000 stipend. No guidance on pending I-485s (a pending CAA case is unaffected in law; the (c)(11) card is not). | Every Cuban who still had CHNV parole; their (c)(11) cards | https://www.dhs.gov/news/2025/06/12/dhs-issues-notices-termination-chnv-parole-program-encourages-parolees-self-deport ; Littler https://www.littler.com/news-analysis/asap/dhs-issues-notices-termination-chnv-parole-program ; Univision Miami https://www.univision.com/local/miami-wltv/fin-parole-humanitario-que-pasa-aplicaron-otro-tramite-migratorio-ee-uu | [S] | **S — the "parole termination notice" milestone** |
| 2025-06-16 | Plaintiffs | Partial summary-judgment motion on mass truncation of CHNV parole. | — | JAC tracker | [S′] | — |
| 2025-06-20 | USCIS / BIA | E-Verify "Status Change Report" for revoked EADs; *Matter of Roque-Izada*, 29 I&N Dec. 106 (IJ may not terminate proceedings so a Cuban can seek parole and adjust). | Employers; I-220A Cubans | https://www.littler.com/news-analysis/asap/update-e-verify-issuing-notices-termination-chnv-parole-program ; CLINIC (doc 02) | [S′][S] | — |
| Jun 2025 data | USCIS | 21,510 received / **1,647 approved** (trough) / 277 denied / 286,309 pending. | — | doc 04 | [F] | — |

### July 2025

| Date | Actor | What happened | Who it affected | Source | Tag | Type |
|---|---|---|---|---|---|---|
| 2025-07-04 | Congress / President | **H.R.1 (Pub. L. 119-21)** enacted with new statutory immigration fees. | See 07-22 | doc 02 §3.2 | [S′] | — |
| **2025-07-22** | USCIS (FR doc. 2025-13738) | H.R.1 fees in force for filings postmarked on/after this date: **parole $1,000**; **initial EAD for (c)(11) parolees, (c)(8) asylum applicants and TPS $550, renewal $275**; I-589 $100 + $100 annual asylum fee; TPS I-821 $500; SIJ I-360 $250. "Not eligible for fee waivers"; "in addition to existing USCIS fees." **Not charged on the I-485 or the (c)(9) EAD.** | CHNV Cubans who had not yet filed the I-485 and needed a (c)(11) card; anyone seeking re-parole | https://www.federalregister.gov/documents/2025/07/22/2025-13738/uscis-immigration-fees-required-by-hr-1-reconciliation-bill ; https://eiglaw.com/uscis-implements-new-immigration-fees-under-h-r-1-starting-july-22-2025/ ; https://www.cliniclegal.org/file-download/download/public/78947 | [S] | S (fee) |
| late Jul 2025 | DOJ | Appeals the May 28 order "on the last possible day." | — | JAC tracker | [S′] | — |
| Jul 2025 data | USCIS | 19,354 received / 2,265 approved / 207 denied / 302,775 pending. | — | doc 04 | [F] | — |

### August 2025

| Date | Actor | What happened | Who it affected | Source | Tag | Type |
|---|---|---|---|---|---|---|
| **2025-08-01** | D.D.C. (Judge Jia Cobb) | *Coalition for Humane Immigrant Rights v. Noem*, No. 25-cv-00872: stays DHS's use of **expedited removal against people paroled at ports of entry** (CBP One, CHNV, U4U, OAW) — the January DHS memo, the February ICE directive and the March CHNV termination insofar as they enabled it; policy "likely violates the expedited removal statute" and is "arbitrary and capricious." Government said it would appeal; later status not found. | Former CHNV/CBP One Cubans facing ICE arrest while their I-485 is pending | https://www.washingtontimes.com/news/2025/aug/1/judge-says-dhs-cant-use-fast-deportation-biden-parole-migrants/ ; https://www.news4jax.com/news/politics/2025/08/01/judge-pauses-trump-administrations-push-to-expand-fast-track-deportations/ ; https://forumtogether.org/article/legislative-bulletin-thursday-august-7-2025/ | [S] | — (exposure, not adjudication) |
| **2025-08-19** | USCIS (Policy Manual Vol. 1; alert 20250819-DiscretionaryFactors.pdf) | "Anti-American" ideology, antisemitic activity, social-media content **and parole history** listed as negative discretionary factors for adjustment, EADs and other benefits; effective immediately for pending and new filings. | All pending Cuban CAA I-485s (every CHNV Cuban has "parole history") | https://www.uscis.gov/sites/default/files/document/policy-manual-updates/20250819-DiscretionaryFactors.pdf ; Fragomen https://www.fragomen.com/insights/united-states-uscis-to-consider-a-foreign-nationals-support-for-ideologies-and-organizations-viewed-as-anti-american-when-adjudicating-certain-immigration-benefit-requests.html | [S′] | — (discretion, inside R2) |
| Aug 2025 data | USCIS | 13,748 received / 2,784 approved / 190 denied / 312,913 pending. | — | doc 04 | [F] | — |

### September 2025

| Date | Actor | What happened | Who it affected | Source | Tag | Type |
|---|---|---|---|---|---|---|
| 2025-09 (reference case) | — | The relative's (c)(9) EAD arrives, ~6 months after filing — inside R2, as predicted by the regime model. People who filed at the same time but whose I-765 was still pending on 2025-12-02 fell into R3 and waited until mid-2026. | Reference case | README; doc 01 §9 | [I] | — |
| **2025-09-12** | 1st Cir. (No. 25-1384; Gelpí, Kayatta, Montecalvo) | Vacates the April 14 order: the INA's case-by-case requirement "applies to granting parole, not to its termination"; DHS's explanation not arbitrary. No practical change because the Supreme Court stay was already in force. The May 28 benefits order is untouched. | Cohort's *status* | https://law.justia.com/cases/federal/appellate-courts/ca1/25-1384/25-1384-2025-09-12.html | [S′] | — |
| 2025-09-16 | USCIS (FR doc. 2025-17816) | 30-day notice on social-media identifier collection (docket USCIS-2025-0003), citing EO 14161. | All I-485 filers | https://regulations.justia.com/regulations/fedreg/2025/09/16/2025-17816.html | [S′] | — |
| 2025-09-18 | CRS | *Immigration Parole* (R46570) updated: OHSS counted 532,110 CHNV parole grants Oct 2022–Nov 2024. | — | https://www.congress.gov/crs-product/R46570 | [S′] | — |
| Sep 2025 data | USCIS | 11,152 received / **3,529 approved** (R2 peak) / 215 denied / 318,763 pending. FY2025 CAA median: **7.0 months**. | — | doc 04; doc 02 | [F][S′] | — |

### October 2025

| Date | Actor | What happened | Who it affected | Source | Tag | Type |
|---|---|---|---|---|---|---|
| **2025-10-30** | DHS (interim final rule) | **Ends automatic extension of EADs** for renewal I-765s filed on/after 2025-10-30 (except where a statute or FR notice, e.g. a TPS notice, provides one); issued without notice-and-comment on "good cause"/national-security grounds; 30-day comment period. Previously up to 540 days. USCIS advises filing renewals 180 days early. | Every (c)(9) EAD holder in the cohort when the card comes up for renewal | https://www.faegredrinker.com/en/insights/publications/2025/10/dhs-issues-interim-final-rule-on-removal-of-the-automatic-extension-of-employment-authorization-documents ; https://eiglaw.com/dhs-ends-automatic-extension-of-employment-authorization-documents-eads/ ; https://www.mondaq.com/unitedstates/general-immigration/1698994/dhs-ends-automatic-extension-of-employment-authorization | [S] | S (EAD) |
| Oct 2025 data | USCIS | 9,059 received / 1,954 approved / 186 denied / 323,471 pending; FY2026 begins. | — | doc 04 | [F] | — |

### November 2025

| Date | Actor | What happened | Who it affected | Source | Tag | Type |
|---|---|---|---|---|---|---|
| 2025-11-04 | DOJ / 1st Cir. | Government **voluntarily dismisses** its appeal of the May 28 benefits order — that relief is final. | Cohort's pending cases | https://litigationtracker.justiceactioncenter.org/cases/svitlana-doe-v-noem-humanitarian-parole-district-court | [S′] | — |
| 2025-11-10 → 2025-12-08 | D. Mass. | Plaintiffs' renewed motion for partial summary judgment on CHNV termination (statutory authority, due process); opposition 11-25; reply 12-08. **No ruling found as of 2026-10-20.** | Cohort's status (a win would not restore parole retroactively in any obvious way) | same JAC tracker | [S] | — (watch) |
| 2025-11-21 | USCIS (FR doc. 2025-20622) | FY2026 inflation adjustment of H.R.1 fees from 2026-01-01: EAD $560/$280; parole $1,020; asylum $102. | As 07-22 | https://www.federalregister.gov/documents/2025/11/21/2025-20622/inflation-adjustment-to-hr-1-immigration-fees | [S′][S] | S (fee) |
| **2025-11-27** | USCIS (Policy Manual Vol. 7 Part A Ch. 10; alert 20251127-Discretion.pdf) | Rewrites discretionary analysis for adjustment: non-exhaustive positive/negative factors (family ties, status history, employment, "community standing and moral character") and a list of LPR "privileges, rights and responsibilities" officers weigh; Ch. 10 lists the CAA among discretionary categories. | All pending CAA I-485s | https://www.uscis.gov/sites/default/files/document/policy-manual-updates/20251127-Discretion.pdf ; https://visaserve.com/uscis-updates-policy-guidance-regarding-discretionary-factors-for-adjustment-of-status-applications-2/ ; https://berardiimmigrationlaw.com/uscis-adopts-discretionary-rules-for-adjustment-of-status-applications/ | [S] (secondary) | — (discretion) |
| **2025-11-27** (Thu) | USCIS Director Joseph Edlow (post on X) | Orders "a full-scale, rigorous re-examination of every Green Card for every alien from every country of concern" — the 19 Proclamation-10949 countries, **Cuba included** — after the shooting of National Guard members in Washington on 11-26. | **Cubans already holding CAA green cards** (incl. CHNV Cubans approved in 2024–25) | https://www.axios.com/2025/11/27/trump-green-card-review-dc-shooting ; https://wtop.com/government/2025/11/us-will-reexamine-all-green-cards-issued-to-people-from-19-countries-as-trump-administration-ramps-up-immigration-crackdown/ ; Directorio Cubano https://www.directoriocubano.info/estados-unidos/gobierno-de-estados-unidos-sometera-a-revision-los-permisos-de-residencia-a-cubanos-con-green-card/ | [S] | — (announces the re-review policy) |
| 2025-11-28 (Fri) | USCIS (Edlow) | Halts **all asylum decisions** "until applicants can be vetted to the maximum degree possible"; all Afghan requests paused. | Cubans with pending I-589s (not the CAA) | https://manifestlaw.com/blog/immigration/news/uscis-immigration-changes-dc-shooting/ | [S] | — |
| Nov 2025 data | USCIS | 7,265 received / 2,111 approved / 175 denied / 327,987 pending. FY2026 Q1 (Oct–Dec) Cuban row: 24,909 received / 4,098 approved / 373 denied / median 10.4 months. | — | doc 04 | [F] | — |

### December 2025

| Date | Actor | What happened | Who it affected | Source | Tag | Type |
|---|---|---|---|---|---|---|
| **2025-12-02** | USCIS | **PM-602-0192** *Hold and Review of all Pending Asylum Applications and all USCIS Benefit Applications Filed by Aliens from High-Risk Countries*: hold on **all pending benefit requests** (I-485, I-765, I-131, I-90, N-400 …) of nationals of — or persons born in — the 19 PP-10949 countries **including Cuba**, regardless of entry date, "pending re-review"; plus a "comprehensive re-review" of benefits already approved for those who entered on/after 2021-01-20 (later identified as PA-2025-26). None of the proclamation's exceptions carried over. | **Every pending Cuban CAA I-485 and (c)(9) I-765; every CHNV Cuban already approved** | https://www.uscis.gov/sites/default/files/document/policy-alerts/PM-602-0192-PendingApplicationsHighRiskCountries-20251202.pdf ; https://www.aila.org/library/uscis-pm-halts-all-asylum-applications-and-all-benefit-applications-from-high-risk-countries ; Ogletree https://ogletree.com/insights-resources/blog-posts/uscis-broadens-scope-of-adjudication-hold-for-pending-benefit-requests-of-certain-foreign-nationals/ | [S′] | **B — R3 starts** |
| 2025-12-03 | Cuban/LatAm press | La Nación: "neither Adjustment Act nor green card — the bad news leaving Cubans in limbo"; Directorio Cubano: "government pauses approvals." | — | https://www.lanacion.com.ar/estados-unidos/migraciones/ni-ley-de-ajuste-ni-green-card-la-mala-noticia-que-deja-en-un-limbo-migratorio-a-los-cubanos-en-eeuu-nid03122025/ ; https://www.directoriocubano.info/?p=137891 | [S′][S] | — |
| **2025-12-04** (guidance) / **2025-12-05** (effective) | USCIS | **Maximum EAD validity cut from 5 years to 18 months** for (c)(9) pending-adjustment applicants, refugees, asylees, TPS and other humanitarian categories, for I-765s filed or pending on/after 12-05 (initial and renewal). | Every (c)(9) card the cohort receives from this date; combined with 10-30 it means a renewal every ≤18 months with no bridge | https://www.hsfkramer.com/insights/2025-12/employment-authorization-documents-validity-period-reduced-for-certain-categories ; https://webiis08.mondaq.com/unitedstates/general-immigration/1717754/ead-validity-period-reduced-for-certain-categories | [S] | S (EAD) |
| **2025-12-15** | DHS (FR doc. 2025-22744) / USCIS alert | Terminates the **Family Reunification Parole** processes (Colombia, **Cuba**, Ecuador, Guatemala, Haiti, Honduras, El Salvador); paroles end **2026-01-14** *except* for anyone with an I-485 "postmarked or electronically filed as of December 15, 2025 that is still pending." | CFRP Cubans (a third cohort) | https://www.federalregister.gov/documents/2025/12/15/2025-22744/termination-of-family-reunification-parole-processes-for-colombians-cubans-ecuadorians-guatemalans ; https://www.uscis.gov/newsroom/alerts/dhs-ends-the-abuse-of-the-humanitarian-parole-process-and-terminates-family-reunification-parole ; JAC decoder https://justiceactioncenter.org/news/frn-decoder-frptermination/ | [S′][S] | S (CFRP cohort) |
| **2025-12-16** (effective 2026-01-01) | President | **Proclamation 10998** expands the travel ban to 39 countries (7 more full bans; Cuba stays on the *partial* list). | Cuban nationals abroad; defines the 39-country list for PM-602-0194 | https://www.presidency.ucsb.edu/documents/proclamation-10998-restricting-and-limiting-the-entry-foreign-nationals-protect-the ; https://www.hsfkramer.com/insights/2025-12/travel-ban-expanding-to-cover-39-countries | [S′][S] | — |
| Dec 2025 data | USCIS | 8,598 received / **41 approved** / 14 denied / 336,589 pending; mean months of completions 19.4. | — | doc 04 | [F] | — |

---

## 6. 2026 — month by month

### January 2026

| Date | Actor | What happened | Who it affected | Source | Tag | Type |
|---|---|---|---|---|---|---|
| **2026-01-01** | USCIS | **PM-602-0194** extends the hold-and-review to all 39 PP-10998 countries; **PA-2025-26** formalises the comprehensive re-review of approved benefits; FY2026 H.R.1 fee amounts take effect. | Cuba already covered; re-review now a written policy | AIC https://www.americanimmigrationcouncil.org/blog/court-blocks-uscis-immigration-pause-39-countries/ ; UC Berkeley https://internationaloffice.berkeley.edu/news/hold-and-review-uscis-benefit-applications-filed-aliens-additional-high-risk-countries ; https://uscis-pause-tracker.com/cases/f9143399-ca53-41e2-8a65-c44e9174f6a3 | [S′][S] | — (R3 widened) |
| 2026-01-10 / **2026-01-24** | D. Mass. (Talwani) | 14-day TRO, then preliminary injunction/stay blocking the FRP termination nationwide. | CFRP Cubans | https://justiceactioncenter.org/case/svitlana-doe-v-noem/ | [S] | S (CFRP cohort) |
| Jan 2026 | Cuban press | Reports of "suspension of all Cuban immigration processes" (naturalisation, residency, asylum). | — | doc 01 S-77 | [S′] | — |
| Jan 2026 data | USCIS | 7,086 received / **15 approved** / 4 denied / 343,656 pending; mean months 27.8. (Cato/Factchequeado later cite exactly these numbers.) | — | doc 04; https://chequeado.com/el-explicador/durante-el-gobierno-de-trump-se-redujeron-las-aprobaciones-de-green-cards-para-cubanos-en-estados-unidos-en-casi-100-mientras-los-arrestos-de-ice-aumentan/ | [F][S] | — |

### February 2026

| Date | Actor | What happened | Who it affected | Source | Tag | Type |
|---|---|---|---|---|---|---|
| Feb 2026 | OMB (reported) | Approves social-media identifier collection on I-485/I-131/N-400 etc. through 2027-02-28. | All I-485 filers | immpolicytracking.org (doc 02; single source) | [S′] | S (paperwork) |
| 2026-02-01 | Brown Univ. ISSS | Summary of the hold as applied in practice (used by doc 01). | — | https://isss.brown.edu/news/2026-02-01/uscis-processing-hold | [S′] | — |
| **2026-02-23** | 11th Cir. | *Labrada-Hechavarria v. U.S. Att'y Gen.*, Nos. 23-13664 & 24-10645: vacates and remands BIA decisions that relied on *Cabrera-Fernández*; does **not** hold that I-220A is parole. | I-220A Cubans | Prada & Domínguez; CiberCuba 2026-02-24 https://en.cibercuba.com/noticias/2026-02-24-u1-e129488-s27061-nid321559-corte-eeuu-toma-decision-cubanos-220a-litigio | [S′] | — |
| Feb 2026 data | USCIS / press | 4,813 received / **10 approved** / 21 denied / 348,318 pending ("more than 348,000 Cubans wait … only 10 approved in February"). | — | doc 04; https://www.directoriocubano.info/?p=143727 | [F][S] | — |

### March 2026

| Date | Actor | What happened | Who it affected | Source | Tag | Type |
|---|---|---|---|---|---|---|
| 2026-03-01 | USCIS | Premium-processing (I-907) inflation increase — not available for I-485; context only. | — | https://www.colorado.edu/isss/2026/01/20/uscis-announces-inflation-adjustment-premium-processing-fees | [S] | — |
| Mar 2026 | Plaintiffs (Miami) | Class action asking whether I-220A release counts as parole under the CAA. | I-220A Cubans | https://hoodline.com/2026/03/miami-cubans-sue-feds-over-green-card-limbo/ | [S] | — |
| **2026-03-31** | D. Mass. (*Doe v. DHS*, CBP One class) | Finds DHS did not follow the required process for the April-2025 CBP One parole terminations; class members' terminations vacated, but DHS may "correct errors and re-terminate." | CBP One Cubans (not CHNV) | https://www.cliniclegal.org/resources/federal-court-reinstates-cbp-one-paroles-narrow-class-allows-dhs-correct-errors-and-re | [S] | S (CBP One cohort) |
| Mar 2026 data | USCIS | 3,439 received / 25 approved / 21 denied / 351,423 pending. FY2026 Q2 Cuban row: 15,312 / 50 / 45 / median 19.5. | — | doc 04 | [F] | — |

### April 2026

| Date | Actor | What happened | Who it affected | Source | Tag | Type |
|---|---|---|---|---|---|---|
| **2026-04-24** (reported 04-27/28) | D. Md. (Judge George L. Russell III) | Holds the indefinite suspension of green-card processing likely arbitrary and capricious under the APA; orders USCIS to resume processing for **83 named plaintiffs** from the designated countries (Cubans among them). Relief limited to the plaintiffs. | 83 plaintiffs; precedent signal | Law360 https://www.law360.co.uk/articles/2470157 ; Manifest Law https://manifestlaw.com/news/judge-orders-uscis-process-green-cards-04-28-2026 ; CubaHeadlines https://www.cubaheadlines.com/articles/327617 | [S] | — |
| 2026-04-28 | Cato Institute / WLRN | Study: Cubans face "concerted targeting" — approvals fell from 10,984 (Feb 2025) to 15 (Jan 2026); ICE arrests of Cubans up 463% (Oct 2024 → Jan 2026). | — | https://www.wlrn.org/light/immigration/2026-04-28/cubans-immigration-arrests-green-card-rejections | [S] | — |
| 2026-04-29 | CiberCuba / Infobae | Attorney Q&A "Will the CAA come to an end?" — no; approvals down ~99%. | — | https://en.cibercuba.com/noticias/2026-04-29-u1-e199894-s27061-nid327622-acabara-ley-ajuste-cubano-abogada-responde-dudas ; https://www.infobae.com/estados-unidos/2026/04/29/cubanos-residentes-en-estados-unidos-se-registra-una-reduccion-cercana-al-99-en-las-aprobaciones-de-permisos/ | [S] | — |
| Apr 2026 data | USCIS | 2,665 received / 23 approved / 38 denied / 353,450 pending. | — | doc 04 | [F] | — |

### May 2026

| Date | Actor | What happened | Who it affected | Source | Tag | Type |
|---|---|---|---|---|---|---|
| **2026-05-04** | 143 Cuban plaintiffs | ***Acosta Reynoso v. USCIS***, No. 8:26-cv-1314 (M.D. Fla., Tampa): challenge to delays on their CAA I-485s (and some I-765s). Court order dated 2026-07-30 exists; content not found. | Delay litigation template for the cohort | https://www.leagle.com/decision/infdco20260731b45 ; https://www.periodicocubano.com/cubanos-demandan-a-uscis-por-hacerlos-esperar-anos-para-la-residencia-bajo-la-ley-de-ajuste/ | [S] | — (watch) |
| 2026-05-07 | DHS (NPRM) | Proposes raising the Form I-246 stay-of-removal fee $155 → $755 (comments to 07-06). Not an I-485 fee. | Only those in removal | https://immpolicytracking.org/policies/dhs-proposes-rule-raising-fees-on-application-for-a-stay-of-deportation-or-removal/ | [S] | — |
| 2026-05-18 | USCIS (reported) | Rule requiring attorneys to appear in person at field-office interviews — **single secondary source; not confirmed today** (no result mentions it). | — | doc 02 §4.2 | [S′] (weak) | — |
| **2026-05-21 / 2026-05-22** | USCIS | **PM-602-0199** *Adjustment of Status is a Matter of Discretion and Administrative Grace, and an Extraordinary Relief*: consular processing is the default; adjustment inside the U.S. only in extraordinary circumstances; factors include status maintenance, unauthorised work, overstays, preconceived intent; exceptions recognised for dual-intent classes and categories where adjustment is the only route. Attorneys (Olmedo on Univision; CiberCuba 05-23) argue the CAA — its own statute, with no consular alternative in Havana — is outside it; USCIS has issued no CAA-specific guidance. Interview questions changed; some field offices reportedly stopped asking memo questions by 06-10 (single secondary source, Factchequeado; not re-confirmed). The memo PDF on uscis.gov is file-dated 2026-05-21; CLINIC's field alert is dated 05-22 — which explains the two dates in circulation. | All pending CAA I-485s in practice (denial rate rose after it) | Memo https://www.uscis.gov/sites/default/files/document/memos/PM-602-0199-AdjustmentOfStatusAndDiscretion-20260521.pdf ; https://www.uscis.gov/laws-and-policy/policy-memoranda ; AILA featured issue https://www.aila.org/library/featured-issue-new-policy-on-adjustment-of-status-as-act-of-extraordinary-discretion ; CLINIC field alert https://www.cliniclegal.org/resources/clinic-field-alert-informational-uscis-policy-memorandum-adjustment-status-052226 ; Vialto https://vialtopartners.com/regional-alerts/united-states-immigration-uscis-adjustment-of-status-policies-face-legal-challenge ; CMU summary https://www.cmu.edu/oie/news-and-events/2025-2026/may/adjustment-status-policy.html | [S][S′][S″] | **B — R4 starts** |
| 2026-05-23 | CiberCuba | "Could the U.S. dismantle the CAA without repealing it?" — the operative framing for 2026. | — | https://en.cibercuba.com/noticias/2026-05-23-u1-e199370-s27061-nid330127-eeuu-podria-desmantelar-ley-ajuste-cubano-derogarla | [S] | — |
| May 2026 data | USCIS | 1,846 received / 27 approved / **129 denied** / 354,649 pending — denials start to climb before approvals do. | — | doc 04 | [F] | — |

### June 2026

| Date | Actor | What happened | Who it affected | Source | Tag | Type |
|---|---|---|---|---|---|---|
| **2026-06-05** | D.R.I. (Chief Judge John J. McConnell Jr.) | ***Dorcas International Institute of Rhode Island v. USCIS***, No. 1:26-cv-00132: the Benefits Hold Policy (PM-602-0192/0194), Global Asylum Hold Policy, Comprehensive Re-Review Policy (PA-2025-26) and Country-Specific Factors Policy violate the APA and exceed USCIS's authority; **vacated** (set aside nationally), not merely enjoined. | Every pending Cuban I-485/I-765; every approved Cuban under re-review | Cyrus Mehta https://blog.cyrusmehta.com/2026/06/dorcas-v-uscis-federal-court-reaffirms-that-uscis-must-adjudicate-not-stonewall-immigration-benefits.html ; BAL https://www.bal.com/immigration-news/united-states-federal-court-rules-uscis-adjudication-hold-policies-unlawful/ ; Manifest Law https://manifestlaw.com/news/district-court-vacates-uscis-policies-06-08-2026 ; PacerMonitor https://www.pacermonitor.com/public/case/63431021/Dorcas_International_Institute_of_Rhode_Island_et_al_v_United_States_Citizenship_and_Immigration_Services_et_al | [S] | **B — legal end of R3** |
| 2026-06-10 | Factchequeado / tracker | Explainer on "country-specific negative factor"; some field offices reported to have stopped asking PM-602-0199 questions. | — | https://factchequeado.com/teexplicamos/20260610/uscis-factor-negativo-paises-travel-ban/ | [S′] | — |
| **2026-06-11** | D.R.I. | Clarifying order; **partial final judgment under Rule 54(b)** on the APA claims; order to "immediately comply." USCIS posts *Court Order on Hold Policies*: will comply pending further litigation. | Same | https://www.uscis.gov/newsroom/alerts/court-order-on-hold-policies ; Duane Morris https://blogs.duanemorris.com/immigrationlaw/2026/06/19/after-dorcas-uscis-says-the-hold-policies-are-gone-what-affected-employers-and-employees-can-do-now/ ; Gunster https://www.gunster.com/newsroom/publications/uscis-announces-compliance-with-the-u-s-district-courts-decision-vacating-benefits-hold-policies-and-the-country-specific-factors-policy-for-firty-nine-39-trvel-ban-countries | [S] | — |
| 2026-06-12 | DOJ | Notice of appeal to the First Circuit, **No. 26-1703**. | — | https://dockets.justia.com/docket/circuit-courts/ca1/26-1703 | [S] | — |
| Jun 2026 data | USCIS | 1,774 received / **89 approved** / 281 denied / 355,371 pending. FY2026 Q3 Cuban row: 6,279 / 139 / 447 / median 16.3 — the "139 vs 447" headline of October. | — | doc 04 | [F] | — |

### July 2026

| Date | Actor | What happened | Who it affected | Source | Tag | Type |
|---|---|---|---|---|---|---|
| 2026-07-10 | USCIS (Policy Manual) | Technical update removing content after the June order vacated two memos and a policy alert. | — | https://www.uscis.gov/policy-manual/updates | [S′] | — |
| 2026-07-14 | CMS | Informational bulletin to state Medicaid agencies on termination of parole programs. | Benefits eligibility, not USCIS | https://www.medicaid.gov/federal-policy-guidance/downloads/cib07142026-termination-parole-programs.pdf | [S′] | — |
| **2026-07-15** | D.R.I. | Denies the government's motion for a stay pending appeal. | — | WR Immigration https://wolfsdorf.com/dorcas-on-appeal-district-court-pauses-its-own-ruling-as-first-circuit-takes-up-the-case/ ; AfghanEvac https://afghanevac.org/dorcas | [S] | — |
| **2026-07-16** | DHS (final rule announced; some sources say 07-20) | Rescinds the 2022 public-charge rule; new discretionary framework and a **new I-485 edition required from 2026-09-18**; applications filed before that date judged under the narrower framework; past benefit use counted only for cash assistance/long-term institutionalisation. | New CAA filers after 09-18 (CAA applicants remain statutorily exempt per the 2026-08-18 Policy Manual table) | https://cilawgroup.com/news/2026/07/16/dhs-rescinds-2022-public-charge-rule-new-discretionary-framework-and-new-form-i-485-required-on-sept-18-2026/ ; https://www.bal.com/immigration-news/united-states-dhs-final-rule-rescinds-2022-public-charge-regulation-effective-sept-18/ | [S] | S (paperwork, from 09-18) |
| **2026-07-16** | USCIS (letter to Rep. María Elvira Salazar; DHS statement) | Confirms processing of benefits for Cubans and Venezuelans has resumed. | Cohort | Latin Times https://www.latintimes.com/dhs-says-uscis-will-resume-immigration-benefits-cubans-venezuelans-598287 ; Periódico Cubano https://www.periodicocubano.com/cubanos-en-eeuu-reciben-alivio-tras-fallo-judicial-contra-pausa-de-uscis-de-que-se-trata/ | [S][S′] | — (operational end of R3) |
| 2026-07-20 | CiberCuba (attorney Willy Allen) | Predicts the BIA's I-220A remand decision for Oct–Nov 2026. | I-220A Cubans | https://en.cibercuba.com/noticias/2026-07-20-u1-e192519-s27061-nid335682-cuando-llegara-solucion-220a-willy-allen-apuesta | [S′] | — |
| 2026-07-30 | M.D. Fla. | Order in *Acosta Reynoso v. USCIS* (content unknown). | 143 plaintiffs | https://www.leagle.com/decision/infdco20260731b45 | [S] | — |
| Jul 2026 data | USCIS / press | 1,355 received / **308 approved** / 318 denied / 355,379 pending ("USCIS approved 308 green cards for Cubans in July"; "approvals rising since June"). | — | doc 04; https://www.directoriocubano.info/?p=149618 ; https://www.directoriocubano.info/?p=148315 ; https://www.cubaenmiami.com/uscis-aprobo-solo-308-green-cards-para-cubanos-bajo-la-ley-de-ajuste-en-julio/ | [F][S] | — |

### August 2026

| Date | Actor | What happened | Who it affected | Source | Tag | Type |
|---|---|---|---|---|---|---|
| **2026-08-05** | USCIS (**PA-2026-05** *Evidence, Requests for Evidence, and Notices of Intent to Deny*) | Officers may **deny without first issuing an RFE or NOID** when required initial evidence is missing, the record does not establish eligibility, or the request "otherwise lacks a basis for approval"; RFE response window capped at **12 weeks** (no extra 14 days for mail abroad); **NOID response window capped at 30 days**, only 3 extra days when served by mail, and officers may not grant any extension of an RFE/NOID deadline [S″]; applies to requests pending or filed on/after publication; comments due 2026-09-07 (deadline from the original search; not re-confirmed by the fact-checker). In substance it restores the June-2018 "no RFE required" policy that was reversed in 2021; the governing regulation, 8 CFR 103.2(b)(8), is unchanged, so the change is practical rather than legal [S″]. | All pending CAA I-485s — thin evidence of Cuban nationality, parole or one year's presence can now be denied outright | Envoy PDF https://www.envoyglobal.com/wp-content/uploads/2026/08/20260805-EvidentiaryStandards.pdf ; AILA https://www.aila.org/library/uscis-issues-policy-alert-on-evidence-rfes-and-noids ; Nat'l Law Review https://natlawreview.com/article/uscis-updates-policy-manual-expanding-authority-deny-incomplete-filings-without ; https://immpolicytracking.org/policies/uscis-announces-new-evidentiary-policy-to-reduce-frivolous-immigration-benefits/ ; NOID/extension detail: https://www.globalimmigrationblog.com/2026/08/uscis-updates-policy-manual-expanding-authority-to-deny-incomplete-filings-without-first-issuing-rfes-or-noids/ (also swlgpc.com and mayo.law per the fact-checker; URLs not captured) ; 2018-policy framing: https://berardiimmigrationlaw.com/uscis-restores-authority-to-deny-certain-filings-without-first-issuing-an-rfe-what-employers-and-foreign-nationals-need-to-know/ (also reddyesq.com, URL not captured) | [S][S″] | **B (sub) — denial mechanics change** |
| **2026-08-14** | 1st Cir. (Montecalvo, Aframe, Dunlap) | In *Dorcas*, grants the government's emergency stay **"in part, limited to the Comprehensive Re-Review Policy"**; otherwise denied. So the benefit holds stay vacated, but **re-review of already-approved benefits may resume pending appeal.** No merits schedule or decision found as of 2026-10-20. | Approved Cubans (re-review); pending cases unaffected | https://law.justia.com/cases/federal/appellate-courts/ca1/26-1703/26-1703-2026-08-14-0.html ; Envoy https://www.envoyglobal.com/news-alert/first-circuit-grants-partial-stay-in-challenge-to-uscis-immigration-adjudication-policies/ ; https://globallawexperts.com/first-circuit-refuses-stay-vacatur-uscis/ | [S] | **B (sub) — re-review regime for approved cases** |
| 2026-08-18 | USCIS (Policy Manual) | Public-charge guidance implementing the new rule; its exemption table keeps **CAA applicants exempt** from the public-charge test. | New and pending CAA filers | https://www.uscis.gov/newsroom/alerts/uscis-issues-guidance-on-making-public-charge-inadmissibility-determination (doc 04) | [S′] | S |
| **2026-08-24** | N.D. Cal. (Judge Charles Breyer) | ***Red Eagle Law, L.C. v. Edlow***, No. 26-cv-04850-CRB: certifies a nationwide class (nationals of the 39 countries and the Palestinian Authority whose benefit/asylum application had **not been finally adjudicated as of 2026-08-24**; a Cuban denied before that date is outside the class and must rely on *Dorcas* or an individual suit [S″]) and **preliminarily enjoins PM-602-0192 and PM-602-0194**; USCIS must adjudicate "in the normal course." USCIS alert *Recent Court Order on Hold Policies*: "strongly disagrees" but will comply. | Every pending Cuban case (belt-and-braces to *Dorcas*) | https://www.uscis.gov/newsroom/alerts/recent-court-order-on-hold-policies ; https://uscis-pause-tracker.com/cases/f9143399-ca53-41e2-8a65-c44e9174f6a3 ; Clinch Law https://news.clinchlaw.com/tr/article/federal-court-enjoins-uscis-hold-policies-certifies-class-of-applicants-from-39--mtdmav0a ; Agarwal https://www.agarwalimmigration.com/insights/court-blocks-uscis-adjudication-freeze-for-travel-ban-countries | [S] | — (reinforces end of R3) |
| 2026-08-25 | USCIS (PA-2026-10) | Neighborhood investigations for N-400 applicants; **not** extended to I-485. | Future naturalisation step | https://www.aila.org/library/uscis-policy-alert-on-investigations-and-examinations-for-naturalization-eligibility | [S′] | — |
| 2026-08-28 | N.D. Cal. / D. Md. | Breyer **stays the rest of *Red Eagle*** pending the *Dorcas* appeal (status conference set for 2026-09-25); injunction stays in force. *Medani v. Trump* vacates PM-602-0193 (diversity-visa hold; not CAA). | — | https://mwlawllc.com/uscis-adjudication-holds-court-order-2026/ ; AIC (doc 02) | [S][S′] | — |
| Aug 2026 data | USCIS | 1,213 received / **386 approved** / **434 denied** / 355,520 pending (345,741 > 6 months); mean months 20.6. Immigrate case-tracker users had logged 1,219 approvals by 08-03 (unofficial). | — | doc 04; https://www.periodicocubano.com/cuantas-green-cards-aprobo-uscis-bajo-la-ley-de-ajuste-cubano-en-julio-miles-siguen-a-la-espera/ | [F][S] | — |

### September 2026

| Date | Actor | What happened | Who it affected | Source | Tag | Type |
|---|---|---|---|---|---|---|
| 2026-09-04 | CiberCuba (attorney John Dutton) | "Is the CAA in danger?" — the law stands; the risk is administrative. | — | https://en.cibercuba.com/noticias/2026-09-04-u1-e192519-s27061-nid339571-esta-peligro-ley-ajuste-cubano-abogado-john-dutton | [S] | — |
| 2026-09-07 | USCIS | Comment deadline on PA-2026-05. | — | AILA (above) | [S] | — |
| 2026-09-08 | USCIS data | FY2026 Q3 I-765-by-category workbook published; FY2026 Q3 I-485 by office and all-forms workbooks picked up by mirrors 09-23/28. | Data pipeline | doc 04 | [S′] | — |
| **2026-09-18** | DHS / USCIS | Public-charge final rule effective; **new I-485 edition (09/18/26) mandatory with no grace period** — older editions postmarked or e-filed on/after this date rejected. | Anyone filing a new CAA I-485 (not the pending cohort) | CI Law Group; BAL (above); CiberCuba 2026-08-25 https://en.cibercuba.com/noticias/2026-08-25-u1-e199370-s27061-nid338665-cambian-reglas-obtener-green-card-estados-unidos | [S][S′] | S (paperwork) |
| 2026-09-25 | N.D. Cal. | *Red Eagle* status conference (outcome not found). | — | MW Law (above) | [S] | — (watch) |
| Sep 2026 data | USCIS | Monthly CSV for September 2026 not yet in the mirror as of 2026-10-20 (direct fetch returned 404; expected ~late Oct/Nov). The June, July and August 2026 CSVs were re-fetched on 2026-10-20 and their Cuban I-485 rows match this document exactly (Jun 1,774 / 89 / 281 / 355,371; Jul 1,355 / 308 / 318 / 355,379; Aug 1,213 / 386 / 434 / 355,520). | — | doc 04 §7; fact-checker's direct fetch of the mirror | [S′][F] | — |

### October 2026 (to the 20th)

| Date | Actor | What happened | Who it affected | Source | Tag | Type |
|---|---|---|---|---|---|---|
| 2026-10-01/02 | USCIS (alert) / press | FY2027 H.R.1 inflation adjustment announced for filings postmarked on/after 2026-10-16: increases of $3–$30. | — | https://bizlegalservices.com/2026/10/02/uscis-raises-immigration-fees/ ; https://nairametrics.com/2026/10/01/us-to-increase-immigration-fees-for-asylum-work-permits-tps-from-october-16/ | [S] | — |
| 2026-10-03 | La Nación | "Confirmed by USCIS: CAA green card now delayed almost a year" — FY2026 median 11.8 months (Oct 2025–Jul 2026) vs 7.0 in FY2025, highest of the 2021–2026 series; Cuba en Miami: "+69%." | — | https://www.lanacion.com.ar/estados-unidos/migraciones/confirmado-por-uscis-la-green-card-bajo-la-ley-de-ajuste-cubano-registra-una-demoras-de-casi-un-ano-nid03102026/ ; https://www.cubaenmiami.com/residencia-por-ley-de-ajuste-cubano-tarda-mas-tiempo-de-uscis-sube-casi-un-69/ | [S] | — |
| **2026-10-05** (filing date from secondary reports; no page seen today shows it) | AAUP, unions, a Miami legal-aid group, six applicants | ***American Association of University Professors v. Mullin***, No. 1:26-cv-14527 (D. Mass.) — docket number confirmed by the Civil Rights Litigation Clearinghouse; complaint (ECF 1) hosted by the American Immigration Council. Challenges **PM-602-0199** (the "AOS Policy") and **PA-2026-05** (the "Denial Policy") under the INA, the APA (issued without notice-and-comment) and the Due Process Clause; defendant is DHS Secretary Markwayne Mullin. No ruling yet. | If enjoined, the R4 discretion regime weakens | Complaint https://www.americanimmigrationcouncil.org/wp-content/uploads/2026/10/ECF-1-AAUP-v.-Mullin-AOS-Policy.pdf ; Clearinghouse https://clearinghouse.net/case/48515/ ; https://bizlegalservices.com/2026/10/07/lawsuit-challenging-uscis-green-card-policies-filed/ ; Vialto (above); https://cohentuckerlaw.com/why-uscis-policy-memo-pm-602-0199-is-facing-an-imminent-federal-court-challenge/ | [S][S″] (docket, claims); [T] (exact filing date) | — (watch) |
| 2026-10-06 | CiberCuba / CubaHeadlines | Reports the 11.8-month FY2026 CAA median from the USCIS historic-pt page. | — | https://en.cibercuba.com/noticias/2026-10-06-u1-e135253-s27061-nid342034-green-card-ley-ajuste-cubano-tarda-casi-ano-tiempo | [S′] | — |
| 2026-10-13 (public inspection) / **2026-10-14** (published, 91 FR 65306, FR doc. 2026-20955; **effective 2026-10-14**) | DHS (final rule) | *Removal of Automatic Extensions for Certain Employment Authorization Documents* (RIN 1615-AD05; docket USCIS-2025-0271): responds to comments and adopts the 2025-10-30 IFR (8 CFR 274a.13(d)–(e)) **as final, without change**. It does not reach back: an automatic extension already triggered by a renewal filed before 2025-10-30, or one provided by statute or a separate FR notice (e.g. a TPS notice), is preserved; for renewals filed on/after 2025-10-30 a receipt notice does not extend work authorisation. DHS's own impact estimate in the rule: **20,000–33,000 EADs lapsing during an 18-month window beginning May 2027** — the point at which the 18-month (c)(9) cards issued from December 2025 start to expire. (An earlier draft of this row dated the rule 2026-10-15 from a CiberCuba report and cited the public-inspection copy; corrected in the editorial pass.) | All (c)(9) renewals in the cohort | https://www.federalregister.gov/documents/2026/10/14/2026-20955/removal-of-automatic-extensions-for-certain-employment-authorization-documents ; https://www.govinfo.gov/content/pkg/FR-2026-10-14/pdf/2026-20955.pdf ; https://natlawreview.com/article/dhs-finalizes-end-automatic-ead-extensions ; https://eiglaw.com/dhs-finalizes-end-of-automatic-ead-extensions-for-renewal-applicants/ ; CiberCuba (report of 10-15) https://en.cibercuba.com/noticias/2026-10-15-u1-e129488-s27061-nid342861-gobierno-trump-hace-definitiva-eliminacion-prorrogas | [S″] (date, effective date, no-change adoption and grandfathering seen by the editor; the 20,000–33,000 estimate is from the fact-checker's reading of the NLR/EIG summaries) | S (EAD) |
| **2026-10-16** | USCIS | FY2027 H.R.1 fees: initial parole/asylum/TPS EAD $570 (renewal $280); parole $1,050; annual asylum fee $105. Still nothing on the I-485 or the (c)(9) EAD. | (c)(11)/re-parole only | https://www.directoriocubano.info/actualidad/tarifas-uscis-octubre-2026-2/ ; https://www.directoriocubano.info/tramites-usa/tarifas-uscis-asilo-trabajo-octubre-2026/ ; USCIS alert (doc 02) | [S][S′] | S (fee) |
| 2026-10-17 | CiberCuba | "Your parole has expired: options for Cubans" — the CAA remains the route; (c)(9) EADs for CAA applicants reported at 12–12.5 months. | — | https://en.cibercuba.com/noticias/2026-10-17-u1-e129488-s27061-nid343101-te-vencio-parole-pasa-ahora-opciones-tienen-cubanos | [S′] | — |
| 2026-10-20 | CiberCuba / Cuba en Miami / Periódico Cubano / Directorio Cubano | Q3 FY2026 figures go public: **139 approved, 447 denied, 586 decided, 6,279 received, 342,360 pending** (Apr–Jun 2026); "USCIS denied more CAA cases in three months than in the previous six" (447 vs 418); "three of every four petitions rejected." | — | https://en.cibercuba.com/noticias/2026-10-20-u1-e135253-s27061-nid343309-solo-139-cubanos-obtuvieron-residencia-ley-ajuste ; https://www.cubaenmiami.com/uscis-nego-mas-casos-de-ajuste-cubano-en-tres-meses-que-durante-los-seis-meses-anteriores/ ; https://www.periodicocubano.com/uscis-rechaza-tres-de-cada-cuatro-peticiones-bajo-la-ley-de-ajuste-cubano-solo-estos-casos-fueron-aprobados/ ; https://www.directoriocubano.info/tramites-usa/ley-ajuste-cubano-aprobaciones-negativas-2026/ | [S][F] | — |
| 2026-10-20 | (status check) | **Not found today:** any Sept/Oct 2026 USCIS memo specific to parolees or Cubans; any 2026 change to Cuba's *partial* travel-ban status; any ruling on the *Doe v. Noem* CHNV summary-judgment motion; any First Circuit merits schedule in *Dorcas*; any I-485 fee rule; any rescission notices to Cuban LPRs under the revived re-review policy. | — | searches of 2026-10-20 | [S] (absence) | — |

---

## 7. Litigation map (status as of 2026-10-20)

| Case | Court / docket | What it decides | Key dates | Status | Effect on the estimator |
|---|---|---|---|---|---|
| ***Svitlana Doe v. Noem*** | D. Mass. 1:25-cv-10495-IT (Talwani); 1st Cir. 25-1384; SCOTUS 24A1079 | (a) mass termination of CHNV parole; (b) the Feb-14 benefit hold; (c) FRP termination | Filed 2025-02-28; stay 04-14; benefits order 05-28; SCOTUS stay 05-30; 1st Cir. vacatur 09-12; appeal of 05-28 dismissed 11-04; renewed SJ motion briefed 11-10 → 12-08; FRP TRO 2026-01-10, PI 01-24 | (b) final in plaintiffs' favour; (a) merits pending; (c) FRP termination enjoined | (b) ended R1. (a) cannot restore parole for the cohort in any practical way; low estimator relevance. [I] |
| ***Coalition for Humane Immigrant Rights v. Noem*** | D.D.C. 25-cv-00872 (Cobb) | Expedited removal of port-of-entry parolees | Stay 2025-08-01 | Appeal expected; later status not found | Exposure risk while pending, not processing speed |
| ***Doe v. DHS*** (CBP One class) | D. Mass. | April-2025 CBP One parole terminations | Class certified; ruling 2026-03-31 | DHS may re-terminate with proper process | CBP One cohort only |
| ***Dorcas Int'l Inst. of R.I. v. USCIS*** | D.R.I. 1:26-cv-00132 (McConnell); 1st Cir. 26-1703 (CourtListener https://www.courtlistener.com/docket/73477958/) | PM-602-0192, PM-602-0194, PA-2025-26 re-review, country-specific-factors policy | Vacatur 2026-06-05; final judgment 06-11; appeal 06-12; stay denied 07-15; 1st Cir. partial stay 08-14 (re-review only) | Merits appeal pending; no schedule found | Ended R3. A reversal would **re-impose the hold** on every Cuban case → model as a transition probability. |
| ***Red Eagle Law, L.C. v. Edlow*** | N.D. Cal. 26-cv-04850-CRB (Breyer; CourtListener https://www.courtlistener.com/docket/73380879/) | Same two hold memos, class-wide (class limited to applications not finally adjudicated by 2026-08-24) | Class + PI 2026-08-24; case stayed 08-28; status conf. 09-25 | Injunction in force | Backstop if *Dorcas* is reversed |
| ***AAUP v. Mullin*** | D. Mass. 1:26-cv-14527 (docket confirmed; complaint at AIC) | PM-602-0199 and PA-2026-05 | Filed ~2026-10-05 (date from secondary reports) | No ruling | An injunction would soften R4 (denial rate) |
| ***Acosta Reynoso v. USCIS*** | M.D. Fla. 8:26-cv-1314 | Unreasonable delay on 143 Cuban CAA I-485s | Filed 2026-05-04; order 2026-07-30 | Unknown | Signal of how courts treat 15–20-month CAA delays |
| Maryland "83 plaintiffs" case (name not found) | D. Md. (Russell) | Hold on green-card processing | Order 2026-04-24 | Plaintiffs only | Precedent only |
| *Hernandez v. Noem* | D.D.C. | CAA eligibility issues (details not found) | — | — | Watch |
| ***Labrada-Hechavarria v. U.S. Att'y Gen.*** + Miami I-220A class action + BIA remand | 11th Cir. 23-13664 / 24-10645; S.D. Fla.; BIA | Whether I-220A release is "parole" for the CAA | 11th Cir. 2026-02-23; BIA decision predicted Oct 2026–Feb 2027 | Pending | Defines whether a large *non-CHNV* Cuban population enters the queue |

---

## 8. The reference case mapped onto the regimes

| Milestone | Date | Regime at the time | What the timeline says |
|---|---|---|---|
| CHNV arrival | 2023–2024 | R0 | Paroled under INA 212(d)(5) for two years with a (c)(11) EAD. |
| One year + one day | early 2025 | R0 → R1 | Eligible; parole still valid (if arrived after ~May 2023). |
| I-485 + (c)(9) I-765 filed | March 2025 | **R1 (hold since 02-14)** | Receipted, biometrics likely taken, nothing adjudicated. Parole terminated on paper 03-25, stayed 04-14, un-stayed 05-30. |
| Hold lifted | 2025-05-28 / 06-09 | R1 → R2 | Case becomes adjudicable "after additional vetting." |
| CHNV termination notice | ~2025-06-12 | R2 | Parole and (c)(11) card gone; pending I-485 = period of authorised stay. |
| (c)(9) EAD received | September 2025 | R2 | ~6 months after filing, consistent with the 2.2–4.6-month (c)(9) medians plus the hold. Card issued before 12-05, so it carries the old (up to 5-year) validity; a renewal filed after 10-30 gets no automatic extension (confirmed by the final rule effective 2026-10-14) and ≤18 months. |
| "Parole history" factor | 2025-08-19 | R2 | Applies to the pending case. |
| Second freeze | 2025-12-02 → 2026-06-11 | **R3** | Case on hold again; ~6 months lost. |
| Discretion regime | 2026-05-21/22 → | R4 | Decisions resumed Jun–Aug 2026 at 89 → 308 → 386 approvals/month vs 281 → 318 → 434 denials; PA-2026-05 from 08-05 allows denial without RFE. |
| Today | 2026-10-20 | R4 | ~19 months pending, ~10 of them inside R1 + R3. Published I-485 case-inquiry dates (e.g. 131A-FAM MIA 2023-06-17, HIA 2024-07-05) mean the case is still "within normal processing" by USCIS's own yardstick. [F][I] |

**Why neighbours who filed at the same time have no EAD [I]:** their I-765 was not reached before 2025-12-02, sat in R3 until June 2026, and then re-entered a (c)(9) queue whose median had grown to 4.6–6.4 months (USCIS) or ~12 months (Cuban press, Oct 2026).

---

## 9. What is *not* true as of 2026-10-20 (rumour control for the app)

| Claim circulating in the community | Finding | Tag |
|---|---|---|
| "The Cuban Adjustment Act was repealed / suspended by Trump." | No repeal bill, no executive order, no suspension found; attorneys quoted Apr–Sep 2026 agree the statute is intact. The 1996 IIRIRA §606 sunset (repeal only when a democratic government is certified in Cuba) is the only repeal mechanism. | [S][T] |
| "Cuba was moved to the full travel ban." | Cuba remained on the *partial* list in Proclamation 10998 (eff. 2026-01-01); no 2026 change found. | [S′][S] |
| "USCIS is still not allowed to decide Cuban cases." | The holds were vacated 2026-06-05/11 and enjoined class-wide 2026-08-24; USCIS says it is complying; decisions (mostly denials) resumed Jun–Aug 2026. What the First Circuit revived on 2026-08-14 is only the re-review of *approved* benefits. | [S][F] |
| "A green card already approved is safe." | Not necessarily: the re-review policy for post-2021-01-20 entrants from the 19/39 countries is in force pending appeal. No rescission notices were found, but the authority exists. | [S] |
| "If you got an EAD your green card is close." | The (c)(9) EAD is adjudicated separately and says nothing about the I-485 queue position; 2025 EAD recipients were frozen again in December 2025. | [I] |
| "USCIS will send an RFE before denying." | Since 2026-08-05 (PA-2026-05) it need not; if it does, the RFE window is ≤12 weeks and a NOID window ≤30 days, with no extensions. The regulation itself (8 CFR 103.2(b)(8)) did not change — this is a return to the 2018 practice. | [S][S″] |
| "My old EAD is automatically extended while the renewal is pending." | Only if the renewal was filed before 2025-10-30 (or a statute / separate FR notice provides an extension). For renewals filed on/after that date there is no bridge; the final rule effective 2026-10-14 confirms it. | [S][S″] |
| "The parole fee / $550 EAD fee applies to my green card." | H.R.1 fees attach to parole, (c)(11)/(c)(8)/TPS EADs, asylum and TPS — not to the I-485 or the (c)(9) EAD. | [S] |

---

## 10. Open questions and watch list (ordered by estimator impact)

1. ***Dorcas* First Circuit merits** (No. 26-1703): briefing/argument schedule and decision. A reversal re-creates R3 for every Cuban case; an affirmance removes the largest downside risk. Check https://dockets.justia.com/docket/circuit-courts/ca1/26-1703 and CourtListener.
2. ***AAUP v. Mullin*** (D. Mass. 1:26-cv-14527): any preliminary injunction against PM-602-0199 / PA-2026-05 would change the denial rate (R4).
3. **Monthly CSV for September 2026** (due ~late Oct/Nov 2026) and FY2026 Q4 workbooks (due ~Jan 2027): first full-quarter read on R4 throughput and denial share.
4. **Re-review in practice:** are Cuban LPRs receiving notices of intent to rescind under the policy the First Circuit revived on 2026-08-14? No evidence either way.
5. ***Doe v. Noem*** renewed summary-judgment ruling (CHNV merits) — briefed since 2025-12-08.
6. ***Acosta Reynoso*** (M.D. Fla.) 2026-07-30 order: did the court order adjudication within a deadline? That would be a template for mandamus timing in the app's "what can I do" screen.
7. **Exact text of PM-602-0199 on the CAA** (USCIS has published no CAA-specific guidance) and whether the Policy Manual Vol. 7 Part A Ch. 10 (2025-11-27) names the CAA.
8. **The 2026-05-18 "attorneys in person" rule** — single secondary source, not confirmed today; drop from the app unless verified.
9. **Public-charge rule text (eff. 2026-09-18)**: confirm the statutory CAA exemption survives in the rule itself, not only in the 2026-08-18 Policy Manual table.
10. **Re-parole**: no 2026 source describes USCIS adjudicating CHNV re-parole requests; treat re-parole as unavailable in practice (and subject to the $1,050 parole fee) until shown otherwise.
11. **CHIRLA v. Noem** appeal status (expedited removal of former parolees) — exposure risk for users attending interviews.
12. **BIA remand in *Labrada-Hechavarria*** (Oct 2026–Feb 2027): would add a large I-220A population to the CAA queue and could change per-office backlogs.
13. **FY2027 H.R.1 fee amounts (eff. 2026-10-16: EAD $570/$280, parole $1,050, asylum $105):** seen today only in Cuban-press and fee-blog results; the fact-checker's search did not reach them. Confirm against the USCIS alert *FY 2027 inflation increase* and the FR notice before hard-coding.
14. **Quarterly I-485 performance workbook file name in the mirror:** the wildcard `i485_performance*_fy2026_q3*.xlsx` did not resolve (`i485_performance_fy2026_q3.xlsx` → 404; directory listing blocked). The ingestion pipeline must discover files by listing the directory (GitHub contents API or git tree), never by guessing a name — this also applies to the latest `monthly_<month>_<year>.csv`.
15. ***AAUP v. Mullin* exact filing date:** docket 1:26-cv-14527 is confirmed; 2026-10-05 rests on law-firm reports. Read it off the docket (CourtListener/PACER).
16. **PA-2026-05 comment deadline (2026-09-07)** and the **First Circuit's operative stay language of 2026-08-14** ("limited to the Comprehensive Re-Review Policy"): both rest on the original search; the fact-checker found consistent but not verbatim confirmation. Read the Justia opinion and the AILA Policy Alert page to confirm the quoted words.

---

## 11. Implications for the app (what this document changes)

- **Encode regimes R0–R4 with the exact dates in §2.1** as a time-varying covariate; compute "adjudicable days" = calendar days minus days inside R1 (2025-02-14 → 2025-06-09) and R3 (2025-12-02 → 2026-06-11). For cases filed in R1 or R3, the clock effectively starts at the regime's end.
- **Output two numbers, not one:** time-to-decision *and* probability of approval, because R4 data show denials ≥ approvals (Jul–Aug 2026) and PA-2026-05 removed the RFE warning step.
- **Milestone semantics by date:** an EAD received before 2025-12-05 may be a 5-year card; after, ≤18 months; renewals filed after 2025-10-30 have no bridge (final rule effective 2026-10-14; renewals filed *before* 2025-10-30 keep the extension they already triggered, so do not flag those users as unauthorised). **May 2027 is the first renewal wave with no bridge** (18-month cards issued from December 2025); DHS itself projects 20,000–33,000 lapses nationally in the 18 months from then, so the renewal reminder must fire ≥180 days before card expiry and warn that a receipt notice is not work authorisation. A "parole termination notice" dated ~2025-06-12 is expected for everyone who still had parole on 2025-05-30 and is not a negative signal for the I-485.
- **RFE/NOID screen:** since 2026-08-05 a denial can arrive with no RFE/NOID; if one arrives, the response clock is ≤12 weeks (RFE) or 30 days (NOID), +3 days only for service by mail, and no extensions are granted — show the deadline as a hard date, not a range.
- **Alerts feed (events that flip the regime variable):** 1st Cir. 26-1703 docket (CourtListener https://www.courtlistener.com/docket/73477958/); N.D. Cal. 26-cv-04850 (CourtListener https://www.courtlistener.com/docket/73380879/); D. Mass. 1:26-cv-14527; D. Mass. 1:25-cv-10495; AILA's case pages (Dorcas stay denial https://www.aila.org/library/district-court-denies-government-motion-to-stay-decision-vacating-uscis-hold-policies-in-dorcas-v-uscis ; Red Eagle PI https://www.aila.org/library/district-court-issues-preliminary-injunction-to-lift-adjudication-hold-for-travel-ban-countries); USCIS Policy Memoranda and Policy Manual updates pages; Federal Register API (agency = DHS, terms "parole", "employment authorization", "adjustment"); CiberCuba, Cuba en Miami, Directorio Cubano, Periódico Cubano, 14ymedio for same-day signals.
- **Cohort separation:** CHNV (airport, I-134A), CBP One (land port), CFRP (family reunification), I-220A (not parole). Each has a different parole-termination date and litigation posture (§7); only the first three are currently CAA-eligible without litigation.
- **Fee calculator:** I-485 $1,440 / $950; (c)(9) I-765 $260; I-131 $630 [T]; no H.R.1 surcharge. Show the H.R.1 amounts only on (c)(11)/re-parole screens.
- **Paperwork gates by filing date:** I-693 with the I-485 (from 2024-12-02) and single-use (from 2025-06-11); social-media handles (2025–26); I-485 edition 09/18/26 for filings on/after 2026-09-18.
- **Data pipeline:** the mirror's June–August 2026 CSVs were re-read on 2026-10-20 and match this document; September 2026 is still absent (404). Discover files by listing the mirror directory; never assume the latest month or the performance-workbook name exists (§10 item 14).

---

## 12. Sources

### 12.1 URLs seen in my own searches today ([S])

Courts, dockets, trackers
- https://litigationtracker.justiceactioncenter.org/cases/svitlana-doe-v-noem-humanitarian-parole-district-court
- https://litigationtracker.justiceactioncenter.org/cases/svitlana-doe-v-noem-humanitarian-parole-court-appeals
- https://clearinghouse.net/case/46186/
- https://justiceactioncenter.org/case/svitlana-doe-v-noem/
- https://justiceactioncenter.org/svitlana-doe-v-noem-class-action/
- https://justiceactioncenter.org/news/frn-decoder-frptermination/
- https://docs.justia.com/cases/federal/district-courts/massachusetts/madce/1:2025cv10495/281389/97
- https://immpolicytracking.org/policies/reporting-that-dhs-plans-to-terminate-chnv-parole-processes-and-revoke-parole-by-placing-certain-beneficiaries-in-removal-proceedings/
- https://law.justia.com/cases/federal/appellate-courts/ca1/26-1703/26-1703-2026-08-14-0.html
- https://dockets.justia.com/docket/circuit-courts/ca1/26-1703
- https://www.pacermonitor.com/public/case/63431021/Dorcas_International_Institute_of_Rhode_Island_et_al_v_United_States_Citizenship_and_Immigration_Services_et_al
- https://storage.courtlistener.com/recap/gov.uscourts.ca1.54420/gov.uscourts.ca1.54420.00108486088.0.pdf
- https://afghanevac.org/dorcas
- https://wolfsdorf.com/dorcas-on-appeal-district-court-pauses-its-own-ruling-as-first-circuit-takes-up-the-case/
- https://globallawexperts.com/first-circuit-refuses-stay-vacatur-uscis/
- https://uscis-pause-tracker.com/cases/dfdb50fe-3ed9-40f1-ac88-ff1e8371d88a
- https://uscis-pause-tracker.com/cases/f9143399-ca53-41e2-8a65-c44e9174f6a3
- https://uscis-pause-tracker.com/
- https://www.torregozalegal.com/blog/the-dorcas-v-uscis-decision-the-status-of-frozen-cases-and-realistic-processing-timelines
- https://www.lawfirm4immigrants.com/uscis-appeals-dorcas-decision/
- https://blogs.duanemorris.com/immigrationlaw/2026/06/19/after-dorcas-uscis-says-the-hold-policies-are-gone-what-affected-employers-and-employees-can-do-now/
- https://manifestlaw.com/news/district-court-vacates-uscis-policies-06-08-2026
- https://www.envoyglobal.com/news-alert/first-circuit-grants-partial-stay-in-challenge-to-uscis-immigration-adjudication-policies/
- https://www.gunster.com/newsroom/publications/uscis-announces-compliance-with-the-u-s-district-courts-decision-vacating-benefits-hold-policies-and-the-country-specific-factors-policy-for-firty-nine-39-trvel-ban-countries
- https://www.agarwalimmigration.com/insights/court-blocks-uscis-adjudication-freeze-for-travel-ban-countries
- https://www.path2immigration.com/blog/court-lifts-uscis-adjudication-holds-2026/
- https://mwlawllc.com/uscis-adjudication-holds-court-order-2026/
- https://causeyyelawgroup.com/blog/f/uscis-litigation-update-federal-court-blocks-adjudication-holds
- https://news.clinchlaw.com/tr/article/federal-court-enjoins-uscis-hold-policies-certifies-class-of-applicants-from-39--mtdmav0a
- https://lp.hackinglawpractice.com/uscis-adjustment-of-status-lawsuit
- https://vialtopartners.com/regional-alerts/united-states-immigration-uscis-adjustment-of-status-policies-face-legal-challenge
- https://bizlegalservices.com/2026/10/07/lawsuit-challenging-uscis-green-card-policies-filed/
- https://cohentuckerlaw.com/why-uscis-policy-memo-pm-602-0199-is-facing-an-imminent-federal-court-challenge/
- https://www.sglegalgroup.com/blog/2026-uscis-adjustment-of-status-policies-what-changed
- https://stoufferlaw.com/2026/05/what-the-new-uscis-adjustment-of-status-memo-means-for-your-case/
- https://www.leagle.com/decision/infdco20260731b45
- https://hoodline.com/2026/03/miami-cubans-sue-feds-over-green-card-limbo/
- https://clearinghouse.net/case/46811/
- https://www.law360.co.uk/articles/2470157
- https://manifestlaw.com/news/judge-orders-uscis-process-green-cards-04-28-2026
- https://www.cubaheadlines.com/articles/327617
- https://www.cubaheadlines.com/articles/327620
- https://www.prismnews.com/hobbies/cuba/uscis-partially-resumes-cuban-immigration-cases-after
- https://www.yahoo.com/news/articles/judge-blocks-expedited-deportations-those-211132751.html
- https://www.yahoo.com/news/articles/judge-blocks-trump-rapid-fire-153651501.html
- https://www.washingtontimes.com/news/2025/aug/1/judge-says-dhs-cant-use-fast-deportation-biden-parole-migrants/
- https://newrepublic.com/post/198720/federal-judge-scathing-rebuke-trump-deportation-immigration
- https://www.news4jax.com/news/politics/2025/08/01/judge-pauses-trump-administrations-push-to-expand-fast-track-deportations/
- https://forumtogether.org/article/legislative-bulletin-thursday-august-7-2025/
- https://www.cliniclegal.org/resources/federal-court-reinstates-cbp-one-paroles-narrow-class-allows-dhs-correct-errors-and-re
- https://natlawreview.com/node/298082/printable/print
- https://immpolicytracking.org/policies/reported-dhs-sends-parole-termination-and-self-deportation-notices-to-people-paroled-at-cbp-one-appointments/
- https://www.kaxe.org/news/2025-04-08/migrants-who-entered-the-u-s-via-cbp-one-app-should-leave-immediately-dhs-says
- https://www.michiganpublic.org/2025-04-08/migrants-who-entered-the-u-s-via-cbp-one-app-should-leave-immediately-dhs-says
- https://admin.mondaq.com/unitedstates/terrorism-homeland-security-defence/1621654/parole-termination-notices

USCIS / DHS policy, fees, EAD rules
- https://uscis.gov/sites/default/files/document/policy-alerts/NTA_Policy_FINAL_2.28.25_FINAL.pdf
- https://uscis.gov/legal-resources/notice-appear-policy-memorandum
- https://immpolicytracking.org/policies/uscis-releases-policy-memo-on-issuance-of-ntas-in-cases-involving-inadmissible-and-removable-noncitizens/
- https://www.cliniclegal.org/file-download/download/public/77107
- https://www.envoyglobal.com/wp-content/uploads/2026/08/20260805-EvidentiaryStandards.pdf
- https://assets.aila.org/files/33c99bd0-3c97-4c22-b674-68c615c63a3b/26080601.pdf
- https://immpolicytracking.org/policies/uscis-announces-new-evidentiary-policy-to-reduce-frivolous-immigration-benefits/
- https://www.aila.org/library/uscis-issues-policy-alert-on-evidence-rfes-and-noids
- https://www.mondaq.com/uscis-policy-alert-pa-2026-05-what-changed-what-didnt-and-what-employers-should-know/1831994
- https://natlawreview.com/article/uscis-updates-policy-manual-expanding-authority-deny-incomplete-filings-without
- https://berardiimmigrationlaw.com/uscis-restores-authority-to-deny-certain-filings-without-first-issuing-an-rfe-what-employers-and-foreign-nationals-need-to-know/
- https://www.globalimmigrationblog.com/2026/08/uscis-updates-policy-manual-expanding-authority-to-deny-incomplete-filings-without-first-issuing-rfes-or-noids/
- https://orr-reno.com/uscis-expands-discretionary-denial/
- https://visaserve.com/uscis-updates-policy-guidance-regarding-discretionary-factors-for-adjustment-of-status-applications-2/
- https://berardiimmigrationlaw.com/uscis-adopts-discretionary-rules-for-adjustment-of-status-applications/
- https://www.immihelp.com/uscis-adjustment-of-status-guidance/
- https://www.aila.org/shop/products/view/uscis-adjustment-of-status-interviews-after-the-may-21-memorandum
- https://www.cmu.edu/oie/news-and-events/2025-2026/may/adjustment-status-policy.html
- https://eiglaw.com/tag/adjustment-of-status/
- https://immpolicytracking.org/policies/uscis-expands-interview-criteria-for-refugee-and-asylee-adjustment-applications/
- https://www.lehighvalleyimmigrationlawyers.com/blog/green-card-approved-without-interview
- https://headmanlaw.com/insights/i-485-interview-waived-or-scheduled/
- https://www.hsfkramer.com/insights/2025-12/employment-authorization-documents-validity-period-reduced-for-certain-categories
- https://webiis08.mondaq.com/unitedstates/general-immigration/1717754/ead-validity-period-reduced-for-certain-categories
- https://www.mintz.com/insights-center/viewpoints/2806/2024-12-19-dhs-publishes-final-rule-authorizing-automatic-ead
- https://www.rnlawgroup.com/dhs-announces-permanent-540-day-automatic-extension-period-for-certain-ead-renewals
- https://www.mondaq.com/unitedstates/general-immigration/1698994/dhs-ends-automatic-extension-of-employment-authorization
- https://www.staffingindustry.com/editorial/cws-30-contingent-workforce-strategies/dhs-ends-automatic-extensions-for-most-employment-authorization-documents
- https://eiglaw.com/dhs-ends-automatic-extension-of-employment-authorization-documents-eads/
- https://www.faegredrinker.com/en/insights/publications/2025/10/dhs-issues-interim-final-rule-on-removal-of-the-automatic-extension-of-employment-authorization-documents
- https://www.jdsupra.com/legalnews/dhs-ends-automatic-extension-of-6349364
- https://www.ahcancal.org/News-and-Communications/Blog/Pages/Elimination-of-Automatic-Extension-of-Certain-Types-of-Employment-Authorization-Documents--.aspx
- https://www.federalregister.gov/documents/2026/10/14/2026-20955/removal-of-automatic-extensions-for-certain-employment-authorization-documents (permanent; replaces the public-inspection link https://public-inspection.federalregister.gov/2026-20955.pdf, superseded once the rule was published on 2026-10-14)
- https://www.govinfo.gov/content/pkg/FR-2026-10-14/pdf/2026-20955.pdf
- https://www.cliniclegal.org/file-download/download/public/78947
- https://www.cliniclegal.org/file-download/download/public/79138
- https://eiglaw.com/uscis-implements-new-immigration-fees-under-h-r-1-starting-july-22-2025/
- https://bizlegalservices.com/2025/10/16/new-immigration-parole-fees/
- https://shepelskylaw.com/the-big-beautiful-bill-spells-out-big-uscis-fee-increases/
- https://nairametrics.com/2026/10/01/us-to-increase-immigration-fees-for-asylum-work-permits-tps-from-october-16/
- https://bizlegalservices.com/2026/10/02/uscis-raises-immigration-fees/
- https://manifestlaw.com/blog/immigration/news/uscis-2026-fee-increase-inflation/
- https://www.colorado.edu/isss/2026/01/20/uscis-announces-inflation-adjustment-premium-processing-fees
- https://immpolicytracking.org/policies/dhs-proposes-rule-raising-fees-on-application-for-a-stay-of-deportation-or-removal/
- https://www.stinson.com/newsroom-publications-USCIS-Proposes-Significant-Fee-Increases-for-US-Employer-Filings
- https://cilawgroup.com/news/2026/07/16/dhs-rescinds-2022-public-charge-rule-new-discretionary-framework-and-new-form-i-485-required-on-sept-18-2026/
- https://www.bal.com/immigration-news/united-states-dhs-final-rule-rescinds-2022-public-charge-regulation-effective-sept-18/
- https://lawofficeimmigration.com/blog/public-charge-rule-rescinded-i485-2026.html
- https://millermayer.com/dhs-rescinds-public-charge-regulation/
- https://thefilam.net/archives/46342
- https://indiacurrents.com/uscis-tightens-regulations-for-green-card-applicants-updates-public-charge-immigration-rules/
- https://cohentuckerlaw.com/?p=1423
- https://www.axios.com/2025/11/27/trump-green-card-review-dc-shooting
- https://wtop.com/government/2025/11/us-will-reexamine-all-green-cards-issued-to-people-from-19-countries-as-trump-administration-ramps-up-immigration-crackdown/
- https://manifestlaw.com/blog/immigration/news/uscis-immigration-changes-dc-shooting/
- https://www.elizeelawfirm.com/post/u-s-orders-nationwide-review-of-green-cards-what-immigrants-and-permanent-residents-need-to-know
- https://blog.wego.com/us-travel-ban-2026/
- https://gulfnews.com/world/americas/us-adds-7-more-countries-to-travel-ban-from-january-1-2026-1.500382162
- https://www.cozen.com/news-resources/publications/2025/expanded-and-revised-travel-bans
- https://www.hsfkramer.com/insights/2025-12/travel-ban-expanding-to-cover-39-countries
- https://dlgvisa.com/blog/trump-expands-travel-ban
- https://www.jackson-hertogs.com/post/travel-ban-proclamation-effective-january-1-2026

CHNV termination notices and employer guidance (June 2025)
- https://www.littler.com/news-analysis/asap/dhs-issues-notices-termination-chnv-parole-program
- https://www.littler.com/news-analysis/asap/update-e-verify-issuing-notices-termination-chnv-parole-program
- https://www.mondaq.com/unitedstates/general-immigration/1644018/update-on-e-verify-issuing-notices-of-termination-for-the-chnv-parole-program
- https://www.hollandhart.com/chnv-update-revocations-and-uscis-guidance-trigger-urgent-employer-action
- https://www.burr.com/immigration-law-insights/employer-impact-dhs-announces-termination-of-parole-program-for-nationals-of-cuba-haiti-nicaragua-and-venezuela
- https://www.gmlaw.com/news/scis-issues-an-important-update-for-employers-and-beneficiaries-on-chnv-litigation/
- https://eiglaw.com/us-issues-e-verify-guidance-for-employers-after-ead-revocations-for-chnv-nationals/
- https://eiglaw.com/u-s-supreme-court-permits-dhs-to-revoke-chnv-status-for-now/
- https://natlawreview.com/article/supreme-court-reverses-lower-court-order-pausing-termination-chnv-parole-program
- https://immpolicytracking.org/policies/eo-securing-our-borders-7b-directs-termination-of-categorical-parole-programs-including-chnv-parole-processes/
- https://www.cliniclegal.org/resources/options-cuban-haitian-nicaraguan-and-venezuelan-parolees
- https://cliniclegal.org/resources/humanitarian-relief/uscis-announces-policy-change-regarding-parole-status-certain-cubans
- https://www.visalawyerblog.com/federal-judge-order-suspends-termination-of-parole-program-for-cubans-haitians-nicaraguans-and-venezuelans-chnv/
- https://www.jonatanalmeira.com/?p=69589
- https://oncubanews.com/en/cuba-usa/cuban-parole-under-review-according-to-uscis
- https://www.telemundo51.com/noticias/local/uscis-podria-cancelar-el-programa-parole-para-cubanos-residencia-green-card-cuba-trump/112095/

Cuban-community and Spanish-language press (2026)
- https://www.lanacion.com.ar/estados-unidos/migraciones/confirmado-por-uscis-la-green-card-bajo-la-ley-de-ajuste-cubano-registra-una-demoras-de-casi-un-ano-nid03102026/
- https://www.lanacion.com.ar/estados-unidos/visas-y-tramites/green-card-para-cubanos-la-regla-del-uscis-para-el-ajuste-de-estatus-para-familiares-de-residentes-nid09102026/
- https://www.lanacion.com.ar/estados-unidos/migraciones/que-pasara-con-los-cubanos-y-venezolanos-con-green-card-tras-las-ultimas-actualizaciones-migratorias-nid03122025/
- https://www.cubaenmiami.com/uscis-nego-mas-casos-de-ajuste-cubano-en-tres-meses-que-durante-los-seis-meses-anteriores/
- https://www.cubaenmiami.com/residencia-por-ley-de-ajuste-cubano-tarda-mas-tiempo-de-uscis-sube-casi-un-69/
- https://www.directoriocubano.info/tramites-usa/tarifas-uscis-asilo-trabajo-octubre-2026/
- https://www.directoriocubano.info/actualidad/tarifas-uscis-octubre-2026-2/
- https://www.directoriocubano.info/tramites-usa/ley-ajuste-cubano-aprobaciones-negativas-2026/
- https://www.directoriocubano.info/estados-unidos/residencia-ley-ajuste-cubano-espera-2026/
- https://www.directoriocubano.info/cuba/cada-vez-menos-residencias-ley-ajuste-cubano-fin-sin-derogarla/
- https://www.directoriocubano.info/estados-unidos/gobierno-de-estados-unidos-sometera-a-revision-los-permisos-de-residencia-a-cubanos-con-green-card/
- https://www.directoriocubano.info/acontecer/cubanos-mandamus-residencia-permanente-green-card-uscis/
- https://www.directoriocubano.info/?p=137891
- https://www.directoriocubano.info/?p=143727
- https://www.directoriocubano.info/?p=145121
- https://www.directoriocubano.info/?p=148315
- https://www.directoriocubano.info/?p=149618
- https://www.directoriocubano.info/?p=113151
- https://www.directoriocubano.info/?p=127244
- https://www.periodicocubano.com/uscis-rechaza-tres-de-cada-cuatro-peticiones-bajo-la-ley-de-ajuste-cubano-solo-estos-casos-fueron-aprobados/
- https://www.periodicocubano.com/cuantas-green-cards-aprobo-uscis-bajo-la-ley-de-ajuste-cubano-en-julio-miles-siguen-a-la-espera/
- https://www.periodicocubano.com/uscis-acelera-aprobaciones-de-residencias-por-la-ley-de-ajuste-cubano/
- https://www.periodicocubano.com/cubanos-demandan-a-uscis-por-hacerlos-esperar-anos-para-la-residencia-bajo-la-ley-de-ajuste/
- https://www.periodicocubano.com/el-motivo-por-el-que-miles-de-cubanos-podrian-esperar-anos-para-recibir-la-residencia-permanente-en-eeuu/
- https://www.cubaheadlines.com/articles/342267
- https://www.latintimes.com/dhs-says-uscis-will-resume-immigration-benefits-cubans-venezuelans-598287
- https://www.vasquezlawnc.com/blog/mandamus-immigration-2026
- https://www.infobae.com/estados-unidos/2026/04/29/cubanos-residentes-en-estados-unidos-se-registra-una-reduccion-cercana-al-99-en-las-aprobaciones-de-permisos/
- https://chequeado.com/el-explicador/durante-el-gobierno-de-trump-se-redujeron-las-aprobaciones-de-green-cards-para-cubanos-en-estados-unidos-en-casi-100-mientras-los-arrestos-de-ice-aumentan/
- https://www.wlrn.org/light/immigration/2026-04-28/cubans-immigration-arrests-green-card-rejections
- https://datawrapper.dwcdn.net/M0xC3/4/
- https://en.cibercuba.com/noticias/2026-05-23-u1-e199370-s27061-nid330127-eeuu-podria-desmantelar-ley-ajuste-cubano-derogarla
- https://en.cibercuba.com/noticias/2026-04-29-u1-e199894-s27061-nid327622-acabara-ley-ajuste-cubano-abogada-responde-dudas
- https://en.cibercuba.com/noticias/2026-09-04-u1-e192519-s27061-nid339571-esta-peligro-ley-ajuste-cubano-abogado-john-dutton
- https://www.cibercuba.com/s/inmigracion-eeuu/guias/una-vez-en-eeuu/ley-ajuste-cubano
- https://www.14ymedio.com/cuba/migracion/aprobaciones-residencia-ley-ajuste-cubano_1_1132080.html
- https://www.unotv.com/us/inmigracion-us/ley-de-ajuste-cubano-las-residencias-aprobadas-caen-mas-de-99/
- https://casaislaw.com/is-the-cuban-adjustment-act-still-valid-updated-guide-for-2026-applicants/
- https://casaislaw.com/will-the-cuban-adjustment-act-survive-proposed-immigration-changes/
- https://fitenkolaw.com/blog/cuban-adjustment-act-miami-2026
- https://aromadecuba.com/en/blog/2026-02-22-ley-ajuste-cubano-2026-quien-califica-proteccion/
- https://visafortheunitedstates.com/visa-types/tourist-visa/us-visa-for-cuban-citizens-2026-cuban-adjustment-act-chnv-asylum-green-card/
- https://lluislaw.com/cuban-adjustment-act/
- https://en.wikipedia.org/wiki/Cuban_Adjustment_Act
- https://en.wikipedia.org/wiki/2026_in_Cuba
- https://elcongresista.mx/politica/nacional/uscis-ajuste-estatus-cubanos-2027

### 12.2 URLs reused from docs 01, 02 and 04 ([S′] / [F])

Primary
- https://www.federalregister.gov/documents/2023/01/09/2023-00252/implementation-of-a-parole-process-for-cubans
- https://www.govinfo.gov/content/pkg/FR-2023-04-28/pdf/2023-09014.pdf
- https://www.federalregister.gov/documents/2023/08/11/2023-17376/implementation-of-changes-to-the-cuban-family-reunification-parole-process
- https://www.federalregister.gov/documents/2025/03/25/2025-05128/termination-of-parole-processes-for-cubans-haitians-nicaraguans-and-venezuelans
- https://www.govinfo.gov/content/pkg/FR-2025-03-25/pdf/2025-05128.pdf
- https://www.uscis.gov/sites/default/files/document/foia/AdministrativeHoldonAllUSCISBenefitRequestsFiledbyParoleesUnderU4U_CHNVorFRP.pdf
- https://ukrainetaskforce.org/wp-content/uploads/2025/03/USCIS-Parolee-Benefits-Pause-Memo-February-14-2025.pdf
- https://www.presidency.ucsb.edu/documents/executive-order-14165-securing-our-borders
- https://www.uscis.gov/newsroom/alerts/litigation-related-update-supreme-court-stay-of-chnv-preliminary-injunction
- https://www.dhs.gov/news/2025/06/12/dhs-issues-notices-termination-chnv-parole-program-encourages-parolees-self-deport
- https://justiceactioncenter.org/wp-content/uploads/2025/04/0097-Order-Granting-Stay-of-CHNV-Revocations.pdf
- https://justiceactioncenter.org/wp-content/uploads/2025/05/107-Second-Stay-Order.pdf
- https://www.supremecourt.gov/DocketPDF/24/24A1079/358354/20250508121118618_Kristi_Noem_v_Svitlana_Doe_et_al_%20application_stay.pdf
- https://www.supremecourt.gov/opinions/24pdf/24a1079_p86b.pdf
- https://law.justia.com/cases/federal/appellate-courts/ca1/25-1384/25-1384-2025-09-12.html
- https://www.federalregister.gov/documents/2025/12/15/2025-22744/termination-of-family-reunification-parole-processes-for-colombians-cubans-ecuadorians-guatemalans
- https://www.uscis.gov/newsroom/alerts/dhs-ends-the-abuse-of-the-humanitarian-parole-process-and-terminates-family-reunification-parole
- https://www.presidency.ucsb.edu/documents/proclamation-10998-restricting-and-limiting-the-entry-foreign-nationals-protect-the
- https://www.uscis.gov/sites/default/files/document/policy-alerts/PM-602-0192-PendingApplicationsHighRiskCountries-20251202.pdf
- https://www.uscis.gov/newsroom/alerts/court-order-on-hold-policies
- https://www.uscis.gov/newsroom/alerts/recent-court-order-on-hold-policies
- https://www.uscis.gov/laws-and-policy/policy-memoranda
- https://www.uscis.gov/sites/default/files/document/policy-manual-updates/20250819-DiscretionaryFactors.pdf
- https://www.uscis.gov/sites/default/files/document/policy-manual-updates/20251127-Discretion.pdf
- https://www.uscis.gov/policy-manual/updates
- https://www.uscis.gov/newsroom/alerts/uscis-issues-guidance-on-making-public-charge-inadmissibility-determination
- https://www.uscis.gov/newsroom/alerts/uscis-changes-validity-period-for-any-form-i-693-signed-on-or-after-nov-1-2023
- https://www.federalregister.gov/documents/2025/07/22/2025-13738/uscis-immigration-fees-required-by-hr-1-reconciliation-bill
- https://www.federalregister.gov/documents/2025/11/21/2025-20622/inflation-adjustment-to-hr-1-immigration-fees
- https://www.uscis.gov/newsroom/alerts/uscis-updates-fees-based-on-hr-1
- https://www.uscis.gov/newsroom/alerts/uscis-announces-fy-2026-inflation-increase-for-certain-immigration-related-fees
- https://www.uscis.gov/newsroom/alerts/uscis-announces-fy-2027-inflation-increase-for-certain-immigration-related-fees
- https://www.federalregister.gov/documents/2025/03/05/2025-03492/agency-information-collection-activities-new-collection-generic-clearance-for-the-collection-of
- https://regulations.justia.com/regulations/fedreg/2025/09/16/2025-17816.html
- https://www.aila.org/library/uscis-pm-halts-all-asylum-applications-and-all-benefit-applications-from-high-risk-countries
- https://www.aila.org/library/uscis-provides-litigation-related-update-on-chnv
- https://www.aila.org/library/uscis-policy-alert-on-investigations-and-examinations-for-naturalization-eligibility
- https://www.cliniclegal.org/resources/clinic-field-alert-informational-uscis-policy-memorandum-adjustment-status-052226
- https://www.cbp.gov/newsroom/national-media-release/cbp-releases-september-2024-monthly-update
- https://www.cbp.gov/newsroom/national-media-release/cbp-releases-december-2024-monthly-update
- https://www.congress.gov/crs-product/R46570
- https://www.medicaid.gov/federal-policy-guidance/downloads/cib07142026-termination-parole-programs.pdf
- https://www.weareceda.org/en/us-cuba-news-brief/march-28-2025

Secondary (reused)
- https://www.littler.com/news-analysis/asap/uscis-lifts-administrative-pause-immigration-applications-filed-uniting-ukraine
- https://hackinglawpractice.com/uscis-resumes-u4u-application-processing-after-lawsuit-forces-action/
- https://www.cbsnews.com/news/judge-indira-talwani-directs-trump-officials-lift-pause-certain-immigration-applications/
- https://ogletree.com/insights-resources/blog-posts/uscis-broadens-scope-of-adjudication-hold-for-pending-benefit-requests-of-certain-foreign-nationals/
- https://www.fredlaw.com/alert-alert-uscis-announces-immediate-hold-on-asylum-applications-and-immigration-benefits-for-foreign-nationals-of-19-high-risk-countries
- https://www.americanimmigrationcouncil.org/blog/court-blocks-uscis-immigration-pause-39-countries/
- https://internationaloffice.berkeley.edu/news/hold-and-review-uscis-benefit-applications-filed-aliens-additional-high-risk-countries
- https://isss.brown.edu/news/2026-02-01/uscis-processing-hold
- https://blog.cyrusmehta.com/2026/06/dorcas-v-uscis-federal-court-reaffirms-that-uscis-must-adjudicate-not-stonewall-immigration-benefits.html
- https://www.bal.com/immigration-news/united-states-federal-court-rules-uscis-adjudication-hold-policies-unlawful/
- https://www.fragomen.com/insights/united-states-uscis-to-consider-a-foreign-nationals-support-for-ideologies-and-organizations-viewed-as-anti-american-when-adjudicating-certain-immigration-benefit-requests.html
- https://www.telemundo51.com/noticias/local/hacen-oficial-el-fin-del-parole-humanitario-para-cubanos-venezolanos-haitianos-y-nicaraguenses/2642089/
- https://www.univision.com/local/miami-wltv/fin-parole-humanitario-que-pasa-aplicaron-otro-tramite-migratorio-ee-uu
- https://factchequeado.com/teexplicamos/20260610/uscis-factor-negativo-paises-travel-ban/
- https://www.periodicocubano.com/cubanos-en-eeuu-reciben-alivio-tras-fallo-judicial-contra-pausa-de-uscis-de-que-se-trata/
- https://www.cubaenmiami.com/uscis-aprobo-solo-308-green-cards-para-cubanos-bajo-la-ley-de-ajuste-en-julio/
- https://en.cibercuba.com/noticias/2026-10-20-u1-e135253-s27061-nid343309-solo-139-cubanos-obtuvieron-residencia-ley-ajuste
- https://en.cibercuba.com/noticias/2026-10-06-u1-e135253-s27061-nid342034-green-card-ley-ajuste-cubano-tarda-casi-ano-tiempo
- https://en.cibercuba.com/noticias/2026-10-17-u1-e129488-s27061-nid343101-te-vencio-parole-pasa-ahora-opciones-tienen-cubanos
- https://en.cibercuba.com/noticias/2026-10-15-u1-e129488-s27061-nid342861-gobierno-trump-hace-definitiva-eliminacion-prorrogas
- https://en.cibercuba.com/noticias/2026-08-25-u1-e199370-s27061-nid338665-cambian-reglas-obtener-green-card-estados-unidos
- https://en.cibercuba.com/noticias/2026-02-24-u1-e129488-s27061-nid321559-corte-eeuu-toma-decision-cubanos-220a-litigio
- https://en.cibercuba.com/noticias/2026-07-20-u1-e192519-s27061-nid335682-cuando-llegara-solucion-220a-willy-allen-apuesta
- https://www.lanacion.com.ar/estados-unidos/migraciones/ni-ley-de-ajuste-ni-green-card-la-mala-noticia-que-deja-en-un-limbo-migratorio-a-los-cubanos-en-eeuu-nid03122025/

USCIS data files (parsed by the doc-04 agent; mirror)
- https://raw.githubusercontent.com/omairqazi29/visualizer/master/data/USCIS_I485/ (monthly `monthly_<month>_<year>.csv` Jul 2024–Aug 2026; `quarterly_all_forms_fy2026_q{1,2,3}_v1.xlsx` (Q3 verified 2026-10-20, 785,620 bytes); `i485_performance*_fy2024_q4 … fy2026_q3*.xlsx` — **wildcard unresolved on 2026-10-20**: `i485_performance_fy2026_q3.xlsx` returned 404 and the directory could not be listed from the sandbox, so the real file name is unknown; see §10 item 14)
- Portal: https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data ; historic medians: https://egov.uscis.gov/processing-times/historic-pt

### 12.3 URLs added in the editorial pass of 2026-10-20 ([S″])

Seen by the editor (two searches)
- https://www.federalregister.gov/documents/2026/10/14/2026-20955/removal-of-automatic-extensions-for-certain-employment-authorization-documents
- https://www.govinfo.gov/content/pkg/FR-2026-10-14/pdf/2026-20955.pdf
- https://integrastrategicadvisors.substack.com/p/removal-of-automatic-extensions-for
- https://natlawreview.com/article/dhs-finalizes-end-automatic-ead-extensions
- https://eiglaw.com/dhs-finalizes-end-of-automatic-ead-extensions-for-renewal-applicants/
- https://www.americanimmigrationcouncil.org/wp-content/uploads/2026/10/ECF-1-AAUP-v.-Mullin-AOS-Policy.pdf
- https://clearinghouse.net/case/48515/
- https://www.uscis.gov/sites/default/files/document/memos/PM-602-0199-AdjustmentOfStatusAndDiscretion-20260521.pdf
- https://www.aila.org/library/featured-issue-new-policy-on-adjustment-of-status-as-act-of-extraordinary-discretion

Seen by the adversarial fact-checker (cited in its report; not re-read by the editor)
- https://www.courtlistener.com/docket/73477958/ (Dorcas, 1st Cir.)
- https://www.courtlistener.com/docket/73380879/ (Red Eagle, N.D. Cal.)
- https://www.aila.org/library/district-court-denies-government-motion-to-stay-decision-vacating-uscis-hold-policies-in-dorcas-v-uscis
- https://www.aila.org/library/district-court-issues-preliminary-injunction-to-lift-adjudication-hold-for-travel-ban-countries
- https://news.clinchlaw.com/tr/article/federal-court-enjoins-uscis-hold-policies-certifies-class-of-applicants-from-39--mtdmav0a (class definition; also sharmalawassociates.com, URL not captured)
- https://www.globalimmigrationblog.com/2026/08/uscis-updates-policy-manual-expanding-authority-to-deny-incomplete-filings-without-first-issuing-rfes-or-noids/ (NOID 30-day cap; also swlgpc.com and mayo.law, URLs not captured)
- https://berardiimmigrationlaw.com/uscis-restores-authority-to-deny-certain-filings-without-first-issuing-an-rfe-what-employers-and-foreign-nationals-need-to-know/ (2018-policy framing; also reddyesq.com, URL not captured)
- https://raw.githubusercontent.com/omairqazi29/visualizer/master/data/USCIS_I485/monthly_june_2026.csv, monthly_july_2026.csv, monthly_august_2026.csv and quarterly_all_forms_fy2026_q3_v1.xlsx (fetched directly; September CSV and i485_performance_fy2026_q3.xlsx → 404)

---

## 13. Verification notes (editorial pass of 2026-10-20)

**Inputs.** One adversarial fact-check report (five searches plus a direct fetch of the GitHub USCIS mirror) and two editor searches, both spent on the two most load-bearing unresolved items. The sandbox network constraints of §0.2 still applied; nothing on uscis.gov, federalregister.gov or courtlistener.com was opened directly.

**Correction accepted (major).** The EAD final rule *Removal of Automatic Extensions for Certain Employment Authorization Documents* was posted for public inspection on 2026-10-13 and **published in the Federal Register on 2026-10-14 (91 FR 65306, FR doc. 2026-20955), effective the same day**; it adopts the 2025-10-30 IFR as final without change and preserves extensions already triggered by renewals filed before 2025-10-30. The previous draft dated it 2026-10-15 ("public-inspection posting", from a CiberCuba report) and never stated the effective date. Fixed in §1 item 4, §2.2, the October 2026 table, §8, §9, §11 and §12.1. Confirmed by the editor's own search [S″]: federalregister.gov document page and govinfo PDF, with the same facts in the NLR, EIG and Integra summaries.

**URL changes.** `https://public-inspection.federalregister.gov/2026-20955.pdf` is superseded (public-inspection copies are replaced once a rule publishes) and is now cited only as the superseded link; the permanent federalregister.gov and govinfo.gov URLs are used instead. The mirror wildcard `i485_performance*_fy2026_q3*.xlsx` in §12.2 is marked unresolved (direct probe of `i485_performance_fy2026_q3.xlsx` → 404; directory listing unavailable); the monthly CSVs through August 2026 and `quarterly_all_forms_fy2026_q3_v1.xlsx` resolve.

**Added from the fact-checker's sources [S″]:** PA-2026-05 NOID window (30 days, +3 days for mail, no extensions) and its "return to 2018 practice / 8 CFR 103.2(b)(8) unchanged" framing; the *Red Eagle* class limit (applications not finally adjudicated by 2026-08-24); the DHS impact estimate in the EAD final rule (20,000–33,000 lapses in the 18 months from May 2027); the AIC-hosted *AAUP v. Mullin* complaint; CourtListener dockets and AILA case pages for the alerts feed; and the confirmation that the mirror's June–August 2026 Cuban I-485 rows match this document.

**Added from the editor's searches [S″]:** *AAUP v. Mullin* docket number 1:26-cv-14527 confirmed (Civil Rights Litigation Clearinghouse) together with the claims (INA, APA, Due Process) and the defendant; the filing date 2026-10-05 remains secondary-sourced and is tagged [T]. The primary PM-602-0199 memo URL on uscis.gov (file-dated 2026-05-21), which explains the 05-21 vs 05-22 split (memo date vs CLINIC alert date).

**Checked and left as written (fact-checker found consistent but not verbatim confirmation):** the First Circuit's 2026-08-14 partial stay being limited to the Comprehensive Re-Review Policy (Envoy and Global Law Experts describe a partial stay; the Justia opinion is the primary text); the PA-2026-05 comment deadline of 2026-09-07; the "some field offices stopped asking memo questions by 06-10" report (now hedged as single-source); the FY2027 fee amounts effective 2026-10-16 (seen in the original search's fee-blog and Cuban-press results; not reached by the fact-checker's search). Each is now listed in §10 (items 13–16) for confirmation by an agent with normal web access.

**Not changed.** All [F] figures (the fact-checker re-read June–August 2026 and found no discrepancy); the regime dates in §2.1; the litigation map except for the docket links and the *AAUP* and *Red Eagle* detail noted above.
