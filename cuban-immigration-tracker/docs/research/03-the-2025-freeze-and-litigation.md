# 03 — The 2025–2026 "freeze" on Cuban / CHNV benefit adjudications, and the litigation that ended it

**Project:** Cuban Immigration Tracker (CAA Tracker)
**Research date:** 2026-10-20 (every URL below carries this access date unless stated otherwise)
**Author:** research agent (Phase 1, topic 03); written for a smart non-lawyer. Not legal advice.
**Status:** draft v1 — read §0 before relying on any single date or number.

---

## 0. How this document was produced, and its limits (read first)

**What happened in this research run.** This agent was launched after its sibling research
agents (documents 01, 02, 05, 06, 07 in this folder) had already consumed the shared per-turn
web-search budget. My first six searches were refused ("web search budget is used up"), and every
direct fetch of a primary source — `uscis.gov`, `federalregister.gov`, `courtlistener.com`,
`supremecourt.gov`, `justia.com`, `cbsnews.com`, `en.wikipedia.org` — was refused by the sandbox's
egress proxy (`CONNECT ... 403`, "host is not allowed for this session") or failed DNS resolution
inside the fetch tool. GitHub was the only reachable host, and GitHub code/repository search
returned nothing for the memo titles or case names. I did **not** use any search engine, reader,
proxy or archive service to route around those limits.

**What this document is built from, therefore:**

1. Facts that the sibling agents captured *in this same run* from search-result snippets of the
   cited pages (their documents list ~45 distinct URLs on this topic). I re-used those facts and
   their URLs. I did not open any of those pages myself.
2. The author's own background knowledge of the statutes, memos, proclamations and cases, which
   could not be re-verified today.
3. Arithmetic and reasoning on top of (1) and (2).

**Confidence labels used on every claim:**

| Label | Meaning |
|---|---|
| **[S]** | "Snippet-verified": the exact date / number / quote appeared in a search-result excerpt from the cited URL, captured by a sibling agent on 2026-10-20. Strong, but the full page was never read. |
| **[S-reported]** | As [S], but the cited source is a news outlet or law-firm blog describing a primary document that no agent opened. |
| **[B]** | Background knowledge of the author (training data), not re-verified in this session. Usually right on broad strokes; treat exact wording and numbers as "confirm before publishing". |
| **[I]** | Inferred / computed by the author from the facts above. Reasoning is shown. |
| **open** | Could not be determined; listed in §13 with the exact URL to check. |

§13 ("Verification ledger and open questions") is the most important section for whoever picks
this up with normal internet access: it lists, in priority order, the ~15 things to confirm and the
exact URL for each.

---

## 1. Executive summary (the short answer to the project owner)

1. **There were two different government "freezes" that stopped a Cuban CHNV parolee's green-card
   (Form I-485, Cuban Adjustment Act) and work-permit (Form I-765) applications, and both were ended
   by federal courts.** Mixing them up is the single most common error in community discussions. [S]/[I]

2. **Freeze #1 — the "parolee hold" (2025-02-14 → ~2025-06-09/19).** A USCIS memo signed 2025-02-14
   put an "immediate USCIS-wide administrative hold on all pending benefit requests filed by aliens
   who are or were paroled under the U4U, CHNV, or FRP programs, pending fraud and security vetting".
   It covered green cards, work permits, asylum, TPS and re-parole, had no end date, and hit a
   March/April-2025 CAA filer from day one. [S]
   **It was undone by Judge Indira Talwani (D. Mass.) on 2025-05-28** in *Svitlana Doe v. Noem*,
   No. 1:25-cv-10495-IT, who stayed the memo "insofar as it suspended adjudications", certified a
   nationwide class, and ordered compliance reporting; USCIS issued an implementing memo on
   2025-06-09 and reported 8,855 parolee benefit requests adjudicated between 2025-05-28 and
   2025-06-30. The government appealed late, then **voluntarily dismissed that appeal on
   2025-11-04**, so the May 28 relief is final. The ruling was under the **Administrative Procedure
   Act** (an unexplained, indefinite, blanket hold is unlawful agency action), **not** a
   constitutional holding. [S]/[B]

3. **Between the freezes (June–Nov 2025)** USCIS processed the backed-up parolee cases with
   "additional vetting". This is the window in which the project owner's cousin received his (c)(9)
   EAD (September 2025) while slightly later filers did not: anything still pending on 2025-12-02
   was caught by Freeze #2. [S]/[I]

4. **Freeze #2 — the "country hold" (2025-12-02 → 2026-06-12, class-wide 2026-08-24).** After an
   Afghan national shot two National Guard members in Washington, D.C. on 2025-11-26, USCIS Director
   Joseph Edlow issued Policy Memorandum **PM-602-0192** (2025-12-02): a "hold and review" of **all
   pending benefit requests** (I-485, I-765, I-131, I-90, N-400, I-751, asylum, later I-129/I-539/
   I-140) filed by nationals of, or persons born in, the **19 countries** of Presidential
   Proclamation 10949 (the June 2025 "travel ban") — **Cuba is one of them** — plus a "comprehensive
   re-review" of benefits already approved for those nationals since 2021-01-20. **PM-602-0194**
   (2026-01-01) extended it to the **39 countries** of Proclamation 10998. This hold was by
   nationality, so it reached every Cuban applicant regardless of how they entered. [S]/[B]
   **It was undone on 2026-06-05** by Chief Judge John J. McConnell Jr. (D.R.I.) in
   ***Dorcas International Institute of Rhode Island v. USCIS***, No. 1:26-cv-00132-JJM-PAS, who
   **vacated** PM-602-0192, PM-602-0194, the related country-specific-factors policy alert
   (PA-2025-26) and the asylum hold, nationwide, under the APA ("USCIS does not have discretion to
   decline to adjudicate applications at all"); final judgment 2026-06-11; USCIS announced
   compliance on 2026-06-12 and appealed the same day (1st Cir. No. 26-1703). A second, independent
   order followed on **2026-08-24** in ***Red Eagle Law, L.C. v. Edlow***, No. 3:26-cv-04850-CRB
   (N.D. Cal., Judge Charles R. Breyer): nationwide class certified, preliminary injunction, USCIS
   must adjudicate class members' applications "in the normal course". USCIS announced compliance
   again. [S]

5. **"Found unconstitutional"?** Every summary captured describes *Dorcas* and *Red Eagle* (and
   Talwani's May 2025 order) as **statutory/APA rulings** — "unlawful", "arbitrary and capricious",
   "exceeds authority" — not as equal-protection or due-process holdings. The Cuban-community press
   reported them as the judge "annulling" (*anular*) or "striking down" the pause, which is where
   the "unconstitutional" framing most likely comes from. The ruling the project owner remembers is
   almost certainly ***Dorcas* (2026-06-05)**, possibly reinforced by *Red Eagle* (2026-08-24). [S]/[I]

6. **Status on 2026-10-20 for a CAA I-485 filed in March/April 2025:** legally, the case *must* be
   adjudicated — there is no nationality hold in force — but there is **no court-ordered deadline or
   backlog-clearing schedule**; *Red Eagle* requires adjudication "in the normal course". USCIS
   output on CAA cases is still far below 2024–25 levels: 139 approvals and 447 denials in
   April–June 2026, 308 approvals in July 2026, ~342,000–355,000 CAA cases pending, FY2026 national
   median 11.8 months, (c)(9) EADs reported at 12–13 months. Cuban attorneys reported fresh decisions
   arriving in Sept–Oct 2026, and Cuban outlets reported USCIS "still not reactivating residencies
   at the expected pace". The *Dorcas* appeal is pending in the First Circuit; a reversal is the
   single biggest downside risk. A separate May-2026 USCIS memo (PM-602-0199, adjustment as
   "extraordinary" discretion) is a third head-wind, though attorneys and one court filing say it
   does not govern CAA cases. [S]/[I]

---

## 2. Vocabulary (so the rest of the document reads cleanly)

| Term used here | What it means | Dates |
|---|---|---|
| **Freeze #1 / parolee hold / "Davidson memo"** | USCIS hold on all benefit requests from people who *are or were* CHNV, Uniting-for-Ukraine (U4U) or Family-Reunification-Parole (FRP) parolees | 2025-02-14 → lifted by court 2025-05-28; implemented 2025-06-09; systems cleared ~2025-06-19/25 |
| **CHNV termination** | DHS ending the CHNV parole program and revoking parole + (c)(11) EADs; *not* a hold on adjudications | FR notice 2025-03-25; effective 2025-04-24; stayed 2025-04-14; stay lifted by SCOTUS 2025-05-30; notices sent 2025-06-12 |
| **Freeze #2 / country hold / "hold and review"** | USCIS hold on all benefit requests from nationals of the travel-ban countries (19, then 39), Cuba included, plus re-review of past approvals | 2025-12-02 (PM-602-0192) → 2026-01-01 (PM-602-0194) → vacated 2026-06-05 (*Dorcas*), compliance 2026-06-12; class PI 2026-08-24 (*Red Eagle*) |
| **Travel ban** | Presidential Proclamations 10949 (2025-06-04) and 10998 (2025-12-16) restricting *entry* and visa issuance; they do not themselves stop USCIS adjudications but defined the country list USCIS used | effective 2025-06-09 and 2026-01-01 |
| **Discretion memo** | PM-602-0199, adjustment of status as "extraordinary" discretionary relief; separate from the freezes | 2026-05-22; lawsuit filed 2026-10-05 |
| **(c)(11) vs (c)(9) EAD** | (c)(11) = parole-based work permit (revoked June 2025); (c)(9) = work permit based on a pending I-485 (the one a CAA applicant relies on) | — |

Spanish terms the audience uses: *parole humanitario* (CHNV), *pausa / congelamiento / suspensión*
(the holds), *permiso de trabajo* (EAD), *ajuste cubano / Ley de Ajuste Cubano* (CAA I-485),
*veto migratorio* (travel ban), *fallo / orden judicial* (ruling / court order), *anular* (vacate).

---

## 3. Master timeline, 2025-01-20 → 2026-10-20

| Date | Actor | Event | Effect on a Cuban CHNV parolee's CAA I-485 / (c)(9) I-765 | Label |
|---|---|---|---|---|
| 2025-01-20 | President | EO 14161 (enhanced vetting) and EO 14165 §7(b) ordering termination of categorical parole programs "including" CHNV | Sets up everything below | [S] |
| 2025-01-28 | USCIS | Pauses acceptance of Form I-134A (CHNV sponsor form) | No new CHNV entries | [S] |
| **2025-02-14** | USCIS (Acting Deputy Director Andrew Davidson) | Memo *Administrative Hold on All USCIS Benefit Requests Filed by Parolees Under U4U, CHNV or FRP* | **Freeze #1 begins.** I-485 and I-765 accepted and receipted but not adjudicated | [S] |
| ~2025-02-18/19 | CBS News | Memo becomes public | — | [B] |
| 2025-02-28 | Plaintiffs (Justice Action Center, Human Rights First et al.) | *Svitlana Doe v. Noem* filed, D. Mass. 1:25-cv-10495-IT | — | [S] for case; [B] for filing date |
| 2025-03-25 | DHS | FR notice 90 FR 13611 terminating CHNV parole effective 2025-04-24 | Parole and (c)(11) EAD to end; pending I-485 unaffected | [S] |
| 2025-04-14 | Judge Talwani | Dkt. 97: stays the en-masse CHNV termination; certifies CHNV class | Keeps parole alive ~6 weeks | [S] |
| 2025-05-05 | 1st Cir. | Denies government's stay pending appeal | — | [S] |
| 2025-05-08 | Solicitor General | Emergency application to SCOTUS, No. 24A1079 | — | [S] |
| **2025-05-28** | Judge Talwani | Dkt. 107 "Second Stay Order": stays the 2025-02-14 memo insofar as it suspended adjudications; nationwide class; compliance report due 2025-06-09 | **Freeze #1 legally ends** | [S] |
| 2025-05-30 | SCOTUS | *Noem v. Doe*, 24A1079: stays the April 14 order (Jackson, Sotomayor dissenting) | CHNV termination may proceed; May 28 order untouched | [S] |
| 2025-06-04 | President | Proclamation 10949 ("travel ban"), effective 2025-06-09; Cuba partially restricted | No direct effect on pending I-485s; defines the later hold list | [S]/[B] |
| 2025-06-06 | USCIS | Alert *Litigation-Related Update: Supreme Court stay of CHNV Preliminary Injunction* | Parole/EAD revocation notices coming | [S] |
| **2025-06-09** | USCIS | Implementing memo: adjudicate parolee requests "to a final agency action once USCIS has completed the additional vetting requirement" | **Freeze #1 operationally ends** | [S] |
| 2025-06-12 | DHS | Termination notices to ~530,000 CHNV parolees; parole and (c)(11) EADs revoked "effective immediately"; $1,000 CBP Home exit stipend | (c)(11) card gone; CAA I-485 still pending and valid | [S] |
| ~2025-06-19 / 06-25 | USCIS | Holds cleared in systems; stragglers released | — | [S-reported] |
| 2025-05-28 → 06-30 | USCIS (declaration) | 8,855 parolee benefit requests adjudicated | Post-freeze catch-up rate | [S] |
| Jul–Nov 2025 | USCIS | Cohort processing resumes; many Mar/Apr-2025 filers get (c)(9) EADs (reference case: Sept 2025) | — | [S]/[I] |
| late Jul 2025 | DOJ | Appeals the May 28 order "on the last possible day" | — | [S] |
| 2025-09-12 | 1st Cir. (No. 25-1384) | Vacates the April 14 order: mass termination "likely lawful" | No effect on the May 28 order | [S] |
| 2025-10-30 | DHS | Interim final rule ends automatic extension of EADs on renewal | Matters for (c)(9) renewals | [S] |
| **2025-11-04** | DOJ | Voluntarily dismisses its appeal of the May 28 orders | **Freeze #1 relief final** | [S] |
| 2025-11-10 | Plaintiffs | Renewed partial summary-judgment motion on CHNV termination (no ruling located) | — | [S] |
| 2025-11-26 | — | Shooting of two National Guard members in Washington, D.C.; suspect an Afghan national admitted in 2021 | Political trigger for Freeze #2 | [B] |
| 2025-11-27/28 | USCIS Director Edlow | Announces re-examination of green cards of nationals of "countries of concern"; pauses all asylum decisions | — | [B] |
| **2025-12-02** | USCIS | **PM-602-0192** *Hold and Review of all Pending Asylum Applications and all USCIS Benefit Applications Filed by Aliens from High-Risk Countries* + Policy Alert PA-2025-26 (country-specific factors) | **Freeze #2 begins** for every Cuban applicant | [S] |
| 2025-12 (later) | USCIS | Scope broadened to I-129, I-539, I-140 and I-765 | (c)(9) I-765 explicitly covered | [S-reported] |
| 2025-12-15 | DHS | FR notice 2025-22744 terminating Family Reunification Parole (Cuba included) effective 2026-01-14, exempting people with an I-485 filed by 2025-12-15 | CFRP Cubans only | [S] |
| 2025-12-16 | President | Proclamation 10998, effective 2026-01-01: 39 countries; Cuba stays "partial" | — | [S] |
| **2026-01-01** | USCIS | **PM-602-0194**: hold extended to all 39 countries + Palestinian Authority documents; re-review of refugees admitted FY2021–25 | Freeze #2 widens (Cuba already in) | [S] |
| 2026-01-10 / 01-24 | Judge Talwani | TRO, then preliminary injunction blocking the FRP termination | CFRP only | [S] |
| Jan 2026 | USCIS data | CAA I-485: 7,086 receipts, **15 approvals** | Freeze visible in data | [S-reported] |
| 2026-03-05 | Plaintiffs | *Dorcas Int'l Inst. of R.I. v. USCIS* filed, D.R.I. 1:26-cv-00132 | — | [S] |
| 2026-03-30 | USCIS | Lifts asylum hold for screened applicants from *non*-high-risk countries | Not Cubans | [S-reported] |
| 2026-04-28 | WLRN / NPR | Cato study on "concerted targeting" of Cubans; a Maryland judge orders USCIS to process plaintiffs' green cards; NPR profiles professionals in limbo | Plaintiff-specific | [S-reported] |
| 2026-04-30 | Judge Julia Kobick (D. Mass.) | Holds the country hold unlawful for the plaintiffs before her | Plaintiff-specific | [S-reported] |
| 2026-05-22 | USCIS | PM-602-0199: adjustment of status as "extraordinary" discretion | Separate head-wind | [S] |
| **2026-06-05** | Chief Judge McConnell (D.R.I.) | ***Dorcas***: vacates PM-602-0192, PM-602-0194, PA-2025-26 and the asylum hold under the APA, nationwide | **Freeze #2 legally ends** | [S] |
| 2026-06-11 | D.R.I. | Final judgment; "immediately comply"; stay pending appeal denied | — | [S] |
| **2026-06-12** | USCIS | Alert *Court Order on Hold Policies*: policies "should be treated as if not in effect"; notice of appeal to 1st Cir. (No. 26-1703) | **Freeze #2 operationally ends** | [S] |
| ~2026-06-15 | USCIS | Reported resumption of green-card processing for the 39 countries while appealing | — | [S-reported] |
| mid-Jul 2026 | 1st Cir. | Reportedly denies a stay pending appeal (one Spanish source says the *re-review* policy was allowed to resume — conflicting) | — | open |
| 2026-07-16 | USCIS | Reportedly confirms, incl. in a letter to Rep. María Elvira Salazar, that processing for Cubans and Venezuelans has resumed | — | [S-reported] |
| Apr–Jun 2026 | USCIS data (FY26 Q3) | CAA I-485: 139 approvals, 447 denials, 586 completions; 342,360 pending at 2026-06-30 | Lowest quarter on record | [S-reported] |
| Jul 2026 | USCIS data | 308 CAA approvals; >355,000 pending | Slow restart | [S-reported] |
| **2026-08-24** | Judge Breyer (N.D. Cal.) | ***Red Eagle Law v. Edlow***: class certified; preliminary injunction; adjudicate "in the normal course"; USCIS alert *Recent Court Order on Hold Policies* | Second nationwide order | [S] |
| 2026-08-28 | N.D. Cal. | Remainder of *Red Eagle* stayed pending the *Dorcas* appeal; separately *Medani v. Trump* vacates PM-602-0193 (diversity-visa hold) | — | [S-reported] |
| 2026-08-25 | USCIS | PA-2026-10 reinstates neighborhood investigations for N-400 only | Not I-485 | [S] |
| 2026-10-05 | Plaintiffs | Suit filed (D. Mass.) against PM-602-0199 | — | [S-reported] |
| 2026-10-06 | USCIS data | FY2026 CAA median 11.8 months (through 2026-07-31) | — | [S-reported] |
| 2026-10 | Cuban press | USCIS "still not reactivating residencies at the expected pace"; some files still flagged "paused" | — | [S-reported] |

---

## 4. Freeze #1: the 2025-02-14 "Administrative Hold" memo

### 4.1 What the memo is

| Element | Finding | Label |
|---|---|---|
| Title | *Administrative Hold on All USCIS Benefit Requests Filed by Parolees Under U4U, CHNV or FRP* | [S] |
| Date / signer | 2025-02-14; Andrew Davidson, Acting Deputy Director (the "Davidson memo") | [S] |
| Operative language | "immediate USCIS-wide administrative hold on all pending benefit requests filed by aliens who are or were paroled under the U4U, CHNV, or FRP programs, pending fraud and security vetting" | [S] |
| Mechanism | Holds applied as flags in ELIS (USCIS's case system); officers not to take final action until the flag is cleared | [S]/[B] |
| Who | Anyone who *is or was* paroled under Uniting for Ukraine, the CHNV processes, or the Family Reunification Parole processes (Cuba, Haiti, Colombia, Ecuador, El Salvador, Guatemala, Honduras). "Was" matters: a Cuban whose two-year CHNV parole had already expired was still covered. | [S] |
| What | All pending benefit requests: reported as green cards (I-485), work permits (I-765), asylum (I-589), TPS (I-821), re-parole (I-131), and by its terms every other benefit form | [S] |
| Stated rationale | Fraud, public-safety and national-security vetting; referenced the January 2025 executive orders and a prior internal finding of sponsor fraud in the CHNV sponsor (I-134A) pool (DHS had paused CHNV travel authorizations in July–August 2024 over sponsor fraud) | [S] for "fraud and security vetting"; [B] for the EO and 2024-fraud references |
| End date | None ("pending" vetting, with no schedule) | [S] |
| Intake | Filing, receipting and fee collection continued; biometrics appointments apparently continued | [S]/[I] |
| Primary URL | https://www.uscis.gov/sites/default/files/document/foia/AdministrativeHoldonAllUSCISBenefitRequestsFiledbyParoleesUnderU4U_CHNVorFRP.pdf (FOIA reading room); mirror: https://ukrainetaskforce.org/wp-content/uploads/2025/03/USCIS-Parolee-Benefits-Pause-Memo-February-14-2025.pdf | [S] |

**Related memo (background):** a 2025-01-23 memo by Acting DHS Secretary Benjamine Huffman,
*Exercising Appropriate Discretion Under Parole Authority*, directed the pause of CHNV-style
categorical parole and the review of parolees; the Feb-14 USCIS memo is the agency-level
implementation on the benefits side. [B]

### 4.2 What it meant in practice for the reference case

A Cuban who filed Form I-485 (CAA) with Form I-765 category (c)(9) in March 2025 had the package
accepted and receipted, but both forms were flagged and **nothing could be approved or denied** until
the flag was lifted. Because the memo applied to anyone who "is or was" paroled, the fact that the
person's CHNV parole might lapse during the hold did not take them out of the hold. [S]/[I]

### 4.3 How the public learned of it

The memo was not announced; it became public through press reporting (CBS News, Camilo
Montoya-Galvez, about 2025-02-18/19) and then through the Justice Action Center litigation, which
attached it. Law-firm alerts in late February–March 2025 (Greenberg Traurig, Littler, Visa Lawyer
Blog, Ukraine Task Force) described its scope. [B] for the CBS date; [S] for the law-firm alerts.

---

## 5. *Svitlana Doe v. Noem* (D. Mass.) — the litigation that ended Freeze #1

**Caption and court.** *Svitlana Doe, et al. v. Kristi Noem, et al.*, No. 1:25-cv-10495-IT,
U.S. District Court for the District of Massachusetts, Judge Indira Talwani. PACER case id 281389.
Plaintiffs: parolees and U.S. sponsors across U4U, CHNV, FRP, OAW (Afghans), CAM and other
programs; counsel led by Justice Action Center and Human Rights First. Filed 2025-02-28. The
docket was later re-captioned *Doe v. Mullin* on CourtListener, which implies a change of DHS
Secretary in 2026 (unverified). [S] for case number, judge, counsel, re-caption; [B] for filing date.

### 5.1 The orders, in sequence

| Date | Docket / court | What was decided | Label |
|---|---|---|---|
| 2025-04-14 | Dkt. 97, D. Mass. | Granted in part the emergency motion (Dkt. 70) for a stay of DHS's "en masse truncation of all valid grants of CHNV parole"; stayed 90 FR 13611 "insofar as it revokes, without case-by-case review, the previously granted parole and work authorization" and stayed the individual myUSCIS termination notices; **certified a class** of "all individuals who have received a grant of parole under the CHNV programs" (minus voluntary departures and opt-outs) | [S] |
| 2025-05-05 | 1st Cir. | Denied the government's motion for a stay pending appeal | [S] |
| 2025-05-08 | SCOTUS 24A1079 | Solicitor General's emergency application for a stay | [S] |
| **2025-05-28** | **Dkt. 107, "Second Stay Order"** | **Stayed the 2025-02-14 memo "insofar as it suspended adjudications"** for U4U, FRP and CHNV parolees, covering (1) re-parole applications, (2) initial Military Parole in Place applications, and (3) benefit adjudications for parolees; **rejected** the government's proposal to lift the hold only case-by-case; **certified a nationwide class**; ordered a compliance report by 2025-06-09 | [S] |
| 2025-05-30 | SCOTUS 24A1079 | Granted the government's stay of the **April 14** order, without reasoning; Justice Jackson (joined by Justice Sotomayor) dissented: the Court "has plainly botched this assessment today"; the government "does not identify any specific national-security threat or foreign-policy problem that will result from respecting extant grants of CHNV parole while this case is pending"; the stay "immediately effectuate[s] the en masse truncation of all parole grants for approximately 500,000 current CHNV parole beneficiaries". **The May 28 benefits order was not before the Court and was not stayed.** | [S] |
| 2025-06-06 | USCIS alert | *Litigation-Related Update: Supreme Court stay of CHNV Preliminary Injunction* — DHS may terminate CHNV parole and revoke parole-based EADs | [S] |
| **2025-06-09** | USCIS memo (compliance) | Officers may adjudicate pending benefit requests of U4U/CHNV/FRP parolees "to a final agency action once USCIS has completed the additional vetting requirement"; initial-parole and I-134A requests remain on hold; the memo adds that "USCIS does not guarantee a prompt decision on a pending request from a special program parolee" | [S] |
| 2025-06-13 / 2025-07-28 | D. Mass. | Court-demanded compliance confirmation and a further status report | [S-reported] |
| 2025-06-16 | D. Mass. | Plaintiffs' motion for partial summary judgment on the CHNV termination | [S] |
| ~2025-06-19 / 06-25 | USCIS | All holds reported lifted in systems by June 19; additional held cases released ~June 25 | [S-reported] |
| 2025-06-30 | USCIS declaration | **8,855** benefit requests of these parolees adjudicated between 2025-05-28 and 2025-06-30 | [S] (Bloomberg Law) |
| late Jul 2025 | DOJ | Notice of appeal of the May 28 order "on the last possible day" | [S] |
| 2025-09-12 | 1st Cir. No. 25-1384 (Gelpí, J., with Kayatta and Montecalvo, JJ.) | Vacated the April 14 order and remanded: plaintiffs "did not demonstrate a strong likelihood of success in establishing that the INA requires termination of grants of parole under the CHNV program to occur on a case-by-case basis"; the case-by-case requirement "applies to granting parole, not to its termination"; DHS's explanation "was not so deficient as to be arbitrary and capricious". Because the SCOTUS stay was already in force there was "no change for CHNV parole beneficiaries". **Did not disturb the May 28 benefits order.** | [S] |
| **2025-11-04** | 1st Cir. | Government **voluntarily dismissed** its appeal of the May 28 orders — the benefits relief is final | [S] |
| 2025-11-10 | D. Mass. | Plaintiffs' renewed motion for partial summary judgment (statutory authority and due process) on the CHNV termination; **no ruling located as of 2026-10-20** | [S] / open |
| 2025-12-29 | D. Mass. | Plaintiffs' TRO motion against the FRP termination | [S] |
| 2026-01-10 | D. Mass. | 14-day TRO pausing FRP terminations | [S] |
| 2026-01-24 | D. Mass. | Preliminary injunction / stay blocking the FRP termination nationwide; FRP subclass; USCIS says it "disagrees" but "is complying" | [S] |
| 2026-03-16 | SCOTUS | A sibling agent found a single mention of *Mullin v. Doe* — certiorari before judgment granted and consolidated — possibly the CHNV-termination merits; **unverified and important** | open |

### 5.2 Why the May 28 order mattered more than the April 14 order for this app

- April 14 protected **parole status and the (c)(11) EAD**. It was stayed by the Supreme Court
  six weeks later and formally vacated in September. Net effect for a Cuban CHNV parolee: parole
  ended anyway in June 2025.
- May 28 protected **the right to a decision** on applications already filed (I-485, I-765, I-589,
  I-821, I-131). It was never stayed, never reversed, and the appeal was dropped. Net effect: the
  CAA I-485s filed in Feb–May 2025 came off hold in June 2025. **This is the order that un-froze the
  reference case's EAD.** [S]/[I]

### 5.3 Legal basis of the May 28 order (plain English)

The court treated the hold as final agency action reviewable under the Administrative Procedure
Act and found it likely **arbitrary and capricious / not in accordance with law**: the memo imposed
an indefinite, blanket suspension of adjudications without a reasoned explanation tied to the people
affected, and without statutory authority to refuse to decide applications at all; the government's
offer to release cases one by one did not cure that. Secondary summaries uniformly describe it as an
APA ruling, not a constitutional one. [S] for the characterization; [B] for the reasoning detail.

### 5.4 Links

- April 14 order (Dkt. 97): https://justiceactioncenter.org/wp-content/uploads/2025/04/0097-Order-Granting-Stay-of-CHNV-Revocations.pdf ; Justia docket entry: https://docs.justia.com/cases/federal/district-courts/massachusetts/madce/1:2025cv10495/281389/97
- **May 28 "Second Stay Order" (Dkt. 107):** https://justiceactioncenter.org/wp-content/uploads/2025/05/107-Second-Stay-Order.pdf
- JAC press release on May 28: https://justiceactioncenter.org/news/judge-orders-trump-administration-to-restore-processing-of-immigration-benefit-applications-for-humanitarian-parole-recipients-and-certifies-nationwide-class-to-ensure-all-impacted-individuals-are-pro/
- CBS News on May 28: https://www.cbsnews.com/news/judge-indira-talwani-directs-trump-officials-lift-pause-certain-immigration-applications/
- SCOTUS order and dissent (2025-05-30): https://www.supremecourt.gov/opinions/24pdf/24a1079_p86b.pdf ; SG application: https://www.supremecourt.gov/DocketPDF/24/24A1079/358354/20250508121118618_Kristi_Noem_v_Svitlana_Doe_et_al_%20application_stay.pdf
- First Circuit opinion (2025-09-12), No. 25-1384: https://law.justia.com/cases/federal/appellate-courts/ca1/25-1384/25-1384-2025-09-12.html ; docket: https://www.courtlistener.com/docket/69918063/doe-v-noem/
- District docket mirrors: https://www.courtlistener.com/docket/69695790/doe-v-noem/ ; https://clearinghouse.net/case/46186/ ; https://www.govinfo.gov/content/pkg/USCOURTS-mad-1_25-cv-10495/pdf/USCOURTS-mad-1_25-cv-10495-1.pdf ; RECAP sample: https://storage.courtlistener.com/recap/gov.uscourts.mad.281389/gov.uscourts.mad.281389.199.2.pdf
- Trackers: https://litigationtracker.justiceactioncenter.org/cases/svitlana-doe-v-noem-humanitarian-parole-district-court ; https://litigationtracker.justiceactioncenter.org/cases/svitlana-doe-v-noem-humanitarian-parole-court-appeals ; https://litigationtracker.justiceactioncenter.org/cases/noem-v-svitlana-doe-humanitarian-parole-supreme-court ; https://uscis-pause-tracker.com/cases/786112b9-99ff-4b65-a3d7-b59cdd1edc38
- USCIS alert (2025-06-06): https://www.uscis.gov/newsroom/alerts/litigation-related-update-supreme-court-stay-of-chnv-preliminary-injunction
- Compliance reporting: https://news.bloomberglaw.com/daily-labor-report/dhs-processes-thousands-of-immigration-benefits-after-order ; https://www.littler.com/news-analysis/asap/uscis-lifts-administrative-pause-immigration-applications-filed-uniting-ukraine ; https://sverdlofflaw.com/uscis-administrative-hold-on-benefit-requests-for-u4u-chnv-and-frp-parolees/ ; https://hackinglawpractice.com/uscis-resumes-u4u-application-processing-after-lawsuit-forces-action/

---

## 6. Resumption (June 2025) and what happened to the 2025 cohort before Freeze #2

| Question | Finding | Label |
|---|---|---|
| When did adjudication actually restart? | Memo 2025-06-09; flags cleared in ELIS by ~06-19, stragglers ~06-25; 8,855 parolee decisions by 06-30 | [S] |
| With what conditions? | "Additional vetting" before final action; no promise of speed ("USCIS does not guarantee a prompt decision …") | [S] |
| Did the CHNV *termination* affect pending CAA cases? | No. Termination ended parole and the (c)(11) EAD. The CAA asks whether the person *was* "inspected and admitted or paroled" and has one year of presence; practitioner guides say a lapsed or revoked parole does not defeat eligibility, and a pending I-485 keeps the applicant in a period of authorized stay. (See doc 02 for the law.) | [S] |
| How did the cohort fare, Jul–Nov 2025? | FY2025 CAA median 7.0 months; FY2025 Q4 median ≈ 9.1 months; ~10,432 CAA approvals in Apr–Jun 2025; many Mar/Apr-2025 filers received (c)(9) EADs in this window (reference case: Sept 2025) | [S-reported]/[I] |
| Was Freeze #1 ever re-imposed on parolees as such? | No evidence of a renewed *parolee* hold. What came next (Dec 2025) was a hold by **nationality**, which captured every Cuban regardless of parole history | [S]/[I] |
| New rules in this window that matter later | 2025-08-19 Policy Manual update adding "anti-American" views, antisemitism, social media and **parole history** as negative discretionary factors; 2025-10-30 end of automatic EAD extensions on renewal; Dec 2025 18-month cap on certain EAD validity | [S] |

**Why neighbours who filed at the same time got different EAD outcomes [I]:** a (c)(9) I-765 filed
in March/April 2025 sat under Freeze #1 for 2–4 months, then entered a vetting queue in June. Those
cleared by ~November 2025 received cards. Anyone whose I-765 was still pending on **2025-12-02** was
swept into Freeze #2 and did not see movement until June–August 2026, by which time the (c)(9) queue
itself had grown to a reported 12–13-month wait. The dividing line is not the filing date; it is
whether the vetting finished before December 2.

---

## 7. The travel-ban proclamations (June and December 2025)

### 7.1 Proclamation 10949 (signed 2025-06-04, effective 2025-06-09)

| Element | Finding | Label |
|---|---|---|
| Title | *Restricting the Entry of Foreign Nationals to Protect the United States from Foreign Terrorists and Other National Security and Public Safety Threats* | [B] |
| Citation | 90 FR 24497 (published 2025-06-09) | [B] |
| Full suspension (12) | Afghanistan, Burma, Chad, Republic of the Congo, Equatorial Guinea, Eritrea, Haiti, Iran, Libya, Somalia, Sudan, Yemen | [B] |
| Partial suspension (7) | Burundi, **Cuba**, Laos, Sierra Leone, Togo, Turkmenistan, Venezuela — entry suspended as **immigrants** and as B-1/B-2, F, M and J nonimmigrants; consular officers to shorten validity of other visas where lawful | [S] for Cuba's partial status; [B] for the visa classes |
| Stated reasons for Cuba | State sponsor of terrorism; insufficient law-enforcement information sharing; historical refusal to take back removable nationals; DHS overstay-report rates (B-1/B-2 ≈ 7.7 %, F/M/J ≈ 18.8 %) | [B] — confirm the exact percentages in the text |
| Key exceptions | Lawful permanent residents; existing valid visas (none revoked by the proclamation); dual nationals using a non-designated passport; diplomats; athletes for major events; immediate-relative immigrant visas with clear evidence of identity and relationship; adoptions; Afghan SIVs; U.S.-government-employee SIVs; persecuted minorities from Iran; case-by-case national-interest exceptions; and an express statement that nothing limits asylum, refugee, withholding-of-removal or CAT claims | [B] |
| Effect on USCIS adjudications of people **already in the U.S.** | **None by its own terms.** It governs entry and visa issuance. A Cuban with a pending CAA I-485 was not affected on 2025-06-09. Its practical significance is that it created the "high-risk country" list that USCIS adopted on 2025-12-02 for the adjudication hold, and that PA-2025-26 later told officers to weigh the proclamation's country findings as negative discretionary factors | [S]/[I] |
| Side effects for Cubans | Cuban relatives abroad lost access to most visitor and (non-immediate-relative) immigrant visas; travel on advance parole became riskier in practice | [B]/[I] |

### 7.2 Proclamation 10998 (signed 2025-12-16, effective 2026-01-01)

Expanded the restrictions to **39 countries** plus holders of Palestinian Authority travel
documents; Cuba remained on the *partial* list. CBP's carrier bulletin of 2025-12-30 implements it.
[S] for date, effective date, count and Cuba's status; [B] for the added-country names (not listed
here to avoid propagating an unverified list — see §13).

Links: https://www.presidency.ucsb.edu/documents/proclamation-10998-restricting-and-limiting-the-entry-foreign-nationals-protect-the ;
https://www.cbp.gov/sites/default/files/2026-01/CLP%20Bulletin%20-%20Restricting%20Entry%2020251230_2.pdf ;
university explainers: https://isss.brown.edu/traveling/current-travel-and-visa-restrictions-presidential-proclamation ;
https://isso.ucsf.edu/news/presidential-proclamation-expanded-travel-ban-december-17-2025 ;
https://internationalcenter.umich.edu/about/news/new-presidential-proclamation-revises-and-expands-travel-restrictions ;
https://www.nafsa.org/regulatory-information/proclamation-december-16-2025-travel-ban-effective-january-1-2026 ;
law-firm summaries: https://phillipslytle.com/trump-administration-expands-2025-travel-ban-to-include-restrictions-on-20-additional-countries/ ;
https://www.kolkocasey.com/39-country-travel-ban/ ;
https://www.theusimmigrationlawyer.com/the-2025-entry-restrictions-proclamation-which-countries-face-full-bans-and-what-exceptions-still-exist/

---

## 8. Freeze #2: the December 2025 / January 2026 "hold and review" by nationality

### 8.1 Trigger and announcement sequence

| Date | Event | Label |
|---|---|---|
| 2025-11-26 | Two West Virginia National Guard members are shot near the Farragut West Metro station in Washington, D.C.; one dies the next day. The suspect, Rahmanullah Lakanwal, is an Afghan national who entered in 2021 under Operation Allies Welcome and had been granted asylum in 2025 | [B] |
| 2025-11-27 | USCIS Director Joseph Edlow announces a "full-scale, rigorous re-examination of every green card for every alien from every country of concern" | [B] |
| 2025-11-28 | USCIS pauses all asylum decisions pending re-review of screening and vetting | [B] |
| **2025-12-02** | USCIS issues **PM-602-0192** and Policy Alert **PA-2025-26**; NPR reports the next day that the administration "halts immigration" from 19 nations | [S] |

### 8.2 PM-602-0192 (2025-12-02) — what it did

| Element | Finding | Label |
|---|---|---|
| Title | *Hold and Review of all Pending Asylum Applications and all USCIS Benefit Applications Filed by Aliens from High-Risk Countries* | [S] |
| Primary URL | https://www.uscis.gov/sites/default/files/document/policy-alerts/PM-602-0192-PendingApplicationsHighRiskCountries-20251202.pdf ; mirror: https://myattorneyusa.com/wp-content/uploads/2026/06/pm-602-0192.pdf | [S] |
| Who | Nationals of, **or persons born in**, the 19 countries listed in Proclamation 10949 — **Cuba included** — "regardless of date of entry" for the hold on pending cases | [S] |
| Hold on pending cases | All pending benefit requests. Forms explicitly reported: **I-485** (green card), **I-765** (work permit), **I-131** (travel/parole), **I-90** (green-card replacement), **N-400 / N-470** (naturalization), **I-751** (removal of conditions), **I-589** (asylum, via the Nov-28 hold). Later broadened to **I-129, I-539, I-140** and (re-stated) **I-765**. The memo did **not** import the proclamation's exceptions (e.g., immediate relatives, existing visa holders) | [S] |
| Re-review of past approvals | "Comprehensive re-review" of benefit requests **approved on or after 2021-01-20** for those nationals, including lawful-permanent-resident status, with possible interview or re-interview and, where warranted, rescission, referral or removal proceedings | [S] for scope; [B] for the consequences list |
| Companion policy | **PA-2025-26** — Policy Manual update directing officers to treat the proclamation's "country-specific factors" as negative factors in discretionary adjudications | [S] |
| How USCIS described it | "Hold and review"; "high-risk countries" / "countries of concern"; framed as vetting after the D.C. shooting and as undoing "lax" vetting of the prior administration; Edlow's public statements promised that no benefit would issue "until each alien is fully vetted" | [B] for quotes |
| Stated legal basis | EO 14161 (enhanced vetting) and Proclamation 10949 | [B] |

### 8.3 PM-602-0194 (dated 2026-01-01) and PM-602-0193

- **PM-602-0194** extended the hold and review to **all 39 countries** of Proclamations 10949 and
  10998 plus Palestinian Authority document holders, and ordered a review of **refugees admitted in
  FY2021–FY2025**. Cuba was already covered, so for Cubans this changed nothing except to confirm
  the policy was expanding, not winding down. [S]
- **PM-602-0193** was a separate hold on adjustment of status for **DV-2026 diversity-visa**
  selectees from the listed countries; it was vacated on 2026-08-28 in *Medani v. Trump* (N.D.
  Cal.). Not relevant to CAA cases. [S-reported]

Links: https://ogletree.com/insights-resources/blog-posts/uscis-pauses-benefit-requests-for-nationals-from-high-risk-countries-and-halts-asylum-adjudications/ ;
https://ogletree.com/insights-resources/blog-posts/uscis-broadens-scope-of-adjudication-hold-for-pending-benefit-requests-of-certain-foreign-nationals/ ;
https://shautsova.com/2026/01/11/uscis-shocks-immigration-community-with-january-1-2026-memo-pause-on-benefits-for-nationals-from-39-countries-and-review-of-refugees-admitted-2021-2025/ ;
https://www.aila.org/library/uscis-pm-halts-all-asylum-applications-and-all-benefit-applications-from-high-risk-countries ;
https://www.fredlaw.com/alert-alert-uscis-announces-immediate-hold-on-asylum-applications-and-immigration-benefits-for-foreign-nationals-of-19-high-risk-countries ;
https://www.dorsey.com/newsresources/publications/client-alerts/2025/12/uscis-benefit--applications ;
https://antone.com/summary-of-the-december-2-2025-uscis-policy-memorandum/ ;
https://kpmg.com/xx/en/our-insights/gms-flash-alert/flash-alert-2025-259.html ;
https://www.asianlawcaucus.org/news-resources/guides-reports/travel-ban-asylum-immigration-benefits ;
https://internationalcenter.umich.edu/about/news/uscis-pauses-adjudication-benefit-requests-citizens-19-countries ;
https://internationaloffice.berkeley.edu/news/hold-and-review-uscis-benefit-applications-filed-aliens-additional-high-risk-countries ;
https://isss.brown.edu/news/2026-02-01/uscis-processing-hold ;
https://npr.org/2025/12/03/g-s1-100218/trump-administration-halts-immigration-19-nations ;
https://www.clarkhill.com/news-events/news/uscis-announces-pause-on-benefits-adjudications-for-individuals-from-19-countries/ ;
https://phillipslytle.com/trump-administration-pauses-immigration-applications-from-19-countries-previously-subject-to-june-2025-travel-ban/

### 8.4 How many Cubans were affected

No source captured in this run gave an official count of affected *Cuban* applicants. The
best available proxies:

| Measure | Figure | Source | Label |
|---|---|---|---|
| CAA I-485s pending (all Cuban-adjustment cases, any entry channel) at 2026-06-30 | **342,360** ("more than 342,000") | USCIS FY2026 Q3 I-485 quarterly report, as reported by CiberCuba 2026-10-20 and Directorio Cubano | [S-reported] |
| CAA I-485s pending, July 2026 | > 355,000 | Periódico Cubano | [S-reported] |
| CAA I-485 activity in January 2026 (first full month of the hold) | 7,086 receipts, **15 approvals** | Factchequeado 2026-04-29 | [S-reported] |
| CAA approvals, April–June 2026 vs. same quarter 2024 | 139 vs. 49,965 (down 99.7 %) | CiberCuba / 14ymedio / UnoTV | [S-reported] |
| I-765 pending with I-485 pending (all nationalities), Q4 FY2024 → Q4 FY2025 | 154,469 → 373,007 (one report) or 461,884 (another) | Periódico Cubano; cubitanow | [S-reported, conflicting] |
| Cubans among the 39 nationalities | Cubans were widely described as the largest single group affected, and Cuban-American members of Congress (Rep. María Elvira Salazar and others) lobbied for a carve-out; USCIS's 2026-07-16 letter to Rep. Salazar confirming resumption for Cubans and Venezuelans is the clearest evidence of that pressure | [S-reported] for the letter; [B] for "largest group" |

An all-country total for the hold (press estimates ran from the hundreds of thousands to over a
million pending cases) was **not** captured from a citable source in this run; see §13.

### 8.5 Political and community reaction (for the alerts feed and UX copy)

- Cuban-community outlets (CiberCuba, Directorio Cubano, Cuba en Miami, Periódico Cubano, 14ymedio)
  covered the hold from the first week of December 2025 as a *suspensión de todos los trámites
  migratorios de cubanos*, including naturalizations, residencies and asylum. [S-reported]
- Rep. Salazar's office published a CHNV explainer and pressed DHS to protect paroled Cubans and
  Venezuelans; USCIS's July 2026 letter to her confirmed resumption. [S-reported]
  https://salazar.house.gov/media/press-releases/salazar-urges-department-homeland-security-protect-paroled-cubans-venezuelans ;
  https://salazar.house.gov/sites/evo-subsites/salazar.house.gov/files/evo-media-document/programa-parole-chnv.pdf
- WLRN (2026-04-28) reported a Cato Institute study finding "concerted targeting" of Cubans in
  arrests and green-card rejections. [S-reported] https://www.wlrn.org/light/immigration/2026-04-28/cubans-immigration-arrests-green-card-rejections
- NPR (2026-04-28) profiled professionals from travel-ban countries stuck in limbo. [S-reported]
  https://www.npr.org/2026/04/28/nx-s1-5775869/trump-travel-ban-pause-limbo-professionals

---

## 9. The lawsuits against Freeze #2 and the 2026 rulings

### 9.1 Case table

| # | Case | Court / judge / docket | Filed | Ruling(s) | Scope of relief | Appeal / status (2026-10-20) | Label |
|---|---|---|---|---|---|---|---|
| 1 | ***Dorcas International Institute of Rhode Island, et al. v. USCIS, Edlow, DHS*** | D.R.I., Chief Judge John J. McConnell Jr., **1:26-cv-00132-JJM-PAS** | 2026-03-05 | **2026-06-05**: **vacated** under the APA (5 U.S.C. § 706) four policies — PM-602-0192, PM-602-0194, PA-2025-26 (country-specific factors) and the asylum hold — holding that USCIS "does not have discretion to decline to adjudicate applications at all" and that a blanket, indefinite, nationality-based hold is arbitrary and capricious and exceeds statutory authority. **2026-06-11**: final judgment, "immediately comply"; stay pending appeal denied | **Nationwide**, because vacatur removes the policy itself rather than protecting only the plaintiffs | Government noticed appeal 2026-06-12, **1st Cir. No. 26-1703**; First Circuit reportedly denied a stay in mid-July 2026 (one Spanish-language report says the *re-review* policy was allowed to resume — unresolved conflict); merits appeal pending | [S] for dates, holding, vacatur, appeal number; open for the stay details |
| 2 | ***Red Eagle Law, L.C. v. Edlow*** | N.D. Cal., Judge Charles R. Breyer, **3:26-cv-04850-CRB** | 2026 (date not captured) | **2026-08-24**: class certified — natives/citizens of the 39 countries (and PA document holders) with pending applications subject to the hold, expressly including I-589, I-485 and "other USCIS applications"; **preliminary injunction** against PM-602-0192 and PM-602-0194; USCIS ordered to adjudicate class members' applications "in the normal course" (to decide, not to approve). **2026-08-28**: remainder of the case stayed pending the *Dorcas* appeal | **Nationwide class** — protects every Cuban applicant even if *Dorcas* is reversed, until the Ninth Circuit or the district court says otherwise | USCIS alert *Recent Court Order on Hold Policies* announced compliance; no appeal information captured | [S] |
| 3 | Case before **Judge Julia Kobick** (D. Mass.) — name not captured | D. Mass. | early 2026 | **2026-04-30**: the hold is unlawful as applied to the plaintiffs | Plaintiff-specific | unknown | [S-reported] (Phillips Lytle) |
| 4 | ***Doe v. Trump*** (266 plaintiffs) | court not captured | 2026 | Court ordered USCIS to lift the hold for the 266 named plaintiffs from the 39-country list | Plaintiff-specific | unknown | [S-reported] (Ilabaca Law) |
| 5 | Maryland case(s) — names not captured | D. Md. | 2026 | April 2026: USCIS ordered to resume processing green cards for a group of plaintiffs (WLRN); August 2026: processing ordered for 83 named plaintiffs | Plaintiff-specific | unknown | [S-reported] |
| 6 | ***Medani v. Trump*** | N.D. Cal. | 2026 | **2026-08-28**: vacated PM-602-0193 (DV-2026 adjustment hold) | DV applicants only | — | [S-reported] |

### 9.2 *Dorcas* in more detail (the ruling the owner most likely means)

- **Who sued.** Dorcas International Institute of Rhode Island is a refugee-resettlement and
  immigrant-services nonprofit in Providence; co-plaintiffs were individual applicants (details not
  captured). The organizational plaintiff explains why the case sits in Rhode Island rather than
  Miami. [S] for the plaintiff name; [B]/[I] for the rest.
- **What was challenged.** Four interlocking USCIS actions: the 2025-12-02 hold (PM-602-0192), the
  2026-01-01 expansion (PM-602-0194), the 2025-12-02 Policy Manual alert on country-specific
  discretionary factors (PA-2025-26), and the global asylum-decision hold of 2025-11-28. [S]
- **What the court held.** Under the APA the policies were set aside ("vacated") because (i) the INA
  and USCIS's own regulations require the agency to *adjudicate* properly filed applications — it
  may approve or deny, but it has no discretion to refuse to decide indefinitely; (ii) a categorical
  hold keyed only to nationality, with no individualized basis, no end date and no reasoned
  explanation, is arbitrary and capricious; and (iii) the policies exceeded USCIS's statutory
  authority. Summaries by the American Immigration Council, Fragomen, BAL, Ogletree, Cyrus Mehta,
  Reddy Neumann Brown and others agree on this characterization. **None describes a constitutional
  holding.** Whether the complaint also pleaded equal-protection (national-origin) and due-process
  claims, and whether the court reached them, is not captured — see §13. [S]/[I]
- **Vacatur vs. injunction.** The court chose vacatur — wiping the policies off the books — rather
  than an injunction limited to the plaintiffs. That is why USCIS's compliance alert said the
  policies "should be treated as if not in effect" for everyone, and why Cuban applicants in Florida
  benefited from a Rhode Island case. [S]
- **USCIS compliance.** Alert *Court Order on Hold Policies* (2026-06-12):
  https://www.uscis.gov/newsroom/alerts/court-order-on-hold-policies — USCIS said it would comply and
  restore normal adjudication while appealing; AILA: https://www.aila.org/library/uscis-announces-compliance-with-court-order-vacating-hold-policies ;
  practitioner confirmations: https://www.immigrationissues.com/uscis-confirms-it-will-comply-with-the-dorcas-vacatur-of-the-country-hold-policies/ ;
  https://www.gunster.com/newsroom/publications/uscis-announces-compliance-with-the-u-s-district-courts-decision-vacating-benefits-hold-policies-and-the-country-specific-factors-policy-for-firty-nine-39-trvel-ban-countries ;
  https://www.visalawyerblog.com/uscis-resumes-green-card-processing-for-nationals-from-39-countries-while-government-appeals-court-ruling/ ;
  https://www.ois.pitt.edu/june-18-2026-update-hold-and-review-policy
- **Analyses.** https://www.americanimmigrationcouncil.org/blog/court-blocks-uscis-immigration-pause-39-countries/ ;
  https://www.cbsnews.com/news/trump-legal-immigration-cases-judge-blocks/ ;
  https://blog.cyrusmehta.com/2026/06/dorcas-v-uscis-federal-court-reaffirms-that-uscis-must-adjudicate-not-stonewall-immigration-benefits.html ;
  https://www.bal.com/immigration-news/united-states-federal-court-rules-uscis-adjudication-hold-policies-unlawful/ ;
  https://www.fragomen.com/insights/united-states-federal-district-court-vacates-40-jurisdiction-adjudications-hold-and-related-policies.html ;
  https://ogletree.com/insights-resources/blog-posts/federal-court-vacates-uscis-benefits-hold-affecting-applicants-from-39-countries/ ;
  https://www.rnlawgroup.com/breaking-federal-court-strikes-down-uscis-adjudication-pause-for-travel-ban-countries/ ;
  https://www.harrisbeachmurtha.com/insights/federal-court-vacates-uscis-adjudication-pauses/ ;
  https://www.visaverge.com/uscis/chief-judge-john-j-mcconnell-jr-rules-dhs-broke-law-freezing-immigration-from-39-countries/ ;
  https://www.legal500.com/intelligence/united-states/immigration/federal-courts-vacate-uscis-policy-pausing-immigration-benefits-for-nationals-of-39-travel-ban-countries-and-the-100000-h-1b-fee ;
  https://www.francislawcenter.com/blog/2026/06/federal-court-blocks-uscis-immigration-freeze-for-39-countries/ ;
  https://manifestlaw.com/news/district-court-vacates-uscis-policies-06-08-2026 ;
  https://www.business-standard.com/immigration/us-court-blocks-trump-s-immigration-pause-for-39-countries-details-126060900656_1.html
- **Spanish-language coverage** (how the Cuban audience heard it): https://www.periodicocubano.com/cubanos-en-eeuu-reciben-alivio-tras-fallo-judicial-contra-pausa-de-uscis-de-que-se-trata/ ;
  https://www.directoriocubano.info/acontecer/juez-obliga-a-uscis-a-reactivar-residencias-bloqueadas-por-veto-migratorio-de-trump/ ;
  https://www.directoriocubano.info/acontecer/politicas-uscis-tramites-cubanos-39-paises/ ;
  https://www.cuballama.com/noticias/juez-ordena-a-uscis-procesar-residencias-permanentes-en-pausa/ ;
  https://latinopinionbaltimore.com/uscis-reanuda-migratorios-cubanos-venezolanos/ ;
  https://www.cubanoticias360.com/uscis-reanuda-procesos-de-ciudadania-para-cubanos-y-venezolanos/

### 9.3 *Red Eagle Law v. Edlow* in more detail

- **Nature of the plaintiff.** Red Eagle Law, L.C. is a law firm suing on behalf of its clients
  (Courthouse News framed the order around stalled work-permit applications). [S-reported]/[I]
- **Class definition (as reported).** Natives or citizens of the 39 countries named in
  Proclamations 10949 and 10998, and holders of Palestinian Authority documents, whose applications
  were subjected to PM-602-0192 or PM-602-0194 — covering pending I-589, I-485 and other USCIS
  applications. A Cuban CHNV parolee with a CAA I-485 pending on or after 2025-12-02 is a class
  member. [S]/[I]
- **Relief.** Preliminary injunction: USCIS must adjudicate class members' applications "in the
  normal course" — the order compels decisions, not approvals, and sets no deadline. [S]
- **Why it matters even though *Dorcas* already vacated the memos.** If the First Circuit reverses
  *Dorcas*, the memos would spring back — except that the *Red Eagle* injunction independently
  forbids applying them to class members. On 2026-08-28 Judge Breyer stayed the rest of the case to
  await the *Dorcas* appeal, keeping the injunction in place. [S]/[I]
- **USCIS compliance.** Alert *Recent Court Order on Hold Policies*:
  https://www.uscis.gov/newsroom/alerts/recent-court-order-on-hold-policies ; AILA items:
  https://www.aila.org/library/district-court-issues-preliminary-injunction-to-lift-adjudication-hold-for-travel-ban-countries ;
  https://www.aila.org/library/uscis-announces-compliance-with-preliminary-injunction-to-lift-adjudication-hold-for-travel-ban-countries
- **Coverage.** https://www.courthousenews.com/citizenship-and-immigration-services-ordered-to-resume-processing-work-permit-applications/ ;
  https://www.visaverge.com/uscis/red-eagle-class-covers-pending-i-589-i-485-and-other-uscis-applications/ ;
  https://news.clinchlaw.com/en/article/federal-court-certifies-class-and-blocks-uscis-hold-and-review-policies-affectin-mthwklkh ;
  https://www.agarwalimmigration.com/insights/court-blocks-uscis-adjudication-freeze-for-travel-ban-countries ;
  https://www.sharmalawassociates.com/blog/red-eagle-class-certification-adjudication-holds ;
  https://mwlawllc.com/uscis-adjudication-holds-court-order-2026/ ;
  https://www.path2immigration.com/blog/court-lifts-uscis-adjudication-holds-2026/ ;
  https://www.latintimes.com/federal-court-orders-uscis-resume-stalled-green-card-work-permit-applications-598968 ;
  https://uscis-pause-tracker.com/cases/f9143399-ca53-41e2-8a65-c44e9174f6a3

### 9.4 Was any of this "unconstitutional"?

| Ruling | Legal ground as reported | Constitutional holding? |
|---|---|---|
| Talwani, 2025-05-28 (*Doe v. Noem*) | APA — unexplained, indefinite blanket hold; no authority to refuse to adjudicate | No (plaintiffs pleaded due process on the termination claims, which remain pending) [S]/[B] |
| McConnell, 2026-06-05 (*Dorcas*) | APA — arbitrary and capricious; contrary to law; in excess of statutory authority; vacatur | No, per every summary captured [S] |
| Breyer, 2026-08-24 (*Red Eagle*) | APA / INA duty to adjudicate; class-wide preliminary injunction | No, per summaries captured [S] |
| Kobick, 2026-04-30; *Doe v. Trump*; Maryland orders | "Unlawful" (statutory) per the only summaries captured | Unknown — open |

**Bottom line [I]:** the freeze was "undone" because courts found it **unlawful under the
Administrative Procedure Act and the INA**, not because a court held it violated the Constitution.
The distinction matters for the app's wording and for risk: an APA vacatur can be reversed on
appeal or mooted by a re-issued, better-explained policy, whereas a constitutional ruling would be
harder to work around. The First Circuit appeal (No. 26-1703) is therefore the key alert.

---

## 10. Status on 2026-10-20 for a Cuban CHNV parolee with a CAA I-485 filed March/April 2025

### 10.1 Direct answers

| Question | Answer | Label |
|---|---|---|
| Is the case legally adjudicable today? | **Yes.** No parolee hold (lifted 2025-05-28/06-09, final 2025-11-04) and no nationality hold (vacated 2026-06-05/11, compliance 2026-06-12; class injunction 2026-08-24) is in force. | [S] |
| Is there a court order requiring USCIS to clear the backlog by a date? | **No.** *Dorcas* vacated the policies and ordered immediate compliance; *Red Eagle* requires adjudication "in the normal course". Neither sets deadlines or throughput targets. The 2025 Talwani order required compliance *reports*, not deadlines. | [S]/[I] |
| Are (c)(9) EADs being issued? | Yes, but slowly: attorneys reported waits of up to 13 months in June 2026 and 12–12.5 months in October 2026; the I-765-with-I-485 inventory roughly doubled or tripled between Q4 FY2024 and Q4 FY2025. Renewals filed on/after 2025-10-30 get no automatic extension, and some new cards are capped at 18 months. | [S-reported] |
| Are CAA I-485s being decided? | Yes, at a trickle: 15 approvals in Jan 2026; 139 approvals / 447 denials in Apr–Jun 2026; 308 approvals in Jul 2026; attorneys report Cuban parolees receiving decisions in Sept–Oct 2026; Cuban outlets say reactivation is slower than expected and some files still show "paused" flags. | [S-reported] |
| What is the official processing time? | USCIS historical national median for CAA I-485: 3.3 months (FY2023) → 4.6 (FY2024) → 7.0 (FY2025) → **11.8 (FY2026 through 2026-07-31)**. Medians are of *completed* cases, so during a freeze they understate the wait of the pending pool. | [S-reported] |
| Is the re-review of already-issued green cards still happening? | The re-review policy was vacated with the rest; one Spanish-language report claims the First Circuit let it resume pending appeal — unconfirmed. Treat as "possible". | open |
| What else could slow the case? | PM-602-0199 (2026-05-22) framing adjustment as "extraordinary" discretion and driving in-person interviews; attorneys and a reported August 2026 D. Mass. observation say it does not govern CAA adjustment (which is not INA § 245 adjustment), but field-office practice varies; new I-485 edition mandatory from 2026-09-18; social-media-handle collection; the 2025-08-19 "parole history" negative-factor guidance. | [S-reported]/[I] |

### 10.2 "Adjudicable days" for the reference case [I]

Elapsed time from a 2025-03-15 filing to 2026-10-20 is **584 days**. Subtract Freeze #1
(2025-03-15 → 2025-06-09, 86 days) and Freeze #2 (2025-12-02 → 2026-06-12, 192 days) and the case
has had only **≈ 306 adjudicable days (≈ 10 months)** — roughly the FY2026 median of 11.8 months,
and right at the front of a queue of ~340,000–355,000 pending cases. Which is to say: the case is
not anomalous; it is exactly where the policy history predicts. Doc 07 §11 turns this into a
decision-window estimate.

### 10.3 What to tell users (plain Spanish/English copy, not legal advice)

- *Su caso no está "congelado" por ley desde el 12 de junio de 2026; USCIS tiene la obligación de
  decidirlo, pero no hay plazo judicial.* / Your case is no longer legally frozen as of
  2026-06-12; USCIS must decide it, but no court has set a deadline.
- *La apelación del gobierno (Primer Circuito, No. 26-1703) podría revivir la pausa; la orden de
  clase de California (Red Eagle) protege mientras tanto.* / The government's appeal could revive
  the pause; the California class order protects you in the meantime.
- Keep the I-797C receipt; file (c)(9) renewals ≥ 180 days before expiry (no automatic extension);
  do not travel without advance parole; expect an interview.

---

## 11. Which ruling is "the freeze got undone because it was found unconstitutional"?

Ranked by fit with the owner's description ("recently", "undone", "unconstitutional", about a
Cuban CHNV parolee's CAA case):

1. ***Dorcas Int'l Inst. of R.I. v. USCIS* (D.R.I., 2026-06-05 / 06-11; USCIS compliance
   2026-06-12).** Most recent nationwide un-freezing that specifically covered Cubans; reported in
   Spanish as the judge *anulando* / *obligando a USCIS a reactivar las residencias bloqueadas por
   el veto migratorio*. Legal ground: APA, not the Constitution. **Best match.** [S]/[I]
2. ***Red Eagle Law v. Edlow* (N.D. Cal., 2026-08-24).** Even more recent, class-wide, same
   subject. Often reported together with *Dorcas* as "the court blocked the freeze". APA. [S]/[I]
3. ***Doe v. Noem* May 28, 2025 (D. Mass.).** The order that actually un-froze *this* cohort's
   first hold and produced the September-2025 EAD; older, CHNV-specific, APA. [S]/[I]

Docket and opinion links for all three are in §5.4, §9.2 and §9.3; the consolidated table is in §12.

---

## 12. Dockets and documents the app should track

| Item | Identifier | Primary link(s) |
|---|---|---|
| Feb-14-2025 parolee hold memo | USCIS FOIA reading room | https://www.uscis.gov/sites/default/files/document/foia/AdministrativeHoldonAllUSCISBenefitRequestsFiledbyParoleesUnderU4U_CHNVorFRP.pdf |
| *Doe v. Noem* district docket | D. Mass. 1:25-cv-10495-IT (PACER 281389) | https://www.courtlistener.com/docket/69695790/doe-v-noem/ ; https://clearinghouse.net/case/46186/ ; https://docs.justia.com/cases/federal/district-courts/massachusetts/madce/1:2025cv10495/281389/97 |
| May 28, 2025 order | Dkt. 107 | https://justiceactioncenter.org/wp-content/uploads/2025/05/107-Second-Stay-Order.pdf |
| SCOTUS stay | No. 24A1079 (2025-05-30) | https://www.supremecourt.gov/opinions/24pdf/24a1079_p86b.pdf ; https://www.law.cornell.edu/supremecourt/text/24A1079 |
| First Circuit opinion | No. 25-1384 (2025-09-12) | https://law.justia.com/cases/federal/appellate-courts/ca1/25-1384/25-1384-2025-09-12.html ; https://www.courtlistener.com/docket/69918063/doe-v-noem/ |
| Proclamation 10949 | 90 FR 24497 (2025-06-09) | https://www.federalregister.gov/ (search "Proclamation 10949"); https://www.whitehouse.gov/presidential-actions/ |
| Proclamation 10998 | signed 2025-12-16 | https://www.presidency.ucsb.edu/documents/proclamation-10998-restricting-and-limiting-the-entry-foreign-nationals-protect-the |
| PM-602-0192 | 2025-12-02 | https://www.uscis.gov/sites/default/files/document/policy-alerts/PM-602-0192-PendingApplicationsHighRiskCountries-20251202.pdf |
| PM-602-0194 / PA-2025-26 / PM-602-0199 | 2026-01-01 / 2025-12-02 / 2026-05-22 | https://www.uscis.gov/laws-and-policy/policy-memoranda (listing page) |
| *Dorcas* docket | D.R.I. 1:26-cv-00132-JJM-PAS | CourtListener: `https://www.courtlistener.com/api/rest/v4/dockets/?court=rid&docket_number=1:26-cv-00132` |
| *Dorcas* appeal | 1st Cir. No. 26-1703 | `https://www.courtlistener.com/?q=%22Dorcas%22&type=r&court=ca1` |
| *Red Eagle* docket | N.D. Cal. 3:26-cv-04850-CRB | `https://www.courtlistener.com/api/rest/v4/dockets/?court=cand&docket_number=3:26-cv-04850` |
| USCIS compliance alerts | 2026-06-12 and 2026-08 | https://www.uscis.gov/newsroom/alerts/court-order-on-hold-policies ; https://www.uscis.gov/newsroom/alerts/recent-court-order-on-hold-policies |
| Third-party trackers | — | https://uscis-pause-tracker.com/ ; https://litigationtracker.justiceactioncenter.org/ ; https://immpolicytracking.org/ |

---

## 13. Verification ledger and open questions (priority order, with the exact probe)

**Seen in snippets this run [S]:** every date in §3 marked [S]; Feb-14 memo title, signer, quoted
operative language and URL; *Doe v. Noem* docket number, judge, Dkt. 97/107 contents, 8,855 figure,
appeal dismissal 2025-11-04, 1st Cir. 25-1384 holding, SCOTUS 24A1079 and dissent quotes; PP 10949
date and Cuba's partial status; PP 10998 date, 39 countries, Cuba partial; PM-602-0192 title, date,
Cuba inclusion, forms list, re-review from 2021-01-20, "nationals or born in"; PM-602-0194 date and
scope; *Dorcas* docket, judge, filing date, 2026-06-05 vacatur of four policies, final judgment
2026-06-11, USCIS alert 2026-06-12, appeal 26-1703; *Red Eagle* docket, judge, 2026-08-24 class
PI, 2026-08-28 stay; Kobick 2026-04-30; *Doe v. Trump* 266 plaintiffs; Maryland orders; *Medani*;
CAA statistics (15; 139/447; 308; 342,360; 11.8 months); EAD waits; Salazar letter 2026-07-16.

**Background, not re-verified [B]:** CBS publication date; Huffman memo; PP 10949 visa classes,
Cuba rationale and overstay percentages, exception list; Nov 26–28, 2025 sequence and Edlow quotes;
PM-602-0192 legal citations and consequences of re-review; which other forms (I-130, N-600) were
covered; the reasoning detail of the Talwani and McConnell opinions.

**Open questions — check these first:**

1. **Did any court hold the pauses *unconstitutional*?** Read the *Dorcas* opinion (D.R.I.
   1:26-cv-00132, 2026-06-05) and the *Red Eagle* order (N.D. Cal. 3:26-cv-04850, 2026-08-24) on
   CourtListener/RECAP; search for "Equal Protection", "Fifth Amendment", "national origin". Also
   identify the Kobick (D. Mass., 2026-04-30), *Doe v. Trump* and Maryland cases by name.
2. **First Circuit No. 26-1703:** was a stay pending appeal denied (and when)? Was the *re-review*
   policy allowed to resume? Briefing/argument schedule? `https://www.courtlistener.com/?type=r&court=ca1&q=26-1703`
   and https://www.uscis.gov/newsroom/alerts/court-order-on-hold-policies (watch for updates).
3. **Exact text and scope of PM-602-0192 / PM-602-0194**: full form list, treatment of
   "born in" vs. "national of", any exceptions, and the re-review procedure. URL in §12.
4. **Official count of affected applicants** (all countries and Cuba) — look for USCIS declarations
   in the *Dorcas* and *Red Eagle* dockets and for DHS statements in Dec 2025 press coverage
   (NPR 2025-12-03; CBS; Reuters; Miami Herald).
5. ***Mullin v. Doe* (SCOTUS, cert before judgment reportedly granted 2026-03-16)** — confirm
   existence, question presented, and whether it concerns CHNV termination; a merits decision would
   change the alerts feed. https://www.supremecourt.gov/search.aspx?filename=/docket/docketfiles/html/public/25-XXXX.html (search "Doe" + "Mullin").
6. **Status of the renewed summary-judgment motion (2025-11-10) in *Doe v. Noem*** and any 2026
   order on CHNV termination merits. https://clearinghouse.net/case/46186/
7. **The June 9, 2025 USCIS compliance memo**: signer (reported as Acting Deputy Director Angelica
   Alfonso-Royals), exact text of the "additional vetting" condition, and the 2025-07-28 status
   report with cumulative adjudication counts (a hard "post-freeze catch-up rate" for the model).
8. **PP 10949 Cuba section**: confirm the overstay percentages and the exact visa classes; PP 10998:
   confirm the full 39-country list and that Cuba stayed partial. https://www.federalregister.gov/presidential-documents/proclamations
9. **Does PM-602-0199 (2026-05-22) apply to CAA adjustment?** Read the memo and the 2026-10-05
   D. Mass. complaint. https://www.aila.org/library/featured-issue-new-policy-on-adjustment-of-status-as-act-of-extraordinary-discretion
10. **Was the Feb-14-2025 hold applied to CBP One ("DT") parolees as well?** Many Cubans entered
    that way; the memo's text names U4U/CHNV/FRP only.
11. **USCIS FY2026 Q3 I-485 report**: confirm 139/447/342,360 and the CAA row definition (does
    "pending" include cases awaiting interview?). https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data
12. **Neighborhood investigations (PA-2026-10)** — confirm they are N-400-only and not extended to
    I-485 interviews. https://www.aila.org/library/uscis-policy-alert-on-investigations-and-examinations-for-naturalization-eligibility
13. **Spanish-language primary coverage of the Dec-2025 hold** (CiberCuba, 14ymedio, Diario de Cuba,
    el Nuevo Herald, Telemundo 51, Univision Miami, Dec 2–10 2025) for the exact phrasing used with
    this audience and any Cuban-specific numbers quoted by attorneys.

---

## 14. Implications for the app (design, data pipeline, estimator)

1. **Model policy regimes, not one processing time.** Hard-code these windows as time-varying
   covariates and expose them in the UI as a "what happened to your case" strip:
   - R0 "normal": filing → 2025-02-13 (CAA median 3–5 months);
   - **R1 parolee hold: 2025-02-14 → 2025-06-09** (applies only to CHNV/U4U/FRP parolees; use
     2025-06-19 as the operational end for sensitivity);
   - R2 catch-up with vetting: 2025-06-09 → 2025-12-01;
   - **R3 country hold: 2025-12-02 → 2026-06-12** (applies to every Cuban national; use
     2026-08-24 as the alternative end for cases not visibly moving);
   - R4 post-vacatur restart under PM-602-0199 and appeal risk: 2026-06-12 → present.
   Use *adjudicable days* (calendar days minus R1 and R3 days for the applicable population) as
   the age regressor; the reference case has ≈ 306 adjudicable days, not 584 calendar days.
2. **Two populations, two hold rules.** R1 keyed on *parole program* (ask: CHNV? CBP One? FRP?
   other?); R3 keyed on *nationality* (all Cubans). A Cuban who entered on a visa was hit by R3
   only; a Haitian CHNV parolee was hit by both; a Cuban CHNV parolee was hit by both.
3. **Milestone semantics.** EAD milestone = (c)(9) card, not the revoked (c)(11); a June-2025
   parole-termination notice is not a negative signal for the I-485; "interview scheduled" is an
   R4 signal. Collect: receipt, biometrics, (c)(9) approval, interview notice, interview, RFE/NOID,
   decision, and "parole terminated notice (June 2025)".
4. **Approval probability as a first-class output.** Headline approval rates collapsed (97 % → 24 %)
   mainly because eligible parolee cases were frozen while clear denials were issued; show both
   "when" and "whether", with the selection caveat, and re-estimate once FY2026 Q4 / FY2027 Q1 data
   arrive (≈ Jan and Apr 2027).
5. **Alerts feed, ranked by impact:** (a) 1st Cir. No. 26-1703 (*Dorcas* appeal — a reversal is the
   biggest downside); (b) N.D. Cal. 3:26-cv-04850 (*Red Eagle*) and any Ninth Circuit activity;
   (c) USCIS newsroom "litigation-related update" and "court order" alerts; (d) USCIS Policy
   Memoranda page (new PM-602-xxxx); (e) Federal Register presidential documents (new
   proclamations change the country list); (f) D. Mass. 1:25-cv-10495 (*Doe v. Noem*) and the
   PM-602-0199 suit; (g) Cuban outlets (CiberCuba, Directorio Cubano, Cuba en Miami, Periódico
   Cubano, 14ymedio) as a same-day leading indicator.
6. **Honest copy about the law.** The freezes were ended under the APA, not the Constitution; say
   "a federal court struck down (vacated) the pause" and link the order. Avoid "unconstitutional".
7. **EAD-renewal logic.** Compute expiry from issue date (18-month cap on some cards since Dec
   2025), warn at 180 days, and state that renewals filed on/after 2025-10-30 do not auto-extend.
8. **Data vintage labels.** Every official number (median 11.8 months; 342,360 pending) must carry
   its as-of date and a note that medians are of completed cases.

---

## 15. Sources (every URL used; all accessed 2026-10-20 via sibling-agent search snippets unless marked [B])

**Primary / government**
- USCIS memo 2025-02-14, *Administrative Hold on All USCIS Benefit Requests Filed by Parolees Under U4U, CHNV or FRP*: https://www.uscis.gov/sites/default/files/document/foia/AdministrativeHoldonAllUSCISBenefitRequestsFiledbyParoleesUnderU4U_CHNVorFRP.pdf ; mirror https://ukrainetaskforce.org/wp-content/uploads/2025/03/USCIS-Parolee-Benefits-Pause-Memo-February-14-2025.pdf
- USCIS alert 2025-06-06, *Litigation-Related Update: Supreme Court stay of CHNV Preliminary Injunction*: https://www.uscis.gov/newsroom/alerts/litigation-related-update-supreme-court-stay-of-chnv-preliminary-injunction
- USCIS PM-602-0192 (2025-12-02): https://www.uscis.gov/sites/default/files/document/policy-alerts/PM-602-0192-PendingApplicationsHighRiskCountries-20251202.pdf ; mirror https://myattorneyusa.com/wp-content/uploads/2026/06/pm-602-0192.pdf
- USCIS policy memoranda listing: https://www.uscis.gov/laws-and-policy/policy-memoranda
- USCIS alert *Court Order on Hold Policies* (2026-06-12): https://www.uscis.gov/newsroom/alerts/court-order-on-hold-policies
- USCIS alert *Recent Court Order on Hold Policies* (Aug 2026): https://www.uscis.gov/newsroom/alerts/recent-court-order-on-hold-policies
- USCIS alert on FRP termination (2025-12-15): https://www.uscis.gov/newsroom/alerts/dhs-ends-the-abuse-of-the-humanitarian-parole-process-and-terminates-family-reunification-parole
- USCIS Cuban FRP page (compliance statement, Jan 2026): https://www.uscis.gov/humanitarian/humanitarian-parole/the-cuban-family-reunification-parole-program
- USCIS Immigration and Citizenship Data (I-485 quarterly reports): https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data
- DHS press release 2025-06-12 (CHNV termination notices): https://www.dhs.gov/news/2025/06/12/dhs-issues-notices-termination-chnv-parole-program-encourages-parolees-self-deport
- Federal Register, CHNV termination 90 FR 13611 (2025-03-25): https://www.federalregister.gov/documents/2025/03/25/2025-05128/termination-of-parole-processes-for-cubans-haitians-nicaraguans-and-venezuelans
- Federal Register, FRP termination (2025-12-15): https://www.federalregister.gov/documents/2025/12/15/2025-22744/termination-of-family-reunification-parole-processes-for-colombians-cubans-ecuadorians-guatemalans
- Proclamation 10998 text: https://www.presidency.ucsb.edu/documents/proclamation-10998-restricting-and-limiting-the-entry-foreign-nationals-protect-the ; CBP bulletin: https://www.cbp.gov/sites/default/files/2026-01/CLP%20Bulletin%20-%20Restricting%20Entry%2020251230_2.pdf
- EO 14165: https://www.presidency.ucsb.edu/documents/executive-order-14165-securing-our-borders
- Supreme Court, *Noem v. Doe* 24A1079 order/dissent: https://www.supremecourt.gov/opinions/24pdf/24a1079_p86b.pdf ; application: https://www.supremecourt.gov/DocketPDF/24/24A1079/358354/20250508121118618_Kristi_Noem_v_Svitlana_Doe_et_al_%20application_stay.pdf ; LII: https://www.law.cornell.edu/supremecourt/text/24A1079
- First Circuit, *Doe v. Noem* No. 25-1384: https://law.justia.com/cases/federal/appellate-courts/ca1/25-1384/25-1384-2025-09-12.html ; https://www.courtlistener.com/docket/69918063/doe-v-noem/ ; opinion PDF: https://justiceactioncenter.org/wp-content/uploads/2025/09/ca1-ca1-2025-01384-OPINION-issued-by-Gustavo-A.-GelpA%C2%AD-Jr.-Appellate-Judge-William-J.-Kayatta-Jr.-Appellate-Judge-a-09-12-2025.pdf
- D. Mass. *Doe v. Noem* 1:25-cv-10495: https://docs.justia.com/cases/federal/district-courts/massachusetts/madce/1:2025cv10495/281389/97 ; https://www.courtlistener.com/docket/69695790/doe-v-noem/ ; https://clearinghouse.net/case/46186/ ; https://www.govinfo.gov/content/pkg/USCOURTS-mad-1_25-cv-10495/pdf/USCOURTS-mad-1_25-cv-10495-1.pdf ; https://storage.courtlistener.com/recap/gov.uscourts.mad.281389/gov.uscourts.mad.281389.199.2.pdf ; https://caselaw.findlaw.com/court/us-dis-crt-d-mas/117165902.html
- April 14 order: https://justiceactioncenter.org/wp-content/uploads/2025/04/0097-Order-Granting-Stay-of-CHNV-Revocations.pdf ; May 28 order: https://justiceactioncenter.org/wp-content/uploads/2025/05/107-Second-Stay-Order.pdf ; TRO motion 2025-12-29: https://iptp-production.s3.amazonaws.com/media/documents/2025.12.29_Motion_for_TRO_-_Doe_v._Noem.pdf
- Rep. Salazar: https://salazar.house.gov/media/press-releases/salazar-urges-department-homeland-security-protect-paroled-cubans-venezuelans ; https://salazar.house.gov/sites/evo-subsites/salazar.house.gov/files/evo-media-document/programa-parole-chnv.pdf

**Litigation trackers and advocacy**
- Justice Action Center: https://justiceactioncenter.org/case/svitlana-doe-v-noem/ ; https://justiceactioncenter.org/svitlana-doe-v-noem-class-action/ ; https://justiceactioncenter.org/news/judge-orders-trump-administration-to-restore-processing-of-immigration-benefit-applications-for-humanitarian-parole-recipients-and-certifies-nationwide-class-to-ensure-all-impacted-individuals-are-pro/ ; https://justiceactioncenter.org/news/supreme-court-allows-trump-administration-to-circumvent-district-courts-ruling-and-strip-lawful-immigration-status-from-nearly-500000-people/ ; https://justiceactioncenter.org/news/u-s-appeals-court-greenlights-trumps-mass-revocation-of-lawful-status-and-work-authorization-from-hundreds-of-thousands-of-parole-beneficiaries/ ; trackers: https://litigationtracker.justiceactioncenter.org/cases/svitlana-doe-v-noem-humanitarian-parole-district-court ; https://litigationtracker.justiceactioncenter.org/cases/svitlana-doe-v-noem-humanitarian-parole-court-appeals ; https://litigationtracker.justiceactioncenter.org/cases/noem-v-svitlana-doe-humanitarian-parole-supreme-court
- Human Rights First: https://humanrightsfirst.org/svitlana-doe-v-noem/
- PressUnpause USCIS Adjudication Pause Tracker: https://uscis-pause-tracker.com/ ; https://uscis-pause-tracker.com/cases/786112b9-99ff-4b65-a3d7-b59cdd1edc38 ; https://uscis-pause-tracker.com/cases/f9143399-ca53-41e2-8a65-c44e9174f6a3
- American Immigration Council: https://www.americanimmigrationcouncil.org/blog/court-blocks-uscis-immigration-pause-39-countries/ ; https://www.americanimmigrationcouncil.org/blog/trump-terminates-chnv-program-impacting-more-than-half-million-migrants/ ; https://www.americanimmigrationcouncil.org/blog/uscis-backlog-grows-less-immigration-filings/
- AILA: https://www.aila.org/library/uscis-litigation-related-update-supreme-court-stay-of-chnv-preliminary-injunction ; https://www.aila.org/library/uscis-provides-litigation-related-update-on-chnv ; https://www.aila.org/library/dhs-notice-terminating-chnv-parole-processes ; https://www.aila.org/library/dhs-announcement-on-issuing-notices-of-termination-for-the-chnv-parole-program ; https://www.aila.org/library/uscis-pm-halts-all-asylum-applications-and-all-benefit-applications-from-high-risk-countries ; https://www.aila.org/library/uscis-announces-compliance-with-court-order-vacating-hold-policies ; https://www.aila.org/library/district-court-issues-preliminary-injunction-to-lift-adjudication-hold-for-travel-ban-countries ; https://www.aila.org/library/uscis-announces-compliance-with-preliminary-injunction-to-lift-adjudication-hold-for-travel-ban-countries ; https://www.aila.org/library/featured-issue-new-policy-on-adjustment-of-status-as-act-of-extraordinary-discretion ; https://www.aila.org/library/uscis-policy-alert-on-investigations-and-examinations-for-naturalization-eligibility
- CLINIC: https://www.cliniclegal.org/resources/parole/chnv-parole-terminations-paused-district-court ; https://www.cliniclegal.org/resources/removal-proceedings/updates-chnv-parole-terminations-and-federal-litigation ; https://www.cliniclegal.org/resources/clinic-field-alert-informational-uscis-policy-memorandum-adjustment-status-052226
- Asian Law Caucus: https://www.asianlawcaucus.org/news-resources/guides-reports/travel-ban-asylum-immigration-benefits ; NAFSA: https://www.nafsa.org/regulatory-information/curtailment-humanitarian-immigration-benefits ; https://www.nafsa.org/regulatory-information/proclamation-december-16-2025-travel-ban-effective-january-1-2026
- Immigration Policy Tracking Project: https://immpolicytracking.org/policies/proclamation-restricting-and-limiting-the-entry-of-foreign-nationals-to-protect-the-security-of-the-united-states/ ; https://immpolicytracking.org/policies/uscis-terminates-family-reunification-parole-processes-for-colombians-cubans-ecuadorians-guatemalans-haitians-hondurans-and-salvadorans/
- Ukraine Task Force: https://ukrainetaskforce.org/uscis-pauses-applications-for-tps-asylum-adjustment-eads-and-other-immigration-benefits-for-parolees/ ; https://ukrainetaskforce.org/federal-judge-orders-dhs-to-lift-administrative-pause-on-parolee-applications-filed-to-uscis/
- Welcome.US: https://welcome.us/explainers/latest-changes-to-humanitarian-parole-programs-including-private-sponsorship-programs ; Bush Center: https://www.bushcenter.org/publications/the-u-s-pauses-immigration-applications-for-certain-migrants-what-does-it-mean ; CEDA: https://www.weareceda.org/en/us-cuba-news-brief/march-28-2025

**News**
- CBS News: https://www.cbsnews.com/news/judge-indira-talwani-directs-trump-officials-lift-pause-certain-immigration-applications/ ; https://www.cbsnews.com/news/trump-legal-immigration-cases-judge-blocks/ ; (Feb-2025 memo story, [B]) https://www.cbsnews.com/news/trump-administration-pauses-immigration-applications-migrants-biden-programs/
- NPR: https://npr.org/2025/12/03/g-s1-100218/trump-administration-halts-immigration-19-nations ; https://www.npr.org/2026/04/28/nx-s1-5775869/trump-travel-ban-pause-limbo-professionals
- Bloomberg Law: https://news.bloomberglaw.com/daily-labor-report/dhs-lifts-freeze-on-benefits-for-ukrainians-other-parolees-3 ; https://news.bloomberglaw.com/daily-labor-report/dhs-processes-thousands-of-immigration-benefits-after-order
- Courthouse News: https://www.courthousenews.com/citizenship-and-immigration-services-ordered-to-resume-processing-work-permit-applications/
- WLRN: https://www.wlrn.org/light/immigration/2026-04-28/cubans-immigration-arrests-green-card-rejections ; Latin Times: https://www.latintimes.com/federal-court-orders-uscis-resume-stalled-green-card-work-permit-applications-598968 ; Yahoo/Politico: https://www.yahoo.com/news/politics/articles/judge-ends-trump-freeze-immigration-181514602.html ; Business Standard: https://www.business-standard.com/immigration/us-court-blocks-trump-s-immigration-pause-for-39-countries-details-126060900656_1.html ; Forbes: https://www.forbes.com/sites/stuartanderson/2026/08/17/trump-officials-now-restricting-all-legal-immigration-categories/ ; Newsweek: https://www.newsweek.com/green-card-approval-rate-drops-for-3-major-categories-12578953 ; Migrant Insider: https://migrantinsider.com/p/uscis-resumes-processing-immigration
- VisaVerge: https://www.visaverge.com/uscis/uscis-memo-halts-immigration-applications-for-many-parolees/ ; https://www.visaverge.com/uscis/chief-judge-john-j-mcconnell-jr-rules-dhs-broke-law-freezing-immigration-from-39-countries/ ; https://www.visaverge.com/uscis/red-eagle-class-covers-pending-i-589-i-485-and-other-uscis-applications/ ; https://www.visaverge.com/news/judge-blocks-travel-ban-enforcement-rules-uscis-policies-unlawful-in-preliminary-injunction/

**Spanish-language / Cuban-community**
- CiberCuba (EN mirror): https://en.cibercuba.com/noticias/2026-10-20-u1-e135253-s27061-nid343309-solo-139-cubanos-obtuvieron-residencia-ley-ajuste ; https://en.cibercuba.com/noticias/2026-10-06-u1-e135253-s27061-nid342034-green-card-ley-ajuste-cubano-tarda-casi-ano-tiempo ; https://en.cibercuba.com/noticias/2026-06-11-u1-e208574-s27061-nid331888-trece-meses-esperando-permiso-trabajo-abogada ; https://en.cibercuba.com/noticias/2025-03-28-u1-e208574-s27061-nid299827-eeuu-revoca-permisos-trabajo-beneficiarios-parole ; https://en.cibercuba.com/noticias/2026-10-18-u1-e129488-s27061-nid343165-renovar-permiso-trabajo-quedarte-empleo-guia-cubanos ; https://en.cibercuba.com/noticias/2026-10-17-u1-e129488-s27061-nid343101-te-vencio-parole-pasa-ahora-opciones-tienen-cubanos ; https://en.cibercuba.com/noticias/2026-10-15-u1-e129488-s27061-nid342861-gobierno-trump-hace-definitiva-eliminacion-prorrogas ; https://en.cibercuba.com/noticias/2026-10-08-u1-e13-s27061-nid342267-demandan-uscis-nuevas-restricciones-obtener-green-card ; guide: https://www.cibercuba.com/s/inmigracion-eeuu/guias/una-vez-en-eeuu/ley-ajuste-cubano
- 14ymedio: https://www.14ymedio.com/cuba/migracion/aprobaciones-residencia-ley-ajuste-cubano_1_1132080.html ; UnoTV: https://www.unotv.com/us/inmigracion-us/ley-de-ajuste-cubano-las-residencias-aprobadas-caen-mas-de-99/ ; Factchequeado: https://factchequeado.com/teexplicamos/20260429/cubanos-green-cards-arrestos-ice/
- Directorio Cubano: https://www.directoriocubano.info/acontecer/juez-obliga-a-uscis-a-reactivar-residencias-bloqueadas-por-veto-migratorio-de-trump/ ; https://www.directoriocubano.info/acontecer/politicas-uscis-tramites-cubanos-39-paises/ ; https://www.directoriocubano.info/tramites-usa/ley-ajuste-cubano-aprobaciones-negativas-2026/ ; https://www.directoriocubano.info/cuba/cada-vez-menos-residencias-ley-ajuste-cubano-fin-sin-derogarla/
- Cuba en Miami: https://www.cubaenmiami.com/uscis-sigue-sin-reactivar-las-residencias-al-ritmo-esperado-pese-a-la-orden-judicial-y-crece-la-incertidumbre-entre-miles-de-cubanos/ ; https://www.cubaenmiami.com/residencias-de-cubanos-bajo-la-ley-de-ajuste-cubano-enfrentan-un-atraso-que-podria-extenderse-durante-anos/ ; https://www.cubaenmiami.com/uscis-nego-mas-casos-de-ajuste-cubano-en-tres-meses-que-durante-los-seis-meses-anteriores/
- Periódico Cubano: https://www.periodicocubano.com/cubanos-en-eeuu-reciben-alivio-tras-fallo-judicial-contra-pausa-de-uscis-de-que-se-trata/ ; https://www.periodicocubano.com/cuantas-green-cards-aprobo-uscis-bajo-la-ley-de-ajuste-cubano-en-julio-miles-siguen-a-la-espera/ ; https://www.periodicocubano.com/uscis-frena-permisos-de-trabajo-y-solicitudes-de-parole/ ; https://www.periodicocubano.com/cubanos-demandan-a-uscis-por-hacerlos-esperar-anos-para-la-residencia-bajo-la-ley-de-ajuste/
- Others: https://www.cuballama.com/noticias/juez-ordena-a-uscis-procesar-residencias-permanentes-en-pausa/ ; https://latinopinionbaltimore.com/uscis-reanuda-migratorios-cubanos-venezolanos/ ; https://www.cubanoticias360.com/uscis-reanuda-procesos-de-ciudadania-para-cubanos-y-venezolanos/ ; https://www.telemundo51.com/noticias/local/hacen-oficial-el-fin-del-parole-humanitario-para-cubanos-venezolanos-haitianos-y-nicaraguenses/2642089/ ; https://www.univision.com/local/miami-wltv/fin-parole-humanitario-que-pasa-aplicaron-otro-tramite-migratorio-ee-uu ; https://eltoque.com/cubanos-afectados-por-la-revocacion-del-parole-humanitario-incertidumbre-y-opciones-legales

**Law-firm and practitioner analyses**
- Freeze #1 and *Doe v. Noem*: https://www.gtlaw-insidebusinessimmigration.com/uscis/uscis-memo-pauses-tps-asylum-ead-other-applications-from-parolees/ ; https://www.littler.com/news-analysis/asap/uscis-lifts-administrative-pause-immigration-applications-filed-uniting-ukraine ; https://sverdlofflaw.com/uscis-administrative-hold-on-benefit-requests-for-u4u-chnv-and-frp-parolees/ ; https://www.visalawyerblog.com/breaking-federal-judge-lifts-pause-on-immigration-applications-for-parolees-of-uniting-for-ukraine-military-parole-in-place-chnv-frp/ ; https://www.salujalaw.com/uscis-resumes-processing-immigration-applications-for-parolees-after-court-order-what-it-means-for-individuals-and-employers ; https://hackinglawpractice.com/uscis-resumes-u4u-application-processing-after-lawsuit-forces-action/ ; https://www.learimmigration.com/federal-judge-orders-uscis-to-resume-processing-immigration-benefits-for-u4u-parolees ; https://www.francislawcenter.com/blog/2025/04/uscis-pauses-green-cards-and-terminates-the-chnv-parole/ ; https://www.immigrationpalmbeach.com/uscis-benefits-hold-u4u-chnv-frp-2025 ; https://www.seyfarth.com/news-insights/chnv-parole-update-scotus-grants-stay-terminations-may-proceed-but-implementation-unclear.html ; https://www.fragomen.com/insights/united-states-supreme-court-permits-termination-of-parole-program-for-cubans-haitians-nicaraguans-and-venezuelans-as-litigation-continues.html ; https://ogletree.com/insights-resources/blog-posts/supreme-court-reverses-lower-court-order-pausing-termination-of-chnv-parole-program/ ; https://www.fredlaw.com/alert-chnv-litigation-update-uscis-parole-terminations-stayed ; https://www.globalimmigrationblog.com/2025/06/humanitarian-parole-uncertainty-scotus-halts-chnv-program-while-lower-court-orders-continued-for-processing-for-chnv-afghans-ukrainians/ ; https://www.gmlaw.com/news/scis-issues-an-important-update-for-employers-and-beneficiaries-on-chnv-litigation/ ; https://eiglaw.com/chnv-adjustment-of-status-and-notices-of-termination/ ; https://verdict.justia.com/amp/2025/06/03/justice-jacksons-dissent-in-noem-v-doe-long-on-heart-light-on-legal-reasoning ; https://www.casemine.com/judgement/us/683d74a76e79ae4bd38a3058
- Freeze #2 and *Dorcas* / *Red Eagle*: https://ogletree.com/insights-resources/blog-posts/uscis-pauses-benefit-requests-for-nationals-from-high-risk-countries-and-halts-asylum-adjudications/ ; https://ogletree.com/insights-resources/blog-posts/uscis-broadens-scope-of-adjudication-hold-for-pending-benefit-requests-of-certain-foreign-nationals/ ; https://ogletree.com/insights-resources/blog-posts/federal-court-vacates-uscis-benefits-hold-affecting-applicants-from-39-countries/ ; https://shautsova.com/2026/01/11/uscis-shocks-immigration-community-with-january-1-2026-memo-pause-on-benefits-for-nationals-from-39-countries-and-review-of-refugees-admitted-2021-2025/ ; https://www.fredlaw.com/alert-alert-uscis-announces-immediate-hold-on-asylum-applications-and-immigration-benefits-for-foreign-nationals-of-19-high-risk-countries ; https://www.dorsey.com/newsresources/publications/client-alerts/2025/12/uscis-benefit--applications ; https://antone.com/summary-of-the-december-2-2025-uscis-policy-memorandum/ ; https://kpmg.com/xx/en/our-insights/gms-flash-alert/flash-alert-2025-259.html ; https://eiglaw.com/uscis-issues-policy-to-hold-and-review-pending-applications-from-high-risk-countries/ ; https://immigration.dickinson-wright.com/2025/12/05/important-updates-in-the-new-dhs-entry-suspension-memo/ ; https://www.clarkhill.com/news-events/news/uscis-announces-pause-on-benefits-adjudications-for-individuals-from-19-countries/ ; https://phillipslytle.com/trump-administration-pauses-immigration-applications-from-19-countries-previously-subject-to-june-2025-travel-ban/ ; https://phillipslytle.com/federal-judge-rules-the-pause-in-adjudication-of-immigration-benefits-for-citizens-of-travel-ban-countries-is-unlawful/ ; https://ilabacalaw.com/blog/immigration-news/federal-court-just-ordered-uscis-to-lift-the-adjudicative-hold-for-266-plaintiffs-from-the-39-country-list-doe-v-trump/ ; https://blog.cyrusmehta.com/2026/06/dorcas-v-uscis-federal-court-reaffirms-that-uscis-must-adjudicate-not-stonewall-immigration-benefits.html ; https://www.bal.com/immigration-news/united-states-federal-court-rules-uscis-adjudication-hold-policies-unlawful/ ; https://www.fragomen.com/insights/united-states-federal-district-court-vacates-40-jurisdiction-adjudications-hold-and-related-policies.html ; https://www.rnlawgroup.com/breaking-federal-court-strikes-down-uscis-adjudication-pause-for-travel-ban-countries/ ; https://www.immigrationissues.com/uscis-confirms-it-will-comply-with-the-dorcas-vacatur-of-the-country-hold-policies/ ; https://www.harrisbeachmurtha.com/insights/federal-court-vacates-uscis-adjudication-pauses/ ; https://www.gunster.com/newsroom/publications/uscis-announces-compliance-with-the-u-s-district-courts-decision-vacating-benefits-hold-policies-and-the-country-specific-factors-policy-for-firty-nine-39-trvel-ban-countries ; https://www.visalawyerblog.com/uscis-resumes-green-card-processing-for-nationals-from-39-countries-while-government-appeals-court-ruling/ ; https://manifestlaw.com/news/district-court-vacates-uscis-policies-06-08-2026 ; https://www.legal500.com/intelligence/united-states/immigration/federal-courts-vacate-uscis-policy-pausing-immigration-benefits-for-nationals-of-39-travel-ban-countries-and-the-100000-h-1b-fee ; https://www.francislawcenter.com/blog/2026/06/federal-court-blocks-uscis-immigration-freeze-for-39-countries/ ; https://jgoldlaw.com/dorcas-uscis-adjudication-holds-vacated-2026/ ; https://www.lehighvalleyimmigrationlawyers.com/blog/federal-court-strikes-down-usciss-39-country-benefits-freeze-what-the-dorcas-ruling-means-for-pa-nj-and-ny-immigrants ; https://www.hafeykarim.com/blog/the-39-country-visa-ban-and-the-june-5-court-ruling-what-it-means-for-your-immigration-case ; https://news.clinchlaw.com/en/article/federal-court-certifies-class-and-blocks-uscis-hold-and-review-policies-affectin-mthwklkh ; https://www.agarwalimmigration.com/insights/court-blocks-uscis-adjudication-freeze-for-travel-ban-countries ; https://www.sharmalawassociates.com/blog/red-eagle-class-certification-adjudication-holds ; https://mwlawllc.com/uscis-adjudication-holds-court-order-2026/ ; https://www.path2immigration.com/blog/court-lifts-uscis-adjudication-holds-2026/ ; https://www.ois.pitt.edu/june-18-2026-update-hold-and-review-policy ; https://isss.brown.edu/news/2026-02-01/uscis-processing-hold ; https://internationalcenter.umich.edu/about/news/uscis-pauses-adjudication-benefit-requests-citizens-19-countries ; https://internationaloffice.berkeley.edu/news/hold-and-review-uscis-benefit-applications-filed-aliens-additional-high-risk-countries ; https://factually.co/fact-checks/justice/uscis-naturalization-pause-19-countries-criteria-selection-40f5d9
- Travel ban explainers: https://isss.brown.edu/traveling/current-travel-and-visa-restrictions-presidential-proclamation ; https://isso.ucsf.edu/news/presidential-proclamation-expanded-travel-ban-december-17-2025 ; https://internationalcenter.umich.edu/about/news/new-presidential-proclamation-revises-and-expands-travel-restrictions ; https://phillipslytle.com/trump-administration-expands-2025-travel-ban-to-include-restrictions-on-20-additional-countries/ ; https://www.kolkocasey.com/39-country-travel-ban/ ; https://www.theusimmigrationlawyer.com/the-2025-entry-restrictions-proclamation-which-countries-face-full-bans-and-what-exceptions-still-exist/
- PM-602-0199: https://wolfsdorf.com/employer-advisory-uscis-policy-memorandum-on-adjustment-of-status-discretion-pm-602-0199/ ; https://www.morganlewis.com/pubs/2026/05/uscis-issues-new-policy-memorandum-on-adjustment-of-status ; https://manifestlaw.com/blog/immigration/news/uscis-policy-memorandum-adjustment-of-status-05-22-2026/
