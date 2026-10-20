# 06 — Community-reported and third-party case-timeline data for CAA I-485 and related EADs

**Project:** Cuban Immigration Tracker (CAA Tracker)
**Research date:** 2026-10-20 (all URLs accessed or surfaced on this date)
**Audience:** project owner / app designers (smart non-lawyers)
**Status:** first pass; see §10 "Open questions" for what still needs hands-on verification

---

## 0. How this research was done, and its limits (read this first)

**Method.** Roughly 45 web searches (English and Spanish) plus direct reads of open-source
tracker repositories on GitHub. The research sandbox's egress proxy **denied direct
connections to almost every non-GitHub host** (trackitt.com, lawfully.com, reddit.com,
visajourney.com, inmigreat.com, casestatusapi.com, cibercuba.com, uscis.gov, egov.uscis.gov,
courtlistener.com, play.google.com, apps.apple.com, youtube.com, etc. all returned a
policy-denial 403 at the CONNECT step). The per-turn web-search budget was then exhausted.
Consequences:

- Facts below come from (a) **search-engine result excerpts that quote the page text**,
  (b) **full READMEs and source files read from GitHub**, and (c) prior knowledge that is
  explicitly flagged as unverified.
- **No Reddit thread could be opened.** The `site:reddit.com` operator returned no Reddit
  results in this environment, and reddit.com is blocked by the proxy. The "concrete
  reported timelines" table (§5) is therefore thin; §7 gives an exact protocol for
  collecting those timelines when a normal internet connection is available.
- Terms-of-service pages for Trackitt and Lawfully could not be opened; VisaJourney's ToS
  text was quoted in a search excerpt.
- **Verification pass (2026-10-20).** A fact-checker ran 7 searches and the editor 2 more
  (*Noem v. Doe* / CHNV litigation status; CAA public-charge exemption). Corrections are
  marked "Corrected/Verified/Resolved 2026-10-20" inline and summarised in §12. Nothing on
  uscis.gov, federalregister.gov or courtlistener.com could be opened in this pass either.

**Confidence legend used throughout**

| Tag | Meaning |
|---|---|
| **[V]** | Verified: exact text/number seen in a page excerpt or in a file read from GitHub |
| **[L]** | Likely: reported by a reputable secondary source, or consistent across ≥2 sources, but primary page not opened |
| **[U]** | Unverified / inferred / from prior knowledge; must be checked before relying on it |
| **[S]** | (verification pass 2026-10-20) Stated in a web-search result seen that day; URL cited |
| **[T]** | (verification pass) From training knowledge; not confirmed by any search today |
| **[I]** | (verification pass) Inferred by the editor from the sources above |

---

## 1. Executive summary

1. **No existing public tracker isolates Cuban Adjustment Act (CAA) I-485 cases.** Trackitt
   splits I-485 into *family-based* and *employment-based* trackers with a free-text
   "Nationality" column, Lawfully keys on form type + service center + filing date, and
   VisaJourney is organised around K-1/CR-1/IR-1 visa paths. A CAA parolee filing a
   stand-alone I-485 under INA/Pub. L. 89-732 does not fit any of their category schemas.
   **The app would be the first structured CAA-specific crowdsourced timeline dataset.** [L]
2. **The richest real-time signal for Cubans today is Spanish-language media, not trackers.**
   CiberCuba, 14ymedio, Directorio Cubano, Cuba en Miami, Periódico Cubano, Mario Pentón and
   La Nación all publish USCIS quarterly/monthly CAA numbers within days of release, and
   Cuba en Miami runs broadcasts with a "data specialist" (Ángel Leal) and cites a
   community platform called **"Immigrate Case Tracker"** that reported >1,200 CAA approvals
   between June and August 2026. [L] These outlets are the obvious distribution and
   validation partners for the app.
3. **Key aggregate numbers the community is already repeating (all from USCIS data as
   reported by media, FY2026):** median CAA I-485 processing time **11.8 months**
   (Oct 1 2025–Jul 31 2026, media figure; the official historic table's **Aug 30 2026 cut
   already shows 12.3 months** [S, §12]) vs 7.0 (FY2025), 4.6 (FY2024), 3.3 (FY2023),
   5.5 (FY2022), 8.5 (FY2021); Apr–Jun 2026:
   **139 approved / 447 denied / 586 decided** (23.7 % approval of decisions), **342,360
   pending** at June 30 2026 ("more than 342,000" confirmed [S]; exact figure [U]); Jan–Mar
   2026: 50 approved / 45 denied; January 2026: 15
   approvals; July 2026: 308 approvals; Apr–Jun 2024: 49,965 approvals (−99.7 %). [L]
   (One competing figure of **355,371** pending Cuban I-485s at June 30 2026 appears on
   Inmigreat; the discrepancy is flagged in §5.3.)
4. **Legally safe ingestion paths are narrow.** Trackitt/Lawfully/VisaJourney have no export
   or API; VisaJourney's ToS bars robots "for any unauthorized purpose" and grants itself a
   perpetual licence over posts; Lawfully is a closed app. Reddit has an official API with
   non-commercial free tier (prior knowledge, [U]). The recommended approach is
   **(a) first-party crowdsourcing inside the app, (b) optional user-pasted myUSCIS API
   JSON (as the open-source trackers do) to capture exact milestone dates, (c) manual,
   attributed, periodic transcription of published media statistics, and (d) the official
   USCIS processing-times JSON API for the prior.** [L]
5. **The community has already converged on a milestone vocabulary** (parole/I-94 date,
   "un año y un día", I-485 receipt date, biometrics, EAD (c)(9) approval, "silent update",
   interview, RFE, "card is being produced", approval; plus field office/city, lawyer vs
   self-filed, and pause/mandamus status). §8 turns that into a recommended entry schema.

---

## 2. Landscape map

| # | Source | Type | CAA-separable? | Volume (Cuban CAA) | Structure | Ingestion path | Legal/ToS posture | Value to app |
|---|---|---|---|---|---|---|---|---|
| 1 | Trackitt (i485-fb / i485-eb) | Crowdsourced tracker, web | No (free-text nationality) | Unknown; EB-heavy, Indian/Chinese-dominated user base [L] | Tabular, many columns | None (HTML only) | ToS not retrievable [U] | Low for data; high as a **field-schema reference** |
| 2 | Lawfully Case Tracker | Mobile app + "Case Analysis Pro" + public "USCIS Status Explorer" pages | No (form + category + service center) | Unknown; claims registered cases since 1 Dec 2018 [V] | Proprietary | None | Privacy/ToS not retrievable [U] | Low for data; **benchmark for prediction UX** |
| 3 | casestatusapi.com / immigrationapi.com / casetracker.xyz | Paid/free case-status utilities built on USCIS internal JSON | No | Claims "crowdsourced timelines" [V] but unquantified | Proprietary | Paid API (own case only) | Third-party, not USCIS [V] | Low |
| 4 | Open-source trackers (humanstack, uscis-tracker.github.io, armanckeser, gentlespoon) | Client-side JSON parsers | N/A (per-user) | 0 (no aggregation by design) [V] | **ELIS event-code JSON** | MIT-licensed code; **copy the JSON-paste pattern** | Fine | **High as an ingestion technique** |
| 5 | VisaJourney | Forum + member timelines | No (visa-path based) | Handful of Cuban K-1/CR-1 cases; ≥1 CHNV parolee [V] | HTML tables (k1list.php etc.) | None; a 2018 scraper exists | ToS bars robots "for any unauthorized purpose" [V] | Low |
| 6 | Boundless / myProgress explainer / Track My Visa Now | Processing-time republishers | No | 0 | Official data repackaged | None needed; use USCIS directly | n/a | Low |
| 7 | ImmigrationHelp | Not found | — | — | — | — | — | Open question |
| 8 | Inmigreat analytics | Third-party analytics on USCIS data | **Yes** ("Cuban" share of pending) [V] | Aggregate only | Dashboard | Unknown (no API seen) | Unknown | Medium (cross-check) |
| 9 | "Immigrate Case Tracker" (Cuban community platform cited by Cuba en Miami) | Crowdsourced CAA tracker [L] | **Yes** [L] | ">1,200 approvals since June" (Aug 2026) [L] | Unknown | Unknown — **contact them** | Unknown | **Potentially high** |
| 10 | Reddit (r/USCIS, r/immigration, r/cuba; r/CubanAdjustmentAct unconfirmed) | Forum | Partially (search text) | Unknown — not reachable here | Free text + common timeline format | Official Data API [U] | Non-commercial free tier [U] | Medium (seed/validate) |
| 11 | Facebook groups (e.g. "Parole Humanitario para Cubanos I-134A", >206k members in 2023) | Closed/public groups | Partially | Very large, Spanish | Free text, polls | No API for group content | Scraping prohibited by Meta ToS [U] | High for **recruiting users**, not for scraping |
| 12 | Telegram / WhatsApp channels ("Parole Humanitario" channel, WhatsApp communities) | Chat | Partially | Large, Spanish | Free text | Telegram Bot API for channels you run | Fine for own channel | High for **distribution/alerts** |
| 13 | Spanish-language media + YouTube lawyers (CiberCuba, 14ymedio, Cuba en Miami, Periódico Cubano, Mario Pentón, Directorio Cubano, Willy Allen interviews) | News / commentary | **Yes** (they report CAA rows of USCIS data) | Aggregate stats + anecdotes | Articles; RSS likely [U] | RSS/manual transcription, with attribution | Standard copyright; quote facts, link | **High for validation and alerts** |
| 14 | Law-firm blogs (Casais, Vasquez, Lluis, Williams, De Maio, Santos Lloyd) | Marketing content | Yes (CAA pages) | Ranges only | Prose | Manual | Fine to cite | Low-medium (priors, sanity check) |
| 15 | Litigation records (Doe v. Noem exhibits; Tampa mandamus suit of 143 Cubans — *Acosta Reynoso v. USCIS*, 8:26-cv-01314 M.D. Fla.) | Court filings | Yes | Counts + plaintiff timelines | PDFs | CourtListener/RECAP | Public record | Medium (ground truth for counts) |

---

## 3. Source-by-source assessment

### 3.1 Trackitt

**What it is.** A long-running community tracker where applicants voluntarily enter their
case and update it. Listed among green-card trackers (I-485, I-140, I-765) at
<https://gcinfo.org/useful-links/gc-trackers> [V].

**Structure (verified via page excerpts).**
- Two I-485 trackers: **I-485 (Family-based)** at
  <https://www.trackitt.com/usa-immigration-trackers/i485-fb> and **Green Card Tracker
  (I-485 EB)** at <https://www.trackitt.com/usa-immigration-trackers/i485-eb> [V].
- Family-based page lists **service center, RFE fields, interview location, name-check
  status**; EB page adds **preference category and I-140 processing type**; both track
  **fingerprint dates ("First Fingerprint Date"), RFE status, RFE reason, case transfers,
  interview fields** [V].
- **"Nationality" is a column and "Country of Chargeability" a field, both free-form, not a
  filter**; **no Cuban-specific tracker exists** [V].
- Each case has a discussion thread, e.g.
  <https://www.trackitt.com/usa-immigration-trackers/discuss/i485-eb/15099> [V].
- A law-firm analysis (<https://www.usavisalaw.com/immigration-blog/i485-trackitt-h1b-trackitt-tracker-vs-uscis-processing-time>)
  describes a typical I-485 entry as including "the employment-based category,
  service-center information, biometrics dates, RFE activity, and interview information"
  and warns that the dataset "depends on which users choose to submit cases, how accurately
  they enter information, and whether they return to update their records" [V].

**Can CAA cases be separated?** Only by free-text filtering on Nationality = "Cuba" within
the *family-based* tracker (CAA filers would most plausibly self-classify there, but there is
no CAA option). Expect very few entries: Trackitt's user base is historically
employment-based and Indian/Chinese-dominated [L, from the EB focus of its own pages and the
usavisalaw analysis]. **Inference [U]:** the CHNV Cuban cohort (2023–2025 arrivals,
Spanish-speaking, mostly in Florida) is unlikely to be using Trackitt at all.

**Export / API.** None found on any page excerpt; the site serves HTML tables only [L].

**ToS on scraping.** Could not be retrieved (site blocked from sandbox; searches did not
surface the ToS). Treat as **unknown — do not scrape until read** [U].

**Verdict.** Useful as a *schema reference* (its column set is a good checklist, see §8),
not as a data source for this app.

### 3.2 Lawfully

**What it is.** "Lawfully Case Tracker" (iOS id 1435063223; Android
`com.lawfully.lawfully_ai_tracker`) tracks USCIS, NVC and EOIR cases and sells a
prediction feature, **Case Analysis Pro**.
- App Store: <https://apps.apple.com/us/app/lawfully-case-tracker/id1435063223>
- Google Play: <https://play.google.com/store/apps/details?id=com.lawfully.lawfully_ai_tracker&hl=en_US>
- Product pages: <https://www.lawfully.com/case-tracker>,
  <https://www.lawfully.com/resources/start-case-analysis-pro>,
  <https://www.lawfully.com/resources/what-is-uscis-case-tracker>
- Medium posts by the company:
  <https://lawfully-official.medium.com/new-feature-case-analysis-pro-d03977c41f54>,
  <https://lawfully-official.medium.com/what-distinguishes-case-analysis-pro-from-other-case-trackers-9d1fad1a1542>,
  <https://lawfully-official.medium.com/start-case-analysis-pro-and-stay-updated-with-your-case-status-fcd23dba516c>

**How its "processing time" works (company's own words, via excerpts) [V].**
- Predictions "rest on registered case data in Lawfully Case Tracker from December 1st,
  2018 to present."
- It "counts the number of cases with similar application file dates to your case behind
  and ahead of yours"; comparisons use "the same form type, service center, and filing
  date."
- "Uses data we have collected along with our AI technology to predict approval timing and
  RFE probability"; shows "Chance of Decision by percentage" as a range.
- Caveat in their own text: "prediction is based on the past data and therefore the result
  might be different from today's cases, if the trend suddenly changed" — exactly the
  failure mode of the 2025–2026 CAA freeze.
- A user review complains the estimate lags ("still showing 15 months while it was changed
  to 15.5 last week") [V].
- The Play listing says Lawfully "provides case status information that is publicly
  available from USCIS, State Department, and EOIR status pages" [V].

**Public data pages.** Lawfully publishes SEO pages, "USCIS Status Explorer", keyed by
status message and parameterised by `caseType` and `caseCategory`, e.g.
<https://www.lawfully.com/data/uscis-status-explorer/case-was-received?caseType=I-765&caseCategory=All+other+applications+for+employment+authorization>
and
<https://www.lawfully.com/data/uscis-status-explorer/case-was-updated-to-show-fingerprints-were-taken?caseType=I-485&caseCategory=EB1-3> [V].
Categories seen: `EB1-3`, `H-1B`, `All other applications for employment authorization`.
**No "Cuban" category was observed** [L]; whether CAA cases sit in an "other" bucket is an
open question.

**Privacy / data policy.** Policy at `lawfully.com/privacy-policy` and ToS at
`lawfully.com/terms-of-service` (both unreachable from the sandbox) [U]. Google Play safety
section: may share financial info with third parties; collects app performance data and
device IDs; encrypts data in transit; supports deletion requests [V].

**Export / API.** None advertised [L].

**Verdict.** Not a data source. It is the **UX benchmark** for the estimator ("cases ahead
of/behind you", decision-chance curve) and a cautionary example (model lag during regime
changes).

### 3.3 Other case-status apps and open-source trackers

These do **not** crowdsource timelines; they read the applicant's own case data. They
matter because they document the **myUSCIS internal JSON and its event codes**, which is
the most precise way for the app to capture milestone dates.

| Tool | What it does | Notes (source) |
|---|---|---|
| **humanstack/uscis-case-tracker** <https://github.com/humanstack/uscis-case-tracker> | MIT; 27★/50 forks (created 2025-08-29, updated 2026-10-11); 100 % client-side; user logs into myaccount.uscis.gov, opens "API tabs", pastes JSON; stores snapshots in localStorage; **"Export for Reddit"** masks receipt numbers (`IOE09326XXXXX`); decodes `FTA0` (biometric/other actions completed), `SA` (status adjusted = approved), `FTA1` (supervisor review); distinguishes officer (business-hours) vs system updates | README read in full [V] |
| **uscis-tracker/uscis-tracker.github.io** <https://github.com/uscis-tracker/uscis-tracker.github.io> | Created 2026-04-21; parses JSON from `https://my.uscis.gov/account/case-service/api/cases/{RECEIPT}`; decodes **60+ event codes** from NIEM 5.0 `scr:BenefitDocumentStatusCategoryCodeSimpleType` (<https://niem.github.io/model/5.0/scr/BenefitDocumentStatusCategoryCodeSimpleType/>): Receipt (`IAF`,`IAA`,`AALB`), Background checks (`FTA0`,`FTA1`,`FNB`,`QAA`), Interview (`FJ`,`HG`,`FM`,`IM`), Processing (`FT0`,`TA`,`FR`), Holds (`FS`,`KA`,`KC`), Approved (`DA`,`IEA`,`IEC`), Green card (`LAA`,`LDA`,`LEA`), RFE (`FBA`,`IK`,`HA`), Denied (`EA`,`IFA`,`FE`), Closed (`EX`,`EN`,`EZ`); fields: receipt, form type, applicant name, filing date, filing channel, flags (premium, action required, evidence requests), notices with interview date/time; "silent update" detection | README read in full [V] |
| **armanckeser/uscis-tracker** <https://github.com/armanckeser/uscis-tracker> | Created 2026-09-30; bookmarklet reads all household cases from a signed-in myUSCIS tab; diffs snapshots to catch silent updates; "place in line" from Visa Bulletin; self-host with push | README read [V] |
| **wangchao92/uscis-api-case-tracker** <https://github.com/wangchao92/uscis-api-case-tracker> | Selenium keeps a browser logged in with the user's USCIS **credentials and Gmail app password**, polls hourly | README read [V] — an anti-pattern for a public app (credential custody) |
| gentlespoon/USCIS-Case-Status-Checker | 32★, archived | [V] |
| pedrocastellanos/uscis-case-tracker-bot | Telegram bot, topics `parole`, `uscis` (2023) | repo listing [V]; README 404 |
| **casestatusapi.com** <https://www.casestatusapi.com/> | Free check; **$2.99 one-time 90-day report; Premium $7.99/mo or $79/yr**; "auto-fetches USCIS internal API raw JSON"; `/timelines` page claims "real crowdsourced processing times from recent applicants" plus AI estimates; guides at `/guides/uscis-internal-api-guide`, `/guides/uscis-api-links`; states it is "not affiliated with… USCIS" | excerpts [V]; crowdsourced sample size unknown [U] |
| immigrationapi.com | Developer API, tiers $0–$299/mo | excerpt [V] |
| casetracker.xyz | "Free Privacy-Focused Immigration Case Status API Tracker" | listing only [V] |
| mycaseshub.com | "USCIS Case Status Checker & Real-Time Case Tracker" | listing only [V] |
| Mobile: "US Case Tracker" (`com.uscis`), "Case Tracker: US Immigration" (`us.casetracker.uscis`), "Case Now: USCIS Tracker" (iOS 6752526606), "USCIS Case Tracker" (iOS 6727012835) | Store listings advertise timeline views / estimates; data provenance not stated | [V] listings exist; [U] everything else |
| **Official USCIS Case Status API** <https://developer.uscis.gov/apis> | For "customers and their representatives who require regular access". **Corrected 2026-10-20:** returns more than status text — current status, form type, submission date and the historical status timeline, in English and Spanish; OAuth 2.0 client-credentials; sandbox `api-int.uscis.gov`, production `api.uscis.gov`; **rate-limited to 5 TPS and 1,000 requests/day**, which rules out server-side polling for a crowdsourced user base | excerpt [V]; details/limits [S] <https://github.com/marcodallastella/USCIS-check-case-status/blob/main/README.md> |
| **Official processing-times JSON endpoints** (undocumented but used by scrapers): `https://egov.uscis.gov/processing-times/api/forms`, `/api/formoffices/{form}`, `/api/processingtime/{form}/{office}` | Found in `ajduberstein/uscis-wait-times/fetch.py` and `Data4Democracy/immigration-connect/uscis-processing-time/uscis-processing-time-api.py` | source read [V]; whether endpoints still work today [U] |
| **Historic national medians** <https://egov.uscis.gov/processing-times/historic-pt> | Has a row **"Based on Cuban Adjustment"** (FY2021–FY2026, latest cut "up to August 30, 2026"); excerpt showed FY2026 family-based 6.2 mo, EB 6.0, refugee-based 7.8, asylum-based 20.2. **Cuban row, fact-check 2026-10-20 [S]:** FY2021 **8.5**, FY2022 **5.5**, FY2023 **3.3**, FY2024 **4.6**, FY2025 **7.0**, FY2026 **12.3** (Aug 30 2026 cut). The 11.8 reported by media is the Jul 31 2026 cut; USCIS says the table changes with each update, so **store the cut date with every ingested median** | [V] row exists; values [S]; the 11.8-month figure is from media (§5.3) |

**Implication.** The app can offer an optional "paste your case JSON" (or share-sheet
import) flow exactly like humanstack / uscis-tracker.github.io: the user signs in to
myUSCIS themselves, opens the case-service API URL, and pastes the JSON; the app parses
event codes into milestone dates locally, masks the receipt number, and (with consent)
submits the *derived milestones* — not the raw JSON — to the crowdsourced dataset. This
gives exact dates (receipt, biometrics `FTA0`, interview `FJ/HG`, RFE `FBA/IK`, approval
`DA/SA`, card `LAA/LDA/LEA`) with far less entry error than manual forms. The app must
**never** hold USCIS credentials (contrast wangchao92).

### 3.4 VisaJourney

- Terms of Service <https://www.visajourney.com/terms-of-service/> [V, via excerpt]: users may not
  "Use any robot, spider, site search/retrieval application, or other device to retrieve or
  index any portion of the Service or collect information about users for any unauthorized
  purpose"; posting grants VisaJourney "a royalty-free, perpetual, irrevocable,
  non-exclusive license." No definition of "authorized" was visible.
- Timeline pages are per-member (`/timeline/profile.php?id=…`) and list pages such as
  `k1list.php` are paginated HTML tables with a country filter. A 2018 scrapy spider
  (<https://github.com/stenioaraujo/visajourney>) captured these columns for K-1: Names,
  Country, Service Center, Xfer?, Consulate, I-129F Sent/NOA1/RFE/NOA2, NVC Received/Left,
  Consulate Received, Packet 3/4, Interview, Visa Received, US Entry, Marriage, "Total Days
  File ➙ Int.", Comments, Updated Last [V, source read]. The author disclaims any use
  "against Visa Journey's Terms of Use". A commercial vendor also markets VisaJourney
  scraping (<https://www.minexa.ai/post/how-to-scrape-immigration-and-visa-data-from-visa-journey-using-the-minexa-api>) [V].
- Cuban content found [V, excerpts]: member timelines for Cuban beneficiaries processed via
  third-country posts (Guyana, Armenia, Switzerland); I-485 outcomes of **126 days**,
  **190 days** (decision 2018-06-19), **514 days** (K-1 AOS); one member "Abandoned i-129f
  because received approval for i-134a Cuban Humanitarian Parole" and then had a **work
  permit approved in about 24 days**. Profile IDs surfaced: 16557, 284717, 104004, 400016,
  270579, 200748, 223763, 293983 (not individually opened).
- **Verdict.** Marriage-visa oriented; a handful of Cuban cases; scraping is contractually
  risky. Not worth ingesting. Its column design (paired "sent/received" dates and derived
  "days between" fields) is a good pattern.

### 3.5 Boundless, ImmigrationHelp and the processing-time aggregators

- **Boundless** republishes USCIS processing times and explains myProgress
  (<https://www.boundless.com/blog/you-can-now-track-your-work-and-travel-permit-wait-time-online/>,
  <https://www.boundless.com/lp/importance-of-immigration-processing-times>,
  <https://webflow.boundless.com/blog/understanding-uscis-myprogress>) [V]: myProgress
  extended to I-765 and I-131 (already I-130, N-400, I-90); Boundless refreshes its green
  card/naturalization times monthly; partner "Track My Visa Now" supplies daily data for
  I-129F/I-130; myProgress estimates are "based on case type and historical data" and not
  guaranteed. **No crowdsourced or Cuban data.** Note that **I-485 is not among the
  myProgress forms listed**, so CAA applicants have no official personal estimate [L].
- **ImmigrationHelp.** Searches returned nothing for an ImmigrationHelp tracker [V]. Open
  question (§10).
- **Aggregators that repackage USCIS office-level times** (none crowdsourced, none
  CAA-specific; useful only to see how others present official data):
  immihelp I-485 tracker <https://www.immihelp.com/i-485-tracker/> (user-submitted, legacy),
  mygcvisa <https://www.mygcvisa.com/tracker/browse.aspx?c=i485>,
  trackmyvisa <https://trackmyvisa.com/i485>, i485tracker.com,
  immigrationtimes.org <https://immigrationtimes.org/forms/i-485/>,
  novo-legal <https://www.novo-legal.com/immigration-law/processing-times/i-485>,
  plainvisa, immiva, waitvisa, immigrationtoolhub, manifestlaw, visabulletin.ai,
  wantavisa <https://www.wantavisa.com/processing-times.php> (lists "CAA 5.5 months" in a
  July 2026 table — stale) [V]. Their ranges disagree widely (9–42.5, 6.5–58, 6–75.5
  months) because of different snapshot dates and methods [V].

### 3.6 Inmigreat and "Immigrate Case Tracker" (Cuban-relevant analytics)

- **Inmigreat** <https://www.inmigreat.com/en/analytics/i-485/> shows Cuban cases as
  **"355,371 · 22.4% of pending cases"** with a **"95.2% approval rate"** [V, excerpt]. The
  period for the approval rate is not visible; it is inconsistent with the 23.7 %
  decision-approval share for Apr–Jun 2026 and almost certainly reflects a longer or
  earlier window. A Spanish excerpt (via La Nación/Directorio search) also says "hasta el
  30 de junio de 2026, la categoría cubana acumulaba 355,371 solicitudes… pendientes" [L],
  while CiberCuba/Directorio report **342,360** pending at the same date [L]. See §5.3.
- **"Immigrate Case Tracker."** A Cuba en Miami article (Aug 2026,
  <https://www.cubaenmiami.com/aumentan-las-aprobaciones-de-green-card-bajo-la-ley-de-ajuste-cubano-estos-son-los-casos-que-se-estan-moviendo-mas-rapido/>)
  attributes to "Ángel, representante de la plataforma Immigrate Case Tracker" data on
  **more than 1,200 approvals since June 2026** and which cases "are moving faster" [L].
  Separately, Cuba en Miami broadcasts feature **Ángel Leal, "especialista en datos
  migratorios"** explaining the pending-case surge since 2023
  (<https://www.cubaenmiami.com/mas-de-327000-cubanos-esperan-la-residencia-el-enorme-atasco-que-enfrenta-la-ley-de-ajuste-cubano/>) [L],
  and La Nación quotes an Ángel Leal on the new public-charge rule
  (<https://www.lanacion.com.ar/estados-unidos/visas-y-tramites/confirman-nueva-regla-del-uscis-que-complicaria-a-cubanos-con-green-card-en-tramite-por-ley-de-nid28092026/>) [L].
  Whether "Immigrate Case Tracker" = Inmigreat, and whether it is a crowdsourced tracker
  of individual CAA cases (which would make it the closest existing competitor/partner),
  **could not be verified** [U]. **Action:** open the article, find the platform's URL,
  and contact them about data sharing or cross-validation.

### 3.7 Reddit

**What could be established here.** Nothing from reddit.com itself (blocked; `site:` search
ineffective). Indirect evidence that r/USCIS is where I-485 timelines are shared: the
humanstack tracker's headline feature is **"Export for Reddit"** with receipt-number
masking [V].

**Subreddits to target** (names from prior knowledge, [U] for current activity):
r/USCIS (largest; weekly/megathreads by form; users post "Timeline" comments in a
semi-standard format: `Filed … / NOA … / Bio … / EAD … / Interview … / Approved …` and
often the field office), r/immigration, r/cuba, r/Cubans, r/greencard, r/i485,
r/AdjustmentOfStatus [U]. **r/CubanAdjustmentAct: existence not confirmed** [V-negative].

**Expected volume and bias.** Cuban CHNV parolees are predominantly Spanish-speaking and
Florida-based; Reddit is English-dominant, so expect a small, atypical sample (younger,
more English-fluent, more likely self-filed and tech-savvy; over-representation of
problem cases because people post when stuck) [U, inference].

**Ingestion.** Use the official Reddit Data API (OAuth; free tier intended for
non-commercial use with rate limits around 100 queries/min per client; commercial or
high-volume use needs Reddit's approval — prior knowledge, [U]; check
<https://www.redditinc.com/policies/data-api-terms> and
<https://support.reddithelp.com/hc/en-us/articles/16160319875092>). Do not scrape HTML.
Store only derived milestone dates + post permalink; never usernames.

**Search protocol for when a normal connection is available** (see §7 for the extraction
schema): queries `"Cuban Adjustment"`, `"CAA" "I-485"`, `"ajuste cubano"`, `"Cuban" "parole"
"I-485"`, `"CHNV" "I-485" "Cuban"`, `"c09" OR "c11" "Cuban"` across the subreddits above,
restricted to 2024-01-01 → today, sorted by new; include comment search (Pushshift-style
archives are no longer public [U]).

### 3.8 Facebook groups, Telegram and WhatsApp

- **Facebook.** The group **"Parole Humanitario para Cubanos I-134A"** had **"más de 206
  mil miembros"** when Periódico Cubano reported a poll run there (~2023,
  <https://www.periodicocubano.com/uscis-tiene-buenas-noticias-para-los-cubanos-que-aplican-al-parole-humanitario/>) [V].
  CubaNet (<https://www.cubanet.org/cubanos-crean-grupos-virtuales-para-compartir-informacion-sobre-parole/>)
  and Multicuba (<https://www.multicuba.com/blog/parole-humanitario-ultimas-noticias/>)
  describe many Facebook and WhatsApp groups created by applicants to share USCIS
  information [V]. Current names/sizes of CAA-specific groups (e.g. "Ley de Ajuste
  Cubano", "I-485 cubanos") were **not retrievable** [U]. Group content has no public API;
  Meta's terms prohibit automated collection [U, prior knowledge]. **Use: recruitment and
  polls (admins routinely run "¿cuándo aplicaste / ya te aprobaron?" polls — those poll
  results, posted publicly by admins, are a legitimate secondary statistic to transcribe
  with attribution).**
- **Telegram.** Periódico Cubano reported Cubans subscribing to a Telegram channel named
  **"Parole Humanitario"** carrying official parole news and scam warnings
  (<https://www.periodicocubano.com/cubanos-empiezan-suscribirse-a-este-canal-de-telegram-con-las-ultimas-noticias-del-parole-humanitario/>, ~2023) [V];
  no `t.me` handles surfaced [V-negative]. Telegram's Bot API lets the app run its own
  alert channel/bot cheaply; a 2023 open-source "uscis-case-tracker-bot" tagged `parole`
  shows demand in this community [V].
- **WhatsApp.** Communities exist (Multicuba) but are closed; WhatsApp Business API is
  for one-to-one messaging, not bulk — use only for opt-in alerts [U].
- **Scam risk is real and documented**: scammers used AI to impersonate attorney Willy
  Allen (CiberCuba) [L]; a viral "Approved" screenshot story circulated
  (<https://www.cubaheadlines.com/articles/333033>) [V]. The app's **verified-entry
  mechanisms** (JSON import, masked receipts, moderation) are a differentiator.

### 3.9 Spanish-language media, YouTube and lawyers who report CAA statistics

These outlets transcribe USCIS data releases within days and interview practitioners.
They are the **validation layer** (compare the app's aggregates with theirs) and the
**alert feed** (policy/court changes).

| Outlet / person | What they publish | Example URLs (2026) |
|---|---|---|
| **CiberCuba** (immigration desk; English mirror CubaHeadlines) | Quarterly CAA counts, medians, guides, lawyer interviews (Tania Costa interviews Willy Allen) | <https://en.cibercuba.com/noticias/2026-10-20-u1-e135253-s27061-nid343309-solo-139-cubanos-obtuvieron-residencia-ley-ajuste>; <https://en.cibercuba.com/noticias/2026-10-06-u1-e135253-s27061-nid342034-green-card-ley-ajuste-cubano-tarda-casi-ano-tiempo>; guide <https://www.cibercuba.com/s/inmigracion-eeuu/guias/una-vez-en-eeuu/ley-ajuste-cubano>; <https://www.cubaheadlines.com/articles/343309>; <https://www.cubaheadlines.com/articles/342034> |
| **14ymedio** | Year-over-year approval collapse (−99.7 %), quarterly approve/deny | <https://www.14ymedio.com/cuba/migracion/aprobaciones-residencia-ley-ajuste-cubano_1_1132080.html> |
| **Directorio Cubano** | Median waits, denial ratios, delay explainers with testimonials, lawyer Q&A | <https://www.directoriocubano.info/estados-unidos/residencia-ley-ajuste-cubano-espera-2026/>; <https://www.directoriocubano.info/tramites-usa/ley-ajuste-cubano-aprobaciones-negativas-2026/>; <https://www.directoriocubano.info/estados-unidos/demoras-residencia-ajuste-cubano-entrevista/>; <https://www.directoriocubano.info/cuba/cada-vez-menos-residencias-ley-ajuste-cubano-fin-sin-derogarla/> |
| **Cuba en Miami** (site + broadcasts; data commentary by Ángel Leal) | Monthly approval upticks, backlog size, "which cases move faster" | <https://www.cubaenmiami.com/residencia-por-ley-de-ajuste-cubano-tarda-mas-tiempo-de-uscis-sube-casi-un-69/>; <https://www.cubaenmiami.com/mejora-parcial-en-el-ajuste-cubano-uscis-reporta-aumento-de-aprobaciones-en-los-ultimos-dos-meses-pero-los-retrasos-siguen-siendo-altos/>; <https://www.cubaenmiami.com/aumentan-las-aprobaciones-de-green-card-bajo-la-ley-de-ajuste-cubano-estos-son-los-casos-que-se-estan-moviendo-mas-rapido/>; <https://www.cubaenmiami.com/mas-de-327000-cubanos-esperan-la-residencia-el-enorme-atasco-que-enfrenta-la-ley-de-ajuste-cubano/>; <https://www.cubaenmiami.com/residencias-de-cubanos-bajo-la-ley-de-ajuste-cubano-enfrentan-un-atraso-que-podria-extenderse-durante-anos/> |
| **Periódico Cubano** | Monthly approvals (e.g. 308 in July 2026), lawsuits, fee changes, Telegram/Facebook community news | <https://www.periodicocubano.com/uscis-rechaza-tres-de-cada-cuatro-peticiones-bajo-la-ley-de-ajuste-cubano-solo-estos-casos-fueron-aprobados/>; <https://www.periodicocubano.com/aumenta-el-tiempo-de-procesamiento-para-obtener-la-residencia-permanente-por-la-ley-de-ajuste-cubano/>; <https://www.periodicocubano.com/cubanos-demandan-a-uscis-por-hacerlos-esperar-anos-para-la-residencia-bajo-la-ley-de-ajuste/> |
| **Mario Pentón** (journalist; large YouTube/social following [U]) | Quarterly median analysis ("peor registro en seis años") | <https://www.mariopenton.com/residencia-por-ajuste-cubano-tarda-cada-vez-mas-el-plazo-alcanza-su-peor-registro-en-seis-anos/> |
| **La Nación (Argentina) US desk** | Repackages USCIS medians; quotes Ángel Leal | <https://www.lanacion.com.ar/estados-unidos/migraciones/confirmado-por-uscis-la-green-card-bajo-la-ley-de-ajuste-cubano-registra-una-demoras-de-casi-un-ano-nid03102026/> |
| **UnoTV (Mexico)** | Approval collapse, 16-month wait, Aug 24 2026 N.D. Cal. order | <https://www.unotv.com/us/inmigracion-us/ley-de-ajuste-cubano-las-residencias-aprobadas-caen-mas-de-99/>; <https://www.unotv.com/us/actualidad-us/green-card-para-cubanos-por-que-un-ano-en-ee-uu-no-basta-ante-la-caida-de-aprobaciones/> |
| **Willy Allen** (Miami attorney; frequent CiberCuba/Univision guest) | Legal commentary, not statistics; advice to parolees to wait "a year and a day" | <https://en.cibercuba.com/noticias/2026-05-27-u1-e192519-s27061-nid330392-abogado-willy-allen-insiste-ajuste-cubano-eliminara>; <https://en.cibercuba.com/noticias/2026-08-28-u1-e192519-s27061-nid338902-willy-allen-ley-ajuste-cubano-cucaracha-puede>; <https://noticias.cubitanow.com/abogado-willy-allen-asegura-que-la-ley-de-ajuste-cubano-sigue-vigente-y-descarta-retornos-obligatorios-a-cuba> |
| **Santiago Alpízar** (attorney) | Fee commentary (claims I-485 fee $1,440→$2,940 in 2026 — **not supported as an I-485 fee**: 2026 fee guides agree the paper I-485 fee is $1,440, unchanged since Apr 1 2024 (8 CFR 106.2(a)(21)(i), biometrics included); online $1,390/$1,375 depending on guide; child under 14 filing with parent $950 [S, <https://www.lehighvalleyimmigrationlawyers.com/blog/i-485-filing-fees-in-2026-what-marriage-based-applicants-actually-pay>]; the ~$2,940 figure most likely bundles I-485 + I-765 + I-131 or attorney fees [I]) | <https://www.periodicocubano.com/abogado-advierte-a-cubanos-con-i-220a-son-casi-3-000-dolares-por-la-tarifa-de-ajuste-de-estatus-ante-uscis/> |
| Others seen | cubafull.com (interview tightening, new I-485 edition 09/18/26); elToque; Telemundo 51; Martí Noticias; Diario las Américas; cubitanow | <https://cubafull.com/noticia/uscis-entrevistas-ajuste-estatus>; <https://cubafull.com/noticia/nuevo-formulario-i-485-uscis>; <https://eltoque.com/cubanos-afectados-por-la-revocacion-del-parole-humanitario-incertidumbre-y-opciones-legales>; <https://www.telemundo51.com/noticias/local/termina-el-parole-humanitario-para-personas-de-cuba-haiti-nicaragua-y-venezuela/2666661/>; <https://www.diariolasamericas.com/florida/fallo-bloquea-posibilidad-miles-acogerse-ley-ajuste-cubano-n5343039> |

**YouTube specifically.** No YouTube channel pages could be opened and searches did not
surface channel-level statistics for attorneys (Willy Allen, Ismael Labrador, Claudia
Cañizares, Eduardo Soto, Ángel Leal were queried) [V-negative]. Known from prior knowledge
[U]: Mario J. Pentón and CiberCuba run large Spanish-language YouTube/Facebook video
operations that routinely read out USCIS numbers; several Miami attorneys publish weekly
"casos aprobados esta semana" videos. These are anecdotal (selected successes) and should
be used for **qualitative cues** (e.g. "Miami interviews being scheduled again") rather
than numbers. YouTube Data API v3 can pull titles/descriptions/transcripts of public
videos under its ToS quotas [U]; a lightweight "media watch" cron could flag new videos
whose titles contain "ajuste cubano" + "aprob".

### 3.10 Immigration law-firm blogs reporting CAA timelines

| Firm | Reported timeline | URL | Notes |
|---|---|---|---|
| Casais Law (Miami) | "typically take 8–14 months once the I-485 is filed"; "Work permit approval usually takes 3–5 months" | <https://casaislaw.com/is-the-cuban-adjustment-act-still-valid-updated-guide-for-2026-applicants/> | [V]; also <https://casaislaw.com/areas/cuban-adjustment-act/>, <https://casaislaw.com/cuban-immigration-to-the-u-s-how-the-adjustment-process-works/>, <https://casaislaw.com/will-the-cuban-adjustment-act-survive-proposed-immigration-changes/> (hypothetical "2026 versions" — not law) |
| Vasquez Law (NC) | "1 to 3 years after eligibility is established" | <https://vasquezlawnc.com/blog/cuban-immigration-guide-2026> | [V]; predates 2026 memos |
| Lluis Law (LA) | "in some offices they can exceed 24 months"; I-220A does not qualify as parole | <https://lluislaw.com/cuban-adjustment-act/> | [V] |
| Williams Law | "10 to 35 months" (family-based, ~2025) | <https://bwea.com/cuban-adjustment-act-caa/> | [V]; stale |
| De Maio Law | Common errors that delay CAA green cards (2026) | <https://www.demaio-law.com/post/requisitos-de-la-ley-de-ajuste-cubano-en-2026-errores-comunes-que-pueden-retrasar-su-green-card>; <https://demaio-law.com/en/post/what-is-the-cuban-adjustment-act-and-who-qualifies> | [V] exists |
| Santos Lloyd Law | New public-charge policy applies to I-485s postmarked on/after **Sept 18, 2026** (CAA applicants reported exempt by cubafull/Periódico Cubano). **Verified 2026-10-20 [S]:** the CAA exemption is statutory and DHS confirmed it expressly in the final rule (published in the Federal Register Jul 20 2026); exempt categories listed as refugees/asylees, CAA applicants, SIJs and VAWA self-petitioners; a Cuban adjusting through an ordinary family petition is *not* exempt. The I-485 edition 09/18/26 replaced the 01/20/25 edition with no grace period. The "91 FR 45324" citation was not confirmed by any result [U] | <https://www.santoslloydlaw.com/es-usted-elegible-para-solicitar-el-estatus-de-residente-permanente-legal-bajo-la-ley-de-ajuste-cubano>; <https://noticias.cubitanow.com/uscis-confirma-que-cubanos-bajo-la-ley-de-ajuste-estn-exentos-de-la-carga-pblica>; <https://www.mariopenton.com/cubanos-bajo-la-ley-de-ajuste-quedan-fuera-de-la-nueva-regla-de-carga-publica/>; <https://www.periodicocubano.com/uscis-cambia-reglas-para-obtener-la-green-card-factores-a-revisar-desde-septiembre-y-situacion-de-la-ley-de-ajuste-cubano/> | [S] exemption; [L] edition date |
| Others | Estrella Immigration, Jaskot, requisitos-usa, visafortheunitedstates, fedlaws.org, Miami New Times sponsored piece | see §11 | general guides |

**Assessment.** Law-firm numbers are unsourced ranges written for marketing, updated
irregularly, and span 8 months to 3 years. Use only as weak priors / sanity bounds. Firms
that file **mandamus** suits are, however, a potential source of structured delay data
(each complaint lists filing dates): the **May 2026 Tampa suit by 143 Cubans** alleging
unreasonable delay on I-485 and I-765 (Periódico Cubano, Directorio Cubano) [L] is one
such record; its docket (M.D. Fla.) will contain per-plaintiff receipt dates [U].
**Corrected 2026-10-20 [S]:** the case is *Acosta Reynoso et al. v. USCIS et al.*,
No. 8:26-cv-01314 (M.D. Fla., Tampa), filed May 4 2026 with 129 plaintiffs (Directorio
Cubano reported 129) and later amended to 143; Judge Kathryn Kimball Mizelle **denied a
TRO on Jul 3 2026 and a preliminary injunction on Jul 30 2026** (plaintiffs failed to show
likelihood of success); the case continues
(<https://www.cubaenmiami.com/espera-por-la-green-card-llega-a-los-tribunales-143-cubanos-demandan-a-uscis-por-atrasos-en-sus-casos/>).
Two consequences for the app: (a) mandamus is **not producing fast relief in 2026**, so
`mandamus_filed_date` should not be modelled as a strong accelerator; (b) Directorio
Cubano's separate explainer on when mandamus is worth filing quotes the lawyers' rule of
thumb of **>2 years of delay, more realistically ~3 years** [S, fact-check] — a sensible
default for the app's "consider mandamus" guidance text.

### 3.11 Litigation records as timeline/count data

- **Doe v. Noem**, 1:25-cv-10495 (D. Mass.) — the CHNV termination case. Government
  exhibits include USCIS counts of I-485s filed by CHNV parolees (e.g. RECAP document
  <https://storage.courtlistener.com/recap/gov.uscourts.mad.281389/gov.uscourts.mad.281389.199.3.pdf>,
  Feb 2025) and a **March 6, 2026 supplemental declaration** correcting USCIS counts
  (≈140 legacy Cuban FRP beneficiaries still in initial parole) per
  <https://uscis-pause-tracker.com/cases/786112b9-99ff-4b65-a3d7-b59cdd1edc38> [L]. Other
  entry points: <https://clearinghouse.net/case/46186/>,
  <https://justiceactioncenter.org/case/svitlana-doe-v-noem/>,
  <https://justiceactioncenter.org/wp-content/uploads/2026/01/250-1-Kernochan-Decl-1.pdf>,
  <https://www.govinfo.gov/content/pkg/USCOURTS-mad-1_25-cv-10495/pdf/USCOURTS-mad-1_25-cv-10495-1.pdf>,
  <https://www.uscis.gov/archive/litigation-related-update-on-chnv>,
  <https://www.cliniclegal.org/resources/parole/chnv-parole-terminations-paused-district-court> [V exist].
  **Procedural history added 2026-10-20** (needed to bucket CHNV Cubans correctly):
  D. Mass. (Judge Talwani) stayed the terminations Apr 14 2025; the **Supreme Court stayed
  that order on May 30 2025** (*Noem v. Doe*, No. 24A1079, 605 U.S. ___; no written
  majority opinion; Jackson, J., dissenting) [S:
  <https://www.supremecourt.gov/opinions/24pdf/24a1079_p86b.pdf>,
  <https://natlawreview.com/article/supreme-court-reverses-lower-court-order-pausing-termination-chnv-parole-program>,
  <https://www.seyfarth.com/news-insights/chnv-parole-update-scotus-grants-stay-terminations-may-proceed-but-implementation-unclear.html>];
  DHS began sending individual parole/EAD termination notices on **Jun 12 2025** [S:
  <https://www.gunster.com/newsroom/publications/termination-of-chnv-parole-programs-impact-on-parole-status-and-c-11-ead-authorization-what-u-s-employers-should-know>];
  the **First Circuit on Sep 12 2025** held the termination likely lawful (the INA imposes
  no case-by-case limit on parole revocation) [S:
  <https://justiceactioncenter.org/news/u-s-appeals-court-greenlights-trumps-mass-revocation-of-lawful-status-and-work-authorization-from-hundreds-of-thousands-of-parole-beneficiaries/>];
  by Mar 2026 "almost all" of the ~532,000 CHNV parolees had had parole revoked [S:
  <https://drmantonya.com/resources/chnv-parole-program-guide>]. One law-firm post claims
  a **Mar 31 2026 ruling** held the mass terminations unlawful, certified a class and
  ordered parole restored
  (<https://www.lehighvalleyimmigrationlawyers.com/blog/marriage-green-card-after-parole-cbp-one-humanitarian-parole>);
  this conflicts with the other sources and was not found on any court page — **[U];
  check the D. Mass./1st Cir. docket before relying on it**. Net for the app: CHNV Cubans
  should be bucketed as **parole terminated / (c)(11) EAD revoked from Jun 2025 onward**,
  not as "stayed" after Apr 14 2025.
- **FRP termination litigation (*Doe v. Noem*, D. Mass.):** a TRO in late Dec 2025 and a
  reported **Jan 24 2026 preliminary injunction** stay FR 2025-22744 to the extent it ends
  previously granted FRP parole and EADs early [S per fact-check, secondary timeline;
  motion at <https://iptp-production.s3.amazonaws.com/media/documents/2025.12.29_Motion_for_TRO_-_Doe_v._Noem.pdf>] [L].
- **Adjudication-pause litigation** (two real cases in two courts — corrects §5.3 item 3):
  *Dorcas v. USCIS* (D.R.I., Chief Judge McConnell) **vacated** the pause policies under
  the APA on **Jun 5 2026** (permanent injunction denied as unnecessary; appeal reported
  pending) [S: <https://www.harrisbeachmurtha.com/insights/federal-court-vacates-uscis-adjudication-pauses/>];
  *Red Eagle Law v. Edlow* (N.D. Cal.) granted a **preliminary injunction on Aug 24 2026**
  against the Dec 2 2025 (PM-602-0192) and Jan 1 2026 (PM-602-0194) memos and certified a
  nationwide class of nationals of the 39 countries; USCIS issued an **Aug 28 2026 alert**
  saying it would comply [S per fact-check]. The first pass's "USCIS confirms resumption
  Jul 16" was not confirmed by any result [U].
- **New suit, Oct 2026:** a separate lawsuit challenging USCIS's new green-card
  restrictions was reported by CubaHeadlines (<https://www.cubaheadlines.com/articles/342267>)
  and Periódico Cubano ("USCIS enfrenta nueva demanda por trabas a la residencia
  permanente") [S per fact-check]; docket not yet identified [U].
- **uscis-pause-tracker.com** appears to be a litigation tracker for the adjudication
  pause cases (Dorcas v. USCIS etc.) [L] — worth monitoring for the app's "policy/court"
  alert feed.
- Federal Register: CHNV termination (90 FR 13611, Mar 25 2025,
  <https://www.govinfo.gov/content/pkg/FR-2025-03-25/html/2025-05128.htm>; the document
  number is [T], not re-confirmed today) and FRP termination
  (<https://www.govinfo.gov/content/pkg/FR-2025-12-15/html/2025-22744.htm>; 90 FR 58032,
  published Dec 15 2025) [V exist]. **Corrected 2026-10-20 [S,
  <https://www.federalregister.gov/documents/2025/12/15/2025-22744/termination-of-family-reunification-parole-processes-for-colombians-cubans-ecuadorians-guatemalans>]:**
  FR 2025-22744 terminates all nine FRP programs; existing FRP parole ends **Jan 14 2026**
  (unless it expired earlier) and parole-based EADs are revoked — not Dec 15 2025. The
  "pending-I-485 carve-out as of Dec 15 2025" asserted in the first pass was **not
  confirmed** by any result; it must be checked against the notice text before the
  `parole_terminated` logic relies on it [U].

---

## 4. Dated timeline needed to interpret community-reported data (2023–2026)

Community timelines are meaningless unless bucketed by policy regime. From the sources
above (details belong to the litigation/policy research docs; listed here for bucketing):

| Date | Event | Source |
|---|---|---|
| FY2021 / FY2022 | CAA I-485 national median **8.5** / **5.5 months** (rows added 2026-10-20) | USCIS historic-pt table [S, fact-check] |
| FY2023 | CAA I-485 national median **3.3 months** | CiberCuba Oct 6 2026 [L]; historic-pt [S] |
| FY2024 | Median **4.6 months**; Apr–Jun 2024 **49,965** approvals | CiberCuba; 14ymedio [L]; median also historic-pt [S]; 49,965 not individually re-confirmed [U] |
| 2025-03-25 | DHS terminates CHNV parole (effective Apr 24 2025) | FR 2025-05128 / 90 FR 13611 [V exists; doc number T] |
| 2025-04-14 | D. Mass. (Talwani, J.) stays CHNV terminations (Doe v. Noem) | findlaw/clearinghouse [L] |
| **2025-05-30** | **Supreme Court stays the D. Mass. order** (*Noem v. Doe*, 24A1079); CHNV terminations may proceed (row added 2026-10-20) | supremecourt.gov; NatLawReview; Seyfarth [S] |
| **2025-06-12** | DHS begins sending individual CHNV parole + (c)(11) EAD termination notices | Gunster; drmantonya [S] |
| **2025-09-12** | First Circuit: CHNV termination likely lawful (no case-by-case requirement) | Justice Action Center [S] |
| FY2025 (to Sep 30 2025) | Median **7.0 months** | CiberCuba, Cuba en Miami [L]; historic-pt [S] |
| 2025-12-02 | USCIS memo **PM-602-0192** pauses adjudication of pending I-485s for nationals of **19** countries incl. Cuba | CiberCuba guide [L]; Boundless [S] |
| 2025-12-15 | FR 2025-22744 (90 FR 58032) terminates the FRP programs; **existing FRP parole ends Jan 14 2026** and parole-based EADs are revoked (corrected 2026-10-20; the "pending I-485 keeps parole" carve-out stated in the first pass is **not confirmed** [U]); D. Mass. TRO (late Dec 2025) and reported Jan 24 2026 PI stay early termination of previously granted parole/EADs | FR 2025-22744 [V exists]; corrections [S, fact-check] |
| **2026-01-01** | **PM-602-0194** expands the adjudication pause to **39** countries | Boundless [S] |
| Jan 2026 | Only **15** CAA approvals | 14ymedio [L]; count not individually re-confirmed [U] |
| Jan–Mar 2026 | **50 approved / 45 denied** (52.6 %) | 14ymedio [L]; 52.6 % echoed in results, raw counts [U] |
| **2026-03-30 / 2026-04-30** | USCIS partially lifts the pause for some categories | Boundless [S] |
| 2026-05-04 | *Acosta Reynoso v. USCIS*, 8:26-cv-01314 (M.D. Fla., Tampa): 129 Cubans (later 143) sue for unreasonable delay on I-485/I-765; **TRO denied Jul 3, PI denied Jul 30 2026** (Judge Mizelle); case ongoing | Periódico Cubano [L]; Cuba en Miami [S] |
| 2026-05-21 | USCIS policy memo on discretion in adjustment ("being eligible will no longer be sufficient"). **Government's stated position, noted by the court: the memo does not apply to Cuban Adjustment Act applications** — label CAA filers' post-May-21 regime accordingly (added 2026-10-20) | CiberCuba May 22 2026; VisaVerge [L]; CAA carve-out: CiberCuba Oct 20 2026 / VisaVerge [S, fact-check] |
| 2026-06-05 | ***Dorcas v. USCIS* (D.R.I., Chief Judge McConnell) vacates the pause policies** under the APA; appeal pending. (First pass said "D. Mass./1st Cir." and "USCIS confirms resumption Jul 16" — the court is corrected; the Jul 16 claim is unconfirmed [U]) | CiberCuba guide [L]; Harris Beach Murtha [S] |
| Apr–Jun 2026 | **139 approved / 447 denied / 586 decided**; **342,360 pending** (exact figure [U]; "more than 342,000" [S]; or 355,371 per Inmigreat); quarter median reported as **16.3 months** by Mario Pentón/UnoTV | CiberCuba Oct 20 2026; 14ymedio; UnoTV; Pentón [L] |
| Jul 2026 | **308** CAA approvals in the month | Periódico Cubano [L]; not re-confirmed [U] |
| Jun–Aug 2026 | ">1,200 approvals since June" per "Immigrate Case Tracker" | Cuba en Miami [L] |
| Oct 1 2025–Jul 31 2026 | FY2026 median **11.8 months** (media figure for the Jul 31 cut of the USCIS historic table) | CiberCuba, Directorio, La Nación, Cuba en Miami [L] |
| **2026-08-24** | ***Red Eagle Law v. Edlow* (N.D. Cal.)**: preliminary injunction against PM-602-0192/-0194 and a nationwide class (39 countries); USCIS compliance alert **Aug 28 2026** | UnoTV [L]; fact-check [S] |
| **Oct 1 2025–Aug 30 2026** | FY2026 median **12.3 months** in the official historic table (latest cut; will move again with each monthly update) | historic-pt [S, fact-check] |
| 2026-09-18 | New I-485 edition 09/18/26 mandatory (no grace period); new public-charge rule applies to I-485s filed on/after this date (FR publication Jul 20 2026); **CAA applicants exempt by statute, confirmed by DHS in the final rule** (verified 2026-10-20) | cubafull, Santos Lloyd, Periódico Cubano [L]; cubitanow, Pentón, Periódico Cubano [S] |
| Oct 2026 | New lawsuit challenging USCIS's green-card restrictions reported | CubaHeadlines 342267; Periódico Cubano [S, fact-check] |

---

## 5. Concrete reported timelines and statistics

### 5.1 Individual case timelines found (community / third-party)

Because Reddit, Facebook and the trackers were unreachable, this table is a **seed**, not
a dataset. Every row is self-reported or journalist-reported.

| # | Source (URL) | Entry path | Filing / key dates | State / office | EAD | Interview | Decision | Elapsed | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Project README (this repo) | CHNV parole → CAA | I-485 filed ~Mar/Apr 2025 | (owner to fill) | Received (date tbd) | None reported | Pending at Oct 2026 | ≥18 months | Peers filed same time: some got EAD, some did not |
| 2 | Directorio Cubano delay explainer <https://www.directoriocubano.info/estados-unidos/demoras-residencia-ajuste-cubano-entrevista/> | CAA | Filed **March 2025** | n/a | n/a | n/a | Still waiting (2026) | ≥12–18 mo | Lawyer quoted: suing does not guarantee approval [L] |
| 3 | CiberCuba 2026-04-20 <https://en.cibercuba.com/noticias/2026-04-20-u1-e208512-s27061-nid326539-cubano-parole-humanitario-ajuste-tramite-lleva-meses> | Humanitarian parole → CAA | I-485 pending "for months" by Dec 2025 | n/a | n/a | n/a | Pending; detained by ICE 80 days after routine appointment Dec 2025; released via habeas | — | Daniel Alejandro Escobar Rodríguez [L] |
| 4 | Tampa mandamus suit (Periódico Cubano) <https://www.periodicocubano.com/cubanos-demandan-a-uscis-por-hacerlos-esperar-anos-para-la-residencia-bajo-la-ley-de-ajuste/>; *Acosta Reynoso v. USCIS*, 8:26-cv-01314 | CAA (129 → 143 plaintiffs) | Filed May 4 2026 alleging "years" of delay on I-485 and I-765 | M.D. Fla. (Tampa) | some pending | — | pending; TRO denied Jul 3 2026, PI denied Jul 30 2026 (Judge Mizelle) [S] | "years" | Docket would give 143 receipt dates [U] |
| 5 | VisaJourney member timeline (Cuban beneficiary, K-1 AOS) | K-1 → AOS | — | — | — | ~3 months after filing | I-485 approved **126 days** after filing | 126 d | Not CAA; pre-2025 [V] |
| 6 | VisaJourney member timeline | AOS | — | — | — | — | Approved in **190 days**, decision 2018-06-19 | 190 d | Not CAA [V] |
| 7 | VisaJourney member timeline (K-1) | K-1 → AOS | — | — | — | — | Approved **514 days** after filing | 514 d | Not CAA [V] |
| 8 | VisaJourney member timeline (CHNV) | I-134A parole (abandoned I-129F) | — | — | **EAD approved in ~24 days** | — | — | — | Parole-based (c)(11) EAD, 2023–24 era [V] |
| 9 | CubaHeadlines 333033 <https://www.cubaheadlines.com/articles/333033> | CAA (couple) | — | — | — | — | Approved (viral USCIS "Approved" screenshot) | — | Date not captured [V exists] |

### 5.2 Aggregate statistics the community cites (all ultimately USCIS data)

| Metric | Value | Period | Reported by | Tag |
|---|---|---|---|---|
| CAA I-485 national median | 8.5 mo | FY2021 | USCIS historic-pt (fact-check 2026-10-20) | S |
| CAA I-485 national median | 5.5 mo | FY2022 | USCIS historic-pt (fact-check 2026-10-20) | S |
| CAA I-485 national median | 3.3 mo | FY2023 | CiberCuba; historic-pt | L / S |
| CAA I-485 national median | 4.6 mo | FY2024 | CiberCuba | L |
| CAA I-485 national median | 7.0 mo | FY2025 | CiberCuba, Cuba en Miami (+69 % to FY2026) | L |
| CAA I-485 national median | **11.8 mo** | FY2026 through Jul 31 2026 | CiberCuba, Directorio, La Nación, Cuba en Miami | L |
| CAA I-485 national median | **12.3 mo** | FY2026 through Aug 30 2026 (official table, latest cut; will move again) | USCIS historic-pt (fact-check 2026-10-20) | S |
| Quarter median | 16.3 mo | Apr–Jun 2026 | Mario Pentón / UnoTV | L |
| Approvals | 49,965 | Apr–Jun 2024 | 14ymedio | L |
| Approvals / denials | 15 / — | Jan 2026 | 14ymedio | L |
| Approvals / denials | 50 / 45 (52.6 %) | Jan–Mar 2026 | 14ymedio, Outlook India | L |
| Approvals / denials / decided | **139 / 447 / 586 (23.7 %)** | Apr–Jun 2026 | CiberCuba, 14ymedio, UnoTV, Directorio, Periódico Cubano, VisaVerge | L |
| Pending | **342,360** ("more than 342,000" confirmed; the exact figure was not seen in any result today) | Jun 30 2026 | CiberCuba, Directorio; VisaVerge/CubaHeadlines (">342,000") | L / U (exact) |
| Pending | 355,371 (22.4 % of all pending I-485) | Jun 30 2026 (?) | Inmigreat; La Nación/Directorio excerpt | L (conflict) |
| Pending | ">327,000" | earlier 2026 | Cuba en Miami | L |
| Approvals | 308 | Jul 2026 | Periódico Cubano | L |
| Approvals | ">1,200 since June" | Jun–Aug 2026 | "Immigrate Case Tracker" via Cuba en Miami | L |
| Decline in approvals | 99.7 % (2024→2026 Q3); 98.7 % vs 2025; 99.8 % Oct 2024→Jan 2026 (Cato) | — | 14ymedio; CiberCuba; Cato via CiberCuba | L |
| "Approval rate" | 95.2 % | unspecified | Inmigreat | V (but period unknown) |
| EAD after CAA filing | 3–5 months | typical pre-freeze | Casais Law | V (marketing) |

### 5.3 Discrepancies to resolve

1. **342,360 vs 355,371 pending at June 30 2026.** Plausible explanations [U]: different
   USCIS tables (I-485 "by category: Cuban Adjustment" vs "by country of birth: Cuba" —
   the latter would include Cubans adjusting under other categories), or different cut
   dates. The app should ingest the official table directly and label which one it uses.
2. **23.7 % vs 95.2 % "approval rate."** The first is approvals ÷ decisions in one quarter
   with tiny volume; the second is likely cumulative or FY2024-era. Never show a single
   "approval rate" without its window.
3. **June 5 vs Aug 24 2026 court dates ending the pause.** **Resolved 2026-10-20 [S]:**
   two different cases, both real — *Dorcas v. USCIS* (D.R.I., not D. Mass./1st Cir.)
   vacated the pause policies on Jun 5 2026; *Red Eagle Law v. Edlow* (N.D. Cal.) granted
   a preliminary injunction with a nationwide class on Aug 24 2026, and USCIS announced
   compliance Aug 28 2026. Belongs to the litigation doc; matters here because community
   timelines straddle both. The "Jul 16 USCIS resumption" date remains [U].
4. **I-485 fee** $1,440 vs $2,940 claim (Alpízar). **Resolved [S]:** paper I-485 is
   $1,440 (unchanged since Apr 2024; online $1,390/$1,375 per conflicting guides; $950 for
   a child under 14 filing with a parent); $2,940 is unsupported as an I-485 fee and is
   probably a bundle (I-485 + I-765 + I-131) or includes attorney fees [I].
5. **11.8 vs 12.3 months FY2026 median.** Not a conflict: different cut dates (Jul 31 vs
   Aug 30 2026) of a "living" table. The app must store `cut_date` with every ingested
   median and show it next to the number.
6. **"Stayed" vs "terminated" CHNV parole.** The first-pass timeline stopped at the
   Apr 14 2025 stay. The Supreme Court lifted it May 30 2025 and notices went out from
   Jun 12 2025 [S], so CHNV Cubans from mid-2025 onward are "parole terminated / c11 EAD
   revoked", not "stayed". A claimed Mar 31 2026 ruling restoring parole is [U].

---

## 6. Bias and structure assessment (how much to trust each source)

| Source | Self-selection bias | Timeliness | Granularity | Verifiability |
|---|---|---|---|---|
| Media transcriptions of USCIS tables | None (official counts) but **lag one quarter**; only national totals, no office split | Quarterly / monthly | National, by category | High — re-check against USCIS table |
| "Immigrate Case Tracker" / community trackers | Users who join are more engaged; approvals over-reported (people post good news) | Near-real-time | Per case | Unknown |
| Reddit timelines | English-speaking, self-filers, stuck cases over-represented | Real-time | Per case, often field office | Medium (public, permalinked) |
| Facebook polls | Group-specific; multiple-vote/duplicate risk; Spanish; huge N | Real-time | Coarse (month buckets) | Low (screenshots) |
| Law-firm ranges | Marketing; outdated | Irregular | None | Low |
| myUSCIS JSON import (app feature) | Only app users, but **exact dates and event codes** | Real-time | Per event | High (machine-generated) |

**Modelling consequence.** Treat community data as the *numerator* for milestone-conditional
hazards (P(approval within t | EAD received, office = Miami, filed in month m)) and the
official pending/decided counts as the *denominator and calibration target*: the
crowdsourced sample's implied monthly completions, reweighted by filing month, should
reproduce the official decided counts; where it does not, down-weight the sample or
widen the confidence interval. Always stratify by policy regime (§4).

---

## 7. Legal and practical ingestion matrix

| Source | Mechanism | Legal posture | Practical cost | Recommendation |
|---|---|---|---|---|
| In-app crowdsourcing (first-party) | Forms + optional JSON import | You own the data; publish a privacy policy; store no PII beyond what's needed; mask receipts to prefix + last 3 | Build once | **Primary** |
| myUSCIS case-service JSON (user-pasted) | User signs in, opens `https://my.uscis.gov/account/case-service/api/cases/{receipt}`, pastes | Same as humanstack/uscis-tracker.github.io pattern; user accesses own data; app never automates login | Parser for NIEM event codes | **Primary (optional step)** |
| Official USCIS Case Status API (developer.uscis.gov) | Registered API access (OAuth 2.0 client credentials; sandbox `api-int.uscis.gov`, prod `api.uscis.gov`) | Official; intended for regular access by applicants/reps | Registration; returns status, form type, submission date and status history (EN/ES); **5 TPS / 1,000 requests per day** [S] — enough for a user's own cases on demand, **not** for server-side polling of a crowdsourced base | Secondary (per-user, on-demand only) |
| USCIS processing-times JSON (`/processing-times/api/...`) and historic-pt table | Scheduled fetch | Public government data; endpoints undocumented but used widely | Low | **Primary for priors** (document in data-sources doc) |
| Trackitt | Scrape HTML | ToS unknown [U]; browsewrap | Medium | **Do not** until ToS read; likely near-zero CAA rows anyway |
| Lawfully | None | Closed | — | No |
| VisaJourney | Scrape | ToS bars robots "for any unauthorized purpose" [V] | Medium | No |
| Reddit | Official Data API | Non-commercial free tier; store derived fields + permalink only [U] | Low | Yes, for seeding/validation, with a manual review step |
| Facebook / WhatsApp | None | Meta ToS prohibits automated collection [U] | — | Use for recruitment and manual transcription of admin polls with attribution |
| Telegram | Bot API for your own channel | Fine | Low | Yes (alerts) |
| Spanish media | RSS + manual transcription | Facts aren't copyrightable; quote short excerpts, link; respect robots.txt | Low | Yes (validation + alert feed) |
| YouTube | Data API v3 (titles/descriptions) | Within quota/ToS [U] | Low | Optional "media watch" |
| Court records | CourtListener/RECAP API | Public record; RECAP API has free tier [U] | Low–medium | Yes for counts and the Tampa suit (*Acosta Reynoso v. USCIS*, 8:26-cv-01314 M.D. Fla.) |

**Reddit extraction schema (for the follow-up run):** `post_id, permalink, created_utc,
subreddit, flair, entry_type(CHNV|CFRP|I-220A|other), i485_receipt_date, i485_receipt_number_prefix(IOE/MSC/…), field_office|state, biometrics_date, ead_category(c09|c11), ead_receipt_date, ead_approved_date, rfe_date, rfe_response_date, interview_notice_date, interview_date, approval_date, card_mailed_date, lawyer(bool), mandamus_date, pause_affected(bool), extraction_confidence, raw_excerpt`.

---

## 8. What the communities already track → recommended crowdsourced case-entry schema

Derived from Trackitt columns (service center, fingerprint date, RFE status/reason,
transfer, interview location, name check), VisaJourney columns (paired sent/received dates,
derived "days between", comments), Lawfully (form, category, service center, filing date),
the NIEM event-code dictionary (receipt, background checks, interview, holds, RFE, decision,
card), the humanstack Reddit export (masked receipt, officer vs system updates, silent
updates), and the vocabulary of the Cuban community press (parole/I-94 date, "un año y un
día", "permiso de trabajo", "entrevista", "congelación/pausa", "mandamus", "I-220A vs
parole", Florida field offices).

### 8.1 Entry fields

**Identity & consent (never shown publicly)**
- `entry_id` (uuid); `created_at`; `updated_at`; `consent_version`; `source` (app_manual | app_json_import | reddit | media | partner)
- `receipt_masked` — e.g. `IOE09326XXXXX` (prefix + first 5 digits only); never store full receipt in the shared dataset
- `dedupe_hash` — salted hash of full receipt kept only on-device to prevent duplicate submissions

**Eligibility context**
- `entry_pathway` — `CHNV_parole` | `CFRP_parole` | `port_of_entry_parole` | `I220A_then_parole` | `other_parole` | `admitted_visa` (CAA still requires admission or parole; I-220A alone is not parole per Lluis/BIA)
- `parole_date` (I-94 date); `parole_expiry_date`; `parole_terminated` (bool, date); `parole_termination_basis` (`CHNV_notice_2025` | `FRP_notice_2026` | `expired` | `other`) — **corrected 2026-10-20:** CHNV parole was terminated by FR 2025-05128 effective Apr 24 2025, stayed by D. Mass. Apr 14 2025, the stay lifted by the Supreme Court May 30 2025, individual termination notices from Jun 12 2025 [S]; FRP: FR 2025-22744 ends existing parole Jan 14 2026 and revokes EADs, subject to the D. Mass. TRO/PI [S]; the "pending I-485 keeps parole" carve-out is **unconfirmed [U]** — do not hard-code it
- `one_year_date` — computed: parole_date + 1 year + 1 day
- `state`; `metro_or_zip3`; `uscis_field_office` (e.g. Miami, Hialeah, Kendall, Oakland Park, Tampa, Orlando, Houston, Louisville…) — community reports office more reliably than it reports service center
- `filed_with_attorney` (bool); `filed_concurrently_i765` (bool); `filed_concurrently_i131` (bool); `fee_waiver` (bool); `derivatives_count`

**I-485 milestones (dates; each with `source_type` = notice | online_status | json_event | memory)**
- `i485_mailed_date`; `i485_receipt_date` (NOA1); `i485_receipt_prefix` (IOE/MSC/LIN/…)
- `biometrics_notice_date`; `biometrics_date`; `biometrics_reused` (bool)
- `fta0_events` (count + dates, if JSON import) — "fingerprints/background actions completed"
- `silent_update_dates[]` — officer touches without status change
- `rfe_date`; `rfe_type` (medical I-693 | parole evidence | physical presence | other); `rfe_response_date`
- `transfer_date`; `transfer_to_office`
- `interview_notice_date`; `interview_date`; `interview_outcome` (approved_at_window | pending_review | rfe | continued)
- `pause_hold_flag` (bool) — user believes case was held under the Dec 2025 pause
- `mandamus_filed_date` (guidance text: lawyers' rule of thumb is >2 years, realistically ~3 years of delay before mandamus is worth filing [S, Directorio Cubano via fact-check]; the Tampa suit's TRO/PI denials show it is not fast relief in 2026); `congressional_inquiry_date`; `ombudsman_date`
- `decision_date`; `decision` (approved | denied | withdrawn | admin_closed); `denial_reason_category`
- `card_produced_date`; `card_mailed_date`; `card_received_date`

**EAD milestones**
- `ead_category` — `c09` (pending I-485) | `c11` (parole) | `both`
- `ead_receipt_date`; `ead_biometrics_date`; `ead_approved_date`; `ead_card_received_date`; `ead_validity_end`; `ead_denied_or_void` (bool/date — relevant to parole-termination fallout)
- `ead_renewal_filed_date`

**Derived (computed by app, not entered)**
- `days_receipt_to_biometrics`, `days_receipt_to_ead`, `days_receipt_to_interview`, `days_receipt_to_decision`, `days_since_receipt`, `regime_bucket` — **expanded 2026-10-20** to match the corrected §4 timeline: `pre_freeze` (< Dec 2 2025) | `freeze_19` (Dec 2–31 2025, PM-602-0192) | `freeze_39` (Jan 1–Mar 29 2026, PM-602-0194) | `partial_lift` (Mar 30–Jun 4 2026) | `post_vacatur` (Jun 5–Aug 23 2026, *Dorcas*) | `post_pi` (Aug 24 2026 →, *Red Eagle Law*); plus `filed_on_or_after_2026_09_18` (bool — new I-485 edition / public-charge rule; CAA filers are exempt from the rule itself) and `discretion_memo_regime` (bool — pending on/after May 21 2026; note the government's position that the memo does not apply to CAA), `completeness_score`, `plausibility_flags` (e.g. decision before receipt)

**Free text**
- `notes` (Spanish/English), `status_text_last_seen` (verbatim USCIS status message, e.g. "Case Was Updated To Show Fingerprints Were Taken"), `status_text_seen_date`

### 8.2 Example entry (JSON, illustrative)

```json
{
  "entry_id": "9d2f…",
  "source": "app_json_import",
  "receipt_masked": "IOE09326XXXXX",
  "entry_pathway": "CHNV_parole",
  "parole_date": "2024-02-10",
  "parole_termination_basis": "CHNV_notice_2025",
  "one_year_date": "2025-02-11",
  "state": "FL",
  "uscis_field_office": "Hialeah",
  "filed_with_attorney": false,
  "filed_concurrently_i765": true,
  "i485_receipt_date": "2025-04-03",
  "biometrics_date": "2025-05-06",
  "ead_category": "c09",
  "ead_approved_date": "2025-07-22",
  "silent_update_dates": ["2026-02-14", "2026-07-30"],
  "interview_date": null,
  "decision": null,
  "status_text_last_seen": "Case Was Updated To Show Fingerprints Were Taken",
  "status_text_seen_date": "2026-10-19",
  "regime_bucket": "post_pi",
  "completeness_score": 0.6
}
```

---

## 9. How community data should seed and validate the estimator

1. **Seed** the milestone-hazard model with (a) official historic medians per fiscal year
   (FY2021–FY2026: 8.5 → 5.5 → 3.3 → 4.6 → 7.0 → 12.3 months at the Aug 30 2026 cut, 11.8
   at the Jul 31 cut — store `cut_date` with each) as the baseline distribution shape, (b) the quarterly
   decided/pending counts to set throughput, and (c) the small set of individual timelines
   (this doc §5.1 + Reddit extraction) to initialise office-level and milestone-conditional
   offsets with wide priors.
2. **Validate** monthly: compare the app's implied national median and approvals/month
   against the next USCIS release as reported by CiberCuba/14ymedio/Periódico Cubano
   (they publish within days), and against "Immigrate Case Tracker"/Cuba en Miami counts
   if a partnership is possible.
3. **Guard against regime change** (Lawfully's documented failure): detect when the
   observed hazard in the last 60 days diverges from the fitted one and switch to a
   short-window estimator with explicit "policy uncertainty" banding.
4. **Bias controls:** weight entries by completeness and source_type; cap the influence of
   any single office/month cell; show N behind every estimate; suppress cells with N < 10.

---

## 10. Open questions / verification to-do (hands-on, normal internet)

1. Open **Trackitt**'s ToS and the family-based I-485 tracker; filter Nationality = Cuba;
   count rows and check for an export button.
2. Open **Lawfully**'s privacy policy and ToS; check whether the USCIS Status Explorer has
   a category covering CAA/"other" I-485 and what sample sizes it shows for I-765 c09/c11.
3. Identify the **"Immigrate Case Tracker"** platform (URL, operator "Ángel", data volume,
   whether it is Inmigreat); request a data-sharing or cross-validation conversation.
4. Run the **Reddit protocol** (§3.7, §7) and fill §5.1 with ≥50 CAA timelines; confirm
   whether r/CubanAdjustmentAct exists.
5. Enumerate current **Facebook groups** (names, sizes, admin poll cadence) and **Telegram
   handles**; ask admins whether they would promote the app.
6. Confirm whether **ImmigrationHelp.org** offers any tracker (no evidence found).
7. Resolve the **342,360 vs 355,371** pending discrepancy by opening the USCIS quarterly
   I-485 tables; record which table/row each media outlet uses.
8. Pull the **Tampa mandamus complaint** (M.D. Fla., May 2026, 143 plaintiffs) from
   PACER/RECAP for per-plaintiff receipt dates.
9. Check whether `egov.uscis.gov/processing-times/api/...` endpoints still respond and
   whether the historic-pt page exposes the "Based on Cuban Adjustment" row as JSON.
10. Verify YouTube channel statistics and whether any attorney publishes systematic
    (not cherry-picked) approval tallies.
11. Read FR 2025-22744 (90 FR 58032) in full and confirm or drop the "pending I-485 keeps
    parole" carve-out; pull the *Doe v. Noem* (FRP) TRO/PI orders from the D. Mass. docket.
12. Confirm or drop the "USCIS confirms resumption Jul 16 2026" claim (first-pass CiberCuba
    guide); the only confirmed USCIS compliance alert is Aug 28 2026.
13. Check the D. Mass./1st Cir. CHNV docket for the claimed **Mar 31 2026** class ruling
    restoring parole (single law-firm source; conflicts with the Sep 12 2025 1st Cir.
    ruling and the "almost all revoked" reports).
14. Confirm the public-charge rule's Federal Register citation (91 FR 45324 unverified) and
    read its CAA-exemption language directly on federalregister.gov.
15. Confirm the exact Jun 30 2026 pending count (342,360) and the raw monthly counts
    (Jan 2026 = 15; Jul 2026 = 308; Apr–Jun 2024 = 49,965) against the USCIS quarterly
    I-485 "Cuban Adjustment" table.

---

## 11. Sources (every URL used; all surfaced 2026-10-20)

**Trackers, apps, APIs, code**
- https://www.trackitt.com/usa-immigration-trackers/i485-fb
- https://www.trackitt.com/usa-immigration-trackers/i485-eb
- https://www.trackitt.com/usa-immigration-trackers/discuss/i485-eb/15099
- https://www.usavisalaw.com/immigration-blog/i485-trackitt-h1b-trackitt-tracker-vs-uscis-processing-time
- https://gcinfo.org/useful-links/gc-trackers
- https://www.immihelp.com/i-485-tracker/
- https://www.mygcvisa.com/tracker/browse.aspx?c=i485
- https://trackmyvisa.com/i485
- https://i485tracker.com/
- https://apps.apple.com/us/app/lawfully-case-tracker/id1435063223
- https://play.google.com/store/apps/details?id=com.lawfully.lawfully_ai_tracker&hl=en_US
- https://www.lawfully.com/case-tracker
- https://www.lawfully.com/resources/start-case-analysis-pro
- https://www.lawfully.com/resources/what-is-uscis-case-tracker
- https://www.lawfully.com/resources/what-distinguishes-case-analysis-pro-from-other-case-trackers
- https://lawfully-official.medium.com/new-feature-case-analysis-pro-d03977c41f54
- https://lawfully-official.medium.com/what-distinguishes-case-analysis-pro-from-other-case-trackers-9d1fad1a1542
- https://lawfully-official.medium.com/start-case-analysis-pro-and-stay-updated-with-your-case-status-fcd23dba516c
- https://www.lawfully.com/data/uscis-status-explorer/case-was-received?caseType=I-765&caseCategory=All+other+applications+for+employment+authorization
- https://www.lawfully.com/data/uscis-status-explorer/case-was-updated-to-show-fingerprints-were-taken?caseType=I-485&caseCategory=EB1-3
- https://www.lawfully.com/data/uscis-status-explorer/case-was-approved-and-my-decision-was-emailed?caseType=I-129&caseCategory=H-1B
- https://www.casestatusapi.com/
- https://www.casestatusapi.com/timelines
- https://www.casestatusapi.com/compare
- https://www.casestatusapi.com/faq
- https://www.casestatusapi.com/guides/uscis-internal-api-guide
- https://www.casestatusapi.com/guides/uscis-api-links
- https://www.casestatusapi.com/guides/check-uscis-case-status-internal-api
- https://immigrationapi.com/
- http://casetracker.xyz/
- https://mycaseshub.com/
- https://uscis-tracker.github.io/
- https://github.com/uscis-tracker/uscis-tracker.github.io
- https://github.com/humanstack/uscis-case-tracker
- https://github.com/Enase/uscis-case-tracker
- https://github.com/armanckeser/uscis-tracker
- https://github.com/wangchao92/uscis-api-case-tracker
- https://github.com/gentlespoon/USCIS-Case-Status-Checker
- https://github.com/pedrocastellanos/uscis-case-tracker-bot
- https://github.com/stenioaraujo/visajourney
- https://github.com/ajduberstein/uscis-wait-times (fetch.py)
- https://github.com/Data4Democracy/immigration-connect (uscis-processing-time/uscis-processing-time-api.py)
- https://niem.github.io/model/5.0/scr/BenefitDocumentStatusCategoryCodeSimpleType/
- https://developer.uscis.gov/apis
- https://egov.uscis.gov/processing-times/historic-pt
- https://www.uscis.gov/sites/default/files/document/fact-sheets/historical_pt_factsheet_fy16_to_fy24.pdf
- https://play.google.com/store/apps/details?id=com.uscis&hl=en_US
- https://play.google.com/store/apps/details?id=us.casetracker.uscis&hl=en_US
- https://apps.apple.com/us/app/case-now-uscis-tracker/id6752526606
- https://apps.apple.com/mx/app/uscis-case-tracker/id6727012835
- https://www.visajourney.com/terms-of-service/
- https://www.visajourney.com/timeline/profile.php?id=16557 (and ids 284717, 104004, 400016, 270579, 200748, 223763, 293983)
- https://visajourney.com/forums/topic/519672-visa-in-cuba
- https://www.minexa.ai/post/how-to-scrape-immigration-and-visa-data-from-visa-journey-using-the-minexa-api
- https://www.boundless.com/blog/you-can-now-track-your-work-and-travel-permit-wait-time-online/
- https://www.boundless.com/lp/importance-of-immigration-processing-times
- https://webflow.boundless.com/blog/understanding-uscis-myprogress
- https://www.inmigreat.com/en/analytics/i-485/
- https://uscis-pause-tracker.com/cases/786112b9-99ff-4b65-a3d7-b59cdd1edc38
- https://immigrationtimes.org/forms/i-485/
- https://www.novo-legal.com/immigration-law/processing-times/i-485
- https://plainvisa.com/processing-times/i-485
- https://immiva.com/blog/i-485-processing-time
- https://waitvisa.com/us/i-485
- https://immigrationtoolhub.com/blog/i485-processing-times-2024-2026.html
- https://manifestlaw.com/blog/i485-processing-times
- https://www.visabulletin.ai/uscis-processing-times-by-form
- https://www.wantavisa.com/processing-times.php
- https://www.immigrationdirect.com/blog/form-i-485-processing-time/
- https://www.beyondborderglobal.com/resources/i-485-processing-time----what-recent-uscis-data-shows
- https://www.palmerpolaski.com/news/uscis-historical-national-median-processing-times-highlight-historic-backlogs
- https://arvian-immigration.com/uscis-processing-times-2026-how-long-i-130-i-485-i-765-i-131-and-n-400-tak/
- https://www.jeelani-law.com/uscis-historic-processing-times/
- https://visaserve.com/uscis-simplifying-improving-communication-of-case-processing-data-2/
- https://www.docketwise.com/blog/immigration-case-tracking/
- https://www.redditinc.com/policies/data-api-terms (not opened; prior knowledge)
- https://support.reddithelp.com/hc/en-us/articles/16160319875092 (not opened; prior knowledge)

**Cuban / Spanish-language media and commentators**
- https://en.cibercuba.com/noticias/2026-10-20-u1-e135253-s27061-nid343309-solo-139-cubanos-obtuvieron-residencia-ley-ajuste
- https://en.cibercuba.com/noticias/2026-10-06-u1-e135253-s27061-nid342034-green-card-ley-ajuste-cubano-tarda-casi-ano-tiempo
- https://en.cibercuba.com/noticias/2026-05-22-u1-e209363-s27061-nid330046-eeuu-endurece-ajuste-estatus-bastara-ser-elegible
- https://en.cibercuba.com/noticias/2026-04-20-u1-e208512-s27061-nid326539-cubano-parole-humanitario-ajuste-tramite-lleva-meses
- https://en.cibercuba.com/noticias/2026-05-27-u1-e192519-s27061-nid330392-abogado-willy-allen-insiste-ajuste-cubano-eliminara
- https://en.cibercuba.com/noticias/2026-05-27-u1-e192519-s27061-nid330393-abogado-desmiente-medio-millon-deportaciones
- https://en.cibercuba.com/noticias/2026-06-09-u1-e192519-s27061-nid331752-willy-allen-explica-balseros-tienen-derecho-al
- https://en.cibercuba.com/noticias/2026-07-14-u1-e192519-s27061-nid335030-consejo-willy-allen-cubano-220a-nunca-aceptes-salida
- https://en.cibercuba.com/noticias/2026-08-04-u1-e192519-s27061-nid337022-abogado-willy-allen-deportaciones-cubanos-uruguay
- https://en.cibercuba.com/noticias/2026-08-28-u1-e192519-s27061-nid338902-willy-allen-ley-ajuste-cubano-cucaracha-puede
- https://en.cibercuba.com/noticias/2026-10-13-u1-e192519-s27061-nid342805-abogado-pide-olvidar-miles-cubanos-esperan-visa
- https://en.cibercuba.com/noticias/2025-04-16-u192519-e192519-s27061-nid301095-abogado-willy-allen-cubanos-seguros-menos
- https://www.cibercuba.com/s/inmigracion-eeuu/guias/una-vez-en-eeuu/ley-ajuste-cubano
- https://www.cibercuba.com/s/inmigracion-eeuu/planillas/i-485
- https://en.cibercuba.com/tags/parole
- https://www.cubaheadlines.com/articles/343309
- https://www.cubaheadlines.com/articles/342034
- https://www.cubaheadlines.com/articles/333033
- https://www.14ymedio.com/cuba/migracion/aprobaciones-residencia-ley-ajuste-cubano_1_1132080.html
- https://www.directoriocubano.info/tramites-usa/ley-ajuste-cubano-aprobaciones-negativas-2026/
- https://www.directoriocubano.info/estados-unidos/residencia-ley-ajuste-cubano-espera-2026/
- https://www.directoriocubano.info/estados-unidos/demoras-residencia-ajuste-cubano-entrevista/
- https://www.directoriocubano.info/cuba/cada-vez-menos-residencias-ley-ajuste-cubano-fin-sin-derogarla/
- https://www.directoriocubano.info/panorama/abogado-aclara-sobre-cubanos-con-parole-ley-de-ajuste-y-posibles-deportaciones-en-estados-unidos/
- https://www.directoriocubano.info/emigracion/cubanos-corte-inmigracion-pendiente-asilo-i220a-residencia-guia-2026/
- https://www.cubaenmiami.com/residencia-por-ley-de-ajuste-cubano-tarda-mas-tiempo-de-uscis-sube-casi-un-69/
- https://www.cubaenmiami.com/mejora-parcial-en-el-ajuste-cubano-uscis-reporta-aumento-de-aprobaciones-en-los-ultimos-dos-meses-pero-los-retrasos-siguen-siendo-altos/
- https://www.cubaenmiami.com/aumentan-las-aprobaciones-de-green-card-bajo-la-ley-de-ajuste-cubano-estos-son-los-casos-que-se-estan-moviendo-mas-rapido/
- https://www.cubaenmiami.com/mas-de-327000-cubanos-esperan-la-residencia-el-enorme-atasco-que-enfrenta-la-ley-de-ajuste-cubano/
- https://www.cubaenmiami.com/residencias-de-cubanos-bajo-la-ley-de-ajuste-cubano-enfrentan-un-atraso-que-podria-extenderse-durante-anos/
- https://www.periodicocubano.com/uscis-rechaza-tres-de-cada-cuatro-peticiones-bajo-la-ley-de-ajuste-cubano-solo-estos-casos-fueron-aprobados/
- https://www.periodicocubano.com/aumenta-el-tiempo-de-procesamiento-para-obtener-la-residencia-permanente-por-la-ley-de-ajuste-cubano/
- https://www.periodicocubano.com/cubanos-demandan-a-uscis-por-hacerlos-esperar-anos-para-la-residencia-bajo-la-ley-de-ajuste/
- https://www.periodicocubano.com/cubanos-con-parole-revocado-deben-esperar-para-la-ley-de-ajuste-al-igual-que-los-que-entraron-con-esta/
- https://www.periodicocubano.com/abogado-advierte-a-cubanos-con-i-220a-son-casi-3-000-dolares-por-la-tarifa-de-ajuste-de-estatus-ante-uscis/
- https://www.periodicocubano.com/solicitantes-de-residencia-bajo-la-ley-de-ajuste-cuba-exentos-de-la-nueva-politica-de-carga-publica/
- https://www.periodicocubano.com/que-cubanos-se-salvan-de-la-suspension-de-tramites-migratorios-en-uscis-decretada-por-trump/
- https://www.periodicocubano.com/cubanos-empiezan-suscribirse-a-este-canal-de-telegram-con-las-ultimas-noticias-del-parole-humanitario/
- https://www.periodicocubano.com/uscis-tiene-buenas-noticias-para-los-cubanos-que-aplican-al-parole-humanitario/
- https://www.mariopenton.com/residencia-por-ajuste-cubano-tarda-cada-vez-mas-el-plazo-alcanza-su-peor-registro-en-seis-anos/
- https://www.lanacion.com.ar/estados-unidos/migraciones/confirmado-por-uscis-la-green-card-bajo-la-ley-de-ajuste-cubano-registra-una-demoras-de-casi-un-ano-nid03102026/
- https://www.lanacion.com.ar/estados-unidos/visas-y-tramites/confirman-nueva-regla-del-uscis-que-complicaria-a-cubanos-con-green-card-en-tramite-por-ley-de-nid28092026/
- https://www.unotv.com/us/inmigracion-us/ley-de-ajuste-cubano-las-residencias-aprobadas-caen-mas-de-99/
- https://www.unotv.com/us/actualidad-us/green-card-para-cubanos-por-que-un-ano-en-ee-uu-no-basta-ante-la-caida-de-aprobaciones/
- https://cubafull.com/noticia/uscis-entrevistas-ajuste-estatus
- https://cubafull.com/noticia/nuevo-formulario-i-485-uscis
- https://www.cubanet.org/cubanos-crean-grupos-virtuales-para-compartir-informacion-sobre-parole/
- https://www.multicuba.com/blog/parole-humanitario-ultimas-noticias/
- https://eltoque.com/cubanos-afectados-por-la-revocacion-del-parole-humanitario-incertidumbre-y-opciones-legales
- https://www.telemundo51.com/noticias/local/termina-el-parole-humanitario-para-personas-de-cuba-haiti-nicaragua-y-venezuela/2666661/
- https://www.martinoticias.com/a/abogado-aclara-dudas-sobre-patrocinio-a-inmigrantes-cubanos-y-la-opci%C3%B3n-para-balseros/347067.html
- https://www.diariolasamericas.com/florida/fallo-bloquea-posibilidad-miles-acogerse-ley-ajuste-cubano-n5343039
- https://www.diariolasamericas.com/parole-a22399
- https://noticias.cubitanow.com/abogado-willy-allen-asegura-que-la-ley-de-ajuste-cubano-sigue-vigente-y-descarta-retornos-obligatorios-a-cuba
- https://noticias.cubitanow.com/ley-de-ajuste-cubano-se-mantiene-firme-pese-a-cambios-internos-en-la-isla
- https://noticias.cubitanow.com/grupo-comunista-buena-fe-desmiente-rumores-sobre-parole-humanitario-en-miami-y-reafirma-su-compromiso-con-cuba
- https://www.outlookindia.com/international/cuban-green-card-approval-rate-falls-us-immigration-rules
- https://www.visaverge.com/greencard/cuban-green-card-approvals-drop-to-237-as-trump-administration-tightens-uscis-rules/
- https://riotimesonline.com/cuba-dignity-act-cuban-migrants-2026

**Law-firm and guide pages**
- https://casaislaw.com/is-the-cuban-adjustment-act-still-valid-updated-guide-for-2026-applicants/
- https://casaislaw.com/areas/cuban-adjustment-act/
- https://casaislaw.com/cuban-immigration-to-the-u-s-how-the-adjustment-process-works/
- https://casaislaw.com/will-the-cuban-adjustment-act-survive-proposed-immigration-changes/
- https://vasquezlawnc.com/blog/cuban-immigration-guide-2026
- https://lluislaw.com/cuban-adjustment-act/
- https://bwea.com/cuban-adjustment-act-caa/
- https://demaio-law.com/en/post/what-is-the-cuban-adjustment-act-and-who-qualifies
- https://www.demaio-law.com/post/requisitos-de-la-ley-de-ajuste-cubano-en-2026-errores-comunes-que-pueden-retrasar-su-green-card
- https://www.santoslloydlaw.com/es-usted-elegible-para-solicitar-el-estatus-de-residente-permanente-legal-bajo-la-ley-de-ajuste-cubano
- https://www.estrellaimmigration.com/espanol/practice-area/temporibus-autem/
- https://jaskot.abogado/news/immigration-law/complete-guide-to-the-cuban-adjustment-act-in-the-united-states/
- https://info.requisitos-usa.com/ley-de-ajuste-cubano/
- https://visafortheunitedstates.com/visa-types/tourist-visa/us-visa-for-cuban-citizens-2026-cuban-adjustment-act-chnv-asylum-green-card/
- https://fedlaws.org/cuban-migration-to-the-us-adjustment-act-parole-and-asylum/
- https://storyconsole.miaminewtimes.com/sc/what-to-check-before-filing-under-the-cuban-adjustment-act
- https://stilt.com/immigrants/form-i-485-processing-time/
- https://www.jdsupra.com/topics/i-485-applications/adjustment-of-status

**Government, court and policy records**
- https://www.govinfo.gov/content/pkg/FR-2025-03-25/html/2025-05128.htm
- https://www.govinfo.gov/content/pkg/FR-2025-12-15/html/2025-22744.htm
- https://public-inspection.federalregister.gov/2025-22744.pdf
- https://www.govinfo.gov/content/pkg/USCOURTS-mad-1_25-cv-10495/pdf/USCOURTS-mad-1_25-cv-10495-1.pdf
- https://storage.courtlistener.com/recap/gov.uscourts.mad.281389/gov.uscourts.mad.281389.199.3.pdf
- https://caselaw.findlaw.com/court/us-dis-crt-d-mas/117314613.html
- https://clearinghouse.net/case/46186/
- https://justiceactioncenter.org/case/svitlana-doe-v-noem/
- https://justiceactioncenter.org/wp-content/uploads/2026/01/250-1-Kernochan-Decl-1.pdf
- https://iptp-production.s3.amazonaws.com/media/documents/2025.12.29_Motion_for_TRO_-_Doe_v._Noem.pdf
- https://www.uscis.gov/archive/litigation-related-update-on-chnv
- https://www.cliniclegal.org/resources/parole/chnv-parole-terminations-paused-district-court
- https://www.cliniclegal.org/resources/humanitarian-relief/uscis-announces-policy-change-regarding-parole-status-certain-cubans
- https://visainamerica.com/doe-v-noem-frp-parole-termination-case/
- https://www.uscis.gov/newsroom/alerts/dhs-ends-the-abuse-of-the-humanitarian-parole-process-and-terminates-family-reunification-parole
- https://www.uscis.gov/green-card/green-card-eligibility/green-card-for-a-cuban-native-or-citizen
- https://uscis.gov/i-485-addresses
- https://www.uscis.gov/sites/default/files/document/forms/i-485.pdf
- https://niwaplibrary.wcl.american.edu/wp-content/uploads/USCIS-AFM-23.11-CAA-VAWA-CAA.pdf
- https://www.law.cornell.edu/cfr/text/8/212.12
- https://salazar.house.gov/media/press-releases/salazar-urges-department-homeland-security-protect-paroled-cubans-venezuelans
- https://salazar.house.gov/sites/evo-subsites/salazar.house.gov/files/evo-media-document/programa-parole-chnv.pdf
- https://www.otda.ny.gov/policy/gis/2025/25DC054.pdf
- https://otda.ny.gov/policy/gis/2024/24DC032.pdf
- https://en.wikipedia.org/wiki/Cuban_Adjustment_Act
- https://en.wikipedia.org/wiki/Parole_for_Cubans,_Haitians,_Nicaraguans,_and_Venezuelans

**Added in the 2026-10-20 verification pass (fact-checker + editor searches; none opened directly)**
- https://egov.uscis.gov/processing-times/historic-pt (Cuban Adjustment row values; fact-check)
- https://www.harrisbeachmurtha.com/insights/federal-court-vacates-uscis-adjudication-pauses/
- https://www.federalregister.gov/documents/2025/12/15/2025-22744/termination-of-family-reunification-parole-processes-for-colombians-cubans-ecuadorians-guatemalans
- https://www.boundless.com/blog/uscis-expands-immigration-adjudication-pause-39-countries
- https://www.lehighvalleyimmigrationlawyers.com/blog/i-485-filing-fees-in-2026-what-marriage-based-applicants-actually-pay
- https://www.cubaenmiami.com/espera-por-la-green-card-llega-a-los-tribunales-143-cubanos-demandan-a-uscis-por-atrasos-en-sus-casos/
- https://github.com/marcodallastella/USCIS-check-case-status/blob/main/README.md
- https://www.cubaheadlines.com/articles/342267 (new lawsuit, Oct 2026; per fact-check)
- https://www.supremecourt.gov/opinions/24pdf/24a1079_p86b.pdf (*Noem v. Doe* stay order, May 30 2025)
- https://natlawreview.com/article/supreme-court-reverses-lower-court-order-pausing-termination-chnv-parole-program
- https://leadingage.org/supreme-court-allows-for-termination-of-humanitarian-parole-program/
- https://www.seyfarth.com/news-insights/chnv-parole-update-scotus-grants-stay-terminations-may-proceed-but-implementation-unclear.html
- https://www.gunster.com/newsroom/publications/termination-of-chnv-parole-programs-impact-on-parole-status-and-c-11-ead-authorization-what-u-s-employers-should-know
- https://justiceactioncenter.org/news/u-s-appeals-court-greenlights-trumps-mass-revocation-of-lawful-status-and-work-authorization-from-hundreds-of-thousands-of-parole-beneficiaries/
- https://drmantonya.com/resources/chnv-parole-program-guide
- https://welcome.us/explainers/latest-changes-to-humanitarian-parole-programs-including-private-sponsorship-programs
- https://www.lehighvalleyimmigrationlawyers.com/blog/marriage-green-card-after-parole-cbp-one-humanitarian-parole (claims a Mar 31 2026 ruling; unverified)
- https://noticias.cubitanow.com/uscis-confirma-que-cubanos-bajo-la-ley-de-ajuste-estn-exentos-de-la-carga-pblica
- https://www.mariopenton.com/cubanos-bajo-la-ley-de-ajuste-quedan-fuera-de-la-nueva-regla-de-carga-publica/
- https://lafamiliacubana.com/migracion/ley-de-ajuste-cubano-y-carga-publica-una-exencion-que-alivia-pero-no-despeja-el-laberinto-migratorio/
- https://www.cubaenmiami.com/nueva-alerta-para-solicitantes-de-residencia-uscis-revisara-mas-beneficios-publicos-bajo-regla-de-la-carga-publica/
- https://www.periodicocubano.com/uscis-anuncia-cambios-para-presentar-el-formulario-de-residencia-permanente-o-el-ajuste-de-estatus/
- https://www.periodicocubano.com/uscis-cambia-reglas-para-obtener-la-green-card-factores-a-revisar-desde-septiembre-y-situacion-de-la-ley-de-ajuste-cubano/

---

## 12. Verification notes (2026-10-20)

Fact-check pass (7 searches) plus editor pass (2 searches: *Noem v. Doe* / CHNV litigation
status; CAA public-charge exemption). Egress was blocked for everything except GitHub, npm
and PyPI, so no primary page was opened; **[S]** means the claim appeared in a search-result
summary with the URL cited, **[T]** training knowledge not confirmed today, **[I]** inferred.

### 12.1 What was corrected

1. **FY2026 CAA median.** 11.8 months is the media figure for the Jul 31 2026 cut; the
   official historic-pt table's Aug 30 2026 cut shows **12.3 months**. FY2021 8.5 / FY2022
   5.5 / FY2023 3.3 / FY2024 4.6 / FY2025 7.0 confirmed on the same table. Edited in §1,
   §3.3, §4, §5.2, §5.3 (new item 5), §9. [S egov.uscis.gov/processing-times/historic-pt]
2. **Pause litigation.** Jun 5 2026 vacatur = *Dorcas v. USCIS*, **D.R.I.** (Chief Judge
   McConnell), not D. Mass./1st Cir.; Aug 24 2026 = *Red Eagle Law v. Edlow*, N.D. Cal.,
   PI + nationwide class; USCIS compliance alert Aug 28 2026. Edited in §3.11, §4, §5.3.
   [S harrisbeachmurtha.com]
3. **FRP termination.** FR 2025-22744 (90 FR 58032) ends existing FRP parole **Jan 14
   2026** and revokes EADs; the "pending I-485 keeps parole as of Dec 15 2025" carve-out is
   unconfirmed and now tagged [U]; D. Mass. TRO + reported Jan 24 2026 PI added. Edited in
   §3.11, §4, §8.1. [S federalregister.gov]
4. **Pause timeline completed.** PM-602-0192 (Dec 2 2025, 19 countries), PM-602-0194
   (Jan 1 2026, 39 countries), partial lifts Mar 30 / Apr 30 2026. `regime_bucket` values
   expanded accordingly. Edited in §4, §8.1, §8.2. [S boundless.com]
5. **I-485 fee.** $1,440 on paper (unchanged since Apr 2024); $2,940 unsupported as an
   I-485 fee. Edited in §3.9, §5.3. [S lehighvalleyimmigrationlawyers.com]
6. **Tampa suit.** *Acosta Reynoso v. USCIS*, 8:26-cv-01314 (M.D. Fla.), filed May 4 2026
   (129 → 143 plaintiffs); TRO denied Jul 3, PI denied Jul 30 2026 (Judge Mizelle); case
   ongoing. Edited in §2, §3.10, §4, §5.1, §7. [S cubaenmiami.com]
7. **Official Case Status API.** Returns status / form type / submission date / history
   (EN/ES), OAuth 2.0, **5 TPS and 1,000 requests/day** — server-side polling for a
   crowdsourced base is infeasible; ranked "Secondary (per-user, on-demand only)". Edited
   in §3.3, §7. [S github.com/marcodallastella]
8. **CHNV parole regime (editor search).** The Supreme Court stayed the D. Mass. order on
   **May 30 2025** (*Noem v. Doe*, 24A1079); DHS termination notices from **Jun 12 2025**;
   the **First Circuit on Sep 12 2025** held the termination likely lawful; "almost all"
   CHNV parole revoked by Mar 2026. CHNV Cubans must be bucketed as parole-terminated /
   c11 EAD revoked from mid-2025, not "stayed". Edited in §3.11, §4, §5.3 (new item 6),
   §8.1. [S supremecourt.gov, natlawreview.com, seyfarth.com, gunster.com,
   justiceactioncenter.org, drmantonya.com]
9. **Public charge (editor search).** CAA applicants are exempt by statute and DHS
   confirmed it expressly in the final rule (FR publication Jul 20 2026; applies to I-485s
   filed on/after Sep 18 2026); I-485 edition 09/18/26 mandatory, no grace period; a
   Cuban adjusting through an ordinary family petition is not exempt. Upgraded from [L] to
   [S] in §3.10, §4, §8.1. [S noticias.cubitanow.com, mariopenton.com,
   periodicocubano.com, lafamiliacubana.com]
10. **Confidence legend** extended with [S]/[T]/[I] (§0) and the method note updated.

### 12.2 Load-bearing claims that remain unverified

- Exact pending count **342,360** at Jun 30 2026 (">342,000" confirmed) and the Inmigreat
  **355,371** figure; the app must read the USCIS quarterly I-485 "Cuban Adjustment" table
  directly. [U]
- "USCIS confirms resumption **Jul 16 2026**" after *Dorcas* — no result mentions it; the
  only confirmed USCIS compliance announcement is Aug 28 2026. [U]
- `egov.uscis.gov/processing-times/api/forms`, `/api/formoffices/{form}`,
  `/api/processingtime/{form}/{office}` still responding in 2026 — untested; the "primary
  for priors" ingestion path depends on them. [U]
- `my.uscis.gov/account/case-service/api/cases/{receipt}` — confirmed as the endpoint used
  by Enase/uscis-case-tracker and uscis-tracker.github.io (plus a `case_status` path and a
  secure-messaging `receipt_info` path), but internal, session-based, undocumented and
  changeable without notice. [S for use; U for stability]
- "Immigrate Case Tracker" identity, its >1,200-approval claim, and whether it equals
  Inmigreat — not searched. [U]
- Raw counts Jul 2026 = 308; Jan 2026 = 15; Jan–Mar 2026 = 50/45 (the 52.6 % share was
  echoed); Apr–Jun 2024 = 49,965 — not individually re-confirmed. [U]
- Reddit Data API free non-commercial tier / ~100 queries-per-minute limit; Meta ToS
  prohibition on automated collection; YouTube Data API quotas. [T]
- FR Doc. 2025-05128 = 90 FR 13611 CHNV termination notice (Mar 25 2025). [T]
- 91 FR 45324 as the public-charge rule citation. [U]
- Claimed **Mar 31 2026** ruling restoring CHNV parole (single law-firm post; contradicted
  by the Sep 12 2025 First Circuit ruling and the "almost all revoked" reports). [U]
- FRP "pending I-485 keeps parole" carve-out. [U]
- The 09/18/26 I-485 edition being mandatory with no grace period rests on a single
  law-firm source plus Cuban media. [L]

### 12.3 Missing points, now added

- Government's stated position (noted by the court) that the **May 21 2026 discretion
  memo does not apply to CAA applications** — §4 row and `discretion_memo_regime` flag in
  §8.1. [S per fact-check: CiberCuba Oct 20 2026 / VisaVerge]
- **Supreme Court stay of May 30 2025** and the subsequent CHNV termination sequence —
  §3.11, §4, §5.3, §8.1. [S]
- **Oct 2026 lawsuit** against USCIS's new green-card restrictions — §3.11, §4. [S per
  fact-check: CubaHeadlines 342267; Periódico Cubano]
- **39-country expansion and partial lifts** — §4, §8.1. [S]
- **FY2021/FY2022 medians** extending the baseline series — §4, §5.2, §9. [S]
- **Mandamus rule of thumb** (>2 yr, realistically ~3 yr) and the Tampa TRO/PI denials —
  §3.10, §8.1. [S per fact-check: Directorio Cubano]
- **Case Status API rate limits** (1,000/day) and why it stays "Secondary" — §3.3, §7. [S]
- **Living-table warning:** every ingested median must carry its cut date — §3.3, §5.3,
  §9. [I]
- From training knowledge, not confirmed today: *Noem v. Doe* was decided on the emergency
  docket with Justice Jackson dissenting, joined by Justice Sotomayor; Judge Talwani's
  Apr 14 2025 order had required case-by-case review before any termination; the
  First Circuit's Sep 2025 decision reviewed that order on the merits of the government's
  appeal. [T]
