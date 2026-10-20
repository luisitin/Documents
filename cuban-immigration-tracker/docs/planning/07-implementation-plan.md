# 07 — Implementation plan for autonomous agents (final)

Written 2026-10-20. This is **the** build plan. It assumes the agents have read:

- `00-product-spec.md` (what to build)
- `01-architecture.md` (shape)
- `02-data-model.md` (types)
- `03-data-pipeline.md` (ingestion)
- `04-estimation-model.md` (estimator ADRs and golden values)
- `05-privacy-security-legal.md` (rules)

Every work package (WP) owns **disjoint directories**. A WP may read anything but writes only inside its own directories. Contract changes go through the WP1 owner (§10).

## 1. Architecture decisions (ADRs) that bind every WP

| ADR | Decision | Evidence |
|---|---|---|
| **ARCH-1 Layout** | No npm workspaces. There are two npm packages: (a) the **root tooling package** `cuban-immigration-tracker/package.json` (Node ≥ 22.13: vitest, tsx, zod, ingestion deps, Prove deps) and (b) the **Expo app** `cuban-immigration-tracker/app/package.json`. Pure libraries live in `packages/*/src` as **source-only TypeScript**. They have no `package.json` dependencies and may import only `zod` and sibling `@caa/*`. The app consumes them through Metro `watchFolders` plus tsconfig `paths`; tools consume them through tsconfig `paths` and `tsx --tsconfig`. `zod` is pinned to the **same exact version** in both npm packages | spikes V6–V8 [V] |
| **ARCH-2 Storage** | One KV interface. Native: `@react-native-async-storage/async-storage@2.2.0`, hydrated into a memory mirror. Web: our own guarded `localStorage` plus memory. No expo-sqlite, MMKV or TanStack Query in the MVP | `02` §6 |
| **ARCH-3 Lean bundle** | Forbidden in `app/`: `expo-sqlite`, `expo-symbols`, `@expo/vector-icons`, `expo-font`, `react-native-gifted-charts`, `victory-native`, `@shopify/react-native-skia`, `react-native-mmkv`, `date-fns`, `moment`, `lodash`, `@tanstack/react-query`. Charts and icons use `react-native-svg` only. ESLint `no-restricted-imports` enforces this | contract (b), (g) |
| **ARCH-4 Single web bundle** | `app.json`: `"web": { "output": "single", "bundler": "metro" }`; plugin `["expo-router", { "asyncRoutes": false }]` | V1/V2 [V] |
| **ARCH-5 Data hosting** | `luisitin/Documents` (public) under `cuban-immigration-tracker/data/`. Native base URLs come from `app.json` `extra.data = { baseUrls: ["https://raw.githubusercontent.com/luisitin/Documents"], ref: "main", path: "cuban-immigration-tracker/data" }`. Preview builds override `ref` | `01` §7 |
| **ARCH-6 Commit policy** | Commit when content changes (bumps `dataChangedAt`) or for a 7-day heartbeat (bumps `lastCheckedAt`). Data paths only | `03` §6.1 |
| **WEB-1 Prelude** | The fragment prelude captures `window.__CAA_DATA_BASE__`, installs a try/catch history shim, and replaces an unknown path with `/` — in that order and before the bundle. The data layer on web uses only `window.__CAA_DATA_BASE__` (fallback `./data/`) | V3/V4 [V] |
| **WEB-2 Prove browser** | Prove uses `@sparticuz/chromium@153.0.0` plus `puppeteer-core`, both from registry.npmjs.org. `executablePath()` extracts `/tmp/chromium`. No system browser and no Playwright CDN | V5 [V] |
| **I18N-1 Register** | Spanish uses **usted** throughout: UI, data files, notifications, disclaimers. Doc 16 §8.4's tú copy is converted. The style guide is §8 | must-fix |
| **I18N-2 Formatting** | Deterministic `fmt` in `packages/i18n-core`; no `Intl` in the output path | `02` §9 |
| **I18N-3 Namespaced locales** | `packages/i18n-core/locales/{es,en}/<namespace>.json`. Each WP owns its namespaces; `common` belongs to WP4 | avoids merge conflicts between parallel agents |
| **EST-1…14** | The estimator spec and the golden file | `04` §2, §4 |

## 2. Repository layout (exact)

```
/home/user/Documents/                          ← git root = luisitin/Documents (public; default branch main)
├── .github/
│   ├── CODEOWNERS                             ← WP11
│   └── workflows/                             ← GitHub reads workflows ONLY here (not cuban-immigration-tracker/.github)
│       ├── blank.yml                          (existing; untouched)
│       ├── caa-data-refresh.yml               ← WP5 (03 §6.1)
│       ├── caa-ci.yml                         ← WP11 (03 §6.3)
│       ├── caa-probe.yml                      ← WP5 (03 §6.4)
│       └── caa-staleness.yml                  ← WP5 (03 §6.5)
└── cuban-immigration-tracker/
    ├── README.md  LICENSE                     ← WP11 (README records the artifact URL)
    ├── package.json  package-lock.json        ← WP0 (root tooling; scripts in §4)
    ├── tsconfig.base.json                     ← WP0 (strict; paths @caa/* → packages/*/src)
    ├── tsconfig.json                          ← WP0 (tools typecheck: packages/**, scripts/**, tools/**)
    ├── vitest.config.mts  eslint.config.js    ← WP0
    ├── .gitignore                             ← WP0 (node_modules, app/dist, web-artifact, .expo, prove-out)
    ├── packages/
    │   ├── data-schemas/   src/{index,primitives,national,quarterly,offices,policy,alerts,content,params,manifest,case,community,ledger,fieldKinds,validate}.ts
    │   │                   test/*.vitest.ts   README.md                                    ← WP1
    │   ├── estimator/      src/{index,pool,beta,office,project,mix,quantiles,milestones,stateMix,structural,weights,drivers,lognormal,clockFacade}.ts
    │   │                   golden/vph1.golden.json   test/*.vitest.ts                      ← WP2
    │   ├── case-rules/     src/{index,flags,clock,remedies,peers,ead,approval,share,dates}.ts  test/*.vitest.ts   ← WP3
    │   ├── i18n-core/      src/{index,fmt,words,keys}.ts  locales/{es,en}/{common,home,case,estimate,peers,ead,remedies,offices,alerts,more,method,notifications,welcome}.json
    │   │                   test/*.vitest.ts   STYLE-GUIDE.md                                ← WP4 (common, structure); namespaces per §6
    │   └── ingestion/      src/{cli,http,classify,raw,qa,fit,publish,commitPolicy}.ts  src/sources/{monthlyCsv,quarterlyAllForms,i485ByOffice,portalIndex,processingTimes,federalRegister,uscisRss,courtListener,curated}.ts
    │                       src/probe/{index,probes/*}.ts   test/{*.vitest.ts,fixtures/}   tsconfig.json   ← WP5
    ├── tools/oracle/       vph1.py  golden_cases.py  README.md                             ← WP2
    ├── scripts/            build-artifact.mjs  prove-artifact.mjs                          ← WP10
    │                       check-i18n.mjs                                                  ← WP4
    │                       export-sample.mjs  export-schema.mjs                            ← WP5 / WP1
    │                       check-no-personal-files.mjs                                     ← WP11
    ├── data/               (02 §2) generated: WP5 · curated/**: WP9 · samples/: probe
    ├── app/                                                                                 (Expo SDK 58)
    │   ├── package.json  package-lock.json  app.json  tsconfig.json  metro.config.js  eslint.config.js   ← WP0
    │   ├── assets/         icon.png adaptive-icon*.png splash-icon.png (no fonts)          ← WP7
    │   ├── src/app/                                                    ← routes only (thin wrappers)
    │   │   ├── _layout.tsx  +not-found.tsx  (tabs)/_layout.tsx                              ← WP6
    │   │   ├── welcome.tsx  (tabs)/index.tsx  (tabs)/offices/{index,[code]}.tsx             ← WP8a
    │   │   ├── (tabs)/alerts/{index,[id]}.tsx  (tabs)/more/{_layout,index,settings,method,myths,glossary,about,privacy}.tsx  ← WP8a
    │   │   └── (tabs)/case/{_layout,index,edit,peers,ead,remedies,ineligible,share}.tsx     ← WP8b
    │   ├── src/features/   home/ offices/ alerts/ more/ welcome/  ← WP8a    case/ ← WP8b
    │   ├── src/data/       DataProvider.tsx useData.ts fetchers.ts baseUrl.ts baseUrl.web.ts hostRefresh.web.ts sample/*.json  ← WP6
    │   ├── src/storage/    kv.ts kv.native.ts kv.web.ts cases.ts settings.ts               ← WP6
    │   ├── src/i18n/       index.ts useLang.ts                                             ← WP6
    │   ├── src/notifications/ index.ts index.native.ts index.web.ts schedule.ts           ← WP6
    │   ├── src/platform/   openUrl.native.ts openUrl.web.ts share.native.ts share.web.ts clipboard.web.ts webRoutes.generated.json  ← WP6
    │   ├── src/ui/         theme.ts useThemeName.ts useThemeName.web.ts layout/ components/ charts/ icons/   ← WP7
    │   └── __tests__/      platform-*  ← WP6 · ui-*  ← WP7 · screens-a-* ← WP8a · screens-b-* ← WP8b
    ├── web-artifact/       (git-ignored build output: index.html + data/)
    └── docs/               research/ planning/  (unchanged by WPs except planning/adr-log.md ← WP11)
```

## 3. Pinned versions

### 3.1 App (install only with `npx expo install`, which writes these ranges; SDK notes §1)

| Group | Packages |
|---|---|
| Core | `expo ~58.0.16`, `react 19.3.0`, `react-dom 19.3.0`, `react-native 0.88.0`, `react-native-web ~0.21.4` [V] |
| Router | `expo-router ~58.0.24`, `expo-linking ~58.0.13`, `expo-constants ~58.0.12`, `expo-status-bar ~58.0.3`, `expo-splash-screen ~58.0.10`, `react-native-screens ~4.30.0`, `react-native-safe-area-context ~5.10.1`, `react-native-reanimated 4.7.1`, `react-native-worklets 0.13.0`, `react-native-gesture-handler ~3.3.0` |
| Features | `expo-localization ~58.0.5`, `expo-notifications ~58.1.5`, `expo-device ~58.0.5`, `react-native-svg 15.16.0`, `@react-native-async-storage/async-storage 2.2.0` |
| JS | `i18next ^26.5.3`, `react-i18next ^17.1.0`, `zod 4.6.7` (exact, identical to root) |
| Dev | `typescript ~6.0.3`, `@types/react ~19.3.0`, `jest ^30.5.2`, `jest-expo ~58.0.11`, `@types/jest ^30.0.0`, `@testing-library/react-native ^14.1.0`, `eslint ^9.39.5`, `eslint-config-expo ~58.0.4` (this brings `eslint-plugin-react`, used for `react/jsx-no-literals` [V present]) |
| Dev-build profile only | `expo-dev-client ~58.0.14` (if Expo Go lacks SDK 58) |

Follow the SDK gotchas (SDK notes §1, §12):
- run `npx expo install react-dom` to avoid ERESOLVE;
- use `EXPO_OFFLINE=1` in sandboxes;
- run `npx expo install --check` in CI;
- `"main": "expo-router/entry"`;
- no `babel.config.js`;
- Jest 30.

### 3.2 Root tooling (`npm i --save-exact`; each version ≥ 14 days old on 2026-10-20 unless noted)

| Package | Version | Note |
|---|---|---|
| `typescript` | `~6.0.3` | same major as the app (not 7.x) |
| `vitest` | `5.0.5` | 2026-10-15; the SDK notes scaffold used `^5.0.5` [V] |
| `zod` | `4.6.7` | identical to the app |
| `tsx` | `4.23.15` | [V] |
| `exceljs` | `4.4.0` | |
| `csv-parse` | `7.0.3` | |
| `sql.js` | `1.14.2` | 1.15.x is < 14 days old |
| `fast-xml-parser` | `5.11.2` | |
| `@sparticuz/chromium` | `153.0.0` | [V] |
| `puppeteer-core` | `25.12.0` | ≥ 14 days old; **WP0 re-verifies** it with Chromium 153 (25.15.0 was verified today [V]) |
| `@types/node` | `22.x` latest ≥ 14 days | |
| `eslint` | `^9.39.5` | |
| `@supabase/supabase-js` | v1.1 only; latest ≥ 14 days at install (2.118.0 is too new today) | |

### 3.3 Python

`tools/oracle/vph1.py` uses the **stdlib only** and runs with `python3 -I` (3.12+). There is no pip install.

## 4. Root scripts (`cuban-immigration-tracker/package.json`)

```json
{
  "scripts": {
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run",
    "lint": "eslint packages scripts tools",
    "golden:check": "python3 -I tools/oracle/vph1.py --check packages/estimator/golden/vph1.golden.json",
    "golden:write": "python3 -I tools/oracle/vph1.py --write packages/estimator/golden/vph1.golden.json",
    "schema:export": "tsx --tsconfig tsconfig.json scripts/export-schema.mjs",
    "data:refresh": "tsx --tsconfig packages/ingestion/tsconfig.json packages/ingestion/src/cli.ts refresh --out data",
    "data:validate": "tsx --tsconfig packages/ingestion/tsconfig.json packages/ingestion/src/cli.ts validate data",
    "data:fixtures": "tsx --tsconfig packages/ingestion/tsconfig.json packages/ingestion/src/cli.ts fixtures",
    "data:sample": "node scripts/export-sample.mjs --from data --to app/src/data/sample",
    "probe": "tsx --tsconfig packages/ingestion/tsconfig.json packages/ingestion/src/cli.ts probe --report-dir probe-out",
    "i18n:check": "node scripts/check-i18n.mjs",
    "build:artifact": "cd app && npx expo export --platform web --output-dir dist && cd .. && node scripts/build-artifact.mjs --dist app/dist --data data --out web-artifact",
    "prove": "node scripts/prove-artifact.mjs --dir web-artifact --out prove-out",
    "check": "npm run typecheck && npm run lint && npm test && npm run golden:check && npm run i18n:check && npm run data:validate"
  }
}
```

App scripts (`app/package.json`):

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "expo lint",
    "test": "jest --ci",
    "deps": "expo install --check",
    "check": "npm run deps && npm run lint && npm run typecheck && npm test"
  },
  "jest": {
    "preset": "jest-expo",
    "moduleNameMapper": {
      "^@caa/(.*)$": "<rootDir>/../packages/$1/src",
      "^@/(.*)$": "<rootDir>/src/$1"
    }
  }
}
```

The `metro.config.js` verified in V6:

```js
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
const root = path.resolve(__dirname, '..');
config.watchFolders = [path.join(root, 'packages'), path.join(root, 'node_modules')];
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')];
config.resolver.extraNodeModules = {
  '@caa/data-schemas': path.join(root, 'packages/data-schemas/src'),
  '@caa/estimator':    path.join(root, 'packages/estimator/src'),
  '@caa/case-rules':   path.join(root, 'packages/case-rules/src'),
  '@caa/i18n-core':    path.join(root, 'packages/i18n-core/src'),
};
module.exports = config;
```

`app/tsconfig.json` `paths`:

```
"@/*":     ["./src/*"]
"@caa/*":  ["../packages/*/src"]
"zod":     ["./node_modules/zod"]    // required [V]
```

`include` adds `"../packages/*/src/**/*.ts"`.

## 5. Dependency graph and parallelism

```
WP0 ──► WP1 ──┬──► WP2 (estimator) ─────────┐
              ├──► WP3 (case-rules) ────────┤
              ├──► WP4 (i18n-core) ─────────┼──► WP6 (platform) ──► WP7 (UI kit) ──► WP8a, WP8b (screens) ──┐
              └──► WP5 (ingestion; needs WP2 fit fns at step 5; stub until then)                            │
WP9 (curated content + copy) starts after WP1, edits only data/curated/** and reviews locales after WP8 ────┤
WP10 (artifact build + Prove) starts after WP0 (hello-world), finishes after WP8 ───────────────────────────┤
WP11 (integration, CI, CODEOWNERS, README) last ◄───────────────────────────────────────────────────────────┘
```

- **Wave 1 (day 1):** WP0, alone, about 2 days.
- **Wave 2:** WP1 first, about 1 day; it publishes the frozen v1 contract. Then WP2, WP3, WP4, WP5 and WP10-hello in parallel.
- **Wave 3:** WP6 → WP7 → WP8a ∥ WP8b. WP9 runs in parallel throughout.
- **Wave 4:** WP11.

UI WPs code against `app/src/data/sample/*.json` and the golden values, so they never wait for the live pipeline.

## 6. Work packages

Every WP must, before committing:
- run its listed commands, with 0 errors;
- stay inside its directories;
- add no dependency outside §3 (anything else needs an ADR change by the owner).

Commit messages follow the repo attribution rules.

---

### WP0 — Foundation and spikes in the real repo

- **Owns:**
  - `cuban-immigration-tracker/{package.json,package-lock.json,tsconfig*.json,vitest.config.mts,eslint.config.js,.gitignore}`
  - `app/{package.json,package-lock.json,app.json,tsconfig.json,metro.config.js,eslint.config.js}`
  - skeleton files only in `packages/*/src/index.ts`, which WP1–WP5 then take over
- **Does:**
  1. `cd app && npx create-expo-app@5.0.0 . --template default@sdk-58` (SDK notes §2), or the equivalent manual setup.
  2. Strip the template: delete the native-tabs component, `expo-symbols` and icon fonts. Keep `src/app`.
  3. Set `app.json`:
     - `name "CAA Tracker"`, `slug caa-tracker`, `scheme caatracker`
     - `userInterfaceStyle automatic`
     - `web.output single`, `web.bundler metro`
     - plugins: `["expo-router", {"asyncRoutes": false}]`, `["expo-localization", {"supportedLocales": ["en","es"]}]`, `["expo-notifications", {"defaultChannel": "default"}]`
     - `experiments.typedRoutes: true`
     - `extra.data` per ARCH-5
     - `extra.minDataSchema: 1`
     - remove `web.favicon`
  4. Install §3.1 with `npx expo install`; install §3.2 at the root.
  5. Re-run spikes V1–V8 (`01` §9) inside the repo with a hello-world:
     - one `@caa/estimator` import;
     - a prelude prototype in `scripts/build-artifact.mjs`. WP10 replaces it.
  6. Add the workflow skeletons (`caa-data-refresh.yml` with the `present` guard, `caa-ci.yml` with `tools` and `app` jobs) and open a PR to `main` **containing workflow files only**, for the owner to merge (`03` §6.2).
  7. Trigger `caa-probe` manually (after the merge) or locally with `npm run probe`. Commit `data/samples/PROBE-REPORT.md`.
- **Interfaces:** none (scaffolding).
- **Acceptance:**
  - (a) `cd app && npx expo export --platform web` gives **exactly one** JS file;
  - (b) the hello-world fragment boots under the Prove harness from `/x/y/z/index.html` with the host CSP, `localStorage` throwing and `history` throwing;
  - (c) `npm run typecheck` and `cd app && npx tsc --noEmit && npx jest` pass;
  - (d) `npx expo install --check` passes;
  - (e) `PROBE-REPORT.md` exists.
- **Commands:** `npm run typecheck && npm test`; `cd app && npm run check && npx expo export -p web --output-dir dist`; `npm run build:artifact && npm run prove`.

---

### WP1 — `packages/data-schemas`

- **Owns:** `packages/data-schemas/**`, `scripts/export-schema.mjs`, `data/schema/**`.
- **Exports:**
  - Every type and zod schema in `02-data-model.md` §1–§5: `ManifestSchema`, `NationalFileSchema`, `QuarterlyFileSchema`, `OfficesFileSchema`, `PolicyFileSchema` (strict), `AlertsFileSchema` (strict), `ContentFileSchema` (strict), `EstimatorParamsSchema`, `CaseTimelineSchema`, `SharedTimelineSchema`, `CommunityFileSchema`, `ForecastLedgerEntrySchema`.
  - `FIELD_KINDS`.
  - `SCHEMA_VERSION = 1`.
  - `parseDataFile(name: DataFileName, json: unknown): { ok: true; value } | { ok: false; issues: string[] }`.
  - `validateDataDir(path)` (Node-only helper, in a separate entry `src/node.ts`, so that the app never imports `fs`).
- **Dependencies:** `zod` only.
- **Acceptance:**
  - The schemas parse the seed files that WP9 and WP5 create. Until those exist, use hand-written fixtures from `02`.
  - Every `Localized` requires both languages to be non-empty.
  - JSON Schema export is deterministic.
  - Unknown keys: strict for curated files, passthrough for pipeline files.
  - Tests cover each schema with one valid and two invalid fixtures.
- **Contract freeze:** v1 is tagged in the commit message `contract: data-schemas v1`. Later changes are **additive only** unless the owner approves.
- **Commands:** `npm run typecheck && npx vitest run packages/data-schemas && npm run schema:export -- --check`.

---

### WP2 — `packages/estimator` + `tools/oracle`

- **Owns:** `packages/estimator/**`, `tools/oracle/**`.
- **Exports** (pure, deterministic, no I/O, no `Date.now`):
  - `estimate(input: EstimateInput): EstimateResult`
  - `scenarioWeights(...)`
  - `reconstructPool(rows, beta)`
  - `fitBeta(rows)`
  - `fitObservationSigma(rows, regimes)`
  - `officeMultipliers(stats, group, k0, clamp)`
  - `projectPath(...)`
  - `mixAndCondition(...)`
  - `stateMixture(...)`
  - `structuralBand(...)`
  - `drivers(...)`
  - `lognormalCdf(t, median, sigma)`
  - `predictiveCompletions(params, months)` (for the v1.1 ledger)
  - `GOLDEN` (re-export of the golden JSON)
- **Consumes:** `@caa/data-schemas` types only. The estimator does **not** import `@caa/case-rules`. The clock and the flags live in case-rules and are passed in through `EstimateInput`, so the two packages never import each other.
- **Dependencies:** none.
- **Does:**
  1. Copy `04` Appendix A to `tools/oracle/vph1.py`.
  2. Add `golden_cases.py`, which implements every row of `04` §9 (milestone `mfun`, state mixture, structural extras, likelihood update, alert composition).
  3. `--write` emits `golden/vph1.golden.json`. `--check` recomputes and diffs with tolerance 1e-6.
  4. Port to TypeScript following EST-1…14.
  5. Cache `Math.exp` per (β, age) inside a path.
  6. The structural band and the state mixture are computed only when requested (`opts.bands`, default true in the app).
- **Acceptance:**
  - Every test in `04` §9 (T1–T32, U1, U6, U7) passes against `GOLDEN`, within 5e-4 on probabilities and exactly on quantiles.
  - The oracle `--check` passes.
  - Property tests: S is non-increasing; probabilities are in [0, 1]; posterior weights sum to 1 ± 1e-12; holds never increase adjudicable days; the same input gives byte-identical output.
  - Performance: the reference case with bands plus the FL state mixture runs in under 150 ms in Node. Record the time in the test output.
- **Commands:** `npm run typecheck && npx vitest run packages/estimator && npm run golden:check`.

---

### WP3 — `packages/case-rules`

- **Owns:** `packages/case-rules/**`.
- **Exports:**
  - `deriveFlags`
  - `adjudicableDays`
  - `clockFor(case, policy, today)` → `EstimateOk['clock']`, including `unknownChannelClocks`
  - `remedyLadder` (doc 15 §9.1 decision tree, steps 1–9)
  - `peerReasons`
  - `eadStatus`
  - `approvalCard`
  - `shareCode`, `parseShareCode`
  - `dates` helpers: `daysBetween`, `monthsBetween`, `monthsCeil`, `monthsSince`, `endOfMonth`, `addDays` — UTC-safe and timezone-free, on ISO strings
- **Dependencies:** `@caa/data-schemas` types only.
- **Acceptance:**
  - Clock tests: T11 (306/256), T19 (392), T21 (392, low confidence), T22 (622/430).
  - Gate tests:
    - I-220A, EWI and 236 → `noEstimateReason`;
    - VISA → eligible;
    - UNKNOWN → both clocks;
    - re-termination date 2026-04-24 → `reTerminationDateSuspicious`;
    - receipt after 2026-08-24 → `filedAfterRedEagle` and `redEagleAppearsInClass = false`;
    - FRP carve-out.
  - Remedy tests (RC6): on 2026-10-20 the I-485 rung is `not_yet` at MIA/HIA/KND/TAM. The ETAs follow the doc 15 §2.2 extrapolation from `inquiryDateHistory`: MIA ≈ 2028-02, HIA ≈ 2027-10, KND ≈ 2027-10/11, TAM ≈ 2027-08. The (c)(9) rung is `available` when no EAD exists. With no inquiry date, the state is `depends` with "no disponible" and no gate decision. Mandamus is soft from 24 months and strong from 36. The denial branch is covered.
  - Peer reason sets: exactly U2.
  - EAD validity:
    - issued 2025-09-15 → `5y`;
    - issued 2025-12-05 → `18m`;
    - renewal filed 2025-10-30 → `autoExtension: false`;
    - reminders at −180/−90/−30 days.
  - Approval card: `cleanRange` is null unless every basic doc is `true`; the population shares are 308/626 and 386/820; the baselines are 91.7/52.6/23.7/83.
  - Share code: no digits from the receipt, no day-level dates; it round-trips through `parseShareCode`.
- **Commands:** `npm run typecheck && npx vitest run packages/case-rules`.

---

### WP4 — `packages/i18n-core` + `scripts/check-i18n.mjs`

- **Owns:**
  - `packages/i18n-core/src/**`
  - `packages/i18n-core/locales/{es,en}/common.json`
  - `packages/i18n-core/STYLE-GUIDE.md`
  - `scripts/check-i18n.mjs`
  - It creates the **empty** namespace files listed in §2 for the other WPs.
- **Exports:**
  - `resources` (merged namespaces)
  - `fmt` (per `02` §9)
  - `probWord(p, lang)` (thresholds in `04` §8)
  - `localize(l: Localized, lang)`
  - `NAMESPACES`
  - the key type `I18nKey`
- **Dependencies:** none.
- **`check-i18n.mjs` fails on:**
  - key-set mismatch between es and en, per namespace;
  - empty strings;
  - interpolation-variable mismatch (`{x}` sets must match);
  - any `Localized` in `data/curated/**` with an empty side;
  - the words "tú", "tu caso" or "puedes" in Spanish (register guard, I18N-1), with an allowlist;
  - banned phrases: "casos como el suyo", "cases like yours", "presente ahora", "file now", "será aprobado", "inconstitucional".
- **Acceptance:**
  - `fmt` tests produce the exact strings in `02` §9 under Node and under jsdom.
  - `probWord` boundaries: 0.0499 → muy poco probable; 0.05 → poco probable; 0.2 → posible; 0.5 → probable; 0.8 → probable; 0.8001 → muy probable.
  - The check script catches seeded violations in a test fixture.
- **Commands:** `npm run typecheck && npx vitest run packages/i18n-core && npm run i18n:check`.

---

### WP5 — `packages/ingestion` + data workflows

- **Owns:**
  - `packages/ingestion/**`
  - `scripts/export-sample.mjs`
  - `data/*.json` (generated), `data/raw/**`, `data/quarantine/**`, `data/candidates/**`, `data/samples/**`
  - `/.github/workflows/{caa-data-refresh,caa-probe,caa-staleness}.yml`
- **Exports (CLI):**
  - `cli.ts refresh --out data [--only] [--dry-run] [--github-output <file>]`
  - `validate <dir>`
  - `fixtures`
  - `probe --report-dir <dir>`
  - Library: `fetchWithPolicy`, `classify`, `parseMonthlyCsv`, `parseAllForms`, `parseByOffice`, `parsePortalIndex`, `readProcessingTimes`, `runQa`, `fit`, `publish`, `decideCommit`.
- **Consumes:** `@caa/data-schemas`, `@caa/estimator` (`fitBeta`, `fitObservationSigma`, `officeMultipliers`, `scenarioWeights`, `estimate` for the canary), `@caa/case-rules` (canary flags).
- **Dependencies:** `exceljs 4.4.0`, `csv-parse 7.0.3`, `sql.js 1.14.2`, `fast-xml-parser 5.11.2`, `zod`, Node `fetch` (undici built in).
- **Does:** `03-data-pipeline.md` §2–§7 exactly.
  - Fixtures come from the mirror via `npm run data:fixtures`. raw.githubusercontent.com is reachable here: Aug 2026 CSV, FY26 Q3 workbooks, and the monthly CSVs Sep 2024 → Aug 2026.
  - A synthetic jzebedee SQLite fixture is built in the test, because GitHub release assets were not reachable from sessions (data-rigor).
  - The **first committed data** is produced by running `npm run data:refresh` locally. With uscis.gov blocked here, the mirror fallback plus the curated inputs are used, and the sources are marked accordingly.
- **Acceptance:**
  - The parser fixtures (Q2) pass.
  - The QA gate tests cover each of Q1–Q12, with a synthetic failing input.
  - Quarantine works: a failing source keeps the last good output and sets `qa.status`.
  - `decideCommit` tests: content change → commit and `dataChangedAt` bumped; no change with a heartbeat younger than 7 days → no commit; no change with a heartbeat of 7 days or more → commit with only `lastCheckedAt` changed.
  - The manifest validates with `ManifestSchema`.
  - The canary equals GOLDEN T15 on the fixture data.
  - The workflow YAML passes `actionlint` (run via `npx` if it is available from npm; otherwise a manual review against `03` §6.1).
  - A dispatch dry run succeeds on the branch.
- **Commands:** `npm run typecheck && npx vitest run packages/ingestion && npm run data:validate && npm run data:refresh -- --dry-run`.

---

### WP6 — App platform

- **Owns:**
  - `app/src/app/{_layout.tsx,+not-found.tsx,(tabs)/_layout.tsx}`
  - `app/src/{data,storage,i18n,notifications,platform}/**`
  - `app/__tests__/platform-*`
  - the locale namespace `notifications`
- **Exports:**
  - `kv` (`02` §6)
  - `useCases()` → `{ cases, active, save, remove, setActive }`
  - `useSettings()`
  - `<DataProvider>`; `useData()` → `{ status: 'live'|'cached'|'published'|'sample', guards, manifest, national, quarterly, offices, policy, alerts, content, params, refresh(): Promise<void> }`
  - `dataBaseUrl()` — native: `baseUrls[i]/ref/path`; web: `window.__CAA_DATA_BASE__ ?? './data/'`
  - `useLang()` → `{ lang, setLang }`. It persists, calls `i18n.changeLanguage` and emits to the notification reschedule.
  - `notifications.{init, scheduleCaseReminders, rescheduleAll(lang), notifyOnForeground, cancelAll}`, with web no-ops
  - `openUrl`, `share`, `copyText`, each per platform
  - `useEstimate(caseId)`: memoized `estimate()` plus `clockFor()` plus `remedyLadder()`
- **Rules:**
  - Fetch policy:
    - check at most once per 6 hours;
    - send `If-None-Match`;
    - fetch only files whose sha256 changed;
    - zod-validate every response and verify its sha256;
    - on 429, back off exponentially and honour `Retry-After`;
    - with no network, show the cached data, or the bundled sample.
  - `+not-found` renders `<Redirect href="/" />`.
  - The root `_layout` holds the splash until `kv.ready` resolves, at most 300 ms.
  - The tab layout uses icons from `@/ui/icons` (WP7; stub until it lands) and labels from i18n.
- **Dependencies:** §3.1 only.
- **Acceptance:**
  - Jest: data transitions sample → live → cached; `published` on web when `artifactBuiltAt` is set; a schema-mismatch banner keeps the old data.
  - Jest: KV web adapter with `localStorage` throwing, both getter and setItem.
  - Jest: language persistence; the default comes from the mocked `getLocales()`; changing the language triggers `rescheduleAll`.
  - Router test: an unknown path redirects to `/`.
- **Commands:** `cd app && npm run check`.

---

### WP7 — UI kit, charts, icons, theme

- **Owns:**
  - `app/src/ui/**`
  - `app/assets/**`
  - `app/__tests__/ui-*`
  - the locale namespace `common` for UI-kit-only strings, coordinated with WP4 (WP4 merges first)
- **Exports:**
  - Theme: `useTheme()` (tokens, light and dark) and `useThemeName()`. Native uses `useColorScheme` plus the setting. Web uses `document.documentElement.dataset.theme` through a MutationObserver, then `matchMedia`. The settings override is ignored on web.
  - Layout: `Screen` (`maxWidth: 560`, 16 px gutters, safe-area), `AppHeader` (title, `LangToggle`, `DataStatusChip`).
  - Components: `Card`, `Tile`, `StatTile` (renders the `FIELD_KINDS` chip), `Banner`, `Chip`, `ConfidenceChip`, `ProbabilityLadder`, `Sheet` (in-app confirm; never `confirm()`), `Button`, `FormField`, `DateField` (with day/month granularity), `Select`, `Checklist`, `TableTwin`.
  - Charts: `MonthlyChart({rows, regimes})`, `FanChart({survival, startYm})`, `RegimeStrip({clock, regimes, unknownChannelClocks?})`, `ScenarioBars`, `DriverBar`. All are react-native-svg, measure their width with `onLayout`, take axis labels from `fmt`, and each has a `TableTwin`.
  - Icons: `Icon({name, color, size})`. About 16 in-repo SVG icons.
- **Acceptance:**
  - Snapshot and render tests in both languages and both themes.
  - Charts render at 358 px and 1,000 px widths with no overflow.
  - No literal JSX strings (lint).
  - `LangToggle` has a hit area of at least 48 and the accessibility labels from `00` §5.
  - The red tone is used only through `tone="deadline"`.
- **Commands:** `cd app && npm run check`.

---

### WP8a — Screens: Home, Offices, Alerts, More, Welcome

- **Owns:**
  - `app/src/app/{welcome.tsx,(tabs)/index.tsx,(tabs)/offices/**,(tabs)/alerts/**,(tabs)/more/**}`
  - `app/src/features/{home,offices,alerts,more,welcome}/**`
  - `app/__tests__/screens-a-*`
  - locale namespaces `home`, `offices`, `alerts`, `more`, `method`, `welcome`
- **Specification:** `00-product-spec.md` S0, S1, S6, S8, S10, S11.
- **Consumes:** `useData`, `useLang`, the `fmt` helpers and the UI kit.
- **Acceptance:**
  - Every screen renders against the bundled sample in es and en, light and dark, with the loading, empty and error states.
  - Home shows the T15 data month and the "Muestra" chip in tests.
  - The Little's-law pair appears **only** on Method.
  - The approval tile always shows its baselines.
  - The litigation table renders from `policy.json`.
  - The myths render from `content.json`.
  - Settings delete runs through the `Sheet`.
- **Commands:** `cd app && npm run check`.

---

### WP8b — Screens: My case, Estimate, Peers, EAD, Remedies, Ineligible, Share

- **Owns:**
  - `app/src/app/(tabs)/case/**`
  - `app/src/features/case/**`
  - `app/__tests__/screens-b-*`
  - locale namespaces `case`, `estimate`, `peers`, `ead`, `remedies`
- **Specification:** `00-product-spec.md` S2, S3, S4, S5, S7, S9, S12.
- **Acceptance** (Jest, rendering the reference case from the sample):
  - The headline shows "9 %" in es and "9%" in en.
  - Bands "2 % y 26 %" and "4 % y 20 %".
  - Ladder 1/4/9/22/35 %.
  - Calendar row ~1 % / ~11 % / ~24 %.
  - Median "más de 4 años".
  - The phrase "casos como el suyo" is absent.
  - The approval card has no range unless every basic doc is checked.
  - The peer reasons are exactly U2.
  - Remedies: I-485 rung `not_yet` with an ETA; (c)(9) "no aplica" for the reference case (EAD received) and "disponible" for the T23 twin.
  - I-220A → S9 with no numbers anywhere.
  - "Ver un ejemplo" never writes to KV.
  - Form validation follows `00` S2.
- **Commands:** `cd app && npm run check`.

---

### WP9 — Curated content and copy

- **Owns:**
  - `data/curated/**`: `policy.json` (regimes, sub-breakpoints and alert rules from key facts §3 and `04` §6.3; litigation from key facts §9; `litigationState` as of 2026-10-20; classes; cohort; approval; EAD; PA-2026-05; fees from key facts §4; congressional offices from doc 15 §5.2).
  - `alerts/*.json`: the 12 seed alerts in `00` S8.
  - `content.json`: the myths in `00` S10 and the peer copy in `00` S4.
  - `historic_medians.json`.
  - Copy review of every locale namespace **after** the owning WP merges, via follow-up commits limited to string values (no key changes).
- **Acceptance:**
  - Strict zod validation.
  - Every date and number matches the cited research row. The PR includes a citation table of `field → doc §`.
  - `i18n:check` passes.
  - **The native Cuban-Spanish reviewer signs off**: a checkbox in the PR, with the reviewer's handle.
  - No directive or conclusory wording (`05` §5).
- **Commands:** `npm run data:validate && npm run i18n:check`.

---

### WP10 — Artifact build and Prove

- **Owns:** `scripts/build-artifact.mjs`, `scripts/prove-artifact.mjs`, and the `web` job section of `caa-ci.yml`. It coordinates the file with WP11 by keeping the job in a marked block.
- **`build-artifact.mjs` does** (contract a–i; `01` §5):
  1. Parse `dist/index.html`. Require exactly one `<script src>`. Collect the stylesheets and read the root id.
  2. Read the JS. Replace every `"/assets/<path>"` literal with a `data:` URI; fail if a file is missing or larger than 200 KB. Fail on `.ttf`, `.otf` or `.woff` references or files.
  3. Fail if any `"/_expo/"` or `"/assets/"` literal remains, or any `http(s)://` inside `src=`, `href=`, `url(` or `import(` in the HTML, CSS or JS. Allowlist: plain-text documentation URLs inside string constants. Escape `</script` as `<\/script`.
  4. Generate the known-routes regex from `app/src/app/**`: `(tabs)` groups are dropped, `[param]` becomes `[^/]+`, `index` becomes `/`. Write it to `app/src/platform/webRoutes.generated.json` and also embed it in the prelude.
  5. Emit `web-artifact/index.html`, which must be **exactly** `<title>CAA Tracker</title>\n<style>…</style>\n<div id="root"></div>\n<script>{prelude}</script>\n<script>{bundle}</script>\n`.
     - The `<style>` holds the theme tokens (light on `:root`; dark under the media query guarded by `:root:not([data-theme="light"])`, and again under `:root[data-theme="dark"]`, with `color-scheme: dark`), plus explicit `html`, `body` and `#root` backgrounds and the react-native-web reset.
     - Fail on `<!doctype`, `<html`, `<head` or `<body`.
  6. Copy the manifest and the 7 data files to `web-artifact/data/`. Set `artifactBuiltAt` and recompute the sha256 values.
  7. Print `{bytes, inlinedAssets, routes}`. Warn above 4 MB; fail at 15 MB.
- **`prove-artifact.mjs` does:** §9.
- **Dependencies:** root `@sparticuz/chromium`, `puppeteer-core`, and Node built-ins.
- **Acceptance:** §9 passes locally in this container and in CI.
- **Commands:** `npm run build:artifact && npm run prove`.

---

### WP11 — Integration, CI, governance

- **Owns:**
  - `/.github/CODEOWNERS`
  - `/.github/workflows/caa-ci.yml` (except the WP10 block)
  - `scripts/check-no-personal-files.mjs`
  - `cuban-immigration-tracker/{README.md,LICENSE}`
  - `docs/planning/adr-log.md`
  - integration fixes, made only through issues or PRs to the owning WP. A trivial fix may be made directly, with a note in `adr-log.md`.
- **Does:**
  - `caa-ci.yml` per `03` §6.3.
  - CODEOWNERS per `05` §3.1.
  - Runs the integration checklist (§7).
  - Updates the README project status, the data URLs and the artifact URL.
- **Commands:** `npm run check && (cd app && npm run check) && npm run build:artifact && npm run prove`.

## 7. Integration checklist (WP11 signs each line)

- [ ] `npm run check` and `cd app && npm run check` are green, and CI is green on the branch.
- [ ] `npm run golden:check` is green, and the TS golden tests are green (T1–T32, U1–U8).
- [ ] `npm run data:refresh` on the branch produces data that validates. `manifest.canary` equals GOLDEN T15 on the fixture data, or differs only by a documented new month.
- [ ] `npm run data:sample` has refreshed `app/src/data/sample/`. The app shows "Muestra" offline, "En vivo" with the branch `ref`, and "Guardado" when the network is cut after one fetch.
- [ ] Native (Expo Go SDK 58, or a dev build):
  - [ ] one iOS and one Android device: all tabs, the reference case, the language toggle (strings, dates, numbers and chart labels switch with no restart), notifications scheduled and rescheduled on language change, "Borrar mis datos".
  - [ ] Font scale 200 % with no clipping of critical text.
  - [ ] Screen-reader labels on the toggle, the chips and the chart table twins.
- [ ] `npm run build:artifact` gives one fragment under 4 MB, and `npm run prove` passes every assertion in §9.
- [ ] The workflow is on `main`. A scheduled run has committed on `main`. The `notify` job opened the "Republish" issue in a test with an injected `new_month`. The heartbeat logic has been verified with `--dry-run`.
- [ ] The Spanish reviewer's sign-off is recorded. The `i18n:check` register guard is clean.
- [ ] Privacy:
  - [ ] the app makes no network calls other than the data URLs (proxy log on device or the Prove request list);
  - [ ] the privacy page and disclaimers are present in both languages.
- [ ] The owner has been told about the four public personal PDFs (`05` §2), and their decision is recorded in `adr-log.md`.
- [ ] The artifact is published (republish runbook, `03` §9), and its URL is in the README.

## 8. Spanish style guide (ADR-I18N-1; `packages/i18n-core/STYLE-GUIDE.md`)

- **Register.** Use **usted** forms ("su caso", "puede presentar", "consulte").
- **Terminology.** Follow doc 15 §8 and key facts §10:
  - "Ley de Ajuste Cubano"
  - "permiso de trabajo (c)(9)"
  - "consulta de caso fuera del tiempo normal de procesamiento"
  - "procesamiento expedito"
  - "Solicitud de Evidencia (RFE)"
  - "Notificación de Intención de Denegar (NOID)"
  - "deportación acelerada"
  - "Centro de Contacto de USCIS (oprima 2)"
- **Banned wording:** "casos como el suyo", "será aprobado", "presente ahora", "debe demandar", "inconstitucional", "garantizado". Use "puede…" plus "consulte a un abogado o representante acreditado" on legal rungs.
- **Numbers.** Write them with `fmt` only. Never type literal percentages or dates in JSON: use interpolation `{p}`, `{fecha}`.
- **Tone.** Calm. Avoid alarm words for routine waiting. For deadlines, give the date and the action ("vence el {fecha}").
- **Review.** A native Cuban-Spanish reviewer checks every string, data-file `Localized` field, notification template and disclaimer before release.

## 9. Prove: assertions (`scripts/prove-artifact.mjs`)

**Harness:**
- Wrap the fragment in the host-like skeleton: `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>*,*::before,*::after{box-sizing:border-box}body{margin:0;font:14px system-ui,sans-serif}</style></head><body>{fragment}</body></html>`.
- Serve it from a Node `http` server at `/x/<random>/z/index.html`.
- Serve `data/` beside it.
- Set the header `Content-Security-Policy: default-src 'none'; script-src 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net/npm/ https://unpkg.com; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'`.
- Browser: `@sparticuz/chromium` + `puppeteer-core`, headless, `--no-sandbox`.
- Write a JSON report and screenshots to `prove-out/`.

| # | Assertion |
|---|---|
| P1 | Boots at 390×844 and 1280×800: the header, `LangToggle` and status chip are visible within 10 s |
| P2 | After boot `location.pathname === '/'` (guard) and the data request URL is `/x/<random>/z/data/manifest.json` (captured base) |
| P3 | The **only** network requests are the page and `…/data/*.json`. CSP violations = 0 (`securitypolicyviolation` listener) |
| P4 | Console errors = 0. The sample variant allows only the expected 404 resource line for `manifest.json` |
| P5 | All 5 tabs and one deep screen per tab (offices/[code], alerts/[id], case/peers, more/method) render without an error boundary |
| P6 | Language: tap the toggle and check, in es ↔ en: tab labels ("Inicio" ↔ "Home"), a date ("20 oct 2026" ↔ "Oct 20, 2026"; fixed clock injected via `Date` override = 2026-10-20T12:00:00Z), a percent ("9 %" ↔ "9%"), a chart axis label, the disclaimer. Reload → the language persists, or falls back to the default when `localStorage` throws |
| P7 | Estimator: "Ver un ejemplo" (reference case) shows the headline with "9" and bands "2"–"26", clock "306" |
| P8 | Data status: with `data/` → chip "Publicado …" plus "ago 2026"; without `data/` → "Muestra" |
| P9 | `localStorage` getter throws → P1, P5, P6 and P7 still pass |
| P10 | `History.prototype.pushState/replaceState` throw → P1 and P5 still pass |
| P11 | Theme: set `data-theme="dark"` and `"light"` at runtime → the computed `body` and `#root` backgrounds match the tokens; `prefers-color-scheme: dark` emulation with no attribute → dark |
| P12 | Layout: at 390 px, `document.documentElement.scrollWidth ≤ 390`; at 1280 px the content column is centred with width ≤ 560 px + gutters |
| P13 | No `alert`, `confirm`, `prompt`, `print` or `window.open` calls (stubs that record calls) during the full run |
| P14 | Fragment checks: it starts with `<title>CAA Tracker</title>`; no doctype, html, head or body; exactly 2 `<script>` tags; size < 15 MB |

## 10. Rules for agents (process)

1. **Branch.** Work on `claude/cuban-immigration-tracker-b6y4b1`, never `main`. The only exception is the workflow-only PR, which the owner merges.
2. **Ownership.** Write only inside your WP's directories (§2, §6). If you need a change elsewhere, open an issue titled `[WPn → WPm] …`, or leave a TODO in your own code with a stub.
3. **Contract changes.** Changes to `packages/data-schemas` go through WP1, are additive, and are announced in the commit message (`contract: …`). Changes to an estimator ADR or golden value need an owner-approved edit to `04-estimation-model.md`, then `golden:write` and the review.
4. **Facts.** Never invent an endpoint, number or date. Every fact in code or copy cites a `docs/research` section in a comment or in the curated file's `source` field. Uncertain facts keep their tag ([T], [U]) and their UI caveat.
5. **No personal data.** No personal data in commits, fixtures or logs. Use only synthetic receipts (`IOE0000000000`), and use the reference case only as specified.
6. **Verify before committing.** Run the WP's commands. Commit small, coherent changes with messages `wpN: …`.
7. **Local web export.** Use `EXPO_OFFLINE=1` when exporting in the sandbox.
