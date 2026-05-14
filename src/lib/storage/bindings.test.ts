import { beforeEach, describe, expect, it } from "vitest";
import { parseTrigger } from "../keys";
import { type Binding, bindingsItem, loadBindings } from "./bindings";

beforeEach(() => {
  fakeBrowser.reset();
});

async function seedRawBindings(rows: ReadonlyArray<unknown>): Promise<void> {
  await fakeBrowser.storage.local.set({ bindings: rows });
}

describe("loadBindings", () => {
  it("returns [] for empty storage", async () => {
    const result = await loadBindings();
    expect(result).toEqual([]);
  });

  it("passes a fully canonical binding through unchanged", async () => {
    const seed: Binding = {
      id: "b1",
      scope: "global",
      triggers: [parseTrigger(["j"])],
      actionId: "scrollDown",
      options: { amount: 100, smooth: false },
      enabled: true,
    };
    await bindingsItem.setValue([seed]);
    const result = await loadBindings();
    expect(result).toEqual([seed]);
  });

  it("drops a binding with unknown actionId", async () => {
    await seedRawBindings([
      {
        id: "b1",
        scope: "global",
        triggers: [["j"]],
        actionId: "no.such.action",
        options: {},
        enabled: true,
      },
    ]);
    const result = await loadBindings();
    expect(result).toEqual([]);
  });

  // loadBindings validates on read but never writes back: the canonical form
  // only exists on the returned in-memory copy.
  it("canonicalizes lenient triggers in memory without writing back", async () => {
    await seedRawBindings([
      {
        id: "b1",
        scope: "global",
        triggers: [["<c-j>"]],
        actionId: "scrollDown",
        options: { amount: 100, smooth: false },
        enabled: true,
      },
    ]);
    const result = await loadBindings();
    expect(result[0].triggers).toEqual([["<C-j>"]]);
    const stored = await bindingsItem.getValue();
    expect(stored[0].triggers).toEqual([["<c-j>"]]);
  });

  it("fills missing option fields from defaults", async () => {
    await seedRawBindings([
      {
        id: "b1",
        scope: "global",
        triggers: [["j"]],
        actionId: "scrollDown",
        options: { amount: 50 },
        enabled: true,
      },
    ]);
    const result = await loadBindings();
    expect(result[0].options).toEqual({ amount: 50, smooth: false });
  });

  it("strips extra option fields not declared by the action", async () => {
    await seedRawBindings([
      {
        id: "b1",
        scope: "global",
        triggers: [["j"]],
        actionId: "scrollDown",
        options: { amount: 100, smooth: false, mystery: 42 },
        enabled: true,
      },
    ]);
    const result = await loadBindings();
    expect(result[0].options).toEqual({ amount: 100, smooth: false });
  });

  it("drops a binding with an out-of-range numeric option", async () => {
    await seedRawBindings([
      {
        id: "b1",
        scope: "global",
        triggers: [["j"]],
        actionId: "scrollDown",
        // `amount` min is 1 — the action's schema rejects it outright.
        options: { amount: -999, smooth: false },
        enabled: true,
      },
    ]);
    const result = await loadBindings();
    expect(result).toEqual([]);
  });

  it("drops a binding whose options fail the meta schema", async () => {
    await seedRawBindings([
      {
        id: "b1",
        scope: "global",
        triggers: [["j"]],
        actionId: "scrollDown",
        options: { amount: "not a number", smooth: false },
        enabled: true,
      },
    ]);
    const result = await loadBindings();
    expect(result).toEqual([]);
  });

  it("accepts known site scopes (google)", async () => {
    const seed: Binding = {
      id: "b1",
      scope: "google",
      triggers: [parseTrigger(["j"])],
      actionId: "google.focusNextResult",
      options: { wrap: false },
      enabled: true,
    };
    await bindingsItem.setValue([seed]);
    const result = await loadBindings();
    expect(result).toEqual([seed]);
  });

  it("drops a binding with an unknown scope", async () => {
    await seedRawBindings([
      {
        id: "b1",
        scope: "unknown",
        triggers: [["j"]],
        actionId: "scrollDown",
        options: { amount: 100, smooth: false },
        enabled: true,
      },
    ]);
    const result = await loadBindings();
    expect(result).toEqual([]);
  });

  it("drops a binding with malformed structure", async () => {
    await seedRawBindings([
      {
        id: "b1",
        scope: "global",
        actionId: "scrollDown",
        options: {},
        enabled: true,
      },
    ]);
    const result = await loadBindings();
    expect(result).toEqual([]);
  });
});
