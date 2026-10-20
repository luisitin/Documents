# Proposal — "Cuban-community user-first"

Architect angle: build the app Cuban CHNV and CBP One parolees will recommend to each other in their
WhatsApp, Telegram and Facebook groups. That means Spanish first, Android first, friendly to anxious
users, honest, shareable, and usable offline. It must also meet every fixed constraint of the
project: Expo SDK 58 + TypeScript, the EN/ES runtime toggle, the single-file web artifact, real data
sources only, privacy-first, and no legal advice.

Written 2026-10-20. **Sources and tags.** Every factual claim cites a research file
(`docs/research/NN-*.md`, written "doc NN §x") or one of today's searches. [S] means stated in a
search result I saw today (URL given). [T] means training knowledge. [I] means inferred. Where the
corpus tags something [T], [U] or low-confidence, this plan keeps that uncertainty and the app shows it.

**Today's four searches (my full allowance):**

1. **Data release.** No September 2026 Cuban I-485 figures have been published. The latest official
   numbers are still FY26 Q3: 139 approved, 447 denied, 23.7%. Pending is reported as both ~342k and
   ~355k [S — https://en.cibercuba.com/noticias/2026-10-20-u1-e135253-s27061-nid343309-solo-139-cubanos-obtuvieron-residencia-ley-ajuste ;
   https://www.inmigreat.com/en/analytics/i-485/ ;
   https://www.visaverge.com/greencard/cuban-green-card-approvals-drop-to-237-as-trump-administration-tightens-uscis-rules/].
   This matches doc 04 §1.1–1.2 and the research README §2.5.
2. **Scams aimed at Cubans in 2026.**
   - Notarios selling fake parole documents to I-220A Cubans, with warnings from Rep. Salazar
     [S — https://www.univision.com/local/miami-wltv/advertencia-cubanos-i-220a-usando-notarios-falsificar-parole ;
     https://www.cubaenmiami.com/maria-elvira-salazar-vuelve-a-advertir-sobre-los-falsos-documentos-de-parole-te-cerraste-las-puertas/ ;
     https://www.directoriocubano.info/acontecer/alerta-cubanos-i-220a-notarios-falsifican-parole/].
   - Fake lawyers who clone the social-media accounts of real attorneys (reported since January 2025)
     [S — same result set].
   - CiberCuba (2026-10-20) explains that the I-220A remand did **not** turn I-220A into parole
     [S — https://en.cibercuba.com/noticias/2026-10-20-u1-e129488-s27061-nid343316-220a-parole-deben-saber-cubanos-ley-ajuste].
   - No source tied these scams to WhatsApp or Telegram specifically.
3. **Expo web export.** The Expo docs say `+not-found` catches unmatched routes and is served with a
   404 status. A community thread reports SPA refresh/direct-path 404s after `expo export --platform web`
   [S — https://docs.expo.dev/router/reference/not-found/ ;
   https://community.vercel.com/t/expo-web-spa-on-vercel-404-error-when-refreshing-internal-routes/25874].
   I found nothing specific about `web.output: "single"`, so the boot-from-any-path guard below stays
   a must-have.
4. **Android vs iPhone among Hispanics.** No 2025 data surfaced. The newest figure is Nielsen's: in
   Q4 2014, Hispanic smartphone owners were 53.8% Android and 40.2% iOS
   [S — https://www.nielsen.com/insights/2015/smartphone-owners-are-as-diverse-as-their-devices/].
   The "Android-first" stance below is therefore [I] on decade-old data.

---

## 1) Product vision and target users

### 1.1 Vision (one sentence each language)

- **ES:** *"Tu caso, explicado con datos oficiales, en tu idioma, sin promesas falsas."*
- **EN:** *"Your case, explained with official data, in your language, without false promises."*

The app replaces three things people rely on today: rumor in group chats, a single headline number
from the press (such as "11.8 months" or "23.7%"), and paid trackers that are not CAA-aware (doc 10 §5–6).
In their place it gives four things:

- **(a) Where your case stands.** What happened to it, including the holds.
- **(b) What is likely.** The chance of a decision by date, with honest ranges.
- **(c) What you can actually do.** The remedy ladder, with its real gates.
- **(d) What changed.** Court and policy alerts in plain Spanish.

No competitor has a CAA-specific, Spanish-first, regime-aware estimator (doc 10 §4.13 and §6).

### 1.2 Target users and what they need

| Persona | Who | What they feel / need | Design consequence |
|---|---|---|---|
| **P1 "Yoandry", CHNV parolee (primary)** | Cuban, 25–45, entered by plane on CHNV parole 2023–24. Filed the CAA I-485 plus the (c)(9) I-765 in early 2025. Lives in Miami-Dade, Tampa or Houston. Spanish-first, prepaid Android phone [I]. | Anxious. Compares himself with peers ("a mi vecino le llegó el permiso y a mí no"). Distrusts official sites. Has been burned by rumors. | Spanish default for es-* devices. Plain-language "what this means for you" at the top of every screen. A peer-difference explainer. No single "date". Works offline. Light data use. |
| **P2 "Daylin", CBP One parolee** | Cuban who entered at a land port after a CBP One appointment (I-94 class "DT"). About 100k people (range 70k–130k), Low confidence (doc 16 §2). | Fear about enforcement. Her parole was terminated in April 2025 / April 2026. Confusion over whether "terminated" means "ineligible". | A separate entry channel (not a CHNV subtype). R1 hold days = 0 with a low-confidence flag. Green eligibility card plus amber enforcement card using doc 16 §8.4 copy. |
| **P3 relative / supporter** | Family member (often in Florida for years, sometimes the I-134A supporter), helping 1–4 people. Often English-comfortable. | Wants to track several cases and explain them to family members in Cuba or in the U.S. | Household: up to 6 cases on the device, free. Language toggle always visible. Share cards in either language. |
| **P4 helper (attorney, accredited representative, or "notario"/preparer)** | Helps many clients. May not be a lawyer (notario fraud risk, search #2). | Needs quick status for a client, plus the remedy-ladder logic with gates. | "Modo ayudante" (Could): many cases, tagged with nicknames only. Plus a permanent anti-scam card: "Solo un abogado o un representante acreditado puede darte asesoría legal; nadie puede 'convertir' un I-220A en parole" (doc 02 §2; search #2). |
| **P5 I-220A Cuban (out of scope for the estimate)** | Released on I-220A, not paroled. Not CAA-eligible under *Matter of Cabrera-Fernández*, 28 I&N Dec. 747 (doc 02 §2; key-facts §1). | Hope, and a target for scammers. | A respectful "por qué no podemos estimar tu caso" screen. Litigation watch (*Bello-Rubio*, BIA remand). Strong scam warning. No estimate (key-facts §1 `i220a_warning`). |

### 1.3 Principles (the user-first contract)

1. **Spanish is the primary language.** All copy is written in Spanish first and English second.
   Neither is a machine translation. Every Spanish string is reviewed by a native Cuban-Spanish reader.
2. **Never a single promised date.** Probabilities by horizon only, labeled in words ("muy poco
   probable antes de diciembre"), following doc 08 §11.7.
3. **Every number carries its source, its period and its kind.** A chip says *oficial / estimado /
   comunidad*, plus the period ("USCIS, ago 2026") (doc 04 §2.6; research README §2.8 #2).
4. **Calm design.** No red for routine waiting. Red is used only for a true deadline (an RFE/NOID
   response window, EAD expiry inside 30 days).
5. **Lead with what you can control.** Each screen ends with one or two concrete actions: renew the
   EAD early, check the packet, keep the receipt.
6. **The phone is the vault.** Nothing identifying leaves the device in the MVP (doc 09 §7). A
   discreet mode hides case details.
7. **Works with bad connectivity.** A bundled sample is always present. Payloads are tens of KB.
   No account, no login.

---

## 2) Feature list (MoSCoW) with rationale

| # | Feature | Priority | Rationale (research) |
|---|---|---|---|
| F1 | **EN/ES runtime toggle**: header pill on every screen, in Settings and on first launch. Persisted. Default from device locale. Switches every string, date, number, chart label, notification and disclaimer. | **Must** | Owner requirement; Cuban users are Spanish-first; SDK 58 notes §4 i18n bootstrap. |
| F2 | **Case wizard** (no account): entry channel → dates → state/office → received milestones → packet check (optional). | **Must** | Inputs the estimator needs (doc 08 §11.2). Channel gating (key-facts §1). |
| F3 | **Mi caso home**: status summary, "what this means", the hold clock strip (calendar vs adjudicable days), next steps. | **Must** | The reference case is mostly explained by the holds (doc 03 §11; doc 08 §6.3). |
| F4 | **Estimate (VPH-1)**: P(decision) at 3/6/12/24/36 months, calendar dates, scenario toggle, queue facts, confidence and "not validated" label. | **Must** | Doc 08 §11; research README §2.6. |
| F5 | **Separate approval card**: 70–90% for a complete clean packet, with population shares and baselines. | **Must** | Doc 14 §8.1; key-facts §3. |
| F6 | **"¿Por qué a otros sí y a mí no?" peer-difference explainer** (EAD and decision timing). | **Must** | The owner's core frustration. Doc 03 §6, doc 07 §5.1, doc 16 §8.3 give rule-based reasons. |
| F7 | **Panorama (national data)**: monthly received/approved/denied/pending chart, approval share with baselines, median/mean/80% labelled. | **Must** | Doc 04 §1.1–1.2; the "headline pending = monthly CSV only" rule. |
| F8 | **Mi oficina**: case-inquiry date (131A-FAM proxy), 80% figure, humanitarian pending trend, multiplier with N. | **Must** | Doc 04 §1.3, §2.4; doc 15 §2.2; key-facts §6. |
| F9 | **¿Qué puedo hacer? remedy ladder** with live gates (e-Request I-485 vs (c)(9), expedite, congressional, Ombudsman, mandamus, appointments). | **Must** | Doc 15 §9.1 decision tree and §9.4 copy. |
| F10 | **Data status badge on every screen**: Live / Sample / Stale, USCIS data period, fetch time. | **Must** | Owner requirement; doc 08 T20 guard; doc 09 §5.2. |
| F11 | **Offline-first cache** plus a bundled sample snapshot as the last fallback. | **Must** | Connectivity; artifact contract (b). |
| F12 | **Alerts feed (curated, bilingual)**: policy, court and data releases. Each alert shows who it affects and what changed in the estimate. | **Must** | Doc 03 §15.5; key-facts §9; doc 08 §8.4 re-weighting. |
| F13 | **Local notifications (native only)**: EAD expiry at 180/90/30 days, (c)(9) e-Request available, new USCIS month published, RFE/NOID deadline. | **Must** (native) / **Won't** (web) | Expo Go supports local notifications only (SDK 58 notes §6); EAD rules (doc 11 via key-facts §2). |
| F14 | **Entry-channel cards**: CHNV, CBP One (eligibility plus enforcement amber), FRP carve-out, I-220A no-estimate, *Red Eagle* class, *Doe v. DHS* class. | **Must** | Key-facts §1 flags; doc 16 §8.4 copy. |
| F15 | **Web build packaged as one self-contained artifact fragment.** | **Must** | Owner requirement (artifact contract a–i). |
| F16 | **Privacy-safe share card** (text; image on native): month-level facts only, no receipt, a QR-free "código de caso". | **Should** | Groups compare notes (doc 06 §3.8). Sharing is how the app spreads. |
| F17 | **"¿Es verdad?" rumor control**: myth/fact cards with sources. | **Should** | Doc 14 §8.7; doc 03 §12 ("not unconstitutional"); search #2 scams. |
| F18 | **Glossary EN/ES** (taps on underlined terms). | **Should** | Key-facts §10. |
| F19 | **EAD (c)(9) screen**: validity (5 years before 2025-12-05, 18 months after), no auto-extension, renewal planner. | **Should** | Key-facts §2 milestone 4; doc 03 §10.4. |
| F20 | **Household**: up to 6 cases, each with a nickname. Derivative link (CU7). | **Should** | Doc 10 §7 item 7 (Lawfully charges per case). |
| F21 | **Discreet mode / app lock**: hide case details behind a tap. Biometric lock on native later. | **Should** (hide) / **Could** (lock) | Enforcement fear after *CHIRLA* (doc 16 §6); doc 09 §7.3. |
| F22 | **Community timelines (opt-in upload, Supabase)** plus published aggregates (n ≥ 5). | **Should** (v1.1) | Doc 06 §8; doc 09 §6; doc 08 §9.3. Milestone sub-models need only dozens of events. |
| F23 | **Curated community polls** (admin-posted group polls transcribed with attribution) as "comunidad, no verificado". | **Could** | Doc 06 §3.8 ("legitimate secondary statistic"). |
| F24 | **Telegram broadcast channel** fed by the same curated alerts. | **Could** (v1.1) | Doc 06 §3.8 and doc 10 §4.11: an unserved niche, cheap via the Bot API. |
| F25 | **Modo ayudante** (many cases, nickname-only, quick ladder). | **Could** | P4 persona. |
| F26 | **"Un año y un día" calculator** for people not yet filed (late CBP One arrivals, relatives). | **Could** | Key-facts §1 `physical_presence_min_days`; doc 16 §5.3 item 5. |
| F27 | **Remote push** (Expo push) for high-severity alerts. | **Could** (v2, dev build) | Doc 09 §8 tier C; not in Expo Go. |
| F28 | **Optional Torch Case Status API sync** of the user's own receipt. | **Won't (MVP/v1.1)** | Production access needs a live demo and approval and may be unavailable (doc 04 §3.2). |
| F29 | Scraping Case Status Online or myUSCIS, or holding credentials | **Won't, ever** | Doc 04 §3.1; doc 10 §8 "avoid". |
| F30 | Ads, paid tiers, lawyer banners, analytics SDKs | **Won't** | Doc 10 §8; doc 09 §7.1 #5. |
| F31 | Free-text public posts / chat | **Won't** | Keeps the app outside the UGC moderation regime (doc 09 R7). |
| F32 | Printing, file downloads, alert/confirm dialogs, iframes | **Won't (web)** | Artifact contract (e). The same rule is applied on native for consistency. |

---

## 3) Screen-by-screen spec

### 3.0 Global chrome (every screen)

```
┌──────────────────────── 390 px ────────────────────────┐
│ ◀  Mi caso                         [ ES | en ]  ◐       │  ← header: back, title, language pill, (web) nothing else
│ ● En vivo · USCIS ago 2026 · act. hace 3 h        ⓘ     │  ← data badge (tap → Fuentes)
├─────────────────────────────────────────────────────────┤
│                       content                           │
├─────────────────────────────────────────────────────────┤
│  Mi caso   Panorama   Ayuda   Noticias•   Ajustes       │  ← 5 tabs, SVG icons + text labels
└─────────────────────────────────────────────────────────┘
```

**Language pill.**
- Shows `ES | EN`, with the active language bold and filled.
- Single tap switches immediately (no reload).
- Accessibility labels: "Cambiar idioma a inglés" / "Switch language to Spanish".
- Minimum 48×48 dp hit area.
- Also appears as the first row of Ajustes and on the first-launch chooser.

**Data badge states.**

| State | ES | EN | When |
|---|---|---|---|
| live | ● **En vivo** · datos de USCIS hasta {mes} · actualizado {hace X} | ● **Live** · USCIS data through {month} · updated {X ago} | Manifest fetched in the last 72 h and validated |
| cached | ◐ **Guardado** · datos de USCIS hasta {mes} · última conexión {fecha} | ◐ **Saved** · USCIS data through {month} · last online {date} | Offline, cache present |
| stale | ▲ **Desactualizado** · el último dato de USCIS tiene más de 75 días | ▲ **Out of date** · latest USCIS data is over 75 days old | Doc 08 T20(a): monthly file > 75 days old |
| sample | ○ **Muestra** · datos de ejemplo incluidos en la app ({fecha}) | ○ **Sample** · example data bundled with the app ({date}) | No fetch has ever succeeded |

**"Live" means the snapshot pipeline ran recently.** USCIS itself publishes the monthly CSV 4–8 weeks
after month end (doc 04 §1.1), so the badge always shows both dates (data period and fetch time).
A plain "live" would mislead.

**Tabs.**

| Route | ES | EN | Default for |
|---|---|---|---|
| `index` | Mi caso | My case | Shows the case if one exists; otherwise the pulse plus "Agrega tu caso" |
| `panorama` | Panorama | Overview | |
| `ayuda` | Ayuda | Help | Remedies, myths, glossary |
| `noticias` | Noticias | News | Badge dot when unread |
| `ajustes` | Ajustes | Settings | |

Icons are in-repo SVG drawn with `react-native-svg`. No icon fonts or SymbolView (artifact contract b).

### 3.1 Screen catalogue

Every screen has a loading, an empty and an error state. The shared rules:

- **Loading** uses skeleton blocks, never a spinner over content: cached data renders instantly.
- **Error** = network failure. The screen shows the cached or sample data plus a dismissible note:
  "No pudimos actualizar; mostramos los datos guardados del {fecha}" / "Couldn't refresh; showing
  saved data from {date}".
- **Schema-version mismatch** shows "Actualiza la app para ver los datos nuevos" / "Update the app to
  see new data" and keeps the old data (doc 09 §4.2).

| # | Route | Title ES / EN | Purpose | Data shown | Actions | Empty / special states |
|---|---|---|---|---|---|---|
| S0 | `/bienvenida/idioma` (first launch) | *Elige tu idioma* / *Choose your language* | Language first, before any other text | Two large buttons: "Español" / "English"; device locale preselected | Choose → S1 | Shown once; can be reopened from Ajustes |
| S1 | `/bienvenida` (3 cards) | *Bienvenido* / *Welcome* | Trust and what it is / isn't | (1) "Independiente, no oficial. No somos USCIS." (2) "Tus datos se quedan en tu teléfono." (3) "Estimados con datos oficiales; no es asesoría legal." | "Entendido" → S2 or skip to Panorama | Disclaimer acceptance stored with `disclaimerVersion` |
| S2 | `/caso/nuevo` (wizard, 5 steps) | *Tu caso* / *Your case* | Collect the estimator inputs | Steps: **1 Entrada** (CHNV / CBP One / FRP-CFRP / visa / I-220A / otro / no sé, with I-94 hints: "DT" = CBP One). **2 Fechas** (I-94 parole date optional, I-485 receipt date required, with "solo sé el mes" allowed → day 15). **3 Dónde** (state → office picker; Miami-Dade asks Hialeah/Kendall/Miami or "no sé"; ZIP only as a local lookup aid, never stored). **4 Lo que ya recibiste** (checklist: receipt, biometrics date, EAD (c)(9) date + card expiry, interview notice/date, RFE/NOID + response, transfer notice, mandamus/expedite). **5 Expediente** (optional packet check: I-94, Cuban passport/birth certificate, I-693, photos, fee/I-912). | Next/Back; "No sé" on every step; save | I-220A → S12 (no estimate). "No sé" channel → estimate with both R1 assumptions shown |
| S3 | `/` (tab Mi caso) | *Mi caso* / *My case* | One-glance status | Summary card: "Presentado mar 2025 · 19 meses · ≈10 meses adjudicables". Clock strip (§3.2). "Lo que esto significa" (3 bullets). Next-step card. Estimate teaser "9 % de probabilidad de decisión en 12 meses". Entry-channel card(s). | Open estimate (S4), timeline (S5), share (S11), switch case (household) | **No case:** pulse card (pending, last month's decisions, data period) plus a big "Agrega tu caso (2 min)" button |
| S4 | `/caso/[id]/estimado` | *Tu estimado* / *Your estimate* | The honest forecast | Headline sentence (doc 08 §11.7). Probability ladder 3/6/12/24/36 months with word labels. Calendar row ("antes del 31 dic 2026: ~1 %"). Fan/survival chart (SVG) with a table alternative. Scenario card (S0–S3 weights, toggle "ver cada escenario"). Queue facts (pending, older than you, same month, decisions last month). Office line with N. Confidence chip "No validado – 3 meses de datos". Approval card (F5). Peer-difference explainer (F6). | Toggle scenarios; "¿cómo se calcula?" → S14; share | Estimate not computable (I-220A, or missing filing date) → explanation. Interview done → post-interview mode copy |
| S5 | `/caso/[id]/linea` | *Línea de tiempo* / *Timeline* | View and edit milestones | Vertical timeline: done (date), expected (window), unknown. USCIS status text field (verbatim, optional). | Add/edit/delete milestone; "¿qué significa este estado?" | Empty: "Agrega la fecha de tu recibo para empezar" |
| S6 | `/panorama` (tab) | *Panorama* / *Overview* | National picture without spin | **Pulse:** pending 355,520 (Aug 2026), decisions last month 820 (386 approved / 434 denied), received 1,213. Chart received/approved/denied monthly Jul 2024→latest. Pending line. "¿Cuánto tarda?" card with 4 labelled stats: FY26 YTD median 11.8 months (cut 2026-07-31), FY26 Q3 quarterly median 16.3, Aug 2026 monthly mean 20.6, office 80% figure → link S7. Approval-share tile: "23.7 % (139 de 586) abr–jun 2026" next to Q1 91.7 % and Q2 52.6 %, with the caveat. | Period switch (12 / 24 months); "ver como tabla"; open S7 | If the quarterly workbook lags the monthly by more than one quarter → banner "datos mensuales sin contraste trimestral" (doc 08 T20b) |
| S7 | `/panorama/oficina/[code]` | *Tu oficina* / *Your office* | Office context, honestly small | Case-inquiry date for 131A-FAM (proxy; label "familiar, la más cercana a CAA"). 80% time (if available). Humanitarian pending trend FY24Q4→FY26Q3 (Cuban + refugee + asylee; label). Multiplier m̂ₒ with N and "dato débil" when N < 50. Crude "e-Request posible desde ≈ {mes}". | Pick another office; share | Office unknown → national; "Tu oficina cambia poco el estimado (2 puntos entre Hialeah y Houston)" (doc 08 §11.8) |
| S8 | `/ayuda` (tab) → `/ayuda/que-puedo-hacer` | *¿Qué puedo hacer?* / *What can I do?* | Remedy ladder with live gates | Rungs a–f (doc 15 §1), each with ✓ available / ✕ not yet (with ETA) / ⚠ depends. Gate facts, cost, realistic turnaround, Spanish phone path "oprima 2". *Red Eagle* class card. | Expand a rung → steps (doc 15 §2.3); "marcar como hecho" (adds a milestone); external links open in the browser (native only; on web shown as plain text URLs) | Denied → I-290B / lawyer branch (doc 15 §9.1 step 9) |
| S9 | `/noticias` (tab) | *Noticias y alertas* / *News & alerts* | What changed and does it affect me | Alert cards: severity, date, "a quién afecta" chips (CHNV / CBP One / todos / presentados después del 24 ago), "qué cambió en tu estimado" (e.g. "nueva pausa: 15 % → 30 %"), source link. Court tracker list (*Dorcas* 26-1703, *Red Eagle*, *AAUP*, *Doe v. DHS*, *CHIRLA*, *Bello-Rubio*) with last-known status and date. | Filter (mi caso / todos); mark read | Empty: "Sin novedades desde {fecha}" |
| S10 | `/ayuda/es-verdad` | *¿Es verdad?* / *Is it true?* | Rumor control | Myth/fact cards, e.g. (1) "El memo de mayo eliminó la Ley de Ajuste" → **Falso** (doc 14 §8.7). (2) "USCIS siempre manda un RFE antes de negar" → **Falso desde 5 ago 2026** (PA-2026-05). (3) "Un notario puede convertir tu I-220A en parole" → **Falso y peligroso** (search #2). (4) "La corte dijo que la pausa era inconstitucional" → **No; fue por la APA** (doc 03 §12). (5) "Si te cancelaron el parole ya no puedes ajustarte" → **Falso** (doc 16 §5). (6) "Tener permiso de trabajo acelera tu residencia" → **No hay evidencia** (doc 08 §7.5). (7) "Huellas tomadas hace 18 meses = caso perdido" → **Es normal hoy** (doc 10 §7 item 10). | Share a card (text) | — |
| S11 | `/caso/[id]/compartir` | *Compartir* / *Share* | Grow by word of mouth, privacy-safe | Preview of a text block (§8.6 "código de caso") in the current language, with a toggle to switch the share language | Native: system share sheet (RN `Share`). Web: selectable text box plus "Copiar" (clipboard in try/catch; on failure "Mantén presionado para copiar") | Discreet mode on → asks before revealing |
| S12 | `/caso/[id]/i220a` | *Tu entrada (I-220A)* / *Your entry (I-220A)* | Respectful no-estimate | Why (BIA *Cabrera-Fernández*); what is pending (*Bello-Rubio* MTD denied 2026-09-10, class cert pending; BIA remand expected Oct–Nov 2026, doc 00-master-timeline); scam warning; "verifica a tu abogado". | Follow the I-220A alert topic | — |
| S13 | `/caso/[id]/ead` | *Permiso de trabajo (c)(9)* / *Work permit (c)(9)* | EAD clarity | Card validity rule from the issue date (5 years if before 2025-12-05, else 18 months) — "lee la fecha en tu tarjeta". No auto-extension for renewals filed since 2025-10-30 (final rule 2026-10-14). Renewal window (file ≥ 180 days before expiry). (c)(9) e-Request availability (NBC inquiry date 2025-06-13). (c)(11) revoked note. | Set renewal reminder (native); mark renewal filed | No EAD → "¿Por qué no me ha llegado?" explainer |
| S14 | `/fuentes` | *Fuentes y método* / *Sources & method* | Trust | Each source: name, URL pattern, last retrieved, period, status (ok / fallback / failed). Model summary in plain words. Version of data and app. Link to the git history of `data/`. | Open URL (native) | Shows "Muestra" status honestly |
| S15 | `/ajustes` (tab) | *Ajustes* / *Settings* | Control | Language (first row), theme (system/light/dark; web obeys host theme), notifications (native), cases (household), discreet mode, data source (live/sample status), "Borrar todos mis datos", privacy, disclaimer, about (app version + manifest `generated_at`) | Toggle; delete (an in-app two-step confirm sheet, not a browser `confirm()`) | — |
| S16 | `/privacidad`, `/aviso-legal` | *Privacidad* / *Privacy*; *Aviso legal* / *Legal notice* | Required text | §10 copy | — | — |
| S17 | `/glosario` | *Glosario* / *Glossary* | Terms | Key-facts §10 table, searchable | — | — |
| S18 | `+not-found` | — | Recover from unknown paths | Immediately `<Redirect href="/" />` | — | Never visible for more than one frame |

### 3.2 Key wireframes (390 px)

**S3 Mi caso, reference case, ES**

```
┌─────────────────────────────────────────────┐
│ Mi caso · Yoandry            [ ES | en ]    │
│ ● En vivo · USCIS ago 2026 · hace 3 h       │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ I-485 Ajuste Cubano · Parole CHNV       │ │
│ │ Presentado: mar 2025 · Hialeah          │ │
│ │ 19 meses esperando                      │ │
│ │ ≈10 meses "adjudicables" (sin pausas)   │ │
│ └─────────────────────────────────────────┘ │
│ Lo que le pasó a tu caso                    │
│ 2025 ───────────────────── 2026 ─────── hoy │
│ ▓▓▓░░░░░░░░▓▓▓▓▓▓▓▓░░░░░                    │
│ ▓ pausa 1 (14 feb–9 jun 2025)               │
│ ▓ pausa 2 (2 dic 2025–12 jun 2026)          │
│ ★ EAD sep 2025                              │
│ Lo que esto significa                       │
│ • Tu caso no está atrasado "por ti": casi   │
│   la mitad del tiempo estuvo en pausa.      │
│ • Hoy ninguna pausa está vigente; USCIS     │
│   decide muy pocos casos (820 en agosto).   │
│ • Tener el permiso no acelera la residencia.│
│ ┌ Tu estimado ────────────────────────────┐ │
│ │ 9 % de probabilidad de decisión en 12   │ │
│ │ meses (2–26 % según el escenario)  ›    │ │
│ └─────────────────────────────────────────┘ │
│ Próximo paso                                │
│ ⏰ Revisa la fecha de vencimiento de tu EAD │
│   (renueva ≥180 días antes; ya no hay       │
│   extensión automática)                     │
│ ☐ Verifica que tu expediente esté completo  │
│ ┌ ¿Por qué a otros sí y a mí no? ›        ┐ │
└─────────────────────────────────────────────┘
```

**S4 Tu estimado (top), EN**

```
│ Your estimate                 [ es | EN ]   │
│ Chance of an I-485 decision                 │
│  in 3 mo   ▏ 1.5 %   very unlikely          │
│  in 6 mo   ▍ 3.7 %   very unlikely          │
│  in 12 mo  █ 9.4 %   unlikely               │
│  in 24 mo  ██▌ 22 %  possible               │
│  in 36 mo  ███▌ 36 % possible               │
│ By Dec 31 2026: ~1 % · By Dec 31 2027: ~12 %│
│ Half of cases like yours: more than 4 years │
│ at the blended outlook; ~22 months if the   │
│ 2025 pace returns.                          │
│ [Scenarios: status quo 30 · partial 40 ·    │
│  2025 pace 15 · re-freeze 15]  see each ›   │
│ ⚠ Not yet validated — 3 months of data      │
```

Word labels for probabilities (fixed thresholds, both languages):

| P | ES | EN |
|---|---|---|
| < 5 % | muy poco probable | very unlikely |
| 5–20 % | poco probable | unlikely |
| 20–50 % | posible | possible |
| 50–80 % | probable | likely |
| > 80 % | muy probable | very likely |

**S8 ¿Qué puedo hacer? (reference case, Hialeah)**

```
│ ✕ Consulta por demora (e-Request) del I-485 │
│   Aún "dentro del tiempo normal" en Hialeah │
│   (fecha de consulta 5 jul 2024). Posible   │
│   hacia ≈ oct 2027 (cálculo aproximado).    │
│ ✓ Consulta por demora del permiso (c)(9)    │
│   — solo si sigue pendiente (no aplica: ya  │
│   tienes EAD)                               │
│ ⚠ Procesamiento expedito: solo con pérdida  │
│   financiera documentada o emergencia.      │
│   "Necesitar el permiso" no basta.          │
│ ✓ Tu congresista (FL-26/27/28 …) — puede    │
│   negarse si estás dentro del tiempo normal │
│ ⚠ Ombudsman (DHS-7001): puede no responder  │
│ ⚠ Mandamus: hable con un abogado; la demanda│
│   de 143 cubanos en Tampa no logró acelerar │
│   casos (jul 2026). Costo $405 + abogado.   │
│ ℹ Eres miembro de la clase Red Eagle       │
```

The Hialeah date and ETA come from doc 15 §2.2. The (c)(9) rung follows doc 15 §2.2 and §9.4. The
expedite rule is from doc 15 §3. The Ombudsman warning is doc 15 §4.1. The mandamus facts are doc 15
§6.2–6.3. The *Red Eagle* card follows doc 15 §9.1 step 7.

### 3.3 Peer-difference explainer (F6) — rule table

This is shown as "Posibles razones" (possible reasons), each with a confidence chip. It never says
which one applies to the user.

| Condition on the user's case | Reason (ES short) | Source / confidence |
|---|---|---|
| CHNV, filed 2025-02-14 → 2025-06-09 | "Tu caso entró en la pausa de parolees (14 feb–9 jun 2025); un vecino que entró por CBP One no estaba en esa pausa según el memo." | Doc 16 §3 — medium; CBP One exemption low-confidence |
| EAD received before 2025-12-02 | "Tu verificación terminó antes del 2 dic 2025. Quien seguía pendiente ese día cayó en la pausa por país y recibió su EAD solo después de jun 2026 (12–13 meses)." | Doc 03 §6, doc 07 §5.1 — medium-high |
| EAD not received, filed I-765 with I-485 in 2025 | "Probablemente tu I-765 seguía pendiente el 2 dic 2025 y quedó congelado hasta jun 2026; hoy la espera reportada es 12–12.5 meses. Ya puedes hacer una consulta por demora del (c)(9)." | Doc 15 §2.2; doc 11 via key-facts §2 — medium |
| Peer's EAD renewal lapsed | "Las renovaciones presentadas desde el 30 oct 2025 no se extienden automáticamente." | Key-facts §2 — high |
| Peer approved, user not | "USCIS decidió 820 casos en agosto entre 355,520 pendientes; no siguen un orden estricto de llegada (el modelo estima solo una leve preferencia por casos más antiguos)." | Doc 08 §5.4–5.5 — medium |
| Peer interviewed in Tampa, user in Hialeah | "Tampa completó más casos por pendiente que Hialeah en 2026 (pocos datos)." | Doc 08 §7.3 — low |

---

## 4) Architecture

### 4.1 Diagram

```
                     REAL SOURCES (doc 04, 05, 13; nothing invented)
 www.uscis.gov data portal        egov processing-times      federalregister.gov API   courtlistener v4 (token)
 monthly CSV / quarterly XLSX     (Cloudflare; via mirror)   (no key)                  dockets + entries
        │                                 │  github.com/jzebedee/uscis daily .db (fallback, licence ask)
        ▼                                 ▼                         ▼                         ▼
 ┌──────────────────────────────────────────────────────────────────────────────────────────────┐
 │ GitHub Actions  (repo luisitin/Documents, root .github/workflows/caa-data-refresh.yml)         │
 │  schedule (default branch only) + workflow_dispatch (any branch)  · permissions: contents:write│
 │  packages/ingestion (Node 22 + TS + zod from packages/schema)                                   │
 │   fetch → classify (ok|blocked_cloudflare|…) → parse → validate → estimator params → alerts    │
 │   → write cuban-immigration-tracker/data/{manifest.json, snapshots/*.json, sample/…}          │
 │   → git commit to the triggering branch                                                         │
 │  watchers (FR, CourtListener, portal index) → open DRAFT alert PRs (human approves wording)    │
 └───────────────┬───────────────────────────────────────────────┬──────────────────────────────┘
                 │ raw.githubusercontent.com/luisitin/Documents/<branch>/cuban-immigration-tracker/data/…
                 │ (fallback cdn.jsdelivr.net/gh/luisitin/Documents@<branch>/…  [T])
                 ▼                                               ▼  scripts/build-artifact.mjs copies data/
 ┌───────────────────────────────────┐            ┌──────────────────────────────────────────────┐
 │ Native app (iOS/Android, Expo Go) │            │ Web artifact: web-artifact/index.html        │
 │ same code, Platform.OS='ios|and.' │            │ (fragment, inline JS+CSS) + data/*.json      │
 │ DataSource = GitHub raw URLs      │            │ DataSource = relative "./data/manifest.json" │
 └──────────────┬────────────────────┘            └──────────────┬───────────────────────────────┘
                │            shared app code (app/src)           │
                ▼                                                ▼
   ┌─────────────────────────────────────────────────────────────────────────────────┐
   │ data layer: fetch manifest → zod → KV cache (AsyncStorage | localStorage-safe)  │
   │   fallback chain: network → cache → bundled sample (always present)            │
   │ estimator (packages/estimator, pure TS, on-device)                              │
   │ content (packages/content: regimes, remedies tree, myths, glossary, rules)      │
   │ i18n (packages/i18n: es/en JSON + Intl formatters, es-US / en-US)               │
   │ UI: expo-router tabs, react-native-svg charts + icons, system fonts             │
   │ notifications: native only (expo-notifications local), web = in-app badge      │
   └─────────────────────────────────────────────────────────────────────────────────┘
   - - - - - - - - - - - - - - - - - - - - - - - - v1.1 optional - - - - - - - - - - - - - - -
   Supabase (anon auth + RLS, write-only for clients) ◄── opt-in timeline upload (native+web*)
   the Actions job reads it with the service key → publishes n≥5 aggregates into data/community.json
   (*web artifact: Supabase host is CSP-blocked → upload is native-only; the artifact shows aggregates)
```

### 4.2 Decisions

1. **One cross-platform store: `@react-native-async-storage/async-storage` 2.2.0** (the version SDK 58
   resolves, SDK 58 notes §1). It runs in Expo Go, and on web it is backed by `localStorage` [T].
   - Wrap it in `app/src/storage/kv.ts`. Every call goes through try/catch, and there is an in-memory
     `Map` fallback when storage throws or is empty (artifact contract d).
   - **No expo-sqlite anywhere in the MVP.** The data are tiny: the manifest is about 5 KB and a
     snapshot about 50 KB (doc 09 §9), and a household has at most 6 cases. This removes the web wasm
     problem (SDK 58 notes §5) and one native dependency.
   - Trade-off: this departs from doc 09 D2 ("expo-sqlite cache"). It is acceptable because nothing
     here needs queries.
2. **i18n:** i18next `createInstance` plus react-i18next, exactly as in SDK 58 notes §4. The saved
   language is read through `kv`. The device default comes from `expo-localization` `getLocales()`:
   `es*` → `es`, otherwise `en`.
   - `changeLanguage` re-renders everything.
   - Formatters use `Intl` with `es-US` / `en-US` [T: es-US groups digits like "355,520", which
     matches U.S. Cuban press usage — verify on Hermes and Chromium in Prove].
3. **Theme hook `useAppScheme()`.**
   - Native: `useColorScheme()`.
   - Web: read `document.documentElement.dataset.theme` and watch it with a `MutationObserver`; fall
     back to `matchMedia('(prefers-color-scheme: dark)')` (artifact contract f).
   - A user override in Ajustes applies only on native. On web the host decides.
4. **Icons and fonts.** In-repo SVG components (`app/src/ui/icons/*.tsx`, about 14 icons) and system
   fonts only. No `@expo/vector-icons`, no `expo-symbols`, no `expo-font` (artifact contract b).
5. **Charts.** Hand-rolled with `react-native-svg`: `LineChart`, `BarPairs`, `FanChart`, `Sparkline`,
   about 300 lines. Every chart has a "ver como tabla" twin (accessibility). No gifted-charts, Victory
   or Skia (contract g).
6. **Navigation.** expo-router with `src/app/(tabs)`. `+not-found.tsx` returns `<Redirect href="/" />`.
   - `app/src/app/_layout.tsx` runs a web-only guard on mount: if `!isKnownRoute(location.pathname)`,
     it calls `router.replace('/')` (contract c).
   - The fragment also includes a 10-line inline **history shim** placed before the bundle. It wraps
     `history.pushState/replaceState` in try/catch, because sandboxed hosts may throw `SecurityError`
     on URL changes [I — to be verified in Prove].
7. **Native-only modules behind platform files.**
   - `notifications/index.native.ts` holds the real implementation; `notifications/index.web.ts`
     contains no-ops.
   - `share/index.native.ts` uses RN `Share`; `share/index.web.ts` renders a selectable text box.
   - `links/openUrl.web.ts` displays the URL as text instead of opening it.
8. **Where "live" comes from.**
   - Native: GitHub raw URLs.
   - Artifact: the `./data/` files shipped beside the page, so "live" = as of the last
     build-and-publish.
   - Optional, lowest priority: if `window.claude?.use` resolves the host `mcp` capability, the page
     calls the GitHub connector `get_file_contents` on `luisitin/Documents` for
     `cuban-immigration-tracker/data/manifest.json`. Otherwise it silently stays on the shipped files.
9. **Staleness.** The badge uses `manifest.generated_at` (pipeline freshness) and `latestMonthly.period`
   (USCIS freshness), with T20 rules (doc 08 §11.9).
   - Monthly data more than 75 days old → stale.
   - Monthly data more than one quarter ahead of the quarterly → "sin contraste trimestral" banner.
   - Pipeline older than 72 h → "cached" state even when online (doc 09 §5.2).
10. **Layout.** `ScreenContainer` sets `maxWidth: 720` and centers on wide screens, with 16 px side
    gutters. Tables become stacked cards below 480 px. Prove checks there is no horizontal scroll at
    390 px.

---

## 5) Data model (TypeScript; `packages/schema` exports zod schemas + inferred types)

```ts
// packages/schema/src/common.ts
export type ISODate = string;        // "2026-10-20"
export type YearMonth = string;      // "2026-08"
export type Lang = 'es' | 'en';
export interface L10n { es: string; en: string }             // every user-facing string in data files
export type Tag = 'S' | 'S-sec' | 'F' | 'T' | 'I' | 'U';     // evidence tag carried into the UI
export interface SourceRef { id: SourceId; url: string; retrievedAt: string; period?: string; sha256?: string;
  via?: string; status: 'ok' | 'fallback' | 'failed' | 'skipped_no_secret' | 'blocked_cloudflare' }
export type SourceId = 'uscis_monthly_csv' | 'uscis_quarterly_all_forms' | 'uscis_i485_by_office'
  | 'pt_jzebedee_mirror' | 'pt_egov' | 'pt_historic' | 'federal_register' | 'courtlistener'
  | 'curated_alerts' | 'community_polls' | 'community_supabase' | 'bundled_sample';
export interface Provenance { source: SourceId; tag: Tag; asOf: ISODate | YearMonth; note?: L10n }

// packages/schema/src/official.ts  — doc 04 §1.1–1.3
export interface MonthlyRow {               // "I-485 (Cuban)" row of the Report-to-Congress CSV
  ym: YearMonth; received: number; approved: number; denied: number;
  pending: number; pendingOver6: number | null; avgMonths: number | null;  // mean of completions
}
export interface QuarterlyRow {             // quarterly_all_forms "I-485 (Cuban)" and "I-765 (Adjustment Of Status)"
  fy: number; q: 1 | 2 | 3 | 4; form: 'I-485-CUBAN' | 'I-765-AOS';
  received: number; approved: number; denied: number; completions: number;
  pending: number;                          // workbook pending — NEVER the headline (doc 04 §1.1)
  medianMonths: number | null;
}
export interface OfficeQuarterRow {         // i485_performance… "Humanitarian-based" column
  fy: number; q: 1 | 2 | 3 | 4; state: string; officeCode: string; officeName: string;
  received: number; approved: number; denied: number; pending: number;
  category: 'humanitarian';                 // = Cuban + refugee + asylee (doc 04 §1.3)
}
export interface HistoricMedian { fy: number; months: number; cutDate: ISODate; tag: Tag }   // 3.3/4.6/7.0/11.8

// processing-time records — doc 04 §2.4, doc 13 §1
export interface ProcessingTimeRecord {
  form: 'I-485' | 'I-765'; subtype: '131A-FAM' | '147-C9' | '147-C11' | string;
  officeCode: string; months80: number | null; inquiryDate: ISODate | null;  // service_request_date
  publicationDate: ISODate; proxyForCaa: boolean;                             // true for 131A-FAM
}

// regimes & scenarios — key-facts §3, doc 08 §8
export type EntryChannel = 'CHNV' | 'CBP_ONE' | 'FRP_CFRP' | 'U4U' | 'I220A' | 'VISA' | 'OTHER_PAROLE' | 'EWI' | 'UNKNOWN';
export interface Regime {
  id: 'R0' | 'R1' | 'R2' | 'R3' | 'R4'; label: L10n; start: ISODate | null; end: ISODate | null;
  hold: boolean; appliesTo: (EntryChannel | 'ALL_CUBAN')[]; lowConfidenceExempt?: EntryChannel[];
  altEnd?: { legal?: ISODate; ops?: ISODate[] }; instruments: { id: string; date: ISODate; appliesToCaa?: boolean;
  confidence?: 'high' | 'likely' | 'low' }[]; source: string;
}
export interface Scenario { id: 'S0' | 'S1' | 'S2' | 'S3'; label: L10n; prior: number;
  path: { kind: 'flat'; level: number } | { kind: 'ramp'; from: number; to: number; months: number }
      | { kind: 'freezeThen'; freezeMonths: number; then: Scenario['path'] } }
export interface EstimatorParams {
  version: ISODate; beta: number; betaFittedOn: YearMonth[]; horizonMonths: 72; receiptsForecast: number;
  k0Office: number; clampOffice: [number, number];
  postInterview: { medianMonths: number; sigma: number }; expediteGranted: { medianMonths: number; sigma: number };
  multipliers: { ead: 1; noBiometricsAfter4mo: 0.7; rfePending: 0; rfeAnswered: 1.5; rfeAnsweredMonths: 3;
                 mandamus: 1.3; mandamusMonths: 4 };   // ×1.3 per doc 15 §9.3
  approvalPrior: { complete: [0.70, 0.90]; centre: 0.85; incomplete: 'unquantified' };
  scenarios: Scenario[];
}

// snapshot + manifest — doc 09 §4 adapted
export interface Snapshot {
  schemaVersion: 1; period: YearMonth; generatedAt: string;
  monthly: MonthlyRow[]; quarterly: QuarterlyRow[]; offices: OfficeQuarterRow[];
  processingTimes: ProcessingTimeRecord[]; historicMedians: HistoricMedian[];
  regimes: Regime[]; params: EstimatorParams; sources: SourceRef[];
}
export interface Manifest {
  schemaVersion: 1; generatedAt: string; dataBranch: string;
  latest: { snapshot: string; sha256: string; bytes: number; monthlyThrough: YearMonth; quarterlyThrough: string };
  snapshots: { period: YearMonth; path: string; sha256: string }[];
  alerts: string;            // "alerts.json"
  content: string;           // "content.json" (myths, remedies gates data, glossary overrides)
  community?: string;        // "community.json" (v1.1)
  sources: SourceRef[];
  minAppVersion: string;     // newer schema → "update the app"
}

// alerts — doc 03 §15.5, doc 08 §8.4
export interface Alert {
  id: string; date: ISODate; severity: 'info' | 'important' | 'urgent';
  topics: ('policy' | 'court' | 'data' | 'fees' | 'enforcement' | 'scam' | 'i220a')[];
  title: L10n; body: L10n; whatChangedForYou?: L10n;
  affects: { channels?: (EntryChannel | 'ALL_CUBAN')[]; filedBefore?: ISODate; filedAfter?: ISODate; hasEad?: boolean };
  scenarioEffect?: { scenario: Scenario['id']; factor: number; condition?: 'redEagleInForce' | 'notRedEagleClass' }[];
  approvalPriorFlag?: 'reestimate'; sources: { label: string; url: string; tag: Tag }[];
  docket?: { court: string; number: string; courtListenerId?: number };
  reviewedBy: string;        // human reviewer handle (curation rule)
}

// personal case (device only) — doc 06 §8.1, doc 15 §9.2, doc 16 §8.1
export type MilestoneKey = 'filed' | 'receipt' | 'biometrics' | 'ead_c9' | 'ead_renewal_filed' | 'ap_i131'
  | 'transfer' | 'interview_notice' | 'interview' | 'rfe' | 'rfe_response' | 'noid' | 'noid_response'
  | 'decision_approved' | 'decision_denied' | 'card' | 'erequest' | 'erequest_response' | 'expedite'
  | 'expedite_outcome' | 'congressional' | 'ombudsman' | 'mandamus' | 'parole_termination_notice';
export interface Milestone {
  key: MilestoneKey; date: ISODate | null; dateGranularity: 'day' | 'month';
  sourceType: 'notice' | 'online_status' | 'memory'; meta?: Record<string, string | boolean>;
  // e.g. ead_c9.meta.cardExpiry, rfe.meta.dueDate, expedite_outcome.meta.outcome='granted'
}
export interface CaseTimeline {
  id: string; nickname: string;              // never a real name required; default "Mi caso"
  createdAt: string; updatedAt: string;
  entryChannel: EntryChannel; paroleDate?: ISODate; paroleEndDateOriginal?: ISODate;
  terminationNotices: ('EMAIL_APR_2025' | 'CHNV_JUN_2025' | 'INDIVIDUAL_APR_2026' | 'FRP_JAN_2026' | 'OTHER')[];
  i485ReceiptDate: ISODate; i485ReceiptDateGranularity: 'day' | 'month';
  receiptPrefix?: string;                    // 3 letters only; full number optional and device-only
  receiptFullLocal?: string;                 // never uploaded, never shared
  state?: string; officeCode?: string | 'UNKNOWN';
  concurrentI765: boolean | null; concurrentI131: boolean | null; withAttorney: boolean | null;
  packet?: { i94: boolean | null; nationalityProof: boolean | null; i693: boolean | null; photos: boolean | null; fee: boolean | null };
  milestones: Milestone[]; derivativeOf?: string; hardship?: ('job_loss' | 'benefits_loss' | 'medical' | 'death' | 'uscis_error')[];
  statusTextLastSeen?: string;               // verbatim USCIS text, device-only
}
export interface DerivedFlags {               // computed, not stored
  isParoleBased: boolean; caaParoledElementMet: boolean; r1HoldApplies: boolean | 'low_confidence';
  frpI485Carveout: boolean; redEagleClassMember: boolean; doeDhsClassMember: boolean | 'unknown';
  expeditedRemovalShield: false; i220aWarning: boolean; reTerminationDateSuspicious: boolean; // end date 2026-04-24
}

// shared community timeline (v1.1, Supabase) — stricter than doc 09 §6.3: no receipt digits
export interface SharedTimeline {
  consentVersion: number; entryChannel: Exclude<EntryChannel, 'UNKNOWN'>; receiptPrefix: string | null;
  state: string; officeCode: string | null; filedMonth: YearMonth;   // month, not day
  milestoneMonths: Partial<Record<MilestoneKey, YearMonth>>;         // months only
  milestoneOffsetsDays: Partial<Record<MilestoneKey, number>>;       // days since receipt (precise interval, no absolute date)
  withAttorney: boolean | null; registeredAt: string;
}
export interface CommunityAggregate { filedMonth: YearMonth | 'all'; channel: EntryChannel | 'all';
  office: string | 'all'; milestone: MilestoneKey; n: number;                // n >= 5 only
  p25Days: number; p50Days: number; p75Days: number; provenance: Provenance }
export interface CommunityPoll { id: string; group: string; postedOn: ISODate; question: L10n;
  options: { label: L10n; votes: number }[]; transcribedBy: string; url?: string; tag: 'S-sec' }

// content (bilingual knowledge as data) — doc 15 §9, doc 14 §8.7
export interface Myth { id: string; claim: L10n; verdict: 'false' | 'misleading' | 'true' | 'unknown';
  explanation: L10n; since?: ISODate; sources: { label: string; url: string; tag: Tag }[] }
export interface RemedyRung { id: 'a_erequest' | 'a_erequest_c9' | 'b_expedite' | 'c_ombudsman' | 'd_congress' | 'e_mandamus' | 'f_appointment';
  title: L10n; gate: L10n; cost: L10n; turnaround: L10n; steps: L10n[]; warning?: L10n; sources: string[] }
export type RungState = { id: RemedyRung['id']; state: 'available' | 'not_yet' | 'depends' | 'not_applicable'; etaMonth?: YearMonth; reason: L10n };
```

---

## 6) Data pipeline

### 6.1 Sources (only those verified in the research; status as stated there)

| Key | Exact URL pattern | Parser | Cadence | Output | Failure handling |
|---|---|---|---|---|---|
| `uscis_monthly_csv` | `https://www.uscis.gov/sites/default/files/document/data/appropriation_requirement_<month>_<year>_v1.0.csv` (lowercase English month; latest `august_2026`; next `september_2026`). Discover via portal `https://www.uscis.gov/tools/reports-and-studies/immigration-and-citizenship-data`, matching `appropriation_requirement` case-insensitively (doc 04 §1.1) | `parseMonthlyCsv`: strip BOM; quoted thousands; tolerate trailing comma; find row `I-485 (Cuban)`; read the "For the Month of" header line | Daily probe; new file monthly, 4–8 weeks lag | `MonthlyRow` appended to `snapshot.monthly` | Browser UA + Referer (key-facts §8). Fallback `https://raw.githubusercontent.com/omairqazi29/visualizer/master/data/USCIS_I485/<file>` (doc 04 §1.0). On failure keep the previous snapshot and mark the source `failed`. Fixture asserts Aug 2026 = 1,213 / 386 / 434 / 355,520 / 345,741 / 20.6 |
| `uscis_quarterly_all_forms` | `…/document/data/quarterly_all_forms_fy<YYYY>_q<N>_v1.xlsx` (latest fy2026_q3; Q4 ≈ early Dec 2026) | `parseAllForms`: sheet `FY26Q3_All_Forms`-like; rows `I-485 (Cuban)`, `I-765 (Adjustment Of Status)` | Quarterly | `QuarterlyRow[]` | Fixture FY26 Q3 = 6,279 / 139 / 447 / 586 / 342,360 / 16.3 (doc 04 §1.2) |
| `uscis_i485_by_office` | `…/document/data/i485_performance_data_fy<YYYY>_q<N>_v1.xlsx` (stem drifts: match `i485_performance` loosely, never guess) | `parseByOffice`: sheet `I485_by_State`, humanitarian block per office | Quarterly | `OfficeQuarterRow[]` | Assert humanitarian total = Cuban + refugee + asylum (doc 04 §1.3) |
| `pt_jzebedee_mirror` | `GET https://api.github.com/repos/jzebedee/uscis/releases/latest` → `https://github.com/jzebedee/uscis/releases/download/<YYYY-MM-DD>/<YYYY-MM-DD>.db` | `sql.js` [T] read of `processing_time` for I-485 `131A-FAM` (all offices) and I-765 `147-C9`, `147-C11` | Daily (mirror builds 04:30 UTC) | `ProcessingTimeRecord[]` | Repo has **no LICENSE**: ask the author before redistributing (doc 04 §2.3, doc 13 §1.6). Until answered, publish only derived fields (inquiry date, months, publication date) with attribution. Check the release is dated ≥ the previous one |
| `pt_egov` | `GET https://egov.uscis.gov/processing-times/api/processingtime/I-485/<OFFICE>/131A-FAM` (legacy) or `POST https://egov.uscis.gov/processing-times` with `Next-Action` | Doc 13 §1 normalizer | Probe weekly only | Same as above | Expected `blocked_cloudflare` from Actions (doc 13 §0). Never block the run on it |
| `pt_historic` | `https://egov.uscis.gov/processing-times/historic-pt` | HTML table, CAA row | Monthly attempt | `HistoricMedian[]` | Expected blocked. Fall back to the curated `historic_medians.yml` (3.3 / 4.6 / 7.0 / 11.8 with cut dates, tag S-sec) |
| `federal_register` | `https://www.federalregister.gov/api/v1/documents.json?conditions[term]=<q>&conditions[agencies][]=homeland-security-department&conditions[agencies][]=u-s-citizenship-and-immigration-services&order=newest&per_page=20` | JSON → candidate alerts | Daily | **Draft PR** with `data/alerts/drafts/<doc>.yml` | Regression: `2025-05128`, `2025-22744` must be found (doc 13 §6) |
| `courtlistener` | `https://www.courtlistener.com/api/rest/v4/docket-entries/?docket=<id>&order_by=-date_filed`, ids 73477958 (*Dorcas* 1st Cir.), 73380879 (*Red Eagle*), 74919678 (*AAUP*), 71085922 (*Doe v. DHS*), 69695790 (*Doe v. Noem*) | JSON → new entries since last seen | 2× daily (125/day budget) | Draft alert PR | Needs secret `COURTLISTENER_TOKEN`. Without it → `skipped_no_secret` and the curated tracker stays as last reviewed |
| `curated_alerts` | `cuban-immigration-tracker/data/alerts/*.yml` (in repo) | YAML → zod `Alert` | On merge | `alerts.json` | The PR template requires both `es` and `en`, sources and a reviewer |
| `community_polls` (Could) | `data/community/polls/*.yml` (hand-transcribed) | YAML → `CommunityPoll` | Manual | `community.json` | Labelled "comunidad, no verificado" |
| `community_supabase` (v1.1) | Supabase project REST via service key | SQL aggregates (doc 09 §6.3 pattern) | Daily | `community.json` | n ≥ 5 per cell; any estimate-like stat needs n ≥ 10 (doc 08 §9.2) |

**Deliberately not in v1:**

- OHSS monthly tables and Census ACS (doc 05). They add cohort context, not user value. Planned for v2.
- CBP monthly pages. The series ended in January 2025 (doc 13 §5).
- The Torch API (§2 F28).

### 6.2 Outputs (`cuban-immigration-tracker/data/`)

```
data/
  manifest.json              ← Manifest (≈3–5 KB)
  snapshots/2026-08.json     ← Snapshot keyed by latest USCIS month (immutable once written)
  alerts.json                ← compiled, reviewed alerts (bilingual)
  content.json               ← myths, remedy gates data (inquiry dates per office), glossary additions
  community.json             ← v1.1
  alerts/*.yml  alerts/drafts/*.yml  community/polls/*.yml  curated/historic_medians.yml
  schema/*.schema.json       ← exported from packages/schema (zod → JSON Schema) for CI diff
app/src/data/sample/         ← bundled sample = copy of the last reviewed snapshot + alerts + content
```

### 6.3 Workflow sketch (repo root: `/.github/workflows/caa-data-refresh.yml`)

Scheduled workflows run only on the default branch (`main` [I] from `.github/workflows/blank.yml`).
`workflow_dispatch` lets the job be run by hand on the feature branch
(`claude/cuban-immigration-tracker-b6y4b1`). The job commits back to whichever ref triggered it.

```yaml
name: caa-data-refresh
on:
  schedule: [{ cron: "17 6 * * *" }, { cron: "17 18 * * *" }]   # off the hour (doc 09 §5.2)
  workflow_dispatch:
    inputs:
      sources: { description: "comma list or 'all'", default: "all", required: false }
permissions:
  contents: write            # least privilege: commit snapshots only; no pages, no id-token
concurrency: { group: caa-data-refresh-${{ github.ref }}, cancel-in-progress: false }
defaults: { run: { working-directory: cuban-immigration-tracker } }
jobs:
  refresh:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@<sha-of-v7>          # pin by SHA (doc 09 §5.3)
        with: { ref: ${{ github.ref }} }
      - uses: actions/setup-node@<sha-of-v7>
        with: { node-version: 22, cache: npm, cache-dependency-path: cuban-immigration-tracker/package-lock.json }
      - run: npm ci --workspaces --include-workspace-root
      - run: npm run -w packages/ingestion refresh -- --out data --sources "${{ inputs.sources || 'all' }}"
        env: { COURTLISTENER_TOKEN: ${{ secrets.COURTLISTENER_TOKEN }} }   # optional; absent → skipped_no_secret
      - run: npm run -w packages/schema validate-data -- data            # zod validation of every file
      - run: npm run -w packages/estimator smoke -- data                 # T11/T15 reference case must still pass
      - name: commit
        run: |
          git config user.name "caa-tracker-bot"
          git config user.email "caa-tracker-bot@users.noreply.github.com"
          git add data
          if git diff --cached --quiet; then echo "no changes"; exit 0; fi
          git commit -m "data: refresh $(date -u +%F) [skip ci]"
          git push origin "HEAD:${GITHUB_REF_NAME}"
  draft-alerts:
    needs: refresh
    runs-on: ubuntu-latest
    permissions: { contents: write, pull-requests: write }   # only this job may open PRs
    steps:
      - uses: actions/checkout@<sha-of-v7>
      - run: npm ci && npm run -w packages/ingestion watchers -- --drafts data/alerts/drafts
      - run: gh pr create --draft --title "alerts: drafts $(date -u +%F)" --body "Review ES/EN wording" || true
        env: { GH_TOKEN: ${{ github.token }} }
```

**Notes on the job.**

- **Keep-alive.** The 60-day inactivity rule applies only to public repos (doc 09 §5.1). The job
  commits only on change, so add a monthly heartbeat commit of `manifest.generatedAt` (one commit per
  30 days) instead of twice-daily churn.
- **Staleness issue.** A weekly workflow (`41 7 * * 1`) opens a GitHub issue if `generatedAt` is more
  than 7 days old (doc 09 §5.2 #6).
- **Repo history.** Data commits land in the same repo as the user's other documents. That keeps
  history small but noisy. Open question Q3.

---

## 7) Estimation model

### 7.1 Choice

The estimator is **VPH-1 (doc 08 §11)** with the Round-2 amendments from the research README §2.6:

- R1 is subtracted only for CHNV, FRP-CFRP and U4U.
- The mandamus multiplier is ×1.3 instead of ×3.
- The approval prior is 70–90%, conditioned on packet completeness.
- The channel is used for copy and the clock.

On top of it sits a thin **presentation layer** (`explain()`). It turns the numbers into word labels,
the clock strip, the peer explainer and the next steps. That layer is where this proposal differs:
the math is doc 08's, and the words are tuned for anxious users.

### 7.2 Inputs

- `CaseTimeline`: the filing date, plus channel, office, milestones and packet.
- `Snapshot`: monthly rows, offices, regimes and params.
- `today`.
- Optional user scenario weights (an "advanced" toggle, which reverts to default on restart).

### 7.3 Algorithm (v1, exact)

```ts
function estimate(c: CaseTimeline, snap: Snapshot, today: ISODate): EstimateOut {
  const flags = deriveFlags(c, today);                                   // key-facts §1
  if (flags.i220aWarning) return { kind: 'no_estimate', reason: 'i220a' };
  if (c.entryChannel === 'EWI') return { kind: 'no_estimate', reason: 'ewi' };
  if (has(c, 'decision_approved') || has(c, 'decision_denied')) return { kind: 'decided' };

  // 1. clock
  const cal = days(c.i485ReceiptDate, today);
  const adj = adjudicableDays(c.i485ReceiptDate, today, snap.regimes, c.entryChannel);   // R1 only if r1HoldApplies
  const adjAlt = adjudicableDaysAltEnds(...);                                             // 2025-06-25 / 2026-07-16 (256 for T11)
  const r1Unknown = c.entryChannel === 'UNKNOWN';                                         // show both CHNV and CBP One clocks

  // 2. pool + beta (doc 08 §11.4 steps 1–4); refit on device only if monthly rows newer than params.betaFittedOn
  const rows = clean(snap.monthly);
  const beta = needsRefit(rows, snap.params) ? fitBeta(rows) : snap.params.beta;          // fallback 0.037
  const pool = reconstructPool(rows, beta);
  const vintage = ym(c.i485ReceiptDate) < rows[0].ym ? 'legacy>6mo' : ym(c.i485ReceiptDate);

  // 3. office multiplier (Gamma–Poisson, k0 = 50, clamp [0.5, 2]); UNKNOWN → 1
  const mOffice = officeMultiplier(lastTwoQuarters(snap.offices, c.officeCode), cubanGroup(snap.offices));

  // 4. milestone state machine (precedence top→bottom)
  let mode: 'pool' | 'post_interview' | 'post_expedite' = 'pool'; let mMilestone = 1; let zeroUntil: number | null = null;
  if (has(c,'interview'))                          mode = 'post_interview';                  // lognormal median 3, σ .857
  else if (outcome(c,'expedite_outcome')==='granted') mode = 'post_expedite';                // median ≈ 2 (doc 15 §9.3)
  if (has(c,'rfe') && !has(c,'rfe_response'))      zeroUntil = Infinity;                     // hazard 0 (T18)
  else if (has(c,'rfe_response'))                  mMilestone *= boostFor(1.5, 3, monthsSince(c,'rfe_response'));
  if (has(c,'noid') && !has(c,'noid_response'))    zeroUntil = Infinity;
  if (!has(c,'biometrics') && monthsSince(c.i485ReceiptDate) >= 4 && !has(c,'ead_c9')) mMilestone *= 0.7;
  if (has(c,'mandamus'))                           mMilestone *= boostFor(1.3, 4, monthsSince(c,'mandamus'));
  // ead_c9: ×1.0 by design — explained to the user ("tener EAD no acelera la residencia")

  // 5. scenario weights: priors × active alert rules (doc 08 §8.4), class-aware
  const w = applyAlertRules(snap.params.scenarios, snap.alerts, { redEagleClass: flags.redEagleClassMember });

  // 6. grid: 4 scenarios × β∈{β/2,β,2β} × m∈{.8,1,1.25}·mOffice — 36 paths, H = 72 (doc 08 §8.3)
  const k0 = monthsBetween(lastRow(rows).ym, ym(today));                 // 2 for 2026-10-20 vs Aug data
  const paths = grid(w, beta, mOffice).map(p =>
    mode === 'pool' ? projectPath(pool, vintage, p.beta, p.scen, p.m * mMilestone, 72, snap.params.receiptsForecast, zeroUntil)
                    : aftPath(mode, monthsSince(c, mode === 'post_interview' ? 'interview' : 'expedite_outcome'), 72));
  const { S, post } = mixAndCondition(paths, k0);                        // condition on still pending today

  // 7. outputs
  const p = (m: number) => 1 - S[m];
  const q = (x: number) => firstIndex(S, s => 1 - s >= x) ?? null;      // null = beyond horizon
  const out = {
    clock: { calendarDays: cal, adjudicableDays: adj, adjudicableAlt: adjAlt, holds: holdsApplied(c, snap.regimes), r1Unknown },
    pWithin: { m3: p(3), m6: p(6), m12: p(12), m24: p(24), m36: p(36) },
    byDate: [endOfYear(today), endOfYear(today, +1)].map(d => ({ date: d, p: p(monthsBetween(today, d)) })),
    quantiles: { q10: q(.1), q25: q(.25), q50: q(.5), q75: q(.75), q90: q(.9) },
    perScenario: scenarioSummaries(paths, post),                         // for "see each scenario" and the 2–26 % range
    queue: queueFacts(pool, vintage, rows),                               // pending, older than you, same month, last completions
    office: { code: c.officeCode ?? 'UNKNOWN', m: mOffice, n: officeCompletions(...), weak: officeCompletions(...) < 50 },
    approval: approvalCard(c.packet, rows),                               // separate; never multiplied in
    confidence: confidenceLabel(rows, snap),                              // LOW until backtest passes (doc 08 §11.4 step 11)
    validated: false,
  };
  return { kind: 'estimate', ...out, words: explain(out, c, flags) };   // presentation layer
}

function approvalCard(packet, rows) {
  const complete = packet && Object.values(packet).every(v => v === true);
  return {
    range: complete ? [0.70, 0.90] : null,                                // incomplete → words only
    population: { jul2026: 308/626, aug2026: 386/820 },                   // 49 %, 47 % (doc 14 §8.1)
    baselines: { fy26q1: 0.917, fy26q2: 0.526, fy26q3: 0.237, fytd: 0.83 },
    caveatKey: complete ? 'approval.clean' : 'approval.incomplete_pa202605',
  };
}
```

### 7.4 How each input conditions the estimate (and what is told to the user)

| Input | Effect in the model | What the user sees |
|---|---|---|
| **Filing date** | Selects the vintage; older vintages are mildly favoured (β ≈ 0.037). Oct-2025 filer P12 = 7.4% vs Mar-2025 filer 9.4% (doc 08 T17) | "Presentar antes ayuda un poco, no mucho: USCIS no decide en estricto orden de llegada." |
| **Entry channel** | Changes the clock (CHNV 306 vs CBP One 392 adjudicable days, T11/T21). **No hazard change in v1** (no evidence; doc 08 §5.6); also drives eligibility and enforcement cards | Clock strip shows one or two pauses. CBP One shows "pausa 1 no aplicó a CBP One según el memo (confianza baja)" |
| **State / office** | Shrunken multiplier, clamp [0.5, 2]; Tampa 1.936 … Kendall 0.829 (doc 08 §7.3) | Office line with N and a "dato débil" chip; a sentence that the office matters little versus national throughput |
| **EAD received** | ×1.0 | The explainer: the EAD is a separate (c)(9) queue |
| **Biometrics missing at ≥ 4 months (no EAD)** | ×0.7 | "Pide una consulta: puede haber un problema de cita" (an e-Request type that is not gated [T] doc 15 §2.1) |
| **Interview done** | Post-interview lognormal (median 3 months, σ 0.857), conditioned on time since the interview | "Después de la entrevista, la mitad de los casos se deciden en ~3 meses (datos de abogados, confianza baja); algunos esperan mucho más." (doc 03 §10.3 attorney reports) |
| **RFE / NOID pending** | Hazard 0 until answered; then ×1.5 for 3 months | Urgent deadline card: RFE ≤ 12 weeks, NOID 30 days (+3 mail) since PA-2026-05 |
| **Mandamus filed** | ×1.3 for 4 months | "Una demanda no garantiza rapidez (Tampa, jul 2026)" |
| **Expedite granted** | Post-expedite lognormal median ≈ 2 | — |
| **Filed after 2026-08-24** | Not a *Red Eagle* class member → *Dorcas*-reversal alert multiplies S3 ×3 (not ×1.5) | Info card: the class may not cover you (doc 03 §11.4 copy) |

### 7.5 The 2025 holds

The holds are handled in three ways, all following doc 08 §6:

1. **The adjudicable-days clock.** It is shown to the user. Regime breakpoints come from `regimes.json`
   (key-facts §3).
2. **The pool reconstruction.** It already contains the observed near-zero completions of R1 and R3,
   because those are the real monthly rows.
3. **The S3 re-freeze scenario.** It covers a future hold, re-weighted by curated alerts (doc 08 §8.4).

Alternative operational ends are shown as a range: 256–306 days for the reference case.

### 7.6 Reference case (owner's) — expected app output

Inputs:

- CHNV entry; filed 2025-03-15 (the user entered only "March 2025", so day 15 is used).
- EAD September 2025; no interview; no RFE.
- Office unknown, or Hialeah.
- Today 2026-10-20; data through August 2026.

Expected outputs (all from doc 08 §11.8):

| Quantity | Office unknown | Hialeah |
|---|---|---|
| Calendar / adjudicable days | 584 / 306 (alternative 256) | same |
| P(decision within 12 months) | 9.4% | 8.9% |
| P(decision within 24 months) | 22.3% | — |
| q50 | 53 months | 55 months |
| q75 | null ("más de 6 años") | — |
| P(decision by 2026-12-31) | ≈ 0.9% | — |
| P(decision by 2027-12-31) | ≈ 11.5% | — |

Scenario posteriors are ≈ the priors: 0.301 / 0.400 / 0.149 / 0.151.

The Spanish headline copy reads:

> **Tu caso lleva 19 meses presentado; ≈10 de ellos estuvo en pausa.**
> **Probabilidad de que USCIS decida tu I-485 en los próximos 12 meses: 9 %** (entre 2 % y 26 % según lo que pase con la política).
> Antes del 31 de diciembre de 2026: ~1 %. Antes del 31 de diciembre de 2027: ~12 %.
> Si se decide, y tu expediente está completo, la aprobación es lo más probable (70–90 %, estimado; no validado).

The peer explainer for this case shows two reasons: "EAD antes del 2 dic 2025" and "CHNV en la
pausa 1".

### 7.7 Uncertainty presentation rules

These follow doc 08 §11.7, plus:

1. **Word labels** from the fixed table in §3.2.
2. **The range is the min/max across scenarios** ("2–26 %"), shown before any chart.
3. **The median is shown only if it falls within 72 months.** Otherwise the screen says "más de 6 años".
4. **A "No validado" chip stays until the backtest passes** (doc 08 §10.2 acceptance).
5. **A "policy uncertainty" banner** appears when the change-point monitor trips (doc 08 §6.5), and
   also on any `urgent` court alert.

### 7.8 Tests and backtest

- **Doc 08 tests.** Port T1–T20 (doc 08 §11.9) and T21–T22 (doc 16 §8.2) to Vitest in
  `packages/estimator`. Tolerances are as given there.
- **Additional tests from this proposal:**
  - **U1 language invariance.** `estimate()` output is identical for `es` and `en`; only `explain()`
    strings differ, and every key exists in both locale files.
  - **U2 peer explainer.** The reference case yields exactly the reasons {`chnv_r1`, `ead_before_r3`}.
    A CBP One twin yields {`cbp_one_no_r1` (low confidence), `ead_before_r3`}. An EAD-missing twin
    yields {`ead_swept_r3`, `c9_erequest_available`}.
  - **U3 remedy gates.** At HIA on 2026-10-20 the I-485 e-Request is `not_yet` with ETA ≈ 2027-10;
    the (c)(9) e-Request is `available` if the EAD is pending (doc 15 §2.2).
  - **U4 approval card.** Incomplete packet → `range: null` and caveat `incomplete_pa202605`.
  - **U5 data guard.** Monthly data more than 75 days old → confidence LOW and badge `stale` (T20).
  - **U6 bundled sample.** With no network, `estimate()` on the sample snapshot reproduces T15.
- **Backtest.** Rolling origins Oct 2024 → latest-6, scored by regime (CRPS, Brier P12, 90% coverage
  80–97%), per doc 08 §10.2. Implemented as `npm run -w packages/estimator backtest` and run in CI
  monthly. R4 cannot be validated before the FY26 Q4 workbook arrives (≈ Dec 2026 / Jan 2027).

---

## 8) Crowdsourced timelines

### 8.1 What is captured (v1.1, opt-in)

The shared copy uses `SharedTimeline` (§5):

- channel, receipt prefix (3 letters), state, office;
- filing **month**;
- milestone **months**, plus day offsets from receipt;
- attorney yes/no.

**Not shared:** receipt digits, names, ZIP, any free text, USCIS status text, the hardship list, or
packet contents.

This is **stricter than doc 09 §6.3 / key-facts §2** (`WAC12345XXXXX`, prefix plus 5 digits). The
reason is that IOE receipt digits are sequential (doc 04 §3.3), so 5 digits can narrow a filing to a
small batch. Since August 2026 (*CHIRLA*, doc 16 §6), users fear enforcement, and that cost outweighs
the value of a block view. A block view can come back in v2 as a separate opt-in with 2 digits (Q6).

### 8.2 Validation

- **Client-side:** zod plus plausibility. Dates are not in the future and not before the receipt; the
  EAD comes after the receipt; an interview comes before a decision; the filing month is ≥ the parole
  month + 12 when the parole date is known (doc 06 §8.1 `plausibility_flags`).
- **Server-side:**
  - DB check constraints mirror those rules.
  - Aggregation uses medians and trimmed quantiles.
  - The sample is benchmarked monthly against official completions (doc 08 §9.2 #2). If the sample is
    unrepresentative, the UI says "la muestra comunitaria no es representativa este mes".

### 8.3 Privacy

- Supabase anonymous auth (no email or phone).
- RLS allows insert, update, delete and select **only on the user's own rows**. No client SELECT on
  other users' rows (doc 09 §6.3).
- At most 3 rows per owner.
- `delete_my_account()` is called from "Borrar todos mis datos".
- A local salted hash prevents duplicates on the same device.
- Aggregates are published with n ≥ 5 per cell, and any estimate-like figure needs n ≥ 10.
- Consent is versioned. The consent screen lists exactly the fields, in the current language.

### 8.4 Abuse prevention

- Row cap and sign-in rate limit (Supabase built-in [T]).
- The structured form makes text spam impossible.
- Plausibility filters, with influence capped at 5% per office-month cell (doc 08 §9.2 #6).
- Delayed-entry handling, because `registeredAt` is required.
- The app tells users a screenshot proves nothing, and teaches them to verify claims on the official
  Case Status page (doc 06 §3.8 on fake "Approved" screenshots).

### 8.5 Web artifact

The artifact's CSP blocks any host except the allowed CDNs, so Supabase cannot be reached from it
(contract b). The artifact therefore shows community aggregates (shipped `data/community.json`), and
the upload button says "Disponible en la app móvil" / "Available in the mobile app".

### 8.6 MVP fallback without a backend

1. **Local timeline only.** The estimator works without community data.
2. **"Código de caso" share text.** It is month-level and safe to paste in groups, so groups get a
   uniform format and members can compare cases cleanly:

   ```
   #AjusteCubano CAA · CHNV · FL-Hialeah
   Presentado: 2025-03 · Huellas: 2025-07 · EAD: 2025-09 · Entrevista: — · Decisión: —
   19 meses (≈10 adjudicables) · Estimado 12 m: 9 % · datos USCIS ago 2026
   Generado con CAA Tracker (no oficial)
   ```

   The English variant is equivalent. Share language is chosen independently of UI language.
   No receipt digits are included.
3. **Curated community polls** (F23), with attribution.
4. **Comparison inside the app.** "Pega el código de otra persona para comparar". The pasted code is
   parsed locally and compared side by side with the user's own case, with the peer explainer applied
   to both. Nothing is uploaded.

---

## 9) Alerts and notifications

### 9.1 Alert policy (curation over automation)

- **Watchers only open draft PRs.** Sources are the Federal Register, CourtListener and the portal
  index for new files. A maintainer writes the ES/EN text, the `affects` block and the
  `scenarioEffect`, then merges.
- **No automatic push for "a number changed"** (doc 09 §8). The processing-times tool changes silently.
- **Severity:**
  - `urgent`: something that changes rights or risk now, e.g. a new hold memo naming Cuba, a *Dorcas*
    reversal, an enforcement change.
  - `important`: a new USCIS month or quarter, a court ruling with indirect effect, fees or form editions.
  - `info`: everything else.
- **Each alert answers three questions:** what happened, who is affected, and what changed in your
  estimate (with a before/after of the S3 weight when applicable).

### 9.2 Seed alerts for launch (all from the corpus)

| Date | Topic | Title ES | Effect |
|---|---|---|---|
| 2026-08-05 | policy | *USCIS puede negar sin pedir documentos (PA-2026-05)* | Approval card; packet checklist (doc 14 §4) |
| 2026-08-11 | enforcement | *Ya no rige la protección contra deportación acelerada para ex-parolees* | Amber card for terminated parole (doc 16 §6) |
| 2026-08-14 | court | *Primer Circuito: solo vuelve la re-revisión de casos aprobados* | None on timing (doc 08 §8.4) |
| 2026-08-24 | court | *Red Eagle: orden de clase protege casos pendientes de cubanos* | Class card |
| 2026-09-18 | fees/forms | *Nueva edición del I-485 (09/18/26) obligatoria* | Info for new filers |
| 2026-10-05 | court | *Demanda AAUP v. Mullin contra el memo de mayo y PA-2026-05* | Watch; relief against the Denial Policy → re-estimate the approval card |
| 2026-10-14 | EAD | *Regla final: sin extensión automática del permiso de trabajo* | EAD screen |
| 2026-10-20 | scam | *Cuidado: notarios que venden "parole" falso para I-220A* | Myth card (search #2) |
| 2026-10-20 | data | *Datos de USCIS abril–junio: 139 aprobados, 447 negados — qué significa* | Panorama caveat (doc 14 §8.1) |

### 9.3 Notification types (native only; local; Expo Go compatible)

| Trigger (computed on device) | ES text | EN text | Timing |
|---|---|---|---|
| EAD card expiry minus 180, 90 and 30 days | *Tu permiso de trabajo vence el {fecha}. Las renovaciones ya no se extienden automáticamente: preséntala ahora.* | *Your work permit expires {date}. Renewals no longer auto-extend: file now.* | Calendar trigger, 10:00 local |
| RFE/NOID due minus 21 and 7 days | *Tu respuesta a USCIS vence el {fecha}.* | *Your response to USCIS is due {date}.* | Date trigger |
| (c)(9) pending and past the NBC inquiry date (after a data refresh) | *Ya puedes pedir una consulta por demora de tu permiso (c)(9).* | *You can now file a delay inquiry for your (c)(9) permit.* | On app open after refresh (no background task in MVP) |
| A new USCIS month or quarter in the manifest | *USCIS publicó datos de {mes}. Tu estimado se actualizó.* | *USCIS published {month} data. Your estimate was updated.* | On app open |
| An `urgent` alert affecting the user's case | the alert title | the alert title | On app open; v2 push |

- Android: create the channel before asking permission (SDK 58 notes §6). Ask only after showing the
  benefit on the EAD screen.
- Notification text is generated in the language active **at scheduling time**. On a language switch,
  all pending notifications are cancelled and rescheduled (requirement: notifications switch too).

### 9.4 Web and broadcast

- **Web:** a dot on the Noticias tab plus an "N nuevas" chip. No Notification API, because device APIs
  are blocked by artifact contract (e).
- **v1.1 Telegram channel:** `@`-handle to be chosen. Posted by the `draft-alerts` job after merge, via
  the Bot API with secret `TELEGRAM_BOT_TOKEN`. Spanish first, English below.
- **WhatsApp Channels:** manual posting by the maintainer [I]. No API is verified in the corpus.

---

## 10) Privacy, security, legal disclaimers, store compliance

### 10.1 Privacy

- **MVP: no data leaves the device.** The only network traffic is anonymous GETs of public JSON
  (doc 09 §7.2: Apple "Data Not Collected").
- **Discreet mode.** Case nickname, dates and channel are hidden on Mi caso until the user taps
  "mostrar".
- **The receipt number is optional and stays on the device.** The UI recommends entering only the
  3-letter prefix.
- "Borrar todos mis datos" clears the KV store, all cases and scheduled notifications, and (v1.1) calls
  `delete_my_account()`.

### 10.2 Security

- zod rejects impossible data (negative counts, future dates), and the app keeps the last good copy.
- Actions are pinned by SHA. The data commit has least privilege.
- CODEOWNERS review is required for workflow, pipeline and alert changes (doc 09 §10.3).
- No secrets in the app.
- The artifact contains no third-party code beyond the bundle.

### 10.3 Disclaimers (shown on S1, footer of S4/S8, Ajustes)

- **ES:** *"CAA Tracker es independiente y no tiene relación con USCIS, DHS ni ninguna agencia del gobierno. No es asesoría legal. Los estimados son proyecciones estadísticas con datos públicos y pueden equivocarse; cada caso es distinto. Para decisiones sobre tu caso consulta a un abogado de inmigración o a un representante acreditado."*
- **EN:** *"CAA Tracker is independent and not affiliated with USCIS, DHS or any government agency. It is not legal advice. Estimates are statistical projections from public data and can be wrong; every case is different. For decisions about your case, consult an immigration attorney or an accredited representative."*
- **Anti-scam line (S8, S10, S12):** *"Nadie puede garantizarte una aprobación ni 'convertir' un I-220A en parole. Desconfía de quien cobre por eso."* / *"No one can guarantee an approval or 'convert' an I-220A into parole. Be wary of anyone charging for that."*

### 10.4 "No legal advice" boundary in the remedy ladder

- The ladder states USCIS's published gates and costs and the facts of known cases. It never tells a
  user "you should sue".
- Mandamus and expedite rungs always end with "habla con un abogado".
- The ladder never recommends travel or departure.

### 10.5 Stores

- **Name:** "CAA Tracker — Ajuste Cubano (no oficial)". No USCIS or DHS in the name, no seals. Avoid
  "Case Tracker" (doc 10 §8).
- **Listing:** leads with what generic trackers lack (doc 09 R6 / Apple 4.3).
- **Policies:** privacy policy in-app and at a hosted URL in both languages. Data-safety form:
  "no data collected" for MVP. Account deletion is in-app once Supabase arrives (doc 09 §7.2, R8).
- **Spanish listing** first for the US Spanish locale.

---

## 11) Repository layout and module boundaries

All paths are under `cuban-immigration-tracker/` (npm workspaces). Workflows live at the repo root
`/.github/workflows/`. Each package has one owner agent and a public interface; agents depend only on
the interfaces below.

```
cuban-immigration-tracker/
  package.json                 workspaces: ["app", "packages/*"]; scripts: test, lint, typecheck, build:artifact, prove
  app/                         Expo SDK 58 app (expo-router entry, src/app routes)
  packages/
    schema/                    zod schemas + types (§5); JSON Schema export; data validator CLI
    estimator/                 VPH-1 + explain(); pure TS; no React; Vitest
    content/                   regimes, remedy tree, myths, glossary, peer-explainer rules (bilingual data + pure fns)
    i18n/                      es.json, en.json (UI strings), formatters (dates/numbers/percent/relative), key-parity test
    ingestion/                 Node 22 pipeline: fetchers, parsers, watchers, probes (doc 13 §12)
  data/                        published snapshots (written only by ingestion / reviewed PRs)
  scripts/
    build-artifact.mjs         expo export web → web-artifact/index.html fragment + data/
    prove.mjs                  headless Chromium checks against the fragment
  web-artifact/                build output (git-ignored except README)
  tests/e2e/                   Playwright specs used by prove.mjs
  supabase/                    v1.1 migrations (doc 09 §6.3, stricter receipt rule)
  docs/                        research, planning
```

| Module | Public interface | Depends on | Owner agent / parallelizable |
|---|---|---|---|
| `packages/schema` | `ManifestSchema`, `SnapshotSchema`, `AlertSchema`, `ContentSchema`, `CaseTimelineSchema`, `SharedTimelineSchema`, types; `validateDataDir(path)`; `exportJsonSchemas(outDir)` | zod | A1, first (day 1–2), then frozen behind semver |
| `packages/estimator` | `estimate(case, snapshot, today, opts?) → EstimateOut`; `adjudicableDays(...)`; `deriveFlags(...)`; `reconstructPool`, `fitBeta`, `officeMultiplier`, `projectPath`, `mixAndCondition`, `postInterviewCdf`; `backtest(rows)` | schema | A2 (parallel after schema) |
| `packages/content` | `regimesSeed`, `remedyLadder(case, snapshot, today) → RungState[]`, `peerReasons(case) → ReasonKey[]`, `myths: Myth[]`, `glossary`, `packetChecklist` | schema | A3 (parallel) |
| `packages/i18n` | `resources {es, en}`, `fmt.date(d, lang, style)`, `fmt.number`, `fmt.percent`, `fmt.monthYear`, `fmt.relative`, `probWord(p, lang)`; key-parity test | — | A4 (parallel; native-Spanish review gate) |
| `packages/ingestion` | CLI `refresh --out --sources`, `watchers --drafts`, `probe`; `parseMonthlyCsv`, `parseAllForms`, `parseByOffice`, `readJzebedeeDb` | schema | A5 (parallel; fixtures from doc 04 numbers) |
| `app/src/storage` | `kv.get/set/remove/clear` (sync-ish facade over AsyncStorage with in-memory fallback; never throws) | async-storage | A6 |
| `app/src/data` | `useManifest()`, `useSnapshot()`, `useAlerts()`, `useDataStatus() → {state, monthlyThrough, fetchedAt}`; `DATA_BASE_URL` per platform; bundled `sample/` | schema, storage, TanStack Query | A6 |
| `app/src/cases` | `useCases()`, `saveCase`, `deleteCase`, `useActiveCase()` | schema, storage | A6 |
| `app/src/ui` | `ScreenContainer`, `Header` (with `LanguagePill`), `DataBadge`, `Card`, `Chip`, `Timeline`, charts (`LineChart`, `BarPairs`, `FanChart`, `TableAlt`), `icons/*`, `useAppScheme()` | react-native-svg, i18n | A7 |
| `app/src/app` (routes) | Screens S0–S18 | all above | A8, A9 (split by tab) |
| `app/src/platform` | `notifications` (.native/.web), `share` (.native/.web), `openUrl` (.native/.web), `webGuard` (web only) | expo-notifications (native) | A7 |
| `scripts/build-artifact.mjs` + `prove.mjs` | `node scripts/build-artifact.mjs` → `web-artifact/index.html`, `web-artifact/data/*`; `node scripts/prove.mjs` exit code | app | A10 |

### 11.1 `scripts/build-artifact.mjs` steps (artifact contract a–i)

1. Run `npx expo export --platform web --output-dir dist-web`. `app.json` has
   `"web": { "output": "single", "bundler": "metro" }`.
2. Read `dist-web/index.html` and collect the `<script src>` and `<link rel=stylesheet>` paths.
   Inline them. Escape `</script` inside the JS as `<\/script`.
3. Drop the favicon and manifest links. **Fail if** `dist-web/assets` contains `.ttf`, `.otf` or
   `.woff`, which would mean an icon font sneaked in. Convert any remaining small PNG/SVG asset to a
   data URI. Fail if the total size exceeds 15 MB, leaving headroom under 16 MB.
4. Emit the fragment in this order:
   - `<title>CAA Tracker</title>`;
   - the `<style>` block (below);
   - `<div id="root"></div>` (the id Expo's template uses [T]; read it from `dist-web/index.html`);
   - the history shim `<script>`;
   - the inline bundle `<script>`.

   **Fail if** the output contains `<!doctype`, `<html`, `<head>`, `<body` or any external
   `http(s)://` script/style reference.
5. Copy `data/manifest.json`, `data/snapshots/<latest>.json`, `alerts.json`, `content.json` and
   `community.json` into `web-artifact/data/`. The web data layer fetches `./data/manifest.json`
   relative to the page and falls back to the bundled sample.

The `<style>` block for the fragment:

```css
:root{color-scheme:light;--bg:#f7f7f5;--fg:#16181d;--card:#ffffff;--accent:#1d4ed8}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){color-scheme:dark;--bg:#111317;--fg:#eceef2;--card:#1b1e24;--accent:#8ab4ff}}
:root[data-theme="dark"]{color-scheme:dark;--bg:#111317;--fg:#eceef2;--card:#1b1e24;--accent:#8ab4ff}
html,body,#root{background:var(--bg);color:var(--fg);margin:0;min-height:100%}
#root{display:flex;flex-direction:column;min-height:100vh;max-width:100vw;overflow-x:hidden}
```

The RN theme tokens mirror these values. `useAppScheme()` reads `dataset.theme`.

### 11.2 Prove step (`scripts/prove.mjs`, headless Chromium via Playwright)

The fragment is wrapped in a minimal skeleton (charset, viewport with `viewport-fit=cover`, a 14 px
system font, zero body margin) and served at an arbitrary path such as `/x/7f3/page.html`. Assertions:

| # | Check |
|---|---|
| (1) | Boots to Mi caso, or the pulse when there is no case, from that path. |
| (2) | Visits all 5 tabs plus a deep stack screen. |
| (3) | Language switch: "Mi caso" ↔ "My case", "20 oct 2026" ↔ "Oct 20, 2026", the chart axis label, and the disclaimer. |
| (4) | Runs the wizard with the reference case and sees "9 %". |
| (5) | `data/` missing → badge "Muestra"; present → "En vivo". |
| (6) | `localStorage` patched to throw → still renders. |
| (7) | `data-theme="dark"` toggled at runtime → background changes. |
| (8) | Viewport 390 px → `scrollWidth <= 390`; viewport 1280 px → content is centered. |
| (9) | No console errors and no blocked network requests (a CSP header identical to the host's is applied). |

---

## 12) Roadmap with effort estimates

Effort is in person-days: one solo developer with coding agents in parallel. "Calendar" assumes about
50% parallelism.

| Phase | Scope | Effort | Calendar |
|---|---|---|---|
| **MVP (v1.0)** | F1–F15, F17, F18, F19 (native and web), F16 text share, F20, F21 hide. Pipeline: monthly CSV, quarterly, by-office, jzebedee, FR watcher, curated alerts. Artifact build plus Prove. Native-Spanish copy review. | schema 2 · estimator 5 (port + T1–T22 + U1–U6) · content 4 · i18n + copy 6 (incl. review) · ingestion 6 · storage/data 3 · UI kit + charts + icons 5 · screens 10 · platform guards 2 · artifact build + prove 4 · CI 2 · store prep 3 = **52 pd** | **≈ 6–7 weeks** |
| **v1.1** | Supabase opt-in timelines (F22) + aggregates; Telegram channel (F24); CourtListener watcher with token; community polls (F23); biometric app lock; backtest dashboard in Fuentes; Modo ayudante (F25) | 25 pd | +4 weeks |
| **v2** | Remote push (dev build) (F27); milestone sub-models from crowd data (doc 08 v2.0); hierarchical office effects; multi-class pool (parolee vs I-220A); Monte Carlo fan; competing risks; optional opt-in coarse block view; OHSS/Census cohort context | 40 pd | +2–3 months, gated on n ≥ 30 events per transition |

**Phase gates:**

- Before MVP release: the Prove run passes, a native Cuban-Spanish reviewer signs off es.json, and
  the T15 reference test is green.
- Before v1.1: the privacy policy is updated and the store forms are revised (doc 09 R9).

---

## 13) Risks and open questions

### 13.1 Risks

| # | Risk | Likelihood / impact | Mitigation |
|---|---|---|---|
| K1 | Users read a probability as a promise, or panic at "53 months" | High / high | Word labels; range first; median hidden past 72 months; "lo que puedes hacer" next to every estimate; never a date |
| K2 | "23.7%" or "447 denied" headlines cause fear | High / high | Approval tile always shows numerator, denominator, baselines and the caveat (doc 14 §8.1); myth card |
| K3 | Remedy ladder drifts into legal advice | Medium / high | Gates and facts only; "habla con un abogado" endings; reviewed wording |
| K4 | The repo `luisitin/Documents` is private → raw URLs 401 on native | Unknown / high | `DATA_BASE_URL` configurable; bundled sample; option to publish `data/` to a separate public repo or Pages. **Note:** the repo also holds unrelated personal files (e.g. a PDF under `.github/workflows/`), so the owner must confirm visibility before making it public (Q1) |
| K5 | Sandboxed artifact host throws on `history.pushState` or blocks clipboard | Medium / medium | History shim; selectable-text share; verified in Prove [I] |
| K6 | Expo monorepo/Metro resolution of `packages/*` breaks web export or Expo Go | Medium / medium | Day-1 spike; fallback: copy packages into `app/src/vendor` at build time |
| K7 | Web bundle size (react-native-web + router) is large on prepaid data | Medium / low | Production minified export, no heavy deps; measure in Prove; target < 3 MB [T] |
| K8 | jzebedee mirror licence / disappearance | Medium / medium | Ask the author; publish only derived fields; egov probe; curated inquiry dates as last resort |
| K9 | Scheduled job disabled or delayed; artifact data only as fresh as its last publish | Medium / medium | Heartbeat; staleness issue; badge shows both dates; documented "republish after refresh" step |
| K10 | Notario or scam apps clone the name or screenshots | Medium / medium | Distinctive name; "no oficial, gratis, sin anuncios" in-app; share text carries the app name and data month |
| K11 | Spanish register mismatch (tú vs usted) alienates older users | Medium / low | Decision: **tú**, matching Cuban press usage (CiberCuba; doc 16 §8.4 copy). Reviewer sign-off; revisit after beta (Q5) |
| K12 | New hold memo or *Dorcas* reversal between releases | Medium / high | Curated urgent alert re-weights S3 without an app release (data-only) |
| K13 | Playwright Chromium download blocked in some CI or sandboxes | Low / medium | Use `npx playwright install chromium` in Actions (GitHub reachable); fall back to a system Chromium if present |
| K14 | Expo Go on stores lags SDK 58 | Low / low | Dev build (SDK 58 notes §2, §9) |

### 13.2 Open questions

| # | Question | Notes |
|---|---|---|
| Q1 | Is `luisitin/Documents` public, and is `main` the default branch? | [I] from `blank.yml` targeting `main` |
| Q2 | Will jzebedee/uscis allow redistribution of derived processing-time fields? | Doc 04 §2.3 |
| Q3 | Should `data/` live in a separate public data repo to keep the Documents repo clean and allow GitHub Pages? | Doc 09 §5.2 #9 |
| Q4 | Does `Intl` `es-US` on Hermes format numbers and dates as expected (grouping, "oct" abbreviations)? | Verify on device |
| Q5 | Should the app use "tú" or "usted"? | Beta test with two community groups |
| Q6 | Is an opt-in coarse receipt block view worth its privacy cost in v2? | §8.1 |
| Q7 | Who reviews and approves alert wording (owner, plus one bilingual reviewer)? | Response-time target for `urgent`: 24 h |
| Q8 | Are there open research questions that change copy? | Each would change copy, not architecture. The *Acosta Reynoso* 08-13 adjudication report would change the mandamus multiplier (doc 15 §9.3). Also: the September 2026 CSV (search #1: not out), the FY26 Q4 workbook (≈ Dec 2026), the *Dorcas* 26-1703 schedule, *Doe v. DHS* after 2026-05-06, and the I-220A BIA remand |
| Q9 | Does the R1 CBP One exemption hold in community data (two EAD-timing clusters)? | The first analysis to run once v1.1 has n ≥ 30 per channel (doc 16 §8.3) |
| Q10 | Should the artifact use the host `mcp` refresh path at all, given its lowest priority? | Implement only after Prove passes without it |
