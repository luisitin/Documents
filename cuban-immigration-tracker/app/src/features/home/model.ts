/**
 * Pure read-outs for S1 Home (00-product-spec.md S1). No clock and no I/O: `today` comes from the
 * data layer (WP6 `useData().today`), so the same data always renders the same screen.
 */
import type { Alert, AlertsFile, CaseTimeline, FiscalQuarter, ISODate, NationalFile, QuarterRow, QuarterlyFile, YearMonth } from '@caa/data-schemas';
import { addMonths, quarterMonths } from '@/ui/format';
import { byYm, nextQuarter, quarterIndex } from './shared/format';

/** The latest row of one workbook form (headline pending is never taken from here, 00 §3 principle 4). */
export function latestQuarterRow(q: QuarterlyFile, form: QuarterRow['form']): QuarterRow | null {
  let best: QuarterRow | null = null;
  for (const r of q.rows) if (r.form === form && (!best || quarterIndex(r.quarter) > quarterIndex(best.quarter))) best = r;
  return best;
}

/** The monthly Cuban I-485 rows in order (doc 04 §1.1 [F]). */
export function monthlyRows(n: NationalFile) {
  return byYm(n.rows);
}

/**
 * "Próximos datos oficiales" (00 S1). USCIS publishes the monthly CSV 4–8 weeks after month end
 * and the quarterly workbooks about 10 weeks after quarter end (doc 04 §0; 00 §1.1), so the next
 * monthly file is the month after the latest one, and the next quarterly report is expected at the
 * beginning of the third month after its quarter ends (FY26 Q4, Jul–Sep 2026 → "≈ early Dec 2026",
 * key facts §7 "FY26 Q4 workbook ≈ early Dec 2026").
 */
export function nextFiles(latestMonth: YearMonth, latestQuarter: FiscalQuarter): { month: YearMonth; quarter: FiscalQuarter; quarterExpected: YearMonth } {
  const quarter = nextQuarter(latestQuarter);
  const { year, to } = quarterMonths(quarter);
  const end = `${year}-${String(to).padStart(2, '0')}`;
  return { month: addMonths(latestMonth, 1), quarter, quarterExpected: addMonths(end, 3) };
}

/** A published alert that has not expired on `today`. Retracted alerts are never shown. */
export function isLive(a: Alert, today: ISODate): boolean {
  return a.status === 'published' && (!a.expires || a.expires >= today);
}

/**
 * Whether an alert's `affects` matches a case (00 S8 "a quién afecta"; 02 §2.6). An UNKNOWN channel
 * matches every channel-specific alert, because the case could be any of them.
 */
export function affectsCase(a: Alert, c: CaseTimeline): boolean {
  const f = a.affects;
  if (f.channels && f.channels.length > 0) {
    const ok = f.channels.includes('ALL_CUBAN') || f.channels.includes(c.entryChannel) || c.entryChannel === 'UNKNOWN';
    if (!ok) return false;
  }
  if (f.filedBefore && !(c.i485ReceiptDate < f.filedBefore)) return false;
  if (f.filedAfter && !(c.i485ReceiptDate > f.filedAfter)) return false;
  if (f.hasEad !== undefined) {
    const has = c.milestones.some((m) => m.key === 'ead_c9');
    if (has !== f.hasEad) return false;
  }
  return true;
}

/** Newest first; ties by id for a stable order. */
export function sortAlerts(alerts: readonly Alert[]): Alert[] {
  return [...alerts].sort((a, b) => (a.date !== b.date ? (a.date < b.date ? 1 : -1) : a.id < b.id ? -1 : 1));
}

/**
 * The banner alert on Home (00 S1 "The latest high-severity alert appears as a banner"): the
 * newest live high-severity alert, preferring one that affects the active case when there is one.
 */
export function latestHighAlert(file: AlertsFile, today: ISODate, active: CaseTimeline | null): Alert | null {
  const high = sortAlerts(file.alerts.filter((a) => a.severity === 'high' && isLive(a, today)));
  if (active) {
    const mine = high.find((a) => affectsCase(a, active));
    if (mine) return mine;
  }
  return high[0] ?? null;
}
