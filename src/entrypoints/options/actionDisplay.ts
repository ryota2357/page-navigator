import type { Action } from "@/lib/action";
import { scopes } from "@/lib/scopes";

// Action ids carry a "scope." prefix; we strip it for the visible name and
// surface the scope as a separate badge. Global actions render without a
// badge — global is the default, so the chrome would be noise.
export function actionDisplay(action: Action): {
  name: string;
  badgeLabel: string | null;
} {
  const prefix = `${action.scope}.`;
  const name = action.id.startsWith(prefix)
    ? action.id.slice(prefix.length)
    : action.id;
  if (action.scope === "global") return { name, badgeLabel: null };
  return { name, badgeLabel: scopes[action.scope].label };
}
