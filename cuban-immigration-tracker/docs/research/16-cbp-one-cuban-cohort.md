# 16 — The CBP One ("DT") Cuban cohort: size, Freeze #1 coverage, *Doe v. DHS*, and CAA eligibility after a terminated parole

Research note, written 2026-10-20. Gap-filling document requested by the completeness critic. It answers four questions for Cubans who were paroled at a **land port of entry after a CBP One appointment** (I-94 class of admission "DT", Jan 2023 → Jan 2025) — a cohort the app models as `entry_channel = CBP_ONE` but for which the corpus had no Cuban count, no answer on whether the Feb 14 2025 parolee hold (R1) applied, and nothing after the Mar 31 2026 *Doe v. DHS* ruling.

**Evidence tags:** [S] = stated in a search result seen today (URL cited) · [T] = training knowledge, not confirmed today · [I] = inferred from the cited material. Network egress was blocked for every primary host (uscis.gov, dhs.gov, ohss.dhs.gov, federalregister.gov, courtlistener.com, news sites), so every [S] claim rests on search-result titles and synthesized snippets, not on pages read in full. Fifteen WebSearch calls were used by the author; an editor's pass on 2026-10-20 (two adversarial fact-checks + two further WebSearch calls) corrected the FY2024 cohort figure and several attributions — see §11 "Verification notes".

**Related corpus files (do not duplicate):**
- `01-chnv-parole-program.md` §2 ("Relationship to CBP One parole"), §5 (EO 14165 §7(a)), §15 open question 10 (CBP One termination notices, tagged [L]).
- `03-the-2025-freeze-and-litigation.md` §15 item 2 ("R1 keyed on parole program — CHNV? CBP One? FRP?").
- `05-other-government-data.md` §2 (CBP data on CHNV, CBP One and parole; 582,800 and 904,530 figures).
- `11-policy-and-rules-master-timeline.md` rows 2025-04-11, 2025-08-01, 2026-03-31; litigation map row "Doe v. DHS (CBP One class)".
- `00-master-timeline.md` rows 2025-04-07→04-11, 2025-08-01, 2026-03-31; conflict item 10.
- `00-key-facts-for-the-app.md` line 11 (entry element) and the litigation table row for CHIRLA v. Noem ("ER stay 2025-08-01 | none") — **that row is now out of date; see §6.**

---

## 0. Answers in one screen

| # | Question | Short answer | Confidence |
|---|---|---|---|
| (a) | How many Cubans were paroled through CBP One? | **No official by-citizenship CBP One parole count was found.** Best reconstruction: roughly **100,000 Cubans** (plausible range 70,000–130,000) paroled at SW-border ports after CBP One appointments between Jan 2023 and Jan 19 2025 — about the same size as the 110,240 CHNV-flight Cubans. Building blocks: >20,000 by early Nov 2023 (Diario de Cuba); FY2024 **share-based**: 547,660 OFO SW-border paroles (House testimony) × a Cuban share of ~12% (Mario Pentón) to 16% (TRAC) ≈ 66,000–88,000; ~44,600 CBP One arrivals/month in late 2024 (CBP). Cuban press (Mario Pentón, Apr 2026) reports "110.000 cubanos" among the >900,000 CBP One parolees — suspiciously identical to the 110,240 CHNV figure, so recorded as an unverified press figure, not a confirmation. **Corrected 2026-10-20:** the earlier draft's "59,815 Cuban non-CHNV OFO paroles in FY2024" was a mis-reading — that number is the House testimony's FY2024 **CHNV** Cuban count (§2.1). | Low [I] built on [S] pieces; share-based only |
| (b) | Were CBP One parolees' I-485s inside Freeze #1 (the Feb 14 2025 "administrative hold")? | **Not by the memo's own terms.** The memo holds benefit requests "filed by aliens who are or were paroled … under the U4U, CHNV, or FRP processes." CBP One is not named, and plaintiffs' counsel in *Doe v. Noem* state that case "does not address CBP One parole." Default app rule: **R1 hold days = 0 for `CBP_ONE`**, with a low-confidence flag because the memo's vetting rationale could have been applied operationally to other parolees. R3 (country hold, Dec 2 2025 → Jun 12 2026) applied to all Cubans regardless of channel. | Medium-high [S]+[I] |
| (c) | What did *Doe v. DHS* hold on Mar 31 2026, who is in the class, and has DHS re-terminated? | D. Mass. (Judge Allison D. Burroughs, No. 1:25-cv-12245) certified a class of people who scheduled a CBP One appointment, were paroled **between May 15/16 2023 and Jan 19 2025**, had parole terminated by the **April 2025 e-mail notice** without further explanation, and remain in the U.S.; granted summary judgment that the e-mail terminations exceeded DHS's statutory authority and violated its own regulation (no case-by-case determination); **vacated** the April 2025 terminations and ordered class members returned to their prior parole status; dismissed the "categorical termination" claim for lack of jurisdiction. DHS's Apr 21 2026 status report said it would send **individualized termination notices** to class members whose parole had not otherwise ended; a **new round of notices dated Apr 24 2026**, citing a non-public CBP Commissioner memorandum (the attribution to Rodney Scott and the Apr 21 date are [T]/[I] — no source seen today states either), reached Cubans within days, and DHS began rewriting class members' I-94 parole end dates to **Apr 24 2026**; a hearing before Judge Burroughs was set for **May 6 2026**. **Nothing after May 6 2026 was found today** — the outcome of that hearing and any further rounds (May–Oct 2026) are open. | Ruling: high [S]. Re-termination round: high [S]. Post-May-2026 status: unknown |
| (d) | Does a revoked/terminated CBP One parole still satisfy the CAA "paroled" element? Does the *CHIRLA* expedited-removal stay still protect this cohort? | **Yes on the statute** — the CAA asks only whether the person *was* inspected and admitted or paroled after Jan 1 1959 (plus one year of physical presence and admissibility); practitioners (CLINIC, firm blogs) and USCIS's own CHNV termination messaging treat a past § 212(d)(5) parole as sufficient even after it ends. USCIS continued to approve CAA I-485s for CBP One entrants in 2026 (CiberCuba, Jun 22 2026). **No USCIS Policy Manual language, RFE or NOID template specifically about terminated CBP One parole was found.** **No on CHIRLA**: a unanimous D.C. Circuit panel (No. 25-5289, **Aug 11 2026**; "per curiam" not confirmed) vacated the Aug 1 2025 district-court stay for lack of standing — specifically **redressability**: the unchallenged "arriving alien" regulation (8 C.F.R. § 1.2 / the 1997 expedited-removal rules) independently lets DHS apply expedited removal to port-of-entry parolees, so staying the 2025 directives redressed nothing. CBP One and CHNV parolees alike are therefore again exposed to expedited removal. The panel did **not** decide whether expedited removal of parolees is lawful. | CAA element: medium-high [S]+[T]. CHIRLA: high [S] on outcome, medium on reasoning |

---

## 1. Who this cohort is (and is not)

- **CBP One land-port parole.** From Jan 12 2023 CBP let inadmissible non-citizens in Mexico book an appointment at a SW-border port through the CBP One app; those who presented were processed and, in the overwhelming majority of cases, **paroled under INA § 212(d)(5)(A)** (I-94 class "DT"), initially for up to one year and, from mid-2023, usually two years [T; consistent with CLINIC's statement that CBP One entrants "were typically granted parole for one or two years under INA § 212(d)(5)" — `https://www.cliniclegal.org/file-download/download/public/77477` [S]]. CBP expanded CBP One scheduling to **eight SW-border ports in May 2023** (GAO-26-107765, `https://files.gao.gov/reports/GAO-26-107765/index.html` [S]).
- **Not CHNV.** CHNV Cubans flew to a U.S. airport with an I-134A supporter and an Advance Travel Authorization; CBP One Cubans travelled overland through Central America and Mexico and were paroled at a land port. Both are § 212(d)(5) paroles, both are CAA-eligible after one year, but they had different termination dates, different lawsuits and (this note's conclusion) different exposure to Freeze #1. DHS's own CHNV termination notice counts **582,800 CHNV nationals with CBP One registration numbers** encountered at SW-border ports from Jan 1 2023 to Jan 31 2025 (`https://www.federalregister.gov/documents/2025/03/25/2025-05128/termination-of-parole-processes-for-cubans-haitians-nicaraguans-and-venezuelans` [S]) — that is the four nationalities together, not Cubans alone.
- **Not I-220A.** A Cuban released on an Order of Release on Recognizance (I-220A) after a Border Patrol encounter was *not* paroled (Matter of Cabrera-Fernández) and is outside this cohort (see doc 02 §2).
- **End of the channel.** EO 14165 §7(a) (Jan 20 2025) ordered DHS to stop using CBP One to parole; CBP removed the scheduling function and cancelled pending appointments (CBP's site update is dated Jan 21 2025 by CLINIC, Jan 20 by CBP's January 2025 update, Jan 23 in doc 01 — immaterial for the app) [S — CLINIC 77477; doc 05 §2].

---

## 2. (a) How many Cubans came through CBP One?

### 2.1 What official statistics exist

| Figure | Value | Period | Source | Tag / caveat |
|---|---|---|---|---|
| CHNV Cubans (airport, I-134A) | **110,240** | Jan 2023 → Dec 2024 | CBP monthly CHNV update (doc 05 §2) | [S] — the *other* cohort, for comparison |
| CHNV nationals (4 countries) with CBP One registration encountered at SW-border POEs | **582,800** | 2023-01-01 → 2025-01-31 | FR 2025-05128 | [S] — four nationalities combined |
| CBP One appointments scheduled | **>852,000** individuals | Jan 2023 → Sep 2024 | CBP Sep 2024 monthly update `https://www.cbp.gov/newsroom/national-media-release/cbp-releases-september-2024-monthly-update` | [S] — appointments, not paroles |
| CBP One appointments scheduled | **904,530** | Jan 2023 → Nov 2024 | CRS IF13030 (doc 05 §2) | [S] |
| People processed at POEs with CBP One information | **~44,700** (Aug 2024), **~44,600** (Sep 2024) | monthly | CBP Aug/Sep 2024 updates `https://www.cbp.gov/newsroom/national-media-release/cbp-releases-august-2024-monthly-update` | [S] — not split by nationality |
| Top CBP One nationalities | Venezuelan, Cuban, Haitian, Mexican (order varies by month) | 2024 | CBP monthly updates as quoted by Cuban press (`https://www.directoriocubano.info/actualidad/cubanos-entre-los-mas-beneficiados-con-citas-del-cbp-one-en-frontera/`) | [S] |
| OFO paroles at the southern border | **547,660** | FY2024 | House Homeland Security Committee testimony, 2025-04-08 `https://homeland.house.gov/wp-content/uploads/2025/04/2025-04-08-OIABSE-JHRG-Testimony.pdf` | [S] |
| **CHNV parolees by nationality** (the witness's own derivation from the DHS workbook tab "CBP SWB Book-Outs by Agency", because DHS had published no FY2024 parole-grants report) | **59,815** Cubans (also 125,742 Haitians, 54,930 Nicaraguans, 50,107 Venezuelans; sum 290,594). Same testimony: ICE paroled 60,620; total DHS parolees FY2024 ≥ 898,874 | FY2024 | same testimony — prepared statement of Steven Camarota (CIS) for the hearing "Case by Case: Returning Parole to Its Proper Purpose" | [S] — **these are CHNV (airport) counts, NOT CBP One / non-CHNV paroles.** The earlier draft of this note mis-read them as non-CHNV OFO paroles; corrected 2026-10-20. Checks: 547,660 (OFO SWB) + 290,594 (CHNV) + 60,620 (ICE) = 898,874, the testimony's total; and 110,240 CHNV Cubans (to Dec 2024) − 50,185 (to Sep 2023) = 60,055 ≈ 59,815. Haitians highest / Venezuelans lowest is the CHNV pattern, the opposite of CBP One's |
| Cuban share of all port-of-entry humanitarian paroles | **16%** | FY2024 (year-to-date at time of report) | TRAC report 749 `https://tracreports.org/reports/749/` | [S] |
| SW-border paroles granted (OFO + USBP) | **~2.4 million** of ~10.4 million encounters; OFO granted the majority, at ports | Oct 2018 → May 2025 | GAO-26-107765 | [S] |
| *Doe v. DHS* class size (all nationalities) | **~900,000** | paroled May 2023 → Jan 19 2025 | NBC News / The Hill coverage of the Mar 31 2026 ruling (`https://www.nbcnews.com/news/us-news/judge-blocks-trump-termination-parole-migrants-legally-entered-us-usin-rcna266078`) | [S]; doc 11 has 936,000–985,000 April-2025 notices |

**What was *not* found:** a CBP or OHSS table that gives CBP One parole grants by citizenship. OHSS's monthly "Immigration Enforcement and Legal Processes" tables (doc 05 §1, doc 13 §4) contain a CBP One appointments table and CHNV tables; whether the CBP One table is broken down by citizenship could not be checked (host blocked). The CIS figure that the search surfaced ("OFO paroled 50,236 Cuban nationals … under CHNV", `https://cis.org/Arthur/Did-Joe-Biden-Really-Parole-Nearly-3-Million-Aliens`) is a **CHNV** number for FY2023 (CBP's Sep 2023 update reports 50,185 CHNV Cubans through Sep 2023 — `https://www.cbp.gov/newsroom/national-media-release/cbp-releases-september-2023-monthly-update` [S]) and must not be read as a CBP One count. The same applies to the House testimony's 59,815 Cubans: it is the FY2024 CHNV Cuban count (useful for doc 01's CHNV cohort, not for this one).

### 2.2 Cuban-press figures

| Figure | Value | Period | Source | Tag |
|---|---|---|---|---|
| Cubans who entered with CBP One appointments | **>20,000** | Jan 2023 → ~Oct 2023 | Diario de Cuba, 2023-11-02 `https://diariodecuba.com/cuba/1698936536_50762.html` | [S] |
| Cubans who entered U.S. territory, "la gran mayoría" with a CBP One appointment | **25,748** | "enero a septiembre" (year not stated in snippet; most likely 2024) | Mario Pentón `https://www.mariopenton.com/dhs-revela-estadisticas-actualizadas-del-parole-y-citas-de-cbp-one/` | [S] — ambiguous period. If it is Jan–Sep 2024 it implies only ~34,000 FY2024 CBP One Cubans, well below the share-based 66,000–88,000 in §2.3 — the main downside risk to the estimate. If it is Jan–Sep 2023 it is consistent with Diario de Cuba's ">20,000 by Nov 2023" |
| Cubans among the >900,000 CBP One parolees | **~110,000** ("110.000 cubanos") | Jan 2023 → Jan 2025 | Mario Pentón, Apr 2026 `https://www.mariopenton.com/revocacion-de-parole-por-cbp-one-genera-incertidumbre-para-miles-de-cubanos-en-eeuu/` | [S — fact-checker's search 2026-10-20] — **caution:** equals the CHNV Cuban total (110,240) to three figures; possibly the journalist's conflation. Used only as an unverified ~12% share / upper anchor, not as confirmation |
| Nationalities covered by the *Doe v. DHS* ruling | Venezuelans, Cubans and Haitians named as the main groups | Mar 2026 | Univision; El Mundo Boston (as summarized) | [S — fact-checker's search 2026-10-20]; no Cuban count given |
| Cubans who entered the U.S. in 2024 (all channels) | **>200,000** | CY2024 | cubanosporelmundo.com `https://cubanosporelmundo.com/cubanos-estados-unidos-2024/` | [S] — all channels incl. CHNV, CBP One, visas, I-220A |
| "Miles de cubanos" affected by the 2026 re-termination | thousands | Apr 2026 | Martí Noticias `https://www.martinoticias.com/a/miles-de-cubanos-con-cbp-one-enfrentan-incertidumbre-tras-nuevas-cancelaciones-de-parole-video/462315.html` | [S] |

### 2.3 Reconstruction (inference — treat as a prior, not a fact)

| Window | Method | Cubans via CBP One |
|---|---|---|
| Jan 12 → Sep 30 2023 | Diario de Cuba ">20,000 by early Nov 2023", scaled back one month | ≈ 18,000 |
| FY2024 (Oct 2023 → Sep 2024) | **Share-based** — no direct figure exists (the 59,815 used in the earlier draft is the CHNV count, §2.1): 547,660 OFO SW-border paroles (House testimony) × Cuban share of ~12% (Pentón's ~110k of ~900k) to 16% (TRAC 749) ≈ 66,000–88,000. TRAC's "port" paroles may include airport (CHNV) paroles, which would inflate the Cuban share, so the low end is the more likely. Downside scenario: if Pentón's 25,748 (§2.2) is Jan–Sep 2024, FY2024 ≈ 35,000 | ≈ 70,000 (35,000–88,000) |
| Oct 1 2024 → Jan 19 2025 | ~44,600 CBP One arrivals/month × ~3.6 months × 11–16% Cuban share | ≈ 17,000–26,000 |
| **Total** | | **≈ 100,000 (range ≈ 70,000–130,000)** [I — share-based; central value moved from 95,000 to 100,000 on 2026-10-20 when the FY2024 row was re-derived; the range is unchanged] |

So the Cuban CBP One cohort is **of the same order as the CHNV-flight cohort (110,240)**, and together they are ~200,000 Cubans paroled in 2023–Jan 2025 — consistent with the ~175,000 older pending cases and the Mar 2025 receipt spike (26,187) that doc 08 reconstructs. Because CBP One Cubans were concentrated in 2024 arrivals (two-year paroles ending 2026), a larger share of them than of CHNV Cubans still had **unexpired** parole in April 2025 and April 2026 — which is exactly the sub-group the re-termination notices target (§4.4).

**How to get the real number (for the ingestion pipeline):** (0) the DHS data workbook the House witness used — tab **"CBP SWB Book-Outs by Agency"** (his footnote cites column Z, line 135) — which gives OFO southwest-border paroles by month and agency and is a candidate official source for the denominator; its URL was not captured in the testimony snippet [S — testimony as summarized]; (1) OHSS monthly tables XLSX — look for a "CBP One appointments by citizenship" sheet (pattern in doc 13 §4); (2) CBP's FY2024/FY2025 "Nationwide Encounters" and "CBP One" dashboards, which TRAC used; (3) the *Doe v. DHS* docket (1:25-cv-12245), where DHS's April 2026 status report and class-notice filings may give by-nationality counts; (4) a FOIA to CBP OFO for "paroles granted at SW-border POEs with CBP One registration, by citizenship, Jan 2023–Jan 2025."

---

## 3. (b) Was the CBP One cohort inside Freeze #1 (R1)?

### 3.1 What the Feb 14 2025 memo says

- The memo (signed by Acting Deputy Director Andrew Davidson; official copy in USCIS's FOIA Electronic Reading Room, titled "Administrative Hold on All USCIS Benefit Requests Filed by Parolees Under U4U, CHNV or FRP", `https://www.uscis.gov/sites/default/files/document/foia/AdministrativeHoldonAllUSCISBenefitRequestsFiledbyParoleesUnderU4U_CHNVorFRP.pdf` [S — fact-checker's search 2026-10-20; the title itself states the three-process scope]; third-party mirror at `https://ukrainetaskforce.org/wp-content/uploads/2025/03/USCIS-Parolee-Benefits-Pause-Memo-February-14-2025.pdf`) imposes an "immediate USCIS-wide administrative hold" on **"all benefit requests filed by aliens who are or were paroled into the United States under the U4U, CHNV, or FRP processes,"** pending completion of screening and vetting flags in ELIS, citing fraud, public-safety and national-security concerns and specifically supporter fraud in U4U and CHNV [S — same PDF; summaries at `https://ukrainetaskforce.org/uscis-pauses-applications-for-tps-asylum-adjustment-eads-and-other-immigration-benefits-for-parolees/`, `https://www.gtlaw-insidebusinessimmigration.com/uscis/uscis-memo-pauses-tps-asylum-ead-other-applications-from-parolees/`, `https://www.gibsondunn.com/updates-to-humanitarian-parole-and-temporary-protected-status/`].
- Covered filings: asylum, TPS, EADs, advance parole, adjustment (I-485), naturalization and "all other" benefit requests; the hold could be lifted only case-by-case with Director/Deputy Director approval, "even for cases covered by an injunction or class-wide court order" (Asian Law Caucus guide, `https://www.asianlawcaucus.org/news-resources/guides-reports/travel-ban-asylum-immigration-benefits` [S]).
- **CBP One is not among the named processes** in any summary seen today [S — absence across five summaries]. The CRS report on parolees' benefits eligibility (R48514, Apr 18 2025, `https://www.congress.gov/crs_external_products/R/PDF/R48514/R48514.1.pdf`) likewise describes the hold as applying to U4U/CHNV/FRP parolees [S].

### 3.2 What the litigation that ended the hold covered

- *Svitlana Doe v. Noem* (D. Mass. 1:25-cv-10495-IT): the May 28 2025 order required USCIS to resume nationwide processing of benefit applications filed by parolees in the covered categorical programs (U4U, CHNV, FRP, plus the military parole-in-place and OAW subclasses) [S — `https://www.visalawyerblog.com/breaking-federal-judge-lifts-pause-on-immigration-applications-for-parolees-of-uniting-for-ukraine-military-parole-in-place-chnv-frp/`; `https://www.littler.com/news-analysis/asap/uscis-lifts-administrative-pause-immigration-applications-filed-uniting-ukraine`].
- The Justice Action Center (plaintiffs' counsel) states on its case page that **"this lawsuit does not address CBP One parole"** (`https://justiceactioncenter.org/svitlana-doe-v-noem-class-action/` [S]).
- USCIS's follow-up memo of **Jun 9 2025** authorized officers to adjudicate pending applications filed by U4U "and other humanitarian parole" parolees once the additional vetting was complete (`https://www.mondaq.com/unitedstates/general-immigration/1640064/...`, Littler [S]). Whether "other" reached beyond the memo's three named processes could not be verified (memo text not retrievable today).

### 3.3 Conclusion and residual doubt

- **Formal scope:** CBP One parolees' I-485s were **not** inside Freeze #1 as written. A Cuban who entered via CBP One and filed a CAA I-485 in Feb–May 2025 was, on paper, adjudicable throughout R1 [I from §3.1–3.2].
- **Residual doubt (why the flag stays "low confidence"):** (i) the memo's rationale — CBP "did not fully vet" parolees before parole — applies at least as well to land-port parolees, and USCIS could have run the same ELIS vetting flags against them without a separate memo; (ii) the April 2025 **termination** of CBP One parole (§4.2) was itself a reason for USCIS to pause (c)(11) EAD work and possibly slow I-485 work for this cohort in spring 2025; (iii) Cuban-press coverage from 2025 about CBP One Cubans' residency cases being delayed was not found today, so there is no evidence either way from the community side. Doc 07's community timelines did not segment by entry channel.
- **What was definitely true for both cohorts:** Freeze #2 (PM-602-0192, Dec 2 2025 → Dorcas vacatur Jun 5/12 2026) keyed on **nationality**, so every Cuban I-485 — CHNV, CBP One, FRP or visa entrant — was held during R3 (doc 03 §5, doc 11 §4).

**App rule (replaces the "CBP One?" open question in doc 03 §15 item 2):**

```
hold_days(R1) = 0  if entry_channel in {CBP_ONE, VISA_ADMISSION, OTHER_PAROLE_NOT_CHNV_U4U_FRP}
hold_days(R1) = overlap(filing_date..today, 2025-02-14..2025-06-09)  if entry_channel in {CHNV, FRP, CFRP, U4U}
hold_days(R3) = overlap(filing_date..today, 2025-12-02..2026-06-12)  for every Cuban applicant
confidence_flag(R1, CBP_ONE) = "low"   # memo scope formal; operational vetting may still have slowed cases
```

Worked example, same filing date as the reference case (I-485 filed 2025-03-15, evaluated 2026-10-20 = 584 calendar days): CHNV filer → 584 − 86 (R1) − 192 (R3) = **306 adjudicable days** (doc 03 §8); CBP One filer → 584 − 192 = **392 adjudicable days** [I]. The estimator should therefore place a Mar-2025 CBP One filer ~3 months further along the age-priority hazard than a CHNV filer with the same filing date.

---

## 4. (c) *Doe v. DHS* — the CBP One class case

### 4.1 Docket facts

| Item | Value | Source |
|---|---|---|
| Caption / number | *Doe v. U.S. Department of Homeland Security*, D. Mass. **No. 1:25-cv-12245** | Casemine `https://www.casemine.com/judgement/us/69ce7bc569295af9b35aed1e`; Clearinghouse `https://clearinghouse.net/case/46889/` [S] |
| Judge | **Allison D. Burroughs** | NBC, MLRI, Vasquez Law summaries [S] |
| Filed | August 2025 (complaint PDF published by Democracy Forward under `/2025/08/`) | `https://democracyforward.org/wp-content/uploads/2025/08/1-1.pdf` [S — date inferred from path] |
| Plaintiffs' counsel | Democracy Forward; Massachusetts Law Reform Institute (MLRI) among those announcing the ruling | `https://mlri.org/2026/03/31/court-blocks-unlawful-mass-termination-of-parole-status/` [S] |
| Decision | **Mar 31 2026** — class certification + summary judgment for plaintiffs | CLINIC, Greenspoon Marder, NBC, The Hill [S] |
| DHS compliance filing | **Apr 21 2026** status report | CLINIC `https://www.cliniclegal.org/resources/federal-court-reinstates-cbp-one-paroles-narrow-class-allows-dhs-correct-errors-and-re`; Refugees International Update #10 `https://www.refugeesinternational.org/perspectives-and-commentaries/let-them-stay-update-10/` [S] |
| Next event found | Hearing before Judge Burroughs **May 6 2026** on whether the new termination round stands | Martí Noticias (Apr 2026) [S] |
| Appeal | **None found** today (Casemine's "25-12245" is the district docket number, not a First Circuit number) | [S — absence] |

### 4.2 Background: the April 2025 e-mail terminations

Between Apr 7 and Apr 11 2025 DHS e-mailed people paroled after CBP One appointments that their parole was terminated and that they should "leave within seven days" using CBP Home (`https://immpolicytracking.org/policies/reported-dhs-sends-parole-termination-and-self-deportation-notices-to-people-paroled-at-cbp-one-appointments/`; `https://natlawreview.com/article/dhs-revokes-legal-status-sends-parole-termination-notices-cbp-one-app-users-united`; Diario de Cuba 2025-04-08 `https://diariodecuba.com/cuba/1744103868_60613.html` [S]; doc 11 row 2025-04-11). The e-mails gave no individualized reason and were sent to some U.S. citizens and lawyers by mistake [T]. This is **round 1** in the Cuban press's counting.

### 4.3 The Mar 31 2026 ruling

- **Class certified:** individuals who (1) scheduled an appointment to enter the U.S. through the CBP One app, (2) were **paroled between May 15 2023 and January 19 2025** (one summary says May 16 — read the order before hard-coding), (3) had their parole **terminated in April 2025 pursuant to an e-mail notice** without further explanation, and (4) **remain in the United States** [S — CLINIC; Greenspoon Marder `https://www.gmlaw.com/news/federal-court-rules-the-administration-unlawfully-terminated-parole-for-beneficiaries-who-used-cbp-one/`; Vasquez Law `https://www.vasquezlawnc.com/blog/federal-judge-burroughs-parole-restoration`].
  - Note the **May 2023 start date**: Cubans paroled via CBP One between Jan 12 2023 and mid-May 2023 (roughly the first ~4 months, before the eight-port expansion) are **outside the class** even though they got the same April 2025 e-mail. CLINIC's title calls it a "narrow class" for this reason [S].
- **Holdings:** (i) claims that DHS terminated parole on an impermissible *categorical* basis — **dismissed for lack of jurisdiction** (INA § 1252(a)(2)(B)(ii) discretion bar, as summarized); (ii) summary judgment for plaintiffs that the terminations **exceeded DHS's statutory authority** and **contradicted DHS's own regulation** (8 C.F.R. § 212.5(e)) because DHS never made the required determination that neither humanitarian reasons nor public benefit warranted continued parole [S — Casemine summary; CLINIC].
- **Remedy:** the April 2025 terminations of class members' parole were **vacated**; defendants ordered to **return class members to the parole status they held before the e-mail** (i.e., parole runs to the original I-94 end date). The court expressly left DHS free to **correct its errors and re-terminate** reinstated paroles with proper, individualized process [S — CLINIC title and summary; Lehigh Valley guide `https://www.lehighvalleyimmigrationlawyers.com/blog/marriage-green-card-after-parole-cbp-one-humanitarian-parole`].
- **Scale:** ~900,000 people reported affected (NBC, The Hill `https://thehill.com/homenews/administration/5809570-trump-parole-status-migrants-cbp-one-unwound/` [S]).
- Doc 06's description of this ruling as "restoring CHNV parole" remains wrong (conflict item 10 in the README); it concerns CBP One parole only.

### 4.4 What DHS did next (Apr 2026) — the "corrected-process" re-termination

| Date | Event | Source |
|---|---|---|
| 2026-04-21 | **DHS status report**: DHS will update parole end dates in its systems of record to reflect revocation of the April 2025 notices; **"individualized notices of termination will be sent to members of the class whose paroles have not otherwise ended."** The report relies on a **CBP Commissioner memorandum** that had not been made public. Plaintiffs alleged DHS was trying to narrow the class by excluding people whose parole had already expired naturally. | CLINIC; Refugees International [S] |
| 2026-04 (exact date not confirmed) | **CBP Commissioner memorandum** (cited in the notices as the legal basis; not public): the purpose of the parole has been served and there are no urgent humanitarian reasons or significant public benefit that justify continuing it. DOJ told the Boston court it would issue new letters based on this memo. **The attribution to Commissioner Rodney Scott and the Apr 21 date in the earlier draft are not stated in any source seen today** — Scott is the CBP Commissioner [T], so the attribution is plausible but unverified. | Memo's existence and gist: Martí Noticias, CiberCuba, Mario Pentón, Diario de Cuba `https://diariodecuba.com/cuba/1777548884_66674.html` [S]. Scott / Apr 21: [T]/[I] |
| 2026-04-24 | **New termination notices** (dated Apr 24) begin reaching Cuban CBP One parolees — the **"third round"** in the Cuban press's counting. The notice terminates parole and **"any associated benefit, including the work permit, unless the person has an independent entitlement to that benefit."** No "leave within N days" language was quoted. | CiberCuba 2026-04-27 `https://en.cibercuba.com/noticias/2026-04-27-u1-e43231-s27061-nid327333-cubanos-entraron-eeuu-cbp-one-reciben-notificacion`; Martí Noticias; Periódico Cubano `https://www.periodicocubano.com/nueva-ola-de-revocacion-de-parole-por-cbp-one-preocupa-a-los-cubanos-sin-estatus-migratorio-en-eeuu/`; d-cuba.com; Mario Pentón `https://www.mariopenton.com/revocacion-de-parole-por-cbp-one-genera-incertidumbre-para-miles-de-cubanos-en-eeuu/` [S] |
| 2026-04-24 → | **I-94 end dates rewritten.** Rather than restoring the original I-94 end date, DHS began changing class members' I-94 parole end dates to **Apr 24 2026** after issuing the new notices. Plaintiffs describe this as a "new termination scheme." | Refugees International Update #10 (as summarized in search results seen 2026-10-20) [S] |
| 2026-05-06 | **Hearing before Judge Burroughs** scheduled to decide whether this round stands or is blocked ("podría definir si la nueva ronda se mantiene o vuelve a ser bloqueada"). | Martí Noticias; Diario de Cuba (late Apr 2026) [S] |
| 2026-05 → 2026-10 | **No result found.** No source seen today reports the outcome of the May 6 hearing, a further round of notices, a motion to enforce, a contempt finding, or a First Circuit appeal. One commentary (Mar/Apr 2026) says DOJ "can and will likely appeal"; no appeal or stay was confirmed. | [S — absence after four targeted searches by the author, one by each fact-checker and one by the editor on 2026-10-20; the editor's search returned only Mar 31–Apr 2026 coverage (NBC, Bloomberg Law, Tucson Sentinel, Refugees International, law-firm blogs)] |

Interpretation [I]: DHS read the Mar 31 order as a procedural defect and cured it within three weeks by issuing individualized notices that recite the § 212.5(e) determination. If Judge Burroughs let that round stand on/after May 6 2026, the practical restoration of CBP One parole lasted roughly **Mar 31 → Apr 24 2026** for most class members, and the cohort is today in the same position as CHNV Cubans: parole terminated, (c)(11) EAD terminated, only a pending or future CAA I-485 (or asylum) keeps them on a path. If she blocked the round, class members' parole runs to the original I-94 end date (mostly 2025–2026 for 2023–2024 entrants, so largely expired by now anyway). **Either way, by late 2026 very few CBP One Cubans have unexpired parole**, which is why the CAA "was paroled" question (§5) matters more than the restoration itself.

A "second round" appears in the Cuban press's numbering between April 2025 and April 2026; the sources seen today do not say what it was (possibly the Jun 2025 CHNV notices or late-2025 individual notices). Flagged as unknown.

---

## 5. (d) Does a terminated CBP One parole still satisfy the CAA "paroled" element?

### 5.1 The statute and USCIS's stated criteria

- USCIS's CAA page: a native or citizen of Cuba who was **"inspected and admitted or paroled into the United States after January 1, 1959,"** has been **physically present for at least one year** at the time of filing, is admissible, and merits discretion (`https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-a-cuban-native-or-citizen` [S]; doc 02 §1). The verb is past-tense and the criterion is historical; nothing in the statute or on the page requires that the parole be *unexpired* at filing or at adjudication [I from text; doc 02 §2 reaches the same reading].
- Contrast with ordinary § 245(a) adjustment, where USCIS tells FRP beneficiaries that "if your parole expires before you obtain status and you did not request re-parole, you generally cannot adjust" and that a pending I-485 keeps parole valid until the I-485 is decided (USCIS CFRP page `https://www.uscis.gov/humanitarian/humanitarian-parole/the-cuban-family-reunification-parole-program` [S]). That guidance is about *family-based* adjustment and parole-in-status rules; it does not govern the CAA, which has its own one-sentence eligibility test [I; same conclusion in doc 02 §2 and doc 03 §4 rumour control].

### 5.2 How practitioners and USCIS have treated CBP One / terminated parole

| Source | Position | Tag |
|---|---|---|
| CLINIC, "Enforcement and Termination of Parole" (practice advisory, `https://www.cliniclegal.org/file-download/download/public/77477`) | CBP One entrants were typically paroled for 1–2 years under § 212(d)(5) and "should also meet" the CAA parole criterion if CBP granted § 212(d)(5) parole — check the I-94. | [S] |
| Immigration Law of Montana, "CAA: Navigating the New Reality After 2023" (`https://www.immigrationlawofmt.com/cuban-adjustment-act-new-reality-2023/`) | The CAA requires only that the applicant *was* paroled at some point after Jan 1 1959 and has one year of presence; someone who filed the I-485 **before** parole was terminated "may still have a viable adjustment application"; someone who had **not yet filed** is "in a much more precarious position" (enforcement exposure, not statutory ineligibility). | [S] — secondary |
| FedLaws / firm blog with a "February 2026 update" (`https://fedlaws.org/cuban-migration-to-the-us-adjustment-act-parole-and-asylum/`) | What matters is the legal basis of the entry: § 212(d)(5)(A) parole — including humanitarian parole at a port of entry after a CBP One appointment — satisfies the CAA; *conditional parole* under § 236(a)(2)(B) does not. | [S] — secondary |
| Casais Law, "Is the CAA still valid? 2026 guide" (`https://casaislaw.com/is-the-cuban-adjustment-act-still-valid-updated-guide-for-2026-applicants/`); Berardi; Lluis Law | CAA remains in force in 2026; parole entrants eligible after one year; other inadmissibility grounds still apply. | [S] — secondary |
| USCIS Jun 2025 CHNV termination notices | Pending I-485s "continue" to be adjudicated after parole termination (doc 03 §4, doc 11 §9). Same logic applies to a CBP One parole terminated by notice. | [S — corpus] + [I] |
| USCIS notice of Feb 23 2022 for Cubans who were "arriving aliens" (`https://www.uscis.gov/sites/default/files/document/notices/USCIS_CAA_AA_485_Denied_NoParole_Process-Feb232022.pdf`) | Shows USCIS's view that the applicant must have been *paroled* (not merely released) at some point, and set a reopening path for earlier denials. Not about terminated parole. | [S] |
| **Community evidence**: CiberCuba, Jun 22 2026, "Cubans celebrate residency approved through CBP One despite the tightening of immigration policies" (`https://en.cibercuba.com/noticias/2026-06-22-u65722-e65722-s27065-nid333033-cubanos-celebran-residencia-aprobada-traves-cbp`) | A Miami couple's CAA I-485 approval after CBP One entry went viral — i.e., USCIS was approving CAA cases for CBP One entrants in June 2026, after both the April 2025 and April 2026 terminations. One case, not a rule. | [S] — anecdotal |

**Not found today:** any USCIS Policy Manual passage, RFE/NOID template, or practitioner report of USCIS denying a CAA I-485 *because* the applicant's CBP One parole was later terminated or revoked [S — absence]. The USCIS Policy Manual has no dedicated CAA chapter; CAA adjudication guidance lives in legacy AFM 23.11 and the I-485 instructions [T].

### 5.3 Where the real risks are (for the warning copy)

1. **Enforcement, not eligibility.** After termination the person is in the U.S. without status and, as a port-of-entry parolee, is an "arriving alien" who can be put in expedited removal (§6). A pending I-485 does not by itself bar expedited removal [T]; it gives a strong equities argument and, in practice, most reported ICE actions have targeted people with no pending case [T — unverified].
2. **Work permit.** The Apr 24 2026 notice cancels the (c)(11) EAD; only an independently granted **(c)(9)** EAD (filed with or after the I-485) survives [S — CiberCuba; doc 11 §6].
3. **Unlawful presence and the one-year clock.** Termination does not stop the CAA physical-presence count (presence, not status, is what is counted) [I; doc 02 §1]. Unlawful presence accrues after termination, which matters only for departure/re-entry bars, not for CAA adjustment [T].
4. **Class membership is not needed for CAA eligibility.** Cubans paroled before May 15 2023, or who never got the April 2025 e-mail, are outside the *Doe v. DHS* class but still satisfy "was paroled."
5. **Parole date ≥ one year before filing** is still required. A CBP One Cuban paroled Jan 15 2025 could file from Jan 16 2026 — inside R3 — and should be told the hold applied to intake only, not to the filing right.

---

## 6. *CHIRLA v. Noem / Mullin* — the expedited-removal shield is gone (Aug 11 2026)

| Date | Event | Source |
|---|---|---|
| 2025-01-23 / 2025-02-18 | DHS memorandum (Jan 23 2025) and ICE e-mail (Feb 18 2025): officers "may process for [expedited removal] any arriving alien, including paroled arriving aliens." | D.C. Cir. opinion as quoted on Leagle `https://www.leagle.com/decision/infco20260811132`; immpolicytracking `https://immpolicytracking.org/policies/dhs-provides-guidance-for-use-of-expanded-expedited-removal-including-for-parolees/` [S] |
| 2025-03 | CHIRLA, UndocuBlack Network and CASA sue in D.D.C. (No. 1:25-cv-00872, Judge Jia M. Cobb) under the APA and Due Process Clause on associational standing. | JAC case page `https://justiceactioncenter.org/case/chirla-v-noem-expedited-removal/`; Clearinghouse `https://clearinghouse.net/case/46285/` [S] |
| 2025-08-01 | District court **stays** the three challenged actions "to the extent [they] subject to expedited removal individuals who have been, at any time, paroled into the United States at a point of entry" — i.e., CBP One, CHNV (airport POE), U4U, OAW parolees. | CourtListener filing `https://storage.courtlistener.com/recap/gov.uscourts.dcd.278757/gov.uscourts.dcd.278757.51.0.pdf`; NIPNLG practice alert `https://nipnlg.org/work/resources/practice-alert-guidance-chirla-v-noem-order-expedited-removal` [S]; doc 11 row 2025-08-01 |
| 2025-08-05 | Government appeals (D.C. Cir. **No. 25-5289**). | Clearinghouse [S] |
| 2025-09-12 | D.C. Circuit denies stay pending appeal, dissolves its partial administrative stay; Judge Walker concurs (no irreparable harm). | JAC PDF `https://justiceactioncenter.org/wp-content/uploads/2025/09/ER-DC-Circuit-Decision.pdf` [S] |
| 2025-10 | Plaintiffs tell the court the government keeps placing POE parolees in expedited removal, arguing the Aug 1 order reaches only the three written directives. | CourtListener filing (D.C. Cir. docket 42290) [S] |
| **2026-08-11** | **D.C. Circuit, unanimous panel, *Coalition for Humane Immigrant Rights v. Mullin*** (No. 25-5289; `https://media.cadc.uscourts.gov/opinions/docs/2026/08/25-5289-2187613.pdf`; Justia `https://law.justia.com/cases/federal/appellate-courts/cadc/25-5289/25-5289-2026-08-11.html`; CourtListener `https://www.courtlistener.com/opinion/10944774/coalition-for-humane-immigrant-rights-v-markwayne-mullin/`): decides the appeal on **standing**, not on the merits of parole termination. The defect is **redressability**: the district court stayed only the Jan 23 2025 memo and the Feb 18 2025 e-mail, not the underlying regulation (8 C.F.R. § 1.2 "arriving alien" definition / the 1997 expedited-removal regulations), so DHS retained **independent, unchallenged authority** to put port-of-entry parolees in expedited removal and staying the directives redressed nothing. The Aug 1 2025 stay is **vacated** and the directives are back in effect. The panel did not decide whether expedited removal of parolees is lawful. ("Per curiam" in the earlier draft was not confirmed; sources describe a unanimous panel. Whether the mandate has issued or rehearing/certiorari is pending was not confirmed.) | JAC summary `https://justiceactioncenter.org/news/federal-court-finds-trump-administrations-use-of-expedited-removal-for-parolees-contrary-to-statute/` (updated), Leagle, Center Square via news-graphic.com `https://www.news-graphic.com/news/national/us-appellate-court-ends-biden-era-mass-parole-programs/article_f6aaa7b8-b8c2-5305-9d82-b5db8c7b1192.html` [S]. Reasoning details rest on JAC's and Leagle's summaries, not on the opinion text [S/T] |
| 2026-08-11 → 2026-10-20 | No rehearing en banc, certiorari petition or replacement injunction found; mandate status not confirmed. | [S — absence] |
| 2026-06 (related) | ***Make the Road New York v. Mullin*, D.C. Cir. No. 25-5320** (`https://media.cadc.uscourts.gov/opinions/docs/2026/06/25-5320-2179963.pdf`) — the appeal in the challenge to the Jan 2025 **nationwide (interior) expansion** of expedited removal. Not previously in this corpus. Its holding was not read today; it bears on **I-220A / non-port Cubans'** ER exposure (doc 02) and on the §8.4 warning copy, not on this cohort's "arriving alien" exposure. | [S — URL surfaced by the fact-checker's search 2026-10-20; outcome unverified → §9 item 9] |

**Consequence for the app:** `00-key-facts-for-the-app.md`'s litigation row "CHIRLA v. Noem | ER stay 2025-08-01 | none" must become "stay lifted 2026-08-11 (D.C. Cir. 25-5289, standing)". Since Aug 11 2026 a former CBP One or CHNV parolee with terminated parole and no pending case can be processed for expedited removal; a pending CAA I-485 is a strong equity but not a legal bar [T]. The interview-attendance warning in doc 11 §10 item 11 should be rewritten accordingly (see §8.4 copy).

---

## 7. Consolidated timeline for a CBP One Cuban (Jan 2023 → Oct 2026)

| Date | Event | Cohort effect | Tag |
|---|---|---|---|
| 2023-01-12 | CBP One appointment scheduling starts at SW-border ports | Channel opens | [T]; GAO/CBP [S] |
| 2023-05 | CBP One expanded to eight SW-border ports after Title 42 ends (May 11) | Volume rises; *Doe v. DHS* class window starts May 15/16 2023 | [S — GAO; CLINIC] |
| 2023-11-02 | Diario de Cuba: >20,000 Cubans have entered with CBP One appointments | First Cuban count | [S] |
| FY2024 | 547,660 OFO SW-border paroles (all nationalities); Cubans ≈12–16% of port paroles → ≈66,000–88,000 Cubans, share-based (the 59,815 figure in the earlier draft is the FY2024 CHNV Cuban count) | Peak year | [S — House testimony; TRAC; Pentón] + [I] |
| 2024-01 → 2025-01 | Earliest CBP One Cubans (paroled Jan–Dec 2023) pass one year of presence and file CAA I-485s | Enter the pending pool before Freeze #1 | [I] |
| 2025-01-20 | EO 14165 §7(a): stop using CBP One for parole; scheduling removed, appointments cancelled | Cohort stops growing at ~100k Cubans (est.; range 70k–130k) | [S — doc 01/11; CLINIC] |
| 2025-01-23 / 02-18 | DHS/ICE directives: ER may be used for "paroled arriving aliens" | Enforcement exposure begins | [S — D.C. Cir.] |
| 2025-02-14 | USCIS parolee hold memo (U4U/CHNV/FRP) | **CBP One I-485s not named** → R1 = 0 | [S] |
| 2025-04-07 → 04-11 | Round-1 e-mail terminations ("leave within seven days") | Parole + (c)(11) EAD terminated for ~900k incl. Cubans | [S] |
| 2025-05-28 / 06-09 | *Doe v. Noem* order / USCIS resumes adjudication for U4U/CHNV/FRP parolees | No direct effect on CBP One cohort | [S] |
| 2025-08-01 | *CHIRLA* stay of ER for POE parolees | Protection (CBP One included) | [S] |
| 2025-08 | *Doe v. DHS* (CBP One class) filed, D. Mass. 1:25-cv-12245 | | [S — path date] |
| 2025-12-02 → 2026-06-12 | PM-602-0192/0194 country hold (R3) → *Dorcas* vacatur + USCIS compliance alert | **Applies to every Cuban I-485, CBP One included** | [S — docs 03/11] |
| 2026-03-31 | *Doe v. DHS*: class certified; April 2025 terminations vacated; parole restored to original end date; DHS may re-terminate with proper process | Restoration for class members (paroled May 15/16 2023 → Jan 19 2025) | [S] |
| 2026-04-21 | DHS status report, relying on a non-public CBP Commissioner memo (Scott attribution and memo date unconfirmed) | Sets up individualized re-termination | [S]; memo author/date [T] |
| 2026-04-24 | Round-3 individualized termination notices reach Cubans; EAD cancelled unless independent basis; DHS rewrites class members' I-94 end dates to 2026-04-24 | Restoration effectively lasted ~3.5 weeks for recipients | [S] |
| 2026-05-06 | Burroughs hearing on the new round | **Outcome unknown** | [S — scheduled] |
| 2026-06-22 | CiberCuba: CAA I-485 approvals for CBP One entrants continue | USCIS still treats CBP One parole as "paroled" | [S — anecdotal] |
| 2026-08-11 | D.C. Cir. lifts *CHIRLA* stay (standing) | ER exposure returns for POE parolees | [S] |
| 2026-08-24 | *Red Eagle Law v. Edlow* class PI (all 39-country nationals with pending applications) | CBP One Cubans are class members like all Cubans | [S — doc 11] |
| 2026-10-20 | Today: no post-May-2026 *Doe v. DHS* development found | | [S — absence] |

---

## 8. Implications for the app

### 8.1 Data model (`entry_channel` and parole fields)

- Keep `CBP_ONE` as a distinct enum value (not a CHNV sub-type). Add to the case record:
  - `parole_date` (I-94 "paroled" date) — drives the one-year clock and *Doe v. DHS* class membership (`parole_date >= 2023-05-15 and <= 2025-01-19`).
  - `parole_end_date_original` (I-94) — restoration under *Doe v. DHS* runs only to this date. **Capture it from the original I-94 / admission stamp, not from a current I-94 download:** since late Apr 2026 DHS has been rewriting class members' I-94 end dates to **2026-04-24** [S — Refugees International #10 as summarized]. If a user reports an I-94 end date of 2026-04-24, treat it as the Apr 2026 re-termination (`INDIVIDUAL_APR_2026`), not as the original end date, and explain the date in copy.
  - `termination_notice_dates[]` with enum `{EMAIL_APR_2025, INDIVIDUAL_APR_2026, OTHER}`.
  - `doe_dhs_class_member: bool` (derived) and `caa_paroled_element_met: true` for every `CBP_ONE` record with a DT I-94, **regardless of termination**.
- Routing/office logic (doc 12) is unchanged: CBP One Cubans settled overwhelmingly in Florida and Texas like CHNV Cubans [T]; no channel-specific office effect is known.

### 8.2 Adjudicable-days clock

```
R1 (2025-02-14 → 2025-06-09): subtract only for CHNV / FRP / CFRP / U4U   (CBP_ONE → 0, flag "low confidence")
R3 (2025-12-02 → 2026-06-12): subtract for every Cuban applicant
```
Unit test to add to doc 08's T-series: **T21** — CBP One filer, I-485 filed 2025-03-15, evaluated 2026-10-20 → 584 calendar days, **392 adjudicable days** (vs 306 for the CHNV twin case). **T22** — CBP One filer paroled 2024-02-01, filed 2025-02-05 (day 370), evaluated 2026-10-20 → 622 calendar, 430 adjudicable.

### 8.3 Population model (doc 08 §4 pending-pool reconstruction)

- Add a CBP One Cuban cohort prior of **≈100,000 (70k–130k; share-based, see §2.3)** paroled Jan 2023 → Jan 19 2025, skewed to 2024 arrivals; eligibility dates therefore cluster Jan 2024 → Jan 2026. Combined with 110,240 CHNV Cubans this yields ~200k parole-based CAA filers in the 2024–2026 vintages, consistent with the observed receipt wave (Mar 2025 = 26,187) and the ~175k older pending cases.
- Because CBP One Cubans were **not** R1-held, their Feb–May 2025 filings could have progressed (biometrics, (c)(9) EADs) during spring 2025. If crowdsourced timelines show two EAD-timing clusters for Mar–Apr 2025 filers (≈4–6 months vs ≈6–9 months), channel is the first variable to test.
- Scenario re-weighting: the May 6 2026 *Doe v. DHS* outcome does not change CAA throughput; it changes **enforcement risk** copy only. The *CHIRLA* reversal likewise affects copy, not the hazard model.

### 8.4 Eligibility / warning copy (EN + ES), for `entry_channel = CBP_ONE`

**Eligibility (green):**
- EN: "You entered with a CBP One appointment and were paroled (your I-94 says 'DT' or 'parole'). The Cuban Adjustment Act only asks whether you *were* paroled and have one year of physical presence — a parole that later expired or was terminated by DHS still counts. If you have not filed yet, you can still file."
- ES: "Entraste con cita de CBP One y fuiste admitido bajo parole (tu I-94 dice 'DT' o 'parole'). La Ley de Ajuste Cubano solo exige que *hayas sido* admitido bajo parole y que tengas un año de presencia física: un parole vencido o cancelado por DHS sigue contando. Si aún no has aplicado, todavía puedes hacerlo."

**Warning (amber) — shown when `termination_notice_dates` is non-empty or `parole_end_date_original < today`:**
- EN: "Your parole is no longer valid and your parole-based work permit (category c11) was cancelled with it. Only a work permit granted because of your pending green-card application (category c9) is still valid. Since Aug 11 2026, a court order that protected former parolees from fast-track ('expedited') removal is no longer in effect; a pending I-485 helps but is not a guarantee. Carry your I-485 receipt notice and talk to a lawyer before any ICE or USCIS appointment."
- ES: "Tu parole ya no es válido y el permiso de trabajo basado en el parole (categoría c11) se canceló con él. Solo sigue válido un permiso otorgado por tu solicitud de residencia pendiente (categoría c9). Desde el 11 de agosto de 2026 ya no está vigente la orden judicial que protegía a ex-beneficiarios de parole contra la deportación acelerada ('expedited removal'); tener el I-485 pendiente ayuda pero no es garantía. Lleva siempre tu recibo del I-485 y consulta a un abogado antes de cualquier cita con ICE o USCIS."

**Info (blue) — class membership:**
- EN: "You appear to be a member of the *Doe v. DHS* class (CBP One parole between May 15 2023 and Jan 19 2025, terminated by the April 2025 e-mail). On Mar 31 2026 a federal court cancelled those e-mails, but DHS sent new individual termination notices from Apr 24 2026. Whether those new notices stand is still before the court."
- ES: "Pareces ser miembro de la clase de *Doe v. DHS* (parole por CBP One entre el 15 de mayo de 2023 y el 19 de enero de 2025, cancelado por el correo de abril de 2025). El 31 de marzo de 2026 un tribunal federal anuló esos correos, pero DHS envió nuevas cartas individuales de cancelación desde el 24 de abril de 2026. El tribunal aún no ha resuelto si esas nuevas cartas son válidas."

### 8.5 Alert watch-list additions

| Watch | Where | Trigger text |
|---|---|---|
| *Doe v. DHS* 1:25-cv-12245 (D. Mass.) — May 6 2026 hearing outcome, enforcement motions, First Circuit appeal | CourtListener docket search (token; doc 13 §7) | "CBP One parole: court ruling on the April 2026 termination notices" |
| New CBP One termination rounds | CiberCuba / Martí / Periódico Cubano RSS keywords "CBP One" + "parole" + "notificación" | "New parole termination notices reported" |
| *CHIRLA v. Mullin* en banc / certiorari / mandate | D.C. Cir. 25-5289; SCOTUS docket search | "Expedited-removal protection for parolees: appeal update" |
| *Make the Road New York v. Mullin* (D.C. Cir. 25-5320) — nationwide ER expansion | D.C. Cir. docket; JAC / ACLU trackers | "Expedited-removal expansion: appeal update (affects I-220A Cubans)" |
| Caption change **Noem → Mullin** across DHS cases (*CHIRLA v. Mullin*, *Doe v. Mullin*; a "Mullin v. Doe" Supreme Court-phase page now exists per the fact-checker) | every docket watcher in doc 13 §7 and the litigation tables in docs 00/03/11 | key watchers on docket numbers, not captions |
| OHSS monthly tables — CBP One by citizenship | doc 13 §4 XLSX pattern | populates the cohort prior |

---

## 9. Open questions (ranked)

1. **Official Cuban CBP One parole count** — none found; §2.3 estimate is now purely share-based (the 59,815 "non-CHNV" building block was a mis-read CHNV figure, removed 2026-10-20). Sub-questions: does TRAC 749's 16% Cuban share of "port" paroles include CHNV airport paroles? what period is Pentón's 25,748? is Pentón's "110.000 cubanos" a conflation with the 110,240 CHNV total? Highest-value FOIA/OHSS pull; also the DHS "CBP SWB Book-Outs by Agency" workbook (§2.3).
2. **Outcome of the May 6 2026 *Doe v. DHS* hearing** and anything after (May–Oct 2026): did the Apr 24 2026 notices and the I-94 end-date rewrite to 2026-04-24 stand? any appeal (First Circuit)? class-wide relief for people whose parole had expired naturally? (Seven searches across author, fact-checkers and editor found nothing after May 6 2026; absence is not evidence either way.)
3. **Exact class window start** — May 15 vs May 16 2023 (two summaries disagree); read the Mar 31 2026 order.
4. **Operational reach of Freeze #1** — the memo named U4U/CHNV/FRP, but did USCIS's ELIS vetting flags also slow CBP One parolees' I-485s in Feb–Jun 2025? Needs community-timeline data segmented by channel, or the Jun 9 2025 memo text.
5. **Round "2"** of CBP One terminations in the Cuban press's numbering (between Apr 2025 and Apr 2026) — not identified.
6. **CAA adjudication of terminated-parole cases** — no RFE/NOID evidence either way; the Jun 2026 approval is anecdotal. Watch AILA/CLINIC practice alerts and Reddit/Telegram for "parole terminado" RFEs.
7. **D.C. Circuit reasoning** in *CHIRLA v. Mullin* — summarized from JAC/Leagle/Justia/CourtListener; the opinion PDF (`…/2026/08/25-5289-2187613.pdf`) should be read before the warning copy is finalized. Also unconfirmed: "per curiam" authorship, whether the mandate issued, and whether rehearing en banc or certiorari was sought.
8. **Whether any CBP One Cubans received I-220A instead of parole** at ports in early 2023 (would move them to the not-paroled bucket) — [T] says rare; unverified.
9. ***Make the Road New York v. Mullin* (D.C. Cir. 25-5320, June 2026)** — outcome of the appeal on the Jan 2025 nationwide expedited-removal expansion; not read today. Affects the I-220A cohort (doc 02) and the §8.4 warning copy.
10. **Author and date of the CBP Commissioner memorandum** behind the Apr 24 2026 notices — Rodney Scott / Apr 21 2026 are [T]/[I]; the memo is not public.
11. **Whether the Jun 9 2025 USCIS memo's "other special humanitarian parole programs" / "categorical parole program" language reached CBP One parolees** — searches confirmed only U4U/CHNV/FRP and re-parole requests (overlaps item 4).
12. ***Doe v. DHS* filing month** — August 2025 is still inferred from the Democracy Forward PDF path only.

---

## 10. Sources

Primary / government
- https://www.federalregister.gov/documents/2025/03/25/2025-05128/termination-of-parole-processes-for-cubans-haitians-nicaraguans-and-venezuelans
- https://public-inspection.federalregister.gov/2025-05128.pdf
- https://www.federalregister.gov/documents/2025/12/15/2025-22744/termination-of-family-reunification-parole-processes-for-colombians-cubans-ecuadorians-guatemalans
- https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-a-cuban-native-or-citizen
- https://www.uscis.gov/humanitarian/humanitarian-parole/the-cuban-family-reunification-parole-program
- https://www.uscis.gov/newsroom/alerts/dhs-ends-the-abuse-of-the-humanitarian-parole-process-and-terminates-family-reunification-parole
- https://www.uscis.gov/sites/default/files/document/notices/USCIS_CAA_AA_485_Denied_NoParole_Process-Feb232022.pdf
- https://www.uscis.gov/sites/default/files/document/forms/i-485instr.pdf
- https://www.uscis.gov/sites/default/files/document/foia/AdministrativeHoldonAllUSCISBenefitRequestsFiledbyParoleesUnderU4U_CHNVorFRP.pdf (USCIS FOIA reading-room copy of the Feb 14 2025 memo — official)
- https://ukrainetaskforce.org/wp-content/uploads/2025/03/USCIS-Parolee-Benefits-Pause-Memo-February-14-2025.pdf (third-party mirror of the same memo)
- https://www.cbp.gov/newsroom/national-media-release/cbp-releases-september-2024-monthly-update
- https://www.cbp.gov/newsroom/national-media-release/cbp-releases-august-2024-monthly-update
- https://www.cbp.gov/newsroom/national-media-release/cbp-releases-april-2024-monthly-update
- https://www.cbp.gov/newsroom/national-media-release/cbp-releases-september-2023-monthly-update
- https://files.gao.gov/reports/GAO-26-107765/index.html
- https://homeland.house.gov/wp-content/uploads/2025/04/2025-04-08-OIABSE-JHRG-Testimony.pdf
- https://www.congress.gov/crs_external_products/R/PDF/R46570/R46570.4.pdf
- https://www.congress.gov/crs_external_products/R/PDF/R48514/R48514.1.pdf
- https://www.congress.gov/crs-product/R48514
- https://www.congress.gov/crs-product/R47654
- https://media.cadc.uscourts.gov/opinions/docs/2026/08/25-5289-2187613.pdf
- https://media.cadc.uscourts.gov/opinions/docs/2026/06/25-5320-2179963.pdf (Make the Road New York v. Mullin, 25-5320 — not read; added 2026-10-20)
- https://storage.courtlistener.com/recap/gov.uscourts.dcd.278757/gov.uscourts.dcd.278757.51.0.pdf
- https://storage.courtlistener.com/recap/gov.uscourts.cadc.42290/gov.uscourts.cadc.42290.2155854.0.pdf
- https://storage.courtlistener.com/recap/gov.uscourts.cadc.42290/gov.uscourts.cadc.42290.2154773.0.pdf
- https://democracyforward.org/wp-content/uploads/2025/08/1-1.pdf (Doe v. DHS complaint)
- https://justiceactioncenter.org/wp-content/uploads/2025/03/Svitlana-Doe-v.-Noem-Hum-Parole-Complaint-2.28.25.pdf
- https://justiceactioncenter.org/wp-content/uploads/2025/05/107-Second-Stay-Order.pdf
- https://justiceactioncenter.org/wp-content/uploads/2025/12/SvitlanaDoevNoem3rdAmendedComplaint.pdf
- https://www.supremecourt.gov/DocketPDF/24/24A1079/358354/20250508121118618_Kristi_Noem_v_Svitlana_Doe_et_al_%20application_stay.pdf

Court-case trackers and legal analyses
- https://www.casemine.com/judgement/us/69ce7bc569295af9b35aed1e
- https://clearinghouse.net/case/46889/
- https://clearinghouse.net/case/46285/
- https://www.leagle.com/decision/infco20260811132
- https://law.justia.com/cases/federal/appellate-courts/cadc/25-5289/25-5289-2026-08-11.html
- https://www.courtlistener.com/opinion/10944774/coalition-for-humane-immigrant-rights-v-markwayne-mullin/
- https://caselaw.findlaw.com/court/us-dis-crt-d-mas/117314613.html
- https://www.cliniclegal.org/resources/federal-court-reinstates-cbp-one-paroles-narrow-class-allows-dhs-correct-errors-and-re
- https://www.cliniclegal.org/resources/clinic-court-watch-federal-immigration-case-updates-1
- https://www.cliniclegal.org/file-download/download/public/77477
- https://www.cliniclegal.org/resources/humanitarian-relief/uscis-announces-policy-change-regarding-parole-status-certain-cubans
- https://mlri.org/2026/03/31/court-blocks-unlawful-mass-termination-of-parole-status/
- https://www.gmlaw.com/news/federal-court-rules-the-administration-unlawfully-terminated-parole-for-beneficiaries-who-used-cbp-one/
- https://www.vasquezlawnc.com/blog/federal-judge-burroughs-parole-restoration
- https://www.refugeesinternational.org/perspectives-and-commentaries/let-them-stay-update-10/
- https://www.lehighvalleyimmigrationlawyers.com/blog/marriage-green-card-after-parole-cbp-one-humanitarian-parole
- https://justiceactioncenter.org/svitlana-doe-v-noem-class-action/
- https://justiceactioncenter.org/case/chirla-v-noem-expedited-removal/
- https://litigationtracker.justiceactioncenter.org/cases/chirla-v-noem-district-court-expedited-removal-parole-recipients
- https://justiceactioncenter.org/news/federal-court-finds-trump-administrations-use-of-expedited-removal-for-parolees-contrary-to-statute/
- https://justiceactioncenter.org/wp-content/uploads/2025/09/ER-DC-Circuit-Decision.pdf
- https://nipnlg.org/work/resources/practice-alert-guidance-chirla-v-noem-order-expedited-removal
- https://www.chirla.org/blog-category/expeditedremoval/
- https://uscis-pause-tracker.com/cases/786112b9-99ff-4b65-a3d7-b59cdd1edc38
- https://immpolicytracking.org/policies/reported-dhs-sends-parole-termination-and-self-deportation-notices-to-people-paroled-at-cbp-one-appointments/
- https://immpolicytracking.org/policies/dhs-provides-guidance-for-use-of-expanded-expedited-removal-including-for-parolees/
- https://immpolicytracking.org/policies/ice-directs-ero-officers-to-consider-expedited-removal-for-large-categories-of-noncitizens/
- https://immpolicytracking.org/policies/eo-securing-our-borders-7b-directs-termination-of-categorical-parole-programs-including-chnv-parole-processes/
- https://immpolicytracking.org/policies/reporting-that-dhs-plans-to-terminate-chnv-parole-processes-and-revoke-parole-by-placing-certain-beneficiaries-in-removal-proceedings/
- https://natlawreview.com/article/dhs-revokes-legal-status-sends-parole-termination-notices-cbp-one-app-users-united
- https://www.mondaq.com/unitedstates/general-immigration/1640064/uscis-lifts-administrative-pause-on-immigration-applications-filed-by-uniting-for-ukraine-u4u-parolees-and-others-who-entered-pursuant-to-humanitarian-parole
- https://www.littler.com/news-analysis/asap/uscis-lifts-administrative-pause-immigration-applications-filed-uniting-ukraine
- https://www.lexology.com/library/detail.aspx?g=172323be-a777-495a-b6b9-a3df512784b9
- https://www.visalawyerblog.com/breaking-federal-judge-lifts-pause-on-immigration-applications-for-parolees-of-uniting-for-ukraine-military-parole-in-place-chnv-frp/
- https://www.gibsondunn.com/updates-to-humanitarian-parole-and-temporary-protected-status/
- https://ukrainetaskforce.org/uscis-pauses-applications-for-tps-asylum-adjustment-eads-and-other-immigration-benefits-for-parolees/
- https://www.francislawcenter.com/blog/2025/04/uscis-pauses-green-cards-and-terminates-the-chnv-parole/
- https://www.gtlaw-insidebusinessimmigration.com/uscis/uscis-memo-pauses-tps-asylum-ead-other-applications-from-parolees/
- https://www.asianlawcaucus.org/news-resources/guides-reports/travel-ban-asylum-immigration-benefits
- https://www.ilrc.org/sites/default/files/2025-11/Expedited%20Removal%20and%20Unaccompanied%20Children.pdf
- https://www.americanimmigrationcouncil.org/fact-sheet/use-parole-under-immigration-law/
- https://www.immigrationlawofmt.com/cuban-adjustment-act-new-reality-2023/
- https://fedlaws.org/cuban-migration-to-the-us-adjustment-act-parole-and-asylum/
- https://casaislaw.com/is-the-cuban-adjustment-act-still-valid-updated-guide-for-2026-applicants/
- https://berardiimmigrationlaw.com/the-cuban-adjustment-act-of-1966-pathway-to-permanent-residency/
- https://lluislaw.com/cuban-adjustment-act/
- https://www.visaverge.com/news/trump-policy-change-could-end-residency-for-thousands-of-cubans/

Statistics and think-tank
- https://tracreports.org/reports/749/
- https://cis.org/Arthur/Did-Joe-Biden-Really-Parole-Nearly-3-Million-Aliens
- https://www.cato.org/sites/cato.org/files/2023-09/BP%20165_update.pdf
- https://en.wikipedia.org/wiki/Parole_for_Cubans,_Haitians,_Nicaraguans,_and_Venezuelans

News (English)
- https://www.nbcnews.com/news/us-news/judge-blocks-trump-termination-parole-migrants-legally-entered-us-usin-rcna266078
- https://thehill.com/homenews/administration/5809570-trump-parole-status-migrants-cbp-one-unwound/
- https://news.bloomberglaw.com/litigation/dhs-termination-of-app-linked-parole-reversed-by-judge (added 2026-10-20)
- https://www.tucsonsentinel.com/local/report/040326_cbp_one_lawsuit/ (added 2026-10-20)
- https://www.news-graphic.com/news/national/us-appellate-court-ends-biden-era-mass-parole-programs/article_f6aaa7b8-b8c2-5305-9d82-b5db8c7b1192.html

News (Spanish / Cuban community)
- https://en.cibercuba.com/noticias/2026-04-27-u1-e43231-s27061-nid327333-cubanos-entraron-eeuu-cbp-one-reciben-notificacion
- https://en.cibercuba.com/noticias/2026-06-22-u65722-e65722-s27065-nid333033-cubanos-celebran-residencia-aprobada-traves-cbp
- https://en.cibercuba.com/noticias/2024-05-17-u1-e208933-s27061-nid282108-suman-95-mil-cubanos-parole-humanitario-aprobado
- https://www.cibercuba.com/s/inmigracion-eeuu/guias/vias-legales/asilo-frontera
- https://www.martinoticias.com/a/miles-de-cubanos-con-cbp-one-enfrentan-incertidumbre-tras-nuevas-cancelaciones-de-parole-video/462315.html
- https://diariodecuba.com/cuba/1698936536_50762.html
- https://diariodecuba.com/cuba/1744103868_60613.html
- https://diariodecuba.com/cuba/1777548884_66674.html (late Apr 2026 — third round of notices; May 6 hearing framing; added 2026-10-20)
- https://www.periodicocubano.com/nueva-ola-de-revocacion-de-parole-por-cbp-one-preocupa-a-los-cubanos-sin-estatus-migratorio-en-eeuu/
- https://www.periodicocubano.com/fallo-judicial-afecta-a-migrantes-con-parole-niegan-cierre-de-procesos-de-deportacion/
- https://www.periodicocubano.com/cubanos-que-entraron-a-eeuu-con-cbp-one-son-beneficiados-tras-decision-de-juez-federal/
- https://d-cuba.com/actualidad/revocan-el-parole-a-cubanos-que-entraron-con-cbp-one
- https://d-cuba.com/actualidad/cifras-de-cubanos-que-han-llegado-con-parole-humanitario-y-cbp-one
- https://www.mariopenton.com/revocacion-de-parole-por-cbp-one-genera-incertidumbre-para-miles-de-cubanos-en-eeuu/
- https://www.mariopenton.com/dhs-revela-estadisticas-actualizadas-del-parole-y-citas-de-cbp-one/
- https://www.directoriocubano.info/actualidad/cubanos-entre-los-mas-beneficiados-con-citas-del-cbp-one-en-frontera/
- https://cubanosporelmundo.com/cubanos-estados-unidos-2024/
- https://eltoque.com/mejoras-en-la-app-cbp-one-asilo-en-ee-uu
- https://diario.mx/juarez/2024/dec/04/optan-cubanos-por-juarez-para-cruzar-con-cbp-one-1044014.html
- https://www.lanacion.com.ar/estados-unidos/migraciones/ultimas-cifras-de-cbp-cuantos-latinos-entraron-con-parole-humanitario-y-a-cuantos-deportaron-en-eeuu-nid05012025/

---

## 11. Verification notes (editor's pass, 2026-10-20)

Two adversarial fact-checks (five WebSearch calls) and an editor's pass (two WebSearch calls) reviewed this note. Tags: [S] = seen in a search result today (URL cited); [T] = training knowledge; [I] = inferred. "Fact-checker's search" marks a URL the editor did not see directly but which the fact-checker cited from a search result of the same day.

**Accepted corrections**

1. **Major — the 59,815 figure (§0(a), §2.1, §2.3, §7, §8.3).** The editor's search confirmed [S] that the Apr 8 2025 House Homeland Security testimony (prepared statement of Steven Camarota, CIS, hearing "Case by Case: Returning Parole to Its Proper Purpose", `https://homeland.house.gov/wp-content/uploads/2025/04/2025-04-08-OIABSE-JHRG-Testimony.pdf`) gives 59,815 Cubans / 125,742 Haitians / 54,930 Nicaraguans / 50,107 Venezuelans as FY2024 **CHNV** parole counts, derived by the witness from the DHS workbook tab "CBP SWB Book-Outs by Agency" because DHS had published no FY2024 parole-grants report; the same testimony gives 60,620 ICE paroles and a FY2024 DHS total of ≥ 898,874 = 547,660 + 290,594 + 60,620. The earlier draft had read 59,815 as *non-CHNV* (CBP One) Cuban paroles. The FY2024 building block is now share-based (547,660 × 12–16% ≈ 66,000–88,000) with a downside scenario tied to Pentón's 25,748; the cohort prior is ≈100,000 (unchanged range 70,000–130,000) and its confidence is lowered to "Low".
2. **Minor — Mario Pentón's "110.000 cubanos"** among the >900,000 CBP One parolees (Apr 2026) added to §0(a) and §2.2 as an unverified press figure with the conflation caveat (identical to the 110,240 CHNV total).
3. **Minor — *CHIRLA v. Mullin* (§0(d), §6, §9 item 7).** "Per curiam" replaced by "unanimous panel"; the standing defect specified as redressability (unchallenged 8 C.F.R. § 1.2 "arriving alien" regulation / 1997 ER rules); Justia and CourtListener links added; mandate / rehearing / certiorari status flagged as unconfirmed. Date, docket and outcome stand.
4. **Minor — CBP Commissioner memo (§0(c), §4.4, §7).** No source names Rodney Scott or dates the memo Apr 21 2026; attribution re-tagged [T]/[I]. The memo's existence and gist ("purpose of the parole has been served") remain [S] (Martí, CiberCuba, Pentón, Diario de Cuba).
5. **Minor — Feb 14 2025 hold memo (§3.1, §10).** Official USCIS FOIA reading-room copy added and made primary; the Ukraine Task Force PDF kept as a mirror. R1 = 0 for `CBP_ONE` stands.

**Added from the fact-checks** — I-94 end dates rewritten to 2026-04-24 (§4.4, §7, §8.1 data-model instruction); *Make the Road New York v. Mullin* 25-5320 (§6, §8.5, §9); Noem → Mullin caption change (§8.5); Diario de Cuba late-Apr-2026 source (§4.4, §10); the "CBP SWB Book-Outs by Agency" workbook as an ingestion target (§2.3); Univision / El Mundo Boston nationality framing (§2.2).

**Re-checked and unchanged** — the editor's second search (post-May-6-2026 *Doe v. DHS* status) returned only Mar 31–Apr 2026 coverage (NBC, Bloomberg Law, Tucson Sentinel, Refugees International #10, law-firm blogs) [S]; it confirmed the Mar 31 holdings, the May 15 vs May 16 2023 class-window discrepancy between summaries, the I-94 rewrite, and that no appeal or stay has been confirmed. "Nothing after May 6 2026" remains the state of the evidence.

**Still unverifiable today** — see §9 items 2, 3, 7, 9–12. No dead or wrong URLs were reported by either fact-checker; the opinion PDFs and dockets could not be opened from this environment, so every court holding here still rests on secondary summaries.
