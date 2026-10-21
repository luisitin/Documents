/**
 * Small pure helpers shared by the pipeline: hashing, the canonical JSON writer (03 §5: stable
 * key order, 2-space indent, trailing newline, so diffs are clean and sha256 values are
 * deterministic), calendar arithmetic on ISO strings, fiscal quarters (FY = Oct 1 – Sep 30,
 * doc 04 §1.5) and the parser error type.
 */
import { createHash } from 'node:crypto';
import type { FiscalQuarter, ISODate, ISODateTime, YearMonth } from '@caa/data-schemas';
import { MONTHS_EN } from './constants';

/** Hex sha256 of raw bytes (02 §1 `SourceRef.sha256`). */
export function sha256Hex(bytes: Uint8Array | string): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/** 03 §5 canonical JSON text. Key order is the (deterministic) order the pipeline builds objects in. */
export function serializeJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/** `2026-10-20T06:17:04Z` (no milliseconds, 02 §1). */
export function isoSeconds(d: Date): ISODateTime {
  return `${d.toISOString().slice(0, 19)}Z`;
}

export function addMonthsYm(ym: YearMonth, n: number): YearMonth {
  const t = Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5, 7)) - 1 + n;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
}

export function monthsBetweenYm(a: YearMonth, b: YearMonth): number {
  return (Number(b.slice(0, 4)) - Number(a.slice(0, 4))) * 12 + Number(b.slice(5, 7)) - Number(a.slice(5, 7));
}

/** Inclusive month range. */
export function monthRange(from: YearMonth, to: YearMonth): YearMonth[] {
  const out: YearMonth[] = [];
  for (let m = from; m <= to; m = addMonthsYm(m, 1)) out.push(m);
  return out;
}

/** Whole days from a to b (UTC calendar days of two instants or dates). */
export function daysBetweenIso(a: string, b: string): number {
  return Math.floor((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

/** Month name → 1..12 (English, any case). */
export function monthNumber(name: string): number | null {
  const i = MONTHS_EN.indexOf(name.toLowerCase() as (typeof MONTHS_EN)[number]);
  if (i >= 0) return i + 1;
  const j = MONTHS_EN.findIndex((m) => m.slice(0, 3) === name.toLowerCase().slice(0, 3));
  return j >= 0 && name.length >= 3 ? j + 1 : null;
}

/**
 * Dates in the shapes the USCIS tools use (03 §3.4 step 5): `Jun 17 2023`, `June 17, 2023`,
 * `October 18, 2024`, plus ISO `2023-06-17`. Returns null when unparseable.
 */
export function parseUsDate(s: string | null | undefined): ISODate | null {
  if (!s) return null;
  const t = s.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const m = /^([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})$/.exec(t);
  if (!m) return null;
  const mo = monthNumber(m[1]!);
  const day = Number(m[2]);
  if (!mo || day < 1 || day > 31) return null;
  return `${m[3]}-${String(mo).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ── fiscal quarters ─────────────────────────────────────────────────────────────────────────

export const quarterKey = (q: FiscalQuarter) => `FY${q.fy} Q${q.q}`;
export const cmpQuarter = (a: FiscalQuarter, b: FiscalQuarter) => a.fy - b.fy || a.q - b.q;
export const sameQuarter = (a: FiscalQuarter, b: FiscalQuarter) => a.fy === b.fy && a.q === b.q;

export function nextQuarter(q: FiscalQuarter): FiscalQuarter {
  return q.q === 4 ? { fy: q.fy + 1, q: 1 } : { fy: q.fy, q: (q.q + 1) as FiscalQuarter['q'] };
}
export function prevQuarter(q: FiscalQuarter): FiscalQuarter {
  return q.q === 1 ? { fy: q.fy - 1, q: 4 } : { fy: q.fy, q: (q.q - 1) as FiscalQuarter['q'] };
}

/** The fiscal quarter containing calendar month `ym` (Oct–Dec → Q1 of the next FY). */
export function quarterOfMonth(ym: YearMonth): FiscalQuarter {
  const y = Number(ym.slice(0, 4));
  const m = Number(ym.slice(5, 7));
  if (m >= 10) return { fy: y + 1, q: 1 };
  return { fy: y, q: (Math.floor((m - 1) / 3) + 2) as FiscalQuarter['q'] };
}

/** The three calendar months of a fiscal quarter, in order. */
export function monthsOfQuarter(q: FiscalQuarter): YearMonth[] {
  const startYear = q.q === 1 ? q.fy - 1 : q.fy;
  const startMonth = q.q === 1 ? 10 : (q.q - 2) * 3 + 1;
  const first = `${startYear}-${String(startMonth).padStart(2, '0')}`;
  return [first, addMonthsYm(first, 1), addMonthsYm(first, 2)];
}

export function quarterRange(from: FiscalQuarter, to: FiscalQuarter): FiscalQuarter[] {
  const out: FiscalQuarter[] = [];
  for (let q = from; cmpQuarter(q, to) <= 0; q = nextQuarter(q)) out.push(q);
  return out;
}

// ── errors ──────────────────────────────────────────────────────────────────────────────────

/** A parser rejection: the bytes are not the documented format (classified `schema_mismatch`, 03 §2.1). */
/**
 * `decodeURIComponent` that never throws: external hrefs can hold a malformed escape (`FY24_100%_review.pdf`),
 * which must not crash a run (03 §1 principle 2). Returns the input unchanged when it cannot be decoded.
 */
export function safeDecodeURIComponent(s: string): string {
  try { return decodeURIComponent(s); } catch { return s; }
}

export class SourceError extends Error {
  readonly classification = 'schema_mismatch' as const;
  constructor(message: string) {
    super(message);
    this.name = 'SourceError';
  }
}
