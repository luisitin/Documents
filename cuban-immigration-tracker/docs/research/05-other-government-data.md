# 05 — Non-USCIS government data sources for Cuban parolees and Cuban Adjustment Act green cards

**Research date:** 2026-10-20 (all URLs accessed or located via web search on this date unless noted)
**Scope:** every *non-USCIS* public data source that can feed the Cuban Immigration Tracker app: DHS Office of Homeland Security Statistics (OHSS), CBP, the Federal Register API, CourtListener/RECAP, Census ACS, EOIR, CRS/GAO reports, and state-level refugee-services data. USCIS's own datasets (processing times, quarterly I-485 reports, EAD data) are covered in a sibling research document and are referenced here only where a non-USCIS source overlaps.

## 0. How to read this document (and what could not be verified)

**Confidence labels used throughout**

| Label | Meaning |
|---|---|
| **[verified]** | The claim comes from a primary source (ohss.dhs.gov, cbp.gov, federalregister.gov, a court filing, census.gov, congress.gov) or a reputable secondary source that quoted the primary one, surfaced in today's searches. |
| **[likely]** | Consistent across several secondary sources (law firms, advocacy trackers, Cuban community press), or from my prior knowledge of a stable government product (table numbering, API syntax) that today's searches partly confirmed. Re-verify before shipping. |
| **[uncertain]** | Prior knowledge that today's searches could *not* confirm, or sources that conflict. Treat as a hypothesis to test when the ingestion job is written. |

**Sandbox limitations that affected this research (important for the reader):**

1. Direct HTTPS from this environment to every government and court host was refused by the session's egress proxy (`CONNECT ... 403` for `ohss.dhs.gov`, `www.federalregister.gov`, `www.courtlistener.com`, `api.census.gov`, `www.dhs.gov`, `www.supremecourt.gov`, etc.). Both `curl` and the page-fetch tool failed. **Therefore the Federal Register and CourtListener API "tests" requested in the task could not be executed.** The exact commands I attempted are recorded verbatim in sections 3.4 and 4.5 so the project owner can run them from a normal machine. They were constructed from the public API documentation and should work unchanged.
2. The shared web-search budget for this workflow run was exhausted after ~32 searches, before I could finish the state-level (Florida/Kentucky/Texas/Nevada) and GAO sub-topics. Those sections are therefore thinner and carry more **[uncertain]** labels, and section 11 lists exactly what to look up next.
3. **Fact-check and editorial pass, 2026-10-20 (added after the original draft):** a reviewer ran 7 further searches and the editor 2 more. Corrections were applied in place (marked "corrected 2026-10-20") and section 12 lists what changed, what remains unverified, and what was added. Claims touched in that pass carry the pass's own tags: **[S]** = stated in a search result seen on 2026-10-20 (URL cited), **[T]** = training knowledge not confirmed today, **[I]** = inference, **[U]** = unresolved conflict between the draft and the reviewer.

## 1. DHS Office of Homeland Security Statistics (OHSS)

### 1.1 What OHSS is and why it matters for this app

- OHSS (`https://ohss.dhs.gov/`) is the DHS statistical office that succeeded the old Office of Immigration Statistics. It publishes the *Yearbook of Immigration Statistics*, the annual flow reports (LPRs, refugees/asylees, naturalizations, nonimmigrants, enforcement), the quarterly *Legal Immigration and Adjustment of Status Report*, the monthly *Immigration Enforcement and Legal Processes* tables, and state-level tables. **[verified]** — `https://ohss.dhs.gov/`, `https://ohss.dhs.gov/topics/immigration` (accessed 2026-10-20 via search).
- OHSS data are built from the **OHSS "Persist" dataset**, described by OHSS as "the immigration statistical system of record." Counts in published tables are **rounded to the nearest 10** for privacy. **[verified]** — monthly-tables page and State Immigration Statistics Map page (`https://ohss.dhs.gov/topics/immigration/state-immigration-data/state-immigration-statistics-map`).
- For this app, OHSS is the only *official* source that gives **final counts of green cards granted under the Cuban Adjustment Act (class CU6/CU7), by fiscal year, by country of birth, by state and by metro area**. USCIS publishes receipts/approvals/denials of *applications*; OHSS publishes the *resulting LPR grants* (the "numerator" of the whole problem). It is annual and lags 9–18 months, so it is a calibration source, not a live one.

### 1.2 Yearbook of Immigration Statistics — Lawful Permanent Resident tables

Landing pages: `https://ohss.dhs.gov/topics/immigration/yearbook/2024` (FY2024), `/yearbook/2023`, `/yearbook/2022`. **[verified]**

The FY2024 Yearbook landing page still showed "Tables 1-12: Lawful Permanent Residents (LPRs) (coming soon)" in a cached snapshot, but individual FY2024 LPR table pages are live (Table 3, Table 6, Table 7, and two new "LPR Supplemental" tables), and a "Lawful Permanent Residents 2024 Data Tables (xlsx)" download is listed on the 2024 Yearbook page. **[verified]** (search results on 2026-10-20 for `ohss.dhs.gov/topics/immigration/yearbook/2024/table7`, `/table6`, `/table3`, `/LPRsupptable1`, `/LPRsupptable2`).

Table numbering for the LPR section (stable since the 2010s; FY2024 pages confirm Tables 3, 6, 7): **[verified for 3/6/7; likely for the others]**

| Table | Title (FY2024 edition) | Why the app cares | URL (FY2024) |
|---|---|---|---|
| 1 | Persons obtaining LPR status, FY1820–FY2024 | context only | `https://ohss.dhs.gov/topics/immigration/yearbook/2024/table1` |
| 2 | By region and selected country of last residence, FY2015–2024 | — | `.../table2` |
| 3 | By region and **country of birth**, FY2015–2024 | **Cuba row = total Cuba-born new LPRs per FY** (all classes) | `https://ohss.dhs.gov/topics/immigration/yearbook/2024/table3` |
| 4 | By **state or territory of residence**, FY2015–2024 | denominators by state | `.../table4` |
| 5 | By leading CBSA (metro) of residence | metro denominators | `.../table5` |
| 6 | By **type (adjustment vs. new arrival) and major class of admission**, FY2015–2024 | the "Refugees and asylees → refugee adjustments" line is where CAA grants live (see 1.3) | `https://ohss.dhs.gov/topics/immigration/yearbook/2024/table6` |
| 7 | By type and **detailed class of admission**, FY2024 only | most granular class breakdown; FY2024 totals: 1,364,090 LPRs = 782,800 adjustments + 581,290 new arrivals; refugees & asylees 219,850 (all adjustments); employment-based 171,120 (118,410 adjustments) **[verified]** | `https://ohss.dhs.gov/topics/immigration/yearbook/2024/table7` |
| 8 | By major class of admission and region/country of last residence | — | `.../table8` |
| 9 | By broad class of admission and demographic characteristics | age/sex profile | `.../table9` |
| 10 | By **broad class of admission and region and country of birth** | **Cuba × "Refugees and asylees" ≈ CAA grants** (FY2023 page exists: `.../yearbook/2023/table10`) **[verified]** | `.../table10` |
| 11 | By broad class of admission and **state** of residence | class × state | `.../table11` |
| 12 | By broad class of admission and leading CBSA | class × metro | `.../table12` |
| **Supp. 1** (new, FY2024) | By **state or territory of residence and region and country of birth**, FY2024 | **Cuba-born new LPRs by state** — best single "where do Cuban applicants live" table **[verified exists]** | `https://ohss.dhs.gov/topics/immigration/yearbook/2024/LPRsupptable1` |
| **Supp. 2** (new, FY2024) | By **leading CBSA of residence and region and country of birth**, FY2024 | Cuba-born new LPRs by metro (Miami, Tampa, Orlando, Houston, Louisville, Las Vegas…) **[verified exists]** | `https://ohss.dhs.gov/topics/immigration/yearbook/2024/LPRsupptable2` |

Formats: each table is an HTML page with an xlsx download; the whole LPR section is also published as one xlsx workbook ("Lawful Permanent Residents 2024 Data Tables (xlsx)") and historically as a PDF yearbook (e.g. FY2022 yearbook PDF `https://ohss.dhs.gov/sites/default/files/2024-03/2023_0818_plcy_yearbook_immigration_statistics_fy2022.pdf`; FY2021 PDF `https://ohss.dhs.gov/sites/default/files/2023-12/2022_1114_plcy_yearbook_immigration_statistics_fy2021_v2_1_1.pdf`). **[verified]** No CSV or JSON API exists; the xlsx files must be parsed. Yearbook data dictionary: `https://ohss.dhs.gov/about-our-data/governance/data-dictionaries/yearbook-immigration-statistics`. **[verified]**

Cadence: annual. The FY2024 LPR tables were published during 2025–2026; FY2025 tables (covering Oct 2024–Sep 2025, i.e. the period in which the project owner's cousin filed) should appear in late 2026 or 2027. **[likely]**

An expanded version of Tables 8–11 (more countries × classes) is published separately: `https://ohss.dhs.gov/topics/immigration/lawful-permanent-residents/lpr-yearbook-tables-8-11-expanded` — listings show files for FY2022, FY2021, FY2020 and earlier but no FY2024 entry as of today's search. **[verified]**

### 1.3 Class-of-admission codes for the Cuban Adjustment Act (CU6 / CU7) and where they are bucketed

- OHSS's "Immigrant Classes of Admission" reference page (`https://ohss.dhs.gov/topics/immigration/lawful-permanent-residents/immigrant-classes-admission`) lists **CU6 = "Cuban refugees (P.L. 89-732 of 1966)"** and **CU7 = "Non-Cuban spouses or children of Cuban refugees"**, and files both **among the refugee and asylee classes**. **[verified]**
- USCIS Adjudicator's Field Manual ch. 23.11 (archived at `https://niwaplibrary.wcl.american.edu/wp-content/uploads/USCIS-AFM-23.11-CAA-VAWA-CAA.pdf`): CU-6 is the adjustment class for natives/nationals of Cuba adjusting under the Act; CU-7 for non-Cuban spouses and children (including VAWA-based CAA cases). **[verified]**
- A Missouri DSS refugee-program memo warns that the CU6 code on a green card "is insufficient evidence of eligibility for refugee programs because it is also used for a person who never had status as a Cuban/Haitian entrant" — i.e. CU6 covers *all* CAA adjustments regardless of how the person entered (CHNV parole, port-of-entry parole, I-220A-then-parole, visa overstay). **[verified]** (`https://dssmanuals.mo.gov/wp-content/themes/mogovwp_dssmanuals/public/memos/memos_15/im080_15-att-refugee-categories.pdf`)
- The old INS/USCIS class-of-admission code list (`https://www.hplct.org/assets/uploads/files/Library%20Services/Immigration/BLOGS/INS_CLASS_of_Admissions.pdf`) also defines CU6/CU7; the search found no "CU0"/"CU1" codes, so those should not be assumed to exist. **[verified absence in search; uncertain overall]**

**Inference for the app (clearly an inference, not a verified table layout):** because OHSS files CU6/CU7 under "Refugees and asylees," the annual CAA grant count is best obtained as **Cuba (country of birth) × "Refugees and asylees" major class** from Table 10 or from the FY2005–FY2024 country-of-birth × class xlsx (1.5). The number of *actual* Cuban refugee/asylee adjustments is small, so that cell is a close proxy for CU6. It also explains the FY2024 anomaly: refugee adjustments were 178,200 (13.1% of all LPRs) in FY2024 **[verified, FY2024 flow report]**, far above the ~60k–100k refugee *arrivals* of the preceding years, which is consistent with a surge of Cuban Adjustment Act grants in FY2024. Whether Table 7 contains an explicit "Cuban Adjustment Act" line is **[uncertain]** — the FY2024 Table 7 page was located but could not be opened from this sandbox; the ingestion job should look for a row label containing "Cuban" and fall back to the Cuba × refugee cell.

### 1.4 LPR Annual Flow Report — "U.S. Lawful Permanent Residents: 2024"

- URL: `https://ohss.dhs.gov/topics/immigration/lawful-permanent-residents/annual-flow-report/fy-24-lpr-flow-report` (HTML) with PDF; index of all years: `https://ohss.dhs.gov/topics/immigration/lawful-permanent-residents/annual-flow-report`, historical: `.../annual-flow-report/historical`. FY2023 PDF: `https://ohss.dhs.gov/sites/default/files/2024-09/2024_0906_plcy_lawful_permanent_residents_fy2023.pdf` (Alicia Ward, Sept 2024). **[verified]**
- FY2024 headline numbers: **1,364,090** new LPRs; immediate relatives of U.S. citizens **672,240 (49.3%)**; refugee adjustments **178,200 (13.1%)**. Includes a state-of-residence table with 2022/2023/2024 counts and percentages (Florida, California, Texas lead) and a class-of-admission table for 2022–2024. **[verified]**
- The report says: "For more data on LPRs by state or CBSA outside of this Flow Report and the Yearbook, please see OHSS LPR page and LPR Web Profiles tables." **[verified]**
- Format: HTML + PDF; the underlying numbers are in the Yearbook xlsx. Cadence: annual, typically 9–12 months after the fiscal year ends.

### 1.5 "LPRs by Country of Birth and Major Class of Admission: FY2005–FY2024" (xlsx)

- Page: `https://ohss.dhs.gov/topics/immigration/lawful-permanent-residents/lprs-country-birth-and-major-classes-admission`. The OHSS homepage lists this spreadsheet with an **"Updated 07/15/2026"** date; the dedicated page in a cached snapshot still described the FY2005–FY2022 version (file dated 07/10/2023). **[verified, with the caveat that the two pages disagree — check which file the link serves]**
- Content: one row per country of birth × major class of admission (family-sponsored, immediate relatives, employment, refugees & asylees, diversity, other) × fiscal year. **Cuba × refugees & asylees × FY** is the longest consistent annual series of CAA-type green cards available anywhere (20 fiscal years). **[likely — the layout is from prior knowledge of the FY2005–FY2022 file; the FY2024 file should be the same shape]**
- Format: xlsx. Cadence: annual. Machine-readability: good (single flat sheet), but column headers change wording between editions, so parse by label matching, not column index.

### 1.6 LPR web profiles, county tables, and "expanded" tables

- **Profiles on Lawful Permanent Residents**: `https://ohss.dhs.gov/topics/immigration/lawful-permanent-residents/profiles` — "profiles of people who became LPRs during each fiscal year from 2003–2024," available **by country of birth, by state of residence, and by CBSA of residence**. A Cuba profile for a given FY gives class-of-admission mix, state distribution, age/sex, and adjustment-vs-arrival split for Cuba-born LPRs. **[verified existence and scope; cell layout from prior knowledge — likely]**
- **County-level tables**: "county-level data for the top 200 counties of residence of new LPRs by major class of admission and country of birth" (linked from the LPR landing page `https://ohss.dhs.gov/topics/immigration/lawful-permanent-residents`). Miami-Dade, Broward, Hillsborough, Orange (FL), Harris (TX), Jefferson (KY), Clark (NV) will all be in the top 200. **[verified existence]**
- **Expanded Tables 8–11**: see 1.2. **[verified]**
- **Adjustments to Lawful Permanent Residence by Year of Entry**: `https://ohss.dhs.gov/topics/immigration/lawful-permanent-residents/adjustments-lawful-permanent-residence-year-entry` — links adjustment-of-status counts to the entry-year cohort, which is exactly the shape of the app's "parole date + 1 year" eligibility model (how many of the FY2022–FY2024 entrants have already adjusted). Surfaced in the 2026-10-20 fact-check pass; whether it breaks out country of birth is unknown until opened. **[S exists; layout unverified]**

### 1.7 Legal Immigration and Adjustment of Status Report (quarterly)

- Page: `https://ohss.dhs.gov/topics/immigration/legal-immigration-and-adjustment-status-report`; data dictionary: `https://ohss.dhs.gov/about-our-data/governance/data-dictionaries/legal-immigration-and-adjustment-status-report`. **[verified]**
- OHSS description: "quarterly report [that] provides tables with preliminary legal immigration counts based on data available one month after the reporting period," breaking adjustments of status down "by type of adjustment, type and detailed class of admission, and country of nationality," with supporting xlsx tables for LPRs, refugee admissions, naturalizations, and nonimmigrant (I-94) admissions. OHSS "updates data for previous quarters in subsequent reports … and publishes final annual data in the Yearbook." **[verified]**
- **Latest file visible in the search snippet: FY2025 Quarter 1 (Oct–Dec 2024), posted 07/25/2025** — but the snippet was truncated after that entry, so the original draft's conclusion that "no FY2025 Q2–Q4 editions" exist rested on a cut-off listing. A June 5, 2026 secondary source (lucidtext EB-5/I-485 tracking blog, `https://blog.lucidtext.com/2026/06/05/i-485-update-fy2025-eb-5-visas-february-2026-i-485-inventory-aos-memo/`) states that the full FY2025 Legal Immigration and Adjustment of Status Report has been published. **Treat the latest edition as at least FY2025 Q4 until the page's download table is opened directly.** **[S for the Q1 listing and the June 2026 report; corrected 2026-10-20]**
- Why it matters: this is the *fastest OHSS* series with a Cuba × detailed-class cell (quarterly rather than annual), so it is the best official cross-check against USCIS's quarterly I-485 approval counts. The lag for FY2025 Q1 was ~7 months; whether later quarters kept, shortened or lengthened that lag is unknown until the page is opened — do not bake "irregular since 2025" into the pipeline. **[corrected 2026-10-20]**
- Format: xlsx supporting tables + HTML/PDF narrative.

### 1.8 Immigration Enforcement and Legal Processes Monthly Tables (includes the CHNV parole tables)

- Page: `https://ohss.dhs.gov/topics/immigration/immigration-enforcement/monthly-tables`; data dictionary: `https://ohss.dhs.gov/about-our-data/governance/data-dictionaries/immigration-enforcement-and-legal-processes-monthly` (xlsx, posted **05/14/2026**, report year 2025). **[verified]**
- Contents (per the page): encounters, **CBP One appointments**, CBP book-outs, ICE detentions, DHS repatriations, credible fear, and **three CHNV tables: "Confirmed Cuban, Haitian, Nicaraguan, and Venezuelan Parole Processes Beneficiaries," "Travel Authorizations," and "Parolees"** (plus a "Confirmed CHNV Paroles by Program Process" table cited by CRS). **[verified]**
- Cadence: the page states "As of January 2025, we update this report monthly on the third Thursday of the month." **[verified]** However, the Deportation Data Project's agency-report repository (`https://deportationdata.org/data/reports.html`) says OHSS released the monthly spreadsheet "through January 2025" and "we do not know whether to expect future releases." CRS (R48514) states OHSS published monthly CHNV tables "from October 2022 to November 2024." Whether editions after early 2025 exist is **[uncertain]**; the May 2026 data dictionary suggests the series continued in some form.
- File-name pattern (one verified example): `https://ohss.dhs.gov/sites/default/files/2025-01/2025_0116_ohss_immigration-enforcement-and-legal-processes-tables-november-2024.xlsx` — i.e. `/sites/default/files/YYYY-MM/YYYY_MMDD_ohss_immigration-enforcement-and-legal-processes-tables-<month>-<year>.xlsx`. **[verified example; pattern inferred]**
- What the CHNV tables give the app: the **monthly count of Cubans paroled in under the CHNV process (the population "clock" for CAA eligibility: parole date + 1 year = earliest I-485 filing date)**. Summing Cuban CHNV parolees by month and shifting 12 months forward yields the monthly "newly eligible to file" curve, which is an input to the demand-side model.
- Format: xlsx, multiple sheets, with headers and footnotes in-sheet. Machine-readability: medium (needs a per-sheet parser; sheet names have changed between editions).

### 1.9 "Immigration Data Hub" — what actually exists

The task asked about an OHSS "Immigration Data Hub." Today's searches found **no OHSS product by that exact name** (the only "Migration Data Hub" is the Migration Policy Institute's non-government site, `https://www.migrationpolicy.org/migration-data-hub`). The closest OHSS products are: **[verified]**

| Product | URL | What it gives | Format |
|---|---|---|---|
| State Immigration Statistics Map (interactive) | `https://ohss.dhs.gov/topics/immigration/state-immigration-data/state-immigration-statistics-map` | 2024 state-level totals, per-capita and rank for arrivals, naturalizations, refugee admissions, asylum grants, adjustments; 50 states + DC + PR; rounded to 10 | interactive map + downloadable table |
| State Immigration Data tables (annual) | linked from `https://ohss.dhs.gov/topics/immigration/state-immigration-data` | "10 years of data for each of the 50 states, DC, and Puerto Rico … arrivals, naturalizations, asylum grants, and adjustments" | xlsx |
| Report Catalog | `https://ohss.dhs.gov/about-our-data/governance/report-catalog` | master list of every OHSS report with last-updated dates (useful as a change-detection feed) | HTML |
| LPR population estimates ("…2025 and Revised 2024") | `https://ohss.dhs.gov/topics/immigration/lawful-permanent-residents/population-estimates/fy-25-lpr-pop-estimates` (2024 PDF: `https://ohss.dhs.gov/sites/default/files/2024-11/2024_1108_ohss_lawful_permenent_resident_population_estimate_2024_and_revised_2023.pdf`) | stock of LPRs by country of birth and state; eligible-to-naturalize subpopulation | PDF/xlsx |
| Refugees and asylees tables (Yearbook Tables 13–19) | `https://ohss.dhs.gov/topics/immigration/yearbook/2023/table14` etc. | not CAA; useful only to subtract real Cuban refugee/asylee adjustments from the "refugees & asylees" bucket | xlsx |

### 1.10 OHSS summary for the pipeline

| OHSS series | Metric it feeds | Cadence / lag | Machine-readability |
|---|---|---|---|
| Yearbook Table 3 (Cuba-born LPRs by FY) | annual total Cuba-born green cards | annual, ~12–18 mo lag | xlsx, stable layout |
| Yearbook Table 10 / country×class xlsx (Cuba × refugees & asylees) | **annual CAA grants (CU6/CU7 proxy)** | annual | xlsx |
| Yearbook Supp. Table 1 & 2, Table 11/12, LPR profiles, county tables | **state/metro distribution of Cuban new LPRs** → priors for the per-state estimator | annual | xlsx |
| Quarterly Legal Immigration report | quarterly Cuba × class LPR counts | quarterly nominal; FY2025 Q1 lagged ~7 mo; full FY2025 edition reportedly published by June 2026 (confirm on the page) | xlsx |
| Monthly tables — CHNV sheets | **monthly Cuban CHNV parolees → eligibility clock** | monthly nominal; continuation after Jan 2025 uncertain (Nov 2024 file still the newest seen on 2026-10-20) | xlsx |
| State Immigration Data / Map | adjustments by state (all nationalities) | annual | xlsx + interactive |
| Adjustments to LPR by Year of Entry (1.6) | adjustments by entry-year cohort → check on the eligibility model | annual (assumed) | xlsx (assumed) **[S exists; unopened]** |

## 2. CBP data on CHNV, CBP One and parole

### 2.1 What CBP published, and what still updates

- **CHNV program statistics were never a standalone cbp.gov statistics page.** They were released (a) in CBP's monthly "Monthly Operational Update" press releases (`https://www.cbp.gov/newsroom/national-media-release/cbp-releases-<month>-<year>-monthly-update`, e.g. `.../cbp-releases-january-2025-monthly-update` and `.../cbp-releases-january-2024-monthly-update`), which through 2024 contained a paragraph with cumulative CHNV arrivals and travel authorizations by nationality; (b) in DHS fact sheets (e.g. `https://dhs.gov/news/2023/07/25/fact-sheet-data-first-six-months-parole-processes-cubans-haitians-nicaraguans-and`); and (c) in the OHSS monthly tables (1.8). **[verified for the URLs; "never a standalone page" is my conclusion from the absence of any such page in search results — likely]**
- The CHNV processes were terminated by the DHS notice published **March 25, 2025** (Federal Register doc **2025-05128**, "Termination of Parole Processes for Cubans, Haitians, Nicaraguans, and Venezuelans," `https://www.federalregister.gov/documents/2025/03/25/2025-05128/termination-of-parole-processes-for-cubans-haitians-nicaraguans-and-venezuelans`; public-inspection PDF `https://public-inspection.federalregister.gov/2025-05128.pdf`), with parole set to end **April 24, 2025** unless already expired or individually extended. **[verified]** After that date CBP stopped issuing CHNV travel authorizations, so the series is closed; the app only needs it as a historical population base.
- CBP ended CBP One appointment scheduling for inadmissible aliens on **January 20, 2025** (CBP January 2025 monthly update). **[verified]** CBP One was then repurposed as "CBP Home" for self-departure (CRS IF13030, `https://www.congress.gov/crs-product/IF13030`). **[verified]**

### 2.2 Key CHNV totals (for seeding the app's population model)

| Figure | Value | Source | Confidence |
|---|---|---|---|
| Total paroled under CHNV through termination | "532,000 parolees who entered … under the CHNV parole programs" | DHS termination notice 2025-05128 | **[verified]** |
| By nationality, through end of Sept 2024 (CBP data as cited) | ≈110,000 Cubans; ≈211,000 Haitians; >93,000 Nicaraguans; ≈117,000 Venezuelans; >531,000 total | House Judiciary Committee report, Nov 20 2024 (`https://judiciary.house.gov/sites/evo-subsites/republicans-judiciary.house.gov/files/evo-media-document/2024-11-20%20The%20Biden%20Harris%20Administration's%20CHNV%20Parole%20Program%20Two%20Years%20Later%20-%20A%20Fraud-Ridden,%20Unmitigated%20Disaster.pdf`); similar breakdown in Refugees International (`https://www.refugeesinternational.org/perspectives-and-commentaries/setting-the-record-straight-on-chnv/`) | **[likely]** (partisan source quoting CBP; cross-check with OHSS monthly table) |
| Travel authorizations Jan–Jun 2023 | >188,000 issued; >155,000 paroled in that window | CRS R47654 citing DHS (`https://www.congress.gov/crs-product/R47654`) | **[verified]** |
| People holding a *current* CHNV parole at revocation (Mar 2025) | ≈195,000 (excludes grants issued Dec 2024–Jan 2025) | American Immigration Council fact sheet, July 2025 (`https://www.americanimmigrationcouncil.org/wp-content/uploads/2023/10/chnv_fact_sheet_july_2025.pdf`) | **[verified]** |
| CHNV-national SWB encounters | 168,010 (FY2023) → 352,790 (FY2024) | DHS notice 2025-05128 | **[verified]** |
| CHNV nationals with CBP One registration encountered at SWB | 582,800 | DHS notice (as quoted in search; which notice is unclear) | **[likely]** |
| CBP One appointments scheduled Jan 2023–Nov 2024 | 904,530 (appointments, not unique people) | CRS IF13030 | **[verified]** |

Note for the estimator: the CHNV Cubans (~110k) are a *minority* of Cubans who became CAA-eligible in 2023–2025; most Cubans arrived at the southwest border in 2021–2024 and were either paroled at a port of entry (eligible) or released on an I-220A order of release on recognizance (*not* considered parole by USCIS/BIA — see the 992-plaintiff Miami class action *Bello-Rubio v. Noem* in 4.3). The CBP "Custody and Transfer" tables below are the way to size the port-of-entry-parole cohort.

### 2.3 CBP statistics pages that still update and are relevant

| Page | URL | Content | Format / cadence |
|---|---|---|---|
| Custody and Transfer Statistics FY2025 | `https://www.cbp.gov/newsroom/stats/custody-and-transfer-statistics-fy2025` | monthly SWB encounters by **processing disposition, including a "parole" row** (near zero every month of FY2025) | HTML tables, monthly **[verified]** |
| Custody and Transfer Statistics FY2024 / FY2023 / FY2022 | `.../custody-and-transfer-statistics-fy2024`, `-fy2023`, `-fy22` | same, with much larger parole counts in FY2022–FY2023 (the port-of-entry-parole Cuban cohort lives here, but nationality × disposition is **not** broken out on these pages) | HTML **[verified]** |
| Southwest Land Border Encounters / Nationwide Encounters | `https://www.cbp.gov/newsroom/stats/southwest-land-border-encounters`, `https://www.cbp.gov/newsroom/stats/nationwide-encounters` | encounters by citizenship (Cuba is a selectable citizenship), by month, with a CSV download behind the dashboard | Tableau-style dashboard + CSV, monthly **[likely — from prior knowledge; not re-verified today]** |
| Monthly Operational Update press releases | `https://www.cbp.gov/newsroom/national-media-release/...` | narrative monthly numbers | HTML, monthly **[verified]** |

What CBP feeds the app: (1) the size and monthly timing of the Cuban parole cohorts (CHNV + port-of-entry parole), which drives the "newly eligible" curve 12 months later; (2) nothing about adjudication speed. CBP is a one-time historical load plus a low-priority monthly check.

## 3. Federal Register API (federalregister.gov/api/v1)

### 3.1 Why it matters

Every policy event that has moved CAA processing since 2023 was either a Federal Register notice or a presidential proclamation: the CHNV program creation (Jan 2023), its termination (Mar 2025), the Family Reunification Parole termination (Dec 2025), the June 2025 and December 2025 travel-ban proclamations that defined the 19- and 39-country USCIS hold lists (Cuba is on both), and future rules on parole or adjustment. The API lets the app poll for these and push an alert the same day.

### 3.2 API facts **[verified from the official docs page as summarized in search; syntax also matches my prior knowledge]**

- Base endpoint: `https://www.federalregister.gov/api/v1/documents.json`; documentation: `https://www.federalregister.gov/developers/documentation/api/v1`. **No API key required.**
- Filters are passed as `conditions[...]`:
  - `conditions[term]=<full-text query>` (quote phrases with `%22`)
  - `conditions[agencies][]=<slug>` — slugs from `https://www.federalregister.gov/api/v1/agencies.json`; relevant: `homeland-security-department`, `u-s-citizenship-and-immigration-services`, `u-s-customs-and-border-protection`, `executive-office-of-the-president`, `justice-department`, `executive-office-for-immigration-review`
  - `conditions[publication_date][gte]=YYYY-MM-DD` / `[lte]` / `[is]` / `[year]`
  - `conditions[type][]=NOTICE | RULE | PRORULE | PRESDOCU`
  - `order=newest` (also `relevance`, `oldest`, `executive_order_number`); `per_page` up to 1000; `page=n`
  - `fields[]=` to limit returned fields (e.g. `document_number`, `title`, `type`, `publication_date`, `html_url`, `pdf_url`, `abstract`, `agencies`, `citation`, `docket_ids`)
- Output: JSON (`.json`). An RSS feed of the same search is available by changing the extension to `.rss` **[likely]**; a `.csv` export exists on the website's search UI but I found no confirmation that the API endpoint itself serves CSV **[uncertain]**.
- Single document: `https://www.federalregister.gov/api/v1/documents/<document_number>.json` (e.g. `/documents/2025-05128.json`). **[likely]**

### 3.3 Recommended monitoring queries (copy-paste)

```text
# 1. Anything DHS/USCIS/CBP publishes mentioning Cubans, parole or the CAA, newest first
https://www.federalregister.gov/api/v1/documents.json?conditions[term]=(Cuban OR Cubans OR "Cuban Adjustment Act" OR parole OR parolees OR CHNV)&conditions[agencies][]=homeland-security-department&conditions[agencies][]=u-s-citizenship-and-immigration-services&conditions[agencies][]=u-s-customs-and-border-protection&conditions[publication_date][gte]=2025-01-01&order=newest&per_page=100

# 2. Presidential proclamations/orders that touch immigration (travel bans define the USCIS hold lists)
https://www.federalregister.gov/api/v1/documents.json?conditions[type][]=PRESDOCU&conditions[term]=(immigration OR entry OR nationals OR parole)&conditions[publication_date][gte]=2025-01-01&order=newest

# 3. Exact-phrase watch for the statute
https://www.federalregister.gov/api/v1/documents.json?conditions[term]="Cuban Adjustment Act"&order=newest&per_page=20

# 4. Daily poll (run once a day; keep last-seen document_number)
https://www.federalregister.gov/api/v1/documents.json?conditions[agencies][]=homeland-security-department&conditions[publication_date][is]=<today>&per_page=200
```

### 3.4 Test attempted from this sandbox (could not complete)

```bash
curl -sS --max-time 60 "https://www.federalregister.gov/api/v1/documents.json?conditions%5Bterm%5D=%22Cuban+Adjustment+Act%22&conditions%5Bagencies%5D%5B%5D=homeland-security-department&order=newest&per_page=5"
# Result on 2026-10-20 in this environment:
# curl: (56) CONNECT tunnel failed, response 403
# agent-proxy: www.federalregister.gov:443 — connect_rejected (host not allowed for this session)
```

Expected response shape (from the documentation, **[likely]**): `{"count": N, "description": "...", "total_pages": n, "next_page_url": "...", "results": [{"title","type","abstract","document_number","html_url","pdf_url","public_inspection_pdf_url","publication_date","agencies":[{"raw_name","name","id","url","json_url","parent_id","slug"}],"excerpts"}]}`. The project owner should run the command above from a normal network and paste the first result into `docs/research/` as the acceptance test for the ingestion job.

### 3.5 Known Federal Register documents to seed the database

| Date | FR doc no. | Title | Why it matters | Confidence |
|---|---|---|---|---|
| 2022-10-19 | 2022-22739 (87 FR 63507) | Implementation of a Parole Process for Venezuelans | template for CHNV | **[uncertain — from memory]** |
| 2023-01-09 | 2023-00252 (88 FR 1266) | Implementation of a Parole Process for Cubans | creates the Cuban CHNV track; parole up to 2 years | **[likely — from memory; verify]** |
| 2023-01-09 | 2023-00255 / 2023-00254 | Parole processes for Haitians / Nicaraguans | — | **[uncertain]** |
| 2025-03-25 | **2025-05128** (90 FR 13611) | Termination of Parole Processes for Cubans, Haitians, Nicaraguans, and Venezuelans | ends CHNV; parole terminated Apr 24 2025 | **[verified]** |
| 2025-06-04 | Proclamation 10949 | Restricting the entry of foreign nationals… (19 countries; **Cuba partially restricted**) | defines the first USCIS hold list (memo PM-602-0192, Dec 2 2025 — see 4.4; corrected from "Nov 2025" on 2026-10-20) | **[likely; proclamation number [T]]** |
| 2025-12-15 | **2025-22744** (90 FR No. 238) | "Termination of Family Reunification Parole Processes for Colombians, Cubans, Ecuadorians, Guatemalans, Haitians, Hondurans, and Salvadorans" | ends the Cuban FRP track; parole granted under FRP ends **Jan 14 2026** except in two cases: **(a) people with an I-485 filed by Dec 15 2025 that was still pending on Jan 14 2026 — their parole continues until USCIS makes a final decision on the I-485 or the parole period expires, whichever is sooner (a denial terminates the parole)**; (b) case-by-case determinations by the Secretary | **[S — title, number, dates and the I-485 exception confirmed 2026-10-20: `https://www.federalregister.gov/documents/2025/12/15/2025-22744/termination-of-family-reunification-parole-processes-for-colombians-cubans-ecuadorians-guatemalans`; JAC "FRN Legal Decoder" `https://justiceactioncenter.org/news/frn-decoder-frptermination/`; Connell Foley summary]** |
| 2025-12 | Proclamation 10998 | expands travel restrictions to 39 countries | defines the 39-country USCIS hold list (memo PM-602-0194, Jan 1 2026 — see 4.4) | **[likely; the proclamation number appears in search results only indirectly, via the Red Eagle class definition "Proclamations 10949/10998" — [T] for the primary citation]** |

## 4. CourtListener / RECAP for docket monitoring

### 4.1 API facts

- REST base: `https://www.courtlistener.com/api/rest/v4/` (v4.x); overview: `https://wiki.free.law/c/courtlistener/help/api/rest/v4/overview` and `https://www.courtlistener.com/help/api/rest/`. **[verified]**
- Search endpoint: `/api/rest/v4/search/?q=<query>&type=<o|r|rd|d|p|oa>&order_by=dateFiled+desc` where `type=r` = RECAP dockets (case-level), `type=rd` = RECAP documents, `type=o` = opinions. **[likely — type codes from prior knowledge; search results confirmed only `type=o`]**
- Docket detail: `/api/rest/v4/dockets/?court=<court_id>&docket_number=<no.>` and `/api/rest/v4/docket-entries/?docket=<id>`; court IDs follow PACER abbreviations (`mad` = D. Mass., `rid` = D.R.I., `cand` = N.D. Cal., `flsd` = S.D. Fla., `ca1` = First Circuit). **[likely]**
- **Authentication / rate limits (changed in 2026; corrected 2026-10-20):** the official v4.7 docs (`https://wiki.free.law/c/courtlistener/help/api/rest/v4/rest-api-v47`) confirm that authenticated users get, by default, **5 requests/min, 50/hour, 125/day** on a rolling window. A secondary source dates the reduction (from 5,000/hour) to **May 7, 2026**, when API access was bundled with memberships (the Free Law Project post `https://free.law/2026/05/07/api-included-in-memberships/` was cited but not itself surfaced); paid tiers raise the limits (e.g. Tier 1 ≈ $10/month: 10/min, 75/hr, 300/day; higher tiers up to 25/min, 300/hr, 1,400/day) and there is a free EDU tier (`https://github.com/api-evangelist/court-listener`). **Anonymous requests succeed (HTTP 200) only for `/search/`, `/courts/` and `/audio/`; `/dockets/`, `/docket-entries/`, `/clusters/`, `/opinions/` and citation lookup return 401 without a token** (third-party test dated Oct 6 2026). The "≈100/day anonymous" figure from one guide in the original draft is superseded. **[S via the fact-check pass]** Practical implication: the backend must create an account, send `Authorization: Token <key>` on *every* docket call (the unauthenticated `dockets` commands in 4.5 will fail as written), and budget against 125/day — adequate for 4–5 dockets polled twice daily.
- Alerts: CourtListener offers docket alerts (email) and webhooks for RECAP docket updates to logged-in users; this is the cheapest way to get same-day notice of a new order rather than polling. **[likely]**
- Free bulk access to filings: once a document is in RECAP, the PDF is at `https://storage.courtlistener.com/recap/gov.uscourts.<court>.<pacer_case_id>/gov.uscourts.<court>.<pacer_case_id>.<entry>.<attachment>.pdf`. Example verified today: `https://storage.courtlistener.com/recap/gov.uscourts.mad.281389/gov.uscourts.mad.281389.199.2.pdf` (Doe v. Noem, entry 199, attachment 2). **[verified]**

### 4.2 Alternative, no-API docket mirrors (useful fallbacks)

- Justia dockets: `https://docs.justia.com/cases/federal/district-courts/massachusetts/madce/1:2025cv10495/281389/97` (the April 14 2025 Talwani order) — URL encodes court, docket and PACER id. **[verified]**
- Civil Rights Litigation Clearinghouse: `https://clearinghouse.net/case/46186/` (Doe v. Noem). **[verified]**
- Justice Action Center litigation tracker: `https://litigationtracker.justiceactioncenter.org/cases/svitlana-doe-v-noem-humanitarian-parole-district-court` and `.../svitlana-doe-v-noem-humanitarian-parole-court-appeals`; JAC case page `https://justiceactioncenter.org/case/svitlana-doe-v-noem/`. **[verified]**
- CLINIC "Court Watch" monthly roundup: `https://www.cliniclegal.org/resources/clinic-court-watch-federal-immigration-case-updates-january-2026`. **[verified]**
- Immigration Policy Tracking Project: `https://immpolicytracking.org/policies/reporting-that-dhs-plans-to-terminate-chnv-parole-processes-and-revoke-parole-by-placing-certain-beneficiaries-in-removal-proceedings/`. **[verified]**

### 4.3 Dockets the app should watch

| # | Case | Court / docket | PACER case id | What it decides | Status (as of 2026-10-20) | Confidence |
|---|---|---|---|---|---|---|
| 1 | **Svitlana Doe et al. v. Noem et al.** ("Doe v. Noem") — CHNV termination, parolee benefits hold, FRP termination | D. Mass. **1:25-cv-10495-IT** (Judge Indira Talwani) | `mad` 281389 | Apr 14 2025: stayed the CHNV termination for a certified class. **May 28 2025: ordered USCIS to resume processing benefit applications (I-485, I-765, asylum, TPS) of CHNV/U4U/FRP parolees** — this is the order that un-froze the project owner's cousin's EAD. Jan 24 2026: preliminary injunction blocking the FRP termination and certifying an FRP subclass. | Merits litigation ongoing; termination of CHNV itself allowed to proceed (see #2, #3) | **[verified]** |
| 2 | **Noem v. Doe** (emergency application) | U.S. Supreme Court **No. 24A1079** | — | May 30 2025: stayed Talwani's April 14 order, letting the CHNV termination take effect | decided | **[verified via multiple secondary sources; verify on supremecourt.gov]** |
| 3 | **Doe v. Noem** (appeal of the April 14 stay) | First Circuit, docket **25-1384** | `ca1` | Sept 12 2025: vacated the district court's stay; early termination "likely lawful" | decided | **[likely — docket number from memory; outcome verified]** |
| 4 | **Dorcas International Institute of Rhode Island et al. v. USCIS, Edlow, DHS** | D.R.I. **1:26-cv-00132** (Chief Judge John J. McConnell Jr.) | `rid` | Filed Mar 5 2026. **June 5 2026: vacated under the APA four USCIS policies — the 39-country benefits hold, the global asylum hold, the "comprehensive re-review" of Biden-era approvals, and the country-specific-factors policy** — holding USCIS "does not have discretion to decline to adjudicate applications at all" and that a blanket, indefinite, nationality-based hold is arbitrary. Vacatur is nationwide, not plaintiff-limited. | Government appealed to the First Circuit (**No. 26-1703**, filed Jun 12 2026). The *district court* (D.R.I.) denied a stay on Jul 15 2026 — the original draft wrongly attributed the mid-July denial to the appeals court. **Aug 14 2026: the First Circuit granted the government's stay only as to the Comprehensive Re-Review Policy, which is therefore reinstated pending appeal; it denied the stay as to the Benefits Hold, Global Asylum Hold and Country-Specific Factors policies, which remain vacated.** Merits appeal pending (status line seen late Aug 2026). USCIS confirmed compliance with the June vacatur. | **[S — corrected 2026-10-20: Justia opinion page `https://law.justia.com/cases/federal/appellate-courts/ca1/26-1703/26-1703-2026-08-14-0.html`; CourtListener docket `https://www.courtlistener.com/docket/73477958/dorcas-international-institute-of-rhode-island-v-united-states-citizenship/`; Envoy Global alert `https://www.envoyglobal.com/news-alert/first-circuit-grants-partial-stay-in-challenge-to-uscis-immigration-adjudication-policies/`; AILA / iandoli.com for the Jul 15 district-court denial]** |
| 5 | **Red Eagle Law v. Edlow** | N.D. Cal. **3:26-cv-04850-CRB** (Judge Charles R. Breyer) | `cand` | **Aug 24 2026: class certification + preliminary injunction enjoining USCIS memos PM-602-0192 and PM-602-0194** for natives/citizens of the 39 countries in Proclamations 10949/10998 (Cuba included) and the Palestinian Authority; orders processing to resume (not approval). **Class definition confirmed: natives/citizens of those 39 countries plus the Palestinian Authority with a pending I-589 *or any other USCIS benefit application* subject to the holds — so Cuban CAA I-485 applicants are class members** (`https://news.clinchlaw.com/en/article/federal-court-certifies-class-and-blocks-uscis-hold-and-review-policies-affectin-mthwklkh`) | Injunction in force. **USCIS acknowledged the order in an Aug 28 2026 alert, "Recent Court Order on Hold Policies"** (`https://www.uscis.gov/newsroom/alerts/recent-court-order-on-hold-policies`), describing it as class certification plus an injunction against PM-602-0192 and PM-602-0194. Per one tracker (single source) the court later stayed further proceedings and deferred ruling on the government's motion to dismiss, with status reports scheduled. | **[S — corrected 2026-10-20; "guidance not yet published" was stale]** |
| 6 | **Medani v. Trump** | N.D. Cal. (docket no. not captured) | `cand` | Aug 28 2026: vacated PM-602-0193 (DV-2026 adjustment hold) | — | **[likely]** |
| 7 | **Mullin v. Doe** | U.S. Supreme Court (cert before judgment granted Mar 16 2026, consolidated) | — | Reported as related to the Doe parole/TPS litigation; relevance to CAA unclear | pending | **[uncertain — single Wikipedia-derived mention]** |
| 8 | **Bello-Rubio v. Noem** — I-220A class action, 992 named Cuban plaintiffs | S.D. Fla. (Miami) **1:25-cv-23665** (Judge Jacqueline Becerra) | `flsd` (PACER case id not captured; CourtListener query: `court=flsd&docket_number=1:25-cv-23665`) | whether release on an I-220A equals "parole" for CAA purposes. **Sept 10 2026 hearing: the government's first motion to dismiss was denied (jurisdiction retained; no ruling yet that an I-220A equals parole).** Renewed motion to dismiss filed Oct 9 2026 (ECF 77); plaintiffs' response due Oct 23 2026; a class-certification motion is pending that could extend relief beyond the 992 named plaintiffs | pending | **[S — CiberCuba 2026-10-11 `https://en.cibercuba.com/noticias/2026-10-11-u1-e13-s27061-nid342586-gobierno-eeuu-vuelve-pedir-desestimar-demanda-992`; Telemundo 51 `https://www.telemundo51.com/noticias/local/audiencia-clave-en-corte-de-miami-para-cubanos-con-documento-i-220a/2823744/`; Spectrum Noticias 2026-10-13 `https://spectrumnoticias.com/fl/florida/noticias/2026/10/13/gobierno-pide-desestimar-demanda-de-cubanos-con-la-orden-de-libertad-bajo-palabra-i-220a`; caption and docket added 2026-10-20]** |
| 9 | New suit (filed Oct 5 2026) against USCIS's May 2026 adjustment-discretion memo and an August 2026 directive | D. Mass.; case name/docket not captured | `mad` | per CiberCuba, in Aug 2026 the court found persuasive the government's position that the May memo does not apply to CAA applications. The May 2026 directive itself — reported (CiberCuba 2026-05-22 and 2026-10-14) as allowing USCIS to deny adjustment applications **without an RFE or NOID / opportunity to correct**, and as affecting CAA applicants — is corroborated by two articles; its memo number and exact date were not captured and should be recorded for the regime variable | pending | **[S single outlet for the lawsuit and the court's Aug 2026 finding — `https://en.cibercuba.com/noticias/2026-10-08-u1-e13-s27061-nid342267-demandan-uscis-nuevas-restricciones-obtener-green-card`; [U] on whether the memo applies to CAA cases]** |
| 10 | BIA precedent *Matter of Roque-Izada* (June 2025) | BIA | — | termination of removal proceedings not warranted merely to let a Cuban seek CAA adjustment on speculation that USCIS will grant parole | precedent | **[verified via AIC and law-firm summaries; DOJ PDF `https://www.justice.gov/eoir/media/1404086/dl`]** |

### 4.4 Dated litigation / policy timeline relevant to the estimator's "regime" variable

| Date | Event | Source |
|---|---|---|
| 2025-02-14 | USCIS memo: "Administrative Hold on All USCIS Benefit Requests Filed by Parolees Under U4U, CHNV or FRP" — agency-wide hold pending ELIS fraud/security re-vetting | `https://www.uscis.gov/sites/default/files/document/foia/AdministrativeHoldonAllUSCISBenefitRequestsFiledbyParoleesUnderU4U_CHNVorFRP.pdf`; `https://ukrainetaskforce.org/wp-content/uploads/2025/03/USCIS-Parolee-Benefits-Pause-Memo-February-14-2025.pdf` **[verified]** |
| 2025-03-25 | FR notice 2025-05128 terminates CHNV effective Apr 24 2025 | Federal Register **[verified]** |
| 2025-04-14 | Talwani stays the termination (Doe v. Noem, ECF 97) | `https://justiceactioncenter.org/wp-content/uploads/2025/04/0097-Order-Granting-Stay-of-CHNV-Revocations.pdf` **[verified]** |
| 2025-05-28 | Talwani orders USCIS to resume nationwide processing of parolees' benefit applications; USCIS declaration later reports **8,855 benefit requests adjudicated for these parolees May 28–June 30 2025** | Bloomberg Law (`https://news.bloomberglaw.com/daily-labor-report/dhs-processes-thousands-of-immigration-benefits-after-order`), Visa Lawyer Blog June 2 2025, Littler **[verified]** |
| 2025-05-30 | Supreme Court stays the April 14 order (24A1079) | **[verified]** |
| 2025-06 | USCIS issues a new memo "to comply with the court order" but allowing case-by-case holds; "USCIS does not guarantee a prompt decision on a pending request from a special program parolee" | Littler / sverdlofflaw summaries **[verified]** |
| 2025-06 → 2025-09 | CHNV termination notices mailed to parolees | drmantonya.com guide **[likely]** |
| 2025-09-12 | First Circuit vacates the district-court stay | **[verified]** |
| 2025-12-02 | USCIS memo **PM-602-0192** holds benefit adjudications for nationals of the 19 Proclamation 10949 countries. **Cuba is on the 19-country list, so the hold on Cuban applicants begins on this date** — not with the later 39-country expansion as the original draft implied, and not on "Nov 28". (PM-602-0193, same period, is the separate DV-2026 adjustment hold.) | AILA `https://www.aila.org/library/district-court-issues-preliminary-injunction-to-lift-adjudication-hold-for-travel-ban-countries` **[S — corrected 2026-10-20]** |
| 2026-01-01 | USCIS memo **PM-602-0194** extends the hold to the 39 countries of Proclamation 10998 plus the Palestinian Authority (the draft had placed this in Dec 2025) | AILA (same) **[S — corrected 2026-10-20]** |
| 2025-12-15 | FR notice **2025-22744** (90 FR No. 238) terminates FRP processes effective Jan 14 2026; parole continues for people with an I-485 filed by Dec 15 2025 and still pending on Jan 14 2026, until final decision or parole expiry (whichever first), plus case-by-case Secretary exceptions | Federal Register `https://www.federalregister.gov/documents/2025/12/15/2025-22744/termination-of-family-reunification-parole-processes-for-colombians-cubans-ecuadorians-guatemalans`; USCIS alert `https://www.uscis.gov/newsroom/alerts/dhs-ends-the-abuse-of-the-humanitarian-parole-process-and-terminates-family-reunification-parole` **[S — number/title/exception confirmed 2026-10-20]** |
| 2025-12-29 | Plaintiffs' TRO motion in Doe v. Noem re FRP | `https://iptp-production.s3.amazonaws.com/media/documents/2025.12.29_Motion_for_TRO_-_Doe_v._Noem.pdf` **[verified]** |
| 2026-01-10 | Talwani issues a temporary restraining order against the FRP termination (precedes the Jan 24 PI) | law-firm / explainer summaries surfaced in the fact-check pass (e.g. `https://impactwealth.org/family-reunification-parole-and-temporary-restraining-orders/`) **[S secondary; order text not opened; added 2026-10-20]** |
| 2026-01-24 | Talwani PI blocks FRP termination **only to the extent the notice ends previously granted parole/EADs before their original end dates** (it does not revive the FRP processes for new applicants); USCIS says it "disagrees" but "is complying" | USCIS FRP page `https://www.uscis.gov/humanitarian/humanitarian-parole/the-cuban-family-reunification-parole-program` **[verified; scope qualifier added 2026-10-20, S secondary]** |
| 2026-03-05 | Dorcas v. USCIS filed (D.R.I.) | **[verified]** |
| 2026-06-05 | Dorcas ruling vacates the 39-country hold and three related policies | AIC `https://www.americanimmigrationcouncil.org/blog/court-blocks-uscis-immigration-pause-39-countries/`; CBS `https://www.cbsnews.com/news/trump-legal-immigration-cases-judge-blocks/` **[verified]** |
| 2026-05 (reported May 22) | USCIS directive reportedly allowing denial of adjustment applications without an RFE/NOID; reported as affecting CAA applicants; memo number and exact date not captured | CiberCuba 2026-05-22 and 2026-10-14 **[S single outlet; added 2026-10-20]** |
| 2026-06-12 | Government files its First Circuit appeal of Dorcas (No. 26-1703) | CourtListener docket 73477958 **[S]** |
| 2026-06-15 | USCIS resumes green-card processing for the 39 countries while appealing | Visa Lawyer Blog `https://www.visalawyerblog.com/uscis-resumes-green-card-processing-for-nationals-from-39-countries-while-government-appeals-court-ruling/`; `https://www.immigrationissues.com/uscis-confirms-it-will-comply-with-the-dorcas-vacatur-of-the-country-hold-policies/` **[likely]** |
| 2026-07-15 | **District court (D.R.I.)** denies the government's motion to stay the Dorcas vacatur pending appeal (the draft had mis-attributed this to the appeals court) | AILA `https://www.aila.org/library/district-court-denies-government-motion-to-stay-decision-vacating-uscis-hold-policies-in-dorcas-v-uscis`; iandoli.com **[S — corrected 2026-10-20]** |
| 2026-08-14 | **First Circuit partially stays the Dorcas vacatur: the Comprehensive Re-Review Policy (re-review of approved benefits for nationals of the 39 countries who entered on/after Jan 20 2021) is reinstated pending appeal; the other three policies stay vacated.** Previously approved Cuban applicants may again be subject to re-review. | Justia `https://law.justia.com/cases/federal/appellate-courts/ca1/26-1703/26-1703-2026-08-14-0.html`; Envoy Global; `https://www.visasupdate.com/post/uscis-re-review-policy-travel-ban-appeal-2026` **[S — added 2026-10-20]** |
| 2026-08-24 | Red Eagle Law v. Edlow class PI (N.D. Cal.) | Courthouse News `https://www.courthousenews.com/citizenship-and-immigration-services-ordered-to-resume-processing-work-permit-applications/` **[verified]** |
| 2026-08-28 | USCIS alert "Recent Court Order on Hold Policies" acknowledges the Red Eagle order (class certification; PM-602-0192 and -0194 enjoined) | `https://www.uscis.gov/newsroom/alerts/recent-court-order-on-hold-policies` **[S — added 2026-10-20]** |
| 2026-09-10 | Bello-Rubio v. Noem (I-220A class action) hearing: first motion to dismiss denied, jurisdiction retained | Telemundo 51 **[S — added 2026-10-20]** |
| 2026-10-05 | New D. Mass. suit vs. May 2026 discretion memo | CiberCuba **[likely]** |
| 2026-10-06 | CiberCuba reports the **median wait for a CAA green card reached 11.8 months in 2026 vs 3.3 months in 2023** — a direct calibration input for the estimator | `https://en.cibercuba.com/noticias/2026-10-06-u1-e135253-s27061-nid342034-green-card-ley-ajuste-cubano-tarda-casi-ano-tiempo` **[S as reported; underlying USCIS table not opened; added 2026-10-20]** |
| 2026-10-09 | Government's renewed motion to dismiss Bello-Rubio v. Noem (ECF 77) | CiberCuba; Spectrum Noticias **[verified]** |
| 2026-10-20 | CiberCuba reports USCIS quarterly data: **Apr–Jun 2026, 586 CAA decisions = 139 approvals / 447 denials; "more than 342,000" cases unresolved**. A second outlet (América TeVe) confirms the quarter and adds the baseline: **10,432 CAA approvals in the same quarter of FY2025 (a >98% drop)** and **342,360 cases without a final decision at end of June 2026, reported as CAA files** | `https://en.cibercuba.com/noticias/2026-10-20-u1-e135253-s27061-nid343309-solo-139-cubanos-obtuvieron-residencia-ley-ajuste`; `https://www.americateve.com/cuba/alarma-cubanos-uscis-aprobo-solo-139-residencias-ley-ajuste-y-rechazo-otras-447-n5464900` **[verified as reported by two outlets; whether 342,360 = pending CAA I-485s specifically still to be checked against the USCIS table]** |

Note the user's framing ("the freeze was found unconstitutional"): the June 2026 Dorcas ruling and the August 2026 Red Eagle injunction were decided on **Administrative Procedure Act** grounds (arbitrary and capricious; agency has no discretion to refuse to adjudicate), not on constitutional grounds, per every summary found. **[verified]**

### 4.5 Test attempted from this sandbox (could not complete)

```bash
curl -sS --max-time 60 -H "Accept: application/json" \
  "https://www.courtlistener.com/api/rest/v4/search/?q=%22CHNV%22+parole&type=r&order_by=dateFiled+desc"
# Result on 2026-10-20 in this environment:
# curl: (56) CONNECT tunnel failed, response 403   (www.courtlistener.com:443 connect_rejected)

# Recommended follow-up queries once network access is available.
# NOTE (corrected 2026-10-20): /dockets/ and /docket-entries/ return 401 without a token; only /search/ works anonymously.
export COURTLISTENER_TOKEN=...   # from a (free or paid) CourtListener account
curl -sS -H "Authorization: Token $COURTLISTENER_TOKEN" "https://www.courtlistener.com/api/rest/v4/dockets/?court=mad&docket_number=1:25-cv-10495"
curl -sS -H "Authorization: Token $COURTLISTENER_TOKEN" "https://www.courtlistener.com/api/rest/v4/dockets/?court=rid&docket_number=1:26-cv-00132"
curl -sS -H "Authorization: Token $COURTLISTENER_TOKEN" "https://www.courtlistener.com/api/rest/v4/dockets/?court=ca1&docket_number=26-1703"
curl -sS -H "Authorization: Token $COURTLISTENER_TOKEN" "https://www.courtlistener.com/api/rest/v4/dockets/?court=cand&docket_number=3:26-cv-04850"
curl -sS -H "Authorization: Token $COURTLISTENER_TOKEN" "https://www.courtlistener.com/api/rest/v4/dockets/?court=flsd&docket_number=1:25-cv-23665"
curl -sS "https://www.courtlistener.com/api/rest/v4/search/?q=%22Cuban+Adjustment+Act%22&type=r&order_by=dateFiled+desc"
# Known docket page (Dorcas appeal): https://www.courtlistener.com/docket/73477958/dorcas-international-institute-of-rhode-island-v-united-states-citizenship/
```

Expected search response shape **[likely]**: `{"count": N, "next": url, "previous": url, "results": [{"docket_id", "docket_absolute_url", "caseName", "docketNumber", "court", "court_id", "dateFiled", "dateTerminated", "assignedTo", "pacer_case_id", "recap_documents":[...]}]}`.

## 5. Census ACS — Cuban-born population as a denominator

### 5.1 Tables

| Table | Title | Cuba line | Geographies | Notes |
|---|---|---|---|---|
| **B05006** | Place of Birth for the Foreign-Born Population in the United States | Cuba is a row in the Caribbean block (Americas → Latin America → Caribbean → Bahamas, Barbados, **Cuba**, …). **The variable suffix changes between vintages** (it was `B05006_128` in the 2014–2018 5-year table; Nigeria is `B05006_124` in 2024 1-year; Cuba in 2023/2024 is therefore in roughly the `_140`–`_145` range but **I could not confirm the exact code** — resolve it at runtime from the group metadata, never hardcode) | nation, state, county, place, CBSA (metro), PUMA, tract (5-yr) | **[verified table and structure; exact code uncertain]** Sources: `https://data.census.gov/table/ACSDT5Y2021.B05006`, `https://censusreporter.org/tables/B05006/`, `https://api.census.gov/data/2023/acs/acs5/groups/B05006.html`, `https://www.socialexplorer.com/data/ACS2018_5yr/metadata/?ds=ACS18_5yr&table=B05006` |
| **B03001** | Hispanic or Latino Origin by Specific Origin | `B03001_006E` = Cuban (ancestry/origin, includes U.S.-born Cuban-Americans) | all | **[likely — code from prior knowledge]** Useful for community size, not for immigrant counts |
| **B05007** | Place of Birth by Year of Entry by Citizenship Status for the Foreign-Born Population | region level only (Latin America), not Cuba | all | gives recency of arrival **[likely]** |
| **S0506** | Selected Characteristics of the Foreign-Born Population by Region of Birth: Latin America | region only | state+ | **[likely]** |
| **ACS PUMS microdata** | Public Use Microdata Sample | `POBP = 327` (Cuba) × `YOEP` (year of entry) × `ST` (state) × `CIT` (citizenship) | state / PUMA | **the only way to count Cuban-born residents who entered in 2022–2024 by state** — i.e. the population that is now CAA-eligible. API: `https://api.census.gov/data/2024/acs/acs1/pums?get=PWGTP,YOEP,ST,CIT&POBP=327` **[likely — POBP code from prior knowledge; verify in the PUMS data dictionary]** Docs: `https://www.census.gov/data/developers/data-sets/census-microdata-api/acs-1y-pums.html` |

### 5.2 API usage **[verified endpoints; variable codes to be resolved]**

```text
# Discover the Cuba variable code for a vintage (look for "label": "Estimate!!Total:!!Americas:!!Latin America:!!Caribbean:!!Cuba")
https://api.census.gov/data/2024/acs/acs1/groups/B05006.json
https://api.census.gov/data/2023/acs/acs5/groups/B05006.json

# Cuban-born population by state (1-year, states + large counties/metros; use 5-year for small areas)
https://api.census.gov/data/2024/acs/acs1?get=NAME,<CUBA_VAR>E,<CUBA_VAR>M&for=state:*
# ... by metro area
https://api.census.gov/data/2024/acs/acs1?get=NAME,<CUBA_VAR>E,<CUBA_VAR>M&for=metropolitan%20statistical%20area/micropolitan%20statistical%20area:*
# ... by county (5-year)
https://api.census.gov/data/2023/acs/acs5?get=NAME,<CUBA_VAR>E&for=county:*&in=state:12
```

- No API key is needed for low volumes (the Census API allows ≈500 requests/day per IP without a key; a free key lifts that). **[likely]**
- Vintages: ACS 2024 1-year released Sept 2025 (`https://www.census.gov/data/developers/data-sets/acs-1year/2024.html`, `https://api.census.gov/data/2024/acs/acs1.html`); ACS 2023 5-year released Dec 2024 (`https://www.census.gov/data/developers/data-sets/acs-5year/2023.html`). ACS 2025 1-year (the first vintage to fully capture the 2023–2024 arrivals) is scheduled for September 2026 — **check whether it is out**. **[verified for 2024/2023; 2025 release status uncertain]**
- A test call to `api.census.gov` from this sandbox failed (DNS not reachable through the proxy), so none of the above was executed today.

### 5.3 What Census feeds the app

- **State/metro denominators**: the share of Cuban-born residents (and of 2022–2024 entrants, via PUMS) living in each state, used as a prior for how many CAA applicants each USCIS field office serves. Florida alone holds roughly two-thirds of the Cuban-born population; Texas, New Jersey, Kentucky, Nevada, Georgia, North Carolina follow (ordering from prior knowledge, **[likely]**, confirm with B05006).
- A reality check on OHSS: Cuba-born new LPRs by state (Supp. Table 1) divided by Cuba-born recent entrants by state (PUMS) ≈ per-state "conversion rate" to green card — a direct, if coarse, measure of which states' offices are slower.

## 6. EOIR (immigration-court) data — relevant but secondary

- **EOIR Case Data (FOIA release)**: monthly zip of the whole CASE database, pipe-delimited text, ~30 GB across 18 linkable tables; listed on the FOIA Library (`https://www.justice.gov/eoir/foia-library-0`) and on data.gov (`https://catalog.data.gov/dataset/eoir-case-data`, single download `FOIA-TRAC-Report.zip`). The Immigration Court Cases table includes **nationality** (Cuba), court location, custody status, case type, decision and date. The FOIA Library listing seen today showed October 2025 as the most recent posted month. **[verified]** The zip is known to fail with some unzip utilities (use 7-Zip/`unzip`). **[verified]**
- **Cleaned version**: Deportation Data Project's EOIR release (March 27 2026, `https://deportationdata.org/news/2026-03-27-EOIR-release.html`; data page `https://deportationdata.org/data/eoir.html`; codebook `https://deportationdata.org/docs/eoir/codebook-processed.html`) with a filter tool by nationality/court/outcome/date. **[verified]**
- Adjudication statistics PDFs (national pending-case totals; IJs completed 701,749 cases in FY2024 — CRS IN12492, `https://www.congress.gov/crs-product/IN12492`). **[verified]**
- Why it matters for CAA: Cubans in removal proceedings (most I-220A releases received NTAs) generally cannot adjust before USCIS while proceedings are pending and, after *Matter of Roque-Izada*, IJs will not terminate proceedings merely so they can seek CAA adjustment. The EOIR data therefore sizes the **"Cubans in limbo" population that is *not* in the USCIS queue** and tells the app how many could join the queue if the I-220A class action (4.3 #8) succeeds. It is a quarterly, low-priority job; TRAC's court tools (`https://trac.syr.edu/`) provide ready-made Cuba counts if the raw zip is too heavy. **[inference]**

## 7. CRS and GAO reports

### 7.1 Congressional Research Service **[all URLs verified today unless noted]**

| Product | Title | Date | Relevance | URL |
|---|---|---|---|---|
| R46570 | Immigration Parole | updated 2024–2025 | legal basis for CHNV; cites the OHSS monthly CHNV tables | `https://www.congress.gov/crs-product/R46570` |
| R47654 | Immigration Options for Immigration Parolees | 2023–2025 | explains that CHNV Cubans can use the CAA after one year; travel-authorization numbers | `https://www.congress.gov/crs-product/R47654` |
| R48514 | Immigration Parolees' Eligibility for Federal Benefits | 2025 | states OHSS published monthly CHNV tables Oct 2022–Nov 2024 and gives the xlsx URL | `https://www.congress.gov/crs-product/R48514`; HTML `https://www.congress.gov/crs_external_products/R/HTML/R48514.html` |
| IF13030 | The CBP Home Mobile Application and "Self-Departure" | 2025 | CBP One appointment totals (904,530 Jan 2023–Nov 2024); CHNV termination date | `https://www.congress.gov/crs-product/IF13030`; PDF `https://www.congress.gov/crs_external_products/IF/PDF/IF13030/IF13030.2.pdf` |
| IN12492 | FY2024 EOIR Immigration Court Data: Caseloads and the Pending Cases Backlog | 2025 | EOIR backlog context | `https://www.congress.gov/crs-product/IN12492` |
| R44714 | U.S. Policy on Cuban Migrants: In Brief | Dec 16 2016 | CAA mechanics; end of wet-foot/dry-foot | `https://www.congress.gov/crs_external_products/R/PDF/R44714/R44714.3.pdf`; `https://www.everycrsreport.com/reports/R44714.html` |
| R40566 | Cuban Migration to the United States: Policy and Trends | June 2 2009 | history | `https://www.congress.gov/crs_external_products/R/PDF/R40566/R40566.3.pdf` |
| RS20468 | (older CRS product on Cuban migration) | 2006 | history | `https://www.everycrsreport.com/files/20060119_RS20468_dcebe7c590494ecaae72d52dd8f5f4eeff49f16b.pdf` |

Searches found **no 2025–2026 CRS product devoted to the Cuban Adjustment Act or to the CHNV termination litigation** (a Legal Sidebar on *Doe v. Noem* may exist but did not surface). To monitor: `https://www.congress.gov/search?q=%7B%22source%22%3A%22crsreports%22%2C%22search%22%3A%22Cuban+Adjustment+Act%22%7D` and the same with `CHNV parole`. **[verified absence in today's searches]**

### 7.2 GAO

- **GAO-21-529**, "U.S. Citizenship and Immigration Services: Actions Needed to Address Pending Caseload" (Aug 2021): pending caseload rose an estimated 85% FY2015–FY2020; causes cited by USCIS were policy changes, longer forms, expanded interview requirements, insufficient staffing. **[verified title/number via secondary citation]**
- No 2025–2026 GAO product on USCIS backlogs or on CHNV surfaced before the search budget ran out. **[uncertain — search incomplete]** Monitor `https://www.gao.gov/reports-testimonies` with keyword "USCIS" / "parole"; GAO publishes an RSS feed per topic.
- Non-GAO quantitative backlog analyses that *are* current and machine-readable-adjacent (they re-publish USCIS quarterly tables): American Immigration Council "USCIS Filing Trends" (`https://www.americanimmigrationcouncil.org/blog/uscis-immigration-processing-trends-2026/`) — pending cases ≈12.1 million at end of FY2026 Q2, formal net backlog ≈7.03 million, estimated backlog-clearance time up from 12.5 months (FY2025 Q2) to 24.1 months (FY2026 Q2), **I-485 approval rate for Cuban nationals down 44.6 percentage points**, pending applications from people with pending adjustment up from 154,469 (FY2025 Q1) to 461,884 (FY2026 Q1); Niskanen Center "Legal immigration in numbers" monthly update (`https://www.niskanencenter.org/immigrationdata/`). **[verified as reported]**

## 8. State-level data

> This section was cut short by the search budget; the Florida/Kentucky/Texas/Nevada agency pages below are from prior knowledge and are **[uncertain]** until opened.

### 8.1 Federal data *about* states (verified, and the best starting point)

| Source | What | URL | Format / cadence |
|---|---|---|---|
| OHSS LPR Supplemental Table 1 (FY2024) | **Cuba-born new LPRs by state** | `https://ohss.dhs.gov/topics/immigration/yearbook/2024/LPRsupptable1` | xlsx, annual **[verified]** |
| OHSS LPR Supplemental Table 2 (FY2024) | Cuba-born new LPRs by metro (CBSA) | `https://ohss.dhs.gov/topics/immigration/yearbook/2024/LPRsupptable2` | xlsx, annual **[verified]** |
| OHSS LPR profiles by state / CBSA / country | state profile → class-of-admission mix; Cuba profile → state mix | `https://ohss.dhs.gov/topics/immigration/lawful-permanent-residents/profiles` | xlsx, annual **[verified]** |
| OHSS county tables (top 200 counties × class × country) | Miami-Dade etc. | linked from `https://ohss.dhs.gov/topics/immigration/lawful-permanent-residents` | xlsx, annual **[verified]** |
| OHSS State Immigration Data / Map | adjustments, naturalizations, asylum grants, arrivals by state, 10 years | `https://ohss.dhs.gov/topics/immigration/state-immigration-data/state-immigration-statistics-map` | xlsx + interactive **[verified]** |
| Census ACS B05006 / PUMS | Cuban-born stock and recent entrants by state/metro | section 5 | JSON API **[verified]** |
| HHS/ORR Cuban-Haitian Entrant Program data | ORR funds state "refugee services" for Cuban/Haitian **entrants** (parolees qualify); ORR's annual Report to Congress and its "Refugee Arrival Data" page give arrivals by state and nationality — but the arrivals page covers *refugees*; entrant counts come from state reporting | `https://acf.gov/orr/data` (prior knowledge) | PDF/xlsx, annual **[uncertain]** |

### 8.2 State refugee-services agencies (candidates)

| State | Why | Candidate source | Confidence |
|---|---|---|---|
| **Florida** | ≈60–70% of all Cuban arrivals; DCF's Refugee Services Program is the largest in the country and serves "Cuban/Haitian entrants," so its intake counts ≈ Cuban parolee arrivals by county | Florida DCF Refugee Services statistics (`https://www.myflfamilies.com/services/public-assistance/refugee-services` and its "Refugee Services Data/Statistics" sub-page, which historically published arrivals by county, nationality and status, monthly/quarterly) | **[uncertain — page not opened today]** |
| **Kentucky** | Louisville is the #2 Cuban destination outside Florida; Kentucky Office for Refugees (run by Catholic Charities of Louisville under the state) publishes annual arrival reports by nationality including Cuban entrants | Kentucky Office for Refugees annual report (`https://kyrefugees.org/`) | **[uncertain]** |
| **Texas** | Houston/Austin/Dallas Cuban growth; Texas withdrew from the federal refugee program in 2016, so data are via the replacement designee (Refugee Services of Texas / Texas Office for Refugees at Catholic Charities Fort Worth) | `https://www.texasrefugees.org/` or HHSC Office of Refugee Services | **[uncertain]** |
| **Nevada** | Las Vegas Cuban community; Nevada DWSS Refugee Program / Catholic Charities of Southern Nevada | `https://dwss.nv.gov/` refugee program page | **[uncertain]** |

Metric these feed: **arrivals-by-state of Cuban entrants in 2023–2025**, i.e. the state distribution of people who become CAA-eligible one year later — which the app otherwise has to infer from Census stock data. Format is typically PDF; expect manual or OCR ingestion, annual cadence.

## 9. How each source maps to app metrics

| App metric | Primary non-USCIS source | Cadence | Role |
|---|---|---|---|
| Total CAA green cards granted per FY (national) | OHSS Table 10 / country×class xlsx (Cuba × refugees & asylees); Table 7 if a Cuban line exists | annual | **calibration** of the USCIS approval series |
| CAA grants by state / metro | OHSS Supp. Tables 1–2, Table 11/12, profiles, county tables | annual | per-office throughput prior |
| Quarterly CAA grants | OHSS quarterly Legal Immigration report | quarterly (lagging) | cross-check of USCIS quarterly approvals |
| Newly eligible Cubans per month (demand curve) | OHSS monthly CHNV tables + CBP custody/transfer parole rows + CBP encounter CSV (Cuba) | monthly (historical) | demand side of the queue model |
| Where applicants live (denominators) | Census B05006 / PUMS; OHSS state data; FL DCF/KY/TX/NV arrivals | annual | state weighting in the estimator |
| Policy regime flags (freeze on/off, program terminated, injunction in force) | Federal Register API; CourtListener dockets #1, #4 (incl. First Circuit 26-1703), #5, #8 (token required) | daily poll / alerts | **regime variable** for the survival model; push notifications |
| Cubans outside the USCIS queue (I-220A / in proceedings) | EOIR case data (nationality = Cuba, pending), TRAC | monthly/quarterly | scenario analysis if the I-220A suit succeeds |
| Context backlog numbers | AIC / Niskanen re-publications of USCIS quarterly data; CRS; GAO-21-529 | quarterly | explanatory text in the app |

## 10. Concrete pipeline recommendations

1. **Treat OHSS as annual calibration, not live data.** Build one xlsx parser that matches rows by label ("Cuba", "Refugees and asylees", "Cuban") rather than by position, because OHSS renumbers columns and sheets between editions. Store every edition with its publication date; the FY2025 Yearbook (covering the cousin's filing period) will land in 2027.
2. **Seed the CHNV population from the November 2024 OHSS monthly file** (URL in 1.8) and the DHS notice total (532,000; ≈110k Cubans); the series is closed, so this is a one-time load. Shift Cuban monthly parole counts +12 months to produce the earliest-filing-date curve.
3. **Poll the Federal Register API daily** with query #1 and #2 in 3.3, de-duplicate on `document_number`, and classify hits with a small keyword rule set (CHNV, parole, Cuban, adjustment, proclamation) before pushing alerts.
4. **Register a CourtListener account, store the token server-side, and poll `docket-entries` for dockets #1, #4 (both D.R.I. 1:26-cv-00132 and First Circuit 26-1703), #5 and #8 (`flsd` 1:25-cv-23665) once or twice a day**; or subscribe to docket alerts and ingest the e-mail/webhook. Docket endpoints reject anonymous calls (401), so every request must carry `Authorization: Token <key>`; the authenticated default of 125 requests/day covers 4–5 dockets polled twice daily with margin, and paid/EDU tiers exist if more is needed. Keep the RECAP storage URL pattern to deep-link to the PDF of any new order. **[corrected 2026-10-20]**
5. **Resolve Census variable codes at build time** from `groups/B05006.json` for the chosen vintage; never hardcode `B05006_1xx`. Pull state and CBSA rows; cache for a year.
6. **Model the regime variable with the dates in 4.4**: Feb 14 2025–May 28 2025 (parolee hold); **Dec 2 2025** (PM-602-0192, 19 countries incl. Cuba) → Jan 1 2026 (PM-602-0194, 39 countries) → **Jun 5 2026** (Dorcas vacatur) for the nationality hold, with **Aug 14 2026** (Comprehensive Re-Review Policy reinstated by the First Circuit) and **Aug 24 2026** (Red Eagle class PI) as further break points; plus the FRP cut-off (Dec 15 2025 filing / Jan 14 2026 parole end) — cases pending inside those windows need a separate hazard. The May 2025 declaration (8,855 adjudications in 5 weeks after the hold lifted) gives a rough "post-freeze catch-up rate." **[window anchors corrected 2026-10-20]**
7. **Flag the April–June 2026 CAA numbers (139 approvals / 447 denials, vs. 10,432 approvals in the same quarter of FY2025)** as a regime of near-zero throughput and high denial share; the estimator must not extrapolate pre-2025 CAA speeds (historically months, not years) into 2026 without a regime adjustment. Use the reported **median CAA wait of 11.8 months in 2026 vs 3.3 months in 2023** (CiberCuba 2026-10-06, from USCIS data) as the headline calibration point for completed cases, remembering that a median over *completed* cases understates the wait of the 342,360 still pending. **[added 2026-10-20]**
8. **Defer EOIR and state PDFs** to a later milestone; they add explanatory power but not timing precision.

## 11. Open questions to resolve when network access is available

1. Does OHSS Table 7 (FY2024) contain an explicit "Cuban Adjustment Act" row, or are CU6/CU7 only inside "Refugee adjustments"? (Open `.../yearbook/2024/table7` and the LPR xlsx.)
2. Which file does the "LPRs by Country of Birth and Major Class of Admission" page now serve — FY2005–FY2022 or FY2005–FY2024 (homepage says updated 07/15/2026)?
3. Did OHSS publish any monthly tables after January 2025, and do post-termination editions still carry the CHNV sheets? (Check the download table on the monthly-tables page and the 05/14/2026 data dictionary.)
4. Has the quarterly Legal Immigration report progressed beyond FY2025 Q1 (posted 07/25/2025)? *(Partly answered 2026-10-20: a June 2026 secondary source says the full FY2025 report is out — confirm on the page and record the lag.)*
5. Run the Federal Register and CourtListener curl commands in 3.4 and 4.5; record the real `count`, field names and rate-limit headers.
6. Confirm the First Circuit docket number (25-1384) and the Supreme Court application number (24A1079) on ca1.uscourts.gov / supremecourt.gov. *(Resolved 2026-10-20: Dorcas appeal = First Circuit No. 26-1703; I-220A suit = Bello-Rubio v. Noem, S.D. Fla. 1:25-cv-23665. Still to capture: its PACER case id, and the D. Mass. caption/docket of the Oct 5 2026 suit.)*
7. Resolve the exact B05006 Cuba variable for ACS 2024 1-year and 2023 5-year, and confirm `POBP=327` in the 2024 PUMS dictionary; check whether ACS 2025 1-year has been released.
8. ~~Verify the FR document number/title for the Dec 2025 FRP termination notice (2025-22744)~~ *(done 2026-10-20 — see 3.5)* and the Proclamation numbers 10949 / 10998 (still only indirectly confirmed); also capture the memo number and date of the May 2026 USCIS adjustment-discretion directive.
9. Locate the Florida DCF Refugee Services statistics page and the Kentucky Office for Refugees annual report; determine whether either gives monthly Cuban entrant arrivals by county.
10. Check whether the "more than 342,000 unresolved" figure in the 2026-10-20 CiberCuba report refers to pending CAA I-485s specifically (USCIS quarterly "I-485 by category" table) or to all Cuban-national benefit requests. *(América TeVe reports the precise figure 342,360 and describes it as CAA files — likely but still to be read off the USCIS table.)*
11. Search GAO for any 2025–2026 report on USCIS pending caseload or parole programs (searches were cut off).

## 12. Verification notes (2026-10-20)

A fact-checker reviewed the draft (7 searches) and the editor ran 2 confirming searches. Overall verdict: *needs minor fixes* — the data-source inventory stands; the litigation timeline needed updating. Tags: **[S]** seen in a 2026-10-20 search result (URL cited), **[T]** training knowledge not confirmed today, **[I]** inference, **[U]** unresolved.

### 12.1 Corrections applied in place

| # | Where | What was wrong | What it now says | Severity |
|---|---|---|---|---|
| 1 | 4.3 row 4; 4.4; 10.6 | The mid-July 2026 stay denial in Dorcas was attributed to the First Circuit, and no August 2026 event was recorded, so all four vacated policies were presented as still vacated. | Appeal is First Circuit **No. 26-1703** (filed Jun 12 2026). **D.R.I.** denied the stay Jul 15 2026. **Aug 14 2026: First Circuit granted a partial stay — Comprehensive Re-Review Policy reinstated pending appeal; Benefits Hold, Global Asylum Hold and Country-Specific Factors policies remain vacated.** Merits appeal pending. **[S — editor-confirmed: Justia opinion page, CourtListener docket 73477958, Envoy Global, AfghanEvac]** | major |
| 2 | 4.4; 3.5; 10.6 | The 19-country hold was dated "~Nov 28 2025" and the 39-country expansion was placed in Dec 2025, with wording implying Cuba was added only by the expansion. | **PM-602-0192 is dated Dec 2 2025** (19 Proclamation 10949 countries, Cuba included from that date); **PM-602-0194 is dated Jan 1 2026** (39 countries of Proclamation 10998 + Palestinian Authority); PM-602-0193 is the DV-2026 hold. Regime window now anchors on Dec 2 2025. **[S — AILA]** | major |
| 3 | 1.7; 1.10 | "No FY2025 Q2–Q4 editions" of the quarterly Legal Immigration report — a conclusion drawn from a truncated page snippet. | A June 5 2026 secondary source reports the full FY2025 report is published; treat the latest edition as at least FY2025 Q4 until the page is opened; "irregular since 2025" removed from the pipeline table. **[S — lucidtext blog]** | minor |
| 4 | 4.3 row 5 | "Implementation guidance not yet published" for Red Eagle. | USCIS published the alert "Recent Court Order on Hold Policies" on Aug 28 2026; class definition confirmed (Cuban CAA I-485 applicants are class members); one tracker reports proceedings later stayed with the motion to dismiss deferred. **[S — uscis.gov alert; clinchlaw]** | minor |
| 5 | 4.1; 4.5; 10.4 | Anonymous CourtListener access described as merely "throttled". | Anonymous requests work only for `/search/`, `/courts/`, `/audio/`; docket/opinion/cluster endpoints return 401 (Oct 6 2026 third-party test). Authenticated default 5/min, 50/hr, 125/day confirmed in the v4.7 docs; reduction dated May 7 2026; paid tiers and a free EDU tier exist. The 4.5 docket commands now send a token. **[S — wiki.free.law v4.7; api-evangelist]** | minor |

### 12.2 Load-bearing claims that remain unverified (prioritised)

1. **FRP I-485 exception — now resolved [S]:** the editor's search confirmed notice 2025-22744 (Dec 15 2025) contains exactly two exceptions to the Jan 14 2026 parole end: (a) I-485 filed by Dec 15 2025 and pending on Jan 14 2026 (parole continues until final decision or parole expiry, whichever first; a denial terminates parole) and (b) case-by-case Secretary determinations. Sources: federalregister.gov document page; JAC FRN decoder; Connell Foley. The notice text itself was still not opened from this sandbox.
2. **[T]** Doe v. Noem First Circuit docket **25-1384** and the Sept 12 2025 decision date (4.3 row 3) — docket number self-labelled "from memory"; not searched.
3. **[T]** Supreme Court application **24A1079** / May 30 2025 stay (row 2) — consistent with training knowledge; not confirmed today.
4. **[T]** Whether OHSS Yearbook FY2024 Table 7 has an explicit "Cuban Adjustment Act"/CU6 row, and whether the "LPRs by Country of Birth and Major Class of Admission" page now serves an FY2005–FY2024 file ("Updated 07/15/2026") — the annual calibration series depends on this; still unopened.
5. **[S partial]** OHSS monthly Immigration Enforcement and Legal Processes tables after Jan 2025: today's searches again showed Nov 2024 as the newest visible file and a third-party statement that the series was last released Jan 2025, while the 05/14/2026 data dictionary (report year 2025) is confirmed. The CHNV eligibility-clock seed therefore still relies on the Nov 2024 file.
6. **[T]** CHNV totals (532,000 in notice 2025-05128; ≈110,000 Cubans) and the Apr 24 2025 termination date — consistent with training knowledge, not re-verified in budget.
7. **[T]** Proclamation **10998** as the number of the Dec 2025 39-country expansion — seen only indirectly ("Proclamations 10949 and 10998" in the Red Eagle class definition); Proclamation 10949 likewise.
8. **[T]** Census codes (B05006 Cuba variable for ACS 2024 1-yr / 2023 5-yr; PUMS `POBP=327`) and the ACS 2025 1-year release status (scheduled Sept 2026) — not searched.
9. **[T]** Federal Register API syntax (`conditions[...]`, `per_page` ≤ 1000, no key) — consistent with training knowledge; the sandbox curl could not run.
10. **[S single source / U]** 4.3 row 9: the Oct 5 2026 D. Mass. suit and the claim that in Aug 2026 the court "found persuasive" the government's position that the May 2026 memo does not apply to CAA cases — one CiberCuba article; the directive's existence is corroborated by a second CiberCuba piece (2026-05-22) but the court finding is not. Kept in the text, tagged [U].
11. **[T]** AIC "USCIS Filing Trends 2026" figures (12.1M pending, 7.03M backlog, 24.1-month clearance, Cuban I-485 approval rate −44.6 pp) and the 8,855 adjudications May 28–Jun 30 2025 — not re-searched.
12. **[T]** Mullin v. Doe (row 7) relevance and the Mar 16 2026 cert-before-judgment grant — single Wikipedia-derived mention, unchecked.

### 12.3 Points the draft was missing (now added where indicated)

- **I-220A class action caption and docket** — *Bello-Rubio v. Noem*, S.D. Fla. 1:25-cv-23665, Judge Jacqueline Becerra; Sept 10 2026 hearing denied the first motion to dismiss; renewed motion Oct 9 2026 (ECF 77); response due Oct 23 2026; class-certification motion pending. Added to 4.3 row 8, 4.4, 4.5, 10.4; resolves open question 6. **[S — Telemundo 51; Spectrum Noticias]**
- **Aug 14 2026 First Circuit partial stay** (Comprehensive Re-Review Policy back in force) — added to 4.3 row 4, 4.4 and 10.6 as a regime break point. **[S]**
- **FRP litigation detail** — Jan 10 2026 TRO preceding the Jan 24 PI; PI scope limited to parole/EADs ending before their original end dates; full FR title and citation (90 FR No. 238, Dec 15 2025). Added to 3.5 and 4.4; "title inferred"/"likely" hedges dropped. **[S]**
- **Median CAA wait 11.8 months (2026) vs 3.3 months (2023)** — CiberCuba 2026-10-06; added to 4.4 and 10.7 as a calibration input. **[S as reported]**
- **Apr–Jun 2026 quarter baseline** — América TeVe corroborates 586/139/447 and adds 10,432 approvals in the same FY2025 quarter (>98% drop) and 342,360 cases without final decision at end of June 2026, described as CAA files. Added to 4.4, 10.7, open question 10. **[S]**
- **May 2026 USCIS adjustment directive** (denial without RFE/NOID, reported as affecting CAA applicants) — added as a 4.4 row and to row 9; memo number/date still to capture. **[S single outlet]**
- **OHSS "Adjustments to LPR by Year of Entry"** product — added to 1.6 and 1.10. **[S exists; unopened]**
- **CourtListener pricing tiers and 401 behaviour** — added to 4.1, 4.5, 10.4. **[S]**
- **Red Eagle class definition** explicitly covers Cuban CAA I-485 applicants — added to 4.3 row 5. **[S]**
- From the editor's own knowledge, tagged **[T]**: the Comprehensive Re-Review Policy that the First Circuit reinstated is the one directing re-examination of benefits already *approved* for nationals of the 39 countries who entered on or after Jan 20 2021 — so for the app it is a risk flag for *already-approved* Cuban cases (rescission/NOIR exposure), not a brake on pending I-485 adjudication, which the still-vacated Benefits Hold governed. **[T/I — confirm against the Aug 14 2026 order text]**

### 12.4 Searches used in this pass (editor: 2 of 2)

1. `"Dorcas International Institute" USCIS First Circuit 26-1703 stay "Comprehensive Re-Review" August 14 2026` (extended) → Justia opinion page, CourtListener docket 73477958, Envoy Global, WR Immigration, AILA, AfghanEvac, uscis-pause-tracker.com, visasupdate.com.
2. `"Termination of Family Reunification Parole Processes" 2025-22744 "January 14, 2026" pending Form I-485 exception parole remains valid` (extended) → federalregister.gov document page, JAC FRN decoder, Connell Foley, Ahluwalia Law, Visa Lawyer Blog (Dec 15 2025), Antone, Borderless Counsel, Impact Wealth.

## Sources (all accessed 2026-10-20 via web search; direct fetch was blocked in this environment)

OHSS / DHS
- https://ohss.dhs.gov/
- https://ohss.dhs.gov/topics/immigration
- https://ohss.dhs.gov/topics/immigration/immigration-enforcement/monthly-tables
- https://ohss.dhs.gov/about-our-data/governance/data-dictionaries/immigration-enforcement-and-legal-processes-monthly
- https://ohss.dhs.gov/about-our-data/governance/report-catalog
- https://ohss.dhs.gov/about-our-data/governance/data-dictionaries/yearbook-immigration-statistics
- https://ohss.dhs.gov/about-our-data/governance/data-dictionaries/legal-immigration-and-adjustment-status-report
- https://ohss.dhs.gov/topics/immigration/legal-immigration-and-adjustment-status-report
- https://ohss.dhs.gov/topics/immigration/lawful-permanent-residents
- https://ohss.dhs.gov/topics/immigration/lawful-permanent-residents/annual-flow-report
- https://ohss.dhs.gov/topics/immigration/lawful-permanent-residents/annual-flow-report/historical
- https://ohss.dhs.gov/topics/immigration/lawful-permanent-residents/annual-flow-report/fy-24-lpr-flow-report
- https://ohss.dhs.gov/sites/default/files/2024-09/2024_0906_plcy_lawful_permanent_residents_fy2023.pdf
- https://ohss.dhs.gov/topics/immigration/lawful-permanent-residents/immigrant-classes-admission
- https://ohss.dhs.gov/topics/immigration/lawful-permanent-residents/lprs-country-birth-and-major-classes-admission
- https://ohss.dhs.gov/topics/immigration/lawful-permanent-residents/profiles
- https://ohss.dhs.gov/topics/immigration/lawful-permanent-residents/lpr-yearbook-tables-8-11-expanded
- https://ohss.dhs.gov/topics/immigration/lawful-permanent-residents/population-estimates/fy-25-lpr-pop-estimates
- https://ohss.dhs.gov/topics/immigration/lawful-permanent-residents/adjustments-lawful-permanent-residence-year-entry (added 2026-10-20)
- https://blog.lucidtext.com/2026/06/05/i-485-update-fy2025-eb-5-visas-february-2026-i-485-inventory-aos-memo/ (secondary; FY2025 quarterly report; added 2026-10-20)
- https://ohss.dhs.gov/sites/default/files/2024-11/2024_1108_ohss_lawful_permenent_resident_population_estimate_2024_and_revised_2023.pdf
- https://ohss.dhs.gov/topics/immigration/yearbook/2024
- https://ohss.dhs.gov/topics/immigration/yearbook/2024/table3
- https://ohss.dhs.gov/topics/immigration/yearbook/2024/table6
- https://ohss.dhs.gov/topics/immigration/yearbook/2024/table7
- https://ohss.dhs.gov/topics/immigration/yearbook/2024/LPRsupptable1
- https://ohss.dhs.gov/topics/immigration/yearbook/2024/LPRsupptable2
- https://ohss.dhs.gov/topics/immigration/yearbook/2023
- https://ohss.dhs.gov/topics/immigration/yearbook/2023/table10
- https://ohss.dhs.gov/topics/immigration/yearbook/2023/table14
- https://ohss.dhs.gov/topics/immigration/yearbook/2022
- https://ohss.dhs.gov/topics/immigration/yearbook/2022/table6
- https://ohss.dhs.gov/sites/default/files/2024-03/2023_0818_plcy_yearbook_immigration_statistics_fy2022.pdf
- https://ohss.dhs.gov/sites/default/files/2023-12/2022_1114_plcy_yearbook_immigration_statistics_fy2021_v2_1_1.pdf
- https://ohss.dhs.gov/topics/immigration/state-immigration-data/state-immigration-statistics-map
- https://ohss.dhs.gov/topics/immigration/immigration-enforcement
- https://ohss.dhs.gov/topics/immigration/immigration-enforcement/annual-flow-report
- https://ohss.dhs.gov/sites/default/files/2025-01/2025_0116_ohss_immigration-enforcement-and-legal-processes-tables-november-2024.xlsx (cited by CRS R48514)
- https://dhs.gov/news/2023/07/25/fact-sheet-data-first-six-months-parole-processes-cubans-haitians-nicaraguans-and
- https://deportationdata.org/data/reports.html

CBP
- https://www.cbp.gov/newsroom/stats/custody-and-transfer-statistics-fy2025
- https://www.cbp.gov/newsroom/stats/custody-and-transfer-statistics-fy2024
- https://www.cbp.gov/newsroom/stats/custody-and-transfer-statistics-fy2023
- https://www.cbp.gov/newsroom/stats/custody-and-transfer-statistics-fy22
- https://cbp.gov/newsroom/national-media-release/cbp-releases-january-2025-monthly-update
- https://cbp.gov/newsroom/national-media-release/cbp-releases-january-2024-monthly-update

Federal Register
- https://www.federalregister.gov/documents/2025/03/25/2025-05128/termination-of-parole-processes-for-cubans-haitians-nicaraguans-and-venezuelans
- https://public-inspection.federalregister.gov/2025-05128.pdf
- https://public-inspection.federalregister.gov/2025-22744.pdf
- https://www.federalregister.gov/documents/2025/12/15/2025-22744/termination-of-family-reunification-parole-processes-for-colombians-cubans-ecuadorians-guatemalans (added 2026-10-20)
- https://justiceactioncenter.org/news/frn-decoder-frptermination/ (added 2026-10-20)
- https://www.connellfoley.com/blog/dhs-to-terminate-family-reunification-parole-processes-effective-january-14-2026-ending-eads-for-employees-from-7-countries (added 2026-10-20)
- https://impactwealth.org/family-reunification-parole-and-temporary-restraining-orders/ (added 2026-10-20)
- https://www.federalregister.gov/developers/documentation/api/v1 (via https://dev.to/ronin13/us-regulations-have-a-free-json-api-every-rule-notice-and-executive-order-without-scraping-4o34, https://www.vaquill.ai/blog/federal-register-api-python-search-rules-and-notices, https://ropengov.r-universe.dev/federalregister/doc/manual.html)

Courts / litigation
- https://justiceactioncenter.org/case/svitlana-doe-v-noem/
- https://justiceactioncenter.org/svitlana-doe-v-noem-class-action/
- https://litigationtracker.justiceactioncenter.org/cases/svitlana-doe-v-noem-humanitarian-parole-district-court
- https://litigationtracker.justiceactioncenter.org/cases/svitlana-doe-v-noem-humanitarian-parole-court-appeals
- https://justiceactioncenter.org/wp-content/uploads/2025/04/0097-Order-Granting-Stay-of-CHNV-Revocations.pdf
- https://justiceactioncenter.org/news/u-s-appeals-court-greenlights-trumps-mass-revocation-of-lawful-status-and-work-authorization-from-hundreds-of-thousands-of-parole-beneficiaries/
- https://justiceactioncenter.org/news/explainer-termination-of-chnv-humanitarian-parole/
- https://clearinghouse.net/case/46186/
- https://docs.justia.com/cases/federal/district-courts/massachusetts/madce/1:2025cv10495/281389/97
- https://storage.courtlistener.com/recap/gov.uscourts.mad.281389/gov.uscourts.mad.281389.199.2.pdf
- https://iptp-production.s3.amazonaws.com/media/documents/2025.12.29_Motion_for_TRO_-_Doe_v._Noem.pdf
- https://www.cliniclegal.org/resources/parole/chnv-parole-terminations-paused-district-court
- https://www.cliniclegal.org/resources/removal-proceedings/updates-chnv-parole-terminations-and-federal-litigation
- https://www.cliniclegal.org/resources/clinic-court-watch-federal-immigration-case-updates-january-2026
- https://www.cliniclegal.org/resources/humanitarian-relief/uscis-announces-policy-change-regarding-parole-status-certain-cubans
- https://immpolicytracking.org/policies/reporting-that-dhs-plans-to-terminate-chnv-parole-processes-and-revoke-parole-by-placing-certain-beneficiaries-in-removal-proceedings/
- https://www.americanimmigrationcouncil.org/blog/court-blocks-uscis-immigration-pause-39-countries/
- https://www.cbsnews.com/news/trump-legal-immigration-cases-judge-blocks/
- https://www.rnlawgroup.com/breaking-federal-court-strikes-down-uscis-adjudication-pause-for-travel-ban-countries/
- https://lhscimmigration.com/immigration-news/alerts/judge-rules-usciss-39-country-pause-unlawful/
- https://www.visaverge.com/uscis/chief-judge-john-j-mcconnell-jr-rules-dhs-broke-law-freezing-immigration-from-39-countries/
- https://www.visalawyerblog.com/uscis-resumes-green-card-processing-for-nationals-from-39-countries-while-government-appeals-court-ruling/
- https://www.courthousenews.com/citizenship-and-immigration-services-ordered-to-resume-processing-work-permit-applications/
- https://www.visaverge.com/uscis/red-eagle-class-covers-pending-i-589-i-485-and-other-uscis-applications/
- https://mcbeanlaw.com/uscis-adjudication-pause/
- https://www.caribbeannationalweekly.com/posts/us-court-orders-uscis-to-resume-processing-for-2026-diversity-visa-applicants
- https://www.yahoo.com/news/politics/articles/judge-ends-trump-freeze-immigration-181514602.html
- https://news.bloomberglaw.com/daily-labor-report/dhs-processes-thousands-of-immigration-benefits-after-order
- https://www.visalawyerblog.com/breaking-federal-judge-lifts-pause-on-immigration-applications-for-parolees-of-uniting-for-ukraine-military-parole-in-place-chnv-frp/
- https://www.littler.com/news-analysis/asap/uscis-lifts-administrative-pause-immigration-applications-filed-uniting-ukraine
- https://sverdlofflaw.com/uscis-administrative-hold-on-benefit-requests-for-u4u-chnv-and-frp-parolees/
- https://ukrainetaskforce.org/wp-content/uploads/2025/03/USCIS-Parolee-Benefits-Pause-Memo-February-14-2025.pdf
- https://www.uscis.gov/sites/default/files/document/foia/AdministrativeHoldonAllUSCISBenefitRequestsFiledbyParoleesUnderU4U_CHNVorFRP.pdf
- https://www.uscis.gov/newsroom/alerts/dhs-ends-the-abuse-of-the-humanitarian-parole-process-and-terminates-family-reunification-parole
- https://www.uscis.gov/humanitarian/humanitarian-parole/the-cuban-family-reunification-parole-program
- https://www.uscis.gov/save/current-user-agencies/guidance/faqs-on-the-effect-of-changes-to-parole-and-temporary-protected-status-tps-for-save-agencies
- https://www.americanimmigrationcouncil.org/blog/new-board-of-immigration-appeals-decision-sets-roadblock-for-cubans-others-seeking-green-cards/
- https://www.marcusdefense.com/post/bia-s-matter-of-roque-izada-decision-clarifies-jurisdiction-for-cubans-with-i-220a-what-it-means-fo
- https://www.justice.gov/eoir/media/1404086/dl
- https://en.wikipedia.org/wiki/Mullin_v._Doe
- https://drmantonya.com/resources/chnv-parole-program-guide
- https://wiki.free.law/c/courtlistener/help/api/rest/v4/overview
- https://wiki.free.law/c/courtlistener/help/api/rest/v4/rest-api-v47 (added 2026-10-20)
- https://free.law/2026/05/07/api-included-in-memberships/ (cited by secondary sources; not itself surfaced)
- https://github.com/api-evangelist/court-listener (added 2026-10-20)
- https://www.vaquill.ai/blog/how-to-use-courtlistener-api-2026
- https://law.justia.com/cases/federal/appellate-courts/ca1/26-1703/26-1703-2026-08-14-0.html (added 2026-10-20)
- https://www.courtlistener.com/docket/73477958/dorcas-international-institute-of-rhode-island-v-united-states-citizenship/ (added 2026-10-20)
- https://www.envoyglobal.com/news-alert/first-circuit-grants-partial-stay-in-challenge-to-uscis-immigration-adjudication-policies/ (added 2026-10-20)
- https://wolfsdorf.com/dorcas-on-appeal-district-court-pauses-its-own-ruling-as-first-circuit-takes-up-the-case/ (added 2026-10-20)
- https://www.aila.org/library/district-court-denies-government-motion-to-stay-decision-vacating-uscis-hold-policies-in-dorcas-v-uscis (added 2026-10-20)
- https://www.aila.org/library/district-court-issues-preliminary-injunction-to-lift-adjudication-hold-for-travel-ban-countries (added 2026-10-20)
- https://www.iandoli.com/newsandupdates/dorcas-update-federal-district-court-denies-trump-admins-motion-to-stay-order7292026 (added 2026-10-20)
- https://www.immigrationissues.com/uscis-confirms-it-will-comply-with-the-dorcas-vacatur-of-the-country-hold-policies/ (added 2026-10-20)
- https://uscis-pause-tracker.com/cases/dfdb50fe-3ed9-40f1-ac88-ff1e8371d88a (added 2026-10-20)
- https://afghanevac.org/dorcas (added 2026-10-20)
- https://www.visasupdate.com/post/uscis-re-review-policy-travel-ban-appeal-2026 (added 2026-10-20)
- https://www.uscis.gov/newsroom/alerts/recent-court-order-on-hold-policies (added 2026-10-20)
- https://news.clinchlaw.com/en/article/federal-court-certifies-class-and-blocks-uscis-hold-and-review-policies-affectin-mthwklkh (added 2026-10-20)
- https://www.telemundo51.com/noticias/local/audiencia-clave-en-corte-de-miami-para-cubanos-con-documento-i-220a/2823744/ (added 2026-10-20)
- https://spectrumnoticias.com/fl/florida/noticias/2026/10/13/gobierno-pide-desestimar-demanda-de-cubanos-con-la-orden-de-libertad-bajo-palabra-i-220a (added 2026-10-20)

Cuban community press (Spanish/English)
- https://en.cibercuba.com/noticias/2026-10-20-u1-e135253-s27061-nid343309-solo-139-cubanos-obtuvieron-residencia-ley-ajuste
- https://en.cibercuba.com/noticias/2026-10-11-u1-e13-s27061-nid342586-gobierno-eeuu-vuelve-pedir-desestimar-demanda-992
- https://en.cibercuba.com/noticias/2026-10-08-u1-e13-s27061-nid342267-demandan-uscis-nuevas-restricciones-obtener-green-card
- https://en.cibercuba.com/noticias/2026-10-17-u1-e129488-s27061-nid343101-te-vencio-parole-pasa-ahora-opciones-tienen-cubanos
- https://en.cibercuba.com/noticias/2026-10-06-u1-e135253-s27061-nid342034-green-card-ley-ajuste-cubano-tarda-casi-ano-tiempo (added 2026-10-20)
- https://www.americateve.com/cuba/alarma-cubanos-uscis-aprobo-solo-139-residencias-ley-ajuste-y-rechazo-otras-447-n5464900 (added 2026-10-20)
- https://www.cubaheadlines.com/articles/343309
- https://www.cubaheadlines.com/articles/342267
- https://refugees.org/chnv-humanitarian-parole-revoked-a-shift-in-u-s-policy-towards-cuban-exiles/

Census
- https://data.census.gov/table/ACSDT5Y2021.B05006
- https://censusreporter.org/tables/B05006/
- https://api.census.gov/data/2023/acs/acs5/groups/B05006.html
- https://api.census.gov/data/2024/acs/acs1.html
- https://api.census.gov/data/2024/acs/acs1/variables/B05006_124M.html
- https://www.census.gov/data/developers/data-sets/acs-1year/2024.html
- https://www.census.gov/data/developers/data-sets/acs-5year/2023.html
- https://www.census.gov/data/developers/data-sets/census-microdata-api/acs-1y-pums.html
- https://www.census.gov/topics/population/foreign-born/guidance/acs-guidance/acs-by-table-number.html
- https://www.socialexplorer.com/data/ACS2018_5yr/metadata/?ds=ACS18_5yr&table=B05006

EOIR
- https://www.justice.gov/eoir/foia-library-0
- https://catalog.data.gov/dataset/eoir-case-data
- https://deportationdata.org/news/2026-03-27-EOIR-release.html
- https://deportationdata.org/data/eoir.html
- https://deportationdata.org/docs/eoir/codebook-processed.html
- https://www.congress.gov/crs-product/IN12492

CRS / GAO / backlog analyses
- https://www.congress.gov/crs-product/R46570
- https://www.congress.gov/crs-product/R47654
- https://www.congress.gov/crs-product/R48514
- https://www.congress.gov/crs_external_products/R/HTML/R48514.html
- https://www.congress.gov/crs-product/IF13030
- https://www.congress.gov/crs_external_products/IF/PDF/IF13030/IF13030.2.pdf
- https://www.congress.gov/crs_external_products/R/PDF/R44714/R44714.3.pdf
- https://www.everycrsreport.com/reports/R44714.html
- https://www.congress.gov/crs_external_products/R/PDF/R40566/R40566.3.pdf
- https://www.americanimmigrationcouncil.org/blog/uscis-immigration-processing-trends-2026/
- https://www.americanimmigrationcouncil.org/blog/uscis-backlog-grows-less-immigration-filings/
- https://www.niskanencenter.org/immigrationdata/
- https://www.federalhiringdata.com/articles/uscis-pending-caseload-workforce-2026
- https://immpolicytracking.org/policies/uscis-backlog-of-immigration-petitions-and-applications-grows/

CHNV program background and totals
- https://www.americanimmigrationcouncil.org/wp-content/uploads/2023/10/chnv_fact_sheet_july_2025.pdf
- https://www.americanimmigrationcouncil.org/fact-sheet/biden-administrations-humanitarian-parole-program-cubans-haitians-nicaraguans-and/
- https://judiciary.house.gov/sites/evo-subsites/republicans-judiciary.house.gov/files/evo-media-document/2024-11-20%20The%20Biden%20Harris%20Administration's%20CHNV%20Parole%20Program%20Two%20Years%20Later%20-%20A%20Fraud-Ridden,%20Unmitigated%20Disaster.pdf
- https://www.refugeesinternational.org/perspectives-and-commentaries/setting-the-record-straight-on-chnv/
- https://www.judiciary.senate.gov/imo/media/doc/2023-03-28_-_qfr_responses_-_all.pdf
- https://www.mintz.com/insights-center/viewpoints/2806/2025-03-27-us-department-homeland-security-terminates-chnv-parole
- https://www.ilrc.org/sites/default/files/2024-09/Special%20Parole%20Programs%20-%20FINAL%209.12.24.pdf

Class-of-admission code references
- https://niwaplibrary.wcl.american.edu/wp-content/uploads/USCIS-AFM-23.11-CAA-VAWA-CAA.pdf
- https://www.hplct.org/assets/uploads/files/Library%20Services/Immigration/BLOGS/INS_CLASS_of_Admissions.pdf
- https://dssmanuals.mo.gov/wp-content/themes/mogovwp_dssmanuals/public/memos/memos_15/im080_15-att-refugee-categories.pdf
- https://www.avvo.com/legal-answers/cu6-cu7-green-card-1254739.html
