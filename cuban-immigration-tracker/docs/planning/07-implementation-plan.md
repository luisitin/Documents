# 07 — Implementation plan for autonomous agents (final)

Written 2026-10-20. This is **the** build plan. It assumes the agents have read:

- `00-product-spec.md` (what to build)
- `01-architecture.md` (shape)
- `02-data-model.md` (types)
- `03-data-pipeline.md` (ingestion)
- `04-estimation-model.md` (estimator ADRs and golden values)
- `05-privacy-security-legal.md` (rules)

Every work package (WP) owns **disjoint directories**. A WP may read anything but writes only inside its own directories. Contract changes go through the WP1 owner (§10).

**Declared ownership exceptions (the only ones):**
1. **WP0 workflow skeletons.** WP0 writes first, minimal versions of the four `.github/workflows/caa-*.yml` files (WP0 step 6) and hands them over in one commit titled `handoff: workflow skeletons → WP5 (refresh, probe, staleness), WP11 (ci), WP10 (ci web block)`. After that commit WP0 never touches them.
2. **WP0 package stubs.** WP0 writes `packages/*/src/index.ts` stubs; WP1 replaces them in the `contract: v1` commit with the exact signatures of §6.0, and WP2–WP5 then own their packages.
3. **WP9 copy edits.** After a namespace's owning WP has merged, WP9 may edit **string values only** in that namespace (no key additions, removals or renames), in follow-up commits titled `wp9: copy <namespace>`, one namespace per commit, never while the owner WP has an open change to that file. `i18n:check` must pass on every such commit.

## 1. Architecture decisions (ADRs) that bind every WP

| ADR | Decision | Evidence |
|---|---|---|
| **ARCH-1 Layout** | No npm workspaces. There are two npm packages: (a) the **root tooling package** `cuban-immigration-tracker/package.json` (Node ≥ 22.13: vitest, tsx, zod, ingestion deps, Prove deps) and (b) the **Expo app** `cuban-immigration-tracker/app/package.json`. Pure libraries live in `packages/*/src` as **source-only TypeScript**. They have no `package.json` dependencies and may import only `zod` and sibling `@caa/*`. The app consumes them through Metro `watchFolders` plus tsconfig `paths`; tools consume them through tsconfig `paths` and `tsx --tsconfig`. `zod` is pinned to the **same exact version** in both npm packages, and inside `app/` it always resolves to `app/node_modules/zod` (Jest `moduleNameMapper`, a Metro `resolveRequest` that resolves `zod` from the app root, tsconfig `paths`; §4), so the bundle holds exactly one zod | spikes V6–V8 [V]; critic review 2026-10-20 |
| **ARCH-2 Storage** | One KV interface. Native: `@react-native-async-storage/async-storage@2.2.0`, hydrated into a memory mirror. Web: our own guarded `localStorage` plus memory. No expo-sqlite, MMKV or TanStack Query in the MVP | `02` §6 |
| **ARCH-3 Lean bundle** | Forbidden in `app/`: `expo-sqlite`, `expo-symbols`, `@expo/vector-icons`, `expo-font`, `react-native-gifted-charts`, `victory-native`, `@shopify/react-native-skia`, `react-native-mmkv`, `date-fns`, `moment`, `lodash`, `@tanstack/react-query`. Charts and icons use `react-native-svg` only. ESLint `no-restricted-imports` enforces this for **direct imports only**: `expo@58.0.16` itself depends on `expo-font ~58.0.9` [V], so `expo-font` stays in `node_modules`; agents must not try to remove it | contract (b), (g) |
| **ARCH-4 Single web bundle** | `app.json`: `"web": { "output": "single", "bundler": "metro" }`; plugin `["expo-router", { "asyncRoutes": false }]` | V1/V2 [V] |
| **ARCH-5 Data hosting** | `luisitin/Documents` (public) under `cuban-immigration-tracker/data/`. Native base URLs come from `app.json` `extra.data = { baseUrls: ["https://raw.githubusercontent.com/luisitin/Documents"], ref: "main", path: "cuban-immigration-tracker/data" }`. Preview builds override `ref` | `01` §7 |
| **ARCH-6 Commit policy** | Commit when content changes (bumps `dataChangedAt`) or for a 7-day heartbeat (bumps `lastCheckedAt`). Data paths only | `03` §6.1 |
| **WEB-1 Prelude** | The prelude is the first statement of the fragment's single inline `<script>`, wrapped in its own try/catch IIFE. It captures `window.__CAA_DATA_BASE__`, installs a try/catch history shim, and replaces an unknown path with `/` — in that order and before the bundle. The data layer on web uses only `window.__CAA_DATA_BASE__` (fallback `./data/`) | V3/V4 [V] |
| **WEB-2 Prove browser** | Prove uses `@sparticuz/chromium@153.0.0` plus `puppeteer-core`, both from registry.npmjs.org. `executablePath()` extracts `/tmp/chromium`. No system browser and no Playwright CDN | V5 [V] |
| **I18N-1 Register** | Spanish uses **usted** throughout: UI, data files, notifications, disclaimers. Doc 16 §8.4's tú copy is converted. The style guide is §8 | must-fix |
| **I18N-2 Formatting** | Deterministic `fmt` in `packages/i18n-core`; no `Intl` in the output path | `02` §9 |
| **I18N-3 Namespaced locales** | `packages/i18n-core/locales/{es,en}/<namespace>.json`. Each WP owns its namespaces: `common` → WP4 (shared words: months, units, disclaimers), `ui` → WP7 (UI-kit strings: LangToggle, DataStatusChip, Sheet, TableTwin, chart labels), `notifications` → WP6, screen namespaces → WP8a/WP8b. No namespace has two writers (WP9 values-only exception above) | avoids merge conflicts between parallel agents |
| **EST-1…14** | The estimator spec and the golden file | `04` §2, §4 |

## 2. Repository layout (exact)

```
/home/user/Documents/                          ← git root = luisitin/Documents (public; default branch main)
├── .github/
│   ├── CODEOWNERS                             ← WP11
│   └── workflows/                             ← GitHub reads workflows ONLY here (not cuban-immigration-tracker/.github)
│       ├── blank.yml                          (existing; untouched)
│       ├── caa-data-refresh.yml               ← WP5 (03 §6.1)            (WP0 skeleton → handoff)
│       ├── caa-ci.yml                         ← WP11 (03 §6.3; WP10 owns the marked `web` block)  (WP0 skeleton → handoff)
│       ├── caa-probe.yml                      ← WP5 (03 §6.4)            (WP0 skeleton → handoff)
│       └── caa-staleness.yml                  ← WP5 (03 §6.5)            (WP0 skeleton → handoff)
└── cuban-immigration-tracker/
    ├── README.md  LICENSE                     ← WP11 (README records the artifact URL)
    ├── package.json  package-lock.json        ← WP0 (root tooling; scripts in §4)
    ├── tsconfig.base.json                     ← WP0 (strict; paths @caa/* → packages/*/src)
    ├── tsconfig.json                          ← WP0 (tools typecheck: packages/**, scripts/**, tools/**)
    ├── vitest.config.mts  eslint.config.mjs   ← WP0
    ├── .gitignore                             ← WP0 (node_modules, app/dist, web-artifact, .expo, app/expo-env.d.ts, prove-out)
    ├── packages/
    │   ├── data-schemas/   src/{index,primitives,national,quarterly,offices,policy,alerts,content,params,manifest,case,community,ledger,fieldKinds,validate}.ts
    │   │                   src/node.ts (entry `@caa/data-schemas/node`: validateDataDir; Node only, never imported by app/)
    │   │                   test/*.vitest.ts  test/fixtures/{valid,invalid}/  test/fixtures/sample-handbuilt/*.json   README.md   ← WP1
    │   ├── estimator/      src/{index,pool,beta,office,project,mix,quantiles,milestones,stateMix,structural,weights,drivers,lognormal,guards}.ts
    │   │                   src/golden.ts (entry `@caa/estimator/golden`, test-only; never imported by app/ code)
    │   │                   golden/vph1.golden.json   test/*.vitest.ts                      ← WP2
    │   ├── case-rules/     src/{index,flags,clock,remedies,peers,ead,approval,share,dates}.ts  test/*.vitest.ts   ← WP3
    │   ├── i18n-core/      src/{index,fmt,words,keys}.ts  locales/{es,en}/{common,ui,home,case,estimate,peers,ead,remedies,offices,alerts,more,method,notifications,welcome}.json
    │   │                   test/*.vitest.ts   STYLE-GUIDE.md                                ← WP4 (common, structure); namespaces per §6
    │   └── ingestion/      src/{cli,http,classify,raw,qa,fit,publish,commitPolicy}.ts  src/sources/{monthlyCsv,quarterlyAllForms,i485ByOffice,portalIndex,processingTimes,federalRegister,uscisRss,courtListener,curated}.ts
    │                       src/probe/{index,probes/*}.ts   test/{*.vitest.ts,fixtures/}   tsconfig.json   ← WP5
    ├── tools/oracle/       vph1.py (Appendix A core)  golden_cases.py (ENTRY POINT; sys.path fix)  README.md   ← WP2
    ├── scripts/            build-artifact.mjs  prove-artifact.mjs                          ← WP10
    │                       check-i18n.mjs                                                  ← WP4
    │                       export-sample.mjs  export-schema.mjs                            ← WP5 / WP1
    │                       check-no-personal-files.mjs                                     ← WP11
    ├── data/               (02 §2) generated: WP5 · curated/**: WP9 · samples/** (probe report): WP5
    ├── app/                                                                                 (Expo SDK 58)
    │   ├── package.json  package-lock.json  app.json  tsconfig.json  metro.config.js  eslint.config.js   ← WP0
    │   ├── assets/         icon.png adaptive-icon*.png splash-icon.png (no fonts)          ← WP7
    │   ├── src/app/                                                    ← routes only (thin wrappers)
    │   │   ├── _layout.tsx (root Stack: `(tabs)`, `welcome` presentation modal, `+not-found`)  +not-found.tsx  (tabs)/_layout.tsx  ← WP6
    │   │   │      (tabs)/_layout.tsx declares EXACTLY five <Tabs.Screen name=…>: `index`, `case`, `offices`, `alerts`, `more`
    │   │   ├── welcome.tsx  (tabs)/index.tsx  (tabs)/offices/{_layout,index,[code]}.tsx     ← WP8a   (offices/_layout = Stack)
    │   │   ├── (tabs)/alerts/{_layout,index,[id]}.tsx  (tabs)/more/{_layout,index,settings,method,myths,glossary,about,privacy}.tsx  ← WP8a   (alerts/_layout = Stack)
    │   │   └── (tabs)/case/{_layout,index,edit,peers,ead,remedies,ineligible,share}.tsx     ← WP8b
    │   ├── src/features/   home/ offices/ alerts/ more/ welcome/  ← WP8a    case/ ← WP8b
    │   ├── src/data/       DataProvider.tsx useData.ts fetchers.ts baseUrl.ts baseUrl.web.ts hostRefresh.ts (native no-op) hostRefresh.web.ts  ← WP6
    │   ├── src/data/sample/*.json   (bundled sample = frozen golden snapshot, 02 §2)    ← WP5 (written only by `npm run data:sample`)
    │   ├── src/storage/    kv.ts kv.native.ts kv.web.ts cases.ts settings.ts               ← WP6
    │   ├── src/i18n/       index.ts useLang.ts                                             ← WP6
    │   ├── src/notifications/ index.ts index.native.ts index.web.ts schedule.ts           ← WP6
    │   ├── src/platform/   openUrl.ts openUrl.web.ts share.ts share.web.ts clipboard.ts clipboard.web.ts  ← WP6
    │   │                   (each base `.ts` file holds the shared types and the native implementation — or a native no-op for
    │   │                    clipboard — so `tsc --noEmit` resolves `@/platform/x` without `moduleSuffixes`, and Metro picks `.web.ts` on web.
    │   │                    Shared code never imports a `.web.ts` path directly.)
    │   ├── src/ui/         theme.ts useThemeName.ts useThemeName.web.ts layout/ components/ charts/ icons/   ← WP7
    │   └── __tests__/      platform-*  ← WP6 · ui-*  ← WP7 · screens-a-* ← WP8a · screens-b-* ← WP8b
    ├── web-artifact/       (git-ignored build output: index.html + data/ ; .build/routes.json = the known-routes list, WP10, never imported by app code)
    └── docs/               research/ planning/  (unchanged by WPs except planning/adr-log.md ← WP11)
```

## 3. Pinned versions

### 3.1 App (install only with `npx expo install`, which writes these ranges; SDK notes §1)

| Group | Packages |
|---|---|
| Core | `expo ~58.0.16`, `react 19.3.0`, `react-dom 19.3.0`, `react-native 0.88.0`, `react-native-web ~0.21.4` [V], `expo-system-ui ~58.0.6` (needed on Android for `userInterfaceStyle: automatic`; matches `bundledNativeModules.json` [V critic]) |
| Router | `expo-router ~58.0.24`, `expo-linking ~58.0.13`, `expo-constants ~58.0.12`, `expo-status-bar ~58.0.3`, `expo-splash-screen ~58.0.10`, `react-native-screens ~4.30.0`, `react-native-safe-area-context ~5.10.1`, `react-native-reanimated 4.7.1`, `react-native-worklets 0.13.0`, `react-native-gesture-handler ~3.3.0` |
| Features | `expo-localization ~58.0.5`, `expo-notifications ~58.1.5`, `expo-device ~58.0.5`, `react-native-svg 15.16.0`, `@react-native-async-storage/async-storage 2.2.0` |
| JS | `i18next ^26.5.3`, `react-i18next ^17.1.0`, `zod 4.6.5` (exact, identical to root) |
| Dev | `typescript ~6.0.3`, `@types/react ~19.3.0`, `jest ^30.5.2`, `jest-expo ~58.0.11`, `@types/jest ^30.0.0`, `@testing-library/react-native ^14.1.0`, `eslint 9.39.5`, `eslint-config-expo ~58.0.4` (this brings `eslint-plugin-react`, used for `react/jsx-no-literals` [V present]) |
| Dev-build profile only | `expo-dev-client ~58.0.14` (the **default** device path until SDK 58 Expo Go is in the stores; `01` R3) |

**Age exception (explicit).** The Expo SDK packages are 1–5 days old today (`expo 58.0.16` and `expo-router 58.0.24` were published 2026-10-19). That breaks the ≥ 14-day rule but is unavoidable, because `npx expo install` writes them. This is the only exception.

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
| `typescript` | `6.0.3` | exact (2026-04-16); same major as the app; npm `latest` is 7.x, so the pin must stay explicit. `typescript-eslint` requires `<6.1.0` |
| `vitest` | `5.0.3` | 2026-09-30 (5.0.5 is only 5 days old) [V npm 2026-10-20] |
| `zod` | `4.6.5` | 2026-09-13; identical to the app (4.6.7 is only 8 days old) [V npm] |
| `tsx` | `4.23.15` | [V] |
| `exceljs` | `4.4.0` | |
| `csv-parse` | `7.0.3` | |
| `sql.js` | `1.14.2` | 1.15.x is < 14 days old |
| `fast-xml-parser` | `5.11.2` | |
| `@sparticuz/chromium` | `153.0.0` | [V] |
| `puppeteer-core` | `25.12.0` | 2026-09-23. Spike V5 ran **25.15.0** (published 2026-10-20, too new to pin); 25.12.0 was never run here, so **WP0 acceptance (f)** launches it with Chromium 153 before anything depends on it. If it fails, WP0 records the fallback (25.13.0, 2026-10-08, after 2026-10-22) in `adr-log.md` |
| `@types/node` | `22.x` latest ≥ 14 days | |
| `eslint` | `9.39.5` | 2026-07-10 |
| `typescript-eslint` | `8.71.1` | 2026-10-05; peer `eslint ^9`, `typescript >=4.8.4 <6.1.0` [V npm]. 8.72.0 (2026-10-19) is too new. Needed because ESLint 9 flat config cannot parse `.ts` on its own |
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
    "golden:check": "python3 -I tools/oracle/golden_cases.py --check packages/estimator/golden/vph1.golden.json",
    "golden:write": "python3 -I tools/oracle/golden_cases.py --write packages/estimator/golden/vph1.golden.json",
    "schema:export": "tsx --tsconfig tsconfig.json scripts/export-schema.mjs",
    "data:refresh": "tsx --tsconfig packages/ingestion/tsconfig.json packages/ingestion/src/cli.ts refresh --out data",
    "data:validate": "tsx --tsconfig packages/ingestion/tsconfig.json packages/ingestion/src/cli.ts validate data",
    "data:fixtures": "tsx --tsconfig packages/ingestion/tsconfig.json packages/ingestion/src/cli.ts fixtures",
    "data:sample": "node scripts/export-sample.mjs --from data --to app/src/data/sample",
    "probe": "tsx --tsconfig packages/ingestion/tsconfig.json packages/ingestion/src/cli.ts probe --report-dir probe-out",
    "i18n:check": "node scripts/check-i18n.mjs",
    "build:artifact": "node scripts/build-artifact.mjs --app app --data data --out web-artifact",
    "prove": "node scripts/prove-artifact.mjs --dir web-artifact --out prove-out --variant both",
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
      "^@caa/estimator/golden$": "<rootDir>/../packages/estimator/src/golden",
      "^@caa/(.*)$": "<rootDir>/../packages/$1/src",
      "^@/(.*)$": "<rootDir>/src/$1",
      "^zod$": "<rootDir>/node_modules/zod",
      "^zod/(.*)$": "<rootDir>/node_modules/zod/$1"
    }
  }
}
```

The `metro.config.js` (V6 config, amended 2026-10-20 so that package files cannot pick up the root `node_modules/zod`):

```js
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
const root = path.resolve(__dirname, '..');
config.watchFolders = [path.join(root, 'packages')];          // root node_modules is NOT watched or resolved
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')];
// zod is resolved as if imported from app/, so files under ../packages never pick up ../node_modules/zod.
// (Not disableHierarchicalLookup: that would also break npm's nested node_modules inside app/.)
config.resolver.resolveRequest = (context, moduleName, platform) =>
  moduleName === 'zod' || moduleName.startsWith('zod/')
    ? context.resolveRequest({ ...context, originModulePath: path.join(__dirname, 'package.json') }, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
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

`include` adds `"../packages/*/src/**/*.ts"`, `".expo/types/**/*.ts"` and `"expo-env.d.ts"` (typed routes; generated by `npx expo customize tsconfig.json` in CI, SDK notes §8).

**Root `eslint.config.mjs` (WP0; ESM, so it works whatever the root `package.json` `type` is):**

```js
import tseslint from 'typescript-eslint';
export default tseslint.config(
  { ignores: ['**/node_modules/**', 'app/**', 'web-artifact/**', 'data/**'] },
  ...tseslint.configs.recommended,
  { files: ['packages/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: [
      { group: ['react', 'react/*', 'react-native', 'react-native/*', 'expo', 'expo-*', '@expo/*'], message: 'packages/* are pure: no React/Expo (ARCH-1)' },
      { group: ['fs', 'node:*', 'path'], message: 'Node built-ins only in src/node.ts or packages/ingestion' } ] }] } },
  { files: ['packages/ingestion/**/*.ts', 'packages/data-schemas/src/node.ts', 'scripts/**', 'tools/**'], rules: { 'no-restricted-imports': 'off' } },
);
```

The app keeps its own `app/eslint.config.js` (`eslint-config-expo` + ARCH-3 bans + `react/jsx-no-literals`), run by `expo lint`.

## 5. Dependency graph and parallelism

```
WP0 ──► WP1 (contract v1 + hand-built sample G0) ──┬──► WP2 (estimator) ───────────┐
                                                   ├──► WP3 (case-rules) ──────────┤
                                                   ├──► WP4 (i18n-core) ───────────┤
                                                   ├──► WP5 (ingestion; WP2 fit fns at step 5; stubs until then) ──► G1 seed sample
                                                   ├──► WP9 curated stub (policy regimes/scenarios/alertRules) ──► G1
                                                   └──► WP6 ∥ WP7 ∥ WP8a ∥ WP8b against §6.0 stubs + G0 sample
G1 seed sample (end of Wave 2) ──► gate for WP6 acceptance, WP8 acceptance, WP10 full Prove
WP10 (artifact build + Prove) starts after WP0 (hello-world), finishes after WP8
WP11 (integration, CI, CODEOWNERS, README) last
```

**Gates (named deliverables):**
- **G0 hand-built sample (WP1, in the `contract: v1` commit).** `packages/data-schemas/test/fixtures/sample-handbuilt/*.json`: the 7 files plus a manifest, built by hand from `04` Appendix A's 24 monthly rows, the key-facts §3 regimes, the `04` §6.1 scenarios, the FL-4 office rows of `04` §5.3 and an empty alert list. It validates with the v1 schemas. WP5 copies it into `app/src/data/sample/` in its first commit (WP5 owns that directory), so UI WPs can start immediately.
- **G1 seed sample (WP5, end of Wave 2).** Requires WP9's **curated stub** (`data/curated/policy.json` with regimes, sub-breakpoints, scenarios and alert rules, plus an empty `alerts/` and a minimal `content.json`) and WP2's fit functions. WP5 runs `npm run data:refresh` on the mirror fixtures, then `npm run data:sample`. The result replaces G0 in `app/src/data/sample/` and is the **frozen golden snapshot** (`dataThrough 2026-08`, `02` §2). Check: the canary in the sample manifest equals GOLDEN T15.
- **G2 contract v1** = WP1's commit containing every signature in §6.0. All parallel WPs code against it.

**Waves:**
- **Wave 1 (day 1):** WP0, alone, about 2 days.
- **Wave 2:** WP1 first, about 1 day (G2 + G0). Then WP2, WP3, WP4, WP5, WP9 (curated stub first), WP10-hello in parallel. Wave 2 ends with G1.
- **Wave 3:** WP6, WP7, WP8a and WP8b start **in parallel** against the §6.0 signatures, with temporary local stubs for hooks and kit components they do not own (a stub lives only in the consumer's own `__tests__` mocks, never in the owner's directory). Merge order: WP6 and WP7 first, then WP8a and WP8b rebase onto them. WP9 copy review follows each merge.
- **Wave 4:** WP11.

UI WPs code against `app/src/data/sample/*.json` (G0, then G1) and the golden values, so they never wait for the live pipeline.

## 6. Work packages

Every WP must, before committing:
- run its listed commands, with 0 errors;
- stay inside its directories;
- add no dependency outside §3 (anything else needs an ADR change by the owner).

Commit messages follow the repo attribution rules.

### 6.0 Frozen cross-WP contracts (contract v1)

WP1 writes the **package** signatures as `packages/*/src/index.ts` stubs (bodies `throw new Error('not implemented')`) in the `contract: v1` commit; the owning WPs then fill them in. The **app-side** signatures (WP6 hooks, WP7 kit) are binding on WP6 and WP7, which commit their own typed stubs on the first day of Wave 3, before anything else. Types not defined here are the ones in `02-data-model.md`. Changes after the freeze are additive only (§10 rule 3). The UI hooks and kit props are listed so that WP6, WP7, WP8a and WP8b can work in parallel.

```ts
// ── @caa/data-schemas (WP1) ───────────────────────────────────────────────────────────────
export type Result<T> = { ok: true; value: T } | { ok: false; issues: string[] };
export const SCHEMA_VERSION: 1;
export function parseDataFile<N extends DataFileName>(name: N, json: unknown): Result<DataFileMap[N]>;
export function parseManifest(json: unknown): Result<Manifest>;
export function parseCase(json: unknown): Result<CaseTimeline>;              // 02 §8 rules, including the cardExpiry / parole exemptions
export const FIELD_KINDS: Record<string, { kind: StatisticKind; population: 'all_cuban_i485' | 'completed' | 'pending' | 'office_humanitarian' | 'i765_all'; unit: 'cases' | 'months' | 'share' | 'date' }>;
// '@caa/data-schemas/node' (src/node.ts — Node only)
export function validateDataDir(dir: string): Promise<{ ok: boolean; issues: Record<string, string[]> }>;

// ── @caa/estimator (WP2) — pure; no I/O; never reads a clock ─────────────────────────────
export type ScenarioId = 'S0' | 'S1' | 'S2' | 'S3';
export interface Vintage { label: string; age: number; n: number }           // 'legacy>6mo' | 'legacy<6mo' | YearMonth | `f${k}`
export interface Path { sid: ScenarioId; betaMult: number; officeMult: number; extraMult: number; prior: number; S: number[] }   // S[0..H]
export function estimate(input: EstimateInput): EstimateResult;                 // 02 §4 (input carries clock, quarterly, data, today)
export function reconstructPool(rows: MonthlyRow[], beta: number): { pool: Vintage[]; scales: number[]; sse?: number };
export function fitBeta(rows: MonthlyRow[]): EstimatorParams['beta'];
export function fitObservationSigma(rows: MonthlyRow[], regimes: Regime[]): number;   // SD of Δln C over consecutive non-hold months; floor 0.25
export function officeMultipliers(stats: OfficeQuarterStat[], group: string[], kappaOffice: number, clamp: [number, number]): EstimatorParams['officeMultipliers'];
export function scenarioWeights(policy: PolicyFile, alerts: AlertsFile, observed: MonthlyRow[], flags: DerivedFlags | null,
  observation: EstimatorParams['observation'], today: ISODate): { weights: Record<ScenarioId, number>; trace: EstimateOk['weightTrace'] };
export function completionsPath(def: ScenarioDef, offset: number): (k: number) => number;   // 04 §6.1; offset = months(anchorMonth → dataThrough)
export function projectPath(a: { pool: Vintage[]; vintage: string; beta: number; completions: (k: number) => number; multiplier: number;
  H: number; kOrigin: number; receipts: number; milestoneMult?: (t: number) => number }): number[];        // 04 §3.3
export function mixAndCondition(paths: Path[], kOrigin: number): { S: number[]; posterior: number[] };     // S = S_c(0..72); EST-6
export function stateMixture(perOffice: { code: string; pending: number; paths: Path[] }[], kOrigin: number): { S: number[]; weights: Record<string, number> };   // 04 §5.3
export function structuralBand(runP12: (extraMult: number) => number, hasEad: boolean): [number, number];  // extremes {0.5,2} or {0.45,2.4}
export function drivers(paths: Path[], posterior: number[], kOrigin: number, horizon: 12): { scenario: number; beta: number; office: number };
export function quantile(S: number[], q: number): number | null;                // EST-8
export function lognormalCdf(t: number, median: number, sigma: number): number;
export function predictiveCompletions(params: EstimatorParams, policy: PolicyFile, months: number):
  { ym: YearMonth; components: { sid: ScenarioId; weight: number; mu: number; sigma: number }[] }[];   // v1.1 ledger
// '@caa/estimator/golden' (src/golden.ts — tests only; Metro never sees it from app code)
export const GOLDEN: Record<string, unknown>;

// ── @caa/case-rules (WP3) — signatures of 02 §5, plus: ───────────────────────────────────
export function clockFor(c: CaseTimeline, policy: PolicyFile, today: ISODate): EstimateOk['clock'];
export function remedyEta(h: OfficesFile['inquiryDateHistory'][number], receipt: ISODate): { etaDate: ISODate; etaMonth: YearMonth } | null;
export const dates: { daysBetween(a: ISODate, b: ISODate): number; monthsBetween(a: YearMonth, b: YearMonth): number; monthsCeil(days: number): number;
  monthsSince(days: number): number; endOfMonth(ym: YearMonth): ISODate; addDays(d: ISODate, n: number): ISODate; ym(d: ISODate): YearMonth };

// ── @caa/i18n-core (WP4) ─────────────────────────────────────────────────────────────────
export type Namespace = 'common' | 'ui' | 'home' | 'case' | 'estimate' | 'peers' | 'ead' | 'remedies' | 'offices' | 'alerts' | 'more' | 'method' | 'notifications' | 'welcome';
export const NAMESPACES: readonly Namespace[];
export const resources: Record<Lang, Record<Namespace, Record<string, string>>>;
export type I18nKey = `${Namespace}:${string}`;
export interface Fmt { int(n: number): string; dec(n: number, dp: number): string; pct(p: number): string; date(d: ISODate): string;
  month(ym: YearMonth): string; monthLong(ym: YearMonth): string; relative(hours: number): string }
export function createFmt(lang: Lang): Fmt;                                     // 02 §9; no language-less fmt exists
export function probWord(p: number, lang: Lang): string;                        // 04 §8 thresholds
export function localize(l: Localized, lang: Lang): string;

// ── app platform (WP6) ───────────────────────────────────────────────────────────────────
export type Settings = { lang: Lang; theme: 'system' | 'light' | 'dark'; onboardingDone: boolean; disclaimerVersion: number; discreet: boolean;
  notifications: { enabled: boolean; dataMonths: boolean } };                  // 02 §6
export function useSettings(): { settings: Settings; update(patch: Partial<Settings>): void };
export function useCases(): { cases: CaseTimeline[]; active: CaseTimeline | null; save(c: CaseTimeline): Result<CaseTimeline>;
  remove(localId: string): void; setActive(localId: string): void; clearAll(): Promise<void> };   // ≤ 3 cases; clearAll = "Borrar mis datos"
export function useLang(): { lang: Lang; setLang(l: Lang): void; t: (key: I18nKey, vars?: Record<string, string | number>) => string; fmt: Fmt };
export type DataStatus = 'live' | 'cached' | 'published' | 'sample';
export function useData(): { status: DataStatus; guards: EstimateOk['guards']; manifest: Manifest; national: NationalFile; quarterly: QuarterlyFile;
  offices: OfficesFile; policy: PolicyFile; alerts: AlertsFile; content: ContentFile; params: EstimatorParams;
  asOf: { latestOfficialMonth: YearMonth; dataChangedAt: ISODateTime; artifactBuiltAt?: ISODateTime }; refreshing: boolean; refresh(): Promise<void> };
export function useEstimate(caseIdOrExample: string | 'example'): { flags: DerivedFlags | null; clock: EstimateOk['clock'] | null;
  result: EstimateResult | null; remedies: RemedyStep[]; peers: PeerReasonId[] };   // 'example' = the T15 fixture, never written to KV
export function dataBaseUrl(): string;
export const notifications: { init(): Promise<void>; scheduleCaseReminders(c: CaseTimeline, lang: Lang): Promise<void>; rescheduleAll(lang: Lang): Promise<void>;
  notifyOnForeground(): void; cancelAll(): Promise<void> };                    // web: no-ops
export function openUrl(url: string): Promise<void>; export function share(text: string): Promise<boolean>; export function copyText(text: string): Promise<boolean>;

// ── UI kit (WP7) — every text prop takes an already-translated string; only LangToggle and DataStatusChip read i18n/data themselves
export type Tone = 'neutral' | 'info' | 'warning' | 'deadline';               // 'deadline' is the only red
export type IconName = 'home' | 'case' | 'offices' | 'alerts' | 'more' | 'language' | 'info' | 'warning' | 'check' | 'close' | 'chevron-left' | 'chevron-right' | 'share' | 'calendar' | 'clock' | 'external';
export function useTheme(): { name: 'light' | 'dark'; colors: Record<'bg' | 'surface' | 'text' | 'textMuted' | 'border' | 'accent' | 'info' | 'warning' | 'deadline' | 'chart1' | 'chart2' | 'chart3' | 'chart4', string>;
  space(n: number): number; radius: number; font: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', number> };
export function useThemeName(): 'light' | 'dark';
// Props:
//   Screen { children; scroll?: boolean; testID?: string }                   AppHeader { title: string }   LangToggle {}   DataStatusChip {}
//   Card { title?: string; tone?: Tone; children }                           Banner { tone: Tone; text: string; action?: { label: string; onPress(): void } }
//   Chip { label: string; tone?: Tone; accessibilityLabel?: string }         ConfidenceChip { level: 'LOW' | 'MEDIUM' | 'HIGH'; validated: boolean }
//   StatTile { value: number; fieldKey: keyof typeof FIELD_KINDS; period: YearMonth | FiscalQuarter; source: SourceRef; format: 'int' | 'dec1' | 'pct' }
//   ProbabilityLadder { rows: { months: number; p: number }[] }             Tile { title: string; children; onPress?(): void }
//   Sheet { visible: boolean; title: string; body: string; confirmLabel: string; cancelLabel: string; destructive?: boolean; onConfirm(): void; onCancel(): void }
//   Button { label: string; onPress(): void; variant?: 'primary' | 'secondary' | 'link'; disabled?: boolean; accessibilityHint?: string }
//   FormField { label: string; help?: string; error?: string; children }
//   DateField { label: string; value: ISODate | null; granularity: 'day' | 'month'; min?: ISODate; max?: ISODate; onChange(v: ISODate | null, g: 'day' | 'month'): void }
//   Select<T extends string> { label: string; value: T | null; options: { value: T; label: string }[]; onChange(v: T): void }
//   Checklist { items: { key: string; label: string; value: boolean | null }[]; onChange(key: string, v: boolean | null): void }
//   TableTwin { caption: string; columns: string[]; rows: string[][] }
//   MonthlyChart { rows: MonthlyRow[]; regimes: Regime[]; metric: 'completions' | 'pending' | 'received' }
//   FanChart { survival: number[]; startYm: YearMonth }                    RegimeStrip { clock: EstimateOk['clock']; regimes: Regime[]; receipt: ISODate; today: ISODate }
//   ScenarioBars { perScenario: EstimateOk['perScenario'] }               DriverBar { drivers: EstimateOk['drivers'] }
//   Icon { name: IconName; color?: string; size?: number }
```

---

### WP0 — Foundation and spikes in the real repo

- **Owns:**
  - `cuban-immigration-tracker/{package.json,package-lock.json,tsconfig*.json,vitest.config.mts,eslint.config.mjs,.gitignore}`
  - `app/{package.json,package-lock.json,app.json,tsconfig.json,metro.config.js,eslint.config.js}`
  - skeleton files only in `packages/*/src/index.ts`, which WP1–WP5 then take over
  - **temporarily** (declared exception 1): the four `.github/workflows/caa-*.yml` skeletons, until the `handoff: workflow skeletons` commit
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
  4. Install §3.1 with `npx expo install` (including `npx expo install expo-system-ui`); install §3.2 at the root with `npm i --save-exact`.
  5. Re-run spikes V1–V8 (`01` §9) inside the repo with a hello-world:
     - one `@caa/estimator` import;
     - a prelude prototype in `scripts/build-artifact.mjs`. WP10 replaces it.
  6. Add the four workflow **skeletons**: `caa-data-refresh.yml` (triggers, permissions and `present` guard of `03` §6.1; ingest step = `npm run --if-present data:refresh -- --dry-run`), `caa-ci.yml` (`tools` and `app` jobs using `npm run --if-present …`, plus an empty marked `web` block), `caa-probe.yml` (dispatch + weekly; `npm run --if-present probe`), `caa-staleness.yml` (with the `present` guard). Commit them, then commit `handoff: workflow skeletons → WP5 (refresh, probe, staleness), WP11 (ci), WP10 (ci web block)`. Open a PR to `main` **containing these four workflow files only**, for the owner to merge (`03` §6.2).
  7. (Moved to WP5: the first probe run and `data/samples/PROBE-REPORT.md`.)
- **Interfaces:** none (scaffolding).
- **Acceptance:**
  - (a) `cd app && npx expo export --platform web` gives **exactly one** JS file;
  - (b) the hello-world fragment boots under the Prove harness from `/x/y/z/index.html` with the host CSP, `localStorage` throwing and `history` throwing;
  - (c) `npm run typecheck` and `cd app && npx tsc --noEmit && npx jest` pass;
  - (d) `npx expo install --check` passes;
  - (e) **zod resolution:** in a checkout with **no root `node_modules`**, `cd app && npm ci && npx jest` passes with a test that imports `@caa/data-schemas` and parses a fixture; and, with the root `node_modules` also installed, `npx expo export --platform web --source-maps` gives a source map whose `sources` contain zod files from **exactly one** root, `app/node_modules/zod/` (one zod copy);
  - (f) `puppeteer-core@25.12.0` launches `@sparticuz/chromium@153.0.0` headless here (else record the fallback in `adr-log.md`);
  - (g) `npm run lint` lints a `.ts` file under `packages/` with `typescript-eslint` and rejects a seeded `import 'react'` there;
  - (h) `npx expo customize tsconfig.json` runs non-interactively in CI and produces `.expo/types/router.d.ts` (else WP0 records the working command in `adr-log.md` and in `03` §6.3);
  - (i) the four workflow skeletons pass a manual review against `03` §6 and the handoff commit exists.
- **Commands:** `npm run typecheck && npm test`; `cd app && npm run check && npx expo export -p web --output-dir dist`; `npm run build:artifact && npm run prove`.

---

### WP1 — `packages/data-schemas`

- **Owns:** `packages/data-schemas/**`, `scripts/export-schema.mjs`, `data/schema/**`.
- **Exports:**
  - Every type and zod schema in `02-data-model.md` §1–§5: `ManifestSchema`, `NationalFileSchema`, `QuarterlyFileSchema`, `OfficesFileSchema`, `PolicyFileSchema` (strict), `AlertsFileSchema` (strict), `ContentFileSchema` (strict), `EstimatorParamsSchema`, `CaseTimelineSchema`, `SharedTimelineSchema`, `CommunityFileSchema`, `ForecastLedgerEntrySchema`.
  - `FIELD_KINDS`.
  - `SCHEMA_VERSION = 1`.
  - `parseDataFile<N extends DataFileName>(name: N, json: unknown): Result<DataFileMap[N]>`, `parseManifest`, `parseCase` (exact signatures in §6.0).
  - `validateDataDir(dir)` (Node-only helper, in a separate entry `src/node.ts` → `@caa/data-schemas/node`, so that the app never imports `fs`).
  - The `contract: v1` commit also contains the stubs of every package signature in §6.0 and **G0** (`test/fixtures/sample-handbuilt/`, §5).
- **Dependencies:** `zod` only.
- **Acceptance:**
  - The schemas parse the seed files that WP9 and WP5 create. Until those exist, use hand-written fixtures from `02`.
  - Every `Localized` requires both languages to be non-empty.
  - JSON Schema export is deterministic.
  - Unknown keys: strict for curated files, passthrough for pipeline files.
  - Tests cover each schema with one valid and two invalid fixtures, plus the two `02` §8 exemption fixtures (future `cardExpiry`; `parole_termination_notice` before the receipt) as **valid** cases.
  - `Manifest.files` requires exactly the 7 v1 names; a manifest without `community` is valid.
  - G0 validates with every schema.
- **Contract freeze:** v1 is tagged in the commit message `contract: data-schemas v1`. Later changes are **additive only** unless the owner approves.
- **Commands:** `npm run typecheck && npx vitest run packages/data-schemas && npm run schema:export -- --check`.

---

### WP2 — `packages/estimator` + `tools/oracle`

- **Owns:** `packages/estimator/**`, `tools/oracle/**`.
- **Exports** (pure, deterministic, no I/O, no `Date.now`): exactly the `@caa/estimator` block of §6.0 — `estimate`, `reconstructPool`, `fitBeta`, `fitObservationSigma`, `officeMultipliers(stats, group, kappaOffice, clamp)`, `scenarioWeights(policy, alerts, observed, flags, observation, today)`, `completionsPath`, `projectPath`, `mixAndCondition`, `stateMixture`, `structuralBand`, `drivers`, `quantile`, `lognormalCdf`, `predictiveCompletions` (v1.1 ledger). `GOLDEN` is exported **only** from the separate entry `@caa/estimator/golden` (`src/golden.ts`), because Metro does not tree-shake and the main index must not pull the golden JSON into the app bundle.
  - `estimate()` also computes the guards from `input.data`, `input.quarterly` and `input.today` (`02` §4) and echoes `input.clock`.
- **Consumes:** `@caa/data-schemas` types only. The estimator does **not** import `@caa/case-rules`. The clock and the flags live in case-rules and are passed in through `EstimateInput`, so the two packages never import each other.
- **Dependencies:** none.
- **Does:**
  1. Copy `04` Appendix A to `tools/oracle/vph1.py`.
  2. Add `golden_cases.py`, **the entry point**, which implements every row of `04` §9 (milestone `mfun`, state mixture, structural extras, likelihood update with the §6.3 sub-mass floor, alert composition). Its first lines are `import os, sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))`, then `import vph1` — required because `python3 -I` implies `-P` (a plain sibling import raises `ModuleNotFoundError`; verified on Python 3.13).
  3. `golden_cases.py --write` emits `golden/vph1.golden.json`. `--check` recomputes and diffs with tolerance 1e-6.
  3b. **Precedence (EST-13):** if the oracle disagrees with any number written in `04` §9 (T4 = 0.89755 / 0.92072, T23 = T15 with biometrics kept, T23b, T31 sub-mass floor), stop and escalate to the owner; never regenerate the golden file to match new code.
  4. Port to TypeScript following EST-1…14.
  5. Cache `Math.exp` per (β, age) inside a path.
  6. The structural band and the state mixture are computed only when requested (`opts.bands`, default true in the app).
- **Acceptance:**
  - Every test in `04` §9 (T1–T32 including T23b, U1, U6, U7) passes against `GOLDEN`, within 5e-4 on probabilities and exactly on quantiles.
  - The T15 fixture is exactly the one pinned in `04` §9.2 (with biometrics 2025-07, state and office undefined); the same fixture is the app's "Ver un ejemplo".
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
  - `remedyEta(history, receipt)` (formula below)
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
  - Remedy tests (RC6): on 2026-10-20 the I-485 rung is `not_yet` at MIA/HIA/KND/TAM. **ETA formula (pinned):** take the first and the latest point of `inquiryDateHistory` for (office, `131A-FAM`); `rate = daysBetween(inq_first, inq_latest) / daysBetween(pub_first, pub_latest)`; `gap = daysBetween(inq_latest, receipt)`; `etaDate = addDays(pub_latest, ceil(gap / rate))`; `etaMonth = ym(etaDate)`. Fewer than 2 points, or rate ≤ 0 → `null` (state `depends`). With the doc 15 §2.2 points (2024-10-18 → 2026-10-15) and receipt 2025-03-15, the exact expected values are: **MIA 2028-01-30 → 2028-01; HIA 2027-10-06 → 2027-10; KND 2027-10-22 → 2027-10; TAM 2027-07-28 → 2027-07** [V computed 2026-10-20]. (Doc 15's "≈ Feb 2028 / Oct 2027 / Oct–Nov 2027 / Aug 2027" used month-rounded arithmetic and is superseded.) The (c)(9) rung is `available` when no EAD exists. With no inquiry date, the state is `depends` with "no disponible" and no gate decision. Mandamus is soft from 24 months and strong from 36. The denial branch is covered.
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
  - It creates the **empty** namespace files listed in §2 for the other WPs (including `ui` for WP7); after creation, each file belongs to its namespace owner.
- **Exports:**
  - `resources` (merged namespaces)
  - `createFmt(lang)` → `Fmt` (per `02` §9; no language-less `fmt`)
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
  - `createFmt('es')` and `createFmt('en')` produce the exact strings in `02` §9 under Node and under jsdom, including `pct(0.00906)` → `<1 %` / `<1%`.
  - `probWord` boundaries: 0.0499 → muy poco probable; 0.05 → poco probable; 0.2 → posible; 0.5 → probable; 0.8 → probable; 0.8001 → muy probable.
  - The check script catches seeded violations in a test fixture.
- **Commands:** `npm run typecheck && npx vitest run packages/i18n-core && npm run i18n:check`.

---

### WP5 — `packages/ingestion` + data workflows

- **Owns:**
  - `packages/ingestion/**`
  - `scripts/export-sample.mjs`
  - `app/src/data/sample/**` (the bundled sample: G0 copy first, then G1; `02` §2)
  - `packages/ingestion/src/probe/**` and the probe CLI
  - `data/*.json` (generated), `data/raw/**`, `data/quarantine/**`, `data/candidates/**`, `data/samples/**`
  - `/.github/workflows/{caa-data-refresh,caa-probe,caa-staleness}.yml` (after WP0's handoff commit)
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
  - First commit: copy G0 (`packages/data-schemas/test/fixtures/sample-handbuilt/`) into `app/src/data/sample/`.
  - The **first committed data** is produced by running `npm run data:refresh` locally. With uscis.gov blocked here, the mirror fallback plus the curated inputs (WP9 curated stub) are used, and the sources are marked accordingly. Then `npm run data:sample` produces **G1** (§5).
  - Run the probe locally (`npm run probe`) or via `caa-probe` dispatch after the owner merges the workflow PR, and commit `data/samples/PROBE-REPORT.md` (moved here from WP0).
- **Acceptance:**
  - The parser fixtures (Q2) pass.
  - The QA gate tests cover each of Q1–Q12, with a synthetic failing input.
  - Quarantine works: a failing source keeps the last good output and sets `qa.status`.
  - `decideCommit` tests: content change → commit and `dataChangedAt` bumped; no change with a heartbeat younger than 7 days → no commit; no change with a heartbeat of 7 days or more → commit with only `lastCheckedAt` changed.
  - The manifest validates with `ManifestSchema`.
  - The canary equals GOLDEN T15 on the fixture data.
  - The workflow YAML passes `actionlint` from the **rhysd/actionlint GitHub release binary** (github.com is reachable; download in CI by a pinned version and verify its checksum). The npm `actionlint` package (a 2022 wrapper) is not used. If the download fails, a manual review against `03` §6.1 is recorded.
  - Push-triggered runs never commit (`03` §6.1); a dispatch dry run succeeds on the branch.
  - **G1** exists: `app/src/data/sample/` validates and its manifest canary equals GOLDEN T15.
  - `data/samples/PROBE-REPORT.md` exists and classifies every doc 13 §12.4 probe.
- **Commands:** `npm run typecheck && npx vitest run packages/ingestion && npm run data:validate && npm run data:refresh -- --dry-run`.

---

### WP6 — App platform

- **Owns:**
  - `app/src/app/{_layout.tsx,+not-found.tsx,(tabs)/_layout.tsx}`
  - `app/src/{data,storage,i18n,notifications,platform}/**` **except** `app/src/data/sample/**` (WP5)
  - `app/__tests__/platform-*`
  - the locale namespace `notifications`
- **Exports** (exact signatures: §6.0 "app platform"):
  - `kv` (`02` §6)
  - `useCases()`, `useSettings()`, `useLang()`, `useData()`, `useEstimate()`
  - `<DataProvider>`
  - `dataBaseUrl()` — native: `baseUrls[i]/ref/path`; web: `window.__CAA_DATA_BASE__ ?? './data/'`
  - `useLang()` persists, calls `i18n.changeLanguage`, swaps `fmt = createFmt(lang)` and emits to the notification reschedule.
  - `notifications.{init, scheduleCaseReminders, rescheduleAll(lang), notifyOnForeground, cancelAll}`, with web no-ops
  - `openUrl`, `share`, `copyText`, each per platform
  - `useEstimate(caseId | 'example')`: memoized `deriveFlags()` → `clockFor()` → `estimate({ …, clock, quarterly, data: { status, manifest }, today })` → `remedyLadder()` and `peerReasons()`. `'example'` is the T15 fixture (`04` §9.2) and is never written to KV.
- **Rules:**
  - Fetch policy (the single rule of `01` §3 step 7):
    - on cold start and on foreground, check `manifest.json` only if `caa:v1:refresh.lastAttemptAt` is ≥ 6 h old (or absent) and `backoffUntil` has passed; the manual "Actualizar" bypasses the 6 h limit but not the backoff;
    - send `If-None-Match`;
    - fetch only files whose sha256 changed;
    - zod-validate every response and verify its sha256;
    - on 429, back off exponentially and honour `Retry-After`;
    - with no network, show the cached data, or the bundled sample.
  - `+not-found` renders `<Redirect href="/" />`.
  - Root `_layout` is a `Stack` with exactly `(tabs)`, `welcome` (`presentation: 'modal'`) and `+not-found`. `(tabs)/_layout` declares exactly five `<Tabs.Screen>`: `index`, `case`, `offices`, `alerts`, `more` (each of `case`, `offices`, `alerts`, `more` is a folder with its own Stack `_layout`, so detail routes stay inside their tab with a back action).
  - Notifications: `index.native.ts` uses **local** notifications only and never calls push-token or remote APIs (Expo Go on Android errors on push features since SDK 53 [S: expo-notifications `warnOfExpoGoPushUsage`; docs.expo.dev v58 notifications, per critic search]). `expo-notifications` is **lazy-imported** only after the user opts in from Settings.
  - The root `_layout` holds the splash until `kv.ready` resolves, at most 300 ms.
  - The tab layout uses icons from `@/ui/icons` (WP7; stub until it lands) and labels from i18n.
- **Dependencies:** §3.1 only.
- **Acceptance:**
  - Jest: data transitions sample → live → cached; `published` on web when `artifactBuiltAt` is set; a schema-mismatch banner keeps the old data.
  - Jest: KV web adapter with `localStorage` throwing, both getter and setItem.
  - Jest: language persistence; the default comes from the mocked `getLocales()`; changing the language triggers `rescheduleAll`.
  - Router test: an unknown path redirects to `/`; `/offices/MIA` and `/alerts/<id>` render inside their tab (tab bar visible, `offices`/`alerts` tab focused) with a working back action to the tab's index.
  - Fetch-rule tests use a mocked clock: second foreground within 6 h → no request; after 6 h → one conditional GET; during `backoffUntil` → no request even on "Actualizar".
- **Commands:** `cd app && npm run check`.

---

### WP7 — UI kit, charts, icons, theme

- **Owns:**
  - `app/src/ui/**`
  - `app/assets/**`
  - `app/__tests__/ui-*`
  - the locale namespace `ui` (UI-kit-only strings; I18N-3)
- **Exports** (exact props and token names: §6.0 "UI kit"):
  - Theme: `useTheme()` (tokens, light and dark) and `useThemeName()`. Native uses `useColorScheme` plus the setting. Web uses `document.documentElement.dataset.theme` through a MutationObserver, then `matchMedia`. The settings override is ignored on web.
  - Layout: `Screen` (`maxWidth: 560`, 16 px gutters, safe-area), `AppHeader` (title, `LangToggle`, `DataStatusChip`).
  - Components: `Card`, `Tile`, `StatTile` (renders the `FIELD_KINDS` chip), `Banner`, `Chip`, `ConfidenceChip`, `ProbabilityLadder`, `Sheet` (in-app confirm; never `confirm()`), `Button`, `FormField`, `DateField` (with day/month granularity), `Select`, `Checklist`, `TableTwin`.
  - Charts: `MonthlyChart({rows, regimes})`, `FanChart({survival, startYm})`, `RegimeStrip({clock, regimes, unknownChannelClocks?})`, `ScenarioBars`, `DriverBar`. All are react-native-svg, measure their width with `onLayout`, take axis labels from `fmt`, and each has a `TableTwin`.
  - Icons: `Icon({name, color, size})`. The 16 in-repo SVG icons of `IconName` (§6.0).
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
  - **Two data variants (as in Prove §9):** *frozen-sample* tests render from `app/src/data/sample/` (the frozen golden snapshot) and assert literals ("ago 2026"); *live-like* tests render from a fixture whose manifest has a different `latestOfficialMonth` and canary, and assert `fmt.month(manifest.latestOfficialMonth)` and `fmt.pct(manifest.canary.pWithin12)` instead of literals.
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
- **Acceptance** (Jest, rendering the reference case = T15 fixture from the frozen bundled sample; a *live-like* variant asserts against `fmt.pct(manifest.canary.pWithin12)` instead of literals, as in WP8a):
  - The headline shows "9 %" in es and "9%" in en.
  - Bands "2 % y 26 %" and "4 % y 20 %".
  - Ladder 1/4/9/22/35 %.
  - Calendar row `<1 %` / ~11 % / ~24 % (0.906 % renders as `<1 %` via `fmt.pct`).
  - Clock card: 306 adjudicable days and 278 hold days, both rendered from `clock` (no hard-coded "≈10 de ellos").
  - Median "más de 4 años".
  - The phrase "casos como el suyo" is absent.
  - The approval card has no range unless every basic doc is checked.
  - The peer reasons are exactly U2.
  - Remedies: for the reference case (office unknown, so no 131A-FAM gate) the I-485 rung is `depends` with "no disponible" and no gate decision (WP3); with `officeCode = MIA` it is `not_yet` with ETA month `2028-01`. (c)(9) "no aplica" for the reference case (EAD received) and "disponible" for the T23 twin.
  - T23 twin (no EAD, biometrics kept) shows the same headline as T15; the T23b twin (no EAD, no biometrics) shows 7 % (`04` §9.2).
  - I-220A → S9 with no numbers anywhere.
  - "Ver un ejemplo" never writes to KV.
  - Form validation follows `00` S2.
- **Commands:** `cd app && npm run check`.

---

### WP9 — Curated content and copy

- **Owns:**
  - **First deliverable (Wave 2, gate for G1):** the *curated stub* — `data/curated/policy.json` with regimes, sub-breakpoints, scenarios (S2 labelled "Ritmo de fines de 2024 (oct–dic 2024)" / "Late-2024 pace", `04` §6.1) and alert rules; empty `alerts/`; minimal `content.json`. Then the full content below.
  - `data/curated/**`: `policy.json` (regimes, sub-breakpoints and alert rules from key facts §3 and `04` §6.3; litigation from key facts §9; `litigationState` as of 2026-10-20; classes; cohort; approval; EAD; PA-2026-05; fees from key facts §4; congressional offices from doc 15 §5.2).
  - `alerts/*.json`: the 12 seed alerts in `00` S8.
  - `content.json`: the myths in `00` S10 and the peer copy in `00` S4.
  - `historic_medians.json`.
  - Copy review of every locale namespace **after** the owning WP merges, under declared exception 3 (§ intro): values only, one namespace per commit `wp9: copy <ns>`, never concurrently with the owner.
  - `policy.fees.mandamusFiling` = 405 USD (350 filing + 55 administrative), with `asOf: 2026-10-20` and a re-check note for the 2026-12-01 court fee changes (`00` S7).
- **Acceptance:**
  - Strict zod validation.
  - Every date and number matches the cited research row. The PR includes a citation table of `field → doc §`.
  - `i18n:check` passes.
  - **The native Cuban-Spanish reviewer signs off**: a checkbox in the PR, with the reviewer's handle.
  - No directive or conclusory wording (`05` §5).
- **Commands:** `npm run data:validate && npm run i18n:check`.

---

### WP10 — Artifact build and Prove

- **Owns:** `scripts/build-artifact.mjs`, `scripts/prove-artifact.mjs`, `web-artifact/**` (git-ignored, including `web-artifact/.build/routes.json`), and the `web` job section of `caa-ci.yml`. It coordinates the file with WP11 by keeping the job in a marked block.
- **CLI:** `node scripts/build-artifact.mjs --app app --data data --out web-artifact [--skip-export] [--dist app/dist]`.
- **`build-artifact.mjs` does, in this order** (contract a–i; `01` §5):
  0. **Generate the known-routes list** from `app/src/app/**` (`(tabs)` groups are dropped, `[param]` becomes `[^/]+`, `index` becomes `/`, `_layout` and `+not-found` are skipped) and write it to `web-artifact/.build/routes.json`. The app never imports it; it is embedded only in the prelude (WEB-1), so it can never be stale inside the bundle.
  0b. **Run the export itself**, unless `--skip-export`: spawn `npx expo export --platform web --output-dir dist` with `cwd = app`, inheriting `process.env` (so `EXPO_OFFLINE=1` passes through; the script sets `EXPO_OFFLINE=1` itself when `CI` is unset and `--online` is not given) and failing on a non-zero exit.
  1. Parse `dist/index.html`. Require exactly one `<script src>`. Collect the stylesheets and read the root id.
  2. Read the JS. Replace every `"/assets/<path>"` literal with a `data:` URI; fail if a file is missing or larger than 200 KB. Fail on `.ttf`, `.otf` or `.woff` references or files.
  3. Fail if any `"/_expo/"` or `"/assets/"` literal remains, or any `http(s)://` inside `src=`, `href=`, `url(` or `import(` in the HTML, CSS or JS. Allowlist: plain-text documentation URLs inside string constants. Escape `</script` as `<\/script`.
  4. Embed the step-0 routes list in the prelude.
  5. Emit `web-artifact/index.html`, which must be **exactly** `<title>CAA Tracker</title>\n<style>…</style>\n<div id="root"></div>\n<script>{prelude};\n{bundle}</script>\n` — **one** inline script (the prelude is concatenated in front of the bundle, inside its own IIFE, so it still runs first), matching contract (a) literally.
     - The `<style>` holds the theme tokens (light on `:root`; dark under the media query guarded by `:root:not([data-theme="light"])`, and again under `:root[data-theme="dark"]`, with `color-scheme: dark`), plus explicit `html`, `body` and `#root` backgrounds and the react-native-web reset.
     - Fail on `<!doctype`, `<html`, `<head` or `<body`.
  6. Copy the manifest and the 7 data files to `web-artifact/data/`. Set `artifactBuiltAt` and recompute the sha256 values. If `data/manifest.json` does not exist (before WP5 commits data, e.g. the WP0 hello-world and early CI runs), print a warning and emit a **sample-only** fragment with no `data/` folder; do not fail.
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
  - `caa-ci.yml` per `03` §6.3 (taking over WP0's skeleton after the handoff commit).
  - CODEOWNERS per `05` §3.1.
  - Runs the integration checklist (§7).
  - Updates the README project status, the data URLs and the artifact URL.
- **Commands:** `npm run check && (cd app && npm run check) && npm run build:artifact && npm run prove`.

## 7. Integration checklist (WP11 signs each line)

- [ ] `npm run check` and `cd app && npm run check` are green, and CI is green on the branch.
- [ ] `npm run golden:check` is green, and the TS golden tests are green (T1–T32, U1–U8).
- [ ] `npm run data:refresh` on the branch produces data that validates. `manifest.canary` equals GOLDEN T15 on the fixture data, or differs only by a documented new month.
- [ ] `app/src/data/sample/` is G1, the frozen golden snapshot (`dataThrough 2026-08`); it is **not** refreshed on routine data updates (`02` §2). The app shows "Muestra" offline, "En vivo" with the branch `ref`, and "Guardado" when the network is cut after one fetch.
- [ ] Native — **default: an EAS development build** (internal distribution). SDK 58 Expo Go is expected in the stores "within a few weeks" of the SDK release [S: https://expo.dev/changelog/sdk-58 ; https://expo.dev/go]; until then also acceptable: the Expo Go that `npx expo start` installs on a simulator/emulator, or `eas go` on iOS. Record which path was used:
  - [ ] one iOS and one Android device: all tabs, the reference case, the language toggle (strings, dates, numbers and chart labels switch with no restart), notifications scheduled and rescheduled on language change, "Borrar mis datos".
  - [ ] Expo Go run on Android shows no push-related error (local notifications only; `expo-notifications` lazy-loaded after opt-in).
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

**Two variants** (`--variant sample|live|both`; CI and the republish runbook run `both`):
- **Sample variant:** the fragment is served **without** `data/`, so the app runs on the frozen bundled sample (G1). Assertions use the **golden literals** below.
- **Live variant:** the fragment is served with the shipped `web-artifact/data/`. Assertions that depend on data are **derived from that `data/manifest.json`** with the same `createFmt` the app uses: headline = `fmt.pct(manifest.canary.pWithin12)`, data chip month = `fmt.month(manifest.latestOfficialMonth)`. Literal-independent checks (clock 306, tabs, language, theme, layout, CSP) are identical in both. A new USCIS month therefore never breaks Prove while the code is correct.

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
| P5 | All 5 tabs (`index`, `case`, `offices`, `alerts`, `more`) and one deep screen per tab (offices/[code], alerts/[id], case/peers, more/method) render without an error boundary; on each deep screen the tab bar shows the owning tab as focused and the back action returns to the tab index |
| P6 | Language: tap the toggle and check, in es ↔ en: tab labels ("Inicio" ↔ "Home"), a date ("20 oct 2026" ↔ "Oct 20, 2026"; fixed clock injected via `Date` override = 2026-10-20T12:00:00Z), a percent (sample: "9 %" ↔ "9%"; live: `createFmt('es').pct(canary)` ↔ `createFmt('en').pct(canary)`), a chart axis label, the disclaimer. Reload → the language persists, or falls back to the default when `localStorage` throws |
| P7 | Estimator: "Ver un ejemplo" (T15 fixture). **Sample:** headline "9", bands "2"–"26". **Live:** headline = `fmt.pct(manifest.canary.pWithin12)` (the canary is computed for the same T15 fixture). **Both:** clock "306" (data-independent) |
| P8 | Data status. **Live** (with `data/`): chip "Publicado …" plus `fmt.month(manifest.latestOfficialMonth)`. **Sample** (without `data/`): "Muestra" plus "ago 2026". Every screen shows an "as of" date |
| P9 | `localStorage` getter throws → P1, P5, P6 and P7 still pass |
| P10 | `History.prototype.pushState/replaceState` throw → P1 and P5 still pass |
| P11 | Theme: set `data-theme="dark"` and `"light"` at runtime → the computed `body` and `#root` backgrounds match the tokens; `prefers-color-scheme: dark` emulation with no attribute → dark |
| P12 | Layout: at 390 px, `document.documentElement.scrollWidth ≤ 390`; at 1280 px the content column is centred with width ≤ 560 px + gutters |
| P13 | No `alert`, `confirm`, `prompt`, `print` or `window.open` calls (stubs that record calls) during the full run |
| P14 | Fragment checks: it starts with `<title>CAA Tracker</title>`; no doctype, html, head or body; exactly **1** inline `<script>` tag (prelude concatenated in front of the bundle) and no `<script src>`; size < 15 MB |

## 10. Rules for agents (process)

1. **Branch.** Work on `claude/cuban-immigration-tracker-b6y4b1` (via per-WP branches, rule 8), never `main`. The only exception is the workflow-only PR, which the owner merges.
2. **Ownership.** Write only inside your WP's directories (§2, §6). If you need a change elsewhere, open an issue titled `[WPn → WPm] …`, or leave a TODO in your own code with a stub.
3. **Contract changes.** Changes to `packages/data-schemas` go through WP1, are additive, and are announced in the commit message (`contract: …`). Changes to an estimator ADR or golden value need an owner-approved edit to `04-estimation-model.md`, then `golden:write` and the review.
4. **Facts.** Never invent an endpoint, number or date. Every fact in code or copy cites a `docs/research` section in a comment or in the curated file's `source` field. Uncertain facts keep their tag ([T], [U]) and their UI caveat.
5. **No personal data.** No personal data in commits, fixtures or logs. Use only synthetic receipts (`IOE0000000000`), and use the reference case only as specified.
6. **Verify before committing.** Run the WP's commands. Commit small, coherent changes with messages `wpN: …`.
7. **Local web export.** Use `EXPO_OFFLINE=1` when exporting in the sandbox (`build-artifact.mjs` sets it itself when `CI` is unset).
8. **Branches for parallel agents.** Each WP works on its own branch `claude/cuban-immigration-tracker-b6y4b1-wpN` and merges (fast-forward or rebase) into `claude/cuban-immigration-tracker-b6y4b1`. The data bot never commits on push events (`03` §6.1), so bot commits never race agent pushes; dispatch runs on the feature branch are started only by the owner or WP5.

## 11. Revision notes (2026-10-20, after the two critic reviews)

Tags: [V] = checked today by a command in this session; [S] = seen in a search result today; [I] = inferred.

**Blocking issues fixed**

| # | Issue | Change | Files |
|---|---|---|---|
| B1 | WP0 needed files owned by WP5/WP11 (circular) | Option (b): WP0 owns the four workflow **skeletons** temporarily (`npm run --if-present`) and hands them over in a named `handoff: workflow skeletons` commit. The first probe run and `PROBE-REPORT.md` move to WP5. WP0 acceptance (e) is replaced. | 07 intro, §2, WP0, WP5; 03 §6.2, §6.4; 06 |
| B2 | Directories not disjoint; no sample before Wave 3 | WP7 gets its own `ui` namespace. `app/src/data/sample/**` belongs to WP5. The route list moves to `web-artifact/.build/routes.json` (WP10, git-ignored, prelude-only), generated before the export. WP9 copy edits are a declared values-only, sequenced exception. New gates: **G0** hand-built sample (WP1) and **G1** seed sample (WP5 + WP9 curated stub, end of Wave 2). | 07 intro, §1 I18N-3, §2, §5, WP4–WP10; 02 §2 |
| B3 | Cross-WP interfaces under-specified | New **§6.0 Frozen cross-WP contracts**: exact TS signatures for data-schemas (`parseDataFile<N>`, `Result`, `DataFileMap`), estimator (all fit/projection/mix functions, `scenarioWeights(…, observation, today)`), case-rules (`clockFor`, `remedyEta`, `dates`), i18n-core (`createFmt(lang): Fmt`), WP6 hooks and WP7 kit props/tokens. Wave 3 can now run in parallel. | 07 §5, §6.0, WP1/WP2/WP4/WP6/WP7; 02 §1, §9 |
| B4 | `estimate()` could not produce `clock` or the guards | `EstimateInput` gains `clock` (from `clockFor`, via `useEstimate`), `quarterly`, `data: { status, manifest }` and `opts`; guards are defined from these inputs. `scenarioWeights` takes `observation` (σ, λ, floors) and `today`. | 02 §4; 04 §1, §6.3; 07 WP2, WP6 |
| B5 | Offices/alerts had no nested layout; tab names unpinned | Added `(tabs)/offices/_layout.tsx` and `(tabs)/alerts/_layout.tsx` (Stack, WP8a). Pinned the five tab names (`index`, `case`, `offices`, `alerts`, `more`) and the root Stack (`(tabs)`, `welcome` modal, `+not-found`). New router test and stronger P5. | 07 §2, WP6, §9 |
| B6 | `python3 -I` breaks the sibling import | `golden_cases.py` is the entry point and inserts its own directory into `sys.path` before `import vph1`. npm scripts, CI and Appendix A text updated. | 07 §2, §4, WP2; 03 §6.3; 04 EST-13, Appendix A |
| B7 | Root lint could not parse TS | Pinned `typescript-eslint 8.71.1` (2026-10-05; peer TS `<6.1.0`) [V npm]; 8.72.0 is too new. Added the root `eslint.config.mjs` spec with the package-purity `no-restricted-imports` rule. | 07 §3.2, §4, WP0 (g) |
| B8 | Two zod copies / jest could not resolve zod | Jest `moduleNameMapper` maps `zod` and `zod/*` to `app/node_modules`. Metro: a `resolveRequest` hook resolves `zod` / `zod/*` from the app root (chosen over `disableHierarchicalLookup`, which would also break npm's nested `node_modules`), and the root `node_modules` is no longer watched. WP0 acceptance (e) checks both: jest without root `node_modules`, and exactly one zod root in the source map. The CI `app` job intentionally runs without root `npm ci`. | 07 §1 ARCH-1, §4, WP0; 03 §6.3 |
| B9 | build-artifact did not run the export | `scripts/build-artifact.mjs` does it in order: route list → `npx expo export` (inherits/sets `EXPO_OFFLINE`, `--skip-export` for reuse) → inline → `data/`. `npm run build:artifact` and the CI web job call only the script. It tolerates a missing `data/` (sample-only fragment). | 07 §4, WP10; 03 §6.3, §7, §8 |
| B10 | Prove literals would break on the next USCIS month | Prove has a **sample** variant (no `data/`, frozen G1 sample, golden literals) and a **live** variant (expectations from the shipped `manifest.canary` / `latestOfficialMonth` via `createFmt`). Clock 306 stays literal. WP8a/WP8b Jest get the same split. The bundled sample is the frozen golden snapshot and is not refreshed routinely. | 07 §7, §9, WP8a, WP8b; 02 §2; 03 §9 |
| B11 | T4 inconsistent | T4 = S_c(12) = S(14)/S(2) = **0.89755**; cross-check S_c(10) = S(12)/S(2) = 0.92072 (doc 08's value) [V oracle]. | 04 §9.2; 01 V10 |
| B12 | T31 floor rule did not reproduce the table | Step 3 now says: normalize S0–S2 to 1 → floor 0.02 → renormalize → × (1 − w[S3]). This reproduces all six rows; the literal "0.02 of the total" does not (S2 0.0196 vs 0.0167 at C = 600) [V]. | 04 §6.3; 02 params comment via `weightFloor` |
| B13 | T23 contradicted the 0.7 no-biometrics rule | T15 fixture pinned with **biometrics 2025-07** (month), state and office undefined; T23 keeps biometrics, so it stays identical to T15. New **T23b** (no EAD, no biometrics): P12 0.06619, q50 64 [V oracle]. | 04 §4, §9.2; 07 WP2, WP8b; 00 S3 |
| B14 | S2 "FY2025 pace" mislabelled | S2 is relabelled "Ritmo de fines de 2024 (oct–dic 2024, ~9,200/mes)" / "Late-2024 pace"; numbers and golden file unchanged. Method adds the true FY2025 average (78,291 / 12 = 6,524/month → ~54 months; T12 updated). Research conflict note added: 27,602 is FY25 Q1 (our [F] Oct–Dec 2024 sum is 27,673; Apr–Jun 2025 is 11,470), confirmed by Immiva's "FY2025 Q1" framing [S: https://immiva.com/blog/uscis-processing-times-by-form]. Doc 14's "≈1,900 FY25 Q3 denials" reads 785 [F]. | 04 §6.1, T12; 00 F22, S3, S11; 07 WP9 |
| B15 | Validation rejected valid cases | `ead_c9.meta.cardExpiry` (and `paroleEndDateOriginal`) allowed in the future; `parole_termination_notice` and parole dates exempt from "receipt first". One valid fixture for each in WP1. | 02 §8; 07 WP1 |

**Non-blocking items addressed**

- Versions [V npm 2026-10-20]: zod **4.6.5** (both packages), vitest **5.0.3**, typescript **6.0.3** exact, eslint **9.39.5** exact, `expo-system-ui ~58.0.6` added; explicit age exception for the Expo SDK packages; puppeteer-core 25.12.0 kept but must pass WP0 acceptance (f) since the spike ran 25.15.0. `expo-font` is a transitive dependency of `expo`; only direct imports are banned.
- GitHub Actions SHAs filled in: checkout v7.0.1 `3d3c42e5…`, setup-node v7.1.0 `949feb24…` (critic's `git ls-remote`). `inputs.only` and the commit summary go through `env` (no script injection). Push-triggered refresh runs are dry runs; per-WP branches avoid races. Staleness workflow has the `present` guard. Token note corrected (dispatch needs `repo` or fine-grained `actions: write`; `workflow` only to edit workflow files). jzebedee cadence marked unknown [I]. actionlint from the rhysd GitHub release, not npm.
- Platform base files (`openUrl.ts`, `share.ts`, `clipboard.ts`, `hostRefresh.ts`) added so `tsc` resolves without `moduleSuffixes`. CI generates typed-route types (`npx expo customize tsconfig.json`; WP0 acceptance (h) verifies it is non-interactive). `GOLDEN` moved to `@caa/estimator/golden`. `Manifest.files` has only the 7 v1 names (`community` is v1.1, additive). `src/node.ts` listed.
- Fragment now has **one** inline script (prelude in its own try/catch IIFE, then the bundle); P14 asserts 1.
- One fetch rule (cold start and foreground, only if the last attempt is ≥ 6 h old; "Actualizar" bypasses the 6 h limit but not the backoff).
- Expo Go: EAS dev build is the default device path; SDK 58 Expo Go is expected in the stores "within a few weeks" [S: https://expo.dev/changelog/sdk-58]. Notifications are local-only on native, `expo-notifications` lazy-loaded after opt-in.
- Estimator docs: k₀ (time origin, `kOrigin`) vs κ_o (office prior, `kappaOffice`) disambiguated; EST-1 reason corrected (Aug 2024 gap, not "first month with pendingOver6"); EST-9 conditioning bias and S3 anchoring documented as a design note; key-facts office multipliers flagged as already shrunk; state-mixture limitation and the Miami-Dade "No sé" behaviour documented; EST-13 precedence (stop and escalate rather than regenerate).
- Copy: clock card says ≈9 months (278 days) under holds and renders from `clock`; calendar row uses `<1 %`; reference case pinned to T15 (state undefined); the 461,884 figure is labelled as the Oct–Dec 2025 quarterly figure; inquiry-date chip says "≈93 %, según fuentes secundarias"; mandamus fee from `policy.fees` (405 = 350 + 55, as-of date, re-check after 2026-12-01).
- Remedy ETA formula pinned with exact values: MIA 2028-01, HIA 2027-10, KND 2027-10, TAM 2027-07 [V computed]; doc 15's month-rounded ETAs are superseded.
- `expo-sdk58-implementation-notes.md` carries a "superseded in part" banner listing the forbidden recommendations.

**Known gaps not fixed here (owner decision or out of scope)**
- The research corpus itself (README §2.3/§2.4 "≈10 months under holds", "FY2025 throughput ~9,200/month"; docs 07/08 attribution of 27,602) was not edited; the planning docs now override it, with conflict notes.
- jzebedee release cadence and asset naming remain [I] until an Actions run can reach api.github.com.
- Changing the S3 anchor or the conditioning month (EST-9 note) would regenerate the golden file and needs owner approval.
