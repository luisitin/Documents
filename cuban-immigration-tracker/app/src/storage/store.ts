/**
 * A minimal external store (React `useSyncExternalStore` contract) used by the settings and cases
 * stores. No provider is needed, so any screen, the notifications module and the data layer can
 * read the same state synchronously.
 */
export interface Store<T> {
  get(): T;
  set(next: T): void;
  subscribe(listener: (next: T, prev: T) => void): () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<(next: T, prev: T) => void>();
  return {
    get: () => state,
    set(next) {
      if (Object.is(next, state)) return;
      const prev = state;
      state = next;
      for (const l of [...listeners]) {
        try {
          l(next, prev);
        } catch {
          /* a failing listener never breaks the store */
        }
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
