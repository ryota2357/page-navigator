import {
  type StorageItemKey,
  storage,
  type Unwatch,
  type WxtStorageItemOptions,
} from "wxt/utils/storage";

export type ValidateResult<T> = { ok: true } | { ok: false; fallback: T };

export interface StorageItem<T> extends Disposable {
  defaultValue(): T;
  getValue(): Promise<T>;
  setValue(value: T): Promise<void>;
  watch(cb: (newValue: T, oldValue: T) => void): Unwatch;
}

export function defineStorageItem<T>(
  key: StorageItemKey,
  options: {
    fallback: T;
    version?: number;
    migrations?: WxtStorageItemOptions<T>["migrations"];
    validate: (raw: unknown) => ValidateResult<T>;
  },
): StorageItem<T> {
  const wxtItem = storage.defineItem<T>(key, {
    fallback: options.fallback,
    version: options.version,
    migrations: options.migrations,
  });

  let cache: { value: T } | null = null;
  const watchers = new Set<(newValue: T, oldValue: T) => void>();

  function coerce(raw: unknown): { value: T; repaired: boolean } {
    const res = options.validate(raw);
    return res.ok
      ? { value: raw as T, repaired: false }
      : { value: res.fallback, repaired: true };
  }

  const unsubscribe = wxtItem.watch(async (newRaw) => {
    const prev = cache ? cache.value : options.fallback;
    const next = coerce(newRaw);
    cache = { value: next.value };
    for (const cb of watchers) {
      cb(next.value, prev);
    }
    if (next.repaired) {
      await wxtItem.setValue(next.value);
    }
  });

  return {
    defaultValue() {
      return structuredClone(options.fallback);
    },
    async getValue() {
      if (cache) return cache.value;
      const raw = await wxtItem.getValue();
      const next = coerce(raw);
      cache = { value: next.value };
      if (next.repaired) {
        await wxtItem.setValue(next.value);
      }
      return next.value;
    },
    async setValue(value) {
      cache = { value };
      await wxtItem.setValue(value);
    },
    watch(cb) {
      watchers.add(cb);
      return () => {
        watchers.delete(cb);
      };
    },
    [Symbol.dispose]() {
      unsubscribe();
      watchers.clear();
    },
  };
}
