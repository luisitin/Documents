/**
 * The month-level "código de caso" / case code (00-product-spec.md S12; 02-data-model.md §5
 * `shareCode` / `parseShareCode`; privacy rules 05-privacy-security-legal.md §4–§5).
 *
 * Privacy (owner rule "never store names or full receipt numbers"; 05 §4): the code holds NO receipt
 * digits (not even the prefix), NO day-level dates (months only), NO nickname, NO hardship or
 * basic-documents data, and NO office code unless the caller opts in (`opts.includeOffice`). The
 * approval range never appears (U8; 05 §5 rule 4). Parsing is local; nothing is uploaded.
 *
 * Format (00 S12; the share language is chosen independently of the UI language):
 *
 *   #AjusteCubano · CHNV · FL
 *   Presentado: 2025-03 · Huellas: 2025-07 · EAD: 2025-09 · Entrevista: — · Decisión: —
 *   19 meses (≈10 adjudicables) · Prob. decisión 12 meses: 9 % · datos USCIS ago 2026
 *   CAA Tracker (no oficial)
 *
 * The third line needs an estimate; without one (no estimate, e.g. I-220A, S9 "no numbers") it is
 * omitted. Numbers follow 02 §9 (ADR-I18N-2): percent with 0 decimals, "<1 %" below 1 %, Spanish
 * with a no-break space (U+00A0) before "%". This package may not import @caa/i18n-core (07 WP3
 * dependencies: data-schemas types only), so the two tiny formatters below mirror 02 §9.
 */
import type { CaseTimeline, EntryChannel, EstimateOk, ISODate, Lang, Milestone, MilestoneKey, YearMonth } from '@caa/data-schemas';
import { DAYS_PER_MONTH, monthsSince, ym } from './dates';

const NBSP = ' ';
const SEP = ' · ';
export const SHARE_HASHTAG = '#AjusteCubano';

const MONTH_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
const MONTH_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 02 §9 `fmt.month` ("ago 2026" / "Aug 2026"). */
function monthShort(m: YearMonth, lang: Lang): string {
  const i = Number(m.slice(5, 7)) - 1;
  return `${(lang === 'es' ? MONTH_ES : MONTH_EN)[i]} ${m.slice(0, 4)}`;
}

/** 02 §9 `fmt.pct` (0 dp; "<1 %" / "<1%"). */
function pct(p: number, lang: Lang): string {
  const v = p < 0.01 ? '<1' : String(Math.round(p * 100));
  return lang === 'es' ? `${v}${NBSP}%` : `${v}%`;
}

/** Channel tokens in the header (language-neutral program names; parsed back case-insensitively). */
const CHANNEL_TOKEN: Record<EntryChannel, string> = {
  CHNV: 'CHNV', CBP_ONE: 'CBP One', FRP_CFRP: 'FRP/CFRP', U4U: 'U4U', OTHER_PAROLE: 'Parole', VISA: 'Visa',
  I220A: 'I-220A', EWI: 'EWI', CONDITIONAL_PAROLE_236: 'INA 236', UNKNOWN: '?',
};

const OUTCOME: Record<Lang, Record<string, string>> = {
  es: { approved: 'aprobada', denied: 'negada', withdrawn: 'retirada', admin_closed: 'cerrada' },
  en: { approved: 'approved', denied: 'denied', withdrawn: 'withdrawn', admin_closed: 'closed' },
};

const LABELS: Record<Lang, { filed: string; biometrics: string; ead: string; interview: string; decision: string; yes: string;
  months: (n: number, adj: number) => string; prob: string; data: string; footer: string }> = {
  es: {
    filed: 'Presentado', biometrics: 'Huellas', ead: 'EAD', interview: 'Entrevista', decision: 'Decisión', yes: 'sí',
    months: (n, adj) => `${n} meses (≈${adj} adjudicables)`, prob: 'Prob. decisión 12 meses', data: 'datos USCIS',
    footer: 'CAA Tracker (no oficial)',
  },
  en: {
    filed: 'Filed', biometrics: 'Biometrics', ead: 'EAD', interview: 'Interview', decision: 'Decision', yes: 'yes',
    months: (n, adj) => `${n} months (≈${adj} adjudicable)`, prob: '12-month decision chance', data: 'USCIS data',
    footer: 'CAA Tracker (unofficial)',
  },
};

/** The earliest dated milestone of a key, or the undated one ("happened, date unknown"), or null. */
function firstOf(c: CaseTimeline, key: MilestoneKey): Milestone | null {
  let best: Milestone | null = null;
  for (const m of c.milestones) {
    if (m.key !== key) continue;
    if (best === null || (m.date !== null && (best.date === null || m.date < best.date))) best = m;
  }
  return best;
}

function monthCell(m: Milestone | null, lang: Lang): string {
  if (m === null) return '—';
  return m.date === null ? LABELS[lang].yes : ym(m.date);
}

/**
 * 02 §5 `shareCode(case, est, lang)`: the month-level case code. `opts.includeOffice` adds the
 * office code (00 S12: "no office code unless the user opts in").
 */
export function shareCode(c: CaseTimeline, est: EstimateOk | null, lang: Lang, opts?: { includeOffice?: boolean }): string {
  const L = LABELS[lang];
  const head = [SHARE_HASHTAG, CHANNEL_TOKEN[c.entryChannel]];
  if (c.state !== undefined) head.push(c.state);
  if (opts?.includeOffice === true && c.officeCode !== undefined) head.push(c.officeCode);

  const decision = firstOf(c, 'decision');
  let decisionCell = monthCell(decision, lang);
  const outcome = decision?.meta?.outcome;
  if (decision !== null && outcome !== undefined && OUTCOME[lang][outcome] !== undefined) decisionCell += ` (${OUTCOME[lang][outcome]})`;

  const lines = [
    head.join(SEP),
    [
      `${L.filed}: ${ym(c.i485ReceiptDate)}`,
      `${L.biometrics}: ${monthCell(firstOf(c, 'biometrics'), lang)}`,
      `${L.ead}: ${monthCell(firstOf(c, 'ead_c9'), lang)}`,
      `${L.interview}: ${monthCell(firstOf(c, 'interview'), lang)}`,
      `${L.decision}: ${decisionCell}`,
    ].join(SEP),
  ];
  if (est !== null) {
    const months = monthsSince(est.clock.calendarDays);
    const adj = Math.round(est.clock.adjudicableDays / DAYS_PER_MONTH);
    lines.push([L.months(months, adj), `${L.prob}: ${pct(est.pWithin.m12, lang)}`, `${L.data} ${monthShort(est.dataThrough, lang)}`].join(SEP));
  }
  lines.push(L.footer);
  return lines.join('\n');
}

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9?]/g, '');
const TOKEN_TO_CHANNEL: Record<string, EntryChannel> = {};
for (const k of Object.keys(CHANNEL_TOKEN) as EntryChannel[]) {
  TOKEN_TO_CHANNEL[norm(CHANNEL_TOKEN[k])] = k;
  TOKEN_TO_CHANNEL[norm(k)] = k;
}
const OUTCOME_WORDS: Record<string, NonNullable<Milestone['meta']>['outcome']> = {};
for (const lang of ['es', 'en'] as Lang[]) {
  for (const k of Object.keys(OUTCOME[lang])) OUTCOME_WORDS[OUTCOME[lang][k]!] = k as NonNullable<Milestone['meta']>['outcome'];
}

const YM = '(\\d{4}-(?:0[1-9]|1[0-2]))';
function cell(text: string, labels: string): RegExpMatchArray | null {
  return text.match(new RegExp(`(?:${labels})\\s*:\\s*(${YM.slice(1, -1)}|s[ií]|yes|—|-)(?:\\s*\\(([^)]*)\\))?`, 'i'));
}

function milestoneFrom(key: MilestoneKey, m: RegExpMatchArray | null): Milestone | null {
  if (m === null) return null;
  const v = m[1]!;
  if (v === '—' || v === '-') return null;
  const date: ISODate | null = /^\d{4}-\d{2}$/.test(v) ? `${v}-15` : null; // "solo sé el mes" → day 15 (00 S2)
  const out: Milestone = { key, date, dateGranularity: 'month', dateSource: 'memory' };
  const word = m[2]?.trim().toLowerCase();
  if (key === 'decision' && word !== undefined && OUTCOME_WORDS[word] !== undefined) out.meta = { outcome: OUTCOME_WORDS[word] };
  return out;
}

/**
 * 02 §5 `parseShareCode(text)`: reads a pasted case code (either language, extra text around it,
 * one line or several) back into a month-level partial case for the local peer comparison (00 S12
 * "Pegar un código para comparar"). Returns null unless the hashtag header and the filing month are
 * present. Dates come back as day 15 with month granularity and `dateSource: 'memory'`.
 */
export function parseShareCode(text: string): Partial<CaseTimeline> | null {
  if (typeof text !== 'string' || text.length > 4000) return null;
  const head = text.match(/#AjusteCubano\s*·\s*([^·\n]+?)\s*(?:·\s*([A-Z]{2})\b)?\s*(?:·\s*([A-Z]{3})\b)?\s*(?:\n|·|$)/);
  if (head === null) return null;
  const channel = TOKEN_TO_CHANNEL[norm(head[1]!)];
  if (channel === undefined) return null;
  const filed = text.match(new RegExp(`(?:Presentado|Filed)\\s*:\\s*${YM}`, 'i'));
  if (filed === null) return null;

  const out: Partial<CaseTimeline> = {
    entryChannel: channel,
    i485ReceiptDate: `${filed[1]}-15`,
    i485ReceiptDateGranularity: 'month',
  };
  if (head[2] !== undefined) out.state = head[2];
  if (head[3] !== undefined) out.officeCode = head[3];

  const milestones: Milestone[] = [];
  const pairs: [MilestoneKey, string][] = [
    ['biometrics', 'Huellas|Biometrics'], ['ead_c9', 'EAD'], ['interview', 'Entrevista|Interview'], ['decision', 'Decisi[oó]n|Decision'],
  ];
  for (const p of pairs) {
    const m = milestoneFrom(p[0], cell(text, p[1]));
    if (m !== null) milestones.push(m);
  }
  out.milestones = milestones;
  return out;
}
