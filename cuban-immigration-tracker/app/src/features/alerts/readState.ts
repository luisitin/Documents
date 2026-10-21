/**
 * Read alerts (`caa:v1:alerts:read`, `string[]` of alert ids; 02 §6 key table). Device only.
 *
 * The value lives in WP6's KV (memory mirror; guarded `localStorage` on web, AsyncStorage on
 * native), so it works when storage throws or is empty (artifact contract (d)): reads fall back to
 * "nothing read" and writes stay in memory. "Borrar mis datos" (`kv.clear('caa:')`) removes it
 * with everything else; the hook re-reads the KV on every render, so it never shows stale state.
 *
 * The tab layout shows the "dot when unread" of 00 §5 with `useUnreadAlertCount()` (WP11
 * integration, adr-log.md).
 */
import { useCallback, useSyncExternalStore } from 'react';
import { z } from 'zod';
import type { Alert } from '@caa/data-schemas';
import { useData } from '@/data/useData';
import { kv } from '@/storage/kv';
import { readJson, writeJson } from '@/storage/kvCore';
import { isLive } from '../home/model';

export const ALERTS_READ_KEY = 'caa:v1:alerts:read' as const;

/** Upper bound on stored ids (the curated file has a dozen alerts; old ids age out first). */
export const MAX_READ_IDS = 500;

const IdsSchema = z.array(z.string().min(1).max(200)).max(MAX_READ_IDS);

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const emit = () => {
  for (const l of listeners) l();
};

/** The raw stored string (stable by value, so `useSyncExternalStore` needs no cache). */
const snapshot = (): string | null => kv.get(ALERTS_READ_KEY);

export function readIds(): string[] {
  return readJson(kv, ALERTS_READ_KEY, (v) => {
    const r = IdsSchema.safeParse(v);
    return r.success ? r.data : null;
  }) ?? [];
}

export function markRead(ids: readonly string[]): void {
  const cur = readIds();
  const next = [...cur.filter((x) => !ids.includes(x)), ...ids].slice(-MAX_READ_IDS);
  writeJson(kv, ALERTS_READ_KEY, next);
  emit();
}

/** The read ids, re-rendering on `markRead`. */
export function useReadAlerts(): { read: ReadonlySet<string>; markRead(ids: readonly string[]): void } {
  const raw = useSyncExternalStore(subscribe, snapshot, snapshot);
  void raw; // the parsed value is recomputed below whenever the stored string changes
  const read = new Set(readIds());
  const mark = useCallback((ids: readonly string[]) => markRead(ids), []);
  return { read, markRead: mark };
}

/** How many of `alerts` are unread. */
export function unreadCount(alerts: readonly Alert[], read: ReadonlySet<string>): number {
  return alerts.reduce((n, a) => n + (read.has(a.id) ? 0 : 1), 0);
}

/** Unread alerts among the ones the Alerts tab lists (live: not retracted or expired). */
export function useUnreadAlertCount(): number {
  const d = useData();
  const { read } = useReadAlerts();
  return unreadCount(d.alerts.alerts.filter((a) => isLive(a, d.today)), read);
}
