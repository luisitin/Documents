/**
 * doc 13 §12.4 `cbp.*` probes — the CHNV totals in CBP's monthly updates (doc 13 §5). On the December
 * 2024 page only: 110,240 Cubans / 211,040 Haitians / 93,070 Nicaraguans / 117,330 Venezuelans, ±10 per
 * figure (CBP rounds to 10). On the January 2025 page: only that CHNV paroles "have ended".
 */
import { bodyText } from '../../http';
import type { ProbeModule } from '../index';

const DEC = 'https://www.cbp.gov/newsroom/national-media-release/cbp-releases-december-2024-monthly-update';
const JAN = 'https://www.cbp.gov/newsroom/national-media-release/cbp-releases-january-2025-monthly-update';
const EXPECT = [110240, 211040, 93070, 117330];

export const cbpProbes: ProbeModule = {
  group: 'cbp',
  async run(ctx) {
    const g = this.group;
    await ctx.probe(g, {
      id: 'cbp.dec24', url: DEC, accept: 'text/html', sample: 'cbp/december-2024.html',
      check: (r) => {
        const m = /([\d,]+) Cubans, ([\d,]+) Haitians, ([\d,]+) Nicaraguans, and ([\d,]+) Venezuelans/.exec(bodyText(r));
        if (!m) return { classification: 'schema_mismatch', note: 'CHNV paragraph not found' };
        const got = [m[1], m[2], m[3], m[4]].map((x) => Number(x!.replace(/,/g, '')));
        const ok = got.every((v, i) => Math.abs(v - EXPECT[i]!) <= 10);
        return { assertions: { cubans: got[0], haitians: got[1], nicaraguans: got[2], venezuelans: got[3] }, ...(ok ? {} : { classification: 'schema_mismatch' as const, note: 'totals differ from 110,240 / 211,040 / 93,070 / 117,330 (±10)' }) };
      },
    });
    await ctx.probe(g, { id: 'cbp.jan25', url: JAN, accept: 'text/html', sample: 'cbp/january-2025.html',
      check: (r) => (/paroles have ended/i.test(bodyText(r)) ? { assertions: { chnvEnded: true } } : { classification: 'schema_mismatch', note: '"paroles have ended" not found' }) });
    await ctx.probe(g, { id: 'cbp.custody', url: 'https://www.cbp.gov/newsroom/stats/custody-and-transfer-statistics-fy2025', accept: 'text/html', sample: 'cbp/custody-fy2025.html' });
    await ctx.probe(g, { id: 'cbp.custody.fy2026', url: 'https://www.cbp.gov/newsroom/stats/custody-and-transfer-statistics-fy2026', method: 'HEAD', predicted: true });
  },
};
