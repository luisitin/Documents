/// <reference types="vite/client" />
/**
 * Test helpers for @caa/estimator (WP2). Inputs come from two places, both labelled SAMPLE/TEST:
 * - the oracle's golden file (`@caa/estimator/golden`: the 24 official monthly rows of doc 04 §1.1
 *   [F], the fixture office multipliers of 04 §5.3 and the case specs of 04 §9.2);
 * - the WP1 hand-built sample G0 (packages/data-schemas/test/fixtures/sample-handbuilt), parsed
 *   with the v1 schemas, for the policy, quarterly, offices, alerts and manifest files.
 * Fixtures are loaded with Vite's `import.meta.glob` (no Node built-ins under packages/, ARCH-1).
 *
 * The clock and the flags normally come from @caa/case-rules (WP3); the estimator must not import
 * it (07 WP2 "Consumes"), so `testClock` / `testFlags` below re-derive the few fields the golden
 * cases need, from EST-12 and 02 §3. They are test scaffolding, not a second implementation for
 * the app.
 */
import {
  parseDataFile, parseManifest,
  type AlertsFile, type CaseTimeline, type ContentFile, type DerivedFlags, type EntryChannel, type EstimateInput, type EstimateOk,
  type EstimatorParams, type ISODate, type Manifest, type Milestone, type MonthlyRow, type NationalFile, type OfficesFile,
  type PolicyFile, type QuarterlyFile, type Regime, type RegimeId,
} from '@caa/data-schemas';
import { GOLDEN } from '@caa/estimator/golden';

export interface Snapshot {
  national: NationalFile; quarterly: QuarterlyFile; offices: OfficesFile; policy: PolicyFile; alerts: AlertsFile;
  content: ContentFile; params: EstimatorParams; manifest: Manifest;
}

const NAMES = ['national', 'quarterly', 'offices', 'policy', 'alerts', 'content', 'params'] as const;

function must<T>(r: { ok: true; value: T } | { ok: false; issues: string[] }, what: string): T {
  if (!r.ok) throw new Error(`${what}: ${r.issues.slice(0, 5).join('; ')}`);
  return r.value;
}

/** Parse a directory of snapshot JSON (as loaded by import.meta.glob) with the v1 schemas. */
export function loadSnapshot(files: Record<string, unknown>, label: string): Snapshot {
  const get = (name: string) => {
    const key = Object.keys(files).find((k) => k.endsWith(`/${name}.json`));
    if (!key) throw new Error(`${label}: ${name}.json missing`);
    return files[key];
  };
  const out: Record<string, unknown> = {};
  for (const n of NAMES) out[n] = must(parseDataFile(n, get(n)), `${label}/${n}.json`);
  out.manifest = must(parseManifest(get('manifest')), `${label}/manifest.json`);
  return out as unknown as Snapshot;
}

const g0Files = import.meta.glob('../../data-schemas/test/fixtures/sample-handbuilt/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;
const appSampleFiles = import.meta.glob('../../../app/src/data/sample/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;

/** G0, the WP1 hand-built SAMPLE (07 §5). */
export const G0: Snapshot = loadSnapshot(g0Files, 'G0');

/** The app's bundled sample (WP5 copies G0, then G1, to app/src/data/sample); G0 until it exists. */
export const BUNDLED: { snapshot: Snapshot; source: string } = Object.keys(appSampleFiles).some((k) => k.endsWith('/manifest.json'))
  ? { snapshot: loadSnapshot(appSampleFiles, 'app/src/data/sample'), source: 'app/src/data/sample' }
  : { snapshot: G0, source: 'packages/data-schemas/test/fixtures/sample-handbuilt (G0; app/src/data/sample not yet created by WP5)' };

type GoldenRow = (typeof GOLDEN.inputs.rows)[number];

/** The golden file's 24 rows as MonthlyRow (source refs borrowed from G0, which has the same rows). */
export function goldenRows(): MonthlyRow[] {
  return GOLDEN.inputs.rows.map((r: GoldenRow, i: number) => ({
    ym: r.ym, received: r.received, approved: r.approved, denied: r.denied, pending: r.pending,
    pendingOver6: r.pendingOver6, avgMonths: r.avgMonths, source: G0.national.rows[i]!.source,
  }));
}

/** The golden fixture: G0 with the golden rows and the 04 §5.3 / key-facts office multipliers. */
export function goldenSnapshot(): Snapshot {
  const fm = GOLDEN.inputs.fixtureMultipliers as Record<string, number>;
  return {
    ...G0,
    national: { ...G0.national, rows: goldenRows() },
    params: { ...G0.params, officeMultipliers: G0.params.officeMultipliers.map((m) => ({ ...m, shrunk: fm[m.code] ?? m.shrunk })) },
  };
}

// ── cases ────────────────────────────────────────────────────────────────────────────────────

export interface GoldenCaseSpec {
  channel: string; receipt: string; receiptGranularity: string; state: string | null; office: string | null; inClass?: boolean;
  milestones: { key: string; date: string | null; granularity: string; meta?: Record<string, string> }[];
}

let seq = 0;
/** Golden case spec → CaseTimeline (synthetic: no names, no receipt numbers; 07 §10 rule 5). */
export function toCase(spec: GoldenCaseSpec): CaseTimeline {
  seq += 1;
  const c: CaseTimeline = {
    schemaVersion: 1, localId: `00000000-0000-4000-8000-${String(seq).padStart(12, '0')}`, nickname: 'Caso de prueba', role: 'principal',
    entryChannel: spec.channel as EntryChannel, i485ReceiptDate: spec.receipt, i485ReceiptDateGranularity: spec.receiptGranularity as 'day' | 'month',
    concurrentI765: true, concurrentI131: null, withAttorney: null,
    basicDocs: { paroleRecord: null, nationalityProof: null, i693: null, photos: null, feeOrWaiver: null },
    milestones: spec.milestones.map((m) => ({
      key: m.key as Milestone['key'], date: m.date, dateGranularity: m.granularity as 'day' | 'month', dateSource: 'notice' as const,
      ...(m.meta ? { meta: m.meta as Milestone['meta'] } : {}),
    })),
    createdAt: '2026-10-20T00:00:00Z', updatedAt: '2026-10-20T00:00:00Z',
  };
  if (spec.state) c.state = spec.state;
  if (spec.office) c.officeCode = spec.office;
  return c;
}

const NO_ESTIMATE: Partial<Record<EntryChannel, DerivedFlags['noEstimateReason']>> = { I220A: 'i220a', EWI: 'ewi', CONDITIONAL_PAROLE_236: 'conditional_parole_236' };
const PAROLE: EntryChannel[] = ['CHNV', 'CBP_ONE', 'FRP_CFRP', 'U4U', 'OTHER_PAROLE'];

/** Minimal DerivedFlags for the estimator tests (the real ones come from case-rules deriveFlags, WP3). */
export function testFlags(c: CaseTimeline, over: Partial<DerivedFlags> = {}): DerivedFlags {
  const parole = PAROLE.includes(c.entryChannel);
  return {
    isParoleBased: parole, admittedOrParoled: parole || c.entryChannel === 'VISA',
    noEstimateReason: NO_ESTIMATE[c.entryChannel] ?? null,
    r1HoldApplies: ['CHNV', 'FRP_CFRP', 'U4U'].includes(c.entryChannel) ? true : c.entryChannel === 'CBP_ONE' ? 'low_confidence' : c.entryChannel === 'UNKNOWN' ? 'unknown_channel' : false,
    frpI485Carveout: false, redEagleAppearsInClass: c.i485ReceiptDate <= '2026-08-24', doeDhsAppearsInClass: false,
    expeditedRemovalWarning: false, reTerminationDateSuspicious: false, oneYearWarning: false, basicDocsComplete: null,
    filedAfterRedEagle: c.i485ReceiptDate > '2026-08-24', ...over,
  };
}

const day = (d: string) => Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10))) / 86400000;

/** EST-12 adjudicable days (test scaffolding; WP3's clockFor is the app implementation). */
export function testAdjudicable(receipt: ISODate, today: ISODate, regimes: Regime[], channel: EntryChannel, ends: 'default' | 'altOps'): { days: number; holds: RegimeId[] } {
  let days = day(today) - day(receipt);
  const holds: RegimeId[] = [];
  for (const r of regimes) {
    if (!r.hold || r.start === null || r.end === null) continue;
    if (!r.appliesTo.includes('ALL_CUBAN') && !r.appliesTo.includes(channel)) continue;
    const ops = r.altEnds?.ops;
    const end = ends === 'altOps' && ops && ops.length ? ops[ops.length - 1]! : r.end;
    const a = receipt > r.start ? receipt : r.start;
    const b = end < today ? end : today;
    if (a < b) { days -= day(b) - day(a); holds.push(r.id); }
  }
  return { days, holds };
}

export function testClock(c: CaseTimeline, policy: PolicyFile, today: ISODate): EstimateOk['clock'] {
  const d = testAdjudicable(c.i485ReceiptDate, today, policy.regimes, c.entryChannel, 'default');
  const alt = testAdjudicable(c.i485ReceiptDate, today, policy.regimes, c.entryChannel, 'altOps');
  return {
    calendarDays: day(today) - day(c.i485ReceiptDate), adjudicableDays: d.days, adjudicableDaysAltOps: alt.days, holdsApplied: d.holds,
    r1: d.holds.includes('R1') ? 'applied' : c.entryChannel === 'CBP_ONE' ? 'not_applied_low_confidence' : 'not_applied',
  };
}

/** A full EstimateInput for a case on a snapshot (data status 'published' unless overridden). */
export function inputFor(c: CaseTimeline, snap: Snapshot, today: ISODate, over: Partial<EstimateInput> = {}): EstimateInput {
  return {
    case: c, flags: testFlags(c), clock: testClock(c, snap.policy, today),
    national: snap.national, quarterly: snap.quarterly, offices: snap.offices, policy: snap.policy, params: snap.params, alerts: snap.alerts,
    data: { status: 'published', manifest: snap.manifest }, today, ...over,
  };
}

/** Narrow an EstimateResult to EstimateOk (fails the test otherwise). */
export function ok(r: ReturnType<typeof import('@caa/estimator').estimate>): EstimateOk {
  if (r.kind !== 'estimate') throw new Error(`expected an estimate, got ${r.kind}`);
  return r;
}

export const PROB_TOL = 5e-4; // 04 §9.1
