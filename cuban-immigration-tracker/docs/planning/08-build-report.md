# 08 — Build report (prover, 2026-10-21)

This report covers what was built on `claude/cuban-immigration-tracker-b6y4b1` and how it was
verified. It also lists what is still open. The build plan is
[`07-implementation-plan.md`](07-implementation-plan.md). Every decision and deviation is in
[`adr-log.md`](adr-log.md) (§A, §B), and the owner follow-ups are in its §D.

Tags: **[V]** = run in this container on 2026-10-21 and the result observed; **[O]** = owner or
orchestrator action; **[I]** = inferred, not observed.

---

## 1. Result in one paragraph

All local gates are green [V]:

- root `npm run check`;
- `cd app && npm run check`;
- `npm run build:artifact`: one 2,552,502-byte HTML fragment plus 8 data files;
- `npm run prove`: 641 checks, 0 failures, covering all 14 assertions P1–P14 of 07 §9 in both the
  sample variant and the live variant.

Prove found no web-only failure that needed a fix. The prover changed two things:

- It added an English 390×844 Prove scenario and screenshots of the language toggle, so the
  English screenshot set exists.
- It allowed PNG screenshots in `docs/screenshots/` in the personal-files guard (§7).

These things are not done yet. The container cannot do them, so they belong to the owner or the
orchestrator:

- run the app on a native device;
- get the native Cuban-Spanish review;
- merge the workflows to `main`;
- run the first real data refresh on GitHub's runners;
- publish the artifact.

## 2. What was built

```
/home/user/Documents/                          (git root = github.com/luisitin/Documents)
├── .github/CODEOWNERS                         owner review for workflows, ingestion, estimator, curated data, scripts
├── .github/workflows/
│   ├── caa-ci.yml                             typecheck, lint, tests, golden, i18n, data, app check, web build + Prove (push to the branch, pull_request)
│   ├── caa-data-refresh.yml                   real data fetch on GitHub runners; commits only cuban-immigration-tracker/data/ (schedule, dispatch, .refresh-request push)
│   ├── caa-probe.yml                          endpoint probe; never commits; PROBE-REPORT.md to log, job summary and workflow artifact
│   └── caa-staleness.yml                      weekly staleness check of the published manifest
└── cuban-immigration-tracker/
    ├── app/                                   Expo SDK 58 app (iOS, Android, web), expo-router, React 19.3, RN 0.88
    │   ├── app.json                           web.output "single"; extra.data = raw GitHub base, ref "main", path
    │   └── src/
    │       ├── app/                           routes: (tabs)/{index, case/*, offices/*, alerts/*, more/*}, welcome, +not-found (redirects to the home tab)
    │       ├── data/                          DataProvider, fetchers (zod + sha256), snapshot (live → cached → bundled sample), baseUrl(.web), hostRefresh(.web, disabled), useEstimate
    │       │   └── sample/                    bundled snapshot G1 (USCIS data through 2026-08), labelled "Muestra" / "Sample"
    │       ├── features/home                  Home: first-launch language choice, monthly I-485 (Cuban) figures and chart, alerts banner
    │       ├── features/case                  My case: form (no names; only the 3-letter receipt prefix is kept), estimate, clock, peers, EAD, remedies, ineligible, share
    │       ├── features/offices               office list by state and office detail (quarterly I-485 by office, processing times)
    │       ├── features/alerts                policy, court and data alerts; read state; litigation table
    │       ├── features/more                  method, glossary, myths, privacy, about, settings (language, notifications, delete my data)
    │       ├── features/welcome               welcome content (native modal; on web it is inline on Home, adr A15)
    │       ├── i18n/                          i18next instance, useLang (device-locale default, persisted choice)
    │       ├── notifications/                 local notifications only; expo-notifications is lazy-loaded on native; index.web.ts is a no-op
    │       ├── platform/                      clipboard, openUrl, share with web variants; RouteErrorBoundary
    │       ├── storage/                       one KV store: AsyncStorage on native, try/catch-wrapped localStorage plus an in-memory mirror on web
    │       └── ui/                            theme tokens, useThemeName(.web: data-theme + MutationObserver), components, react-native-svg charts and icons, AppHeader + LangToggle + DataStatusChip
    ├── packages/
    │   ├── data-schemas/                      zod contract v1 for every data file and the device case (no full receipt field)
    │   ├── estimator/                         VPH-1.1 estimator: ranges, scenario bands, golden file vph1.golden.json
    │   ├── case-rules/                        hold clock (the 2025–2026 holds, vacated under the APA), flags, peers, EAD, remedies, share text
    │   ├── i18n-core/                         es/en locales (28 files, 2,036 strings), deterministic fmt (dates, numbers, percents), STYLE-GUIDE.md
    │   └── ingestion/                         sources (USCIS monthly CSV, quarterly, I-485 by office, processing times, Federal Register, RSS, CourtListener, curated), QA, publish, probe, CLI
    ├── data/                                  published snapshots + manifest; curated/ (human-reviewed alerts, policy, content); raw/ (archived USCIS source files); schema/ (JSON Schema export); samples/PROBE-REPORT.md
    ├── scripts/
    │   ├── build-artifact.mjs                 expo export → one HTML fragment (inline JS and CSS, data-URI assets, prelude with path guard and data base) + web-artifact/data/
    │   ├── prove-artifact.mjs                 07 §9 P1–P14 in headless Chromium under the host CSP, sample and live variants
    │   ├── check-i18n.mjs                     key parity, register guard, banned wording, interpolation checks
    │   ├── check-no-personal-files.mjs        blocks personal documents and full receipt numbers
    │   ├── export-sample.mjs, export-schema.mjs   bundled-sample export; JSON Schema export
    ├── tools/oracle/                          independent Python oracle that regenerates and checks the estimator golden values
    ├── test/                                  root foundation, workflow and integration tests
    └── docs/
        ├── research/                          background research (facts, sources, endpoints)
        ├── planning/                          00–07 plan, adr-log.md, this report
        └── screenshots/                       Prove screenshots at 390×844 (es and en)
```

Generated and git-ignored (not committed): `web-artifact/` (the fragment and its data),
`prove-out/` (Prove report and screenshots), `probe-out/`, `app/dist/`.

## 3. Commands and results

Run from `/home/user/Documents/cuban-immigration-tracker`, one at a time (4 CPUs), on 2026-10-21.

| Command | Result [V] |
|---|---|
| `npm run build:artifact` | Runs `npx expo export --platform web` in `app/` with `EXPO_OFFLINE=1`: 1,134 modules, one 2.5 MB web bundle, 18 expo-router PNG assets. Output `{"bytes":2552502,"inlinedAssets":12,"inlinedAssetBytes":17981,"routes":20,"dataFiles":8,"latestOfficialMonth":"2026-08"}`. About 4 s with a warm Metro cache |
| `npm run prove` | Browser: HeadlessChrome/153.0.8010.0 via `@sparticuz/chromium` + `puppeteer-core`. Both variants, 5 scenarios each (phone es, phone-en, desktop, storage-throws, history-throws). **641 passed, 0 failed**, about 40 s. Report: `prove-out/report.json` |
| `npm run check` (root) | exit 0, about 27 s. Steps: `tsc`; eslint; vitest **31 files, 477 passed, 1 skipped**; `golden:check` "matches the oracle (tol 1e-6); 172 doc values verified"; `i18n:check` "28 locale files, 2036 strings, 15 curated files, 213 Localized values; 0 error(s), 0 warning(s)"; `data:validate` OK; `personal:check` "640 file(s) scanned; 0 violation(s), 4 warning(s)" (the four pre-existing owner PDFs, adr D1) |
| `cd app && EXPO_OFFLINE=1 npm run check` | exit 0, about 34 s. `expo install --check` "Dependencies are up to date"; `expo lint`; `tsc`; jest **35 suites, 244 tests, 4 snapshots, all passed** |

Prove assertion counts (both variants) [V]:

| ID | Checks | ID | Checks |
|---|---|---|---|
| P1 | 10 | P8 | 111 |
| P2 | 44 | P9 | 2 |
| P3 | 20 | P10 | 2 |
| P4 | 10 | P11 | 16 |
| P5 | 130 | P12 | 82 |
| P6 | 152 | P13 | 10 |
| P7 | 45 | P14 | 6 |

Every one of them passed.

What these cover:

- **Boot.** The fragment boots from `/x/<random>/z/index.html` under the host CSP. The guard sets
  the path to `/`.
- **Requests.** The only requests are the page and `./data/*.json`. There are 0 CSP violations and
  0 console errors.
- **Navigation.** All 5 tabs and one deep screen per tab render, and each back action works.
- **Language.** The header toggle and the Settings control switch tab labels, dates ("20 oct 2026"
  ↔ "Oct 20, 2026"), percents ("9 %" ↔ "9%"), chart axis labels, the status chip and the
  disclaimer at runtime. The choice persists across a reload, or falls back to the device locale
  when `localStorage` throws.
- **Estimator.** The reference example ("Ver un ejemplo", T15) shows 9 % with bands 2 %–26 % and a
  clock of 306 adjudicable days. The example is never written to storage.
- **Theme.** `data-theme` and `prefers-color-scheme` both work.
- **Layout.** At 390 px there is no horizontal scroll. At 1280 px the column is centred and at most
  592 px wide.
- **Blocked browser APIs.** The app makes no alert, confirm, prompt, print or `window.open` call.

## 4. Web artifact

- **Page:** `/home/user/Documents/cuban-immigration-tracker/web-artifact/index.html`. It is an HTML
  fragment of 2,552,502 bytes. It starts with `<title>CAA Tracker</title>` and a `<style>` block,
  then has one `<div id="root">` and exactly one inline `<script>`. It has no doctype, no
  html/head/body tags and no external URL.
- **Supporting files** (publish them next to the page, at these relative paths):
  `data/manifest.json`, `data/national.json`, `data/quarterly.json`, `data/offices.json`,
  `data/policy.json`, `data/alerts.json`, `data/content.json`, `data/params.json`.
- **Status:** not published yet [O] (adr D5). Publish it with 03 §9, always to the same URL, and
  record the URL in the README.

## 5. Screenshots (`docs/screenshots/`, 390×844, PNG, 42–99 KB each)

Each screenshot is taken from the Prove live variant, with the clock fixed at 2026-10-20.

| File | Shows |
|---|---|
| `es-01-home.png` / `en-01-home.png` | Home: first-launch language choice, status chip "Publicado 21 oct 2026 · USCIS hasta ago 2026" |
| `es-02-my-case.png` / `en-02-my-case.png` | My case, empty: "Configurar mi caso" and "Ver un ejemplo" |
| `es-03-estimate-reference-example.png` / `en-03-…` | Estimator result for the synthetic reference example: 9 %, bands 2 %–26 % and 4 %–20 %, probabilities by time frame |
| `es-04-offices.png` / `en-04-offices.png` | Offices by state, processing times and quarterly figures, with "datos débiles" chips |
| `es-05-alerts.png` / `en-05-alerts.png` | Alerts: FY2026 Q3 data alert |
| `es-06-more.png` / `en-06-more.png` | More: method, glossary, myths, privacy, settings |
| `lang-toggle-1-es.png`, `lang-toggle-2-en-after-tap.png` | The header ES \| EN toggle before and after one tap: the whole screen switches |
| `es-home-sample-data.png` | The sample variant: chip "Muestra · USCIS hasta ago 2026" |
| `en-home-dark.png` | Dark theme (`data-theme="dark"`) |

The desktop (1280×800) and failure-mode screenshots are in `prove-out/`, which is regenerated on
every `npm run prove`.

## 6. Expo Go vs a development build

| Feature | Expo Go (SDK 58) | Needs a dev build |
|---|---|---|
| All tabs, the estimator, charts (react-native-svg), the language toggle, storage (AsyncStorage), the data fetch | yes | — |
| Local notifications (the RFE or NOID response-due reminder; opt-in in Settings) | yes: `expo-notifications` is lazy-loaded only after opt-in | — |
| Remote push | not used by this app | (would need a dev build) |
| `expo-localization` `supportedLocales` (iOS per-app language in system Settings), notification icon and colour, app icon and splash fidelity | ignored, harmless | yes |

Source: `expo-sdk58-implementation-notes.md` §6 and §12.

`expo-dev-client` is installed, so `npx expo start` opens in development-build mode. Use
`npx expo start --go`, or press `s` in the CLI, to target Expo Go [I: Expo CLI behaviour, not run
here]. SDK 58 Expo Go must be the version in the stores. Check https://expo.dev/go before relying
on it. Until it is, use an EAS development build or the Expo Go that `npx expo start` installs on
a simulator or emulator (07 §7).

No native device or simulator was available here, so no native run was observed (adr D7).

## 7. Sample data and live data

- **Bundled sample, G1** (`app/src/data/sample/`). This is a frozen copy of the published
  snapshot. It holds real USCIS figures through **August 2026**. They were fetched on 2026-10-20
  through the public GitHub mirror, because USCIS hosts are unreachable from the container (adr
  A14). The app labels it "Muestra" / "Sample". It is the last-resort fallback, and it is not
  refreshed on routine data updates.
- **Published snapshot** (`data/*.json` + `data/manifest.json`). The same files are copied into
  `web-artifact/data/`, and the artifact labels them "Publicado <fecha>". On native, the app
  fetches them from
  `https://raw.githubusercontent.com/luisitin/Documents/main/cuban-immigration-tracker/data/`,
  validates them with zod, checks each sha256 and labels them "En vivo" / "Live". After one
  successful fetch, it caches them and labels them "Guardado" / "Saved". Until the data reaches
  `main`, that URL returns 404, so native shows the sample (adr D8).
- **No fabricated values.** The test fixtures live under `packages/*/test/fixtures` and are
  labelled samples. The curated alerts cite their research sections, and they carry
  `reviewedBy: "pending-native-es-review"`.
- **How GitHub Actions fills in real data:**
  1. `caa-data-refresh.yml` runs on GitHub's runners, which have open internet. It fetches USCIS
     (monthly CSV, quarterly all-forms, I-485 by office, processing times), the Federal Register,
     USCIS RSS and CourtListener (if the optional token is set). Then it runs QA and the T15
     canary, and writes the snapshots.
  2. Its `commit` job has `contents: write` on that job only and uses the default `GITHUB_TOKEN`.
     It commits only under `cuban-immigration-tracker/data/`, and it runs `git pull --rebase`
     before `git push`.
  3. The workflow runs in three cases:
     - on the twice-daily schedule (06:17 and 18:17 UTC, `main` only);
     - on `workflow_dispatch` (any branch);
     - on a push to `claude/cuban-immigration-tracker-b6y4b1` that changes
       `cuban-immigration-tracker/data/.refresh-request`. The orchestrator touches that file once
       after the build (the file does not exist yet).
  4. `caa-probe.yml` produces the real `PROBE-REPORT.md`, which goes to the job summary and a
     workflow artifact. It never commits.
  5. A new official month changes the live chip and the estimate. Prove derives its expected live
     values from the manifest, so a new month does not break CI.

## 8. Changes made in this step (the prover)

| File | Change | Why |
|---|---|---|
| `scripts/prove-artifact.mjs` | Added a `phone-en` scenario (390×844, en-US locale; it repeats P1–P8, P12 and P13 in English). Added `lang-<from>` and `lang-<to>` screenshots around the header toggle. The estimate screenshot now centres the headline | the English screenshot set and the toggle screenshots; more P6 coverage |
| `scripts/check-no-personal-files.mjs` (+ `.d.mts`) | New `SCREENSHOT_DIR`: PNG files directly in `docs/screenshots/` are allowed; everything else there is still blocked | the guard failed on the required screenshots. The screenshots show only the synthetic example and public data |
| `test/integration/check-no-personal-files.vitest.ts` | A unit test for the new rule (allows PNG; rejects PDF, JPG and subfolders) | coverage |

The app source did not change. Native behaviour is unaffected, and `cd app && npm run check` is
still green.

## 9. Known gaps and owner follow-ups (from `adr-log.md` §D)

1. **D1, personal PDFs.** Four personal PDFs are public at the repository root. The owner decides
   whether to move them, purge them or make the repository private. No agent touched them.
2. **D2, licence.** Confirm MIT (code) and CC BY 4.0 (data and content).
3. **D3, workflows on `main`.** Scheduled runs only fire on the default branch. After `main` has
   them:
   - merge the workflows and `CODEOWNERS`;
   - watch one scheduled commit;
   - test the `notify` "Republish" issue;
   - enable branch protection with code-owner review.
4. **D4, first real data run.**
   - The orchestrator touches `data/.refresh-request`.
   - The probe report replaces the sandbox-blocked `data/samples/PROBE-REPORT.md`.
   - The Q8 mirror-vs-direct check becomes real.
5. **D5, publish the artifact.** Then record its URL in the README.
6. **D6, native Cuban-Spanish review.** It covers every `es` string, curated field, notification
   and disclaimer.
7. **D7, native device pass.** Check:
   - all tabs, the reference case and the language toggle;
   - that notifications are rescheduled on a language change;
   - "Borrar mis datos";
   - 200 % font scale and screen-reader labels.
   Record which path was used.
8. **D8.** Native shows the sample until the data is on `main`.
9. **D9.** Ask jzebedee/uscis for republication permission. Optional: the `COURTLISTENER_TOKEN`
   secret and an actionlint sha256 pin.
10. **D10, optional MCP host refresh.** `hostRefresh.web.ts` ships disabled, because the shape of
    the connector's response was never observed.
11. **CI.** CI has not been observed on the branch from here [O].

## 10. Owner steps

### Run the app on a phone (Expo Go)

1. Install Node ≥ 22.13 and git. On the phone, install **Expo Go** from the App Store or Google
   Play, and confirm at https://expo.dev/go that it supports SDK 58.
2. Get the code and start the server:
   ```sh
   git clone https://github.com/luisitin/Documents.git
   cd Documents
   git checkout claude/cuban-immigration-tracker-b6y4b1
   cd cuban-immigration-tracker/app
   npm ci
   npx expo start --go        # or: npx expo start, then press s to switch to Expo Go
   ```
3. Put the phone and the computer on the same Wi-Fi network and scan the QR code: with the Camera
   app on iOS, or from inside Expo Go on Android. If the networks differ, run
   `npx expo start --go --tunnel`.
4. Check the following:
   - The header shows ES | EN, and one tap switches the whole app.
   - Más → Ajustes has the same control.
   - Mi caso → "Ver un ejemplo" shows the reference estimate (about 9 % within 12 months, with a
     range).
   - Until the data is on `main`, the status chip reads "Muestra". To see "En vivo" from the
     branch, temporarily set `app.json` `expo.extra.data.ref` to
     `claude/cuban-immigration-tracker-b6y4b1` and do not commit that change.
5. If SDK 58 Expo Go is not in the stores yet, use a development build:
   `npm i -g eas-cli && eas build:configure && eas build --profile development --platform android`
   (or `ios`). Install the build, then run `npx expo start`.

### Merge and enable the workflows

1. Review the branch and open a PR from `claude/cuban-immigration-tracker-b6y4b1` to `main` (or
   merge at least `.github/workflows/caa-*.yml`, `.github/CODEOWNERS` and
   `cuban-immigration-tracker/`). Merge it after CI is green.
2. In the GitHub repository settings, go to **Actions → General**:
   - allow GitHub Actions;
   - set "Workflow permissions" to **Read repository contents**, because the jobs ask for
     `contents: write` themselves, only where needed;
   - if you want the `notify` job's "Republish" issue, allow the workflow to open issues.
3. Go to **Actions → caa-data-refresh → Run workflow** on `main`. You can set `dry_run: true`
   first. Then run it for real and confirm that a commit touching only
   `cuban-immigration-tracker/data/` lands on `main`. After that, the schedule runs twice a day.
4. Go to **Actions → caa-probe → Run workflow**, download the `probe-report` artifact and copy it to
   `cuban-immigration-tracker/data/samples/PROBE-REPORT.md`.
5. Optional: add the `COURTLISTENER_TOKEN` repository secret, and enable branch protection on
   `main` with "Require review from Code Owners".
6. Rebuild and republish the artifact (`npm run build:artifact && npm run prove`, then publish
   `web-artifact/index.html` with `web-artifact/data/*`) to the same URL, and record that URL in
   the README.
