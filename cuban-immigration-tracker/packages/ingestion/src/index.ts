/**
 * @caa/ingestion (07-implementation-plan.md WP5; 03-data-pipeline.md §2–§7). Node 22 only (tsx); the
 * app never imports this package (the app tsconfig excludes it).
 *
 * CLI: `src/cli.ts` — `refresh --out data [--only] [--dry-run] [--github-output <file>]`,
 * `validate <dir>`, `fixtures`, `probe --report-dir <dir>`.
 * Library (07 WP5 "Exports"): `fetchWithPolicy`, `classify`, `parseMonthlyCsv`, `parseAllForms`,
 * `parseByOffice`, `parsePortalIndex`, `readProcessingTimes`, `runQa`, `fit`, `publish`, `decideCommit`,
 * plus the helpers they are built from.
 */
export { classify, isCloudflareBlock, CLOUDFLARE_BODY_MARKERS, type Classification, type ClassifyInput } from './classify';
export { fetchWithPolicy, createHttpClient, HttpClient, bodyJson, bodyText, isGovernmentHost, type FetchOutcome, type FetchRequest, type FetchMode, type HttpClientOptions } from './http';
export { parseMonthlyCsv, MONTHLY_HEADER, type MonthlyCsvResult, type ParseRef } from './sources/monthlyCsv';
export { parseAllForms, approvalBaselines, mergeQuarterRows, quarterLabel, ALL_FORMS_ROWS, type AllFormsResult } from './sources/quarterlyAllForms';
export { parseByOffice, BLOCK_START, type ByOfficeResult } from './sources/i485ByOffice';
export { parsePortalIndex, classifyPortalHref, findMonthLink, findQuarterLink, type PortalLink, type PortalLinkKind } from './sources/portalIndex';
export {
  readProcessingTimes, pickReleaseAsset, updateInquiryHistory, seedProcessingTimes, toMonths, loadSqlJs, INQUIRY_SEED_2024_10_18, RELEASE_2026_10_15_SEED,
  type ProcessingTimesResult,
} from './sources/processingTimes';
export { frSearchUrl, parseFrSearch, parseFrSearchPage, frCandidates } from './sources/federalRegister';
export { parseRss, rssMatches, rssCandidates, type RssItem } from './sources/uscisRss';
export { clCandidates, docketEntriesUrl, MAX_REQUESTS_PER_RUN } from './sources/courtListener';
export { loadCurated, sortAlerts, type CuratedInputs } from './sources/curated';
export {
  runQa, q1Validate, q3Continuity, q4FlowIdentity, q5MonthlyVsQuarterly, q6PendingGap, q7Humanitarian, q8MirrorSha, q9ProcessingTimes, q10Subtypes,
  q11PendingJump, q12Canary, GOLDEN_FIXTURES, type QaGateId, type QaLevel, type QaReport, type QaResult,
} from './qa';
export { runGoldenFixtures, syntheticJzebedeeDb, FIXTURE_FILES, FIXTURES_DIR } from './fixtures';
export { fit, canary, caseDependentRules, r4MonthsOfData, PARAM_CONSTANTS, type FitInput } from './fit';
export { publish, buildManifest, serializeFiles, loadPublished, mergeCandidates, writeQuarantine, pruneQuarantine, type PublishedFiles, type PreviousSnapshot } from './publish';
export { decideCommit, type CommitDecision, type CommitInput, type CommitReason } from './commitPolicy';
export { planRaw, writeRaw, readRawMeta, listRawMetas, fileNameOf, type RawMeta } from './raw';
export { refresh, SOURCE_KEYS, type RefreshOptions, type RefreshResult, type SourceKey } from './refresh';
export { runProbe, renderReport, PROBE_MODULES, type ProbeReport, type ProbeResult } from './probe';
export * from './constants';
