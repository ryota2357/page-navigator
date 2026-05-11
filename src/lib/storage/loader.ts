import { is } from "@core/unknownutil";
import { getAction } from "../actions/registry";
import { parse as parseKey } from "../keys/parse";
import { log } from "../log";
import { isKnownServiceId } from "../services/catalog";
import type { Binding, FieldMeta, OptionsMeta, Settings } from "../types";
import {
  bindingsItem,
  SEQUENCE_TIMEOUT_MAX_MS,
  SEQUENCE_TIMEOUT_MIN_MS,
  settingsItem,
} from "./items";

// Structural predicate for the row-level shape. Options are validated per-action
// downstream, so accept any record here.
const isBindingRow = is.ObjectOf({
  id: is.String,
  scope: is.String,
  triggers: is.ArrayOf(is.ArrayOf(is.String)),
  actionId: is.String,
  options: is.RecordObject,
  enabled: is.Boolean,
});

// A scope is valid iff it's "global" or "site:<known-id>". Unknown site
// scopes (e.g. left over after a service was removed from the catalog)
// drop their bindings on load — the action wouldn't run anyway.
function isValidScope(s: string): boolean {
  if (s === "global") return true;
  if (s.startsWith("site:")) return isKnownServiceId(s.slice("site:".length));
  return false;
}

// Clamp numeric options against meta. Mutates `opts`. Returns true if any
// value was actually changed (used for write-back detection).
export function clampOptions<O extends Record<string, unknown>>(
  opts: O,
  meta: OptionsMeta<O>,
): boolean {
  let changed = false;
  for (const k of Object.keys(meta) as (keyof O)[]) {
    const field = meta[k] as FieldMeta;
    if (field.kind !== "number") continue;
    const v = opts[k];
    if (typeof v !== "number" || !Number.isFinite(v)) continue;
    const lo = field.min ?? Number.NEGATIVE_INFINITY;
    const hi = field.max ?? Number.POSITIVE_INFINITY;
    const next = Math.min(Math.max(v, lo), hi);
    if (next !== v) {
      (opts as Record<string, unknown>)[k as string] = next;
      changed = true;
    }
  }
  return changed;
}

type RepairResult =
  | { kind: "ok"; binding: Binding; changed: boolean }
  | { kind: "drop"; reason: string };

function repairBinding(row: unknown): RepairResult {
  if (!isBindingRow(row)) {
    return { kind: "drop", reason: "row failed structural shape" };
  }
  if (!isValidScope(row.scope)) {
    return { kind: "drop", reason: `invalid scope: ${row.scope}` };
  }

  const action = getAction(row.actionId);
  if (!action) {
    return { kind: "drop", reason: `unknown actionId: ${row.actionId}` };
  }

  let changed = false;

  // 1) Canonicalize trigger key tokens. Lenient input becomes canonical;
  //    unparseable tokens drop the whole binding.
  let canonTriggers: string[][];
  try {
    canonTriggers = row.triggers.map((seq) => seq.map(parseKey));
  } catch (e) {
    return {
      kind: "drop",
      reason: `unparseable trigger: ${(e as Error).message}`,
    };
  }
  if (!triggersEqual(row.triggers, canonTriggers)) changed = true;

  // 2) Project options onto current allowed keys (drops removed fields, fills
  //    missing fields from defaults), per docs/dev/step-02-data-model.md §5.3.
  const defaults = action.options.defaults as Record<string, unknown>;
  const rowOpts = row.options as Record<string, unknown>;
  const allowedKeys = Object.keys(defaults);
  const projected: Record<string, unknown> = {};
  for (const k of allowedKeys) {
    projected[k] = k in rowOpts ? rowOpts[k] : defaults[k];
  }

  // 3) Range-clamp numeric fields against meta (S4 hardening).
  const clampChanged = clampOptions(
    projected,
    action.options.meta as OptionsMeta<Record<string, unknown>>,
  );

  // 4) Validate shape with the action's predicate.
  if (!action.options.pred(projected)) {
    return { kind: "drop", reason: "options failed predicate" };
  }

  // 5) Detect repair: keys added/removed, values changed by clamp,
  //    or any extras stripped (rowOpts had keys not in allowedKeys).
  const beforeKeys = Object.keys(rowOpts);
  const sameShape =
    beforeKeys.length === allowedKeys.length &&
    beforeKeys.every((k) => k in projected);
  const sameValues =
    sameShape && allowedKeys.every((k) => Object.is(rowOpts[k], projected[k]));
  if (!sameValues || clampChanged) changed = true;

  const binding: Binding = {
    id: row.id,
    scope: row.scope as Binding["scope"],
    triggers: canonTriggers,
    actionId: row.actionId,
    options: projected,
    enabled: row.enabled,
  };
  return { kind: "ok", binding, changed };
}

function triggersEqual(a: string[][], b: string[][]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i];
    const bi = b[i];
    if (ai.length !== bi.length) return false;
    for (let j = 0; j < ai.length; j++) {
      if (ai[j] !== bi[j]) return false;
    }
  }
  return true;
}

// Load bindings, repairing/dropping as needed and writing back the canonical
// form when anything changed. The same code path is intentionally also the
// import code path (docs/dev/step-02-data-model.md §10 S4).
export async function loadBindings(): Promise<Binding[]> {
  const stored = await bindingsItem.getValue();
  const repaired: Binding[] = [];
  let didRepair = false;

  for (const row of stored) {
    const result = repairBinding(row);
    if (result.kind === "drop") {
      log.warn("dropping binding", {
        bindingId: (row as { id?: unknown })?.id,
        actionId: (row as { actionId?: unknown })?.actionId,
        reason: result.reason,
      });
      didRepair = true;
      continue;
    }
    if (result.changed) didRepair = true;
    repaired.push(result.binding);
  }

  if (didRepair) await bindingsItem.setValue(repaired);
  return repaired;
}

// Settings loader: clamp sequenceTimeoutMs to [100, 60000] and write back if
// the stored value was out of range or the wrong type (S4 hardening).
export async function loadSettings(): Promise<Settings> {
  const stored = await settingsItem.getValue();
  const fallback = 1000;
  let timeout = stored.sequenceTimeoutMs;
  let changed = false;
  if (typeof timeout !== "number" || Number.isNaN(timeout)) {
    timeout = fallback;
    changed = true;
  } else if (timeout < SEQUENCE_TIMEOUT_MIN_MS) {
    // Negative-Infinity, negatives, sub-MIN values all clamp up to MIN.
    timeout = SEQUENCE_TIMEOUT_MIN_MS;
    changed = true;
  } else if (timeout > SEQUENCE_TIMEOUT_MAX_MS) {
    // Positive-Infinity and absurdly large values clamp down to MAX.
    timeout = SEQUENCE_TIMEOUT_MAX_MS;
    changed = true;
  }

  const repaired: Settings = { sequenceTimeoutMs: timeout };
  if (changed) await settingsItem.setValue(repaired);
  return repaired;
}
