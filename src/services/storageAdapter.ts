/**
 * Safe key-value storage: wraps localStorage/sessionStorage, catches every
 * exception (disabled storage, quota, privacy modes) and degrades to memory
 * for the rest of the page session. Never throws.
 */

export type KeyValueStore = {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  /** False once the underlying storage has failed and memory is in use. */
  readonly persistent: boolean;
};

export function createStore(getBacking: () => Storage | null | undefined): KeyValueStore {
  const memory = new Map<string, string>();
  let backing: Storage | null = null;
  try {
    backing = getBacking() ?? null;
    if (backing !== null) {
      const probe = '__outside_probe__';
      backing.setItem(probe, '1');
      backing.removeItem(probe);
    }
  } catch {
    backing = null;
  }

  const fallBack = (): void => {
    backing = null;
  };

  return {
    get(key) {
      if (backing === null) return memory.get(key) ?? null;
      try {
        return backing.getItem(key);
      } catch {
        fallBack();
        return memory.get(key) ?? null;
      }
    },
    set(key, value) {
      memory.set(key, value);
      if (backing === null) return;
      try {
        backing.setItem(key, value);
      } catch {
        fallBack();
      }
    },
    remove(key) {
      memory.delete(key);
      if (backing === null) return;
      try {
        backing.removeItem(key);
      } catch {
        fallBack();
      }
    },
    get persistent() {
      return backing !== null;
    },
  };
}

/** Browser stores, resolved lazily and safely (accessing them can itself throw). */
export function browserLocalStore(): KeyValueStore {
  return createStore(() => (typeof window === 'undefined' ? null : window.localStorage));
}

export function browserSessionStore(): KeyValueStore {
  return createStore(() => (typeof window === 'undefined' ? null : window.sessionStorage));
}
