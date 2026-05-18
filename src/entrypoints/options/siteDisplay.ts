import type { ScopeId } from "@/lib/scopes";

// Per-site display chrome — colored initial used in the sidebar and headers.
// Scopes not listed render with a generic globe; this keeps `scopes` (the
// runtime config) free of presentation concerns.
type SiteDisplay = {
  initials: string;
  color: string;
};

const DISPLAY: Partial<Record<ScopeId, SiteDisplay>> = {
  google: { initials: "G", color: "#4285F4" },
};

export function siteDisplay(id: ScopeId): SiteDisplay | null {
  return DISPLAY[id] ?? null;
}
