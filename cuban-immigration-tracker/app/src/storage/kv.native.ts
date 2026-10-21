/**
 * Native KV (iOS/Android): `@react-native-async-storage/async-storage@2.2.0` (in Expo Go's module
 * set; SDK notes §1), hydrated once into the memory mirror (02-data-model.md §6; ADR ARCH-2).
 * Writes go to memory immediately and are persisted asynchronously; failures are ignored.
 *
 * AsyncStorage is required lazily inside try/catch: its module throws at import time when the
 * native module is missing (a Jest run without its mock, a broken dev build). The app then runs
 * from memory only instead of crashing at startup (01 §4 "KV throws → memory only").
 */
import { KV_PREFIX, createKv, type Kv } from './kvCore';

export * from './kvCore';

type AsyncStorageStatic = typeof import('@react-native-async-storage/async-storage').default;

function asyncStorage(): AsyncStorageStatic | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-async-storage/async-storage') as { default?: AsyncStorageStatic };
    return mod.default ?? (mod as unknown as AsyncStorageStatic);
  } catch {
    return null;
  }
}

/** Creates a native KV (exported for tests; the app uses the `kv` singleton). */
export function createNativeKv(): Kv {
  const AS = asyncStorage();
  if (!AS) return createKv({ loadSync: () => ({}), write: () => undefined, erase: () => undefined });
  return createKv({
    async load() {
      const keys = (await AS.getAllKeys()).filter((k) => k.startsWith(KV_PREFIX));
      if (keys.length === 0) return {};
      const pairs = await AS.multiGet(keys);
      const out: Record<string, string> = {};
      for (const pair of pairs) {
        const k = pair[0];
        const v = pair[1];
        if (typeof v === 'string') out[k] = v;
      }
      return out;
    },
    write(key, value) {
      return AS.setItem(key, value);
    },
    erase(keys) {
      return keys.length ? AS.multiRemove(keys) : undefined;
    },
    async erasePrefix(prefix) {
      const keys = (await AS.getAllKeys()).filter((k) => k.startsWith(prefix));
      if (keys.length) await AS.multiRemove(keys);
    },
  });
}

/** The app's KV singleton. */
export const kv: Kv = createNativeKv();
