# 07 — Reported processing timelines for Cuban Adjustment Act I-485s and (c)(9) EADs, 2024–2026

**Research date:** 2026-10-20 (all URLs accessed on this date unless noted).
**Audience:** the app team (smart non-lawyers). This is not legal advice.
**Scope:** empirical numbers on how long Cuban Adjustment Act (CAA) Form I-485 cases and the
companion Form I-765 category (c)(9) work permits have been taking before, during and after the
2025–2026 freezes, with an explicit estimate for a case filed in March/April 2025.

---

## 0. How to read this document (verification labels and data-access limits)

Every factual claim carries one of these labels:

| Label | Meaning |
|---|---|
| **[V]** | Verified: the number/date appears in a cited source's text that was returned by web search. |
| **[P]** | A primary (official) source exists and is identified by URL, but its contents were not opened from this environment; the number comes from a secondary outlet that cites it. |
| **[L]** | Likely: consistent across two or more independent secondary sources, or standard practice, but not confirmed from a primary document. |
| **[U]** | Uncertain / inferred by the author of this document; reasoning is shown. |

**Important access limitation.** During this research run the sandbox could *search* the web but could
not *open* pages: every direct fetch (`WebFetch`, `curl` through the mandated proxy) was refused
(`CONNECT ... 403` from the proxy; DNS resolution failures in the fetch tool), and the per-turn
web-search budget was exhausted after 15 searches. Consequences:

1. The USCIS processing-times API (`https://egov.uscis.gov/processing-times/api/...`) and the
   historical-median page (`https://egov.uscis.gov/processing-times/historic-pt`) could **not** be
   queried, and no Wayback Machine snapshots could be pulled. Office-level CAA numbers below are
   therefore sparse and come from third-party trackers that scrape the USCIS tool.
2. Reddit, Trackitt and Facebook-group anecdotes could **not** be retrieved; the "community
   timelines" section relies on Spanish-language news stories quoting attorneys and applicants.
3. All numbers are reproduced exactly as the search engine returned them from the cited pages.
   Where two sources disagree, both figures are shown.

Section 13 lists the exact probes a follow-up agent (with working network access) should run.

---

## 1. Executive summary

- **CAA I-485 median processing time (completed cases, national, USCIS data):** 3.3 months in
  FY2023, 4.6 months in FY2024, 7.0 months in FY2025, and **11.8 months for FY2026 to date**
  (1 Oct 2025 – 31 Jul 2026). The wait has roughly tripled since 2023. **[P/V]** (CiberCuba,
  6 Oct 2026, citing USCIS data; see §3.1.)
- **Quarterly median rose from 7.5 months (Apr–Jun 2025) to 16.3 months (Apr–Jun 2026)** while
  quarterly completions collapsed from **27,602 to 586**. **[V, secondary analysis of USCIS
  quarterly data]** (see §3.2.)
- **Approvals nearly stopped during the Dec 2025 – Jun 2026 "country hold":** January 2026 saw
  7,086 CAA receipts but only **15 approvals**; April–June 2026 (FY2026 Q3) produced **139
  approvals and 447 denials** (23.7% approval rate) against roughly **342,000–355,000 pending**
  cases. **[V/P]** (Factchequeado; CiberCuba 20 Oct 2026; Newsweek; USCIS FY2026 Q3 I-485 report.)
- **Approval rates among decisions:** ~98.7% (Apr–Jun 2024), 97.2% (Jan–Mar 2025), 93.2%
  (Apr–Jun 2025), 52.6% (Jan–Mar 2026), 23.7% (Apr–Jun 2026). **[V]** The 2026 collapse is a
  selection effect of the hold (eligible parolee cases were frozen while clear denials were
  issued), not evidence that typical CHNV-parolee cases are being refused (see §8).
- **Processing resumed slowly after the courts intervened:** the Rhode Island vacatur (5 Jun 2026,
  *Dorcas v. USCIS*), USCIS's compliance notice (12 Jun 2026), and the N.D. Cal. class-wide
  preliminary injunction (24 Aug 2026, *Red Eagle Law v. Edlow*). July 2026 saw **308** CAA
  approvals, and attorneys reported Cuban parolees receiving fresh decisions in Sept–Oct 2026.
  **[V]**
- **EAD (c)(9):** work permits for CAA applicants were caught by *both* freezes (the Feb–Jun 2025
  parolee pause and the Dec 2025–Jun 2026 country hold). Attorneys reported waits of **up to 13
  months** as of June 2026. Rule changes in late 2025 (end of the automatic 540-day extension for
  renewals filed on/after 30 Oct 2025; maximum 18-month validity for certain EADs from Dec 2025)
  make renewals a live problem for 2025 filers. **[V]**
- **Estimate for a CAA I-485 filed March/April 2025 (see §11):** the case is now ~18–19 months
  old, has outlived both freezes, and sits near the front of the FIFO queue. If USCIS sustains
  even half of its FY2025 pace, a decision is most likely between **Q1 and Q3 2027** (Florida
  median ≈ 9–10 months from today; non-Florida ≈ 6–8 months), with a wide tail. **Confidence: LOW.**

---

## 2. The policy timeline that shapes every timeline (2023 → Oct 2026)

There were **two separate freezes**, plus the CHNV termination between them. Confusing them is the
most common error in community discussions.

| Date | Event | Effect on CAA I-485 / (c)(9) EAD | Label | Source |
|---|---|---|---|---|
| Jan 2023 – Jan 2025 | CHNV parole in operation; ≈532,000 people paroled in total, of whom roughly 110,000 were Cubans (up to 530,000 per Yale OISS). | Creates the filing cohort: each parolee becomes CAA-eligible one year + one day after parole, so the receipt wave runs Jan 2024 → Jan 2026. | [L] | FR notice 2025-05128; Yale OISS; Wikipedia CHNV article |
| FY2023 / FY2024 | CAA I-485 national medians 3.3 / 4.6 months. | Baseline "normal" era. | [P/V] | CiberCuba 6 Oct 2026 (USCIS data) |
| 14 Feb 2025 | USCIS memo: **administrative pause on all pending benefit requests filed by parolees** under U4U, CHNV and Family Reunification Parole. | **Freeze #1.** I-485s and I-765s of CHNV Cubans stop being adjudicated. Receipting and (apparently) biometrics continued. | [V] | AILA/UkraineTaskForce; Welcome.US |
| 25 Mar 2025 | DHS Federal Register notice terminating CHNV parole, effective 24 Apr 2025. | Parole-based (c)(11) EADs to be revoked; CAA filers keep "paroled" status for CAA purposes (see §8). | [V] | public-inspection.federalregister.gov/2025-05128.pdf |
| 28 Mar 2025 | DHS begins revoking parole-based work permits. | (c)(11) cards cancelled; (c)(9) cards tied to a pending I-485 are a different category. | [V] | CiberCuba 28 Mar 2025 |
| 14 Apr 2025 | Judge Talwani (D. Mass., *Doe v. Noem*, 1:25-cv-10495) stays the en-masse truncation of CHNV parole. | — | [V] | Justia docket #97 |
| 28 May 2025 | Talwani order: lifts the suspension of benefit adjudications for parolees; nationwide class certified. | **Freeze #1 legally ends.** | [V] | Justice Action Center; VisaLawyerBlog |
| 30 May 2025 | Supreme Court stays the 14 Apr order (*Noem v. Doe*); DHS may terminate CHNV parole and revoke parole-based EADs. USCIS says this does not affect the 28 May order. | Parole ends for those who had not adjusted; CAA filings already pending continue. | [V] | USCIS alert; Fragomen; AILA |
| 4 Jun 2025 | Presidential Proclamation 10949 (travel ban; Cuba on the list). | Seeds the later country hold. | [V] | Clark Hill; Asian Law Caucus |
| 9 Jun 2025 | USCIS memo (the "Alfonso-Royals memo") authorizes officers to resume adjudicating parolee requests, with additional vetting; court demanded compliance confirmation by 13 Jun 2025 and a further report by 28 Jul 2025. | **Freeze #1 operationally ends.** EADs and I-485s start moving again, but with vetting. | [V] | Littler; Saluja Law; uscis-pause-tracker |
| Jul–Nov 2025 | Processing of the 2025 cohort resumes; FY2025 Q4 CAA median ≈ 9.1 months; FY2025 median 7.0 months. | Many March/April 2025 filers receive (c)(9) EADs in this window. | [V/L] | immiva tracker; CiberCuba |
| 30 Oct 2025 | End of the automatic 540-day extension for EAD renewals filed on/after this date. | Renewal timing becomes critical for 2025 filers. | [V] | CiberCuba 18 Oct 2026 |
| 3 Nov 2025 | Proposed rule expanding biometrics requirements. | Proposal only. | [V] | govinfo.gov FR 2025-19747 |
| 2 Dec 2025 | **USCIS PM-602-0192 "Hold and Review"**: pending benefit requests (incl. I-485) of nationals of 19 travel-ban countries — **Cuba included** — placed on hold; approved benefits of those who entered on/after 20 Jan 2021 to be re-reviewed (possible interview/re-interview). Later expanded to I-129, I-539, I-140 and **I-765**. | **Freeze #2.** Virtually all Cuban I-485s and (c)(9) EADs stop. | [V] | NPR 3 Dec 2025; Dorsey; Ogletree; Asian Law Caucus |
| Dec 2025 | Certain EADs limited to 18 months' validity (previously up to 5 years). | Shorter cards, more renewals. | [V] | CiberCuba 18 Oct 2026; Cuba Bajo Lupa |
| 12 Dec 2025 | USCIS biometrics/photo update: photos only at an ASC; no reuse of previously collected biometrics for certain applications. | Extra biometrics appointments, including on renewals. | [V] | iss.washington.edu |
| 16 Dec 2025 | Proclamation 10998 expands the travel-ban list. | — | [V] | Asian Law Caucus |
| 1 Jan 2026 | **PM-602-0194** expands the hold to **39 countries** + Palestinian Authority; review of refugees admitted 2021–2025. | Freeze #2 widens. | [V] | Shautsova; Ogletree |
| Jan 2026 | CAA I-485: 7,086 receipts, **15 approvals**. | Freeze #2 visible in the data. | [V] | Factchequeado 29 Apr 2026 |
| 10/24 Jan 2026 | TRO / preliminary order in *Doe v. Noem* on Family Reunification Parole terminations. | Not CHNV-specific. | [V] | Justice Action Center; USCIS FRP alert |
| 30 Mar 2026 | USCIS lifts hold for screened asylum seekers from "non-high-risk" countries. | Does not help Cubans (Cuba is "high-risk"). | [V] | Asian Law Caucus |
| 30 Apr 2026 | Judge Kobick (D. Mass.) rules the hold unlawful for the plaintiffs before her. | Plaintiff-specific. | [V] | Phillips Lytle |
| 21 May 2026 | **PM-602-0199**: adjustment of status framed as discretionary/extraordinary; preference for consular processing in some situations. One outlet says CAA is expressly excluded; not confirmed. | May drive more interviews; CAA carve-out unverified. | [V/U] | directoriocubano; cubafull; CiberCuba guide |
| 5 Jun 2026 | ***Dorcas International Institute of RI v. USCIS*, 26-cv-00132-JJM-PAS (D.R.I., Judge McConnell): vacates PM-602-0192, PM-602-0194 and PA-2025-26 nationwide** (also the re-review and country-specific-factors policies). Final judgment 11 Jun 2026. | **Freeze #2 legally ends.** | [V] | USCIS alert "Court Order on Hold Policies"; Cyrus Mehta; AILA |
| 12 Jun 2026 | USCIS announces compliance ("policies should be treated as if not in effect") and files notice of appeal to the First Circuit the same day. | Agency-wide resumption; appeal risk persists. | [V] | USCIS alert; immigrationissues.com; Gunster |
| Apr–Jun 2026 (FY26 Q3) | CAA I-485: 139 approvals, 447 denials, 586 completions, 23.7% approval; 342,360 pending at 30 Jun 2026. | Lowest quarter on record. | [V/P] | CiberCuba 20 Oct 2026; directoriocubano; Newsweek; USCIS FY2026 Q3 XLSX |
| Jul 2026 | 308 CAA approvals; >355,000 pending. | Slow restart. | [V] | Periódico Cubano |
| 24 Aug 2026 | ***Red Eagle Law, L.C. v. Edlow*, 3:26-cv-04850-CRB (N.D. Cal., Judge Breyer): class certified (nationals of the 39 countries with applications subject to the hold) and preliminary injunction ordering USCIS to adjudicate "in the normal course".** USCIS announces compliance. 28 Aug: remainder of the case stayed pending the *Dorcas* appeal. | Second, independent nationwide order; protects class members even if *Dorcas* is reversed. | [V] | AILA (two items); Clinch Law; Agarwal; uscis-pause-tracker |
| Sep–Oct 2026 | Attorneys report Cuban parolees receiving new USCIS decisions after months of waiting; USCIS FY2026-to-date CAA median 11.8 months; waits reported as >16 months. | Post-freeze restart under way but throughput still far below 2024–25. | [V] | asere.com; CiberCuba 6 Oct 2026; UnoTV |

**Takeaway for March/April 2025 filers [U]:** their case was filed *inside* Freeze #1, started moving
in summer 2025, and reached the age at which FY2025-era cases were normally decided (7–9 months) in
**November–January**, i.e. exactly when Freeze #2 began. That is why this cohort is disproportionately
stuck while some earlier (2024) filers finished and some later filers saw nothing at all.

---

## 3. Official national statistics for CAA I-485s

### 3.1 USCIS historical median processing time (completed cases)

| Fiscal year | Median months (CAA I-485) | Label | Source |
|---|---|---|---|
| FY2023 | 3.3 | [P/V] | CiberCuba 6 Oct 2026; CubaHeadlines 342034 (both citing USCIS) |
| FY2024 | 4.6 | [P/V] | same |
| FY2025 | 7.0 | [P/V] | same |
| FY2026 (1 Oct 2025 – 31 Jul 2026) | **11.8** | [P/V] | same |

Notes:
- The dataset behind these figures is almost certainly USCIS's "Historical National Median
  Processing Times" page (`https://egov.uscis.gov/processing-times/historic-pt`), which lists
  "I-485 — Based on Cuban Adjustment Act" by fiscal year. **[L]** — it could not be opened here.
- CiberCuba reports the FY2026 CAA median is "nearly double" the family- and employment-based
  medians. **[V]**
- USCIS's own caveat (quoted by the outlet): medians cover **completed** cases only; they are not the
  same as the forward-looking "processing time" shown in the case-processing-times tool. **[V]**
  During a freeze, the median is biased *downward* (only easy/early cases complete) — see §3.5.

### 3.2 Quarterly series (USCIS "Application for Adjustment of Status (Form I-485) Quarterly Report")

The official file for the latest quarter is listed on USCIS's data page as
"Application for Adjustment of Status (Form I-485) Quarterly Report (Fiscal Year 2026, Quarter 3)
(XLSX, 41.92 KB)" at `https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data`.
**[P]** The numbers below are what secondary outlets extracted from those files.

| Period | Receipts | Approvals | Denials | Completions | Approval rate | Median months (quarter) | Pending at end | Label | Source |
|---|---|---|---|---|---|---|---|---|---|
| Apr–Jun 2024 (FY24 Q3) | — | — | — | 50,627 (outlet calc.) | 98.7% | — | — | [V] | CiberCuba 20 Oct 2026; directoriocubano; 14ymedio |
| Jan–Mar 2025 (FY25 Q2) | — | — | — | — | 97.2% | — | — | [V] | American Immigration Council |
| Apr–Jun 2025 (FY25 Q3) | — | — | — | **27,602** | 93.2% | **7.5** | — | [V] | secondary analysis of USCIS quarterly data (immiva / UnoTV); directoriocubano |
| Jul–Sep 2025 (FY25 Q4) | — | — | — | — | — | 9.1 | — | [V] | immiva tracker |
| Jan–Mar 2026 (FY26 Q2) | — | — | — | — | **52.6%** | — | — | [V] | AIC; Newsweek (Q3 fell 28.9 pts vs Q2) |
| Apr–Jun 2026 (FY26 Q3) | — | **139** | **447** | **586** | **23.7%** | **16.3** | **342,360** | [V/P] | CiberCuba 20 Oct 2026; directoriocubano; Newsweek; 14ymedio |

Derived: completions fell **98%** (27,602 → 586) and approvals fell **≈99.7%** (vs. Apr–Jun 2024)
in two years. **[V]** (14ymedio headline; CiberCuba.)

### 3.3 Monthly data points

| Month | Receipts | Approvals | Denials | Pending | Avg. months (tracker) | Label | Source |
|---|---|---|---|---|---|---|---|
| Jan 2025 | — | (baseline; approvals fell 99.9% to Jan 2026) | — | — | — | [V] | Factchequeado 29 Apr 2026 |
| Jan 2026 | **7,086** | **15** | — | — | — | [V] | Factchequeado |
| May 2026 | **1,846** | **27** | **129** | **354,649** | 23.2 | [V] | inmigreat.com I-485 analytics |
| Jun 2026 | — | — | — | 355,371 (tracker) vs 342,360 (quarterly report) | — | [V] | visa.ooo / inmigreat vs. USCIS Q3 report |
| Jul 2026 | — | **308** | — | >355,000 | — | [V] | Periódico Cubano |
| Aug 2026 | — | — | — | ≈354,649 (as reported in August) | — | [V] | cubitanow; periodicocubano |

Observations **[U]**:
- Receipts are falling fast (7,086 in Jan 2026 → 1,846 in May 2026) because the last CHNV arrivals
  (Jan 2025) crossed the one-year mark in Jan 2026. The problem is now almost purely a **stock** of
  ~340–355k pending cases, not a continuing flood of new ones.
- The two "pending" figures (342,360 vs ~355,000) likely differ in definition or cut-off date
  (quarterly report vs. a tracker's monthly file). Record both and ask USCIS data owners which is
  authoritative.
- Pending ≈ 342k is roughly **3× the entire Cuban CHNV cohort**, so the queue also contains Cubans
  paroled at the border in 2021–2023, re-filers, and family members.

### 3.4 Approval rate trend (share of decisions)

98.7% (Apr–Jun 2024) → 97.2% (Jan–Mar 2025) → 93.2% (Apr–Jun 2025) → 52.6% (Jan–Mar 2026) →
23.7% (Apr–Jun 2026). **[V]** Interpretation in §8.

### 3.5 Why "11.8 months" understates the wait for a pending case

- The median is computed over **completed** cases. During Freeze #2, almost nothing eligible was
  completed, so the few completions (mostly denials of clearly ineligible or abandoned cases) do not
  describe the experience of a typical CHNV parolee whose file sat untouched.
- The quarterly median jumped to **16.3 months** once completions restarted, and a tracker computing
  age-of-pending-inventory reports **23.2 months** (May 2026). The age of the *pending* pool, not the
  median of the *completed* pool, is the right prior for an individual estimate. **[U]**
- Attorney Claudia Cañizares (Miami) says her clients wait **longer than USCIS's published times,
  even after the interview**. **[V]** (cubaenmiami; Periódico Cubano "expertos advierten".)

---

## 4. Office-level processing times (what could and could not be established)

**What the USCIS tool publishes.** The case-processing-times tool reports the time within which
80% of cases were completed, by form, sub-category and (for I-485) office. For CAA the search found
only **national** CAA figures (e.g., a law-firm page quoting "5.5 months" for CAA I-485 across all
USCIS offices, undated). Whether the tool exposes a per-office CAA breakdown must be confirmed by
hitting the API. **[U]**

**Proxy signals for Florida offices (family-based I-485 figures from trackers that scrape the USCIS
tool):**

| Office | Family-based I-485 (80th pct.) | Snapshot | Label | Source |
|---|---|---|---|---|
| Miami, FL | 26 months | ≈ Aug 2025 (page ~423 days old on 2026-10-20) | [V] | immigrationdirect.com I-485 processing-time page |
| Miami, FL | 21.5 months | Oct 2026 | [V] | wantavisa.com processing-times (Oct 2026 tracker) |
| Hialeah, Kendall, Oakland Park, Tampa, Orlando, Jacksonville, Houston, Louisville, Las Vegas, Dallas, Newark, Charlotte, Atlanta | not retrieved | — | — | needs API probe (§13) |

How to use this **[U]**: CAA cases that require an interview compete for the same field-office
interview slots as family-based cases. Miami's 21–26-month family-based figure is a sign of severe
local capacity constraints; Florida offices (Miami, Hialeah, Kendall, Oakland Park, Tampa, Orlando,
Jacksonville) hold the bulk of the Cuban caseload. Offices with small Cuban populations (Louisville,
Las Vegas, Charlotte, Dallas, Newark, Atlanta) are plausibly faster for CAA, but there is **no
retrieved evidence** of that; treat Florida-vs-elsewhere as a hypothesis the app should test with
crowdsourced data.

**Jacksonville signal:** community press reported new CAA interview appointments at the Jacksonville
field office for I-220A and humanitarian-parole applicants after PM-602-0199 (May 2026). **[V]**
(directoriocubano, "Entrevistas de USCIS para I-220A ... Jacksonville".)

---

## 5. Work permits — Form I-765 category (c)(9) (pending I-485)

### 5.1 Why some March/April 2025 filers got an EAD and others did not **[U, reasoned from verified dates]**

1. A (c)(9) I-765 filed concurrently with the I-485 in Mar/Apr 2025 was frozen by **Freeze #1**
   (14 Feb – 9 Jun 2025). Nothing was adjudicated for ~2–4 months after filing.
2. After 9 Jun 2025 USCIS resumed with "additional vetting". Those whose vetting cleared quickly got
   cards in roughly **Jul–Nov 2025** (the owner's cousin fits this pattern).
3. Any (c)(9) still pending on **2 Dec 2025** was swept into **Freeze #2**, which was later
   extended explicitly to I-765. It did not resume until **12 Jun 2026** (*Dorcas*) and, for class
   members, 24 Aug 2026 (*Red Eagle*). Those people are the "never got the EAD" group.
4. Separate from (c)(9): parole-based **(c)(11)** cards were **revoked** after 30 May 2025, so
   someone who relied on a (c)(11) card and had not yet received a (c)(9) card lost work
   authorization altogether.

### 5.2 Reported (c)(9)/I-765 timelines

| Period | Reported wait | Label | Source |
|---|---|---|---|
| Pre-2025 (baseline) | USCIS tool figures for (c)(9) in 2024 were typically a few months; the exact value was not retrievable here (La Nación's 30 Mar 2025 article quotes the USCIS table but the snippet was cut off). | [U] | lanacion.com.ar 30 Mar 2025 |
| Feb–Jun 2025 | No adjudication for parolees (Freeze #1). | [V] | AILA/UkraineTaskForce |
| Dec 2025 – Jun 2026 | I-765 added to the country hold (Freeze #2). | [V] | Ogletree "broadens scope" |
| Jun 2026 | Attorney Liudmila Marcelo: applicants waiting **up to 13 months** for work permits; advises calling USCIS and requesting InfoPass. | [V] | CiberCuba 11 Jun 2026 |
| FY2025 → FY2026 (I-765 with adjustment pending) | Pending inventory rose from **154,469 to 373,007** (Q4 2024 → Q4 2025) per one report, or **154,469 → 461,884** per another; denial rate **5.1% → 13.6%**; "theoretical time to clear" **9.4 → 18.6 months**. | [V, two figures conflict] | Periódico Cubano "USCIS frena permisos de trabajo"; cubitanow "USCIS endurece el sistema" |

### 5.3 Rule changes that matter for 2025 filers

- Renewals filed **on/after 30 Oct 2025** no longer receive the automatic 540-day extension; a
  renewal receipt notice filed under the new rules does **not** extend the card. Renewals filed
  before that date keep the 540-day extension if timely and category-matched. **[V]** (CiberCuba
  18 Oct 2026; CubaHeadlines 343165.)
- Since **Dec 2025**, certain EADs are valid for a maximum of **18 months** instead of up to five
  years. **[V]** (CiberCuba; Cuba Bajo Lupa.)
- **12 Dec 2025** biometrics change: no reuse of previously collected biometrics for certain
  applications; photos must be taken at an ASC. **[V]** (iss.washington.edu.)

**App implication:** a (c)(9) card issued in late 2025 may expire in 2027 with no automatic
extension; the app should track EAD issue/expiry dates and warn users to file renewals ~180 days
before expiry.

---

## 6. Biometrics appointment lags

No quantitative source on ASC appointment lag for CAA filers was retrievable in this run. What is
known:

- Biometrics scheduling generally continued through both freezes (the holds were on
  *adjudication*), so most 2025 filers have biometrics done. **[L]**
- The 12 Dec 2025 change ends biometrics reuse for certain applications, so expect **additional
  ASC appointments** on EAD renewals and possibly before interviews. **[V]**
- A 3 Nov 2025 proposed rule would expand biometrics requirements and impose an "extraordinary
  circumstances" standard for missed appointments; it is a proposal, not in force as of the sources
  found. **[V]** (govinfo FR 2025-19747.)
- Missing a biometrics appointment is a classic route to **denial for abandonment**, and the
  denial-heavy Q3 FY2026 mix (§8) may include such cases. **[U]**

---

## 7. Interviews versus interview waivers for CAA

| Era | Practice | Label | Source |
|---|---|---|---|
| 2022–2024 | Most CAA cases decided **without** an interview; USCIS may schedule one at its discretion. | [V] | CiberCuba CAA guide |
| 2026 | Community press: USCIS "tightening" adjustment interviews; new CAA interview notices reported (Jacksonville); guidance now advises applicants to *expect* an interview even though the 19-country pause was annulled on 5 Jun 2026. | [V] | cubafull; directoriocubano (Jacksonville; "demoras tras la entrevista"); CiberCuba guide |
| Dec 2025 – Jun 2026 | PM-602-0192 required a "thorough re-review", including potential interview and re-interview, of approved benefits for nationals of listed countries who entered on/after 20 Jan 2021. Vacated 5 Jun 2026; USCIS appealed. | [V] | Dorsey; Asian Law Caucus; USCIS alert |
| May 2026 → | PM-602-0199 treats adjustment as discretionary/extraordinary; reportedly drives more interviews. CAA carve-out claimed by one outlet, unconfirmed. | [V/U] | directoriocubano; cubafull |

No source gave an **interview rate** (share of CAA cases interviewed). Attorneys report that even
interviewed cases wait months for a decision afterward. **[V]** (directoriocubano; cubaenmiami.)

---

## 8. RFEs, NOIDs and denials

**Quantified:** 447 denials vs 139 approvals in Apr–Jun 2026; approval share fell from 52.6% (Q2) to
23.7% (Q3). **[V]** Earlier: 93.2% approvals in Apr–Jun 2025, 98.7% in Apr–Jun 2024. **[V]**
One outlet notes USCIS denied more CAA cases in those three months than in the prior six months
combined. **[V]** (cubaenmiami.)

**Why the 2026 denial share is probably a selection effect [U]:**
1. During Freeze #2, eligible Cuban cases were *held*; the completions that did occur were
   disproportionately those USCIS could close without adjudicating the merits in the applicant's
   favor (abandonment, missed biometrics, withdrawals, clearly ineligible filers).
2. A large share of denials likely involve **I-220A** entrants, who are generally not considered
   "admitted or paroled" for CAA purposes under recent BIA precedent and therefore ineligible. **[V]**
   (cubanoticias360; CiberCuba guide.) CHNV parolees are *not* in this group: they were paroled
   under INA 212(d)(5), which is what the CAA requires.
3. A policy cited by CiberCuba as **PA-2026-05** allegedly allows outright denial, without RFE or
   NOID, when required initial evidence is missing. **[U — could not be verified on uscis.gov.]**
4. Termination of CHNV parole in 2025 does not, by itself, undo the fact that the applicant *was*
   paroled; the CAA's text requires having been "inspected and admitted or paroled". No source
   found reported denials of CHNV-parolee CAA cases on a "parole terminated" theory. **[L — verify
   in the USCIS Policy Manual's CAA guidance and recent AAO/BIA decisions.]**
5. The BIA's *Matter of Roque-Izada* (June 2025) limits termination of removal proceedings merely to
   let a respondent pursue CAA adjustment before USCIS; relevant only for people in proceedings.
   **[V]**

**RFE frequency:** no data found. The app should collect it.

---

## 9. Community-reported timelines (what was retrievable)

Reddit, Trackitt and Facebook groups could not be accessed in this run. The following are
practitioner and press reports:

| Date | Report | Label | Source |
|---|---|---|---|
| 30 Mar 2025 | La Nación explainer on how long a Cuban migrant's work permit takes (cites USCIS table). | [V, value not captured] | lanacion.com.ar |
| 11 Jun 2026 | Attorney Liudmila Marcelo: clients waiting up to **13 months** for EADs. | [V] | CiberCuba |
| 2026 | Attorney Claudia Cañizares: CAA clients wait longer than USCIS's published medians, including after interviews. | [V] | cubaenmiami; Periódico Cubano |
| 2026 | "Demoras en la residencia por Ajuste Cubano: una abogada advierte de esperas tras la entrevista." | [V] | directoriocubano |
| mid-2026 | New CAA interview appointments reported in Jacksonville. | [V] | directoriocubano |
| Aug 2026 | ≈354,649 Cubans with pending CAA applications; "Hasta cuándo la espera". | [V] | cubitanow; Periódico Cubano |
| Sep–Oct 2026 | "Cubanos con parole reciben nuevas decisiones de USCIS tras meses de espera" — attorneys report favorable decisions after months of silence, no general pattern confirmed. | [V] | asere.com |
| 6 Oct 2026 | CAA green card "already taking almost a year"; wait tripled since 2023. | [V] | CiberCuba / CubaHeadlines |
| 20 Oct 2026 | Only 139 Cubans obtained residency Apr–Jun 2026; 447 denied. | [V] | CiberCuba |

**Template the app should use for crowdsourced timelines** (one row per case; all dates optional):
filing date → receipt-notice date → biometrics date → (c)(9) EAD approval date → interview-notice
date → interview date → RFE/NOID date(s) → decision date → card-received date; plus field office,
state, entry type (CHNV parole / other parole / I-220A), concurrent I-765 (y/n), attorney (y/n).

---

## 10. Are March/April 2025 filings being approved now?

**Evidence [V]:** (a) approvals restarted after 12 Jun 2026 — 308 in July 2026 vs 139 in the whole
Apr–Jun quarter; (b) attorneys reported Cuban parolees receiving fresh decisions in Sept–Oct 2026;
(c) the FY2026-to-date median rose to 11.8 months and the Q3 median to 16.3 months, which is only
possible if cases filed in early-to-mid 2025 are among those being completed.

**Rate [U]:** the July 2026 pace (~300 approvals/month) against ~350k pending is negligible
(<0.1%/month). No source gives August–September 2026 counts; the FY2026 Q4 quarterly report (Jul–Sep
2026) is the next official checkpoint and should be ingested the day it appears.

**Conclusion:** yes, March/April 2025 cases *can* be and *are* being approved as of autumn 2026, but
at a rate that so far reaches only a small fraction of the cohort each month.

---

## 11. Estimated time-to-decision for a CAA I-485 filed March/April 2025

### 11.1 Method (a simple FIFO queue model) **[U]**

Let *P* = pending cases filed before the applicant, *C* = monthly completions (approvals + denials)
that USCIS devotes to CAA cases. Expected months to decision ≈ *P* / *C*, adjusted for the fact that
USCIS is not perfectly first-in-first-out (interview scheduling and office capacity matter) and that
cases without interviews can be approved centrally.

**Where in the queue is a Mar/Apr 2025 filer?** Under FY2025 behavior (median 7–9 months), most
cases filed before ~Feb 2025 were decided before Freeze #2 began on 2 Dec 2025. The pending pool of
~342–355k therefore consists mainly of cases filed from roughly **spring 2025 onward**, with the
Mar/Apr 2025 cohort at or near the **front** of that queue. Estimate *P* ≈ 10–20% of the pool
(≈35–70k cases), acknowledging this is a guess.

**Throughput scenarios (national completions per month):**

| Scenario | *C* / month | Basis | Months to reach the Mar/Apr 2025 cohort (*P* ≈ 35–70k) |
|---|---|---|---|
| A. Summer-2026 pace | ≈ 600 (308 approvals + unknown denials) | Jul 2026 data | 60–120 (effectively "years") |
| B. Half of FY2025 pace | ≈ 4,600 | 27,602/quarter ÷ 2 | 8–15 |
| C. FY2025 pace | ≈ 9,200 | 27,602/quarter | 4–8 |
| D. FY2024 pace | ≈ 16,900 | 50,627/quarter | 2–4 |

Scenario A is the observed starting point in July 2026; the *Red Eagle* injunction (24 Aug 2026) and
the reports of new decisions in Sept–Oct 2026 suggest the agency has moved toward B. A return to C or
D is unlikely in the near term because of interview-heavy adjudication (PM-602-0199), new biometrics
requirements, staffing shifted to enforcement, and pending appeals that keep policy unstable.

### 11.2 Point estimates (measured from 20 Oct 2026)

| Applicant profile | Most likely decision window | Median from today | 80% interval | Total time from filing (median) | Confidence |
|---|---|---|---|---|---|
| **Florida** (Miami, Hialeah, Kendall, Oakland Park, Tampa, Orlando, Jacksonville); EAD received; biometrics done; no RFE; CHNV parole with I-94 | **Q2–Q3 2027** | ≈ 9–10 months | 3 – 24+ months | ≈ 27–29 months | **LOW** |
| **Other states** (Houston, Louisville, Las Vegas, Dallas, Newark, Charlotte, Atlanta); same milestones | **Q1–Q2 2027** | ≈ 6–8 months | 2 – 18 months | ≈ 24–27 months | **LOW** |
| Any state, **no EAD yet** (I-765 still pending) | EAD first, typically within 1–4 months of resumption; I-485 as above | — | — | — | **LOW** |
| Any state, **interview already held**, awaiting decision | 1–6 months (attorneys report multi-month post-interview waits) | ≈ 3 months | 1–9 months | — | **LOW–MEDIUM** |
| Any state, **RFE/NOID received** | add 2–6 months after response | — | — | — | **LOW** |
| I-220A entrant (not CHNV parole) | high denial risk regardless of timing | — | — | — | MEDIUM (eligibility, not timing) |

**Why Florida is estimated slower [U]:** the state concentrates most of the ~340k pending CAA cases,
its field offices already show 21–26-month family-based I-485 times, and interview-driven
adjudication is office-capacity-bound. **Why the gap is modest:** many CAA cases are still decided
without interview at service centers, which diffuses the Florida bottleneck. The app must treat the
Florida penalty (here ≈ +2–3 months) as a parameter to be learned from crowdsourced data.

**Probability of a decision by 31 Dec 2026 [U]:** ≈ 10–20% for Florida filers, ≈ 15–25% elsewhere.

**Approval probability conditional on decision [U]:** for a genuine CHNV parolee with a clean record
and complete file, historically 93–99%; the 2026 headline approval rates (23–53%) should **not** be
applied to this profile for the selection reasons in §8. Use ≈ 85–90% until post-freeze decision mix
data (FY2026 Q4, FY2027 Q1) are available.

**Key downside risks:** (1) the First Circuit reverses *Dorcas* and USCIS narrows compliance to
*Red Eagle* class members only; (2) new policy memos re-impose holds in a different form (the
Forbes 17 Aug 2026 piece reports restrictions across all legal-immigration categories); (3) re-review
of approved cases creates re-interviews even after approval.

---

## 12. Implications for the app, data pipeline and estimator

1. **Ingest the official quarterly I-485 report XLSX** (USCIS "Immigration and Citizenship Data"
   page) every quarter; extract the CAA row (receipts, approvals, denials, pending). Keep both the
   quarterly-report pending figure and any monthly-file figure; show the discrepancy rather than
   hide it.
2. **Ingest the USCIS historical-median page and the processing-times API** (endpoint patterns to
   verify: `/processing-times/api/forms`, `/processing-times/api/formtypes/I-485`,
   `/processing-times/api/formoffices/I-485/{subtype}`,
   `/processing-times/api/processingtime/I-485/{office}/{subtype}`), snapshot daily, and store the
   history ourselves — third-party trackers (immiva, immigrationdirect, wantavisa, inmigreat, visa.ooo)
   show that nobody keeps a reliable public archive.
3. **Model regimes, not a single processing time.** The estimator needs explicit freeze windows
   (14 Feb–9 Jun 2025; 2 Dec 2025–12 Jun 2026 / 24 Aug 2026) and a "policy-risk" state driven by
   court/agency events, because a filing date's expected timeline depends on which regimes the case
   lived through.
4. **Use a cohort/survival approach:** estimate time-to-decision per filing-month cohort from
   crowdsourced milestones, with the official pending/completion counts as the throughput prior
   (queue model in §11.1). Report intervals, not points.
5. **Separate milestones:** receipt → biometrics → (c)(9) EAD → interview → decision → card; each has
   its own regime sensitivity (EADs were frozen in both freezes; biometrics mostly were not).
6. **Field office is a first-class input** but its effect is currently unmeasured for CAA; collect
   it and start with a modest Florida penalty (+2–3 months) that the data can overturn.
7. **Entry-type gating:** CHNV parole (I-94 class "DT"/parole) vs. other parole vs. I-220A changes
   eligibility far more than timing; the app must ask and warn.
8. **EAD-renewal alerts:** compute expiry from issue date (18-month validity post-Dec 2025) and warn
   at 180 days, noting the loss of the 540-day automatic extension for renewals filed on/after
   30 Oct 2025.
9. **Event feed:** subscribe to USCIS newsroom alerts, AILA litigation updates and the
   uscis-pause-tracker.com case list; a Dorcas reversal would be the single most important alert.
10. **Spanish-first UX and sources:** the richest data is in Cuban-diaspora media (CiberCuba,
    14ymedio, Periódico Cubano, directoriocubano, cubaenmiami, asere, cubitanow); build a scraper
    for their USCIS-data stories as a leading indicator between quarterly reports.

---

## 13. Open questions and exact follow-up probes (for an agent with network access)

1. `curl -sS "https://egov.uscis.gov/processing-times/api/formtypes/I-485"` — confirm the CAA
   sub-type key; then `/formoffices/I-485/<key>` to learn whether CAA has per-office data; then
   `/processingtime/I-485/<office>/<key>` for MIA, HIA (Hialeah), KEN (Kendall), OAK (Oakland Park),
   TAM, ORL, JAX, HOU, LOU, LVG, DAL, NEW, CLT, ATL (office codes to be confirmed from the
   `formoffices` response).
2. `https://egov.uscis.gov/processing-times/historic-pt` — pull the CAA row for FY2019–FY2026 and the
   I-765 (c)(9) row.
3. Wayback Machine: `https://web.archive.org/cdx/search/cdx?url=egov.uscis.gov/processing-times/*&from=2023&output=json`
   to rebuild a monthly history of the CAA national figure.
4. Download the FY2024 Q1 – FY2026 Q3 "Form I-485 Quarterly Report" XLSX files from
   `https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data` and tabulate
   the CAA row; reconcile the 342,360 vs 354,649/355,371 pending discrepancy.
5. Find the inmigreat/visa.ooo monthly source (likely a USCIS monthly I-485 file) and ingest it.
6. Reddit: `https://www.reddit.com/r/USCIS/search.json?q=cuban%20adjustment&restrict_sr=1&sort=new`
   and r/cuba, r/immigration; Trackitt I-485 tracker filtered to "Cuban Adjustment Act"; Facebook
   groups "Ley de Ajuste Cubano 2025/2026" (manual).
7. Verify PA-2026-05 (denial without RFE/NOID) and whether PM-602-0199 excludes the CAA, on uscis.gov.
8. Pull the *Red Eagle Law v. Edlow* (3:26-cv-04850-CRB) and *Dorcas* (26-cv-00132-JJM-PAS)
   orders from CourtListener/RECAP and the First Circuit docket status.
9. Search CiberCuba/14ymedio for August and September 2026 monthly approval counts and for any
   USCIS statement on CAA interview policy.
10. Obtain OHSS/USCIS counts of Cubans paroled under CHNV by month (to size filing cohorts) and any
    FOIA'd I-485 CAA data by field office.

---

## 14. Sources (all accessed 2026-10-20)

Official / primary
- USCIS, Immigration and Citizenship Data (lists "Application for Adjustment of Status (Form I-485) Quarterly Report (Fiscal Year 2026, Quarter 3)"): https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data
- USCIS, Litigation-Related Update: Supreme Court stay of CHNV Preliminary Injunction: https://www.uscis.gov/newsroom/alerts/litigation-related-update-supreme-court-stay-of-chnv-preliminary-injunction
- USCIS, Court Order on Hold Policies (Dorcas compliance): https://www.uscis.gov/newsroom/alerts/court-order-on-hold-policies
- USCIS, DHS Ends the Abuse of the Humanitarian Parole Process and Terminates Family Reunification Parole Programs: https://www.uscis.gov/newsroom/alerts/dhs-ends-the-abuse-of-the-humanitarian-parole-process-and-terminates-family-reunification-parole
- USCIS, SAVE FAQs on changes to parole and TPS: https://www.uscis.gov/save/current-user-agencies/guidance/faqs-on-the-effect-of-changes-to-parole-and-temporary-protected-status-tps-for-save-agencies
- USCIS Policy Manual, Vol. 1 Part E Ch. 8 (Discretionary Analysis): https://www.uscis.gov/policy-manual/volume-1-part-e-chapter-8
- USCIS processing times tool / historical medians (not reachable from this environment): https://egov.uscis.gov/processing-times/ and https://egov.uscis.gov/processing-times/historic-pt
- DHS Federal Register notice terminating CHNV parole (public inspection): https://public-inspection.federalregister.gov/2025-05128.pdf
- Federal Register, proposed biometrics rule, 3 Nov 2025: https://www.govinfo.gov/content/pkg/FR-2025-11-03/html/2025-19747.htm
- Doe v. Noem docket (D. Mass. 1:25-cv-10495), order on stay of parole truncation: https://docs.justia.com/cases/federal/district-courts/massachusetts/madce/1:2025cv10495/281389/97
- Doe v. Noem RECAP filing: https://storage.courtlistener.com/recap/gov.uscourts.mad.281389/gov.uscourts.mad.281389.199.3.pdf
- Civil Rights Litigation Clearinghouse, Doe v. Noem: https://clearinghouse.net/case/46186/

Litigation trackers and legal analyses
- PressUnpause USCIS Adjudication Pause Tracker: https://uscis-pause-tracker.com/ ; Doe v. Noem page: https://uscis-pause-tracker.com/cases/786112b9-99ff-4b65-a3d7-b59cdd1edc38 ; Red Eagle Law v. Edlow page: https://uscis-pause-tracker.com/cases/f9143399-ca53-41e2-8a65-c44e9174f6a3
- Justice Action Center, Svitlana Doe v. Noem: https://justiceactioncenter.org/case/svitlana-doe-v-noem/ ; class action page: https://justiceactioncenter.org/svitlana-doe-v-noem-class-action/ ; 28 May 2025 press release: https://justiceactioncenter.org/news/judge-orders-trump-administration-to-restore-processing-of-immigration-benefit-applications-for-humanitarian-parole-recipients-and-certifies-nationwide-class-to-ensure-all-impacted-individuals-are-pro/ ; litigation tracker: https://litigationtracker.justiceactioncenter.org/cases/svitlana-doe-v-noem-humanitarian-parole-district-court
- AILA, Supreme Court stay of CHNV PI: https://www.aila.org/library/uscis-litigation-related-update-supreme-court-stay-of-chnv-preliminary-injunction
- AILA, District Court PI lifting adjudication hold (Red Eagle): https://www.aila.org/library/district-court-issues-preliminary-injunction-to-lift-adjudication-hold-for-travel-ban-countries
- AILA, USCIS compliance with Red Eagle PI: https://www.aila.org/library/uscis-announces-compliance-with-preliminary-injunction-to-lift-adjudication-hold-for-travel-ban-countries
- AILA, USCIS compliance with Dorcas vacatur: https://www.aila.org/library/uscis-announces-compliance-with-court-order-vacating-hold-policies
- Visa Lawyer Blog, judge lifts pause (2 Jun 2025): https://www.visalawyerblog.com/breaking-federal-judge-lifts-pause-on-immigration-applications-for-parolees-of-uniting-for-ukraine-military-parole-in-place-chnv-frp/
- Ukraine Task Force, pause announced: https://ukrainetaskforce.org/uscis-pauses-applications-for-tps-asylum-adjustment-eads-and-other-immigration-benefits-for-parolees/ ; pause lifted: https://ukrainetaskforce.org/federal-judge-orders-dhs-to-lift-administrative-pause-on-parolee-applications-filed-to-uscis/
- Littler, USCIS lifts administrative pause: https://www.littler.com/news-analysis/asap/uscis-lifts-administrative-pause-immigration-applications-filed-uniting-ukraine
- Saluja Law, USCIS resumes processing for parolees: https://www.salujalaw.com/uscis-resumes-processing-immigration-applications-for-parolees-after-court-order-what-it-means-for-individuals-and-employers
- Lear Immigration, judge orders USCIS to resume U4U processing: https://www.learimmigration.com/federal-judge-orders-uscis-to-resume-processing-immigration-benefits-for-u4u-parolees
- Fragomen, Supreme Court permits termination of CHNV: https://www.fragomen.com/insights/united-states-supreme-court-permits-termination-of-parole-program-for-cubans-haitians-nicaraguans-and-venezuelans-as-litigation-continues.html
- Welcome.US explainer on parole changes: https://welcome.us/explainers/latest-changes-to-humanitarian-parole-programs-including-private-sponsorship-programs
- Asian Law Caucus, USCIS pause guide: https://www.asianlawcaucus.org/news-resources/guides-reports/travel-ban-asylum-immigration-benefits
- Clark Hill, pause for 19 countries: https://www.clarkhill.com/news-events/news/uscis-announces-pause-on-benefits-adjudications-for-individuals-from-19-countries/
- Fredrikson, hold on asylum and benefits for 19 countries: https://www.fredlaw.com/alert-alert-uscis-announces-immediate-hold-on-asylum-applications-and-immigration-benefits-for-foreign-nationals-of-19-high-risk-countries
- Dorsey, processing hold and re-review: https://www.dorsey.com/newsresources/publications/client-alerts/2025/12/uscis-benefit--applications
- Antone, summary of 2 Dec 2025 memo: https://antone.com/summary-of-the-december-2-2025-uscis-policy-memorandum/
- Ogletree, pause for high-risk countries: https://ogletree.com/insights-resources/blog-posts/uscis-pauses-benefit-requests-for-nationals-from-high-risk-countries-and-halts-asylum-adjudications/ ; broadened hold: https://ogletree.com/insights-resources/blog-posts/uscis-broadens-scope-of-adjudication-hold-for-pending-benefit-requests-of-certain-foreign-nationals/
- Shautsova, 1 Jan 2026 memo (39 countries): https://shautsova.com/2026/01/11/uscis-shocks-immigration-community-with-january-1-2026-memo-pause-on-benefits-for-nationals-from-39-countries-and-review-of-refugees-admitted-2021-2025/
- NPR, 3 Dec 2025, pause for 19 countries: https://npr.org/2025/12/03/g-s1-100218/trump-administration-halts-immigration-19-nations
- NPR, 28 Apr 2026, immigrants from travel-ban countries in limbo: https://www.npr.org/2026/04/28/nx-s1-5775869/trump-travel-ban-pause-limbo-professionals
- Phillips Lytle, judge rules pause unlawful (Kobick): https://phillipslytle.com/federal-judge-rules-the-pause-in-adjudication-of-immigration-benefits-for-citizens-of-travel-ban-countries-is-unlawful/
- Cyrus Mehta, Dorcas v. USCIS: https://blog.cyrusmehta.com/2026/06/dorcas-v-uscis-federal-court-reaffirms-that-uscis-must-adjudicate-not-stonewall-immigration-benefits.html
- immigrationissues.com, USCIS confirms compliance with Dorcas: https://www.immigrationissues.com/uscis-confirms-it-will-comply-with-the-dorcas-vacatur-of-the-country-hold-policies/
- Gunster, USCIS compliance with Dorcas: https://www.gunster.com/newsroom/publications/uscis-announces-compliance-with-the-u-s-district-courts-decision-vacating-benefits-hold-policies-and-the-country-specific-factors-policy-for-firty-nine-39-trvel-ban-countries
- Manifest Law, policies vacated: https://manifestlaw.com/news/district-court-vacates-uscis-policies-06-08-2026
- Caribbean National Weekly, judge strikes down hold policies: https://www.caribbeannationalweekly.com/posts/federal-judge-strikes-down-uscis-immigration-hold-policies-orders-nationwide-halt-reversal
- NEPYORK, USCIS halts hold-and-review policies: https://nepyork.com/2026/06/12/uscis-halts-immigration-hold-and-review-policies-following-federal-court-ruling/
- Law Firm 4 Immigrants, vacatur explained: https://www.lawfirm4immigrants.com/uscis-court-order-vacating-immigration-hold-policies/
- Clinch Law, Red Eagle class certification: https://news.clinchlaw.com/tr/article/federal-court-enjoins-uscis-hold-policies-certifies-class-of-applicants-from-39--mtdmav0a
- Agarwal Law Group, court blocks adjudication freeze: https://www.agarwalimmigration.com/insights/court-blocks-uscis-adjudication-freeze-for-travel-ban-countries
- Ilabaca Law, Doe v. Trump (266 plaintiffs): https://ilabacalaw.com/blog/immigration-news/federal-court-just-ordered-uscis-to-lift-the-adjudicative-hold-for-266-plaintiffs-from-the-39-country-list-doe-v-trump/
- Path2Immigration, court lifts holds: https://www.path2immigration.com/blog/court-lifts-uscis-adjudication-holds-2026/
- VisaVerge, judge blocks travel-ban enforcement rules: https://www.visaverge.com/news/judge-blocks-travel-ban-enforcement-rules-uscis-policies-unlawful-in-preliminary-injunction/ ; Cuban residency paths 2026: https://www.visaverge.com/news/trump-policy-change-could-end-residency-for-thousands-of-cubans/
- Latin Times, court orders USCIS to resume stalled applications: https://www.latintimes.com/federal-court-orders-uscis-resume-stalled-green-card-work-permit-applications-598968
- Forbes (Stuart Anderson), 17 Aug 2026: https://www.forbes.com/sites/stuartanderson/2026/08/17/trump-officials-now-restricting-all-legal-immigration-categories/
- American Immigration Council, USCIS backlog grows: https://www.americanimmigrationcouncil.org/blog/uscis-backlog-grows-less-immigration-filings/
- Newsweek, green card approval rate drops: https://www.newsweek.com/green-card-approval-rate-drops-for-3-major-categories-12578953

Processing-time trackers and law-firm pages
- immiva, I-485 processing time 2026: https://immiva.com/blog/i-485-processing-time ; by form: https://immiva.com/blog/uscis-processing-times-by-form
- ImmigrationDirect, Form I-485 processing time: https://www.immigrationdirect.com/blog/form-i-485-processing-time/
- WantaVisa, case processing times: https://www.wantavisa.com/processing-times.php
- Boundless, USCIS processing times: https://www.boundless.com/immigration-resources/uscis-processing-times
- inmigreat, I-485 analytics: https://www.inmigreat.com/en/analytics/i-485/
- visa.ooo, I-485: https://visa.ooo/forms/i-485/
- Lluis Law, Cuban Adjustment Act: https://lluislaw.com/cuban-adjustment-act/
- Casais Law, Is the CAA still valid (2026): https://casaislaw.com/is-the-cuban-adjustment-act-still-valid-updated-guide-for-2026-applicants/ ; adjustment process: https://casaislaw.com/cuban-immigration-to-the-u-s-how-the-adjustment-process-works/ ; proposed changes: https://casaislaw.com/will-the-cuban-adjustment-act-survive-proposed-immigration-changes/
- Williams Law, CAA: https://bwea.com/cuban-adjustment-act-caa/
- FedLaws, Cuban migration overview: https://fedlaws.org/cuban-migration-to-the-us-adjustment-act-parole-and-asylum/

Spanish-language and Cuban-diaspora media
- CiberCuba (EN), 6 Oct 2026, CAA green card taking almost a year: https://en.cibercuba.com/noticias/2026-10-06-u1-e135253-s27061-nid342034-green-card-ley-ajuste-cubano-tarda-casi-ano-tiempo
- CubaHeadlines mirror: https://www.cubaheadlines.com/articles/342034
- CiberCuba (EN), 20 Oct 2026, only 139 Cubans obtained residency Apr–Jun: https://en.cibercuba.com/noticias/2026-10-20-u1-e135253-s27061-nid343309-solo-139-cubanos-obtuvieron-residencia-ley-ajuste
- CiberCuba (EN), 11 Jun 2026, thirteen months waiting for a work permit: https://en.cibercuba.com/noticias/2026-06-11-u1-e208574-s27061-nid331888-trece-meses-esperando-permiso-trabajo-abogada
- CiberCuba (EN), 28 Mar 2025, U.S. revokes work permits for parole beneficiaries: https://en.cibercuba.com/noticias/2025-03-28-u1-e208574-s27061-nid299827-eeuu-revoca-permisos-trabajo-beneficiarios-parole
- CiberCuba (EN), 18 Oct 2026, renewing work permit after end of automatic extension: https://en.cibercuba.com/noticias/2026-10-18-u1-e129488-s27061-nid343165-renovar-permiso-trabajo-quedarte-empleo-guia-cubanos ; CubaHeadlines mirror: https://www.cubaheadlines.com/articles/343165
- CiberCuba (EN), 17 Oct 2026, expired parole options: https://en.cibercuba.com/noticias/2026-10-17-u1-e129488-s27061-nid343101-te-vencio-parole-pasa-ahora-opciones-tienen-cubanos ; mirror: https://www.cubaheadlines.com/articles/343101
- CiberCuba guide, Ley de Ajuste Cubano paso a paso: https://www.cibercuba.com/s/inmigracion-eeuu/guias/una-vez-en-eeuu/ley-ajuste-cubano
- 14ymedio, aprobaciones caen 99,7%: https://www.14ymedio.com/cuba/migracion/aprobaciones-residencia-ley-ajuste-cubano_1_1132080.html
- Factchequeado, 29 Apr 2026, green cards y arrestos de ICE: https://factchequeado.com/teexplicamos/20260429/cubanos-green-cards-arrestos-ice/
- UnoTV, aprobaciones caen 99% y la espera supera 16 meses: https://www.unotv.com/us/inmigracion-us/ley-de-ajuste-cubano-las-residencias-aprobadas-caen-mas-de-99/ ; por qué un año no basta: https://www.unotv.com/us/actualidad-us/green-card-para-cubanos-por-que-un-ano-en-ee-uu-no-basta-ante-la-caida-de-aprobaciones/
- Cuba en Miami, USCIS negó más casos en tres meses: https://www.cubaenmiami.com/uscis-nego-mas-casos-de-ajuste-cubano-en-tres-meses-que-durante-los-seis-meses-anteriores/ ; abogada cuestiona los tiempos: https://www.cubaenmiami.com/residencia-para-cubanos-abogada-cuestiona-los-tiempos-de-uscis-frente-a-la-espera-que-ve-en-la-practica/
- Directorio Cubano, 447 negativas frente a 139 aprobadas: https://www.directoriocubano.info/tramites-usa/ley-ajuste-cubano-aprobaciones-negativas-2026/ ; cada vez menos residencias: https://www.directoriocubano.info/cuba/cada-vez-menos-residencias-ley-ajuste-cubano-fin-sin-derogarla/ ; demoras tras la entrevista: https://www.directoriocubano.info/estados-unidos/demoras-residencia-ajuste-cubano-entrevista/ ; entrevistas en Jacksonville: https://www.directoriocubano.info/acontecer/entrevistas-uscis-i-220a-ajuste-cubano-jacksonville/
- Asere, cubanos con parole reciben nuevas decisiones: https://www.asere.com/cubanos-con-parole-reciben-nuevas-decisiones-de-uscis-tras-meses-de-espera/
- Periódico Cubano, green cards aprobadas en julio: https://www.periodicocubano.com/cuantas-green-cards-aprobo-uscis-bajo-la-ley-de-ajuste-cubano-en-julio-miles-siguen-a-la-espera/ ; USCIS frena permisos de trabajo: https://www.periodicocubano.com/uscis-frena-permisos-de-trabajo-y-solicitudes-de-parole/ ; USCIS acelera aprobaciones: https://www.periodicocubano.com/uscis-acelera-aprobaciones-de-residencias-por-la-ley-de-ajuste-cubano/ ; expertos advierten sobre demoras: https://www.periodicocubano.com/expertos-advierten-sobre-demoras-de-uscis-residencias-para-cubanos-tardan-mas-de-lo-anunciado/ ; nueva regla de USCIS: https://www.periodicocubano.com/cubanos-con-green-card-en-tramite-por-ley-de-ajuste-enfrentan-nueva-regla-de-uscis/
- Cubita Now, hasta cuándo la espera: https://noticias.cubitanow.com/hasta-cundo-la-espera-de-cubanos-por-la-green-card ; USCIS endurece el sistema: https://noticias.cubitanow.com/cubano-angel-fournier-se-llevo-el-bronce-en-copa-del-mundo-de-remo/uscis-endurece-el-sistema-ms-rechazos-de-parole-menos-permisos-de-trabajo-y-millones-de-trmites-acumulados
- CubaFull, USCIS endurece las entrevistas: https://cubafull.com/noticia/uscis-entrevistas-ajuste-estatus
- Cuba Noticias 360, Ley de Ajuste 2026 e I-220A: https://www.cubanoticias360.com/ley-ajuste-cubano-2026-residencia-i220a/
- Cuba Bajo Lupa, permiso de trabajo 2026: https://www.cubabajolupa.com/permiso-de-trabajo-para-cubanos-en-ee-uu-en-2026-quienes-pueden-solicitarlo-cuanto-cuesta-y-cuanto-demora/
- La Nación (AR), 30 Mar 2025, cuánto tarda el permiso de trabajo: https://www.lanacion.com.ar/estados-unidos/visas-y-tramites/cuanto-tarda-en-llegar-el-permiso-de-trabajo-como-migrante-cubano-en-estados-unidos-nid30032025/
- Mario Pentón, USCIS complica permisos de trabajo: https://www.mariopenton.com/uscis-complica-permisos-de-trabajo-para-cubanos-en-eeuu/
- Requisitos USA, Ley de Ajuste Cubano 2026: https://info.requisitos-usa.com/ley-de-ajuste-cubano/

Background
- Wikipedia, Parole for Cubans, Haitians, Nicaraguans, and Venezuelans: https://en.wikipedia.org/wiki/Parole_for_Cubans,_Haitians,_Nicaraguans,_and_Venezuelans
- Wikipedia, Cuban Adjustment Act: https://en.wikipedia.org/wiki/Cuban_Adjustment_Act
- Yale OISS notice on CHNV termination: https://oiss.yale.edu/node?page=33
- University of Washington ISS, USCIS photo and biometrics update: https://iss.washington.edu/uscis-update-photo-and-biometrics-requirements
