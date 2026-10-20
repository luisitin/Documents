# 00 — Key Facts for the App (machine-friendly)

Compact list of what the app must encode. Distilled from research docs 01–13 on 2026-10-20. Tags: [S] seen in a page/search result · [F] read from a USCIS data file · [T] training knowledge · [I] inferred. Dates ISO-8601. Money USD. Every value should be stored with an `as_of` and a `source` field in the app's data files.

## 1. Eligibility rules (Cuban Adjustment Act, Pub. L. 89-732)

```yaml
caa_eligibility:
  statute: "Pub. L. 89-732 (1966), 8 U.S.C. 1255 note"          # [S] doc 02
  nationality: native_or_citizen_of_cuba                        # Cuban passport, birth certificate or Cuban citizenship proof
  entry: inspected_and_admitted_or_paroled                       # I-94 shows admission or "paroled" (DT/CHNV/FRP/CFRP/CBP One)
  excluded_entry_channels:
    - I220A            # Order of Release on Recognizance; NOT parole (Matter of Cabrera-Fernandez, 27 I&N Dec. 180 (BIA 2023)); 11th Cir. remand 2026-02-23 did not change this [S]
    - EWI              # entered without inspection
  physical_presence_min_days: 365                                # "un año y un día" in community usage; file on/after day 366 [S] doc 02
  admissible: true                                               # inadmissibility grounds apply; waivers via I-601 where available
  public_charge_test: exempt                                     # USCIS Policy Manual public-charge exemption table, 2026-08-18 [S] docs 10/11
  visa_number_required: false
  priority_date_required: false
  parole_still_valid_required: false                             # expired/terminated parole does not defeat eligibility [S] docs 03/11
  discretion: true                                               # PM-602-0199 (2026-05-21) discretion framing; CAA carve-out per practitioners [S-practitioner]
  derivatives:
    who: spouse_or_unmarried_child_under_21_of_principal
    nationality: any
    requirement: residing_with_principal_in_US
    class_codes: {principal: CU6, derivative: CU7}               # [S] doc 02/05
  rollback_months_max: 30                                        # LPR date = later of (arrival date) or (approval date - 30 months) [S] doc 02
  nta_on_denial: true                                            # PM-602-0187 (2025-02-28): denial + not lawfully present -> NTA [S] doc 11
entry_channel_enum: [CHNV, CBP_ONE, FRP_CFRP, I220A, VISA, OTHER_PAROLE, EWI]
```

Flags the app must set per case:
- `is_parole_based = entry_channel in {CHNV, CBP_ONE, FRP_CFRP, OTHER_PAROLE}`.
- `frp_i485_carveout = (entry_channel == FRP_CFRP) and (i485_filed_on <= 2025-12-15)` → parole did not end on 2026-01-14 [S] FR 2025-22744.
- `red_eagle_class_member = cuban_national and i485_not_finally_adjudicated_as_of_2026-08-24` [S] N.D. Cal. 3:26-cv-04850.
- `i220a_warning = (entry_channel == I220A)` → show "not CAA-eligible under current BIA precedent; BIA remand decision expected late 2026" and no estimate.

## 2. Milestone sequence (I-485 CAA, 2025+ filers)

| # | Milestone key | EN | ES | Typical timing (R0 / current) | Notes |
|---|---|---|---|---|---|
| 1 | `filed` | Package mailed / e-filed | Paquete enviado | day 0 | Lockbox (Chicago/Dallas/Phoenix by state); paper only for CAA in practice |
| 2 | `receipt` | Receipt notice (I-797C) | Aviso de recibo | 2–4 weeks | Receipt prefix IOE (online) / MSC / SRC / WAC / EAC / LIN; "MSC 2490…" block ≈ Oct 2023–Aug 2024 filings [S] doc 10 |
| 3 | `biometrics` | Biometrics appointment (ASC) | Cita biométrica | 3–8 weeks (R0); Jun–Aug 2025 for Mar 2025 filers (R1 release) | Reuse of prior biometrics stopped 2025-12-12 [S′] doc 07 |
| 4 | `ead_c9` | EAD (c)(9) card produced | Permiso de trabajo (c)(9) | 3–6 mo (R0); 6 mo reference case (Sep 2025); 12–13 mo for later cohorts [S] | Validity 5 yr if issued before 2025-12-05, 18 mo after; no auto-extension on renewals filed ≥ 2025-10-30 [S] |
| 5 | `ap_i131` | Advance parole (optional) | Permiso de viaje | with EAD | Travel strongly discouraged for CHNV parolees post-termination [T] |
| 6 | `interview_notice` | Interview notice | Aviso de entrevista | 6–12 mo (R0); now expected for most 2025+ filers (P ≥ 0.8) [I] doc 12 | Field office by ZIP |
| 7 | `interview` | Interview | Entrevista | +4–8 weeks | PM-602-0199 discretion questions reported May–Jun 2026 [S] |
| 8 | `rfe` / `noid` | Request for Evidence / Notice of Intent to Deny | Solicitud de evidencia / Intención de negar | any time | PA-2026-05: RFE ≤ 12 weeks, NOID 30 days (+3 mail), no extensions, denial without RFE possible [S] |
| 9 | `decision` | Approval / Denial | Aprobación / Negación | FY2025 median 7.0 mo; FY2026 11.8 mo (cut 2026-07-31) [S] | Approval share FY26 Q3 23.7% (selection artefact) [F] |
| 10 | `card` | Green card produced/mailed | Tarjeta de residencia | +2–4 weeks | Rollback up to 30 months |
| 11 | `re_review` | Post-approval re-review (PA-2025-26) | Re-revisión | — | Re-review policy stayed back into effect by 1st Cir. 2026-08-14 (partial stay) [S] |
| 12 | `naturalization_eligible` | N-400 eligible | Elegible para ciudadanía | LPR date + 5 yr (rollback counts) | PA-2026-10 neighbourhood checks for N-400 [S] |

Milestone-to-milestone conditionals should be learned from crowdsourced timelines only where cell n ≥ 5 (doc 06/09 privacy rule).

## 3. Regime breakpoints (exact dates for the estimator)

```json
{
  "regimes": [
    {"id":"R0","label":"fast lane","start":null,"end":"2025-02-13","hold":false,"appliesTo":["ALL_CUBAN"]},
    {"id":"R1","label":"parolee benefit hold (Davidson memo)","start":"2025-02-14","end":"2025-06-09","hold":true,"appliesTo":["CHNV"],
     "alt_end":{"legal":"2025-05-28","ops_reports":["2025-06-19","2025-06-25"]},"instruments":["USCIS memo 2025-02-14"]},
    {"id":"R2","label":"catch-up","start":"2025-06-09","end":"2025-12-01","hold":false,"appliesTo":["ALL_CUBAN"],"instruments":["USCIS memo 2025-06-09"]},
    {"id":"R3","label":"country hold-and-review","start":"2025-12-02","end":"2026-06-12","hold":true,"appliesTo":["ALL_CUBAN"],
     "alt_end":{"legal":"2026-06-05","judgment":"2026-06-11","ops_reports":["2026-07-16"]},"instruments":["PM-602-0192","PM-602-0194","PA-2025-26"]},
    {"id":"R4","label":"discretion regime","start":"2026-06-12","policy_start":"2026-05-22","end":null,"hold":false,"appliesTo":["ALL_CUBAN"],
     "instruments":["PM-602-0199","PA-2026-05","Red Eagle PI 2026-08-24","1st Cir partial stay 2026-08-14","I-485 edition 2026-09-18"]}
  ],
  "sub_breakpoints": [
    {"date":"2025-05-30","event":"SCOTUS stay 24A1079: CHNV parole termination proceeds"},
    {"date":"2025-06-12","event":"CHNV termination notices; (c)(11) EADs revoked"},
    {"date":"2025-08-19","event":"parole history listed as negative discretionary factor"},
    {"date":"2025-10-30","event":"no EAD auto-extension for renewals filed on/after"},
    {"date":"2025-12-05","event":"EAD max validity 18 months"},
    {"date":"2025-12-15","event":"FRP termination; I-485-on-file carve-out"},
    {"date":"2026-01-01","event":"PM-602-0194: 39 countries; PA-2025-26 re-review"},
    {"date":"2026-05-22","event":"PM-602-0199 discretion memo (file-dated 05-21)"},
    {"date":"2026-06-05","event":"Dorcas vacatur (legal end of R3)"},
    {"date":"2026-08-05","event":"PA-2026-05 deny-without-RFE"},
    {"date":"2026-08-14","event":"1st Cir partial stay: re-review policy back"},
    {"date":"2026-08-24","event":"Red Eagle class PI"},
    {"date":"2026-09-18","event":"I-485 edition 09/18/26 mandatory"},
    {"date":"2026-10-14","event":"EAD auto-extension removal final rule"}
  ],
  "adjudicable_days_rule": "calendar_days(filed, today) - sum(overlap_days(regime) for regime in regimes if regime.hold and (ALL_CUBAN in regime.appliesTo or (case.entryChannel == 'CHNV' and 'CHNV' in regime.appliesTo)))",
  "reference_case": {"filedOn":"2025-03-15","today":"2026-10-20","calendar_days":584,"adjudicable_days_default":306,"adjudicable_days_alt_ops_ends":256}
}
```

Estimator defaults (doc 08 VPH-1): horizon H = 72 months; β_age = 0.0374/month; receipts forecast 1,000/month; office shrinkage k₀ = 50, clamp [0.5, 2.0]; post-interview decision lognormal median 3 mo, σ 0.857; multipliers: EAD received 1.0, no biometrics after 4 mo 0.7, RFE pending 0, RFE answered 1.5, mandamus filed 3.0. Scenarios: S0 800/mo flat (p 0.30); S1 ramp 800→4,600 over 12 mo (0.40); S2 ramp 800→9,200 over 6 mo (0.15); S3 six-month re-freeze then S1 (0.15). Office multipliers from FY26 Q2+Q3 (approvals / mean pending): HIA 0.947, KND 0.829, MIA 0.963, TAM 1.936, HOU 1.140 (raw; shrink before use). Alert re-weighting: Dorcas affirmed → S3 ÷ 3; Dorcas reversed → S3 × 3 (× 1.5 while Red Eagle PI in force); new hold memo naming Cuba → S3 × 3; monthly completions ≥ 2,000 for two months → S0 ÷ 2, S1 × 1.5.

## 4. Fees (USCIS, paper filing)

| Form | Fee | Since | Note | Source |
|---|---|---|---|---|
| I-485 (age 14+) | $1,440 | 2024-04-01 | biometrics included; no H.R.1 surcharge; no FY2026/FY2027 change | 89 FR 6194 [S′] docs 02/11 |
| I-485 (under 14, with parent) | $950 | 2024-04-01 | | same |
| I-765 (c)(9) initial/renewal | $260 | 2024-04-01 | no longer free with I-485; no H.R.1 surcharge | same |
| I-131 advance parole (with I-485) | $630 | 2024-04-01 | | same |
| I-912 fee waiver | $0 | — | CAA I-485 fee is waivable [T] | doc 02 |
| I-765 (c)(11) parole EAD initial / renewal | $550 / $275 → $560 / $280 (2026-01-01) → $570 / $280 (2026-10-16) | 2025-07-22 | H.R.1 statutory, not waivable; only relevant to re-parole side-path | FR 2025-13738, 2025-20622 [S] doc 11 |
| Parole / re-parole (I-131) | $1,000 → $1,020 (2026-01-01) → $1,050 (2026-10-16) | 2025-07-22 | | same |
| I-589 asylum | $100 + $100/yr → $102 → $105/yr | 2025-07-22 | side-path only | same |
| TPS (I-821) | $500 | 2025-07-22 | not available to Cubans | same |
| I-246 stay of removal | $155 (proposed $755, NPRM 2026-05-07) | — | removal context | doc 11 |

Form edition: I-485 edition **09/18/26** mandatory for filings postmarked/e-filed on/after 2026-09-18, no grace period [S]. I-693 must be filed with the I-485 (since 2024-12-02) and is valid only while that I-485 is pending (since 2025-06-11) [S′].

## 5. Field offices (Cuban-relevant subset; codes as used by the Processing Times tool)

| Code | Office | State | Aug 2026 family-based 80% time (mo) [S yiminshuju] | 131A-FAM case-inquiry date (2026-10-15) [F] | Counties (indicative, [T]) |
|---|---|---|---|---|---|
| MIA | Miami | FL | 21.5 | 2023-06-17 | Miami-Dade (city/north; sub-county by ZIP) |
| HIA | Hialeah | FL | n/q | 2024-07-05 | Miami-Dade (Hialeah/NW) |
| KND | Kendall | FL | n/q | 2024-05-28 | Miami-Dade (south/west) |
| OKL | Oakland Park | FL | n/q ("Hollywood FL" in some sources = this office) | 2023-07-19 | Broward |
| WPB | West Palm Beach | FL | n/q | 2024-05-18 | Palm Beach, Martin, St. Lucie, Indian River, Okeechobee |
| OFM | Fort Myers | FL | n/q | 2024-05-11 | Lee, Collier, Charlotte, Hendry, Glades |
| TAM | Tampa | FL | 17.0 | 2024-08-07 | Hillsborough, Pinellas, Pasco, Polk, Manatee, Sarasota, Hernando |
| ORL | Orlando | FL | 18.5 | 2024-01-28 | Orange, Osceola, Seminole, Brevard, Volusia, Lake, Flagler |
| JAC | Jacksonville | FL | 17.0 | 2024-02-08 | Duval, Clay, Nassau, St. Johns, Alachua, Marion, panhandle |
| HOU | Houston | TX | 18.0 | 2023-10-29 | Harris + SE Texas |
| DAL | Dallas | TX | 13.5 | n/a | DFW |
| SNA | San Antonio | TX | n/q | 2024-10-11 | |
| LOU | Louisville | KY | 12.5 | 2024-10-03 | KY |
| LVG | Las Vegas | NV | 19.0 | 2023-10-31 | Clark |
| NEW | Newark | NJ | 22.0 | n/a | N NJ (Union City/West New York Cuban community) |
| NYC | New York City | NY | n/q | 2024-01-13 | Manhattan/Bronx/Staten Island |
| CLT | Charlotte | NC | 18.0 | n/a | |
| ATL | Atlanta | GA | ~16.5 | n/a | |
| CHI | Chicago | IL | n/q | 2023-06-13 | |

Rules: (1) the tool lists 90 `131A-FAM` offices; load the list at runtime from `formoffices/I-485/131A-FAM` (or the jzebedee SQLite) and never hard-code it; (2) map ZIP → county (HUD USPS crosswalk) → office, with Miami-Dade split by ZIP into MIA/HIA/KND [I] doc 12; (3) addresses in doc 12 are [T] — link to `https://www.uscis.gov/about-us/find-a-uscis-office/field-offices` instead of storing them; (4) there is no CAA subtype in processing times — label the 131A-FAM figure "proxy (family-based)".

Cuban geography (Pew 2024, doc 12): 2.9 M Cuban-origin; 1.67 M Cuban immigrants; 76% in Florida, 60% in greater Miami; Tampa 6%, NY 5%, TX 5%, NJ 3%. CBSA codes: Miami 33100, Tampa 45300, Orlando 36740, Jacksonville 27260, Houston 26420, Dallas 19100, Louisville 31140, Las Vegas 29820, NY-Newark 35620, Charlotte 16740, Atlanta 12060.

## 6. National series (anchor values, [F] from USCIS files)

Monthly Cuban I-485 (received / approved / denied / pending at month end; avg pending age where stated):

```
2025-01 22880 10034 275 194437
2025-02 24385 10984 298 207564
2025-03 26187  8065 302 225208
2025-04 27173  5662 282 246689
2025-05 23881  3376 226 267090
2025-06 21510  1647 277 286309
2025-07 19354  2265 207 302775
2025-08 13748  2784 190 312913
2025-09 11152  3529 215 318763
2025-10  9059  1954 186 323471
2025-11  7265  2111 175 327987
2025-12  8598    41  14 336589  age 19.4
2026-01  7086    15   4 343656  age 27.8
2026-02  4813    10  21 348318
2026-03  3439    25  21 351423
2026-04  2665    23  38 353450
2026-05  1846    27 129 354649  age 23.2
2026-06  1774    89 281 355371
2026-07  1355   308 318 355379
2026-08  1213   386 434 355520  pending>6mo 345741  age 20.6
```

Quarterly (received / approved / denied / completions / pending / median months): FY26 Q1 24,909 / 4,098 / 373 / — / 327,255 / 10.4; FY26 Q2 15,312 / 50 / 45 / — / — / 19.5; FY26 Q3 6,279 / 139 / 447 / 586 / 342,360 / 16.3. Annual medians (historic-pt): FY2023 3.3, FY2024 4.6, FY2025 7.0, FY2026 YTD 11.8 (cut 2026-07-31; 12.3 at 2026-08-30 cut). Headline pending = monthly CSV only.

## 7. Data-source endpoints (from doc 13 probes)

HTTP policy for all USCIS hosts: browser `User-Agent` (e.g. `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...`), `Accept: application/json` or `text/html`, `Referer` set to the host's landing page, cookie jar, 15 s timeout, 3 retries with backoff; classify responses as `ok | schema_mismatch | blocked_cloudflare | http_error | network_error | skipped_no_secret`. Cloudflare markers: body contains "Just a moment..." / "Attention Required! | Cloudflare" / "Sorry, you have been blocked", or header `cf-mitigated: challenge`.

| Key | Endpoint / URL pattern | Auth | Response shape (essentials) | Cadence | Probe status (Round 1) |
|---|---|---|---|---|---|
| `portal.monthly` | `GET https://www.uscis.gov/sites/default/files/document/data/appropriation_requirement_<month>_<year>_v1.0.csv` (month lowercase English; latest `august_2026`; next expected `september_2026`) | none; browser UA | CSV; rows keyed by form + category incl. `I-485 (Cuban)`: received, approved, denied, pending, pending >6 months, average months | monthly, 4–8 weeks lag | ok [F] |
| `portal.quarterly` | `GET https://www.uscis.gov/sites/default/files/document/data/quarterly_all_forms_fy<YYYY>_q<N>_v1.xlsx` (latest `fy2026_q3`; FY26 Q4 ≈ early Dec 2026) | none; browser UA | XLSX; sheet per form; CAA row with receipts/approvals/denials/pending/median | quarterly, ~10 weeks lag | ok [F] |
| `portal.i485office` | `GET https://www.uscis.gov/sites/default/files/document/data/i485_performance_data_fy<YYYY>_q<N>_v1.xlsx` | none; browser UA | XLSX; by field office: receipts, approvals, denials, pending | quarterly | ok [F] |
| `portal.index` | `GET https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data` | none; browser UA | HTML list; links under `/sites/default/files/document/{data,reports,forms}/` (older variants `resource-information-center-queries`) | — | ok |
| `pt.formtypes` | `GET https://egov.uscis.gov/processing-times/api/formtypes/I-485` | none; browser headers + `Referer: https://egov.uscis.gov/processing-times/` | JSON `data.subtypes[]{form_key, form_name}`; expected keys `131A, 131A-FAM, 131A-HRIFA, 131B, 131C, 131T, 131U` | silent, ~monthly | blocked_cloudflare from cloud IPs; ok from residential [S] |
| `pt.offices` | `GET https://egov.uscis.gov/processing-times/api/formoffices/I-485/131A-FAM` | same | JSON `data.offices[]{office_code, office_description}` (90 offices) | same | same |
| `pt.time` | `GET https://egov.uscis.gov/processing-times/api/processingtime/I-485/<OFFICE>/131A-FAM` | same | JSON `data.processing_time{form_name, office_code, subtypes[]{form_type, range[]{value, unit}, service_request_date, publication_date}}` | same | same |
| `pt.nextaction` | `GET https://egov.uscis.gov/processing-times` → find `/processing-times/_next/static/chunks/*.js` → action id for `getProcessingTime`; `POST https://egov.uscis.gov/processing-times` headers `Next-Action: <id>`, `Accept: text/x-component`, body `["I-485","131A-FAM","MIA"]` | same | React Flight text stream; parse the JSON line | action ids rotate per deploy | partial [S] |
| `pt.historic` | `GET https://egov.uscis.gov/processing-times/historic-pt` | browser UA | HTML table of FY medians by form | annual + in-year update | ok |
| `pt.moreinfo` | `GET https://egov.uscis.gov/processing-times/more-info` | browser UA | HTML (80% definition, inquiry-date rule) | — | ok |
| `mirror.jzebedee` | `GET https://api.github.com/repos/jzebedee/uscis/releases/latest` → asset `https://github.com/jzebedee/uscis/releases/download/<YYYY-MM-DD>/<YYYY-MM-DD>.db` [I pattern] | optional `GITHUB_TOKEN` | SQLite: tables for forms, form_types, offices, processing_times (value/unit, service_request_date, publication_date) | daily | ok (GitHub reachable) |
| `mirror.visualizer` | `GET https://raw.githubusercontent.com/omairqazi29/visualizer/master/data/USCIS_I485/<file>` | none | XLSX/CSV copies of portal files | weekly GitHub Action | ok |
| `torch.token` | `POST https://api-int.uscis.gov/oauth/accesstoken` (prod `https://api.uscis.gov/oauth/accesstoken`), form `grant_type=client_credentials&scope=read`, basic auth `USCIS_CLIENT_ID:USCIS_CLIENT_SECRET` | secrets | JSON `{access_token, token_type:"BearerToken", expires_in:1800, ...}` | per 30 min | skipped_no_secret |
| `torch.case` | `GET https://api-int.uscis.gov/case-status/<RECEIPT>` (sandbox canned receipts e.g. `EAC9999103402`; prod `https://api.uscis.gov/case-status/<RECEIPT>`) `Authorization: Bearer <token>` | secrets | JSON `case_status{receiptNumber, formType, submittedDate, modifiedDate, current_case_status_text_en, current_case_status_desc_en, current_case_status_text_es, current_case_status_desc_es, hist_case_status[]{date, completed_text_en, completed_text_es}}` (alt key `historicalCaseStatuses[]` — sniff both); errors 401/404/422/429/503; 302 = sandbox incident | real time; sandbox 5 TPS, 1,000/day; prod 10 TPS, 400,000/day (or 150,000/day — conflict) | skipped_no_secret |
| `csol.web` | `https://egov.uscis.gov/casestatus/landing.do`; backend `https://egov.uscis.gov/csol-api/case-statuses/<RECEIPT>` | none | JSON (unofficial) | real time | blocked_cloudflare |
| `ohss.monthly` | index `https://ohss.dhs.gov/topics/immigration/immigration-enforcement/monthly-tables`; file `https://ohss.dhs.gov/sites/default/files/<YYYY-MM>/<YYYY_MMDD>_ohss_immigration-enforcement-and-legal-processes-tables-<month>-<year>.xlsx` (e.g. `2025-01/2025_0116_..._november-2024.xlsx`) | none | XLSX; multi-sheet incl. parole grants by nationality | monthly, third Thursday (publication day varies) | ok (index); file date must be scraped |
| `ohss.yearbook` | `https://ohss.dhs.gov/topics/immigration/yearbook/2024`; file `https://ohss.dhs.gov/sites/default/files/2026-06/2026_0604_ohss_yearbook_lawful_permanent_residents_fy2024.xlsx` | none | XLSX; LPR by class of admission (CU6/CU7) and state | annual | ok |
| `cbp.monthly` | `https://www.cbp.gov/newsroom/national-media-release/cbp-releases-<month>-<year>-monthly-update` (dec 2024, jan 2025) | browser UA | HTML; regex `([\d,]+) Cubans, ([\d,]+) Haitians, ([\d,]+) Nicaraguans, and ([\d,]+) Venezuelans` → 110,240 / 211,040 / 93,070 / 117,330 | series ended Jan 2025 | ok |
| `fr.search` | `GET https://www.federalregister.gov/api/v1/documents.json?conditions[term]=<q>&conditions[agencies][]=homeland-security-department&conditions[agencies][]=u-s-citizenship-and-immigration-services&order=newest&per_page=20` | none | JSON `{count, results[]{document_number, title, publication_date, type, html_url, pdf_url, agencies[]}}` | daily ~06:00 ET | ok |
| `fr.doc` | `GET https://www.federalregister.gov/api/v1/documents/<document_number>.json` (assert `2025-05128`, `2025-22744`, `2025-20622`, `2025-13738`, `2026-20955`) | none | JSON document object | — | ok |
| `cl.docket` | `GET https://www.courtlistener.com/api/rest/v4/dockets/69695790/` (Doe v. Noem/Mullin, D. Mass. 1:25-cv-10495; pacer_case_id 281389); lookup `GET /dockets/?court=mad&docket_number=1:25-cv-10495`; Dorcas `court=rid&docket_number=1:26-cv-00132`; Red Eagle `court=cand&docket_number=3:26-cv-04850` | `Authorization: Token <COURTLISTENER_TOKEN>` (required since v4.3; anon → 401) | JSON `{id, case_name, docket_number, court, date_filed, pacer_case_id, ...}` | real time | skipped_no_secret |
| `cl.entries` | `GET https://www.courtlistener.com/api/rest/v4/docket-entries/?docket=69695790&order_by=-date_filed` | token | JSON `{count, next, results[]{id, date_filed, entry_number, description, recap_documents[]}}` | real time; 5/min, 50/hr, 125/day | skipped_no_secret |
| `cl.alert` | `POST https://www.courtlistener.com/api/rest/v4/docket-alerts/` body `docket=<id>` | token | JSON alert object | — | skipped_no_secret |
| `census.cuba` | `GET https://api.census.gov/data/<vintage>/acs/acs1?get=NAME,B05006_143E,B05006_143M&for=metropolitan statistical area/micropolitan statistical area:33100[&key=]` ; resolve variable by label `Estimate!!Total:!!Americas:!!Latin America:!!Caribbean:!!Cuba` from `https://api.census.gov/data/<vintage>/acs/acs5/groups/B05006.json` | optional `CENSUS_API_KEY` (≤500/day without) | JSON array-of-arrays, header row first | annual (1-yr Sep; 5-yr Dec) | ok |
| `rss.alerts` | `GET https://www.uscis.gov/news/rss-feed/22984` (alerts); `23269` news releases; `59144`/`60288` all news; `93166` fact sheets; `97790` stakeholder messages; `https://www.uscis.gov/forms/forms-updates/rss-feed` | browser UA | RSS 2.0 `channel.item[]{title, link, pubDate, description}` | event-driven | ok with browser UA |
| `foia.metrics` | `GET https://first.uscis.gov/api/public/foia-metrics` with `Referer: https://first.uscis.gov/` | none | JSON | daily | unknown |

Pipeline cadence (doc 09): GitHub Actions `17 6 * * *` and `17 18 * * *` UTC for snapshots; probes `17 13 * * 1-5`; GitHub Pages `manifest.json` with `schema_version, generated_at, latest_snapshot, snapshots[], sources[], national_monthly[], quarterly_median_months[], by_state_quarterly[], processing_times[], community_aggregates[], estimator_params, alerts[]`. Secrets: `USCIS_CLIENT_ID`, `USCIS_CLIENT_SECRET`, `COURTLISTENER_TOKEN`, `CENSUS_API_KEY`, `GITHUB_TOKEN`. Keep the public repo's cron alive (60-day inactivity disable).

## 8. Litigation watch list (for alert rules)

| Case | Court / No. | Status 2026-10-20 | Alert effect |
|---|---|---|---|
| Doe v. Noem (now Mullin) | D. Mass. 1:25-cv-10495-IT; 1st Cir. 25-1384; SCOTUS 24A1079 | May 28 2025 benefits order final (appeal dismissed 2025-11-04); CHNV SJ motion pending; FRP PI 2026-01-24 | none for R1; FRP flag |
| Dorcas Int'l Inst. of R.I. v. USCIS | D.R.I. 1:26-cv-00132; 1st Cir. 26-1703 | Vacatur in force; partial stay (re-review only) 2026-08-14; merits pending | affirmed → S3 ÷ 3; reversed → S3 × 3 (× 1.5 while Red Eagle holds) |
| Red Eagle Law v. Edlow | N.D. Cal. 3:26-cv-04850-CRB | Class PI 2026-08-24 in force; case stayed 2026-08-28; status conf. 2026-09-25 (outcome unknown) | PI dissolved → S3 × 2 |
| AAUP v. Mullin | D. Mass. 1:26-cv-14527 [T docket] | Filed ~2026-10-05 [T]; no PI ruling found | relief → raise approval-given-decision prior |
| Acosta Reynoso v. USCIS | M.D. Fla. 8:26-cv-01314 (Mizelle) | TRO denied 07-03, PI denied 07-30 2026 | mandamus multiplier stays 3.0 only when filed |
| CHIRLA v. Noem | D.D.C. 25-cv-00872 | ER stay 2025-08-01 | none |
| Labrada-Hechavarria | 11th Cir. 23-13664 / 24-10645 | remand 2026-02-23; BIA decision expected Oct–Nov 2026 | I-220A eligibility flip |

## 9. Glossary EN / ES

| Term | EN | ES | Definition |
|---|---|---|---|
| CAA | Cuban Adjustment Act | Ley de Ajuste Cubano | 1966 statute allowing paroled/admitted Cubans to adjust after one year |
| CHNV | CHNV parole | Parole humanitario CHNV | 2023–2025 parole process for Cubans, Haitians, Nicaraguans, Venezuelans |
| Parole | Humanitarian parole | Parole / permiso de permanencia temporal | Discretionary entry under INA 212(d)(5); counts for CAA |
| I-94 | Arrival/Departure Record | Registro I-94 | Shows class "DT"/"parole" and parole date |
| I-134A | Declaration of Financial Support | Declaración de apoyo financiero | Supporter form for CHNV |
| I-485 | Application to Register Permanent Residence or Adjust Status | Solicitud de residencia permanente (ajuste de estatus) | The green-card application |
| I-765 (c)(9) | EAD, pending adjustment | Permiso de trabajo por ajuste pendiente | Work permit while I-485 pending |
| I-765 (c)(11) | EAD, parole | Permiso de trabajo por parole | Work permit tied to parole; revoked 2025-06-12 for CHNV |
| I-131 | Advance parole / travel document | Permiso de viaje (advance parole) | Travel while pending |
| I-693 | Medical exam | Examen médico | Must be filed with I-485 |
| I-797C | Receipt notice | Aviso de recibo | Proof of filing; receipt number |
| ASC / biometrics | Application Support Center | Centro de biométricos / cita de huellas | Fingerprints, photo |
| RFE | Request for Evidence | Solicitud de evidencia adicional | |
| NOID | Notice of Intent to Deny | Aviso de intención de negar | |
| NTA | Notice to Appear | Notificación de comparecencia | Starts removal proceedings |
| I-220A | Order of Release on Recognizance | Orden de liberación bajo palabra (I-220A) | Not parole; CAA-ineligible |
| EWI | Entry without inspection | Entrada sin inspección | CAA-ineligible |
| LPR | Lawful permanent resident | Residente permanente legal | Green-card holder |
| Rollback | Rollback of residence date | Retroactividad de la fecha de residencia | Up to 30 months earlier |
| CU6 / CU7 | Class of admission codes | Códigos de clase de admisión | Principal / derivative CAA |
| Hold / freeze | Adjudication hold | Congelamiento / pausa de adjudicación | R1 (parolees) and R3 (countries) |
| Hold-and-review | Country hold and re-review | Pausa y re-revisión por país | PM-602-0192/0194 |
| Vacatur | Court vacates a policy | Anulación judicial | Dorcas 2026-06-05 |
| PI | Preliminary injunction | Medida cautelar / orden preliminar | Red Eagle 2026-08-24 |
| Class member | Member of a certified class | Miembro de la clase certificada | Red Eagle class |
| Processing time (80%) | Time within which 80% of cases completed | Tiempo de procesamiento (80 %) | USCIS tool figure |
| Case-inquiry date | Receipt date before which an e-Request is allowed | Fecha para consulta de caso | From tool `service_request_date` |
| Mandamus | Writ of mandamus / delay suit | Demanda por demora (mandamus) | Lawsuit to compel decision |
| Field office | USCIS field office | Oficina local de USCIS | Interview location |
| NBC | National Benefits Center | Centro Nacional de Beneficios | Pre-processing |
| Lockbox | USCIS Lockbox | Lockbox (centro de recepción) | Intake |
| Public charge | Public charge ground | Carga pública | CAA exempt |
| Adjudicable days | Days not inside a hold | Días adjudicables | Estimator input |
| Regime | Policy regime (R0–R4) | Régimen de política | Estimator stratum |
