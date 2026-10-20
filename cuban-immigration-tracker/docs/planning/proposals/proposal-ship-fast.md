# Proposal: "Ship fast" CAA Tracker MVP (2–4 weeks, solo developer + agents)

Author: architect agent, "MVP-first / ship in weeks" angle. Written **2026-10-20**.
Inputs: `README.md`; `docs/research/README.md`, `00-key-facts-for-the-app.md`, `00-master-timeline.md`
and research docs 03, 04, 06, 07, 08, 09, 12, 13, 14, 15, 16; `docs/planning/expo-sdk58-implementation-notes.md`
(cited as "SDK notes §n").

**Evidence tags.** [S] = stated in a search result I saw today (URL given) · [F]/[S]/[S-sec]/[T]/[I]/[U] when quoted
"per doc NN" = the tag the research corpus gave that fact · [T] = my training knowledge, not confirmed today ·
[I] = my inference/design decision. Where the corpus says [T] or [U], this plan keeps the uncertainty and
says what to do about it. My four searches today (budget 4/4 used) are listed in §13.4.

**One-paragraph pitch.** Build the smallest thing that is honest and useful: a twice-daily GitHub Actions job
turns the four official USCIS files the research actually downloaded (monthly Report-to-Congress CSV, quarterly
all-forms workbook, quarterly I-485-by-office workbook, and the `jzebedee/uscis` processing-times mirror) into six
small JSON files committed under `cuban-immigration-tracker/data/`; one Expo SDK 58 app (iOS, Android, web) reads
them, runs doc 08's VPH-1 estimator on the device, stores "my case" only on the device in a single cross-platform
key-value store, switches English/Spanish at runtime from a header button, and ships as a single-file Claude
artifact that reads the same JSON from `./data/`. No accounts, no database, no server, no push in the MVP.
Policy and court alerts are human-curated JSON reviewed by pull request; machines only propose candidates.

---

## 1. Product vision and target users

### 1.1 Vision

"Replace rumour with data" (README) for Cuban parolees waiting on a Cuban Adjustment Act (CAA) I-485. In one
screen, the app answers three questions with official numbers and honest uncertainty:

1. **What is USCIS doing right now?** Received / approved / denied / pending Cuban I-485s per month, from the
   monthly CSV, the only official product with an `I-485 (Cuban)` row at monthly resolution [F per doc 04 §1.1].
2. **Where does my case stand?** "You filed on X, you entered via Y, you live in Z (office), you already have W:
   here is the chance of a decision within 3/6/12/24/36 months, the queue ahead of you, the holds your case sat
   through, and the steps you can take", using doc 08's VPH-1 model (doc 08 §11), never a single promised date.
3. **What changed?** Curated policy, court and data alerts (court dockets, memos, Federal Register rules, new
   data files) in both languages, with a source link and "what it means for you".

### 1.2 Target users

| Persona | Situation (from research) | What they need first |
|---|---|---|
| **P1 "Reference case"**, a Spanish-first CHNV Cuban in Miami-Dade | I-485 filed March 2025 (peak receipt month, 26,187 [F per doc 04]); (c)(9) EAD Sept 2025; pending 19 months, ~10 of them inside holds; 306 adjudicable days (README; doc 08 T11) | Why no decision, realistic odds, whether an e-Request is possible (no, at MIA/HIA/KND/TAM until ≈2027–28; doc 15 §2.2) |
| **P2 "Peer without EAD"** | Same filing month; (c)(9) still pending because it was swept into the Dec 2025 hold (doc 07 §5.1) | The (c)(9) e-Request is open now (NBC `147-C9` inquiry date 2025-06-13 [F/I per doc 15]); expedite rules; renewal rules |
| **P3 CBP One Cuban** | Paroled at a land port (I-94 "DT"); not covered by the Feb 2025 parolee hold on paper (doc 16 §3) | Confirmation that terminated parole still counts for CAA (doc 16 §5); enforcement warning since 2026-08-11 (doc 16 §6) |
| **P4 I-220A Cuban** | Released on recognizance, not paroled; not CAA-eligible under *Matter of Cabrera-Fernández*, 28 I&N Dec. 747 (key facts §1) | A clear "no estimate, here is why, here is the litigation to watch" screen, not a fake number |
| **P5 Relative / helper** (the owner) | English-first, helps several family members | The same app in English, and a shareable web link (the Claude artifact) |

**Non-users (MVP):** attorneys needing case management; non-Cuban CHNV parolees (the data series is Cuban-only;
Haitian/Nicaraguan/Venezuelan parolees adjust under other provisions [T]). Shown a polite "built for CAA cases" note.

### 1.3 Success criteria for the MVP (measurable)

- The reference case reproduces doc 08 T15 on device: P(decision ≤ 12 mo) = 9.4% ± 0.3, q50 = 53 months,
  adjudicable days 306 (doc 08 §11.9).
- Every number on every screen carries an "as of" (official period) and a data status chip (Live / Cached / Sample).
- 100% of user-visible strings come from `en.json`/`es.json` (CI-enforced), and switching language rewrites every
  screen, chart label, date, number and notification without restart.
- The web artifact boots from an arbitrary path, at 390 px and desktop, light and dark, with `localStorage` throwing.
- The data job has run green on schedule for 14 consecutive days on the default branch.

---

## 2. Feature list (MoSCoW) with rationale

Ruthless rule: **Must** = needed to answer the three questions in §1.1 honestly, in both languages, on
phone and web. Anything that needs a server, an account, a dev build or an API token is not a Must.

| # | Feature | Priority | Rationale (and research basis) |
|---|---|---|---|
| F1 | National dashboard: monthly Cuban I-485 received/approved/denied/pending/pending>6mo/avg months, Jul 2024 → latest | **Must** | Core ask "number of applications … approvals"; CSV is [F] and reachable from Actions with a browser UA (doc 13 §3.1) |
| F2 | Quarterly context: CAA median months, approval share **with numerator, denominator and Q1/Q2 baselines**, (c)(9) I-765 national pending/median | **Must** | 23.7% shown alone reads as "three in four refused" (doc 14 §8.1); 342,360 vs 355,520 must be labelled by product (doc 04 §1.1) |
| F3 | Regime band (R0–R4) behind every time chart and in the case strip | **Must** | The two holds explain the owner's case and the peers' EAD differences (docs 03 §15, 07 §5.1) |
| F4 | Offices screen: per-office 80% time (`131A-FAM` proxy, labelled), case-inquiry date, humanitarian pending/approved (quarterly), shrunk speed multiplier with N | **Must** | "per-office processing times" is in the core; no CAA subtype exists (doc 13 §1.3) |
| F5 | My case: entry channel, filing date, state → office, milestones (receipt, biometrics, EAD, interview scheduled/done, RFE received/answered, mandamus, expedite), packet checklist | **Must** | The owner's personal-estimate ask; field list from docs 06 §8.1, 08 §11.2, 15 §9.2, 16 §8.1 |
| F6 | Personal estimate (VPH-1 v1 grid): P(decision) at 3/6/12/24/36 mo, quantiles or "beyond 6 years", fan chart, per-scenario view, queue numbers, adjudicable-days strip, official 80% + inquiry date beside it, separate approval card, confidence + "not validated" label | **Must** | doc 08 §11 is fully specified, tested numerically (T1–T20) and runs < 20 ms on device |
| F7 | Eligibility gate and warnings: I-220A/EWI/236 conditional parole → no estimate; CBP One/CHNV/FRP → "was paroled" green note; terminated-parole amber enforcement warning; FRP carve-out; *Red Eagle* class flag | **Must** | Key facts §1 flags; doc 16 §8.4 copy |
| F8 | "What can I do? / ¿Qué puedo hacer?" remedy ladder driven by my case | **Must** | Doc 15 §9.1 decision tree is ready; the honest answer differs between the I-485 and the (c)(9) |
| F9 | Alerts screen: curated policy/court/data alerts + litigation watch table, EN/ES | **Must** | "policy/court alerts" is in the core; curated by PR keeps it correct (doc 09 §8 rules) |
| F10 | Runtime EN/ES language button in the header, settings and first launch; persisted; device default; all formats switch | **Must** | Owner requirement (1); Cuban users are Spanish-first |
| F11 | Data status everywhere: "as of" period + Live / Cached / Sample chip + stale banners (T20 guard) | **Must** | Owner requirement (2); doc 08 T20 |
| F12 | Web build packaged as one Claude-artifact fragment + `./data/*.json` supporting files; boots from any path; theme contract; 390 px | **Must** | Owner requirement (2), contract (a)–(i) |
| F13 | Twice-daily GitHub Actions data refresh with `workflow_dispatch`, least privilege, committing to `cuban-immigration-tracker/data/` | **Must** | Owner requirement (3); the zero-backend design of doc 09 D2 |
| F14 | Local notifications (native only): new curated alert after a data refresh, EAD renewal at expiry − 180 days, "2-year mark" reminder | **Should** | Expo Go supports local notifications, not remote push (SDK notes §6); web has none (contract e) |
| F15 | Delete my data (one tap), privacy page, disclaimers EN/ES | **Must** | Store rules (doc 09 §7) and privacy-first constraint |
| F16 | Glossary EN/ES (key facts §10) | **Should** | Cheap (static strings); reduces support questions |
| F17 | Alert *candidates* from the Federal Register API and USCIS RSS written to `data/candidates/` for a human to promote | **Should** | Both keyless (doc 13 §6, §9); keeps the curated feed fresh without automating judgement |
| F18 | CourtListener docket polling (only if `COURTLISTENER_TOKEN` secret exists) → candidates | **Should** | Token required, anonymous 401 (doc 13 §7.1); skip silently without it |
| F19 | Backtest script (rolling origins R0/R2) printing coverage/Brier/CRPS | **Should** | doc 08 §10.2; ships the evidence for "not validated" honestly |
| F20 | Scenario weight sliders (per-user what-if) | **Could** | Doc 08 §11.7 rule 5 wants weights shown; editing them is nice-to-have |
| F21 | Share my estimate as text (native share sheet only) | **Could** | Web artifact cannot download/print (contract e) |
| F22 | claude.ai host refresh via `window.claude?.use` MCP capability | **Could (lowest)** | Owner marked it optional; shipped files work without it |
| F23 | ZIP → office mapping | **Won't (MVP)** → v1.1 | Needs a county table + HUD crosswalk + Miami-Dade ZIP lists captured from the locator (doc 12 §3); MVP asks state → office list with "I don't know" |
| F24 | Crowdsourced timelines (Supabase) | **Won't (MVP)** → v1.1 | Needs auth, RLS, moderation, privacy label change (doc 09 §6–7); MVP stores the same fields locally so v1.1 is an upload toggle |
| F25 | Remote push notifications | **Won't (MVP)** → v2 | Needs dev build + EAS + token storage (SDK notes §6, doc 09 §8 tier C) |
| F26 | Torch Case Status API (receipt lookup) | **Won't** → v2 | Sandbox only returns canned data; production needs USCIS approval (doc 13 §11) |
| F27 | Direct `egov.uscis.gov` processing-times scraping | **Won't** | Cloudflare blocks cloud IPs incl. GitHub (doc 13 §1.2); use the mirror |
| F28 | OHSS / CBP / Census ingestion | **Won't (MVP)** | Only cohort constants are needed (110,240 CHNV Cubans [S per doc 05]; ≈100k CBP One [I per doc 16]); hand-entered in `policy.json` |
| F29 | Seeded Monte Carlo, hierarchical office model, multi-class pool | **Won't (MVP)** → v2 | doc 08 §12 upgrade path |

---

## 3. Screen-by-screen spec

Navigation: Expo Router **JavaScript tabs** (work on web; native tabs are skipped to keep one code path, SDK
notes §3). Five tabs plus stacked detail screens. Every screen has the same header: app title, **DataStatusChip**
("Datos: en vivo · ago 2026" / "Data: live · Aug 2026"), and the **LangToggle** button ("ES | EN", 44×44 pt hit
target, `accessibilityRole="button"`, label "Cambiar idioma a inglés" / "Switch language to Spanish").

Common states for every data screen [I]:
- **Loading** (first launch only; afterwards cached data renders instantly): skeleton tiles, no spinner wall.
- **Live**: data from the network this session. **Cached**: last good copy from storage, chip shows "cached ·
  checked N h ago". **Sample**: the bundled snapshot, amber chip "Muestra (sin conexión)" / "Sample (offline)".
- **Stale** banners: (a) `generatedAt` > 72 h → "Datos de hace N días" / "Data is N days old"; (b) latest official
  month > 75 days old → "USCIS no ha publicado datos nuevos desde …" (doc 08 T20a); (c) monthly series more than one
  quarter ahead of the quarterly file → "datos mensuales sin contraste trimestral" (T20b).
- **Error**: never blank. Network/parse failure falls back to Cached → Sample and says so in the chip.

### S0 Onboarding (first launch only) — `/welcome` (modal)

| | |
|---|---|
| Title | ES "Bienvenido a CAA Tracker" · EN "Welcome to CAA Tracker" |
| Purpose | Pick language (default from device locale), accept the disclaimer, explain Live/Sample |
| Shows | Two large buttons "Español" / "English"; disclaimer card (§10.3); "independiente, no oficial" line |
| Actions | Choose language (applies instantly); "Empezar / Start" → Home; "Configurar mi caso / Set up my case" → My case |
| States | If storage unavailable (web private mode) the onboarding still works; it just reappears next visit |

### S1 Home / Inicio — `/` (tab "Inicio" / "Home")

| | |
|---|---|
| Title | ES "Ajuste cubano: lo que USCIS está haciendo" · EN "Cuban Adjustment: what USCIS is doing" |
| Purpose | National picture in 10 seconds |
| Data | Tiles from the latest monthly row (Aug 2026 today): Pending 355,520 · Received 1,213 · Approved 386 · Denied 434 · Pending > 6 mo 345,741 · Avg. months of completions 20.6 [F per doc 04]; "Decisions last month 820"; Little's-law line "At this pace, clearing the backlog would take ~434 months" (doc 08 §5.1); MonthlyChart (bars approved/denied, line pending, R0–R4 band); QuarterlyCard: FY26 Q3 139 approved / 447 denied of 586 (23.7%) next to Q1 91.7% and Q2 52.6% and the caveat (doc 14 §8.1); (c)(9) card: I-765 "Adjustment of Status" pending 671,362, median 6.4 mo (FY26 Q3 [F per doc 04 §1.2]); "Next official files expected: September 2026 CSV (not yet published); FY26 Q4 ≈ early Dec 2026" |
| Actions | Tap a tile → explainer sheet (what the statistic measures, doc 08 §2.1); "See my estimate" CTA; latest alert banner → Alerts |
| Empty | Impossible (sample bundled) |

### S2 My case / Mi caso — `/case` (tab "Mi caso" / "My case")

Two modes: **Form** (no case saved or "Edit") and **Result**.

| | |
|---|---|
| Title | ES "Mi caso" · EN "My case"; result header ES "Su estimado" · EN "Your estimate" |
| Form fields | Entry channel (CHNV · CBP One · FRP/CFRP · U4U · other parole · visa · I-220A · entered without inspection · not sure); parole date (optional, drives one-year check and *Doe v. DHS* flag); original I-94 end date (optional; 2026-04-24 explained as re-termination, doc 16 §8.1); I-485 receipt date (required); state → office (filtered list from `offices.json`, plus "No sé / I don't know" = national); milestones with dates: receipt notice, biometrics, (c)(9) EAD approved (+ card expiry), interview scheduled for, interview done, RFE/NOID received, RFE answered, expedite requested/granted, mandamus filed, decision (if any); packet checklist (I-94/parole record, Cuban passport or birth certificate, I-693, photos, fee or I-912); optional nickname for the case (local only; up to 3 cases for family members); optional receipt number (local only, displayed masked `IOE09326XXXXX`) |
| Validation | Dates not in the future (except interview scheduled); receipt ≥ parole + 366 days else warning "one year and a day" (key facts §1); EAD after receipt |
| Result data | Headline sentence (doc 08 §11.7 copy); horizons 3/6/12/24/36 mo; q10/q25/q50 or "más de 6 años"; calendar translation "by 31 Dec 2026 ≈ 0.9%" etc.; FanChart (survival from today, 72 mo); ScenarioCards S0–S3 with posterior weights and per-scenario P(12); Queue card (pending, older than you, same month, completions last month, β); RegimeStrip ("pending 19 months, ≈10 under holds; adjudicable ≈ 306 days"); Official yardstick card (office 80% time for `131A-FAM` labelled "proxy (family-based)", case-inquiry date, "e-Request available? no until ≈ <month>"); Approval card (70–90%, centre 85% if packet complete; population shares Jul 49% / Aug 47% shown beside it; selection caveat); Eligibility/warning banners (F7); confidence "LOW · no validado" chip |
| Actions | Edit; add another family case; "¿Qué puedo hacer?" → S5; "Why these numbers?" → method sheet; Delete this case |
| Empty | Form with the reference case offered as an example ("Ver un ejemplo" loads a read-only demo, never saved) |
| Error | Estimator throws → card "No pudimos calcular" with the inputs echoed; never crash the screen (error boundary per tab) |

### S3 Offices / Oficinas — `/offices` (tab "Oficinas" / "Offices") and `/offices/[code]`

| | |
|---|---|
| Title | ES "Oficinas de USCIS" · EN "USCIS offices" |
| Purpose | Per-office yardsticks for Cubans' main offices (MIA, HIA, KND, OKL, WPB, OFM, TAM, ORL, JAC, HOU, DAL, SNA, LOU, LVG, NEW, NYC, CLT, ATL, CHI — key facts §6), full list behind "Ver todas" |
| Data | 80% months (`131A-FAM`, publication date), case-inquiry date, quarterly humanitarian pending and approved (labelled "includes refugees/asylees", doc 04 §1.3), shrunk multiplier m̂ with N completions and the k₀ = 50 note; state filter chips |
| Detail | Trend of the office's quarterly pending/approved; "If you filed on <date>, the inquiry date would need to reach it: ≈ <month>" (doc 15 §2.2 linear extrapolation, labelled crude) |
| Empty | Office missing from the processing-times mirror → "sin dato publicado" rather than 0 |

### S4 Alerts / Alertas — `/alerts` (tab "Alertas" / "Alerts") and `/alerts/[id]`

| | |
|---|---|
| Title | ES "Alertas: políticas, tribunales y datos" · EN "Alerts: policy, courts and data" |
| Data | Curated `alerts.json` sorted by date; each: severity chip, kind (policy / court / data / fees / enforcement), date, title, 2–3 sentence body "qué significa para usted", affected channels, source link + evidence tag; "Litigation watch" table from `policy.json` (case, court, docket, status today, what a ruling would change) — seeded from key facts §9 |
| Actions | Filter by kind; open source link (external browser; on web an `<a target="_blank" rel="noopener">`); mark all read |
| Empty | "No hay alertas nuevas desde <date>" |

### S5 What can I do? / ¿Qué puedo hacer? — `/case/remedies`

| | |
|---|---|
| Title | ES "¿Qué puedo hacer?" · EN "What can I do?" |
| Data | Ordered ladder (doc 15 §9.1): rung a e-Request (I-485 vs (c)(9) separately, each with its inquiry date and "available now / not until ≈ month"); rung b expedite (criteria; "needing the work permit by itself is not an expedite reason"); rung d congressional (FL-26/27/28 offices if FL); rung c Ombudsman with "may receive no reply"; rung e mandamus (≥ 24 mo soft / ≥ 36 strong; *Acosta Reynoso* context; $405 + counsel [T per doc 15]); rung f appointments only for concrete needs; *Red Eagle* class note; denial branch → I-290B/lawyer |
| Actions | Each rung: "Cómo hacerlo / How" steps, official link, Contact Center 1-800-375-5283 (ES: oprima 2) |
| Disclaimer | Pinned "Esto no es asesoría legal / This is not legal advice" |

### S6 More / Más — `/more` (tab) with `/more/settings`, `/more/glossary`, `/more/about`, `/more/privacy`

| | |
|---|---|
| Title | ES "Más" · EN "More"; Settings ES "Ajustes" · EN "Settings" |
| Settings | Language (same toggle), theme (system / light / dark; on web the host `data-theme` wins), notifications (native only; hidden on web), data source panel (status, official period, `generatedAt`, source list with retrieval time and per-source status, app version + data schema version), "Borrar mis datos / Delete my data" (two-step in-app confirm sheet, not `window.confirm`) |
| About | Method summary, evidence tags explained, "independiente, no oficial; no afiliado a USCIS/DHS", link to repo |
| Glossary | Key facts §10 table, EN/ES |

---

## 4. Architecture

### 4.1 Diagram

```
 OFFICIAL / MIRROR SOURCES (all verified in research; nothing invented)
 ┌───────────────────────────────┬────────────────────────────────┬───────────────────────────────┐
 │ www.uscis.gov data portal     │ github.com/jzebedee/uscis      │ federalregister.gov API v1    │
 │  monthly CSV  (I-485 Cuban)   │  daily SQLite release          │  (keyless)  + uscis.gov RSS   │
 │  quarterly all-forms XLSX     │  (processing times, inquiry    │  + CourtListener v4 (token,   │
 │  quarterly I-485-by-office    │   dates; egov is Cloudflare-   │    optional)                  │
 │  fallback: raw.githubuser-    │   blocked from cloud IPs)      │  → CANDIDATES only            │
 │  content omairqazi29 mirror   │                                │                               │
 └──────────────┬────────────────┴───────────────┬────────────────┴───────────────┬───────────────┘
                ▼                                ▼                                ▼
 ┌──────────────────────────────────────────────────────────────────────────────────────────────┐
 │ GitHub Actions  .github/workflows/caa-data-refresh.yml  (repo root of luisitin/Documents)    │
 │  cron 17 6 * * * and 17 18 * * * (default branch only) + workflow_dispatch (any branch)      │
 │  Node 22 + tsx:  app/pipeline/refresh.ts                                                     │
 │   fetch → parse → zod-validate (same schemas as the app) → merge data/curated/*.json →       │
 │   precompute estimator params (β fit, office multipliers, pool) → run reference-case canary  │
 │   → write data/*.json + manifest.json (sha256, as_of, per-source status) → git commit/push    │
 │  permissions: contents: write (job-level), nothing else                                      │
 └──────────────────────────────────┬───────────────────────────────────────────────────────────┘
                                    │ git (audit log = history of cuban-immigration-tracker/data/)
            ┌───────────────────────┴───────────────────────────────┐
            ▼ native                                                 ▼ web artifact (build time copy)
 https://raw.githubusercontent.com/luisitin/Documents/       app/scripts/build-artifact.mjs:
   <dataBranch>/cuban-immigration-tracker/data/manifest.json   expo export --platform web (single) →
 (no CORS concern on native)                                   inline JS+CSS → web-artifact/index.html
                                                               (HTML fragment) + web-artifact/data/*.json
            │                                                  fetched as RELATIVE "./data/manifest.json"
            ▼                                                       │
 ┌──────────────────────────────────────────────────────────────────▼───────────────────────────┐
 │ ONE Expo SDK 58 app (TypeScript; Expo Router JS tabs; react-native-web on web)               │
 │  src/data   DataProvider: bundled SAMPLE → cached copy (kv) → network (manifest, then only    │
 │             changed files by sha256) ; status = live | cached | sample ; asOf ; generatedAt   │
 │  src/core   pure TS: types, zod schemas, VPH-1 estimator, eligibility, remedy ladder          │
 │  src/storage kv adapter: AsyncStorage (native) | try/catch localStorage + memory (web)        │
 │  src/i18n   i18next + react-i18next, en/es, Intl formatters, persisted language               │
 │  src/ui     theme (host data-theme on web), SVG icons + charts (react-native-svg only)        │
 │  src/notifications  native: expo-notifications local ; web: no-op module                      │
 └──────────────────────────────────────────────────────────────────────────────────────────────┘
  - - - - - - - - - - - - - - - - - - - v1.1 (not MVP) - - - - - - - - - - - - - - - - - - - - - -
  Supabase write-mostly crowdsourcing (doc 09 §6) → aggregated by the same Action into data/community.json
```

### 4.2 Why this shape (ship-fast deviations from doc 09, each deliberate) [I]

| Doc 09 recommendation | This plan | Why |
|---|---|---|
| Python 3.12 pipeline (pandas/openpyxl) | **Node 22 + TypeScript pipeline inside the app package** (`app/pipeline/`, run with `tsx`) | One language, one lockfile, one set of zod schemas and the *same estimator code* the phone runs (the pipeline precomputes params and runs the canary). Agents never translate a schema between two languages. XLSX via `exceljs`, CSV via `csv-parse`, SQLite via `sql.js` (all already chosen for `packages/ingestion` in doc 13 §12.2, minus native `better-sqlite3`). |
| GitHub Pages as primary host | **Committed files + raw.githubusercontent.com** (native) and **relative files** (artifact) | Owner requirement; no Pages deploy job; doc 09 itself lists raw as a working fallback (§3.3, ~5-min cache [T]). Pages/jsDelivr stays a one-constant swap later. |
| expo-sqlite + kv-store + TanStack Query | **One kv adapter (AsyncStorage native / guarded localStorage web) + a ~150-line DataProvider** | expo-sqlite on web needs wasm plus COOP/COEP headers for SharedArrayBuffer [S: docs.expo.dev/versions/latest/sdk/sqlite.md, developer.chrome.com SQLite-Wasm OPFS post], which the artifact host does not let us set; total data < 100 KB so a KV of JSON blobs is enough; AsyncStorage 2.2.0 is in Expo Go (SDK notes §5) [N]. Fewer libraries = fewer failure modes on web. |
| react-native-gifted-charts | **Hand-rolled react-native-svg charts** (3 components) | Contract (g): no heavy chart libs; gifted-charts also pulls `expo-linear-gradient` and animated timers (SDK notes §7). |
| `expo-symbols` SymbolView icons | **In-repo SVG icon components** | Contract (b): no icon fonts/CDNs; SymbolView is native-first. |
| Supabase in phase 2 | Still v1.1, unchanged | — |

### 4.3 How "live" is achieved, honestly

- **There is no real-time official feed for aggregate CAA data.** USCIS publishes the monthly CSV ~4–8 weeks after
  month end and the quarterly workbooks ~10 weeks after quarter end (doc 04 §0); the processing-times tool changes
  "sometimes multiple times per day" but is only reachable through the daily `jzebedee` mirror (doc 13 §1.4, §1.6).
  "Live" in this app therefore means **"the newest official file, checked twice a day"**, and the UI says so.
- Job cadence `17 6 * * *` and `17 18 * * *` UTC (doc 09 §5.2); the 06:17 run may see yesterday's mirror release
  because `jzebedee` builds at 04:30 UTC — the job checks the release date and the 18:17 run catches up (doc 09 §5.2.5).
- App refresh policy: on cold start and on foreground if the last check is > 6 h old; manifest first (~2–4 KB),
  then only files whose `sha256` changed. Native fetches raw GitHub URLs; web fetches `./data/…`.
- **Two dates on every screen**: the *official period* ("datos oficiales hasta agosto 2026") and the *check time*
  ("revisado hace 3 h"). The chip colour encodes status: green Live, grey Cached, amber Sample, red Stale.

### 4.4 Storage

| Data | Where | Notes |
|---|---|---|
| Last good copy of each data file + manifest | kv `data:<file>` (JSON string) | ≤ 100 KB total [I]; validated with zod before write |
| My cases (≤ 3) | kv `cases:v1` | Local only; never transmitted in the MVP |
| Language, theme, onboarding done, read-alert ids, notification schedule ids | kv `settings:v1` | |
| Bundled sample snapshot | `app/src/data/sample/*.json` (imported by Metro) | Frozen copy of `data/` at build time; last-resort fallback |

Web adapter: every `localStorage` access wrapped in try/catch; on failure an in-memory Map is used for the session
and the app renders normally (contract d). Native: `@react-native-async-storage/async-storage@2.2.0` installed with
`npx expo install` (SDK notes §1 lists exactly this version as Expo Go-compatible [N]). The async hydration delays
first paint by one tick; the splash screen is held until `kv.ready` (≤ 100 ms) [I].

### 4.5 Optional backend (v1.1)

Supabase exactly as doc 09 §6.3 (anonymous auth, RLS, 3 rows/owner, `delete_my_account()`, no client SELECT on raw
rows; the Action aggregates with n ≥ 5 suppression and publishes `data/community.json`). The MVP degrades
gracefully because nothing reads from Supabase; v1.1 only adds a "share my timeline anonymously" switch.

### 4.6 Web artifact specifics (contract (a)–(i))

| Contract item | Implementation [I unless tagged] |
|---|---|
| (a) HTML fragment | `build-artifact.mjs` reads `dist/index.html`, extracts every `<script src>` and `<link rel=stylesheet>` it references (it **parses** the file rather than assuming `_expo/static/js/web/entry-*.js`, because today's search confirmed only that single mode emits one `index.html` in `dist` [S: docs.expo.dev/distribution/publishing-websites/], not the bundle path), inlines them, and emits exactly: `<title>CAA Tracker</title><style>…</style><div id="root"></div><script>prelude</script><script>bundle</script>`. Inline bundle text has `</script` escaped as `<\/script`. No doctype/html/head/body. |
| (b) CSP | No external URLs in the output: the script fails the build if the fragment contains `http://` or `https://` inside `src=`/`href=`/`url(` other than plain `<a href>` links in data; assets referenced as `/assets/...` are inlined as `data:` URIs (SVG/PNG ≤ 50 KB each) or dropped; system font stack only. Data files copied to `web-artifact/data/` and fetched relatively. |
| (c) Unknown initial path, URL changes invisible | `src/app/+not-found.tsx` returns `<Redirect href="/" />`; `src/platform/webGuard.ts` (web only) runs before the router mounts: if `location.pathname` is not a known route, `history.replaceState(null, '', '/')`. **Critical subtlety:** after that replace, a relative `./data/` would resolve against `/`, so the prelude script captures `window.__CAA_DATA_BASE__ = new URL('./data/', document.baseURI).href` **before** the bundle runs, and the web fetcher uses it. |
| (d) Storage can throw | §4.4 adapter; Prove step runs once with `localStorage` getter throwing. |
| (e) No print/download/dialogs | No `window.print`, no file export, no `alert/confirm/prompt` (in-app sheets instead), no device APIs on web; notifications module is a no-op on web; "Share" hidden on web. |
| (f) Theme | `useThemeName()` on web = `document.documentElement.dataset.theme` if `light`/`dark` (MutationObserver on `data-theme`), else `prefers-color-scheme` (`matchMedia` listener); native = `useColorScheme()`. Fragment `<style>`: light tokens on `:root`, dark under `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {…} }` and again under `:root[data-theme="dark"]`, with `color-scheme: dark`; explicit `background` on `body` and `#root` for both. |
| (g) Size | Production minified export; budget **≤ 3 MB** fragment (hard fail at 15 MB) [I]; no Skia/Victory/moment/lodash; `date-fns` not used (Intl only). |
| (h) Layout | Root view `maxWidth: 560, alignSelf: 'center', width: '100%'`, 16 px gutters, `flexWrap` tiles; charts measure container width via `onLayout`; Prove asserts `document.documentElement.scrollWidth <= 390` at 390 px. |
| (i) Prove | `app/scripts/prove-artifact.mjs`: serve `web-artifact/` under a deep random path (`/x/y/z/`), wrap the fragment in a minimal skeleton (charset, `viewport-fit=cover`, 14 px system font, zero margin), drive headless Chromium (playwright-core with a system Chromium; see §13 open question) through: boot, all 5 tabs, language toggle (assert Spanish strings), theme toggle via `data-theme`, reference-case estimate (assert "9 %" headline and "306"), data chip "Live" (with `data/`) and "Sample" (with `data/` removed), `localStorage` throwing. |
| Optional MCP refresh | `src/data/hostRefresh.web.ts`: if `window.claude?.use` exists and resolves an `mcp` capability, try GitHub `get_file_contents` on `luisitin/Documents` for `cuban-immigration-tracker/data/manifest.json`; any error → silently keep shipped files. Behind a flag, off by default, built last. |

---

## 5. Data model (TypeScript, `app/src/core/types.ts`; zod twins in `schema.ts`)

```ts
// ---------- shared primitives ----------
export type ISODate = string;            // "2026-10-20"
export type YearMonth = string;          // "2026-08"
export type Lang = 'en' | 'es';
export type Evidence = 'F' | 'S' | 'S-sec' | 'T' | 'I' | 'U';
export interface Localized { en: string; es: string }
export interface Provenance { sourceId: SourceId; asOf: ISODate | YearMonth; retrievedAt?: string; evidence: Evidence; url?: string }

export type SourceId =
  | 'uscis_monthly_csv' | 'uscis_quarterly_all_forms' | 'uscis_i485_by_office'
  | 'jzebedee_processing_times' | 'mirror_visualizer' | 'federal_register' | 'uscis_rss'
  | 'courtlistener' | 'curated';

// ---------- manifest (data/manifest.json) ----------
export interface Manifest {
  schemaVersion: 1;
  generatedAt: string;                   // ISO timestamp of the job run
  dataBranch: string;                    // branch the job committed to
  latestOfficialMonth: YearMonth;        // "2026-08"
  latestOfficialQuarter: { fy: number; q: 1 | 2 | 3 | 4 }; // FY2026 Q3
  files: Record<DataFileName, { path: string; sha256: string; bytes: number; asOf: string }>;
  sources: SourceStatus[];
  canary?: { caseId: 'T15'; pWithin12: number; q50: number | null; changedFromPrevious: boolean };
}
export type DataFileName = 'national' | 'quarterly' | 'offices' | 'policy' | 'alerts' | 'params';
export interface SourceStatus {
  id: SourceId; url: string; status: 'ok' | 'not_modified' | 'blocked' | 'http_error' | 'parse_error' | 'skipped_no_secret' | 'fallback_used';
  lastSuccessAt?: string; sha256?: string; publishedPeriod?: string; note?: string;
}

// ---------- official snapshots ----------
export interface MonthlyRow {             // data/national.json: rows[]; doc 04 §1.1, doc 08 §11.2
  ym: YearMonth; received: number; approved: number; denied: number;
  pending: number; pendingOver6: number; avgMonths: number;   // avgMonths = MEAN of completions
  provenance: Provenance;
}
export interface I765NationalRow { ym: YearMonth; received: number; approved: number; pending: number; avgMonths: number } // all categories; Mar–Apr 2025 caveat (doc 04 §1.1)

export interface QuarterRow {             // data/quarterly.json
  fy: number; q: 1 | 2 | 3 | 4; form: 'I-485 (Cuban)' | 'I-765 (Adjustment Of Status)' | 'I-765 (All Other)';
  received: number; approved: number; denied: number; completions: number;
  pending: number;                        // WORKBOOK pending: label "quarterly workbook", never headline
  medianMonths: number;                   // MEDIAN of completions
  fytd?: { received: number; approved: number; denied: number };
  provenance: Provenance;
}
export interface HistoricMedian { fy: number; months: number; cutDate: ISODate; ytd: boolean; provenance: Provenance } // 3.3/4.6/7.0/11.8(+12.3)

// ---------- processing-time records (data/offices.json) ----------
export interface Office {
  code: string;                           // read from the mirror, never hard-coded (KEN vs KND, doc 12 §3)
  name: string; state: string;            // 2-letter
  cubanFocus: boolean;                    // key facts §6 subset
}
export interface ProcessingTimeRecord {
  form: 'I-485' | 'I-765'; subtype: '131A-FAM' | '147-C9' | '147-C11';
  officeCode: string;
  months80: number | null;                // one value now; parser accepts legacy 2-value ranges (doc 13 §1.1)
  inquiryDate: ISODate | null;            // service_request_date
  publicationDate: ISODate;
  isProxy: true;                          // no CAA subtype exists
  provenance: Provenance;
}
export interface OfficeQuarterStat {      // humanitarian = Cuban + refugee + asylee (doc 04 §1.3)
  officeCode: string; fy: number; q: 1 | 2 | 3 | 4;
  received: number; approved: number; denied: number; pending: number; provenance: Provenance;
}
export interface OfficesFile { offices: Office[]; processingTimes: ProcessingTimeRecord[]; quarterly: OfficeQuarterStat[] }

// ---------- regime changes, scenarios, litigation (data/policy.json, curated) ----------
export type EntryChannel = 'CHNV' | 'CBP_ONE' | 'FRP_CFRP' | 'U4U' | 'OTHER_PAROLE' | 'VISA' | 'I220A' | 'EWI' | 'CONDITIONAL_PAROLE_236' | 'UNKNOWN';
export interface Regime {
  id: 'R0' | 'R1' | 'R2' | 'R3' | 'R4';
  label: Localized; start: ISODate | null; end: ISODate | null; hold: boolean;
  appliesTo: (EntryChannel | 'ALL_CUBAN')[];
  altEnds?: { legal?: ISODate; ops?: ISODate[] };
  confidenceByChannel?: Partial<Record<EntryChannel, 'low' | 'medium' | 'high'>>; // CBP_ONE R1 exemption: low
  instruments: { id: string; date: ISODate; appliesToCaa?: boolean; confidence?: string; source: string }[];
}
export interface SubBreakpoint { date: ISODate; event: Localized; kind: 'policy' | 'court' | 'ead' | 'fees' | 'enforcement' }
export interface Scenario {
  id: 'S0' | 'S1' | 'S2' | 'S3'; label: Localized; weight: number;     // weights edited by PR when alerts land
  path: { kind: 'flat'; level: number } | { kind: 'ramp'; from: number; to: number; months: number }
      | { kind: 'freezeThen'; freezeMonths: number; then: { kind: 'ramp'; from: number; to: number; months: number } };
}
export interface LitigationCase {
  id: string; caption: string; court: string; docket: string; courtListenerId?: number; clearinghouseId?: number;
  status: Localized; statusAsOf: ISODate; effectRule: Localized;          // e.g. "reversed → S3 × 3 (× 1.5 while Red Eagle PI)"
}
export interface PolicyFile {
  regimes: Regime[]; subBreakpoints: SubBreakpoint[]; scenarios: Scenario[]; litigation: LitigationCase[];
  historicMedians: HistoricMedian[];
  cohort: { chnvCubans: number; cbpOneCubans: { central: number; low: number; high: number } };
  approvalPrior: { low: 0.7; high: 0.9; centre: 0.85; populationShares: { ym: YearMonth; share: number; n: number }[] };
  fees: { form: string; usd: number; since: ISODate; source: string }[];
}

// ---------- alerts (data/alerts.json, curated) ----------
export interface Alert {
  id: string;                             // "2026-08-05-pa-2026-05"
  date: ISODate; kind: 'policy' | 'court' | 'data' | 'fees' | 'enforcement' | 'ead';
  severity: 'high' | 'medium' | 'info';
  title: Localized; body: Localized;      // plain language, "what it means for you"
  appliesTo?: (EntryChannel | 'ALL_CUBAN')[];
  sourceUrl: string; evidence: Evidence;
  effect: 'reweight' | 'copy' | 'info';   // reweight = scenario weights in policy.json were changed in the same PR
  supersedes?: string[]; expires?: ISODate;
}
export interface AlertCandidate { id: string; foundAt: string; source: SourceId; title: string; url: string; matchedTerms: string[] } // never shown in-app

// ---------- estimator parameters (data/params.json, computed by the job) ----------
export interface EstimatorParams {
  version: string; fittedThrough: YearMonth;
  beta: number;                           // fitted (doc 08 §5.5) — fallback 0.037
  horizonMonths: 72; receiptsForecast: number;   // 1,000/month
  k0Office: 50; clampOffice: [0.5, 2];
  officeMultipliers: { officeCode: string; raw: number; shrunk: number; completions: number; window: string }[];
  postInterview: { medianMonths: 3; sigma: 0.857 };
  multipliers: { ead: 1; noBiometricsAfter4mo: 0.7; rfePending: 0; rfeAnswered: 1.5; rfeAnsweredMonths: 3; mandamus: 1.3; mandamusMonths: 4; expediteGrantedMedianMonths: 2 };
  pool?: { label: string; age: number; n: number }[];  // precomputed vintages at fittedThrough (device may recompute)
}

// ---------- case timeline + milestones (local only in MVP; same shape for v1.1 upload) ----------
export type MilestoneKey =
  | 'filed' | 'receipt' | 'biometrics' | 'ead_c9' | 'ap_i131' | 'interview_notice' | 'interview'
  | 'rfe' | 'rfe_response' | 'noid' | 'expedite_request' | 'expedite_granted' | 'erequest'
  | 'congressional_inquiry' | 'ombudsman' | 'mandamus' | 'decision' | 'card';
export interface Milestone { key: MilestoneKey; date: ISODate; source: 'notice' | 'online_status' | 'memory'; detail?: string }
export interface CaseTimeline {
  localId: string;                        // uuid, device only
  nickname?: string;                      // device only, never uploaded
  receiptFull?: string;                   // device only; display masked
  entryChannel: EntryChannel;
  paroleDate?: ISODate; paroleEndOriginal?: ISODate;
  terminationNotices?: ('EMAIL_APR_2025' | 'CHNV_JUN_2025' | 'INDIVIDUAL_APR_2026' | 'FRP_JAN_2026' | 'OTHER')[];
  i485ReceiptDate: ISODate; state?: string; officeCode?: string;
  i765FiledWithI485?: boolean; eadExpiry?: ISODate;
  milestones: Milestone[];
  decision?: { outcome: 'approved' | 'denied' | 'withdrawn' | 'admin_closed'; date: ISODate };
  packet: { i94: boolean | null; cubanIdentity: boolean | null; i693: boolean | null; photos: boolean | null; feeOrWaiver: boolean | null };
  createdAt: string; updatedAt: string; consentVersion?: number;  // v1.1
}
export interface DerivedFlags {             // computed by core/eligibility.ts, never stored
  isParoleBased: boolean; caaParoledElementMet: boolean; r1HoldApplies: boolean; r1Confidence: 'low' | 'high';
  frpI485Carveout: boolean; redEagleClassMember: boolean; doeDhsClassMember: boolean | 'unknown';
  expeditedRemovalWarning: boolean; i220aWarning: boolean; oneYearWarning: boolean; packetComplete: boolean | null;
}
```

---

## 6. Data pipeline

### 6.1 Sources (only those verified in research)

| # | Source | Exact URL pattern | Parser (`app/pipeline/sources/*.ts`) | Cadence (publisher) | Output | Failure handling |
|---|---|---|---|---|---|---|
| P1 | **USCIS monthly Report-to-Congress CSV** (Must) | Discover via `https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data` (regex `appropriation_requirement` case-insensitive, space-encoded allowed); construct candidates `https://www.uscis.gov/sites/default/files/document/data/appropriation_requirement_<month>_<year>_v1.0.csv` for latest+1 and +2 (HEAD) (doc 04 §1.1; doc 13 §3.2). Headers: browser `User-Agent` (Drupal anti-bot 403s default agents; GitHub runners succeed with a browser UA [S per doc 13 §3.1]) | `monthlyCsv.ts`: strip BOM; skip the 4-line title block; header `Form Number,Description,Forms Received,Approvals,Denials,Pending,Pending Over 6 Months,Avg. Processing Time`; tolerate trailing comma and `"355,520"` strings; pick row `I-485` + `(Cuban)`; also the `I-765` national line; "For the Month of <Month YYYY>" → `ym` | Monthly, 4–8 weeks lag; Sept 2026 file **not out as of today** [S: CiberCuba 2026-10-20 and Newsweek results in today's search returned only FY26 Q3] | `national.json` rows (append/replace by `ym`) | Fallback `https://raw.githubusercontent.com/omairqazi29/visualizer/master/data/USCIS_I485/monthly_<month>_<year>.csv` (doc 04 §1.0); regression fixture Aug 2026 = 1,213/386/434/355,520/345,741/20.6 must re-parse identically or the job fails |
| P2 | **USCIS quarterly all-forms XLSX** (Must) | `https://www.uscis.gov/sites/default/files/document/data/quarterly_all_forms_fy<YYYY>_q<N>_v1.xlsx` (latest fy2026_q3; HEAD fy2026_q4 each run; expected ≈ early Dec 2026) (doc 13 §3.2–3.3) | `quarterlyAllForms.ts` (exceljs): sheet `FY26Q3_All_Forms`-like (match `/All_Forms/`), find rows `I-485` + `Cuban`, `I-765` + `Adjustment Of Status`; 13 columns (doc 04 §1.2) | Quarterly, ~10 weeks lag | `quarterly.json` | Mirror `…/omairqazi29/visualizer/master/data/USCIS_I485/quarterly_all_forms_fy2026_q3_v1.xlsx` with sha compare (doc 13 §12.4); fixture FY26 Q3 6,279/139/447/586/342,360/16.3 |
| P3 | **USCIS I-485 by field office XLSX** (Must) | `…/document/data/i485_performance_data_fy<YYYY>_q<N>_v1.xlsx`; **stem drifts** (four names in two years) → take the href from the portal index, constructed URL only as a guess (doc 13 §3.2) | `i485ByOffice.ts`: sheet `I485_by_State`; state headings then office rows `Office name | Field Office Code | …`; humanitarian block (received/approved/denied/pending) | Quarterly | `offices.json.quarterly`; `params.json.officeMultipliers` | Same mirror; fixture Hialeah FY26 Q3 pending 37,486 (doc 13 §12.4) |
| P4 | **Processing times via `jzebedee/uscis`** (Must) | `GET https://api.github.com/repos/jzebedee/uscis/releases/latest` (with `GITHUB_TOKEN`) → asset `https://github.com/jzebedee/uscis/releases/download/<YYYY-MM-DD>/<YYYY-MM-DD>.db` (doc 13 §1.6) | `processingTimes.ts` (sql.js): `processing_time` rows for `I-485`/`131A-FAM` (all offices) and `I-765`/`147-C9`,`147-C11` (NBC, SCD); columns `range_upper(_unit)`, `range_lower`, `service_request_date`, `publication_date` (doc 13 §1.2); `offices(code, description)` for the office list | Daily mirror build 04:30 UTC | `offices.json.processingTimes`, `offices.json.offices` | If the release is not dated today, keep yesterday's and let the 18:17 run retry; **licence caveat**: repo has no LICENSE (doc 13 §1.6) → publish only derived fields with attribution, ask the maintainer (open question §13) |
| P5 | Federal Register API v1 (Should) | `https://www.federalregister.gov/api/v1/documents.json?conditions[term]=(Cuban OR Cubans OR "Cuban Adjustment Act" OR parole OR parolees OR CHNV)&conditions[agencies][]=homeland-security-department&conditions[agencies][]=u-s-citizenship-and-immigration-services&conditions[agencies][]=u-s-customs-and-border-protection&conditions[publication_date][gte]=<last run>&order=newest&per_page=100` (doc 13 §6) | `federalRegister.ts`: new `document_number`s → candidates | Daily issue ~6am ET | `data/candidates/alert-candidates.json` | Keyless; failure = skip with status |
| P6 | USCIS RSS (Should) | `https://www.uscis.gov/news/rss-feed/22984` (alerts), `…/23269` (news releases), browser UA (doc 13 §9) | `uscisRss.ts` (fast-xml-parser): new items with terms (Cuba, CAA, parole, hold, adjudication, PA-, PM-602) → candidates | Event-driven | same candidates file | Skip on 403 |
| P7 | CourtListener v4 (Should, token-gated) | `GET https://www.courtlistener.com/api/rest/v4/docket-entries/?docket=<id>&order_by=-date_filed` for ids 73477958 (*Dorcas* 1st Cir.), 73380879 (*Red Eagle*), 74919678 (*AAUP*), 71085922 (*Doe v. DHS*), 69695790 (*Doe v. Mullin*) with `Authorization: Token …` (doc 13 §7; key facts §8) | `courtListener.ts`: entries newer than last seen → candidates; ≤ 5 requests/run (budget 125/day) | Real time | same | No secret → `skipped_no_secret` |
| C1 | **Curated inputs** (Must) | `cuban-immigration-tracker/data/curated/policy.json`, `alerts.json` edited by humans via PR | `curated.ts`: zod-validate, copy into published files | On PR | `policy.json`, `alerts.json` | Invalid curated JSON fails CI on the PR, never the cron |

Seed content for `policy.json` comes verbatim from key facts §3 (regimes JSON, sub-breakpoints, defaults), §6
(offices), §7 (cohort, historic medians) and §9 (litigation); seed `alerts.json` (≈ 12 items) from master timeline
rows 2026-05-22 (PM-602-0199, applies_to_caa false likely), 2026-06-05/12 (*Dorcas* vacatur and compliance),
2026-08-05 (PA-2026-05), 2026-08-11 (*CHIRLA* stay vacated), 2026-08-14 (1st Cir. partial stay, re-review only),
2026-08-24 (*Red Eagle* PI), 2026-09-18 (I-485 edition 09/18/26), 2026-10-05 (*AAUP v. Mullin* filed; no PI as of
mid-October [S: today's search summary of CiberCuba/Newsweek coverage]), 2026-10-14 (EAD auto-extension final rule),
2026-10-16 (FY2027 fees; none on I-485/(c)(9)), 2026-10-20 (FY26 Q3 data public: 139/447).

### 6.2 Output JSON (published under `cuban-immigration-tracker/data/`)

```
data/
  manifest.json            Manifest (§5)           ~3 KB   bot-written
  national.json            { rows: MonthlyRow[], i765National: I765NationalRow[] }   ~8 KB
  quarterly.json           { rows: QuarterRow[] }  ~4 KB
  offices.json             OfficesFile             ~30 KB (90 offices × 3 subtypes)
  policy.json              PolicyFile              ~15 KB  copied from curated/
  alerts.json              { alerts: Alert[] }     ~15 KB  copied from curated/
  params.json              EstimatorParams         ~4 KB   computed
  curated/policy.json, curated/alerts.json         human-edited via PR (CODEOWNERS)
  candidates/alert-candidates.json                 machine-found, never shown in app
  raw/<source>/<period>.<ext>.sha256               provenance only (raw CSV kept, ~4 KB each; XLSX/DB not committed)
```

All numeric fields carry `provenance` (key facts header rule: "every value should be stored with an `as_of` and a
`source`"). The pipeline exports JSON Schema from the zod schemas (`z.toJSONSchema` [T per doc 09]) into
`data/schema/` for external readers.

### 6.3 Pipeline steps (`app/pipeline/refresh.ts`)

```
1. load previous data/*.json (or empty)
2. for each source P1..P7 independently (try/catch per source, 30 s timeout, 1 retry, ≥1 s between same-host calls):
     fetch (browser UA for gov hosts) → classify (ok/not_modified/blocked/http_error) → parse → zod.safeParse
     on failure: keep previous output for that file, record SourceStatus, continue
3. sanity checks (refuse to publish a source's output if any fail; status=parse_error):
     counts ≥ 0; ym strictly increasing; pending within ±25% of previous month; regression fixtures re-parse identically
4. merge curated/*.json (already CI-validated)
5. compute params: fitBeta(national.rows) (doc 08 §11.5, fallback 0.037); officeMultipliers(FY latest two quarters,
   approvals-only in MVP to match doc 08 §7.3 / T6, denials added in v1.1); pool = reconstructPool(rows, beta)
6. canary: estimate(T15 reference case) → manifest.canary; if P(≤12) moved > 2 points vs previous run, add
   "canary moved" note to the commit message (human sees it in history)
7. write files (stable key order, 2-space JSON) → sha256 → manifest.json (generatedAt, latestOfficialMonth, files, sources)
8. if nothing but generatedAt changed → commit "data: heartbeat" (keeps the 60-day schedule alive, doc 09 §5.2.2)
   else commit "data: <sources changed>"
```

Local run: `cd app && npm run data:refresh` (same code; writes `../data`). `npm run data:sample` freezes
`../data/*.json` into `app/src/data/sample/`.

### 6.4 Workflow sketch (at the **repository root**: `luisitin/Documents/.github/workflows/caa-data-refresh.yml`)

GitHub only reads workflows from the repository root's `.github/workflows/` [T], so the file lives outside
`cuban-immigration-tracker/` and every path inside it is prefixed.

```yaml
name: caa-data-refresh
on:
  schedule:                       # runs ONLY on the default branch (owner note, requirement 3)
    - cron: "17 6 * * *"
    - cron: "17 18 * * *"
  workflow_dispatch:              # manual run on any branch, incl. the feature branch
    inputs:
      dry_run: { type: boolean, default: false, description: "parse and validate, do not commit" }
  push:                           # so the feature branch gets data before the workflow reaches the default branch
    branches: ["claude/**"]
    paths: ["cuban-immigration-tracker/app/pipeline/**", "cuban-immigration-tracker/data/curated/**"]
permissions: {}                   # nothing at workflow level
concurrency: { group: "caa-data-refresh-${{ github.ref }}", cancel-in-progress: false }
jobs:
  refresh:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    permissions: { contents: write }          # least privilege: push data commits, nothing else
    defaults: { run: { working-directory: cuban-immigration-tracker/app } }
    steps:
      - uses: actions/checkout@<sha-of-v7>     # pin by SHA (doc 09 §5.3)
        with: { ref: "${{ github.ref_name }}" }
      - uses: actions/setup-node@<sha-of-v7>
        with: { node-version: 22, cache: npm, cache-dependency-path: cuban-immigration-tracker/app/package-lock.json }
      - run: npm ci --ignore-scripts
      - run: npx tsx pipeline/refresh.ts --out ../data
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}               # api.github.com release lookup only
          COURTLISTENER_TOKEN: ${{ secrets.COURTLISTENER_TOKEN }} # optional; absent → skipped_no_secret
      - if: ${{ !inputs.dry_run }}
        run: |
          git config user.name "caa-data-bot"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add ../data
          git diff --cached --quiet && exit 0
          git commit -m "data: refresh $(date -u +%FT%H:%MZ) [skip ci]"
          git pull --rebase origin "${{ github.ref_name }}" && git push origin "HEAD:${{ github.ref_name }}"
```

Notes: `[skip ci]` keeps the CI workflow from running on bot commits; the `push` trigger only watches pipeline and
curated paths so bot commits under `data/` (not matched) cannot loop [I]. Whether `workflow_dispatch` can be
triggered on a branch before the workflow file exists on the default branch is [T]-uncertain; the `push` trigger
plus `npm run data:refresh` locally cover the feature branch either way (§13). A separate `caa-ci.yml` (same
location) runs typecheck, lint, jest, vitest, i18n check, `expo export -p web`, `build-artifact`, size check and
the Prove step on PRs touching `cuban-immigration-tracker/**`, with `permissions: { contents: read }`.

---

## 7. Estimation model (v1 = doc 08 VPH-1 with the Round-2 amendments)

### 7.1 Inputs

- **Data**: `national.rows` (monthly series from Sep 2024, the first month with `pendingOver6` usable as legacy
  split, doc 08 §5.3), `params` (β, office multipliers, pool), `policy` (regimes, scenarios+weights, approval prior),
  `offices.processingTimes` (inquiry dates), `today`.
- **Case**: `CaseTimeline` (§5).
- **Not inputs (deliberately)**: state beyond its office; EAD date as a speed-up (multiplier 1.0, no evidence,
  doc 08 §7.5); anything crowdsourced (v1.1+).

### 7.2 Algorithm (pseudo-code; `app/src/core/estimator/estimate.ts`)

```ts
export function estimate(c: CaseTimeline, d: { national; params; policy; offices }, today: ISODate): EstimateResult {
  // 0. Eligibility gate (key facts §1)
  const f = deriveFlags(c, today, d.policy);
  if (c.decision) return { kind: 'decided', flags: f };
  if (['I220A', 'EWI', 'CONDITIONAL_PAROLE_236'].includes(c.entryChannel))
    return { kind: 'ineligible', flags: f };                // copy + litigation watch, NO numbers
  // UNKNOWN channel: compute, but flag "R1 assumed per CHNV" and confidence LOW

  // 1. Clock (display + T11/T19/T21/T22)
  const holds = d.policy.regimes.filter(r => r.hold && (r.appliesTo.includes('ALL_CUBAN') || r.appliesTo.includes(c.entryChannel)));
  const calendarDays = days(c.i485ReceiptDate, today);
  const adjudicable = calendarDays - sum(holds.map(r => overlap(c.i485ReceiptDate, today, r.start, r.end ?? today)));
  const adjudicableAlt = /* same with altEnds.ops (2025-06-25, 2026-07-16) */;

  // 2. Pool + β (precomputed by the job; recompute if params.fittedThrough < last national row)
  const beta = d.params.beta;                               // 0.0374 today (T14)
  const pool0 = d.params.pool ?? reconstructPool(d.national.rows, beta);
  const vintage = ym(c.i485ReceiptDate) < first(pool0).label ? 'legacy>6mo' : ym(c.i485ReceiptDate);

  // 3. Office multiplier (Gamma–Poisson shrink k0=50, clamp [0.5,2]); unknown office → 1.0
  const mOffice = d.params.officeMultipliers.find(o => o.officeCode === c.officeCode)?.shrunk ?? 1;

  // 4. Milestone state machine (doc 08 §7.5, amended by doc 15 §9.3)
  const ms = milestoneState(c, today);
  //  'interview_done'      → post-interview lognormal(median 3, σ .857), conditional on months since interview
  //  'interview_scheduled' → [I] same lognormal shifted to start at the scheduled date (hazard 0 before it)
  //  'expedite_granted'    → lognormal(median 2, σ .857) from grant date [I per doc 15 §9.3]
  //  'rfe_pending'         → hazard 0 until response; show RFE deadline ≤ 12 weeks (PA-2026-05)
  //  'queue'               → VPH-1 grid below, with time-limited multipliers:
  //        rfe answered within last 3 mo ×1.5 · mandamus filed within last 4 mo ×1.3 (NOT ×3) ·
  //        no biometrics and > 4 mo since receipt ×0.7 · EAD ×1.0
  if (ms.kind !== 'queue' && ms.kind !== 'rfe_pending') return postInterviewResult(ms, today, f, ...);

  // 5. Deterministic grid: 4 scenarios × β∈{β/2,β,2β} (¼,½,¼) × m∈{0.8m,m,1.25m} (¼,½,¼) = 36 paths
  const k0 = monthsBetween(lastRow.ym, ym(today));          // 2 for Aug 2026 data on 2026-10-20
  const paths = grid(d.policy.scenarios, beta, mOffice).map(p => ({
    prior: p.weight,
    S: projectPath(pool0, vintage, p.beta, p.scenario, p.m * ms.multiplierAt /*k*/, 72 + k0, d.params.receiptsForecast),
  }));                                                      // h_k = min(.95, C_k e^{βa_u}/Σ n e^{βa} · m), S_k = S_{k-1}(1-h_k)

  // 6. Condition on "still pending today" and mix (posterior weight ∝ prior × S(k0))
  const { S, post } = mixAndCondition(paths, k0);

  // 7. Outputs
  return {
    kind: 'estimate',
    asOfData: lastRow.ym, flags: f,
    clock: { calendarDays, adjudicable, adjudicableAlt, holdsApplied: holds.map(h => h.id) },
    pWithin: at(S, [3, 6, 12, 24, 36]),                     // from today
    byDate: at(S, monthsTo(['2026-12-31', '2027-12-31', '2028-12-31'])),
    quantiles: quantiles(S, [.1, .25, .5, .75, .9]),         // null = beyond 72 months
    survival: S,                                            // fan chart
    perScenario: scenarioSummaries(paths, post),            // posterior weight, P(12), median per scenario
    queue: { pendingTotal, olderThanYou, sameMonthAsYou, completionsLastMonth, beta },
    office: { code: c.officeCode, multiplier: mOffice, n: ... },
    officialYardstick: yardstick(c, d.offices),             // 80% months + inquiry date + "e-Request when ≈"
    approval: approvalCard(f.packetComplete, d.policy.approvalPrior),  // NEVER multiplied into timing
    confidence: confidenceLabel(d),                         // LOW while R4 < 6 months of data (doc 08 §11.4.11)
    validated: false,
    guards: dataVintageGuards(d, today),                    // T20 a/b
  };
}
```

Helper functions are ported **verbatim** from doc 08 §11.5 (`reconstructPool`, `removeCompletions`,
`meanAgeOfCompletions`, `fitBeta`, `officeMultiplier`, `projectPath`, `mixAndCondition`, `postInterviewCdf`,
`adjudicableDays`, `scenariosDefault`), with one fix: `adjudicableDays` uses the regime's `appliesTo` list (so R1 is
subtracted for CHNV, FRP_CFRP and U4U, not only CHNV, and never for CBP_ONE, VISA, OTHER_PAROLE — key facts §1 flags,
doc 16 §8.2). Doc 08's pseudo-code leaves `fitBeta`'s replay loop elided; the port completes it (record the model
mean age of completions in each target month before removal) and T14 is the acceptance test.

### 7.3 How milestones, state and filing date condition it

| Input | Effect | Basis |
|---|---|---|
| Filing date | Picks the vintage in the reconstructed pool (age, cases older than you, same-month count); drives which holds overlap; older vintages slightly favoured via β | doc 08 §5.3, §5.5; T17 (Oct 2025 vs Mar 2025: 7.4% vs 9.4%) |
| Entry channel | Holds subtracted for the clock; eligibility gate; warnings; **does not change the hazard** in v1 (the pool is one class) — said in the UI | doc 08 §5.6 (biggest known mis-specification, fixed in v2.2) |
| State → office | Shrunk multiplier m̂ (0.83 KND … 1.94 TAM today); unknown → 1.0; office yardstick card | doc 08 §7.3; T6, T16 |
| EAD received | ×1.0; confirms biometrics; drives EAD-renewal reminder and (c)(9) remedy rung | doc 08 §7.5; doc 07 §5.3 |
| Biometrics missing > 4 months | ×0.7 (routing problem signal) | doc 08 §7.5 |
| Interview scheduled / done | Switch to post-interview distribution (median 3 mo, 10–90%: 1–9) | doc 08 §7.5; T10 |
| RFE/NOID | Hazard 0 until answered; then ×1.5 for 3 months; deadline copy per PA-2026-05 | doc 08 T18; doc 14 §8.2 |
| Mandamus filed | ×1.3 for 4 months (provisional) | doc 15 §9.3 (replaces doc 08's ×3) |
| Packet checklist | Only the approval card (70–90% centre 85% when complete; when incomplete/unknown: range shown with "may be lower — PA-2026-05 allows denial without RFE" and no centre) | doc 14 §8.1 [I for the incomplete wording] |

### 7.4 Presenting uncertainty (rules from doc 08 §11.7, enforced by tests)

1. Never a single date. 2. Lead with P(decision) by horizon. 3. Median only if inside 72 months, else "más de 6 años /
more than 6 years". 4. Always show data vintage, queue numbers, N behind the office multiplier. 5. Scenario weights
visible (S0 30 / S1 40 / S2 15 / S3 15) with per-scenario P(12) (2.4% / 10.2% / 26.3% / 4.4% for the reference case,
doc 08 §11.8). 6. Adjudicable-time strip. 7. Approval in a separate card with the selection caveat and the
population shares (Jul 49%, Aug 47%). 8. "LOW · no validado — basado en 3 meses de datos del régimen actual".
A unit test renders the result card and fails if any `Date` string appears in the headline.

### 7.5 The 2025 holds

- Encoded as data (`policy.json.regimes`), not code: R1 2025-02-14 → 2025-06-09 (CHNV/U4U/FRP only; CBP One 0 days,
  low-confidence flag), R3 2025-12-02 → 2026-06-12 (all Cubans), with legal/ops alternative ends for the
  sensitivity line (key facts §3).
- Their effect on the *forecast* enters through the official monthly completions (near zero during holds), which
  the pool reconstruction replays; their effect on the *explanation* is the clock strip.
- Future re-freeze risk = scenario S3 (6 months of zero completions then S1). Alert-driven re-weighting rules
  (key facts §3: *Dorcas* reversed → S3 × 3, × 1.5 while *Red Eagle* PI holds; new hold memo naming Cuba → S3 × 3;
  completions ≥ 2,000 two months → S0 ÷ 2, S1 × 1.5) are applied **by a human in the same PR that adds the alert**
  (ship-fast: no rule engine); `Alert.effect = 'reweight'` records it. Today's search found no October 2026 activity
  in 1st Cir. 26-1703 [S: courtlistener.com/docket/73477958, uscis-pause-tracker.com case page], so default weights stay.

### 7.6 Worked example and the owner's test cases

Reference case: CHNV, receipt 2025-03-15, EAD 2025-09, biometrics implied, no interview, no RFE, office unknown,
today 2026-10-20, data through Aug 2026 (k₀ = 2), β = 0.0374.

| Output | Expected (doc 08 §11.8–11.9) |
|---|---|
| Calendar / adjudicable days | 584 / **306** (alt 256) — T11 |
| P(decision) 3 / 6 / 12 / 24 / 36 mo | 1.5% / 3.7% / **9.4%** / 22.3% / 35.6% — T15 |
| q10 / q25 / q50 / q75 | 13 / 27 / **53** / beyond horizon |
| By 2026-12-31 / 2027-12-31 / 2028-12-31 | ≈ 0.9% / 11.5% / 24.5% |
| Queue | pending 355,520; older ≈ 175,200; same month ≈ 23,100; last month 820 |
| Posterior weights | 0.301 / 0.400 / 0.149 / 0.151 — T5 |
| Office sensitivity | TAM 16.9% > HOU 10.6% > unknown 9.4% > HIA 8.9% > KND 7.9% (P ≤ 12) — T16 |
| e-Request (I-485) | not available: MIA inquiry 2023-06-17 ≈ Feb 2028; HIA 2024-07-05 ≈ Oct 2027 (doc 15 §2.2, crude) |
| Approval card | 70–90% (centre 85%) if packet complete; FY26 Q3 23.7% shown only with Q1/Q2 baselines |

**Peers (new tests owned by this plan, T23–T26)** [I]:
- **T23 "peer without EAD"**: same inputs minus `ead_c9` → identical timing numbers (EAD ×1.0) **and** remedy ladder
  shows "(c)(9) e-Request available now" because receipt 2025-03-15 < NBC `147-C9` inquiry date 2025-06-13 (doc 15
  §2.2). This is the honest answer to "peers got EADs on different dates or not at all": EADs still pending on
  2025-12-02 were frozen until 2026-06-12 (doc 07 §5.1), and the app tells them the lever they have.
- **T24 "CBP One peer"**: adjudicable 392 (= T21) with `r1Confidence: 'low'`; timing numbers equal to T15 (v1 is one
  pool) and the UI line "your channel is not yet modelled separately".
- **T25 "filed after 2026-08-24"**: `redEagleClassMember = false`; alert copy rests on *Dorcas* only (doc 03 §11.3).
- **T26 "I-220A"**: `kind: 'ineligible'`, no numbers rendered, *Cabrera-Fernández* + *Bello-Rubio* copy.

### 7.7 Testing and backtesting

- **Golden tests (Vitest, pure TS, `app/tests/unit/estimator.vitest.ts`)**: T1–T22 exactly as specified in doc 08
  §11.9 and doc 16 §8.2 with their tolerances, plus T23–T26. These are written **first** (week 1, day 1) from the
  doc's numbers; the port is done when they pass. Fixture = the 25-row monthly series in doc 04 §1.1 (frozen in
  `app/tests/fixtures/national-2026-08.json`).
- **Property tests**: S non-increasing; probabilities in [0,1]; posterior sums to 1 ± 1e-12; holds never increase
  adjudicable days; deterministic (same input → same output).
- **Pipeline parser tests**: re-parse the committed raw CSV and assert the Aug 2026 row; workbook fixtures are
  downloaded once into `app/tests/fixtures/` from the visualizer mirror (raw.githubusercontent.com is reachable from
  this environment per task constraints).
- **Backtest (Should, week 3)**: `npm run backtest` implements doc 08 §10.2 rolling origins Oct 2024 → latest−6:
  truncate the series, refit, score 12-month Brier and 90% coverage against vintage-level realized hazards; report
  separately for R0/R2 origins; prints a table committed to `data/backtest.json`. Acceptance per doc 08 §10.2.4; until
  it passes, `validated: false` and the "no validado" label stay (they stay anyway for R4, doc 08 §10.3).
- **Canary** in the data job (§6.3 step 6) catches silent data/parser changes that move the reference case.

---

## 8. Crowdsourced timelines

**MVP: none collected.** Instead [I]:
1. The app captures the full doc 06 §8.1 / doc 15 §9.2 / doc 16 §8.1 field set **locally** (`CaseTimeline`), so the
   v1.1 upload is a consent screen plus a POST, not a schema migration.
2. The estimator uses only official aggregates; the UI says "Aún no usamos casos reportados por usuarios / We do not
   use user-reported cases yet".
3. Community figures in the press (EAD 12–12.5 months [S per doc 11 via master timeline 2026-10-17]) appear only in
   alert/explainer text with their tag, never as model inputs.

**v1.1 design (Supabase, doc 09 §6.3, unchanged):**
- Captured: entry channel, state, office, filing month, milestone dates, decision, `receipt_masked`
  (`^[A-Z]{3}[0-9]{5}XXXXX$`), consent version. **Not** captured: names, full receipt, A-number, ZIP, free text,
  nickname.
- Validation: plausibility flags (decision before receipt, EAD before receipt, dates in the future), receipt-prefix
  format check, one-year-and-a-day check; trigger caps 3 rows per anonymous owner.
- Privacy: anonymous auth, RLS own-rows only, no client SELECT on raw rows, aggregates by month with n ≥ 5
  suppression (n ≥ 10 for office × quarter estimates, doc 08 §9.2.5), `delete_my_account()`.
- Abuse: rate-limited anonymous sign-in, CAPTCHA if abused [T per doc 09], medians/trimmed quantiles, benchmark the
  sample against official completions every month (doc 08 §9.2.2), cap any office-month cell at 5% influence.
- First use of the data: test channel as the covariate for EAD timing (two clusters expected, doc 16 §8.3) and
  mandamus outcomes (n ≥ 20 to revisit ×1.3, doc 15 §9.3).

---

## 9. Alerts and notifications

### 9.1 Alert pipeline (human in the loop)

```
FR API / USCIS RSS / CourtListener (token) / data-file arrival  →  data/candidates/alert-candidates.json
          → maintainer (or an agent session) writes a curated Alert in data/curated/alerts.json (EN+ES,
            "what it means for you", evidence tag, sourceUrl) and, if effect=reweight, edits scenario weights
          → PR → caa-ci validates zod + both languages non-empty → merge → next refresh publishes
```

Automatic alerts without review are limited to **data** events the job can state mechanically and bilingually from a
template: "Nuevos datos mensuales de USCIS: septiembre 2026" / "New monthly USCIS data: September 2026", and
"Nuevos tiempos de procesamiento publicados <date>". Everything about courts and policy is human-reviewed (doc 09 §8
rules: no automated "USCIS changed a number" pushes).

### 9.2 Watch list (seeded into `policy.json.litigation`, key facts §9)

*Dorcas* (1st Cir. 26-1703; CL 73477958; partial stay 2026-08-14 re-review only — the Justia opinion page for that
date now appears in search results [S: law.justia.com/cases/federal/appellate-courts/ca1/26-1703/26-1703-2026-08-14-0.html],
content not read; the 2026-07-15 stay denial is a D.R.I. document [S: democracyforward.org/wp-content/uploads/2026/07/Dorcas-stay-denial.pdf],
consistent with conflict 14's resolution), *Red Eagle* (N.D. Cal. 3:26-cv-04850; CL 73380879), *AAUP v. Mullin*
(D. Mass. 1:26-cv-14527; CL 74919678), *Acosta Reynoso* (M.D. Fla. 8:26-cv-01314), *Doe v. DHS* (1:25-cv-12245;
CL 71085922), *CHIRLA* (D.C. Cir. 25-5289), *Bello-Rubio* (S.D. Fla. 1:25-cv-23665), *Labrada-Hechavarria* BIA remand,
*Doe v. Mullin* (1:25-cv-10495; CL 69695790). Watchers key on docket numbers, never captions (Noem → Mullin).

### 9.3 Notifications (native only; `src/notifications/index.native.ts`; web = `index.web.ts` no-op)

| Trigger | Type | Text source | Expo Go? |
|---|---|---|---|
| After a successful data refresh on foreground, a curated alert with `severity: high` the user has not seen | immediate local (`trigger: null`) | `alert.title[lang]` | yes (SDK notes §6) |
| New official month arrived | immediate local, only if user opted in to "data" | i18n template | yes |
| EAD expiry − 180 days (and − 90) | `DATE` trigger | i18n template incl. "renewals filed since 2025-10-30 do not auto-extend" (doc 03 §15.7) | yes |
| 24 months since receipt ("talk to a lawyer about options") | `DATE` trigger | i18n template, links S5 | yes |

Rules: ask permission only from Settings or after the first estimate (never at launch); Android channel created
before the permission prompt (SDK notes §6); `setNotificationHandler` with `shouldShowBanner/shouldShowList`;
**on language change, cancel and reschedule all scheduled notifications** so their text switches (owner requirement
1); deep link `data.url` → `router.push`. Background fetch (tier B) and push (tier C) are v1.1/v2 (doc 09 §8).

---

## 10. Privacy, security, legal disclaimers, store compliance

### 10.1 Privacy (MVP)

- **Nothing personal leaves the device.** The only network traffic is anonymous GETs of public JSON (raw GitHub on
  native; same-origin relative files on web). No analytics, crash reporting, ads or third-party AI SDKs (doc 09
  §7.1.5). Full receipt numbers and nicknames are device-only; displayed masked.
- Web artifact: data lives in the viewer's own browser storage, per origin; nothing reaches the publisher or Claude
  [I from the host contract]. The page works with storage disabled.
- "Delete my data" wipes all `cases:*`, `settings:*`, `data:*` keys and cancels scheduled notifications.
- Optional local app lock (`expo-local-authentication`) is v1.1 (doc 09 §7.3).

### 10.2 Security

- Data integrity: zod validation on device rejects malformed/negative/future values and keeps the last good copy;
  `sha256` per file in the manifest (checked after download).
- Supply chain: actions pinned by SHA; CODEOWNERS review for `.github/workflows/**`, `cuban-immigration-tracker/app/pipeline/**`,
  `cuban-immigration-tracker/data/curated/**`; bot commits touch only `data/` (doc 09 §10.3).
- Least privilege: refresh job `contents: write` only; CI `contents: read`; the only secrets are the built-in
  `GITHUB_TOKEN` and optional `COURTLISTENER_TOKEN`.
- No eval/remote code: the artifact contains only the inlined bundle; data files are JSON, never executed.

### 10.3 Disclaimer copy (shown on onboarding, result card footer, remedies, About)

- ES: "CAA Tracker es una herramienta independiente y no oficial. No está afiliada a USCIS, DHS ni a ninguna agencia
  del gobierno. Los estimados son proyecciones estadísticas basadas en datos públicos; cada caso es distinto.
  Esto no es asesoría legal: consulte a un abogado de inmigración o a una organización acreditada."
- EN: "CAA Tracker is an independent, unofficial tool. It is not affiliated with USCIS, DHS or any government agency.
  Estimates are statistical projections from public data; every case is different. This is not legal advice:
  consult an immigration attorney or an accredited organization."
- Rumour-control strings from doc 14 §8.7 ("El memo del 21 de mayo elimina la Ley de Ajuste" → false).

### 10.4 Store compliance (doc 09 §7.2, R6–R9)

Name/icon without "USCIS"/"DHS" or seals; "independiente, no oficial" on listing, first run and Settings; privacy
policy link in the app and store listing; Apple privacy label "Data Not Collected" and Google Data safety "no data
collected" for the MVP; lead the listing with the CAA-specific estimator, Spanish-first UI and open versioned data to
pass Apple 4.3 (doc 09 R6); no hidden features (Apple 2.5.19, 2026-10-16 revision [S per doc 09 §12.1]); no UGC in
the MVP so Guideline 1.2 does not apply. Start Apple ($99/yr) and Google ($25) accounts in week 1 because identity
verification and Google's closed test take calendar weeks [T per doc 09 §9].

---

## 11. Repository layout and module boundaries

### 11.1 Layout (paths relative to `luisitin/Documents`)

```
.github/workflows/
  caa-ci.yml                      typecheck, lint, jest, vitest, i18n check, web export, artifact build+size, prove
  caa-data-refresh.yml            §6.4
.github/CODEOWNERS                (adds the cuban-immigration-tracker paths)
cuban-immigration-tracker/
  README.md  docs/                (unchanged; this proposal in docs/planning/proposals/)
  data/                           PUBLISHED SNAPSHOTS (bot) + curated/ (humans) + candidates/ + raw/*.sha256 + schema/
  app/                            ONE npm package (Expo app + pipeline + scripts); single lockfile
    package.json app.json tsconfig.json eslint.config.js vitest.config.mts tsconfig.vitest.json
    src/app/                      Expo Router routes only (thin; import from features/)
      _layout.tsx                 providers: KvGate → I18nProvider → ThemeProvider → DataProvider → Stack
      +not-found.tsx              <Redirect href="/" />
      (tabs)/_layout.tsx          5 JS tabs; header = AppHeader (title, DataStatusChip, LangToggle)
      (tabs)/index.tsx            S1 Home        (tabs)/case/index.tsx  S2   (tabs)/case/remedies.tsx  S5
      (tabs)/offices/index.tsx, [code].tsx  S3   (tabs)/alerts/index.tsx, [id].tsx  S4
      (tabs)/more/index.tsx, settings.tsx, glossary.tsx, about.tsx, privacy.tsx  S6
      welcome.tsx                 S0 (modal)
    src/core/                     PURE TS — no react, no react-native, no expo, relative imports only
      types.ts schema.ts dates.ts
      estimator/{pool.ts,beta.ts,office.ts,project.ts,mix.ts,postInterview.ts,clock.ts,estimate.ts,index.ts}
      eligibility.ts remedies.ts guards.ts
    src/data/                     DataProvider.tsx, useData.ts, fetchers.ts (+ .web.ts), sample/*.json, hostRefresh.web.ts
    src/storage/                  kv.ts (native AsyncStorage) + kv.web.ts (guarded localStorage+memory), cases.ts, settings.ts
    src/i18n/                     index.ts, locales/en.json, locales/es.json, format.ts, i18next.d.ts
    src/ui/                       theme.ts, useThemeName.ts (+ .web.ts), components/*, charts/{MonthlyChart,FanChart,RegimeStrip}.tsx, icons/*.tsx
    src/features/                 home/, case/, offices/, alerts/, remedies/, settings/ (screen bodies + hooks)
    src/notifications/            index.native.ts, index.web.ts, templates.ts
    src/platform/                 webGuard.web.ts (+ no-op webGuard.ts), dataBase.web.ts
    pipeline/                     refresh.ts, http.ts, sources/{monthlyCsv,quarterlyAllForms,i485ByOffice,processingTimes,federalRegister,uscisRss,courtListener,curated}.ts, publish.ts, backtest.ts
    scripts/                      build-artifact.mjs, prove-artifact.mjs, check-i18n.mjs, export-sample.mjs, export-schema.mjs
    tests/unit/*.vitest.ts        estimator, eligibility, remedies, parsers, guards (pure TS)
    tests/fixtures/               national-2026-08.json, monthly CSV, workbook samples
    __tests__/*-test.tsx          jest-expo component/router tests
    web-artifact/                 build output (git-ignored): index.html fragment + data/
```

Why one package [I]: Expo monorepo/Metro symlink setup is the most common time sink for a solo developer; one
package keeps `npx expo install --check`, Jest and Metro on their defaults (SDK notes §1, §8). The pipeline's extra
dev dependencies (`tsx`, `exceljs`, `csv-parse`, `sql.js`, `fast-xml-parser`) never enter the app bundle because
nothing under `src/` imports them (an ESLint `no-restricted-imports` rule enforces it).

### 11.2 Modules and public interfaces (one owner/agent each; they meet only at these signatures)

| Module | Owner | Public interface | Depends on |
|---|---|---|---|
| **M1 core/types+schema** | Agent A (day 1, blocks others for ~0.5 day) | `types.ts` (§5); `schema.ts`: `ManifestSchema, NationalFileSchema, QuarterlyFileSchema, OfficesFileSchema, PolicyFileSchema, AlertsFileSchema, ParamsSchema, CaseTimelineSchema` + `parseDataFile(name, json): Result<T>` | zod |
| **M2 core/estimator** | Agent B | `estimate(c, data, today): EstimateResult`; `reconstructPool`, `fitBeta`, `officeMultiplier`, `projectPath`, `mixAndCondition`, `postInterviewCdf`, `adjudicableDays` (for pipeline + tests) | M1 |
| **M3 core/eligibility + remedies + guards** | Agent B or C | `deriveFlags(c, today, policy): DerivedFlags`; `remedyLadder(c, data, today): RemedyStep[]` (doc 15 §9.1; `RemedyStep = { rung: 'a'|'b'|'c'|'d'|'e'|'f'; available: boolean; whenApprox?: YearMonth; titleKey; bodyKey; params }`); `dataVintageGuards(manifest, national, quarterly, today): Guard[]` | M1 |
| **M4 pipeline** | Agent C | `refresh({ out, now, sources?: SourceId[], dryRun }): Promise<RefreshReport>`; each source `fetchRaw(ctx): Promise<RawFile>` + `parse(raw): T`; CLI `tsx pipeline/refresh.ts` | M1, M2 (params, canary) |
| **M5 storage** | Agent D | `kv: { ready: Promise<void>; get(k): string \| null; set(k, v): void; remove(k): void; clear(prefix): void }` (sync reads after `ready`, memory-backed mirror; writes flushed async on native); `useCases()`, `useSettings()` | — |
| **M6 data layer** | Agent D | `<DataProvider>`; `useData(): { status: 'live'\|'cached'\|'sample'; stale: Guard[]; asOfMonth; generatedAt; national; quarterly; offices; policy; alerts; params; refresh(): Promise<void> }`; `dataBaseUrl()` (native raw URL from `Constants.expoConfig.extra.dataBranch`; web `window.__CAA_DATA_BASE__`) | M1, M5 |
| **M7 i18n** | Agent E | `i18n`, `useLang(): { lang, setLang(l) }` (persists, re-renders, emits `languageChanged` for notifications), `fmt: { number, percent, month('2026-08'), date, relative }` using `Intl` with `es-US` / `en-US`; `locales/{en,es}.json` with identical key sets | M5 |
| **M8 ui kit + charts + icons + theme** | Agent E or F | `useTheme(): Theme` (tokens; honours host `data-theme` on web); `Screen, AppHeader, LangToggle, DataStatusChip, Card, Tile, Banner, Chip, Sheet, Button, FormField, DateField`; `MonthlyChart({rows, regimes})`, `FanChart({survival, startYm})`, `RegimeStrip({clock, regimes})`; `Icon({name, color, size})` (SVG) | M7, react-native-svg |
| **M9 features/screens** | Agents F, G (split S1/S3/S4 vs S2/S5/S6) | route components listed in §11.1 | M2–M8 |
| **M10 notifications** | Agent G | `notifications.init()`, `notifyNewAlerts(alerts, seenIds)`, `scheduleCaseReminders(case, lang)`, `rescheduleAll(lang)`, `cancelAll()`; web build exports the same names as no-ops | M7 |
| **M11 web artifact build + prove** | Agent H | `node scripts/build-artifact.mjs [--data ../data]` → `web-artifact/index.html` + `web-artifact/data/*`, exit ≠ 0 on CSP/size violations; `node scripts/prove-artifact.mjs` → JSON report + screenshots (390 px / 1280 px × light/dark) | built app |
| **M12 CI/workflows** | Agent H | `caa-ci.yml`, `caa-data-refresh.yml`, CODEOWNERS | M4, M11 |

Contract tests at each seam: M1 schemas parse `app/src/data/sample/*.json`; M2/M3 golden tests; M6 test with a mocked
fetch (live → cached → sample transitions); M7 `check-i18n.mjs` (identical key sets, no empty Spanish strings, ESLint
`react/jsx-no-literals` [T] or `i18next/no-literal-string` [T] on `src/features` and `src/ui`); M11 Prove.

---

## 12. Roadmap and effort

Effort in focused developer-days (solo); "agents" column = wall-clock days if M-modules run in parallel. [I]

### MVP (weeks 1–3, + week 4 buffer/polish/store prep) — ~19 dev-days solo, ~9 days with agents

| Week | Work | Dev-days |
|---|---|---|
| 1 | Scaffold (`create-expo-app --template default@sdk-58`, strip to JS tabs, add web deps with `npx expo install react-dom react-native-web @expo/metro-runtime` [T: exact web deps confirmed at install time]); M1 types/schemas; M2 estimator port + T1–T26 green; M4 pipeline P1–P4 + curated + publish; first manual data commit; start store accounts | 6 |
| 2 | M5 storage, M6 data layer, M7 i18n (all strings EN/ES), M8 ui kit + 3 SVG charts + icons + theme; S0, S1, S3, S4 screens; `caa-data-refresh.yml` running on the branch | 6 |
| 3 | S2 My case (form + result), S5 remedies, S6 settings/delete/about; M10 local notifications; M11 build-artifact + prove; first artifact publish; P5/P6 candidates; backtest script | 6 |
| 4 | Spanish copy review by a native Cuban-Spanish reader; accessibility pass (font scaling, screen reader labels); bug bash on Expo Go iOS/Android; EAS preview build; privacy page; store listing drafts | 1–5 (buffer) |

**MVP exit criteria**: §1.3 met; CI green; artifact published; data job green 14 days.

### v1.1 (weeks 5–8) — ~12 dev-days

Supabase crowdsourcing (doc 09 §6) + consent + `delete_my_account` + `data/community.json` aggregation (5 d);
ZIP → county → office table with Miami-Dade ZIP lists (2 d); CourtListener polling with token + docket-alert webhooks
(1 d); include denials in office multipliers, fit β for approvals vs denials when files allow (doc 08 §12 v1.1) (1 d);
change-point monitor banner (doc 08 §6.5) (1 d); background task + local notification (dev build) (1 d); store
submission v1.0 (1 d).

### v2 (months 3–6) — ~25 dev-days

Expo push with topic filters (tier C) (4 d); Torch Case Status opt-in after production approval (5 d); crowdsourced
milestone sub-models and channel as covariate (doc 08 v2.0/v2.2) (6 d); seeded Monte Carlo fan charts (3 d);
hierarchical office effects server-side (4 d); backtest dashboard and confidence promotion (3 d).

---

## 13. Risks and open questions

### 13.1 Product/model risks

| # | Risk | Likelihood / impact | Mitigation |
|---|---|---|---|
| K1 | The estimate is scenario-dominated (S2 alone gives median 22 vs 53 blended); weights are judgments | Certain / high | Show per-scenario numbers and weights; reweight only via reviewed alerts; "no validado" label (doc 08 §8.2, §10.3) |
| K2 | v1 treats the pending pool as one class; parolee cases may be worked differently from I-220A/other cases | High / medium | Say so in the UI; v2.2 multi-class with crowdsourced `entry_channel` (doc 08 §5.6, §13.2) |
| K3 | Approval prior 70–90% is [I], unvalidated after PA-2026-05 | Medium / high (trust) | Separate card, never multiplied into timing; re-estimate on Sep–Nov 2026 CSVs and FY26 Q4 (doc 14 §8.1) |
| K4 | Office multipliers use a humanitarian-column proxy, approvals only, two hold-straddling quarters | High / low | Shrinkage + clamp; label "proxy"; denials added in v1.1 (doc 08 §7.3) |
| K5 | Users read probabilities as promises | Medium / high | No dates in headlines (test-enforced), plain-language copy from doc 08 §11.7 |
| K6 | Monthly Jul/Aug 2026 rows are [F] but un-cross-checked; Sept 2026 CSV not yet published [S today] | Medium / medium | T20 banners; the canary flags any revision when September arrives |

### 13.2 Engineering risks

| # | Risk | Mitigation |
|---|---|---|
| E1 | `luisitin/Documents` may be **private** → raw.githubusercontent.com returns 404 to the native app | Native falls back to cached/sample and says so; decide in week 1: make the repo (or a `caa-tracker-data` repo) public, or serve via Pages/jsDelivr (both also need public) — **open question for the owner** |
| E2 | `uscis.gov` reachability from GitHub runners is evidenced only by a third party's CI runs [S per doc 13 §3.1]; the probe plan of doc 13 §12 was never executed | First `workflow_dispatch` run is the probe; mirror fallback for P1–P3; job never fails on a blocked source |
| E3 | `jzebedee/uscis` has no LICENSE (doc 13 §1.6) | Publish only derived fields with attribution; open an issue asking permission in week 1; if refused, show office times as "not available" (estimator does not need them) |
| E4 | `workflow_dispatch` on a branch before the workflow exists on the default branch [T] | `push` trigger on `claude/**` for pipeline/curated paths + local `npm run data:refresh`; merge the workflow file to the default branch early |
| E5 | Expo single-output bundle shape (one index.html confirmed [S today], script path not) | Build script parses `dist/index.html`; Prove step is the acceptance test |
| E6 | The artifact host's CSP might disallow `eval`-style code | Metro production bundles do not rely on `eval` [T]; Prove step loads under a CSP mirroring the contract (`script-src 'unsafe-inline' cdnjs/jsdelivr/unpkg`, `connect-src 'self'`) |
| E7 | Headless Chromium for the Prove step: Playwright's browser download host may be blocked in this container (only npm/PyPI/GitHub reachable per task) | Try a system Chromium (`CHROMIUM_PATH`) first, then `puppeteer`/`playwright` npm postinstall; in CI GitHub runners have Chrome preinstalled [T] |
| E8 | AsyncStorage on web / Hermes `Intl` with `es-US` [T] | Own web KV adapter (not AsyncStorage's); `fmt` falls back to `es` + manual grouping if `es-US` is missing; unit test both |
| E9 | Expo Go may lag SDK 58 in the stores (SDK notes §2, R11) | EAS dev build (internal) as fallback; web artifact covers demos |
| E10 | Scheduled workflow disabled after 60 idle days (public repos) [S per doc 09 §5.1] | Heartbeat commit each run; staleness banner at 72 h |
| E11 | Size: react-native-web + router + i18n + svg in one inline file | Budget 3 MB, fail at 15 MB; avoid date-fns/lodash; check per PR |

### 13.3 Open questions for the owner

1. Is `luisitin/Documents` public, or may the data live in a separate public repo? (E1)
2. Default branch name for the native data URL (`main`?) and whether the feature branch may receive bot commits.
3. Who curates alerts (owner, a trusted Spanish-speaking reviewer, or an agent session that opens PRs)?
4. Is an Apple/Google developer account available now (calendar-week lead time)?
5. OK to show the "más de 6 años" median for cases like the reference case? It is honest but discouraging; the
   alternative is to lead only with P(12 months) and the scenario cards.

### 13.4 Searches used today (4 of 4)

1. "USCIS septiembre 2026 Ley de Ajuste Cubano aprobaciones I-485 cubanos datos mensuales" (extended): no September
   2026 monthly data found; latest is FY26 Q3 139/447/586, 6,279 received, > 342,000 pending; *AAUP* PI not ruled on by
   mid-October [S: https://en.cibercuba.com/noticias/2026-10-20-u1-e135253-s27061-nid343309-solo-139-cubanos-obtuvieron-residencia-ley-ajuste ;
   https://www.newsweek.com/green-card-approval-rate-drops-for-3-major-categories-12578953 ;
   https://www.visaverge.com/greencard/cuban-green-card-approvals-drop-to-237-as-trump-administration-tightens-uscis-rules/ ;
   https://www.inmigreat.com/en/analytics/i-485/].
2. "expo-sqlite web support wasm SharedArrayBuffer …": expo-sqlite on web needs Metro wasm config plus COOP/COEP headers
   for SharedArrayBuffer; web support marked alpha in v57 docs [S: https://docs.expo.dev/versions/latest/sdk/sqlite.md ;
   https://docs.expo.dev/versions/v57.0.0/sdk/sqlite.md ;
   https://developer.chrome.com/blog/sqlite-wasm-in-the-browser-backed-by-the-origin-private-file-system] → this plan
   drops expo-sqlite.
3. "expo export web output single …": single (default) output is an SPA with a single `index.html` in `dist`, produced
   by `npx expo export -p web`; the `_expo/static/js/web/entry-[hash].js` path was only seen for server output
   [S: https://docs.expo.dev/distribution/publishing-websites/ ; https://docs.expo.dev/router/web/static-rendering/ ;
   https://docs.expo.dev/router/web/server-rendering.md] → the build script parses `index.html` instead of assuming paths.
4. "Dorcas … 26-1703 … October 2026 Red Eagle …" (extended): no October 2026 activity found; D.R.I. stay denial
   2026-07-15 PDF exists; Justia page dated 2026-08-14 exists (caption only seen) [S:
   https://www.courtlistener.com/docket/73477958/dorcas-international-institute-of-rhode-island-v-united-states-citizenship/ ;
   https://democracyforward.org/wp-content/uploads/2026/07/Dorcas-stay-denial.pdf ;
   https://law.justia.com/cases/federal/appellate-courts/ca1/26-1703/26-1703-2026-08-14-0.html ;
   https://uscis-pause-tracker.com/cases/dfdb50fe-3ed9-40f1-ac88-ff1e8371d88a ;
   https://globallawexperts.com/first-circuit-refuses-stay-vacatur-uscis/]. *Red Eagle* was not separately checked.
