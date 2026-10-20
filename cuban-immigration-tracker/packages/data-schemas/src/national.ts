/**
 * 02-data-model.md §2.2 — `national.json` (pipeline file, passthrough).
 *
 * Source: the monthly "Report to Congress — Number of Service-Wide Forms by Month" CSV, row
 * "I-485 … (Cuban)" (docs/research/04-uscis-data-sources.md §1.1 [F]). The CSV's I-765 line is one
 * national line for ALL categories (no (c)(9) split; same section).
 *
 * Validation (02 §8): counts ≥ 0; `pendingOver6 ≤ pending`; `ym` strictly increasing and gap-free
 * from `firstModelMonth` on (the Aug 2024 file is missing from the mirror, so gaps are allowed
 * only before the model window; 04 EST-1).
 */
import { z } from './zod';
import {
  CountSchema, ISODateTimeSchema, SourceRefSchema, YearMonthSchema, nextYm, pipelineObject,
} from './primitives';

const monthlyCore = {
  ym: YearMonthSchema,
  received: CountSchema, // count_flow
  approved: CountSchema, // count_flow
  denied: CountSchema, // count_flow
  pending: CountSchema, // count_stock — HEADLINE pending
  pendingOver6: CountSchema.nullable(), // count_stock_over_6mo (null when the source row lacks it)
  avgMonths: z.number().nonnegative().nullable(), // mean_months_completed
};

/** The previous values of a revised row (Q3 revision gate, 03 §4). */
export const MonthlyRowRevisionSchema = pipelineObject({
  previous: pipelineObject(monthlyCore),
  detectedAt: ISODateTimeSchema,
});

/** 02 §2.2 `MonthlyRow`. */
export const MonthlyRowSchema = pipelineObject({
  ...monthlyCore,
  revision: MonthlyRowRevisionSchema.optional(),
  source: SourceRefSchema,
}).superRefine((r, ctx) => {
  if (r.pendingOver6 !== null && r.pendingOver6 > r.pending) {
    ctx.addIssue({ code: 'custom', path: ['pendingOver6'], message: `pendingOver6 ${r.pendingOver6} > pending ${r.pending} (02 §8)` });
  }
});
export type MonthlyRow = z.infer<typeof MonthlyRowSchema>;

/** 02 §2.2 `I765NationalRow` (all categories; footnote 12 caveat for Mar–Apr 2025, doc 04 §1.1). */
export const I765NationalRowSchema = pipelineObject({
  ym: YearMonthSchema,
  received: CountSchema,
  approved: CountSchema,
  denied: CountSchema,
  pending: CountSchema,
  avgMonths: z.number().nonnegative().nullable(),
  caveat: z.literal('cxi_status_flips_2025_03_04').optional(),
  source: SourceRefSchema,
});
export type I765NationalRow = z.infer<typeof I765NationalRowSchema>;

/** Strictly increasing `ym`; optionally gap-free from `from` on. Pushes issues under `key`. */
function checkMonthSeries(
  rows: { ym: string }[], key: string, from: string | null,
  ctx: { addIssue(i: { code: 'custom'; path: (string | number)[]; message: string }): void },
): void {
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1]!.ym;
    const cur = rows[i]!.ym;
    if (cur <= prev) {
      ctx.addIssue({ code: 'custom', path: [key, i, 'ym'], message: `ym ${cur} not after ${prev} (02 §8)` });
    } else if (from !== null && prev >= from && cur !== nextYm(prev)) {
      ctx.addIssue({ code: 'custom', path: [key, i, 'ym'], message: `gap ${prev} → ${cur} inside the model window from ${from} (02 §8)` });
    }
  }
  if (from !== null) {
    const firstIn = rows.find((r) => r.ym >= from);
    if (firstIn && firstIn.ym !== from) {
      ctx.addIssue({ code: 'custom', path: [key], message: `firstModelMonth ${from} has no row (first row in window is ${firstIn.ym})` });
    }
  }
}

/** 02 §2.2 `NationalFile`. `firstModelMonth` is "2024-09" (04 EST-1). */
export const NationalFileSchema = pipelineObject({
  rows: z.array(MonthlyRowSchema).min(1),
  i765National: z.array(I765NationalRowSchema),
  firstModelMonth: YearMonthSchema,
}).superRefine((f, ctx) => {
  checkMonthSeries(f.rows, 'rows', f.firstModelMonth, ctx);
  checkMonthSeries(f.i765National, 'i765National', null, ctx);
});
export type NationalFile = z.infer<typeof NationalFileSchema>;
