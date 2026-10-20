/**
 * The USCIS "Immigration and Citizenship Data" portal index (03-data-pipeline.md P1 discovery (a), P3;
 * docs/research/13-live-data-endpoints-and-probe-plan.md §3.1; doc 04 §1).
 *
 * There is no API, bulk export or RSS for the portal: ingestion = fetch the HTML, extract the hrefs
 * under `/sites/default/files/document/`, and classify them with the patterns the visualizer mirror's
 * scanner uses (doc 13 §3.1), extended per the fact-check (doc 04 §1): `appropriation_requirement`
 * case-insensitive, including the capitalised 2023 stem and the space-encoded `…%20<year>.csv` form;
 * `i485_performance`, `i485_performancedata`, `i485_performance_data`; `quarterly_all_forms`; and
 * `i765` + (`eligib`|`categor`) for the I-765-by-category workbook (doc 04 §1.4, name unknown).
 * The by-office workbook is taken ONLY from here when direct (its stem changed 4×, 03 P3).
 */
import type { FiscalQuarter, YearMonth } from '@caa/data-schemas';
import { monthNumber } from '../util';

export type PortalLinkKind = 'monthly_csv' | 'quarterly_all_forms' | 'i485_by_office' | 'i765_category' | 'other';

export interface PortalLink {
  href: string;
  text: string;
  kind: PortalLinkKind;
  ym?: YearMonth;
  quarter?: FiscalQuarter;
}

const ORIGIN = 'https://www.uscis.gov';

function absolutize(href: string): string | null {
  const h = href.trim().replace(/&amp;/g, '&');
  if (/^https?:\/\//i.test(h)) return /^https?:\/\/(www\.)?uscis\.gov\//i.test(h) ? h : null;
  if (h.startsWith('//')) return /^\/\/(www\.)?uscis\.gov\//i.test(h) ? `https:${h}` : null;
  if (h.startsWith('/')) return `${ORIGIN}${h}`;
  return null;
}

function quarterOf(name: string): FiscalQuarter | undefined {
  const m = /fy[_-]?(\d{4})[_-]?(?:q|qtr)[_-]?([1-4])/i.exec(name);
  if (!m) return undefined;
  return { fy: Number(m[1]), q: Number(m[2]) as FiscalQuarter['q'] };
}

function monthOf(name: string): YearMonth | undefined {
  const m = /appropriation_requirement[_ ]([a-z]+)(?:_|\s|%20)(\d{4})/i.exec(name);
  if (!m) return undefined;
  const mo = monthNumber(m[1]!);
  return mo ? `${m[2]}-${String(mo).padStart(2, '0')}` : undefined;
}

/** Classifies one file path (exported for tests). */
export function classifyPortalHref(href: string): PortalLinkKind {
  const name = decodeURIComponent(href.split(/[?#]/)[0]!.split('/').pop() ?? '');
  if (/appropriation_requirement/i.test(name) && /\.csv$/i.test(name)) return 'monthly_csv';
  if (/quarterly_all_forms/i.test(name) && /\.xlsx$/i.test(name)) return 'quarterly_all_forms';
  if (/i-?485_?performance/i.test(name) && /\.xlsx$/i.test(name)) return 'i485_by_office';
  if (/i-?765/i.test(name) && /(eligib|categor)/i.test(name) && /\.xlsx$/i.test(name)) return 'i765_category';
  return 'other';
}

/** Every `/sites/default/files/document/` link of the index page, de-duplicated, in page order. */
export function parsePortalIndex(html: string): PortalLink[] {
  const out: PortalLink[] = [];
  const seen = new Set<string>();
  const re = /<a\b[^>]*?href\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    const abs = absolutize(m[2]!);
    if (!abs || !/\/sites\/default\/files\/document\//i.test(abs) || seen.has(abs)) continue;
    seen.add(abs);
    const text = m[3]!.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
    const name = decodeURIComponent(abs.split(/[?#]/)[0]!.split('/').pop() ?? '');
    const kind = classifyPortalHref(abs);
    const link: PortalLink = { href: abs, text, kind };
    if (kind === 'monthly_csv') { const ym = monthOf(name); if (ym) link.ym = ym; }
    if (kind === 'quarterly_all_forms' || kind === 'i485_by_office' || kind === 'i765_category') { const q = quarterOf(name); if (q) link.quarter = q; }
    out.push(link);
  }
  return out;
}

/** The link of one kind for one quarter (by-office: 03 P3 "href from the portal index only"). */
export function findQuarterLink(links: PortalLink[], kind: PortalLinkKind, q: FiscalQuarter): PortalLink | undefined {
  return links.find((l) => l.kind === kind && l.quarter?.fy === q.fy && l.quarter.q === q.q);
}

export function findMonthLink(links: PortalLink[], ym: YearMonth): PortalLink | undefined {
  return links.find((l) => l.kind === 'monthly_csv' && l.ym === ym);
}
