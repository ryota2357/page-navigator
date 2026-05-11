import type { Binding, Scope, Trigger } from "../types";

// docs/dev/step-02-data-model.md §4.3 / §4.4: cross-scope is shadowing,
// not conflict — site bindings win over global on the same trigger.
//
// Design doc §4.4 sketches "two tries dispatched in priority order". We
// achieve the same observable behaviour with one trie by filtering the
// global trigger list down at compile input: any global trigger whose
// exact sequence is also bound at the active site scope is dropped before
// compilation. The trie's existing same-scope conflict logic still applies
// within each scope.
//
// What this does NOT model: prefix-overlap across scopes (e.g. site `gg`
// vs global `g`). The user explicitly authored both, so both remain — the
// dispatcher's leaf+children timeout disambiguates at runtime. The
// design-doc rule "site wins on the **same** trigger" is satisfied; the
// prefix case is left as observed behaviour.

function triggerKey(t: Trigger): string {
  return t.join("\x00");
}

export function selectBindingsForScope(
  all: ReadonlyArray<Binding>,
  activeSite: Scope | null,
): Binding[] {
  const siteTriggerKeys = new Set<string>();
  const out: Binding[] = [];

  if (activeSite !== null) {
    for (const b of all) {
      if (b.scope !== activeSite || !b.enabled) continue;
      for (const t of b.triggers) siteTriggerKeys.add(triggerKey(t));
      out.push(b);
    }
  }

  for (const b of all) {
    if (b.scope !== "global") continue;
    if (siteTriggerKeys.size === 0) {
      out.push(b);
      continue;
    }
    // Strip site-shadowed triggers; keep the binding if any survives. A
    // binding stripped to zero triggers is dropped so the trie compiler
    // doesn't have to skip empty-trigger rows.
    const surviving = b.triggers.filter(
      (t) => !siteTriggerKeys.has(triggerKey(t)),
    );
    if (surviving.length === b.triggers.length) {
      out.push(b);
    } else if (surviving.length > 0) {
      out.push({ ...b, triggers: surviving });
    }
  }

  return out;
}
