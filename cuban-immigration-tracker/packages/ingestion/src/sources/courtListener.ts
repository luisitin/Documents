/**
 * P9 — CourtListener REST v4 docket entries (03-data-pipeline.md §2.2 P9; key facts §8–§9;
 * docs/research/13-live-data-endpoints-and-probe-plan.md §7).
 *
 * `GET https://www.courtlistener.com/api/rest/v4/docket-entries/?docket=<id>&order_by=-date_filed`
 * with `Authorization: Token <COURTLISTENER_TOKEN>` (v4.3 enforces auth: anonymous → 401, doc 13 §7.1).
 * At most 5 requests per run (authenticated limits 5/min, 50/h, 125/day). No token →
 * `skipped_no_secret`. Candidates are keyed on the DOCKET NUMBER, never the caption (the
 * D. Mass. caption changed Noem → Mullin, doc 13 §7.2).
 */
import { z } from 'zod';
import type { AlertCandidate, ISODate, ISODateTime } from '@caa/data-schemas';
import { COURTLISTENER_API, DOCKETS } from '../constants';
import { SourceError } from '../util';

export const MAX_REQUESTS_PER_RUN = 5;

export const ClEntrySchema = z.looseObject({
  id: z.number(),
  entry_number: z.number().nullable().optional(),
  date_filed: z.string().nullable().optional(),
  description: z.string().default(''),
});
export const ClEntriesSchema = z.looseObject({ count: z.number().optional(), next: z.string().nullable().optional(), results: z.array(ClEntrySchema) });

export function docketEntriesUrl(docketId: number): string {
  return `${COURTLISTENER_API}docket-entries/?docket=${docketId}&order_by=-date_filed&page_size=20`;
}

export function authHeaders(token: string): Record<string, string> {
  return { authorization: `Token ${token}` };
}

/** Docket entries filed on or after `since` → candidates `cl:<docketNumber>:<entryId>`. */
export function clCandidates(json: unknown, docket: (typeof DOCKETS)[number], since: ISODate, foundAt: ISODateTime): AlertCandidate[] {
  const r = ClEntriesSchema.safeParse(json);
  if (!r.success) throw new SourceError(`CourtListener response: ${r.error.issues.slice(0, 3).map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
  return r.data.results
    .filter((e) => (e.date_filed ?? '') >= since)
    .map((e) => ({
      id: `cl:${docket.docketNumber}:${e.id}`,
      foundAt,
      source: 'courtlistener.v4' as const,
      title: `${docket.court} ${docket.docketNumber}${e.entry_number ? ` ECF ${e.entry_number}` : ''} (${e.date_filed ?? 'undated'}): ${(e.description || 'docket entry').slice(0, 240)}`,
      url: `https://www.courtlistener.com/docket/${docket.id}/`,
      matchedTerms: ['docket'],
      docketNumber: docket.docketNumber,
    }));
}
