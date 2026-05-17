import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { defineStorageItem, type ValidateResult } from "./storage";

beforeEach(() => {
  fakeBrowser.reset();
});

function makeItem(key = "local:test_nonneg") {
  const validate = vi.fn((raw: unknown): ValidateResult<number> => {
    if (typeof raw !== "number") return { ok: false, fallback: 0 };
    if (raw < 0) return { ok: false, fallback: 0 };
    return { ok: true };
  });
  const item = defineStorageItem<number>(key as `local:${string}`, {
    fallback: 0,
    validate,
  });
  return { item, validate };
}

describe("defineStorageItem", () => {
  it("returns the fallback when storage is empty", async () => {
    const { item } = makeItem();
    expect(await item.getValue()).toBe(0);
  });

  it("round-trips setValue → getValue", async () => {
    const { item } = makeItem();
    await item.setValue(42);
    expect(await item.getValue()).toBe(42);
  });

  it("repairs an invalid stored value and writes the repaired one back", async () => {
    await fakeBrowser.storage.local.set({ test_repair: -7 });
    const { item } = makeItem("local:test_repair");
    expect(await item.getValue()).toBe(0);
    const stored = (await fakeBrowser.storage.local.get("test_repair"))
      .test_repair;
    expect(stored).toBe(0);
  });

  it("caches: a second getValue does not re-run validate", async () => {
    const { item, validate } = makeItem("local:test_cache");
    await item.setValue(5);
    validate.mockClear();
    await item.getValue();
    await item.getValue();
    expect(validate).not.toHaveBeenCalled();
  });

  it("notifies watchers with validated new and old values", async () => {
    const { item } = makeItem("local:test_watch");
    await item.setValue(1);
    const cb = vi.fn();
    item.watch(cb);
    await fakeBrowser.storage.local.set({ test_watch: 9 });
    expect(cb).toHaveBeenCalledWith(9, 1);
  });

  it("passes the repaired value, not the raw invalid one, to watchers", async () => {
    const { item } = makeItem("local:test_watch_repair");
    await item.setValue(3);
    const cb = vi.fn();
    item.watch(cb);
    await fakeBrowser.storage.local.set({ test_watch_repair: -100 });
    expect(cb).toHaveBeenCalledWith(0, 3);
  });

  it("unsubscribes when the returned function is called", async () => {
    const { item } = makeItem("local:test_unwatch");
    const cb = vi.fn();
    const unwatch = item.watch(cb);
    unwatch();
    await fakeBrowser.storage.local.set({ test_unwatch: 1 });
    expect(cb).not.toHaveBeenCalled();
  });
});
