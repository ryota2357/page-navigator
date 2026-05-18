import { is, type PredicateType } from "@core/unknownutil";
import type { Action } from "../action";
import { globalActions } from "./global";
import { googleActions } from "./google";

export { activeBindings } from "./active";

export const scopeIds = ["global", "google"] as const;

export const isScopeId = is.LiteralOneOf(scopeIds);

export type ScopeId = PredicateType<typeof isScopeId>;

export type Scope = {
  label: string;
  urlPattern: RegExp | null;
  // NOTE: typed as eager array today. When WXT supports content-script
  // code-splitting (issue #357, slated for v1.1) this becomes
  // `loadActions: () => Promise<readonly Action[]>` and the two entry points
  // (content.ts, App.svelte) add `await`. Everything downstream of the entry
  // points already takes a resolved `Record<ActionId, Action>` map, so no
  // other file changes.
  actions: readonly Action[];
};

export const scopes: Record<ScopeId, Scope> = {
  global: {
    label: "Global",
    urlPattern: null,
    actions: globalActions,
  },
  google: {
    label: "Google",
    urlPattern: /^https:\/\/www\.google\.com\/search/,
    actions: googleActions,
  },
};

// `null` urlPattern means "always active" — that's how global lives here as
// a peer of site scopes instead of a special case at every call site.
export function resolveActiveScopes(url: string): Set<ScopeId> {
  const active = new Set<ScopeId>();
  for (const id of scopeIds) {
    const pattern = scopes[id].urlPattern;
    if (pattern === null || pattern.test(url)) active.add(id);
  }
  return active;
}
