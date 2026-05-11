import type { Scope, Service } from "../types";
import { google } from "./google";

// Static service catalog (docs/dev/step-02-data-model.md §5.4). Adding a
// service is a code change, not user data — matches the PLAN.md decision
// that services are extension-defined, not user-defined.
export const SERVICES = [google] as const;

export type ServiceId = (typeof SERVICES)[number]["id"];

export function findService(id: string): Service | null {
  return SERVICES.find((s) => s.id === id) ?? null;
}

export function isKnownServiceId(id: string): boolean {
  return SERVICES.some((s) => s.id === id);
}

// Per docs/dev/step-02-data-model.md §4.4. Global is always active; a
// matching site adds its scope on top. Callers downstream resolve
// precedence (site shadows global) when building the dispatcher input.
export function resolveActiveScopes(url: string): Scope[] {
  const matched = SERVICES.find((s) => s.urlPattern.test(url));
  return matched ? ["global", `site:${matched.id}`] : ["global"];
}

export function resolveActiveService(url: string): Service | null {
  return SERVICES.find((s) => s.urlPattern.test(url)) ?? null;
}
