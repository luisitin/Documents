/**
 * `<DataProvider>` (07 WP6; 01-architecture.md §3 step 7, §4): the app's data layer.
 *
 * Order of sources: the last complete KV copy, else the bundled sample (frozen golden snapshot,
 * labelled "Muestra"), then the network according to the single fetch rule (`./fetchers`):
 * native fetches the GitHub raw URLs of `app.json` `extra.data`; the web artifact fetches the
 * files shipped next to the page through the base captured by the prelude (`./data/`).
 *
 * `status` (07 §6.0 `DataStatus`; 00 §5.1 chip):
 * - `live`: a manifest was fetched and validated in this session (native, or web without
 *   `artifactBuiltAt`);
 * - `published`: the web artifact's shipped manifest (it carries `artifactBuiltAt`);
 * - `cached`: offline, failed or not re-checked yet, with a complete KV copy;
 * - `sample`: nothing fetched or cached.
 * A failed check, an invalid or sha-mismatched file, or an incompatible manifest (unknown
 * `schemaVersion`, `minAppVersion` too high) never replaces the data on screen; the `notice` says
 * so (00 §5.1 "No pudimos actualizar…", "Actualice la app…").
 */
import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import Constants from 'expo-constants';
import { localToday, type CaseTimeline, type ISODate, type ISODateTime } from '@caa/data-schemas';
import { deriveFlags, remedyLadder } from '@caa/case-rules';
import { computeGuards } from '@caa/estimator';
import { notifications, type ForegroundEvent } from '@/notifications';
import { getCases } from '@/storage/cases';
import { kv } from '@/storage/kv';
import type { Kv } from '@/storage/kvCore';
import { DATA_ORIGIN, dataBaseUrls } from './baseUrl';
import { readCachedSnapshot, refreshSnapshot, type FetchLike, type RefreshOutcome } from './fetchers';
import { hostRefresh } from './hostRefresh';
import { sampleSnapshot, setCurrentSnapshot, type DataSnapshot } from './snapshot';
import type { DataContextValue, DataNotice, DataStatus } from './useData';

/**
 * The global `fetch`, always called unbound-safe: invoking it as a method of another object
 * throws "Illegal invocation" in browsers.
 */
const defaultFetch: FetchLike = (url, init) => (globalThis.fetch as unknown as FetchLike)(url, init);

export const DataContext = createContext<DataContextValue | null>(null);

/** The running app's version (compared with `manifest.minAppVersion`). */
export function appVersion(): string {
  try {
    return Constants.expoConfig?.version ?? '0.1.0';
  } catch {
    return '0.1.0';
  }
}

interface State {
  snapshot: DataSnapshot;
  status: DataStatus;
  fetchedAt: ISODateTime | null;
  notice: DataNotice | null;
  refreshing: boolean;
}

function initialState(store: Kv): State {
  const cached = readCachedSnapshot(store);
  return cached
    ? { snapshot: cached.snapshot, status: 'cached', fetchedAt: cached.fetchedAt, notice: null, refreshing: false }
    : { snapshot: sampleSnapshot(), status: 'sample', fetchedAt: null, notice: null, refreshing: false };
}

/** State of remedy rung a ((c)(9) e-Request, 147-C9 at NBC) for a case on a snapshot. */
function c9RungState(c: CaseTimeline, snap: DataSnapshot, today: ISODate): string | null {
  try {
    const ladder = remedyLadder(c, deriveFlags(c, snap.policy, today), snap.offices, snap.policy, today);
    return ladder.find((s) => s.rung === 'a_c9')?.state ?? null;
  } catch {
    return null; // never let a malformed case block the refresh
  }
}

/**
 * Foreground notification events after a refresh (00 §7): a new official month, the (c)(9)
 * delay-inquiry window opening (rung a_c9 becomes `available` between the previous and the next
 * snapshot: no EAD yet, I-765 filed with the I-485, receipt now before the NBC 147-C9 inquiry
 * date), and a new high-severity alert affecting a saved case. Exported for tests.
 */
export function foregroundEvents(
  prev: DataSnapshot, next: DataSnapshot, today: ISODate, cases: readonly CaseTimeline[] = getCases().cases,
): ForegroundEvent[] {
  const out: ForegroundEvent[] = [];
  if (next.manifest.latestOfficialMonth > prev.manifest.latestOfficialMonth) out.push({ kind: 'data_month', month: next.manifest.latestOfficialMonth });
  for (const c of cases) {
    if (c.concurrentI765 === false || c.milestones.some((m) => m.key === 'ead_c9')) continue;
    if (c9RungState(c, next, today) === 'available' && c9RungState(c, prev, today) !== 'available') {
      out.push({ kind: 'c9_inquiry', caseId: c.localId });
    }
  }
  const known = new Set(prev.alerts.alerts.map((a) => a.id));
  for (const a of next.alerts.alerts) {
    if (known.has(a.id) || a.severity !== 'high' || a.status !== 'published') continue;
    const ch = a.affects.channels;
    const affects = !ch || ch.includes('ALL_CUBAN') || cases.some((c) => ch.includes(c.entryChannel));
    if (affects && cases.length > 0) out.push({ kind: 'alert', alertId: a.id, title: a.title });
  }
  return out;
}

export interface DataProviderProps {
  children: ReactNode;
  /** Injected for tests; defaults to the global `fetch`. */
  fetchImpl?: FetchLike;
  /** Injected clock (ms since epoch); defaults to `Date.now`. */
  now?: () => number;
  /** Data bases (each ending with `/`); defaults to `dataBaseUrls()`. */
  bases?: string[];
  appVersion?: string;
  /** Enforce the 6 h interval; defaults to true for the native remote fetch, false on web. */
  enforceInterval?: boolean;
  /** KV to use (tests); defaults to the app singleton. */
  store?: Kv;
}

export function DataProvider(props: DataProviderProps) {
  const store = props.store ?? kv;
  const [state, setState] = useState<State>(() => initialState(store));
  const stateRef = useRef(state);
  const inflight = useRef<Promise<void> | null>(null);
  const opts = useRef(props);
  useEffect(() => {
    stateRef.current = state;
    opts.current = props;
  });

  const run = useCallback(async (manual: boolean) => {
    if (inflight.current) return inflight.current;
    const p = (async () => {
      const o = opts.current;
      const nowMs = (o.now ?? Date.now)();
      const cached = readCachedSnapshot(store);
      setState((s) => ({ ...s, refreshing: true }));
      let outcome: RefreshOutcome;
      try {
        outcome = await refreshSnapshot({
          kv: store,
          fetchImpl: o.fetchImpl ?? defaultFetch,
          nowMs,
          bases: o.bases ?? dataBaseUrls(),
          manual,
          enforceInterval: o.enforceInterval ?? DATA_ORIGIN === 'remote',
          appVersion: o.appVersion ?? appVersion(),
          copies: cached ? [cached.snapshot, sampleSnapshot()] : [sampleSnapshot()],
          etag: cached?.etag,
        });
      } catch (e) {
        outcome = { kind: 'failed', reason: 'network', detail: String(e) };
      }
      if (outcome.kind === 'failed' && DATA_ORIGIN === 'shipped') {
        // Optional, lowest priority (01 §3 step 9): inside claude.ai the host may provide the data.
        const host = await hostRefresh().catch(() => null);
        if (host) outcome = { kind: 'updated', snapshot: host, fetchedAt: host.manifest.lastCheckedAt, fetchedFiles: [], base: 'host' };
      }
      // Functional updates only: when `refreshSnapshot` returns quickly ('skipped', backoff) React
      // may not have rendered the cold-start `setState(cached)` yet, so `stateRef` can still hold the
      // bundled sample; rebuilding from it would overwrite the cached real data (review round 1).
      switch (outcome.kind) {
        case 'updated': {
          const prevSnap = cached?.snapshot ?? stateRef.current.snapshot;
          const today = localToday(new Date(nowMs));
          for (const e of foregroundEvents(prevSnap, outcome.snapshot, today)) notifications.queueForeground(e);
          const next: State = {
            snapshot: outcome.snapshot,
            status: outcome.snapshot.manifest.artifactBuiltAt ? 'published' : 'live',
            fetchedAt: outcome.fetchedAt,
            notice: null,
            refreshing: false,
          };
          setState(next);
          break;
        }
        case 'not_modified': {
          const fetchedAt = outcome.fetchedAt;
          setState((s) => {
            const snap = cached?.snapshot ?? s.snapshot;
            return { snapshot: snap, status: snap.manifest.artifactBuiltAt ? 'published' : 'live', fetchedAt, notice: null, refreshing: false };
          });
          break;
        }
        case 'skipped':
          setState((s) => ({ ...s, refreshing: false }));
          break;
        case 'incompatible':
          setState((s) => ({ ...s, notice: { kind: 'app_too_old' }, refreshing: false }));
          break;
        case 'failed': {
          const reason = outcome.reason;
          setState((s) => {
            const hasCopy = s.status !== 'sample';
            return {
              ...s,
              status: hasCopy ? 'cached' : 'sample',
              notice: hasCopy || manual ? { kind: 'update_failed', at: s.fetchedAt, reason } : null,
              refreshing: false,
            };
          });
          break;
        }
      }
      if (outcome.kind === 'updated') notifications.notifyOnForeground();
    })().finally(() => {
      inflight.current = null;
    });
    inflight.current = p;
    return p;
  }, [store]);

  // Cold start: after the KV mirror is complete, re-read the cache, then apply the fetch rule.
  useEffect(() => {
    let alive = true;
    store.ready.then(() => {
      if (!alive) return;
      const s = initialState(store);
      if (s.status === 'cached') setState((cur) => (cur.status === 'sample' ? s : cur));
      void run(false);
    });
    return () => {
      alive = false;
    };
  }, [run, store]);

  // Foreground (native): the same rule, then the queued foreground notifications.
  useEffect(() => {
    if (DATA_ORIGIN !== 'remote') return;
    const sub = AppState.addEventListener('change', (st) => {
      if (st !== 'active') return;
      void run(false).then(() => notifications.notifyOnForeground());
    });
    return () => sub.remove();
  }, [run]);

  useEffect(() => {
    setCurrentSnapshot(state.snapshot);
  }, [state.snapshot]);

  const refresh = useCallback(() => run(true), [run]);

  const value = useMemo<DataContextValue>(() => {
    const s = state.snapshot;
    const today = localToday(new Date((props.now ?? Date.now)()));
    const guards = computeGuards({ today, dataThrough: s.params.dataThrough, quarterly: s.quarterly, status: state.status, manifest: s.manifest });
    return {
      status: state.status,
      guards,
      manifest: s.manifest,
      national: s.national,
      quarterly: s.quarterly,
      offices: s.offices,
      policy: s.policy,
      alerts: s.alerts,
      content: s.content,
      params: s.params,
      asOf: {
        latestOfficialMonth: s.manifest.latestOfficialMonth,
        dataChangedAt: s.manifest.dataChangedAt,
        ...(s.manifest.artifactBuiltAt ? { artifactBuiltAt: s.manifest.artifactBuiltAt } : {}),
        lastCheckedAt: s.manifest.lastCheckedAt,
        fetchedAt: state.fetchedAt,
      },
      refreshing: state.refreshing,
      refresh,
      notice: state.notice,
      today,
      snapshot: s,
    };
  }, [state, refresh, props.now]);

  return <DataContext.Provider value={value}>{props.children}</DataContext.Provider>;
}
