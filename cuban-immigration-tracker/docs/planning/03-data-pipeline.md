# 03 — Data pipeline (final)

Written 2026-10-20.

- **Code:** `cuban-immigration-tracker/packages/ingestion` (Node 22 + TypeScript, run with `tsx`).
- **Contract:** `packages/data-schemas`.
- **Fitting:** `packages/estimator`.
- **Workflows:** at the **repository root**, `/.github/workflows/` of `luisitin/Documents`. GitHub reads workflows only there [T]. The current root holds only `blank.yml`.

Every source below is one the research verified, with the file and section cited. Anything not executed from a runner is marked **probe: plan only** and has a fallback. The `doc 13 §12` probe has **never been executed** (research README §2.5). Running it is WP0.

## 1. Principles

1. **Raw archive before parse.** Every fetched USCIS file (public domain, doc 04 §0) is written to `data/raw/<sourceId>/<period>/<file>`, with a `.meta.json` holding the URL, status, headers, sha256, retrieval time and `via`. It is committed **only when its sha256 is new**. Parsers are pure functions of the raw bytes, so any published number can be regenerated from git. The jzebedee SQLite is **not** stored, because it has no LICENSE (doc 13 §1.6); only derived rows plus attribution are kept.
2. **Each source is independent.** A blocked or failing source keeps its previous output and carries forward its **original** `retrievedAt`, so staleness banners stay truthful. The job never fails because a site blocks us. It fails only on programming errors.
3. **One contract.** Parsers emit types from `packages/data-schemas`. The same zod schemas validate on the device.
4. **No silent re-tuning.** Parameter and weight changes are written to `params.weightLedger`. From v1.1, forecasts are appended to `data/forecasts/`.

## 2. Sources

### 2.1 Common HTTP policy (`packages/ingestion/src/http.ts`; doc 13 §12.3, key facts §8)

- **Headers for every government host:**
  - Browser `User-Agent`: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36`.
  - `Accept` set per endpoint.
  - `Accept-Language: en-US,en;q=0.9`.
  - `Referer` set to the host landing page.
- **Pacing:** 30 s timeout. In refresh mode, 1 retry with 2 s backoff; in probe mode, 0 retries. At most one request at a time per host, with a gap of at least 1 s.
- **Classification:** each response is classified as `ok | not_modified | not_yet (404 on a predicted name) | blocked_cloudflare | blocked_drupal_antibot | http_error | network_error | schema_mismatch | skipped_no_secret`.
  - `blocked_cloudflare`: 403/503 **and** either a `cf-mitigated` header or a body containing `Just a moment...`, `Attention Required! | Cloudflare` or `Sorry, you have been blocked`.
  - `blocked_drupal_antibot`: 403 on `www.uscis.gov` without those markers. Retry once with a different UA.
- **Conditional requests:** `If-None-Match` / `If-Modified-Since` where the host supports them.

### 2.2 Source table

| # | Key | Exact URL pattern (research) | Parser (`src/sources/*.ts`) | Publisher cadence | Output | Failure handling |
|---|---|---|---|---|---|---|
| P1 | `uscis.monthly_csv` (**Must**) | `https://www.uscis.gov/sites/default/files/document/data/appropriation_requirement_<month>_<year>_v1.0.csv` (lowercase English month; latest `august_2026`; next `september_2026`) — doc 04 §1.1, doc 13 §3.2. Discovery: (a) portal index `https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data`, regex `appropriation_requirement` case-insensitive incl. space-encoded `…%20<year>.csv`; (b) HEAD constructed names for latest+1 and latest+2. Backfill-only legacy forms: `…/document/reports/Appropriation_Requirement_<Month>%20<YYYY>.csv`, `…/document/resource-information-center-queries/Appropriation_Requirement_<Month>_<YYYY>.csv` | `monthlyCsv.ts` — see §3.1 | Monthly, 4–8 weeks lag; Sep 2026 not out on 2026-10-20 [S/F] | `national.json.rows` (append/replace by `ym`), `.i765National` | Fallback `https://raw.githubusercontent.com/omairqazi29/visualizer/master/data/USCIS_I485/monthly_<month>_<year>.csv` (doc 04 §1.0; August 2026 copy fetched today by data-rigor: 3,629 B, sha256 `74aa7bce…6d8c`, BOM, CRLF [F]). Fixture gate Q2 |
| P2 | `uscis.quarterly_all_forms` (**Must**) | `https://www.uscis.gov/sites/default/files/document/data/quarterly_all_forms_fy<YYYY>_q<N>_v1.xlsx` (latest `fy2026_q3`, 785,620 B; Q4 ≈ early Dec 2026) — doc 04 §1.2, doc 13 §3.2–3.3; HEAD next quarter each run | `quarterlyAllForms.ts` (exceljs) — §3.2 | Quarterly, ~10 weeks lag | `quarterly.json.rows`, `.approvalBaselines` | Mirror `…/omairqazi29/visualizer/master/data/USCIS_I485/quarterly_all_forms_fy<YYYY>_q<N>_v1.xlsx`; Q8 sha equality when both fetched |
| P3 | `uscis.i485_by_office` (**Must**) | **href from the portal index only** (stem changed 4× in two years: `i485_performancedata_fy2025_q3.xlsx` → `i485_performance_fy2025_q4.xlsx` → `i485_performance_fy2026_q1.xlsx` → `i485_performance_data_fy2026_q2_v1.xlsx`; latest `…/document/data/i485_performance_data_fy2026_q3_v1.xlsx`) — doc 04 §1.3, doc 13 §3.2; constructed name only as a guess | `i485ByOffice.ts` — §3.3 | Quarterly | `offices.json.quarterly`, `.offices`, `.stateOffices`; `params.officeMultipliers` | Mirror (same file names in `USCIS_I485/`); fixture Hialeah FY26 Q3 humanitarian pending 37,486 |
| P4 | `mirror.jzebedee` processing times (**Must**) | `GET https://api.github.com/repos/jzebedee/uscis/releases/latest` (Bearer `GITHUB_TOKEN`) → take `assets[].browser_download_url` ending `.db` (name expected `<YYYY-MM-DD>.db`, **[I]**, never constructed) — doc 13 §1.6, doc 04 §2.3 | `processingTimes.ts` (sql.js) — §3.4 | Daily; builds `30 4 * * *` UTC | `offices.json.processingTimes`, `.inquiryDateHistory`; office codes | Release not dated today → keep previous; the 18:17 run retries. Licence: derived fields + attribution only; week-0 issue asks permission. If no dates at all: UI says "fecha de consulta no disponible (fuente, fecha)" and makes **no gate decision** |
| P5 | `uscis.pt_tool` direct | `https://egov.uscis.gov/processing-times/api/processingtime/I-485/<OFFICE>/131A-FAM` and `POST https://egov.uscis.gov/processing-times` (`Next-Action`) — doc 13 §1.1–1.2 | probe only | — | — | Expected `blocked_cloudflare` from cloud IPs (doc 13 §1.2). **Never on the critical path** |
| P6 | `uscis.historic_pt` | `https://egov.uscis.gov/processing-times/historic-pt` — doc 13 §1.5 | curated `data/curated/historic_medians.json` | annual + in-year | `quarterly.json.historicMedians` | Cloudflare-gated; values [S-sec] via press (3.3 / 4.6 / 7.0 / 11.8 @2026-07-31, 12.3 @2026-08-30) |
| P7 | `fr.api` (Should) | `https://www.federalregister.gov/api/v1/documents.json?conditions[term]=(Cuban OR Cubans OR "Cuban Adjustment Act" OR parole OR parolees OR CHNV)&conditions[agencies][]=homeland-security-department&conditions[agencies][]=u-s-citizenship-and-immigration-services&conditions[agencies][]=u-s-customs-and-border-protection&conditions[publication_date][gte]=<last run date>&order=newest&per_page=100` — doc 13 §6 | `federalRegister.ts` | daily ~6am ET | `candidates/alert-candidates.json` | keyless; fixture query must find `2025-05128`; failure → skip with status |
| P8 | `uscis.rss` (Should) | `https://www.uscis.gov/news/rss-feed/22984` (alerts), `https://www.uscis.gov/news/rss-feed/23269` (news releases) — doc 13 §9 | `uscisRss.ts` (fast-xml-parser): keyword filter Cuba · Cuban · CAA · parole · hold · pause · adjudication · PM-602 · PA-20 | event-driven | candidates | browser UA; 403 → skip |
| P9 | `courtlistener.v4` (Should; token) | `GET https://www.courtlistener.com/api/rest/v4/docket-entries/?docket=<id>&order_by=-date_filed` with `Authorization: Token <COURTLISTENER_TOKEN>` for ids 73477958 (*Dorcas* 1st Cir. 26-1703), 73380879 (*Red Eagle*), 74919678 (*AAUP v. Mullin*), 71085922 (*Doe v. DHS*), 69695790 (*Doe v. Mullin*) — key facts §8, doc 13 §7 | `courtListener.ts` | real time | candidates (keyed on **docket number**, never caption) | ≤ 5 requests per run (limits 5/min, 50/h, 125/day); no secret → `skipped_no_secret` |
| C1 | curated inputs (**Must**) | `data/curated/policy.json`, `data/curated/alerts/*.json`, `data/curated/content.json`, `data/curated/historic_medians.json` | `curated.ts` (strict zod) | on merged PR | `policy.json`, `alerts.json`, `content.json` | invalid curated JSON fails **CI on the PR**, never the cron |

**Deliberately not ingested in the MVP:**
- OHSS monthly tables and the Yearbook (doc 13 §4). The cohort constants are curated in `policy.cohort`.
- CBP pages (the series ended in Jan 2025).
- Census ACS.
- Torch (sandbox data is canned).
- CSOL / myUSCIS (Cloudflare, ToS).
- The Apify `processingTimes.json` claim.

All of these are listed in `06-roadmap.md` for v2 consideration.

## 3. Parser specifications

### 3.1 Monthly CSV (`parseMonthlyCsv(bytes): { month: YearMonth; queried?: string; cuban: MonthlyRow; i765: I765NationalRow; footnotes: string[] }`)

1. Decode UTF-8, strip a leading BOM, and split on `\r?\n`. CRLF has been seen [F].
2. Find the title line that matches `/For the Month of ([A-Za-z]+) (\d{4})/` and map it to `ym`.
3. The header line must equal `Form Number,Description,Forms Received,Approvals,Denials,Pending,Pending Over 6 Months,Avg. Processing Time`, after trimming and collapsing whitespace. Otherwise the result is `schema_mismatch`.
4. Parse the CSV with `csv-parse` (quotes, quoted thousands such as `"355,520"`, and a trailing comma as in the Feb 2026 file [F]).
5. **Cuban row:** `Form Number == "I-485"` **and** `Description` ends with `(Cuban)`. Verified today: the Form Number column is just `I-485` and the Description reads `Application to Register Permanent Residence or Adjust Status (Cuban)` [F].
6. **I-765 row:** the single `I-765` line, all categories. Mar–Apr 2025 rows get `caveat: 'cxi_status_flips_2025_03_04'` (footnote 12).
7. Numbers: remove `,` and parse. Empty values → `null`.
8. Source line: `/queried (\w+ \d{4})/`.
9. **Fixture (Q2):** the August 2026 file must parse to `1213 / 386 / 434 / 355520 / 345741 / 20.6`.

### 3.2 Quarterly all-forms XLSX (`parseAllForms(bytes)`)

1. The workbook has one sheet matching `/^FY\d{2}Q[1-4]_All_Forms$/` (for example `FY26Q3_All_Forms`, A1:M122 [F]).
2. Read the period from the title "… — April 1, 2026 – June 30, 2026" and map it to an FY quarter.
3. Find rows by text: column A or B contains `I-485` and `Cuban`. Rows `I-765` + `Adjustment Of Status`, `I-765` + `All Other`, `I-485` + `Refugee`, `I-485` + `Asylum`.
4. There are 13 columns, in this order: category/form, title, quarter received, approved, denied, completions, pending, processing time (**median**), FYTD received, approved, denied, completions, pending (doc 04 §1.2).
5. **Fixture (Q2):** FY26 Q3 Cuban = `6279 / 139 / 447 / 586 / 342360 / 16.3`.
6. Compute `approvalBaselines`:
   - Each quarter's approved/completions.
   - FYTD.
   - Monthly Jul/Aug 2026 (308/626, 386/820) from P1.

### 3.3 I-485 by field office XLSX (`parseByOffice(bytes)`)

1. Sheet `I485_by_State` (A1:V178 [F]).
2. Rows: a **state heading** (a single-cell text row matching a state name), then office rows `Office name | Field Office Code | 4 blocks × (Received, Approved, Denied, Pending) | Total block`. Then a "Service Center" block.
3. Use the **third block = Humanitarian-based** (= Cuban + Refugee + Asylee exactly, doc 04 §1.3 [F]). A cell `D` → `suppressed: true`, value `null`.
4. Build `offices[]` (code, name, state) and `stateOffices[state] = codes[]`. This is the verified state → office mapping used by the state mixture.
5. **Q7:** the national humanitarian total must equal Cuban + Refugee + Asylum from P2, to the unit. Otherwise `warn`.
6. **Fixture:** Hialeah FY26 Q3 humanitarian pending `37486`.

### 3.4 jzebedee SQLite (`readProcessingTimes(dbBytes)`)

1. Open with `sql.js` (wasm, no native build).
2. Query `SELECT form_name, office_code, form_subtype, publication_date, range_upper, range_upper_unit, range_lower, range_lower_unit, service_request_date FROM processing_time WHERE (form_name='I-485' AND form_subtype='131A-FAM') OR (form_name='I-765' AND form_subtype IN ('147-C9','147-C11'))`. The schema is in doc 13 §1.2 (README v0.5).
3. Also read `offices(code, description)` and `form_types WHERE form_name='I-485'`.
4. `months80 = range_upper` when the unit is "Months". If the unit is "Weeks", divide by 4.345. Accept a missing `range_lower`.
5. Dates: accept `Mon DD YYYY` and `Month D, YYYY`; store ISO.
6. **Q10:** any I-485 `form_key` outside `["131A","131A-FAM","131A-HRIFA","131B","131C","131T","131U"]` → candidate alert `CAA_SUBTYPE_PRESENT`.
7. **Fixture:** `131A-FAM` MIA inquiry date `2023-06-17`, HIA `2024-07-05`, KND `2024-05-28`, TAM `2024-08-07`; `147-C9` NBC `2025-06-13` (doc 04 §2.4 [F]).
8. Append to `inquiryDateHistory` when `publicationDate` is new. Seed it with the 2024-10-18 values from doc 04 §2.4, used for the crude ETA in doc 15 §2.2.

### 3.5 Fitting (calls `packages/estimator`)

When a new monthly row arrives:
1. `fitBeta(rows)` (`04` §3.2).
2. `fitObservationSigma(rows)` (`04` §6.2).
3. `scenarioWeights()` with the new observation, appending a `likelihood` entry to the weight ledger.

When a new quarter arrives:
- `officeMultipliers(lastTwoQuarters, group)`, using approvals **and denials** once both are parsed. MVP default: `basis: 'approvals'`, to match doc 08 §7.3 and T6. A switch to `approvals_and_denials` needs a regenerated golden file.

Every run:
- `estimate(T15)` → `manifest.canary`.

## 4. QA gates (fail = do not publish that source's new output; warn = publish with a note)

| Id | Check | Level |
|---|---|---|
| Q1 | zod valid; counts ≥ 0; dates not in the future; `pendingOver6 ≤ pending` | fail |
| Q2 | Golden fixtures re-parse exactly (Aug 2026 monthly row; FY26 Q3 Cuban row; Hialeah 37,486; MIA/NBC inquiry dates) | fail |
| Q3 | Month continuity (new month = last + 1); a past month's values change only if the source sha changed → `revision` recorded and shown | fail on gap; warn on revision |
| Q4 | Flow identity: `|pending_t − (pending_{t−1} + received − approved − denied)| / pending_t` (historic residual ≤ 2.3 %, doc 08 §5.3) | warn > 3 %, fail > 10 % |
| Q5 | Monthly vs quarterly flows: Σ of the 3 months vs the quarter for received/approved/denied | warn > 0.5 % |
| Q6 | Monthly vs workbook pending gap (observed 3–4 %) | warn outside 1–6 % (shown as a data note) |
| Q7 | Humanitarian national total = Cuban + Refugee + Asylum | warn |
| Q8 | Mirror sha256 = direct sha256 when both were fetched | **fail** (possible tampering) |
| Q9 | Processing times: range length 1–2; dates parseable; publication date not older than the previous one | warn |
| Q10 | I-485 subtype list ⊆ the 7 known keys | warn + `CAA_SUBTYPE_PRESENT` candidate |
| Q11 | Pending within ±25 % of the previous month | fail |
| Q12 | Reference-case canary: P(≤12) moved > 2 points without a new month or quarter | warn (human review) |

**On fail:**
1. Write the attempt to `data/quarantine/<runId>/` (raw + `qa-report.json`).
2. Keep that source's last good output.
3. Set `manifest.qa.status = 'quarantined'` (or `degraded` for warn-only), with `Localized` notes.
4. The `notify` job opens or updates **one** issue titled "Data QA: <check> (<source>)".

Quarantine directories older than 30 days are pruned by the job.

## 5. Output files

The schemas are in `02-data-model.md` §2. All JSON is written with stable key order, 2-space indent and a trailing newline, so diffs are clean and sha256 values are deterministic.

## 6. Workflows

### 6.1 `/.github/workflows/caa-data-refresh.yml`

```yaml
name: caa-data-refresh
on:
  schedule:                                   # runs ONLY on the default branch (main) [T]; off the hour (doc 09 §5.2)
    - cron: "17 6 * * *"
    - cron: "17 18 * * *"
  workflow_dispatch:                          # manual; needs this file on main first [S-sec], then `gh workflow run … --ref <branch>`
    inputs:
      only:    { description: "comma list of source keys (blank = all)", required: false, default: "" }
      dry_run: { description: "parse + QA, do not commit", type: boolean, default: false }
  push:                                       # fallback for claude/** before the file reaches main; bot commits touch data/** (not matched)
    branches: ["claude/**"]
    paths:
      - "cuban-immigration-tracker/packages/ingestion/**"
      - "cuban-immigration-tracker/packages/data-schemas/**"
      - "cuban-immigration-tracker/packages/estimator/**"
      - "cuban-immigration-tracker/data/curated/**"
      - ".github/workflows/caa-data-refresh.yml"
permissions: {}                               # nothing at workflow level
concurrency: { group: "caa-data-refresh-${{ github.ref }}", cancel-in-progress: false }
defaults: { run: { working-directory: cuban-immigration-tracker } }
jobs:
  refresh:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    permissions: { contents: write }          # least privilege: commit data/** only
    outputs:
      committed:   ${{ steps.ingest.outputs.committed }}
      new_month:   ${{ steps.ingest.outputs.new_month }}
      new_quarter: ${{ steps.ingest.outputs.new_quarter }}
      qa_status:   ${{ steps.ingest.outputs.qa_status }}
      alerts_changed: ${{ steps.ingest.outputs.alerts_changed }}
    steps:
      - uses: actions/checkout@<SHA of v7.0.1>             # pin by SHA (doc 09 §5.3)
        with: { ref: "${{ github.ref_name }}", fetch-depth: 1 }
      - id: present                                        # workflow-only PR on main: code not there yet → no-op
        working-directory: .
        run: |
          if [ -f cuban-immigration-tracker/package.json ]; then echo "ok=true" >> "$GITHUB_OUTPUT"; else echo "code not on this ref yet"; echo "ok=false" >> "$GITHUB_OUTPUT"; fi
      # every following step carries:  if: ${{ steps.present.outputs.ok == 'true' }}  (omitted below for brevity)
      - uses: actions/setup-node@<SHA of v7.1.0>
        with: { node-version: "22.13", cache: npm, cache-dependency-path: cuban-immigration-tracker/package-lock.json }
      - run: npm ci --ignore-scripts                       # root tooling package (no install scripts needed for ingestion)
      - id: ingest
        env:
          GITHUB_TOKEN: ${{ github.token }}                # api.github.com release lookup (read-only use)
          COURTLISTENER_TOKEN: ${{ secrets.COURTLISTENER_TOKEN }}   # optional → skipped_no_secret
        run: >
          npx tsx --tsconfig packages/ingestion/tsconfig.json packages/ingestion/src/cli.ts refresh
          --out data --only "${{ inputs.only }}" --github-output "$GITHUB_OUTPUT"
      - name: Commit (content changed or 7-day heartbeat), data/** only
        if: ${{ !inputs.dry_run && steps.ingest.outputs.should_commit == 'true' }}
        run: |
          git config user.name "caa-data-bot"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add data/
          git reset -q -- data/curated                     # bot never commits curated inputs
          git diff --cached --quiet && { echo "nothing staged"; exit 0; }
          git commit -m "data: ${{ steps.ingest.outputs.summary }} [skip ci]"
          for i in 1 2 3; do
            git pull --rebase origin "${{ github.ref_name }}" && git push origin "HEAD:${{ github.ref_name }}" && exit 0
            sleep $((i*10))
          done
          exit 1
  notify:
    needs: refresh
    if: ${{ always() && (needs.refresh.result == 'failure' || needs.refresh.outputs.qa_status != 'ok' || needs.refresh.outputs.new_month == 'true' || needs.refresh.outputs.new_quarter == 'true' || needs.refresh.outputs.alerts_changed == 'true') }}
    runs-on: ubuntu-latest
    permissions: { issues: write }                         # separate job, separate least privilege; no contents access
    steps:
      - env:
          GH_TOKEN: ${{ github.token }}
          REPO: ${{ github.repository }}
          QA: ${{ needs.refresh.outputs.qa_status }}
          RESULT: ${{ needs.refresh.result }}
          NEWM: ${{ needs.refresh.outputs.new_month }}
          NEWQ: ${{ needs.refresh.outputs.new_quarter }}
          ALERTS: ${{ needs.refresh.outputs.alerts_changed }}
        run: |
          upsert() {  # one open issue per title; comment if it exists
            n=$(gh issue list -R "$REPO" --state open --search "\"$1\" in:title" --json number -q '.[0].number')
            if [ -n "$n" ]; then gh issue comment "$n" -R "$REPO" --body "$2"; else gh issue create -R "$REPO" --title "$1" --body "$2"; fi; }
          RUN="$GITHUB_SERVER_URL/$REPO/actions/runs/$GITHUB_RUN_ID"
          [ "$RESULT" = "failure" ] && upsert "CAA data job failed" "Run: $RUN"
          [ "$QA" != "ok" ] && [ -n "$QA" ] && upsert "CAA data QA: $QA" "Run: $RUN — see data/quarantine/"
          if [ "$NEWM" = "true" ] || [ "$NEWQ" = "true" ] || [ "$ALERTS" = "true" ]; then
            upsert "Republish CAA Tracker artifact" "New data (month=$NEWM quarter=$NEWQ alerts=$ALERTS). Follow docs/planning/03-data-pipeline.md §9. Run: $RUN"
          fi
```

Notes:
- `cli.ts refresh` writes `should_commit=true` only when (a) a data file's content sha changed, which also sets `dataChangedAt = now`, or (b) the committed `manifest.lastCheckedAt` is older than 7 days (heartbeat).
- This keeps the 60-day scheduled-workflow rule satisfied (doc 09 §5.1) with roughly 52 heartbeats plus about 30–60 real changes a year, instead of 730 commits.
- `lastCheckedAt` is written only in commits. The app's "pipeline late" banner therefore triggers at 10 days.
- `[skip ci]` keeps the CI workflow from running on bot commits.
- The `push` trigger's path filter excludes the `data/**` files the bot writes, so there is no loop.
- The default `GITHUB_TOKEN` is used both to push (`contents: write`) and to open issues (`issues: write`, separate job). No PAT is needed, no PR creation is needed, so there is no dependency on the "Allow Actions to create pull requests" setting.

### 6.2 Feature-branch vs default-branch sequence (must-fix; exact order)

1. **WP0, on `claude/cuban-immigration-tracker-b6y4b1`:** add `caa-data-refresh.yml` and the ingestion skeleton. The push trigger on `claude/**` runs it on the branch and commits snapshots to the branch.
2. **WP0, owner action:** merge a **workflow-only PR** to `main` that contains `caa-data-refresh.yml`, `caa-ci.yml` and `caa-probe.yml`, so that `schedule` and `workflow_dispatch` exist (`main` is the default branch [V]).
   - Until the full code reaches `main`, a schedule run on `main` finds no `cuban-immigration-tracker/package.json` there.
   - The `present` step in §6.1 guards this case: when the code is missing, the run is a green no-op.
3. **After step 2:** manual runs on the feature branch use `gh workflow run caa-data-refresh.yml --ref claude/cuban-immigration-tracker-b6y4b1`. This needs a token with `repo` and `workflow` scopes, from the owner's gh login [S-sec].
4. **When the app merges to `main`:** scheduled runs commit to `main`, which becomes the **data branch of record**.
   - Store builds read `extra.data.ref = "main"`.
   - Preview builds read the feature branch.
   - The artifact reads whatever was copied at build time; `manifest.generatedBy.ref` records the branch.

### 6.3 `/.github/workflows/caa-ci.yml` (PRs and pushes touching `cuban-immigration-tracker/**`; `permissions: { contents: read }`)

The workflow has three jobs.

**`tools`** (root):
- `npm ci`
- `npx tsc -p tsconfig.json`
- `npx vitest run` (packages/*)
- `python3 -I tools/oracle/vph1.py --check packages/estimator/golden/vph1.golden.json`, which is the oracle cross-check (`04` §9)
- `npm run schema:export -- --check`, which fails on JSON Schema drift
- `npm run data:validate`, which validates `data/` and `data/curated/` with strict zod
- `node scripts/check-i18n.mjs`

**`app`:**
- `cd app && npm ci`
- `npx expo install --check`
- `npx expo lint`
- `npx tsc --noEmit`
- `npx jest --ci`

**`web`** (needs `app`):
- `cd app && npx expo export --platform web --output-dir dist`
- `node ../scripts/build-artifact.mjs --dist dist --data ../data --out ../web-artifact`
- `node ../scripts/prove-artifact.mjs --dir ../web-artifact`, using `@sparticuz/chromium` + `puppeteer-core` from npm (`07` §9).
- Upload `web-artifact/` and the screenshots as a workflow artifact.

### 6.4 `/.github/workflows/caa-probe.yml` (doc 13 §12.6 adapted)

- **Triggers:** `workflow_dispatch` (input `commit: boolean`) and `schedule: "17 13 * * 1"` (weekly).
- **`probe` job** (`contents: read`):
  - Runs `cli.ts probe --report-dir probe-out` over every doc 13 §12.4 probe whose secret exists.
  - Uploads `probe-out/` as a workflow artifact.
- **`commit-samples` job** (only when dispatched with `commit: true`; `contents: write`):
  - Downloads the artifact.
  - Commits `data/samples/PROBE-REPORT.md` and the small samples. The total is capped at 25 MB, and binaries go in `.gitattributes`.
- The **first manual run is WP0's acceptance**: it turns every "plan only" row into a classification.

### 6.5 `/.github/workflows/caa-staleness.yml`

- **Trigger:** `schedule: "41 7 * * 1"` plus dispatch.
- Checks out `main` (`contents: read`) and reads `cuban-immigration-tracker/data/manifest.json`.
- If `lastCheckedAt` is more than 8 days old, or the latest official month is more than 75 days past its month end, a second job with `issues: write` upserts the issue "CAA data stale".

## 7. Versioning and publishing

- **Schema:** `manifest.schemaVersion` is an integer. It is bumped only on breaking changes; additive fields are allowed under passthrough parsing. `minAppVersion` is bumped with it. Older apps keep their old data and show "Actualice la app".
- **Data history:** git history of `cuban-immigration-tracker/data/` is the version log. Each commit message summarizes which sources changed. When a new official month lands, the job also creates a lightweight tag `caa-data-<YYYY-MM>`, covered by `contents: write`.
- **Immutability:** published files are overwritten in place, and history lives in git. `forecasts/<YYYY-MM>.json` (v1.1) is **append-only**. CI fails if an existing forecast file is modified.
- **Native read URL:** `${baseUrl}/${ref}/cuban-immigration-tracker/data/<file>`, with `baseUrl = https://raw.githubusercontent.com/luisitin/Documents` and `ref = main` (store) or the branch (preview).
- **Artifact:** `build-artifact.mjs` copies the manifest plus the 7 data files into `web-artifact/data/`, adds `artifactBuiltAt`, and recomputes the sha256 values.

## 8. Local developer commands (root `package.json` scripts)

| Command | What it does |
|---|---|
| `npm run data:refresh` | `tsx … cli.ts refresh --out data` (same code as CI; uses network) |
| `npm run data:fixtures` | Download the mirror copies listed in §2 into `packages/ingestion/test/fixtures/` (raw.githubusercontent.com is reachable here) |
| `npm run data:sample` | Freeze `data/*.json` into `app/src/data/sample/` |
| `npm run data:validate` | Validate `data/` and `curated/` with strict zod |
| `npm run probe` | Run the doc 13 §12 probes locally |
| `npm run build:artifact` | Run the app web export, then `scripts/build-artifact.mjs` |
| `npm run prove` | Run `scripts/prove-artifact.mjs` |

## 9. Artifact republish runbook (who / when / how — must-fix)

**When:** the `notify` job has opened or updated the issue "Republish CAA Tracker artifact". That happens on a new official month or quarter, or a merged alert. Republish at least once every 30 days anyway, so the 35-day "artifact old" banner never shows.

**Who:** the owner, or an agent session asked to do it.

**How:**
1. `git pull` on the data branch (`main`).
2. `npm ci && (cd app && npm ci)`.
3. `npm run build:artifact && npm run prove`. Both must pass.
4. Publish `web-artifact/index.html` as the page, with `files` mapping `data/manifest.json` and `data/*.json`, to the **same artifact URL**. The URL is recorded in `cuban-immigration-tracker/README.md`. Using the same URL keeps the link people shared working.
5. Close the issue with a comment containing the `artifactBuiltAt` and data month.

The badge on the page will read "Publicado {fecha} · datos de USCIS hasta {mes}".
