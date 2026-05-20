import type { Action } from "@/lib/action";
import type { KeyToken, Trigger } from "@/lib/keys";
import { type ScopeId, scopes } from "@/lib/scopes";

type SiteBadge = { initials: string; color: string };

// Per-site chrome — the colored initial used in sidebar and scope headers.
// Kept here so `scopes` (runtime config) stays free of presentation concerns.
const SITE_BADGES: Partial<Record<ScopeId, SiteBadge>> = {
  google: { initials: "G", color: "#4285F4" },
  gscholar: { initials: "GS", color: "#4d6bc6" },
};

export function siteBadge(id: ScopeId): SiteBadge | null {
  return SITE_BADGES[id] ?? null;
}

// Action ids carry a "scope." prefix; the visible name strips it and the
// scope surfaces as a separate pill. Global actions render without a pill.
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

// KeyTokens are already vim-style (`<C-Tab>`, bare printables). Wrap bare
// non-printables (Space, Enter, …) so they parse visually like a token.
export function formatKeyToken(token: KeyToken): string {
  if (token.startsWith("<") && token.endsWith(">")) return token;
  if (token.length === 1) return token;
  return `<${token}>`;
}

// Vim-style concatenation: ["g", "g"] -> "gg", ["<C-w>", "s"] -> "<C-w>s".
export function formatTrigger(trigger: Trigger): string {
  return trigger.map(formatKeyToken).join("");
}
