# 13 — Live data endpoints: exact URLs, auth, response shapes, cadence, and the CI probe plan

**Research date:** 2026-10-20. **Author:** research agent (endpoint-catalog topic). **Edited 2026-10-20** after an adversarial fact-check pass (see "Verification notes" at the end).
**Companion files:** `04-uscis-data-sources.md` (USCIS products, read from the files themselves), `05-other-government-data.md` (OHSS, CBP, Federal Register, CourtListener, Census in depth). This file does not repeat their analysis; it pins down, for every candidate *live* endpoint, the things an ingestion job needs: exact URL pattern, auth, response fields, cadence, rate limits, and a probe to run from GitHub Actions.

**Tag legend (every factual claim carries one):**

| Tag | Meaning |
|---|---|
| **[S]** | Stated in a search result, a GitHub file, or a prior agent's saved copy of a GitHub file that I read today; the URL is cited inline and listed under Sources. |
| **[T]** | From training knowledge; not confirmed today. |
| **[I]** | Inferred by me from [S]/[T] facts; flagged so the probe can test it. |
| **[S-fc]** | Reported by the 2026-10-20 adversarial fact-check pass with a cited URL, but not independently re-confirmed by the editor (search budget exhausted); the probe should treat it as an expectation, not a fact. |

**Environment caveat.** This sandbox's egress proxy refuses `CONNECT` to every government and news host (`uscis.gov`, `egov.uscis.gov`, `developer.uscis.gov`, `api-int.uscis.gov`, `ohss.dhs.gov`, `cbp.gov`, `federalregister.gov`, `courtlistener.com`, `api.census.gov`). Only `github.com`, `raw.githubusercontent.com`, `registry.npmjs.org` and `pypi.org` are reachable. **No endpoint below was called from here.** Everything about request/response behaviour is read from (a) open-source code that calls these endpoints, fetched today from GitHub, (b) search-result summaries of official pages, and (c) files earlier agents saved into this session's scratchpad. The probe plan in §12 exists precisely so that the first GitHub Actions run produces the real samples.

---

## 0. One-page endpoint matrix

| # | Source | Base URL | Auth | Format | Cadence | Reachable from GitHub Actions? | App use |
|---|---|---|---|---|---|---|---|
| 1 | USCIS Processing Times JSON | `https://egov.uscis.gov/processing-times/api/…` (legacy REST) and `POST https://egov.uscis.gov/processing-times` (Next.js server actions) | none, but browser headers + Cloudflare cookies | JSON / React Flight stream | silent, often daily; `publicationDate` in payload | **Probably not** — Cloudflare blocks cloud IPs incl. GitHub's [S]; fall back to community SQLite releases | 80th-percentile months and case-inquiry date per form/subtype/office |
| 2 | USCIS Case Status Online (web) | `https://egov.uscis.gov/casestatus/landing.do`; SPA backend `egov.uscis.gov/csol-api/…` | none; Cloudflare JS challenge | HTML / JSON | real time | No (challenge) | not used; see Torch |
| 2b | **Torch Case Status API** | sandbox `https://api-int.uscis.gov/case-status/{receipt}`; prod `https://api.uscis.gov/case-status/{receipt}` | OAuth2 client-credentials (`/oauth/accesstoken`) | JSON | real time | **Yes** (sandbox; the weekday 7am–8pm ET window is community-observed, not official) | per-case milestones for users who opt in |
| 3 | USCIS Immigration & Citizenship Data portal | `https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data` → files under `https://www.uscis.gov/sites/default/files/document/data/` | none | HTML index → XLSX/CSV | monthly CSV ~4–6 weeks after month end; quarterly XLSX ~10 weeks after quarter end | Yes, with a browser User-Agent (Drupal anti-bot 403s default agents) [S] | national CAA volumes (monthly), CAA median (quarterly), per-office humanitarian pending (quarterly) |
| 4 | DHS OHSS monthly tables & Yearbook | `https://ohss.dhs.gov/topics/immigration/immigration-enforcement/monthly-tables`; `https://ohss.dhs.gov/topics/immigration/yearbook/2024` | none | HTML → XLSX | monthly (third Thursday) [S]; yearbook annual | Yes (expected) | CHNV parolee counts by month/nationality; Cuba-born LPRs by state |
| 5 | CBP CHNV statistics | no standalone page; monthly press releases `https://www.cbp.gov/newsroom/national-media-release/cbp-releases-<month>-<year>-monthly-update` | none | HTML | series ended Jan 2025 | Yes (expected) | cohort size: 110,240 Cubans paroled through Dec 2024 [S] |
| 6 | Federal Register API | `https://www.federalregister.gov/api/v1/documents.json` | none | JSON | continuous (daily issue ~6am ET) | Yes | alerts on DHS/USCIS notices mentioning Cuba/parole |
| 7 | CourtListener REST v4 | `https://www.courtlistener.com/api/rest/v4/` | **token required** for `/dockets/`, `/docket-entries/`, `/opinions/` etc. (v4.3 enforces auth; anonymous → 401) [S]; `Authorization: Token …`; only `/search/`, `/courts/`, `/audio/` answer anonymously [S] | JSON | continuous | Yes, with `COURTLISTENER_TOKEN` (5/min, 50/hr, 125/day default) [S] | docket entries and alerts for the parole / adjustment-processing litigation |
| 8 | Census ACS API | `https://api.census.gov/data/<vintage>/acs/acs1` and `/acs5` | optional key (500 queries/IP/day without) [S] | JSON arrays | annual vintages | Yes | Cuba-born population by state (`B05006_143E`) |
| 9 | USCIS newsroom RSS | `https://www.uscis.gov/news/rss-feed/<id>` (22984 alerts, 23269 news releases, 59144/60288 all news, 93166 fact sheets, 97790 stakeholder messages) [S] | none; browser UA | RSS 2.0 | event-driven | Yes with browser UA [S] | alerts feature |
| 10 | (bonus) USCIS FOIA metrics JSON | `https://first.uscis.gov/api/public/foia-metrics` | none; `Referer: https://first.uscis.gov/` | JSON | daily | Unknown (same Cloudflare family) | not needed |
| 11 | (bonus) community mirrors | `https://github.com/jzebedee/uscis/releases` (daily SQLite); `https://raw.githubusercontent.com/omairqazi29/visualizer/master/data/USCIS_I485/…` | none / GitHub token | SQLite / XLSX / CSV | daily / weekly | **Yes** (GitHub is always reachable from Actions) | guaranteed-reachable fallback for #1 and #3 |

---

## 1. USCIS Processing Times JSON API (`egov.uscis.gov/processing-times`)

### 1.1 Legacy REST endpoints (base `https://egov.uscis.gov/processing-times/api/`)

These four GETs are what every community tracker has used since at least 2021 and are still called by code updated in 2025–2026 (`harshil-sanghvi/visapulse`, `marambo-code/F-1Careers`, `ajduberstein/uscis-wait-times`, `coatless-r-n-d/uscis-processing`, `arielsvn/uscis-processing-times`) [S].

| Step | URL pattern | Example | Response path → fields | Tag |
|---|---|---|---|---|
| 0 | `GET https://egov.uscis.gov/processing-times/` | — | HTML; sets session cookies that the API checks | [S] `jzebedee/uscis` scripts, `coatless` `R/api.R` |
| 1 | `GET …/api/forms` | — | `data.forms.forms[]` → `form_name`, `form_description_en`, `form_description_es` | [S] |
| 2 | `GET …/api/formtypes/{form}` | `…/api/formtypes/I-485` | `data.form_types.form_name`; `data.form_types.subtypes[]` → `form_key`, `form_type`, `form_type_description_en`, `form_type_description_es` | [S] |
| 3 | `GET …/api/formoffices/{form}/{form_key}` | `…/api/formoffices/I-485/131A-FAM` | `data.form_offices.{form_name, form_type, offices[] {office_code, office_description}}` | [S] |
| 4 | `GET …/api/processingtime/{form}/{office_code}/{form_type}` | `…/api/processingtime/I-485/MIA/131A-FAM` | `data.processing_time.{form_name, office_code, form_note_en, form_note_es, subtypes[] {form_type, publication_date, service_request_date, subtype_info_en, subtype_info_es, range[] {value, unit}}}` | [S] |

Evidence seen today for the field names: `visapulse/lib/uscis.ts` reads `d.data.processing_time.subtypes[0].range` and filters `r.unit === 'Months'` and maps `r.value` [S]; `F-1Careers/app/api/processing-times/route.ts` reads `data.data.processing_time.subtypes` and `row.range[0]` / `row.range[1]` as max/min months [S]; `ajduberstein/fetch.py` iterates `json["subtypes"]` [S]. The `range[]` array historically held two entries (upper, lower); since the 2024–2025 switch to a single published figure, parsers must accept one or two entries [S, `04-uscis-data-sources.md` §2.1].

A two-segment variant `…/api/processingtime/{form}/{office}` (no subtype) is used by `visapulse` and `F-1Careers` for service-centre forms (I-140); the response then contains all subtypes for that office [S]. The I-485 calls in the trackers always use the three-segment form.

**Required headers (read from code, [S]):**

```
User-Agent: <a real browser UA string>
Accept: application/json, text/plain, */*
Referer: https://egov.uscis.gov/processing-times/
Cookie: <jar from step 0>
```
`ajduberstein/fetch.py` HEADERS: `accept: application/json, text/plain, */*`, `user-agent`, `Referer: https://egov.uscis.gov/processing-times/` [S]. `jzebedee/uscis/curl_request_api.sh` sends `-b uscis.cookies --cookie-jar uscis.cookies -H "Referer: https://egov.uscis.gov/processing-times/"` through `curl_chrome_uscis` (curl-impersonate) with `--parallel-max 2` or a `--rate` cap [S]. The API sends no CORS headers, so it cannot be called from a WebView on another origin [S, doc 04 §2.2].

### 1.2 Current transport: Next.js server actions behind Cloudflare (2025–2026)

`jzebedee/uscis` (daily dataset, latest release observed 2026-10-15 in doc 04) rewrote its collector because the page became a Next.js app. The request now observed in `curl_request_next_action.sh` [S, file read today]:

```
POST https://egov.uscis.gov/processing-times
Origin: https://egov.uscis.gov
Referer: https://egov.uscis.gov/processing-times
Next-Action: <action id resolved from the page's JS bundles>
Content-Type: application/json
Accept: text/x-component
Cookie: uscis.cookies (Cloudflare cookies from populate_cookies.sh)
Body: JSON array of positional args, e.g. ["I-485","131A-FAM","MIA"]
```

* Action names cached once per build in `build_db.sh`: `getFormNumbers`, `getFormCategories`, `getOfficesScs`, `getProcessingTime` [S]. `query-processing-time-urls.sql` generates one call per `(form_name, form_key, office)` from the `form_types.offices` JSON column: `getProcessingTime "<form>" "<form_key>" "<office>"` [S].
* The action id is not stable; `resolve_next_action_id.py` fetches `https://egov.uscis.gov/processing-times`, regex-extracts `/processing-times/_next/static/chunks/*.js` bundle URLs, downloads them and searches for the action name [S].
* Cloudflare handling in the same script: bodies containing `Sorry, you have been blocked` or `Attention Required! | Cloudflare` abort immediately; `Just a moment...` in the body or a `cf-mitigated: challenge` response header triggers one cookie refresh via `populate_cookies.sh` and one retry, then aborts [S].
* `normalize_next_response.py` converts the React Flight response back to the legacy JSON shape using the `njsparser` library, targeting paths `("data","forms")`, `("data","form_types")`, `("data","form_offices")`, `("data","processing_time")` or their top-level equivalents [S]. So the legacy field names above remain the canonical schema for the app.
* The resulting SQLite schema (README v0.5, 2025-02-23) [S]: `forms(name, description_en, description_es)`; `offices(code, description)`; `form_types(form_name, form_key, form_type, description_en, description_es, offices JSON)`; `processing_time(form_name, office_code, form_note_en, form_note_es, form_subtype, publication_date, range_upper, range_upper_unit, range_lower, range_lower_unit, service_request_date, subtype_info_en, subtype_info_es, subtype_note_en, subtype_note_es)`; `foia_processing_time(id, metricTimestamp, metricName, metricValue, trackId, officeId, officeCode)`.
* README changelog v0.4 (2025-02-03): "USCIS has begun aggressively blocking scraping requests and significantly limited who can reach their website. Collecting form processing times now requires … residential proxy servers." [S]. Doc 04 adds (from `scoakley23/Pathways`) that "USCIS uses a Cloudflare bot check that blocks cloud servers, including GitHub's" [S].

### 1.3 Subtypes for I-485 — is there a Cuban Adjustment Act subtype?

**No evidence of one.** The Oct 2024 snapshot parsed in doc 04 lists exactly seven I-485 `form_key`s: `131A` (Employment), `131A-FAM` (Family), `131A-HRIFA`, `131B` (Asylee), `131C` (Refugee), `131T`, `131U`; the Sept/Oct 2026 `jzebedee` sqldiff release notes touch only those keys [S, doc 04 §2.4]. Today's two targeted searches — one in English for the subtype list, one in Spanish for Cuban-community reports of a "Ley de Ajuste" entry in the USCIS tool — returned nothing: the Spanish-language results (novo-legal.com's "I-485 Miami FL (2026)" page is literally keyed `i-485-miami-fl-131a-fam`, i.e. the family subtype) and the search summary explicitly said "ninguno de los resultados menciona tiempos específicos para casos bajo esa ley" [S]. Treat "no CAA subtype" as **[S] for 2024, [I] for today**, and let the probe confirm by diffing `formtypes/I-485` against the seven known keys.

Proxies the app should use (from doc 04): `131A-FAM` at the applicant's field office for the 80th-percentile and case-inquiry date; `I-765` keys `147-C9` (pending-I-485 EAD) and `147-C11` (parole EAD) at `NBC`/`SCD` [S].

Third-party claim to verify, not trust: an Apify actor listing says USCIS "publishes current processing times … through a live JSON API" at `https://egov.uscis.gov/processing-times/api/processingTimes.json`, "updated weekly, no authentication" [S, apify.com]. No tracker code uses that path; the probe should HEAD it and record the result, expecting 404 [I].

### 1.4 Cadence and limits

* USCIS says the page is updated monthly, but trackers observe silent changes "sometimes multiple times per day" [S, jzebedee README]. `publication_date` (e.g. "October 18, 2024") travels in the payload, so the probe can detect real refreshes without diffing every cell.
* No documented rate limit; the practical limits are Cloudflare's. `jzebedee` runs `--parallel-max 2` from a residential exit at `30 4 * * *` UTC [S, doc 04]; `Pathways` fetches monthly from a laptop with a human solving challenges [S, doc 04].
* The methodology text on `https://egov.uscis.gov/processing-times/more-info` (read by `adamjali/perm` from a Jan 30 2024 Internet Archive capture because the live page "answers scripts with a bot challenge"): "the amount of time it took us to complete 80% of adjudicated cases over the last six months"; some forms still use the older "cycle time" methodology [S].

### 1.5 Historic national medians page

`https://egov.uscis.gov/processing-times/historic-pt` — HTML table of FY medians by form/classification including a "Based on Cuban Adjustment Act of 1966 (CAA)" row (FY2023 3.3 → FY2024 4.6 → FY2025 7.0 → FY2026 YTD 11.8 months) [S, doc 04 §2.6 citing CiberCuba/cubaheadlines]. Same host, same Cloudflare; same fallback rules apply.

### 1.6 Guaranteed-reachable fallback for the processing-times data

`jzebedee/uscis` publishes one release per day, tagged by date (e.g. `2026-10-15`, `2026-09-25`), built by `build_db.sh` which renames the DB to `$(date +%F).db` and attaches `sqldiff` release notes [S]. The release asset is therefore expected at `https://github.com/jzebedee/uscis/releases/download/<YYYY-MM-DD>/<YYYY-MM-DD>.db` [I — name derived from the script]; the GitHub API `GET https://api.github.com/repos/jzebedee/uscis/releases/latest` returns the exact `assets[].browser_download_url` and is callable from Actions with the built-in `GITHUB_TOKEN` [T]. The probe should download the latest `.db`, open it with `better-sqlite3` or `sql.js`, and dump the I-485 and I-765 rows as the app's first processing-times sample. Licence caveat from doc 04: the repo has no LICENSE file; ask before redistributing.

---

## 2. Case Status Online and the Torch Case Status API

### 2.1 Case Status Online (consumer web)

* Landing page `https://egov.uscis.gov/casestatus/landing.do` [S]; input a 13-character receipt number. The modern SPA calls a backend under `egov.uscis.gov/csol-api/` — `finxster`'s README notes that "the public `egov.uscis.gov/csol-api/case-tracking/` endpoint is protected by Cloudflare JS challenges" [S]. (From training, the per-receipt JSON lives at `https://egov.uscis.gov/csol-api/case-statuses/{receipt}` [T, unconfirmed]; do not build on it.)
* Community scrapers run headless Chrome (`pkhanpara/uscis-case-status` on PyPI 1.0.1: "scrapes the USCIS website", needs Chromium + Xvfb; output `date` like `01/15/2026` and a `status` sentence) [S]. The logged-in myUSCIS JSON (`https://my.uscis.gov/account/case-service/api/cases/{receipt}`, `…/api/case_status/{receipt}`) returns HTTP 500 for receipts the account does not own and depends on login.gov 2FA via e-mail [S, finxster + wangchao92 READMEs]. **Not suitable for the app** (ToS, fragility, Cloudflare).

### 2.2 Torch developer portal — Case Status API (official)

| Item | Value | Tag / source |
|---|---|---|
| Portal / docs | `https://developer.uscis.gov/`, API page `https://developer.uscis.gov/api/case-status` (OpenAPI spec version 1.0.1; "the portal is JavaScript-rendered and refuses scripted fetches, so read it in a browser") | [S] `adamjali/perm` `torchClient.ts` header |
| Sign-up / sandbox / production pages | `https://developer.uscis.gov/get-started/sign-up`, `…/get-started/sandbox`, `…/get-started/production-access/request`, `…/get-started/production-access/demo` | [S] search results |
| Token endpoint (sandbox) | `POST https://api-int.uscis.gov/oauth/accesstoken`, `grant_type=client_credentials`, `client_id`, `client_secret`; scope `read`; response `{ access_token, expires_in }` (seconds; 1,800 s per doc 04) | [S] `torchClient.ts`, `theoriginalsam/I-140-Insights`, `zlovtnik/uscisApex`, `ppritish51/Immigration-Command-Center` |
| Case endpoint (sandbox) | `GET https://api-int.uscis.gov/case-status/{receiptNumber}` with `Authorization: Bearer <token>`, `Accept: application/json` | [S] same repos + `api-evangelist` README |
| Production hosts | `https://api.uscis.gov/oauth/accesstoken`, `https://api.uscis.gov/case-status/{receiptNumber}` ("the same paths under it answer 401 to an unauthenticated probe (verified live)" per adamjali; a 2024 demo-pass letter posted by Inmigra also gives `https://api.uscis.gov/case-status` with production keys available 2024-10-01) | [S] |
| Sandbox limits | 5 TPS (one request per 200 ms), 1,000 requests/day; staging receipt numbers only (e.g. `EAC9999103402`) — official, but the sandbox page has not been updated since ~early 2025 (~600 days), so the limits may have drifted silently. The **weekday 7 AM–8 PM ET window with 503 outside** appears only in community code (`torchClient.ts`), not on any USCIS page: treat it as observed behaviour and have the probe log 503s with timestamps rather than assume the schedule | [S] USCIS sandbox page via search (TPS, daily quota); [S-code]/[T] `torchClient.ts` (operating window) |
| Production limits | USCIS says quota "will be shared when production access is granted". `torchClient.ts`, quoting the OpenAPI spec: **10 TPS, 400,000/day, "resets everyday at -04:00 UTC (Midnight EST)"**; `aayushga/uscis-case-cohort-analyzer` (doc 04) claims 10 TPS / 150,000/day. Treat as unconfirmed until USCIS sends the production letter. | [S] conflicting |
| Production process | five steps: sign up → create keys → use sandbox → request production by e-mail → pass a demo and receive keys. Demos first-come-first-served on **Wednesdays and Thursdays, 1:00–2:00 PM EST**, Case Status demo is **30 minutes**; prerequisite ≥5 consecutive calendar days of sandbox traffic including 200 and 4xx responses (doc 04). The Get Started page once showed production as "Currently Unavailable" (page ~600 days old, doc 04). No 2026 change found. | [S] |
| Status note | developer.uscis.gov home page carries a sandbox monitoring item about **302 errors for the Case Status API (Sandbox)** — the probe should treat a 302 as "sandbox incident", not as a bug | [S] search summary |
| Undocumented sibling | `https://api-int.uscis.gov/processing-times` and `https://api.uscis.gov/processing-times` exist (401 to unauthenticated probes) but are not in the portal catalogue; shape unknown | [S] `torchClient.ts` |

**Response shape (JSON, two variants) [S, `torchClient.ts` quoting the spec; field names also in doc 04's api-evangelist profile]:**

```jsonc
{
  "case_status": {
    "receiptNumber": "EAC9999103402",
    "formType": "I-485",
    "submittedDate": "09-05-2023 14:28:46",   // MM-DD-YYYY HH:mm:ss; ABSENT for IOE (online-filed) cases
    "modifiedDate": "09-05-2023 14:28:46",    // same; absent for IOE
    "current_case_status_text_en": "Case Was Received",
    "current_case_status_desc_en": "On September 5, 2023, we received your Form I-485 …",
    "current_case_status_text_es": "…",
    "current_case_status_desc_es": "…",
    "hist_case_status": [                     // timeline
      { "date": "2023-09-05", "completed_text_en": "…", "completed_text_es": "…" }
    ]
  }
}
```
Errors: `401` bad/expired token; `404` unknown receipt **or** a receipt protected under 8 U.S.C. § 1367 (same 404 on purpose); `422` wrong shape or unknown prefix; `429` "Spike Arrest Violation" on TPS or daily quota; `503` sandbox closed [S]. Doc 04's third-party OpenAPI profile names the history array `historicalCaseStatuses[]` with `{status, date, description, descriptionEsDesc}`; the two readings disagree, so the zod schema in §12 accepts either key and the probe records which one the sandbox actually returns.

Receipt-number validation used by clients: `^[A-Z]{3}\d{10}$`; prefixes `EAC|WAC|LIN|SRC|YSC|MSC|NBC|IOE` [S, doc 04 §3.3].

---

## 3. USCIS Immigration and Citizenship Data portal — latest quarter and direct file URLs

### 3.1 Index page and the Drupal anti-bot rule

* Index: `https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data` — a filterable list of report cards whose links point at `https://www.uscis.gov/sites/default/files/document/{data|reports|forms}/…` [S]. There is no API/RSS; `omairqazi29/visualizer` scans this page weekly with regexes `i485_performance`, `i485_performancedata`, `i485_performance_data`, `i-485.*performance`, `quarterly_all_forms`, `all.?forms.*fy\d{4}` (xlsx) and `appropriation_requirement_[a-z]+_\d{4}`, `monthly_.*\.csv`, `i485.*monthly` (csv), restricted to hosts `uscis.gov`/`www.uscis.gov` [S, `registry.py` read today].
* `www.uscis.gov` returns 403 to default HTTP-client user agents ("Drupal antibot"); a plain browser `User-Agent` string gets clean responses for both HTML and RSS [S, `Jaxsonb04/immifile` notes and `convex/news.ts`]. The visualizer's Sept 2026 CI runs show "USCIS and DHS pages in the same data-source run succeeded" from GitHub Actions while `travel.state.gov` was Cloudflare-blocked [S, POLICY_VERIFICATION.md 2026-09-23] — **so uscis.gov file downloads do work from GitHub-hosted runners with a browser UA.**

### 3.2 Direct file URLs seen today

| Product | Direct URL | Evidence | Tag |
|---|---|---|---|
| Quarterly all-forms, FY2026 Q3 (Apr 1–Jun 30 2026) | `https://www.uscis.gov/sites/default/files/document/data/quarterly_all_forms_fy2026_q3_v1.xlsx` | quoted verbatim in `adamjali/perm` guide dated 2026-09-22/26 | [S] |
| I-485 by field office, FY2026 Q3 | `https://www.uscis.gov/sites/default/files/document/data/i485_performance_data_fy2026_q3_v1.xlsx` | quoted verbatim in `adamjali/perm` I-485 guide | [S] |
| Monthly Report to Congress CSV, August 2026 | `https://www.uscis.gov/sites/default/files/document/data/appropriation_requirement_august_2026_v1.0.csv` | GitHub code search hit (greencardwaits.com build script builds `…/document/data/${NATIONAL_CSV}`) | [S] |
| Monthly CSV, August 2024 (older naming, **space in file name**) | `https://www.uscis.gov/sites/default/files/document/data/appropriation_requirement_august%202024.csv` | GitHub code search hit | [S] |
| Monthly CSV, March 2023 (older directory and capitalisation) | `https://www.uscis.gov/sites/default/files/document/resource-information-center-queries/Appropriation_Requirement_March_2023.csv` | GitHub code search hit | [S] |
| I-485 by office, FY2026 Q1 (as used in a visualizer unit-test fixture, directory `reports/`) | `https://www.uscis.gov/sites/default/files/document/reports/i485_performance_data_fy2026_q1_v1.xlsx` | test fixture, may not be the live path | [S-fixture] |
| Earlier quarterly PDFs | `…/document/forms/quarterly_all_forms_fy2023_q4.pdf`, `…/document/reports/Quarterly_All_Forms_FY2021Q1.pdf`, `…/document/data/i485_performancedata_fy2023_qtr3.pdf`, `…/document/reports/I485_performancedata_fy2022_qtr1.pdf` | doc 04 | [S] |

Naming rules the probe must tolerate: the monthly stem is `appropriation_requirement_<month>_<year>_v1.0.csv` since at least mid-2024, but 2023–2024 files used `Appropriation_Requirement_<Month>_<Year>.csv` and `appropriation_requirement_<month>%20<year>.csv`, in three different directories (`data`, `reports`, `resource-information-center-queries`) [S]. The I-485 workbook stem changed four times in two years (`i485_performancedata_fy2025_q3.xlsx` → `i485_performance_fy2025_q4.xlsx` → `i485_performance_fy2026_q1.xlsx` → `i485_performance_data_fy2026_q2_v1.xlsx`) [S, doc 04]. Match loosely; derive the real href from the index page; only use constructed URLs for backfill candidates.

### 3.3 Latest quarter / month available (as of 2026-10-20)

* **Quarterly: FY2026 Q3 (Apr–Jun 2026) is the newest.** Manifest Law published its analysis of the Q3 FY2026 files on 2026-09-09 [S]; the visualizer's scanner downloaded `quarterly_all_forms_fy2026_q3_v1.xlsx` and `i485_performance_data_fy2026_q3_v1.xlsx` in its 2026-09-23 run and merged them 2026-09-28 [S]; the USCIS index page lists "Fiscal Year 2026 Quarter 3" XLSX cards for I-485, Net Backlog and Frontlog, I-130, I-140, I-360 and I-821 [S]; `adamjali/perm` (2026-09-26): "The file for Jul to Sep 2026 isn't published yet; the newest is Apr to Jun" [S]. FY2026 Q4 should appear around early December 2026 [I, from the ~10-week lag].
* **Monthly: August 2026 is the newest confirmed.** The visualizer run on 2026-09-28 downloaded `monthly_august_2026.csv` (~3,629 bytes) [S]. A Spanish-language search today for September 2026 monthly CAA figures found none; the most recent monthly numbers in Cuban media are June (89 approvals) and July 2026 (308) [S, periodicocubano.com; 14ymedio for January's 15]. The September 2026 file, when it lands, should be `…/document/data/appropriation_requirement_september_2026_v1.0.csv` [I]; the probe HEADs it on every run.
* The I-765-by-category workbook for FY2026 Q3 is "dated September 8, 2026" on the portal [S, doc 04]; its filename is unknown — the probe scans the index for `i765` + (`eligib`|`categor`).

### 3.4 Cross-check numbers the probe should assert against (from doc 04, VERIFIED-FILE there)

FY2026 Q3 all-forms `I-485 (Cuban)` row: received 6,279 / approved 139 / denied 447 / completions 586 / pending 342,360 / median 16.3 months; Aug 2026 monthly Cuban row: 1,213 / 386 / 434 / pending 355,520 / pending >6 mo 345,741 / avg 20.6 months. Cuban press confirmation of the Q3 figures: CiberCuba 2026-10-20 and americateve.com ("solo 139 residencias … rechazó otras 447") [S]. These are the regression fixtures for the parsers. A second quarter for the parser to test, reported by Cuban press on 2026-10-20 and relayed by the fact-check pass [S-fc]: FY2026 Q2 (Jan–Mar 2026) `I-485 (Cuban)` approved 50 / denied 45 (approval rate 52.6%, vs 23.7% in Q3); monthly approvals June 2026 89 → July 2026 308. The Q2 workbook should be `quarterly_all_forms_fy2026_q2_v1.xlsx` [I, by analogy]. Caveat: the Q3 received count (6,279) and the exact 16.3-month median, and the entire Aug 2026 monthly row, rest on doc 04's file read only — press coverage confirms 139 / 447 / 586 / 342,360 and "wait over 16 months" but repeats none of the rest.

---

## 4. DHS OHSS — monthly tables and Yearbook LPR tables

### 4.1 Immigration Enforcement and Legal Processes Monthly Tables

* Page: `https://ohss.dhs.gov/topics/immigration/immigration-enforcement/monthly-tables` [S]. It has a **CHNV section with three tables: confirmed beneficiaries, travel authorizations, and parolees** (by month and nationality) in addition to encounters, CBP One appointments, arrests, book-ins, detention, removals, returns, credible fear, and parole [S, search summary of the page].
* Data dictionary: `https://ohss.dhs.gov/about-our-data/governance/data-dictionaries/immigration-enforcement-and-legal-processes-monthly` — xlsx, 61.74 KB, **posted 05/14/2026, report year 2025** [S].
* Cadence: "As of January 2025, OHSS updates this report monthly on the third Thursday of the month" [S]. A USAFacts analyst noted the series had published 13 consecutive months through the January 2025 release of November 2024 data [S]; the existence of a May 2026 data dictionary and of fact-checks titled "What Do ICE's Monthly Removals Tables Show for March–May 2026?" (factually.co) indicates the series resumed and covers at least through May 2026 [S, I].
* File URL pattern, one verified instance used by five independent repos: `https://ohss.dhs.gov/sites/default/files/2025-01/2025_0116_ohss_immigration-enforcement-and-legal-processes-tables-november-2024.xlsx` → `/sites/default/files/<YYYY-MM>/<YYYY_MMDD>_ohss_immigration-enforcement-and-legal-processes-tables-<month>-<year>.xlsx` [S for the instance; pattern I]. `markusstrasser/immigration-research` fetches it with `curl --http1.1 -A "<Chrome UA>"` [S] — use the same.
* Counts are rounded to the nearest 10 and come from the OHSS "Persist" dataset [S, doc 05].

### 4.2 Yearbook of Immigration Statistics — LPR tables

| Table | URL | What the app takes | Tag |
|---|---|---|---|
| 2024 Yearbook landing | `https://ohss.dhs.gov/topics/immigration/yearbook/2024` | "Lawful Permanent Residents 2024 Data Tables (xlsx)" download | [S, doc 05] |
| Table 3 (LPRs by region/country of birth FY2015–2024) | `https://ohss.dhs.gov/topics/immigration/yearbook/2024/table3` | Cuba row | [S, doc 05] |
| Table 6 (type and major class) | `…/yearbook/2024/table6` | refugee/asylee adjustments bucket where CU6/CU7 live | [S, doc 05] |
| Table 7 (detailed class, FY2024) | `…/yearbook/2024/table7` | FY2024 totals 1,364,090 LPRs | [S, doc 05] |
| LPR Supplemental 1 (state × country of birth, FY2024) | `…/yearbook/2024/LPRsupptable1` | **Cuba-born new LPRs by state** | [S, doc 05] |
| LPR Supplemental 2 (CBSA × country) | `…/yearbook/2024/LPRsupptable2` | Cuba-born by metro | [S, doc 05] |
| Whole LPR workbook file name (as mirrored by `omairqazi29/visualizer` on 2026-09-28) | `2026_0604_ohss_yearbook_lawful_permanent_residents_fy2024.xlsx` (plus `2026_0604_ohss_yearbook_naturalizations_fy2024.xlsx`, `2026_0805_ohss_yearbook_asylees_fy2024.xlsx`, `2025_0812_ohss_yearbook_refugees_fy2024.xlsx`, `2026_0806_ohss_yearbook_enforcement_fy2023.xlsx`) | published 2026-06-04 → expected path `https://ohss.dhs.gov/sites/default/files/2026-06/2026_0604_ohss_yearbook_lawful_permanent_residents_fy2024.xlsx` | [S names; I path] |
| Classes of admission reference | `https://ohss.dhs.gov/topics/immigration/lawful-permanent-residents/immigrant-classes-admission` — CU6 "Cuban refugees (P.L. 89-732 of 1966)", CU7 spouses/children | [S, doc 05] |
| Report catalog (change feed) | `https://ohss.dhs.gov/about-our-data/governance/report-catalog` | last-updated dates for every product | [S, doc 05] |

No CSV/JSON API exists; everything is xlsx behind HTML pages [S, doc 05]. The visualizer registry scans `https://ohss.dhs.gov/topics/immigration/yearbook` with depth-1 link following on `yearbook|immigration|statistics|table` [S].

---

## 5. CBP CHNV statistics

* **There is no standalone cbp.gov CHNV statistics page** (none surfaced in any of today's searches, including one restricted to `cbp.gov`/`dhs.gov`; doc 05 reached the same conclusion) [S, I]. CHNV figures were published inside CBP's monthly operational-update press releases through December 2024 and in OHSS's monthly tables (§4.1).
* Press-release URL pattern: `https://www.cbp.gov/newsroom/national-media-release/cbp-releases-<month>-<year>-monthly-update` (seen: `…-august-2024-…`, `…-september-2024-…`, `…-october-2024-…`, `…-november-2024-…`, `…-december-2024-…`, `…-january-2025-…`) [S].
* Last CHNV numbers in that series: **through end of November 2024, 531,670** CHNV nationals "arrived lawfully and were granted parole"; **through end of December 2024, about 531,690**, of which **110,240 Cubans, 211,040 Haitians, 93,070 Nicaraguans, 117,330 Venezuelans** [S, CBP Dec 2024 update]. The November 2024 release gives slightly different per-nationality counts (93,080 Nicaraguans, 117,320 Venezuelans; total 531,670), and the four December figures sum to 531,680, not 531,690 — CBP rounds each figure to the nearest 10 [S-fc]. The probe must therefore assert the four nationality numbers only against the December 2024 page, tolerate ±10 per figure, and check the January 2025 page only for the "paroles have ended" language. The January 2025 update states "CBP One and CHNV paroles have ended" and that CBP "terminated all categorical parole programs and returned to a case-by-case review" [S].
* Policy anchors for the alerts timeline: Federal Register "Termination of Parole Processes for Cubans, Haitians, Nicaraguans, and Venezuelans", document **2025-05128**, published 2025-03-25 (`https://www.federalregister.gov/documents/2025/03/25/2025-05128/…`; public-inspection PDF `https://public-inspection.federalregister.gov/2025-05128.pdf`) [S]; DHS statement on the SCOTUS stay 2025-05-30 and termination notices 2025-06-12 (`https://www.dhs.gov/news/2025/06/12/dhs-issues-notices-termination-chnv-parole-program-encourages-parolees-self-deport`) [S]; and the Federal Register notice "Termination of Family Reunification Parole Processes for Colombians, Cubans, Ecuadorians, Guatemalans, Haitians, Hondurans, and Salvadorans", published 2025-12-15, which ends the Cuban Family Reunification Parole (CFRP) program and is the notice the January 2026 *Doe v. Noem* orders enjoin [S, justiceactioncenter.org FRN decoder; immpolicytracking.org]. Its document number is reported as **2025-22744** (`https://www.federalregister.gov/documents/2025/12/15/2025-22744/…`) [S-fc, number not independently confirmed today].
* Other CBP stats pages worth one HEAD each: `https://www.cbp.gov/newsroom/stats/custody-and-transfer-statistics-fy2025` (monthly SWB dispositions incl. a "parole" row) [S, doc 05]; `https://www.cbp.gov/newsroom/stats/southwest-land-border-encounters` and `…/nationwide-encounters` (dashboard with CSV; Cuba selectable) [T].

---

## 6. Federal Register API v1

* Base: `https://www.federalregister.gov/api/v1/documents.json`; docs `https://www.federalregister.gov/developers/documentation/api/v1`; **no API key** [S]. Single document: `https://www.federalregister.gov/api/v1/documents/{document_number}.json` (e.g. `2025-05128.json`) [T, likely]. Agency slugs: `https://www.federalregister.gov/api/v1/agencies.json` [S, doc 05].
* Query parameters confirmed by client code read today (`aml25/federal-register-mcp/src/federal-register-api.ts` serialises `conditions[...]` recursively, `fields[]` repeated per field, `per_page`, `page`, `order`, and posts to `/documents.json`) [S]; a Python example run 2026-10-12 uses `conditions[term]` (quoted for exact phrase), `conditions[agencies][]`, `conditions[publication_date][gte]` / `[lte]`, `order`, `per_page=1000`; `[year]` and `[is]` also exist; `per_page` max 1000 [S, vaquill.ai; dev.to].
* Types: `conditions[type][]=RULE|PRORULE|NOTICE|PRESDOCU` [S, dev.to shows `RULE`; others T]. Order values: `relevance`, `newest`, `oldest`, `executive_order_number` [T].
* Agency slugs for this app: `homeland-security-department`, `u-s-citizenship-and-immigration-services`, `u-s-customs-and-border-protection`, `executive-office-of-the-president`, `justice-department`, `executive-office-for-immigration-review` [S, doc 05].
* Useful fields to request: `document_number, title, type, publication_date, agencies, html_url, pdf_url, abstract, citation, docket_ids, effective_on` [T]. The response shape is `{ count, total_pages, next_page_url, results: [...] }` [T].

Canonical queries (URL-encoded in code; shown readable):

```
# DHS + USCIS + CBP documents mentioning Cuba/parole since 2025-01-01, newest first
https://www.federalregister.gov/api/v1/documents.json
  ?conditions[term]=(Cuban OR Cubans OR "Cuban Adjustment Act" OR parole OR parolees OR CHNV)
  &conditions[agencies][]=homeland-security-department
  &conditions[agencies][]=u-s-citizenship-and-immigration-services
  &conditions[agencies][]=u-s-customs-and-border-protection
  &conditions[publication_date][gte]=2025-01-01
  &order=newest&per_page=100
  &fields[]=document_number&fields[]=title&fields[]=type&fields[]=publication_date&fields[]=agencies&fields[]=html_url&fields[]=abstract

# Presidential documents on immigration/entry/parole
…documents.json?conditions[type][]=PRESDOCU&conditions[term]=(immigration OR entry OR nationals OR parole)&conditions[publication_date][gte]=2025-01-01&order=newest

# Regression fixture: must return 2025-05128 (CHNV termination, 2025-03-25)
…documents.json?conditions[term]="Termination of Parole Processes for Cubans, Haitians, Nicaraguans, and Venezuelans"&per_page=5

# Regression fixture 2: must return the 2025-12-15 FRP-termination notice (expected document_number 2025-22744 [S-fc])
…documents.json?conditions[term]="Termination of Family Reunification Parole Processes"&conditions[publication_date][gte]=2025-12-01&per_page=5
```
Known document numbers to assert on: `2025-05128` (CHNV termination notice) [S]; `2025-22744` (Family Reunification Parole termination, 2025-12-15 — assert via the title query above and let the probe confirm the number) [S-fc]; `2025-20622` (H.R. 1 immigration-fee inflation adjustment, 2025-11-21) [S, doc 04 — not re-checked today]. No published rate limit; the site asks for considerate use [T]. Daily issue is posted early morning ET; a `.rss` extension on the same search likely yields a feed [T].

---

## 7. CourtListener REST API v4

### 7.1 Auth and throttles (read from CourtListener's own settings file today)

`freelawproject/courtlistener/cl/settings/third_party/rest_framework.py` [S]:

```python
"DEFAULT_THROTTLE_RATES": {
    "anon": "100/day",
    "user": ["5/min", "50/hour", "125/day"],
    "citations": "60/min",
    "tags": "1000/hour",
    "api_usage": ["10/min", "120/hour"],
    "fetch": "30/min",     # PACER fetch API, not membership-gated
    "events": "60/hour",
}
```
Throttle classes `CloudFrontAnonRateThrottle` (anon, keyed on the CloudFront client IP) and `ExceptionalUserRateThrottle` (per-user overrides from MANUAL and MEMBERSHIP `APIThrottle` rows; a MANUAL rate replaces the MEMBERSHIP set) [S, `cl/api/utils.py`]. Free Law Project announced on 2026-05-07 that API access is now "included in memberships"; before that every account got 5,000 requests/hour by default [S, free.law]. Third-party guides confirm the new plain-account default of 5/min, 50/hr, 125/day [S, vaquill.ai].

**The `anon` rate is moot for this app.** CourtListener's REST change log records that release **v4.3 enforced authentication on the V4 endpoints: anonymous requests now receive `401 Unauthorized`**, with `/dockets/`, `/opinion-clusters/` and `/opinions/` among the endpoints listed [S, courtlistener.com/help/api/rest/changes/]. A third-party test on 2026-10-06 saw anonymous `200` only from `/search/`, `/courts/` and `/audio/`, and `401` from `/dockets/`, `/clusters/`, `/opinions/` and citation lookup [S, vaquill.ai]. So `cl.docket` and `cl.entries` cannot run without `COURTLISTENER_TOKEN`; only `cl.search` can. Budget against the authenticated 5/min, 50/hr, 125/day defaults (in force since 2026-05-07) and read the **live** per-scope limits from the API Usage endpoint (FLP wiki "API Usage" page; its own throttle is 10/min, 120/hr, matching the `api_usage` scope above; anonymous calls to it also 401) [S, wiki.free.law] instead of hard-coding numbers — the fact-check pass reports that FLP ran temporary limit doublings (30 days from 2026-07-07; two weeks from 2026-09-17) [S-fc, not found in today's results].

Header: `Authorization: Token <token>` — omitting the word `Token` makes requests count as anonymous (FLP FAQ: "if that process doesn't show much usage, you probably aren't authenticating properly and your usage is being recorded as anonymous") [S]. Versioning is URL-path (`v3`, `v4`); default page size 20; ordering param `order_by` [S, settings].

### 7.2 Endpoints for the parole / adjustment-processing cases

| Purpose | Request | Tag |
|---|---|---|
| Find the D. Mass. docket | `GET https://www.courtlistener.com/api/rest/v4/dockets/?court=mad&docket_number=1:25-cv-10495` (token required). The docket already exists on CourtListener as **id 69695790** (`https://www.courtlistener.com/docket/69695790/doe-v-noem/`) and its live caption is now **"Doe v. Mullin"** (defendant substituted) — pin the id in config, assert on `docket_number`/`pacer_case_id`, and never match `Noem` in `case_name` | [S, doc 05 command]; id and caption [S-fc] |
| Same, by PACER id | `GET …/v4/dockets/?court=mad&pacer_case_id=281389` — the RECAP storage path `https://storage.courtlistener.com/recap/gov.uscourts.mad.281389/gov.uscourts.mad.281389.128.0.pdf` (ECF 128, the June 16 2025 partial-SJ motion) shows the PACER case id is **281389** | [S] |
| Docket entries | `GET …/v4/docket-entries/?docket=69695790&order_by=-date_filed` (token required [S]) | [T, standard v4 resource] |
| RECAP documents | `GET …/v4/recap-documents/?docket_entry__docket=<id>` | [T] |
| Search | `GET …/v4/search/?q="Cuban Adjustment Act"&type=r&order_by=dateFiled desc` ; `…/search/?q=CHNV parole&type=r` | [S, doc 05] |
| Subscribe to docket alerts (auth required) | `POST https://www.courtlistener.com/api/rest/v4/docket-alerts/` with form body `docket=<cl_docket_id>` (`actuallyrizzn/courtlistener-sdk` docs show `--data 'docket=4214664'`); `freelawproject/bigcases2` `subscribe_to_docket_alert(cl_id)` POSTs to the same path; `GET …/docket-alerts/` lists subscriptions | [S] |
| Webhooks | docket-alert webhooks fire only for dockets the account subscribed to via `/docket-alerts/` (`seanthegeek/case-calendar`) | [S] |
| Other dockets to resolve | D.R.I. `1:26-cv-00132` (court `rid`), N.D. Cal. `3:26-cv-04850` (court `cand`) — the June 6 2026 and Aug 24 2026 orders vacating the Dec 2025 country-based pause | [S, doc 05 — numbers carried from that file, not re-verified today] |

Known entries in *Svitlana Doe v. Noem* (now captioned *Doe v. Mullin*), 1:25-cv-10495 (D. Mass.), for fixture assertions: ECF 1 complaint 2025-02-28; ECF 22 first amended class complaint 2025-03-17; ECF 97 memorandum & order granting stay 2025-04-14 (778 F. Supp. 3d 311); ECF 128 plaintiffs' partial-SJ motion 2025-06-16 [S, clearinghouse.net + leagle]; **2025-05-28** order granting class-wide preliminary relief and directing the government to resume processing parolees' applications for other benefits (re-parole, asylum, TPS, adjustment) — the order most directly relevant to CAA adjustments; ECF number unknown [S-fc, consistent with T].

**January 2026 orders — label these "FRP termination", not "freeze".** On 2026-01-10 Judge Talwani issued a 14-day TRO pausing DHS's termination of Family Reunification Parole grants and related work authorization under the 2025-12-15 FRN, running to 2026-01-24; on 2026-01-24 she issued a stay / preliminary injunction for a newly certified FRP-termination subclass [S, justiceactioncenter.org case page and news; clearinghouse.net/case/46186; visainamerica.com]. One tracker dates the memorandum that modified the class definition to 2026-03-11, so the certification date is unsettled [S, uscis-pause-tracker.com]. These orders do **not** address the CHNV termination or the USCIS adjustment-processing pause, so an alerts feed that filed them under "freeze" would misstate what relief Cuban parolees obtained. The ECF numbers (243, 258) and Westlaw cites (2026 WL 77330, 2026 WL 184883) previously listed here surfaced in no result today, and the "2026-01-25" date was wrong: treat them as **unverified** and have the probe read the real entry numbers off the docket before anything asserts them.

Budget note for CI: there is no anonymous path to dockets (401 [S]), so `COURTLISTENER_TOKEN` is a **required** secret for `cl.docket`/`cl.entries`. One probe run (≈5 authenticated requests) fits easily inside 5/min, 50/hr, 125/day; a daily poller stays under 125/day only if it polls ≤4 dockets × ~1 request each plus one `api-usage` call to read the live limits. Prefer docket-alert webhooks or the docket `.rss` feeds (`https://www.courtlistener.com/docket/69695790/feed/`) [T], which should not count against the REST quota [T].

---

## 8. Census ACS API — Cuba-born by state (B05006)

* Endpoints: `https://api.census.gov/data/<vintage>/acs/acs1` (1-year, geographies ≥65k pop.) and `/acs/acs5` (5-year, down to tract); group metadata `…/groups/B05006.json`; variable metadata `…/variables/<VAR>.json` [S, pattern seen in search-result URLs such as `https://api.census.gov/data/2024/acs/acs1/variables/C05006_055M.html`].
* **Cuba variable = `B05006_143E` (estimate) / `B05006_143M` (MOE)** in the 2023 5-year table (column metadata CSV exported from data.census.gov on 2025-10-23: `"B05006_143E","Estimate!!Total:!!Americas:!!Latin America:!!Caribbean:!!Cuba"`) and in the 2024 5-year group metadata (`acs-series.json`, release `2024-acs5`: `B05006_143E` label "Estimate · Total · Americas · Latin America · Caribbean · Cuba") [S]. Two 2025-era scripts hardcode `B05006_143E: "Cuba"` [S]. Neighbours: `_141E` Bahamas, `_142E` Barbados, `_145E` Dominican Republic, `_147E` Haiti, `_148E` Jamaica [S].
* The number is **not stable across vintages**: Cuba was `B05006_094E` in ACS 2007 1-year, `B05006_128E` in a 2014–2018 5-year export, `B05006_143E` from ~2022 on [S]. The probe must resolve the code at runtime from `groups/B05006.json` by matching a label ending in `Cuba`, never hardcode it. The collapsed table `C05006` also has a Cuba line (search hit `C05006_055M` for 2023/2024 1-year; label not shown in the snippet — verify) [S, uncertain].
* Key policy: a key is optional "for up to 500 queries per IP per day" and required above that; sign-up `https://api.census.gov/data/key_signup.html`; pass `&key=` [S, two third-party references; consistent with T]. One data-catalogue entry notes `api.census.gov` refused a keyless fetcher in its environment [S] — so set `CENSUS_API_KEY` as a CI secret anyway.
* Vintages: ACS 2024 1-year released Sept 2025; ACS 2023 5-year Dec 2024; ACS 2024 5-year group metadata exists (the saved `acs-series.json` is keyed `2024-acs5`) [S]; ACS 2025 1-year was scheduled for Sept 2026 — the probe should try `/data/2025/acs/acs1` and record 200/404 [I].

Queries:

```
https://api.census.gov/data/2024/acs/acs5/groups/B05006.json                      # resolve the Cuba code
https://api.census.gov/data/2024/acs/acs1?get=NAME,B05006_143E,B05006_143M&for=state:*&key=…
https://api.census.gov/data/2024/acs/acs5?get=NAME,B05006_143E&for=county:*&in=state:12&key=…
https://api.census.gov/data/2024/acs/acs1?get=NAME,B05006_143E&for=metropolitan%20statistical%20area/micropolitan%20statistical%20area:*&key=…
https://api.census.gov/data/2024/acs/acs1/pums?get=PWGTP,YOEP,ST,CIT&POBP=327        # Cuba-born by year of entry (POBP=327 from doc 05, [T])
```
Response: JSON array of arrays, first row = headers (`["NAME","B05006_143E","B05006_143M","state"]`), values as strings [T].

---

## 9. USCIS newsroom RSS

Feed URLs found in code today (all `https://www.uscis.gov/news/rss-feed/<id>`), with the label each repo gives them [S]:

| Feed id | Label (per repo) | Repos |
|---|---|---|
| `22984` | **Alerts** | `Landcruiser87/newsbyrob`, `fadilf/AskPriya`, `dikondaashish/TrackmyOPT` |
| `23269` | **News Releases** | `newsbyrob`; `walaa-ibrahim03/new-york-bel-arabi` ("the feed returned valid XML and dated news") |
| `93166` | Fact Sheets | `newsbyrob` |
| `97790` | Stakeholder Messages | `newsbyrob` |
| `59144` | all USCIS news (used as the single feed) | `Jaxsonb04/immifile` ("serves clean RSS 2.0 with a browser User-Agent (default agents get 403 / Drupal antibot on HTML pages, but the RSS endpoint is clean)"), `newsbyrob` README |
| `60288` | "USCIS All News" | `Edu-Wire/Study-Abroad-Bulletin` |
| `https://www.uscis.gov/forms/forms-updates/rss-feed` | Forms updates | code grep in scratchpad files |
| `https://www.uscis.gov/news/rss-feed/news-releases/feed` | news releases (variant; unverified) | `YeshwanthBalaji0412/rasapi-local-ai-assistant` |

Legacy index: `https://www.uscis.gov/rss-landing` (2019 archive lists News Releases, Alerts, forms updates, Federal Register announcements) [S]. The immifile project fetches 59144 with UA `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)`, a 15 s timeout, refreshes every 6 hours, and validates that every link starts with `https://www.uscis.gov/` [S]. Items are standard RSS 2.0 (`title`, `link`, `pubDate`, `description`) [S, I].

---

## 10. Dated timeline of endpoint-relevant events

| Date | Event | Tag |
|---|---|---|
| 2018-11 | USCIS consolidates all data products onto the Immigration and Citizenship Data page | [S, doc 04] |
| 2022-03-21 | `jzebedee/uscis` v0.1: first daily SQLite of processing times | [S] |
| 2024-10-01 | Torch production keys "available October 1, 2024" per a demo-pass letter (Inmigra) | [S] |
| 2024-10-18 | Processing-times publication date of the snapshot that still carried two-value ranges | [S, doc 04] |
| 2025-01 | OHSS monthly tables move to "third Thursday" cadence; CBP January 2025 update says CHNV paroles ended | [S] |
| 2025-02-03 | `jzebedee` v0.4: "USCIS has begun aggressively blocking scraping requests" | [S] |
| 2025-02-23 | `jzebedee` v0.5 adds FOIA metrics (`first.uscis.gov/api/public/foia-metrics`) | [S] |
| 2025-03-25 | FR 2025-05128 terminates CHNV parole processes | [S] |
| 2025-04-14 | D. Mass. stay in *Doe v. Noem* (ECF 97) | [S] |
| 2025-05-28 | D. Mass. class-wide preliminary relief in *Doe v. Noem*: government ordered to resume processing parolees' applications for other benefits (re-parole, asylum, TPS, adjustment) | [S-fc, consistent with T] |
| 2025-05-30 | SCOTUS stays the district court; DHS statement | [S] |
| 2025-06-12 | DHS issues CHNV termination notices | [S] |
| 2025-12-15 | FR notice terminating Family Reunification Parole processes (incl. CFRP for Cubans); reported document number 2025-22744 | [S date/title; S-fc number] |
| 2026-01-10 / 2026-01-24 | *Doe v. Noem*: 14-day TRO pausing FRP terminations (to 01-24), then stay / preliminary injunction for the FRP-termination subclass — not about CHNV or the adjustment pause; ECF numbers unverified | [S] |
| 2026-05-07 | CourtListener: API included in memberships; default free throttle becomes 5/min, 50/hr, 125/day | [S] |
| 2026-05-14 | OHSS posts the monthly-tables data dictionary (report year 2025) | [S] |
| 2026-06-04 | OHSS publishes FY2024 Yearbook LPR and naturalizations workbooks | [S, file names] |
| 2026-09-08/09 | USCIS posts FY2026 Q3 quarterly files (I-765 workbook dated Sep 8; Manifest Law analysis Sep 9) | [S] |
| 2026-09-23 / 09-28 | visualizer mirror downloads Q3 workbooks and the August 2026 monthly CSV | [S] |
| 2026-10-06 | Third-party test: CourtListener `/dockets/`, `/clusters/`, `/opinions/` answer anonymous requests with 401 (v4.3 auth enforcement); `/search/`, `/courts/`, `/audio/` still open | [S] |
| 2026-10-15 | Latest `jzebedee` processing-times release observed (doc 04) | [S] |
| 2026-10-20 | CiberCuba/americateve report the Q3 CAA figures (139 approved / 447 denied); no September monthly file reported yet | [S] |

---

## 11. Things that are *not* live endpoints (so nobody wastes a sprint)

* The Torch **production** host needs USCIS approval; the sandbox returns only canned test data for staging receipts, so **no real receipt — including any CAA applicant's — can be validated end-to-end until production access is granted** [S]. The sandbox page is ~600 days old and its weekday operating window is unofficial (§2.2).
* `egov.uscis.gov` (processing times, case status, historic-pt) is Cloudflare-gated against cloud IPs; from GitHub Actions expect `403`, `Just a moment...`, or `cf-mitigated: challenge` [S]. The probe records which of the three it gets.
* No official API exists for the data portal, OHSS, or CBP; all are HTML indexes pointing at XLSX/CSV [S].
* The Apify `processingTimes.json` URL is unsupported by any tracker code [S/I].

---

## 12. PROBE PLAN — `packages/ingestion` probe script (Node 22 + TypeScript + zod)

### 12.1 Goal and acceptance criteria

One command, `pnpm --filter @caa/ingestion probe`, run by a GitHub Actions workflow, that:

1. calls every endpoint in §0 with the exact headers documented above,
2. validates each response against a zod schema that encodes the field names in this document,
3. writes raw samples to `data/samples/<source>/<YYYY-MM-DD>/…` (bytes as received, plus a `.meta.json` with URL, status, headers, timing, sha256),
4. writes `data/samples/probe-report.json` and `data/samples/PROBE-REPORT.md` (one row per probe: `ok | schema_mismatch | blocked_cloudflare | http_error | network_error | skipped_no_secret`),
5. never fails the job because an endpoint is blocked — a blocked endpoint is a *finding*, not an error; the job fails only on programming errors,
6. opens a PR (or commits to a `data/samples` branch) so the samples this sandbox could not produce land in the repo on the first run.

**Done when** the first run yields: ≥1 USCIS XLSX and ≥1 CSV with parsed `I-485 (Cuban)` rows; a Torch sandbox token and one canned case; a Federal Register hit list containing `2025-05128`; a CourtListener docket object for `1:25-cv-10495`; a Census row for Florida with a numeric `B05006_143E`; at least one RSS feed with ≥1 item; the `jzebedee` SQLite with I-485 subtype rows; and a classified result (`ok` or `blocked_cloudflare`) for every `egov.uscis.gov` call.

### 12.2 Package layout

```
packages/ingestion/
  package.json          # "type":"module"; deps: zod, undici (for proxy-free fetch w/ timeouts), fast-xml-parser, exceljs (xlsx sniff/parse), better-sqlite3 (jzebedee db), csv-parse
  tsconfig.json
  src/
    probe/
      index.ts          # CLI: --only <id>, --report-dir, --timeout-ms
      http.ts           # fetchWithPolicy(): browser UA, timeout, retries(0 for probes), Cloudflare classifier
      classify.ts       # status → 'ok'|'blocked_cloudflare'|'http_error'|...
      save.ts           # writeSample(), sha256, meta.json
      report.ts         # JSON + Markdown writers
      probes/
        uscisProcessingTimes.ts
        uscisTorch.ts
        uscisDataPortal.ts
        ohss.ts
        cbp.ts
        federalRegister.ts
        courtListener.ts
        census.ts
        uscisRss.ts
        communityMirrors.ts
    schemas/            # zod schemas shared with the real ingestion later
      processingTimes.ts, torch.ts, dataPortal.ts, federalRegister.ts, courtListener.ts, census.ts, rss.ts
  test/                 # fixtures = the samples, once produced
data/samples/           # committed output (gitattributes: binary for xlsx/db; keep each run ≤ 25 MB)
.github/workflows/probe.yml
```

### 12.3 Shared HTTP policy (`http.ts`)

* `User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36` for every government host (uscis.gov Drupal and ohss.dhs.gov both 403 default agents [S]); `Accept` per endpoint; `Accept-Language: en-US,en;q=0.9`.
* Timeout 30 s; **no automatic retries** in probe mode (we want the first response classified, and we must not hammer Cloudflare); 1 request at a time per host; ≥1 s gap between calls to the same host.
* Cloudflare classifier: status 403/503 **and** (`cf-mitigated` header present, or body contains `Just a moment...`, `Attention Required! | Cloudflare`, `Sorry, you have been blocked`) → `blocked_cloudflare` [S, patterns from jzebedee]. Status 403 without those markers on `www.uscis.gov` → `blocked_drupal_antibot` (retry once with a different UA).
* Cookie jar per host (undici `CookieAgent` or manual `set-cookie` capture) so step 0 of §1.1 can seed the API calls.
* Secrets read from env: `USCIS_CLIENT_ID`, `USCIS_CLIENT_SECRET`, `COURTLISTENER_TOKEN` (**required** for `cl.docket`, `cl.entries`, `cl.alerts.list`, `cl.usage`; only `cl.search` works without it [S]), `CENSUS_API_KEY`, `GITHUB_TOKEN`. Missing secret → `skipped_no_secret` for that probe, never a crash.

### 12.4 Probe definitions

| id | Method / URL | Headers | Expect | Schema | Sample path |
|---|---|---|---|---|---|
| `pt.landing` | `GET https://egov.uscis.gov/processing-times/` | browser UA | 200 HTML, cookies | — | `uscis-pt/landing.html` |
| `pt.forms` | `GET https://egov.uscis.gov/processing-times/api/forms` | §1.1 headers + jar | 200 JSON | `ProcessingTimesForms` | `uscis-pt/forms.json` |
| `pt.formtypes.i485` | `GET …/api/formtypes/I-485` | same | 200 JSON; assert the 7 known keys; flag any extra key (would be a CAA subtype) | `FormTypes` | `uscis-pt/formtypes-I-485.json` |
| `pt.formtypes.i765` | `GET …/api/formtypes/I-765` | same | 200; assert `147-C9`, `147-C11` present | `FormTypes` | `uscis-pt/formtypes-I-765.json` |
| `pt.offices.fam` | `GET …/api/formoffices/I-485/131A-FAM` | same | 200; assert `HIA`,`KND`,`MIA`,`TAM`,`HOU` present | `FormOffices` | `uscis-pt/formoffices-I-485-131A-FAM.json` |
| `pt.time.*` | `GET …/api/processingtime/I-485/{HIA,KND,MIA,TAM,HOU}/131A-FAM`, `…/I-765/NBC/147-C9`, `…/I-765/NBC/147-C11` | same | 200; `range[]` length 1 or 2; `service_request_date` parseable | `ProcessingTime` | `uscis-pt/processingtime-<form>-<office>-<key>.json` |
| `pt.nextaction` | `GET https://egov.uscis.gov/processing-times` → extract `/processing-times/_next/static/chunks/*.js` → search for `getFormCategories`; if found, `POST https://egov.uscis.gov/processing-times` with §1.2 headers and body `["I-485"]` | §1.2 | 200 `text/x-component` | raw only | `uscis-pt/next-getFormCategories.txt` + `action-ids.json` |
| `pt.apify_claim` | `HEAD https://egov.uscis.gov/processing-times/api/processingTimes.json` | browser UA | record status (expect 404) | — | meta only |
| `pt.historic` | `GET https://egov.uscis.gov/processing-times/historic-pt` | browser UA | 200 HTML containing "Cuban Adjustment Act" | — | `uscis-pt/historic-pt.html` |
| `pt.mirror.jzebedee` | `GET https://api.github.com/repos/jzebedee/uscis/releases/latest` (Bearer `GITHUB_TOKEN`) → download first `.db` asset → `SELECT * FROM form_types WHERE form_name IN ('I-485','I-765')`; `SELECT * FROM processing_time WHERE form_name='I-485' AND office_code IN (…)` | — | 200; tables exist | `JzebedeeFormTypes`, `JzebedeeProcessingTime` | `community/jzebedee/<tag>.db` + `i485-subtypes.json` + `i485-fl-offices.json` |
| `torch.token` | `POST https://api-int.uscis.gov/oauth/accesstoken` form `grant_type=client_credentials&client_id&client_secret` | `Content-Type: application/x-www-form-urlencoded` | 200 `{access_token, expires_in}`; 503 → `sandbox_closed` with the UTC timestamp logged (the weekday 7am–8pm ET window is community-observed, not official — accumulate timestamps across runs to confirm it) | `TorchToken` | `uscis-torch/token.redacted.json` (token replaced by sha256) |
| `torch.case` | `GET https://api-int.uscis.gov/case-status/EAC9999103402` | `Authorization: Bearer`, `Accept: application/json` | 200; record which history key appears (`hist_case_status` vs `historicalCaseStatuses`); 302 → `sandbox_incident` | `TorchCaseStatus` | `uscis-torch/case-EAC9999103402.json` |
| `torch.case.422` | `GET …/case-status/ZZZ0000000000` | same | 422 or 404 (documents the error envelope) | `TorchError` | `uscis-torch/error-422.json` |
| `torch.prod.unauth` | `GET https://api.uscis.gov/case-status/EAC9999103402` (no token) | — | 401 proves the host exists [S] | — | meta only |
| `torch.pt.unauth` | `GET https://api-int.uscis.gov/processing-times` (no token) then with token | — | record 401/200 and body | raw | `uscis-torch/processing-times.json` |
| `portal.index` | `GET https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data` | browser UA | 200 HTML; extract all `href`s matching `/sites/default/files/document/` and the §3.1 regexes; emit `portal-links.json` with `{href, text, size, fy, quarter, month}` | `PortalLinks` | `uscis-portal/index.html`, `portal-links.json` |
| `portal.allforms.q3` | `GET https://www.uscis.gov/sites/default/files/document/data/quarterly_all_forms_fy2026_q3_v1.xlsx` | browser UA | 200, `PK` magic, sheet `FY26Q3_All_Forms`, row containing `I-485` and `Cuban` with received 6,279 / approved 139 / denied 447 / pending 342,360 | `AllFormsWorkbook` | `uscis-portal/quarterly_all_forms_fy2026_q3_v1.xlsx` |
| `portal.i485office.q3` | `GET …/document/data/i485_performance_data_fy2026_q3_v1.xlsx` | browser UA | 200; sheet `I485_by_State`; Hialeah humanitarian pending 37,486 | `I485ByOfficeWorkbook` | `uscis-portal/i485_performance_data_fy2026_q3_v1.xlsx` |
| `portal.monthly.aug26` | `GET …/document/data/appropriation_requirement_august_2026_v1.0.csv` | browser UA | 200; BOM-tolerant CSV; `I-485 (Cuban)`-like row with pending `355,520` | `MonthlyCsv` | `uscis-portal/appropriation_requirement_august_2026_v1.0.csv` |
| `portal.monthly.next` | `HEAD …/document/data/appropriation_requirement_september_2026_v1.0.csv` (and `october_2026`) | browser UA | 200 → download and flag `NEW_MONTH`; 404 → `not_yet` | — | meta; file if 200 |
| `portal.quarterly.next` | `HEAD …/document/data/quarterly_all_forms_fy2026_q4_v1.xlsx`, `…/i485_performance_data_fy2026_q4_v1.xlsx` | browser UA | 404 expected until ~Dec 2026 | — | meta |
| `portal.i765` | from `portal-links.json`, first href matching `/i.?765/i` and `/(eligib|categor)/i` | browser UA | 200 xlsx; dump sheet names and first 30 rows | raw | `uscis-portal/<name>` + `-preview.json` |
| `ohss.monthly.page` | `GET https://ohss.dhs.gov/topics/immigration/immigration-enforcement/monthly-tables` | browser UA, HTTP/1.1 | 200; extract hrefs matching `immigration-enforcement-and-legal-processes-tables-<month>-<year>.xlsx`; pick newest | `OhssLinks` | `ohss/monthly-tables.html`, `ohss-links.json` |
| `ohss.monthly.file` | newest href from above (fallback `…/2025-01/2025_0116_ohss_immigration-enforcement-and-legal-processes-tables-november-2024.xlsx`) | browser UA | 200 xlsx; list sheets; find sheets whose name/title contains `CHNV` | `OhssMonthlyWorkbook` | `ohss/<filename>` + `-sheets.json` |
| `ohss.dictionary` | `GET https://ohss.dhs.gov/about-our-data/governance/data-dictionaries/immigration-enforcement-and-legal-processes-monthly` → first `.xlsx` href | browser UA | 200 | raw | `ohss/data-dictionary.xlsx` |
| `ohss.yearbook` | `GET https://ohss.dhs.gov/topics/immigration/yearbook/2024` and `…/2024/LPRsupptable1` → xlsx hrefs | browser UA | 200; expect a file named like `2026_0604_ohss_yearbook_lawful_permanent_residents_fy2024.xlsx` | raw | `ohss/yearbook-2024.html`, `ohss/<lpr-workbook>` |
| `cbp.dec24` / `cbp.jan25` | `GET https://www.cbp.gov/newsroom/national-media-release/cbp-releases-december-2024-monthly-update` and `…-january-2025-monthly-update` | browser UA | 200; regex `([\d,]+) Cubans, ([\d,]+) Haitians, ([\d,]+) Nicaraguans, and ([\d,]+) Venezuelans` → on the **December 2024 page only** expect 110,240 / 211,040 / 93,070 / 117,330 with ±10 tolerance per figure (CBP rounds; Nov 2024 reported 93,080 / 117,320 [S-fc]); on the January 2025 page assert only that the body mentions CHNV paroles having ended | `CbpChnvParagraph` | `cbp/*.html`, `cbp/chnv-totals.json` |
| `cbp.custody` | `GET https://www.cbp.gov/newsroom/stats/custody-and-transfer-statistics-fy2025` (+ `fy2026` HEAD) | browser UA | 200 | raw | `cbp/custody-fy2025.html` |
| `fr.search` | `GET https://www.federalregister.gov/api/v1/documents.json?…` (§6 first query, `per_page=100`) | `Accept: application/json` | 200; `results[]` includes `document_number == "2025-05128"` when `publication_date gte 2025-03-01` | `FrSearch` | `federal-register/search-dhs-cuba-parole.json` |
| `fr.doc` | `GET https://www.federalregister.gov/api/v1/documents/2025-05128.json` | same | 200; `title` contains "Termination of Parole Processes" | `FrDocument` | `federal-register/2025-05128.json` |
| `fr.agencies` | `GET https://www.federalregister.gov/api/v1/agencies.json` | same | 200; confirm the six slugs | `FrAgencies` | `federal-register/agencies.json` |
| `cl.docket` | `GET https://www.courtlistener.com/api/rest/v4/dockets/?court=mad&docket_number=1:25-cv-10495` | `Authorization: Token` (**required**: no token → `skipped_no_secret`; 401 with a token set → `auth_error`) | 200; `results[0].id == 69695790` (pinned [S-fc]; mismatch → `schema_mismatch`, not a crash); `docket_number == "1:25-cv-10495"`; `pacer_case_id == "281389"`; record `case_name` (expected "Doe v. Mullin") but never assert on it | `ClDocketList` | `courtlistener/docket-mad-25-10495.json` |
| `cl.entries` | `GET …/v4/docket-entries/?docket=69695790&order_by=-date_filed&page_size=50` | token (required) | 200; find entries with `date_filed` 2026-01-10 and 2026-01-24 whose `description` mentions a TRO / preliminary injunction and Family Reunification Parole, and record their real `entry_number`s (replacing the unverified 243/258); also look for a 2025-05-28 order | `ClDocketEntries` | `courtlistener/entries-69695790.json` |
| `cl.search` | `GET …/v4/search/?q=%22Cuban+Adjustment+Act%22&type=r&order_by=dateFiled+desc` | none required (anonymous 200 reported 2026-10-06 [S]); send the token if set | 200 | `ClSearch` | `courtlistener/search-caa.json` |
| `cl.alerts.list` | `GET …/v4/docket-alerts/` (only with token; **do not POST** in the probe) | token | 200 or 401 | raw | `courtlistener/docket-alerts.json` |
| `cl.usage` | `GET …/v4/api-usage/` [I — path inferred from the FLP wiki "API Usage" page slug and the `api_usage` throttle scope; confirm on the wiki before coding] | token (required; anonymous → 401 [S]) | 200; record the live per-scope limits and today's counts so the poller budget is read, not hard-coded | raw | `courtlistener/api-usage.json` |
| `census.group` | `GET https://api.census.gov/data/2024/acs/acs5/groups/B05006.json` | — | 200; find variable whose label ends with `Cuba` → expect `B05006_143E` | `CensusGroup` | `census/B05006-group-2024acs5.json` |
| `census.state` | `GET https://api.census.gov/data/2024/acs/acs1?get=NAME,<cuba>E,<cuba>M&for=state:*[&key]` | — | 200 array-of-arrays; Florida value numeric | `CensusTable` | `census/cuba-by-state-2024acs1.json` |
| `census.2025` | `HEAD https://api.census.gov/data/2025/acs/acs1` | — | record 200/404 (is the 2025 1-year out?) | — | meta |
| `rss.*` | `GET https://www.uscis.gov/news/rss-feed/{22984,23269,59144,60288,93166,97790}` and `https://www.uscis.gov/forms/forms-updates/rss-feed` | browser UA, `Accept: application/rss+xml, application/xml;q=0.9, */*;q=0.8` | 200 XML; ≥1 `<item>`; record channel `<title>` to label each id | `RssFeed` | `uscis-rss/<id>.xml` + `feeds.json` |
| `foia.metrics` | `GET https://first.uscis.gov/api/public/foia-metrics` | `Referer: https://first.uscis.gov/` | record | raw | `uscis-foia/metrics.json` |
| `mirror.visualizer` | `GET https://raw.githubusercontent.com/omairqazi29/visualizer/master/data/USCIS_I485/quarterly_all_forms_fy2026_q3_v1.xlsx` | — | 200; sha256 must equal `portal.allforms.q3`'s (proves the mirror is byte-identical) | — | meta + sha compare |

### 12.5 zod schemas (sketch; put real ones in `src/schemas/`)

```ts
import { z } from "zod";

export const PtRange = z.object({ value: z.number(), unit: z.string() });           // "Months" | "Weeks"
export const PtSubtype = z.object({
  form_type: z.string(),                       // "131A-FAM"
  publication_date: z.string(),                // "October 18, 2024"
  service_request_date: z.string().optional(), // "Jul 05 2024"
  subtype_info_en: z.string().optional(), subtype_info_es: z.string().optional(),
  subtype_note_en: z.string().optional(), subtype_note_es: z.string().optional(),
  range: z.array(PtRange).min(1).max(2),
});
export const ProcessingTime = z.object({ data: z.object({ processing_time: z.object({
  form_name: z.string(), office_code: z.string().optional(),
  form_note_en: z.string().optional(), form_note_es: z.string().optional(),
  subtypes: z.array(PtSubtype).min(1),
})})});
export const FormTypes = z.object({ data: z.object({ form_types: z.object({
  form_name: z.string(),
  subtypes: z.array(z.object({ form_key: z.string(), form_type: z.string(),
    form_type_description_en: z.string(), form_type_description_es: z.string().optional() })),
})})});
export const FormOffices = z.object({ data: z.object({ form_offices: z.object({
  form_name: z.string(), form_type: z.string(),
  offices: z.array(z.object({ office_code: z.string(), office_description: z.string() })),
})})});
export const KNOWN_I485_KEYS = ["131A","131A-FAM","131A-HRIFA","131B","131C","131T","131U"] as const;

export const TorchToken = z.object({ access_token: z.string(), expires_in: z.coerce.number() });
export const TorchHist = z.union([
  z.object({ date: z.string(), completed_text_en: z.string().optional(), completed_text_es: z.string().optional() }),
  z.object({ status: z.string().optional(), date: z.string(), description: z.string().optional() }),
]);
export const TorchCaseStatus = z.object({ case_status: z.object({
  receiptNumber: z.string().regex(/^[A-Z]{3}\d{10}$/),
  formType: z.string().optional(),
  submittedDate: z.string().optional(), modifiedDate: z.string().optional(),   // absent for IOE
  current_case_status_text_en: z.string(), current_case_status_desc_en: z.string(),
  current_case_status_text_es: z.string().optional(), current_case_status_desc_es: z.string().optional(),
  hist_case_status: z.array(TorchHist).optional(),
  historicalCaseStatuses: z.array(TorchHist).optional(),
})});

export const FrAgency = z.object({ slug: z.string(), name: z.string(), id: z.number().optional() });
export const FrDoc = z.object({ document_number: z.string(), title: z.string(), type: z.string(),
  publication_date: z.string(), html_url: z.string().url(), pdf_url: z.string().url().optional(),
  abstract: z.string().nullable().optional(), agencies: z.array(FrAgency).optional() });
export const FrSearch = z.object({ count: z.number(), total_pages: z.number().optional(),
  next_page_url: z.string().nullable().optional(), results: z.array(FrDoc) });

export const ClDocket = z.object({ id: z.number(), docket_number: z.string(), case_name: z.string(),   // case_name is display-only (caption changed Noem → Mullin); assert on id/docket_number/pacer_case_id
  court: z.string(), pacer_case_id: z.string().nullable().optional(), date_filed: z.string().nullable(),
  date_last_filing: z.string().nullable().optional(), absolute_url: z.string() });
export const ClDocketList = z.object({ count: z.number().optional(), next: z.string().nullable(), results: z.array(ClDocket) });
export const ClEntry = z.object({ id: z.number(), entry_number: z.number().nullable(), date_filed: z.string().nullable(),
  description: z.string(), recap_documents: z.array(z.object({ filepath_local: z.string().optional(), is_available: z.boolean().optional() })).optional() });

export const CensusTable = z.array(z.array(z.string())).min(2);          // header row + data rows
export const CensusGroup = z.object({ variables: z.record(z.object({ label: z.string(), concept: z.string().optional() })) });

export const RssFeed = z.object({ rss: z.object({ channel: z.object({ title: z.string(),
  item: z.array(z.object({ title: z.string(), link: z.string().url(), pubDate: z.string().optional() })).min(1) }) }) });
```
Workbook/CSV probes validate structurally (magic bytes, sheet names, the presence of the `I-485` + `Cuban` row) and compare to the §3.4 fixture numbers; a mismatch is reported as `schema_mismatch` with the first 20 rows attached, not as a crash.

### 12.6 GitHub Actions workflow (`.github/workflows/probe.yml`)

```yaml
name: probe-live-endpoints
on:
  workflow_dispatch:
  schedule: [{ cron: "17 13 * * 1-5" }]   # weekdays 13:17 UTC = 09:17 ET, inside the community-reported Torch sandbox window (7am–8pm ET, unofficial)
permissions: { contents: write, pull-requests: write }
concurrency: probe
jobs:
  probe:
    runs-on: ubuntu-latest
    timeout-minutes: 25
    env:
      USCIS_CLIENT_ID: ${{ secrets.USCIS_CLIENT_ID }}
      USCIS_CLIENT_SECRET: ${{ secrets.USCIS_CLIENT_SECRET }}
      COURTLISTENER_TOKEN: ${{ secrets.COURTLISTENER_TOKEN }}
      CENSUS_API_KEY: ${{ secrets.CENSUS_API_KEY }}
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @caa/ingestion probe --report-dir data/samples
      - uses: actions/upload-artifact@v4
        with: { name: probe-samples-${{ github.run_id }}, path: data/samples, retention-days: 30 }
      - name: Open PR with new samples
        uses: peter-evans/create-pull-request@v6
        with:
          branch: probe/samples-${{ github.run_id }}
          title: "probe: live-endpoint samples ${{ github.run_id }}"
          body-path: data/samples/PROBE-REPORT.md
          add-paths: data/samples/**
```
Notes: community clients report the Torch sandbox returning 503 outside weekdays 7 AM–8 PM ET [S-code, unofficial], hence the weekday-morning cron; `concurrency: probe` prevents overlapping runs from doubling request counts; the first run should be triggered manually with `workflow_dispatch`. Keep the daily request totals far below every limit (Torch sandbox 1,000/day [S]; CourtListener 5/min, 50/hr, 125/day with the required token [S] — there is no anonymous docket path; Census 500/day keyless): the full probe makes ≈60 requests.

### 12.7 Report format

`data/samples/probe-report.json`:
```json
{ "run": { "startedAt": "2026-10-21T13:17:04Z", "runner": "github-actions", "egressIp": "…", "commit": "…" },
  "results": [
    { "id": "pt.formtypes.i485", "url": "https://egov.uscis.gov/processing-times/api/formtypes/I-485",
      "status": 403, "classification": "blocked_cloudflare", "cfMitigated": "challenge", "ms": 812,
      "sample": null, "notes": "Just a moment... page" },
    { "id": "portal.allforms.q3", "url": "…/quarterly_all_forms_fy2026_q3_v1.xlsx", "status": 200,
      "classification": "ok", "bytes": 785620, "sha256": "…", "contentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "lastModified": "…", "sample": "uscis-portal/quarterly_all_forms_fy2026_q3_v1.xlsx",
      "assertions": { "cubanRowFound": true, "received": 6279, "approved": 139, "denied": 447, "pending": 342360 } },
    { "id": "pt.formtypes.i485", "extraKeys": [] }
  ] }
```
`PROBE-REPORT.md` is a table of `id | classification | status | ms | bytes | note`, followed by a "Findings" list that is generated from rules: `NEW_MONTH` when `portal.monthly.next` returns 200; `CAA_SUBTYPE_PRESENT` when `pt.formtypes.i485` or the jzebedee DB contains a key outside `KNOWN_I485_KEYS`; `TORCH_HISTORY_KEY=<name>`; `CENSUS_CUBA_VAR=<code>`; `RSS_LABELS={22984:"…",…}`; `EGOV_REACHABLE=true|false`.

### 12.8 What the first run decides for the architecture

| If the probe shows… | Then… |
|---|---|
| `EGOV_REACHABLE=false` (expected) | processing-times ingestion = daily download of the `jzebedee` SQLite (or a residential collector later); never call `egov` from CI or the app |
| `portal.*` = ok (expected, per visualizer's Sept 2026 runs) | the monthly/quarterly pipeline runs in CI directly from uscis.gov with a browser UA; mirror only as a sha-checked fallback |
| `torch.token` = ok | wire the sandbox into the app's "track my receipt" screen behind a feature flag; start the 5-day sandbox-traffic clock USCIS requires before a production request |
| `torch.case` history key | fix the zod schema to the observed key and delete the union |
| `cl.docket` = ok with token (there is no anonymous path [S]) | daily docket polling stays within 125/day for ≤4 dockets; read live limits from `cl.usage`; subscribe via `/docket-alerts/` + webhooks for push so polling is the fallback, not the primary |
| `census.group` resolves `B05006_143E` | pin the code per vintage in config, re-resolve on each new vintage |
| any `rss.*` = ok | alerts feed = those ids; store channel titles from the sample |

---

## 13. Open questions the probe (not more searching) must answer

1. Does `egov.uscis.gov` answer a GitHub-hosted runner at all in late 2026, and which of the three Cloudflare outcomes does it give?
2. Does `formtypes/I-485` today list anything beyond the seven known keys (a CAA subtype)?
3. Which history-array key does the Torch sandbox return (`hist_case_status` vs `historicalCaseStatuses`), and what are the exact 404/422/429 bodies?
4. Is `https://api-int.uscis.gov/processing-times` a real, documented-in-the-letter API once a token is attached?
5. Has the September 2026 monthly CSV been posted (and at the `_v1.0` name)?
6. What is the I-765-by-category workbook's filename and sheet layout?
7. What is the newest OHSS monthly-tables file (month and exact `/sites/default/files/<YYYY-MM>/…` path), and do its CHNV sheets still update now that the program is terminated?
8. Does `cl.docket` confirm the pinned id 69695790 and the "Doe v. Mullin" caption for `1:25-cv-10495`, what are the ids for the D.R.I./N.D. Cal. cases, and what live limits does `api-usage` report for the token (the anon quota is irrelevant: 401)?
9. Is the ACS 2025 1-year vintage live, and is Cuba still `_143` in it?
10. Which of the RSS ids are alive, and what channel titles do they carry?
11. What are the real ECF entry numbers for the 2026-01-10 TRO and the 2026-01-24 stay/PI (FRP subclass) in 1:25-cv-10495, and is there an entry for the 2025-05-28 benefits-processing order? (The 243/258 numbers and the 2026 WL cites are unverified.)
12. Does `fr.search` return `2025-22744` for the FRP-termination title query, and is `2025-20622` still the H.R. 1 fee notice?
13. Over several runs, do `torch.token` 503s cluster outside weekdays 7 AM–8 PM ET, or has the sandbox window changed?
14. Not re-checked today and still open: the exact direct file URLs for the FY2026 Q3 workbooks and the Aug 2026 CSV; the OHSS "third Thursday" cadence, the 2026-05-14 data dictionary and the `2026_0604` yearbook file names; Census `B05006_143E` in the 2024 vintages; the historic-pt CAA medians (FY2023 3.3 → FY2026 YTD 11.8); the D.R.I. `1:26-cv-00132` and N.D. Cal. `3:26-cv-04850` docket numbers (the 2026-08-24 N.D. Cal. order itself is confirmed by Spanish-language coverage [S-fc]); and the Torch production quota (400,000/day vs 150,000/day — still [S-conflicting]).

---

## Sources (every URL seen or read today, grouped)

**Read directly from GitHub today (raw.githubusercontent.com / GitHub code search)**
- https://raw.githubusercontent.com/omairqazi29/visualizer/master/src/ingestion/registry.py
- https://raw.githubusercontent.com/omairqazi29/visualizer/master/docs/POLICY_VERIFICATION.md
- https://raw.githubusercontent.com/freelawproject/courtlistener/main/cl/settings/third_party/rest_framework.py
- https://raw.githubusercontent.com/freelawproject/courtlistener/main/cl/api/utils.py
- https://raw.githubusercontent.com/usnationalarchives/federal_register/master/README.md
- https://raw.githubusercontent.com/jzebedee/uscis/main/README.md
- https://raw.githubusercontent.com/harshil-sanghvi/visapulse/master/lib/uscis.ts
- https://raw.githubusercontent.com/marambo-code/F-1Careers/main/app/api/processing-times/route.ts
- https://raw.githubusercontent.com/aml25/federal-register-mcp/main/src/federal-register-api.ts
- https://github.com/jzebedee/uscis (scripts saved by an earlier agent: `curl_request_api.sh`, `curl_request_next_action.sh`, `resolve_next_action_id.py`, `normalize_next_response.py`, `build_db.sh`, `query-processing-time-urls.sql`)
- https://github.com/adamjali/perm (`v2/src/lib/uscis/torchClient.ts`, `v2/scripts/test_uscis_quarterly.py`, guides quoting the FY2026 Q3 file URLs)
- https://github.com/omairqazi29/visualizer (`tests/test_ingestion.py`, `tests/test_new_data_sources.py`)
- https://github.com/Mottalib-10M/greencardwaits.com (`scripts/build-ptimes.ts` — `…/document/data/${NATIONAL_CSV}`)
- https://github.com/underyx/visawhen (`data/uscis/monthly.json`)
- https://github.com/api-evangelist/us-citizenship-and-immigration-services ; https://github.com/api-evangelist/providers
- https://github.com/theoriginalsam/I-140-Insights ; https://github.com/ymoldabe/uscis ; https://github.com/lap1597/CaseTracker ; https://github.com/subratom/uscis-tracker ; https://github.com/zlovtnik/uscisApex ; https://github.com/ppritish51/Immigration-Command-Center
- https://github.com/ajduberstein/uscis-wait-times ; https://github.com/arielsvn/uscis-processing-times ; https://github.com/Data4Democracy/immigration-connect ; https://github.com/hmakkapati/uscis-tracker ; https://github.com/divyanshu9166/visa-website-fixed-latest ; https://github.com/kaovilai/distill-web-monitor ; https://github.com/3ff3k7/gateway
- https://github.com/freelawproject/bigcases2 ; https://github.com/seanthegeek/case-calendar ; https://github.com/actuallyrizzn/courtlistener-sdk ; https://github.com/miguelfg/courtlistener-cli ; https://github.com/avaloki108/cicero ; https://github.com/blobfishai/legal-agent-simulation
- https://github.com/mcuringa/cartopy ; https://github.com/mapzimus/lehs-data-dive ; https://github.com/joshgreenman1973/foreign-born-map ; https://github.com/66dplus/usa-atlas-design-lab (`ux/acs-series.json`) ; https://github.com/MissionLocal/2025-immigration-background ; https://github.com/raulfloresp/databootcamp
- https://github.com/K-Dense-AI/scientific-agent-skills ; https://github.com/synthetic-sciences/openscience ; https://github.com/danielmiessler/Substrate
- https://github.com/Economic/trump_deportations_report ; https://github.com/markusstrasser/immigration-research ; https://github.com/ram-insight-india/Data_and_AI_POCs
- https://github.com/Landcruiser87/newsbyrob ; https://github.com/fadilf/AskPriya ; https://github.com/chramirezodev/ifu ; https://github.com/YeshwanthBalaji0412/rasapi-local-ai-assistant ; https://github.com/dikondaashish/TrackmyOPT ; https://github.com/Edu-Wire/Study-Abroad-Bulletin ; https://github.com/Jaxsonb04/immifile ; https://github.com/walaa-ibrahim03/new-york-bel-arabi
- https://github.com/finxster (README saved by an earlier agent: `my.uscis.gov` and `csol-api` notes) ; https://github.com/wangchao92/uscis-api-case-tracker ; https://pypi.org/project/uscis-case-status/

**USCIS (cited from search results and code; hosts blocked here)**
- https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data
- https://www.uscis.gov/sites/default/files/document/data/quarterly_all_forms_fy2026_q3_v1.xlsx
- https://www.uscis.gov/sites/default/files/document/data/i485_performance_data_fy2026_q3_v1.xlsx
- https://www.uscis.gov/sites/default/files/document/data/appropriation_requirement_august_2026_v1.0.csv
- https://www.uscis.gov/sites/default/files/document/data/appropriation_requirement_august%202024.csv
- https://www.uscis.gov/sites/default/files/document/resource-information-center-queries/Appropriation_Requirement_March_2023.csv
- https://www.uscis.gov/sites/default/files/document/reports/i485_performance_data_fy2026_q1_v1.xlsx (test fixture path)
- https://www.uscis.gov/sites/default/files/document/fact-sheets/historical_pt_factsheet_fy16_to_fy24.pdf
- https://egov.uscis.gov/processing-times/ ; https://egov.uscis.gov/processing-times/api/forms ; https://egov.uscis.gov/processing-times/api/formtypes/I-485 ; https://egov.uscis.gov/processing-times/api/formoffices/I-485/131A-FAM ; https://egov.uscis.gov/processing-times/api/processingtime/I-485/MIA/131A-FAM ; https://egov.uscis.gov/processing-times/more-info ; https://egov.uscis.gov/processing-times/historic-pt ; https://egov.uscis.gov/processing-times/api/processingTimes.json (Apify claim)
- https://egov.uscis.gov/casestatus/landing.do ; https://my.uscis.gov/account/case-service/api/cases/{receipt}
- https://developer.uscis.gov/ ; https://developer.uscis.gov/home ; https://developer.uscis.gov/node/1 ; https://developer.uscis.gov/api/case-status ; https://developer.uscis.gov/get-started/sandbox ; https://developer.uscis.gov/get-started/production-access/demo ; https://developer.uscis.gov/get-started/production-access/request ; https://developer.uscis.gov/get-started/sign-up
- https://api-int.uscis.gov/oauth/accesstoken ; https://api-int.uscis.gov/case-status/{receiptNumber} ; https://api-int.uscis.gov/processing-times ; https://api.uscis.gov/oauth/accesstoken ; https://api.uscis.gov/case-status/{receiptNumber}
- https://www.uscis.gov/news/rss-feed/22984 ; https://www.uscis.gov/news/rss-feed/23269 ; https://www.uscis.gov/news/rss-feed/59144 ; https://www.uscis.gov/news/rss-feed/60288 ; https://www.uscis.gov/news/rss-feed/93166 ; https://www.uscis.gov/news/rss-feed/97790 ; https://www.uscis.gov/forms/forms-updates/rss-feed ; https://www.uscis.gov/news/rss-feed/news-releases/feed ; https://www.uscis.gov/rss-landing ; https://webharvest.gov/congress115th/20190108214554/https://www.uscis.gov/rss-landing
- https://first.uscis.gov/api/public/foia-metrics

**DHS / OHSS / CBP**
- https://ohss.dhs.gov/topics/immigration/immigration-enforcement/monthly-tables
- https://ohss.dhs.gov/about-our-data/governance/data-dictionaries/immigration-enforcement-and-legal-processes-monthly
- https://ohss.dhs.gov/sites/default/files/2025-01/2025_0116_ohss_immigration-enforcement-and-legal-processes-tables-november-2024.xlsx
- https://ohss.dhs.gov/topics/immigration ; https://ohss.dhs.gov/topics/immigration/enforcement ; https://ohss.dhs.gov/topics/immigration/yearbook/2024 ; https://ohss.dhs.gov/topics/immigration/yearbook/2024/table3 ; …/table6 ; …/table7 ; …/LPRsupptable1 ; …/LPRsupptable2 ; https://ohss.dhs.gov/topics/immigration/lawful-permanent-residents/immigrant-classes-admission ; https://ohss.dhs.gov/about-our-data/governance/report-catalog
- https://www.cbp.gov/newsroom/national-media-release/cbp-releases-december-2024-monthly-update ; …/cbp-releases-january-2025-monthly-update ; …/cbp-releases-november-2024-monthly-update ; …/cbp-releases-october-2024-monthly-update ; …/cbp-releases-september-2024-monthly-update ; …/cbp-releases-august-2024-monthly-update ; …/cbp-releases-february-2024-monthly-update
- https://www.cbp.gov/newsroom/stats/custody-and-transfer-statistics-fy2025 ; https://www.cbp.gov/sites/default/files/2025-02/updated_guidance_on_executive_order_on_securing_our_borders_20250130_508.pdf
- https://www.dhs.gov/news/2025/06/12/dhs-issues-notices-termination-chnv-parole-program-encourages-parolees-self-deport ; https://www.dhs.gov/news/2025/05/30/dhs-releases-statement-major-scotus-victory-trump-administration-and-american ; https://www.dhs.gov/2025

**Federal Register**
- https://www.federalregister.gov/api/v1/documents.json ; https://www.federalregister.gov/developers/documentation/api/v1 ; https://www.federalregister.gov/api/v1/agencies.json
- https://www.federalregister.gov/documents/2025/03/25/2025-05128/termination-of-parole-processes-for-cubans-haitians-nicaraguans-and-venezuelans ; https://public-inspection.federalregister.gov/2025-05128.pdf ; https://public-inspection.federalregister.gov/2023-09014.pdf ; https://www.federalregister.gov/documents/2025/12/15/2025-22744/… (FRP termination; number and slug via the fact-check pass, not opened here)
- https://dev.to/ronin13/us-regulations-have-a-free-json-api-every-rule-notice-and-executive-order-without-scraping-4o34 ; https://www.vaquill.ai/blog/federal-register-api-python-search-rules-and-notices ; https://github.com/rOpenGov/federalregister/blob/master/README.Rmd ; https://ropengov.r-universe.dev/federalregister/doc/manual.html ; https://glama.ai/mcp/servers/@aml25/federal-register-mcp/blob/1cb84882e151c4b3799f22256c7d5bd18078c92f/src/federal-register-api.ts ; https://apify.com/retrainmap/federal-register-documents ; https://oanor.com/api/fedregister-api/llms.txt

**CourtListener / litigation**
- https://www.courtlistener.com/api/rest/v4/ ; https://wiki.free.law/c/courtlistener/help/api/rest/v4/overview ; https://wiki.free.law/c/courtlistener/help/api/faqs/my-api-key-appears-to-be-throttled-rate-limited-help ; https://wiki.free.law/c/courtlistener/help/api/rest/faqs ; https://free.law/2026/05/07/api-included-in-memberships/ ; https://www.vaquill.ai/blog/how-to-use-courtlistener-api-2026 ; https://www.vaquill.ai/blog/how-to-use-courtlistener-api ; https://agentman.ai/agentskills/connections/mcp-server/courtlistener ; https://policylayer.com/tools/io-github-vaquill-ai-courtlistener-mcp/get-court
- https://www.courtlistener.com/help/api/rest/changes/ (v4.3: auth enforced on V4 endpoints, anonymous → 401) ; https://wiki.free.law/c/courtlistener/help/api/rest/v4/api-usage ; https://github.com/freelawproject/courtlistener-api-client ; https://www.courtlistener.com/docket/69695790/doe-v-noem/ (id and caption via the fact-check pass; not opened here)
- https://justiceactioncenter.org/case/svitlana-doe-v-noem/ ; https://justiceactioncenter.org/news/frn-decoder-frptermination/ ; https://justiceactioncenter.org/news/court-orders-trump-administration-to-keep-families-together/ ; https://litigationtracker.justiceactioncenter.org/cases/svitlana-doe-v-noem-humanitarian-parole-district-court ; https://clearinghouse.net/case/46186/ ; https://uscis-pause-tracker.com/cases/786112b9-99ff-4b65-a3d7-b59cdd1edc38 ; https://visainamerica.com/doe-v-noem-frp-parole-termination-case/ ; https://immpolicytracking.org/policies/uscis-terminates-family-reunification-parole-processes-for-colombians-cubans-ecuadorians-guatemalans-haitians-hondurans-and-salvadorans/
- https://storage.courtlistener.com/recap/gov.uscourts.mad.281389/gov.uscourts.mad.281389.128.0.pdf
- https://clearinghouse.net/doc/159070 ; https://clearinghouse.net/doc/161357 ; https://clearinghouse.net/doc/161356 ; https://clearinghouse.net/doc/167129/ ; https://clearinghouse.net/doc/167527/ ; https://clearinghouse.net/doc/156449 ; https://clearinghouse.net/doc/161359 ; https://clearinghouse.net/doc/157481 ; https://www.leagle.com/decision/infdco20250415c06

**Census**
- https://api.census.gov/data/2024/acs/acs1/variables/C05006_055M.html ; https://api.census.gov/data/2023/acs/acs1/variables/C05006_055M.html ; https://api.census.gov/data/2007/acs/acs1/variables/B05006_094M.json ; https://api.census.gov/data/2007/acs/acs1/variables/B05006_094EA.json ; https://api.census.gov/data/2005/acs/acs1/variables/B05006_092E.json ; https://api.census.gov/data/2022/acs/acs1/variables/B05006_141EA.html ; https://api.census.gov/data/2023/acs/acs5/variables/B05006_141M.html ; https://api.census.gov/data/2022/acs/acs5/variables/B05006_152EA.html ; https://api.census.gov/data/2010/acs/acs5/spt/variables/B05006_135EA.json ; https://api.census.gov/data/2019/acs/acs1/variables/B05006PR_026M.html ; https://api.census.gov/data/2024/acs/acs5/groups/B05006.json ; https://api.census.gov/data/key_signup.html

**Torch / case-status explainers and vendors**
- https://ai.parley.so/uscis-case-status-api ; https://www.casestatusapi.com/guides ; https://www.casestatusapi.com/guides/opt-case-status-api ; https://inmigrausa.com/uscis/inmigra_usa_case_status_api_production.pdf

**Processing-times explainers (third party)**
- https://apify.com/andrew_avina/uscis-intelligence-mcp ; https://www.boundless.com/es-mx/immigration-resources/uscis-processing-times ; https://bizlegalservices.com/2021/04/20/uscis-processing-times/ ; https://www.novo-legal.com/immigration-law/processing-times/office/i-485-miami-fl-131a-fam ; https://www.novo-legal.com/es/tiempos-de-procesamiento/office/i-485-miami-fl-131a-fam ; https://www.immigrationdirect.com/immigration-articles/form-i-485-processing-time ; https://www.vasquezlawnc.com/resources/processing-times ; https://www.vasquezlawnc.com/blog/uscis-processing-times-february-2026 ; https://manifestlaw.com/blog/i485-processing-times ; https://www.lighthousehq.com/blog/i-485-processing-times ; https://www.beyondborderglobal.com/resources/i-485-processing-time----what-recent-uscis-data-shows ; AILA practice PDFs surfaced by search: https://www.aila.org/aila-files/9D26B199-BE73-4660-B3EE-239F4E02C941/15121505.pdf ; https://www.aila.org/aila-files/6FF5CE8C-D21E-43A3-9BFA-BACA7E0EC043/16061561.pdf ; https://www.aila.org/aila-files/4640425A-BF50-4F6A-B6AD-6ACAD7232772/16011301.pdf ; https://assets.aila.org/files/ecb636e8-99a7-4994-b7c3-6dbcc1468f38/10091635.pdf ; https://www.aila.org/aila-files/F27D41BE-3329-4D57-BB1F-28B7072C6946/16041364.pdf

**Quarterly-data coverage and Cuban community media**
- https://manifestlaw.com/news/uscis-q3-fy2026-approval-data-09-09-2026 ; https://www.americanimmigrationcouncil.org/blog/uscis-immigration-processing-trends-2026/ ; https://immiva.com/blog/uscis-processing-times-by-form ; https://immiva.com/blog/uscis-denial-rates-by-form ; https://www.niskanencenter.org/immigrationdata/
- https://www.14ymedio.com/cuba/migracion/aprobaciones-residencia-ley-ajuste-cubano_1_1132080.html ; https://www.americateve.com/cuba/alarma-cubanos-uscis-aprobo-solo-139-residencias-ley-ajuste-y-rechazo-otras-447-n5464900 ; https://www.unotv.com/us/inmigracion-us/ley-de-ajuste-cubano-las-residencias-aprobadas-caen-mas-de-99/ ; https://www.directoriocubano.info/tramites-usa/ley-ajuste-cubano-aprobaciones-negativas-2026/ ; https://www.directoriocubano.info/cuba/cada-vez-menos-residencias-ley-ajuste-cubano-fin-sin-derogarla/ ; https://www.periodicocubano.com/uscis-acelera-aprobaciones-de-residencias-por-la-ley-de-ajuste-cubano/ ; https://www.periodicocubano.com/cuantas-green-cards-aprobo-uscis-bajo-la-ley-de-ajuste-cubano-en-julio-miles-siguen-a-la-espera/ ; https://www.periodicocubano.com/uscis-rechaza-tres-de-cada-cuatro-peticiones-bajo-la-ley-de-ajuste-cubano-solo-estos-casos-fueron-aprobados/ ; https://noticias.cubitanow.com/gobierno-propone-producir-harina-de-yuca-para-sustituir-la-de-trigo-y-asi-reaccionan-los-cubanos/buenas-noticias-para-miles-de-cubanos-uscis-comienza-a-destrabar-residencias-
- CHNV background surfaced by search: https://www.americanimmigrationcouncil.org/fact-sheet/biden-administrations-humanitarian-parole-program-cubans-haitians-nicaraguans-and/ ; https://www.americanimmigrationcouncil.org/fact-sheet/use-parole-under-immigration-law/ ; https://curbelolaw.com/humanitarian-parole-program/ ; https://visafortheunitedstates.com/visa-types/tourist-visa/us-visa-for-cuban-citizens-2026-cuban-adjustment-act-chnv-asylum-green-card/ ; https://fedlaws.org/cuban-migration-to-the-us-adjustment-act-parole-and-asylum/ ; https://www.gtlaw-insidebusinessimmigration.com/cbp/cbp-provides-updates-on-humanitarian-parole-program-for-cuba-haiti-nicaragua-and-venezuela/ ; https://www.foxnews.com/us/nearly-530000-migrants-came-us-legally-paroled-us-under-controversial-biden-program-cbp.amp ; https://americafirstpolicy.com/assets/uploads/files/Fact_Sheet_-_Over_450%2C000_illegal_aliens_have_been_Paroled_into_the_U.S_._under_the_Biden_Administration%E2%80%99s_Unlawful_CHNV_SCHEME_.pdf ; https://www.americanprogress.org/?p=123778
- OHSS-related: https://usafacts.org/articles/ask-an-analyst/searching-for-data-on-ice/ ; https://popcenters.org/2024/01/08/new-ohss-immigration-enforcement-and-legal-processes-report ; https://factually.co/fact-checks/politics/ice-monthly-removals-tables-march-may-2026-3280be ; https://factually.co/fact-checks/politics/dhs-statistics-ice-arrests-after-2025-inauguration-d49bbe

**Project files consulted**
- `/home/user/Documents/cuban-immigration-tracker/README.md`
- `/home/user/Documents/cuban-immigration-tracker/docs/research/04-uscis-data-sources.md`
- `/home/user/Documents/cuban-immigration-tracker/docs/research/05-other-government-data.md`

---

## Verification notes (editor pass, 2026-10-20)

Two adversarial fact-checkers reviewed this file; the editor re-tested the two major findings with the two WebSearch calls available and accepted the rest on the checkers' citations, tagged **[S-fc]**.

| Finding | Verdict | Evidence seen by the editor today | Edits |
|---|---|---|---|
| CourtListener dockets are not reachable anonymously (401), so the "poll anonymously ≤100/day" branch was dead | **Accepted — confirmed** | Official REST change log: v4.3 "enforced authentication in V4 API endpoints; anonymous requests now receive a 401", listing `/dockets`, `/opinion-clusters`, `/opinions` [S, courtlistener.com/help/api/rest/changes/]; the FLP "API Usage" wiki page (anonymous → 401; own throttle 10/min, 120/hr) [S]; vaquill.ai 2026-10-06 test (anonymous 200 only for `/search/`, `/courts/`, `/audio/`) [S]. The 5/min, 50/hr, 125/day authenticated defaults are confirmed by two third-party sources [S]. **Not confirmed:** the temporary 2× limit windows (Jul and Sep–Oct 2026) — kept as [S-fc]. | §0 row 7, §7.1, §7.2 budget note, §12.3, §12.4 (`cl.*` rows, new `cl.usage`), §12.6 notes, §12.8, §13 Q8, §10 (2026-10-06 row) |
| The January 2026 *Doe v. Noem* orders concern Family Reunification Parole termination, not CHNV or the adjustment pause; the second order is dated 01-24, not 01-25 | **Accepted — confirmed** | TRO 2026-01-10, 14 days to 2026-01-24, pausing FRP parole/EAD terminations; PI/stay 2026-01-24 for a certified FRP subclass [S, justiceactioncenter.org; clearinghouse.net/case/46186; visainamerica.com]. One tracker puts the class-modification memorandum at 2026-03-11 [S, uscis-pause-tracker.com] — unresolved. ECF 243/258 and the 2026 WL cites surfaced nowhere; they are now marked unverified and the probe reads the real entry numbers. | §7.2 ECF paragraph, §10 timeline, §12.4 `cl.entries` |
| The Torch sandbox weekday 7 AM–8 PM ET / 503 window is community-observed, not official | **Accepted** (no search needed; the only source was `torchClient.ts`) | — | §0 row 2b, §2.2, §11, §12.4 `torch.token`, §12.6 cron comment and notes, §13 Q13 |
| Docket id 69695790; caption now "Doe v. Mullin"; assert on `docket_number`/`pacer_case_id`, not `case_name` | **Accepted as [S-fc]** (no search budget left to open the page) | checker-supplied URL `https://www.courtlistener.com/docket/69695790/doe-v-noem/` | §7.2 table, §12.4 `cl.docket`/`cl.entries`, §12.5 `ClDocket` comment, §13 Q8 |
| Missing: FR 2025-22744 (FRP termination, 2025-12-15) | **Added** — the notice's date, title and role in the Jan 2026 orders are [S] (JAC FRN decoder; immpolicytracking.org); the document number itself is [S-fc] | — | §5 policy anchors, §6 fixture 2 and known numbers, §10 timeline |
| Missing: 2025-05-28 class-wide preliminary relief (resume benefits processing) | **Added as [S-fc, consistent with T]** | — | §7.2, §10 |
| Missing: FY2026 Q2 CAA fixtures (50 approved / 45 denied; 52.6% → 23.7%) | **Added as [S-fc]** | — | §3.4 |
| Missing: CBP Nov-2024 vs Dec-2024 rounding (93,080/117,320; 531,670 vs 531,690; Dec sums to 531,680) | **Added as [S-fc]**; probe now asserts the four figures only on the Dec 2024 page with ±10 tolerance | — | §5, §12.4 `cbp.dec24`/`cbp.jan25` |
| Missing: explicit statement that no real receipt can be validated in the Torch sandbox | **Added** | — | §11 |

Dead or wrong URLs: none reported by the checkers, none changed. Items the checkers could not verify and the editor did not re-test are listed in §13 Q14 and keep their original tags.
