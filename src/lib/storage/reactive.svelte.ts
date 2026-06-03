import type { StorageItem } from "./storage";

export interface ReactiveStore<T> {
  /** Latest value; the default until `init` resolves, then live. */
  readonly value: T;
  /** False until the first `getValue` resolves. */
  readonly loaded: boolean;
  /** Load the persisted value and start mirroring external writes. */
  init(): Promise<void>;
  /** Write through to storage and update `value` optimistically. */
  set(value: T): Promise<void>;
}

// Mirrors a StorageItem into a rune so components can read it like local state
// and `await store.set(...)` to persist. `set` snapshots away $state proxies,
// which browser.storage's structuredClone rejects with DataCloneError.
export function reactiveStore<T>(item: StorageItem<T>): ReactiveStore<T> {
  let value = $state<T>(item.defaultValue());
  let loaded = $state(false);

  return {
    get value() {
      return value;
    },
    get loaded() {
      return loaded;
    },
    async init() {
      value = await item.getValue();
      loaded = true;
      item.watch((next) => {
        value = next;
      });
    },
    async set(next) {
      // Update `value` before awaiting the write so reads between back-to-back
      // mutations see the new state (the watch later re-delivers the same value).
      const snapshot = $state.snapshot(next) as T;
      value = snapshot;
      await item.setValue(snapshot);
    },
  };
}
