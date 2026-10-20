/**
 * doc 13 §12.4 `rss.*` probes — the USCIS newsroom feeds (doc 13 §9): ids 22984 (alerts), 23269 (news
 * releases), 59144 / 60288 (all news), 93166 (fact sheets), 97790 (stakeholder messages) and the forms
 * updates feed. Browser UA; ≥ 1 `<item>` expected; the channel titles become the `RSS_LABELS` finding.
 */
import { bodyText } from '../../http';
import { parseRss } from '../../sources/uscisRss';
import type { ProbeModule } from '../index';

const FEEDS = ['22984', '23269', '59144', '60288', '93166', '97790'].map((id) => ({ id, url: `https://www.uscis.gov/news/rss-feed/${id}` }))
  .concat([{ id: 'forms-updates', url: 'https://www.uscis.gov/forms/forms-updates/rss-feed' }]);

export const uscisRssProbes: ProbeModule = {
  group: 'uscis-rss',
  async run(ctx) {
    const g = this.group;
    const labels: Record<string, string> = {};
    for (const f of FEEDS) {
      await ctx.probe(g, {
        id: `rss.${f.id}`, url: f.url, accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.8', sample: `uscis-rss/${f.id}.xml`,
        check: (r) => {
          const p = parseRss(bodyText(r));
          labels[f.id] = p.channelTitle;
          return p.items.length ? { assertions: { items: p.items.length, channel: p.channelTitle } } : { classification: 'schema_mismatch', note: 'no <item>' };
        },
      });
    }
    if (Object.keys(labels).length) ctx.findings.push(`RSS_LABELS=${JSON.stringify(labels)}`);
  },
};
