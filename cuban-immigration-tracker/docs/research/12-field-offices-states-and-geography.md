# 12. Geography of Cuban CAA adjudication: field offices, states, and where Cubans live

**Project:** Cuban Immigration Tracker (CAA Tracker)
**Research date:** 2026-10-20
**Research channel:** WebSearch only (15 calls used; direct fetching of uscis.gov, census.gov and news sites was blocked in this environment). Every number below is therefore taken from search-result summaries, not from the underlying page, and should be re-verified before it is hard-coded into the app.

**Claim tags used throughout**
- **[S]** = stated in a search result seen today (URL cited inline and in the Sources section)
- **[T]** = from training knowledge, not confirmed today (treat as "probably right, verify")
- **[I]** = inferred by the author from the above

---

## 0. Executive summary (what the estimator needs to know)

1. **Where you live decides which USCIS field office owns your CAA I-485, and the field office is the main geographic driver of wait time.** A Cuban Adjustment Act (CAA) I-485 is mailed to a USCIS lockbox, pre-processed by the National Benefits Center (NBC), and then routed to the field office with jurisdiction over the applicant's home address for interview and/or final decision. [T] Multiple 2026 practitioner and Cuban-media sources say the same thing in plain language: "family-based adjustment applications are handled by the field office for your address, so your local office is what matters" [S: yiminshuju.com] and CiberCuba's 2026 CAA guide tells readers the office is chosen by place of residence (Miami, Tampa, Orlando, Hialeah, Kendall, Hollywood FL, West Palm Beach, Houston, Newark, Las Vegas, ...) [S: cibercuba.com CAA guide].
2. **Interview waivers are no longer the norm for Cubans.** Older law-firm pages still say most CAA cases are decided without an interview [S: lluislaw.com], but CiberCuba's 2026 guide says that in 2025-2026 USCIS has been calling Cuban applicants to interview more often and advises everyone to expect one [S], and an October 2026 CiberCuba report says USCIS tightened adjustment interviews in 2026 with more detailed questioning [S: cibercuba 2026-10-03]. The estimator should assume an interview for most CHNV-parolee CAA cases filed in 2025 or later. [I]
3. **The only per-office numbers available in 2026 are the USCIS "80% of family-based I-485 cases completed within" figures, republished by trackers.** August 2026 values: Miami 21.5 mo, Newark 22 mo, Las Vegas 19 mo, Orlando 18.5 mo, Houston 18 mo, Charlotte 18 mo, Tampa 17 mo, Jacksonville 17 mo, Atlanta ~16.5 mo, Dallas 13.5 mo, Louisville 12.5 mo [S: yiminshuju.com, Aug 2026; Atlanta from a second aggregator]. Hialeah, Kendall and Oakland Park had no separate values in any result seen today [S]; the USCIS tool itself does list them as separate offices [T].
4. **The CAA-specific national picture is far worse than those office figures suggest.** USCIS data with a cut-off of 31 July 2026 put the national *median* for completed CAA I-485s at 11.8 months in FY2026 versus 7 months in FY2025 [S: cubaenmiami.com; CiberCuba 2026-10-06 says the wait has roughly tripled since 2023]. But as of 30 June 2026 the Cuban category had **355,371** pending adjustment applications [S: periodicocubano.com, Aug 2026], only **139** CAA residencies were approved in April-June 2026 and more than **342,000** remained undecided as of 19 October 2026 [S: unotv.com], and July 2026 saw just 308 approvals [S: periodicocubano.com]. Medians of completed cases say little about the pending pile. [I]
5. **The reference case (filed March 2025, EAD Sept 2025, no decision at 19 months in October 2026)** sits inside the Miami 80th-percentile band (21.5 months) if it is a Miami-area case, and is roughly in line with the 16-24-month figures Cuban-community lawyers were quoting in mid-2026 [S: unotv.com "espera supera 16 meses"; cubaenmiami.com "hasta 24 meses"]. [I]
6. **Cubans are extremely concentrated geographically:** 76% of Cuban immigrants lived in Florida (Texas 5%, New Jersey 3%) and 60% in greater Miami alone in 2017-21 ACS data [S: migrationpolicy.org]; the Cuban-origin population reached 2.9 million in 2024, of whom about 1.67 million are immigrants [S: pewresearch.org, May 2026]. For CHNV specifically, 80% of parolee flights in Jan-Aug 2023 landed in Florida (Miami first, Fort Lauderdale second; Houston and Dallas the main Texas airports; Las Vegas 14th) [S: audacy.com / House Homeland Security Committee DHS data]. The app's office list should therefore be weighted to the six South/Central Florida offices, then Houston, Dallas, Louisville, Las Vegas, Newark, Charlotte, Atlanta. [I]
7. **A national adjudication hold overlays all geography.** A 2 Dec 2025 USCIS memo halted pending benefit requests for nationals of the 19 June-2025 proclamation countries including Cuba, and the 1 Jan 2026 memo PM-602-0194 extended holds to 39 countries and explicitly covers adjustment of status [S: grossmanyoung.com, boundless.com, oiss.yale.edu, magrath.co.uk]. CiberCuba's guide says the ~19-country pause was annulled in court on 5 June 2026 [S], and Cubanet reports a federal judge struck down the USCIS policies that froze Cubans' cases [S: cubanet.org]. Office-level differences only matter once a case is actually being worked; the estimator needs a "national hold" switch independent of office. [I]

---

## 1. How a CAA I-485 travels through USCIS (routing)

### 1.1 The pipeline

| Step | Who / where | What happens | Tag |
|---|---|---|---|
| 1. Filing | USCIS Lockbox (CAA cases historically go to the Chicago Lockbox; USCIS maintains a "Direct Filing Addresses for Form I-485" page that lists the CAA-specific address) | Fee intake, data entry, receipt notice (I-797C). Receipt-number prefix MSC/IOE signals NBC ownership. | [T]; existence of the direct-filing page [S: uscis.gov direct-filing-addresses page] |
| 2. Pre-processing | National Benefits Center (NBC), Lee's Summit, MO | Biometrics appointment at a local ASC, FBI name/fingerprint checks, adjudication of the concurrently filed I-765 (c)(9) EAD and any I-131, request for evidence if the file is incomplete, and "narrowing of issues" before interview. | [T]; the narrowing role [S: hackinglawpractice.com] |
| 3. Transfer | NBC → field office with jurisdiction over the applicant's residence | Case status changes to "Case Was Transferred And A New Office Has Jurisdiction". The office is chosen from the home address on file (changes via AR-11 move the case). | [T]; "field office for your address" [S: yiminshuju.com]; residence-based office list [S: cibercuba.com CAA guide] |
| 4. Interview or waiver | Field office | The field office decides whether an interview is needed; if it decides one is not required it can return the I-485 to the NBC with a recommendation for approval. Interviews may be waived or scheduled later depending on the case. | [S: justanswer.com (single attorney's description, not official)] |
| 5. Decision | Field office (or NBC if waived) | Approval → I-551 card production; RFE/NOID; denial. "Transfers do not necessarily mean a decision was made." | [S: justanswer.com]; [T] |

**Which office's processing time applies to you:** if the receipt notice lists the NBC, check the processing time for your local field office; if USCIS transfers the case, use the new office's time [S: immigrationdirect.com, Oct 2026].

**Policy basis for interview waivers [T]:** USCIS Policy Manual, Volume 7, Part A, Chapter 5 (Interview Guidelines) gives officers discretion to waive the adjustment interview when the record is sufficient; CAA cases are not in a mandatory-interview category by statute. Practice has varied by era: before 2017 Miami-district CAA cases were very frequently approved without interview; after the 2017 expansion of in-person interviews, and especially for parolees/I-220A entrants, interviews became common. Not confirmed today; treat as background.

### 1.2 What 2025-2026 sources say about interview practice for Cubans

- "En 2025-2026 la tendencia ha sido citar a entrevista con más frecuencia a los solicitantes cubanos ... es prudente esperar que le citen a entrevista y prepararse para ella." [S: cibercuba.com CAA guide]
- USCIS "has also tightened its adjustment of status interviews in 2026, with more detailed questions about the applicant's history"; admitting drug use at the interview can cost a Cuban the green card even with no record. [S: en.cibercuba.com 2026-10-03]
- A community tracking platform reported days with 80-100 CAA residencies approved and 120-150 new interviews scheduled (autumn 2026, after the court rulings). [S: periodicocubano.com "USCIS acelera aprobaciones"]
- Attorney Claudia Cañizares (Miami) cited a parolee client more than 80 days without a decision *after* the interview, and said "el tiempo promedio actualmente es mucho más alto" than USCIS's published 11.7-11.8-month figure (she stressed this reflects her office, not the whole caseload). [S: cubaenmiami.com]
- Older/firm pages: "most CAA cases are processed without an interview, but USCIS may schedule one at its discretion" [S: lluislaw.com]; "interviews are required at the local USCIS field office, unless waived upon the discretion of USCIS" [S: another firm page in the same result set].

**Estimator implication [I]:** model the interview as a milestone with office-specific probability and office-specific scheduling lag; for 2025+ filings set P(interview) high (≥0.8) until community data shows otherwise; post-interview decision lag is non-trivial (weeks to months) and itself office-dependent.

### 1.3 Dated timeline relevant to geography and routing

| Date | Event | Tag / source |
|---|---|---|
| Oct 2022 / Jan 2023 | CHNV parole opens (Venezuelans Oct 2022; Cubans, Haitians, Nicaraguans Jan 2023), 30,000/month cap, U.S. sponsor required | [T]; cap and sponsor requirement [S: visaverge.com; refugeesinternational.org] |
| Jan-Aug 2023 | ~200,000 CHNV parolees fly in; 80% (161,562) land in Florida; Miami #1, Fort Lauderdale #2; Houston/Dallas main Texas airports; Las Vegas #14 (483) | [S: audacy.com citing House Homeland Security Committee DHS data; threadreaderapp (Melugin)] |
| Late 2024 | Cumulative CHNV: 110,240 Cubans, 211,040 Haitians, 93,080 Nicaraguans, 117,320 Venezuelans (~532,000) | [S: visaverge.com; wikipedia CHNV page] |
| Early 2025 | Government-wide pause on benefit adjudication for CHNV parolees (project README; later struck down in court) | [T] / README |
| Jun 2025 | Presidential proclamation restricting entry from 19 countries; Cuba partially restricted | [S: context in visaverge.com / cubanet.org results]; [T] |
| 2 Dec 2025 | USCIS memo halts pending asylum and benefit requests for people born in or citizens of the 19 proclamation countries, Cuba included | [S: visaverge.com / cubanet.org summary] |
| 1 Jan 2026 | USCIS PM-602-0194 expands processing holds to 39 countries (Cuba listed) regardless of entry date; covers I-485 adjustment of status; orders re-review of some approvals; no timeline to lift | [S: grossmanyoung.com; boundless.com; oiss.yale.edu; magrath.co.uk; ischo.mit.edu] |
| Mar 2026 | Proposed class action in Miami arguing I-220A should count as parole under the CAA (Cañizares); separate suit over stalled residency cases for ~100,000 Cubans who entered via Biden-era pathways (attorney's estimate) | [S: hoodline.com; visaverge.com] |
| 5 Jun 2026 | Court annuls the ~19-country USCIS adjudication pause (per CiberCuba guide); Cubanet: federal judge strikes down USCIS policies that froze Cubans' cases | [S: cibercuba.com CAA guide; cubanet.org] |
| 30 Jun 2026 | 355,371 CAA adjustment applications pending | [S: periodicocubano.com, Aug 2026] |
| Jul 2026 | 308 CAA approvals in the month | [S: periodicocubano.com] |
| 30 Jul 2026 | Order in *Acosta Reynoso et al. v. USCIS*, No. 8:26-cv-1314 (M.D. Fla., Tampa Div.): 143 Cuban plaintiffs allege unreasonable delay; some files >3 years; judge asks which plaintiffs already have decisions, and about jurisdiction, venue and whether to keep the 143 joined | [S: leagle.com; periodicocubano.com; directoriocubano.info (reports 129 plaintiffs and a denied preliminary injunction; unconfirmed)] |
| 31 Jul 2026 | USCIS data cut-off: national median for completed CAA I-485 = 11.8 months in FY2026 (7 months in FY2025) | [S: cubaenmiami.com; en.cibercuba.com 2026-10-06] |
| Aug 2026 | Tracker republishes per-office family-based I-485 80% times (table in §5) | [S: yiminshuju.com] |
| 6 Oct 2026 | CiberCuba: CAA green card "already taking almost a year", wait tripled since 2023 | [S: en.cibercuba.com 2026-10-06] |
| 9 Oct 2026 | No general ruling granting residency to the 992 I-220A plaintiffs in Miami | [S: directoriocubano.info] |
| 19 Oct 2026 | UnoTV: only 139 CAA approvals Apr-Jun 2026; >342,000 undecided; "aprobaciones caen más de 99%"; "espera supera 16 meses" | [S: unotv.com] |

---

## 2. USCIS field offices serving the largest Cuban communities

Office addresses marked [T] are from training memory and must be verified against the official USCIS field-office pages before display in the app. County lists are what the app ultimately needs (see §3).

| State | Field office | City / address | Serves (counties / area) | Notes | Tag |
|---|---|---|---|---|---|
| FL | **Miami** | 8801 NW 7th Ave, Miami FL 33150 | Part of Miami-Dade; historically the Miami District HQ | Miami District covers Miami, Oakland Park, Hialeah, Kendall FOs plus Puerto Rico and USVI | address & district [S: uscis.gov 2012 district list; projectcitizenship.org 2015 list] |
| FL | **Hialeah** | Hialeah, FL (NW Miami-Dade) | Hialeah / north-west Miami-Dade ZIPs | Hialeah is the densest Cuban city in the U.S.; appears in CiberCuba's residence-based office list | existence [S: cibercuba.com guide; uscis.gov district list]; address [T] |
| FL | **Kendall** | Kendall / south-west Miami-Dade | SW Miami-Dade ZIPs | In CiberCuba's list and USCIS district list | [S]; address [T] |
| FL | **Oakland Park** | 4451 NW 31st Ave, Oakland Park FL 33309 | Broward County (Fort Lauderdale area) | A tracker lists "Miami and Oakland Park, FL" at 22-40 months overall I-485 | existence [S: uscis.gov district list; immigrationtimes.org]; address [T] |
| FL | **Hollywood** (reported) | Hollywood, FL (Broward) | Broward split with Oakland Park | Listed by CiberCuba's guide as a residence-based office; not seen in USCIS lists today — verify | [S: cibercuba.com guide] |
| FL | **West Palm Beach** | Royal Palm Beach, FL | Palm Beach, Martin, St. Lucie, Indian River, Okeechobee, Glades, Hendry, Highlands | | [S: wikipedia West Palm Beach FO] |
| FL | **Tampa** | 5629 Hoover Blvd, Tampa FL 33634 | Hillsborough, Pinellas, Pasco, Polk, Sarasota, Lee and other west-central counties | Second-largest Cuban metro (6% of Cuban immigrants, 2017-21) | [S: lawfirm4immigrants.com; migrationpolicy.org] |
| FL | **Orlando** | Orlando, FL (older listing: 390 N Orange Ave Ste 220; current office believed to be on Corporate Centre Blvd) | Central Florida (Orange, Osceola, Seminole, Lake, Volusia, Brevard, etc.) | | older address [S: uscis.gov 2012 list]; current [T] |
| FL | **Jacksonville** | Jacksonville, FL | NE Florida (Duval, Clay, St. Johns, Nassau, etc.) | Not in any USCIS list surfaced today | [T] |
| FL | **Fort Myers** | Fort Myers, FL | SW Florida (Lee, Collier, Charlotte) — note lawfirm4immigrants lists Lee under Tampa, so verify | | [T] |
| TX | **Houston** | 126 Northpoint Dr, Houston TX 77060 | Greater Houston | Flagged as high-volume with chronic interview backlogs | [S: uscis.gov 2012 list; lighthousehq.com] |
| TX | **Dallas** | Irving, TX (Campus Circle Dr) | DFW metroplex | Aggregator shows Dallas among the faster offices (13.5 mo) despite "heavy caseload" reputation | [T] address; [S: yiminshuju.com; lighthousehq.com] |
| KY | **Louisville** | Louisville, KY (downtown federal building) | Kentucky (and southern Indiana counties) | Historically under Cleveland District; fastest office in the table (12.5 mo) | [T]; district [S: uscis.gov 2012 list]; time [S: aggregator] |
| NV | **Las Vegas** | Las Vegas, NV | Clark County and southern Nevada | Historically under Phoenix District; 19 mo in Aug 2026 | [T]; district [S: uscis.gov 2012 list]; time [S: yiminshuju.com] |
| NJ | **Newark** | 970 Broad St, Newark NJ 07102 | Northern NJ incl. Hudson County (Union City / West New York Cuban enclave) and Elizabeth | Slowest in the Aug 2026 table (22 mo) | [T] address; [S: yiminshuju.com] |
| NC | **Charlotte** | Charlotte, NC | Western/central NC | 18 mo Aug 2026 (another source claims "well under a year" — conflict) | [T]; [S: yiminshuju.com vs lighthousehq.com] |
| GA | **Atlanta** | Atlanta, GA | Georgia | ~16.5 mo | [T]; [S: aggregator] |

**Other offices that will appear for Cubans [I]:** New York City / Brooklyn / Queens, Hartford, Boston/Lawrence, Chicago, Phoenix, Los Angeles, Minneapolis, Indianapolis, Nashville, San Antonio, Austin, Oklahoma City, Omaha, Kansas City. The app should ship the full USCIS office list, not just the Cuban top-15, because the processing-times tool publishes a row for every field office [T].

---

## 3. Mapping a user's ZIP code to a field office

**Official tool [T]:** the USCIS Office Locator (egov.uscis.gov/office-locator) accepts a ZIP code and returns the field office with jurisdiction. The third-party Tampa page confirms the pattern: "you can find out which USCIS field office is nearest to you by entering your zip code on this USCIS webpage" [S: lawfirm4immigrants.com]. USCIS also publishes a domestic office map PDF [S: uscis.gov "Domestic Map 01042021" PDF].

**No official machine-readable ZIP→office file exists [I]**; nothing resembling one surfaced today. Options for the app:

1. **County-level table (recommended).** Each USCIS field-office page lists the counties it serves [T]; several third-party pages reproduce them (e.g. Tampa's and West Palm Beach's county lists [S]). Build `office_jurisdiction.csv` = (state, county FIPS, office code). Then map ZIP→county with the HUD-USPS ZIP-County crosswalk (quarterly, public; use the `res_ratio` column and pick the dominant county) [T]. Caveat: the Miami-Dade split among Miami, Hialeah and Kendall is **sub-county** (by ZIP), so Miami-Dade and Broward need an explicit ZIP list, which must be captured once from the official locator and refreshed periodically [I].
2. **Live locator lookup.** Call the Office Locator for the user's ZIP at onboarding and cache the result. Respect USCIS terms; it is a public web page, but there is no documented API [T]. Treat as fallback only.
3. **Ask the user.** The transfer notice ("A New Office Has Jurisdiction") and interview notice name the office; let the user override the ZIP-derived office. This is also the only way to catch USCIS *workload transfers* to a non-local office [I]; a 2026 explainer notes USCIS sometimes sends adjustments to a different office than the applicant's [S: opensphere.ai].

**Office codes [T]:** USCIS uses three-letter office codes (e.g. MIA Miami, HIA Hialeah, KEN Kendall, OKL Oakland Park, WPB West Palm Beach, TAM Tampa, ORL Orlando, JAC Jacksonville, HOU Houston, DAL Dallas, LOU Louisville, LVG Las Vegas, NEW Newark, CLT Charlotte, ATL Atlanta). Tracker URLs today confirm the code style (e.g. waitvisa.com `/i-485/mem` Memphis, `/i-485/was` Washington DC) [S: waitvisa.com]. Exact codes for the Florida offices should be read from the processing-times tool's office drop-down rather than trusted from memory.

---

## 4. Where Cubans live: Census ACS and CHNV settlement data

### 4.1 The Census tables and variables

- **Table B05006 — "Place of Birth for the Foreign-Born Population in the United States"** (ACS 1-year for states and large metros/counties ≥65k population; ACS 5-year for all counties/places) has a row "Cuba" under Americas → Latin America → Caribbean. [T]
- The Census API also exposes the collapsed table **C05006**; a 2023/2024 ACS-1 variable page `C05006_055M` surfaced in today's search for the Cuba row of that group [S: api.census.gov variables pages for 2023 and 2024 acs1], and a Puerto Rico-specific `B05006PR_026EA` page also surfaced [S]. The exact `B05006_###E` id for Cuba changed when the table was re-laid out in the 2019 vintage [T]; **resolve it at runtime by label** (`GET https://api.census.gov/data/{year}/acs/acs1/variables.json`, find the variable whose label ends in `!!Cuba`) rather than hard-coding a number. [I]
- Example queries [I, syntax T]:
  - States: `https://api.census.gov/data/2024/acs/acs1?get=NAME,{CUBA_VAR}E,{CUBA_VAR}M&for=state:*`
  - Metros: `...&for=metropolitan statistical area/micropolitan statistical area:33100` (Miami-Fort Lauderdale-West Palm Beach); other CBSA codes [T]: Tampa 45300, Orlando 36740, Jacksonville 27260, Houston 26420, Dallas 19100, Louisville 31140, Las Vegas 29820, New York-Newark 35620, Charlotte 16740, Atlanta 12060.
  - Counties (5-year): `https://api.census.gov/data/2023/acs/acs5?get=NAME,{CUBA_VAR}E&for=county:*&in=state:12`.
- Also useful: **B05006 PUMS** for year-of-entry (recent arrivals 2022-2024 approximate the CHNV cohort) [I], and the MPI Migration Data Hub interactive metro map [S: migrationpolicy.org].

### 4.2 What the numbers look like (latest seen today)

| Geography | Figure | Year / source | Tag |
|---|---|---|---|
| U.S. | 2.9 million people of Cuban origin (+23% vs 2019); ~1.67 million immigrants, ~1.265 million U.S.-born | 2024 ACS via Pew, 7 May 2026 | [S: pewresearch.org] |
| U.S. | ~2.95 million Cuban Americans; 2021-23 migration wave pushed the population up | 2024, Wikipedia | [S: wikipedia Cuban Americans] |
| Florida | 76% of Cuban *immigrants*; 1,621,352 Cuban Americans (2023) | MPI 2017-21 ACS; Wikipedia | [S: migrationpolicy.org; wikipedia] |
| Greater Miami metro | 60% of Cuban immigrants; ~1 in 8 residents Cuba-born | MPI 2017-21 | [S: migrationpolicy.org] |
| Tampa metro | 6% of Cuban immigrants (second-largest) | MPI 2017-21 | [S] |
| New York metro | 5% | MPI 2017-21 | [S] |
| Texas | 5% of Cuban immigrants; up to ~140,000 Cuban Americans (2024) | MPI; Wikipedia | [S] |
| New Jersey | 3% of Cuban immigrants | MPI 2017-21 | [S] |
| Kentucky | ~8% of Kentucky's foreign-born were born in Cuba (3rd after India, Mexico) | Western Union blog, Jun 2023 (unsourced) | [S: westernunion.com] |
| Louisville metro | 9,190 Cubans (2014 ACS); later unofficial estimate ~14,000; 2026 KY House Resolution HR28 claims >50,000 and doubling within five years | NBC News (2016); KY legislature 2026 | [S: nbcnews.com; apps.legislature.ky.gov] |
| Las Vegas metro | Ranked first among non-Florida cities by Cuban share in 2014 data; "growing" (no count) | NBC News; Wikipedia | [S] |
| Houston / Tampa / Las Vegas (city) | ~24,000 / ~62,000 / ~10,000 Cubans — undated quiz data, **not reliable** | JetPunk | [S: jetpunk.com] |

**Derived state estimates for a first-cut weighting [I]:** applying the 2017-21 MPI shares to Pew's 2024 immigrant total (1.67 M) gives Florida ≈ 1.27 M, Texas ≈ 84 k, New Jersey ≈ 50 k Cuba-born. These understate Texas, Kentucky and Nevada, which grew fastest in the 2021-24 wave [I]. Replace with live B05006 pulls in the ingestion pipeline.

### 4.3 Where CHNV Cubans settled

No source today gave Cuban-only, state-level settlement counts for CHNV parolees (open question in §9). What exists:

- **Arrival airports (all four nationalities), Jan-Aug 2023 [S: audacy.com / twitchy.com / threadreaderapp citing DHS data released by the House Homeland Security Committee]:** ~200,000 flew in; 161,562 (80%) landed in Florida; Miami #1, Fort Lauderdale #2; Houston and Dallas were the main Texas airports; Las Vegas #14 with 483.
- **Program totals through late 2024 [S: visaverge.com]:** 110,240 Cubans paroled.
- **Sponsor requirement [S: refugeesinternational.org]:** every beneficiary needed a U.S.-based financial sponsor, so settlement follows existing family networks — i.e. the Cuban map above. [I]
- **Labor footprint [S: visaverge.com 2026]:** Florida agriculture alone accounted for 30% of the CHNV workforce (figure's methodology not shown).
- **Inference for the app [I]:** CHNV Cubans are even more Florida-heavy than the stock population (sponsors are overwhelmingly in Miami-Dade, Broward, Hillsborough, Orange), with secondary clusters in Houston, Louisville, Las Vegas, Tampa, Orlando and the Union City/Elizabeth corridor in NJ. Expect Miami-District offices (Miami, Hialeah, Kendall, Oakland Park, Hollywood/WPB) to hold the majority of the ~342-355 k pending CAA cases.

---

## 5. Current (2026) I-485 processing times by office

### 5.1 What the official number means

USCIS's published processing time is the time it took to complete **80%** of the cases adjudicated in the previous six months; it is a reference point, not a prediction for an individual case [S: immigrationdirect.com; vasquezlawnc.com]. The separate "historical national median" dataset (used for the CAA 11.8-month figure) measures completed cases only and, USCIS warns, differs from the live pending-case tool [S: en.cibercuba.com 2026-10-06; cubaenmiami.com]. Neither measures how long the *pending* backlog will take. [I]

**Which I-485 category to query [T, verify]:** the live tool breaks I-485 down by basis (employment-based, family-based, refugee/asylee, "other"); the trackers quoted below report the **family-based** row, which is the closest published proxy for CAA at the office level. If the tool has no CAA row, the app should show the family-based office figure with a clear caveat and overlay the CAA-specific national numbers.

### 5.2 Per-office figures reported in 2026

All figures are "80% of family-based I-485 cases completed within", **August 2026**, from yiminshuju.com unless noted. Month-over-month change in parentheses.

| Field office | Months (Aug 2026) | Change vs July 2026 | Other 2026 reports | Tag |
|---|---|---|---|---|
| Newark, NJ | 22.0 | +1.0 | Named among heaviest caseloads | [S: yiminshuju.com; lighthousehq.com] |
| Miami, FL | 21.5 | −0.5 | "Miami family-based 20 months" (another table); "Miami and Oakland Park 22-40 months" overall I-485 (range) | [S: yiminshuju.com; vasquezlawnc/boundless table; immigrationtimes.org] |
| Las Vegas, NV | 19.0 | +1.5 | — | [S: yiminshuju.com] |
| Orlando, FL | 18.5 | +2.0 | — | [S] |
| Houston, TX | 18.0 | +0.5 | "chronic interview backlogs" | [S: yiminshuju.com; lighthousehq.com] |
| Charlotte, NC | 18.0 | +0.5 | Conflicting claim of "well under a year" | [S: yiminshuju.com vs lighthousehq.com] |
| Tampa, FL | 17.0 | +2.0 | — | [S] |
| Jacksonville, FL | 17.0 | +1.5 | — | [S] |
| Atlanta, GA | ~16.5 | n/a | — | [S: second aggregator in the same result set] |
| Dallas, TX | 13.5 | +1.5 | — | [S] |
| Louisville, KY | 12.5 | +1.0 | — | [S: aggregator] |
| Hialeah, FL | not found | — | Not separately reported in any tracker seen today | [S]; USCIS tool lists it [T] |
| Kendall, FL | not found | — | same | [S]; [T] |
| Oakland Park, FL | not found | — | "Miami and Oakland Park 22-40 months" | [S: immigrationtimes.org] |
| West Palm Beach, FL | not found | — | — | — |
| All field offices, employment-based | 9.5 | — | Aug 2026 | [S: yiminshuju.com] |
| National averages quoted by trackers | 16.7-32 months "average" (Aug 2026); 9-18 months for spouses of USCs in Florida (2026 guide) | — | — | [S: immigrationtimes.org; onepeoplelaw.com] |

**Trend [S/I]:** nearly every Florida office rose 1.5-2 months between July and August 2026, consistent with offices re-starting held cases after the June 2026 rulings and with the national CAA backlog [I].

### 5.3 CAA-specific national figures (apply on top of the office figure)

| Metric | Value | As of | Source | Tag |
|---|---|---|---|---|
| National median, completed CAA I-485 | 11.8 months (FY2026) vs 7 months (FY2025); +69% | data cut 31 Jul 2026 | cubaenmiami.com; en.cibercuba.com 2026-10-06 | [S] |
| Same, as quoted on a Cuba en Miami program | 11.7 months | mid-2026 | cubaenmiami.com | [S] |
| Pending CAA adjustment applications | 355,371 | 30 Jun 2026 | periodicocubano.com (Aug 2026) | [S] |
| Pending (later report) | >342,000 | reported 19 Oct 2026 | unotv.com | [S] |
| Approvals Apr-Jun 2026 | 139 | FY2026 Q3 | unotv.com | [S] |
| Approvals July 2026 | 308 | Jul 2026 | periodicocubano.com | [S] |
| Daily pace reported by a community tracker | 80-100 approvals and 120-150 new interviews per day on some days | autumn 2026 | periodicocubano.com | [S] |
| Lawyer-quoted practical waits | ">16 months" (UnoTV); "hasta 24 meses" (June 2026 analysis) | 2026 | unotv.com; cubaenmiami.com | [S] |
| Longest documented pendencies | >3 years for some of the 143 Tampa plaintiffs | Jul 2026 | leagle.com; periodicocubano.com | [S] |

---

## 6. Community reports on interview scheduling and office differences

- **Cuban media found no office-by-office breakdown.** Both Spanish-language searches returned national figures and lawyer anecdotes; none of CiberCuba, Cuba en Miami, Periódico Cubano, Directorio Cubano or UnoTV reported separate Hialeah/Kendall/Oakland Park/Tampa/Orlando waits [S: result summaries]. The office-level signal in the community lives in Facebook/Telegram/WhatsApp groups and in third-party case trackers, which the app can replicate by collecting user-reported milestones per office [I].
- **"Some files move faster depending on the office in charge, the immigration category, the filing date, background checks and whether an interview is needed"** — Periódico Cubano, Aug 2026 [S]. This is exactly the feature list for the estimator.
- **Interviews are being scheduled in volume again** (120-150/day on reported days) after the June 2026 rulings, while approvals in Q3 FY2026 were almost nil (139) — i.e. offices appear to have been scheduling interviews before issuing decisions, so "interview done" does not imply "decision soon" in 2026 [S: periodicocubano.com; unotv.com] [I].
- **Lawsuit venues show where the pain is:** 143 plaintiffs in the Tampa Division of M.D. Fla. [S: leagle.com], a 992-member I-220A action and a proposed class action in Miami (S.D. Fla.) [S: directoriocubano.info; hoodline.com]. Mandamus does not force approval, only action [S: periodicocubano.com]. For the estimator, a mandamus filing is a user-reportable milestone that, per practitioner experience, often triggers a decision within 60-120 days [T].
- **Post-interview limbo** (80+ days without decision after interview for a parolee) is a reported pattern [S: cubaenmiami.com, Cañizares].
- **Case-transfer confusion** is common: a transfer out of a field office back to the NBC can precede an approval without interview, and NBC↔field office moves do not imply a decision [S: justanswer.com; lawfully.com]. The app's status parser should treat "transferred" as neutral.

---

## 7. State-level factors for the estimator

Ranked by expected explanatory power [I]:

1. **Field office (not state).** Use office as the geographic key; state is only a fallback when ZIP is unknown. Florida alone has 9-10 offices with different queues (Miami 21.5 mo vs Tampa/Jacksonville 17 mo in Aug 2026) [S].
2. **Office's published family-based 80% time and its month-over-month slope.** Both are available monthly; slope captures re-opening dynamics (all Florida offices +1.5-2 mo in Aug 2026) [S].
3. **Office CAA share of workload.** Miami-District offices carry most of the ~350 k pending CAA cases, so a national CAA throughput of a few hundred approvals per month hits them hardest; smaller offices (Louisville, Dallas) clear faster [I, supported by S figures].
4. **Interview probability and scheduling lag by office.** Derive from user-reported milestones; prior = high for 2025+ filings [S: CiberCuba guide].
5. **National hold state.** Dec 2025 / Jan 2026 holds (Cuba included) and the June 2026 court annulment are national switches; cases filed by Cubans anywhere were frozen regardless of office [S]. The estimator should expose a "policy regime" variable with dated breakpoints (early-2025 CHNV freeze; 2 Dec 2025; 1 Jan 2026; 5 Jun 2026).
6. **Litigation venue.** Users in M.D. Fla. (Tampa/Orlando/Jacksonville) and S.D. Fla. (Miami District) can join or file mandamus actions that already exist there [S]; the app can surface "mandamus filed" as a milestone that shortens expected time [T].
7. **Workload transfers.** USCIS may transfer cases to a different office than the applicant's; the destination office's time then applies [S: immigrationdirect.com; opensphere.ai]. Let users override the office.
8. **Moves (AR-11).** A change of address re-routes the case and can reset the interview queue [T]. Ask users whether they moved after filing.
9. **Biometrics ASC capacity.** ASC appointments are scheduled by NBC at the nearest ASC; delays are usually small relative to the field-office queue [T]; low priority for v1.
10. **State-specific non-USCIS factors** (driver's licence rules, state benefits) do not affect USCIS timing and are out of scope [I].

---

## 8. Master table: state → main field offices → latest reported I-485 time → Cuban-born population → notes

| State | Main field office(s) for Cubans | Latest reported family-based I-485 time (80%) | Date / source | Cuban-born population (best available) | Notes |
|---|---|---|---|---|---|
| **Florida** | Miami, Hialeah, Kendall, Oakland Park, Hollywood (reported), West Palm Beach, Tampa, Orlando, Jacksonville, Fort Myers | Miami 21.5 mo; Orlando 18.5; Tampa 17; Jacksonville 17; Hialeah/Kendall/Oakland Park/WPB not reported (Oakland Park grouped with Miami at 22-40 mo range) | Aug 2026, yiminshuju.com [S]; immigrationtimes.org [S] | 76% of all Cuban immigrants (2017-21 ACS, MPI) ≈ 1.27 M of Pew's 1.67 M (2024) [S/I]; 1,621,352 Cuban Americans 2023 [S: Wikipedia]; 60% of Cuban immigrants in greater Miami, 6% in Tampa [S: MPI] | Holds the bulk of the ~342-355 k pending CAA cases [I]; 80% of CHNV arrivals landed here [S]; active mandamus/class litigation in both S.D. and M.D. Fla. [S] |
| **Texas** | Houston, Dallas (also San Antonio, Austin) | Houston 18 mo; Dallas 13.5 mo | Aug 2026 [S: yiminshuju.com] | 5% of Cuban immigrants (MPI) ≈ 84 k [S/I]; up to 140 k Cuban Americans 2024 [S: Wikipedia] | Houston and Dallas were the main Texas CHNV arrival airports [S]; Houston flagged for chronic interview backlogs [S] |
| **New Jersey** | Newark (covers Elizabeth, Union City, West New York) | Newark 22 mo (slowest in table) | Aug 2026 [S] | 3% of Cuban immigrants ≈ 50 k [S/I] | Oldest non-Florida Cuban enclave (Hudson County) [T] |
| **Kentucky** | Louisville | Louisville 12.5 mo (fastest in table) | Aug 2026 [S: aggregator] | No ACS count found today; 9,190 Cubans in Louisville metro (2014 ACS) [S: NBC]; ~8% of KY foreign-born are Cuban (2023 blog) [S]; KY HR28 (2026) claims >50,000 [S, legislative claim] | Fastest-growing Cuban community outside Florida [S]; pull B05006 for KY and CBSA 31140 |
| **Nevada** | Las Vegas | Las Vegas 19 mo | Aug 2026 [S] | No count found; ranked #1 non-Florida metro by Cuban share in 2014 [S: NBC]; 483 CHNV flight arrivals Jan-Aug 2023 (#14) [S] | Historically under Phoenix District [S: 2012 list] |
| **North Carolina** | Charlotte (also Raleigh-Durham) | Charlotte 18 mo | Aug 2026 [S]; a second source says "well under a year" [S, conflict] | Not found today | Growing Cuban presence (anecdotal) [T] |
| **Georgia** | Atlanta | Atlanta ~16.5 mo | 2026 [S: aggregator] | Not found today | — |
| **New York** | New York City, Brooklyn, Queens | NYC historically 20-22 mo; Brooklyn 18-40 mo range | 2026 [S: lighthousehq.com; immigrationtimes.org] | NY metro 5% of Cuban immigrants (MPI, shared with NJ) [S] | — |
| **Other** (IL, MA, AZ, CA, MN, IN, TN, OK, NE, MO) | Chicago, Boston/Lawrence, Phoenix, Los Angeles, Minneapolis, Indianapolis, Nashville, Oklahoma City, Omaha, Kansas City | Boston historically ~7.5 mo [S: lighthousehq]; others not reported today | 2026 | Small Cuban populations | Ship full office list from the USCIS tool [T] |

---

## 9. Open questions and gaps (for the data-sources and litigation agents)

1. **Does the live USCIS processing-times tool have a CAA-specific I-485 row, or only employment/family/other?** Determines whether office-level CAA data exists at all. [T: likely no CAA row]
2. **Exact current addresses and county/ZIP jurisdictions** for Hialeah, Kendall, Oakland Park, Hollywood (if it exists), West Palm Beach, Orlando, Jacksonville, Fort Myers, Louisville, Las Vegas, Dallas, Charlotte, Atlanta — all [T] today; read from uscis.gov field-office pages when network access is available.
3. **The Cuba variable id in B05006/C05006 per ACS vintage** (resolve by label at runtime).
4. **Cuban-only CHNV settlement by state.** DHS/OHSS may publish CHNV data by sponsor state; nothing surfaced today.
5. **USCIS per-office CAA receipts/approvals/pending.** USCIS "Immigration and Citizenship Data" may publish I-485 counts by field office [T, uncertain]; if so, it is the best geographic denominator.
6. **Reconciling the 143 vs 129 plaintiff counts and whether a preliminary injunction was denied** in *Acosta Reynoso v. USCIS* (8:26-cv-1314, M.D. Fla.).
7. **Exact date and scope of the June 2026 ruling** that annulled the 19/39-country hold for Cubans (CiberCuba says 5 June 2026; Cubanet confirms a ruling but no date was seen).
8. **Whether Hialeah/Kendall/Oakland Park times differ materially from Miami's** — no 2026 data seen; needs the official tool or crowd data.

---

## Sources

Every URL returned by today's searches that was used above (search-result titles/summaries only; pages were not fetched).

**USCIS / government**
- https://www.uscis.gov/sites/default/files/document/forms/i-485.pdf
- https://www.uscis.gov/forms/all-forms/direct-filing-addresses-for-form-i-485-application-to-register-permanent-residence-or-adjust-status
- https://www.uscis.gov/about-us/find-a-uscis-office/international-immigration-offices
- https://www.uscis.gov/sites/default/files/document/data/7%20117%20-%20Domestic%20Map%2001042021%20(002).pdf
- https://www.uscis.gov/sites/default/files/document/outreach-engagements/DistrictOffices-updated_10-1-12.pdf
- https://www.uscis.gov/sites/default/files/USCIS/Outreach/Notes%20from%20Previous%20Engagements/2011/December%202011/District%20Office%20Mailing%20Addresses.pdf
- https://www.uscis.gov/about-us/organization/directorates-and-program-offices/refugee-asylum-and-international-operations-directorate-raio
- https://www.uscis.gov/humanitarian/oaw-circuit-ride-locations
- https://projectcitizenship.org/wp-content/uploads/2015/01/USCIS-District-Offices.pdf
- https://api.census.gov/data/2023/acs/acs1/variables/C05006_055M.html
- https://api.census.gov/data/2024/acs/acs1/variables/C05006_055M.html
- https://api.census.gov/data/2019/acs/acs1/variables/B05006PR_026EA.html
- https://apps.legislature.ky.gov/recorddocuments/bill/26RS/hr28/orig_bill.pdf
- https://www.leagle.com/decision/infdco20260731b45 (Acosta Reynoso v. USCIS, 8:26-cv-1314, M.D. Fla., order of 30 Jul 2026)

**Field offices, routing, interviews (practitioner / Q&A)**
- https://www.hackinglawpractice.com/national-benefits-center-processing/
- https://www.justanswer.com/immigration-law/pjgnf-attorney-live-boston-i-485-moved-field.html
- https://www.justanswer.com/immigration-law/rv8e8-immigration-questions-when-case-move-field.html
- https://www.lawfully.com/resources/everything-you-want-to-know-about-uscis-case-transfer
- https://www.rnlawgroup.com/decoding-usciss-processing-time-and-case-status-updates-for-employment-based-adjustment-of-status-applications/
- https://hsdimmigrationlawyer.com/employment-based-green-card-processing-update-aos-applications-getting-transferred-to-uscis-field-offices-via-national-benefits-center/
- https://opensphere.ai/immigration-resources/field-office-vs-service-center-who-controls-my-i-485-timeline
- https://www.lawfirm4immigrants.com/?p=53042 (Tampa field office, counties served, ZIP locator)
- https://en.wikipedia.org/wiki/USCIS_West_Palm_Beach_Field_Office
- https://www.visaverge.com/asylum-offices/miami/
- https://www.visaverge.com/asylum-offices/tampa/
- https://lluislaw.com/cuban-adjustment-act/
- https://casaislaw.com/will-the-cuban-adjustment-act-survive-proposed-immigration-changes/
- https://www.immigrationlawofmt.com/cuban-adjustment-act-new-reality-2023/
- https://bwea.com/cuban-adjustment-act-caa/
- https://visafortheunitedstates.com/visa-types/tourist-visa/us-visa-for-cuban-citizens-2026-cuban-adjustment-act-chnv-asylum-green-card/
- https://godoylawpa.com/es/areas-de-practica/ley-de-ajuste-cubano/
- https://www.demaio-law.com/en/ajustecubano

**Processing-time trackers and 2026 guides**
- https://yiminshuju.com/en/uscis-processing-times/i-485/ (Aug 2026 per-office family-based table)
- https://immigrationtimes.org/forms/i-485/
- https://immigrationtimes.org/family-based/
- https://immigrationtimes.org/green-card/
- https://uswait.com/forms/i-485
- https://waitvisa.com/us/i-485
- https://waitvisa.com/us/i-485/mem
- https://waitvisa.com/us/i-485/was
- https://visagrader.com/uscis-processing-times/i-485-eb
- https://www.novo-legal.com/immigration-law/processing-times/office/i-485-all-field-offices-131b
- https://www.lighthousehq.com/blog/i-485-processing-times
- https://www.lighthousehq.com/blog/uscis-processing-times-2026
- https://www.lighthousehq.com/blog/i-130-and-i-485-concurrent-filing
- https://www.lighthousehq.com/blog/form-i-485
- https://www.beyondborderglobal.com/resources/i-485-processing-time----what-recent-uscis-data-shows
- https://www.immigrationdirect.com/blog/form-i-485-processing-time/
- https://immiva.com/blog/i-485-processing-time
- https://immigrationcopilot.com/blog/i-485-processing-time-2026-employment-based
- https://orangelaw.us/blogs/immigration-law/i-485-processing-time/
- https://vasquezlawnc.com/resources/processing-times
- https://www.boundless.com/immigration-resources/uscis-processing-times
- https://manifestlaw.com/blog/uscis-processing-times
- https://www.floridaimmigrationlawyers.net/blog/uscis-processing-times-florida-2026-mq8524r8
- https://onepeoplelaw.com/blog/green-card-processing-time-florida/

**Cuban community media (Spanish and English)**
- https://en.cibercuba.com/noticias/2026-10-06-u1-e135253-s27061-nid342034-green-card-ley-ajuste-cubano-tarda-casi-ano-tiempo
- https://en.cibercuba.com/noticias/2026-10-03-u1-e208574-s27061-nid341832-admitir-consumo-entrevista-inmigracion-puede
- https://www.cibercuba.com/s/inmigracion-eeuu/guias/una-vez-en-eeuu/ley-ajuste-cubano
- https://www.unotv.com/us/inmigracion-us/ley-de-ajuste-cubano-las-residencias-aprobadas-caen-mas-de-99/
- https://www.cubaenmiami.com/residencia-para-cubanos-abogada-cuestiona-los-tiempos-de-uscis-frente-a-la-espera-que-ve-en-la-practica/
- https://www.cubaenmiami.com/residencia-por-ley-de-ajuste-cubano-tarda-mas-tiempo-de-uscis-sube-casi-un-69/
- https://www.cubaenmiami.com/residencias-de-cubanos-bajo-la-ley-de-ajuste-cubano-enfrentan-un-atraso-que-podria-extenderse-durante-anos/
- https://www.cubaenmiami.com/cubanos-podrian-enfrentar-esperas-de-hasta-24-meses-para-obtener-la-residencia-bajo-la-ley-de-ajuste-cubano/
- https://www.periodicocubano.com/expertos-advierten-sobre-demoras-de-uscis-residencias-para-cubanos-tardan-mas-de-lo-anunciado/
- https://www.periodicocubano.com/cubanos-demandan-a-uscis-por-hacerlos-esperar-anos-para-la-residencia-bajo-la-ley-de-ajuste/
- https://www.periodicocubano.com/aumenta-el-tiempo-de-procesamiento-para-obtener-la-residencia-permanente-por-la-ley-de-ajuste-cubano/
- https://www.periodicocubano.com/uscis-acelera-aprobaciones-de-residencias-por-la-ley-de-ajuste-cubano/
- https://www.periodicocubano.com/?p=793146
- https://www.directoriocubano.info/estados-unidos/demoras-residencia-ajuste-cubano-entrevista/
- https://www.directoriocubano.info/emigracion/cubanos-corte-inmigracion-pendiente-asilo-i220a-residencia-guia-2026/
- https://www.directoriocubano.info/emigracion/que-dicen-abogados-cubanos-corte-inmigracion-estados-unidos-i220a-asilo/
- https://www.directoriocubano.info/?p=147707
- https://www.cubanet.org/juez-federal-anula-politicas-de-uscis-que-congelaron-tramites-migratorios-de-cubanos/
- https://havanatimes.org/?p=196621
- https://www.cubaheadlines.com/articles/322936
- https://hoodline.com/2026/03/miami-cubans-sue-feds-over-green-card-limbo/
- https://www.visaverge.com/news/claudia-canizares-leads-lawsuit-against-uscis-over-cuban-adjustment-act-delays/
- https://oncubanews.com/en/cuba-usa/cubans-in-the-united-states/
- https://diariodecuba.com/cuba/1471508774_24688.html
- https://traceyeaton.com/?p=2552

**Population / demography**
- https://www.pewresearch.org/short-reads/2026/05/07/10-facts-about-cubans-in-the-u-s/
- https://www.pewresearch.org/fact-sheet/u-s-hispanics-facts-on-cuban-origin-latinos/
- https://www.migrationpolicy.org/article/cuban-immigrants-united-states
- https://www.migrationpolicy.org/article/cuban-immigrants-united-states-2021
- https://www.migrationpolicy.org/journal/spotlight/cuban-immigrants-united-states
- https://www.migrationpolicy.org/print/17779
- https://cri.fiu.edu/cuban-american/profile-of-cubans-in-the-united-states/cubans-in-the-us-2023.pdf
- https://cri.fiu.edu/_assets/docs/cubans-in-florida.pdf
- https://en.wikipedia.org/wiki/Cuban_Americans
- https://www.westernunion.com/blog/en/us/beyond-miami-where-do-cuban-immigrants-live-in-the-u-s/
- https://www.nbcnews.com/news/latino/fastest-growing-immigrant-group-louisville-cuban-americans-n630966
- https://www.jetpunk.com/user-quizzes/1302566/us-cities-with-the-highest-cuban-immigrant-population (unreliable; listed for completeness)

**CHNV program and settlement**
- https://en.wikipedia.org/wiki/Parole_for_Cubans,_Haitians,_Nicaraguans,_and_Venezuelans
- https://www.audacy.com/wccoradio/news/national/most-migrants-paroled-by-biden-are-heading-to-this-state
- https://threadreaderapp.com/thread/1785400318135836950.html
- https://twitchy.com/print/2395745
- https://www.visaverge.com/news/chnv-program-sets-deadline-for-over-half-a-million-to-leave-u-s/
- https://dallasexpress.com/national/over-500000-illegal-immigrants-granted-entry-under-unfrozen-parole-scheme/
- https://www.refugeesinternational.org/perspectives-and-commentaries/setting-the-record-straight-on-chnv/

**2025-2026 adjudication holds (Cuba included)**
- https://www.grossmanyoung.com/blog/high-risk-country-processing-holds/
- https://www.boundless.com/blog/uscis-expands-immigration-application-freeze-39-countries
- https://oiss.yale.edu/node/8119
- https://www.magrath.co.uk/resources/news/expansion-of-adjudication-hold-policy-for-travel-ban-countries/
- https://ischo.mit.edu/news/uscis-places-hold-on-processing-benefit-applications-or-on-behalf-foreign-nationals-39-high
- https://aut.cua.cloud.sitefinity.com/services/international-student-and-scholar-services/updates/immigration-updates/u.s.-citizenship-immigration-services-(uscis)-adjudication-pause-April2026
- https://www.bates.edu/global-education/immigration-news
- https://mahometdaily.com/uscis-freezes-immigration-applications-for-nationals-of-39-countries-under-new-security-policy/ (tiering of Cuba inconsistent with other sources)
