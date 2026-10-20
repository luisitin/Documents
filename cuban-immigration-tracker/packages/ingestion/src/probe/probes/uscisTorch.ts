/**
 * doc 13 §12.4 `torch.*` probes — the official Torch Case Status API (doc 13 §2.2; doc 04 §3.2).
 * OAuth2 client credentials (USCIS_CLIENT_ID / USCIS_CLIENT_SECRET) against the SANDBOX host
 * `api-int.uscis.gov`, the canned staging receipt `EAC9999103402` (a USCIS test value, not a person's),
 * a malformed receipt for the error envelope, and unauthenticated calls that prove the production host
 * exists (401). 503 → `sandbox_closed` (the weekday 7 am–8 pm ET window is community-observed only);
 * 302 → `sandbox_incident`. The token is never written: the sample stores its sha256 only.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { z } from 'zod';
import { bodyJson } from '../../http';
import { sha256Hex } from '../../util';
import type { ProbeModule } from '../index';

const SANDBOX = 'https://api-int.uscis.gov';
const PROD = 'https://api.uscis.gov';
const STAGING_RECEIPT = 'EAC9999103402';

const TorchToken = z.looseObject({ access_token: z.string(), expires_in: z.coerce.number() });
const TorchHist = z.union([
  z.looseObject({ date: z.string(), completed_text_en: z.string().optional() }),
  z.looseObject({ date: z.string(), status: z.string().optional(), description: z.string().optional() }),
]);
const TorchCaseStatus = z.looseObject({
  case_status: z.looseObject({
    receiptNumber: z.string().regex(/^[A-Z]{3}\d{10}$/),
    current_case_status_text_en: z.string(),
    hist_case_status: z.array(TorchHist).optional(),
    historicalCaseStatuses: z.array(TorchHist).optional(),
  }),
});

const sandboxStatus = (r: { status: number | null }) => (r.status === 503 ? 'sandbox_closed' as const : r.status === 302 ? 'sandbox_incident' as const : r.status === 401 ? 'auth_error' as const : undefined);

export const uscisTorchProbes: ProbeModule = {
  group: 'uscis-torch',
  async run(ctx) {
    const g = this.group;
    let token: string | null = null;
    const id = ctx.env.USCIS_CLIENT_ID ?? '';
    const secret = ctx.env.USCIS_CLIENT_SECRET ?? '';
    const tok = await ctx.probe(g, {
      id: 'torch.token', url: `${SANDBOX}/oauth/accesstoken`, method: 'POST', secrets: ['USCIS_CLIENT_ID', 'USCIS_CLIENT_SECRET'], accept: 'application/json',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: id, client_secret: secret }).toString(),
      mapStatus: sandboxStatus,
      check: async (r) => {
        const t = TorchToken.parse(bodyJson(r));
        token = t.access_token;
        const p = join(ctx.samplesDir, 'uscis-torch', 'token.redacted.json');
        await mkdir(dirname(p), { recursive: true });
        await writeFile(p, `${JSON.stringify({ access_token_sha256: sha256Hex(t.access_token), expires_in: t.expires_in, at: new Date().toISOString() }, null, 2)}\n`);
        return { assertions: { expires_in: t.expires_in } };
      },
    });
    const auth = (): Record<string, string> => (token ? { authorization: `Bearer ${token}` } : {});
    if (token) {
      await ctx.probe(g, {
        id: 'torch.case', url: `${SANDBOX}/case-status/${STAGING_RECEIPT}`, accept: 'application/json', headers: auth(), mapStatus: sandboxStatus, sample: `uscis-torch/case-${STAGING_RECEIPT}.json`,
        check: (r) => {
          const c = TorchCaseStatus.parse(bodyJson(r)).case_status;
          const key = c.hist_case_status ? 'hist_case_status' : c.historicalCaseStatuses ? 'historicalCaseStatuses' : 'none';
          return { assertions: { historyKey: key }, findings: [`TORCH_HISTORY_KEY=${key}`] };
        },
      });
      await ctx.probe(g, { id: 'torch.case.422', url: `${SANDBOX}/case-status/ZZZ0000000000`, accept: 'application/json', headers: auth(), mapStatus: (r) => (r.status === 422 || r.status === 404 ? 'ok' : sandboxStatus(r)), sample: 'uscis-torch/error-422.json' });
    } else {
      ctx.skip(g, 'torch.case', `${SANDBOX}/case-status/${STAGING_RECEIPT}`, tok.classification === 'skipped_no_secret' ? 'skipped_no_secret' : tok.classification, 'no sandbox token');
      ctx.skip(g, 'torch.case.422', `${SANDBOX}/case-status/ZZZ0000000000`, tok.classification === 'skipped_no_secret' ? 'skipped_no_secret' : tok.classification, 'no sandbox token');
    }
    await ctx.probe(g, { id: 'torch.prod.unauth', url: `${PROD}/case-status/${STAGING_RECEIPT}`, accept: 'application/json', mapStatus: (r) => (r.status === 401 ? 'ok' : undefined) });
    await ctx.probe(g, { id: 'torch.pt.unauth', url: `${SANDBOX}/processing-times`, accept: 'application/json', mapStatus: (r) => (r.status === 401 ? 'ok' : undefined) });
    if (token) await ctx.probe(g, { id: 'torch.pt.auth', url: `${SANDBOX}/processing-times`, accept: 'application/json', headers: auth(), mapStatus: sandboxStatus, sample: 'uscis-torch/processing-times.json' });
  },
};
