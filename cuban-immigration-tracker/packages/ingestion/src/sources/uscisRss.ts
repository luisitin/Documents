/**
 * P8 — USCIS newsroom RSS (03-data-pipeline.md §2.2 P8; docs/research/13-live-data-endpoints-and-probe-plan.md §9):
 * `https://www.uscis.gov/news/rss-feed/22984` (alerts) and `…/23269` (news releases), RSS 2.0, fetched
 * with a browser UA (the HTML pages 403 default agents; the RSS answers a browser UA). Items are kept
 * only when the title or description matches the 03 P8 keyword filter: Cuba · Cuban · CAA · parole ·
 * hold · pause · adjudication · PM-602 · PA-20. Output: alert candidates (never shown in the app).
 * A 403 → the source is skipped with its status (03 P8).
 */
import { XMLParser } from 'fast-xml-parser';
import type { AlertCandidate, ISODateTime } from '@caa/data-schemas';
import { RSS_KEYWORDS } from '../constants';
import { SourceError, sha256Hex } from '../util';

export interface RssItem { title: string; link: string; pubDate?: string; description?: string }

const asText = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v).trim();
  if (typeof v === 'object' && '#text' in (v as Record<string, unknown>)) return String((v as Record<string, unknown>)['#text']).trim();
  return '';
};

/** RSS 2.0 → items (title, link, pubDate, description). */
export function parseRss(xml: string): { channelTitle: string; items: RssItem[] } {
  let doc: unknown;
  try {
    doc = new XMLParser({ ignoreAttributes: true, processEntities: true, htmlEntities: true }).parse(xml);
  } catch (e) {
    throw new SourceError(`not XML (${(e as Error).message})`);
  }
  const channel = (doc as { rss?: { channel?: Record<string, unknown> } }).rss?.channel;
  if (!channel) throw new SourceError('no <rss><channel>');
  const raw = channel.item;
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const items = list.map((it) => {
    const o = it as Record<string, unknown>;
    const item: RssItem = { title: asText(o.title), link: asText(o.link) };
    const pub = asText(o.pubDate);
    const desc = asText(o.description).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (pub) item.pubDate = pub;
    if (desc) item.description = desc;
    return item;
  }).filter((i) => i.title && /^https?:\/\//.test(i.link));
  return { channelTitle: asText(channel.title), items };
}

/** The 03 P8 keyword filter, one pattern per `RSS_KEYWORDS` entry (acronyms case-sensitive, words whole). */
const KEYWORD_PATTERNS: Record<(typeof RSS_KEYWORDS)[number], RegExp> = {
  Cuba: /\bCuba\b/i, Cuban: /\bCubans?\b/i, CAA: /\bCAA\b/, parole: /\bparole/i, hold: /\bholds?\b/i,
  pause: /\bpaus(e|es|ed|ing)\b/i, adjudication: /\badjudicat/i, 'PM-602': /\bPM-602/, 'PA-20': /\bPA-20\d\d/,
};

export function rssMatches(text: string): string[] {
  return RSS_KEYWORDS.filter((k) => KEYWORD_PATTERNS[k].test(text));
}

export function rssCandidates(items: RssItem[], foundAt: ISODateTime): AlertCandidate[] {
  const out: AlertCandidate[] = [];
  for (const i of items) {
    const terms = rssMatches(`${i.title} ${i.description ?? ''}`);
    if (!terms.length) continue;
    out.push({ id: `rss:${sha256Hex(i.link).slice(0, 16)}`, foundAt, source: 'uscis.rss', title: i.title, url: i.link, matchedTerms: [...terms] });
  }
  return out;
}
