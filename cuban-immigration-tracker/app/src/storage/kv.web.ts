/**
 * Web KV: our own guarded `localStorage` plus the memory mirror (02-data-model.md §6; ADR ARCH-2).
 *
 * Artifact contract (d): `localStorage` can throw (even the property getter) or be empty, so every
 * access is wrapped in try/catch and the app renders from memory without it. AsyncStorage's web
 * module is deliberately not used: its throws cannot be caught by a wrapper (02 §6).
 *
 * Hydration is synchronous, so the first render already uses the stored language and settings.
 */
import { KV_PREFIX, createKv, type Kv } from './kvCore';

export * from './kvCore';

/** The page's `localStorage`, or null when the getter throws or storage is absent. */
function storage(): Storage | null {
  try {
    const s = (globalThis as { localStorage?: Storage }).localStorage;
    return s ?? null;
  } catch {
    return null;
  }
}

/** Creates a web KV (exported for tests; the app uses the `kv` singleton). */
export function createWebKv(): Kv {
  return createKv({
    loadSync() {
      const out: Record<string, string> = {};
      const s = storage();
      if (!s) return out;
      try {
        for (let i = 0; i < s.length; i++) {
          const k = s.key(i);
          if (k === null || !k.startsWith(KV_PREFIX)) continue;
          const v = s.getItem(k);
          if (v !== null) out[k] = v;
        }
      } catch {
        /* partial read is fine */
      }
      return out;
    },
    write(key, value) {
      const s = storage();
      if (!s) return;
      try {
        s.setItem(key, value);
      } catch {
        /* quota exceeded or blocked: memory only */
      }
    },
    erase(keys) {
      const s = storage();
      if (!s) return;
      for (const k of keys) {
        try {
          s.removeItem(k);
        } catch {
          /* ignore */
        }
      }
    },
    erasePrefix(prefix) {
      const s = storage();
      if (!s) return;
      try {
        const keys: string[] = [];
        for (let i = 0; i < s.length; i++) {
          const k = s.key(i);
          if (k !== null && k.startsWith(prefix)) keys.push(k);
        }
        for (const k of keys) s.removeItem(k);
      } catch {
        /* ignore */
      }
    },
  });
}

/** The app's KV singleton. */
export const kv: Kv = createWebKv();
