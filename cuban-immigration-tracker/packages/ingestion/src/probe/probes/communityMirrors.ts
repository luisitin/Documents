/**
 * doc 13 §12.4 community-mirror probes:
 * - `pt.mirror.jzebedee`: GitHub "latest release" API (GITHUB_TOKEN when set) → the `.db` asset →
 *   sql.js → I-485 subtypes (CAA_SUBTYPE_PRESENT if a key outside the 7 known appears) and the tracked
 *   rows. The DB is NOT saved (no LICENSE upstream); only derived JSON is.
 * - `foia.metrics`: `first.uscis.gov/api/public/foia-metrics` with its Referer (doc 13 §0 row 10).
 * - `mirror.visualizer`: the FY26 Q3 all-forms copy; its sha256 must equal `portal.allforms.q3`'s when
 *   both were fetched (proves the mirror is byte-identical, the Q8 gate of 03 §4).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { JZEBEDEE_LATEST_RELEASE, MIRROR_DIR } from '../../constants';
import { bodyJson } from '../../http';
import { pickReleaseAsset, readProcessingTimes } from '../../sources/processingTimes';
import type { ProbeModule } from '../index';

export const communityMirrorProbes: ProbeModule = {
  group: 'community',
  async run(ctx) {
    const g = this.group;
    const token = ctx.env.GITHUB_TOKEN;
    const rel = await ctx.probe(g, {
      id: 'pt.mirror.jzebedee.release', url: JZEBEDEE_LATEST_RELEASE, accept: 'application/vnd.github+json', ...(token ? { headers: { authorization: `Bearer ${token}` } } : {}),
      check: (r) => { const a = pickReleaseAsset(bodyJson(r)); return a ? { assertions: { tag: a.tag, asset: a.name } } : { classification: 'schema_mismatch', note: 'no .db asset' }; },
    });
    const asset = rel.classification === 'ok' ? pickReleaseAsset(bodyJson(ctx.bodies.get('pt.mirror.jzebedee.release')!)) : null;
    if (asset) {
      await ctx.probe(g, {
        id: 'pt.mirror.jzebedee', url: asset.url, accept: 'application/octet-stream', maxBytes: 512 * 1024 * 1024,
        check: async (r) => {
          const p = await readProcessingTimes(r.body!, { url: asset.url, retrievedAt: new Date().toISOString().slice(0, 19) + 'Z', releaseTag: asset.tag });
          const out = join(ctx.samplesDir, 'community', 'jzebedee');
          await mkdir(dirname(join(out, 'x')), { recursive: true });
          await writeFile(join(out, 'i485-subtypes.json'), `${JSON.stringify({ tag: asset.tag, keys: p.i485FormKeys, unknown: p.unknownI485Keys }, null, 2)}\n`);
          await writeFile(join(out, 'tracked-records.json'), `${JSON.stringify(p.records, null, 2)}\n`);
          return { assertions: { records: p.records.length, latestPublication: p.latestPublication, i485Keys: p.i485FormKeys.length }, findings: p.unknownI485Keys.length ? [`CAA_SUBTYPE_PRESENT=${p.unknownI485Keys.join(',')}`] : [] };
        },
      });
    } else ctx.skip(g, 'pt.mirror.jzebedee', JZEBEDEE_LATEST_RELEASE, rel.classification, 'release lookup failed; asset not downloaded');
    await ctx.probe(g, { id: 'foia.metrics', url: 'https://first.uscis.gov/api/public/foia-metrics', accept: 'application/json', headers: { referer: 'https://first.uscis.gov/' }, sample: 'uscis-foia/metrics.json' });
    const portal = ctx.get('portal.allforms.q3');
    const m = await ctx.probe(g, { id: 'mirror.visualizer', url: `${MIRROR_DIR}quarterly_all_forms_fy2026_q3_v1.xlsx`, accept: '*/*' });
    if (!portal?.sha256 || !m.sha256) m.note = [m.note, 'direct copy not fetched; sha not compared'].filter(Boolean).join('; ');
    else {
      m.assertions = { ...(m.assertions ?? {}), sameAsDirect: m.sha256 === portal.sha256 };
      if (m.sha256 !== portal.sha256) { m.classification = 'schema_mismatch'; m.note = 'mirror sha256 differs from the USCIS copy (Q8)'; }
    }
  },
};
