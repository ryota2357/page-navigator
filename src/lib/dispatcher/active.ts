import type { Trigger } from "../keys/types";
import type { ScopeId } from "../scopes";
import type { Binding } from "../storage/bindings";

// Cross-scope precedence is shadowing, not conflict: non-global scopes win
// over global on the exact same trigger sequence. Prefix overlap (e.g.
// site `gg` vs global `g`) is intentionally left to the dispatcher's
// leaf+children timeout to disambiguate at runtime — both bindings remain.

function triggerKey(t: Trigger): string {
  return t.join("\x00");
}

export function activeBindings(
  all: ReadonlyArray<Binding>,
  activeScopes: ReadonlySet<ScopeId>,
): Binding[] {
  const shadowedByNonGlobal = new Set<string>();
  for (const b of all) {
    if (!b.enabled) continue;
    if (!activeScopes.has(b.scope)) continue;
    if (b.scope === "global") continue;
    for (const t of b.triggers) shadowedByNonGlobal.add(triggerKey(t));
  }

  const out: Binding[] = [];
  for (const b of all) {
    if (!b.enabled) continue;
    if (!activeScopes.has(b.scope)) continue;
    if (b.scope !== "global") {
      out.push(b);
      continue;
    }
    if (shadowedByNonGlobal.size === 0) {
      out.push(b);
      continue;
    }
    const surviving = b.triggers.filter(
      (t) => !shadowedByNonGlobal.has(triggerKey(t)),
    );
    if (surviving.length === b.triggers.length) {
      out.push(b);
    } else if (surviving.length > 0) {
      out.push({ ...b, triggers: surviving });
    }
  }
  return out;
}
