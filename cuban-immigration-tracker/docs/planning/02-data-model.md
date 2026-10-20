# 02 — Data model (final)

Written 2026-10-20. **`packages/data-schemas` is the source of truth.** It holds zod schemas with inferred TypeScript types. The types below are the contract; WP-SCHEMA writes them as zod first. JSON Schema files are exported from zod into `data/schema/*.schema.json`, and CI fails on drift. Every user-facing string inside a data file is `Localized` (`{ en, es }`), with no exceptions. That includes sub-breakpoint events, alert bodies, regime labels and litigation status (this closes the data-rigor i18n hole).

## 1. Primitives

```ts
// packages/data-schemas/src/primitives.ts
export type ISODate = string;      // "2026-10-20"           z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
export type YearMonth = string;    // "2026-08"              z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)
export type ISODateTime = string;  // "2026-10-20T06:17:04Z"
export type Lang = 'es' | 'en';
export interface Localized { es: string; en: string }                 // both non-empty (CI)
export type Evidence = 'F' | 'S' | 'S-sec' | 'T' | 'I' | 'U' | 'V';   // V = verified by a command
export interface FiscalQuarter { fy: number; q: 1 | 2 | 3 | 4 }       // FY = Oct 1 – Sep 30

export type StatisticKind =
  | 'count_flow'                 // received/approved/denied in a period
  | 'count_stock'                // pending at period end
  | 'count_stock_over_6mo'       // pending > 6 months
  | 'mean_months_completed'      // monthly CSV "Avg. Processing Time" (doc 04 §1.1)
  | 'median_months_completed'    // quarterly workbook / historic-pt (doc 04 §1.2, §2.6)
  | 'p80_months_completed_6mo'   // Processing Times tool headline (doc 04 §2.1)
  | 'inquiry_date_p93'           // tool "receipt date for a case inquiry" (~93rd pct [S] data-rigor search)
  | 'share'                      // approvals / completions
  | 'model_probability';         // our estimate (never official)

export type SourceId =
  | 'uscis.monthly_csv' | 'uscis.quarterly_all_forms' | 'uscis.i485_by_office' | 'uscis.portal_index'
  | 'mirror.visualizer' | 'mirror.jzebedee' | 'uscis.historic_pt' | 'fr.api' | 'courtlistener.v4'
  | 'uscis.rss' | 'curated' | 'bundled_sample';

export interface SourceRef {          // attached to every row / record
  sourceId: SourceId;
  url: string;                        // exact URL fetched, or citation URL for curated
  via: 'direct' | 'mirror.visualizer' | 'mirror.jzebedee' | 'curated';
  period?: YearMonth | FiscalQuarter | ISODate;
  retrievedAt: ISODateTime;           // ORIGINAL retrieval time (carried forward when a source is blocked)
  sha256?: string;                    // of raw bytes
  evidence: Evidence;
}
```

`FIELD_KINDS` is a constant map exported by data-schemas. It gives each numeric field's statistic kind, population and unit, for example `national.rows[].avgMonths → { kind: 'mean_months_completed', population: 'completed', unit: 'months' }`. The UI `StatTile` takes `(value, fieldKey, period, sourceRef)` and renders the kind chip from this map. This keeps rows plain (no `Observation<V>` wrappers everywhere) while still making sure no number is shown without its kind (judge note on the data-rigor burden).

## 2. Published snapshot files (`cuban-immigration-tracker/data/`)

| File | Type | Writer | Approx. size |
|---|---|---|---|
| `manifest.json` | `Manifest` | pipeline | ≤ 5 KB |
| `national.json` | `NationalFile` | pipeline | ~10 KB |
| `quarterly.json` | `QuarterlyFile` | pipeline (+ curated historic medians) | ~6 KB |
| `offices.json` | `OfficesFile` | pipeline | ~40 KB |
| `policy.json` | `PolicyFile` | copied from `curated/policy.json` (PR-reviewed) | ~25 KB |
| `alerts.json` | `AlertsFile` | copied from `curated/alerts/*.json` (PR-reviewed) | ~20 KB |
| `content.json` | `ContentFile` | copied from `curated/content.json` (myths, glossary additions, peer-reason copy) | ~15 KB |
| `params.json` | `EstimatorParams` | pipeline (fit) | ~8 KB |
| `community.json` | `CommunityFile` | pipeline (v1.1) | — |
| `forecasts/<YYYY-MM>.json` | `ForecastLedgerEntry` | pipeline (v1.1; append-only) | ~5 KB each |
| `scorecard.json` | `Scorecard` | pipeline (v1.1) | ~3 KB |
| `candidates/alert-candidates.json` | `AlertCandidate[]` | pipeline (never shown in app) | — |
| `raw/<sourceId>/<period>/<file>` + `.meta.json` | raw bytes + `RawMeta` | pipeline (USCIS public-domain files only; jzebedee DB **not** stored) | CSV 3.6 KB, XLSX ≤ 0.8 MB |
| `quarantine/<runId>/` | failed attempt + QA report | pipeline | pruned after 30 days |
| `schema/*.schema.json` | JSON Schema exported from zod | CI | — |
| `curated/**` | human-edited inputs | PR (CODEOWNERS) | — |

The app bundles a **frozen copy** of `manifest/national/quarterly/offices/policy/alerts/content/params` in `app/src/data/sample/`. `npm run data:sample` copies them, and `sample/manifest.json` gets `"origin": "bundled_sample"`.

### 2.1 Manifest

```ts
export interface Manifest {
  schemaVersion: 1;                              // integer; app refuses unknown → "Actualice la app"
  minAppVersion: string;                         // semver; app older → keep old data + banner
  dataChangedAt: ISODateTime;                    // last time ANY data file content changed (drives "datos nuevos")
  lastCheckedAt: ISODateTime;                    // last committed pipeline check (heartbeat ≤ 7 d)
  generatedBy: { runId: string; ref: string; sha: string };   // GITHUB_RUN_ID, branch, commit
  latestOfficialMonth: YearMonth;                // "2026-08"
  latestOfficialQuarter: FiscalQuarter;          // {fy:2026,q:3}
  latestProcessingTimesPublication: ISODate | null;
  files: Record<DataFileName, { path: string; sha256: string; bytes: number }>;
  sources: SourceStatus[];
  qa: { status: 'ok' | 'degraded' | 'quarantined'; lastGoodRunId: string; notes: Localized[] };
  canary: { caseId: 'T15'; pWithin12: number; q50: number | null; computedWith: 'VPH-1.1' };
  artifactBuiltAt?: ISODateTime;                 // ONLY in web-artifact/data/manifest.json (set by build-artifact)
  origin?: 'pipeline' | 'bundled_sample';
}
export type DataFileName = 'national' | 'quarterly' | 'offices' | 'policy' | 'alerts' | 'content' | 'params' | 'community';
export interface SourceStatus {
  id: SourceId; url: string;
  status: 'ok' | 'not_modified' | 'not_yet' | 'blocked_cloudflare' | 'blocked_drupal_antibot'
        | 'http_error' | 'network_error' | 'schema_mismatch' | 'skipped_no_secret' | 'fallback_used' | 'quarantined';
  lastSuccessAt?: ISODateTime; publishedPeriod?: string; sha256?: string; note?: string;
}
```

### 2.2 National monthly (`national.json`)

```ts
export interface MonthlyRow {           // "I-485 ... (Cuban)" row; doc 04 §1.1 [F]
  ym: YearMonth;
  received: number; approved: number; denied: number;          // count_flow
  pending: number;                                             // count_stock — HEADLINE pending
  pendingOver6: number | null;                                 // count_stock_over_6mo (null before it exists)
  avgMonths: number | null;                                    // mean_months_completed
  revision?: { previous: Omit<MonthlyRow, 'revision' | 'source'>; detectedAt: ISODateTime };  // Q3 gate
  source: SourceRef;
}
export interface I765NationalRow {      // one national line, ALL categories (no (c)(9) split) — doc 04 §1.1
  ym: YearMonth; received: number; approved: number; denied: number; pending: number; avgMonths: number | null;
  caveat?: 'cxi_status_flips_2025_03_04';                      // footnote 12, Mar–Apr 2025 distortion
  source: SourceRef;
}
export interface NationalFile { rows: MonthlyRow[]; i765National: I765NationalRow[]; firstModelMonth: YearMonth /* "2024-09" */ }
```

Seed rows run Jul 2024 and Sep 2024 → Aug 2026. **Aug 2024 is absent from the mirror** (doc 04 §1.0). The model uses Sep 2024 onward, the first month with `pendingOver6` usable for the legacy split (doc 08 §5.3).

### 2.3 Quarterly (`quarterly.json`)

```ts
export interface QuarterRow {
  quarter: FiscalQuarter;
  form: 'I-485 (Cuban)' | 'I-765 (Adjustment Of Status)' | 'I-765 (All Other)' | 'I-485 (Refugee)' | 'I-485 (Asylum)';
  received: number; approved: number; denied: number; completions: number;
  pendingWorkbook: number;               // count_stock, label "informe trimestral" — NEVER headline (≈3–4 % below monthly)
  medianMonths: number | null;           // median_months_completed
  fytd?: { received: number; approved: number; denied: number; completions?: number };
  source: SourceRef;
}
export interface HistoricMedian {        // curated from historic-pt via press [S-sec] (doc 04 §2.6)
  fy: number; months: number; cutDate: ISODate | null; fyToDate: boolean;   // FY2026 11.8 @2026-07-31; 12.3 @2026-08-30
  sourceUrl: string; evidence: Evidence;
}
export interface ApprovalBaseline {      // computed by pipeline from QuarterRow / MonthlyRow
  label: Localized; numerator: number; denominator: number; share: number; period: string; kind: 'share';
}
export interface QuarterlyFile { rows: QuarterRow[]; historicMedians: HistoricMedian[]; approvalBaselines: ApprovalBaseline[] }
```

### 2.4 Offices and processing times (`offices.json`)

```ts
export interface Office {
  code: string;                          // READ from data (mirror offices table / workbook), never hard-coded (KEN vs KND)
  name: string; state: string;           // 2-letter; from the by-office workbook state heading (doc 04 §1.3 [F])
  cubanFocus: boolean;                   // key facts §6 list
  kind: 'field_office' | 'service_center';
}
export interface ProcessingTimeRecord {  // via jzebedee/uscis SQLite (doc 13 §1.2, §1.6)
  form: 'I-485' | 'I-765';
  subtype: '131A-FAM' | '147-C9' | '147-C11' | string;
  officeCode: string;                    // field office, or NBC / SCD
  months80: number | null;               // p80_months_completed_6mo; parser accepts 1- or 2-value ranges (doc 13 §1.1)
  monthsLowerLegacy?: number | null;     // second range value if present (pre-2025 format)
  inquiryDate: ISODate | null;           // inquiry_date_p93 (service_request_date)
  publicationDate: ISODate;
  isProxyForCaa: boolean;                // true for 131A-FAM (no CAA subtype exists — doc 13 §1.3)
  source: SourceRef;                     // retrievedAt = original retrieval (stale dates are labelled)
}
export interface OfficeQuarterStat {     // "Humanitarian-based" = Cuban + Refugee + Asylee exactly (doc 04 §1.3 [F])
  officeCode: string; quarter: FiscalQuarter;
  received: number | null; approved: number | null; denied: number | null; pending: number | null;
  suppressed: boolean;                   // 'D' cells before FY25 Q3
  source: SourceRef;
}
export interface OfficesFile {
  offices: Office[];
  stateOffices: Record<string, string[]>;            // state → office codes (from workbook headings)
  processingTimes: ProcessingTimeRecord[];
  quarterly: OfficeQuarterStat[];
  inquiryDateHistory: { officeCode: string; subtype: string; points: { publicationDate: ISODate; inquiryDate: ISODate }[] }[];  // for the crude ETA (doc 15 §2.2)
}
```

### 2.5 Policy, regimes, scenarios, litigation (`policy.json`, curated)

```ts
export type EntryChannel =
  | 'CHNV' | 'CBP_ONE' | 'FRP_CFRP' | 'U4U' | 'OTHER_PAROLE' | 'VISA'
  | 'I220A' | 'EWI' | 'CONDITIONAL_PAROLE_236' | 'UNKNOWN';          // key facts §1 + 236 + UNKNOWN
export type RegimeId = 'R0' | 'R1' | 'R2' | 'R3' | 'R4';

export interface Regime {                           // key facts §3 JSON, verbatim dates
  id: RegimeId; label: Localized;
  start: ISODate | null; end: ISODate | null;       // operational defaults (R1 2025-02-14→2025-06-09; R3 2025-12-02→2026-06-12)
  hold: boolean;
  appliesTo: (EntryChannel | 'ALL_CUBAN')[];        // R1: CHNV, FRP_CFRP, U4U ; R3: ALL_CUBAN
  lowConfidenceExempt?: EntryChannel[];             // R1: ['CBP_ONE'] (doc 16 §3)
  altEnds?: { legal?: ISODate; judgment?: ISODate; ops?: ISODate[] };   // R1 legal 05-28, ops 06-19/06-25; R3 legal 06-05, ops 07-16
  instruments: { id: string; date: ISODate; appliesToCaa: boolean | null; confidence: 'high' | 'likely' | 'low'; sourceUrl: string }[];
  suspendedBy?: { id: 'DORCAS_VACATUR' | 'RED_EAGLE_PI' | string; date: ISODate; court: string; docket: string }[];
}
export interface SubBreakpoint {                    // key facts §3 sub_breakpoints — Localized (i18n fix)
  date: ISODate; event: Localized;
  kind: 'policy' | 'court' | 'ead' | 'fees' | 'enforcement' | 'forms';
  effect: 'copy' | 'approval_card' | 'scenario' | 'eligibility';
}

export type ScenarioPath =
  | { kind: 'flat'; level: number }
  | { kind: 'ramp'; from: number; to: number; months: number }
  | { kind: 'freezeThen'; freezeMonths: number; then: 'S1' };      // re-anchored at last data month (04 §6.2)
export interface ScenarioDef {
  id: 'S0' | 'S1' | 'S2' | 'S3'; label: Localized; prior: number;  // 0.30 / 0.40 / 0.15 / 0.15 (doc 08 §8.2)
  path: ScenarioPath;
  anchorMonth: YearMonth;                             // "2026-08": k = 1 is 2026-09 for S0–S2
  likelihoodUpdated: boolean;                         // true S0–S2; false S3 (alert-only)
}

export interface AlertRule {                          // deterministic composition (04 §6.3)
  ruleId: 'DORCAS_AFFIRMED' | 'DORCAS_REVERSED' | 'FIRST_CIR_STAY_BENEFITS_HOLD' | 'RED_EAGLE_DISSOLVED'
        | 'NEW_HOLD_MEMO_CUBA' | 'AAUP_RELIEF_DENIAL_POLICY' | string;   // COMPLETIONS_GE_2000 retired (04 §6.3)
  effects: { scenario: 'S0' | 'S1' | 'S2' | 'S3'; factor: number;
             condition?: 'always' | 'redEagleProtects' | 'redEagleNotProtecting' | 'dorcasPending' }[];
  approvalCardFlag?: 'reestimate';
}

export interface LitigationCase {
  id: string; caption: string;                        // display only; watchers key on docket numbers (Noem → Mullin)
  court: string; docket: string; courtListenerId?: number; clearinghouseId?: number;
  status: Localized; statusAsOf: ISODate; whatWouldChange: Localized; ruleIds: string[];
}

export interface PolicyFile {
  version: string; reviewedAt: ISODate;
  regimes: Regime[]; subBreakpoints: SubBreakpoint[];
  scenarios: ScenarioDef[]; alertRules: AlertRule[]; litigation: LitigationCase[];
  litigationState: {                                  // curated; drives AlertRule conditions (04 §6.3)
    dorcas: 'vacatur_in_force_appeal_pending' | 'affirmed' | 'reversed';   // today: vacatur_in_force_appeal_pending
    redEagle: { piInForce: boolean };                                      // today: true
    asOf: ISODate;
  };
  classes: {                                          // facts needed for "appears to be in the class" copy
    redEagle: { notFinallyAdjudicatedOn: '2026-08-24'; docket: '3:26-cv-04850-CRB' };
    doeDhs: { channel: 'CBP_ONE'; paroleFrom: '2023-05-15'; paroleTo: '2025-01-19'; windowStartUncertain: true; docket: '1:25-cv-12245' };
    frpCarveout: { i485PendingBy: '2025-12-15'; fr: '2025-22744' };
  };
  cohort: { chnvCubans: 110240; cbpOneCubans: { central: 100000; low: 70000; high: 130000; confidence: 'low' } };
  approval: { cleanPrior: { low: 0.70; high: 0.90 }; requiresBasicDocs: true;
              unmodelledFactors: Localized[] };       // criminal/inadmissibility, prior orders, I-220A misclass., parole-history factor, stale I-693
  ead: { fiveYearIfIssuedBefore: '2025-12-05'; eighteenMonthsFrom: '2025-12-05'; noAutoExtensionIfRenewalFiledOnOrAfter: '2025-10-30'; finalRule: '2026-10-14' };
  pa202605: { effective: '2026-08-05'; rfeMaxDays: 84; noidDays: 30; noidMailDays: 3 };
  fees: { form: string; usd: number; since: ISODate; note: Localized; source: string }[];   // key facts §4
  congressionalOffices: { state: string; district: string; name: string }[];                 // FL-26/27/28 (doc 15)
}
```

### 2.6 Alerts (`alerts.json`, curated; one JSON per alert in `curated/alerts/`)

```ts
export interface Alert {
  id: string;                                   // "2026-08-05-pa-2026-05"
  date: ISODate;
  kind: 'policy' | 'court' | 'data' | 'fees' | 'enforcement' | 'ead' | 'scam' | 'i220a';
  severity: 'high' | 'medium' | 'info';
  title: Localized; body: Localized;            // plain language; informational, never directive
  whatChangedForYou?: Localized;
  affects: { channels?: (EntryChannel | 'ALL_CUBAN')[]; filedBefore?: ISODate; filedAfter?: ISODate; hasEad?: boolean };
  ruleIds?: string[];                           // AlertRule ids this alert ACTIVATES (effects applied by scenarioWeights())
  supersedes?: string[];                        // alert ids whose rule activations are switched off
  expires?: ISODate;
  docket?: { court: string; number: string; courtListenerId?: number };
  sources: { label: string; url: string; evidence: Evidence }[];
  reviewedBy: string;                           // human reviewer handle (PR author ≠ reviewer)
  status: 'published' | 'retracted';
}
export interface AlertsFile { alerts: Alert[] }
export interface AlertCandidate { id: string; foundAt: ISODateTime; source: SourceId; title: string; url: string; matchedTerms: string[]; docketNumber?: string }
```

### 2.7 Content (`content.json`, curated)

```ts
export interface Myth { id: string; claim: Localized; verdict: 'false' | 'misleading' | 'true' | 'unknown';
  since?: ISODate; explanation: Localized; sources: { label: string; url: string; evidence: Evidence }[] }
export interface PeerReasonCopy { id: PeerReasonId; text: Localized; confidence: 'low' | 'medium' | 'medium_high' | 'high'; source: string }
export type PeerReasonId = 'chnv_r1' | 'cbp_one_no_r1' | 'ead_before_r3' | 'ead_swept_r3' | 'c9_erequest_available'
  | 'renewal_no_autoext' | 'non_fifo' | 'office_diff';
export interface ContentFile { myths: Myth[]; peerReasons: PeerReasonCopy[]; glossaryExtra: { term: Localized; definition: Localized }[] }
```

### 2.8 Estimator parameters (`params.json`, computed)

```ts
export interface EstimatorParams {
  modelVersion: 'VPH-1.1';
  dataThrough: YearMonth;                                   // last monthly row used
  beta: { value: number; targets: YearMonth[]; sse: number; fallbackUsed: boolean };   // 0.037391 today
  horizonMonths: 72; receiptsForecast: 1000;
  officeGroup: string[];                                    // offices used for the group rate (cubanFocus ∩ data present)
  officeMultipliers: { code: string; completions: number; avgPending: number; raw: number; shrunk: number;
                       quarters: FiscalQuarter[]; basis: 'approvals' | 'approvals_and_denials' }[];
  k0Office: 50; clampOffice: [0.5, 2];
  grids: { beta: [[0.5, 0.25], [1, 0.5], [2, 0.25]]; office: [[0.8, 0.25], [1, 0.5], [1.25, 0.25]];
           classMix: [[0.5, 0.25], [1, 0.5], [2, 0.25]]; ead: [[0.9, 0.25], [1, 0.5], [1.2, 0.25]] };
  milestone: { noBiometricsAfter4mo: 0.7; rfeAnswered: { mult: 1.5; months: 3 }; mandamus: { mult: 1.3; months: 4 };
               postInterview: { medianMonths: 3; sigma: 0.857 }; expediteGranted: { medianMonths: 2; sigma: 0.857 } };
  observation: { model: 'lognormal'; sigma: number /* fitted, ≥0.25; 0.30 today */; tempering: 0.5; floorLevel: 50; weightFloor: 0.02 };
  scenarioWeights: { asOf: YearMonth; weights: Record<'S0' | 'S1' | 'S2' | 'S3', number>;   // case-independent part
                     caseDependentRules: string[] };                                     // rules whose factor depends on class membership
  weightLedger: WeightLedgerEntry[];                         // append-only
  validation: { status: 'not_validated' | 'validated_r0r2' | 'validated_current'; backtestRunId?: string };
  confidenceGates: { r4MonthsOfData: number; pitNotRejectedMonths: number; crowdDecisionsByOfficeGroup: Record<string, number> };
}
export interface WeightLedgerEntry {
  at: ISODateTime; reason: 'alert_rule' | 'likelihood' | 'prior_reset' | 'supersede';
  ruleId?: string; alertId?: string; observedMonth?: YearMonth; observedCompletions?: number;
  before: Record<string, number>; after: Record<string, number>;
}
```

### 2.9 Community aggregates (`community.json`, v1.1)

```ts
export interface CommunityAggregate {
  cell: { filingQuarter: string | 'all'; officeGroup: 'MIAMI_DADE' | 'REST_FL' | 'TX' | 'OTHER' | 'all'; channel: EntryChannel | 'all' };
  transition: 'receipt→biometrics' | 'receipt→ead_c9' | 'receipt→interview' | 'interview→decision' | 'receipt→decision';
  method: 'delayed_entry_km' | 'aalen_johansen';             // NEVER naive medians of completed durations
  n: number; nEvents: number;                                 // n < 5 not emitted; 5–9 display-only; ≥10 usable
  quantilesDays: { p25: number | null; p50: number | null; p75: number | null };
  weighting: 'none' | 'poststrat_official_frame';
  benchmark: { crowdMonthlyHazard: number; officialMonthlyHazard: number; ratio: number; representative: boolean };
}
export interface CommunityFile { generatedAt: ISODateTime; consentVersions: number[]; aggregates: CommunityAggregate[] }
```

### 2.10 Forecast ledger and scorecard (v1.1)

```ts
export interface ForecastLedgerEntry {                       // data/forecasts/<dataThrough>.json — never edited
  issuedAt: ISODateTime; dataThrough: YearMonth; modelVersion: string; paramsSha256: string;
  weights: Record<string, number>;
  nationalCompletions: { ym: YearMonth; median: number; p10: number; p90: number;
                         logPredictive: { mu: number; sigma: number; weight: number }[] }[];   // next 6 months; mixture of lognormals
  meanAgeOfCompletions: { ym: YearMonth; predicted: number }[];
  pendingOver6: { ym: YearMonth; predicted: number }[];
  referenceCase: { pWithin12: number; q50: number | null };
}
export interface Scorecard { updatedAt: ISODateTime; completions: { ym: YearMonth; pit: number; logScore: number }[];
  meanAge: { ym: YearMonth; predicted: number; observed: number }[]; pendingOver6: { ym: YearMonth; predicted: number; observed: number }[];
  ksPValue: number | null; monthsScored: number }
```

## 3. Case timeline and milestones (device only)

```ts
export type MilestoneKey =
  | 'receipt' | 'biometrics' | 'ead_c9' | 'ead_renewal_filed' | 'ap_i131' | 'transfer'
  | 'interview_notice' | 'interview' | 'rfe' | 'rfe_response' | 'noid' | 'noid_response'
  | 'erequest' | 'erequest_response' | 'expedite_request' | 'expedite_outcome'
  | 'congressional_inquiry' | 'ombudsman' | 'mandamus' | 'parole_termination_notice'
  | 'decision' | 'card';
export interface Milestone {
  key: MilestoneKey;
  date: ISODate | null;                       // null = "happened, date unknown"
  dateGranularity: 'day' | 'month';           // "solo sé el mes" → day 15
  dateSource: 'notice' | 'online_status' | 'memory';
  meta?: {
    cardExpiry?: ISODate;                     // ead_c9
    scheduledFor?: ISODate;                   // interview_notice
    dueDate?: ISODate;                        // rfe / noid (else derived: +84 d / +33 d)
    outcome?: 'approved' | 'denied' | 'withdrawn' | 'admin_closed' | 'granted' | 'no_response' | 'pending' | 'pi_denied' | 'dismissed';
    basis?: 'financial' | 'humanitarian' | 'govt' | 'nonprofit' | 'uscis_error';      // expedite
    erequestType?: 'outside_processing' | 'no_notice' | 'no_card' | 'typo' | 'other';
    terminationNotice?: 'EMAIL_APR_2025' | 'CHNV_JUN_2025' | 'INDIVIDUAL_APR_2026' | 'FRP_JAN_2026' | 'OTHER';
  };
}
export interface CaseTimeline {
  schemaVersion: 1;
  localId: string;                            // uuid v4, device only
  nickname: string;                           // device only; default "Mi caso"
  role: 'principal' | 'derivative'; derivativeOf?: string;   // CU7 link
  entryChannel: EntryChannel;
  paroleDate?: ISODate; paroleEndDateOriginal?: ISODate;     // 2026-04-24 → flagged as re-termination (doc 16 §8.1)
  i485ReceiptDate: ISODate; i485ReceiptDateGranularity: 'day' | 'month';
  receiptPrefix?: string;                     // ^[A-Z]{3}$  (recommended)
  receiptFullLocal?: string;                  // ^[A-Z]{3}\d{10}$ device only, never shared, displayed masked
  state?: string; officeCode?: string;        // undefined = unknown → state mixture or national
  concurrentI765: boolean | null; concurrentI131: boolean | null; withAttorney: boolean | null;
  basicDocs: { paroleRecord: boolean | null; nationalityProof: boolean | null; i693: boolean | null; photos: boolean | null; feeOrWaiver: boolean | null };
  hardship?: ('job_loss_documented' | 'benefits_loss' | 'medical_emergency' | 'death_in_family' | 'uscis_error')[];
  milestones: Milestone[];
  createdAt: ISODateTime; updatedAt: ISODateTime;
}
export interface DerivedFlags {               // packages/case-rules deriveFlags(); never stored
  isParoleBased: boolean;                     // CHNV, CBP_ONE, FRP_CFRP, U4U, OTHER_PAROLE
  admittedOrParoled: boolean;                 // isParoleBased || VISA  → CAA entry element (VISA = "inspected and admitted")
  noEstimateReason: null | 'i220a' | 'ewi' | 'conditional_parole_236' | 'decided';
  r1HoldApplies: boolean | 'low_confidence' | 'unknown_channel';
  frpI485Carveout: boolean;
  redEagleAppearsInClass: boolean;            // Cuban, not finally adjudicated on 2026-08-24 (copy says "parece estar")
  doeDhsAppearsInClass: boolean | 'unknown';
  expeditedRemovalWarning: boolean;           // terminated parole or original end date < today (doc 16 §8.4)
  reTerminationDateSuspicious: boolean;       // paroleEndDateOriginal == 2026-04-24
  oneYearWarning: boolean;                    // receipt < paroleDate + 366 d
  basicDocsComplete: boolean | null;
  filedAfterRedEagle: boolean;                // receipt > 2026-08-24
}
```

**Eligibility gate (ship-fast, corrected):**
- **No estimate** for `I220A`, `EWI` and `CONDITIONAL_PAROLE_236`.
- **VISA is eligible.** "Inspected and admitted" satisfies the CAA. Data-rigor's `!caaParoledElementMet` bug is avoided by using `admittedOrParoled`.
- **UNKNOWN** gets an estimate shown with **both** clocks.

## 4. Estimator I/O (`packages/estimator`)

```ts
export interface EstimateInput {
  case: CaseTimeline; flags: DerivedFlags;
  national: NationalFile; offices: OfficesFile; policy: PolicyFile; params: EstimatorParams; alerts: AlertsFile;
  today: ISODate;
}
export type EstimateResult =
  | { kind: 'no_estimate'; reason: DerivedFlags['noEstimateReason']; flags: DerivedFlags }
  | { kind: 'decided'; outcome: string; date: ISODate | null }
  | EstimateOk;
export interface EstimateOk {
  kind: 'estimate'; modelVersion: 'VPH-1.1'; dataThrough: YearMonth; k0: number;
  mode: 'queue' | 'interview_scheduled' | 'post_interview' | 'post_expedite';
  clock: { calendarDays: number; adjudicableDays: number; adjudicableDaysAltOps: number; holdsApplied: RegimeId[];
           r1: 'applied' | 'not_applied' | 'not_applied_low_confidence' | 'both_shown';
           unknownChannelClocks?: { chnv: number; cbpOne: number } };
  pWithin: { m3: number; m6: number; m12: number; m24: number; m36: number };
  byDate: { date: ISODate; p: number }[];                       // 31 Dec of this year, +1, +2
  quantiles: { q10: number | null; q25: number | null; q50: number | null; q75: number | null; q90: number | null };  // months from today; null = > 72
  survival: number[];                                           // S_c(0..72), S_c(0) = 1
  policyBand12: [number, number];                               // min/max per-scenario P(≤12)
  structuralBand12: [number, number];                           // class-mix (and EAD if EAD received) extremes
  perScenario: { id: 'S0' | 'S1' | 'S2' | 'S3'; weight: number; posteriorWeight: number; p12: number; q50: number | null }[];
  drivers: { scenario: number; beta: number; office: number };  // variance shares, sum ≤ 1
  queue: { pendingTotal: number; olderThanYou: number; sameMonthAsYou: number; completionsLastMonth: number; beta: number };
  office: { basis: 'office' | 'state_mixture' | 'national'; code?: string; state?: string; multiplier?: number; nCompletions?: number;
            weak?: boolean; stateWeights?: Record<string, number> };
  yardstick: { form: 'I-485'; subtype: '131A-FAM'; officeCode?: string; months80: number | null; inquiryDate: ISODate | null;
               publicationDate: ISODate | null; retrievedAt: ISODateTime | null; isProxy: true };
  delays: { rfeZeroUntil?: ISODate; assumedResponseAt?: ISODate; nonResponseRisk?: boolean };
  confidence: 'LOW' | 'MEDIUM' | 'HIGH'; validated: boolean;
  guards: { id: 'T20a' | 'T20b' | 'pipeline_late' | 'artifact_old' | 'qa_degraded' | 'sample_data'; months?: YearMonth[] }[];
  weightTrace: { ruleId?: string; reason: string; before: Record<string, number>; after: Record<string, number> }[];  // case-specific
}
export function estimate(input: EstimateInput): EstimateResult;               // pure, deterministic, < 150 ms on device
export function scenarioWeights(policy: PolicyFile, alerts: AlertsFile, observed: MonthlyRow[], flags: DerivedFlags | null, sigma: number): { weights: Record<string, number>; trace: EstimateOk['weightTrace'] };
```

The approval card is **not** part of `EstimateOk`. It comes from `case-rules` `approvalCard(case, quarterly, national, policy)`, so that it can never be multiplied into the timing.

## 5. Case-rules outputs (`packages/case-rules`)

```ts
export function deriveFlags(c: CaseTimeline, policy: PolicyFile, today: ISODate): DerivedFlags;
export function adjudicableDays(receipt: ISODate, today: ISODate, regimes: Regime[], channel: EntryChannel, ends: 'default' | 'altOps'): { days: number; holds: RegimeId[] };
export interface RemedyStep { rung: 'a_i485' | 'a_c9' | 'b' | 'c' | 'd' | 'e' | 'f' | 'denial';
  state: 'available' | 'not_yet' | 'depends' | 'not_applicable'; etaMonth?: YearMonth; gate?: { inquiryDate: ISODate | null; retrievedAt?: ISODateTime };
  titleKey: string; bodyKey: string; params: Record<string, string | number> }
export function remedyLadder(c: CaseTimeline, flags: DerivedFlags, offices: OfficesFile, policy: PolicyFile, today: ISODate): RemedyStep[];
export function peerReasons(c: CaseTimeline, flags: DerivedFlags, offices: OfficesFile, today: ISODate): PeerReasonId[];   // exact sets tested (U2)
export function eadStatus(c: CaseTimeline, policy: PolicyFile, today: ISODate): { validityRule: '5y' | '18m' | 'unknown'; expiry?: ISODate; renewBy?: ISODate; autoExtension: boolean; reminders: ISODate[] };
export function approvalCard(c: CaseTimeline, q: QuarterlyFile, n: NationalFile, policy: PolicyFile): { populationShares: ApprovalBaseline[]; baselines: ApprovalBaseline[]; cleanRange: [number, number] | null; unmodelledFactors: Localized[] };
export function shareCode(c: CaseTimeline, est: EstimateOk | null, lang: Lang): string;            // month-level, no receipt digits
export function parseShareCode(text: string): Partial<CaseTimeline> | null;
```

## 6. Local storage schema (KV; there is no SQLite in the MVP)

**Why not SQLite.**
- expo-sqlite on web needs wasm plus COOP/COEP headers, which the artifact host does not allow [S per ship-fast search: docs.expo.dev sqlite.md].
- The data is under 200 KB in total.
- So we use **one** KV interface everywhere:
  - `kv.native.ts`: `@react-native-async-storage/async-storage@2.2.0` (Expo Go set; SDK notes §1).
  - `kv.web.ts`: our own guarded `localStorage` plus a memory `Map`. It does not use AsyncStorage's web module, because that module's throws cannot be caught by a wrapper.

```ts
export interface Kv {                        // app/src/storage/kv.ts
  ready: Promise<void>;                      // native: hydrate all 'caa:' keys into memory once; web: resolves immediately
  get(key: KvKey): string | null;            // sync after ready
  set(key: KvKey, value: string): void;      // memory immediately; persist async (native) / try-catch (web)
  remove(key: KvKey): void;
  clear(prefix: 'caa:'): void;
}
```

| Key | Value (JSON, zod-validated on read; invalid → removed) | Notes |
|---|---|---|
| `caa:v1:settings` | `{ lang: Lang; theme: 'system'\|'light'\|'dark'; onboardingDone: boolean; disclaimerVersion: number; discreet: boolean; notifications: { enabled: boolean; dataMonths: boolean } }` | lang default = device locale (`es*` → es) |
| `caa:v1:cases` | `{ activeId: string; cases: CaseTimeline[] }` (≤ 3) | device only |
| `caa:v1:data:<file>` | `{ etag?: string; sha256: string; fetchedAt: ISODateTime; body: <file JSON> }` | per data file |
| `caa:v1:data:manifest` | same, for the manifest | |
| `caa:v1:alerts:read` | `string[]` (alert ids) | |
| `caa:v1:notif:scheduled` | `{ id: string; kind: string; caseId: string; fireAt: ISODateTime }[]` | rescheduled on language change |
| `caa:v1:refresh` | `{ lastAttemptAt: ISODateTime; backoffUntil?: ISODateTime; consecutive429: number }` | rate-limit hygiene |

There is one migration function, `migrateKv(from, to)`, and the version is part of the key prefix (`v1`). "Borrar mis datos" calls `kv.clear('caa:')` and cancels all scheduled notifications.

## 7. Optional Supabase schema (v1.1; native only)

**Stricter than doc 09 §6.3:**
- No receipt digits, only the 3-letter prefix.
- Dates as filing month plus day offsets; no absolute day dates.
- No ZIP.
- `registeredAt` required, for delayed entry.

```sql
-- supabase/migrations/0001_shared_timelines.sql
create table public.shared_timelines (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  consent_version  smallint not null check (consent_version >= 1),
  schema_version   smallint not null default 1,
  entry_channel    text not null check (entry_channel in ('CHNV','CBP_ONE','FRP_CFRP','U4U','OTHER_PAROLE','VISA','I220A')),
  receipt_prefix   text check (receipt_prefix ~ '^(IOE|MSC|NBC|EAC|WAC|LIN|SRC|YSC)$'),
  state            char(2) not null,
  office_code      text check (office_code ~ '^[A-Z]{3}$'),
  filed_month      date not null check (date_trunc('month', filed_month) = filed_month and filed_month >= '2023-01-01'),
  registered_at    timestamptz not null default now(),          -- delayed-entry time
  offsets_days     jsonb not null default '{}'::jsonb,          -- {"biometrics":112,"ead_c9":180,...} days since receipt (≥0)
  decision         text check (decision in ('approved','denied','withdrawn','admin_closed')),
  with_attorney    boolean,
  evidence_level   text not null check (evidence_level in ('notice','online_status','memory')),
  plausibility_flags text[] not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
alter table public.shared_timelines enable row level security;
create policy "insert own" on public.shared_timelines for insert to authenticated with check (owner_id = auth.uid());
create policy "update own" on public.shared_timelines for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "delete own" on public.shared_timelines for delete to authenticated using (owner_id = auth.uid());
create policy "select own" on public.shared_timelines for select to authenticated using (owner_id = auth.uid());
-- no anon policy; no policy exposing other users' rows; aggregates computed by the Actions job (service role).

create or replace function public.check_offsets() returns trigger language plpgsql as $$
declare k text; v numeric;
begin
  for k, v in select key, value::numeric from jsonb_each_text(new.offsets_days) loop
    if k not in ('biometrics','ead_c9','interview_notice','interview','rfe','rfe_response','decision','card') then raise exception 'bad key %', k; end if;
    if v < 0 or v > 3650 then raise exception 'bad offset %', k; end if;
  end loop;
  if (select count(*) from public.shared_timelines where owner_id = new.owner_id) >= 3 and tg_op = 'INSERT' then
    raise exception 'too many entries';
  end if;
  new.updated_at := now(); return new;
end $$;
create trigger trg_check before insert or update on public.shared_timelines for each row execute function public.check_offsets();

create or replace function public.delete_my_account() returns void language sql security definer set search_path = public as $$
  delete from auth.users where id = auth.uid();
$$;
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
```

**Operation:**
- The client signs in anonymously (`signInAnonymously`) only when the user opts in.
- The aggregation job reads with the service-role key. The key is stored in a GitHub **environment** secret with required reviewers.
- The job computes delayed-entry Kaplan–Meier (and Aalen–Johansen for approval/denial) per cell, applying the thresholds in `04` §10. It publishes `community.json`.
- Housekeeping deletes anonymous users older than 180 days who have no rows.

## 8. Validation rules shared by app and pipeline

- **Counts:** counts are ≥ 0, and `pendingOver6 ≤ pending`. `ym` is strictly increasing and has no gaps from `firstModelMonth`, except the known Aug 2024 gap before the model window.
- **Dates:** no dates in the future, except `interview_notice.meta.scheduledFor` and `dueDate`.
- **Timeline ordering:** the receipt comes before any other milestone. The EAD comes after the receipt. A decision comes after the interview, when there is one.
- **Localized:** every `Localized` field has two non-empty strings, and `es ≠ en` unless the value is a proper name.
- **Unknown fields:** rejected in curated files (strict), ignored in pipeline files (passthrough with a warning). This makes additive schema changes backward-compatible.

## 9. Deterministic formatting (`packages/i18n-core/src/fmt.ts`)

Output never depends on the engine's `Intl`. Hermes and V8 may differ [T], and the spike showed that Chromium's es-US output differs from the "9 %" assumed in two proposals [V].

| Function | es | en |
|---|---|---|
| `fmt.int(355520)` | `355,520` | `355,520` |
| `fmt.dec(20.6, 1)` | `20.6` | `20.6` |
| `fmt.pct(0.0923)` (0 dp; < 1 % → "<1 %" / "<1%") | `9 %`* | `9%` |
| `fmt.date('2026-10-20')` | `20 oct 2026` | `Oct 20, 2026` |
| `fmt.month('2026-08')` | `ago 2026` | `Aug 2026` |
| `fmt.monthLong('2026-08')` | `agosto de 2026` | `August 2026` |
| `fmt.relative(hours)` | `hace 3 h` / `hace 2 días` | `3 h ago` / `2 days ago` |

\* **ADR-I18N-2.**
- Numbers use the US convention in both languages, because users live in the US and USCIS documents use it (`355,520`, `20.6`).
- Spanish percentages are written with a no-break space (`9 %`, U+00A0), following RAE usage. English uses `9%`.
- This is our own deterministic choice. It does **not** depend on the engine: Chromium es-US outputs "9%" [V].
- Prove asserts these exact strings.

Spanish month abbreviations: `ene feb mar abr may jun jul ago sept oct nov dic`. English: `Jan … Dec`.
