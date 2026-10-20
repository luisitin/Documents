/**
 * doc 13 §12.4 `fr.*` probes — Federal Register API v1 (doc 13 §6; keyless). The search must include
 * `2025-05128` (CHNV termination, 2025-03-25) with `publication_date ≥ 2025-03-01`; the FRP-termination
 * title query should return `2025-22744` [S-fc]; the six agency slugs must exist.
 */
import { z } from 'zod';
import { FR_DOCUMENTS, FR_FIXTURE_DOC } from '../../constants';
import { bodyJson } from '../../http';
import { frSearchUrl, parseFrSearch } from '../../sources/federalRegister';
import type { ProbeModule } from '../index';

const SLUGS = ['homeland-security-department', 'u-s-citizenship-and-immigration-services', 'u-s-customs-and-border-protection', 'executive-office-of-the-president', 'justice-department', 'executive-office-for-immigration-review'];

export const federalRegisterProbes: ProbeModule = {
  group: 'federal-register',
  async run(ctx) {
    const g = this.group;
    await ctx.probe(g, {
      id: 'fr.search', url: frSearchUrl('2025-03-01'), accept: 'application/json', sample: 'federal-register/search-dhs-cuba-parole.json',
      check: (r) => {
        const docs = parseFrSearch(bodyJson(r));
        const found = docs.some((d) => d.document_number === FR_FIXTURE_DOC);
        return { assertions: { results: docs.length, has2025_05128: found }, ...(found ? {} : { classification: 'schema_mismatch' as const, note: `${FR_FIXTURE_DOC} not in the first page` }) };
      },
    });
    await ctx.probe(g, {
      id: 'fr.doc', url: `https://www.federalregister.gov/api/v1/documents/${FR_FIXTURE_DOC}.json`, accept: 'application/json', sample: `federal-register/${FR_FIXTURE_DOC}.json`,
      check: (r) => {
        const t = z.looseObject({ title: z.string() }).parse(bodyJson(r)).title;
        return /Termination of Parole Processes/i.test(t) ? { assertions: { title: t } } : { classification: 'schema_mismatch', note: `title "${t}"` };
      },
    });
    const frp = new URLSearchParams({ 'conditions[term]': '"Termination of Family Reunification Parole Processes"', 'conditions[publication_date][gte]': '2025-12-01', per_page: '5' });
    await ctx.probe(g, {
      id: 'fr.search.frp', url: `${FR_DOCUMENTS}?${frp.toString()}`, accept: 'application/json', sample: 'federal-register/search-frp-termination.json',
      check: (r) => {
        const nums = parseFrSearch(bodyJson(r)).map((d) => d.document_number);
        return { assertions: { documentNumbers: nums }, findings: [`FR_FRP_TERMINATION=${nums[0] ?? 'none'}`] };
      },
    });
    await ctx.probe(g, {
      id: 'fr.agencies', url: 'https://www.federalregister.gov/api/v1/agencies.json', accept: 'application/json', sample: 'federal-register/agencies.json',
      check: (r) => {
        const slugs = z.array(z.looseObject({ slug: z.string() })).parse(bodyJson(r)).map((a) => a.slug);
        const missing = SLUGS.filter((s) => !slugs.includes(s));
        return missing.length ? { classification: 'schema_mismatch', note: `missing slugs ${missing.join(', ')}` } : { assertions: { slugs: SLUGS.length } };
      },
    });
  },
};
