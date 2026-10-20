/**
 * 02-data-model.md §2.6 — `alerts.json` (CURATED: strict; one JSON per alert in
 * `data/curated/alerts/`, PR-reviewed with author ≠ reviewer, 05 §3.1) and the pipeline's
 * `candidates/alert-candidates.json` (never shown in the app).
 *
 * Copy rules (05 §5; 07 §8): informational, never directive; the 2025–2026 holds are described
 * as vacated by a court under the APA, never as "unconstitutional" (key facts §9, Dorcas).
 */
import { z } from './zod';
import {
  EvidenceSchema, ISODateSchema, ISODateTimeSchema, LocalizedSchema, NonEmptyStringSchema, SourceIdSchema, UrlSchema,
  curatedObject, pipelineObject,
} from './primitives';
import { ChannelOrAllSchema } from './policy';

/** A cited source: label, URL and evidence tag (07 §10 rule 4). */
export const CitedSourceSchema = curatedObject({ label: NonEmptyStringSchema, url: UrlSchema, evidence: EvidenceSchema });
export type CitedSource = z.infer<typeof CitedSourceSchema>;

/** 02 §2.6 `Alert`. `id` is `<date>-<slug>`, e.g. "2026-08-05-pa-2026-05". */
export const AlertSchema = curatedObject({
  id: z.string().regex(/^\d{4}-\d{2}-\d{2}-[a-z0-9]+(-[a-z0-9]+)*$/, 'expected <YYYY-MM-DD>-<slug>'),
  date: ISODateSchema,
  kind: z.enum(['policy', 'court', 'data', 'fees', 'enforcement', 'ead', 'scam', 'i220a']),
  severity: z.enum(['high', 'medium', 'info']),
  title: LocalizedSchema,
  body: LocalizedSchema,
  whatChangedForYou: LocalizedSchema.optional(),
  affects: curatedObject({
    channels: z.array(ChannelOrAllSchema).optional(),
    filedBefore: ISODateSchema.optional(),
    filedAfter: ISODateSchema.optional(),
    hasEad: z.boolean().optional(),
  }),
  ruleIds: z.array(NonEmptyStringSchema).optional(), // AlertRule ids this alert ACTIVATES
  supersedes: z.array(NonEmptyStringSchema).optional(), // alert ids whose activations are switched off
  expires: ISODateSchema.optional(),
  docket: curatedObject({ court: NonEmptyStringSchema, number: NonEmptyStringSchema, courtListenerId: z.number().int().positive().optional() }).optional(),
  sources: z.array(CitedSourceSchema).min(1),
  reviewedBy: NonEmptyStringSchema, // human reviewer handle
  status: z.enum(['published', 'retracted']),
}).superRefine((a, ctx) => {
  if (!a.id.startsWith(`${a.date}-`)) ctx.addIssue({ code: 'custom', path: ['id'], message: `id must start with its date ${a.date}` });
  if (a.expires !== undefined && a.expires < a.date) ctx.addIssue({ code: 'custom', path: ['expires'], message: 'expires before date' });
  if (a.supersedes?.includes(a.id)) ctx.addIssue({ code: 'custom', path: ['supersedes'], message: 'an alert cannot supersede itself' });
  if (a.affects.filedBefore && a.affects.filedAfter && a.affects.filedAfter >= a.affects.filedBefore) {
    ctx.addIssue({ code: 'custom', path: ['affects'], message: 'filedAfter must be before filedBefore' });
  }
});
export type Alert = z.infer<typeof AlertSchema>;

/** 02 §2.6 `AlertsFile` (ids unique). */
export const AlertsFileSchema = curatedObject({ alerts: z.array(AlertSchema) }).superRefine((f, ctx) => {
  const seen = new Set<string>();
  f.alerts.forEach((a, i) => {
    if (seen.has(a.id)) ctx.addIssue({ code: 'custom', path: ['alerts', i, 'id'], message: `duplicate alert ${a.id}` });
    seen.add(a.id);
  });
});
export type AlertsFile = z.infer<typeof AlertsFileSchema>;

/** 02 §2.6 `AlertCandidate` (pipeline output for human triage; never shown in the app). */
export const AlertCandidateSchema = pipelineObject({
  id: NonEmptyStringSchema,
  foundAt: ISODateTimeSchema,
  source: SourceIdSchema,
  title: NonEmptyStringSchema,
  url: UrlSchema,
  matchedTerms: z.array(NonEmptyStringSchema),
  docketNumber: NonEmptyStringSchema.optional(),
});
export type AlertCandidate = z.infer<typeof AlertCandidateSchema>;
export const AlertCandidatesFileSchema = z.array(AlertCandidateSchema);
