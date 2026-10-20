# 04 — Official USCIS data sources for live tracking of CAA / parole-based I-485 and I-765

**Research date:** 2026-10-20 (all URLs accessed that day unless stated).
**Scope:** every official USCIS data product that can feed the app's three metrics — *volumes* (received / approved / denied / pending), *durations* (processing times, case-inquiry dates, medians), and *per-case status* — for Cuban Adjustment Act (CAA) green-card applications (Form I-485) and the work permits (Form I-765) that CHNV parolees file under categories (c)(11) (parole) and (c)(9) (pending I-485).

**Verification legend used throughout**

| Tag | Meaning |
|---|---|
| **VERIFIED-FILE** | I downloaded the actual USCIS workbook/CSV (via a public GitHub mirror of the USCIS files, see §1.0) and parsed it with `openpyxl`/`csv`. Numbers quoted are read directly from the file. |
| **VERIFIED-CODE** | Read directly from open-source code that calls the USCIS endpoint (field names, URL patterns, headers). |
| **SEARCH** | Reported by a web-search result summary of a page I could not open myself. |
| **INFERRED** | My own deduction; flagged as such. |

**Environment caveat (important for whoever re-runs this):** the sandbox's egress proxy returned `403` on `CONNECT` for every USCIS/DHS host (`www.uscis.gov`, `egov.uscis.gov`, `developer.uscis.gov`, `ohss.dhs.gov`, `www.dhs.gov`) and for most news sites; `WebFetch` could not resolve them either. GitHub (`github.com`, `raw.githubusercontent.com`) was reachable. So: **no USCIS endpoint was exercised live from this environment.** Everything about endpoint behaviour comes from (a) open-source trackers that call them daily and (b) the USCIS files themselves, which a public repo mirrors byte-for-byte. The app's ingestion jobs must run from a normal network (home machine, VPS, or a CI runner with a residential exit — see §2.3 for why).

---

## 0. One-page matrix: which source feeds which app metric

| # | Source | Machine-readable? | URL | Cadence | Breaks out CAA / parole? | App metric |
|---|---|---|---|---|---|---|
| 1a | **Monthly "Number of Service-Wide Forms by Month" (Report to Congress)** | **Yes — CSV** | Linked from `https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data`; file name `appropriation_requirement_<month>_<year>_v1.0.csv` | Monthly, ~4–8 weeks after month end | **Yes: a dedicated `I-485 … (Cuban)` row** (received, approved, denied, pending, pending >6 mo, avg months). I-765 is one national line only. | National CAA volumes, approval/denial rate, pending inventory, mean completion time — the app's headline chart |
| 1b | **Quarterly "All USCIS Application and Petition Form Types"** | **Yes — XLSX** | same portal; `quarterly_all_forms_fy<YYYY>_q<N>_v1.xlsx` | Quarterly, ~10 weeks after quarter end (FY2026 Q3 = Apr–Jun 2026 published early Sep 2026) | **Yes: `I-485 … (Cuban)` row with median processing time**; I-765 split into Asylum / Adjustment of Status [(c)(9)] / DACA / All Other [(c)(11) is inside "All Other"] | Quarterly CAA median months; (c)(9) EAD volumes and median |
| 1c | **Quarterly "Application for Adjustment of Status (Form I-485)" by field office** | **Yes — XLSX** (one sheet `I485_by_State`) | same portal; `i485_performance_data_fy<YYYY>_q<N>_v1.xlsx` | Quarterly | **No CAA row.** Cuban cases sit inside "Humanitarian-based" (= Cuban + Refugee + Asylee exactly, verified §1.3). Field offices are listed under their **state** | Per-office / per-state pending & throughput proxy for CAA |
| 1d | Quarterly **Form I-765 by eligibility category** workbook | Yes — XLSX (SEARCH) | same portal | Quarterly | Yes — rows for (c)(9) and (c)(11) (SEARCH) | EAD volumes by category |
| 2a | **Processing Times tool** (`egov.uscis.gov/processing-times/`) | **Yes, but unofficial / undocumented** JSON (now served via Next.js server actions behind Cloudflare) | §2.2–2.3 | Updated monthly-ish, silently, sometimes several times a day | **No CAA subtype.** I-485 subtypes are Employment / Family / HRIFA / Asylee / Refugee / T / U. I-765 subtypes include `147-C9` and `147-C11` | 80th-percentile months per office; "case inquiry date" per office/subtype |
| 2b | **Historic national median processing times** (`egov.uscis.gov/processing-times/historic-pt`) | HTML table (scrapable); PDF fact sheet | §2.7 | Monthly (FY-to-date) | **Yes — "I-485 Based on Cuban Adjustment Act of 1966 (CAA)" row** (SEARCH) and I-765 by category incl. pending-I-485 and parole | National FY median for CAA (3.3 → 4.6 → 7.0 → 11.8 months FY23–FY26 YTD, SEARCH) |
| 3a | **Case Status Online** (`egov.uscis.gov/casestatus/landing.do`) | HTML only; bot-protected | §3 | Real time | n/a (per receipt number) | Per-user milestones (received, biometrics, RFE, EAD produced, interview, approved) if user enters receipt numbers |
| 3b | **Torch Case Status API** (`developer.uscis.gov`) | **Yes — REST/JSON, OAuth2** | §3 | Real time | n/a | Same, officially; sandbox only (canned data) until production approval |
| 4 | FOIA reading room / FOIA API / FOIA processing-time API | HTML; JSON | §4 | n/a | Case-level data only via FOIA | Not for live tracking |
| 5 | Policy Manual, newsroom, Federal Register | HTML (+ RSS historically) | §5 | Event-driven | n/a | "Alerts" feature |

Licensing: USCIS data products are U.S. Government works (17 U.S.C. § 105, no copyright); the portal has no restrictive licence. The Torch API has its own terms of use and an approval gate (§3). The processing-times JSON is not documented or licensed; it is public web traffic that USCIS actively rate-limits/bot-blocks (§2.3).

---

## 1. The "Immigration and Citizenship Data" portal

Portal URL: `https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data` (also reachable as `https://uscis.gov/tools/reports-studies/immigration-forms-data`). Definitions page: `https://www.uscis.gov/tools/reports-and-studies/understanding-our-data`. (SEARCH; host blocked here.)

USCIS consolidated all data products onto this one page in November 2018 (SEARCH, immpolicytracking.org). The page is a long filterable list of report cards; each card links to an XLSX/CSV/PDF under `https://www.uscis.gov/sites/default/files/document/{data|reports|forms}/…`. There is **no API, no bulk export, no RSS** for the portal: ingestion = fetch the HTML, extract `href`s matching known filename patterns, download new ones. That is exactly what the open-source `omairqazi29/visualizer` project does; its registry (VERIFIED-CODE, `src/ingestion/registry.py`) scans this page for links matching `i485_performance`, `i485_performancedata`, `i485_performance_data`, `quarterly_all_forms`, and `appropriation_requirement_[a-z]+_\d{4}`.

### 1.0 How the files were obtained for this document

`github.com/omairqazi29/visualizer` keeps the USCIS files it downloads under `data/USCIS_I485/` (unchanged copies, renamed only in the monthly case). I fetched them from `https://raw.githubusercontent.com/omairqazi29/visualizer/master/data/USCIS_I485/<file>` and parsed them. Files used (all **VERIFIED-FILE**):

```
i485_performancedata_fy2024_q4.xlsx      i485_performance_fy2026_q1.xlsx
i485_performancedata_fy2025_q1.xlsx      i485_performance_data_fy2026_q2_v1.xlsx
i485_performancedata_fy2025_q2.xlsx      i485_performance_data_fy2026_q3_v1.xlsx
i485_performancedata_fy2025_q3.xlsx      quarterly_all_forms_fy2026_q1_v1.xlsx
i485_performance_fy2025_q4.xlsx          quarterly_all_forms_fy2026_q2_v1.xlsx
                                         quarterly_all_forms_fy2026_q3_v1.xlsx
monthly_<month>_<year>.csv  for Jul 2024, Sep 2024 … Aug 2026 (25 months; Aug 2024 absent from mirror)
```

The mirror's own changelog (VERIFIED-CODE, `docs/POLICY_VERIFICATION.md`, entries of 2026-08-29 and 2026-09-28) states that USCIS publishes the monthly series as `appropriation_requirement_<month>_<year>_v1.0.csv`, that **USCIS links only the newest month on the data page**, and that earlier months remain downloadable at the same path pattern. The I-485 by-office and all-forms FY2026 Q3 workbooks were picked up by its scanner on 2026-09-23/28.

### 1.1 Monthly: "Report to Congress — Number of Service-Wide Forms by Month, Form Status, and Processing Time" (CSV)

**This is the single most valuable source for the app.** It is the only official product with a *Cuban* I-485 row at monthly resolution.

* **Format:** CSV, ~3.6 KB, 8 columns, 11 form rows, 11–12 footnotes. Header block (VERIFIED-FILE, August 2026 file):
  ```
  Report to Congress
  Number of Service-Wide Forms
  By Month, Form Status, and Processing Time
  For the Month of August 2026
  Form Number,Description,Forms Received,Approvals,Denials,Pending,Pending Over 6 Months,Avg. Processing Time
  ```
* **Rows:** I-130; I-360; **I-485 (Asylum)**, **I-485 (Cuban)**, I-485 (Employment), I-485 (Family), I-485 (Other), I-485 (Refugee); I-751; **I-765 (one national line, all categories)**; N-400.
* **Column definitions (footnotes, verbatim, VERIFIED-FILE):** "Forms Received" = new filings entered into a case-tracking system in the month; "Approvals"/"Denials" = decided in the month; "Pending" = awaiting decision at month end ("administrative closures and transfers between offices" are not reflected, so pending cannot be reconstructed from flows); "Pending Over Six Months" = pending more than six months after receipt; **"Avg. Processing Time" = mean months from receipt to completion over all cases completed in the month**, which "may differ from processing times reported on other USCIS.gov webpages". Footnote 7: produced under the Consolidated Appropriations Act, 2022 Joint Explanatory Statement (H.R. 2471 / P.L. 117-103). Source line: `ELIS, CLAIMS3, queried <Month YYYY>` (the August 2026 file was queried September 2026 — about one month lag).
* **A USCIS footnote that matters for CHNV users** (April 2025 file, footnote 12, verbatim): *"In March 2025, USCIS issued a Federal Register notice for termination of parole for Cubans, Haitians, Nicaragua, and Venezuelans. As part of this termination process, USCIS issued notices to aliens with an approved Employment Authorization Document (EADs) based on their parole (category (c)(11)). This action reverted previously approved (c)(11) EADs to a pending status. In April 2025, a stay was issued (Svitlana Doe, et al., v. Noem, et. al., No. 25-cv-10495 (D. Mass. Apr. 14, 2025)), which temporarily halted the implementation of those actions. As a result, the pending (c)(11) EADs were reverted back to an approved status. These actions resulted in significant changes in pending and completed (c)(11) EADs."* — i.e. the I-765 line for Mar–Apr 2025 is distorted by mass status flips, not real adjudications.

**Full I-485 (Cuban) monthly series, July 2024 – August 2026 (VERIFIED-FILE):**

| Month | Received | Approved | Denied | Pending (month end) | Pending > 6 mo | Avg. months (completions) |
|---|---:|---:|---:|---:|---:|---:|
| Jul 2024 | 12,590 | 6,920 | 1,692 | 156,790 | 90,723 | 7.1 |
| Aug 2024 | *(file not in mirror)* | | | | | |
| Sep 2024 | 10,833 | 13,464 | 202 | 151,425 | 97,685 | 6.7 |
| Oct 2024 | 17,448 | 10,807 | 299 | 157,703 | 98,392 | 8.9 |
| Nov 2024 | 19,892 | 7,269 | 326 | 169,727 | 101,700 | 10.1 |
| Dec 2024 | 20,685 | 8,663 | 309 | 181,390 | 104,912 | 8.8 |
| Jan 2025 | 22,880 | 10,034 | 275 | 194,437 | 106,558 | 8.3 |
| Feb 2025 | 24,385 | 10,984 | 298 | 207,564 | 109,059 | 8.2 |
| Mar 2025 | 26,187 | 8,065 | 302 | 225,208 | 114,521 | 8.3 |
| Apr 2025 | 27,173 | 5,662 | 282 | 246,689 | 123,202 | 8.5 |
| May 2025 | 23,881 | 3,376 | 226 | 267,090 | 136,077 | 9.5 |
| Jun 2025 | 21,510 | 1,647 | 277 | 286,309 | 148,186 | 11.6 |
| Jul 2025 | 19,354 | 2,265 | 207 | 302,775 | 167,277 | 11.6 |
| Aug 2025 | 13,748 | 2,784 | 190 | 312,913 | 191,660 | 11.7 |
| Sep 2025 | 11,152 | 3,529 | 215 | 318,763 | 212,644 | 11.4 |
| Oct 2025 | 9,059 | 1,954 | 186 | 323,471 | 235,832 | 12.9 |
| Nov 2025 | 7,265 | 2,111 | 175 | 327,987 | 254,767 | 12.9 |
| Dec 2025 | 8,598 | 41 | 14 | 336,589 | 274,207 | 19.4 |
| Jan 2026 | 7,086 | 15 | 4 | 343,656 | 291,001 | 27.8 |
| Feb 2026 | 4,813 | 10 | 21 | 348,318 | 302,719 | 23.8 |
| Mar 2026 | 3,439 | 25 | 21 | 351,423 | 312,848 | 21.3 |
| Apr 2026 | 2,665 | 23 | 38 | 353,450 | 321,681 | 29.8 |
| May 2026 | 1,846 | 27 | 129 | 354,649 | 329,417 | 23.2 |
| Jun 2026 | 1,774 | 89 | 281 | 355,371 | 336,679 | 21.5 |
| Jul 2026 | 1,355 | 308 | 318 | 355,379 | 342,636 | 22.2 |
| Aug 2026 | 1,213 | 386 | 434 | 355,520 | 345,741 | 20.6 |

What the series shows (INFERRED from the verified numbers): approvals ran ~7–13k/month through Feb 2025, fell to 5.7k in April 2025, 3.4k in May and 1.6k in June 2025 (consistent with the project owner's observation that cases filed around March/April 2025 stalled), partially recovered to 2–3.5k/month in Jul–Nov 2025, then collapsed to **41, 15, 10, 25, 23, 27** per month from Dec 2025 to May 2026 (the second, country-based pause that began 2 Dec 2025 — see the litigation research file), and only restarted in Jun–Aug 2026 (89 → 308 → 386), with **denials now exceeding approvals**. The pending inventory grew from 157k to 355k; 97% of it (345,741 of 355,520) has been pending more than six months. Nationally this is the context any personal estimate must be anchored to.

**I-765 national line (same files, VERIFIED-FILE), selected months:** Jan 2025 received 516,330 / approved 443,947 / pending 1,219,526 / avg 3.6 mo; Jul 2025 374,325 / 294,232 / 1,859,361 / 2.5; Jan 2026 177,289 / 133,580 / 1,678,637 / 4.2; Jul 2026 153,170 / 135,089 / 2,100,336 / 5.8; Aug 2026 130,329 / 125,318 / 1,921,541 / 6.8. The monthly file does **not** split I-765 by category — use 1b/1d for (c)(9)/(c)(11).

**Cross-check against the quarterly file (VERIFIED-FILE):** FY2026 Q3 all-forms Cuban row = 6,279 received / 139 approved / 447 denied; monthly Apr+May+Jun 2026 = 6,285 / 139 / 448. FY2026 Q2 = 15,312 / 50 / 45 vs monthly 15,338 / 50 / 46. The two products are the same database queried at different times; differences of <0.5% are normal (footnotes 9–10).

**Ingestion notes:** USCIS links only the latest month on the portal; the mirror backfilled earlier months by constructing the URL from the pattern. Numbers are quoted strings with thousands separators (`"355,520"`); the first line may carry a UTF-8 BOM; one file (Feb 2026) has a trailing comma on data rows — parse defensively. The exact `href` (directory under `/sites/default/files/document/`) could not be confirmed from this sandbox; derive it from the portal HTML at ingest time rather than hard-coding.

### 1.2 Quarterly: "All USCIS Application and Petition Form Types" (XLSX)

* **Portal label:** "All USCIS Application and Petition Form Types (Fiscal Year 2026, Quarter 3) (XLSX, 767.21 KB)" (SEARCH). **File:** `quarterly_all_forms_fy2026_q3_v1.xlsx`, 785,620 bytes, one sheet `FY26Q3_All_Forms`, range A1:M122 (VERIFIED-FILE). Earlier quarters were PDFs, e.g. `https://www.uscis.gov/sites/default/files/document/forms/quarterly_all_forms_fy2023_q4.pdf` and `https://www.uscis.gov/sites/default/files/document/reports/Quarterly_All_Forms_FY2021Q1.pdf` (SEARCH); the FY2021 Q1 PDF already had a separate "I-485 (Cuban)" line, so the breakout goes back years.
* **Title in file:** "Number of Service-wide Forms By Quarter, Form Status, and Processing Time — April 1, 2026 – June 30, 2026".
* **Columns (13):** `Category and Form Number | Form Title | [Quarter] Forms Received | Approved | Denied | Total Completions | Pending | Processing Time | [FY-to-date] Forms Received | Approved | Denied | Total Completions | Pending`.
* **Processing-time definition (footnote 6, verbatim):** "the number of months it took for an application … to be processed from receipt to completion in a given time period. The number of months presented is **the median** which is the time it took to complete 50% of all the cases processed in the quarter." (Different from the monthly file's *mean* and from the Processing Times tool's *80th percentile*.)
* **Footnote 6 under "Notes":** "Summing the six I-485 types and the four I-765 types results in the overall totals for each form for the reporting period."

**I-485 and I-765 rows, FY2026 Q1–Q3 (VERIFIED-FILE):**

| Row | Qtr | Received | Approved | Denied | Completions | Pending | Median mo | FYTD received | FYTD approved | FYTD denied |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **I-485 (Cuban)** | Q1 (Oct–Dec 2025) | 24,909 | 4,098 | 373 | 4,471 | 327,255 | 10.4 | 24,909 | 4,098 | 373 |
| | Q2 (Jan–Mar 2026) | 15,312 | 50 | 45 | 95 | 341,232 | 19.5 | 40,221 | 4,148 | 418 |
| | Q3 (Apr–Jun 2026) | 6,279 | 139 | 447 | 586 | 342,360 | 16.3 | 46,500 | 4,287 | 865 |
| I-485 (Refugee) | Q1 | 25,746 | 3,387 | 149 | 3,536 | 109,700 | 7.6 | | | |
| | Q2 | 23,448 | 80 | 41 | 121 | 132,538 | 14.6 | | | |
| | Q3 | 16,819 | 103 | 45 | 148 | 149,470 | 17.6 | | | |
| I-485 (Asylum) | Q1 | 13,008 | 4,084 | 272 | 4,356 | 102,484 | 12.1 | | | |
| | Q2 | 12,195 | 1,465 | 197 | 1,662 | 113,567 | 22.0 | | | |
| | Q3 | 15,141 | 2,350 | 292 | 2,642 | 126,267 | 25.6 | | | |
| I-485 (Family) | Q3 | 95,175 | 54,678 | 12,240 | 66,918 | 611,067 | 7.0 | | | |
| I-485 (Employment) | Q3 | 97,501 | 42,076 | 3,160 | 45,236 | 268,408 | 6.0 | | | |
| I-485 (Other) | Q3 | 12,074 | 2,222 | 614 | 2,836 | 62,718 | 21.0 | | | |
| **I-765 (Adjustment Of Status)** = (c)(9) | Q1 | 164,763 | 63,429 | 23,327 | 86,756 | 461,884 | 4.4 | | | |
| | Q2 | 144,512 | 38,122 | 11,145 | 49,267 | 584,851 | 4.3 | | | |
| | Q3 | 153,039 | 46,405 | 35,767 | 82,172 | 671,362 | 6.4 | 462,314 | 147,956 | 70,239 |
| I-765 (All Other) — contains (c)(11) | Q1 | 151,156 | 139,555 | 13,725 | 153,280 | 875,191 | 4.1 | | | |
| | Q2 | 205,995 | 111,071 | 14,445 | 125,516 | 998,662 | 4.5 | | | |
| | Q3 | 212,410 | 125,656 | 19,787 | 145,443 | 1,098,913 | 3.3 | | | |
| I-765 (Asylum) | Q3 | 125,663 | 117,965 | 10,986 | 128,951 | 108,565 | 0.8 | | | |
| I-765 (DACA) | Q3 | 81,835 | 76,053 | 482 | 76,535 | 231,872 | 4.1 | | | |

Other rows relevant to CHNV users in the same sheet (Q3): I-131 "Application for Travel Document, Parole Documents … (Parole in Place)" 5,352 received / 845 approved / 535 denied / 29,022 pending / 14.6 mo; I-131 "Initial Parole Document for Aliens Outside the United States" 644 / 102 / 469 / 32,373 pending.

Third-party cross-checks that agree with the file: CiberCuba (2026-10-20) reported "139 approved, 447 denied, 586 resolved, 6,279 received, 342,360 pending" for Apr–Jun 2026 and "50 approved, 45 denied" for Jan–Mar 2026 (SEARCH, `https://en.cibercuba.com/noticias/2026-10-20-u1-e135253-s27061-nid343309-solo-139-cubanos-obtuvieron-residencia-ley-ajuste`); the American Immigration Council's Aug 5 2026 post cited refugee I-485 receipts 25,746 and completions 3,536 for FY2026 Q1 (SEARCH), matching the Q1 row above.

### 1.3 Quarterly: "Application for Adjustment of Status (Form I-485) Quarterly Report" — by field office (XLSX)

* **Portal label:** "Application for Adjustment of Status (Form I-485) Quarterly Report (Fiscal Year 2026, Quarter 3) (XLSX, 41.92 KB)" (SEARCH). **File:** `i485_performance_data_fy2026_q3_v1.xlsx` (42,924 bytes); earlier names `i485_performancedata_fy2025_q3.xlsx`, `i485_performance_fy2025_q4.xlsx`, `i485_performance_fy2026_q1.xlsx` — USCIS changes the stem every few quarters, so match on `i485_performance` loosely. Older PDFs: `https://www.uscis.gov/sites/default/files/document/data/i485_performancedata_fy2023_qtr3.pdf`, `https://www.uscis.gov/sites/default/files/document/reports/I485_performancedata_fy2022_qtr1.pdf` (SEARCH).
* **Sheet:** `I485_by_State`, A1:V178. **Title:** "Number of I-485 Applications to Register Permanent Residence or Adjust Status — By Category, Case Status, and USCIS Field Office or Service Center Location — April 1, 2026 – June 30, 2026".
* **Layout:** rows grouped by **state heading** (Alabama … Wisconsin, Guam, U.S. Virgin Islands, Puerto Rico) then one row per field office (`Office name | Field Office Code | …`), then a "Service Center" block (WSC California, NBC National Benefits Center, NSC Nebraska, YSC Potomac, SSC Texas, ESC Vermont). 22 columns: 4 category blocks × (Applications Received, Approved, Denied, Pending) + Total block.
* **Categories (footnotes, verbatim):** 1 Family-based; 2 Employment-based "received at service center"; **3 Humanitarian-based "include asylee, refugee, Indochinese, and Cuban refugee"**; 4 Others "HRIFA … human trafficking victim or crime victim". Footnote 9: "the office location does not reflect the complete area covered by the office's jurisdiction". Table key: `D` = "Disclosure standards not met" (small cells suppressed in files up to FY2025 Q2; from FY2025 Q3 onward real small integers appear). Source line: "Chief Data and Analytics Office — NPD, queried 07/2026, PAER0021791".
* **Does it break out CAA?** **No.** But I verified for FY2026 Q1, Q2 and Q3 that the Humanitarian-based *Total* row equals, to the unit, the sum of the all-forms file's Cuban + Refugee + Asylum rows for received, approved, denied and pending (e.g. Q3: 38,239 / 2,592 / 784 / 618,097 both ways). So **"Humanitarian-based" = Cuban + Refugee + Asylee**, and nationally Cubans are 55% of humanitarian pending (342,360 / 618,097) but only 16% of Q3 humanitarian receipts (6,279 / 38,239; refugees 44%, asylees 40%). In South-Florida offices the humanitarian column is almost certainly dominated by CAA cases (INFERRED; refugee/asylee adjustments are concentrated elsewhere), which is why the per-office series below is usable as a CAA proxy.

**Humanitarian-based column, selected offices, FY2024 Q4 → FY2026 Q3 (VERIFIED-FILE; "pending" at quarter end / "approved" in quarter):**

| Office (code, state) | FY24Q4 | FY25Q1 | FY25Q2 | FY25Q3 | FY25Q4 | FY26Q1 | FY26Q2 | FY26Q3 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Hialeah (HIA, FL) pending | 18,184 | 21,286 | 25,495 | 31,410 | 34,491 | 35,354 | 36,682 | 37,486 |
| Hialeah approved | 5,920 | 3,080 | 3,393 | 834 | 339 | 143 | 2 | 1 |
| Kendall (KND, FL) pending | 18,826 | 21,335 | 27,377 | 34,183 | 37,307 | 38,746 | 40,256 | 41,248 |
| Kendall approved | 3,037 | 2,409 | 2,315 | 685 | 226 | 73 | 10 | 25 |
| Miami (MIA, FL) pending | 9,839 | 11,217 | 14,044 | 17,417 | 18,955 | 19,645 | 20,401 | 20,662 |
| Miami approved | 820 | 539 | 1,032 | 353 | 221 | 75 | 6 | 21 |
| Tampa (TAM, FL) pending | 11,832 | 14,475 | 19,696 | 26,637 | 30,180 | 31,727 | 33,514 | 34,695 |
| Tampa approved | 1,232 | 1,103 | 1,136 | 323 | 138 | 89 | 33 | 84 |
| Fort Myers (OFM, FL) pending | 6,912 | 8,259 | 11,341 | 14,911 | 16,700 | 17,533 | 18,353 | 18,992 |
| Orlando (ORL, FL) pending | 3,820 | 4,830 | 6,427 | 8,624 | 9,944 | 10,808 | 11,540 | 11,958 |
| West Palm Beach (WPB, FL) pending | 4,322 | 5,603 | 7,254 | 9,533 | 10,545 | 11,061 | 11,523 | 11,828 |
| Oakland Park (OKL, FL) pending | 3,086 | 2,883 | 4,357 | 5,040 | 5,459 | 5,648 | 5,959 | 6,215 |
| Jacksonville (JAC, FL) pending | 3,055 | 3,414 | 4,801 | 6,318 | 7,201 | 7,747 | 8,370 | 8,891 |
| Houston (HOU, TX) pending | 9,701 | 13,104 | 17,361 | 24,566 | 28,608 | 30,381 | 32,749 | 34,665 |
| Houston approved | 42 | 1,179 | 964 | 5 | 35 | 101 | 38 | 24 |
| San Antonio (SNA, TX) pending | 4,792 | 6,182 | 8,572 | 11,928 | 13,947 | 15,436 | 16,833 | 17,858 |
| Louisville (LOU, KY) pending | 5,638 | 6,531 | 8,862 | 12,146 | 14,605 | 16,013 | 17,444 | 18,176 |
| Las Vegas (LVG, NV) pending | 3,814 | 4,892 | 6,322 | 9,072 | 10,537 | 11,262 | 11,994 | 12,592 |
| **National humanitarian pending** | 270,175 | 291,446 | 331,527 | 428,784 | 491,977 | 539,439 | 587,337 | 618,097 |
| National humanitarian approved | 55,195 | 72,311 | 70,592 | 15,642 | 19,303 | 11,569 | 1,595 | 2,592 |

Hialeah humanitarian receipts per quarter (VERIFIED-FILE): 4,146 → 5,796 → 7,709 → 7,254 → 4,496 → 2,213 → 1,480 → 661 — the CHNV cohort's one-year-and-a-day eligibility wave peaked in early 2025 and has now largely passed.

Caveat: the NBC row shows approvals/denials but zero pending (NBC pre-processes then routes to field offices), and large family-based pending sits at the Vermont Service Center (239,674 in Q3) — the "office" in this table is where the case *sits*, not necessarily the interview office. Also the workbook has no processing-time column at all.

### 1.4 Quarterly Form I-765 by eligibility category workbook

* Listed on the portal as a Form I-765 workbook for FY2026 Q3 "dated September 8, 2026, with receipts, approvals, denials, and pending counts by eligibility category and filing type" (SEARCH). I could not download it (not in the mirror). USCIS's I-765 page defines (c)(9) as filed with/after a pending I-485 and (c)(11) as requiring "evidence that parole status is current and unexpired" (SEARCH, `https://www.uscis.gov/i-765`).
* Third-party readings of this workbook (unverified): pending C09 grew from 153,874 in FY2025 Q1 to 671,263 in FY2026 Q3 (Immiva, SEARCH) — the latter is within 0.02% of the all-forms "Adjustment Of Status" pending (671,362), so the two files agree. FederalHiringData (SEARCH) reports the *median* for pending-I-485 EADs rising from 2.2 months (FY2025) to 4.6 months (through May 31, 2026) and for parole-based EADs from 0.9 to 5.9 months — those medians come from the historic-pt page (§2.7), not from this workbook.
* **Action for the app:** add `i765` link patterns to the portal scraper (filenames unknown; match on `i765` + `eligib` or `categor`), confirm the sheet layout on first download, and treat (c)(11) rows with the Mar–Apr 2025 caveat from §1.1.

### 1.5 Other portal products worth a glance

* "Nonimmigrant Worker Petitions by Case Status and RFE (FY2026 Q3)" (XLSX 73 KB) — not relevant. "Employment-based I-485 inventory" monthly workbooks (`eb_inventory_<month>_<year>_v1.0.xlsx`) — EB only, not relevant.
* Historical PDF archives of the same reports exist back to at least FY2021 (all-forms) and FY2022 (I-485 by office) at the `…/document/{reports,forms,data}/` paths cited above; a back-fill job can OCR/parse them for a longer CAA series.
* "Understanding Our Data" (SEARCH): fiscal year = Oct 1–Sep 30; figures count when a filing was *received*, not decided; data come from applicant-completed forms and can carry errors; always read each dataset's notes.

---

## 2. Processing Times tool (`https://egov.uscis.gov/processing-times/`) and its JSON

### 2.1 Methodology (what the numbers mean)

* **Published processing time** = the time it took USCIS to complete **80%** of the cases of that form/subtype/office **over the previous six months** (SEARCH, multiple secondary sources; consistent with the Pathways parser comment "the time in which 80% of cases were completed", VERIFIED-CODE). Until some point after October 2024 USCIS published a *range* (two values); the 2024-10-30 snapshot below still has `range_upper`/`range_lower` (e.g. Miami family-based 49 / 26 months); current responses carry a single value, and parsers accept both (VERIFIED-CODE, `scoakley23/Pathways` `parseRange`).
* **"Receipt date for a case inquiry" / case-inquiry date** = the receipt date before which a pending case is considered *outside normal processing* and an e-Request may be filed. USCIS's own FAQ (orphan/Hague version, `https://www.uscis.gov/sites/default/files/document/questions-and-answers/Frequently_Asked_Questions_on_USCIS_Processing_Times_for_Orphan_and_Hague_Adoption_Cases.pdf`) says the inquiry date is set at the **93%** completion point (SEARCH); one third-party guide claims it is the 80% point — treat 93% as the better-supported figure. The general FAQ is at `https://egov.uscis.gov/processing-times/processing-times-faqs` (blocked here).
* **Update cadence:** USCIS says it tries to update monthly, but trackers observe silent changes "sometimes multiple times per day" (VERIFIED-CODE, `jzebedee/uscis` README). The publication date is carried in the payload (`publicationDate`, e.g. "October 18, 2024").

### 2.2 Legacy REST endpoints (documented by every community tracker; base `https://egov.uscis.gov/processing-times/api/`)

VERIFIED-CODE from `coatless-r-n-d/uscis-processing` (`R/api.R`, `R/forms.R`, `R/processing_times.R`) and `arielsvn` issue #3:

| Step | Method/URL | Response path and fields |
|---|---|---|
| 0 | `GET https://egov.uscis.gov/processing-times/` with a browser UA — sets session cookies that the API checks | — |
| 1 | `GET …/api/forms` | `data.forms.forms[]` → `form_name`, `form_description_en`, `form_description_es` |
| 2 | `GET …/api/formtypes/{form}` e.g. `/api/formtypes/I-485` | `data.form_types.form_name`, `data.form_types.subtypes[]` → `form_key`, `form_type`, `form_type_description_en/_es` |
| 3 | `GET …/api/formoffices/{form}/{form_key}` e.g. `/api/formoffices/I-485/131A-FAM` | `data.form_offices.{form_name, form_type, offices[] {office_code, office_description}}` |
| 4 | `GET …/api/processingtime/{form}/{office_code}/{form_type}` e.g. `/api/processingtime/I-485/MIA/131A-FAM` | `data.processing_time.{form_name, office_code, form_note_en/_es, subtypes[] {form_type, publication_date, service_request_date, subtype_info_en/_es, range[] {value, unit}}}` |

Required headers (VERIFIED-CODE): a real browser `User-Agent`, `Accept: application/json, text/plain, */*`, `Referer: https://egov.uscis.gov/processing-times/`, same-origin `Sec-Fetch-*` headers, and the cookie jar from step 0. The API sends no CORS headers, so it cannot be called from a browser/WebView on another origin (VERIFIED-CODE, Pathways README).

From this sandbox, `curl` to `/api/formtypes`, `/api/formoffices/I-485`, `/api/processingtime/I-485/NBC/C` all failed at the proxy (`CONNECT tunnel failed, response 403`) — **not tested live**.

### 2.3 What the transport looks like in 2026: Next.js server actions behind Cloudflare

`jzebedee/uscis` (daily dataset, releases `2026-09-13 … 2026-10-15`) rewrote its collector; its scripts (VERIFIED-CODE, fetched 2026-10-20) show the current mechanism:

* The page is a Next.js app. Data is fetched by **POST**ing to `https://egov.uscis.gov/processing-times` with headers `Next-Action: <42-hex action id>`, `Content-Type: application/json`, `Accept: text/x-component`, `Origin`/`Referer: https://egov.uscis.gov/processing-times`, and a JSON-array body of positional arguments. Action names: `getFormNumbers` (no args), `getFormCategories ["I-485"]`, `getOfficesScs ["I-485","131A-FAM"]`, `getProcessingTime ["I-485","131A-FAM","MIA"]`. The action id is not stable: `resolve_next_action_id.py` downloads the page's `/processing-times/_next/static/chunks/*.js` bundles and regex-matches `createServerReference)("<id>",…"<actionName>")`.
* The response is a React Flight stream (`0:{…}\n1:{…}`), which `normalize_next_response.py` converts back to the legacy JSON. Field names are camelCase now: forms → `$.data.items[] {formName, formDescriptionEn, formDescriptionEs}`; categories → `$.data.items[] {formKey, formType, formTypeDescriptionEn, formTypeDescriptionEs}`; processing time → `$.data.data.processingTime {formName, formNoteEn, formNoteEs, subtypes[] {formType, publicationDate, range[0].value/unitEn (upper), range[1].value/unitEn (lower), serviceRequestDate, subtypeInfoEn/Es, subtypeNoteEn/Es}}` (VERIFIED-CODE, `populate-processing-time-template.sql`, `populate-form-types-template.sql`).
* **Bot defence:** since Feb 2025 "USCIS has begun aggressively blocking scraping requests" (changelog v0.4). The collector now runs `curl-impersonate` (`curl_chrome*` binaries), rotates a "stealth" user agent, refreshes Cloudflare cookies via an external challenge-solver endpoint, detects `Just a moment...` / `cf-mitigated: challenge` / `Sorry, you have been blocked`, limits parallelism to 2 and runs from a Tailscale exit node on a residential IP (`.github/workflows/build_db.yml`, cron `30 4 * * *` UTC). Pathways confirms "USCIS uses a Cloudflare bot check that blocks cloud servers, including GitHub's" and fetches from a local computer, monthly, with a human completing any challenge (VERIFIED-CODE).
* **Practical conclusion for the app (INFERRED):** do not call egov from the phone. Either (i) consume `jzebedee/uscis` daily SQLite releases (tables `forms`, `offices`, `form_types`, `processing_time`, `foia_processing_time`; schema in its README) and/or `coatless-dashboard/uscis-processing-times` panel tables (`pt_snapshots`, `pt_events`, `inquiry_events`, `disclosure_events`, `coverage`, `offices`), or (ii) run a low-frequency (daily) collector on a residential connection and publish a static JSON for the app. Both repos are unlicensed (no LICENSE file) — ask before redistributing.

### 2.4 I-485 and I-765 subtypes and offices actually served (VERIFIED-FILE from `coatless-r-n-d/uscis-processing/data-raw/*-2024-10-30.csv`, corroborated by the 2026-09/10 `jzebedee` diffs)

**I-485 subtypes (`formtypes/I-485`):**

| form_key | form_type label | Description (EN / ES) | Offices served |
|---|---|---|---|
| `131A` | I-485 Employment | "Employment-Based adjustment applications" | 93: CSC, NSC, SSC + 90 field offices |
| `131A-FAM` | I-485 Family | "Family-Based adjustment applications / Ajuste de estatus basado en la familia" | 90 field offices (AGA … YAK) |
| `131A-HRIFA` | I-485 All Other | "Under the Haitian Refugee Immigrant Fairness Act (HRIFA)" | NSC |
| `131B` | I-485 Asylee | "Based on grant of asylum more than 1 year ago" | FOD ("Field Offices", aggregated) |
| `131C` | I-485 Refugee | "Based on refugee admission more than 1 year ago" | FOD |
| `131T` | I-485 Tvisa | "Based on an approved T Visa" | ESC |
| `131U` | I-485 Uvisa | "Based on an approved U Visa" | NSC, ESC |

**There is no Cuban Adjustment Act subtype** in the Oct 2024 snapshot, and none appears in the Sept 25 and Oct 15 2026 sqldiff release notes, which touch every I-485 subtype whose inquiry date moved (`131A-FAM` × ~90 offices, `131A`, `131B`, `131C`, `131A-HRIFA`, `131T`, `131U`) — so the tool has no CAA-specific figure (VERIFIED-CODE for the diffs; absence INFERRED). The closest proxy is `131A-FAM` at the applicant's field office; a law-firm page that once listed "CAA" office times (e.g. Atlanta 25.5 months) is >400 days old and unverified (SEARCH).

**Field-office codes used by the tool (all 90 `131A-FAM` offices, code → "City ST"):** AGA Agana GU; ALB Albany NY; ABQ Albuquerque NM; ANC Anchorage AK; ATL Atlanta GA; BAL Baltimore MD; BOI Boise ID; BOS Boston MA; BNY Brooklyn NY; BUF Buffalo NY; STA Burlington VT; CHL Charleston SC; CHA Charlotte Amalie VI; CLT Charlotte NC; CHI Chicago IL; CHR Christiansted VI; CIN Cincinnati OH; CLE Cleveland OH; CLM Columbus OH; NJC Cranbury NJ; DAL Dallas TX; DEN Denver CO; DSM Des Moines IA; DET Detroit MI; ELP El Paso TX; OFM Fort Myers FL; FSA Fort Smith AR; FRE Fresno CA; GRR Greer SC; HLG Harlingen TX; HAR Hartford CT; HEL Helena MT; HIA Hialeah FL; HHW Honolulu HI; HOU Houston TX; IMP Imperial CA; INP Indianapolis IN; JAC Jacksonville FL; KAN Kansas City MO; KND Kendall FL; LVG Las Vegas NV; LAW Lawrence MA; LNY Long Island NY; LOS Los Angeles CA; LAC Los Angeles County CA; LOU Louisville KY; MAN Manchester NH; MEM Memphis TN; MIA Miami FL; MIL Milwaukee WI; SPM Minneapolis-St. Paul MN; MGA Montgomery AL; MTL Mount Laurel NJ; NTN Nashville TN; NEW Newark NJ; NOL New Orleans LA; NYC New York City NY; NOR Norfolk VA; OKL Oakland Park FL; OKC Oklahoma City OK; OMA Omaha NE; ORL Orlando FL; PHI Philadelphia PA; PHO Phoenix AZ; PIT Pittsburgh PA; POM Portland ME; POO Portland OR; PRO Providence RI; QNS Queens NY; RAL Raleigh NC; REN Reno NV; SAC Sacramento CA; STL Saint Louis MO; SLC Salt Lake City UT; SNA San Antonio TX; SBD San Bernardino CA; SND San Diego CA; SFV San Fernando Valley CA; SFR San Francisco CA; SNJ San Jose CA; SAJ San Juan PR; SAA Santa Ana CA; SEA Seattle WA; SPO Spokane WA; TAM Tampa FL; TUC Tucson AZ; WAS Washington DC; WPB West Palm Beach FL; WIC Wichita KS; YAK Yakima WA. Service-centre codes: CSC California, NSC Nebraska, SSC Texas, ESC Vermont, YSC Potomac, NBC National Benefits Center, SCD "All Service Centers", FOD "Field Offices". These codes match the by-office workbook (§1.3) except that the workbook also lists CVC Chula Vista, DVD Dover, CHS Charleston WV with zero rows.

**Sample values — `131A-FAM`, publication date "October 18, 2024" (VERIFIED-FILE):** MIA 49 / 26 months, inquiry date Oct 07 2020; HIA 21 / 14, Feb 03 2023; KND 24 / 16, Nov 06 2022; TAM 21.5 / 16, Jan 24 2023; ORL 28.5 / 18, Jun 24 2022; WPB 28 / 17, Jul 13 2022; OFM 33.5 / 25, Jan 29 2022; OKL 36.5 / 24.5, Oct 28 2021; JAC 37.5 / 23, Sep 26 2021; HOU 31.5 / 23, Mar 27 2022; NYC 23.5 / 13.5; CHI 37.5 / 22.

**Case-inquiry dates as published on 2026-10-15 (`service_request_date`, VERIFIED-CODE from the release diff):** `131A-FAM` — MIA Jun 17 2023; HIA Jul 05 2024; KND May 28 2024; TAM Aug 07 2024; ORL Jan 28 2024; WPB May 18 2024; OFM May 11 2024; OKL Jul 19 2023; JAC Feb 08 2024; HOU Oct 29 2023; SNA Oct 11 2024; LOU Oct 03 2024; LVG Oct 31 2023; NYC Jan 13 2024; CHI Jun 13 2023. Other subtypes: `131A` FOD Mar 27 2025 / SCD Oct 03 2022; `131B` FOD Mar 06 2023; `131C` FOD Oct 25 2021; `131A-HRIFA` SCD Jan 16 2015; `131T` SCD Nov 01 2022; `131U` SCD Jun 24 2024. Implication: a CAA case filed in March/April 2025 is **not** yet "outside normal processing" by any published I-485 yardstick, so an e-Request will be refused; the app should say so.

**I-765 subtypes (`formtypes/I-765`) and offices (VERIFIED-FILE, Oct 2024; office set shifted to NBC/SCD by 2026 per the diffs):**

| form_key | Description | Offices Oct 2024 → Oct 2026 | Oct 18 2024 value | Inquiry date 2026-10-15 |
|---|---|---|---|---|
| `147-C9` | "Based on a pending I-485 adjustment application [(c)(9)]" | CSC, NBC, NSC, SSC, ESC → NBC, SCD | NBC 7 / 6 months, inquiry Apr 13 2024 | NBC Jun 13 2025; SCD Jun 24 2025 |
| `147-C11` | "Based on parole / Basado en el Permiso de Permanencia Temporal" | NBC → NBC | 4.5 / 1.5 months, inquiry Jun 27 2024 | **NBC Apr 26 2025** |
| `147-OTH` | "All other applications for employment authorization" | CSC, NBC, NSC, YSC, SSC, ESC → NBC, SCD | NBC 5.5 / 4 | NBC Aug 02 2025; SCD Mar 19 2025 |
| `147-C8I` / `147-C8` | pending asylum, initial / renewal | SCD | 4 weeks / 13 months | Sep 20 2026 / Jan 06 2025 |
| others | `147-A3`, `147-A5`, `147-A18`, `147-C3`, `147-C10`, `147-C18`, `147-C26`, `147-539C26`, `147-C33`, `147-ELSAL`, `147-HAITI`; `I-765V` `147-V` | | | |

The (c)(11) inquiry date of April 26 2025 (≈18 months before publication) is the tool's way of saying parole-based EADs filed after that date are still "normal" — a direct, citable explanation for the project owner's acquaintances who never received an EAD.

### 2.5 Reachability summary for §2

| Endpoint | From this sandbox | From a normal network (per trackers) |
|---|---|---|
| `GET /processing-times/api/*` | proxy 403 | works with browser headers + cookies; intermittently Cloudflare-challenged since Feb 2025; blocked from cloud IPs |
| `POST /processing-times` (Next-Action) | proxy 403 | works with curl-impersonate + cookies; action id must be re-resolved when bundles change |
| `https://first.uscis.gov/api/public/foia-metrics` (FOIA processing-time JSON) | not tried | used daily by `jzebedee/uscis` with `Referer: https://first.uscis.gov/` (VERIFIED-CODE) |

### 2.6 Historic national median processing times (`https://egov.uscis.gov/processing-times/historic-pt`)

* HTML page with a form/classification picker and a table of **median months by fiscal year** (cumulative FY-to-date for the current year), updated monthly; the USCIS FAQ described it as covering select forms from FY2012 onward (SEARCH). A PDF fact sheet "Historical Processing Times Trends FY2016–FY2024" is at `https://www.uscis.gov/sites/default/files/document/fact-sheets/historical_pt_factsheet_fy16_to_fy24.pdf` (SEARCH).
* **It does list "I-485 — Based on Cuban Adjustment Act of 1966 (CAA)"** as a classification (SEARCH, quoted from the page in a search result). Reported medians (SEARCH; CiberCuba 2026-10-06 and cubaheadlines.com, both citing this page): FY2023 **3.3** months, FY2024 **4.6**, FY2025 **7.0**, FY2026 (Oct 1 2025 – Jul 31 2026) **11.8**. These are medians of *completed* cases and therefore understate the wait for the 355k still pending.
* Family-based median FY2026 YTD 6.0 months, employment-based 5.9, I-765 based on pending I-485 5.8 (SEARCH, law-firm blog citing the page); pending-I-485 EAD 2.2 → 4.6 and parole EAD 0.9 → 5.9 months (SEARCH, FederalHiringData).
* No CSV export is documented; scrape the table (the page is on the same Cloudflare-protected host, so the collector in §2.3 should fetch it too).

---

## 3. Case Status Online and the Torch Case Status API

### 3.1 Case Status Online (consumer web)

* URL: `https://egov.uscis.gov/casestatus/landing.do` (SEARCH). Input: 13-character receipt number; output: current status headline + paragraph that quotes the receipt number, in English/Spanish. No terms were retrievable here. Community scrapers drive a headless browser (e.g. `marcodallastella/USCIS-check-case-status`: Selenium/Firefox, twice daily, redacts receipt numbers, VERIFIED-CODE) and explicitly say that "if USCIS blocks automated access, the fix is the official API below, not an evasion arms race."
* The logged-in myUSCIS account exposes unofficial JSON (`https://my.uscis.gov/account/case-service/api/cases`, `…/api/case_status`, login via `https://my.uscis.gov/oidc/login` with login.gov MFA) used by `jrdeng93/uscis-case-API-monitor`, whose README warns "Automated access to USCIS/login.gov may violate their Terms of Service" (VERIFIED-CODE). **Not suitable for the app.**

### 3.2 Torch developer portal — Case Status API (official)

| Item | Value | Tag |
|---|---|---|
| Portal | `https://developer.uscis.gov/` ; API page `https://developer.uscis.gov/api/case-status` ; sign-up `https://developer.uscis.gov/get-started/sign-up` ; sandbox `https://developer.uscis.gov/get-started/sandbox` ; production `https://developer.uscis.gov/get-started/production-access/request` ; token how-to `https://developer.uscis.gov/article/how-get-access-tokens-client-credentials` | SEARCH / VERIFIED-CODE (links in repos) |
| Auth | OAuth 2.0 **client-credentials**; `POST https://api-int.uscis.gov/oauth/accesstoken` with `grant_type=client_credentials`, `client_id`, `client_secret` → bearer token valid 1,800 s (30 min) | VERIFIED-CODE (OpenAPI profile; Python sample) |
| Sandbox endpoint | `GET https://api-int.uscis.gov/case-status/{receiptNumber}` with `Authorization: Bearer …` | VERIFIED-CODE |
| Sandbox quota | **1,000 requests/day, 5 TPS (one request per 200 ms)**; sandbox returns **canned staging receipt numbers only** (e.g. `EAC9999103402`), never real cases | SEARCH (USCIS sandbox page) + VERIFIED-CODE |
| Production endpoint | `https://api.uscis.gov/…` after approval (URLs supplied by USCIS) | SEARCH (Inmigra 2024 PDF) / VERIFIED-CODE (README) |
| Production quota | "to be shared once production access is granted" (USCIS); one repo claims **10 TPS / 150,000 calls per day** | SEARCH / VERIFIED-CODE (unofficial claim) |
| Production prerequisites | registered developer account; registered app with ≥1 sandbox API; **≥5 consecutive calendar days of sandbox traffic including both 200 and 4xx responses**; demo; request to USCIS Torch API Developer Support by email; organisational eligibility check and an affidavit per one applicant's account. The Get Started page showed production as **"Currently Unavailable"** at one point (page ~600 days old) | SEARCH + VERIFIED-CODE (`aayushga/uscis-case-cohort-analyzer` README) |
| Intended users | "USCIS customers and their representatives who require regular access to case status information" | SEARCH (USCIS page text) |
| Response (JSON) | `case_status` object: `receiptNumber`, `formType` (e.g. I-485, I-765), `submittedDate`, `modifiedDate`, `current_case_status_text_en` / `current_case_status_desc_en` (+ `_es`), and a `historicalCaseStatuses[]` timeline `{status, date, description, descriptionEsDesc}`; errors 401/404/422/429 | VERIFIED-CODE (third-party OpenAPI profile `api-evangelist/us-citizenship-and-immigration-services`, field names partly from the Python sample) |
| Terms | USCIS terms page not retrievable here. The OpenAPI profile's `termsOfService` points at `https://developer.uscis.gov/`. Community guidance: keep collection proportionate, publish aggregates not case-level histories, don't enumerate receipt numbers (neighbouring numbers are not a homogeneous cohort) | SEARCH / VERIFIED-CODE |
| Other Torch API | FOIA Request and Status API v1.2 at `https://api-int.uscis.gov/foia` (`POST /requests`, `GET /requests/{requestNumber}`) | VERIFIED-CODE (profile) |

### 3.3 Receipt-number formats

* Format: 3 letters + 10 digits (`^[A-Z]{3}\d{10}$`); the third-party OpenAPI profile uses `^(EAC|LIN|SRC|IOE|MSC|NBC|WAC|YSC)\d{10}$` (VERIFIED-CODE). Prefix meanings (SEARCH, consistent across guides): **EAC** Vermont SC, **WAC** California SC, **LIN** Nebraska SC, **SRC** Texas SC, **YSC** Potomac SC, **MSC/NBC** National Benefits Center (MSC is often expanded as "Missouri Service Center", a back-formation), **IOE** = cases in the USCIS ELIS electronic system (online filings *and* paper filings that lockboxes digitise). For non-IOE numbers the digits encode fiscal year, workday and sequence; for IOE they are sequential. The prefix tells you where the case was *receipted*, not where it will be adjudicated.
* **What a CAA I-485 gets:** CAA applications are paper-filed to a USCIS **lockbox** chosen by the applicant's state (Chicago, Dallas, Phoenix or Elgin; official chart `https://www.uscis.gov/forms/all-forms/direct-filing-addresses-for-form-i-485-application-to-register-permanent-residence-or-adjust-status`, SEARCH). I could not confirm whether Form I-485 is available for online filing in 2026 (no search result confirmed it). Lockbox-receipted I-485s carried **MSC** numbers historically; since USCIS began scanning lockbox intake into ELIS, many paper filings receive **IOE** numbers (INFERRED from the IOE definition above; one community monitor says it "currently supports IOE receipt numbers"). **The app should accept any prefix and ask the user to copy the number from the I-797C.** The concurrently filed I-765 (c)(9) and I-131 get their own receipt numbers in the same batch.

---

## 4. Historical data, FOIA reading room, FOIA APIs

* **Historic processing times** — covered in §2.6.
* **FOIA electronic reading room** (`https://www.uscis.gov/records/electronic-reading-room`, URL from memory, not verified here) holds policy memos and prior FOIA releases, not structured adjudication data. Case-level CAA data has to be requested: e.g. the American Immigration Council / National Immigration Project FOIA request (Mar 2025) sought "individualized data maintained by USCIS for Cuban nationals who applied for adjustment of status starting January 1, 2019" (SEARCH, `https://www.americanimmigrationcouncil.org/wp-content/uploads/2025/03/freedom_of_information_act_request_smuggling_determination_to_uscis.pdf`). A FOIA for a monthly extract of CAA I-485s by receipt month × office × outcome is realistic and would be the only way to get true per-office CAA throughput.
* **FOIA request/status API** (Torch, §3.2) and **FOIA processing-time metrics JSON** `https://first.uscis.gov/api/public/foia-metrics` (fields `metricTimestamp, metricName, metricValue, trackId, officeId, officeCode`, VERIFIED-CODE) — only useful if the app ever files FOIAs itself.
* **Older report archives:** PDF versions of the all-forms and I-485-by-office reports back to FY2021/FY2022 (§1.2–1.3) allow a 5-year CAA quarterly backfill.

---

## 5. What to monitor for CAA/CHNV policy changes (alerts feature)

| What | URL | Machine-readable | Notes |
|---|---|---|---|
| Policy Manual, Volume 7 (Adjustment of Status) | `https://www.uscis.gov/policy-manual/volume-7` ; updates log `https://www.uscis.gov/policy-manual/updates` | HTML; the updates page is a dated list — diff it daily | Recent CAA-relevant items (SEARCH): Aug 18 2026 public-charge guidance (its table keeps CAA applicants **exempt** from the public-charge test); Jul 10 2026 technical update after a June 2026 court order vacated two policy memos and a policy alert; 2025 discretion updates in Vol. 7 Part A Ch. 10 (`…/volume-7-part-a-chapter-10`), which lists CAA among discretionary categories; PDF alerts at `…/document/policy-manual-updates/20250819-DiscretionaryFactors.pdf`, `20251127-Discretion.pdf`. Much CAA procedure still lives in AFM 23.11 (`https://niwaplibrary.wcl.american.edu/wp-content/uploads/USCIS-AFM-23.11-CAA-VAWA-CAA.pdf`) |
| "Green Card for a Cuban Native or Citizen" page | `https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-a-cuban-native-or-citizen` | HTML | Eligibility text; advises filing the (c)(9) EAD with the I-485 (SEARCH) |
| Newsroom (news releases + alerts) | `https://www.uscis.gov/newsroom/all-news` ; historic RSS landing `https://www.uscis.gov/rss-landing` (2019 archive at webharvest.gov shows separate "News Releases" and "Alerts" feeds) | RSS existed; current feed URLs not verifiable from here (`https://www.uscis.gov/news/rss-feed/<id>` pattern, unverified) | Scrape the HTML list if RSS is gone |
| Forms updates (I-485 edition dates; current edition 09/18/26 per search snippet) | `https://www.uscis.gov/i-485` | HTML | Edition changes invalidate old forms |
| Federal Register — DHS/USCIS documents | `https://www.federalregister.gov/api/v1/documents.json?conditions[agencies][]=homeland-security-department&conditions[term]=parole` | **Yes — public JSON API, no key** | Catch parole-termination notices (Mar 2025 CHNV FRN), fee rules (e.g. `https://www.federalregister.gov/documents/2025/11/21/2025-20622/inflation-adjustment-to-hr-1-immigration-fees`) |
| Court dockets | CourtListener REST API (`https://www.courtlistener.com/api/rest/v4/`) for *Svitlana Doe v. Noem*, D. Mass. 25-cv-10495, and the D.R.I. (Jun 6 2026) and N.D. Cal. (Aug 24 2026) orders vacating the Dec 2025 country-based pause (SEARCH, Factchequeado 2026-06-10, UnoTV) | Yes | See the litigation research file for details |
| Spanish-language press (fast signal, not primary) | CiberCuba `https://www.cibercuba.com/` (+ `en.cibercuba.com`), 14ymedio `https://www.14ymedio.com/`, Factchequeado `https://factchequeado.com/`, Cuba en Miami, Directorio Cubano, Telemundo/Univision | RSS on most | They routinely publish the monthly/quarterly USCIS Cuban numbers within a day of release (e.g. CiberCuba 2026-10-20, Cuba en Miami on the July 2026 "308 approvals") |

Non-USCIS complements (both hosts blocked here): DHS OHSS (`https://ohss.dhs.gov/`) — CHNV parole arrivals by nationality and monthly "Immigration Enforcement and Legal Processes" tables; CBP — CHNV arrivals via the CBP One / parole process pages. They size the eligible cohort (how many Cubans paroled and when → when their one-year clock ends), which the estimator needs for the demand curve.

---

## 6. Implications for the app design (summary)

1. **Backbone = monthly Report-to-Congress CSV** (national CAA received/approved/denied/pending/pending>6mo/mean months) refreshed monthly, **plus the quarterly all-forms workbook** (CAA median months; (c)(9) EAD volumes) and **the quarterly I-485-by-office workbook** (humanitarian column per office/state as the CAA proxy). All three are plain files behind one portal page; one scraper + three parsers. Backfill: monthly from Jul 2024, quarterly from FY2024 Q4 via the mirror; earlier via PDFs.
2. **Processing-times tool**: no CAA subtype; use `131A-FAM` at the user's field office for the 80th-percentile and inquiry date, and `147-C9` / `147-C11` at NBC for EADs. Do not call egov from the device; consume the daily community SQLite releases or run a residential collector.
3. **Per-case status**: offer optional receipt-number tracking via the official Torch API (sandbox first; production needs ≥5 days of sandbox traffic and USCIS approval, and may be unavailable to a hobby project) — never by scraping Case Status Online or myUSCIS.
4. **Estimator anchors** (all from official files): national CAA throughput of a few hundred approvals/month against 355k pending; 97% of pending older than six months; quarterly CAA median 16–20 months for the few cases that do complete; per-office humanitarian backlogs (Kendall 41k, Hialeah 37k, Tampa 35k, Houston 35k …). The honest estimate for a March/April 2025 filer is "not computable as a date; here is the inventory ahead of you and the current monthly completion rate".
5. **Alerts**: diff the Policy Manual updates page, the newsroom list, the Federal Register API, and the portal page for new files; surface Spanish-language press as secondary.

## 7. Open questions

* Exact `href` paths of the current monthly CSV, I-485 workbook and I-765 workbook on the portal (blocked from here; the mirror derives them from the portal HTML).
* Whether USCIS added a CAA subtype to the processing-times tool after Oct 2024 (no evidence in 2026 diffs, but absence is inferred).
* Current wording of the Torch API terms of use and whether a non-representative app can obtain production access in 2026.
* Whether Form I-485 is online-fileable in 2026 (affects IOE vs MSC guidance).
* Whether the Report-to-Congress CSV for September 2026 (and any Sep 2026 historic-pt refresh) is already out as of 2026-10-20.
* Whether the "Pending Over 6 Months" column exists in the quarterly all-forms workbook for older years (only the monthly file has it in the versions parsed).

---

## Sources (all accessed 2026-10-20)

**USCIS files parsed (via mirror `https://github.com/omairqazi29/visualizer`, path `data/USCIS_I485/`)**
- `https://raw.githubusercontent.com/omairqazi29/visualizer/master/data/USCIS_I485/i485_performance_data_fy2026_q3_v1.xlsx` (and `_q2_v1`, `i485_performance_fy2026_q1.xlsx`, `i485_performance_fy2025_q4.xlsx`, `i485_performancedata_fy2025_q{1,2,3}.xlsx`, `i485_performancedata_fy2024_q4.xlsx`)
- `https://raw.githubusercontent.com/omairqazi29/visualizer/master/data/USCIS_I485/quarterly_all_forms_fy2026_q{1,2,3}_v1.xlsx`
- `https://raw.githubusercontent.com/omairqazi29/visualizer/master/data/USCIS_I485/monthly_<month>_<year>.csv` (Jul 2024 – Aug 2026)
- `https://raw.githubusercontent.com/omairqazi29/visualizer/master/src/ingestion/registry.py`; `…/docs/POLICY_VERIFICATION.md`; `https://github.com/omairqazi29/visualizer/pull/30`, `/pull/31`

**USCIS pages (blocked from this sandbox; cited from search results)**
- `https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data`
- `https://www.uscis.gov/tools/reports-and-studies/understanding-our-data`
- `https://www.uscis.gov/sites/default/files/document/reports/Quarterly_All_Forms_FY2021Q1.pdf`
- `https://www.uscis.gov/sites/default/files/document/forms/quarterly_all_forms_fy2023_q4.pdf`
- `https://www.uscis.gov/sites/default/files/document/data/i485_performancedata_fy2023_qtr3.pdf`
- `https://www.uscis.gov/sites/default/files/document/reports/I485_performancedata_fy2022_qtr1.pdf`
- `https://www.uscis.gov/i-765` ; `https://www.uscis.gov/i-485` ; `https://www.uscis.gov/sites/default/files/document/forms/i-485instr.pdf`
- `https://www.uscis.gov/forms/all-forms/direct-filing-addresses-for-form-i-485-application-to-register-permanent-residence-or-adjust-status`
- `https://www.uscis.gov/uscis-lockbox-filing-locations-chart` ; `https://www.uscis.gov/forms/all-forms/uscis-lockbox-filing-locations-chart-for-certain-family-based-forms`
- `https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-a-cuban-native-or-citizen`
- `https://www.uscis.gov/policy-manual/volume-7` ; `https://www.uscis.gov/policy-manual/updates` ; `https://www.uscis.gov/policy-manual/volume-7-part-a-chapter-10` ; `https://www.uscis.gov/policy-manual/volume-7-part-a-chapter-2`
- `https://www.uscis.gov/sites/default/files/document/policy-manual-updates/20250819-DiscretionaryFactors.pdf` ; `…/20251127-Discretion.pdf`
- `https://www.uscis.gov/newsroom/alerts/uscis-issues-guidance-on-making-public-charge-inadmissibility-determination`
- `https://www.uscis.gov/sites/default/files/document/fact-sheets/historical_pt_factsheet_fy16_to_fy24.pdf`
- `https://www.uscis.gov/sites/default/files/document/questions-and-answers/Frequently_Asked_Questions_on_USCIS_Processing_Times_for_Orphan_and_Hague_Adoption_Cases.pdf`
- `https://egov.uscis.gov/processing-times/` ; `https://egov.uscis.gov/processing-times/api/` ; `https://egov.uscis.gov/processing-times/processing-times-faqs` ; `https://egov.uscis.gov/processing-times/more-info` ; `https://egov.uscis.gov/processing-times/historic-pt`
- `https://egov.uscis.gov/casestatus/landing.do`
- `https://developer.uscis.gov/` ; `https://developer.uscis.gov/get-started` ; `https://developer.uscis.gov/get-started/sandbox` ; `https://developer.uscis.gov/get-started/production-access/request` ; `https://developer.uscis.gov/get-started/sign-up` ; `https://developer.uscis.gov/api/case-status` ; `https://developer.uscis.gov/article/how-get-access-tokens-client-credentials`
- `https://first.uscis.gov/api/public/foia-metrics` ; `https://first.uscis.gov/#/check-status`
- `https://www.uscis.gov/rss-landing` (2019 copy: `https://webharvest.gov/congress115th/20190108214554/https://www.uscis.gov/rss-landing`)

**Open-source trackers (code read directly)**
- `https://github.com/jzebedee/uscis` — README, `curl_request_next_action.sh`, `resolve_next_action_id.py`, `normalize_next_response.py`, `populate-processing-time-template.sql`, `populate-form-types-template.sql`, `populate-forms-table.sql`, `populate_cookies.sh`, `curl_chrome_uscis`, `populate_foia_processing_times.sh`, `.github/workflows/build_db.yml`; releases `https://github.com/jzebedee/uscis/releases/tag/2026-10-15` and `/2026-09-25`
- `https://github.com/coatless-r-n-d/uscis-processing` — README, `R/api.R`, `R/forms.R`, `R/processing_times.R`, `R/transform.R`, `R/utils.R`, `data-raw/{forms,form-types,form-offices,processing-times}-2024-10-30.csv`
- `https://github.com/coatless-dashboard/uscis-processing-times` ; dashboard `https://dashboard.thecoatlessprofessor.com/uscis-processing-times/`
- `https://github.com/scoakley23/Pathways` — README, `scripts/lib/uscis.mjs`, `scripts/fetch-processing-times.mjs`, `test/fixtures/README.md`, `data/offices.json`
- `https://github.com/arielsvn/arielsvn.github.io/issues/3`
- `https://github.com/api-evangelist/us-citizenship-and-immigration-services` — `apis.yml`, `openapi/us-citizenship-and-immigration-services-case-status-api-openapi.yml`, `authentication/…`, `rate-limits/…` (note: its rate-limit/plan YAML are "scaffold values", not USCIS figures)
- `https://github.com/marcodallastella/USCIS-check-case-status` ; `https://github.com/aayushga/uscis-case-cohort-analyzer` ; `https://github.com/jrdeng93/uscis-case-API-monitor`

**Press, analyses and secondary sources (from search results)**
- CiberCuba: `https://en.cibercuba.com/noticias/2026-10-20-u1-e135253-s27061-nid343309-solo-139-cubanos-obtuvieron-residencia-ley-ajuste` ; `https://en.cibercuba.com/noticias/2026-10-06-u1-e135253-s27061-nid342034-green-card-ley-ajuste-cubano-tarda-casi-ano-tiempo`
- Cuba Headlines: `https://www.cubaheadlines.com/articles/343309` ; `https://www.cubaheadlines.com/articles/342034`
- Factchequeado: `https://factchequeado.com/teexplicamos/20260429/cubanos-green-cards-arrestos-ice/` ; `https://factchequeado.com/teexplicamos/20260610/uscis-factor-negativo-paises-travel-ban/` ; Chequeado republication `https://chequeado.com/el-explicador/durante-el-gobierno-de-trump-se-redujeron-las-aprobaciones-de-green-cards-para-cubanos-en-estados-unidos-en-casi-100-mientras-los-arrestos-de-ice-aumentan/`
- 14ymedio: `https://www.14ymedio.com/cuba/migracion/aprobaciones-residencia-ley-ajuste-cubano_1_1132080.html`
- Cuba en Miami: `https://www.cubaenmiami.com/uscis-aprobo-solo-308-green-cards-para-cubanos-bajo-la-ley-de-ajuste-en-julio/` ; Directorio Cubano `https://www.directoriocubano.info/actualidad/primeras-green-cards-vuelven-a-aprobarse-para-cubanos-pero-el-avance-es-muy-lento/` ; UnoTV `https://www.unotv.com/us/inmigracion-us/ley-de-ajuste-cubano-las-residencias-aprobadas-caen-mas-de-99/` ; La Nación `https://www.lanacion.com.ar/estados-unidos/migraciones/ni-ley-de-ajuste-ni-green-card-la-mala-noticia-que-deja-en-un-limbo-migratorio-a-los-cubanos-en-eeuu-nid03122025/`
- VisaVerge `https://www.visaverge.com/greencard/cuban-green-card-approvals-drop-to-237-as-trump-administration-tightens-uscis-rules/` ; Inmigreat `https://www.inmigreat.com/en/analytics/i-485/` ; visainamerica `https://visainamerica.com/uscis-releases-fy2025-q4-i-485-adjustment-of-status-data/`
- American Immigration Council: `https://www.americanimmigrationcouncil.org/blog/uscis-immigration-processing-trends-2026/` ; `https://www.americanimmigrationcouncil.org/blog/uscis-backlog-grows-less-immigration-filings/` ; `https://www.americanimmigrationcouncil.org/wp-content/uploads/2026/08/USCIS-Report_Employment-Based-Immigration-Petitions.pdf` ; FOIA request PDF `https://www.americanimmigrationcouncil.org/wp-content/uploads/2025/03/freedom_of_information_act_request_smuggling_determination_to_uscis.pdf` ; summary `https://immpolicytracking.org/policies/uscis-backlog-of-immigration-petitions-and-applications-grows/`
- Niskanen Center `https://www.niskanencenter.org/immigrationdata/` ; FederalHiringData `https://www.federalhiringdata.com/articles/uscis-pending-caseload-workforce-2026` ; Immiva `https://immiva.com/blog/i-485-processing-time`, `https://immiva.com/blog/uscis-denial-rates-by-form`, `https://immiva.com/blog/uscis-processing-times-by-form`
- Processing-time methodology explainers: CLINIC `https://www.cliniclegal.org/resources/when-cases-stall-practitioners-guide-outside-normal-processing-time` ; `https://www.nnuimmigration.com/uscis-processing-times/` ; `https://www.lighthousehq.com/blog/uscis-processing-times` ; `https://www.visacasetimes.com/guides/uscis-processing-times-explained` ; `https://www.palmerpolaski.com/news/uscis-historical-national-median-processing-times-highlight-historic-backlogs` ; `https://www.h1bvisalawyerblog.com/historical-processing-times-trends-for-fiscal-years-2016-2024/` ; `https://arvian-immigration.com/uscis-processing-times-2026-how-long-i-130-i-485-i-765-i-131-and-n-400-tak/` ; `https://www.visabulletin.ai/uscis-processing-times-by-form`
- Receipt-number guides: `https://citizenpath.com/uscis-receipt-number-explained/` ; `https://immigrationdoc.ai/blog/read-uscis-receipt-number` ; `https://www.casestatusapi.com/guides/ioe-receipt-number-meaning` ; `https://deepvisalabs.com/uscis-tools/receipt-number/` ; `https://www.greencardgenius.com/resources/uscis-receipt-number` ; `https://kinara.us/news/understanding-receipt-numbers`
- Case Status API vendors/explainers: `https://ai.parley.so/developers-uscis-case-status-api` ; `https://www.legistai.com/uscis-case-status-api-integration-for-immigration-firms-automate-receipt-tracking` ; `https://inmigrausa.com/uscis/inmigra_usa_case_status_api_production.pdf`
- Filing-address guides: `https://www.lighthousehq.com/blog/form-i-485-filing-address` ; `https://zontlaw.com/all-immigration-forms/direct-filing-addresses-for-form-i-485/`
- CAA background: `https://niwaplibrary.wcl.american.edu/wp-content/uploads/USCIS-AFM-23.11-CAA-VAWA-CAA.pdf` ; `https://niwaplibrary.wcl.american.edu/wp-content/uploads/USCIS_CAA_AA_485_Denied_NoParole_Process-Feb232022.pdf` ; `https://casaislaw.com/is-the-cuban-adjustment-act-still-valid-updated-guide-for-2026-applicants/` ; `https://bwea.com/cuban-adjustment-act-caa/`
- Federal Register: `https://www.federalregister.gov/documents/2025/11/21/2025-20622/inflation-adjustment-to-hr-1-immigration-fees` ; API `https://www.federalregister.gov/api/v1/documents.json`
- `https://immpolicytracking.org/policies/uscis-consolidates-data-pages-on-its-website/`
