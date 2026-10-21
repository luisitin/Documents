/**
 * P7 — Federal Register API v1 (03-data-pipeline.md §2.2 P7; docs/research/13-live-data-endpoints-and-probe-plan.md §6).
 * Keyless JSON. Output: alert CANDIDATES for human triage (never shown in the app; alerts are curated
 * and PR-reviewed, 05 §3.1). Regression fixture: the query must find `2025-05128` (CHNV termination,
 * published 2025-03-25).
 */
import { z } from 'zod';
import type { AlertCandidate, ISODate, ISODateTime } from '@caa/data-schemas';
import { FR_AGENCIES, FR_DOCUMENTS, FR_TERM } from '../constants';
import { SourceError } from '../util';

/** Response shape (doc 13 §12.5 `FrSearch`; loose: unknown fields are ignored). */
export const FrDocSchema = z.looseObject({
  document_number: z.string(),
  title: z.string(),
  type: z.string().optional(),
  publication_date: z.string(),
  html_url: z.string(),
  pdf_url: z.string().nullable().optional(),
  abstract: z.string().nullable().optional(),
  agencies: z.array(z.looseObject({ slug: z.string().optional(), name: z.string().optional() })).optional(),
});
export const FrSearchSchema = z.looseObject({
  count: z.number(),
  total_pages: z.number().optional(),
  next_page_url: z.string().nullable().optional(),
  results: z.array(FrDocSchema).default([]),
});
export type FrDoc = z.infer<typeof FrDocSchema>;

/** 03 P7 query URL (publication date ≥ `since`, newest first, 100 per page). */
export function frSearchUrl(since: ISODate, term: string = FR_TERM): string {
  const p = new URLSearchParams();
  p.append('conditions[term]', term);
  for (const a of FR_AGENCIES) p.append('conditions[agencies][]', a);
  p.append('conditions[publication_date][gte]', since);
  p.append('order', 'newest');
  p.append('per_page', '100');
  for (const f of ['document_number', 'title', 'type', 'publication_date', 'agencies', 'html_url', 'pdf_url', 'abstract']) p.append('fields[]', f);
  return `${FR_DOCUMENTS}?${p.toString()}`;
}

const TERMS: { label: string; re: RegExp }[] = [
  { label: 'Cuban Adjustment Act', re: /\bCuban Adjustment Act\b/i }, { label: 'Cuban', re: /\bCubans?\b/i }, { label: 'Cuba', re: /\bCuba\b/i },
  { label: 'CHNV', re: /\bCHNV\b/i }, { label: 'parolee', re: /\bparolees?\b/i }, { label: 'parole', re: /\bparole\b/i },
];

export function parseFrSearch(json: unknown): FrDoc[] {
  return parseFrSearchPage(json).docs;
}

/** One result page plus the next page's URL (only when it is on the FR API itself; else null). */
export function parseFrSearchPage(json: unknown): { docs: FrDoc[]; next: string | null } {
  const r = FrSearchSchema.safeParse(json);
  if (!r.success) throw new SourceError(`Federal Register response: ${r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).slice(0, 3).join('; ')}`);
  const n = r.data.next_page_url;
  return { docs: r.data.results, next: n && n.startsWith(`${FR_DOCUMENTS}?`) ? n : null };
}

/** FR documents → candidates keyed `fr:<document_number>`, with the matched terms. */
export function frCandidates(docs: FrDoc[], foundAt: ISODateTime): AlertCandidate[] {
  return docs.map((d) => {
    const hay = `${d.title} ${d.abstract ?? ''}`;
    const matchedTerms = TERMS.filter((t) => t.re.test(hay)).map((t) => t.label);
    return { id: `fr:${d.document_number}`, foundAt, source: 'fr.api' as const, title: d.title, url: d.html_url, matchedTerms: matchedTerms.length ? matchedTerms : ['query'] };
  });
}
