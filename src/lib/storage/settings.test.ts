import { beforeEach, describe, expect, it } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";
import { loadSettings, settingsItem } from "./settings";

beforeEach(() => {
  fakeBrowser.reset();
});

async function seedRawSettings(value: unknown): Promise<void> {
  await fakeBrowser.storage.local.set({ settings: value });
}

describe("loadSettings", () => {
  it("returns the stored value when already in range", async () => {
    await settingsItem.setValue({ sequenceTimeoutMs: 750 });
    const result = await loadSettings();
    expect(result).toEqual({ sequenceTimeoutMs: 750 });
  });

  it("clamps below 100 to 100 and writes back", async () => {
    await settingsItem.setValue({ sequenceTimeoutMs: -1 });
    const result = await loadSettings();
    expect(result.sequenceTimeoutMs).toBe(100);
    expect((await settingsItem.getValue()).sequenceTimeoutMs).toBe(100);
  });

  it("clamps absurdly large values to 60000 and writes back", async () => {
    await settingsItem.setValue({ sequenceTimeoutMs: 10_000_000 });
    const result = await loadSettings();
    expect(result.sequenceTimeoutMs).toBe(60_000);
  });

  it("repairs NaN-like non-numbers to fallback (1000)", async () => {
    await seedRawSettings({ sequenceTimeoutMs: "fast" });
    const result = await loadSettings();
    expect(result.sequenceTimeoutMs).toBe(1000);
    expect((await settingsItem.getValue()).sequenceTimeoutMs).toBe(1000);
  });
});
