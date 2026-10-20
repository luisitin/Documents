/**
 * Test helpers for @caa/case-rules (WP3). Inputs are labelled SAMPLE / TEST data:
 * - the WP1 hand-built sample G0 (packages/data-schemas/test/fixtures/sample-handbuilt), parsed with
 *   the v1 schemas: regimes of key facts §3, the doc 15 §2.2 inquiry dates (published 2026-10-15) and
 *   the 2024-10-18 → 2026-10-15 inquiry-date history, the approval baselines of doc 04 §1.2;
 * - the curated `data/curated/policy.json` (WP9), parsed the same way, so the rules are checked
 *   against the file the app actually ships;
 * - the T15 reference-case fixture of 04 §9.2 (synthetic: no names, no receipt number).
 * JSON is imported directly (no Node built-ins under packages/, ARCH-1 lint rule).
 */
import { parseCase, parseDataFile, type CaseTimeline, type DataFileName, type Milestone } from '@caa/data-schemas';
import policyG0 from '../../data-schemas/test/fixtures/sample-handbuilt/policy.json';
import officesG0 from '../../data-schemas/test/fixtures/sample-handbuilt/offices.json';
import quarterlyG0 from '../../data-schemas/test/fixtures/sample-handbuilt/quarterly.json';
import nationalG0 from '../../data-schemas/test/fixtures/sample-handbuilt/national.json';
import policyCurated from '../../../data/curated/policy.json';
import t15Json from '../../data-schemas/test/fixtures/valid/case.t15.json';

export const TODAY = '2026-10-20';

function must<N extends DataFileName>(name: N, json: unknown) {
  const r = parseDataFile(name, json);
  if (!r.ok) throw new Error(`${name} fixture invalid: ${r.issues.join('; ')}`);
  return r.value;
}

export const policy = must('policy', policyG0);
export const curatedPolicy = must('policy', policyCurated);
export const offices = must('offices', officesG0);
export const quarterly = must('quarterly', quarterlyG0);
export const national = must('national', nationalG0);

/** The T15 reference case (04 §9.2): CHNV, receipt 2025-03-15, biometrics 2025-07, EAD 2025-09, office/state unknown. */
export function t15(): CaseTimeline {
  const r = parseCase(t15Json, { today: TODAY });
  if (!r.ok) throw new Error(`T15 fixture invalid: ${r.issues.join('; ')}`);
  return structuredClone(r.value);
}

/** A T15 variant (shallow overrides + milestone filter / additions). */
export function variant(over: Partial<CaseTimeline>, opts?: { drop?: Milestone['key'][]; add?: Milestone[] }): CaseTimeline {
  const c = Object.assign(t15(), over);
  const drop = opts?.drop ?? [];
  c.milestones = c.milestones.filter((m) => drop.indexOf(m.key) < 0).concat(opts?.add ?? []);
  return c;
}

export const ms = (key: Milestone['key'], date: string | null, meta?: Milestone['meta'], g: 'day' | 'month' = 'day'): Milestone => {
  const m: Milestone = { key, date, dateGranularity: g, dateSource: 'notice' };
  if (meta) m.meta = meta;
  return m;
};
