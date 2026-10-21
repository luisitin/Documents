/**
 * Which case the "Mi caso" tab is showing (WP8b; 00 S2 "Ver un ejemplo", S3).
 *
 * - `'example'` = the T15 reference fixture (`referenceCase()`, 04 §9.2). It lives only in this
 *   in-memory selection and is NEVER written to the KV (07 WP8b acceptance "Ver un ejemplo never
 *   writes to KV"); a reload forgets it.
 * - A local id selects one of the saved cases (≤ 3, `useCases()`); otherwise the active case is
 *   shown; with no saved case the subject is null and the screens show their set-up prompt.
 * - The selection is shared by every screen of the tab (estimate, peers, EAD, remedies, share), so
 *   "Ver un ejemplo" on /case also drives /case/peers etc. without URL parameters (the artifact
 *   host never shows URL changes; contract (c)).
 */
import { useMemo, useSyncExternalStore } from 'react';
import type { CaseTimeline } from '@caa/data-schemas';
import { referenceCase } from '@caa/estimator';
import { useCases } from '@/storage/cases';

export type SubjectSelection = 'example' | string | null;

let selection: SubjectSelection = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const l of listeners) l();
}
function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
const snapshot = (): SubjectSelection => selection;

/** Selects the example, a saved case by local id, or null (= the active case). Memory only. */
export function selectCaseSubject(next: SubjectSelection): void {
  if (selection === next) return;
  selection = next;
  emit();
}

/** The current raw selection (tests). */
export function getCaseSubjectSelection(): SubjectSelection {
  return selection;
}

export interface CaseSubject {
  /** The id `useEstimate()` takes: 'example', a local id, or '' when there is no case. */
  estimateId: string;
  isExample: boolean;
  timeline: CaseTimeline | null;
  select(next: SubjectSelection): void;
}

/** The case the tab is showing (see the module comment for the resolution order). */
export function useCaseSubject(): CaseSubject {
  const sel = useSyncExternalStore(subscribe, snapshot, snapshot);
  const { cases, active } = useCases();
  const example = useMemo(() => referenceCase(), []);
  return useMemo(() => {
    if (sel === 'example') return { estimateId: 'example', isExample: true, timeline: example, select: selectCaseSubject };
    const chosen = sel ? cases.find((c) => c.localId === sel) : undefined;
    const c = chosen ?? active;
    return { estimateId: c ? c.localId : '', isExample: false, timeline: c ?? null, select: selectCaseSubject };
  }, [sel, cases, active, example]);
}
