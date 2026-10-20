/**
 * The endpoint probe (docs/research/13-live-data-endpoints-and-probe-plan.md §12; 03-data-pipeline.md §6.4).
 *
 * One command (`npm run probe` = `cli.ts probe --report-dir probe-out`) that calls every doc 13 §12.4
 * endpoint with the documented headers, validates each response, saves small raw samples under
 * `<report-dir>/samples/`, and writes `<report-dir>/probe-report.json` and `PROBE-REPORT.md` (one row per
 * probe: ok | not_yet | schema_mismatch | blocked_cloudflare | blocked_drupal_antibot | http_error |
 * network_error | skipped_no_secret | auth_error | sandbox_closed | sandbox_incident). A blocked endpoint
 * is a FINDING, never a failure (§12.1 item 5): probe mode makes 0 retries and keeps ≥ 1 s between calls
 * to one host (§12.3). Secrets come from the environment only (USCIS_CLIENT_ID, USCIS_CLIENT_SECRET,
 * COURTLISTENER_TOKEN, CENSUS_API_KEY, GITHUB_TOKEN); a missing secret → `skipped_no_secret`. Secrets and
 * tokens are never written to samples (the Torch token is replaced by its sha256).
 *
 * The caa-probe workflow prints PROBE-REPORT.md to the job log and summary and uploads the report
 * directory as an artifact; it never commits (orchestrator override 3).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { Classification } from '../classify';
import { HttpClient, redactUrl, type FetchOutcome, type FetchRequest } from '../http';
import { sha256Hex } from '../util';
import { censusProbes } from './probes/census';
import { cbpProbes } from './probes/cbp';
import { communityMirrorProbes } from './probes/communityMirrors';
import { courtListenerProbes } from './probes/courtListener';
import { federalRegisterProbes } from './probes/federalRegister';
import { ohssProbes } from './probes/ohss';
import { uscisDataPortalProbes } from './probes/uscisDataPortal';
import { uscisProcessingTimesProbes } from './probes/uscisProcessingTimes';
import { uscisRssProbes } from './probes/uscisRss';
import { uscisTorchProbes } from './probes/uscisTorch';

export type ProbeClassification = Classification | 'auth_error' | 'sandbox_closed' | 'sandbox_incident';

export interface ProbeResult {
  id: string;
  group: string;
  method: string;
  url: string;
  status: number | null;
  classification: ProbeClassification;
  ms: number;
  bytes?: number;
  sha256?: string;
  contentType?: string;
  sample?: string;
  note?: string;
  assertions?: Record<string, unknown>;
}

export interface ProbeSpec extends FetchRequest {
  id: string;
  /** Env vars that must be set, else `skipped_no_secret`. */
  secrets?: string[];
  /** Sample path under samples/ (saved when the response is usable and ≤ maxSampleBytes). */
  sample?: string;
  /**
   * Inspects a usable response; may downgrade it (`schema_mismatch`), add assertions and a note.
   * Thrown errors become `schema_mismatch` with the message as note.
   */
  check?: (res: FetchOutcome, ctx: ProbeContext) => Promise<CheckResult | void> | CheckResult | void;
  /** Maps non-ok statuses (e.g. 401 → auth_error, 503 → sandbox_closed). */
  mapStatus?: (res: FetchOutcome) => ProbeClassification | undefined;
}

export interface CheckResult { classification?: ProbeClassification; note?: string; assertions?: Record<string, unknown>; findings?: string[] }

export interface ProbeContext {
  client: HttpClient;
  env: Record<string, string | undefined>;
  samplesDir: string;
  results: ProbeResult[];
  findings: string[];
  /** Results by id. */
  get(id: string): ProbeResult | undefined;
  /** Responses kept in memory for dependent probes (not saved to disk unless a sample path is given). */
  bodies: Map<string, FetchOutcome>;
  probe(group: string, spec: ProbeSpec): Promise<ProbeResult>;
  skip(group: string, id: string, url: string, classification: ProbeClassification, note: string): ProbeResult;
}

export interface ProbeModule { group: string; run(ctx: ProbeContext): Promise<void> }

export const PROBE_MODULES: ProbeModule[] = [
  uscisProcessingTimesProbes, uscisTorchProbes, uscisDataPortalProbes, ohssProbes, cbpProbes,
  federalRegisterProbes, courtListenerProbes, censusProbes, uscisRssProbes, communityMirrorProbes,
];

const MAX_SAMPLE_BYTES = 5 * 1024 * 1024;

export interface ProbeRunOptions {
  reportDir: string;
  only?: string[];
  client?: HttpClient;
  env?: Record<string, string | undefined>;
  now?: () => Date;
  modules?: ProbeModule[];
}

export interface ProbeReport {
  run: { startedAt: string; finishedAt: string; runner: 'github-actions' | 'local'; commit?: string; ref?: string; runId?: string };
  results: ProbeResult[];
  findings: string[];
}

function createContext(o: ProbeRunOptions, client: HttpClient, env: Record<string, string | undefined>): ProbeContext {
  const samplesDir = join(o.reportDir, 'samples');
  const results: ProbeResult[] = [];
  const bodies = new Map<string, FetchOutcome>();
  const want = (id: string) => !o.only?.length || o.only.some((p) => id.startsWith(p));
  const ctx: ProbeContext = {
    client, env, samplesDir, results, findings: [], bodies,
    get: (id) => results.find((r) => r.id === id),
    skip(group, id, url, classification, note) {
      const r: ProbeResult = { id, group, method: 'GET', url: redactUrl(url), status: null, classification, ms: 0, note };
      results.push(r);
      return r;
    },
    async probe(group, spec) {
      const method = spec.method ?? 'GET';
      if (!want(spec.id)) return { id: spec.id, group, method, url: spec.url, status: null, classification: 'not_yet', ms: 0, note: 'not selected (--only); not recorded' };
      const missing = (spec.secrets ?? []).filter((s) => !env[s]);
      if (missing.length) return ctx.skip(group, spec.id, spec.url, 'skipped_no_secret', `missing ${missing.join(', ')}`);
      const res = await client.fetch(spec);
      bodies.set(spec.id, res);
      const r: ProbeResult = {
        id: spec.id, group, method, url: redactUrl(spec.url), status: res.status, classification: spec.mapStatus?.(res) ?? res.classification, ms: res.ms,
        ...(res.body ? { bytes: res.body.byteLength, sha256: sha256Hex(res.body) } : {}),
        ...(res.headers['content-type'] ? { contentType: res.headers['content-type'] } : {}),
        ...(res.error ? { note: res.error.slice(0, 200) } : {}),
      };
      if (res.classification === 'ok' && spec.check) {
        try {
          const c = await spec.check(res, ctx);
          if (c?.classification) r.classification = c.classification;
          if (c?.note) r.note = c.note;
          if (c?.assertions) r.assertions = c.assertions;
          if (c?.findings) ctx.findings.push(...c.findings);
        } catch (e) {
          r.classification = 'schema_mismatch';
          r.note = (e as Error).message.slice(0, 300);
        }
      }
      if (spec.sample && res.body && res.classification === 'ok' && res.body.byteLength <= MAX_SAMPLE_BYTES) {
        const p = join(samplesDir, spec.sample);
        await mkdir(dirname(p), { recursive: true });
        await writeFile(p, res.body);
        r.sample = spec.sample;
      }
      results.push(r);
      return r;
    },
  };
  return ctx;
}

const md = (s: unknown) => String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

/** `PROBE-REPORT.md` (doc 13 §12.7): the table, then the rule-generated findings. */
export function renderReport(r: ProbeReport): string {
  const counts = new Map<string, number>();
  for (const x of r.results) counts.set(x.classification, (counts.get(x.classification) ?? 0) + 1);
  const lines = [
    '# PROBE-REPORT',
    '',
    `Run: ${r.run.startedAt} → ${r.run.finishedAt} · runner: **${r.run.runner}**${r.run.ref ? ` · ref ${r.run.ref}` : ''}${r.run.commit ? ` · commit ${r.run.commit.slice(0, 12)}` : ''}${r.run.runId ? ` · run ${r.run.runId}` : ''}`,
    '',
    `Totals: ${[...counts.entries()].sort().map(([k, v]) => `${k} ${v}`).join(' · ')}`,
    '',
    '| id | classification | status | ms | bytes | note |',
    '|---|---|---|---:|---:|---|',
    ...r.results.map((x) => `| ${md(x.id)} | ${md(x.classification)} | ${x.status ?? '—'} | ${x.ms} | ${x.bytes ?? ''} | ${md([x.note, x.assertions ? JSON.stringify(x.assertions) : ''].filter(Boolean).join(' '))} |`),
    '',
    '## Findings',
    '',
    ...(r.findings.length ? r.findings.map((f) => `- ${md(f)}`) : ['- (none)']),
    '',
  ];
  return lines.join('\n');
}

/** 07 WP5 `probe --report-dir <dir>`. */
export async function runProbe(o: ProbeRunOptions): Promise<ProbeReport> {
  const env = o.env ?? process.env;
  const now = o.now ?? (() => new Date());
  const client = o.client ?? new HttpClient({ mode: 'probe' });
  const startedAt = now().toISOString();
  const ctx = createContext(o, client, env);
  const crashes: Error[] = [];
  for (const m of o.modules ?? PROBE_MODULES) {
    try {
      await m.run(ctx);
    } catch (e) {
      // A crashing probe module is a programming error: record it, finish the report, then fail.
      ctx.skip(m.group, `${m.group}.crash`, 'https://invalid.example/', 'schema_mismatch', `probe module crashed: ${(e as Error).message}`);
      crashes.push(e as Error);
    }
  }
  const egov = ctx.results.filter((r) => r.url.startsWith('https://egov.uscis.gov/'));
  if (egov.length) ctx.findings.push(`EGOV_REACHABLE=${egov.some((r) => r.classification === 'ok')}`);
  const report: ProbeReport = {
    run: {
      startedAt, finishedAt: now().toISOString(), runner: env.GITHUB_ACTIONS === 'true' ? 'github-actions' : 'local',
      ...(env.GITHUB_SHA ? { commit: env.GITHUB_SHA } : {}), ...(env.GITHUB_REF_NAME ? { ref: env.GITHUB_REF_NAME } : {}), ...(env.GITHUB_RUN_ID ? { runId: env.GITHUB_RUN_ID } : {}),
    },
    results: ctx.results,
    findings: ctx.findings,
  };
  await mkdir(o.reportDir, { recursive: true });
  await writeFile(join(o.reportDir, 'probe-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(join(o.reportDir, 'PROBE-REPORT.md'), renderReport(report));
  if (crashes.length) throw new AggregateError(crashes, `${crashes.length} probe module(s) crashed (report written)`);
  return report;
}
