import type { Action, ActionId } from "../action";
import { globalActions } from "./global";
import { googleActions } from "./google";

// Single flat registry: every action the extension knows about. The per-site
// folders (scopes/global, scopes/google) own the definitions; this is the
// only place they're aggregated. It lives under scopes/ rather than next to
// action.ts because aggregating it there would close an import cycle
// (action.ts ← scopes/* ← here).
export const actions = [...globalActions, ...googleActions] as const;

export const ACTION_IDS: readonly ActionId[] = actions.map((a) => a.id);

// Keyed by each action's declared `id` (see `defineAction`) rather than by an
// export's variable name, so the id has a single source of truth. The Record
// type is intentionally optimistic: lookups for unknown ids return undefined
// at runtime, and callers handling stored bindings should treat the result
// as possibly missing.
export const ACTIONS: Record<ActionId, Action> = Object.fromEntries(
  actions.map((a) => [a.id, a]),
) as Record<ActionId, Action>;
