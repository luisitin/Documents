/**
 * `useEstimate(caseId | 'example')` (07 §6.0, WP6): memoized
 * `deriveFlags()` → `clockFor()` → `estimate({ …, clock, quarterly, data: { status, manifest }, today })`
 * → `remedyLadder()` and `peerReasons()`.
 *
 * - `'example'` is the T15 fixture (04-estimation-model.md §9.2: CHNV, I-485 receipt 2025-03-15,
 *   biometrics 2025-07, (c)(9) EAD 2025-09, state and office unknown). It is read-only and never
 *   written to the KV (07 WP6, WP8b "Ver un ejemplo never writes to KV"). On the frozen bundled
 *   sample and today = 2026-10-20 it reproduces GOLDEN T15 (P(≤12) 0.09229, q50 54, 306
 *   adjudicable days; 00 §9 item 1).
 * - The estimator never reads a clock: `today` comes from the data layer (the device's local
 *   date), and every result carries the data month it used (`dataThrough`) for the "as of" label.
 * - An unknown case id gives all-null fields.
 * - Ineligible entries (I-220A, EWI, INA 236) get `result.kind = 'no_estimate'` and no numbers.
 */
import { useContext, useMemo } from 'react';
import type { CaseTimeline, DerivedFlags, EstimateOk, EstimateResult, ISODate, PeerReasonId, RemedyStep } from '@caa/data-schemas';
import { clockFor, deriveFlags, peerReasons, remedyLadder } from '@caa/case-rules';
import { estimate, referenceCase } from '@caa/estimator';
import { useCases } from '@/storage/cases';
import { DataContext } from './DataProvider';
import type { DataContextValue } from './useData';

export interface EstimateBundle {
  flags: DerivedFlags | null;
  clock: EstimateOk['clock'] | null;
  result: EstimateResult | null;
  remedies: RemedyStep[];
  peers: PeerReasonId[];
}

const EMPTY: EstimateBundle = { flags: null, clock: null, result: null, remedies: [], peers: [] };

/** The pure pipeline behind `useEstimate` (exported for tests and non-React callers). */
export function computeEstimate(c: CaseTimeline, d: Pick<DataContextValue, 'status' | 'snapshot'>, today: ISODate, opts?: { bands?: boolean }): EstimateBundle {
  const s = d.snapshot;
  const flags = deriveFlags(c, s.policy, today);
  const clock = clockFor(c, s.policy, today);
  let result: EstimateResult | null;
  try {
    result = estimate({
      case: c, flags, clock,
      national: s.national, quarterly: s.quarterly, offices: s.offices, policy: s.policy, params: s.params, alerts: s.alerts,
      data: { status: d.status, manifest: s.manifest },
      today,
      opts,
    });
  } catch {
    result = null; // never crash a screen; the screen shows its error state
  }
  const remedies = remedyLadder(c, flags, s.offices, s.policy, today);
  const peers = peerReasons(c, flags, s.offices, today);
  return { flags, clock, result, remedies, peers };
}

/** 07 §6.0 `useEstimate(caseIdOrExample)`. */
export function useEstimate(caseIdOrExample: string | 'example'): EstimateBundle {
  const data = useContext(DataContext);
  if (!data) throw new Error('useEstimate() must be used inside <DataProvider>');
  const { cases } = useCases();
  const example = useMemo(() => referenceCase(), []);
  const c = caseIdOrExample === 'example' ? example : (cases.find((x) => x.localId === caseIdOrExample) ?? null);
  const { status, snapshot, today } = data;
  return useMemo(() => (c ? computeEstimate(c, { status, snapshot }, today) : EMPTY), [c, status, snapshot, today]);
}
