/**
 * doc 13 §12.4 `ohss.*` probes — DHS OHSS monthly tables and the Yearbook (doc 13 §4; doc 05).
 * Not ingested in the MVP (03 §2.2 "deliberately not ingested"); probed so the v2 decision has data.
 * Browser UA. The monthly file href is taken from the page (fallback: the one verified instance of
 * the November 2024 tables, doc 13 §4.1).
 */
import { bodyText } from '../../http';
import type { ProbeModule } from '../index';

const PAGE = 'https://ohss.dhs.gov/topics/immigration/immigration-enforcement/monthly-tables';
const FALLBACK_FILE = 'https://ohss.dhs.gov/sites/default/files/2025-01/2025_0116_ohss_immigration-enforcement-and-legal-processes-tables-november-2024.xlsx';
const DICTIONARY = 'https://ohss.dhs.gov/about-our-data/governance/data-dictionaries/immigration-enforcement-and-legal-processes-monthly';

const hrefs = (html: string, re: RegExp) => [...html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]!).filter((h) => re.test(h))
  .map((h) => (h.startsWith('/') ? `https://ohss.dhs.gov${h}` : h));

export const ohssProbes: ProbeModule = {
  group: 'ohss',
  async run(ctx) {
    const g = this.group;
    const page = await ctx.probe(g, { id: 'ohss.monthly.page', url: PAGE, accept: 'text/html', sample: 'ohss/monthly-tables.html',
      check: (r) => ({ assertions: { files: hrefs(bodyText(r), /immigration-enforcement-and-legal-processes-tables-[a-z]+-\d{4}\.xlsx$/i).length } }) });
    const files = page.classification === 'ok' ? hrefs(bodyText(ctx.bodies.get('ohss.monthly.page')!), /immigration-enforcement-and-legal-processes-tables-[a-z]+-\d{4}\.xlsx$/i).sort() : [];
    await ctx.probe(g, { id: 'ohss.monthly.file', url: files.at(-1) ?? FALLBACK_FILE, accept: '*/*', sample: `ohss/${(files.at(-1) ?? FALLBACK_FILE).split('/').pop()}` });
    const dict = await ctx.probe(g, { id: 'ohss.dictionary.page', url: DICTIONARY, accept: 'text/html' });
    const x = dict.classification === 'ok' ? hrefs(bodyText(ctx.bodies.get('ohss.dictionary.page')!), /\.xlsx$/i)[0] : undefined;
    if (x) await ctx.probe(g, { id: 'ohss.dictionary', url: x, accept: '*/*', sample: 'ohss/data-dictionary.xlsx' });
    else ctx.skip(g, 'ohss.dictionary', DICTIONARY, dict.classification === 'ok' ? 'schema_mismatch' : dict.classification, dict.classification === 'ok' ? 'no .xlsx link on the page' : 'page not reachable');
    await ctx.probe(g, { id: 'ohss.yearbook', url: 'https://ohss.dhs.gov/topics/immigration/yearbook/2024', accept: 'text/html', sample: 'ohss/yearbook-2024.html',
      check: (r) => ({ assertions: { lprWorkbook: /lawful_permanent_residents_fy2024\.xlsx/i.test(bodyText(r)) } }) });
    await ctx.probe(g, { id: 'ohss.yearbook.lprsupp1', url: 'https://ohss.dhs.gov/topics/immigration/yearbook/2024/LPRsupptable1', accept: 'text/html' });
  },
};
