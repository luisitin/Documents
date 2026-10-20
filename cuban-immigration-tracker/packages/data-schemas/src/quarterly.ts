/**
 * 02-data-model.md §2.3 — `quarterly.json` (pipeline file, passthrough; historic medians are
 * merged from `curated/historic_medians.json`).
 *
 * Sources: quarterly "All USCIS Application and Petition Form Types" workbook
 * (docs/research/04-uscis-data-sources.md §1.2 [F]; its "Processing Time" is the MEDIAN,
 * footnote 6) and the historic national medians page (§2.6, values via press [S-sec]).
 * `pendingWorkbook` is labelled "informe trimestral" and is never the headline pending: it runs
 * ≈3–4 % below the monthly CSV at every quarter end (§1.1 cross-check).
 */
import { z } from './zod';
import {
  CountSchema, EvidenceSchema, FiscalQuarterSchema, ISODateSchema, LocalizedSchema, NonEmptyStringSchema,
  ShareSchema, SourceRefSchema, UrlSchema, pipelineObject,
} from './primitives';

/** Workbook row labels used by the app (doc 04 §1.2 table). */
export const QuarterFormSchema = z.enum([
  'I-485 (Cuban)', 'I-765 (Adjustment Of Status)', 'I-765 (All Other)', 'I-485 (Refugee)', 'I-485 (Asylum)',
]);
export type QuarterForm = z.infer<typeof QuarterFormSchema>;

/** 02 §2.3 `QuarterRow`. */
export const QuarterRowSchema = pipelineObject({
  quarter: FiscalQuarterSchema,
  form: QuarterFormSchema,
  received: CountSchema,
  approved: CountSchema,
  denied: CountSchema,
  completions: CountSchema,
  pendingWorkbook: CountSchema, // count_stock, "informe trimestral" — NEVER headline
  medianMonths: z.number().nonnegative().nullable(), // median_months_completed
  fytd: pipelineObject({
    received: CountSchema,
    approved: CountSchema,
    denied: CountSchema,
    completions: CountSchema.optional(),
  }).optional(),
  source: SourceRefSchema,
});
export type QuarterRow = z.infer<typeof QuarterRowSchema>;

/** 02 §2.3 `HistoricMedian` (curated from historic-pt via press [S-sec], doc 04 §2.6). */
export const HistoricMedianSchema = pipelineObject({
  fy: z.number().int().min(2000).max(2100),
  months: z.number().nonnegative(),
  cutDate: ISODateSchema.nullable(),
  fyToDate: z.boolean(),
  sourceUrl: UrlSchema,
  evidence: EvidenceSchema,
});
export type HistoricMedian = z.infer<typeof HistoricMedianSchema>;

/**
 * 02 §2.3 `ApprovalBaseline`: approvals / completions for a period, computed by the pipeline.
 * `share` must equal numerator / denominator (to 5e-4, so a 4-decimal rounding is accepted).
 */
export const ApprovalBaselineSchema = pipelineObject({
  label: LocalizedSchema,
  numerator: CountSchema,
  denominator: z.number().int().positive(),
  share: ShareSchema,
  period: NonEmptyStringSchema,
  kind: z.literal('share'),
}).superRefine((b, ctx) => {
  if (b.numerator > b.denominator) {
    ctx.addIssue({ code: 'custom', path: ['numerator'], message: 'numerator > denominator' });
  } else if (Math.abs(b.share - b.numerator / b.denominator) > 5e-4) {
    ctx.addIssue({ code: 'custom', path: ['share'], message: `share ${b.share} ≠ ${b.numerator}/${b.denominator}` });
  }
});
export type ApprovalBaseline = z.infer<typeof ApprovalBaselineSchema>;

/** 02 §2.3 `QuarterlyFile`. Rows of one form are unique per quarter. */
export const QuarterlyFileSchema = pipelineObject({
  rows: z.array(QuarterRowSchema),
  historicMedians: z.array(HistoricMedianSchema),
  approvalBaselines: z.array(ApprovalBaselineSchema),
}).superRefine((f, ctx) => {
  const seen = new Set<string>();
  f.rows.forEach((r, i) => {
    const k = `${r.form}|${r.quarter.fy}Q${r.quarter.q}`;
    if (seen.has(k)) ctx.addIssue({ code: 'custom', path: ['rows', i], message: `duplicate row ${k}` });
    seen.add(k);
  });
});
export type QuarterlyFile = z.infer<typeof QuarterlyFileSchema>;
