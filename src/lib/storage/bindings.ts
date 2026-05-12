import { is } from "@core/unknownutil";
import { storage } from "wxt/utils/storage";
import type { FieldMeta } from "../action";
import { parse as parseKey } from "../keys/parse";
import type { Trigger } from "../keys/types";
import { log } from "../log";
import {
  ACTIONS,
  type ActionId,
  isActionId,
  isScopeId,
  type ScopeId,
} from "../scopes";

export type Binding = {
  id: string;
  scope: ScopeId;
  triggers: Trigger[];
  actionId: ActionId;
  options: Record<string, unknown>;
  enabled: boolean;
};

// Empty fallback by design — there is no preset keymap; users build their
// own through the options UI.
export const bindingsItem = storage.defineItem<Binding[]>("local:bindings", {
  fallback: [],
  version: 1,
  migrations: {},
});

const isBindingRow = is.ObjectOf({
  id: is.String,
  scope: is.String,
  triggers: is.ArrayOf(is.ArrayOf(is.String)),
  actionId: is.String,
  options: is.RecordObject,
  enabled: is.Boolean,
});

// Numeric option fields outside the meta's [min, max] are clamped in place.
// Defends against poisoned storage and hand-edited imports that bypass UI
// validation. Returns true if any value was actually changed (drives the
// write-back decision).
export function clampOptions(
  opts: Record<string, unknown>,
  meta: Record<string, FieldMeta>,
): boolean {
  let changed = false;
  for (const k of Object.keys(meta)) {
    const field = meta[k];
    if (field.kind !== "number") continue;
    const v = opts[k];
    if (typeof v !== "number" || !Number.isFinite(v)) continue;
    const lo = field.min ?? Number.NEGATIVE_INFINITY;
    const hi = field.max ?? Number.POSITIVE_INFINITY;
    const next = Math.min(Math.max(v, lo), hi);
    if (next !== v) {
      opts[k] = next;
      changed = true;
    }
  }
  return changed;
}

function triggersEqual(a: string[][], b: string[][]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].length !== b[i].length) return false;
    for (let j = 0; j < a[i].length; j++) {
      if (a[i][j] !== b[i][j]) return false;
    }
  }
  return true;
}

// `bindingId` / `actionId` are populated once the row's structural shape has
// been validated, and travel with the drop reason so loadBindings() can log
// them without re-reaching into the raw `unknown` row.
type RepairResult =
  | { kind: "ok"; binding: Binding; changed: boolean }
  | {
      kind: "drop";
      reason: string;
      bindingId?: string;
      actionId?: string;
    };

function repairBinding(row: unknown): RepairResult {
  if (!isBindingRow(row)) {
    return { kind: "drop", reason: "row failed structural shape" };
  }
  if (!isScopeId(row.scope)) {
    return {
      kind: "drop",
      reason: `unknown scope: ${row.scope}`,
      bindingId: row.id,
      actionId: row.actionId,
    };
  }
  if (!isActionId(row.actionId)) {
    return {
      kind: "drop",
      reason: `unknown actionId: ${row.actionId}`,
      bindingId: row.id,
      actionId: row.actionId,
    };
  }

  const action = ACTIONS[row.actionId];
  let changed = false;

  let canonTriggers: string[][];
  try {
    canonTriggers = row.triggers.map((seq) => seq.map(parseKey));
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      kind: "drop",
      reason: `unparseable trigger: ${message}`,
      bindingId: row.id,
      actionId: row.actionId,
    };
  }
  if (!triggersEqual(row.triggers, canonTriggers)) changed = true;

  // Project rowOpts onto the keys the action currently declares: drops
  // fields removed by extension updates, and fills missing fields from
  // defaults so the saved row stays self-describing after a schema bump.
  const rowOpts = row.options;
  const allowedKeys = Object.keys(action.defaults);
  const projected: Record<string, unknown> = {};
  for (const k of allowedKeys) {
    projected[k] = k in rowOpts ? rowOpts[k] : action.defaults[k];
  }

  const clampChanged = clampOptions(projected, action.meta);

  if (!action.validate(projected)) {
    return {
      kind: "drop",
      reason: "options failed predicate",
      bindingId: row.id,
      actionId: row.actionId,
    };
  }

  const beforeKeys = Object.keys(rowOpts);
  const sameShape =
    beforeKeys.length === allowedKeys.length &&
    beforeKeys.every((k) => k in projected);
  const sameValues =
    sameShape && allowedKeys.every((k) => Object.is(rowOpts[k], projected[k]));
  if (!sameValues || clampChanged) changed = true;

  return {
    kind: "ok",
    binding: {
      id: row.id,
      scope: row.scope,
      triggers: canonTriggers,
      actionId: row.actionId,
      options: projected,
      enabled: row.enabled,
    },
    changed,
  };
}

// Load bindings, repairing/dropping as needed and writing back the canonical
// form when anything changed. The same code path is intentionally also the
// future settings-import code path.
export async function loadBindings(): Promise<Binding[]> {
  const stored = await bindingsItem.getValue();
  const repaired: Binding[] = [];
  let didRepair = false;

  for (const row of stored) {
    const result = repairBinding(row);
    if (result.kind === "drop") {
      log.warn("dropping binding", {
        bindingId: result.bindingId,
        actionId: result.actionId,
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
