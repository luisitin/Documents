/**
 * The one key-value interface of the app (02-data-model.md §6; ADR ARCH-2 in
 * 07-implementation-plan.md §1). There is no SQLite, MMKV or TanStack Query in the MVP:
 * - expo-sqlite on web needs wasm plus COOP/COEP headers, which the artifact host does not allow
 *   (02 §6), and the whole dataset is under 400 KB;
 * - so every platform uses the same synchronous-after-`ready` memory mirror, persisted by a
 *   platform backend: AsyncStorage 2.2.0 on native (`kv.native.ts`), a guarded `localStorage` on
 *   web (`kv.web.ts`).
 *
 * The memory mirror is the source of truth for reads. Persistence failures never surface: with
 * storage disabled (web private mode, a throwing `localStorage` getter, artifact contract (d)) the
 * app keeps working from memory only, and onboarding simply repeats on the next visit (01 §4).
 *
 * This file holds the shared types and the backend-independent core. It must not import
 * `./kv` (on native Metro would resolve that to `kv.native.ts`, a cycle).
 */
import type { DataFileName } from '@caa/data-schemas';

/** Every key the app writes starts with this prefix (02 §6); "Borrar mis datos" clears it. */
export const KV_PREFIX = 'caa:' as const;
/** The storage schema version is part of the key (02 §6 "the version is part of the key prefix"). */
export const KV_VERSION = 'v1' as const;

/** 02 §6 key table. */
export type KvKey =
  | 'caa:v1:settings'
  | 'caa:v1:cases'
  | `caa:v1:data:${DataFileName | 'manifest'}`
  | 'caa:v1:alerts:read'
  | 'caa:v1:notif:scheduled'
  | 'caa:v1:refresh';

/** 02 §6 `Kv`. */
export interface Kv {
  /** Native: all `caa:` keys hydrated into memory once. Web: already resolved. Never rejects. */
  ready: Promise<void>;
  /** Synchronous read from the memory mirror (complete after `ready`). */
  get(key: KvKey): string | null;
  /** Memory immediately; persisted asynchronously (native) or inside try/catch (web). */
  set(key: KvKey, value: string): void;
  remove(key: KvKey): void;
  /** Removes every key with the prefix, in memory and in the backend. */
  clear(prefix: typeof KV_PREFIX): void;
}

/**
 * A persistence backend. Every method may throw or reject; the core swallows those failures.
 * `loadSync` is used when the platform can read synchronously (web), so the very first render
 * already sees the stored language (owner requirement 1: the choice is restored on next launch).
 */
export interface KvBackend {
  loadSync?(): Record<string, string>;
  load?(): Promise<Record<string, string>>;
  write(key: string, value: string): void | Promise<void>;
  erase(keys: string[]): void | Promise<void>;
  /** Removes every stored key with the prefix, including keys not (yet) in memory. */
  erasePrefix?(prefix: string): void | Promise<void>;
}

/** Hydration never waits longer than this: the splash is held at most 300 ms (07 WP6 rules). */
export const KV_READY_TIMEOUT_MS = 300;

function swallow(fn: () => void | Promise<void>): void {
  try {
    const r = fn();
    if (r && typeof (r as Promise<void>).then === 'function') (r as Promise<void>).then(undefined, () => undefined);
  } catch {
    /* persistence failure → memory only (02 §6; artifact contract (d)) */
  }
}

/** Builds a `Kv` over `backend`. Only keys starting with `caa:` are mirrored. */
export function createKv(backend: KvBackend): Kv {
  const mem = new Map<string, string>();
  // Keys written or removed before hydration finished: their in-memory value wins over storage.
  const touched = new Set<string>();
  // A `clear` that ran before hydration finished: nothing older may come back from storage.
  let clearedPrefix: string | null = null;

  const merge = (stored: Record<string, string> | null | undefined) => {
    if (!stored) return;
    for (const k of Object.keys(stored)) {
      const v = stored[k];
      if (!k.startsWith(KV_PREFIX) || typeof v !== 'string' || touched.has(k)) continue;
      if (clearedPrefix !== null && k.startsWith(clearedPrefix)) continue;
      mem.set(k, v);
    }
  };

  let ready: Promise<void>;
  if (backend.loadSync) {
    try {
      merge(backend.loadSync());
    } catch {
      /* unreadable storage → empty memory */
    }
    ready = Promise.resolve();
  } else if (backend.load) {
    const load = backend.load;
    ready = new Promise<void>((resolve) => {
      let p: Promise<Record<string, string>>;
      try {
        p = load();
      } catch {
        resolve();
        return;
      }
      p.then(merge, () => undefined).then(() => resolve(), () => resolve());
    });
  } else {
    ready = Promise.resolve();
  }

  return {
    ready,
    get(key) {
      return mem.has(key) ? (mem.get(key) as string) : null;
    },
    set(key, value) {
      touched.add(key);
      mem.set(key, value);
      swallow(() => backend.write(key, value));
    },
    remove(key) {
      touched.add(key);
      mem.delete(key);
      swallow(() => backend.erase([key]));
    },
    clear(prefix) {
      const keys = [...mem.keys()].filter((k) => k.startsWith(prefix));
      for (const k of keys) {
        touched.add(k);
        mem.delete(k);
      }
      clearedPrefix = prefix;
      const erasePrefix = backend.erasePrefix;
      swallow(() => (erasePrefix ? erasePrefix(prefix) : backend.erase(keys)));
    },
  };
}

/** A memory-only `Kv` (tests; the last-resort fallback when no backend exists). */
export function createMemoryKv(initial: Record<string, string> = {}): Kv {
  return createKv({ loadSync: () => initial, write: () => undefined, erase: () => undefined });
}

/**
 * Resolves when `kv.ready` resolves or after `timeoutMs`, whichever comes first (the root layout
 * holds the splash for at most 300 ms, 07 WP6).
 */
export function readyWithin(kv: Kv, timeoutMs: number = KV_READY_TIMEOUT_MS): Promise<void> {
  return new Promise<void>((resolve) => {
    const t = setTimeout(resolve, timeoutMs);
    kv.ready.then(() => {
      clearTimeout(t);
      resolve();
    });
  });
}

/**
 * The single storage migration hook (02 §6: "one migration function, `migrateKv(from, to)`").
 * v1 is the first version, so there is nothing to migrate yet; a future v2 copies and converts the
 * `caa:v1:*` values it understands, then removes them. Unknown versions are left untouched.
 */
export function migrateKv(kv: Kv, from: string, to: string): void {
  if (from === to) return;
  // TODO(v2): convert `caa:${from}:*` keys into `caa:${to}:*` when a v2 schema exists.
  void kv;
}

/**
 * Reads a JSON value and validates it; an unparsable or invalid value is removed (02 §6 "zod-
 * validated on read; invalid → removed") and `null` is returned.
 */
export function readJson<T>(kv: Kv, key: KvKey, parse: (v: unknown) => T | null): T | null {
  const raw = kv.get(key);
  if (raw === null) return null;
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    kv.remove(key);
    return null;
  }
  const v = parse(json);
  if (v === null) kv.remove(key);
  return v;
}

/** Writes a JSON value. Serialisation errors are impossible for the app's plain data. */
export function writeJson(kv: Kv, key: KvKey, value: unknown): void {
  kv.set(key, JSON.stringify(value));
}
