# 09 — Mobile app technical stack: decision record

Written 2026-10-20 for the Cuban Immigration Tracker (CAA Tracker). Audience: a smart
non-lawyer who will build or review the app. This document decides *how* the app is
built and operated; *what* data it shows is covered by docs 04–07 and 12, and the
Expo-level details (exact package versions, router layout, SQLite API, notifications
API, Jest/Vitest setup, EAS commands) are already verified in
`docs/planning/expo-sdk58-implementation-notes.md` ("the SDK 58 notes"). This record
builds on those notes and does not restate or contradict them.

## 0. How to read this document (tags, limits)

Every factual claim carries one of three tags:

| Tag | Meaning |
|---|---|
| **[S]** | Stated in a web-search result seen today (2026-10-20); the URL is cited inline and listed in §13. |
| **[T]** | From training knowledge; plausible but **not confirmed today**. Re-check before relying on it in a contract, a budget or a store submission. |
| **[I]** | Inferred or designed by the author of this document from the facts above; a recommendation, not a fact. |
| **[N]** | Verified by command in the SDK 58 notes (scaffold run, same day). |

Limits of this research: the sandbox could not open uscis.gov, supabase.com, docs.github.com,
developer.apple.com or play.google.com directly, and the search budget was four queries
(Supabase free tier; GitHub Actions cron behaviour; Apple/Google policy — two queries). Where
the search summaries disagreed (Supabase backups, whether GitHub e-mails before disabling a
schedule) both versions are reported and the safer assumption is adopted.

Editor pass, 2026-10-20 (same day): two adversarial fact-checks were applied (§14). The editor had
two further searches (Expo EAS pricing; the October 2026 Apple guideline revision) plus
registry.npmjs.org and raw.githubusercontent.com lookups. "[S] per fact-check" marks a claim the
fact-checker saw in a search result today that the editor did not independently re-open.

---

## 1. Executive summary (the decisions)

| # | Decision | One-line reason |
|---|---|---|
| D1 | **Expo SDK 58 / React Native 0.88 / Expo Router / TypeScript 6**, versions exactly as pinned in the SDK 58 notes §1 [N] | Already verified to typecheck, lint, test and bundle; one codebase for iOS + Android (web optional). |
| D2 | **Zero-backend MVP**: a GitHub Actions scheduled job turns USCIS files into JSON snapshots, commits them to the repo and publishes them to GitHub Pages; the app fetches them with TanStack Query and caches them in expo-sqlite [I] | $0/month, no servers to patch, every published number is versioned in git (auditable — a feature for a "replace rumor with data" app). |
| D3 | **Static JSON is the only read path**, even later. The optional Supabase layer is **write-mostly** (users submit pseudonymous timelines; the Actions job aggregates them into the same static JSON) [I] | Keeps Supabase inside the free tier at 50k users (5 GB egress/month cap [S]), keeps the app fully functional offline, and keeps the trust boundary tiny. |
| D4 | **Supabase (Postgres + anonymous auth + RLS)** as the optional crowdsourcing layer, added only after the MVP ships [I] | Free tier is generous enough (500 MB DB, 50k MAU, unlimited API requests [S]); RLS lets each anonymous user edit/delete only their own rows [T]. |
| D5 | **Privacy by construction**: no names, no e-mail, no phone, no full receipt numbers off-device, dates bucketed in public aggregates, k-anonymity floor n ≥ 5, no third-party analytics/ads/AI SDKs [I] | Both stores require a privacy policy and (Google) a data-safety form [S]; Apple's privacy label "collect" definition is about data leaving the device [S]; the less we collect, the smaller the policy surface. |
| D6 | **Notifications in three tiers**: local (MVP, Expo Go) → background fetch + local (dev build) → Expo push (needs token storage in Supabase) [I] | Remote push does not work in Expo Go [N]; local notifications already cover the personal-milestone use cases. |
| D7 | **CI on GitHub Actions**: `expo install --check`, `tsc --noEmit`, `expo lint`, Jest (jest-expo), Vitest (pure TS), `expo export` smoke test; **EAS Build** on tags, **EAS Update** to a preview channel on `main` [N for commands, I for workflow shape] | Every command is already proven in the scaffold; public-repo Actions minutes are free [T]. |
| D8 | **Store positioning**: independent, unofficial, "not legal advice", no USCIS/DHS names or seals in the app name/icon, privacy policy + in-app "delete my data" even for anonymous accounts [S for the rules, I for the application] | Google's Deceptive Behavior policy bars impersonating or claiming affiliation with government entities [S]; Apple requires a privacy policy link in App Store Connect and in the app, and in-app account deletion when accounts exist [S]. |

Expected cost (details §9): **~$124 in year one at 0–1k users** (Apple $99/yr + Google $25 once, [T]) and **$0–$224/month at 50k users** depending only on whether EAS Update (Production plan, $199/month for ~50k MAU [S]) and Supabase Pro ($25/month) are adopted [S/T/I]. (The first draft said $0–$124; the $99 EAS figure was wrong — §9.)

---

## 2. Requirements that drive the architecture

Derived from the README and docs 04, 06, 07 and 12.

| Requirement | Consequence for the stack |
|---|---|
| Show national CAA volumes (received / approved / denied / pending / pending > 6 months / average months) from the monthly USCIS CSV, which has a dedicated `I-485 … (Cuban)` row (doc 04 §0) | A scheduled job that downloads a CSV/XLSX, parses it and emits JSON. Needs Python or Node with CSV/XLSX libraries — not something to do on the phone. |
| Show per-office / per-state processing times from the undocumented processing-times JSON, which sends no CORS headers, requires browser-like headers and cookies, and now sits behind Cloudflare / Next.js server actions (doc 04 §2.2–2.3) | The app must **never** call USCIS directly; a server-side job (or a mirror such as the `jzebedee/uscis` daily dataset, doc 04 §2.3) fetches it. |
| Personal estimate from filing date + state/office + milestones reached, with an honest confidence range | Estimator runs **on-device** in pure TypeScript (Vitest-testable, SDK 58 notes §7) with parameters shipped inside the JSON so they can be refitted monthly without an app release [I]. |
| Works for people with poor connectivity / prepaid plans; Spanish-first | Offline-first cache in SQLite; small JSON payloads (tens of KB); ETag/304 revalidation; i18n per SDK 58 notes §4. |
| Alerts when data, policy or court rulings change | `alerts[]` array in the JSON (curated by hand in the repo, reviewed via pull request) + notifications (§8). |
| Crowdsourced timelines later (doc 06 §8 schema) | A write path with ownership and deletion; aggregation server-side with suppression of small cells. |
| Reference case must be representable: I-485 filed March 2025, EAD September 2025, no decision as of October 2026 | Milestone model: receipt → biometrics → EAD (c09) → (RFE) → (interview) → decision; "no decision yet" is a first-class state (right-censored observation) for the estimator. |

---

## 3. Recommended architecture

### 3.1 Diagram (MVP = everything above the dashed line; Supabase = optional, below it)

```
                 USCIS public data (U.S. Government works, no copyright — doc 04 §0)
   ┌──────────────────────────┬──────────────────────────────┬─────────────────────────────┐
   │ monthly CSV              │ quarterly XLSX               │ processing-times JSON       │
   │ "Service-Wide Forms by   │ all-forms + I-485 by state   │ (undocumented, Cloudflare,  │
   │  Month"  I-485 (Cuban)   │ + I-765 by category          │  no CORS)  + jzebedee/uscis │
   └────────────┬─────────────┴───────────────┬──────────────┴──────────────┬──────────────┘
                │                             │                             │
                ▼                             ▼                             ▼
   ┌────────────────────────────────────────────────────────────────────────────────────────┐
   │  GitHub Actions  .github/workflows/data-refresh.yml                                    │
   │  schedule: "17 6 * * *" (UTC, off the top of the hour) + workflow_dispatch             │
   │  1. fetch sources (retry, fallback mirror)   2. parse (Python: pandas/openpyxl)        │
   │  3. validate against JSON Schema exported from the app's zod schemas                   │
   │  4. refit estimator parameters   5. merge curated alerts/                              │
   │  6. write data/snapshots/<period>.json (immutable) + data/manifest.json (mutable)      │
   │  7. git commit (counts as repo activity → keeps the 60-day schedule alive)             │
   │  8. actions/deploy-pages → GitHub Pages (CDN, HTTPS, ETag)                             │
   └───────────────────────────────────┬────────────────────────────────────────────────────┘
                                       │  https://<owner>.github.io/<repo>/data/manifest.json
                                       │  (fallback: raw.githubusercontent.com / jsDelivr)
                                       ▼
   ┌────────────────────────────────────────────────────────────────────────────────────────┐
   │  Expo SDK 58 app (iOS / Android; Expo Go for dev, EAS dev build for push)              │
   │                                                                                        │
   │   TanStack Query ──► fetch manifest (If-None-Match) ──► zod.parse ──► expo-sqlite      │
   │        ▲                                                       │   snapshots, offices,  │
   │        └──────── initialData / offline reads ◄─────────────────┘   alerts, params       │
   │                                                                                        │
   │   Estimator (pure TS, on-device)  ◄── params from JSON  ◄── user's own case (SQLite)   │
   │   Charts (react-native-gifted-charts)   i18n es/en   Local notifications               │
   │   expo-sqlite/kv-store: settings, language, last-seen manifest version                 │
   └───────────────────────────────────┬────────────────────────────────────────────────────┘
  - - - - - - - - - - - - - - - - - - -│- - - - - - - - - - - - - - - - - - - - - - - - - - -
   optional, phase 2                   │  INSERT/UPDATE/DELETE own rows only (RLS, anon auth)
                                       ▼
   ┌────────────────────────────────────────────────────────────────────────────────────────┐
   │  Supabase (free tier)  Postgres + Auth (anonymous sign-in) + RLS                       │
   │   case_timelines (owner_id = auth.uid(), masked receipt, state, office, milestone      │
   │                   dates, no free text in the shared copy)                              │
   │   push_tokens   (owner_id, expo_push_token, locale, topics[])                          │
   │   No client SELECT on raw tables. Aggregates are produced by the Actions job           │
   │   (service-role key in a GitHub secret) and published back into data/manifest.json.   │
   └───────────────────────────────────┬────────────────────────────────────────────────────┘
                                       │ new high-severity alert?  → read push_tokens →
                                       ▼ POST https://exp.host/--/api/v2/push/send (batches of 100)
                              Expo Push Service → APNs / FCM → phones
```

### 3.2 Why this shape

* **Static JSON as the only read path [I].** Reads are the expensive, abusable, always-on part of any backend. Serving them from GitHub Pages means there is no database to keep awake, no rate-limit to tune and no auth to get wrong for 95 % of users (who only read). It also means the app works with a plain HTTPS fetch and keeps working offline from SQLite.
* **Git as the audit log [I].** Every snapshot is a commit. Anyone can diff "what the app said on 2026-09-01" against "what USCIS published". For an app whose whole purpose is to replace rumor with data, that is a trust feature, not a byproduct.
* **The job runs where the tooling is [I].** Parsing USCIS XLSX/CSV and scraping a Cloudflare-fronted endpoint is a Python/Node job with retries, not phone work. GitHub Actions runners have both, and standard runners are free for public repositories [T].
* **Supabase only when there is user-generated data [I].** The crowdsourcing feature needs ownership (edit/delete my own entry) and server-side aggregation with suppression. Supabase gives Postgres + anonymous auth + row-level security on the free tier (500 MB database, 50,000 MAU, unlimited API requests [S]). Keeping it write-mostly keeps egress far under the 5 GB/month free cap [S].

### 3.3 Alternatives considered

| Option | Verdict | Why |
|---|---|---|
| Call USCIS endpoints from the phone | **Rejected** | No CORS, bot protection, cookie dance (doc 04 §2.2–2.3); would break for every user at once and could get the app's traffic blocked. |
| Firebase (Firestore + Cloud Functions) | Not chosen | Works, but the read path would again be a live database; Firestore pricing is per-read; Supabase's Postgres is a better fit for the aggregation SQL and keeps data exportable [T]. |
| Supabase only (pg_cron + pg_net + Edge Functions do the fetch) | Not chosen for MVP | Possible, but parsing XLSX inside Postgres/Deno is awkward, and Edge Function invocations are capped on the free tier (order of 500k/month [T]). Git history would be lost. Keep as a fallback if GitHub cron proves unreliable (§11). |
| Cloudflare Workers + KV/D1 | Not chosen | Good free tier [T] but a second platform to learn; GitHub Pages already provides a CDN. Revisit if GitHub Pages bandwidth (100 GB/month soft limit [T]) is ever approached. |
| Own VPS (PocketBase / Node) | Rejected | Patching, backups, uptime and a monthly bill for a volunteer project. |
| raw.githubusercontent.com as the production URL | Fallback only | Works and is reachable, but GitHub discourages using it as a CDN and caches for ~5 minutes [T]; GitHub Pages (or jsDelivr `cdn.jsdelivr.net/gh/<owner>/<repo>@main/...`, cached ~12 h for branch refs [T]) is the better primary. |
| EAS Update for every data change | Rejected | Data must change daily without an OTA bundle; EAS Update is billed by monthly active users (Free ≈ 1,000 MAU; Production $199/month for ~50,000 MAU [S], §9). Data goes through JSON; code goes through EAS Update/store releases. |

---

## 4. The data contract (JSON snapshots)

### 4.1 Files

```
data/
  manifest.json                 ← small (~2–5 KB), changes often; the app fetches only this first
  snapshots/2026-09.json        ← immutable once written; referenced by manifest
  snapshots/2026-10.json
  offices.json                  ← state ↔ field office map (doc 12), changes rarely
  alerts/2026-10-15-xxx.md      ← curated alert sources (reviewed via PR), compiled into manifest.alerts
  schema/manifest.schema.json   ← exported from src/lib/schema.ts (zod 4 → z.toJSONSchema [T])
```

### 4.2 Manifest shape (illustrative; zod is the source of truth)

```jsonc
{
  "schema_version": 1,
  "generated_at": "2026-10-20T06:21:14Z",
  "latest_snapshot": "snapshots/2026-10.json",
  "snapshots": [{ "period": "2026-10", "url": "snapshots/2026-10.json", "sha256": "…", "bytes": 48213 }],
  "sources": [
    { "id": "uscis_monthly_csv", "url": "https://www.uscis.gov/…/appropriation_requirement_august_2026_v1.0.csv",
      "retrieved_at": "2026-10-20T06:20:02Z", "sha256": "…", "published_period": "2026-08" },
    { "id": "processing_times", "url": "https://egov.uscis.gov/processing-times/", "retrieved_at": "…",
      "publication_date": "2026-10-15", "via": "jzebedee/uscis release 2026-10-15" }
  ],
  "national_monthly": [
    { "period": "2026-08", "form": "I-485", "subtype": "CAA", "received": 0, "approved": 0, "denied": 0,
      "pending": 0, "pending_over_6mo": 0, "avg_months": 0.0 }
  ],
  "quarterly_median_months": [ { "fy": 2026, "q": 3, "form": "I-485", "subtype": "CAA", "median_months": 0.0 } ],
  "by_state_quarterly": [ { "fy": 2026, "q": 3, "state": "FL", "office": "Hialeah", "category": "humanitarian",
      "received": 0, "completed": 0, "pending": 0 } ],
  "processing_times": [ { "office": "MIA", "form": "I-485", "subtype": "131A-FAM", "months_80pct": 0.0,
      "inquiry_date": "2023-06-17", "publication_date": "2026-10-15" } ],   // inquiry date per doc 04 §2.4 (2026-10-15 release); months_80pct is a placeholder
  "community_aggregates": [
    { "filing_month": "2025-03", "state": "FL", "milestone": "ead", "n": 12, "p25_days": 150, "p50_days": 180, "p75_days": 230 }
  ],
  "estimator_params": { "version": "2026-10-20", "regimes": [ { "name": "freeze", "from": "2025-02-14", "to": "2025-11-01" } ], "…": "…" },
  "alerts": [
    { "id": "2026-10-15-xxx", "date": "2026-10-15", "severity": "high",
      "title_es": "…", "title_en": "…", "url": "https://…", "topics": ["policy"] }
  ]
}
```

Rules [I]: numbers always carry the `source.id` they came from; `n < 5` community cells are **not emitted**; unknown fields are ignored by the client (`z.looseObject` / passthrough) so the job can add fields before the app knows them; a breaking change bumps `schema_version` and the app shows "update the app" instead of crashing. **The headline `pending` comes from `national_monthly` (monthly CSV) only**; `by_state_quarterly.pending` is shown only beside the quarterly median and labelled "quarterly workbook", because the two USCIS products disagree on Cuban pending by ~3–4 % (9–13k cases) at every quarter end (doc 04 §1.1) and the app must never show both unlabelled.

### 4.3 Client fetch and cache (TanStack Query + expo-sqlite)

```ts
// src/lib/manifest.ts  (sketch; mirrors SDK 58 notes §5 patterns)
export function useManifest() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: ['manifest'],
    staleTime: 6 * 60 * 60 * 1000,        // ask the network at most every 6 h
    networkMode: 'offlineFirst',          // serve cache when offline, refetch when online
    initialData: () => readManifestFromSqlite(db),            // hydrate from the last good copy
    queryFn: async () => {
      const etag = kv.getItemSync('manifest.etag');
      const res = await fetch(MANIFEST_URL, { headers: etag ? { 'If-None-Match': etag } : {} });
      if (res.status === 304) return readManifestFromSqlite(db);
      const parsed = ManifestSchema.parse(await res.json());  // zod 4
      await writeManifestToSqlite(db, parsed);                  // withExclusiveTransactionAsync
      kv.setItemSync('manifest.etag', res.headers.get('etag') ?? '');
      return parsed;
    },
  });
}
```

Snapshots referenced by the manifest are fetched lazily (only the periods the current screen needs) and stored in the `snapshots` table from the SDK 58 notes §5, extended with `source_id`, `sha256` and a `payload` JSON column [I].

---

## 5. The data-refresh job (GitHub Actions)

### 5.1 What today's search established about scheduled workflows

| Fact | Tag / source |
|---|---|
| GitHub disables scheduled workflows in a **public** repository after 60 days without repository activity; the "public" qualifier is often dropped when the rule is repeated, and private repos are not covered by that statement. | [S] https://steadycron.com/guides/github-actions-schedule-not-running/ ; https://zenn.dev/hellorusk/articles/fc6d4696f5b269?locale=en ; https://lastping.dev/monitor/github-actions-scheduled-disabled/ |
| Whether GitHub e-mails the workflow author before disabling is disputed between sources (one says yes but easy to miss; one says the disable itself sends no notification). | [S] https://cronjobpro.com/guides/monitor-github-actions-scheduled-workflows (the `/blog/…` path cited in the first draft could not be re-confirmed; this `/guides/…` page from the same site is what today's re-check returned) ; https://runhooks.app/blog/github-actions-scheduled-workflows-unreliable/ |
| Re-enabling works but the 60-day clock restarts. | [S] https://cronuru.com/guides/github-actions-scheduled-workflows |
| Cron runs can be late or dropped under load; the top of the hour is the worst time; a community guide reports a job late 30 nights in a row and then skipped once; minimum interval 5 minutes (third-party figures). | [S] https://dev.to/ji_ai/github-actions-cron-was-late-30-nights-straight-then-skipped-one-4751 ; https://runhooks.app/blog/github-actions-scheduled-workflows-unreliable/ |
| Keep-alive actions exist that push a tiny commit or re-enable the workflow before the 60-day cutoff. | [S] https://github.com/efrecon/gh-action-keepalive ; https://github.com/PhrozenByte/gh-workflow-immortality |
| The official docs page confirms the 60-day rule for **public** repositories and adds that scheduled workflows are **disabled by default in a fork** of a public repository; it says nothing about an e-mail notification before disabling. | [S] per fact-check: https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows |
| Standard GitHub-hosted runners are free for public repositories; the free plan gives private repos 2,000 minutes/month; a schedule only runs from the default branch; cron is evaluated in UTC. | [T] (docs.github.com, not reachable today) |

### 5.2 Design decisions for the job [I]

1. **Schedule off the top of the hour**: `cron: "17 6 * * *"` (06:17 UTC daily). USCIS publishes monthly/quarterly, so daily is already generous; the processing-times tool changes silently (doc 04 §2.1), so a second run `"17 18 * * *"` costs nothing on a public repo.
2. **The job's own commit is the keep-alive.** Committing `data/manifest.json` with `generated_at` every run is repository activity; add `efrecon/gh-action-keepalive` [S] as belt-and-braces, and a `workflow_dispatch` trigger for manual runs.
3. **Idempotent and no-op aware**: compare the downloaded files' SHA-256 to `manifest.sources[].sha256`; if nothing changed, only `generated_at` moves (commit message `data: heartbeat`, `[skip ci]`).
4. **Concurrency**: `concurrency: { group: data-refresh, cancel-in-progress: false }` so a late run and a manual run cannot interleave commits.
5. **Fallbacks**: USCIS portal → (if the processing-times transport fails) `jzebedee/uscis` daily release (doc 04 §2.3) → (if both fail) leave the previous snapshot in place and raise the `stale` flag. The app shows a "Datos de hace N días" banner when `generated_at` is older than 72 h. The mirror builds on `cron: '30 4 * * *'` UTC (`.github/workflows/build_db.yml`, read from raw.githubusercontent.com today [S]), so the 06:17 UTC run starts ~1 h 47 min after the mirror's build begins: **check that the latest release is dated today** before preferring the mirror over the previous snapshot, and let the 18:17 run pick it up otherwise.
6. **Staleness monitor**: a second tiny workflow (`"41 7 * * 1"`) checks `generated_at`; if > 7 days it opens a GitHub issue. Optionally register the URL with an external cron monitor (the kind in today's results) — free tiers exist [T].
7. **Permissions**: `permissions: { contents: write, pages: write, id-token: write }`; no other secrets for the MVP. For the Supabase phase, add `SUPABASE_SERVICE_ROLE_KEY` as a GitHub **environment** secret with required reviewers, used only by this job.
8. **Language**: Python 3.12 + `pandas` + `openpyxl` + `jsonschema` for the parsing job (XLSX/CSV tooling is stronger than in Node; pypi.org is reachable even from this sandbox); the JSON Schema it validates against is exported from the app's zod schema in CI, so both sides share one contract.
9. **Keep the app repo's history small [I]**: two data commits a day (manifest + snapshots) grow git history without bound. Decide at week 0 whether `data/` lives in a separate `caa-tracker-data` repository (or an orphan `data` branch served by Pages) so app clones and `actions/checkout` stay fast; R13's "one public repo" then becomes "one GitHub organisation", which is still a single place to hand over.

### 5.3 Workflow sketch

```yaml
# .github/workflows/data-refresh.yml
name: data-refresh
on:
  schedule: [{ cron: "17 6 * * *" }, { cron: "17 18 * * *" }]
  workflow_dispatch:
permissions: { contents: write, pages: write, id-token: write }
concurrency: { group: data-refresh, cancel-in-progress: false }
jobs:
  refresh:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-python@v7
        with: { python-version: "3.12" }
      - run: pip install -r pipeline/requirements.txt
      - run: python -I pipeline/refresh.py --out data --schema data/schema/manifest.schema.json
      - run: |
          git config user.name "caa-tracker-bot"; git config user.email "bot@users.noreply.github.com"
          git add data && git commit -m "data: refresh $(date -u +%F) [skip ci]" || echo "no changes"
          git push
      - uses: actions/upload-pages-artifact@v3
        with: { path: data }
  deploy:
    needs: refresh
    runs-on: ubuntu-latest
    environment: github-pages
    steps:
      - uses: actions/deploy-pages@v4
  keepalive:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: efrecon/gh-action-keepalive@v1   # [S] exists; pin a SHA in the real file
```

Action majors: `actions/checkout` 7.0.1, `actions/setup-python` 7.1.0 and `actions/setup-node` 7.1.0 are the current `main` versions per their `package.json` on raw.githubusercontent.com today [S] (the first draft's v4/v5 were two majors behind, on older Node runtimes); `upload-pages-artifact`/`deploy-pages`/`gh-action-keepalive` majors are [T]. Pin every action to the current major's commit SHA in the real workflow, not to a tag.

### 5.4 GitHub Pages serving facts

GitHub Pages sites have a 1 GB published-size limit, a 100 GB/month soft bandwidth limit and a soft limit of 10 builds per hour; content is served over HTTPS through a CDN with ETag support [T]. With a 5 KB manifest and 304 responses for unchanged content, 50k daily-active users cost roughly 50 000 × 30 × ~6 KB ≈ 9 GB/month, comfortably under the soft limit [I]. If the project ever approaches it, put jsDelivr or Cloudflare in front without changing the app (the base URL is a single constant).

---

## 6. Optional Supabase layer (crowdsourced timelines)

### 6.1 Free-tier facts seen today

| Limit | Value | Source |
|---|---|---|
| Database size | 500 MB per project | [S] https://www.itpathsolutions.com/supabase-free-tier-limits ; https://uibakery.io/blog/supabase-pricing |
| File storage | 1 GB | [S] https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/ |
| Egress / bandwidth | 5 GB (framed as database egress; some listings add a separate 5 GB cached egress) | [S] https://designrevision.com/blog/supabase-pricing ; https://www.stackrev.net/en/hosting-platforms/supabase-pricing |
| Over-limit behaviour | Fair Use / soft enforcement: writes rejected past 500 MB, bandwidth errors past 5 GB egress [S]. The first draft's "all services return **HTTP 402** until the billing period resets" was not found in the cited makerkit page on re-check and is **downgraded to [T]** — confirm on supabase.com/docs (Fair Use Policy) before relying on it | [S] https://uibakery.io/blog/supabase-pricing for soft enforcement; [T] for the 402 status code |
| Auth MAU | 50,000 | [S] https://dev.to/nayankyada/supabase-pricing-2026-free-tier-limits-compute-costs-when-to-upgrade-52af |
| Active free projects | 2 per account (paused ones do not count) | [S] https://nayankyada.com/blog/supabase-pricing-2026-free-tier-limits-compute-costs-when-to-upgrade |
| Inactivity pause | about 7 days idle → Postgres spun down; must be restored manually | [S] https://www.metacto.com/blogs/the-true-cost-of-supabase-a-comprehensive-guide-to-pricing-integration-and-maintenance |
| API requests | Unlimited | [S] https://uibakery.io/blog/supabase-pricing |
| Backups | **Conflicting**: "none / no PITR" vs "7-day snapshot" | [S] both found; assume **none** and export nightly from the Actions job [I] |
| Pro plan | $25/month: no pausing and Auth MAU raised to 100,000 [S] per fact-check; larger DB (8 GB), 250 GB egress, daily backups [T] | [S]/[T] as marked |

### 6.2 Why "write-mostly" matters here [I]

* The 7-day pause is a non-issue once the daily Actions job queries the project (that is activity). Before the job exists, the project will pause and the app's submit button would fail — so **ship the Actions aggregation step in the same release as the submit form**.
* Egress: if 50k users each read aggregates from Supabase once a day (~5 KB), that is ~7.5 GB/month → over the 5 GB cap [S] → Fair Use enforcement, i.e. bandwidth errors for everyone (whether the status code is 402 is [T], §6.1). Routing all reads through the static JSON drops Supabase egress to a few MB/month (one aggregation query per run).
* Database size: doc 06's schema is ~40 scalar fields; ~1 KB/row including indexes → 500 MB ≈ 400k rows. Even if 20 % of 50k users submit and update monthly, that is ~10k rows and a few MB.

### 6.3 Schema and RLS pattern (anonymous / pseudonymous users)

Supabase's **anonymous sign-in** (`supabase.auth.signInAnonymously()`) creates a real `auth.users` row with no e-mail or phone; the JWT carries `is_anonymous: true` and `auth.uid()` works in policies [T]. That is exactly the identity we want: stable per install, meaningless to anyone else.

```sql
-- supabase/migrations/0001_case_timelines.sql  [T for the Supabase idioms, I for the design]
create table public.case_timelines (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  consent_version  smallint not null,
  receipt_masked   text check (receipt_masked ~ '^[A-Z]{3}[0-9]{5}XXXXX$'),  -- prefix + 5 digits only
  entry_pathway    text not null check (entry_pathway in ('CHNV_parole','CFRP_parole','port_of_entry_parole','I220A_then_parole','other_parole','admitted_visa')),
  state            char(2) not null,
  field_office     text,
  filed_with_attorney boolean,
  i485_receipt_date date, biometrics_date date, ead_category text, ead_approved_date date,
  rfe_date date, interview_date date, decision_date date, decision text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- no free-text columns in the shared copy (notes stay on-device)  [I]

alter table public.case_timelines enable row level security;

create policy "insert own"  on public.case_timelines for insert to authenticated
  with check (owner_id = auth.uid());
create policy "update own"  on public.case_timelines for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "delete own"  on public.case_timelines for delete to authenticated
  using (owner_id = auth.uid());
create policy "select own"  on public.case_timelines for select to authenticated
  using (owner_id = auth.uid());
-- NO policy for the anon role; the client always signs in anonymously first.
-- NO policy that lets any user select other users' rows: aggregates are computed by the
-- Actions job with the service-role key (bypasses RLS) and published as static JSON.

-- rate limit: at most 3 rows per owner (one per family member), enforced by trigger  [I]
create or replace function public.limit_rows_per_owner() returns trigger language plpgsql as $$
begin
  if (select count(*) from public.case_timelines where owner_id = new.owner_id) >= 3 then
    raise exception 'too many entries';
  end if; return new;
end $$;
create trigger trg_limit before insert on public.case_timelines
  for each row execute function public.limit_rows_per_owner();

-- "delete my data" for anonymous users (no dashboard, no e-mail to verify)  [T pattern]
create or replace function public.delete_my_account() returns void
language sql security definer set search_path = public as $$
  delete from auth.users where id = auth.uid();
$$;
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
```

Aggregation (run by the job, not the client) [I]:

```sql
select date_trunc('month', i485_receipt_date)::date as filing_month, state,
       'ead' as milestone, count(*) as n,
       percentile_cont(0.25) within group (order by ead_approved_date - i485_receipt_date) as p25_days,
       percentile_cont(0.50) within group (order by ead_approved_date - i485_receipt_date) as p50_days,
       percentile_cont(0.75) within group (order by ead_approved_date - i485_receipt_date) as p75_days
from public.case_timelines
where ead_approved_date is not null and i485_receipt_date is not null
group by 1, 2 having count(*) >= 5;
```

Housekeeping [T/I]: anonymous users accumulate (every reinstall is a new user); schedule a weekly `delete from auth.users where is_anonymous and created_at < now() - interval '180 days' and id not in (select owner_id from case_timelines)` from the Actions job. Enable Supabase's built-in rate limiting on the anonymous sign-in endpoint and CAPTCHA if abuse appears [T].

### 6.4 Client usage

`@supabase/supabase-js ^2.118.0` is already in the SDK 58 notes' JS-only list (engines `node >=22.0.0` [S] registry.npmjs.org today). The `expo` 58.0.16 package itself declares `node ^22.13.0 || ^24.3.0 || ^26.0.0 || >=27.0.0` [S], so the CI Node floor is **22.13+**, driven by Expo as much as by supabase-js; `node-version: 22` in setup-node resolves to a current 22.x that satisfies both [N/S]. Store the session in `expo-sqlite/kv-store` through a small adapter (`getItem/setItem/removeItem`) instead of AsyncStorage [I]; `persistSession: true, autoRefreshToken: true, detectSessionInUrl: false`. The anon key and project URL are public by design (RLS is the security boundary) and live in `app.json` → `extra` [T].

---

## 7. Privacy design

### 7.1 Principles [I]

1. **Nothing that identifies a person leaves the phone.** No name, e-mail, phone, A-number, date of birth, photo, address or ZIP. State (needed for the estimate) yes; field office derived from state in-app (doc 12), optionally overridden by the user.
2. **Full receipt numbers never leave the phone.** The user may enter a receipt number for their own convenience (e.g. to copy it into Case Status Online); it is stored on-device only. The shared copy carries `receipt_masked` = prefix + first 5 digits + `XXXXX` (doc 06 §8.1), which identifies at most a batch of filings, not a person.
3. **Hash, don't store, when a token is needed.** On-device duplicate detection uses `SHA-256(install_salt ‖ receipt)` with a random per-install salt kept in kv-store; the hash is never uploaded. Cross-device de-duplication is deliberately **not** attempted (it would require a server-side keyed hash of the full receipt, i.e. uploading it in disguised form).
4. **Dates are precise on the user's own row, coarse everywhere else.** The estimator needs the exact filing date, but published aggregates bucket by month and suppress cells with n < 5.
5. **No third-party SDKs that phone home.** No analytics, no ads, no crash-reporting in the MVP (if crash reporting is ever added, scrub breadcrumbs and disable user context). No third-party AI services — Apple's November 2025 clarification of 5.1.2(i) requires disclosure and explicit permission before personal data goes to third parties including third-party AI [S] https://capgo.app/blog/how-to-pass-app-store-review-2026/.
6. **Deletion is one tap.** "Borrar mis datos" wipes SQLite + kv-store locally and, if the Supabase layer is enabled, calls `delete_my_account()` (cascades to the user's rows and push tokens). Apple requires in-app account deletion when the app supports account creation [S] https://www.whixframe.com/blog/app-store-privacy-policy-guide — an anonymous account is still an account, so treat it as one.
7. **Consent is explicit and versioned.** The submit form shows exactly which fields are shared and why; `consent_version` is stored with the row; changing the fields re-prompts.

### 7.2 What the stores will see

| Store artefact | MVP (static JSON only) | With Supabase layer |
|---|---|---|
| Apple privacy "nutrition label" | **Data Not Collected** — nothing is transmitted off-device except anonymous HTTPS fetches of public JSON; Apple's definition of "collect" is data transmitted off the device and kept longer than needed to service the request [S] https://blakecrosley.com/blog/app-review-what-reviewers-look-for-2026 | "Data Not Linked to You": Other Data (case milestones), Identifiers (anonymous user ID) — [I]; verify category wording in App Store Connect |
| Google Play Data safety form | required for every app regardless [S] https://www.forasoft.com/blog/article/how-to-get-you-app-approved-on-google-play-and-app-store ; declare "no data collected" | declare "App activity / other user-generated content", optional, deletable, encrypted in transit [I] |
| Privacy policy | required by both stores: a link in App Store Connect **and inside the app** [S] https://www.whixframe.com/blog/app-store-privacy-policy-guide ; Google: privacy policy link for every published app [S] | same, plus the data-sharing section |
| Where it is hosted | GitHub Pages: `/privacy/es/` and `/privacy/en/` (same site as the data) [I] | same |

### 7.3 Threat model in one table [I]

| Threat | Mitigation |
|---|---|
| Someone scrapes Supabase to list all submissions | No SELECT policy on raw tables for any client role; only the job's service-role key can read; the key lives in a GitHub environment secret. |
| Re-identification from aggregates | Month buckets, n ≥ 5 suppression, no free text, state-level geography. |
| A user's phone is seized/searched | The app never claims to be official; on-device data is the user's own; optional app lock via `expo-local-authentication` (in Expo Go [T]) in a later release. |
| Spam / fake timelines skewing the estimator | 3 rows per anonymous user; plausibility checks (decision before receipt etc. — doc 06 §8.1 `plausibility_flags`); aggregates use medians and trimmed quantiles; community data **validates** the official-data model rather than replacing it (doc 06 §9). |
| Supabase anon key leaked | It is public by design; RLS is the boundary; rotate if policies ever change. |
| Compromised GitHub Action publishes bad data | Branch protection on `main`; the data commit is made by the bot but the workflow file changes need PR review; pin actions to SHAs; the app validates with zod and refuses impossible values (negative counts, dates in the future). |

---

## 8. Notifications plan

| Tier | Needs | Works in Expo Go? | What it delivers |
|---|---|---|---|
| **A. Local notifications (MVP)** | `expo-notifications ~58.1.5` [N] | **Yes** [N] | Personal milestones computed on-device from the user's own case: "6 meses desde el recibo", "Tu caso ya pasó la fecha de consulta (case inquiry date) de tu oficina — puedes presentar un e-Request", "Tu EAD vence en 180/90 días (renueva ahora)", "Nuevo dato mensual disponible" (scheduled when the app learns from the manifest when USCIS usually publishes). Uses `SchedulableTriggerInputTypes.DATE`/`CALENDAR`, Android channel created before the permission prompt (SDK 58 notes §6). |
| **B. Background fetch + local notification** | `expo-background-task` (the SDK 53+ replacement for `expo-background-fetch`: iOS BGTaskScheduler, Android WorkManager; the OS decides when it runs, 15 min minimum, often much less often) [T] | Likely dev build only [T] | Periodically fetch `manifest.json`; if `alerts[]` has a new `severity: high` item or `latest_snapshot` changed, fire a local notification. No server, no tokens, but delivery is best-effort and silent for rarely-opened apps. |
| **C. Remote push (Expo Push Service)** | dev build + EAS project + FCM V1 / APNs key [N]; a `push_tokens` table (Supabase) and a sender (the Actions job) | **No** [N] | Reliable broadcast for policy/court alerts ("USCIS reanuda adjudicaciones…"), topic filters (policy / data / my-office), locale-specific text. Sender posts batches of ≤ 100 messages to `https://exp.host/--/api/v2/push/send`, then reads receipts and deletes tokens that return `DeviceNotRegistered` [T]. Expo's push service itself is free [T]. |

Rules [I]:
* Ask for permission **after** showing value (a screen that explains the three alert types); iOS only prompts once.
* Alerts are curated: a Markdown file in `data/alerts/` merged by pull request → the job compiles it into the manifest → tier B/C notify. No automated "USCIS changed a number" pushes; those are noisy and the processing-times tool changes silently several times a day (doc 04 §2.1).
* Deep links: notification `data.url` → `router.push` per SDK 58 notes §3.
* Tier C stores the Expo push token with `owner_id = auth.uid()`, `locale`, `topics[]`, `state`; the same RLS pattern as §6.3; tokens are deleted by `delete_my_account()` via cascade.

---

## 9. Cost model at 0 / 1 000 / 50 000 users

Assumptions [I]: "users" = monthly active; each opens the app ~30×/month; 20 % ever submit a timeline; manifest ~5 KB with ETag (most opens are 304s, ~1 KB); one snapshot ~50 KB fetched once per month per user.

| Line item | 0 users (building) | 1 000 users | 50 000 users | Tag / basis |
|---|---|---|---|---|
| Apple Developer Program | $99 / year | $99 / year | $99 / year | [T] |
| Google Play developer registration | $25 once | — | — | [T] |
| GitHub (public repo): Actions runners, Pages | $0 (free for public repos) | $0 | $0 (≈ 9 GB/month Pages egress, under the 100 GB soft limit) | [T] limits; [I] arithmetic |
| Expo EAS Build | $0 on the free plan (reported today as 15 Android + 15 iOS builds/month on a low-priority queue — one source, [S] per fact-check; a handful of builds/month is enough) | $0 | $0–19/month (Starter, $45 build credit [S]) if builds exceed the free cap | [S] cap figures (single sources); [T] otherwise |
| Expo EAS Update (OTA JS updates) | $0 (Free plan ≈ 1,000 MAU [S]) | $0 (at the edge of the free allowance; next step is Starter, $19/month ≈ 3,000 MAU [S]) | **$199/month** on the Production plan (≈ 50,000 MAU, $225 build credit; overage ≈ $0.005/MAU, egress ≈ $0.10/GiB [S]), **or $0 if OTA updates are skipped and code ships via store releases** | [S] https://www.metacto.com/blogs/the-true-cost-of-expo-app-development-a-comprehensive-guide ; https://checkthat.ai/brands/expo/pricing ; https://www.softwr.com/software/expo — two other results still print $99 for Production; $199 is the majority figure. The first draft's $99 was wrong. expo.dev/pricing not reachable; re-check at the phase gate |
| Expo Push Service | $0 | $0 | $0 | [T] |
| Supabase (write-mostly, see §6.2) | $0 (free project; pauses after ~7 days idle [S]) | $0 (≈ 200 rows) | $0 on free (≈ 10k rows, MB-scale egress) — **$25/month Pro recommended** for backups and no pausing | [S] limits; [T] Pro price |
| Domain (optional, for privacy policy / data URL) | $0–15 / year | same | same | [T] |
| **Total** | **≈ $124 year one, $0/month** | **≈ $99/year, $0/month** | **$0–$224/month + $99/year**, driven only by EAS Update ($199) and Supabase Pro ($25) | [I] |

Hidden costs that are not money [I]: an Apple organisation account needs a D-U-N-S number and is listed as required for government apps [S] https://appinstitute.com/app-store-review-checklist/ — this app is not a government app, but if the reviewer reads it as one, an individual account may be challenged; Google requires developer identity verification and (for new personal accounts) a closed test with real testers before production access [T]; both take calendar weeks — start them during Phase 2.

---

## 10. CI / CD

### 10.1 `ci.yml` (every push and pull request) — all commands verified in the SDK 58 notes §7–8 [N]

```yaml
name: ci
on: { push: { branches: [main] }, pull_request: {} }
jobs:
  app:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: app } }
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with: { node-version: 22, cache: npm, cache-dependency-path: app/package-lock.json }   # floor: expo needs node ^22.13 (or 24.3+/26/27+), supabase-js >= 22 [S npm]; "22" resolves to a current 22.x
      - run: npm ci
      - run: npx expo install --check            # dependency drift fails the build [N]
      - run: npx expo customize tsconfig.json && npx tsc --noEmit   # generates expo-env.d.ts / typed routes first [N]
      - run: npx expo lint
      - run: npx jest --ci
      - run: npx vitest run                      # pure-TS estimator/parsers in tests/unit/**/*.vitest.ts [N]
      - run: npx expo export --platform android  # Metro smoke test [N]
      - run: node scripts/export-schema.mjs      # zod → data/schema/manifest.schema.json; fail if it differs from the committed file [I]
  pipeline:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-python@v7
        with: { python-version: "3.12" }
      - run: pip install -r pipeline/requirements.txt
      - run: python -I -m pytest pipeline/tests   # parser tests against fixture CSV/XLSX files in docs/research/samples [I]
```

Notes [I]: Jest cold run was 27 s in the scaffold [N], so the whole job stays under ~5 minutes; `expo export` is the cheapest "does it still bundle" check; `expo-doctor` runs weekly, not per-PR, because it calls external services (SDK 58 notes §1).

### 10.2 `eas-build.yml` and `eas-update.yml` [I; commands N]

* **Build on tags**: `on: push: tags: ['v*']` → `npx eas-cli@latest build --platform all --profile production --non-interactive` with `EXPO_TOKEN` as a GitHub secret; `eas submit` is run manually the first few times.
* **Update on main**: `npx eas-cli@latest update --channel preview --environment preview --message "$GITHUB_SHA" --non-interactive` (`--environment` is required since SDK 55 [N]). Production channel updates only from tags.
* **`eas.json` profiles**: `development` (dev client, internal distribution), `preview` (internal, `channel: preview`), `production` (store, `channel: production`, `autoIncrement: true`).
* **Runtime version policy**: `"runtimeVersion": { "policy": "fingerprint" }` so an OTA update is never applied to a binary with a different native fingerprint [T].
* **EAS Workflows** (Expo's hosted CI) can replace both files later; GitHub Actions is used first because the data job is already there [I].

### 10.3 Branch and release discipline [I]

`main` is protected (CI green + one review). Data commits by the bot touch only `data/`; a CODEOWNERS rule requires review for `.github/workflows/**`, `pipeline/**` and `data/alerts/**`. Store releases are tags `vX.Y.Z`; the app shows `Constants.expoConfig.version` + `manifest.generated_at` on the Settings screen so support questions start with "which data are you seeing".

---

## 11. Risks and mitigations

| # | Risk | Likelihood / impact | Mitigation |
|---|---|---|---|
| R1 | Scheduled workflow silently disabled after 60 idle days in a public repo [S]; notification before disabling is disputed [S] | Medium / high (app shows stale data) | Job commits every run (activity); keep-alive action [S]; staleness monitor opens an issue; app shows a stale banner at 72 h. |
| R2 | Cron runs late or dropped under load [S] | High / low | Two daily runs; off-the-hour minute; idempotent job; nothing depends on exact timing. |
| R3 | USCIS changes file names, columns, or the processing-times transport (already moved to Next.js server actions behind Cloudflare, doc 04 §2.3) | High / medium | Parser tests on fixtures; schema validation fails loudly; fallback to `jzebedee/uscis` mirror; keep last good snapshot. |
| R4 | GitHub runner IPs blocked by Cloudflare on egov.uscis.gov | Medium / medium | Prefer the mirror for that one source; the monthly CSV/XLSX come from www.uscis.gov, a different host. |
| R5 | Supabase free project pauses after ~7 days idle [S] / egress overrun → Fair Use enforcement, bandwidth errors for all clients [S] (the exact status code, 402, is [T]) | Medium / high before the job exists; low after | Ship the aggregation step with the submit form; reads never hit Supabase; upgrade to Pro when the feature matters. |
| R6 | Store rejection: app read as claiming government affiliation (Google Deceptive Behavior policy [S] https://play.google.com/about/privacy-security-deception/deceptive-behavior/dishonest-behavior/ ; Apple organisation-account expectation for government apps [S]; Apple's 2026-06-08 revision of Guideline 4.3 (Spam) lets reviewers reject apps "indistinguishable from what is already widely available on the App Store" [S] per fact-check) | Medium / high | Listing and first screens lead with what generic case-tracker apps lack — the CAA-specific estimator, Spanish-first UI and versioned open data — so the 4.3 "indistinguishable" test is passed on sight; name without "USCIS/DHS"; no seals; "independiente, no oficial" on the store listing, first-run screen and Settings; privacy policy and disclaimer links; the official-government badge is only for vetted government apps in select countries [S] https://www.androidpolice.com/play-store-government-apps-look-more-official/ — never imitate it. |
| R7 | User-generated content obligations once timelines are crowdsourced (both stores expect moderation/reporting for UGC [T]; Apple's 2026-02-06 revision brought anonymous/random chat under Guideline 1.2 UGC [S] per fact-check) | Medium / medium | No free text in the shared data (structured fields only) — which also keeps the app outside the 1.2 chat/UGC moderation regime; server-side plausibility filters; a "report a problem with the data" link that opens a GitHub issue template. |
| R8 | Account-deletion requirement applied to anonymous accounts [S for Apple's rule] | Low / medium | `delete_my_account()` RPC + local wipe from day one of the Supabase phase. |
| R9 | Apple privacy label or Google data-safety form inaccurate after adding Supabase | Medium / medium | Update both in the same release; keep a checklist in `docs/planning/store-submission.md`. |
| R10 | Push notifications need a dev build; Expo Go cannot test them [N] | Certain / low | Tier A (local) ships first; tier C is a separate milestone with an EAS dev build. |
| R11 | Expo Go in the stores supports only one SDK; SDK 58 availability on a physical phone must be confirmed [N] | Low / low | Dev build via EAS if Expo Go lags. |
| R12 | Estimator over-promises (a 19-month pending case like the reference case is right-censored data; models trained on completed cases are biased optimistic) | High / high (trust) | Survival-analysis style estimator that uses pending cases; show ranges, not dates; label regimes (pre-freeze / freeze / post-vacatur, doc 06 §8); never say "you will be approved on". |
| R13 | Volunteer-maintainer bus factor | High / medium | Everything is in one public repo or organisation (data, pipeline, app, docs); no manual steps; a `MAINTAINERS.md` with the three secrets and where they live. Scheduled workflows are **disabled by default in a fork** of a public repo [S] per fact-check (docs.github.com, §5.1), so a successor who forks must re-enable `data-refresh.yml` and re-point the Pages base URL — write both steps into `MAINTAINERS.md`. |
| R14 | Supabase pricing/limits or EAS pricing change | Medium / low | All [T] figures in §9 are flagged; re-check before each phase gate. |

---

## 12. Dated timelines

### 12.1 Platform/policy facts referenced in this document

| Date | Event | Tag / source |
|---|---|---|
| 2025-07-10 | Google Play policy announcement adds a Help Center FAQ link to the Impersonation policy | [S] https://support.google.com/googleplay/android-developer/answer/16296680 |
| 2025 (year) | Google reports blocking 2.36 million policy-violating apps | [S] https://www.infosecurity-magazine.com/news/google-blocked-236-million-policy/ |
| 2025-11 | Apple updates Guideline 5.1.2(i): disclosure and explicit permission before sharing personal data with third parties, including third-party AI | [S] https://capgo.app/blog/how-to-pass-app-store-review-2026/ |
| 2026-02-06 | Apple App Review Guidelines revision: anonymous/random chat falls under Guideline 1.2 (UGC) | [S] per fact-check 2026-10-20 (Apple's own text not seen by the editor) |
| 2026-06-08 | Apple App Review Guidelines revision: 4.3 Spam tightened (apps "indistinguishable from what is already widely available" may be rejected); new 4.5.3 on Live Activities spam. **Not** the current version — the first draft wrongly called it that | [S] per fact-check 2026-10-20 ; https://developer.apple.com/app-store/review/guidelines/ |
| 2026-10-16 | **Current** revision of Apple's App Review Guidelines: 1.2 extended to nonconsensual intimate imagery including AI-generated; new 2.5.19 bans hidden, dormant or undocumented features (behaving differently after review); penalties reported as removal and, for bait-and-switch, Developer Program termination (secondary sources differ on wording) | [S] https://developer.apple.com/news/?id=92th7e5i ; https://9to5mac.com/2026/10/16/apples-new-app-store-rules-crack-down-on-ai-nudification-and-bait-and-switch-apps/ ; https://techcrunch.com/2026/10/19/apple-updates-guidelines-to-ban-nudify-apps-masquerading-as-regular-apps-to-pass-review/ |
| 2026-10-20 | SDK 58 notes verified in a scaffold (expo 58.0.16, RN 0.88, React 19.3, TS 6.0) | [N] |
| 2026-10-20 | This decision record; same-day fact-check and editor pass (§14) | — |

### 12.2 Proposed delivery timeline [I]

| Week (from Phase 3 start) | Milestone |
|---|---|
| 0 | Repo layout (`app/`, `pipeline/`, `data/`, `.github/workflows/`), `ci.yml` green on the scaffold from the SDK 58 notes. |
| 1–2 | `pipeline/refresh.py` parses the monthly CSV + quarterly XLSX from `docs/research/samples`; `data-refresh.yml` commits and deploys to Pages; manifest schema v1 exported from zod. |
| 2–3 | App: dashboard (national chart), estimate screen (on-device estimator, parameters from manifest), settings (language, delete data), offline cache. Local notifications (tier A). Start Apple/Google developer accounts and verification. |
| 4 | Internal EAS preview build; privacy policy pages; store listings drafted with the "unofficial" wording. Submit v1.0. |
| 5–6 | Supabase project, migrations from §6.3, submit form, aggregation step in the job, `delete_my_account`. Update privacy label / data-safety form. v1.1. |
| 7+ | Tier B/C notifications (dev build, push tokens), alert curation workflow, mandamus/e-Request helpers. |

---

## 13. Sources

### 13.1 Seen today via search (2026-10-20) — [S] claims cite these

Supabase free tier and pricing:
- https://uibakery.io/blog/supabase-pricing
- https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/
- https://dev.to/nayankyada/supabase-pricing-2026-free-tier-limits-compute-costs-when-to-upgrade-52af
- https://www.metacto.com/blogs/the-true-cost-of-supabase-a-comprehensive-guide-to-pricing-integration-and-maintenance
- https://makerkit.dev/blog/saas/supabase-pricing
- https://www.itpathsolutions.com/supabase-free-tier-limits
- https://designrevision.com/blog/supabase-pricing
- https://nayankyada.com/blog/supabase-pricing-2026-free-tier-limits-compute-costs-when-to-upgrade
- https://www.stackrev.net/en/hosting-platforms/supabase-pricing

GitHub Actions scheduled workflows:
- https://zenn.dev/hellorusk/articles/fc6d4696f5b269?locale=en
- https://dev.to/ji_ai/github-actions-cron-was-late-30-nights-straight-then-skipped-one-4751
- https://cronuru.com/guides/github-actions-scheduled-workflows
- https://lastping.dev/monitor/github-actions-scheduled-disabled/
- https://cronjobpro.com/guides/monitor-github-actions-scheduled-workflows (replaces the `/blog/github-actions-scheduled-workflows` path of the first draft, which could not be re-confirmed)
- https://steadycron.com/guides/github-actions-schedule-not-running/
- https://runhooks.app/blog/github-actions-scheduled-workflows-unreliable/
- https://github.com/efrecon/gh-action-keepalive
- https://github.com/PhrozenByte/gh-workflow-immortality

Apple App Store review and privacy:
- https://developer.apple.com/app-store/review/guidelines/
- https://appfollow.io/blog/app-store-review-guidelines
- https://capgo.app/blog/how-to-pass-app-store-review-2026/
- https://appinstitute.com/app-store-review-checklist/
- https://www.forasoft.com/blog/article/how-to-get-you-app-approved-on-google-play-and-app-store
- https://blakecrosley.com/blog/app-review-what-reviewers-look-for-2026
- https://www.whixframe.com/blog/app-store-privacy-policy-guide
- https://legal-kornet.com/blog/app-store-google-play-legal-requirements-2026-guide/
- https://nextnative.dev/blog/app-store-review-guidelines

Google Play policies:
- https://play.google.com/about/privacy-security-deception/deceptive-behavior/dishonest-behavior/
- https://support.google.com/googleplay/android-developer/answer/16296680
- https://support.google.com/googleplay/android-developer/answer/17517561?hl=en
- https://www.androidpolice.com/play-store-government-apps-look-more-official/
- https://www.infosecurity-magazine.com/news/google-blocked-236-million-policy/
- https://www.webpronews.com/googles-2025-android-app-policy-overhaul-safety-and-privacy-focus/
- https://www.apptester.co/blog/google-play-policies
- https://techobserver.in/news/business/google-unveils-new-play-store-policy-to-block-copycat-apps-on-the-play-store-267619/
- https://en.wikipedia.org/wiki/Keep_Android_Open (returned by the search; not used for any claim)
- https://en.wikipedia.org/wiki/Whoscall (returned by the search; not used for any claim)

Expo EAS pricing (editor pass, 2026-10-20):
- https://www.metacto.com/blogs/the-true-cost-of-expo-app-development-a-comprehensive-guide
- https://checkthat.ai/brands/expo/pricing
- https://www.softwr.com/software/expo
- https://stalliontech.io/expo-eas-update-pricing
- https://cadrant.ai/blog/eas-build
- https://rnpush.com/blog/expo-eas-pricing-explained
- https://www.applighter.com/blog/expo-eas-build-cost-calculator (prints $99 for Production — minority figure)
- http://www.soexpo.net/pricing.html (third-party page, prints $99 — minority figure)
- https://docs.expo.dev/billing/faq/ (cited by the fact-check; not reachable from this sandbox)

Apple App Review Guidelines, October 2026 revision (editor pass, 2026-10-20):
- https://developer.apple.com/news/?id=92th7e5i
- https://9to5mac.com/2026/10/16/apples-new-app-store-rules-crack-down-on-ai-nudification-and-bait-and-switch-apps/
- https://techcrunch.com/2026/10/19/apple-updates-guidelines-to-ban-nudify-apps-masquerading-as-regular-apps-to-pass-review/
- https://appleinsider.com/articles/26/10/17/generative-ai-porn-apps-targeted-in-app-review-guidelines-update
- https://ppc.land/apples-app-store-rules-now-require-apps-to-remove-ai-intimate-imagery/

Registry and raw-file lookups (editor pass and fact-check, 2026-10-20; these hosts are reachable from the sandbox):
- https://registry.npmjs.org/expo/latest (58.0.16, engines node ^22.13.0 || ^24.3.0 || ^26.0.0 || >=27.0.0)
- https://registry.npmjs.org/@supabase/supabase-js/latest (2.118.0, engines node >=22.0.0)
- https://raw.githubusercontent.com/jzebedee/uscis/main/.github/workflows/build_db.yml (cron `30 4 * * *`)
- https://raw.githubusercontent.com/actions/checkout/main/package.json (7.0.1) ; …/actions/setup-python/main/package.json (7.1.0) ; …/actions/setup-node/main/package.json (7.1.0)
- https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows ([S] per fact-check)

### 13.2 Project documents this record builds on
- `/home/user/Documents/cuban-immigration-tracker/README.md`
- `/home/user/Documents/cuban-immigration-tracker/docs/planning/expo-sdk58-implementation-notes.md` ([N] claims)
- `/home/user/Documents/cuban-immigration-tracker/docs/research/04-uscis-data-sources.md` (source matrix, processing-times transport)
- `/home/user/Documents/cuban-immigration-tracker/docs/research/06-community-and-third-party-data.md` (§8 crowdsourced schema, §9 validation role)
- `/home/user/Documents/cuban-immigration-tracker/docs/research/12-field-offices-states-and-geography.md` (state ↔ office map)

### 13.3 Primary pages to verify the [T] claims (not reachable from this sandbox today)
- https://supabase.com/pricing ; https://supabase.com/docs/guides/auth/auth-anonymous ; https://supabase.com/docs/guides/database/postgres/row-level-security
- https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows (the 60-day auto-disable rule and the forks-disabled-by-default rule live here — [S] per fact-check; use this page for §5.1, not the `events-that-trigger-workflows#schedule` anchor the first draft cited, which still exists but covers cron syntax rather than the disable rule) ; https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule (cron syntax, default-branch rule) ; https://docs.github.com/en/billing/managing-billing-for-github-actions/about-billing-for-github-actions ; https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages#usage-limits
- https://expo.dev/pricing ; https://docs.expo.dev/push-notifications/sending-notifications/ ; https://docs.expo.dev/versions/v58.0.0/sdk/background-task/
- https://developer.apple.com/app-store/review/guidelines/#privacy (5.1.1, 5.1.2) and #design (4.1) ; https://developer.apple.com/support/offering-account-deletion-in-your-app/
- https://support.google.com/googleplay/android-developer/answer/9888076 (User Generated Content) ; https://support.google.com/googleplay/android-developer/answer/13327111 (account deletion) ; https://support.google.com/googleplay/android-developer/answer/10787469 (Data safety)

---

## 14. Verification notes (editor pass, 2026-10-20)

Two adversarial fact-checks reviewed the first draft the same day it was written. What changed:

| # | Finding | Verdict | Edit |
|---|---|---|---|
| 1 | EAS Update plan with ~50k MAU costs **$199/month** (Production), not $99; Starter is $19/month ≈ 3,000 MAU | **Accepted** — confirmed by the editor's own search today (majority of results: metacto, checkthat.ai, softwr, cadrant, rnpush; two minority results still print $99) | §1 summary, §3.3, §9 EAS rows and total (50k users now **$0–$224/month**), §13.1 |
| 2 | Apple's current App Review Guidelines revision is **2026-10-16** (1.2 AI-generated NCII; new 2.5.19 hidden features), not 2026-06-08 | **Accepted** — confirmed by the editor via Apple's developer-news post and 9to5Mac/TechCrunch | §12.1 now lists 2026-02-06, 2026-06-08 and 2026-10-16; R6 and R7 carry the 4.3 "indistinguishable" and 1.2 UGC consequences |
| 3 | Supabase "HTTP 402 for all services" over-limit behaviour is not in the cited makerkit page | **Accepted** — downgraded to [T]; soft enforcement (writes rejected past 500 MB, bandwidth errors past 5 GB) kept as [S] | §6.1, §6.2, R5 |
| 4 | `actions/checkout@v4` / `setup-python@v5` are two majors behind (current 7.0.1 / 7.1.0; setup-node 7.1.0) | **Accepted** — confirmed by the editor from each repo's `package.json` on raw.githubusercontent.com | §5.3 and §10.1 sketches now say `@v7`; note under §5.3 |
| 5 | Illustrative manifest row contradicted doc 04 §2.4 (MIA 131A-FAM inquiry date 2023-06-17, release 2026-10-15) | **Accepted** — doc 04 lines re-read by the editor | §4.2 values aligned and marked placeholder |

Dead/wrong URLs: the cronjobpro `/blog/…` path was replaced by the `/guides/…` page the re-check returned (§5.1, §13.1); the docs.github.com citation for the 60-day rule now points at the `disable-and-enable-workflows` how-to page (§5.1, §13.3).

Added from the fact-check's "missing points", each tagged: Node floor is driven by `expo` (engines `^22.13.0 || ^24.3.0 || ^26.0.0 || >=27.0.0`, [S] npm) — §6.4, §10.1; `jzebedee/uscis` builds at 04:30 UTC, so the 06:17 run must check the release date ([S] raw file) — §5.2 item 5; scheduled workflows are disabled by default in forks ([S] per fact-check) — §5.1, R13; Supabase Pro raises Auth MAU to 100,000 ([S] per fact-check) — §6.1; headline `pending` must come from the monthly CSV only (doc 04 §1.1) — §4.2 rules; git-history growth from daily data commits ([I]) — §5.2 item 9; EAS Build free cap reported as 15 + 15 builds/month (single source, [S] per fact-check) — §9.

Unchanged after review (the fact-check agreed with the draft's stance): Supabase free-tier backups still conflict between sources — keep "assume none"; whether GitHub e-mails before auto-disabling a schedule remains unresolved (the official page is silent) — keep the "assume no notice" design; the Apple 5.1.2(i) November 2025 change rests on secondary sources only (capgo, appfollow) and keeps its [S] tag with that caveat; the monthly USCIS CSV URL pattern is supported by doc 04 §1.1 (VERIFIED-FILE), not by today's search, which surfaced only the quarterly workbook.

### Open questions (not resolvable from this sandbox today)

1. Exact Supabase Fair Use enforcement on the Free plan (status code, which services) — read `supabase.com/docs` Fair Use Policy before writing the R5 runbook.
2. Expo pricing straight from `expo.dev/pricing` / `docs.expo.dev/billing/faq/` (Production $199 vs the two $99 results; EAS Build free cap of 15 + 15 builds/month seen in one source only).
3. Apple's own text of the 2026-02-06, 2026-06-08 and 2026-10-16 revisions (secondary sources differ on 2.5.19's penalty wording) and of the November 2025 5.1.2(i) change.
4. Whether GitHub notifies the workflow author before auto-disabling a schedule (official page silent; secondary sources disagree).
5. GitHub Pages limits (1 GB, 100 GB/month soft, 10 builds/hour) and the 2,000 private-repo minutes — still [T].
6. `expo-background-task` minimum interval and Expo Go support (npm confirms 58.0.11 exists for SDK 58; behaviour not searched).
7. Google Play personal-account closed-test requirement and the $25 one-time fee — still [T].
8. Current majors of `actions/upload-pages-artifact`, `actions/deploy-pages` and `efrecon/gh-action-keepalive` (not checked; pin SHAs regardless).
