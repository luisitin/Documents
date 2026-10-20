/**
 * 02-data-model.md §1 — primitives shared by every data file and by the device case timeline.
 *
 * Conventions used by every schema module of this package:
 * - **Curated files** (policy, alerts, content; human-edited, PR-reviewed) use `curatedObject`
 *   (strict: unknown keys are an error). **Pipeline files** (manifest, national, quarterly,
 *   offices, params, community, ledger) use `pipelineObject` (passthrough: unknown keys are kept
 *   and reported as warnings by `unknownKeyWarnings`), so additive schema changes stay
 *   backward-compatible (02 §8 "Unknown fields").
 * - Every user-facing string inside a data file is `Localized` with both sides non-empty (02 §1,
 *   §8; I18N rules in 07 §8).
 * - Dates are ISO strings compared lexicographically; nothing here reads a time zone.
 */
import { z } from './zod';

// ── calendar helpers (pure, UTC-free string arithmetic) ─────────────────────────────────────

/** Days in month for the proleptic Gregorian calendar. */
function daysInMonth(y: number, m: number): number {
  if (m === 2) return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28;
  return [4, 6, 9, 11].includes(m) ? 30 : 31;
}

/** True when `d` (already matching `YYYY-MM-DD`) names a real calendar day (rejects 2026-02-30). */
export function isRealDate(d: string): boolean {
  const y = Number(d.slice(0, 4));
  const m = Number(d.slice(5, 7));
  const day = Number(d.slice(8, 10));
  return m >= 1 && m <= 12 && day >= 1 && day <= daysInMonth(y, m);
}

/** `YYYY-MM` of an ISO date. */
export function ymOf(d: string): string {
  return d.slice(0, 7);
}

/** The month after `ym` (`2024-12` → `2025-01`). */
export function nextYm(ym: string): string {
  const y = Number(ym.slice(0, 4));
  const m = Number(ym.slice(5, 7));
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
}

/** The device's local calendar date as `YYYY-MM-DD` (used only when a caller passes no `today`). */
export function localToday(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

// ── object helpers ──────────────────────────────────────────────────────────────────────────

/**
 * Pipeline file object: passthrough at runtime (unknown keys kept, reported as warnings), but
 * typed like a plain object so consumers get exact property types (no `[k: string]: unknown`
 * index signature that would hide typos). 02 §8.
 */
export function pipelineObject<S extends z.core.$ZodLooseShape>(shape: S): z.ZodObject<S, z.core.$strip> {
  return z.looseObject(shape) as unknown as z.ZodObject<S, z.core.$strip>;
}

/** Curated file object: unknown keys are rejected (02 §8). */
export function curatedObject<S extends z.core.$ZodLooseShape>(shape: S): z.ZodObject<S, z.core.$strict> {
  return z.strictObject(shape);
}

// ── 02 §1 primitives ────────────────────────────────────────────────────────────────────────

/** `"2026-10-20"` — 02 §1; additionally rejects impossible days. */
export const ISODateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD')
  .refine(isRealDate, 'not a calendar date');
export type ISODate = string;

/** `"2026-08"` — 02 §1. */
export const YearMonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'expected YYYY-MM');
export type YearMonth = string;

/** `"2026-10-20T06:17:04Z"` — UTC instant, optional fraction (02 §1). */
export const ISODateTimeSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(\.\d+)?Z$/, 'expected YYYY-MM-DDTHH:MM:SSZ')
  .refine((s) => isRealDate(s.slice(0, 10)), 'not a calendar date');
export type ISODateTime = string;

/** 02 §1: the two app languages; Spanish is first-class. */
export const LangSchema = z.enum(['es', 'en']);
export type Lang = z.infer<typeof LangSchema>;

/** A non-empty string that is not only whitespace. */
export const NonEmptyStringSchema = z.string().min(1).regex(/\S/, 'must not be blank');

/** 02 §1 `Localized`: both sides non-empty (02 §8; checked again by `i18n:check` for curated data). */
export const LocalizedSchema = z.strictObject({ es: NonEmptyStringSchema, en: NonEmptyStringSchema });
export type Localized = z.infer<typeof LocalizedSchema>;

/** 02 §1 evidence tags (research legend; V = verified by a command). */
export const EvidenceSchema = z.enum(['F', 'S', 'S-sec', 'T', 'I', 'U', 'V']);
export type Evidence = z.infer<typeof EvidenceSchema>;

/** 02 §1: FY = Oct 1 – Sep 30 (doc 04 §1.5 "Understanding Our Data"). */
export const FiscalQuarterSchema = z.strictObject({
  fy: z.number().int().min(2000).max(2100),
  q: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
});
export type FiscalQuarter = z.infer<typeof FiscalQuarterSchema>;

/** 02 §1 statistic kinds; the UI StatTile renders one chip per kind (via FIELD_KINDS). */
export const StatisticKindSchema = z.enum([
  'count_flow', // received/approved/denied in a period
  'count_stock', // pending at period end
  'count_stock_over_6mo', // pending > 6 months
  'mean_months_completed', // monthly CSV "Avg. Processing Time" (doc 04 §1.1)
  'median_months_completed', // quarterly workbook / historic-pt (doc 04 §1.2, §2.6)
  'p80_months_completed_6mo', // Processing Times tool headline (doc 04 §2.1)
  'inquiry_date_p93', // tool case-inquiry date, ≈93rd pct [T]/secondary (docs 04, 15)
  'share', // approvals / completions
  'model_probability', // our estimate (never official)
]);
export type StatisticKind = z.infer<typeof StatisticKindSchema>;

/** 02 §1 source ids (03-data-pipeline.md §2 source table). */
export const SourceIdSchema = z.enum([
  'uscis.monthly_csv', 'uscis.quarterly_all_forms', 'uscis.i485_by_office', 'uscis.portal_index',
  'mirror.visualizer', 'mirror.jzebedee', 'uscis.historic_pt', 'fr.api', 'courtlistener.v4',
  'uscis.rss', 'curated', 'bundled_sample',
]);
export type SourceId = z.infer<typeof SourceIdSchema>;

/** An absolute http(s) URL (regex, not `new URL`, so Hermes/RN behaves like Node). */
export const UrlSchema = z.string().regex(/^https?:\/\/\S+$/, 'expected an http(s) URL');

/** Lower-case hex sha256 of raw bytes. */
export const Sha256Schema = z.string().regex(/^[0-9a-f]{64}$/, 'expected a hex sha256');

/** A whole, non-negative count of cases. */
export const CountSchema = z.number().int().nonnegative();

/** A probability or share in [0, 1]. */
export const ShareSchema = z.number().min(0).max(1);

/** 02 §1 `SourceRef`: attached to every row / record (pipeline object). */
export const SourceRefSchema = pipelineObject({
  sourceId: SourceIdSchema,
  url: UrlSchema, // exact URL fetched, or citation URL for curated
  via: z.enum(['direct', 'mirror.visualizer', 'mirror.jzebedee', 'curated']),
  period: z.union([YearMonthSchema, FiscalQuarterSchema, ISODateSchema]).optional(),
  retrievedAt: ISODateTimeSchema, // ORIGINAL retrieval time (carried forward when a source is blocked)
  sha256: Sha256Schema.optional(), // of raw bytes
  evidence: EvidenceSchema,
});
export type SourceRef = z.infer<typeof SourceRefSchema>;

/** 07 §6.0: the shared parse result. */
export type Result<T> = { ok: true; value: T } | { ok: false; issues: string[] };
