import { is } from "@core/unknownutil";
import type { Action } from "../action";
import { globalActions } from "./global";
import { googleActions } from "./google";

// Single flat registry: every action the extension knows about. The per-site
// folders (scopes/global, scopes/google) own the definitions; this is the
// only place they're aggregated. It lives under scopes/ rather than next to
// action.ts because aggregating it there would close an import cycle
// (action.ts ← scopes/* ← here).
export const actions = [...globalActions, ...googleActions] as const;

// The id of a registered action. NOT `Action["id"]` (which is plain `string`)
// — this is the closed union of ids actually present in the registry above.
export type ValidActionId = (typeof actions)[number]["id"];

export const ACTION_IDS: readonly ValidActionId[] = actions.map((a) => a.id);

// Runtime gate for that union — true iff the id is one the registry knows.
export const isValidActionId = is.LiteralOneOf(ACTION_IDS);

// Keyed by each action's declared `id` (see `defineAction`) rather than by an
// export's variable name, so the id has a single source of truth.
export const ACTIONS = Object.fromEntries(
  actions.map((a) => [a.id, a]),
) as Record<ValidActionId, Action>;
