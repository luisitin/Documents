/**
 * The doc 13 §12 probe against an in-memory network: every probe is classified (a blocked endpoint is a
 * finding, never a failure), missing secrets → skipped_no_secret, the report files are written, and no
 * secret ever reaches a sample or the report.
 */
import { readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { HttpClient } from '../src/http';
import { renderReport, runProbe } from '../src/probe';
import { FIX, fixture, mockFetch, tempDir, type Route } from './helpers';

const dirs: string[] = [];
afterEach(async () => { for (const d of dirs.splice(0)) await rm(d, { recursive: true, force: true }); });

async function walk(d: string): Promise<string[]> {
  const out: string[] = [];
  for (const e of await readdir(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) out.push(...(await walk(p))); else out.push(p);
  }
  return out;
}

describe('runProbe', () => {
  it('classifies every probe; Cloudflare / Drupal blocks are findings; secrets never written', async () => {
    const dir = await tempDir('caa-probe-');
    dirs.push(dir);
    const cf: Route = { status: 403, body: '<title>Just a moment...</title>', headers: { 'cf-mitigated': 'challenge' } };
    const routes = new Map<string | RegExp, Route>([
      [/^https:\/\/egov\.uscis\.gov\//, cf],
      ['https://www.uscis.gov/sites/default/files/document/data/quarterly_all_forms_fy2026_q3_v1.xlsx', await fixture('mirror/quarterly_all_forms_fy2026_q3_v1.xlsx')],
      ['https://www.uscis.gov/sites/default/files/document/data/appropriation_requirement_august_2026_v1.0.csv', await fixture('mirror/monthly_august_2026.csv')],
      ['https://raw.githubusercontent.com/omairqazi29/visualizer/master/data/USCIS_I485/quarterly_all_forms_fy2026_q3_v1.xlsx', await fixture('mirror/quarterly_all_forms_fy2026_q3_v1.xlsx')],
      [/^https:\/\/www\.uscis\.gov\/news\/rss-feed\/22984$/, await readFile(join(FIX, 'synthetic', 'rss-alerts.xml'), 'utf8')],
      [/^https:\/\/www\.uscis\.gov\//, { status: 403, body: 'Access denied' }],
      [/^https:\/\/www\.federalregister\.gov\/api\/v1\/documents\.json/, await readFile(join(FIX, 'synthetic', 'fr-search.json'), 'utf8')],
      [/^https:\/\/(ohss\.dhs\.gov|www\.cbp\.gov|api\.census\.gov|first\.uscis\.gov|api(-int)?\.uscis\.gov|api\.github\.com)\//, 'network_error'],
    ]);
    const client = new HttpClient({ mode: 'probe', fetchImpl: mockFetch(routes), sleep: async () => {}, hostGapMs: 0 });
    const env = { COURTLISTENER_TOKEN: undefined, USCIS_CLIENT_ID: undefined, CENSUS_API_KEY: 'CENSUS-SECRET-XYZ' };
    const r = await runProbe({ reportDir: dir, client, env });
    const by = (id: string) => r.results.find((x) => x.id === id)!;
    expect(by('pt.formtypes.i485').classification).toBe('blocked_cloudflare');
    expect(by('portal.index').classification).toBe('blocked_drupal_antibot');
    expect(by('portal.allforms.q3')).toMatchObject({ classification: 'ok', assertions: { received: 6279, approved: 139, denied: 447, pending: 342360 } });
    expect(by('portal.monthly.aug26')).toMatchObject({ classification: 'ok', assertions: { pending: 355520 } });
    expect(by('mirror.visualizer').assertions).toMatchObject({ sameAsDirect: true });
    expect(by('torch.token').classification).toBe('skipped_no_secret');
    expect(by('cl.docket').classification).toBe('skipped_no_secret');
    expect(by('cl.search').classification).toBe('http_error'); // routed 404 (no token needed)
    expect(by('fr.search').assertions).toMatchObject({ has2025_05128: true });
    expect(by('rss.22984')).toMatchObject({ classification: 'ok', assertions: { items: 3 } });
    expect(by('census.group').classification).toBe('network_error');
    expect(r.findings).toContain('EGOV_REACHABLE=false');
    // every doc 13 §12.4 group is present
    for (const id of ['pt.landing', 'pt.historic', 'pt.apify_claim', 'pt.mirror.jzebedee', 'torch.case', 'portal.i485office.q3', 'portal.i765', 'ohss.monthly.page', 'cbp.dec24', 'fr.agencies', 'cl.usage', 'census.state', 'rss.97790', 'foia.metrics']) {
      expect(r.results.some((x) => x.id === id), id).toBe(true);
    }
    const md = await readFile(join(dir, 'PROBE-REPORT.md'), 'utf8');
    expect(md).toContain('| portal.allforms.q3 | ok |');
    expect(md).toContain('## Findings');
    const json = JSON.parse(await readFile(join(dir, 'probe-report.json'), 'utf8'));
    expect(json.results).toHaveLength(r.results.length);
    for (const f of [join(dir, 'PROBE-REPORT.md'), join(dir, 'probe-report.json'), ...(await walk(join(dir, 'samples')))]) {
      expect(await readFile(f, 'utf8')).not.toContain('CENSUS-SECRET-XYZ');
    }
  });

  it('renderReport escapes pipes and lists findings', () => {
    const md = renderReport({ run: { startedAt: 'a', finishedAt: 'b', runner: 'local' }, results: [{ id: 'x', group: 'g', method: 'GET', url: 'u', status: 403, classification: 'blocked_cloudflare', ms: 1, note: 'a|b' }], findings: ['EGOV_REACHABLE=false'] });
    expect(md).toContain('a\\|b');
    expect(md).toContain('- EGOV_REACHABLE=false');
  });
});
