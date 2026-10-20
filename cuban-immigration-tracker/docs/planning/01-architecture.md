# 01 — Architecture (final)

Written 2026-10-20. Evidence tags as in `00-product-spec.md` (**[V]** = verified by a command in this environment today; the spike transcripts are summarised in §9).

## 1. Shape in one paragraph

A GitHub Actions job is the only "backend" in the MVP. It runs in the public repo `luisitin/Documents` (verified public, default branch `main` [V]). Each run:

1. Downloads the official USCIS files and a community processing-times mirror, all verified in the research.
2. Parses and validates them with the same zod schemas the app uses.
3. Runs QA gates.
4. Precomputes estimator parameters.
5. Commits small JSON snapshots under `cuban-immigration-tracker/data/`, and only when content changes or a weekly heartbeat is due.

The Expo SDK 58 app (iOS, Android, web) is one npm package. It consumes pure TypeScript libraries from `../packages/*` (`data-schemas`, `estimator`, `case-rules`, `i18n-core`), which Metro bundles directly from source (verified [V]).

- **Native:** fetches the snapshots from `raw.githubusercontent.com`. CORS is `*`, with ETag and `max-age=300` [V].
- **Web artifact:** a single HTML fragment that reads the same snapshots as relative supporting files `./data/*.json`.

The estimator runs on the device. Personal case data never leaves the device. Supabase for opt-in crowdsourced timelines is an **optional v1.1 layer**; nothing in the MVP reads it.

## 2. Diagram

```
 OFFICIAL / MIRROR SOURCES (verified in research; nothing invented)
 ┌─────────────────────────────┬──────────────────────────────┬─────────────────────────────┬─────────────────────┐
 │ www.uscis.gov data portal   │ github.com/jzebedee/uscis    │ federalregister.gov API v1  │ courtlistener.com v4│
 │  monthly CSV (I-485 Cuban)  │  daily SQLite release        │ uscis.gov RSS 22984/23269   │ (token; optional)   │
 │  quarterly all-forms XLSX   │  (processing times + inquiry │  → alert CANDIDATES only    │ → CANDIDATES only   │
 │  quarterly I-485 by office  │   dates; egov is Cloudflare- │                             │                     │
 │  fallback+sha check:        │   gated from cloud IPs)      │                             │                     │
 │  raw.githubusercontent.com/ │  doc 13 §1.6                 │  doc 13 §6, §9              │ doc 13 §7           │
 │  omairqazi29/visualizer     │                              │                             │                     │
 └──────────────┬──────────────┴───────────────┬──────────────┴──────────────┬──────────────┴──────────┬──────────┘
                ▼                              ▼                             ▼                         ▼
 ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │ GitHub Actions — /.github/workflows/caa-data-refresh.yml (repo root of luisitin/Documents)                    │
 │  triggers: schedule 17 6 * * * & 17 18 * * * (default branch only) · workflow_dispatch · push(claude/**,paths)│
 │  permissions: {} at workflow level; job "refresh": contents: write; job "notify": issues: write               │
 │  Node 22 + tsx: packages/ingestion  refresh --out data                                                        │
 │   fetch(raw archive + sha256) → parse → zod (packages/data-schemas) → QA gates Q1–Q12 → merge curated/*       │
 │   → fit params (packages/estimator: β, office multipliers, σ_obs, scenario weights + weight ledger)           │
 │   → reference-case canary → write data/*.json + manifest.json                                                 │
 │   → commit ONLY IF content changed OR heartbeat due (7 d)  → git pull --rebase → push                         │
 │   QA fail → data/quarantine/<run>/, keep last-good, manifest.qa.status; notify job opens/updates an issue     │
 │   NEW_MONTH / NEW_QUARTER / alert merged → notify job opens "Republish artifact" issue                        │
 └─────────────────────────────────┬─────────────────────────────────────────────────────────────────────────────┘
                                   │ git history of cuban-immigration-tracker/data/ = audit log
            ┌──────────────────────┴───────────────────────────────┐
            ▼ native (runtime fetch)                                ▼ web (build-time copy; republish runbook)
 https://raw.githubusercontent.com/luisitin/Documents/            scripts/build-artifact.mjs
   <dataRef>/cuban-immigration-tracker/data/manifest.json           npx expo export -p web (output "single",
   (CORS *, ETag, max-age=300 [V]; If-None-Match;                    asyncRoutes:false → ONE bundle [V])
    ≤1 refresh / 6 h; 429 backoff)                                  inline JS+CSS, assets→data: URIs,
   fallback: cached KV → bundled sample                             prelude (base capture, history shim, guard)
                                                                    → web-artifact/index.html (fragment)
                                                                    → web-artifact/data/manifest.json + *.json
                                                                    published as a Claude artifact + files
            │                                                                   │ fetch(window.__CAA_DATA_BASE__ +
            ▼                                                                   ▼   'manifest.json')  (= ./data/)
 ┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │ cuban-immigration-tracker/app — ONE Expo SDK 58 app (RN 0.88, React 19.3, Expo Router ~58.0.24, TS ~6.0.3)   │
 │  src/app/        routes only: (tabs)/{index,case,offices,alerts,more}, welcome, +not-found → Redirect "/"    │
 │  src/data/       DataProvider: sample → KV cache → network; status live|cached|published|sample              │
 │  src/storage/    kv.native.ts (AsyncStorage 2.2.0, memory mirror) | kv.web.ts (guarded localStorage+memory)  │
 │  src/i18n/       i18next instance, LangToggle state, notifications reschedule hook                            │
 │  src/ui/         theme (host data-theme on web via MutationObserver), SVG icons, SVG charts, layout          │
 │  src/notifications/ index.native.ts (expo-notifications, local) | index.web.ts (no-op)                       │
 │  src/platform/   webGuard + hostRefresh (web only, optional MCP)                                              │
 │  ──── imports (Metro watchFolders, tsconfig paths; ESLint boundary: packages never import react/expo) ──── │
 │  ../packages/data-schemas  zod schemas + types (shared with pipeline)                                        │
 │  ../packages/estimator     VPH-1.1 (pure TS, no deps)                                                        │
 │  ../packages/case-rules    eligibility flags, clock, remedy ladder, peer reasons, EAD rules                  │
 │  ../packages/i18n-core     en/es JSON + deterministic fmt (numbers, %, dates) + probability words            │
 └──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
   - - - - - - - - - - - - - - - - - - - v1.1 optional (native only; CSP blocks it on web) - - - - - - - - - - - -
   Supabase (anonymous auth + RLS, write-only for clients) ◄── opt-in shared timeline (prefix-only receipt,
   month + day offsets) ; the Actions job reads with a service-role key (environment w/ required reviewers),
   computes delayed-entry KM aggregates with n-suppression → data/community.json (static, like everything else)
```

## 3. Live data flow, step by step

1. **Publish.** USCIS posts a new monthly CSV ~4–8 weeks after the month (doc 04 §1.1). Today the latest is August 2026, and the September 2026 file is still 404 on the mirror (data-rigor proposal, fetched 2026-10-20).
2. **Detect.** On every run the job HEADs the next expected file names (`03-data-pipeline.md` §2):
   - `appropriation_requirement_september_2026_v1.0.csv`
   - `quarterly_all_forms_fy2026_q4_v1.xlsx`
   - the I-485-by-office href taken from the portal index.

   It also reads the newest jzebedee release.
3. **Ingest.** Raw bytes are archived with their sha256 under `data/raw/` (public-domain USCIS files only). Then the job parses, validates and runs QA.
4. **Fit.** The job runs four fits:
   - β is refit when a new month arrives.
   - Office multipliers are refit when a new quarter arrives.
   - The observation-noise σ is refit.
   - Scenario weights are recomputed by the single pure function `scenarioWeights()`: priors × active alert effects × tempered likelihood of observed completions. Every change is appended to `weightLedger` (`04` §6).
5. **Canary.** The job estimates the reference case (T15) and writes `manifest.canary`. If P(≤12) moves by more than 2 points without a new month, QA warns.
6. **Commit.** The job commits under `cuban-immigration-tracker/data/` when content changed. `dataChangedAt` is bumped only in that case. Otherwise it commits a heartbeat at most every 7 days, which only moves `lastCheckedAt` (§6).
7. **Native app.**
   - On cold start, and on foreground when the last check is more than 6 h old, it does a conditional GET of `manifest.json`.
   - It then fetches only the files whose sha256 changed, validates each with zod, and stores it in KV.
   - It re-runs the estimator on the device (< 100 ms; doc 08 §11.10).
8. **Web artifact.**
   - It reads `./data/manifest.json` through the captured base URL (§5).
   - Its data is as fresh as the last publish. The notify job opens a "Republish artifact" issue after a `NEW_MONTH`, `NEW_QUARTER` or merged alert.
   - The republish runbook (`03` §9) is done by the owner or by an agent session: run `npm run build:artifact`, then republish to the same artifact URL.
9. **Optional host refresh.** Inside claude.ai, if `window.claude?.use` resolves an `mcp` capability, the page *may* read `cuban-immigration-tracker/data/manifest.json` from `luisitin/Documents` through the GitHub connector. Any failure leaves the shipped files in use, silently. This is built last, behind a flag. The implementing agent must load the `artifact-capabilities` skill before writing it and declare the capability when publishing.

## 4. Offline and stale behaviour

| Situation | Native | Web artifact | Estimator |
|---|---|---|---|
| First launch, no network | bundled sample (`app/src/data/sample/`), chip **Muestra** | `./data/` missing or blocked → bundled sample, chip **Muestra** | runs; result labelled "con datos de muestra" |
| Network OK | chip **En vivo** with official month + "revisado" time | chip **Publicado {artifactBuiltAt}** | runs |
| Network fails later | last good KV copy, chip **Guardado** | n/a (the files ship with the page) | runs on cached data |
| Manifest invalid / sha mismatch | keep last good copy; note "No pudimos actualizar" | sample | runs |
| `schemaVersion` unknown or `minAppVersion` too high | keep old data; "Actualice la app" | same | runs on old data |
| Official month > 75 days old | T20a banner; confidence LOW | same | runs |
| `lastCheckedAt` > 10 days | "revisión automática atrasada" | — | runs |
| Artifact built > 35 days ago | — | "la app móvil puede tener datos más nuevos" | runs |
| QA quarantined | "Datos oficiales en revisión" (last good shown) | same if the shipped manifest says so | runs on last good |
| KV throws (web private mode) | memory only; onboarding repeats next visit | same | runs |

## 5. The web artifact path (contract a–i), as built

Every item below was prototyped in the spike [V] except where marked.

1. **Single bundle.**
   - `app.json` must set `"web": { "output": "single", "bundler": "metro" }` **and** `["expo-router", { "asyncRoutes": false }]`.
   - Spike result [V]: with the default expo-router 58 plugin (`asyncRoutes: { web: true }`, read from `node_modules/expo-router/plugin/build/withRouter.js`), the export produced **9 JS files**: route chunks plus `__common` and `__expo-metro-runtime`. With `asyncRoutes: false` it produced exactly **one** `entry-<hash>.js` of 1.3 MB, or 1.8 MB with zod and a package import.
   - The build script fails if `dist/index.html` references more than one script, or if any `"/_expo/"` or `"/assets/"` string remains after inlining.
2. **Assets.**
   - The bundle references about 12 expo-router/react-navigation PNGs as literal `"/assets/node_modules/…png"` strings [V].
   - The script replaces each one with a `data:image/png;base64,…` URI read from `dist/assets/…`. These are about 10 KB in total.
   - The build fails on any `.ttf`, `.otf` or `.woff` in `dist/assets` or in the bundle: no icon fonts.
3. **Fragment.** Only `<title>CAA Tracker</title>`, a `<style>` block, `<div id="root"></div>` (the root id read from `dist/index.html`), a prelude `<script>` and the bundle `<script>`. There is no doctype, html, head or body, and no favicon or manifest links. `</script` inside the JS is escaped.
4. **Prelude** (runs before the bundle; < 1 KB):
   - (a) `window.__CAA_DATA_BASE__ = new URL('./data/', document.baseURI).href`, captured **before** anything changes the URL.
   - (b) A history shim that wraps `pushState`/`replaceState` in try/catch.
   - (c) A web guard: if `location.pathname` is not a known route, it calls `history.replaceState(null, '', '/')`. The list of known routes is generated at build time from the route files.
   - Spike result [V]: served at `/x/y/z/index.html` under the host CSP, the page booted. The guard replaced the path with `/`, data was fetched from `/x/y/z/data/manifest.json` and the status read "live". Tabs navigated.
   - With `History.prototype.pushState/replaceState` forced to throw, the page still booted, navigated and fetched data. The `+not-found` redirect plus the shim were enough.
5. **CSP.** The spike CSP was `default-src 'none'; script-src 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net/npm/ https://unpkg.com; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'`. It produced zero console errors and only two requests, the page and `./data/manifest.json` [V]. No `unsafe-eval` was needed.
6. **Storage.** With the `localStorage` getter throwing, the page rendered and switched language [V]. The KV adapter keeps a memory map.
7. **Theme.**
   - The fragment `<style>` puts light tokens on `:root`, dark tokens under `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {…} }` and again under `:root[data-theme="dark"]`, with `color-scheme: dark`.
   - It sets an explicit background on `html`, `body` and `#root`. Setting `data-theme="dark"` changed the body background at runtime [V].
   - The app's `useThemeName()` reads `document.documentElement.dataset.theme` through a MutationObserver and falls back to `matchMedia`.
8. **Size.** A budget of ≤ 4 MB is a warning; 15 MB is a hard fail. The spike fragment was 1.30 MB [V].
9. **Never offered on web:** print, downloads, `alert`/`confirm`/`prompt`, the Notification API, device APIs, iframes, `window.open` popups. External links are rendered as selectable text.

## 6. Backend-optional design

| Layer | MVP | v1.1 | v2 |
|---|---|---|---|
| Official data | GitHub Actions → committed JSON → raw GitHub / artifact files | + GitHub Pages deploy of `data/` only (owner enables Pages; separate `pages` job with `pages: write, id-token: write`) to escape raw.githubusercontent rate limits | same |
| Alerts | curated JSON by PR; machine candidates in `data/candidates/` | CourtListener token, FR/RSS watchers open draft PRs | push (tier C) |
| Community timelines | none (fields stored locally only) | Supabase opt-in, aggregates → `data/community.json` | milestone sub-models |
| Case status | none | none | Torch opt-in after production approval |

The MVP has zero servers, zero accounts and zero paid services. If Supabase is down or absent, the app is unchanged (the Community screen says "todavía no hay datos comunitarios").

## 7. Data hosting decision (week 0, must-fix)

**Facts checked today [V]:**
- `api.github.com/repos/luisitin/Documents` → `private: false, visibility: public, default_branch: main`.
- Raw URLs for `main` and for the feature branch return 200.
- **Four personal files are publicly downloadable:** `CITI Certification.pdf`, `Licensee Lookup Summary.pdf`, `SIE.pdf` and `.github/workflows/MembershipVerificationLetter.pdf`, all HTTP 200 on `main`.

**Decision:**
- Snapshots live in `luisitin/Documents` under `cuban-immigration-tracker/data/`. This is the owner's explicit requirement 3, and the repo is already public.
- The native base URL is **configurable** through `app.json` → `extra.data.baseUrls[]`. The first entry is used and the others are fallbacks. The data can therefore move to a dedicated public repo or to Pages later without code changes.
- `extra.data.ref` is `main` for store builds and the feature branch for preview builds.

**Owner action (not automated; destructive):**
- Remove the four personal PDFs from the repo.
- If they are sensitive, purge them from history (`git filter-repo`, then force-push and rotate any exposed identifiers).
- Alternatively, make the repo private. That would break raw URLs: the data would then need a separate public data repo, written by the workflow with a fine-grained token stored as a secret (§10 R1).

The plan reminds the owner of this in the first PR description.

## 8. Cost

All figures use the doc 09 §9 basis; Pages is v1.1.

| Item | Year 1 | At 50k MAU |
|---|---|---|
| GitHub (public repo Actions + raw/Pages) | $0 | $0 (Pages ≈ 9 GB/mo, under the 100 GB soft cap [T]) |
| Apple Developer / Google Play | $99/yr + $25 once | same |
| EAS Build | $0 (free tier) | $0–19/mo |
| EAS Update (OTA) | $0 (≤ 1k MAU) — **skip OTA in MVP** | $0 if skipped; $199/mo Production [S per doc 09] |
| Supabase (v1.1) | $0 free (pauses after ~7 d idle) | $25/mo Pro recommended |
| CourtListener token | $0 (free account; 5/min, 50/h, 125/day) | same |
| **Total** | **≈ $124** | **$0–$224/mo + $99/yr** |

## 9. What the spikes verified today (2026-10-20, scratchpad; not committed)

| # | Spike | Result |
|---|---|---|
| V1 | `npx expo export --platform web` with expo 58.0.16, expo-router ~58.0.24, react-native-web ~0.21.4, `web.output: "single"`, default router plugin | 9 bundles: route chunks + `__common` + metro runtime. **Single file is impossible without `asyncRoutes: false`** |
| V2 | same with `["expo-router", {"asyncRoutes": false}]` | 1 bundle (1.3 MB), `index.html` with one `<script src="/_expo/static/js/web/entry-<hash>.js" defer>`; 12 `"/assets/node_modules/…png"` literals in the bundle |
| V3 | prototype `build-artifact.mjs` (inline, data-URI assets, prelude) + headless Chromium under host CSP at `/x/y/z/index.html` | boots; path → `/`; data via captured base; ES/EN switch; Intl `es-US`: "355,520 · 9% · 20 oct 2026", `en-US`: "355,520 · 9% · Oct 20, 2026"; 390 px no horizontal scroll; `data-theme` respected; 0 console errors; requests = page + `./data/manifest.json` only |
| V4 | same with `localStorage` throwing; with `history.pushState/replaceState` throwing; with `data/` missing | all boot; missing data → sample path (one expected 404 console line) |
| V5 | Chromium for Prove: `npm i @sparticuz/chromium@153.0.0 puppeteer-core@25.15.0` from registry.npmjs.org; `chromium.executablePath()` extracts `/tmp/chromium` | launches headless in this container (no system Chromium, Playwright CDN blocked) |
| V6 | Metro web export importing `../packages/estimator` and `../packages/data-schemas` (zod) via `watchFolders` + tsconfig `paths`; root tooling `node_modules` with zod | 1 bundle (1.8 MB); `tsc --noEmit` passes once `paths.zod` points at `app/node_modules/zod` |
| V7 | `tsx --tsconfig packages/ingestion/tsconfig.json` importing the same packages | runs |
| V8 | jest-expo in `app/` importing `@caa/estimator` via `moduleNameMapper` | passes |
| V9 | raw.githubusercontent.com headers for this repo | `access-control-allow-origin: *`, `etag`, `cache-control: max-age=300` |
| V10 | stdlib Python VPH-1 oracle (`04` Appendix A) | β̂ = 0.037391; pool 355,520 / 25 vintages; T4/T5 match doc 08 exactly; reference P(≤12) = 9.229 %, q50 = 54 (doc 08 prose: 9.4 %, 53) |

## 10. Risks (architecture-level; product/model risks are in `04` §12)

| # | Risk | Mitigation |
|---|---|---|
| R1 | Personal files public in the same repo; bot commits add noise to a personal repo | Tell the owner now (§7). Commit only on change plus a weekly heartbeat (≈60–120 commits/yr instead of 730). Configurable base URL allows moving to a data repo later |
| R2 | raw.githubusercontent.com tightened unauthenticated limits in May 2025 [S: https://github.blog/changelog/2025-05-08-updated-rate-limits-for-unauthenticated-requests/]; the per-IP numbers are undocumented and carrier-grade NAT can share IPs | ≤ 1 manifest check per 6 h, conditional GET, ≤ 7 small files, `Retry-After` backoff, cache-first UI. v1.1: GitHub Pages for `data/` and a jsDelivr GitHub mirror (`https://cdn.jsdelivr.net/gh/luisitin/Documents@main/cuban-immigration-tracker/data/` [T], verify from a normal network in week 0) as `baseUrls[1]` |
| R3 | **Expo Go may not support SDK 58 yet.** A Sep 2026 release note says the App Store Expo Go supports SDK 57 and requires login to both the CLI and the app [S-sec: https://releasebot.io/updates/expo; https://expo.dev/changelog/expo-go-and-app-store-may-2026] | Everything in the MVP uses only modules in Expo Go's set. If SDK 58 Expo Go is missing, use an EAS development build (internal distribution) or `eas go` TestFlight builds [S-sec]. The web artifact serves demos. Confirm on expo.dev/go in week 0 |
| R4 | `workflow_dispatch` needs the workflow file on the default branch [S-sec: https://github.com/orgs/community/discussions/178194, https://github.com/orgs/community/discussions/169535] | Land the workflow on `main` early (owner merges a small PR). Until then the `push` trigger on `claude/**` (paths-filtered) runs it. Once on `main`, use `gh workflow run caa-data-refresh.yml --ref <branch>` (`03` §6.2) |
| R5 | `uscis.gov` reachable from GitHub runners only with a browser UA (third-party CI evidence, doc 13 §3.1); egov Cloudflare-blocked | Mirror fallback with sha check; jzebedee for processing times; the probe workflow classifies every source in week 0 |
| R6 | jzebedee/uscis has no LICENSE; its asset name `<YYYY-MM-DD>.db` is [I] | Publish derived fields only, with attribution. Ask the maintainer (issue) in week 0. Read the asset URL from the API, never construct it. Carry each inquiry date with its retrieval date; when missing, show "no disponible" and make **no gate decision** |
| R7 | Bundle growth (zod adds ~0.5 MB [V]) | 4 MB warning budget; no Skia, Victory, gifted-charts, date-fns, lodash or moment; consider `zod/mini` in the app if the budget is exceeded [T] |
| R8 | Hermes vs V8 `Intl` differences [T] | Display formatting never depends on `Intl`: deterministic `fmt` in `packages/i18n-core` with locale tables, tested in Node and in Chromium (Prove) |
| R9 | Spike results are from one container run | WP0 re-runs V1–V8 inside the real repo before any feature work (`07` WP0) |

## 11. Searches used for this plan (3 of 5 allowed)

1. "GitHub Actions workflow_dispatch run workflow on non-default branch requires workflow file exist on default branch" → manual runs need the file on the default branch; REST/CLI `--ref` dispatch works once it exists [S-sec: https://github.com/orgs/community/discussions/178194 ; https://github.com/orgs/community/discussions/169535 ; https://levelup.gitconnected.com/triggering-a-github-actions-workflow-without-merging-into-the-default-branch-a-guide-8a2265aba998].
2. "raw.githubusercontent.com rate limit unauthenticated requests 2025 change 429" → GitHub changelog 2025-05-08 tightened unauthenticated limits, including raw downloads; no official numbers; 429 reports [S: https://github.blog/changelog/2025-05-08-updated-rate-limits-for-unauthenticated-requests/ ; https://github.com/orgs/community/discussions/159123].
3. "Expo SDK 58 release Expo Go App Store Play Store support SDK 58" → nothing on SDK 58; App Store Expo Go supports SDK 57 (2026-09-02), login required; `eas go` path [S-sec: https://releasebot.io/updates/expo ; https://expo.dev/changelog/expo-go-and-app-store-may-2026].
