import type { Action } from "../types";
import { scrollActions } from "./global/scroll";

// biome-ignore lint/suspicious/noExplicitAny: registry holds heterogeneous Action<O> entries
type AnyAction = Action<any>;

const ALL_ACTIONS: ReadonlyArray<AnyAction> = [...scrollActions];

const REGISTRY: ReadonlyMap<string, AnyAction> = new Map(
  ALL_ACTIONS.map((a) => [a.id, a]),
);

export function getAction(id: string): AnyAction | undefined {
  return REGISTRY.get(id);
}

export function listActions(): ReadonlyArray<AnyAction> {
  return ALL_ACTIONS;
}
