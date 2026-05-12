import type { ScopeId } from "../action";
import { globalActions, globalScope } from "./global";
import { googleActions, googleScope } from "./google";

export type { ScopeId };

type ScopeMeta = {
  label: string;
  urlPattern: RegExp | null;
};

export const SCOPES: Record<ScopeId, ScopeMeta> = {
  global: globalScope,
  google: googleScope,
};

export const SCOPE_IDS = Object.keys(SCOPES) as ScopeId[];

export function isScopeId(id: string): id is ScopeId {
  return id in SCOPES;
}

// `null` urlPattern means "always active" — that's how global lives here as
// a peer of site scopes instead of a special case at every call site.
export function resolveActiveScopes(url: string): Set<ScopeId> {
  const active = new Set<ScopeId>();
  for (const id of SCOPE_IDS) {
    const pattern = SCOPES[id].urlPattern;
    if (pattern === null || pattern.test(url)) active.add(id);
  }
  return active;
}

export const ACTIONS = {
  ...globalActions,
  ...googleActions,
};

export type ActionId = keyof typeof ACTIONS;

export const ACTION_IDS = Object.keys(ACTIONS) as ActionId[];

export function isActionId(id: string): id is ActionId {
  return id in ACTIONS;
}

export function isCompatibleScope(
  actionScope: ScopeId,
  bindingScope: ScopeId,
): boolean {
  return actionScope === "global" || actionScope === bindingScope;
}

// Site-scoped action ids carry a "scope." prefix for human readability; we
// strip it for display and surface the scope as a separate badge.
export function actionDisplay(id: ActionId): {
  name: string;
  badgeLabel: string | null;
} {
  const action = ACTIONS[id];
  if (action.scope === "global") return { name: id, badgeLabel: null };
  const prefix = `${action.scope}.`;
  const visible = id.startsWith(prefix) ? id.slice(prefix.length) : id;
  return { name: visible, badgeLabel: SCOPES[action.scope].label };
}
