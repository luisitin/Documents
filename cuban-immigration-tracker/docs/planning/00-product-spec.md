# 00 — Product specification (final)

**Project:** Cuban Immigration Tracker ("CAA Tracker") · **Written:** 2026-10-20 · **Status:** final plan, Phase 2.
**Inputs:** the owner's ask, the owner's added requirements (language button; web build as a Claude artifact; GitHub Actions note), the research corpus (`docs/research/*`, cited as "doc NN §x"), the three proposals in `docs/planning/proposals/`, and the judges' verdicts. This file **starts from `proposal-ship-fast.md`** (the winner in two of three verdicts), adds the listed grafts, and fixes every must-fix item. Where a proposal disagrees with the research, the research wins.

**Evidence tags.**
- **[F]** read from a USCIS data file (research corpus).
- **[S]** stated in a search result, with URL (research corpus, or one of this plan's 3 searches, listed in `01-architecture.md` §11).
- **[S-sec]** news/blog only.
- **[V]** verified by running a command in this environment on 2026-10-20. Examples: the web-export spike, the headless-Chromium run, `curl` against raw.githubusercontent.com.
- **[T]** training knowledge, not confirmed.
- **[I]** inference or design decision.
- **[U]** unresolved conflict carried from the research.

Companion files:
- `01-architecture.md`
- `02-data-model.md`
- `03-data-pipeline.md`
- `04-estimation-model.md`
- `05-privacy-security-legal.md`
- `06-roadmap.md`
- `07-implementation-plan.md`

---

## 1. Vision

**ES:** *"Su caso, explicado con datos oficiales, en su idioma y sin promesas falsas."*
**EN:** *"Your case, explained with official data, in your language, without false promises."*

The app answers four questions for a Cuban who filed (or will file) a Cuban Adjustment Act (CAA) I-485. Every number carries its source, its period and the kind of statistic it is.

1. **What is USCIS doing right now?** Monthly Cuban I-485 received, approved, denied and pending, from the only official product with an `I-485 (Cuban)` row at monthly resolution (doc 04 §1.1 [F]). Quarterly medians and approval shares are shown with their baselines (doc 14 §8.1).
2. **Where does my case stand, and why?** The "what happened to your case" strip shows calendar days against adjudicable days, with holds R1 and R3 by entry channel (key facts §3; doc 16 §8.2). The peer-difference explainer answers "¿Por qué a otros sí y a mí no?".
3. **What is likely?** The probability of an I-485 decision by horizon and by calendar date, with a policy band and a structural band. It is never a single date (doc 08 §11.7; `04-estimation-model.md`).
4. **What can I do, and what changed?** An honest remedy ladder (doc 15 §9.1) and curated bilingual alerts (key facts §9).

The app does **not** give legal advice, promise dates, scrape case status, or collect identity data.

### 1.1 What "live" means (stated in the UI)

USCIS publishes the monthly CSV 4–8 weeks after month end and the quarterly workbooks about 10 weeks after quarter end (doc 04 §0). There is no real-time official feed of aggregate CAA data. "Live" therefore means:

- **Native app:** the newest snapshot that the data pipeline committed, fetched this session from GitHub. The badge always shows two dates: "datos de USCIS hasta agosto 2026" and "revisado hace 3 h".
- **Web artifact:** the snapshot that was shipped when the page was last published. The badge reads **"Publicado 20 oct 2026 · datos de USCIS hasta ago 2026"** and never a bare "En vivo" (must-fix "artifact 'live' undefined").

---

## 2. Users

| Persona | Situation (research) | First need | Design consequence |
|---|---|---|---|
| **P1 Reference case** (the owner's relative): Spanish-first CHNV Cuban in Miami-Dade | I-485 filed 2025-03-15 (peak receipt month, 26,187 [F]); (c)(9) EAD Sep 2025; pending 19 months, 306 adjudicable days (doc 08 T11) | Why no decision, realistic odds, what he can do | Clock strip, estimate, peer explainer, remedy ladder: the I-485 e-Request is not available until ≈2027–28; the (c)(9) e-Request is moot because he already has the EAD (doc 15 §2.2) |
| **P2 Peer without EAD** | Same filing month; (c)(9) still pending, probably swept into R3 on 2025-12-02 (doc 07 §5.1) | "Why did others get it and not me?" | Peer explainer. The (c)(9) panel shows that an e-Request is **available now**, because the NBC `147-C9` inquiry date is 2025-06-13 and his receipt is earlier (doc 15 §2.2 [F/I]) |
| **P3 CBP One Cuban** (≈100k, Low confidence, doc 16 §2.3) | Paroled at a land port (I-94 "DT"); not covered by R1 on paper (doc 16 §3) | "Does terminated parole still count?" | Green eligibility note (doc 16 §5). Amber enforcement note since 2026-08-11 (doc 16 §6). Clock of 392 adjudicable days with a low-confidence flag |
| **P4 I-220A Cuban** | Not paroled; not CAA-eligible under *Matter of Cabrera-Fernández*, 28 I&N Dec. 747 (key facts §1) | A respectful "why we cannot estimate" | No numbers. Litigation watch (*Bello-Rubio*, BIA remand). Anti-scam warning |
| **P5 Relative / helper** (the owner, English-first) | Helps 1–3 family members; shares links | English UI, several cases, shareable page | Up to 3 local cases with nicknames; the web artifact link; a privacy-safe share text (Should) |

**Non-users (MVP):** attorneys managing caseloads; non-Cuban CHNV parolees. The data series is Cuban-only. Those users see a polite "built for CAA cases" note.

---

## 3. Product principles (enforced by tests or review gates)

1. **Spanish first, both languages complete.**
   - Every user-facing string lives in `es.json`/`en.json`, including data-file `Localized` fields, notification templates, chart labels and disclaimers.
   - CI checks key parity and empty strings, and a lint rule forbids JSX literals.
   - A native Cuban-Spanish reviewer signs off on `es.json` before each release (gate).
   - Register: **usted** (ADR-I18N-1, `07-implementation-plan.md` §8). Seed copy in docs 08/15 is already in usted. Doc 16 §8.4's tú copy is converted.
2. **Never a single promised date.** The UI shows probabilities by horizon and calendar date. It shows the median only when it falls inside 72 months; otherwise it says "más de 6 años". A unit test fails if a headline contains a calendar date (doc 08 §11.7).
3. **No bare numbers.** Every number carries a `StatisticKind`, a period/cut date and a source chip. The kinds are: count flow, count stock, mean months of completions, median months of completions, 80 % processing time, inquiry date ≈93rd percentile, and share (graft from data-rigor). This resolves the "11.8 vs 12.3 vs 16.3 vs 20.6" confusion (README §2.8 #2).
4. **Headline pending comes from the monthly CSV only.** Workbook pending is labelled "informe trimestral" (doc 04 §1.1).
5. **The pool is one national mixed group.** The UI never says "casos como el suyo" / "cases like yours". It says **"el promedio del grupo nacional de I-485 cubanos" / "the national average for Cuban I-485s"** (must-fix, doc 08 §5.6). A test asserts that the I-485 probabilities are identical for CHNV, CBP One, and with or without an EAD. The explanation is shown.
6. **Approval is never in a headline or share text.** The approval card sits apart from the timing card. It gives the Jul 2026 49 % (308/626) and Aug 2026 47 % (386/820) population shares, and the Q1 91.7 % / Q2 52.6 % / Q3 23.7 % / FYTD 83 % baselines, all with equal prominence (doc 14 §8.1). The 70–90 % range is shown **only** when the "documentos básicos" checklist is complete, with the list of factors the model does not see (must-fix).
7. **No legal conclusions, no directives.** Copy is informational: "según la definición publicada por el tribunal (N.D. Cal. 3:26-cv-04850), su caso parece estar dentro de la clase". Remedy text says "puede…", never "presente ahora". Every expedite or mandamus rung ends with "consulte a un abogado o representante acreditado" (must-fix).
8. **Calm design.** Red is used only for true deadlines (RFE/NOID response window, EAD expiry ≤ 30 days). Routine waiting is never red.
9. **The phone is the vault.** Nothing personal leaves the device in the MVP (`05-privacy-security-legal.md`).
10. **Works offline and in the artifact.** A bundled sample snapshot is always present. Every screen shows its data status.

---

## 4. Features (MoSCoW)

Rule (from ship-fast): **Must** = needed to answer the four questions honestly, in both languages, on phone and web, with zero backend. Anything that needs a server, an account or a paid token is not a Must. Anything that needs a dev build is not a Must unless it degrades gracefully.

| # | Feature | Priority | Basis |
|---|---|---|---|
| F1 | National dashboard: monthly received/approved/denied/pending/pending>6 mo/mean months of completions, Sep 2024 → latest, with an R0–R4 band behind the chart and a "ver como tabla" table twin | **Must** | doc 04 §1.1 [F] |
| F2 | Quarterly context card: CAA median months; approval share with numerator/denominator and the Q1/Q2/FYTD baselines; workbook pending labelled | **Must** | doc 04 §1.2; doc 14 §8.1 |
| F3 | My case (local): entry channel incl. UNKNOWN; parole date; original I-94 end date; I-485 receipt date (day or month granularity); state and office (office optional); milestones with dates; "documentos básicos" checklist; up to 3 cases with nicknames | **Must** | docs 06 §8.1, 15 §9.2, 16 §8.1 |
| F4 | Eligibility gate and channel cards: I-220A / EWI / INA 236 conditional parole → no estimate; was-paroled green note; amber enforcement note; FRP carve-out; *Red Eagle* and *Doe v. DHS* "appears to be in the class" notes | **Must** | key facts §1 |
| F5 | Clock strip: calendar vs adjudicable days by channel, with legal/operational end toggle. UNKNOWN channel shows **both** clocks (CHNV 306 / CBP One 392) | **Must** | key facts §3; doc 16 §8.2; user-first graft |
| F6 | Estimate (VPH-1.1): P(decision) at 3/6/12/24/36 months and by 31 Dec 2026/2027/2028, with word labels, quantiles or "más de 6 años", policy band, structural band, driver bar, fan chart plus table, per-scenario cards with weights, queue facts, office line with N, official yardstick (131A-FAM proxy 80 % time and inquiry date), "no validado" chip, confidence label | **Must** | doc 08 §11; `04-estimation-model.md` |
| F7 | "¿Por qué a otros sí y a mí no?" peer explainer (rule table with confidence chips) | **Must** | user-first §3.3 graft; docs 03, 07 §5.1, 16 §8.3 |
| F8 | "¿Qué puedo hacer?" remedy ladder, separately for the I-485 and the (c)(9) | **Must** | doc 15 §9.1 |
| F9 | (c)(9) EAD panel: validity by issue date; no auto-extension for renewals filed on or after 2025-10-30; national I-765 AOS quarterly series; 147-C9 inquiry date; renewal planner. **No EAD hazard model** | **Must** (panel) | user-first graft; must-fix "peers without EAD" |
| F10 | Offices screen: per-office 131A-FAM 80 % time and inquiry date (proxy label), humanitarian pending/approved by quarter, shrunk multiplier with N, crude "e-Request posible hacia ≈ mes" | **Must** | doc 04 §1.3, §2.4; doc 15 §2.2 |
| F11 | Alerts: curated bilingual alerts plus a litigation watch table, each with "a quién afecta / qué cambió en el estimado" | **Must** | key facts §9 |
| F12 | Language button: in the header of every screen, in Settings and on first launch. Switches the whole UI at runtime, persists, defaults to device locale, and covers every string, date, number, chart label, notification and disclaimer | **Must** | owner requirement 1 |
| F13 | Data status everywhere: official period, check time, status chip (Live / Cached / Sample / Published), stale banners (T20), "Actualice la app" on schema mismatch | **Must** | owner requirement 2; doc 08 T20 |
| F14 | Web build packaged as one Claude-artifact HTML fragment with `./data/` supporting files; boots from any path; theme contract; 390 px and desktop | **Must** | owner requirement 2 |
| F15 | GitHub Actions data refresh (schedule + dispatch + push fallback, least privilege, data under `cuban-immigration-tracker/data/`) | **Must** | owner requirement 3 |
| F16 | Disclaimers, privacy page, "Borrar mis datos" (two-step in-app sheet, never `confirm()`) | **Must** | doc 09 §7 |
| F17 | Local notifications (native only): EAD expiry −180/−90/−30 days; RFE/NOID due −21/−7 days; new official month; high-severity alert. All rescheduled on language change | **Should** (MVP if time; works in Expo Go) | SDK notes §6 |
| F18 | "¿Es verdad?" myth cards and a permanent anti-scam card | **Should** | doc 14 §8.7; user-first search #2 |
| F19 | Glossary EN/ES | **Should** | key facts §10 |
| F20 | Discreet mode (hide case details behind a tap) | **Should** | user-first; doc 16 §6 |
| F21 | Privacy-safe "código de caso" share text at month level. Native uses the share sheet; web uses selectable text plus a guarded clipboard. Paste-to-compare happens locally only | **Should** | user-first §8.6 |
| F22 | Methodology and data screen: Little's-law line at last-month pace **and** FY2025 pace, labelled "ritmo de un solo mes, no un pronóstico"; provenance sheet; scorecard (v1.1) | **Must** (screen) / v1.1 (scorecard) | doc 08 §5.1; must-fix |
| F23 | Alert candidates (Federal Register API, USCIS RSS, CourtListener with token) written for human review | **Should** | doc 13 §6, §7, §9 |
| F24 | Forecast ledger and scorecard on observable targets | **v1.1** | data-rigor §7.6 graft |
| F25 | Optional host MCP refresh inside claude.ai | **Could (lowest)** | owner requirement 2 |
| F26 | ZIP → county → office lookup (ZIP used locally, never stored) | **v1.1** | doc 12 §3 |
| F27 | Crowdsourced timelines (Supabase, opt-in, native only) | **v1.1** | doc 09 §6 |
| F28 | Remote push | **v2** (dev build) | SDK notes §6 |
| F29 | Torch Case Status API opt-in | **v2 / Won't for MVP** | doc 13 §11 |
| F30 | Direct egov.uscis.gov scraping, CSOL, myUSCIS credentials | **Won't** | doc 13 §1.2, §2.1 |
| F31 | Ads, analytics SDKs, free-text UGC, "Modo ayudante", Telegram channel | **Won't (MVP)** | doc 09 §7.1; judges |

---

## 5. Navigation and global chrome

- **Tabs:** Expo Router JavaScript tabs (`src/app/(tabs)`), five of them. Route names are in English, because the URL is never visible in the artifact; labels are translated.

| Route | Tab label ES / EN | Default content |
|---|---|---|
| `/` (`index`) | Inicio / Home | National picture (S1) |
| `/case` | Mi caso / My case | Case form, or estimate if a case exists (S2/S3) |
| `/offices` | Oficinas / Offices | S6 |
| `/alerts` | Alertas / Alerts | S8 (dot when unread) |
| `/more` | Más / More | S10 |

- **Header on every screen:**
  - Title.
  - **LangToggle**, a pill "ES | EN". The active language is bold. One tap switches immediately. The hit area is at least 48×48. Accessibility labels: "Cambiar el idioma a inglés" / "Switch language to Spanish".
  - **DataStatusChip**; tapping it opens the provenance sheet.
- **Icons:** in-repo SVG components (`react-native-svg`). No icon fonts, no `expo-symbols`, no `@expo/vector-icons`. Fonts are the system stack.
- **Layout:** content column `maxWidth: 560`, centered, 16 px gutters. Tables become stacked cards under 480 px. There is no horizontal scroll at 390 px (Prove asserts `scrollWidth ≤ 390`).

### 5.1 Data status chip and banners

| State | ES | EN | Rule |
|---|---|---|---|
| live (native) | ● **En vivo** · USCIS hasta {mes} · revisado {hace X} | ● **Live** · USCIS through {month} · checked {X ago} | Manifest fetched and validated this session |
| cached (native) | ◐ **Guardado** · USCIS hasta {mes} · última conexión {fecha} | ◐ **Saved** · USCIS through {month} · last online {date} | Offline or fetch failed; KV copy present |
| published (web) | ◆ **Publicado {fecha}** · USCIS hasta {mes} | ◆ **Published {date}** · USCIS through {month} | Manifest from `./data/` (or MCP) |
| sample (any) | ○ **Muestra** · datos de ejemplo incluidos ({fecha}) | ○ **Sample** · example data bundled ({date}) | Nothing fetched or cached |

| Banner | ES | EN | Rule |
|---|---|---|---|
| Official data old (T20a) | ▲ "USCIS no ha publicado datos mensuales nuevos desde {mes}." | ▲ "USCIS has not published new monthly data since {month}." | today − end of latest official month > 75 days; confidence → LOW |
| Un-cross-checked months (T20b) | "Datos mensuales de {meses} aún sin contraste trimestral." | "Monthly data for {months} not yet cross-checked against the quarterly report." | latest monthly row more than one quarter past the latest quarterly file |
| Pipeline late | "La revisión automática de datos está atrasada ({n} días)." | "Automatic data checks are behind ({n} days)." | now − `manifest.lastCheckedAt` > 10 days (heartbeat is weekly, `03-data-pipeline.md` §6) |
| Artifact old (web only) | "Esta página se publicó hace {n} días; la app móvil puede tener datos más nuevos." | "This page was published {n} days ago; the mobile app may have newer data." | now − `artifactBuiltAt` > 35 days |
| Data review in progress | "Datos oficiales en revisión; mostramos la última versión verificada." | "Official data under review; showing the last verified version." | `manifest.qa.status != "ok"` |
| App too old | "Actualice la app para ver los datos nuevos." | "Update the app to see the new data." | `manifest.minAppVersion` > app version or unknown `schemaVersion`; old data kept |

Common states on every data screen:
- **Loading:** skeleton blocks on first launch only. After that, cached data renders instantly.
- **Error:** never blank. The screen falls back to cached, then sample data, and says so in a dismissible note: "No pudimos actualizar; mostramos los datos guardados del {fecha}".
- **Error boundary:** one per tab.

---

## 6. Screens

The copy below is the seed for `es.json` / `en.json` and is reviewed in WP-I18N (`07` §6). `{x}` marks an interpolation; every number goes through `fmt.*` (deterministic formatters, `02-data-model.md` §9).

### S0 — Bienvenida / Welcome (`/welcome`, modal, first launch only)

- **Step 1, language before anything else.** Two large buttons, "Español" / "English"; the device locale is preselected (es* → es, else en). The choice applies instantly and is persisted.
- **Step 2, three cards.** ES / EN:
  1. "Herramienta independiente y no oficial. No somos USCIS." / "An independent, unofficial tool. We are not USCIS."
  2. "Sus datos se quedan en su teléfono." / "Your data stays on your phone."
  3. "Estimados estadísticos con datos públicos; no es asesoría legal." / "Statistical estimates from public data; not legal advice."
- **Actions:** "Entendido" → Home. A second button, "Configurar mi caso / Set up my case", goes to S2.
- If storage is unavailable (web private mode), onboarding still works; it simply appears again on the next visit.

### S1 — Inicio / Home (`/`)

- **Title:** "Ajuste cubano: lo que USCIS está haciendo" / "Cuban Adjustment: what USCIS is doing".
- **Pulse tiles** (latest monthly row, Aug 2026 today [F]), each tile with its kind chip:

| Tile | Value (Aug 2026) | Note |
|---|---|---|
| Pendientes / Pending | 355,520 | — |
| Recibidas / Received | 1,213 | — |
| Aprobadas / Approved | 386 | — |
| Negadas / Denied | 434 | — |
| Decisiones del mes / Decisions this month | 820 | — |
| Pendientes > 6 meses / Pending > 6 months | 345,741 | — |
| Promedio de meses de los casos terminados / Mean months of completed cases | 20.6 | Kind `mean_months_completed`. Tapping it explains why this is not a forecast (doc 08 §2.3) |

- **MonthlyChart:** approved and denied bars, a pending line, and an R0–R4 band, with a "ver como tabla" twin. Axis labels are i18n.
- **Quarterly card:**
  - "Abr–jun 2026: 139 aprobadas y 447 negadas de 586 decisiones (23.7 %)".
  - Next to it, the baselines: oct–dic 2025 91.7 % (4,098/4,471); ene–mar 2026 52.6 % (50/95); año fiscal hasta jun 83 %.
  - Caveat: "La tasa bajó porque durante la pausa se decidieron pocos casos y muchos eran negaciones claras; no significa que tres de cada cuatro cubanos sean rechazados" (doc 14 §8.1).
- **(c)(9) card:** "Permisos de trabajo por ajuste pendiente (todas las nacionalidades): 671,362 pendientes; mediana 6.4 meses (abr–jun 2026)" [F doc 04 §1.2], with a link to S5.
- **Next files line:** "Próximos datos oficiales: CSV de septiembre 2026 (aún no publicado); informe trimestral jul–sep ≈ principios de dic 2026".
- **CTA:** "Ver mi estimado / See my estimate". The latest high-severity alert appears as a banner.
- The empty state cannot occur, because a sample is bundled.
- **Deliberately absent:** the 434-month Little's-law line. It lives only on S11 (must-fix).

### S2 — Mi caso: formulario / My case: form (`/case/edit`)

Five steps, each with "No sé / I don't know" and Back/Next:

1. **Entrada / Entry:** CHNV (avión, I-134A) · CBP One (cita en frontera, I-94 "DT") · Reunificación familiar (FRP/CFRP) · U4U · Otro parole · Visa · I-220A · Entrada sin inspección · Parole condicional (INA 236) · No sé. Hint: "Su I-94 dice 'DT' → CBP One."
2. **Fechas / Dates:**
   - I-94 parole date (optional).
   - **Original** I-94 end date (optional). If the user enters 2026-04-24, copy explains that this is the April 2026 re-termination date, not the original end date (doc 16 §8.1).
   - I-485 receipt date (required), with "Solo sé el mes" allowed, which records day = 15 and `granularity: 'month'`.
   - Validation: no future dates. A receipt earlier than parole + 366 days gives a warning, not a block: "un año y un día".
3. **Dónde / Where:**
   - State list.
   - Office list filtered by state (from `offices.json`). Miami-Dade users get a sub-question: Hialeah / Kendall / Miami / "No sé".
   - "No sé la oficina" keeps the state and uses the **state mixture** (`04` §5.3).
   - ZIP lookup is v1.1 and local only.
4. **Lo que ya recibió / What you already received** (each with a date and a source of notice / estado en línea / memoria):
   - receipt notice; biometrics; EAD (c)(9) approved, with card expiry;
   - interview notice, with the scheduled date; interview done;
   - RFE/NOID received (due date optional), response sent;
   - expedite requested/granted/denied; e-Request; congressional inquiry; Ombudsman; mandamus filed;
   - decision (approved / denied / withdrawn).
5. **Documentos básicos (opcional) / Basic documents (optional):** I-94 or parole record · Cuban passport or birth certificate · I-693 · photos · fee or I-912. Copy: "Esta lista no cubre todo lo que USCIS revisa (antecedentes, órdenes previas, discreción)."

Also on this screen:
- Optional nickname (device only).
- Optional receipt number, device only and displayed masked. The UI recommends entering only the 3-letter prefix.
- "Ver un ejemplo" loads the reference case read-only and never saves it.

### S3 — Su estimado / Your estimate (`/case`)

Top to bottom, reference case (CHNV, receipt 2025-03-15, EAD Sep 2025, office unknown, state FL unknown, today 2026-10-20). Golden values come from `04` §9. Numbers in copy are illustrations; the app renders them from the estimator.

1. **Clock card.** "Su caso lleva 19 meses presentado; ≈10 de ellos estuvo bajo pausas (14 feb–9 jun 2025 y 2 dic 2025–12 jun 2026). Tiempo adjudicable: 306 días (256 con las fechas operativas más tardías)." EN equivalent.
2. **Headline.**
   - ES: "**Probabilidad de que USCIS decida su I-485 en los próximos 12 meses: 9 %** — poco probable." EN: "**Chance USCIS decides your I-485 in the next 12 months: 9%** — unlikely."
   - Bands below it, never in a footnote:
     - "Según el escenario de política: entre 2 % y 26 %."
     - "Según qué casos decida USCIS (estructura del grupo y efecto incierto del permiso): entre 4 % y 20 %." (structural band, `04` §7; it is 5–17 % for a peer without an EAD.)
3. **Ladder** with word labels (fixed thresholds: < 5 % muy poco probable · 5–20 % poco probable · 20–50 % posible · 50–80 % probable · > 80 % muy probable):

| Horizon | P | Label |
|---|---|---|
| 3 meses | 1 % | muy poco probable |
| 6 meses | 4 % | muy poco probable |
| 12 meses | 9 % | poco probable |
| 24 meses | 22 % | posible |
| 36 meses | 35 % | posible |

4. **Calendar row.** "Antes del 31 dic 2026: ~1 % · antes del 31 dic 2027: ~11 % · antes del 31 dic 2028: ~24 %."
5. **Median line.** "Para el promedio del grupo nacional de I-485 cubanos, la mitad de las decisiones tardaría **más de 4 años** con la mezcla de escenarios; con el ritmo de 2025 serían unos 22 meses." The phrase "casos como el suyo" is never used.
6. **Fan chart** (survival from today, 72 months) with a "ver como tabla" twin.
7. **Scenario cards:**
   - Estancamiento 30 % (P12 2 %)
   - Recuperación parcial 40 % (10 %)
   - Ritmo de 2025 15 % (26 %)
   - Nueva pausa 15 % (4 %)
   - The weights show "pesos actualizados por datos y alertas: ver historial" (weight ledger).
8. **Driver bar.** "Política 94 % · Oficina 3 % · Orden de la cola 1 %" (computed, `04` §8).
9. **Queue facts.** "Pendientes a nivel nacional: 355,520 (ago 2026). Más antiguos que el suyo: ≈175,200. Presentados el mismo mes: ≈23,100. Decisiones el mes pasado: 820."
10. **Office line.**
    - If the office is known: "Oficina: Hialeah. Multiplicador 0.95 (3 aprobaciones en 2 trimestres; dato débil)".
    - If only the state is known: "Aproximado: no sabemos su oficina; usamos la mezcla de oficinas de Florida".
    - The official yardstick follows: "USCIS, I-485 familiar (lo más cercano a la Ley de Ajuste): 80 % de los casos en {x} meses; fecha de consulta {fecha}".
11. **Peer explainer card** → S4.
12. **Approval card** (separate, grey):
    - "**Si se decide, ¿se aprueba?** Datos recientes: jul 2026 49 % (308 de 626), ago 2026 47 % (386 de 820). Trimestres: 91.7 % → 52.6 % → 23.7 %."
    - Only if the checklist is complete, add: "Con documentos básicos completos, el rango estimado para un caso de parole sin otros problemas es 70–90 % (estimación, no validada; puede ser menor si hay antecedentes, órdenes previas o problemas de discreción que este modelo no ve)."
    - The card never says "lo más probable".
13. **Footer.** Chips "No validado — 3 meses de datos del régimen actual" and "Confianza: BAJA", plus the disclaimer. Link "¿Cómo se calcula?" → S11.

**Special states:**
- I-220A / EWI / INA 236 → S9 (no numbers).
- Interview done → post-interview mode: "Después de la entrevista, la mitad de los casos se decide en ~3 meses (informes de abogados; confianza baja)".
- Interview scheduled → shows the rule in `04` §4.4.
- RFE/NOID pending → a red deadline card: "Su respuesta vence el {fecha} (máx. 12 semanas para RFE, 30 días para NOID desde el 5 ago 2026)". The estimate is shown with the delay applied, never 0 % forever.
- Decided → shows the decision and links to the denial branch (I-290B / lawyer) where relevant.
- The estimator throws → "No pudimos calcular" with the inputs echoed.

### S4 — ¿Por qué a otros sí y a mí no? / Why did others get it and not me? (`/case/peers`)

Shown as "Posibles razones / Possible reasons", each with a confidence chip. It **never says which one applies**. Rules (exact set tested by U2, `04` §9):

| id | Condition on the user's case | ES | Confidence | Source |
|---|---|---|---|---|
| `chnv_r1` | channel ∈ {CHNV, FRP_CFRP, U4U} and receipt overlaps 2025-02-14→2025-06-09 | "Su caso entró en la pausa de parolees (14 feb–9 jun 2025). Alguien que entró por CBP One no estaba en esa pausa según el memo." | media | doc 16 §3 |
| `cbp_one_no_r1` | channel = CBP_ONE and the receipt overlaps R1 | "La pausa de 2025 nombró CHNV, U4U y FRP, no CBP One; su caso pudo avanzar antes (confianza baja)." | baja | doc 16 §3.3 |
| `ead_before_r3` | EAD received before 2025-12-02 | "Su verificación terminó antes del 2 dic 2025. Quien seguía pendiente ese día cayó en la pausa por país y recibió su permiso solo después de jun 2026." | media-alta | doc 07 §5.1 |
| `ead_swept_r3` | no EAD, I-765 filed with the I-485 before 2025-12-02 | "Probablemente su I-765 seguía pendiente el 2 dic 2025 y quedó congelado hasta jun 2026; hoy se reportan esperas de 12–12.5 meses." | media | doc 07 §5.1; master timeline 2026-10-17 [S-sec] |
| `c9_erequest_available` | no EAD and receipt < 147-C9 NBC inquiry date | "Ya puede presentar una consulta por demora de su permiso (c)(9)." | alta | doc 15 §2.2 |
| `renewal_no_autoext` | an EAD renewal was filed on or after 2025-10-30 | "Las renovaciones presentadas desde el 30 oct 2025 no se extienden automáticamente." | alta | key facts §2 |
| `non_fifo` | always (when an estimate exists) | "USCIS decidió 820 casos en agosto entre 355,520 pendientes y no sigue un orden estricto de llegada." | media | doc 08 §5.4–5.5 |
| `office_diff` | office known | "Las oficinas avanzan a ritmos distintos (pocos datos)." | baja | doc 08 §7.3 |

The copy ends with: "Una aprobación de un vecino o una captura de pantalla no prueba nada sobre su caso; verifique siempre en el sitio oficial de USCIS."

### S5 — Permiso de trabajo (c)(9) / Work permit (c)(9) (`/case/ead`)

- **Validity:**
  - Cards issued before 2025-12-05: up to 5 years.
  - Cards issued from 2025-12-05: up to 18 months.
  - Copy: "lea la fecha en su tarjeta". The expiry the user enters wins.
- **Renewal:** "Las renovaciones presentadas desde el 30 oct 2025 no reciben extensión automática (regla final del 14 oct 2026); el empleador no puede basarse solo en el recibo." The renewal planner suggests filing at least 180 days before expiry and shows the computed date.
- **If the EAD is pending:**
  - The 147-C9 NBC inquiry date (2025-06-13 as of 2026-10-15 [F]) and the 80 % time, with "e-Request: disponible / aún no".
  - The national I-765 "Adjustment Of Status" row: pending 671,362, median 6.4 months, FY26 Q3, labelled **"todas las nacionalidades"**.
  - The reported conflict "373,007 vs 461,884 pendientes (dos informes de prensa)" [S-sec, doc 07 §5.2].
  - Reported waits "12–12.5 meses (prensa, oct 2026)" [S-sec].
  - Each figure carries its kind chip. **No EAD estimate model** (must-fix).
- **(c)(11) note:** parole EADs were revoked in Jun 2025 (CHNV) and Apr 2026 (CBP One).
- **Actions:** set reminders (native only); mark "renovación presentada".

### S6 — Oficinas / Offices (`/offices`, `/offices/[code]`)

- **List:** Cuban-focus offices first (MIA, HIA, KND, OKL, WPB, OFM, TAM, ORL, JAC, HOU, DAL, SNA, LOU, LVG, NEW, NYC, CLT, ATL, CHI — key facts §6), then "Ver todas". State filter chips.
- **Per office:**
  - 131A-FAM 80 % months and publication date, labelled "familiar — la referencia más cercana; no existe categoría de Ajuste Cubano".
  - Inquiry date.
  - Humanitarian pending/approved by quarter, labelled "incluye refugiados y asilados".
  - Shrunk multiplier with N and "dato débil" when N < 50.
- **Detail:** quarterly trend, plus "Si presentó el {fecha}, la fecha de consulta tendría que llegar a ella: ≈ {mes} (cálculo aproximado)" (doc 15 §2.2).
- If the inquiry date is missing: "fecha de consulta no disponible ({fuente}, {fecha})", with **no gate decision** (must-fix on the jzebedee dependency).
- Codes are read from the data, never hard-coded (KEN vs KND).

### S7 — ¿Qué puedo hacer? / What can I do? (`/case/remedies`)

Ladder from doc 15 §9.1, computed by `remedyLadder()`. Each rung has a state ✓ disponible / ✕ aún no (with ETA) / ⚠ depende / — no aplica, and expands into steps. Rungs in order:

- **a. e-Request, I-485.** Gate: 131A-FAM inquiry date at the office. Copy from doc 15 §9.4 (usted).
- **a. e-Request, (c)(9).** Gate: 147-C9 at NBC.
- **b. Expedite.** Five criteria. "Necesitar el permiso de trabajo por sí solo no es motivo de expedito."
- **d. Congressional office.** FL-26/27/28 when the state is FL. "Puede negarse si su caso está dentro del tiempo normal."
- **c. Ombudsman (DHS-7001).** "puede que nunca reciba una respuesta de fondo".
- **e. Mandamus.** ≥ 24 months soft, ≥ 36 strong. "La demanda de 143 cubanos en Tampa no logró que el tribunal ordenara acelerar casos (jul 2026). Costo: $405 de presentación más abogado." Ends with "consulte a un abogado o representante acreditado".
- **f. Appointments.** Only for concrete needs. Contact Center 1-800-375-5283 (español: oprima 2).

Also:
- ***Red Eagle* note:** "Según la definición publicada por el tribunal (N.D. Cal. 3:26-cv-04850, 24 ago 2026), su caso parece estar dentro de la clase. USCIS no ha publicado un canal para miembros de la clase."
- **Denied branch:** I-290B in 30 days (33 if mailed), and "consulte a un abogado".
- **Pinned disclaimer:** "Esto no es asesoría legal."
- On web, external links render as plain-text URLs (artifact contract e). On native they open the browser.

### S8 — Alertas / Alerts (`/alerts`, `/alerts/[id]`)

- **Title:** "Alertas: políticas, tribunales y datos" / "Alerts: policy, courts and data".
- **Card:** severity chip; kind (política · tribunal · datos · tarifas · cumplimiento · permiso · estafa); date; title; 2–3 sentences "qué significa para usted"; "a quién afecta" chips (CHNV / CBP One / todos / presentados después del 24 ago 2026); "qué cambió en su estimado" (for example "Nueva pausa: 15 % → 30 %"); source link and evidence tag.
- **Litigation watch table** (seeded from key facts §9):
  - *Dorcas* 1st Cir. 26-1703
  - *Red Eagle* 3:26-cv-04850
  - *AAUP v. Mullin* 1:26-cv-14527
  - *Acosta Reynoso* 8:26-cv-01314
  - *Doe v. DHS* 1:25-cv-12245
  - *CHIRLA* D.C. Cir. 25-5289
  - *Bello-Rubio* 1:25-cv-23665
  - *Labrada-Hechavarria* BIA remand
  - *Doe v. Mullin* 1:25-cv-10495
  - Each row has its status as of a date and "qué cambiaría".
- **Filters:** "mi caso / todas". "Marcar como leídas".
- **Empty:** "Sin alertas nuevas desde {fecha}."
- **Seed alerts at launch** (EN+ES written in WP-CONTENT; all dates from the master timeline):
  - 2026-05-22 PM-602-0199 ("no menciona la Ley de Ajuste; el gobierno dijo a un tribunal que no aplica a estos casos")
  - 2026-06-05/12 *Dorcas* vacatur and compliance
  - 2026-08-05 PA-2026-05
  - 2026-08-11 *CHIRLA* stay vacated
  - 2026-08-14 1st Cir. partial stay (re-review only)
  - 2026-08-24 *Red Eagle* PI
  - 2026-09-18 I-485 edition 09/18/26
  - 2026-10-05 *AAUP v. Mullin* filed
  - 2026-10-14 EAD auto-extension final rule
  - 2026-10-16 FY2027 fees (none on I-485/(c)(9))
  - 2026-10-20 FY26 Q3 data ("139 aprobadas, 447 negadas — qué significa")
  - 2026-10-20 anti-scam ("notarios que venden 'parole' falso a cubanos con I-220A") [S-sec, user-first search]

### S9 — Su entrada (I-220A u otra no elegible) / Your entry (`/case/ineligible`)

- **I-220A copy:** "Con la decisión de la Junta de Apelaciones (*Matter of Cabrera-Fernández*, 2023), una salida con I-220A no se considera parole, y por eso no podemos calcular un estimado de Ley de Ajuste. Esto podría cambiar: hay un caso pendiente en Miami (*Bello-Rubio*, demanda vigente desde el 10 sep 2026) y una decisión de la Junta tras el caso *Labrada-Hechavarria*. Ninguna corte ha dicho todavía que el I-220A sea parole."
- **Anti-scam card:** "Nadie puede 'convertir' un I-220A en parole ni garantizarle una aprobación. Desconfíe de quien le cobre por eso."
- **Action:** "Seguir alertas de I-220A."
- **EWI and INA 236:** equivalent copy, plus "consulte a un abogado o representante acreditado".

### S10 — Más / More (`/more`) → Ajustes, Glosario, ¿Es verdad?, Acerca de, Privacidad

- **Ajustes / Settings** (first row: language):
  - Theme: sistema / claro / oscuro. On web the host `data-theme` wins and the control is hidden.
  - Notifications (native only).
  - Discreet mode.
  - Cases (up to 3).
  - Data source panel: status, official period, `lastCheckedAt`, `dataChangedAt`, per-source status, app and schema versions.
  - "Borrar todos mis datos" (two-step sheet).
- **¿Es verdad? / Is it true?** Myth cards with verdict and source:
  1. "El memo de mayo eliminó la Ley de Ajuste" → Falso (doc 14 §8.7).
  2. "USCIS siempre manda un RFE antes de negar" → Falso desde el 5 ago 2026 (PA-2026-05).
  3. "Un notario puede convertir su I-220A en parole" → Falso y peligroso.
  4. "La corte dijo que la pausa era inconstitucional" → No; fue por la ley administrativa (APA) (doc 03 §12).
  5. "Si le cancelaron el parole ya no puede ajustarse" → Falso (doc 16 §5).
  6. "Tener permiso de trabajo acelera la residencia" → No hay evidencia (doc 08 §7.5).
  7. "Una captura de pantalla de 'aprobado' prueba que su caso avanza" → No.
- **Glosario:** key facts §10, searchable.
- **Acerca de:** "independiente, no oficial; no afiliado a USCIS/DHS"; evidence tags explained; repository link.

### S11 — Cómo calculamos y datos / Method and data (`/more/method`)

- Plain-language VPH-1.1 summary.
- Bias catalogue (doc 08 §2.2).
- Current parameters: β, scenario weights and **weight ledger**, k₀ = 50.
- Validation status, and the scorecard in v1.1.
- **Little's law**, shown only here and always as a pair: "Al ritmo de agosto 2026 (820 decisiones), vaciar la fila tomaría ~434 meses; al ritmo del año fiscal 2025 (~9,200/mes), ~39 meses. Es un promedio del grupo, no un pronóstico para su caso" (must-fix).
- Source list with URL pattern, period, retrieval date, sha256, mirror used, QA status.
- Historic medians with cut dates (11.8 at 2026-07-31; 12.3 at 2026-08-30 [S-sec]).

### S12 — Compartir / Share (`/case/share`, Should)

Month-level "código de caso", with the share language chosen independently of the UI language. **No receipt digits, no day dates, no office code unless the user opts in:**

```
#AjusteCubano · CHNV · FL
Presentado: 2025-03 · Huellas: 2025-07 · EAD: 2025-09 · Entrevista: — · Decisión: —
19 meses (≈10 adjudicables) · Prob. decisión 12 meses: 9 % · datos USCIS ago 2026
CAA Tracker (no oficial)
```

- Native: system share sheet. Web: a selectable text box plus a "Copiar" button (clipboard in try/catch; on failure, "Mantenga presionado para copiar").
- "Pegar un código para comparar" parses locally and runs the peer explainer on both cases. Nothing is uploaded.
- When discreet mode is on, the screen asks before revealing.

### S13 — +not-found

Renders `<Redirect href="/" />`. It is never visible for more than one frame.

---

## 7. Notifications (native only; local; Expo Go-compatible; web = in-app badges only)

| Trigger | ES | EN | When |
|---|---|---|---|
| EAD expiry −180, −90, −30 days | "Su permiso de trabajo vence el {fecha}. Las renovaciones ya no se extienden automáticamente; puede presentar la renovación desde ahora." | "Your work permit expires {date}. Renewals no longer auto-extend; you can file your renewal now." | DATE trigger 10:00 local |
| RFE/NOID due −21, −7 days | "Su respuesta a USCIS vence el {fecha}." | "Your response to USCIS is due {date}." | DATE trigger |
| (c)(9) pending and receipt now before the NBC inquiry date | "Ya puede presentar una consulta por demora de su permiso (c)(9)." | "You can now file a delay inquiry for your (c)(9) work permit." | on foreground after a refresh |
| New official month | "USCIS publicó datos de {mes}. Su estimado se actualizó." | "USCIS published {month} data. Your estimate was updated." | on foreground, only if opted in |
| High-severity alert affecting the case | `alert.title[lang]` | `alert.title[lang]` | on foreground |

Rules:
- Ask for permission only from Settings or after the first estimate, never at launch.
- Create the Android channel before the prompt (SDK notes §6).
- Use `setNotificationHandler` with `shouldShowBanner/shouldShowList`.
- Quiet hours 21:00–08:00; at most 2 per week except deadlines.
- **On any language change, cancel and reschedule every scheduled notification**, so the text switches (owner requirement 1).
- Deep link `data.url` → `router.push`.
- Copy is informational ("puede presentar…"), never a directive (must-fix).

---

## 8. Disclaimers (shown on S0, the S3 footer, S5, S7, Más → Acerca de)

- **ES:** "CAA Tracker es una herramienta independiente y no oficial. No está afiliada a USCIS, DHS ni a ninguna agencia del gobierno. Los estimados son proyecciones estadísticas con datos públicos, no están validados para el período de política actual y pueden equivocarse; cada caso es distinto. Esto no es asesoría legal: consulte a un abogado de inmigración o a un representante acreditado."
- **EN:** "CAA Tracker is an independent, unofficial tool. It is not affiliated with USCIS, DHS or any government agency. Estimates are statistical projections from public data, are not validated for the current policy period and can be wrong; every case is different. This is not legal advice: consult an immigration attorney or an accredited representative."
- **Anti-scam (S7, S9, ¿Es verdad?):** "Nadie puede garantizarle una aprobación ni 'convertir' un I-220A en parole. Desconfíe de quien le cobre por eso." / "No one can guarantee an approval or 'convert' an I-220A into parole. Be wary of anyone charging for that."
- **Enforcement (amber; terminated parole; doc 16 §8.4, converted to usted):** "Su parole ya no es válido y el permiso de trabajo basado en el parole (c11) se canceló con él. Solo sigue válido un permiso otorgado por su solicitud de residencia pendiente (c9). Desde el 11 de agosto de 2026 ya no está vigente la orden judicial que protegía a ex-beneficiarios de parole contra la deportación acelerada; tener el I-485 pendiente ayuda pero no es garantía. Lleve siempre su recibo del I-485 y consulte a un abogado antes de cualquier cita con ICE o USCIS."

---

## 9. Success criteria (MVP exit)

1. **The reference case reproduces the pinned golden file** (`04` §9). The values are P(≤12) = 0.0923 ± 0.0005, q50 = 54, adjudicable days = 306. They come from the reference implementation **and not from doc 08's prose (9.4 %, 53)**; ADRs EST-1…EST-13 in `04` §2 explain the difference.
2. **Every screen shows its data status**, including in the artifact, where the chip reads "Publicado" and never "En vivo".
3. **i18n is complete and enforced.**
   - 100 % of user-visible strings live in locale files, enforced by CI.
   - Switching language rewrites every string, date, number, chart label, notification and disclaimer without a restart. Prove asserts "20 oct 2026" ↔ "Oct 20, 2026" and "9 %" (es, NBSP) ↔ "9%" (en), produced by the deterministic `fmt` (ADR-I18N-2, `02` §9).
   - The Cuban-Spanish reviewer has signed off.
4. **The artifact passes Prove** (`07` §9). It boots from `/x/y/z/index.html` under a host-identical CSP, with `localStorage` throwing and with `history` throwing. It navigates all tabs, switches language and runs the estimator. Checks pass at 390 px and 1280 px, light and dark. There are zero console errors, and the only network requests are `./data/*`.
5. **The data job runs green on `main` for 14 consecutive days** after the workflow lands.
6. **The native app runs** in Expo Go (if SDK 58 Expo Go is available) or in an EAS development build on one iOS and one Android device (`01` §10 risk on Expo Go).
