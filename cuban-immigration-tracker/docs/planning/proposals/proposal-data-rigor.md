# Proposal — "Data quality and estimator rigor first"

**Project:** Cuban Immigration Tracker (CAA Tracker) · **Angle:** data quality, honest uncertainty, auditable pipeline · **Written:** 2026-10-20 · **Status:** architecture proposal (Phase 2), one of several competing proposals.

**Evidence tags.** [S] stated in a search result seen today (URL given) · [F] read from a USCIS data file (by a Round-1 researcher, or **fetched again today** where marked "today") · [T] training knowledge, not confirmed today · [I] inferred by this author · [U] unresolved conflict carried from the research. "doc NN §x" means `docs/research/NN-*.md`, section x. Where the research tags something [T]/[U], this plan keeps that tag and designs around it.

**What was checked today (beyond reading the corpus).**
- WebSearch budget: **4 of 4 used.** (1) September 2026 monthly CAA figures: none published; latest monthly is August/July, latest quarterly FY26 Q3 [S: https://www.14ymedio.com/cuba/migracion/aprobaciones-residencia-ley-ajuste-cubano_1_1132080.html, https://www.americateve.com/cuba/alarma-cubanos-uscis-aprobo-solo-139-residencias-ley-ajuste-y-rechazo-otras-447-n5464900, https://en.cibercuba.com/noticias/2026-10-20-u1-e135253-s27061-nid343309-solo-139-cubanos-obtuvieron-residencia-ley-ajuste, https://www.periodicocubano.com/cuantas-green-cards-aprobo-uscis-bajo-la-ley-de-ajuste-cubano-en-julio-miles-siguen-a-la-espera/]. (2) A 2026 change to the processing-times methodology: **none found**; the USCIS "more-info" page gives the inquiry formula "time to complete 93% of adjudicated cases − (today − received date)" and the 80%-over-six-months display rule [S: https://egov.uscis.gov/processing-times/more-info, https://www.lighthousehq.com/blog/uscis-processing-times, https://www.nnuimmigration.com/uscis-processing-times/] — this upgrades the "93%" figure from [T]-grade (doc 08 §2.1) to [S] and keeps the "Feb 2026 change" (master timeline Part B #59) unverified. (3) *Acosta Reynoso* adjudication report (due 2026-08-13): **not found**; the TRO (07-03) and PI (07-30) denials are again attributed to Judge Mizelle [S: https://www.leagle.com/decision/infdco20260731b45, https://www.periodicocubano.com/cubanos-demandan-a-uscis-por-hacerlos-esperar-anos-para-la-residencia-bajo-la-ley-de-ajuste/?amp=1]. (4) October 2026 interview/approval surge: **none found**; only individual Jacksonville interview reports [S: https://www.directoriocubano.info/acontecer/entrevistas-uscis-i-220a-ajuste-cubano-jacksonville/, https://www.directoriocubano.info/?p=149618].
- **Fetched today from `raw.githubusercontent.com`** (the only data host reachable here): `omairqazi29/visualizer/master/data/USCIS_I485/monthly_august_2026.csv` → HTTP 200, 3,629 bytes, sha256 `74aa7bce317fa19860b5ee59a29da0b432d5a2556ea13594fc0d4cfae7c96d8c`, UTF-8 BOM, CRLF line endings, quoted thousands separators, Cuban row `I-485,Application to Register Permanent Residence or Adjust Status (Cuban),"1,213",386,434,"355,520","345,741",20.6` [F today]. The same mirror has **no** `monthly_september_2026.csv` (HTTP 404) [F today]. Response headers from raw GitHub: `access-control-allow-origin: *`, `etag`, `cache-control: max-age=300` [F today] — the native app's fetch path is therefore CORS-safe and ETag-revalidatable.
- **Independent re-implementation of the doc 08 estimator** (Python, scratchpad, not committed): reproduced β̂ = 0.0374, Σ pool = 355,520 over 25 vintages, March-2025 vintage ≈ 23,097 still pending, ≈ 175,221 older cases (doc 08 §5.3: 23,100 / 175,200) exactly; reproduced the reference-case mixture **P(≤12 mo) = 9.23%** (doc 08: 9.4%, inside its ±0.3 pt tolerance), P(≤24) = 22.1% (doc: 22.3%), but **median 54 vs 53 months** and Tampa P(≤12) 16.6% vs 16.9% (outside doc 08 T16's ±0.3 pt). The spec under-determines small details (grid ordering, conditioning index). This is the single most important finding for this angle: **the estimator needs a pinned reference implementation and golden outputs, not prose** (§7.6).
- GitHub API / release pages for `jzebedee/uscis` were **not reachable** from this session (403 from the session's GitHub policy), so the mirror's asset naming stays [I] as in doc 13 §1.6.

---

## 1) Product vision and target users

**Vision.** A bilingual (Spanish-first) app that tells a Cuban parolee *what the official numbers actually say*, *what they do not say*, and *what that implies for one specific case* — with every number traceable to a file, a date and a definition, and every estimate expressed as a probability that we publicly score against what happens next. The app's competitive edge is not more data (there is little); it is **refusing to mislead with the data that exists** (doc 08 §1, doc 10 build list).

**The core truths the product must communicate (from the research).**
1. Published "processing times" describe *completed* cases; in August 2026 USCIS completed 820 Cuban I-485s while 355,520 were pending, 97% for more than six months [F doc 04 §1.1]. The 11.8-month FY2026 median is not a forecast for a pending case (doc 08 §2.3).
2. National throughput, not office or milestones, dominates the wait: 355,520 ÷ 820 = 434 months at the August pace; ÷ 9,200 (FY2025 pace) = 39 months (doc 08 §5.1).
3. Two adjudication holds (R1 for CHNV/U4U/FRP parolees, R3 for every Cuban) explain most of 2025–2026 (doc 03 §11, key facts §3); the reference case has 306 adjudicable days of 584 calendar days (T11).
4. The approval *share* collapsed (23.7% in FY26 Q3) because of who was decided, not because eligible parolees became ineligible (doc 14 §3.4, §8).

**Target users.**

| Persona | Need | What the app gives |
|---|---|---|
| **P1 Pending CAA filer (CHNV/CBP One/FRP), 2024–2026 vintage** — e.g. the reference case: filed March 2025, (c)(9) EAD September 2025, no decision October 2026 | "When will I be decided? Why did my cousin get an EAD and I didn't? Can I do anything?" | Probability-by-horizon estimate, adjudicable-time strip, EAD explanation, remedy ladder with honest gates (doc 15) |
| **P2 Family member / sponsor** (often the person with the smartphone and English) | Explain the situation, check that nothing was missed | Shareable plain-language summary inside the app (no file downloads on web), EN/ES switch |
| **P3 Not-yet-filed parolee** (CBP One cohort ≈ 100k, Low confidence, doc 16 §2.3) | "Am I eligible after my parole was terminated? When can I file?" | Eligibility gate (`caa_paroled_element_met`), one-year-and-a-day date, amber enforcement warning since 2026-08-11 (doc 16 §6, §8.4) |
| **P4 I-220A Cuban** | "Does this apply to me?" | Clear "not eligible under current BIA precedent" + watch on *Bello-Rubio*/BIA remand; **no estimate** (key facts §1) |
| **P5 Community admins, journalists, attorneys** | Trustworthy numbers with definitions | Data screen with source files, sha256, statistic definitions; methodology and scorecard pages |

**Non-goals.** No legal advice, no case-status scraping on behalf of users, no promised dates, no prediction of individual discretion outcomes beyond a labelled prior.

---

## 2) Feature list (MoSCoW) with rationale

| # | Feature | Priority | Rationale (cite) |
|---|---|---|---|
| F1 | **National Cuban I-485 dashboard** from the monthly CSV: received / approved / denied / pending / pending > 6 mo / mean months of completions, Sep 2024 → latest | **Must** | Only official monthly product with a Cuban row [F doc 04 §1.1]; headline pending from this product only (key facts §7) |
| F2 | **Statistic-typed labels** on every number (count flow, stock, mean of completions, median of completions, 80th pct of completions, inquiry date ≈ 93rd pct) with cut date | **Must** | 11.8 vs 12.3 vs 16.3 vs 20.6 look contradictory otherwise (README §2.8 #2; doc 08 §2.1) |
| F3 | **Personal estimate VPH-1** (probabilities at 3/6/12/24/36 mo, quantiles or "beyond 6 years", scenario band, fan chart) on device | **Must** | The owner's core ask; doc 08 §11 |
| F4 | **Adjudicable-time strip** ("what happened to your case"): calendar days, hold days by regime and entry channel, alternative-end sensitivity | **Must** | Explains peers' divergent experiences; doc 03 §11.2; T11/T19/T21/T22 |
| F5 | **Entry-channel gating & warnings** (CHNV / CBP One / FRP-CFRP / U4U / I-220A / visa / other parole / EWI) | **Must** | Eligibility and hold rules depend on it (key facts §1; doc 16 §8) |
| F6 | **Data-vintage and liveness banner on every screen** ("Datos al: agosto 2026 · en vivo / muestra · obtenidos hace 3 h") | **Must** | Owner requirement; T20 guard (doc 08 §11.9) |
| F7 | **Approval card separate from timing** with numerator/denominator and Q1/Q2/FYTD baselines; clean-packet prior 70–90% | **Must** | doc 14 §8.1 |
| F8 | **"What can I do?" ladder** (e-Request gates from inquiry dates, expedite criteria, congressional, Ombudsman warning, mandamus context) | **Must** | doc 15 §9.1; high user value, deterministic logic |
| F9 | **Language toggle EN/ES** (header, settings, first launch), persisted, locale-default, all strings/dates/numbers/chart labels | **Must** | Owner requirement (mandatory) |
| F10 | **Web build packaged as one Claude-artifact HTML fragment** with relative `./data/` supporting files | **Must** | Owner requirement (mandatory) |
| F11 | **Ingestion pipeline with QA gates, raw-file archive, quarantine, last-good snapshot** | **Must** | Rigor angle; doc 13 §12; doc 09 §5 |
| F12 | **Methodology screen** with the bias catalogue, model description, validation status ("no validado") | **Must** | doc 08 §2.2, §10.3 |
| F13 | **Office line** (ZIP/county → office; shrunken multiplier with N; 131A-FAM inquiry date as proxy) | **Should** | Office moves estimates by tens of percent, policy by an order of magnitude (doc 08 §11.8) |
| F14 | **Curated alerts feed** (policy, court, data) with scenario re-weighting rules | **Should** | doc 08 §8.4; key facts §3 alert rules |
| F15 | **Forecast ledger + public scorecard** (monthly committed forecasts scored against the next CSVs) | **Should** | Earned trust; doc 08 §10; distinctive to this proposal |
| F16 | **Local notifications** (EAD expiry 180/90 days, inquiry date passed, new monthly data) — native only | **Should** | doc 09 §8 tier A; works in Expo Go [N] |
| F17 | **EAD (c)(9) context panel** (validity rule by issue date, no auto-extension for renewals filed ≥ 2025-10-30, 147-C9 inquiry date) | **Should** | doc 07 §5.3; key facts §2 row 4 |
| F18 | **Crowdsourced timelines (opt-in, Supabase, native only)** with delayed-entry-aware aggregates | **Should (v1.1)** | Only source of milestone and channel effects (doc 08 §9.3); MVP must work without it |
| F19 | Change-point monitor (CUSUM) + "policy uncertainty" banner | **Should (v1.1)** | Lawfully-style regime lag (doc 08 §6.5) |
| F20 | Editable scenario weights (advanced users) | **Could** | doc 08 §8.2 says weights are judgments |
| F21 | Census/OHSS context (Cuban-born population by state; cohort sizes) | **Could** | doc 05, doc 13 §4, §8; not needed for estimates |
| F22 | Remote push (Expo Push) for high-severity alerts | **Could (v2)** | Needs dev build + token store (doc 09 §8 tier C) |
| F23 | Seeded Monte Carlo, competing risks, hierarchical office model | **Could (v2)** | doc 08 §12 |
| F24 | Case-status lookup via Torch API / CSOL | **Won't (MVP)** | Sandbox returns canned data only; production gated; CSOL is Cloudflare-blocked and ToS-fragile (doc 13 §2, §11) |
| F25 | Calling egov.uscis.gov from the device | **Won't** | No CORS, Cloudflare (doc 13 §1.1–1.2) |
| F26 | Free-text community posts / chat | **Won't** | UGC moderation duty, re-identification risk (doc 09 R7) |
| F27 | Any "you will be approved on <date>" output | **Won't** | doc 08 §11.7 rule 1 |

---

## 3) Screen-by-screen spec

Global chrome on every screen: header with **language button "ES | EN"** (one tap toggles; long-press opens a two-item picker), theme-aware; **data badge** under the header: `Datos al {period} · {En vivo|Muestra|Caché} · obtenidos {relative}`; tap → Data provenance sheet. Tabs (bottom on phone, left rail ≥ 900 px): **Inicio, Mi caso, Datos, Alertas, Más**. Icons are in-repo SVG components (react-native-svg), no icon fonts.

Common states: **Loading** = skeleton cards (never spinners over blank screens); **Offline/cached** = amber badge "Caché de hace N días"; **Sample** = grey badge "Datos de muestra (sin conexión)"; **Error** = card with "No pudimos actualizar. Mostrando {fallback}." plus retry; **Stale** (> 75 days since the last official month's publication, T20a) = amber banner "Los datos oficiales tienen más de 75 días".

| # | Screen (route) | Title ES / EN | Purpose | Data shown | Actions | Empty / loading / error |
|---|---|---|---|---|---|---|
| S0 | First launch (`/welcome`, modal) | **Bienvenido / Welcome** | Pick language, accept disclaimer, explain "independent, unofficial, not legal advice" | Language buttons; three bullet promises; disclaimer | Choose ES/EN; "Continuar"; skip to dashboard | Always renders without network (bundled strings) |
| S1 | Dashboard (`/`) | **Panorama / Overview** | National picture in 10 seconds | Pending (monthly CSV, labelled), decisions last month (approved/denied), mean months of completions (labelled "promedio de casos terminados"), Little's-law clearance time at last month's pace and at FY2025 pace, regime timeline ribbon R0–R4, 24-month bar/line chart | Tap any tile → definition sheet; "Calcular mi caso" CTA | Empty impossible (bundled sample); loading skeleton; error → sample + badge |
| S2 | My case — input (`/case`) | **Mi caso / My case** | Capture the minimum inputs | Form: I-485 receipt date (required), entry channel (required), state + ZIP (optional), field office override, milestones with dates (biometrics, EAD (c)(9) issued, interview scheduled/done, RFE received/responded, NOID, mandamus filed), packet checklist (I-94/parole record, Cuban nationality proof, I-693, photos, fee) | Save locally; "Ver estimación"; delete case | Empty state: "Agregue la fecha de su recibo (I-797C)"; validation inline (date in future, receipt before parole + 366 days → warning, not block) |
| S3 | My case — estimate (`/case/estimate`) | **Su estimación / Your estimate** | The honest answer | Headline P(decision ≤ 12 mo) with scenario band; ladder 3/6/12/24/36; quantiles or "más de 6 años"; fan chart of S(t); queue facts (pending, older than you, same month, last month's decisions); office line with N; confidence label; "no validado" tag; approval card (separate) | Toggle scenarios on/off; "¿Por qué?" → explainer; "¿Qué puedo hacer?" | No case → redirect to S2; I-220A/EWI → eligibility card instead of an estimate; estimator error → show inputs + "No pudimos calcular; datos {period}" |
| S4 | Case history strip (`/case/history`) | **Lo que pasó con su caso / What happened to your case** | Explain the holds and peers' divergence | Calendar vs adjudicable days, colored bars for R1/R3 overlaps (R1 only if channel ∈ CHNV/U4U/FRP; CBP One shows a dashed bar "baja confianza"), EAD explanation (issued in R2 vs swept into R3), sub-breakpoints (PA-2026-05, Red Eagle) | Toggle "fechas legales / operativas" (256 vs 306 days) | No case → CTA |
| S5 | What can I do (`/case/actions`) | **¿Qué puedo hacer? / What can I do?** | Remedy ladder | e-Request status for I-485 (131A-FAM inquiry date at office vs receipt) and (c)(9) (147-C9 at NBC), expedite criteria, congressional (FL-26/27/28 when FL), Ombudsman warning, mandamus context (> 24 / 36 months), Red Eagle class note | Open official pages (external links on native; plain text URLs on web artifact) | Missing inquiry dates → "Fecha de consulta no disponible (fuente: {source}, {date})" |
| S6 | Official data (`/data`) | **Datos oficiales / Official data** | Full tables and charts | Monthly series table; quarterly rows (with workbook pending labelled), FY medians with cut dates, office humanitarian columns, inquiry dates; per-number source chip | Switch series; tap chip → provenance | Row missing → "sin dato" (never 0) |
| S7 | Offices (`/data/offices`) | **Oficinas / Field offices** | Office comparison | Per office: humanitarian pending, approvals last 2 quarters, shrunken multiplier with N, 131A-FAM inquiry date, 80% figure (proxy) | Sort; select "mi oficina" | Office without data → "multiplicador 1.0 (sin datos)" |
| S8 | Alerts (`/alerts`) | **Alertas / Alerts** | Policy, court, data news | Curated items (severity, date, EN/ES title/body, source link, effect on scenarios) | Filter by topic; mark read; (native) notification settings | Empty → "Sin alertas nuevas desde {date}" |
| S9 | Methodology (`/more/methods`) | **Cómo calculamos / How we estimate** | Transparency | Bias catalogue; VPH-1 description; current parameters (β, weights, k₀); validation status; scorecard (F15) | Expand sections | — |
| S10 | Provenance sheet (modal) | **Origen de los datos / Data provenance** | Trace any number | source id, URL, product, statistic kind, reference period, published/retrieved dates, sha256, mirror used?, evidence tag, QA status | Copy URL (native) | — |
| S11 | Settings (`/more/settings`) | **Ajustes / Settings** | Preferences | Language, theme (system/light/dark), notifications (native), data source (live/sample), app + data versions | Change; "Borrar mis datos" (local wipe; + remote delete in v1.1) | — |
| S12 | Community (`/community`, v1.1, native) | **Comunidad / Community** | Opt-in sharing and peer aggregates | Aggregates with n; consent screen listing fields | Submit / edit / delete my entry | Backend off → "Función no disponible todavía"; web → "Solo en la app móvil" |
| S13 | Not found (`+not-found`) | — | Any unknown path | — | Immediate `<Redirect href="/" />` | — |

Copy rules: every estimate sentence includes the data month; never "su caso será aprobado"; Spanish strings use "usted" (formal, matches doc 08 §11.7 and doc 15 §9.4 copy); dates via `Intl.DateTimeFormat(locale)`; percentages via `Intl.NumberFormat(locale, {style:'percent', maximumFractionDigits:0})` (ES renders "9 %" with NBSP).

---

## 4) Architecture

```
                          OFFICIAL SOURCES (only those documented in docs 04/05/13)
  www.uscis.gov data portal        GitHub-hosted mirrors              Federal Register API   CourtListener v4   USCIS RSS
  (monthly CSV, quarterly XLSX,    visualizer (raw.githubusercontent)  (no key)               (token)            22984/23269
   I-485 by office XLSX)           jzebedee/uscis (daily SQLite;
                                    processing times + inquiry dates)
        │ browser UA, 30 s          │ sha-compare / fallback            │                      │                  │
        ▼                           ▼                                   ▼                      ▼                  ▼
 ┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │ GitHub Actions  (repo luisitin/Documents, workflows in /.github/workflows, working dir cuban-immigration-tracker) │
 │  probe.yml        weekday probes → data/samples + PROBE-REPORT (doc 13 §12)                                        │
 │  data-refresh.yml schedule 06:17/18:17 UTC + workflow_dispatch(ref) →                                             │
 │     1 fetch   → data/raw/<source>/<period>/<file> + .meta.json (url, status, headers, sha256)                       │
 │     2 parse   → typed Observations (packages/ingestion, zod from packages/schema)                                 │
 │     3 QA      → invariants, cross-product reconciliation, fixtures, drift → qa-report.json                         │
 │     4 build   → snapshot (immutable, content-addressed) + manifest.json (mutable)                                 │
 │     5 fit     → estimator params (β, office multipliers) + forecast ledger entry + scorecard update               │
 │     6 commit  → cuban-immigration-tracker/data/** only  (FAIL QA ⇒ quarantine/, keep last-good, open issue)         │
 └────────────────────────────────────┬─────────────────────────────────────────────────────────────────────────────┘
                                      │ git = audit log
            ┌─────────────────────────┴───────────────────────────┐
            ▼                                                     ▼
 raw.githubusercontent.com/luisitin/Documents/<DATA_REF>/     scripts/build-artifact.mjs (run by a person/agent)
   cuban-immigration-tracker/data/manifest.json                 npx expo export --platform web (output "single")
   (CORS *, ETag, max-age=300 — verified today)                 → web-artifact/index.html  (HTML fragment, inline JS/CSS)
            │                                                   → web-artifact/data/manifest.json + data/*.json (copied)
            ▼                                                                 │ published as Claude artifact + supporting files
 ┌─────────────────────────────────────────────┐            ┌────────────────────────────────────────────────┐
 │ Expo app — iOS/Android (Expo Go for MVP)     │            │ Same Expo app — web build inside artifact host │
 │ DataSource chain: raw URL → KV cache →       │            │ DataSource chain: ./data/manifest.json →        │
 │   bundled sample                             │            │   (optional window.claude mcp refresh) → KV     │
 │ Storage: expo-sqlite/kv-store (one KV API)   │            │   cache → bundled sample                         │
 │ Estimator + case-rules: pure TS, on device   │            │ Storage: localStorage via try/catch, in-memory   │
 │ Local notifications (native only)            │            │   fallback; no notifications; no downloads       │
 └───────────────────────┬─────────────────────┘            └────────────────────────────────────────────────┘
                         │ v1.1 opt-in, native only (artifact CSP blocks outside hosts)
                         ▼
 ┌─────────────────────────────────────────────┐
 │ Supabase (optional): anonymous auth + RLS,   │  ← Actions job reads with service-role key, computes
 │ case_timelines (write-mostly)                │    delayed-entry, n-suppressed aggregates → data/community.json
 └─────────────────────────────────────────────┘
```

**Key decisions and why (rigor angle).**
1. **One language, one contract.** Ingestion, QA, estimator fitting, backtesting and the app share TypeScript and the same zod schemas in `packages/schema`. Doc 09 proposed Python for parsing (§5.2 #8); this proposal moves parsing to Node 22 + TS (doc 13 §12 already specifies Node 22 + zod for probes) so the parser output type *is* the app's input type and the estimator that is backtested in CI is byte-for-byte the code that runs on the phone. Python survives only as an **independent oracle** of VPH-1 (`tools/oracle/`) — the cross-implementation check that found today's 53-vs-54-month discrepancy.
2. **Raw archive before parse.** Every fetched official file is committed under `data/raw/` with sha256 (CSV 3.6 KB, XLSX ≤ 0.8 MB, doc 04 §1.2–1.3). Parsers are pure functions of raw bytes, so any published number can be regenerated from git. The jzebedee SQLite is **not** redistributed (no LICENSE file, doc 13 §1.6); only derived rows plus attribution are stored, pending the author's permission.
3. **Static JSON is the only read path** (doc 09 D3). Native reads from raw GitHub (verified CORS/ETag today); the web artifact reads relative supporting files because the artifact CSP blocks every outside host (owner requirement 2(b)).
4. **"Live" is defined honestly.** Official data change monthly/quarterly; "live" means *the newest committed snapshot*, revalidated by ETag each app open (≥ 6 h `staleTime`). Three clocks are shown: **reference period** (e.g. Aug 2026), **source publication/retrieval date**, **snapshot generated_at**. In the artifact, "live" = data as of the last artifact publish; the badge says "En vivo (publicado {date})" only when the manifest came from `./data/` or MCP, "Muestra" when it came from the bundle.
5. **No SQLite in the core path.** All cached payloads (manifest ≤ 5 KB, snapshot ≤ 100 KB, doc 09 §5.4) fit a KV store; one `kv` interface with `kv.native.ts` (expo-sqlite/kv-store, in Expo Go per SDK 58 notes §5) and `kv.web.ts` (localStorage in try/catch → in-memory map). Fewer moving parts, identical behaviour on web.
6. **Native-only modules are platform files**: `notifications.native.ts` / `notifications.web.ts` (no-op), `haptics`, `linking`. Icons are SVG components; fonts are system fonts; charts are hand-written react-native-svg (no gifted-charts, Skia, Victory; owner requirement 2(g)).

**Staleness rules (shown, never hidden).**

| Condition | Badge / banner | Estimator effect |
|---|---|---|
| Manifest from network this session | green "En vivo" | none |
| From KV cache, age ≤ 72 h | grey "Caché" | none |
| Cache > 72 h (doc 09 §5.2 #5) | amber "Datos de hace N días" | none |
| Latest official month published > 75 days ago (T20a) | amber banner | `confidence = LOW` |
| Monthly rows > one quarter beyond latest workbook (T20b) | info banner listing un-cross-checked months | none |
| Bundled sample | grey "Muestra (sin conexión)" + date | estimate computed, labelled "con datos de muestra" |
| QA quarantine active (pipeline) | manifest `qa.status = "degraded"` → amber "Datos oficiales en revisión" | uses last-good snapshot |

---

## 5) Data model (TypeScript; `packages/schema` exports zod schemas + inferred types)

Design rule: **no bare numbers.** A number that reaches the UI is an `Observation` carrying *what statistic it is*, *over which population*, *for which period*, *from which file*.

```ts
// ---------- provenance ----------
export type EvidenceTag = 'F' | 'S' | 'S-sec' | 'T' | 'I' | 'U';
export type IsoDate = string;          // "2026-10-20"
export type YearMonth = string;        // "2026-08"
export type FiscalQuarter = { fy: number; q: 1 | 2 | 3 | 4 };   // FY = Oct 1 – Sep 30 (doc 04 §1.5)

export type SourceId =
  | 'uscis.monthly_csv' | 'uscis.quarterly_all_forms' | 'uscis.i485_by_office'
  | 'uscis.historic_pt' | 'uscis.pt_tool' | 'mirror.jzebedee' | 'mirror.visualizer'
  | 'fr.api' | 'courtlistener.v4' | 'uscis.rss' | 'census.acs' | 'ohss.monthly'
  | 'curated';                                         // hand-entered facts via reviewed PR

export interface SourceRecord {
  id: SourceId;
  url: string;                    // exact URL fetched (or citation URL for curated)
  via?: 'direct' | 'mirror.visualizer' | 'mirror.jzebedee';
  retrievedAt: string;            // ISO timestamp
  publishedPeriod?: YearMonth | FiscalQuarter;
  publicationDate?: IsoDate;      // e.g. processing-times publication_date
  queriedNote?: string;           // "ELIS, CLAIMS3, queried September 2026" (doc 04 §1.1)
  sha256: string;                 // of raw bytes (data/raw/...)
  bytes: number;
  rawPath?: string;               // data/raw/... (absent for non-redistributable mirrors)
  evidence: EvidenceTag;          // 'F' for parsed files, 'S' for curated from search, ...
}

export type StatisticKind =
  | 'count_flow'                    // received/approved/denied in period
  | 'count_stock'                   // pending at period end
  | 'count_stock_over_6mo'
  | 'mean_months_completed'         // monthly CSV "Avg. Processing Time" (doc 04 §1.1)
  | 'median_months_completed'       // quarterly workbook, historic-pt (doc 04 §1.2, §2.6)
  | 'p80_months_completed_6mo'      // processing-times tool display (doc 13 §1.4)
  | 'inquiry_date_p93'              // service_request_date (more-info formula, [S] today)
  | 'share';                        // approvals / completions

export interface Observation<V = number> {
  metric: string;                   // 'i485_cuban.pending'
  kind: StatisticKind;
  population: 'completed' | 'pending' | 'received' | 'all';
  period: YearMonth | FiscalQuarter | { fyToDate: number; cutDate: IsoDate };
  value: V | null;                  // null = not published / suppressed ('D' key, doc 04 §1.3)
  unit: 'cases' | 'months' | 'date' | 'ratio';
  sourceId: SourceId;
  sourceSha256: string;
  evidence: EvidenceTag;
  note?: { en: string; es: string };
}

// ---------- official aggregates ----------
export interface MonthlyCubanI485Row {          // monthly CSV, row "(Cuban)"
  ym: YearMonth;
  received: number; approved: number; denied: number;
  pending: number; pendingOver6: number | null; avgMonthsCompleted: number | null;
  sourceSha256: string;
}
export interface QuarterlyFormRow {             // quarterly_all_forms
  quarter: FiscalQuarter; formKey: 'I-485 (Cuban)' | 'I-765 (Adjustment Of Status)' | string;
  received: number; approved: number; denied: number; completions: number;
  pendingWorkbook: number;                      // ~3–4% below monthly; label "workbook" (doc 04 §1.1)
  medianMonthsCompleted: number | null;
  fyToDate?: { received: number; approved: number; denied: number };
  sourceSha256: string;
}
export interface OfficeQuarterRow {             // i485_performance_data, "Humanitarian-based" = Cuban+Refugee+Asylee
  quarter: FiscalQuarter; state: string; officeName: string; officeCode: string;
  category: 'humanitarian' | 'family' | 'employment' | 'other';
  received: number | null; approved: number | null; denied: number | null; pending: number | null;
  suppressed: boolean;                          // 'D' cells before FY25 Q3
  sourceSha256: string;
}
export interface ProcessingTimeRecord {         // tool via jzebedee mirror
  form: 'I-485' | 'I-765'; subtype: '131A-FAM' | '147-C9' | '147-C11' | string;
  officeCode: string;
  p80Months: number | null;                     // range[] length 1 or 2 accepted (doc 13 §1.1)
  inquiryDate: IsoDate | null;                  // service_request_date
  publicationDate: IsoDate;
  isProxyForCAA: boolean;                       // true for 131A-FAM (no CAA subtype, doc 13 §1.3)
  sourceSha256: string;
}
export interface HistoricMedian {               // curated from historic-pt reports
  fy: number; medianMonths: number; cutDate: IsoDate | null; fyToDate: boolean;
  sourceUrl: string; evidence: EvidenceTag;     // FY2026 11.8 @ 2026-07-31, 12.3 @ 2026-08-30 [S-sec]
}

// ---------- regimes & policy ----------
export type EntryChannel = 'CHNV' | 'CBP_ONE' | 'FRP_CFRP' | 'U4U' | 'I220A' | 'VISA' | 'OTHER_PAROLE' | 'EWI';
export interface Regime {
  id: 'R0' | 'R1' | 'R2' | 'R3' | 'R4';
  label: { en: string; es: string };
  start: IsoDate | null; end: IsoDate | null;   // operational defaults (key facts §3)
  altEnds?: { legal?: IsoDate; ops?: IsoDate[] };
  hold: boolean;
  appliesTo: (EntryChannel | 'ALL_CUBAN')[];
  lowConfidenceExclusions?: EntryChannel[];     // R1: ['CBP_ONE'] (doc 16 §3)
  instruments: { id: string; date: IsoDate; appliesToCaa: boolean | null; confidence: 'high'|'likely'|'low'; sourceUrl: string }[];
  suspendedBy?: { id: string; date: IsoDate; court: string; docket: string }[]; // Dorcas, Red Eagle
}
export interface SubBreakpoint { date: IsoDate; event: string; effect: 'copy' | 'approval_prior' | 'scenario' | 'eligibility' }

// ---------- estimator parameters (shipped in snapshot) ----------
export interface ScenarioDef {
  id: 'S0' | 'S1' | 'S2' | 'S3';
  label: { en: string; es: string };
  prior: number;                                // weights sum to 1
  path: { kind: 'flat'; level: number }
      | { kind: 'ramp'; from: number; to: number; months: number }
      | { kind: 'freezeThen'; freezeMonths: number; then: ScenarioDef['path'] };
}
export interface WeightChange {                 // ledger: why a weight changed (doc 08 §8.4 rules)
  date: IsoDate; ruleId: string; alertId: string; before: Record<string, number>; after: Record<string, number>;
}
export interface EstimatorParams {
  modelVersion: 'VPH-1.0.0';
  dataThrough: YearMonth;
  beta: { value: number; fittedOn: YearMonth[]; sse: number; fallbackUsed: boolean };
  horizonMonths: 72; receiptsForecast: number;  // 1,000/mo default (key facts §3)
  scenarios: ScenarioDef[]; weightLedger: WeightChange[];
  officeMultipliers: { code: string; raw: number; shrunk: number; nCompletions: number; quarters: FiscalQuarter[] }[];
  k0Office: 50; clamp: [0.5, 2];
  milestone: { ead: 1.0; noBiometricsAfter4mo: 0.7; rfePending: 0; rfeAnswered: { mult: 1.5; months: 3 };
               mandamus: { mult: 1.3; months: 4 };                       // doc 15 §9.3 (was ×3)
               postInterview: { medianMonths: 3; sigma: 0.857 } };
  approvalPrior: { complete: { low: 0.70; center: 0.85; high: 0.90 }; populationShares: Observation[] };
  validation: { status: 'not_validated' | 'validated_r0r2' | 'validated_current'; lastBacktest?: string };
}

// ---------- a user's case (device only) ----------
export type MilestoneKey = 'filed' | 'receipt' | 'biometrics' | 'ead_c9' | 'ap_i131' | 'interview_notice'
  | 'interview' | 'rfe' | 'rfe_response' | 'noid' | 'noid_response' | 'transfer' | 'decision' | 'card'
  | 'erequest' | 'expedite' | 'congressional' | 'ombudsman' | 'mandamus';
export interface MilestoneEvent {
  key: MilestoneKey; date: IsoDate | null;      // null = "happened, date unknown"
  dateSource: 'notice' | 'online_status' | 'memory';   // doc 06 §8.1
  detail?: { decision?: 'approved' | 'denied' | 'withdrawn' | 'admin_closed'; eadValidityEnd?: IsoDate;
             expediteOutcome?: 'granted' | 'denied' | 'no_response'; mandamusOutcome?: 'adjudicated'|'dismissed'|'pending'|'pi_denied' };
}
export interface CaseProfile {
  id: string; createdAt: string; updatedAt: string;
  role: 'principal' | 'derivative';
  entryChannel: EntryChannel;
  paroleDate?: IsoDate; paroleEndDateOriginal?: IsoDate;     // 2026-04-24 = re-termination, not original (doc 16 §8.1)
  terminationNotices?: ('EMAIL_APR_2025'|'CHNV_JUN_2025'|'INDIVIDUAL_APR_2026'|'FRP_JAN_2026'|'OTHER')[];
  i485ReceiptDate: IsoDate;
  receiptFull?: string;                         // device only, never uploaded
  state?: string; zip?: string; officeCode?: string; officeSource: 'zip' | 'notice' | 'user' | 'state_mix';
  packet: { paroleRecord?: boolean; nationalityProof?: boolean; i693?: boolean; photos?: boolean; fee?: boolean };
  milestones: MilestoneEvent[];
}
export interface DerivedFlags {                  // packages/case-rules (key facts §1)
  isParoleBased: boolean; caaParoledElementMet: boolean; r1HoldApplies: boolean | 'low_confidence';
  frpI485Carveout: boolean; redEagleClassMember: boolean; doeDhsClassMember: boolean | 'unknown';
  i220aWarning: boolean; expeditedRemovalWarning: boolean; packetComplete: boolean | 'unknown';
  oneYearDate?: IsoDate; adjudicableDays: { default: number; altOps: number; calendar: number };
}

// ---------- crowdsourced (server copy, v1.1) ----------
export interface CaseTimelineSubmission {
  schemaVersion: 1; consentVersion: number;
  receiptMasked: string;                        // ^[A-Z]{3}\d{5}X{5}$  (doc 09 §6.3)
  entryChannel: EntryChannel; state: string; officeCode?: string;
  registeredAt: IsoDate;                        // required: delayed entry (doc 08 §4.9)
  i485ReceiptWeek: IsoDate;                     // dates truncated to ISO-week Monday in the shared copy [I]
  milestones: { key: MilestoneKey; week: IsoDate | null; source: MilestoneEvent['dateSource'] }[];
  decision?: 'approved' | 'denied' | 'withdrawn' | 'admin_closed';
  filedWithAttorney?: boolean; filedConcurrentI765?: boolean;
  evidenceLevel: 'notice' | 'online_status' | 'memory';
  plausibility: { flags: string[]; score: number };   // computed client-side AND re-checked server-side
}
export interface CommunityAggregate {
  cell: { filingQuarter: string; officeGroup: string; channel: EntryChannel | 'ALL' };
  transition: 'receipt→biometrics' | 'receipt→ead_c9' | 'receipt→interview' | 'interview→decision' | 'receipt→decision';
  n: number; nEvents: number;                   // n < 5 → not emitted; n < 10 → display-only (§8)
  kmQuantilesDays: { p25: number | null; p50: number | null; p75: number | null };   // delayed-entry KM
  weighting: 'none' | 'poststrat_official_frame';
  benchmark: { crowdMonthlyHazard: number; officialMonthlyHazard: number; ratio: number };
}

// ---------- alerts ----------
export interface Alert {
  id: string; date: IsoDate; severity: 'high' | 'medium' | 'info';
  topic: 'policy' | 'court' | 'data' | 'fees' | 'enforcement';
  title: { en: string; es: string }; body: { en: string; es: string };
  sourceUrls: string[]; evidence: EvidenceTag;
  docket?: { court: string; number: string; courtListenerId?: number };   // key on numbers, not captions
  effects?: { ruleId: string; scenarioMultipliers?: Partial<Record<'S0'|'S1'|'S2'|'S3', number>>; approvalPriorFlag?: boolean }[];
  appliesTo?: { channels?: EntryChannel[]; filedBefore?: IsoDate; filedAfter?: IsoDate };
  status: 'draft' | 'published' | 'retracted';  // watchers create drafts; humans publish via PR
}

// ---------- snapshot & manifest ----------
export interface Snapshot {
  schemaVersion: 1; id: string /* sha256 of canonical JSON */; generatedAt: string;
  sources: SourceRecord[];
  monthly: MonthlyCubanI485Row[]; quarterly: QuarterlyFormRow[]; offices: OfficeQuarterRow[];
  processingTimes: ProcessingTimeRecord[]; historicMedians: HistoricMedian[];
  regimes: Regime[]; subBreakpoints: SubBreakpoint[];
  params: EstimatorParams; alerts: Alert[];
  community?: CommunityAggregate[];
  qa: QaReport;
}
export interface Manifest {
  schemaVersion: 1; generatedAt: string; latestSnapshot: string /* path */;
  snapshots: { id: string; path: string; sha256: string; bytes: number; dataThrough: YearMonth }[];
  qa: { status: 'ok' | 'degraded' | 'quarantined'; lastGoodSnapshot: string; notes: string[] };
  minAppVersion: string;                        // schema break → "update the app"
}
export interface QaReport {
  checks: { id: string; status: 'pass' | 'warn' | 'fail'; detail: string }[];
  reconciliation: { monthlyVsQuarterlyFlowsPct: number; monthlyVsWorkbookPendingPct: number; flowIdentityResidualPct: number };
}

// ---------- forecasts & scoring ----------
export interface ForecastLedgerEntry {          // committed monthly; never edited
  issuedAt: IsoDate; dataThrough: YearMonth; modelVersion: string; weights: Record<string, number>;
  nationalCompletions: { ym: YearMonth; pmf: [number, number][] }[];   // predictive distribution, next 6 months
  vintageHazards: { vintage: YearMonth; pWithin: Record<'m3'|'m6'|'m12', number> }[];
  referenceCase: { pWithin12: number; q50: number | null };
}
```

---

## 6) Data pipeline

### 6.1 Sources (only endpoints documented in the research; status as of today)

| Key | URL pattern | Parser | Cadence | Output | Probe status / failure handling |
|---|---|---|---|---|---|
| `uscis.monthly_csv` | `https://www.uscis.gov/sites/default/files/document/data/appropriation_requirement_<month>_<year>_v1.0.csv` (latest `august_2026`; next `september_2026`); older stems `Appropriation_Requirement_<Month>%20<YYYY>.csv` under `/document/reports/` (doc 04 §1.1, doc 13 §3.2) | `parseMonthlyCsv(bytes)`: strip BOM, accept CRLF, read title line "For the Month of <Month YYYY>", find the row whose *Description* ends with "(Cuban)" (the Form Number column is just "I-485" — verified today), parse quoted thousands, tolerate trailing comma (Feb 2026 file) | HEAD next month's URL every run; monthly, 4–8 weeks lag | `MonthlyCubanI485Row` | File read [F]; mirror copy verified today. Discovery: parse portal index first, construct URL only as fallback. Browser UA required (Drupal antibot, doc 13 §3.1) |
| `mirror.visualizer` | `https://raw.githubusercontent.com/omairqazi29/visualizer/master/data/USCIS_I485/monthly_<month>_<year>.csv`, `quarterly_all_forms_fy<YYYY>_q<N>_v1.xlsx`, `i485_performance_data_fy<YYYY>_q<N>_v1.xlsx` | same parsers | weekly upstream | same | Reachable today (200 / 404 for Sept). Used only if direct fetch fails; record `via`; if both succeed, **sha256 must match** or QA fails (doc 13 §12.4 `mirror.visualizer`) |
| `uscis.quarterly_all_forms` | `…/document/data/quarterly_all_forms_fy<YYYY>_q<N>_v1.xlsx` (latest fy2026_q3; Q4 ≈ early Dec 2026) | `parseAllForms(xlsx)`: sheet `FY<yy>Q<n>_All_Forms`; locate row by text "I-485" + "Cuban"; 13 columns as doc 04 §1.2 | HEAD next quarter each run | `QuarterlyFormRow` (Cuban, I-765 AOS) | [F]. Fixture FY26 Q3: 6,279 / 139 / 447 / 586 / 342,360 / 16.3 |
| `uscis.i485_by_office` | discovered from portal index (stem drifted 4× — `i485_performance*`, doc 04 §1.3) | `parseByOffice(xlsx)`: sheet `I485_by_State`; state headings then office rows; 4 category blocks; 'D' → `suppressed` | quarterly | `OfficeQuarterRow[]` | [F]. Fixture: Hialeah humanitarian pending 37,486 (FY26 Q3). Assert humanitarian national total = Cuban+Refugee+Asylum from all-forms (doc 04 §1.3) |
| `uscis.portal_index` | `https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data` | regex hrefs (doc 13 §3.1 list) case-insensitively, incl. space-encoded month | each run | `portal-links.json` | plan only; failure → constructed URLs + mirror |
| `mirror.jzebedee` (processing times) | `GET https://api.github.com/repos/jzebedee/uscis/releases/latest` → `.db` asset (expected `<YYYY-MM-DD>.db`, [I]) | `sql.js` read: `processing_time` where `form_name in ('I-485','I-765')`, subtypes `131A-FAM`, `147-C9`, `147-C11`; `range_upper/lower`, `service_request_date`, `publication_date` (doc 13 §1.2) | daily (builds 04:30 UTC) — prefer a release dated today, else keep previous | `ProcessingTimeRecord[]` | Not reachable from this session; reachable from Actions with `GITHUB_TOKEN` [T]. **Licence: no LICENSE file** — store derived rows only, attribute, request permission (doc 13 §1.6). Fixture: MIA 131A-FAM inquiry 2023-06-17, NBC 147-C9 2025-06-13 |
| `uscis.pt_tool` direct | `https://egov.uscis.gov/processing-times/api/processingtime/I-485/<OFFICE>/131A-FAM` | zod `ProcessingTime` (doc 13 §12.5) | probe only | — | Expected `blocked_cloudflare` from cloud IPs (doc 13 §1.2); **never** on the critical path |
| `uscis.historic_pt` | `https://egov.uscis.gov/processing-times/historic-pt` | curated YAML (`data/curated/historic_medians.yaml`) with URL + cut date, PR-reviewed | on change | `HistoricMedian[]` | Cloudflare-gated; values known via press [S-sec] (doc 04 §2.6) — tagged accordingly in UI |
| `fr.api` | `https://www.federalregister.gov/api/v1/documents.json?conditions[term]=…&conditions[agencies][]=homeland-security-department&conditions[agencies][]=u-s-citizenship-and-immigration-services&conditions[publication_date][gte]=2025-01-01&order=newest&per_page=100` (doc 13 §6) | zod `FrSearch`; diff by `document_number` | daily | draft `Alert` PR | plan only; fixtures `2025-05128`, `2025-22744` |
| `courtlistener.v4` | `GET /api/rest/v4/docket-entries/?docket=<id>&order_by=-date_filed` for ids 69695790, 73477958, 73380879, 74919678, 71085922 (key facts §8) | zod `ClEntry`; diff by `id` | daily, ≤ 6 requests (limit 5/min, 50/h, 125/day, doc 13 §7.1) | draft `Alert` PR | `skipped_no_secret` until `COURTLISTENER_TOKEN` exists; key on docket numbers, not captions |
| `uscis.rss` | `https://www.uscis.gov/news/rss-feed/22984`, `…/23269` | fast-xml-parser; keyword filter (Cuba, parole, hold, adjustment, CAA, PM-602, PA-2026) | each run | draft `Alert` PR | plan only; browser UA |
| `census.acs` | `https://api.census.gov/data/2024/acs/acs1?get=NAME,<var>E&for=state:*` with var resolved from `groups/B05006.json` (label ends "Cuba") | — | annual | context only (Could) | plan only |
| Torch case status | `https://api-int.uscis.gov/case-status/{receipt}` | — | — | **not ingested** | sandbox canned data only (doc 13 §11) |

### 6.2 Stages and failure handling

```
fetch(source) → Raw{bytes, meta}            classification ∈ ok | not_yet | schema_mismatch | blocked_cloudflare
                                                              | blocked_drupal_antibot | http_error | network_error | skipped_no_secret
parse(raw)    → Result<Observation[], ParseError>      pure, deterministic, unit-tested on committed fixtures
qa(all)       → QaReport                               see checks below
build()       → Snapshot (content-addressed id = sha256(canonical JSON)), Manifest
publish()     → commit data/** (and only data/**)
```

**QA checks (fail = do not publish a new snapshot; warn = publish with a note).**

| Id | Check | Level |
|---|---|---|
| Q1 | zod schema valid; no negative counts; dates not in the future; `pendingOver6 ≤ pending` | fail |
| Q2 | Golden fixtures still parse to the exact numbers (Aug 2026 monthly row, FY26 Q3 Cuban row, Hialeah 37,486) | fail |
| Q3 | Month continuity: new month = last month + 1; no rewrite of a past month's values unless the source file's sha changed (then `revision` recorded and shown) | fail on gap, warn on revision |
| Q4 | Flow identity: `|pending_t − (pending_{t−1} + received − approved − denied)| / pending_t ≤ 3%` (historic residual ≤ 2.3% over two years, doc 08 §5.3) | warn > 3%, fail > 10% |
| Q5 | Monthly vs quarterly flows: Σ 3 months vs quarter ≤ 0.5% for received/approved/denied (doc 04 §1.1) | warn |
| Q6 | Monthly vs workbook pending gap within 1–6% (observed 3–4%) | warn (shown as a data note) |
| Q7 | Humanitarian national total = Cuban + Refugee + Asylum (to the unit) | warn |
| Q8 | Mirror sha256 = direct sha256 when both fetched | fail (possible tampering) |
| Q9 | Processing-times: `range[]` length 1–2; inquiry dates parseable; publication date not older than previous | warn |
| Q10 | I-485 subtype list ⊆ known 7 keys; a new key raises `CAA_SUBTYPE_PRESENT` alert draft (doc 13 §12.7) | warn + alert |
| Q11 | Estimator smoke: reference case P(≤12) moves by < 5 pts vs previous snapshot unless a new month arrived | warn (human review) |

On **fail**: write the attempt to `data/quarantine/<run-id>/` (raw + report), keep `manifest.latestSnapshot` on the last good snapshot, set `manifest.qa.status = 'quarantined'`, open/refresh one GitHub issue "Data QA failed: <check>" (separate job with `issues: write`). On a blocked source: previous values are carried forward with their *original* retrieval date (so the staleness banner is truthful).

### 6.3 Output files (published under `cuban-immigration-tracker/data/`)

```
data/manifest.json                     ≤ 5 KB, mutable
data/snapshots/<dataThrough>-<sha8>.json   immutable, ≤ 100 KB
data/raw/<source>/<period>/<file>(.meta.json)   raw bytes (USCIS public-domain files only)
data/curated/{historic_medians,regimes,scenarios,offices_zip}.yaml   PR-reviewed facts with URLs + evidence tags
data/alerts/<date>-<slug>.md           curated alerts (front-matter = Alert fields)
data/forecasts/<issuedAt>.json         forecast ledger (append-only)
data/scorecard.json                    rolling scores
data/samples/                          probe output (doc 13 §12)
data/quarantine/                       failed runs (kept 30 days)
data/schema/*.schema.json              exported from packages/schema (CI fails on drift)
```

The web artifact's `web-artifact/data/manifest.json` + `web-artifact/data/*.json` are **copies** of `manifest.json` and the latest snapshot made by `scripts/build-artifact.mjs` (no raw files, no history).

### 6.4 GitHub Actions workflow sketch (`/.github/workflows/data-refresh.yml`, repo root)

Scheduled workflows run only on the default branch; `workflow_dispatch` makes the feature branch runnable (owner requirement 3).

```yaml
name: caa-data-refresh
on:
  schedule:
    - cron: "17 6 * * *"     # off the hour (doc 09 §5.2)
    - cron: "17 18 * * *"
  workflow_dispatch:
    inputs:
      only:    { description: "comma list of source keys (blank = all)", required: false, default: "" }
      dry_run: { description: "parse + QA but do not commit", type: boolean, default: false }
permissions:
  contents: write            # only what the commit needs; no pages, no id-token
concurrency: { group: caa-data-refresh-${{ github.ref }}, cancel-in-progress: false }
defaults: { run: { working-directory: cuban-immigration-tracker } }
jobs:
  refresh:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    outputs: { qa_status: ${{ steps.ingest.outputs.qa_status }} }
    steps:
      - uses: actions/checkout@<sha-of-v7>          # pin SHA (doc 09 §5.3)
        with: { ref: ${{ github.ref_name }} }
      - uses: actions/setup-node@<sha-of-v7>
        with: { node-version: 22, cache: npm, cache-dependency-path: cuban-immigration-tracker/package-lock.json }
      - run: npm ci
      - id: ingest
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}               # jzebedee release lookup
          COURTLISTENER_TOKEN: ${{ secrets.COURTLISTENER_TOKEN }} # optional → skipped_no_secret
        run: npm run -w @caa/ingestion refresh -- --out data --only "${{ inputs.only }}"
      - name: Commit snapshots (data/ only)
        if: ${{ !inputs.dry_run }}
        run: |
          git config user.name "caa-data-bot"
          git config user.email "caa-data-bot@users.noreply.github.com"
          git add data/
          git diff --cached --quiet && { echo "no changes"; exit 0; }
          git commit -m "data: refresh $(date -u +%FT%H:%MZ) [skip ci]"
          git push origin HEAD:${{ github.ref_name }}
  report-failure:
    needs: refresh
    if: ${{ failure() || needs.refresh.outputs.qa_status == 'quarantined' }}
    runs-on: ubuntu-latest
    permissions: { issues: write }                  # separate job, separate least privilege
    steps:
      - run: gh issue create --repo "$GITHUB_REPOSITORY" --title "CAA data QA: ${{ needs.refresh.outputs.qa_status }}" --body "Run $GITHUB_RUN_ID" || true
        env: { GH_TOKEN: ${{ secrets.GITHUB_TOKEN }} }
```

Notes: the bot commit is repository activity (keeps the 60-day schedule alive, doc 09 R1); `[skip ci]` avoids CI loops; a weekly `staleness.yml` checks `generatedAt` and opens an issue after 7 days (doc 09 §5.2 #6). `probe.yml` (doc 13 §12.6) runs first, manually, to turn every "plan only" row above into `ok` or a documented block — **Week 0 deliverable**.

---

## 7) Estimation model

### 7.1 Model choice
**v1 = VPH-1** (vintage-pool hazard with a policy-scenario grid, doc 08 §11), with the Round-2 amendments (mandamus ×1.3, packet-conditioned approval prior 70–90%, CBP One R1 = 0 with low-confidence flag; README §2.6) and four additions from this proposal: (a) **state-level office mixing** when only the state is known, (b) **driver decomposition** (how much of the spread is policy vs β vs office), (c) **observable-target scoring** (§7.6), (d) **pinned golden outputs from two independent implementations**.

### 7.2 Inputs
`MonthlyCubanI485Row[]` (Sep 2024 → latest), `OfficeQuarterRow[]` (last two quarters, humanitarian column incl. denials once parsed — doc 08 §12 v1.1), `Regime[]`, `ScenarioDef[]` + weights after alert rules, `CaseProfile`, `today`.

### 7.3 Algorithm (v1, exact)

```ts
function estimate(caseP: CaseProfile, snap: Snapshot, today: IsoDate): Estimate {
  // 0. Gate
  const flags = deriveFlags(caseP, snap.regimes, today);               // packages/case-rules
  if (!flags.caaParoledElementMet) return ineligibleResult(flags);     // I220A, EWI, CONDITIONAL_PAROLE: no estimate
  if (hasDecision(caseP)) return decidedResult(caseP);

  // 1. Pool reconstruction (national, calendar age), doc 08 §5.3
  const rows = cleanSeries(snap.monthly).filter(r => r.pendingOver6 != null);   // starts Sep 2024
  const beta = fitBeta(rows);              // ternary search on [0,0.3] over last 3 months with ≥300 completions; fallback 0.037
  const pool = reconstructPool(rows, beta);   // legacy>6mo @12, legacy<6mo @3; per month: age+1, add receipts @0.5,
                                              // remove C ∝ n·e^{β·age}, rescale to official pending
  const userVintage = ym(caseP.i485ReceiptDate) < rows[0].ym ? 'legacy' : ym(caseP.i485ReceiptDate);
  const k0 = monthsBetween(last(rows).ym, ym(today));                   // 2 for Aug data on 2026-10-20

  // 2. Office multiplier
  const m_office =
      caseP.officeCode ? shrink(officeStat(caseP.officeCode), groupStats, 50, [0.5, 2])     // Gamma–Poisson
    : caseP.state      ? Σ_o w_o · shrink(o)   with w_o = humanitarian pending share of office o in the state  // [I] new
    : 1.0;

  // 3. Milestone state
  const st = milestoneState(caseP, today);
  if (st.kind === 'post_interview')                                     // interview done, no decision
    return postInterviewResult(lognormalConditional(median=3, sigma=0.857, monthsSince=st.monthsSinceInterview), …);
  const m_ms = (t: number) =>                                           // t = months after today
      (st.rfePendingUntilResponse ? 0 : 1)
    * (st.rfeAnsweredMonthsAgo !== undefined && st.rfeAnsweredMonthsAgo + t <= 3 ? 1.5 : 1)
    * (st.mandamusMonthsAgo   !== undefined && st.mandamusMonthsAgo   + t <= 4 ? 1.3 : 1)
    * (st.noBiometricsAfter4mo ? 0.7 : 1)
    * 1.0;                                                              // EAD received: 1.0 (no evidence of an I-485 effect)

  // 4. Scenario grid: 4 scenarios × β∈{β/2,β,2β} (¼,½,¼) × office∈{0.8m,m,1.25m} (¼,½,¼) = 36 paths
  const paths = [];
  for (const s of scenarios) for (const [bm, wb] of BETA_GRID) for (const [om, wo] of OFFICE_GRID) {
    const S = [1]; const p = clone(pool); const u = p.find(v => v.label === userVintage)!;
    for (let k = 1; k <= 72; k++) {
      ageAll(p, 1); p.push({ age: 0.5, n: params.receiptsForecast, label: `f${k}` });
      const C = completions(s.path, k);                                  // S3 → 0 for k ≤ 6
      const W = Σ_v n_v · exp(beta·bm·age_v);
      const tAfterToday = k - k0;
      const h = Math.min(0.95, C · exp(beta·bm·u.age) / W · m_office·om · (tAfterToday > 0 ? m_ms(tAfterToday) : 1));
      removeProportional(p, C, beta·bm);
      S.push(S[k-1] · (1 - h));
    }
    paths.push({ S, prior: s.weight · wb · wo, scenario: s.id });
  }

  // 5. Condition on "still pending today" and update weights (doc 08 §4.6)
  const post = paths.map(p => p.prior · p.S[k0]); normalize(post);
  const Sc = (t: number) => Σ_i post_i · paths[i].S[k0 + t] / paths[i].S[k0];   // t = months from today

  // 6. Outputs
  return {
    pWithin: { m3: 1-Sc(3), m6: 1-Sc(6), m12: 1-Sc(12), m24: 1-Sc(24), m36: 1-Sc(36) },
    quantiles: q => firstT(t => 1 - Sc(t) >= q) ?? null,               // null = beyond horizon
    scenarioBand12: [min_s P_s(≤12), max_s P_s(≤12)],                   // "2–26%" for the reference case
    drivers: varianceShares(paths, post, t=12),                         // share of Var[P≤12] from scenario / β / office  [I]
    survival: range(0, 72-k0).map(Sc),
    queue: { pending: last(rows).pending, olderThanYou: Σ older, sameVintage: u.n, lastMonthCompletions, beta },
    adjudicable: flags.adjudicableDays, holdsApplied, r1Confidence,
    approval: approvalCard(flags.packetComplete, params.approvalPrior),  // never multiplied into timing
    confidence: confidenceLabel(snap, caseP),                           // LOW until §7.6 gates pass
    validated: params.validation.status,
    dataThrough: last(rows).ym, k0,
  };
}
```

`deriveFlags` computes adjudicable days per key facts §3: `calendar − Σ overlap(hold regimes that apply)`, R1 applies to CHNV/FRP_CFRP/U4U, R3 to all Cubans; CBP One R1 = 0 with `r1HoldApplies: 'low_confidence'`; `altOps` uses 2025-06-25 / 2026-07-16 ends.

### 7.4 How filing date, milestones, state and channel condition the estimate (and where they honestly do not)

| Input | Effect in v1 | Honest note shown to the user |
|---|---|---|
| Filing date | Selects the vintage → its age-priority weight e^{βa} and position (older-than-you count) | Older vintages are *mildly* favoured (β ≈ 0.037/month, doc 08 §5.5); not FIFO |
| Field office (ZIP/notice) | Shrunken multiplier 0.83–1.94 (doc 08 §7.3), clamp [0.5, 2] | "Office explains a few points; national policy explains tens" |
| State only | Pending-weighted mix of the state's office multipliers [I] | "Approximate: we don't know your exact office" |
| Entry channel | **Gating and the adjudicable-time strip; not the hazard** in v1 (the pool is national and mixed, doc 08 §5.6) | "We cannot yet measure whether CHNV and CBP One cases move at different speeds; community data will" |
| EAD (c)(9) received | Multiplier 1.0 | "Your work permit was decided in a separate queue; there is no evidence yet that it speeds up the I-485" (doc 08 §7.5) |
| Biometrics missing > 4 mo | ×0.7 | routing problem signal |
| RFE pending | hazard 0 until the response; RFE ≤ 12 weeks since PA-2026-05 (doc 14 §4) | "Respond before {date}" |
| RFE answered | ×1.5 for 3 months | |
| Interview done | Switch to log-normal (median 3 mo, 10th–90th 1–9 mo) | attorney reports only (doc 07 §11.2 via doc 08) |
| Mandamus filed | ×1.3 for 4 months (doc 15 §9.3) | "Courts have not ordered USCIS to speed up CAA cases" (*Acosta Reynoso* PI denied 2026-07-30) |
| Expedite granted | post-interview-like distribution, median ≈ 2 mo (doc 15 §9.3) | |
| e-Request / congressional / Ombudsman | none | "They inform; they do not accelerate" |
| Packet completeness | Approval card only: complete → 70–90% (centre 85%); incomplete/unknown → show population shares 49% (Jul) / 47% (Aug) and the checklist, **no clean-case prior** [I, from doc 14 §8.1] | PA-2026-05: denial without RFE possible |

### 7.5 The 2025 holds and regime changes
- **Past holds** are already in the data: C_k collapsed to 41/15/10/25/23/27 in Dec 2025–May 2026 [F]; the pool reconstruction consumes the real completions, so no special hazard switch is needed for history. Holds appear to users as adjudicable-time subtraction (display) and as calendar-time context.
- **Future holds** enter only through S3 (six-month re-freeze, prior 0.15) and the alert rule table (key facts §3; doc 08 §8.4): *Dorcas* affirmed → S3 ÷ 3; reversed → S3 × 3 (× 1.5 while *Red Eagle* PI holds); *Red Eagle* PI dissolved → S3 × 2; new hold memo naming Cuba → S3 × 3; monthly completions ≥ 2,000 two months running → S0 ÷ 2, S1 × 1.5; AAUP relief vs the Denial Policy → approval card flagged, timing unchanged. Every change is written to `params.weightLedger` with the alert id, so a later reader can see *why* the estimate moved.
- **Class scope:** `redEagleClassMember` (Cuban, not finally adjudicated on 2026-08-24) is true for the reference case; a filer after 2026-08-24 gets the "*Dorcas* only" copy and **S3 prior × 1.5** [I, doc 03 §11.3: the class may not cover later filers].
- **Change-point monitor (v1.1):** CUSUM on Poisson residuals of monthly completions vs the mixture's predictive mean; |CUSUM| > 4 → "policy uncertainty" banner and weights widened toward extremes until two months agree (doc 08 §6.5).

### 7.6 Testing, backtesting and calibration

**(a) Unit and golden tests.** All doc 08 tests T1–T20 plus T21/T22 (doc 16 §8.2), implemented in Vitest over `packages/estimator`. Because today's independent re-implementation matched pool facts exactly but drifted by one month on the median and 0.34 pt on Tampa, golden values are produced by **two implementations** (TS package and `tools/oracle/vph1.py`) and committed as `packages/estimator/golden/*.json`; CI fails if the two disagree by more than 0.1 pt on any probability or 0 months on any quantile, and tolerances in tests are taken from the golden file (P ± 0.003, quantiles ± 1 month until both implementations agree exactly, then 0). Spec ambiguities to pin in the code (each a decision record): grid order, whether k₀ counts from the end of the last official month, quantile definition "first whole month t with F ≥ q", 0.95 hazard cap applied after all multipliers.

**(b) The owner's reference case as a test suite (`refcase.vitest.ts`).**

| Id | Input | Expected |
|---|---|---|
| RC1 | CHNV, receipt 2025-03-15, EAD 2025-09, no interview/RFE, office unknown, data through 2026-08, today 2026-10-20 | P(≤3/6/12/24/36) ≈ 1.5/3.7/9.4/22.3/35.6% (doc 08 T15 tolerances); q10 = 13, q25 = 27, q50 ∈ {53, 54} until pinned, q75 = null; scenario band 12 mo ≈ 2–26% |
| RC2 | same, adjudicable days | 584 calendar; 306 default; 256 alt-ops (T11) |
| RC3 | Peer A: same filing, **no EAD** | **identical I-485 probabilities** (EAD multiplier 1.0); history strip explains: an I-765 still pending on 2025-12-02 was swept into R3 (doc 07 §5.1) |
| RC4 | Peer B: same filing, **CBP One** | identical I-485 probabilities; adjudicable 392 with low-confidence R1 note (T21) |
| RC5 | Peer C: same filing, office TAM vs KND | P(≤12) TAM > unknown > KND (T16 ordering) |
| RC6 | e-Request gates on 2026-10-20 | I-485 at MIA/HIA/KND/TAM: *not available* (inquiry dates 2023-06-17 … 2024-08-07 < receipt); (c)(9) at NBC: *available* (inquiry 2025-06-13 > 2025-03-15) (doc 15 §2.2) |
| RC7 | Red Eagle flag | true (Cuban, pending on 2026-08-24) |
| RC8 | Approval card, packet complete | 70–90% with Q1 91.7% / Q2 52.6% / Q3 23.7% / FYTD 83% baselines and Jul 49% / Aug 47% population shares |

**(c) Backtests on what is observable.** Individual decision times are not observable from official data, so this plan scores three observable things:
1. **National monthly completions** — each forecast ledger entry contains the scenario-mixture predictive distribution for C over the next 6 months; when a new CSV lands, score log-score and PIT. This directly tests the part of the model that dominates the answer (policy/throughput).
2. **Mean age of completions** (monthly CSV `avgMonths`) — posterior predictive check of β: model mean age vs observed (Jun–Aug 2026 fit SSE 4.9 vs 24.1 at β = 0, doc 08 §5.5).
3. **Vintage pending counts** — not published per vintage, but `pendingOver6` is: predicted vs observed pending > 6 months each month (a direct check of the pool reconstruction).
Plus the doc 08 §10.2 rolling-origin backtest (origins Oct 2024 →) reported **separately by regime**, with the acceptance gate 90% interval coverage in [80%, 97%] on R0/R2 origins; R3/R4 origins are reported as "insufficient resolution" rather than claimed.

**(d) Individual calibration** only from crowdsourced decisions with delayed entry (v1.1+): Brier for "decision within 12 months", discrete censored CRPS, coverage of 50/80/90% intervals. The `confidence` label stays **LOW** until: ≥ 6 months of R4 data, completions-forecast PIT not rejected (KS p > 0.05 over ≥ 6 months), and (for MEDIUM) ≥ 30 crowdsourced decisions in the user's office group.

**(e) Forecast ledger.** Each refresh that adds a month writes an immutable `data/forecasts/<date>.json` (reference case, every vintage's P(≤3/6/12), C predictive). The scorecard on the Methodology screen compares old forecasts with later CSVs. This is pre-registration: we cannot quietly re-tune history.

### 7.7 Presenting uncertainty
Rules from doc 08 §11.7 plus: headline sentence = mixture probability **and** scenario band ("9 % (entre 2 % y 26 % según la política)"); fan chart with 50/80% bands; quantiles beyond 72 months shown as "más de 6 años"; driver bar ("Política 88 % · Orden de la cola 7 % · Oficina 5 %" — computed, not hard-coded); "no validado" chip; data month in every sentence. EN/ES strings live in `app/src/i18n/locales/{en,es}.json`, including chart axis labels and notification texts.

### 7.8 v2 path
In order (doc 08 §12): denials in office file + separate β for approvals/denials → CUSUM monitor → crowdsourced milestone sub-models (Aalen–Johansen per transition, ≥ 30 events) → channel-specific pool share (≥ 100 decisions with `entryChannel`) → hierarchical office model fitted in CI, τ shipped → seeded Monte Carlo (2,000 draws, fixed seed) → competing risks (approval vs denial cumulative incidence) once FY26 Q4/FY27 Q1 show post-PA-2026-05 mixes → full Lexis model on individual records.

---

## 8) Crowdsourced timelines

**What is captured** (subset of doc 06 §8.1 + doc 15 §9.2 + doc 16 §8.1, structured fields only): masked receipt prefix (`IOE09326XXXXX`), entry channel, parole date (month), state, office code, filed with attorney (bool), concurrent I-765/I-131 (bool), milestone **weeks** (receipt, biometrics, EAD c9 approved, interview notice, interview, RFE, RFE response, decision + outcome, card), remedy events (e-Request, expedite + outcome, congressional, mandamus + outcome), evidence level per milestone, `registeredAt`. No free text, no names, no ZIP, no full receipt, no A-number.

**Validation (client and server, same code from `packages/case-rules`).**

| Rule | Action |
|---|---|
| Format: receipt prefix ∈ {IOE, MSC, NBC, EAC, WAC, LIN, SRC, YSC} and `^[A-Z]{3}\d{5}X{5}$` (doc 13 §2.2) | reject |
| Order: receipt ≤ biometrics ≤ … ≤ decision; nothing after `registeredAt` + 1 day; nothing before 2023-01 | reject |
| Eligibility: receipt ≥ parole date + 366 days (warn only — users misremember parole dates) | flag `early_filing` |
| Regime plausibility: an approval dated inside a hold window that applied to the channel (R3 for all; R1 for CHNV) | flag `decision_in_hold` (kept, weight 0.5 — real but rare: 41 approvals in Dec 2025 [F]) |
| EAD c9 approved < 30 days after receipt | flag `implausible_fast` |
| Channel I-220A with approval | flag `i220a_approved` (kept; analytically interesting, excluded from parolee cells) |
| Duplicate: on-device salted hash prevents same device re-submission (doc 09 §7.1 #3); server: same masked prefix + same receipt week + same office within one owner | reject |

**De-biasing.**
1. **Delayed entry** always: a row enters the risk set at its registration age (doc 08 §4.9).
2. **Evidence weights:** notice 1.0, online status 0.8, memory 0.5 (doc 08 §9.2 #4 adapted).
3. **Post-stratification** to the official frame: cells = filing quarter × office group (Miami-Dade trio, rest of FL, TX, other) × channel-collapsed; frame = official humanitarian pending by office (doc 04 §1.3) × CBP/CBP One cohort shares (110,240 CHNV vs ≈ 100k CBP One, doc 16 §8.3) [I]; weights trimmed at 5×.
4. **Benchmark gate:** crowd-implied monthly decision hazard for pending rows vs official C/pending (0.23% in Aug 2026, doc 08 §2.3); if ratio ∉ [0.5, 2] with ≥ 30 events → aggregates shown with "esta muestra no es representativa" and **not used** in any estimate (doc 08 §9.2 #2).
5. **Influence cap:** no office-month cell > 5% of any likelihood (doc 08 §9.2 #6).

**Thresholds (reconciling docs 06/08/09/15):** n < 5 → not emitted at all; 5 ≤ n < 10 → displayed with N, never used in estimates; n ≥ 10 → office-group display estimates; ≥ 30 events per transition → milestone sub-model input; ≥ 100 decisions with channel → channel-specific pool share.

**Privacy.** Shared copy dates truncated to ISO-week Monday [I] (costs ≤ 6 days precision on month-scale durations; reduces linkage to a single notice date); masked receipt; state-level geography in public outputs; aggregates monthly-bucketed; raw table has **no SELECT policy** for any client (doc 09 §6.3); Actions job reads with service-role key from an environment secret with required reviewers; `delete_my_account()` cascade; consent screen lists every field and version.

**Abuse prevention.** Supabase anonymous auth + RLS own-rows only; ≤ 3 rows per owner (trigger, doc 09 §6.3); Supabase rate limits on anonymous sign-in; CAPTCHA (native only) if abuse appears; plausibility score < 0.5 → quarantined row not used; daily anomaly check (submission spike from one office/week > 5× median → hold cell). Edits re-validated; outcome flips (approved → denied) after > 30 days flagged.

**Web artifact:** submissions impossible (CSP blocks the Supabase host) → Community screen is read-only from `./data/` aggregates with the note "Para compartir su caso use la app móvil".

**MVP fallback without a backend.** The app is fully functional: personal case stays on device; estimates use official data only; the Community screen says "Aún no hay datos comunitarios suficientes"; curated *anecdotal* timelines from press (doc 06 §5.1) may appear on the Methodology screen as "relatos" with source links and weight 0.3, never fed to the model. No GitHub-issue submission path (it would publish personal timelines in a public repo).

---

## 9) Alerts and notifications

**Sources → drafts → human publish.** Watchers (Federal Register API, CourtListener docket entries for the five pinned dockets, USCIS RSS 22984/23269, pipeline findings like `NEW_MONTH`, `CAA_SUBTYPE_PRESENT`, `QA_DEGRADED`) open draft PRs adding `data/alerts/<date>-<slug>.md`; a maintainer (or agent reviewed by a person) fills EN/ES copy, evidence tag and `effects`, then merges. No automatic numeric-change pushes (processing-times values change silently several times a day, doc 13 §1.4).

| Category | Examples (cite) | Effect |
|---|---|---|
| Court | *Dorcas* 1st Cir. 26-1703 merits/stay; *Red Eagle* PI changes; *AAUP v. Mullin* TRO/PI; *Doe v. DHS* re-termination ruling; *CHIRLA* mandate; *Bello-Rubio*/BIA I-220A (key facts §9) | Scenario multipliers per §7.5; copy changes; I-220A eligibility flip would change gating |
| Policy | New PM-602 memo naming Cuba; Policy Manual updates; FR notices on parole/EAD/fees (doc 13 §6) | S3 × 3 for a new hold; fee table updates |
| Data | `NEW_MONTH` (Sept 2026 CSV not out as of today [S, F today]); FY26 Q4 workbook (≈ early Dec 2026; first post-PA-2026-05 view) | Refit; approval prior review |
| Personal (local, on device, native) | EAD expiry −180/−90 days (validity read from card; 18-month cap after 2025-12-05; no auto-extension for renewals filed ≥ 2025-10-30); inquiry date passed for the user's office/subtype; 24 / 36 months pending (mandamus information, not advice); RFE response deadline (≤ 12 weeks) | Local notification + in-app card |

**Notification policy.** Tier A local notifications (Expo Go) in MVP; permission asked after explaining value; Android channel before prompt; texts from the i18n bundle in the user's current language (re-scheduled when the language changes); quiet hours 21:00–08:00 local; max 2 per week except severity high. Web: no notifications; Alerts tab badge only. Tier B/C per doc 09 §8 in v2.

---

## 10) Privacy, security, legal disclaimers, store compliance

- **Privacy:** MVP collects nothing (Apple "Data Not Collected"; Google data-safety "no data collected") (doc 09 §7.2). Case data lives in device KV only; "Borrar mis datos" wipes it. No analytics/ads/AI SDKs (doc 09 §7.1 #5). Full receipt never leaves the device.
- **Web artifact:** every `localStorage` access wrapped in try/catch with in-memory fallback; renders with storage disabled; no downloads, print, alert/confirm/prompt, iframes, device APIs; external links rendered as text + copy-free (host rules 2(e)).
- **Security:** branch protection; CODEOWNERS on `.github/workflows/**`, `packages/ingestion/**`, `data/curated/**`, `data/alerts/**`; actions pinned to SHAs; Q8 mirror sha check; app-side zod validation refuses impossible values and unknown `schemaVersion` (shows "actualice la app"); `minAppVersion` in manifest.
- **Legal copy (EN/ES, shown on welcome, estimate footer, actions screen):** "Independent, unofficial tool. Not legal advice. Not affiliated with USCIS or DHS. Estimates are statistical and not validated for the current policy period." / "Herramienta independiente y no oficial. No es asesoría legal. No está afiliada a USCIS ni a DHS. Las estimaciones son estadísticas y no están validadas para el período de política actual." Rumour-control strings from doc 14 §8.7.
- **Store compliance:** no USCIS/DHS in the app name or icon, no seals (Google Deceptive Behavior; doc 09 R6); privacy policy link in store listing and in-app; account deletion in-app once anonymous accounts exist (doc 09 R8); no free-text UGC (R7); positioning against Apple 4.3 with the CAA-specific estimator and open data (R6).

---

## 11) Repository layout and module boundaries

Repo root is `/home/user/Documents` (`luisitin/Documents`); workflows must live at the root.

```
/.github/workflows/
  caa-ci.yml                 typecheck, lint, vitest, jest, golden cross-check, expo export (web+android), schema drift
  caa-data-refresh.yml       §6.4
  caa-probe.yml              doc 13 §12.6 (paths adjusted to the subdirectory)
  caa-staleness.yml          weekly
cuban-immigration-tracker/
  package.json               npm workspaces: app, packages/*  (Node ≥ 22.13, doc 09 §6.4)
  app/                       Expo SDK 58 app (src/app routes, see below)
  packages/schema/           @caa/schema
  packages/estimator/        @caa/estimator
  packages/case-rules/       @caa/case-rules
  packages/ingestion/        @caa/ingestion
  packages/i18n-copy/        @caa/i18n-copy   (shared EN/ES strings for alerts/notifications/estimator explanations)
  tools/oracle/              independent Python VPH-1 (python -I), golden generator
  scripts/build-artifact.mjs web fragment packager
  web-artifact/              generated: index.html + data/  (git-tracked only on release tags)
  data/                      §6.3
  supabase/                  v1.1 migrations (RLS, triggers, delete_my_account)
  docs/                      research, planning, decision records (docs/planning/adr/*.md)
```

| Package | Public interface | Depends on | Owner agent can work in parallel because… |
|---|---|---|---|
| `@caa/schema` | zod schemas + types of §5; `exportJsonSchemas(outDir)`; `SCHEMA_VERSION` | zod | It is the contract; freeze v1 in week 1, extend only additively |
| `@caa/case-rules` | `deriveFlags(case, regimes, today): DerivedFlags`; `adjudicableDays(...)`; `remedyLadder(case, processingTimes, today): RemedyStep[]`; `eadStatus(case, today)`; `validateSubmission(sub): {ok, flags, score}` | schema | Pure functions; tests T11/T19/T21/T22, RC2/RC6/RC7 |
| `@caa/estimator` | `estimate(case, snapshot, today): Estimate`; `fitBeta(rows)`; `reconstructPool(rows, β)`; `officeMultiplier(...)`; `applyAlertRules(params, alerts): EstimatorParams`; `scoreForecasts(ledger, rows): Scorecard`; `GOLDEN` | schema, case-rules | Pure TS, no React; Vitest; golden files |
| `@caa/ingestion` | CLI `refresh --out data [--only]`, `probe --report-dir`, `backtest`; library: `fetchWithPolicy`, `parseMonthlyCsv`, `parseAllForms`, `parseByOffice`, `readJzebedee`, `runQa`, `buildSnapshot`, `watchers.{fr,courtlistener,rss}` | schema, estimator (for fit + ledger) | Node only; fixtures in `test/fixtures` (Aug 2026 CSV fetched today) |
| `@caa/i18n-copy` | `copy(key, lang, params)`; JSON bundles `en.json`/`es.json` for non-UI-framework strings | — | Copy writers/translators |
| `app` | routes and features; `src/data/{dataSource.ts, kv.native.ts, kv.web.ts, useManifest.ts}`; `src/theme/useTheme.ts` (honors `document.documentElement.dataset.theme` via MutationObserver on web); `src/i18n/` (i18next instance, language persisted via kv, default from `getLocales()`); `src/components/{charts,icons}` (react-native-svg); `src/notifications/{index.native.ts,index.web.ts}`; `src/app/+not-found.tsx` (Redirect "/") and a web guard in `_layout.tsx` that `router.replace('/')` when the initial pathname matches no route | all packages | Screens can be built against `GOLDEN` fixtures before the pipeline exists |
| `scripts/build-artifact.mjs` | `node scripts/build-artifact.mjs [--data data/manifest.json]` → runs `npx expo export --platform web` (app.json `web.output: "single"`), inlines JS/CSS, drops or data-URIs assets, strips `<!doctype>/<html>/<head>/<body>`, emits fragment starting `<title>CAA Tracker</title><style>…</style><div id="root"></div><script>…</script>`, copies manifest + latest snapshot to `web-artifact/data/`, fails if > 16 MB or if any `src=`/`href=` points off-origin | app build | Independent of app internals; verified by the Prove step (headless Chromium, 390 px + desktop, light/dark, all tabs, language switch, estimator) |

The fragment's `<style>` sets explicit `background`/`color` on `body` and `#root` for light (`:root`), dark under `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-theme="light"])`, and again under `:root[data-theme="dark"]` with `color-scheme: dark` (host contract 2(f)); the app column is `max-width: 720px; margin: 0 auto` on wide screens, no horizontal scroll at 390 px.

**Data-source chain (single module `app/src/data/dataSource.ts`).** `web`: `./data/manifest.json` (2 s timeout) → `window.claude?.use` MCP `get_file_contents(luisitin/Documents, cuban-immigration-tracker/data/manifest.json)` if available (lowest priority, silently skipped) → raw GitHub (works outside the artifact host; blocked silently inside) → KV cache → bundled sample. `native`: raw GitHub `https://raw.githubusercontent.com/luisitin/Documents/${DATA_REF}/cuban-immigration-tracker/data/manifest.json` with `If-None-Match` → KV cache → bundled sample. `DATA_REF` from `app.json extra.dataRef` (default branch for releases; the feature branch for previews). Every result carries `{origin: 'live'|'cache'|'sample', fetchedAt}` to drive the badge.

---

## 12) Roadmap and effort (solo developer + agents; person-days)

| Phase | Scope | Effort | Exit criteria |
|---|---|---|---|
| **W0 Probe & contract** (week 1) | Run `caa-probe.yml` manually; commit samples; freeze `@caa/schema` v1; ADRs for spec ambiguities; fixtures from the Aug 2026 CSV (already fetched) and the FY26 Q3 workbooks via mirror | 4 d | Every source row in §6.1 has a real classification; schema v1 tagged |
| **MVP** (weeks 2–6) | Ingestion (monthly, quarterly, by-office, jzebedee) + QA + snapshot/manifest + workflow; `case-rules`; `estimator` with golden cross-check (TS + Python oracle) and RC1–RC8; app screens S0–S11, S13; i18n EN/ES complete; KV store both platforms; SVG charts/icons; theme hook; build-artifact script + headless Prove; curated alerts (Markdown) | 24 d | Reference case reproduces RC1–RC8; artifact boots from any path at 390 px and desktop in both themes and languages; QA fail path demonstrated; data badge truthful in all 7 states |
| **v1.1** (weeks 7–10) | Forecast ledger + scorecard; CUSUM monitor; denials in office multipliers; FR/CourtListener/RSS watchers creating draft PRs; local notifications; Supabase opt-in submissions with validation, delayed-entry aggregates, post-stratification, benchmark gate; delete-my-data | 15 d | First ledger entry scored against the September or October CSV; ≥ 1 community aggregate cell published or a documented "not representative" verdict |
| **v2** (months 3–6) | Milestone sub-models; channel-specific pool share; hierarchical office model; seeded Monte Carlo; competing risks after FY26 Q4/FY27 Q1; push notifications via dev build; EAD (c)(9) estimator from I-765 AOS series | 25–35 d | Confidence label can reach MEDIUM by the §7.6(d) rule |

Total to MVP ≈ 28 person-days; to v1.1 ≈ 43 [I].

---

## 13) Risks and open questions

| # | Risk / question | Impact | Mitigation / next step |
|---|---|---|---|
| K1 | **Estimator spec ambiguity** (today's re-implementation: median 54 vs 53, Tampa 16.6 vs 16.9%) | Two agents ship different numbers for the same case | Golden files from two implementations; ADRs pin every choice (§7.6a) |
| K2 | **Model mis-specification: mixed pool** (I-220A, visa, derivatives share completions with parolees; doc 08 §5.6) | Bias of unknown sign for CHNV/CBP One cases | Show as a stated limitation; v2 channel share from crowd data |
| K3 | **Scenario weights are judgments** (doc 08 §8.2) | Estimates encode the author's priors | Weight ledger, editable weights (Could), score the completions forecast monthly |
| K4 | **No R4 validation until ≈ Jan 2027** (FY26 Q4) (doc 08 §10.3) | Over-confidence | `not_validated` chip; LOW confidence |
| K5 | September 2026 CSV not published as of today [S; F today mirror 404] | Data through Aug 2026 only; k₀ = 2 | `NEW_MONTH` probe each run; T20 banners |
| K6 | egov processing times unreachable from CI; jzebedee mirror unlicensed and not reachable from this session | Office inquiry dates could go stale or be unusable | Ask the maintainer for permission; carry dates with original retrieval date; inquiry-date ETA extrapolations (doc 15 §2.2) labelled "crude"; the "Feb 2026 methodology change" remains unverified (search today found none) |
| K7 | Monthly vs workbook pending gap (3–4%) | Users see two numbers in press | Q6 note; source labels (doc 04 §1.1) |
| K8 | Office codes / ZIP→office mapping are [T] (doc 12 §3; KEN vs KND, Hollywood vs Oakland Park) | Wrong office multiplier | Read codes from processing-times offices list; user override from notices; state-mix fallback |
| K9 | CBP One R1 exemption is low confidence (doc 16 §3.3) | Adjudicable days off by 86 for CBP One users | Dashed bar + both values shown |
| K10 | Crowd data self-selection (doc 08 §9.1) | Misleading aggregates | Delayed entry, post-stratification, benchmark gate, n thresholds |
| K11 | Artifact CSP blocks all outside hosts | "Live" in the artifact = last publish | Republish after each `NEW_MONTH`; badge shows publish date; optional MCP refresh |
| K12 | Expo web "single" export with workspaces/Metro; inline bundle size | Build friction | Keep deps lean (no gifted-charts/Skia/vector-icons); size budget check in script; smoke in CI |
| K13 | GitHub cron disabled after 60 days / late runs (doc 09 R1–R2) | Stale data | Bot commits, staleness workflow, banners |
| K14 | Approval prior 70–90% unconfirmed post-PA-2026-05 (doc 14 §8.1) | Over-reassurance | Packet-conditioned; incomplete → population share only; refit on FY26 Q4 |
| Q1 | Should the default branch be the data branch for raw URLs, or a dedicated `data` branch to keep history small (doc 09 §5.2 #9)? | — | Owner decision in W0 |
| Q2 | Is Torch verification of crowd submissions ever compatible with "no full receipt server-side"? | Better evidence weights | Default No; revisit only with an on-device-only design |
| Q3 | Does the *Acosta Reynoso* 08-13 adjudication report exist publicly (best mandamus datapoint)? [S-absent today] | Mandamus multiplier | CourtListener/PACER read when a token exists |
| Q4 | Will USCIS add a CAA subtype to the processing-times tool? | Replace the 131A-FAM proxy | Q10 detector |
