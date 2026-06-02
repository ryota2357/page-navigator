import { is, type PredicateType } from "@core/unknownutil";
import type { Action } from "../action";
import { globalActions } from "./global";
import { googleActions } from "./google";
import { gscholarActions } from "./gscholar";

export { activeBindings } from "./active";

export const scopeIds = ["global", "google", "gscholar"] as const;

export const isScopeId = is.LiteralOneOf(scopeIds);

export type ScopeId = PredicateType<typeof isScopeId>;

export type Scope = {
  label: string;
  urlPattern: null | {
    hostname: RegExp;
    pathname: RegExp;
  };
  // NOTE: typed as eager array today. When WXT supports content-script
  // code-splitting (issue wxt-dev/wxt#357, slated for v1.1) this becomes
  // `loadActions: () => Promise<readonly Action[]>` and the two entry points
  // (content.ts, App.svelte) add `await`. Everything downstream of the entry
  // points already takes a resolved `Record<ActionId, Action>` map, so no
  // other file changes.
  actions: readonly Action[];
};

export const scopes: Record<ScopeId, Scope> = {
  global: {
    label: "Global",
    urlPattern: null, // all URLs match
    actions: globalActions,
  },
  google: {
    label: "Google",
    urlPattern: {
      hostname: /^www\.google\.com$/,
      pathname: /^\/search$/,
    },
    actions: googleActions,
  },
  gscholar: {
    label: "Google Scholar",
    urlPattern: {
      hostname: /^scholar\.google\.(com|[a-z]{2}|co\.[a-z]{2}|com\.[a-z]{2})$/,
      pathname: /^\/scholar$/,
    },
    actions: gscholarActions,
  },
};

export function resolveActiveScopes(loc: {
  hostname: string;
  pathname: string;
}): Set<ScopeId> {
  const active = new Set<ScopeId>();
  for (const id of scopeIds) {
    const p = scopes[id].urlPattern;
    if (
      p === null ||
      (p.hostname.test(loc.hostname) && p.pathname.test(loc.pathname))
    ) {
      active.add(id);
    }
  }
  return active;
}
