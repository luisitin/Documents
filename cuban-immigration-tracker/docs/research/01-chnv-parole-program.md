# 01 — The CHNV Humanitarian Parole Program as It Applies to Cubans

**Project:** Cuban Immigration Tracker (CAA Tracker)
**Research date:** 2026-10-20 (all URLs accessed on this date)
**Author:** research agent (automated); written for a smart non-lawyer
**Status:** draft v1 — see "Verification ledger" and "Open questions" before relying on any single number

---

## 0. How this document was produced, and its limits

- The research sandbox could only reach GitHub hosts directly; every other domain
  (federalregister.gov, uscis.gov, cbp.gov, courtlistener.com, justiceactioncenter.org,
  cibercuba.com, etc.) was refused by the egress proxy, and the WebFetch tool could not
  resolve DNS. **All facts below therefore come from web-search result snippets and
  search-engine summaries of the cited pages, not from reading the full pages.**
- About 30 extended web searches were run before the per-turn search budget was exhausted.
- Consequently every claim is tagged:
  - **[V]** = the exact fact (date/number/quote) appeared in a snippet from the cited URL.
  - **[L]** = "likely": well-established background knowledge consistent with the sources,
    but the specific text was not seen in a snippet during this session.
  - **[I]** = inferred/derived by the author (e.g., arithmetic on cumulative counts).
- Section 12 lists what a human (or a later agent with full web access) should re-verify first.

---

## 1. Executive summary (ten things to know)

1. **What CHNV was.** Starting 2023-01-05 (notices published 2023-01-09, e.g. *Implementation of a
   Parole Process for Cubans*, 88 FR 1266), DHS let Cubans, Haitians, Nicaraguans and Venezuelans
   with a U.S. financial supporter (Form I-134A) fly to a U.S. airport and be **paroled** for up to
   two years, with work authorization under EAD category **(c)(11)**. Combined cap: 30,000
   travel authorizations per month. [V]/[L]
2. **How many Cubans.** CBP's last cumulative count (through end of December 2024): **110,970 Cubans
   vetted and authorized to travel; 110,240 Cubans arrived and were granted parole**, out of
   ~531,690 total CHNV arrivals. [V] DHS later rounded the program total to ~532,000. [V]
3. **No re-parole.** On 2024-10-04 USCIS said there would be no re-parole "process"; parolees were
   told to get another status (TPS, asylum, a green card — for Cubans, the **Cuban Adjustment Act**)
   or leave when their 2-year parole expired. [V]
4. **Shutdown.** Executive Order 14165 (2025-01-20) §7(b) ordered DHS to terminate categorical
   parole programs "including" CHNV; USCIS paused I-134A intake on 2025-01-28; a **2025-02-14 USCIS
   memo froze every pending benefit application filed by any CHNV/U4U/FRP parolee** (green cards,
   work permits, TPS, asylum). [V]
5. **Termination notice.** DHS's Federal Register notice of **2025-03-25 (90 FR 13611, doc.
   2025-05128)** terminated the CHNV processes and set **2025-04-24** as the date on which every
   still-valid CHNV parole would end, with parole-based EADs revoked. [V]
6. **Litigation.** In *Svitlana Doe v. Noem*, No. 1:25-cv-10495 (D. Mass., Judge Indira Talwani):
   2025-04-14 stay of the mass termination + class certification; 2025-05-28 stay of the benefit
   freeze; **2025-05-30 the Supreme Court (No. 24A1079) stayed the April 14 order** (Jackson and
   Sotomayor dissenting); **2025-09-12 the First Circuit (No. 25-1384) vacated the April 14 order**,
   holding mass termination was likely lawful. The benefit-freeze order survived; the government
   dropped its appeal of it on 2025-11-04. [V]
7. **What happened to parolees.** From **2025-06-12** DHS emailed/posted termination notices to CHNV
   parolees: parole terminated and (c)(11) EAD revoked "effective immediately"; told to self-deport
   through the CBP Home app with travel help and a $1,000 "exit bonus." E-Verify "Status Change
   Reports" for revoked EADs followed on 2025-06-20. [V]
8. **Cubans with a CAA I-485 already on file** kept their cases alive: a pending I-485 is a period of
   authorized stay and the CAA only requires that the person *was* "inspected and admitted or
   paroled" — a later termination of parole does not erase a past parole. But their (c)(11) EAD was
   revoked; they had to rely on a (c)(9) EAD tied to the pending I-485. [V for the EAD mechanics;
   [L]/[I] for the CAA-eligibility reading — see §9]
9. **A second, Cuba-specific freeze.** Cuba is one of the 19 countries in Proclamation 10949
   (2025-06-04). A **2025-12-02 USCIS memo put every pending benefit request from nationals of those
   19 countries — including I-485s — on "hold and review"**, expanded on 2026-01-01 to 39 countries.
   On **2026-06-05** the District of Rhode Island (*Dorcas International Institute v. USCIS*, Chief
   Judge McConnell) vacated those policies as unlawful under the APA; final judgment 2026-06-11;
   USCIS said it would comply; the government appealed (1st Cir. No. 26-1703). This — not the 2025
   CHNV freeze — is almost certainly the "freeze that got undone" the project owner remembers. [V]
10. **Where things stand (Oct 2026).** CHNV parole is gone for everyone; the *Doe* merits case on CHNV
    is still pending in D. Mass. (renewed summary-judgment motion filed 2025-11-10, no ruling found);
    USCIS is adjudicating Cuban I-485s again but slowly — Cuban-community outlets report only 139 CAA
    approvals vs 447 denials in April–June 2026 and ~308 approvals in July 2026, with >342,000 CAA
    files pending. [V as reported by those outlets; treat the numbers as unaudited]

---

## 2. Program launch and mechanics (January 2023)

| Item | Detail | Tag | Source |
|---|---|---|---|
| Announcement | 2023-01-05 White House/DHS announcement extending the Oct-2022 Venezuela process to Cuba, Haiti and Nicaragua. | [L] | AIC overview (S-14); Wikipedia (S-15) |
| Federal Register notices | *Implementation of a Parole Process for Cubans*, **88 FR 1266, published 2023-01-09** (doc. 2023-00252); parallel notices for Haiti and Nicaragua the same day; Venezuela's dates to Oct 2022. | [V] (Cuba cite) / [L] (others) | S-1 |
| Model | "DHS modeled the process on Uniting for Ukraine and the Venezuelan process." | [V] | S-1 |
| Eligibility (beneficiary) | Must "have a supporter in the United States who agrees to provide financial support for the duration of the beneficiary's parole period, pass national security and public safety vetting, and fly at their own expense to an interior POE." Needs a valid passport; must be outside the U.S. | [V] (quote) / [L] (passport) | S-1 |
| Ineligibility | Ordered removed within the prior five years [V]; interdicted at sea after 2023-04-27 (April 2023 notice) [V]; crossed irregularly into the U.S., Mexico or Panama after the announcement [L]. | | S-1, S-16 |
| Supporter form | Form **I-134A, "Online Request to be a Supporter and Declaration of Financial Support"**, filed free online by a U.S.-based supporter; USCIS vets the supporter and "confirms" the case. (The July-2023 Family Reunification notices also adopted I-134A from 2023-07-10.) | [V] (form name) / [L] | S-1, S-16 |
| Beneficiary steps | After confirmation the beneficiary creates a myUSCIS account, confirms biographic data and attestations, then uses the **CBP One** mobile app to submit a photo and get an **Advance Travel Authorization (ATA)**, valid 90 days, to fly to a U.S. airport where CBP decides parole at the port. | [L] | S-14, S-15 |
| Cap | **30,000 travel authorizations per month across the four nationalities** (the Venezuela-only process had been 24,000 total). | [L] (widely reported; not seen in a snippet this session) | S-14 |
| Parole period | Up to **two years**, case-by-case, under INA §212(d)(5)(A). | [L] | S-14, S-20 |
| Work authorization | Parolees could file Form I-765 for an EAD under category **(c)(11)** (parolee). | [V] (category) | S-28 |
| Discretion | "The Secretary retains the sole discretion to terminate the Parole Process for Cubans at any point." | [V] | S-1 |
| Selection method | From May 2023 USCIS picked about half of each month's cases at random from the whole I-134A pool and half from the oldest filings. | [L] | S-14 |
| 2024 fraud pause | DHS paused issuance of new ATAs in July 2024 after an internal review found sponsor fraud; resumed late August 2024 with added vetting (CBP's Oct-2024 update describes ongoing processing "with added vetting"). | [L]/[V] | S-9, S-11 |
| Cuban-specific context | Cubans paroled under CHNV become eligible for a green card under the **Cuban Adjustment Act (CAA)** after one year of physical presence — the main reason Cuban CHNV parolees were, legally, better positioned than the other three nationalities. | [V] (CLINIC/other summaries) | S-19, S-29 |

**Relationship to "CBP One" parole (important for the app's user base).** Separately from CHNV,
hundreds of thousands of people — many of them Cubans — were paroled at southwest-border ports of
entry after scheduling an appointment in CBP One. DHS's March 2025 notice itself cites **582,800
CHNV nationals with CBP One registration numbers encountered at southwest border POEs from
2023-01-01 to 2025-01-31**. [V] (S-2 as summarized in S-27). Those people also hold parole (often
coded "DT") and are also CAA-eligible after one year, but they are *not* CHNV parolees; the app
should treat "CHNV (airport, I-134A)" and "CBP One (land port)" as different entry channels.

---

## 3. How many Cubans were paroled

### 3.1 Cumulative snapshots published by CBP / DHS

| As of | Total CHNV arrivals (paroled) | Cubans | Haitians | Nicaraguans | Venezuelans | Tag | Source |
|---|---|---|---|---|---|---|---|
| end Jun 2023 | "nearly 160,000" | >35,000 | >50,000 | ~21,500 | >48,500 | [V] | S-17 (U.S. Embassy Venezuela fact sheet, "first six months") |
| end Jul 2023 | >181,000 | >39,000 (CBP July-2023 release) / "over 41,000" (law-firm summary; possibly the *authorized-to-travel* figure) | >72,000 | >34,000 | >63,000 | [V] with a source conflict | S-10, S-11 |
| end Feb 2024 (year inferred) | — | ~79,000 | ~151,000 | ~64,000 | ~91,000 | [V] figures / [I] year | S-18 (CIS) |
| end Sep 2024 | >531,000 | >110,000 | ~211,000 | >93,000 | ~117,000 | [V] | S-8 |
| end Oct 2024 | — | 110,240 | — | — | — | [V] | S-20 (Refugees International, citing CBP) |
| end Dec 2024 | **~531,690** arrived & paroled | **110,240** arrived & paroled (110,970 authorized) | 211,040 (213,150 auth.) | 93,070 (96,270 auth.) | 117,330 (120,760 auth.) | [V] | S-9 |
| Oct 2022 – Nov 2024 (OHSS) | **532,110** parole grants | — | — | — | — | [V] | S-21 (CRS R46570 citing OHSS monthly tables) |
| through 2025-01-22 | "approximately 532,000" arrived by air | — | — | — | — | [V] | S-2/S-27 |

Observations [I]:
- The Cuban count was essentially **flat from September 2024 onward (~110,000)**: arrivals had
  already slowed sharply in the second half of 2024 (one secondary source reports fewer than
  10,000 total CHNV parolees entering in August 2024 and only about 50 in November 2024 [V, S-15]).
- Cubans were ~21% of all CHNV parolees (110,240 / 531,690).
- Roughly 600 Cubans were authorized but never travelled (110,970 − 110,240).

### 3.2 Derived average monthly Cuban arrivals [I]

No month-by-nationality series was obtainable this session. Dividing the cumulative snapshots:

| Window | Cuban arrivals in window | Months | Approx. per month |
|---|---|---|---|
| Jan 2023 – Jun 2023 | ~35,000 | 6 | ~5,800 |
| Jul 2023 – Feb 2024 | ~41,000 → ~79,000 = ~38,000 | 8 | ~4,750 |
| Mar 2024 – Sep 2024 | ~79,000 → ~110,000 = ~31,000 | 7 | ~4,400 (with a near-zero July/Aug 2024 pause) |
| Oct 2024 – Jan 2025 | ~110,000 → 110,240 | 4 | ≈ 0 |

**Why this matters for the estimator:** a Cuban CHNV parolee who arrived in month *m* became
CAA-eligible in month *m + 12* (plus a day). The arrival curve above therefore predicts the
*CAA filing* curve: a wave of eligibility from **Jan 2024 through ~Oct 2025**, peaking in
early-to-mid 2024 and again tailing off by late 2025. The project owner's relative (arrived
~early 2024, filed Mar/Apr 2025) sits in the back half of that wave.

### 3.3 Where the real monthly data is (for the data pipeline)

- **OHSS "Immigration Enforcement and Legal Processes Monthly Tables"** — CRS says OHSS published
  monthly CHNV tables for October 2022 – November 2024, including a sheet titled **"Confirmed CHNV
  Paroles by Program Process"** in the November-2024 workbook. [V] (S-21). URL root:
  https://ohss.dhs.gov/topics/immigration/immigration-enforcement-and-legal-processes-monthly-tables
  (host refused by the sandbox proxy — must be verified from outside).
- **CBP monthly operational updates** (press releases, e.g. S-8, S-9, S-10) carry cumulative
  by-nationality counts in prose.
- The American Immigration Council July-2025 fact sheet (S-22) cites the OHSS "monthly-tables" page
  for a confirmed year-to-date CHNV figure. [V]
- GAO-26-107433, *Humanitarian Parole: DHS Identified Fraud Risks in Parole Processes…* (2026) —
  appeared in results; not read. Likely has program-level counts. [L] (S-23)

---

## 4. The re-parole question (late 2024)

| Date | Event | Tag | Source |
|---|---|---|---|
| Jan 2025 (looming) | First CHNV cohort's two-year parole (arrivals from Jan 2023) was due to expire from January 2025. | [I] from §2 | — |
| 2024-10-04 | USCIS added an FAQ stating there would be no "process" to renew (re-parole) CHNV parolees; DHS's message was that parolees should apply for an alternative benefit or status "such as asylum, Temporary Protected Status (TPS), a visa, or a green card" or depart at expiration. | [V] | S-24, S-25, S-20 |
| shortly after | USCIS "quietly changed its FAQ again to state that re-parole is a potential option" on an individual basis via Form I-131 (CLINIC); IRAP practice advisory: "any individual parolee may apply to renew their parole … through the Form I-131." | [V] | S-19, S-24 |
| Dec 2024 | Refugees International fact sheet lists TPS, asylum, family/employment adjustment, and case-by-case re-parole as the options. | [V] | S-20 |
| 2025-02-14 | USCIS memo froze adjudication of re-parole requests from CHNV/U4U/FRP parolees (see §5). | [V] | S-4 |
| 2025-05-28 | Talwani order stayed "the suspension of adjudications of re-parole applications filed by individuals who received parole pursuant to certain categorical parole programs." | [V] | S-32 |

**For Cubans specifically** re-parole mattered little: a Cuban who had completed one year could
file the CAA I-485 instead, and USCIS has long treated the CAA as the natural "exit" from parole.
[L]

---

## 5. January–March 2025: the unwinding

### 5.1 Executive Order 14165, "Securing Our Borders" (signed 2025-01-20)

- §7(a): the Secretary shall "Cease using the 'CBP One' application as a method of paroling or
  facilitating the entry of otherwise inadmissible aliens into the United States." [V] (S-26)
- §7(b): "terminate all categorical parole programs that are contrary to the policies of the
  United States established in my Executive Orders, including the program known as the 'Processes
  for Cubans, Haitians, Nicaraguans, and Venezuelans.'" [V] (S-26, S-27)
- CBP One's scheduling function was switched off the same day and pending appointments cancelled. [L]

### 5.2 DHS/USCIS actions in the following weeks

| Date | Action | Tag | Source |
|---|---|---|---|
| 2025-01-28 | USCIS announced it was "pausing acceptance of Form I-134A … until we review all categorical parole processes as required by that order." | [V] | S-26 |
| late Jan 2025 | CBP carrier guidance listed the programs covered by the order: "Uniting for Ukraine (U4U), Operations Allies Welcome (OAW), Family Reunification Parole (FRP), Cubans, Haitians, Nicaraguans, and Venezuelans (CHNV), Safe Mobility Office (SMO), Central American Minor (CAM)." | [V] | S-26 |
| **2025-02-14** | USCIS memo, *Administrative Hold on All USCIS Benefit Requests Filed by Parolees Under U4U, CHNV or FRP* (signed by Acting Deputy Director Andrew Davidson — "the February 14 Davidson memo"): an "immediate USCIS-wide administrative hold on all pending benefit requests filed by aliens who are or were paroled under the U4U, CHNV, or FRP programs, pending fraud and security vetting" (flags in ELIS). Covered green cards (I-485), work permits (I-765), asylum, TPS, re-parole. No end date. | [V] | S-4, S-5, S-6, S-32 |
| 2025-03-21 | DHS announced the termination (public-inspection copy posted); Spanish-language press dated the "Registro Federal" step to March 21. | [V] (Telemundo) | S-33 |
| **2025-03-25** | Federal Register notice published (see §5.3). | [V] | S-2 |

**Meaning of the Feb-14 hold for a Cuban who filed CAA in March/April 2025 [I]:** the I-485 and the
accompanying (c)(9) I-765 were accepted (receipt notices issued, fees taken) but sat on a hard
hold from day one until the court lifted it (late May/June 2025, §6.4).

### 5.3 The termination notice: *Termination of Parole Processes for Cubans, Haitians, Nicaraguans, and Venezuelans*, 90 FR 13611 (2025-03-25), FR Doc. 2025-05128

| Element | What the notice said | Tag | Source |
|---|---|---|---|
| Action | "DHS is terminating the categorical parole programs for inadmissible aliens from Cuba, Haiti, Nicaragua, and Venezuela and their immediate family members." | [V] | S-2 |
| Effective date of program termination | Immediately on publication (no new grants; some summaries say "effective March 25, 2025"). | [V] | S-2, S-29 |
| Effective date for existing parolees | "Parole periods not already expired by **April 24, 2025** will terminate on that date unless the Secretary makes an individual determination to the contrary" — i.e., a 30-day wind-down. | [V] | S-2, S-3 |
| EADs | Parole-based employment authorization is revoked when parole terminates; one summary records the (c)(11) EAD revocation as effective 2025-04-24. | [V] | S-28, S-34 |
| Pending supporter/travel cases | DHS "will issue non-confirmations for all pending sponsor applications, rescind confirmation of previously confirmed applications, and cancel all pending applications for advance travel authorization." | [V] | S-2, S-3 |
| Rationale | The programs "did not provide a significant public benefit" and were "inconsistent with the administration's foreign policy goals"; cited EO 14165; cited CBP's Dec-2024 figure that "over 531,000 aliens were granted parole." | [V] | S-2, S-3, S-11 |
| Numbers cited | 582,800 CHNV nationals with CBP One registrations encountered at SW-border POEs, 2023-01-01 → 2025-01-31. | [V] | S-27 |
| Instruction to parolees | Those "who have not obtained a lawful basis to remain" should depart before parole terminates, using the CBP Home app. | [L] (consistent with June-2025 DHS release) | S-36 |
| Pending benefit applications (I-485/TPS/asylum) | **Not verified this session.** Secondary explainers state that termination of parole does not by itself cancel a pending application and that a Cuban who filed I-485 before termination "may still have a viable adjustment application." The notice's own language on this point must be read at the primary URL (search inside for "adjustment" and "Cuban Adjustment Act"). | [L] / open question | S-29, S-37 |
| Cuban Adjustment Act mention | **Not verified this session** (see §12). | open | S-2 |

Primary URLs:
- https://www.federalregister.gov/documents/2025/03/25/2025-05128/termination-of-parole-processes-for-cubans-haitians-nicaraguans-and-venezuelans
- https://www.govinfo.gov/content/pkg/FR-2025-03-25/pdf/2025-05128.pdf
- https://public-inspection.federalregister.gov/2025-05128.pdf

---

## 6. *Svitlana Doe v. Noem* — the litigation, in order

**Case:** *Svitlana Doe, et al. v. Kristi Noem, et al.*, No. 1:25-cv-10495-IT, U.S. District Court
for the District of Massachusetts, Judge **Indira Talwani**. Plaintiffs: parolees and U.S.
sponsors across U4U, CHNV, FRP, OAW, CAM and other programs, represented by Justice Action
Center and Human Rights First (with others). Filed 2025-02-28. [V] for case number/judge/counsel;
[L] for filing date (S-30, S-31, S-38).

### 6.1 Timeline

| Date | Court | Event | Tag | Source |
|---|---|---|---|---|
| 2025-02-28 | D. Mass. | Complaint filed (class action challenging the pause of parole programs and the benefit hold). | [L] | S-31 |
| 2025-04-07 | D. Mass. | Transcript of hearing (per JAC tracker). | [V] | S-30 |
| 2025-04-08 | D. Mass. | Government's opposition to second PI motion. | [V] | S-30 |
| 2025-04-10 | D. Mass. | Hearing on emergency motion to stay the CHNV termination (widely reported; tracker lists only the 04/07 transcript). | [L] | S-30, S-39 |
| **2025-04-14** | D. Mass. | **Dkt. 97, Memorandum & Order** granting in part Plaintiffs' Emergency Motion (Dkt. 70) "for a stay of DHS's en masse truncation of all valid grants of CHNV parole": stayed the FRN (90 Fed. Reg. 13611) "insofar as it revokes, without case-by-case review, the previously granted parole and work authorization" of CHNV parolees, and stayed the individual termination notices sent via myUSCIS. **Class certified** the same day: "all individuals who have received a grant of parole under the CHNV programs," excluding those who voluntarily left before the FRN and opt-outs. | [V] | S-39, S-40, S-41 |
| 2025-04-17 | USCIS | USCIS posted a litigation update that the termination notices were stayed. | [V] | S-42 |
| 2025-05-05 | 1st Cir. | Denied the government's motion for a stay pending appeal. | [V] | S-39 |
| 2025-05-08 | SCOTUS | Solicitor General filed an application for a stay, No. 24A1079. | [V] (filing date in docket PDF URL) | S-43 |
| **2025-05-28** | D. Mass. | **Dkt. 107, "Second Stay Order":** stayed the 2025-02-14 memo "insofar as it suspended adjudications" for U4U, FRP and CHNV parolees, including (1) re-parole applications, (2) initial Military Parole in Place applications, (3) benefit adjudications for parolees; rejected the government's proposal to lift the hold only case by case. Compliance report ordered by 2025-06-09. | [V] | S-32, S-44, S-45 |
| **2025-05-30** | SCOTUS | **Order granting the stay in *Noem v. Doe*, No. 24A1079**, with no reasoning; Justice Jackson, joined by Justice Sotomayor, dissented ("The Court has plainly botched this assessment today"; the government "does not identify any specific national-security threat or foreign-policy problem that will result from respecting extant grants of CHNV parole while this case is pending"; the stay "immediately effectuate[s] the en masse truncation of all parole grants for approximately 500,000 current CHNV parole beneficiaries"). Some trackers date the order May 29; the Court's PDF is 24a1079_p86b. | [V] | S-46, S-47, S-48 |
| 2025-06-06 | USCIS | Alert, *Litigation-Related Update: Supreme Court stay of CHNV Preliminary Injunction*: DHS may now terminate CHNV parole and revoke parole-based EADs; affected people will be notified in their myUSCIS accounts. | [V] | S-34, S-49 |
| 2025-06-09 | USCIS | Memo authorizing officers to adjudicate pending benefit requests of U4U/CHNV/FRP parolees "to a final agency action once USCIS has completed the additional vetting requirement." Initial-parole and supporter (I-134A) requests stayed on hold. | [V] | S-6, S-50 |
| 2025-06-12 | DHS | Termination notices sent to CHNV parolees (see §7). | [V] | S-36 |
| 2025-06-16 | D. Mass. | Plaintiffs moved for partial summary judgment on the mass truncation of CHNV parole. | [V] | S-30 |
| ~2025-06-19 / 06-25 | USCIS | Secondary report: USCIS said all holds were lifted in its systems by June 19; additional cases found still on hold were released ~June 25. | [V as reported; unverified] | S-50 |
| late Jul 2025 | 1st Cir. | Government appealed the May 28 order "on the last possible day." | [V] | S-30 |
| **2025-09-12** | 1st Cir. | **Opinion, No. 25-1384** (Gelpí, J., joined by Kayatta and Montecalvo, JJ.): vacated the April 14 order and remanded. Plaintiffs "did not demonstrate a strong likelihood of success in establishing that the INA requires termination of grants of parole under the CHNV program to occur on a case-by-case basis"; the statute's case-by-case requirement "applies to granting parole, not to its termination"; DHS's explanation "was not so deficient as to be arbitrary and capricious." Because the SCOTUS stay was already in force, "no change for CHNV parole beneficiaries" resulted. | [V] | S-51, S-52, S-53, S-54 |
| 2025-11-04 | 1st Cir. | Government **voluntarily dismissed** its appeal of the May 28 (benefit-freeze) orders — that relief is final. | [V] | S-30 |
| 2025-11-10 | D. Mass. | Plaintiffs filed a **renewed motion for partial summary judgment** on CHNV termination (statutory authority and due process). **No ruling located as of 2026-10-20.** | [V] (filing) / open (ruling) | S-30 |
| 2025-12-15 | DHS/USCIS | Separate action: FR notice 2025-22744 terminating the **Family Reunification Parole** processes (Colombia, **Cuba**, Ecuador, Guatemala, Haiti, Honduras, El Salvador); paroles end 2026-01-14 **except** for people with an I-485 "postmarked or electronically filed as of December 15, 2025 that is still pending adjudication." | [V] | S-55, S-56 |
| 2026-01-10 | D. Mass. | Talwani TRO (14 days) pausing the FRP terminations. | [V] | S-31, S-57 |
| 2026-01-24 | D. Mass. | Talwani preliminary injunction/stay blocking FRP termination nationwide while the case proceeds. | [V] | S-31, S-57 |
| 2026 (through Oct) | D. Mass. | No further CHNV-specific ruling surfaced in searches. A JAC item titled "Federal Court Finds Trump Administration's Use of Expedited Removal for Parolees Contrary to Statute" appeared; it most likely refers to a different D.D.C. case (CHIRLA v. Noem, Aug 2025) rather than *Doe*. | open / [L] | S-58 |

Docket/opinion URLs:
- District court docket (Justia): https://docs.justia.com/cases/federal/district-courts/massachusetts/madce/1:2025cv10495/281389/97
- Clearinghouse case page: https://clearinghouse.net/case/46186/
- April 14 order PDF: https://justiceactioncenter.org/wp-content/uploads/2025/04/0097-Order-Granting-Stay-of-CHNV-Revocations.pdf
- May 28 "Second Stay Order" PDF: https://justiceactioncenter.org/wp-content/uploads/2025/05/107-Second-Stay-Order.pdf
- SCOTUS order + dissent: https://www.supremecourt.gov/opinions/24pdf/24a1079_p86b.pdf
- SG stay application: https://www.supremecourt.gov/DocketPDF/24/24A1079/358354/20250508121118618_Kristi_Noem_v_Svitlana_Doe_et_al_%20application_stay.pdf
- First Circuit opinion: https://law.justia.com/cases/federal/appellate-courts/ca1/25-1384/25-1384-2025-09-12.html and https://www.courtlistener.com/docket/69918063/doe-v-noem/

### 6.2 What each ruling actually protected (plain English)

- **April 14, 2025 (Talwani):** "You can't cancel 500,000 paroles with one notice; you have to look
  at each case." Kept parole and (c)(11) EADs alive for ~6 weeks.
- **May 28, 2025 (Talwani):** "You can't refuse to decide the green-card / work-permit / TPS /
  asylum applications these people already filed." This is the ruling that **unfroze the Cuban
  Adjustment Act I-485s filed in Feb–May 2025**. It was never overturned; the appeal was dropped
  on 2025-11-04.
- **May 30, 2025 (SCOTUS):** paused the April 14 order only. Mass termination could proceed.
- **September 12, 2025 (First Circuit):** agreed with the government on the preliminary question
  (mass termination is probably legal), erased the April 14 order, sent the case back.
- **Still open:** the final merits of the CHNV termination in D. Mass.

---

## 7. After the Supreme Court: what DHS did to parolees (June 2025 →)

| Date | Action | Tag | Source |
|---|---|---|---|
| 2025-06-12 | DHS press release *DHS Issues Notices of Termination for the CHNV Parole Program, Encourages Parolees to Self-Deport Immediately*. Notices went to the e-mail addresses parolees had given and to myUSCIS accounts, stating "their parole is terminated, and their parole-based employment authorization is revoked – effective immediately." Parolees were urged to leave via the **CBP Home** app; those who do "will receive travel assistance and a $1,000 exit bonus upon arrival in their home country." DHS put the affected population at ~530,000. | [V] | S-36, S-37, S-59, S-60 |
| 2025-06-12 → | Employers: law-firm guidance that employers may terminate workers whose (c)(11) EADs are no longer valid. | [V] | S-37, S-61 |
| 2025-06-20 | USCIS notified E-Verify employers to run a new **"Status Change Report"** listing employees whose EADs were revoked. | [V] | S-62, S-63 |
| mid-2025 | Reports of confusion over implementation — notices reaching people whose parole had already expired, or who had other status; USCIS's SAVE FAQ for benefit agencies describes how to treat CHNV parolees after termination. | [V] (existence) | S-64, S-65 |
| 2025-10-30 | DHS interim final rule ended **automatic extensions of expiring EADs** on renewal (affects (c)(9) renewals for pending-I-485 applicants). | [V] | S-66 |
| 2026-10-15 | Final rule making the end of automatic EAD extensions permanent. | [V] (CiberCuba report) | S-67 |

**Who was and was not reached by the termination [I]:**
- A Cuban who arrived in, say, March 2023 had parole that *expired on its own* in March 2025 —
  before the April 24 cut-off. Many early-cohort Cubans therefore never received a "termination";
  their parole simply lapsed, and their (c)(11) EAD (also two-year) lapsed with it.
- Cubans who arrived from ~May 2023 onward still had valid parole on 2025-04-24 and were the ones
  whose parole and (c)(11) EAD were *revoked* in June 2025.
- Either way, by mid-2025 essentially no Cuban CHNV parolee had parole or a (c)(11) EAD.

---

## 8. The second freeze that hit Cubans specifically (Dec 2025 – Jun 2026)

This is separate from CHNV and applies to **all Cuban nationals**, however they entered.

| Date | Event | Tag | Source |
|---|---|---|---|
| 2025-06-04 | **Proclamation 10949** (effective 2025-06-09): full entry ban for 12 countries; partial suspension (B-1/B-2, F, M, J and immigrant visas) for 7 others **including Cuba** — 19 countries in all. | [V] | S-68, S-69 |
| **2025-12-02** | USCIS policy memo (identified in the later court order as **PM-602-0192**): "hold and review" of **all pending benefit requests for aliens from the countries listed in PP 10949**, regardless of entry date, plus "a comprehensive re-review of approved benefit requests" for those who entered on or after 2021-01-20. Benefits explicitly reported as paused include **I-485 green-card applications**, I-765 EADs, I-90, N-400/N-470, I-751, I-131. The memo carried none of the proclamation's exceptions. Cuba is on the list. | [V] | S-70, S-71, S-72, S-73 |
| 2025-12-16 | **Proclamation 10998** (effective 2026-01-01) expanded the travel ban to 39 countries; Cuba stayed on the *partial* list (not full ban). | [V] | S-74, S-75 |
| **2026-01-01** | USCIS **PM-602-0194** expanded the adjudication hold to all 39 countries (and PA-2025-26 on re-review). | [V] | S-70, S-76 |
| Jan–May 2026 | Cuban-community press: "suspension of all Cuban immigration processes, including naturalizations, residency applications, and asylum cases." | [V] (as reported) | S-77 |
| 2026-05 | USCIS PM-602-0199 tightening discretionary analysis in adjustment cases; a federal judge reportedly held in July 2026 that it does not govern CAA applications. | [V] (as reported, unverified) | S-78 |
| **2026-06-05** | ***Dorcas International Institute of Rhode Island v. USCIS*** (D.R.I., Chief Judge John J. McConnell Jr.): the four challenged policies (PM-602-0192, PM-602-0194, PA-2025-26 and a related asylum hold) violate the APA and exceed USCIS's authority; **vacated** (set aside), not merely enjoined, so relief reaches every affected applicant nationally. | [V] | S-79, S-80, S-81, S-82 |
| 2026-06-11 | Final judgment; order to "immediately comply." USCIS posted *Court Order on Hold Policies* and said it would comply and restore normal adjudication while appealing. The district court denied a stay pending appeal. | [V] | S-83, S-84, S-85 |
| 2026-06 → | Government appealed to the First Circuit (**No. 26-1703**). One Spanish-language source says the First Circuit allowed the *re-review* policy to be revived pending appeal; not confirmed. | [V] (appeal) / open (stay) | S-80, S-78 |
| 2026-07-16 | USCIS reportedly confirmed (including in a letter to Rep. María Elvira Salazar) that processing for Cubans and Venezuelans had resumed. | [V] (as reported) | S-86, S-87 |
| 2026-08-24 | A federal judge in California reportedly blocked the two memoranda, certified a nationwide class, and ordered normal adjudication (belt-and-braces to *Dorcas*). A Maryland court ordered processing for 83 named plaintiffs from the 39 countries. | [V] (as reported, unverified) | S-70, S-78 |
| 2026-10 | Cuban press: USCIS "still not reactivating residencies at the expected pace"; some applicants told their files still showed as "paused" internally. | [V] (as reported) | S-88 |

**Cuban Adjustment Act throughput as reported by Cuban-community outlets (unaudited):**

| Period | CAA I-485 approvals | Denials | Pending | Source |
|---|---|---|---|---|
| "last two years" to early 2026 | approvals down **99.7%** | — | — | 14ymedio (S-89); UnoTV: wait >16 months (S-90) |
| Apr–Jun 2026 | **139** | **447** | **>342,000** CAA files pending | Directorio Cubano (S-91) |
| Jul 2026 | **308** | — | — | Cubaenmiami (S-88) |
| 2026 | 143 Cubans sued USCIS in Florida over multi-year CAA delays, *Acosta Reynoso v. USCIS*. | | | Periódico Cubano (S-92) |

The "denials" figure is striking: if accurate, denials outnumbered approvals 3:1 in Q2 2026,
consistent with reporting that USCIS has been applying heightened discretionary scrutiny to
parole-based CAA cases. [I] These figures need to be re-derived from USCIS's own quarterly
"Form I-485 by class of admission" data (see the data-sources research file).

**Why the project owner's memory of "the freeze was found unconstitutional" fits this episode:**
the June 2026 *Dorcas* ruling (statutory/APA, not constitutional, but widely reported in the
Cuban press as the judge "annulling" the pause) is the most recent and most Cuban-specific
unfreezing. The May 2025 Talwani order is the earlier, CHNV-specific one. [I]

---

## 9. Consequences for a Cuban who filed a CAA I-485 before the termination

Scenario: arrived via CHNV in early 2024, filed Form I-485 under the Cuban Adjustment Act (with
Form I-765 category (c)(9)) in March/April 2025.

| Question | Answer | Tag | Basis |
|---|---|---|---|
| Was the I-485 accepted? | Yes — receipt notices issued and fees taken; the Feb-14 hold stopped *adjudication*, not *intake*. | [V]/[I] | S-4, S-6 |
| Was it frozen? | Yes, twice: (1) 2025-02-14 → ~2025-06-09/25 (parolee hold, lifted by the May 28 order and June 9 memo); (2) 2025-12-02 → 2026-06-11 (Cuba travel-ban hold, vacated in *Dorcas*). That is roughly **10 of the case's first 15 months**. | [V] for each freeze / [I] for the arithmetic | §5.2, §6, §8 |
| Did parole termination kill CAA eligibility? | Secondary sources uniformly say no: the CAA asks whether the person was "inspected and admitted or paroled" and has one year of physical presence; "if you were granted parole, its expiration does not necessarily eliminate eligibility," and "USCIS regulations require having been admitted or paroled, but not necessarily that the parole is still valid when applying." A person who "filed Form I-485 before their parole was terminated may still have a viable adjustment application." **The USCIS Policy Manual text itself was not read this session.** | [V] (secondary) / [L] | S-29, S-93, S-94, S-95 |
| Is the person "legal" while waiting? | A properly filed, pending I-485 places the applicant in a **period of authorized stay** (no unlawful presence accrues) — but it is not a "status," and it is not, by itself, a bar to being placed in removal proceedings. Advice: keep the I-797C receipt as proof. | [V] | S-96, S-97 |
| Work permit | The (c)(11) parole EAD was revoked in June 2025 (or lapsed with parole). The applicant must rely on a **(c)(9)** EAD from the pending I-485. Cuban press (Oct 2026) reports (c)(9) EADs for CAA applicants taking **12–12.5 months**, and since 2025-10-30 a renewal no longer auto-extends the old card. | [V] | S-98, S-66, S-67 |
| Why did some neighbours get an EAD and others not? [I] | Timing against the two freezes: (c)(9) EADs adjudicated between ~June 2025 and 2025-12-01 were issued; those still pending on 2025-12-02 sat until June 2026 and then re-entered a 12-month-class queue. Filers whose I-765 was decided in the summer-2025 window got cards; slightly later filers did not. |  | §6, §8 |
| Travel | Leaving the U.S. without an approved Advance Parole (I-131) abandons the pending I-485; CHNV parole no longer provides re-entry. | [V] | S-95 |
| Interview / arrest risk | Reports in 2025–2026 of ICE arrests of former parolees, including at USCIS appointments; not quantified in this session's sources. | [L] | S-99 |
| CFRP (family-reunification parole) Cubans | Different rule: termination effective 2026-01-14 **but** anyone with an I-485 filed by 2025-12-15 and still pending keeps parole; and Talwani enjoined the FRP termination on 2026-01-24. | [V] | S-55, S-56, S-57 |

Univision (Miami), on the June-2025 revocations: those who already filed the I-485 "should not be
affected by the revocation of parole, because the case enters a legal process that allows them to
remain while it is resolved," but those who requested a work permit based on the adjustment and do
not yet have it "may have difficulty working legally, since the permit linked to parole is also
revoked." [V] (S-98)

---

## 10. What DHS/USCIS currently tells (former) CHNV parolees to do

Synthesized from the March-2025 notice, the June-2025 DHS release, the USCIS litigation alerts and
the SAVE FAQ [V unless noted]:

1. CHNV parole is terminated for everyone; no new CHNV grants and no CHNV re-parole exist. (S-2, S-36)
2. Parole-based (c)(11) EADs are revoked; employers may verify via E-Verify Status Change Reports. (S-34, S-62)
3. People "without a lawful basis to remain" should "self-deport immediately" using CBP Home, with
   travel assistance and the $1,000 stipend. (S-36)
4. People with a **pending** application (TPS, asylum, I-485) may remain while it is pending; USCIS
   must adjudicate it (May 28, 2025 order, final) and, for Cubans, may no longer hold it on
   nationality grounds (*Dorcas*, June 2026, under appeal). (S-32, S-83)
5. Cubans with one year of presence who have **not** filed can still file the CAA I-485 — the law is
   unchanged — but adjustment remains discretionary and inadmissibility grounds apply. (S-29, S-100)
6. Pending-I-485 applicants should file/renew the (c)(9) EAD early because automatic extensions
   ended on 2025-10-30. (S-66, S-67)

---

## 11. Verification ledger (what was seen vs. what was inferred)

**Seen in source snippets this session [V]:** FR citation and dates (90 FR 13611; 2025-03-25;
2025-04-24); 88 FR 1266 / 2023-01-09; EO 14165 §7(a)/(b) text; I-134A pause 2025-01-28; Feb-14
memo existence/scope; CBP Dec-2024 by-country counts; OHSS 532,110; 582,800 CBP One figure;
Oct-4-2024 no-re-parole FAQ and later revision; every *Doe* date in §6.1 marked [V]; SCOTUS
24A1079 / May 30 / Jackson-Sotomayor dissent quotes; First Circuit 25-1384 / Sept 12 / Gelpí panel
/ holdings; June 12 DHS notice language and $1,000; June 20 E-Verify; PP 10949 and 10998 dates and
Cuba's partial status; Dec-2 and Jan-1 USCIS hold memos including Cuba; *Dorcas* June 5 / June 11 /
McConnell / vacatur / appeal No. 26-1703; Oct-30-2025 end of auto-extension; Cuban-press CAA
statistics.

**Inferred [I]:** monthly Cuban arrival rates; who was reached by June-2025 notices; the "10 of 15
months frozen" arithmetic; the explanation for uneven EAD outcomes; identification of *Dorcas* as
"the freeze that was undone."

**Background knowledge not re-verified [L]:** 30,000/month cap; 2-year parole; 90-day ATA; CBP One
photo step; May-2023 random/oldest selection; July–Aug 2024 fraud pause; complaint filing date
2025-02-28; April 10 hearing; CAA Policy-Manual reading; CHIRLA expedited-removal case.

---

## 12. Open questions (ordered by importance for the app)

1. **Exact text of 90 FR 13611 on pending applications and on the Cuban Adjustment Act.** Read
   https://www.govinfo.gov/content/pkg/FR-2025-03-25/pdf/2025-05128.pdf and search "adjust",
   "Cuban Adjustment", "pending".
2. **Monthly Cuban CHNV arrivals** from OHSS monthly tables (Oct 2022 – Nov 2024). Needed to model
   the CAA-eligibility wave month by month.
3. **Status of the renewed summary-judgment motion (filed 2025-11-10) in *Doe v. Noem*** and any
   2026 order on CHNV; check https://clearinghouse.net/case/46186/ and the CourtListener docket.
4. **First Circuit No. 26-1703 (*Dorcas* appeal):** was any stay granted? Is the re-review policy
   revived? Is USCIS still complying? Check https://www.uscis.gov/newsroom/alerts/court-order-on-hold-policies.
5. **USCIS Policy Manual language on CAA after parole termination** (search Policy Manual Vol. 7 for
   "Cuban Adjustment Act" and "parole … terminated"), and whether USCIS has issued RFEs/NOIDs to
   CAA applicants citing parole termination.
6. **Verify the Cuban-press CAA statistics** (139/447; 308; >342,000) against USCIS "Immigration and
   Citizenship Data" quarterly I-485 reports.
7. **Did any 2025–2026 DHS guidance address parolees who had already filed I-485 before June 12, 2025**
   (e.g., were their (c)(11) EADs revoked too)? The June-12 notices appear to have gone to everyone.
8. **Jan-2025 final cumulative CHNV counts** (CBP January-2025 update, if published).
9. **GAO-26-107433** contents.
10. Whether CBP One ("DT") parolees — a large Cuban population — received separate termination
    notices (DHS reportedly began revoking CBP One paroles in April 2025) and how that affects their
    CAA cases. [L]

---

## 13. Implications for the app

- **Two entry channels, two cohorts.** Model "CHNV (airport)" and "CBP One (land port)" separately;
  both are CAA-eligible after one year but had different parole-termination paths and dates.
- **Eligibility-wave input.** Use CHNV arrival month (from OHSS/CBP) + 12 months as the earliest CAA
  filing month; the Cuban wave runs Jan 2024 → late 2025 and is now exhausted — new CAA filings from
  CHNV Cubans will be near zero going forward, so the pending backlog is a closed cohort that can be
  drained-down modelled.
- **Freeze windows must be explicit features in the estimator.** Two hard holds applied to this
  cohort: 2025-02-14 → ~2025-06-25 (all CHNV parolees) and 2025-12-02 → 2026-06-11 (all Cuban
  nationals). Elapsed calendar time is not the right clock; use "adjudicable days" (calendar days
  minus hold days) as the regressor, and expect a post-June-2026 surge of decisions.
- **Milestone semantics changed.** For this cohort an EAD milestone is a **(c)(9)** card, not the
  original (c)(11); a (c)(11) revocation notice (June 2025) is *not* a bad sign for the I-485.
  The app's milestone picker should offer: receipt, biometrics, (c)(9) EAD, interview notice,
  interview, RFE/NOID, decision, and "parole termination notice received (June 2025)".
- **Denial rate matters.** Q2-2026 reports show denials > approvals; the estimator should output a
  probability of approval, not just a time-to-decision, and should surface the discretionary-denial
  trend once verified from USCIS data.
- **Alerts feed.** Watch: D. Mass. *Doe v. Noem* docket; 1st Cir. No. 26-1703; USCIS newsroom
  "litigation-related update" alerts; Federal Register (parole, EAD rules); Cuban outlets
  (CiberCuba, Directorio Cubano, Cubaenmiami, 14ymedio, Periódico Cubano) for early signals.
- **Spanish-first UX.** The audience reads Spanish-language sources; glossary terms (parole,
  "permiso de trabajo", "ajuste cubano", "pausa", "hold") should appear in both languages.
- **Legal-caution copy.** Every estimate screen should carry: pending I-485 = authorized stay, not
  status; do not travel without advance parole; keep I-797C; EAD renewals no longer auto-extend.

---

## 14. Sources (every URL used; all accessed 2026-10-20 via search snippets)

Primary / government
- S-1 Federal Register, *Implementation of a Parole Process for Cubans*, 88 FR 1266 (2023-01-09): https://www.federalregister.gov/documents/2023/01/09/2023-00252/implementation-of-a-parole-process-for-cubans
- S-2 Federal Register, *Termination of Parole Processes for Cubans, Haitians, Nicaraguans, and Venezuelans*, 90 FR 13611 (2025-03-25): https://www.federalregister.gov/documents/2025/03/25/2025-05128/termination-of-parole-processes-for-cubans-haitians-nicaraguans-and-venezuelans ; PDF: https://www.govinfo.gov/content/pkg/FR-2025-03-25/pdf/2025-05128.pdf ; public inspection: https://public-inspection.federalregister.gov/2025-05128.pdf
- S-4 USCIS memo (2025-02-14), *Administrative Hold on All USCIS Benefit Requests Filed by Parolees Under U4U, CHNV or FRP*: https://www.uscis.gov/sites/default/files/document/foia/AdministrativeHoldonAllUSCISBenefitRequestsFiledbyParoleesUnderU4U_CHNVorFRP.pdf ; mirror: https://ukrainetaskforce.org/wp-content/uploads/2025/03/USCIS-Parolee-Benefits-Pause-Memo-February-14-2025.pdf
- S-8 CBP, *CBP Releases September 2024 Monthly Update*: https://www.cbp.gov/newsroom/national-media-release/cbp-releases-september-2024-monthly-update
- S-9 CBP, *CBP Releases December 2024 Monthly Update*: https://www.cbp.gov/newsroom/national-media-release/cbp-releases-december-2024-monthly-update
- S-10 CBP, *CBP Releases July 2023 Monthly Update*: https://www.cbp.gov/newsroom/national-media-release/cbp-releases-july-2023-monthly-update
- S-11 CBP, *CBP Releases October 2024 Monthly Update*: https://cbp.gov/newsroom/national-media-release/cbp-releases-october-2024-monthly-update
- S-16 Federal Register, Cuban FRP changes (2023-08-11): https://www.federalregister.gov/documents/2023/08/11/2023-17376/implementation-of-changes-to-the-cuban-family-reunification-parole-process ; FRP notices 2023-07-10: https://www.govinfo.gov/content/pkg/FR-2023-07-10/pdf/2023-14474.pdf ; April 2023 interdiction notice: https://www.govinfo.gov/content/pkg/FR-2023-04-28/pdf/2023-09014.pdf
- S-17 U.S. Embassy Venezuela, *Fact Sheet: Data From First Six Months of Parole Processes…*: https://ve.usembassy.gov/fact-sheet-data-from-first-six-months-of-parole-processes-for-cubans-haitians-nicaraguans-and-venezuelans-shows-that-lawful-pathways-work/
- S-21 CRS, *Immigration Parole* (R46570, updated 2025-09-18): https://www.congress.gov/crs-product/R46570 ; PDF: https://www.congress.gov/crs_external_products/R/PDF/R46570/R46570.3.pdf ; CRS R47654 *Immigration Options for Immigration Parolees*: https://www.congress.gov/crs-product/R47654
- S-23 GAO-26-107433, *Humanitarian Parole: DHS Identified Fraud Risks…*: https://www.gao.gov/assets/gao-26-107433.pdf
- S-26 EO 14165 *Securing Our Borders*: https://www.presidency.ucsb.edu/documents/executive-order-14165-securing-our-borders ; https://public-inspection.federalregister.gov/2025-02015.pdf ; https://www.govinfo.gov/content/pkg/DCPD-202500132/html/DCPD-202500132.htm ; tracker: https://immpolicytracking.org/policies/eo-securing-our-borders-7b-directs-termination-of-categorical-parole-programs-including-chnv-parole-processes/
- S-34 USCIS alert (2025-06-06), *Litigation-Related Update: Supreme Court stay of CHNV Preliminary Injunction*: https://www.uscis.gov/newsroom/alerts/litigation-related-update-supreme-court-stay-of-chnv-preliminary-injunction
- S-36 DHS (2025-06-12), *DHS Issues Notices of Termination for the CHNV Parole Program, Encourages Parolees to Self-Deport Immediately*: https://www.dhs.gov/news/2025/06/12/dhs-issues-notices-termination-chnv-parole-program-encourages-parolees-self-deport ; mirror: https://mx.usembassy.gov/dhs-issues-notices-of-termination-for-the-chnv-parole-program-encourages-parolees-to-self-deport-immediately/ ; PDF: https://iptp-production.s3.amazonaws.com/media/documents/2025.06.12_DHS_-_DHS_Issues_Notices_of_Termination_for_CHNV_Parole_Program.pdf
- S-39 Justia docket, *Doe v. Noem* 1:25-cv-10495, Dkt. 97: https://docs.justia.com/cases/federal/district-courts/massachusetts/madce/1:2025cv10495/281389/97
- S-40 April 14, 2025 order PDF: https://justiceactioncenter.org/wp-content/uploads/2025/04/0097-Order-Granting-Stay-of-CHNV-Revocations.pdf
- S-32 May 28, 2025 Second Stay Order PDF: https://justiceactioncenter.org/wp-content/uploads/2025/05/107-Second-Stay-Order.pdf
- S-43 SG stay application (2025-05-08): https://www.supremecourt.gov/DocketPDF/24/24A1079/358354/20250508121118618_Kristi_Noem_v_Svitlana_Doe_et_al_%20application_stay.pdf
- S-46 *Noem v. Doe*, No. 24A1079 (2025-05-30) order and dissent: https://www.supremecourt.gov/opinions/24pdf/24a1079_p86b.pdf ; https://www.law.cornell.edu/supremecourt/text/24A1079 ; https://www.courtlistener.com/opinion/10595581/noem-v-doe/
- S-51 *Doe v. Noem*, No. 25-1384 (1st Cir. 2025-09-12): https://law.justia.com/cases/federal/appellate-courts/ca1/25-1384/25-1384-2025-09-12.html ; https://caselaw.findlaw.com/court/us-1st-circuit/117698510.html ; opinion PDF: https://justiceactioncenter.org/wp-content/uploads/2025/09/ca1-ca1-2025-01384-OPINION-issued-by-Gustavo-A.-GelpA%C2%AD-Jr.-Appellate-Judge-William-J.-Kayatta-Jr.-Appellate-Judge-a-09-12-2025.pdf ; docket: https://www.courtlistener.com/docket/69918063/doe-v-noem/
- S-55 Federal Register (2025-12-15), *Termination of Family Reunification Parole Processes…*: https://www.federalregister.gov/documents/2025/12/15/2025-22744/termination-of-family-reunification-parole-processes-for-colombians-cubans-ecuadorians-guatemalans ; https://public-inspection.federalregister.gov/2025-22744.pdf
- S-56 USCIS alert, *DHS Ends the Abuse of the Humanitarian Parole Process and Terminates Family Reunification Parole Programs*: https://www.uscis.gov/newsroom/alerts/dhs-ends-the-abuse-of-the-humanitarian-parole-process-and-terminates-family-reunification-parole
- S-65 USCIS SAVE, *FAQs on the Effect of Changes to Parole and TPS for SAVE Agencies*: https://www.uscis.gov/save/current-user-agencies/guidance/faqs-on-the-effect-of-changes-to-parole-and-temporary-protected-status-tps-for-save-agencies
- S-68/S-74 Proclamation 10998: https://www.presidency.ucsb.edu/documents/proclamation-10998-restricting-and-limiting-the-entry-foreign-nationals-protect-the ; CBP bulletin: https://www.cbp.gov/sites/default/files/2026-01/CLP%20Bulletin%20-%20Restricting%20Entry%2020251230_2.pdf
- S-83 USCIS alert, *Court Order on Hold Policies*: https://www.uscis.gov/newsroom/alerts/court-order-on-hold-policies
- CMS informational bulletin (2026-07-14) on termination of parole programs: https://www.medicaid.gov/federal-policy-guidance/downloads/cib07142026-termination-parole-programs.pdf
- NY OTDA GIS 25 DC 054: https://www.otda.ny.gov/policy/gis/2025/25DC054.pdf
- House Judiciary (2024-11-20) report on CHNV: https://judiciary.house.gov/sites/evo-subsites/republicans-judiciary.house.gov/files/evo-media-document/2024-11-20%20The%20Biden%20Harris%20Administration's%20CHNV%20Parole%20Program%20Two%20Years%20Later%20-%20A%20Fraud-Ridden,%20Unmitigated%20Disaster.pdf

Litigation trackers / legal nonprofits
- S-30 JAC litigation tracker, district court: https://litigationtracker.justiceactioncenter.org/cases/svitlana-doe-v-noem-humanitarian-parole-district-court
- S-52 JAC tracker, court of appeals: https://litigationtracker.justiceactioncenter.org/cases/svitlana-doe-v-noem-humanitarian-parole-court-appeals
- S-47 JAC tracker, Supreme Court: https://litigationtracker.justiceactioncenter.org/cases/noem-v-svitlana-doe-humanitarian-parole-supreme-court
- S-31 JAC case page: https://justiceactioncenter.org/case/svitlana-doe-v-noem/ ; class-action page: https://justiceactioncenter.org/svitlana-doe-v-noem-class-action/
- S-38 Clearinghouse: https://clearinghouse.net/case/46186/
- S-3 JAC, *FRN Legal Decoder: Termination of CHNV Humanitarian Parole*: https://justiceactioncenter.org/news/legaldecoder-chnv-frn/
- S-48 JAC news on SCOTUS stay: https://justiceactioncenter.org/news/supreme-court-allows-trump-administration-to-circumvent-district-courts-ruling-and-strip-lawful-immigration-status-from-nearly-500000-people/
- S-53 JAC news on First Circuit: https://justiceactioncenter.org/news/u-s-appeals-court-greenlights-trumps-mass-revocation-of-lawful-status-and-work-authorization-from-hundreds-of-thousands-of-parole-beneficiaries/
- S-58 JAC news, expedited removal of parolees: https://justiceactioncenter.org/news/federal-court-finds-trump-administrations-use-of-expedited-removal-for-parolees-contrary-to-statute/
- S-54 Human Rights First case page: https://humanrightsfirst.org/svitlana-doe-v-noem/
- Cato amicus: https://www.cato.org/legal-briefs/doe-v-noem ; NY AG amicus: https://ag.ny.gov/sites/default/files/amicus-curiae/doe-v-noem-first-circuit-amicus-brief-2025.pdf
- S-19 CLINIC, *Options for CHNV Parolees*: https://www.cliniclegal.org/resources/options-cuban-haitian-nicaraguan-and-venezuelan-parolees ; *Updates on CHNV Parole Terminations and Federal Litigation*: https://www.cliniclegal.org/resources/removal-proceedings/updates-chnv-parole-terminations-and-federal-litigation ; *CHNV Parole Terminations Paused by District Court*: https://www.cliniclegal.org/resources/parole/chnv-parole-terminations-paused-district-court ; FAQ PDF: https://www.cliniclegal.org/file-download/download/public/75508
- S-24 IRAP practice advisory on re-parole: https://refugeerights.org/news-resources/practice-advisory-chnv-parolee-renewal-options-lkt
- S-20 Refugees International, *Fact Sheet: Resources for CHNV Parolees, December 2024*: https://www.refugeesinternational.org/fact-sheet-resources-for-chnv-parolees-december-2024/ ; *Setting the Record Straight on CHNV*: https://www.refugeesinternational.org/perspectives-and-commentaries/setting-the-record-straight-on-chnv/
- S-14 American Immigration Council overview: https://www.americanimmigrationcouncil.org/fact-sheet/biden-administrations-humanitarian-parole-program-cubans-haitians-nicaraguans-and/ ; S-22 July-2025 fact sheet PDF: https://www.americanimmigrationcouncil.org/wp-content/uploads/2023/10/chnv_fact_sheet_july_2025.pdf ; blog on termination: https://www.americanimmigrationcouncil.org/blog/trump-terminates-chnv-program-impacting-more-than-half-million-migrants/
- S-15 Wikipedia, *Parole for Cubans, Haitians, Nicaraguans, and Venezuelans*: https://en.wikipedia.org/wiki/Parole_for_Cubans,_Haitians,_Nicaraguans,_and_Venezuelans
- S-18 CIS, *What Is 'CHNV Parole' — and Why Should You Care?*: https://cis.org/Arthur/What-CHNV-Parole-and-Why-Should-You-Care
- EPI: https://www.epi.org/policywatch/dhs-revokes-protections-for-532000-in-chnv-parole-program/ ; FWD.us: https://www.fwd.us/news/chnv-has-been-a-huge-economic-success-the-trump-administration-should-abandon-its-effort-to-fast-track-the-revocation-of-humanitarian-parole-for-more-than-500000-people/ ; FactCheck.org: https://www.factcheck.org/2024/03/the-humanitarian-parole-program-for-cubans-haitians-nicaraguans-and-venezuelans/ ; Alianza Americas: https://www.alianzaamericas.org/tool/termination-of-chnv-parole-program ; Welcome.US: https://welcome.us/explainers/latest-changes-to-humanitarian-parole-programs-including-private-sponsorship-programs ; Presidents' Alliance FAQ: https://www.presidentsalliance.org/wp-content/uploads/2024/04/2024-04-07-Parole-FAQ.pdf ; Bush Center: https://www.bushcenter.org/publications/the-u-s-pauses-immigration-applications-for-certain-migrants-what-does-it-mean ; CEDA: https://www.weareceda.org/en/us-cuba-news-brief/march-28-2025 ; MA Senior Care: https://maseniorcare.org/member-resources/e-news-updates/boston-judge-temporarily-blocks-termination-chnv-parole-haiti ; Asian Law Caucus: https://www.asianlawcaucus.org/news-resources/guides-reports/travel-ban-asylum-immigration-benefits ; NAFSA: https://www.nafsa.org/regulatory-information/curtailment-humanitarian-immigration-benefits and https://www.nafsa.org/regulatory-information/proclamation-december-16-2025-travel-ban-effective-january-1-2026
- Policy trackers: https://immpolicytracking.org/policies/reporting-that-dhs-plans-to-terminate-chnv-parole-processes-and-revoke-parole-by-placing-certain-beneficiaries-in-removal-proceedings/ ; https://immpolicytracking.org/policies/uscis-terminates-family-reunification-parole-processes-for-colombians-cubans-ecuadorians-guatemalans-haitians-hondurans-and-salvadorans/ ; https://immpolicytracking.org/policies/proclamation-restricting-and-limiting-the-entry-of-foreign-nationals-to-protect-the-security-of-the-united-states/
- AILA library: https://www.aila.org/library/uscis-provides-litigation-related-update-on-chnv ; https://www.aila.org/library/dhs-notice-terminating-chnv-parole-processes ; https://www.aila.org/library/dhs-announcement-on-issuing-notices-of-termination-for-the-chnv-parole-program ; https://www.aila.org/uscis-litigation-related-update-supreme-court-stay-of-chnv-preliminary-injunction

Law-firm and practitioner analyses
- S-5 Greenberg Traurig: https://www.gtlaw-insidebusinessimmigration.com/uscis/uscis-memo-pauses-tps-asylum-ead-other-applications-from-parolees/ ; CBP updates: https://www.gtlaw-insidebusinessimmigration.com/cbp/cbp-provides-updates-on-humanitarian-parole-program-for-cuba-haiti-nicaragua-and-venezuela/
- S-6 Littler: https://www.littler.com/news-analysis/asap/uscis-lifts-administrative-pause-immigration-applications-filed-uniting-ukraine ; S-62 https://www.littler.com/news-analysis/asap/update-e-verify-issuing-notices-termination-chnv-parole-program
- S-28 Gunster: https://www.gunster.com/newsroom/publications/termination-of-chnv-parole-programs-impact-on-parole-status-and-c-11-ead-authorization-what-u-s-employers-should-know
- S-37 Erickson Immigration Group: https://eiglaw.com/chnv-adjustment-of-status-and-notices-of-termination/ ; https://eiglaw.com/dhs-to-terminate-chnv-parole-program/
- S-44 Visa Lawyer Blog: https://www.visalawyerblog.com/breaking-federal-judge-lifts-pause-on-immigration-applications-for-parolees-of-uniting-for-ukraine-military-parole-in-place-chnv-frp/ ; S-25 https://www.visalawyerblog.com/biden-administration-will-not-renew-humanitarian-parole-program-for-cubans-haitians-nicaraguans-and-venezuelans-chnv/
- S-45 CBS News on May 28 order: https://www.cbsnews.com/news/judge-indira-talwani-directs-trump-officials-lift-pause-certain-immigration-applications/ ; Bloomberg Law: https://news.bloomberglaw.com/daily-labor-report/dhs-lifts-freeze-on-benefits-for-ukrainians-other-parolees-3
- S-50 Hacking Law Practice: https://hackinglawpractice.com/uscis-resumes-u4u-application-processing-after-lawsuit-forces-action/ ; Mondaq: https://www.mondaq.com/unitedstates/general-immigration/1640064/
- S-42 Greenspoon Marder: https://www.gmlaw.com/news/scis-issues-an-important-update-for-employers-and-beneficiaries-on-chnv-litigation/ ; S-64 https://www.gmlaw.com/news/confusion-surrounds-dhs-handling-of-chnv-parole-and-ead-revocations/ ; https://www.gmlaw.com/news/federal-judge-issues-stay-order-temporarily-halting-the-termination-of-cuban-haiti-nicaragua-venezuela-chnv-humanitarian-parole/
- S-49 Seyfarth: https://www.seyfarth.com/news-insights/chnv-parole-update-scotus-grants-stay-terminations-may-proceed-but-implementation-unclear.html ; Fragomen: https://www.fragomen.com/insights/united-states-supreme-court-permits-termination-of-parole-program-for-cubans-haitians-nicaraguans-and-venezuelans-as-litigation-continues.html ; Ogletree: https://ogletree.com/insights-resources/blog-posts/supreme-court-reverses-lower-court-order-pausing-termination-of-chnv-parole-program/ , https://ogletree.com/insights-resources/blog-posts/federal-judge-order-suspends-termination-of-cuban-haitian-nicaraguan-and-venezuelan-chnv-parole-program/ , https://ogletree.com/insights-resources/blog-posts/parole-programs-for-cuban-haitian-nicaraguan-and-venezuelan-nationals-terminated-by-dhs/ , S-71 https://ogletree.com/insights-resources/blog-posts/uscis-broadens-scope-of-adjudication-hold-for-pending-benefit-requests-of-certain-foreign-nationals/ ; Fredrikson: https://www.fredlaw.com/alert-chnv-litigation-update-uscis-parole-terminations-stayed ; Global Immigration Blog: https://www.globalimmigrationblog.com/2025/06/humanitarian-parole-uncertainty-scotus-halts-chnv-program-while-lower-court-orders-continued-for-processing-for-chnv-afghans-ukrainians/ ; Mayer Brown: https://www.mayerbrown.com/en/insights/publications/2025/06/chnv-parole-cancelled-what-the-rollback-means-for-employers ; Thompson Hine: https://www.thompsonhine.com/insights/chnv-parole-terminated-what-employers-need-to-know/ ; VensureHR: https://vensure.com/employment-law-updates/federal-supreme-court-permits-dhs-to-end-chnv-parole/ ; LHSC: https://lhscimmigration.com/immigration-news/alerts/dhs-terminates-chnv-parole-processes-what-you-need-to-know/ ; Francis Law: https://www.francislawcenter.com/blog/2025/04/uscis-pauses-green-cards-and-terminates-the-chnv-parole/ ; Immigration Palm Beach: https://www.immigrationpalmbeach.com/uscis-benefits-hold-u4u-chnv-frp-2025 ; Grossman Young: https://www.grossmanyoung.com/blog/chnv-parole-program/ ; S-96 Brown Immigration Law: https://brownimmigrationlaw.com/resources-library/impact-of-termination-on-employment-based-green-card-process/ ; S-95 Caunsel: https://www.caunsel.com/guides/how-to-adjust-status-after-chnv-parole-termination-us ; S-29 FedLaws: https://fedlaws.org/cuban-migration-to-the-us-adjustment-act-parole-and-asylum/ ; S-93 Lluis Law: https://lluislaw.com/cuban-adjustment-act/ ; S-94 Aroma de Cuba: https://aromadecuba.com/en/blog/2026-02-22-ley-ajuste-cubano-2026-quien-califica-proteccion/ ; De Maio Law: https://www.demaio-law.com/post/cuban-adjustment-act-in-2025-a-practical-guide-to-applying-for-your-green-card ; S-100 Dr. Mantonya guide: https://drmantonya.com/resources/chnv-parole-program-guide ; Ilabaca Law: https://ilabacalaw.com/blog/immigration-news/humanitarian-parole-where-things-stand-now/ ; VisaVerge: https://www.visaverge.com/news/dhs-issues-termination-notices-to-chnv-foreign-nationals/ , https://www.visaverge.com/uscis/uscis-memo-halts-immigration-applications-for-many-parolees/ , https://visaverge.com/guides/ead-work-permit-guide ; Ukraine Task Force: https://ukrainetaskforce.org/uscis-pauses-applications-for-tps-asylum-adjustment-eads-and-other-immigration-benefits-for-parolees/ ; Verdict (Justia) on the Jackson dissent: https://verdict.justia.com/amp/2025/06/03/justice-jacksons-dissent-in-noem-v-doe-long-on-heart-light-on-legal-reasoning ; Casemine: https://www.casemine.com/judgement/us/683d74a76e79ae4bd38a3058 ; U.S. Chamber letter: https://www.uschamber.com/immigration/u-s-chamber-letter-noem-v-svetlana-doe-et-al-may-30-2025
- Travel-ban hold / *Dorcas*: S-70 Brown Univ. ISSS: https://isss.brown.edu/news/2026-02-01/uscis-processing-hold ; S-72 Univ. of Michigan: https://internationalcenter.umich.edu/about/news/uscis-pauses-adjudication-benefit-requests-citizens-19-countries ; S-76 UC Berkeley: https://internationaloffice.berkeley.edu/news/hold-and-review-uscis-benefit-applications-filed-aliens-additional-high-risk-countries ; Pitt: https://www.ois.pitt.edu/june-18-2026-update-hold-and-review-policy ; S-73 Antone: https://antone.com/summary-of-the-december-2-2025-uscis-policy-memorandum/ ; Phillips Lytle: https://phillipslytle.com/trump-administration-pauses-immigration-applications-from-19-countries-previously-subject-to-june-2025-travel-ban/ and https://phillipslytle.com/trump-administration-expands-2025-travel-ban-to-include-restrictions-on-20-additional-countries/ ; Kolko & Casey: https://www.kolkocasey.com/39-country-travel-ban/ ; S-79 Cyrus Mehta: https://blog.cyrusmehta.com/2026/06/dorcas-v-uscis-federal-court-reaffirms-that-uscis-must-adjudicate-not-stonewall-immigration-benefits.html ; S-80 BAL: https://www.bal.com/immigration-news/united-states-federal-court-rules-uscis-adjudication-hold-policies-unlawful/ ; S-81 Fragomen: https://www.fragomen.com/insights/united-states-federal-district-court-vacates-40-jurisdiction-adjudications-hold-and-related-policies.html ; S-82 Reddy Neumann Brown: https://www.rnlawgroup.com/breaking-federal-court-strikes-down-uscis-adjudication-pause-for-travel-ban-countries/ ; S-84 Immigration Issues: https://www.immigrationissues.com/uscis-confirms-it-will-comply-with-the-dorcas-vacatur-of-the-country-hold-policies/ ; S-85 Harris Beach Murtha: https://www.harrisbeachmurtha.com/insights/federal-court-vacates-uscis-adjudication-pauses/ ; JGold Law: https://jgoldlaw.com/dorcas-uscis-adjudication-holds-vacated-2026/ ; Tukki: https://tukki.ai/blog/uscis-39-country-pause-vacated ; Lehigh Valley: https://www.lehighvalleyimmigrationlawyers.com/blog/federal-court-strikes-down-usciss-39-country-benefits-freeze-what-the-dorcas-ruling-means-for-pa-nj-and-ny-immigrants ; Nisreen Mousa Law: https://nisreenmousalaw.com/motion-to-terminate-removal-proceedings-dorcas-v-uscis/ ; Hafey Karim: https://www.hafeykarim.com/blog/the-39-country-visa-ban-and-the-june-5-court-ruling-what-it-means-for-your-immigration-case ; SG Legal: https://www.sglegalgroup.com/blog/uscis-pauses-immigration-decisions-for-travel-ban-countries-what-applicants-need-to-know ; Path2Immigration: https://www.path2immigration.com/blog/court-lifts-uscis-adjudication-holds-2026/ ; Law Office Immigration: https://lawofficeimmigration.com/blog/uscis-holds-high-risk-countries.html ; VisaForTheUnitedStates: https://visafortheunitedstates.com/application-process/uscis-39-country-adjudication-pause-2026-applications-frozen/ and https://visafortheunitedstates.com/visa-types/tourist-visa/us-visa-for-cuban-citizens-2026-cuban-adjustment-act-chnv-asylum-green-card/ ; Factually: https://factually.co/fact-checks/justice/uscis-naturalization-pause-19-countries-criteria-selection-40f5d9 ; S-69/S-75 Brown ISSS travel restrictions: https://isss.brown.edu/traveling/current-travel-and-visa-restrictions-presidential-proclamation ; UCSF: https://isso.ucsf.edu/news/presidential-proclamation-expanded-travel-ban-december-17-2025 ; UMich: https://internationalcenter.umich.edu/about/news/new-presidential-proclamation-revises-and-expands-travel-restrictions ; Chicago Immigration Lawyer Blog: https://www.theusimmigrationlawyer.com/the-2025-entry-restrictions-proclamation-which-countries-face-full-bans-and-what-exceptions-still-exist/

Spanish-language / Cuban-community press
- S-33 Telemundo 51: https://www.telemundo51.com/noticias/local/hacen-oficial-el-fin-del-parole-humanitario-para-cubanos-venezolanos-haitianos-y-nicaraguenses/2642089/ ; https://www.telemundo51.com/noticias/local/termina-el-parole-humanitario-para-personas-de-cuba-haiti-nicaragua-y-venezuela/2666661/
- S-98 Univision Miami: https://www.univision.com/local/miami-wltv/fin-parole-humanitario-que-pasa-aplicaron-otro-tramite-migratorio-ee-uu ; https://www.univision.com/local/miami-wltv/puede-cubano-entro-cbp-one-perder-permiso-trabajo-fin-parole-humanitario
- elTOQUE: https://eltoque.com/cubanos-afectados-por-la-revocacion-del-parole-humanitario-incertidumbre-y-opciones-legales
- LA NACION: https://www.lanacion.com.ar/estados-unidos/migraciones/adios-al-permiso-de-trabajo-que-pasa-con-las-personas-con-parole-en-estados-unidos-que-recibieron-nid06042025/
- Legal en USA: https://www.legalenusa.com/post/dhs-comienza-a-notificar-la-revocaci%C3%B3n-del-parole-humanitario ; https://www.legalenusa.com/post/dhs-decide-cancelar-el-parole-humanitario-para-cubanos-haitianos-nicarag%C3%BCenses-y-venezolanos
- S-66/S-67 CiberCuba (English edition): https://en.cibercuba.com/noticias/2026-10-17-u1-e129488-s27061-nid343101-te-vencio-parole-pasa-ahora-opciones-tienen-cubanos ; https://en.cibercuba.com/noticias/2026-10-15-u1-e129488-s27061-nid342861-gobierno-trump-hace-definitiva-eliminacion-prorrogas ; CiberCuba CAA guide: https://www.cibercuba.com/s/inmigracion-eeuu/guias/una-vez-en-eeuu/ley-ajuste-cubano ; Cuba Headlines mirrors: https://www.cubaheadlines.com/articles/343101 , https://www.cubaheadlines.com/articles/342861
- S-89 14ymedio: https://www.14ymedio.com/cuba/migracion/aprobaciones-residencia-ley-ajuste-cubano_1_1132080.html
- S-90 UnoTV: https://www.unotv.com/us/inmigracion-us/ley-de-ajuste-cubano-las-residencias-aprobadas-caen-mas-de-99/
- S-91 Directorio Cubano: https://www.directoriocubano.info/tramites-usa/ley-ajuste-cubano-aprobaciones-negativas-2026/ ; https://www.directoriocubano.info/cuba/cada-vez-menos-residencias-ley-ajuste-cubano-fin-sin-derogarla/ ; https://www.directoriocubano.info/tramites-usa/parole-vencido-ajuste-cubano/ ; https://www.directoriocubano.info/acontecer/juez-obliga-a-uscis-a-reactivar-residencias-bloqueadas-por-veto-migratorio-de-trump/ ; https://www.directoriocubano.info/acontecer/politicas-uscis-tramites-cubanos-39-paises/
- S-88 Cubaenmiami: https://www.cubaenmiami.com/uscis-sigue-sin-reactivar-las-residencias-al-ritmo-esperado-pese-a-la-orden-judicial-y-crece-la-incertidumbre-entre-miles-de-cubanos/ ; https://www.cubaenmiami.com/residencias-de-cubanos-bajo-la-ley-de-ajuste-cubano-enfrentan-un-atraso-que-podria-extenderse-durante-anos/ ; https://www.cubaenmiami.com/cubanos-podrian-enfrentar-esperas-de-hasta-24-meses-para-obtener-la-residencia-bajo-la-ley-de-ajuste-cubano/
- S-86/S-87/S-92 Periódico Cubano: https://www.periodicocubano.com/cubanos-en-eeuu-reciben-alivio-tras-fallo-judicial-contra-pausa-de-uscis-de-que-se-trata/ ; https://www.periodicocubano.com/cubanos-demandan-a-uscis-por-hacerlos-esperar-anos-para-la-residencia-bajo-la-ley-de-ajuste/ ; Latin Opinion Baltimore: https://latinopinionbaltimore.com/uscis-reanuda-migratorios-cubanos-venezolanos/ ; Cuballama: https://www.cuballama.com/noticias/juez-ordena-a-uscis-procesar-residencias-permanentes-en-pausa/ ; CubaNoticias360: https://www.cubanoticias360.com/uscis-reanuda-procesos-de-ciudadania-para-cubanos-y-venezolanos/
- Caribbean National Weekly: https://www.caribbeannationalweekly.com/posts/dhs-ends-parole-program-for-haitians-cubans-urges-immediate-self-deportation
- S-99 (ICE arrests at appointments; general 2025–26 reporting, not individually captured this session).
