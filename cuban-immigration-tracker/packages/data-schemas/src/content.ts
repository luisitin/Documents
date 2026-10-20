/**
 * 02-data-model.md §2.7 — `content.json` (CURATED: strict; myths for "¿Es verdad?", peer-reason
 * copy for S4, glossary additions). Peer reason ids are the exact U2 set of 04 §9.2 / 00 S4.
 */
import { z } from './zod';
import { ISODateSchema, LocalizedSchema, NonEmptyStringSchema, curatedObject } from './primitives';
import { CitedSourceSchema } from './alerts';

/** 02 §2.7 `PeerReasonId` (00-product-spec.md S4 table). */
export const PeerReasonIdSchema = z.enum([
  'chnv_r1', 'cbp_one_no_r1', 'ead_before_r3', 'ead_swept_r3', 'c9_erequest_available',
  'renewal_no_autoext', 'non_fifo', 'office_diff',
]);
export type PeerReasonId = z.infer<typeof PeerReasonIdSchema>;

/** 02 §2.7 `Myth`. */
export const MythSchema = curatedObject({
  id: NonEmptyStringSchema,
  claim: LocalizedSchema,
  verdict: z.enum(['false', 'misleading', 'true', 'unknown']),
  since: ISODateSchema.optional(),
  explanation: LocalizedSchema,
  sources: z.array(CitedSourceSchema).min(1),
});
export type Myth = z.infer<typeof MythSchema>;

/** 02 §2.7 `PeerReasonCopy`. */
export const PeerReasonCopySchema = curatedObject({
  id: PeerReasonIdSchema,
  text: LocalizedSchema,
  confidence: z.enum(['low', 'medium', 'medium_high', 'high']),
  source: NonEmptyStringSchema,
});
export type PeerReasonCopy = z.infer<typeof PeerReasonCopySchema>;

/** 02 §2.7 `ContentFile` (myth ids and peer-reason ids unique). */
export const ContentFileSchema = curatedObject({
  myths: z.array(MythSchema),
  peerReasons: z.array(PeerReasonCopySchema),
  glossaryExtra: z.array(curatedObject({ term: LocalizedSchema, definition: LocalizedSchema })),
}).superRefine((c, ctx) => {
  const dup = (xs: string[]) => xs.find((x, i) => xs.indexOf(x) !== i);
  const m = dup(c.myths.map((x) => x.id));
  if (m) ctx.addIssue({ code: 'custom', path: ['myths'], message: `duplicate myth ${m}` });
  const p = dup(c.peerReasons.map((x) => x.id));
  if (p) ctx.addIssue({ code: 'custom', path: ['peerReasons'], message: `duplicate peer reason ${p}` });
});
export type ContentFile = z.infer<typeof ContentFileSchema>;
