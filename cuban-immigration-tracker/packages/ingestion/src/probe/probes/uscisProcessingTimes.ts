/**
 * doc 13 §12.4 `pt.*` probes — the USCIS Processing Times tool (doc 13 §1.1–§1.5; doc 04 §2.2–§2.6).
 * Legacy REST endpoints under `https://egov.uscis.gov/processing-times/api/` with the cookie jar from
 * the landing page, the Next.js server-action transport (`pt.nextaction`), the Apify claim (`HEAD`,
 * expect 404), the historic medians page and the methodology page. Expected from cloud IPs:
 * `blocked_cloudflare` (doc 13 §1.2) — that is a finding, not a failure.
 */
import { z } from 'zod';
import { KNOWN_I485_KEYS } from '../../constants';
import { bodyJson, bodyText } from '../../http';
import type { ProbeContext, ProbeModule } from '../index';

const BASE = 'https://egov.uscis.gov/processing-times/';
const API = `${BASE}api/`;

/** doc 13 §12.5 schemas (loose). */
const FormTypes = z.looseObject({ data: z.looseObject({ form_types: z.looseObject({ form_name: z.string(), subtypes: z.array(z.looseObject({ form_key: z.string() })) }) }) });
const FormOffices = z.looseObject({ data: z.looseObject({ form_offices: z.looseObject({ offices: z.array(z.looseObject({ office_code: z.string() })) }) }) });
const PtRange = z.looseObject({ value: z.number(), unit: z.string() });
const ProcessingTime = z.looseObject({
  data: z.looseObject({ processing_time: z.looseObject({ form_name: z.string(), subtypes: z.array(z.looseObject({ form_type: z.string(), publication_date: z.string(), service_request_date: z.string().optional(), range: z.array(PtRange).min(1).max(2) })).min(1) }) }),
});

function cookieHeader(ctx: ProbeContext): Record<string, string> {
  const landing = ctx.bodies.get('pt.landing');
  const raw = landing?.headers['set-cookie'];
  if (!raw) return {};
  const pairs = raw.split('\n').map((c) => c.split(';')[0]!.trim()).filter(Boolean);
  return pairs.length ? { cookie: pairs.join('; ') } : {};
}

const apiHeaders = (ctx: ProbeContext) => ({ ...cookieHeader(ctx), referer: BASE });

export const uscisProcessingTimesProbes: ProbeModule = {
  group: 'uscis-pt',
  async run(ctx) {
    const g = this.group;
    await ctx.probe(g, { id: 'pt.landing', url: BASE, accept: 'text/html', sample: 'uscis-pt/landing.html' });
    await ctx.probe(g, { id: 'pt.forms', url: `${API}forms`, accept: 'application/json, text/plain, */*', headers: apiHeaders(ctx), sample: 'uscis-pt/forms.json',
      check: (r) => { if (bodyJson(r) === undefined) throw new Error('not JSON'); } });
    await ctx.probe(g, {
      id: 'pt.formtypes.i485', url: `${API}formtypes/I-485`, accept: 'application/json, text/plain, */*', headers: apiHeaders(ctx), sample: 'uscis-pt/formtypes-I-485.json',
      check: (r) => {
        const keys = FormTypes.parse(bodyJson(r)).data.form_types.subtypes.map((s) => s.form_key);
        const extra = keys.filter((k) => !(KNOWN_I485_KEYS as readonly string[]).includes(k));
        const missing = KNOWN_I485_KEYS.filter((k) => !keys.includes(k));
        return { assertions: { keys, extra, missing }, findings: extra.length ? [`CAA_SUBTYPE_PRESENT=${extra.join(',')}`] : [], ...(missing.length ? { classification: 'schema_mismatch' as const, note: `missing ${missing.join(', ')}` } : {}) };
      },
    });
    await ctx.probe(g, {
      id: 'pt.formtypes.i765', url: `${API}formtypes/I-765`, accept: 'application/json, text/plain, */*', headers: apiHeaders(ctx), sample: 'uscis-pt/formtypes-I-765.json',
      check: (r) => {
        const keys = FormTypes.parse(bodyJson(r)).data.form_types.subtypes.map((s) => s.form_key);
        const missing = ['147-C9', '147-C11'].filter((k) => !keys.includes(k));
        return missing.length ? { classification: 'schema_mismatch', note: `missing ${missing.join(', ')}` } : { assertions: { c9: true, c11: true } };
      },
    });
    await ctx.probe(g, {
      id: 'pt.offices.fam', url: `${API}formoffices/I-485/131A-FAM`, accept: 'application/json, text/plain, */*', headers: apiHeaders(ctx), sample: 'uscis-pt/formoffices-I-485-131A-FAM.json',
      check: (r) => {
        const codes = FormOffices.parse(bodyJson(r)).data.form_offices.offices.map((o) => o.office_code);
        const missing = ['HIA', 'KND', 'MIA', 'TAM', 'HOU'].filter((c) => !codes.includes(c));
        return { assertions: { offices: codes.length }, ...(missing.length ? { classification: 'schema_mismatch' as const, note: `missing ${missing.join(', ')}` } : {}) };
      },
    });
    const times: [string, string, string][] = [
      ...['HIA', 'KND', 'MIA', 'TAM', 'HOU'].map((o) => ['I-485', o, '131A-FAM'] as [string, string, string]),
      ['I-765', 'NBC', '147-C9'], ['I-765', 'NBC', '147-C11'],
    ];
    for (const [form, office, key] of times) {
      await ctx.probe(g, {
        id: `pt.time.${form}.${office}.${key}`, url: `${API}processingtime/${form}/${office}/${key}`, accept: 'application/json, text/plain, */*', headers: apiHeaders(ctx),
        sample: `uscis-pt/processingtime-${form}-${office}-${key}.json`,
        check: (r) => {
          const s = ProcessingTime.parse(bodyJson(r)).data.processing_time.subtypes[0]!;
          return { assertions: { publication: s.publication_date, inquiry: s.service_request_date ?? null, range: s.range.map((x) => `${x.value} ${x.unit}`) } };
        },
      });
    }
    // Next.js server actions (doc 13 §1.2): find the action id in the page's chunks; POST only if found.
    const page = await ctx.probe(g, { id: 'pt.nextaction.page', url: BASE.slice(0, -1), accept: 'text/html' });
    if (page.classification === 'ok') {
      const html = bodyText(ctx.bodies.get('pt.nextaction.page')!);
      const chunks = [...new Set([...html.matchAll(/\/processing-times\/_next\/static\/chunks\/[^"'\s]+\.js/g)].map((m) => m[0]))].slice(0, 25);
      let actionId: string | null = null;
      for (const [i, c] of chunks.entries()) {
        const r = await ctx.probe(g, { id: `pt.nextaction.chunk${i}`, url: `https://egov.uscis.gov${c}`, accept: '*/*' });
        if (r.classification !== 'ok') break;
        const m = /createServerReference\)?\(\s*"([0-9a-f]{40,})"[^)]*?"getFormCategories"/.exec(bodyText(ctx.bodies.get(`pt.nextaction.chunk${i}`)!));
        if (m) { actionId = m[1]!; break; }
      }
      if (actionId) {
        await ctx.probe(g, {
          id: 'pt.nextaction', url: BASE.slice(0, -1), method: 'POST', accept: 'text/x-component', body: JSON.stringify(['I-485']),
          headers: { ...cookieHeader(ctx), 'next-action': actionId, 'content-type': 'application/json', origin: 'https://egov.uscis.gov', referer: BASE.slice(0, -1) },
          sample: 'uscis-pt/next-getFormCategories.txt',
        });
        ctx.findings.push(`PT_NEXT_ACTION_ID=${actionId.slice(0, 12)}…`);
      } else ctx.skip(g, 'pt.nextaction', BASE.slice(0, -1), 'schema_mismatch', `getFormCategories action id not found in ${chunks.length} chunks`);
    } else ctx.skip(g, 'pt.nextaction', BASE.slice(0, -1), page.classification, 'page not reachable; POST not attempted');
    await ctx.probe(g, { id: 'pt.apify_claim', url: `${API}processingTimes.json`, method: 'HEAD', predicted: true });
    await ctx.probe(g, { id: 'pt.historic', url: `${BASE}historic-pt`, accept: 'text/html', sample: 'uscis-pt/historic-pt.html',
      check: (r) => (bodyText(r).includes('Cuban Adjustment Act') ? { assertions: { caaRow: true } } : { classification: 'schema_mismatch', note: '"Cuban Adjustment Act" not on the page' }) });
    await ctx.probe(g, { id: 'pt.moreinfo', url: `${BASE}more-info`, accept: 'text/html', sample: 'uscis-pt/more-info.html' });
  },
};
