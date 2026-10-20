/**
 * doc 13 §12.4 `cl.*` probes — CourtListener REST v4 (doc 13 §7). Token REQUIRED for dockets, entries,
 * alerts and usage (v4.3: anonymous → 401); only `/search/` answers anonymously. With a token set, a
 * 401 is `auth_error`. Assertions use the docket id / number / PACER id, never the caption (Noem →
 * Mullin). The probe never POSTs a docket alert. About 6 authenticated requests: inside 5/min with the
 * 1 s host gap only if the run is short, so the entries call follows the docket call directly.
 */
import { z } from 'zod';
import { COURTLISTENER_API } from '../../constants';
import { bodyJson } from '../../http';
import type { ProbeModule } from '../index';

const ClDocketList = z.looseObject({ results: z.array(z.looseObject({ id: z.number(), docket_number: z.string(), case_name: z.string().optional(), pacer_case_id: z.union([z.string(), z.number()]).nullable().optional() })) });

export const courtListenerProbes: ProbeModule = {
  group: 'courtlistener',
  async run(ctx) {
    const g = this.group;
    const token = ctx.env.COURTLISTENER_TOKEN;
    const auth = token ? { authorization: `Token ${token}` } : undefined;
    const authStatus = (r: { status: number | null }) => (r.status === 401 ? 'auth_error' as const : undefined);
    await ctx.probe(g, {
      id: 'cl.docket', url: `${COURTLISTENER_API}dockets/?court=mad&docket_number=1:25-cv-10495`, accept: 'application/json', secrets: ['COURTLISTENER_TOKEN'], ...(auth ? { headers: auth } : {}),
      mapStatus: authStatus, sample: 'courtlistener/docket-mad-25-10495.json',
      check: (r) => {
        const d = ClDocketList.parse(bodyJson(r)).results[0];
        if (!d) return { classification: 'schema_mismatch', note: 'no docket returned' };
        const ok = d.id === 69695790 && d.docket_number === '1:25-cv-10495' && String(d.pacer_case_id ?? '') === '281389';
        return { assertions: { id: d.id, docket_number: d.docket_number, pacer_case_id: d.pacer_case_id ?? null, case_name: d.case_name ?? null }, ...(ok ? {} : { classification: 'schema_mismatch' as const, note: 'id / docket number / PACER id differ from the pinned 69695790 / 1:25-cv-10495 / 281389' }) };
      },
    });
    await ctx.probe(g, { id: 'cl.entries', url: `${COURTLISTENER_API}docket-entries/?docket=69695790&order_by=-date_filed&page_size=50`, accept: 'application/json', secrets: ['COURTLISTENER_TOKEN'], ...(auth ? { headers: auth } : {}), mapStatus: authStatus, sample: 'courtlistener/entries-69695790.json' });
    await ctx.probe(g, { id: 'cl.search', url: `${COURTLISTENER_API}search/?q=%22Cuban+Adjustment+Act%22&type=r&order_by=dateFiled+desc`, accept: 'application/json', ...(auth ? { headers: auth } : {}), sample: 'courtlistener/search-caa.json' });
    await ctx.probe(g, { id: 'cl.alerts.list', url: `${COURTLISTENER_API}docket-alerts/`, accept: 'application/json', secrets: ['COURTLISTENER_TOKEN'], ...(auth ? { headers: auth } : {}), mapStatus: authStatus, sample: 'courtlistener/docket-alerts.json' });
    // Path inferred from the FLP wiki "API Usage" page slug [I] (doc 13 §12.4): a 404 is a finding.
    await ctx.probe(g, { id: 'cl.usage', url: `${COURTLISTENER_API}api-usage/`, accept: 'application/json', secrets: ['COURTLISTENER_TOKEN'], ...(auth ? { headers: auth } : {}), mapStatus: authStatus, predicted: true, sample: 'courtlistener/api-usage.json' });
  },
};
