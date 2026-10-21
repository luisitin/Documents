# ADR log and integration record

Owner: WP11 (07-implementation-plan.md §6 WP11). This file records:

1. architecture decisions and deviations that the WPs made while building (§A);
2. the integration fixes WP11 made in other WPs' files (§B, 07 WP11 "a trivial fix may be made
   directly, with a note in `adr-log.md`");
3. the 07 §7 integration checklist, signed line by line (§C);
4. the follow-ups that only the owner or the orchestrator can do (§D).

Written 2026-10-21 by the WP11 integrator. Tags: **[V]** = verified by a command in this
container on 2026-10-21; **[R]** = taken from a builder's report; **[O]** = owner or orchestrator
action.

---

## A. Decisions and deviations recorded by the WPs

| # | WP | Decision or deviation | Why | Source |
|---|---|---|---|---|
| A1 | WP0 | Root `lint` is `eslint --no-error-on-unmatched-pattern packages scripts tools` | `tools/` did not exist until WP2 | [R] WP0 report |
| A2 | WP0 | TypeScript 6: no `baseUrl` (deprecated); `paths` are written `./packages/*/src` | TS 6 deprecation | [R] |
| A3 | WP0 | `app/tsconfig.json` also maps `zod/*` and `@caa/estimator/golden`, and excludes `../packages/ingestion/**` and `data-schemas/src/node.ts` (Node only) | keeps Node-only code out of the app typecheck | [R] |
| A4 | WP0 | `@supabase/supabase-js` is **not** installed | it is v1.1-only (07 §3.2) | [R] |
| A5 | WP0 | `vitest@5.0.3` was installed with `npm@11.6.2` because npm 10.9.4's arborist crashes on its optional peers; the lockfile works with npm 10 (`npm ci` re-run) | npm bug | [R] |
| A6 | WP0 | `puppeteer-core@25.12.0` launched `@sparticuz/chromium@153.0.0` (HeadlessChrome 153.0.8010.0); the 25.13.0 fallback of 07 §3.2 was **not** needed | acceptance (f) | [R] |
| A7 | WP0/WP1 | `packages/data-schemas/src/index.ts` must call `z.config({ jitless: true })` before any schema is built | zod's `new Function` probe otherwise raises a CSP `script-src` violation (Prove P3) | [R] |
| A8 | WP0/WP10 | The artifact prelude adds a virtual history cursor that clamps `history.go/back` | after a swallowed `pushState`, expo-router's `history.go(-n)` navigated the frame away from the page (history-throws scenario) | [R] `scripts/build-artifact.mjs` |
| A9 | WP10 | Prove drops `@sparticuz/chromium`'s `--single-process`, `--disable-web-security` and `--allow-running-insecure-content` | a second browser context crashed with "Target closed"; the other two would weaken the CSP check | [R] `scripts/prove-artifact.mjs` |
| A10 | WP0 | `upload-artifact` pinned to v7.0.1 (`043fb46d…`), not v7.0.2 | v7.0.2 (2026-10-07) was under 14 days old | [R] |
| A11 | WP1 | The case schema has **no** `receiptFullLocal` field (02 §3 lists one) and `parseCase` strips it | owner rule: never store full receipt numbers | `packages/data-schemas/README.md` |
| A12 | WP4 | Numbers use US grouping (`5,000`) in both languages; Spanish percent is `9 %` | ADR-I18N-2 (deterministic `fmt`, Cubans in the U.S. read U.S. documents) | `packages/i18n-core/src/fmt.ts` |
| A13 | WP5 | The local probe was blocked by the sandbox egress policy; `data/samples/PROBE-REPORT.md` says so and is otherwise the verbatim CLI output. The real report comes from the `caa-probe` workflow on push | orchestrator override 4 | `data/samples/PROBE-REPORT.md` |
| A14 | WP5 | The committed `data/raw/**` USCIS files were fetched through the public GitHub mirror (`via: mirror.visualizer`), because USCIS hosts are unreachable here. Q8 (mirror sha = direct sha) therefore passed only as "not both fetched" | network constraint | `data/raw/**/*.meta.json`, `packages/ingestion/src/qa.ts` |
| A15 | WP6 | On web the welcome modal does not open; the home tab shows the first-launch content and the header carries the language toggle | the host never shows URL changes; Prove P2 expects `/` after boot | `app/src/app/(tabs)/_layout.tsx` |
| A16 | WP6 | The MCP host refresh (`hostRefresh.web.ts`) ships **disabled** (`HOST_REFRESH_ENABLED = false`) | the GitHub connector's `get_file_contents` result shape was never observed; shipping a guessed shape is not allowed. Lowest-priority owner requirement; the shipped `./data/` files and the bundled sample cover the page | `app/src/data/hostRefresh.web.ts` |

## B. WP11 integration fixes in other WPs' files

| # | Files (owner) | Change | Verified |
|---|---|---|---|
| B1 | `app/src/app/(tabs)/_layout.tsx` (WP6), `app/src/features/alerts/readState.ts` (WP8a) | Implemented 00 §5's "Alertas: dot when unread" (left as `TODO(WP6)`). New hook `useUnreadAlertCount()` counts live unread alerts; the alerts tab icon draws a small dot (a `View`, no text, so the tab's visible label stays exactly "Alertas"/"Alerts", which Prove P6 reads from `textContent`); the count is announced in the tab's accessibility label with the existing `alerts:unread.*` strings in both languages | [V] new `app/__tests__/integration-unread-dot-test.tsx` (es → en runtime switch, dot disappears after `markRead`); Prove 516/0 after the change |
| B2 | `app/src/hello/` (WP0 scaffold) | Deleted. Nothing imported it any more (WP0 handed it to WP6/WP8 "delete once screens land"); `app/__tests__/wp0-foundation-test.tsx` was already gone | [V] app tsc, lint, jest; build and Prove |
| B3 | `package.json` (WP0) | Added `personal:check` (`node scripts/check-no-personal-files.mjs`) and appended it to `check` | [V] `npm run check` |
| B4 | `.github/workflows/caa-ci.yml` (WP11; WP10 block untouched) | Removed WP0's "if present" guards (every script now exists), root install uses `npm ci --ignore-scripts` (05 §3.1; only esbuild's optional binary check and macOS `fsevents` have install scripts at the root, and a clean `--ignore-scripts` install ran `esbuild` and `tsx` fine), added the personal-files guard, per-job `contents: read`, and the CODEOWNERS path to the triggers. The app job keeps install scripts (`unrs-resolver`, `@parcel/watcher` need them). Suggestion for WP10 (not applied, its block): the web job's root `npm ci` could also take `--ignore-scripts` | [V] actionlint 1.7.7 clean on all four `caa-*.yml` |

## C. 07 §7 integration checklist (signed 2026-10-21)

| Line | Status | Evidence |
|---|---|---|
| `npm run check` and `cd app && npm run check` are green | **done here** [V] | root: tsc, eslint, vitest (27 files), golden:check, i18n:check, data:validate, personal:check. App (`EXPO_OFFLINE=1`): `expo install --check`, `expo lint`, tsc, jest (27 suites). Exact counts are in the WP11 report |
| … and CI is green on the branch | **orchestrator** [O] | runs on the next push of `claude/cuban-immigration-tracker-b6y4b1`; cannot be observed from this container |
| `golden:check` green; TS golden tests T1–T32, U1–U8 green | **done here** [V] | "172 doc values verified (EST-13)"; `packages/estimator/test/golden*.vitest.ts` in `npm test` |
| `data:refresh` produces data that validates; canary = GOLDEN T15 | **done here, partly** [V] | `npm run data:refresh -- --dry-run`: `no_change; qa ok`, canary T15 P12 0.09229, q50 54 (= GOLDEN T15); USCIS hosts unreachable here, so no new month was possible. The real run is the `caa-data-refresh` workflow (see D4) |
| `app/src/data/sample/` is G1 (`dataThrough 2026-08`), not refreshed on routine updates; "Muestra" offline, "En vivo" with the branch ref, "Guardado" after one fetch | **done here** [V] | sample manifest `latestOfficialMonth 2026-08`, canary = GOLDEN T15; `app/__tests__/platform-data-test.tsx` "sample → live → cached"; Prove sample variant shows "Muestra … ago 2026" |
| Native device runs (iOS + Android, Expo Go push check, 200 % font, screen reader) | **owner** [O] | no simulator or device here. See D7 |
| `build:artifact` gives one fragment under 4 MB; `prove` passes every §9 assertion | **done here** [V] | fragment 2,544,796 B (≈2.4 MiB), 12 inlined assets, 20 routes, 8 data files; Prove P1–P14, both variants, phone/desktop/storage-throws/history-throws: 516 passed, 0 failed |
| Workflow on `main`; scheduled commit on `main`; `notify` issue test; heartbeat `--dry-run` | **owner** [O] | scheduled workflows run only on the default branch. Heartbeat logic is unit-tested (`packages/ingestion/test/commitPolicy.vitest.ts`) and the dry run above passed. See D3 |
| Spanish reviewer sign-off; `i18n:check` register guard clean | **register guard done** [V]; **sign-off: owner** [O] | `check-i18n: OK — 28 locale files, 2032 strings … 0 error(s)`. See D6 |
| Privacy: no network calls except the data URLs; privacy page and disclaimers in both languages | **done here (web)** [V]; **native: owner** [O] | Prove P3: the only requests are the page and `./data/*.json`, 0 CSP violations. The app's only `fetch` call sites are in `app/src/data/fetchers.ts` (manifest + data files from `dataBaseUrl()`). Privacy screen `/more/privacy` and the disclaimers render in both languages (Prove P6 disclaimer check). A native proxy log is part of D7 |
| Owner told about the four public personal PDFs; decision recorded | **told; decision pending** [O] | See D1 |
| Artifact published; URL in README | **orchestrator/owner** [O] | publishing happens outside the builder. See D5 |

## D. Owner and orchestrator follow-ups

**D1. Personal PDFs in the public repository (05 §2). Owner decision required.**
These four files are tracked in `luisitin/Documents`, which is public, and are served by
raw.githubusercontent.com:

- `CITI Certification.pdf`
- `Licensee Lookup Summary.pdf`
- `SIE.pdf`
- `.github/workflows/MembershipVerificationLetter.pdf`

They are not part of this project. **No agent deleted, moved or rewrote them**; doing so is
destructive and is the owner's decision. Options (05 §2): move them out of the repository; if
they contain anything sensitive, also purge them from history (`git filter-repo --path <file>
--invert-paths` for each, force-push, ask GitHub support to clear cached views) and treat their
contents as already disclosed; or make the repository private (that breaks the raw data URLs, so
the snapshots would move to a dedicated public data repo, which `app.json` `extra.data.baseUrls`
already allows). `scripts/check-no-personal-files.mjs` reports them as warnings and fails on any
new PDF, office document or image outside `app/assets/` and `data/raw/`.
Decision: _pending (owner)_ · date: _______

**D2. Licence.** `cuban-immigration-tracker/LICENSE` applies the default 05 §6 suggests (MIT for
code, CC BY 4.0 for derived data and written content, U.S. Government data uncopyrighted,
third-party derived fields under their own terms). The owner should confirm or replace it before
the first public release. The root tooling `package.json` keeps `"license": "UNLICENSED"`
because it is a private, unpublished package.

**D3. Workflows on `main`.** Scheduled runs (`caa-data-refresh`, `caa-staleness`, the weekly
probe) only fire on the default branch. After review, the owner merges the workflow files (and
`.github/CODEOWNERS`) to `main`. Then: watch one scheduled refresh commit on `main`; test the
`notify` job's "Republish" issue with an injected `new_month`; enable branch protection on `main`
with "Require review from Code Owners", and decide whether the bot may push data directly (05
§3.1).

**D4. First real data run.** The orchestrator touches `cuban-immigration-tracker/data/.refresh-request`
once after the build (override 3), so `caa-data-refresh` runs on a GitHub runner with open
internet. That run fetches USCIS directly, which makes Q8 a real mirror-vs-direct check (A14), and
may publish a new month. The `caa-probe` run on push produces the real `PROBE-REPORT.md` (job
summary and workflow artifact); the owner copies it into `data/samples/PROBE-REPORT.md` (A13).

**D5. Publish the artifact.** Run the republish runbook (03 §9): `npm run build:artifact && npm
run prove`, then publish `web-artifact/index.html` as the page with `web-artifact/data/manifest.json`
and `web-artifact/data/*.json` as supporting files, always to the **same** artifact URL, and record
that URL in `cuban-immigration-tracker/README.md` ("Web artifact" line, currently "not published
yet").

**D6. Spanish review.** A native Cuban-Spanish reviewer signs off on every `es` string, every
curated `Localized` field, every notification template and every disclaimer (07 §8, WP9). The
seed alerts carry `reviewedBy: "pending-native-es-review"` until then; the checklist with the
reviewer's handle and date is in `data/curated/README.md`.

**D7. Native devices.** Default path: an EAS development build (internal distribution), or Expo Go
on a simulator/emulator until SDK 58 Expo Go reaches the stores (07 §7). Check on one iOS and one
Android device: all tabs, the reference case, the language toggle (strings, dates, numbers, chart
labels switch with no restart), notifications scheduled and rescheduled on a language change,
"Borrar mis datos", no push-related error in Expo Go on Android, 200 % font scale, screen-reader
labels on the toggle, chips, chart table twins and the alerts unread dot (B1). Record which path
was used here.

**D8. Native data before the merge.** Native builds read `https://raw.githubusercontent.com/luisitin/Documents/main/cuban-immigration-tracker/data/`.
On 2026-10-21 that URL returns 404 on `main` and 200 on `claude/cuban-immigration-tracker-b6y4b1`
[V]. Until the data reaches `main`, a native build shows the bundled sample ("Muestra"), as
designed; a preview build can override `extra.data.ref` with the branch name to test "En vivo".

**D9. Third-party permissions and secrets.**
- Ask `jzebedee/uscis` for permission to republish the derived processing-time fields (03 P4;
  `TODO(WP5→owner)` in `packages/ingestion/src/sources/processingTimes.ts`). No issue was opened
  (orchestrator override 2).
- Optional `COURTLISTENER_TOKEN` repository secret for the CourtListener alert candidates.
- Pin the actionlint tarball sha256 in `caa-probe.yml` from a trusted copy of the release
  (`TODO(WP5→owner)` there; the release's checksums file is verified meanwhile).

**D10. Optional MCP host refresh (A16).** If wanted, observe one real GitHub connector
`get_file_contents` call inside claude.ai, implement the parser in `app/src/data/hostRefresh.web.ts`
(zod + sha256 like `fetchers.ts`), set `HOST_REFRESH_ENABLED = true`, and declare the `mcp`
capability when publishing. Until then the page silently uses the shipped `./data/` files.
