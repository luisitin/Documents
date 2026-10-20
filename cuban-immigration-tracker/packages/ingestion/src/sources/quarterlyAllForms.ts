/**
 * P2 — quarterly "All USCIS Application and Petition Form Types" workbook (03-data-pipeline.md §3.2;
 * docs/research/04-uscis-data-sources.md §1.2 [F]).
 *
 * 1. One sheet matching `/^FY\d{2}Q[1-4]_All_Forms$/` (e.g. `FY26Q3_All_Forms`, A1:M122 [F]).
 * 2. Period from the title ("April 1, 2026 - June 30, 2026") → fiscal quarter; must agree with the sheet name.
 * 3. Rows found by text: `I-485` + `(Cuban)` / `(Refugee)` / `(Asylum)`; `I-765` + `(Adjustment Of Status)` / `(All Other)`.
 * 4. 13 columns: category/form, title, quarter received, approved, denied, completions, pending,
 *    processing time (MEDIAN, footnote 6), FYTD received, approved, denied, completions, pending.
 * 5. Fixture (Q2): FY26 Q3 Cuban = 6279 / 139 / 447 / 586 / 342360 / 16.3.
 * 6. `approvalBaselines`: each quarter's approved / completions, plus FYTD (key facts §7: 91.7 / 52.6 /
 *    23.7 / 83 %). The monthly Jul/Aug population shares (308/626, 386/820) are computed on the device
 *    from `national.json` by `@caa/case-rules` `approvalCard` (`populationShares`), so they are not
 *    duplicated here.
 */
import type { ApprovalBaseline, FiscalQuarter, QuarterForm, QuarterRow } from '@caa/data-schemas';
import { SourceError, cmpQuarter, quarterKey, sameQuarter } from '../util';
import type { ParseRef } from './monthlyCsv';
import { countCell, quarterFromTitle, readWorkbook, type Grid } from './xlsx';

/** Row label → matcher on (column A, column B). */
export const ALL_FORMS_ROWS: { form: QuarterForm; formNumber: string; suffix: RegExp }[] = [
  { form: 'I-485 (Cuban)', formNumber: 'I-485', suffix: /\(Cuban\)$/i },
  { form: 'I-485 (Refugee)', formNumber: 'I-485', suffix: /\(Refugee\)$/i },
  { form: 'I-485 (Asylum)', formNumber: 'I-485', suffix: /\(Asylum\)$/i },
  { form: 'I-765 (Adjustment Of Status)', formNumber: 'I-765', suffix: /\(Adjustment Of Status\)$/i },
  { form: 'I-765 (All Other)', formNumber: 'I-765', suffix: /\(All Other\)$/i },
];

export interface AllFormsResult { quarter: FiscalQuarter; sheet: string; rows: QuarterRow[] }

const text = (v: string | number | null | undefined) => (v === null || v === undefined ? '' : String(v));

function need(v: string | number | null | undefined, what: string): number {
  const c = countCell(v);
  if (c.value === null || !Number.isInteger(c.value) || c.value < 0) throw new SourceError(`${what}: expected a count, got "${text(v)}"`);
  return c.value;
}

function findRow(grid: Grid, formNumber: string, suffix: RegExp): (string | number | null)[] | null {
  const hits = grid.filter((r) => text(r[0]).startsWith(formNumber) && suffix.test(text(r[1])));
  if (hits.length > 1) throw new SourceError(`more than one row for ${formNumber} ${suffix}`);
  return hits[0] ?? null;
}

/** 03 §3.2. */
export async function parseAllForms(bytes: Uint8Array, ref: ParseRef): Promise<AllFormsResult> {
  const sheets = await readWorkbook(bytes);
  const matches = sheets.filter((s) => /^FY\d{2}Q[1-4]_All_Forms$/.test(s.name));
  if (matches.length !== 1) throw new SourceError(`expected one sheet FYyyQn_All_Forms, found [${sheets.map((s) => s.name).join(', ')}]`);
  const { name, grid } = matches[0]!;
  const quarter = quarterFromTitle(grid);
  const sm = /^FY(\d{2})Q([1-4])_All_Forms$/.exec(name)!;
  if (2000 + Number(sm[1]) !== quarter.fy || Number(sm[2]) !== quarter.q) throw new SourceError(`sheet ${name} disagrees with title period ${quarterKey(quarter)}`);

  const rows: QuarterRow[] = [];
  for (const spec of ALL_FORMS_ROWS) {
    const r = findRow(grid, spec.formNumber, spec.suffix);
    if (!r) {
      if (spec.form === 'I-485 (Cuban)') throw new SourceError('no "I-485 … (Cuban)" row');
      continue;
    }
    const med = countCell(r[7]);
    const fytdCompletions = countCell(r[11]).value;
    rows.push({
      quarter,
      form: spec.form,
      received: need(r[2], `${spec.form} received`),
      approved: need(r[3], `${spec.form} approved`),
      denied: need(r[4], `${spec.form} denied`),
      completions: need(r[5], `${spec.form} completions`),
      pendingWorkbook: need(r[6], `${spec.form} pending`),
      medianMonths: med.value,
      fytd: {
        received: need(r[8], `${spec.form} FYTD received`),
        approved: need(r[9], `${spec.form} FYTD approved`),
        denied: need(r[10], `${spec.form} FYTD denied`),
        ...(fytdCompletions !== null ? { completions: fytdCompletions } : {}),
      },
      source: { sourceId: 'uscis.quarterly_all_forms', url: ref.url, via: ref.via, period: quarter, retrievedAt: ref.retrievedAt, ...(ref.sha256 ? { sha256: ref.sha256 } : {}), evidence: 'F' },
    });
  }
  return { quarter, sheet: name, rows };
}

// ── approval baselines (03 §3.2 step 6) ──────────────────────────────────────────────────────

const MONTH_RANGE_ES: Record<number, string> = { 1: 'oct–dic', 2: 'ene–mar', 3: 'abr–jun', 4: 'jul–sept' };
const MONTH_RANGE_EN: Record<number, string> = { 1: 'Oct–Dec', 2: 'Jan–Mar', 3: 'Apr–Jun', 4: 'Jul–Sep' };

function calendarYearOfQuarter(q: FiscalQuarter): number {
  return q.q === 1 ? q.fy - 1 : q.fy;
}

export function quarterLabel(q: FiscalQuarter): { es: string; en: string } {
  const y = calendarYearOfQuarter(q);
  return {
    es: `Año fiscal ${q.fy}, trimestre ${q.q} (${MONTH_RANGE_ES[q.q]} ${y})`,
    en: `FY${q.fy} Q${q.q} (${MONTH_RANGE_EN[q.q]} ${y})`,
  };
}

/**
 * Cuban approval shares: every quarter of the latest fiscal year present, then the FYTD share of the
 * latest quarter (G0 / key facts §7: FY26 Q1 4,098/4,471; Q2 50/95; Q3 139/586; FYTD 4,287/5,152).
 */
export function approvalBaselines(rows: QuarterRow[]): ApprovalBaseline[] {
  const cuban = rows.filter((r) => r.form === 'I-485 (Cuban)').sort((a, b) => cmpQuarter(a.quarter, b.quarter));
  const latest = cuban.at(-1);
  if (!latest) return [];
  const out: ApprovalBaseline[] = [];
  for (const r of cuban.filter((x) => x.quarter.fy === latest.quarter.fy)) {
    if (r.completions <= 0) continue;
    out.push({ label: quarterLabel(r.quarter), numerator: r.approved, denominator: r.completions, share: r.approved / r.completions, period: quarterKey(r.quarter), kind: 'share' });
  }
  const f = latest.fytd;
  const denom = f ? (f.completions ?? f.approved + f.denied) : 0;
  if (f && denom > 0 && latest.quarter.q > 1) {
    out.push({
      label: { es: `Año fiscal ${latest.quarter.fy} hasta el trimestre ${latest.quarter.q}`, en: `FY${latest.quarter.fy} through Q${latest.quarter.q}` },
      numerator: f.approved, denominator: denom, share: f.approved / denom, period: `FY${latest.quarter.fy} Q1–Q${latest.quarter.q}`, kind: 'share',
    });
  }
  return out;
}

/** Replace-or-append rows by (form, quarter); output sorted by quarter, then the ALL_FORMS_ROWS order. */
export function mergeQuarterRows(prev: QuarterRow[], next: QuarterRow[]): QuarterRow[] {
  const keep = prev.filter((p) => !next.some((n) => n.form === p.form && sameQuarter(n.quarter, p.quarter)));
  const order = (f: QuarterForm) => ALL_FORMS_ROWS.findIndex((s) => s.form === f);
  return [...keep, ...next].sort((a, b) => cmpQuarter(a.quarter, b.quarter) || order(a.form) - order(b.form));
}
