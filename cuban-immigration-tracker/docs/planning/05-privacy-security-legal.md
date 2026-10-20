# 05 — Privacy, security and legal (final)

Written 2026-10-20. Tags as in `00-product-spec.md`.

## 1. Privacy principles

1. **Nothing personal leaves the device in the MVP.** The only network traffic is anonymous GETs of public JSON. Native apps fetch from raw.githubusercontent.com. The web artifact fetches same-origin relative files. There are no analytics, ads, crash reporting or third-party AI SDKs (doc 09 §7.1 #5). This makes the store labels true: Apple "Data Not Collected" and Google "no data collected" (doc 09 §7.2).
2. **The phone is the vault.** The data stays on the device, and the user can see and delete it.
   - **Stored:** the case timeline, the optional nickname, the optional full receipt number (displayed masked) and the settings.
   - **Never stored:** name, A-number, date of birth, address, ZIP, phone or e-mail.
   - **Never requested:** credentials for myUSCIS or any other site.
3. **Least data, even locally.** The UI recommends entering only the 3-letter receipt prefix. Month granularity is accepted for every date. In v1.1 the ZIP code is used only as a lookup key on the device and is never written to storage.
4. **One-tap deletion.** "Borrar todos mis datos" opens a two-step in-app sheet (never `window.confirm`). It runs `kv.clear('caa:')` and cancels every scheduled notification. In v1.1 it also calls `delete_my_account()`.
5. **Discreet mode (Should).** It hides the nickname, dates and channel on "Mi caso" until the user taps "mostrar". The motivation is enforcement fear after *CHIRLA* (2026-08-11, doc 16 §6). It is not a security boundary, and the copy says so.
6. **Web artifact.**
   - The viewer's case lives only in that browser's storage, in the artifact's own origin. Nothing reaches the publisher, Claude or GitHub.
   - The page works with storage disabled, using memory only.
   - The optional MCP refresh reads only the public manifest and never sends case data.

### 1.1 Data inventory

| Datum | Where | Leaves device? | Retention |
|---|---|---|---|
| Case timeline (dates, channel, state, office, milestones, basic-docs checklist) | KV `caa:v1:cases` | No (MVP); v1.1 opt-in shared copy, transformed (§4) | until deleted |
| Full receipt number (optional) | KV, inside the case | **Never** | until deleted |
| Nickname | KV | Never | until deleted |
| Settings, read-alert ids, notification ids | KV | Never | until deleted |
| Cached official data | KV `caa:v1:data:*` | n/a (public) | replaced on refresh |
| IP address seen by GitHub when fetching JSON | GitHub's logs | inherent to any HTTPS fetch | GitHub's policy; disclosed in the privacy page |

## 2. Repository exposure (verified today; owner action required)

`luisitin/Documents` is **public**, and `main` is the default branch [V: `api.github.com/repos/luisitin/Documents` → `private: false`]. These personal files return HTTP 200 on raw.githubusercontent.com [V]:

- `CITI Certification.pdf`
- `Licensee Lookup Summary.pdf`
- `SIE.pdf`
- `.github/workflows/MembershipVerificationLetter.pdf`

**Recommendation for the owner. It is not automated, because it is destructive and needs a person to decide:**

1. Move those files out of the repository.
2. If they contain anything sensitive, also purge them from history (`git filter-repo --path <file> --invert-paths` for each file, then force-push, then ask GitHub support to clear cached views), and treat their contents as already disclosed.
3. Alternatively, make the repository private. That breaks the raw URLs, so the snapshots would have to move to a dedicated public data repo (`01-architecture.md` §7). The app's `extra.data.baseUrls` already allows this.

Agents working in this repo **must not** add personal data. CI includes a check that fails a PR adding any `*.pdf`, `*.docx` or image outside `cuban-immigration-tracker/app/assets/` and `data/raw/`.

## 3. Security

### 3.1 Supply chain and CI

- **Actions pinning.** Every action is pinned by commit SHA, at the current majors per doc 09 §5.3: `actions/checkout` v7.0.1 and `actions/setup-node` v7.1.0. Dependabot or a monthly review updates the SHAs.
- **Least privilege.**
  - Workflow-level `permissions: {}`.
  - The `refresh` job has `contents: write`.
  - The `notify` and `staleness` jobs have `issues: write` only.
  - The `ci` and `probe` jobs have `contents: read`. `commit-samples` has `contents: write` and runs only on manual dispatch.
  - No job has `pages`, `id-token`, `pull-requests`, `actions` or `packages` write permission in the MVP.
  - The Pages deploy in v1.1 runs in its own job, with `pages: write` and `id-token: write`.
- **Bot scope.** Bot commits touch only `cuban-immigration-tracker/data/**`, never `data/curated/**`; the step resets `curated/` before committing.
- **CODEOWNERS** (`/.github/CODEOWNERS`) requires the owner's review for:
  - `/.github/workflows/**`
  - `cuban-immigration-tracker/packages/ingestion/**`
  - `cuban-immigration-tracker/packages/estimator/**`
  - `cuban-immigration-tracker/data/curated/**`
  - `cuban-immigration-tracker/scripts/**`
- **Branch protection on `main`.** Pull requests are required. The bot pushes data directly, which requires either allowing GitHub Actions in the protection rule or keeping protection off for the bot; the owner decides in week 0. If push is blocked, the job fails visibly, and the `notify` job opens an issue.
- **Secrets.**
  - MVP: the built-in `GITHUB_TOKEN` and an optional `COURTLISTENER_TOKEN`.
  - v1.1: `SUPABASE_SERVICE_ROLE_KEY` in a GitHub **environment** with required reviewers.
  - The app contains no secrets. The Supabase anon key is public by design; RLS is the boundary.
- **Dependencies.**
  - Expo packages are installed with `npx expo install` (versions in `07` §3).
  - Tooling packages are pinned exactly in the lockfile, to versions at least 14 days old at install time.
  - `npm ci --ignore-scripts` in CI wherever install scripts are not needed. `@sparticuz/chromium` needs none: it extracts its binary at runtime [V].

### 3.2 Data integrity

| Control | Detail |
|---|---|
| Schema checks | zod on device and in the pipeline; impossible values (negative counts, future dates) are rejected; the app keeps the last good copy |
| Hashes | `sha256` per file in the manifest; the app verifies after download, and a mismatch means the copy is discarded |
| Mirror check | Q8 (mirror sha must equal the direct sha) detects tampering of the fallback mirror; it is a fail, not a warning |
| Raw archive | the archive plus pure parsers mean any number can be re-derived from git |
| Code execution | the artifact contains only the inlined bundle; data files are JSON and are never executed; no `eval` is needed under the CSP [V] |

### 3.3 Threat model

| Threat | Mitigation |
|---|---|
| Compromised action or workflow edit publishes bad data | SHA pinning; CODEOWNERS on workflows and ingestion; QA gates; zod on device; the git history is the audit log |
| Mirror serves altered files | Q8 sha equality; direct source preferred |
| Someone impersonates the app (scam apps, fake screenshots) | Distinctive name "CAA Tracker — Ajuste Cubano (no oficial)"; free, no ads, stated in the app; share text carries the app name and data month; myth card "una captura de pantalla no prueba nada" |
| Seized or inspected phone | Data is the user's own; discreet mode; optional app lock (`expo-local-authentication`, v1.1) |
| Crowd poisoning (v1.1) | 3 rows per anonymous user; plausibility checks; evidence weights; benchmark gate; influence cap; crowd data never overrides official throughput |
| Scraping Supabase (v1.1) | No SELECT policy on other users' rows; aggregates computed only by the job with the service key |
| Re-identification (v1.1) | No receipt digits; month plus day offsets; state-level geography in public outputs; n ≥ 5 suppression |

## 4. Crowdsourced v1.1: the shared copy

The shared copy is stricter than doc 09 §6.3. The schema is in `02-data-model.md` §7.

- **Receipt:** the 3-letter prefix only. IOE digits are sequential (doc 04 §3.3), so 5 digits would narrow a filing to a small batch.
- **Dates:** the filing month plus day offsets from receipt. No absolute day dates.
- **Location:** state and office code only. No ZIP.
- **Never shared:** names, nickname, free text, USCIS status text, the hardship list, or the basic-docs checklist.
- **Consent:**
  - Explicit, versioned (`consent_version`) and listed field by field in the current language.
  - Changing the fields prompts again.
  - Opting out deletes the user's rows.
- **No GitHub-issue submission path.** It would publish personal timelines in a public repo.
- **Web artifact:** submission is impossible, because the CSP blocks the Supabase host. The artifact shows aggregates only and says "Disponible en la app móvil".

## 5. Legal boundaries (no legal advice)

1. **Disclaimers.** They are shown on S0, under every estimate, on the EAD screen, on the remedies screen, and in Más → Acerca de. The copy is in `00-product-spec.md` §8.
2. **No legal conclusions.** Class membership is phrased as "según la definición publicada por el tribunal (N.D. Cal. 3:26-cv-04850), su caso **parece** estar dentro de la clase", with the source. The eligibility notes say "según la ley y la práctica publicada", and cite the statute and the doc 16 §5 sources.
3. **No directives.**
   - Remedies and notifications are informational: "puede presentar…", "puede consultar…".
   - Never "presente ahora", "debe demandar" or "file now".
   - Every expedite and mandamus rung ends with "consulte a un abogado o representante acreditado".
   - The ladder never recommends travel or departure.
4. **Estimates.** They are labelled "estimación estadística", "no validada" and "confianza baja". The app never says "su caso será aprobado". The approval range is gated and never appears in a headline or in share text (`04` §8).
5. **Court characterisation.** "Un tribunal federal anuló (vacatur) la pausa" and never "inconstitucional" (doc 03 §12). Captions change (Noem → Mullin), so watchers and copy key on docket numbers.
6. **Anti-scam.** The permanent card reads "Nadie puede 'convertir' un I-220A en parole ni garantizarle una aprobación". Alerts about notario fraud are tagged [S-sec] and give their source.
7. **Spanish legal terms** follow doc 15 §8 and key facts §10. The register is **usted** (ADR-I18N-1).
8. **Review gate.** A native Cuban-Spanish reader reviews every `es` string before release. That covers `es.json`, the `Localized` fields in `curated/*`, the notification templates and the disclaimers. The reviewer checks register, clarity, and the absence of directive or conclusory wording. Their sign-off is recorded in the release PR.

## 6. Licensing and attribution

| Source | Status | What we do |
|---|---|---|
| USCIS data files | U.S. Government works, no copyright (doc 04 §0) | archive raw files; attribute "Fuente: USCIS" |
| `omairqazi29/visualizer` mirror | Used only as a sha-checked fallback; licence not reviewed [U] | do not redistribute its files; record `via` in the source |
| `jzebedee/uscis` | **No LICENSE file** (doc 13 §1.6) | derived fields only (months, inquiry dates, publication dates), with attribution; the week-0 issue asks permission; if refused, the office yardstick shows "no disponible" and the estimator is unaffected |
| Federal Register, CourtListener | Public API terms; CourtListener needs a free token | candidates only; never republish full documents |
| App code and data JSON | The owner chooses a licence in week 0 (suggest MIT for code, CC BY 4.0 for derived data) | `LICENSE` in `cuban-immigration-tracker/` |

## 7. Store compliance (doc 09 §7.2, R6–R9)

- **Identity.**
  - Name and icon carry no "USCIS", "DHS" or government seals.
  - "Independiente, no oficial" appears in the listing, on first run and in Settings.
- **Privacy policy:** in Spanish and English. It is linked in-app and from the store listings, and hosted with the artifact or in the repository.
- **MVP labels:** Apple privacy label "Data Not Collected"; Google Data safety "no data collected".
- **v1.1 labels:**
  - Apple: "Data Not Linked to You" (Other User Content; Identifiers: anonymous user ID).
  - Google: optional, deletable, encrypted in transit.
  - In-app account deletion, as Apple requires (doc 09 §7.1 #6).
- **Guidelines.**
  - Apple 4.3: the listing leads with the CAA-specific estimator, the Spanish-first UI and open data.
  - No hidden features (Apple 2.5.19, revision of 2026-10-16 [S per doc 09]).
  - No user-generated content (UGC) in the MVP, so Guideline 1.2 does not apply.
- **Accounts:** open the Apple ($99/yr) and Google ($25) developer accounts in week 0. Identity checks and Google's closed test take calendar weeks [T per doc 09 §9].

## 8. Incident response

| Incident | Response |
|---|---|
| Wrong number published | Revert the data commit (git); the next app refresh picks up the corrected sha; a curated alert explains the correction if users could have seen it |
| Wrong legal copy | Hot-fix the curated `content.json` or `alerts.json` (no app release needed); for UI strings, fix and ship through EAS build or an artifact republish |
| Leak of personal data in the repo | Stop; purge history (§2); notify the owner |
