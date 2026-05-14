import { describe, expect, it } from "vitest";
import { parseTrigger } from "../keys";
import type { ScopeId } from "../scopes";
import type { Binding } from "../storage/bindings";
import { activeBindings } from "./active";

// `triggers` arrive as plain strings; `parseTrigger` mints the branded
// canonical Trigger the Binding type requires.
function bind(
  id: string,
  scope: ScopeId,
  triggers: string[][],
  opts: Partial<Binding> = {},
): Binding {
  return {
    id,
    scope,
    triggers: triggers.map(parseTrigger),
    actionId: opts.actionId ?? "scrollDown",
    options: opts.options ?? {},
    enabled: opts.enabled ?? true,
  };
}

const ONLY_GLOBAL = new Set<ScopeId>(["global"]);
const GLOBAL_AND_GOOGLE = new Set<ScopeId>(["global", "google"]);

describe("activeBindings", () => {
  it("returns only global when only global is active", () => {
    const all = [bind("g1", "global", [["j"]]), bind("s1", "google", [["k"]])];
    const out = activeBindings(all, ONLY_GLOBAL);
    expect(out.map((b) => b.id)).toEqual(["g1"]);
  });

  it("merges site + global when both are active", () => {
    const all = [bind("g1", "global", [["j"]]), bind("s1", "google", [["k"]])];
    const out = activeBindings(all, GLOBAL_AND_GOOGLE);
    expect(out.map((b) => b.id).sort()).toEqual(["g1", "s1"]);
  });

  it("site exact-trigger shadows global", () => {
    const all = [
      bind("g1", "global", [["j"]], { actionId: "scrollDown" }),
      bind("s1", "google", [["j"]], {
        actionId: "google.focusNextResult",
      }),
    ];
    const out = activeBindings(all, GLOBAL_AND_GOOGLE);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("s1");
  });

  it("partial shadow trims the global triggers", () => {
    const all = [
      bind("g1", "global", [["j"], ["k"]]),
      bind("s1", "google", [["j"]]),
    ];
    const out = activeBindings(all, GLOBAL_AND_GOOGLE);
    const g = out.find((b) => b.id === "g1");
    expect(g?.triggers).toEqual([["k"]]);
  });

  it("does NOT shadow prefix-overlap (j vs j j)", () => {
    const all = [
      bind("g1", "global", [["j"]]),
      bind("s1", "google", [["j", "j"]]),
    ];
    const out = activeBindings(all, GLOBAL_AND_GOOGLE);
    expect(out.map((b) => b.id).sort()).toEqual(["g1", "s1"]);
  });

  it("disabled site bindings do not shadow global and do not appear", () => {
    const all = [
      bind("g1", "global", [["j"]]),
      bind("s1", "google", [["j"]], { enabled: false }),
    ];
    const out = activeBindings(all, GLOBAL_AND_GOOGLE);
    expect(out.map((b) => b.id)).toEqual(["g1"]);
    expect(out[0].triggers).toEqual([["j"]]);
  });

  it("disabled global bindings do not appear", () => {
    const all = [bind("g1", "global", [["j"]], { enabled: false })];
    const out = activeBindings(all, ONLY_GLOBAL);
    expect(out).toEqual([]);
  });
});
