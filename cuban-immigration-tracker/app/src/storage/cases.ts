/**
 * The user's case timelines (`caa:v1:cases`, device only; 02-data-model.md §3, §6; 07 §6.0
 * `useCases()`).
 *
 * Privacy (05-privacy-security-legal.md §1, §3, §4; owner rule "never store names or full receipt
 * numbers"): every case goes through `parseCase`, whose schema has no full-receipt field and strips
 * unknown keys, so a name or a full receipt number can never be persisted. At most 3 cases.
 * The "Ver un ejemplo" fixture (T15, `referenceCase()`) is never written (07 WP6, WP8b).
 *
 * "Borrar mis datos" = `clearAll()`: `kv.clear('caa:')` plus cancelling every scheduled
 * notification (02 §6; 05 §1 item 4).
 */
import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { parseCase, type CaseTimeline, type Result } from '@caa/data-schemas';
import { REFERENCE_CASE_ID, referenceCase } from '@caa/estimator';
import { notifications } from '@/notifications';
import { KV_PREFIX, readJson, writeJson } from './kvCore';
import { kv } from './kv';
import { getSettings, resetSettingsAfterClear } from './settings';
import { createStore } from './store';

export const CASES_KEY = 'caa:v1:cases' as const;
/** 07 §6.0: at most three cases per device (CU7 principal + derivatives). */
export const MAX_CASES = 3;
/** The localId of the read-only example (T15) — refused by `saveCase`. */
export const EXAMPLE_LOCAL_ID = referenceCase().localId;
export { REFERENCE_CASE_ID };

export interface CasesState {
  activeId: string | null;
  cases: CaseTimeline[];
}

const EMPTY: CasesState = { activeId: null, cases: [] };

/** Parses the stored value; invalid individual cases are dropped (02 §6 "invalid → removed"). */
function parseStored(v: unknown): CasesState | null {
  if (typeof v !== 'object' || v === null) return null;
  const raw = v as { activeId?: unknown; cases?: unknown };
  if (!Array.isArray(raw.cases)) return null;
  const cases: CaseTimeline[] = [];
  for (const c of raw.cases) {
    const r = parseCase(c);
    if (r.ok && r.value.localId !== EXAMPLE_LOCAL_ID && cases.length < MAX_CASES) cases.push(r.value);
  }
  const activeId = typeof raw.activeId === 'string' && cases.some((c) => c.localId === raw.activeId)
    ? raw.activeId
    : (cases[0]?.localId ?? null);
  return { activeId, cases };
}

function load(): CasesState {
  return readJson(kv, CASES_KEY, parseStored) ?? EMPTY;
}

const store = createStore<CasesState>(load());
kv.ready.then(() => store.set(load()));

function persist(next: CasesState): void {
  writeJson(kv, CASES_KEY, next);
  store.set(next);
}

/** Current cases (synchronous; used by the notifications module). */
export function getCases(): CasesState {
  return store.get();
}

export function subscribeCases(listener: (next: CasesState, prev: CasesState) => void): () => void {
  return store.subscribe(listener);
}

/** Validates and upserts a case (02 §8 rules via `parseCase`), then schedules its reminders. */
export function saveCase(c: CaseTimeline): Result<CaseTimeline> {
  if (c.localId === EXAMPLE_LOCAL_ID) return { ok: false, issues: ['localId: the example case is read-only and never stored'] };
  const r = parseCase(c);
  if (!r.ok) return r;
  const cur = store.get();
  const i = cur.cases.findIndex((x) => x.localId === r.value.localId);
  if (i < 0 && cur.cases.length >= MAX_CASES) return { ok: false, issues: [`cases: at most ${MAX_CASES} cases per device`] };
  const cases = i < 0 ? [...cur.cases, r.value] : cur.cases.map((x, j) => (j === i ? r.value : x));
  persist({ activeId: cur.activeId ?? r.value.localId, cases });
  void notifications.scheduleCaseReminders(r.value, getSettings().lang);
  return r;
}

export function removeCase(localId: string): void {
  const cur = store.get();
  const cases = cur.cases.filter((c) => c.localId !== localId);
  if (cases.length === cur.cases.length) return;
  const activeId = cur.activeId === localId ? (cases[0]?.localId ?? null) : cur.activeId;
  persist({ activeId, cases });
  void notifications.rescheduleAll(getSettings().lang);
}

export function setActiveCase(localId: string): void {
  const cur = store.get();
  if (cur.activeId === localId || !cur.cases.some((c) => c.localId === localId)) return;
  persist({ ...cur, activeId: localId });
}

/** "Borrar mis datos": every `caa:` key and every scheduled notification (05 §1 item 4). */
export async function clearAllData(): Promise<void> {
  kv.clear(KV_PREFIX);
  store.set(EMPTY);
  resetSettingsAfterClear();
  await notifications.cancelAll();
}

/** Re-reads the cases from the KV (tests). */
export function reloadCases(): void {
  store.set(load());
}

/** 07 §6.0 `useCases()`. */
export function useCases(): {
  cases: CaseTimeline[];
  active: CaseTimeline | null;
  save(c: CaseTimeline): Result<CaseTimeline>;
  remove(localId: string): void;
  setActive(localId: string): void;
  clearAll(): Promise<void>;
} {
  const state = useSyncExternalStore(store.subscribe, store.get, store.get);
  const save = useCallback((c: CaseTimeline) => saveCase(c), []);
  const remove = useCallback((id: string) => removeCase(id), []);
  const setActive = useCallback((id: string) => setActiveCase(id), []);
  const clearAll = useCallback(() => clearAllData(), []);
  const active = useMemo(() => state.cases.find((c) => c.localId === state.activeId) ?? null, [state]);
  return { cases: state.cases, active, save, remove, setActive, clearAll };
}
