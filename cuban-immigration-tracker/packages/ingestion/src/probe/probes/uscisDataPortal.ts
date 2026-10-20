/**
 * doc 13 §12.4 `portal.*` probes — the USCIS Immigration and Citizenship Data portal (doc 13 §3; doc 04 §1).
 * Browser UA (www.uscis.gov's Drupal anti-bot 403s default agents). The three regression files are
 * parsed with the pipeline's own parsers and compared with the doc 13 §3.4 numbers (FY26 Q3 Cuban
 * 6,279 / 139 / 447 / 342,360; Aug 2026 pending 355,520; Hialeah humanitarian pending 37,486).
 * `portal.monthly.next` / `portal.quarterly.next` HEAD the predicted next files (200 → NEW_MONTH /
 * NEW_QUARTER finding; 404 → not_yet).
 */
import type { YearMonth } from '@caa/data-schemas';
import { PORTAL_INDEX_URL, USCIS_DATA_DIR, allFormsUrls, byOfficeUrls, monthlyCsvDirectUrls } from '../../constants';
import { bodyText } from '../../http';
import { GOLDEN_FIXTURES } from '../../qa';
import { parseByOffice } from '../../sources/i485ByOffice';
import { parseMonthlyCsv } from '../../sources/monthlyCsv';
import { parsePortalIndex } from '../../sources/portalIndex';
import { parseAllForms } from '../../sources/quarterlyAllForms';
import { addMonthsYm, prevQuarter, quarterKey, quarterOfMonth } from '../../util';
import type { ProbeModule } from '../index';

const ref = (url: string) => ({ url, via: 'direct' as const, retrievedAt: new Date().toISOString().slice(0, 19) + 'Z' });

export const uscisDataPortalProbes: ProbeModule = {
  group: 'uscis-portal',
  async run(ctx) {
    const g = this.group;
    const index = await ctx.probe(g, {
      id: 'portal.index', url: PORTAL_INDEX_URL, accept: 'text/html,application/xhtml+xml', sample: 'uscis-portal/index.html',
      check: (r) => {
        const links = parsePortalIndex(bodyText(r));
        const byKind: Record<string, number> = {};
        for (const l of links) byKind[l.kind] = (byKind[l.kind] ?? 0) + 1;
        return { assertions: { links: links.length, byKind } };
      },
    });
    const q3 = `${USCIS_DATA_DIR}quarterly_all_forms_fy2026_q3_v1.xlsx`;
    await ctx.probe(g, {
      id: 'portal.allforms.q3', url: q3, accept: '*/*', sample: 'uscis-portal/quarterly_all_forms_fy2026_q3_v1.xlsx',
      check: async (r) => {
        const p = await parseAllForms(r.body!, ref(q3));
        const c = p.rows.find((x) => x.form === 'I-485 (Cuban)')!;
        const want = GOLDEN_FIXTURES.allFormsFy26Q3Cuban;
        const ok = c.received === want.received && c.approved === want.approved && c.denied === want.denied && c.pendingWorkbook === want.pendingWorkbook;
        return { assertions: { cubanRowFound: true, received: c.received, approved: c.approved, denied: c.denied, pending: c.pendingWorkbook, sheet: p.sheet }, ...(ok ? {} : { classification: 'schema_mismatch' as const, note: 'Cuban row differs from the doc 13 §3.4 fixture' }) };
      },
    });
    const off = `${USCIS_DATA_DIR}i485_performance_data_fy2026_q3_v1.xlsx`;
    await ctx.probe(g, {
      id: 'portal.i485office.q3', url: off, accept: '*/*', sample: 'uscis-portal/i485_performance_data_fy2026_q3_v1.xlsx',
      check: async (r) => {
        const p = await parseByOffice(r.body!, ref(off));
        const h = p.stats.find((s) => s.officeCode === 'HIA');
        return h?.pending === GOLDEN_FIXTURES.byOfficeHialeahPending ? { assertions: { hialeahPending: h.pending, offices: p.offices.length } } : { classification: 'schema_mismatch', note: `Hialeah pending ${h?.pending}` };
      },
    });
    const aug = `${USCIS_DATA_DIR}appropriation_requirement_august_2026_v1.0.csv`;
    await ctx.probe(g, {
      id: 'portal.monthly.aug26', url: aug, accept: 'text/csv,*/*', sample: 'uscis-portal/appropriation_requirement_august_2026_v1.0.csv',
      check: (r) => {
        const p = parseMonthlyCsv(r.body!, ref(aug));
        return p.cuban.pending === GOLDEN_FIXTURES.monthlyAug2026.pending ? { assertions: { pending: p.cuban.pending, queried: p.queried ?? null } } : { classification: 'schema_mismatch', note: `pending ${p.cuban.pending}` };
      },
    });
    const thisMonth: YearMonth = new Date().toISOString().slice(0, 7);
    for (const m of [addMonthsYm(thisMonth, -1), thisMonth]) {
      const url = monthlyCsvDirectUrls(m)[0]!;
      const r = await ctx.probe(g, { id: `portal.monthly.next.${m}`, url, method: 'HEAD', predicted: true });
      if (r.classification === 'ok') ctx.findings.push(`NEW_MONTH=${m} (${url})`);
    }
    const nq = prevQuarter(quarterOfMonth(thisMonth));
    for (const url of [allFormsUrls(nq).direct[0]!, byOfficeUrls(nq).direct[0]!]) {
      const r = await ctx.probe(g, { id: `portal.quarterly.next.${quarterKey(nq).replace(' ', '')}.${url.includes('all_forms') ? 'allforms' : 'i485office'}`, url, method: 'HEAD', predicted: true });
      if (r.classification === 'ok') ctx.findings.push(`NEW_QUARTER=${quarterKey(nq)} (${url})`);
    }
    // portal.i765: the first I-765 by-category workbook linked from the index (doc 04 §1.4; file name unknown).
    const links = index.classification === 'ok' ? parsePortalIndex(bodyText(ctx.bodies.get('portal.index')!)) : [];
    const i765 = links.find((l) => l.kind === 'i765_category');
    if (i765) await ctx.probe(g, { id: 'portal.i765', url: i765.href, accept: '*/*', sample: `uscis-portal/${decodeURIComponent(i765.href.split('/').pop()!)}` });
    else ctx.skip(g, 'portal.i765', PORTAL_INDEX_URL, index.classification === 'ok' ? 'not_yet' : index.classification, index.classification === 'ok' ? 'no i765 + eligib/categor link on the index' : 'index not reachable');
  },
};
