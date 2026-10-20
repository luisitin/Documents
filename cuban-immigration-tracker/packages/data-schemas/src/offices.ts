/**
 * 02-data-model.md §2.4 — `offices.json` (pipeline file, passthrough).
 *
 * Sources: the quarterly I-485 by-field-office workbook, sheet `I485_by_State`, whose
 * "Humanitarian-based" column equals Cuban + Refugee + Asylee exactly
 * (docs/research/04-uscis-data-sources.md §1.3 [F]); Processing Times records via the
 * jzebedee/uscis SQLite mirror (doc 13 §1.2, §1.6). Office codes are READ from data, never
 * hard-coded (KEN vs KND; key facts §6 rule 1). There is no CAA subtype in the tool, so the
 * I-485 `131A-FAM` record is a proxy (`isProxyForCaa`, doc 13 §1.3; key facts §6 rule 4).
 */
import { z } from './zod';
import {
  CountSchema, FiscalQuarterSchema, ISODateSchema, NonEmptyStringSchema, SourceRefSchema, pipelineObject,
} from './primitives';

/** Field-office or service-center code, e.g. "HIA", "NBC". */
export const OfficeCodeSchema = z.string().regex(/^[A-Z]{3}$/, 'expected a 3-letter office code');
/** Two-letter US state / territory code from the workbook heading. */
export const StateCodeSchema = z.string().regex(/^[A-Z]{2}$/, 'expected a 2-letter state code');

/** 02 §2.4 `Office`. */
export const OfficeSchema = pipelineObject({
  code: OfficeCodeSchema,
  name: NonEmptyStringSchema,
  state: StateCodeSchema,
  cubanFocus: z.boolean(), // key facts §6 list
  kind: z.enum(['field_office', 'service_center']),
});
export type Office = z.infer<typeof OfficeSchema>;

/** 02 §2.4 `ProcessingTimeRecord` (parser accepts 1- or 2-value ranges, doc 13 §1.1). */
export const ProcessingTimeRecordSchema = pipelineObject({
  form: z.enum(['I-485', 'I-765']),
  subtype: NonEmptyStringSchema, // '131A-FAM' | '147-C9' | '147-C11' | …
  officeCode: OfficeCodeSchema, // field office, or NBC / SCD
  months80: z.number().nonnegative().nullable(), // p80_months_completed_6mo
  monthsLowerLegacy: z.number().nonnegative().nullable().optional(), // pre-2025 second range value
  inquiryDate: ISODateSchema.nullable(), // inquiry_date_p93 (service_request_date)
  publicationDate: ISODateSchema,
  isProxyForCaa: z.boolean(), // true for 131A-FAM
  source: SourceRefSchema, // retrievedAt = original retrieval (stale dates are labelled)
});
export type ProcessingTimeRecord = z.infer<typeof ProcessingTimeRecordSchema>;

/** 02 §2.4 `OfficeQuarterStat` (humanitarian column; 'D' cells before FY25 Q3 → suppressed). */
export const OfficeQuarterStatSchema = pipelineObject({
  officeCode: OfficeCodeSchema,
  quarter: FiscalQuarterSchema,
  received: CountSchema.nullable(),
  approved: CountSchema.nullable(),
  denied: CountSchema.nullable(),
  pending: CountSchema.nullable(),
  suppressed: z.boolean(),
  source: SourceRefSchema,
});
export type OfficeQuarterStat = z.infer<typeof OfficeQuarterStatSchema>;

/** One office/subtype series of case-inquiry dates for the crude remedy ETA (doc 15 §2.2). */
export const InquiryDateHistorySchema = pipelineObject({
  officeCode: OfficeCodeSchema,
  subtype: NonEmptyStringSchema,
  points: z.array(pipelineObject({ publicationDate: ISODateSchema, inquiryDate: ISODateSchema })),
});
export type InquiryDateHistory = z.infer<typeof InquiryDateHistorySchema>;

/**
 * 02 §2.4 `OfficesFile`. Semantic checks: office codes unique; every `stateOffices` code is a
 * listed office whose `state` matches; history points strictly increasing by publication date.
 */
export const OfficesFileSchema = pipelineObject({
  offices: z.array(OfficeSchema),
  stateOffices: z.record(StateCodeSchema, z.array(OfficeCodeSchema)),
  processingTimes: z.array(ProcessingTimeRecordSchema),
  quarterly: z.array(OfficeQuarterStatSchema),
  inquiryDateHistory: z.array(InquiryDateHistorySchema),
}).superRefine((f, ctx) => {
  const byCode = new Map<string, Office>();
  f.offices.forEach((o, i) => {
    if (byCode.has(o.code)) ctx.addIssue({ code: 'custom', path: ['offices', i, 'code'], message: `duplicate office ${o.code}` });
    byCode.set(o.code, o);
  });
  for (const state of Object.keys(f.stateOffices)) {
    f.stateOffices[state]!.forEach((c, i) => {
      const o = byCode.get(c);
      if (!o) ctx.addIssue({ code: 'custom', path: ['stateOffices', state, i], message: `office ${c} is not listed in offices` });
      else if (o.state !== state) ctx.addIssue({ code: 'custom', path: ['stateOffices', state, i], message: `office ${c} is in ${o.state}, not ${state}` });
    });
  }
  f.inquiryDateHistory.forEach((h, i) => {
    for (let j = 1; j < h.points.length; j++) {
      if (h.points[j]!.publicationDate <= h.points[j - 1]!.publicationDate) {
        ctx.addIssue({ code: 'custom', path: ['inquiryDateHistory', i, 'points', j], message: 'publicationDate not increasing' });
      }
    }
  });
});
export type OfficesFile = z.infer<typeof OfficesFileSchema>;
