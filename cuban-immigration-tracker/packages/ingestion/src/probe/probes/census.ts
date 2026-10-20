/**
 * doc 13 §12.4 `census.*` probes — ACS B05006 (place of birth). The Cuba variable is RESOLVED at run
 * time from the group metadata by its label ending in "Cuba" (it drifts across vintages: _094, _128,
 * _143; doc 13 §8), never hard-coded; expected `B05006_143E` in the 2024 5-year group. Optional
 * CENSUS_API_KEY (keyless ≤ 500 queries/IP/day).
 */
import { z } from 'zod';
import { bodyJson } from '../../http';
import type { ProbeModule } from '../index';

const CensusGroup = z.looseObject({ variables: z.record(z.string(), z.looseObject({ label: z.string() })) });

export const censusProbes: ProbeModule = {
  group: 'census',
  async run(ctx) {
    const g = this.group;
    let cuba: string | null = null;
    await ctx.probe(g, {
      id: 'census.group', url: 'https://api.census.gov/data/2024/acs/acs5/groups/B05006.json', accept: 'application/json', sample: 'census/B05006-group-2024acs5.json',
      check: (r) => {
        const vars = CensusGroup.parse(bodyJson(r)).variables;
        cuba = Object.keys(vars).filter((k) => k.endsWith('E') && /Cuba$/.test(vars[k]!.label.replace(/[:!\s·]+$/g, ''))).sort()[0] ?? null;
        return cuba ? { assertions: { cubaVar: cuba }, findings: [`CENSUS_CUBA_VAR=${cuba}`] } : { classification: 'schema_mismatch', note: 'no variable labelled …Cuba' };
      },
    });
    const v = (cuba as string | null) ?? 'B05006_143E';
    const key = ctx.env.CENSUS_API_KEY ? `&key=${encodeURIComponent(ctx.env.CENSUS_API_KEY)}` : '';
    const base = v.replace(/E$/, '');
    await ctx.probe(g, {
      id: 'census.state', url: `https://api.census.gov/data/2024/acs/acs1?get=NAME,${base}E,${base}M&for=state:*${key}`, accept: 'application/json', sample: 'census/cuba-by-state-2024acs1.json',
      check: (r) => {
        const rows = z.array(z.array(z.string().nullable())).min(2).parse(bodyJson(r));
        const fl = rows.find((x) => x[0] === 'Florida');
        const n = fl ? Number(fl[1]) : NaN;
        return Number.isFinite(n) ? { assertions: { florida: n } } : { classification: 'schema_mismatch', note: 'no numeric Florida row' };
      },
    });
    await ctx.probe(g, { id: 'census.2025', url: 'https://api.census.gov/data/2025/acs/acs1', method: 'HEAD', predicted: true });
  },
};
