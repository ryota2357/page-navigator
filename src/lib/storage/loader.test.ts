import { beforeEach, describe, expect, it } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";
import type { Binding } from "../types";
import { bindingsItem, settingsItem } from "./items";
import { clampOptions, loadBindings, loadSettings } from "./loader";

beforeEach(() => {
  fakeBrowser.reset();
});

describe("clampOptions", () => {
  it("clamps below min, above max; leaves in-range values alone", () => {
    const opts: Record<string, unknown> = { amount: -5, fraction: 5 };
    const meta = {
      amount: { kind: "number" as const, label: "", min: 1, max: 100 },
      fraction: { kind: "number" as const, label: "", min: 0.1, max: 1 },
    };
    const changed = clampOptions(opts, meta);
    expect(changed).toBe(true);
    expect(opts.amount).toBe(1);
    expect(opts.fraction).toBe(1);
  });

  it("returns false when nothing changes", () => {
    const opts: Record<string, unknown> = { amount: 50 };
    const meta = {
      amount: { kind: "number" as const, label: "", min: 1, max: 100 },
    };
    expect(clampOptions(opts, meta)).toBe(false);
    expect(opts.amount).toBe(50);
  });

  it("leaves non-number / non-finite values for the predicate to reject", () => {
    const opts: Record<string, unknown> = { amount: "huge", n: Number.NaN };
    const meta = {
      amount: { kind: "number" as const, label: "", min: 1, max: 100 },
      n: { kind: "number" as const, label: "", min: 0, max: 1 },
    };
    expect(clampOptions(opts, meta)).toBe(false);
  });
});

describe("loadBindings", () => {
  it("returns [] for empty storage", async () => {
    const result = await loadBindings();
    expect(result).toEqual([]);
  });

  it("passes a fully canonical binding through unchanged", async () => {
    const seed: Binding = {
      id: "b1",
      scope: "global",
      triggers: [["j"]],
      actionId: "scrollDown",
      options: { amount: 100, smooth: false },
      enabled: true,
    };
    await bindingsItem.setValue([seed]);
    const result = await loadBindings();
    expect(result).toEqual([seed]);
  });

  it("drops a binding with unknown actionId", async () => {
    await bindingsItem.setValue([
      {
        id: "b1",
        scope: "global",
        triggers: [["j"]],
        actionId: "no.such.action",
        options: {},
        enabled: true,
      },
    ] as Binding[]);
    const result = await loadBindings();
    expect(result).toEqual([]);
    expect(await bindingsItem.getValue()).toEqual([]);
  });

  it("canonicalizes lenient triggers and writes back", async () => {
    await bindingsItem.setValue([
      {
        id: "b1",
        scope: "global",
        triggers: [["<c-j>"]],
        actionId: "scrollDown",
        options: { amount: 100, smooth: false },
        enabled: true,
      },
    ] as Binding[]);
    const result = await loadBindings();
    expect(result[0].triggers).toEqual([["<C-j>"]]);
    const written = await bindingsItem.getValue();
    expect(written[0].triggers).toEqual([["<C-j>"]]);
  });

  it("fills missing option fields from defaults", async () => {
    await bindingsItem.setValue([
      {
        id: "b1",
        scope: "global",
        triggers: [["j"]],
        actionId: "scrollDown",
        options: { amount: 50 },
        enabled: true,
      },
    ] as unknown as Binding[]);
    const result = await loadBindings();
    expect(result[0].options).toEqual({ amount: 50, smooth: false });
  });

  it("strips extra option fields not declared by the action", async () => {
    await bindingsItem.setValue([
      {
        id: "b1",
        scope: "global",
        triggers: [["j"]],
        actionId: "scrollDown",
        options: { amount: 100, smooth: false, mystery: 42 },
        enabled: true,
      },
    ] as unknown as Binding[]);
    const result = await loadBindings();
    expect(result[0].options).toEqual({ amount: 100, smooth: false });
  });

  it("clamps out-of-range numeric options and writes back", async () => {
    await bindingsItem.setValue([
      {
        id: "b1",
        scope: "global",
        triggers: [["j"]],
        actionId: "scrollDown",
        options: { amount: -999, smooth: false },
        enabled: true,
      },
    ] as Binding[]);
    const result = await loadBindings();
    expect(result[0].options.amount).toBe(1);
    expect((await bindingsItem.getValue())[0].options.amount).toBe(1);
  });

  it("drops a binding whose options fail the predicate", async () => {
    await bindingsItem.setValue([
      {
        id: "b1",
        scope: "global",
        triggers: [["j"]],
        actionId: "scrollDown",
        options: { amount: "not a number", smooth: false },
        enabled: true,
      },
    ] as unknown as Binding[]);
    const result = await loadBindings();
    expect(result).toEqual([]);
  });

  it("accepts known site scopes (site:google)", async () => {
    const seed: Binding = {
      id: "b1",
      scope: "site:google",
      triggers: [["j"]],
      actionId: "google.focusNextResult",
      options: { wrap: false },
      enabled: true,
    };
    await bindingsItem.setValue([seed]);
    const result = await loadBindings();
    expect(result).toEqual([seed]);
  });

  it("drops a binding with an unknown site:* scope", async () => {
    await bindingsItem.setValue([
      {
        id: "b1",
        scope: "site:unknown",
        triggers: [["j"]],
        actionId: "scrollDown",
        options: { amount: 100, smooth: false },
        enabled: true,
      },
    ] as Binding[]);
    const result = await loadBindings();
    expect(result).toEqual([]);
    expect(await bindingsItem.getValue()).toEqual([]);
  });

  it("drops a binding with malformed structure", async () => {
    await bindingsItem.setValue([
      // missing triggers
      {
        id: "b1",
        scope: "global",
        actionId: "scrollDown",
        options: {},
        enabled: true,
      },
    ] as unknown as Binding[]);
    const result = await loadBindings();
    expect(result).toEqual([]);
  });
});

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

  it("repairs NaN to fallback (1000)", async () => {
    // JSON-serialised storage cannot round-trip Infinity (becomes null) or
    // NaN — but a non-numeric type slipping through (e.g. via direct
    // chrome.storage.local.set in devtools) must still be caught.
    await settingsItem.setValue({
      sequenceTimeoutMs: "fast" as unknown as number,
    });
    const result = await loadSettings();
    expect(result.sequenceTimeoutMs).toBe(1000);
    expect((await settingsItem.getValue()).sequenceTimeoutMs).toBe(1000);
  });
});
