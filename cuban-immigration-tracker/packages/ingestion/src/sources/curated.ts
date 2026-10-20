/**
 * C1 — curated inputs (03-data-pipeline.md §2.2 C1; data/curated/README.md):
 * `policy.json`, `alerts/<id>.json`, `content.json`, `historic_medians.json`, validated with the STRICT
 * zod schemas of @caa/data-schemas and published as `policy.json`, `alerts.json` (sorted by date, then
 * id) and `content.json`; the historic medians go into `quarterly.json`. Invalid curated JSON fails CI
 * on the PR (`npm run data:validate`), never the cron: the refresh keeps the last published copy.
 */
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import {
  AlertSchema, AlertsFileSchema, ContentFileSchema, HistoricMedianSchema, PolicyFileSchema, formatIssues,
  type Alert, type AlertsFile, type ContentFile, type HistoricMedian, type PolicyFile,
} from '@caa/data-schemas';

export interface CuratedInputs {
  policy: PolicyFile | null;
  alerts: AlertsFile | null;
  content: ContentFile | null;
  historicMedians: HistoricMedian[] | null;
  /** Problems keyed by path relative to the curated dir. */
  issues: Record<string, string[]>;
}

async function readJson(path: string): Promise<{ ok: true; json: unknown } | { ok: false; issue: string }> {
  let text: string;
  try { text = await readFile(path, 'utf8'); } catch { return { ok: false, issue: '(file): missing' }; }
  try { return { ok: true, json: JSON.parse(text) }; } catch (e) { return { ok: false, issue: `(file): invalid JSON (${(e as Error).message})` }; }
}

function check<T>(schema: z.ZodType<T>, json: unknown): { ok: true; value: T } | { ok: false; issues: string[] } {
  const r = schema.safeParse(json);
  return r.success ? { ok: true, value: r.data } : { ok: false, issues: formatIssues(r.error) };
}

/** Alerts sorted by (date, id) — the order `scenarioWeights` processes them in (04 §6.3 step 2). */
export function sortAlerts(alerts: Alert[]): Alert[] {
  return alerts.slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export async function loadCurated(dir: string): Promise<CuratedInputs> {
  const issues: Record<string, string[]> = {};
  const add = (k: string, msgs: string[]) => { if (msgs.length) (issues[k] ??= []).push(...msgs); };
  const load = async <T>(rel: string, schema: z.ZodType<T>): Promise<T | null> => {
    const j = await readJson(join(dir, rel));
    if (!j.ok) { add(rel, [j.issue]); return null; }
    const r = check(schema, j.json);
    if (!r.ok) { add(rel, r.issues); return null; }
    return r.value;
  };

  const policy = await load('policy.json', PolicyFileSchema as unknown as z.ZodType<PolicyFile>);
  const content = await load('content.json', ContentFileSchema as unknown as z.ZodType<ContentFile>);
  const historicMedians = await load('historic_medians.json', z.array(HistoricMedianSchema) as unknown as z.ZodType<HistoricMedian[]>);

  let alerts: AlertsFile | null = null;
  let names: string[] = [];
  let alertsOk = true;
  try { names = (await readdir(join(dir, 'alerts'))).filter((f) => f.endsWith('.json')).sort(); } catch { alertsOk = false; add('alerts/', ['(dir): missing']); }
  const list: Alert[] = [];
  for (const n of names) {
    const a = await load(`alerts/${n}`, AlertSchema as unknown as z.ZodType<Alert>);
    if (!a) { alertsOk = false; continue; }
    list.push(a);
  }
  if (alertsOk) {
    const r = check(AlertsFileSchema as unknown as z.ZodType<AlertsFile>, { alerts: sortAlerts(list) });
    if (r.ok) alerts = r.value;
    else add('alerts/', r.issues);
  }
  if (policy && alerts) {
    const rules = new Set(policy.alertRules.map((r) => r.ruleId));
    for (const a of alerts.alerts) for (const r of a.ruleIds ?? []) if (!rules.has(r)) add(`alerts/${a.id}.json`, [`ruleIds: unknown rule ${r} (not in policy.alertRules)`]);
  }
  return { policy, alerts, content, historicMedians, issues };
}
