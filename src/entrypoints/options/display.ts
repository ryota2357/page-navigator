import type { Action } from "@/lib/action";
import { type ScopeId, scopes } from "@/lib/scopes";

export type SiteBadge = { initials: string; color: string };

// Per-site chrome — the colored monogram used in the sidebar and page header.
// Kept here so `scopes` (runtime config) stays free of presentation concerns.
const SITE_BADGES: Partial<Record<ScopeId, SiteBadge>> = {
  google: { initials: "G", color: "#4285F4" },
  gscholar: { initials: "GS", color: "#4d6bc6" },
};

export function siteBadge(id: ScopeId): SiteBadge | null {
  return SITE_BADGES[id] ?? null;
}

// Action ids carry a "scope." prefix; the visible name strips it and the scope
// surfaces as a separate tag. Global actions render without a tag.
export function actionLabelParts(action: Action): {
  name: string;
  scopeBadge: string | null;
} {
  const prefix = `${action.scope}.`;
  const name = action.id.startsWith(prefix)
    ? action.id.slice(prefix.length)
    : action.id;
  if (action.scope === "global") return { name, scopeBadge: null };
  return { name, scopeBadge: scopes[action.scope].label };
}

// The blurb under a scope's title in the bindings page header.
export function scopeDescription(id: ScopeId): string {
  if (id === "global") {
    return "Active on every page. Site-specific bindings, when set, take priority over Global.";
  }
  return `Active only on ${scopes[id].label} pages. Overrides Global where triggers overlap.`;
}
