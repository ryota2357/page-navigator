import { is, type PredicateType } from "@core/unknownutil";
import { globalScope } from "./global";
import { googleScope } from "./google";

export const SCOPE_IDS = ["global", "google"] as const;

export const isScopeId = is.LiteralOneOf(SCOPE_IDS);

export type ScopeId = PredicateType<typeof isScopeId>;

type ScopeMeta = {
  label: string;
  urlPattern: RegExp | null;
};

export const SCOPES: Record<ScopeId, ScopeMeta> = {
  global: globalScope,
  google: googleScope,
};

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
