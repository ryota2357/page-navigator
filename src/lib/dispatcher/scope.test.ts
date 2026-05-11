import { describe, expect, it } from "vitest";
import type { Binding } from "../types";
import { selectBindingsForScope } from "./scope";

function bind(
  id: string,
  scope: Binding["scope"],
  triggers: string[][],
  opts: Partial<Binding> = {},
): Binding {
  return {
    id,
    scope,
    triggers,
    actionId: opts.actionId ?? "scroll.down",
    options: opts.options ?? {},
    enabled: opts.enabled ?? true,
  };
}

describe("selectBindingsForScope", () => {
  it("returns only global when no active site", () => {
    const all = [
      bind("g1", "global", [["j"]]),
      bind("s1", "site:google", [["k"]]),
    ];
    const out = selectBindingsForScope(all, null);
    expect(out.map((b) => b.id)).toEqual(["g1"]);
  });

  it("merges site + global when active site matches", () => {
    const all = [
      bind("g1", "global", [["j"]]),
      bind("s1", "site:google", [["k"]]),
    ];
    const out = selectBindingsForScope(all, "site:google");
    expect(out.map((b) => b.id).sort()).toEqual(["g1", "s1"]);
  });

  it("ignores bindings from a non-active site", () => {
    const all = [
      bind("g1", "global", [["j"]]),
      bind("s1", "site:google", [["k"]]),
      bind("s2", "site:other", [["l"]]),
    ];
    const out = selectBindingsForScope(all, "site:google");
    expect(out.map((b) => b.id).sort()).toEqual(["g1", "s1"]);
  });

  it("site exact-trigger shadows global", () => {
    const all = [
      bind("g1", "global", [["j"]], { actionId: "scroll.down" }),
      bind("s1", "site:google", [["j"]], {
        actionId: "google.focusNextResult",
      }),
    ];
    const out = selectBindingsForScope(all, "site:google");
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("s1");
  });

  it("partial shadow trims the global triggers", () => {
    const all = [
      bind("g1", "global", [["j"], ["k"]]),
      bind("s1", "site:google", [["j"]]),
    ];
    const out = selectBindingsForScope(all, "site:google");
    const g = out.find((b) => b.id === "g1");
    expect(g?.triggers).toEqual([["k"]]);
  });

  it("does NOT shadow prefix-overlap (j vs j j)", () => {
    // Site `j j` does not strip global `j`: different exact sequences.
    const all = [
      bind("g1", "global", [["j"]]),
      bind("s1", "site:google", [["j", "j"]]),
    ];
    const out = selectBindingsForScope(all, "site:google");
    expect(out.map((b) => b.id).sort()).toEqual(["g1", "s1"]);
  });

  it("disabled site bindings do not shadow global", () => {
    const all = [
      bind("g1", "global", [["j"]]),
      bind("s1", "site:google", [["j"]], { enabled: false }),
    ];
    const out = selectBindingsForScope(all, "site:google");
    expect(out.map((b) => b.id)).toEqual(["g1"]);
    expect(out[0].triggers).toEqual([["j"]]);
  });
});
