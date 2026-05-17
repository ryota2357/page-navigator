import type { ActionId } from "@/lib/action";
import { SCOPES } from "@/lib/scopes";
import { ACTIONS } from "@/lib/scopes/actions";

// Action ids carry a "scope." prefix; we strip it for the visible name and
// surface the scope as a separate badge. Global actions render without a
// badge — global is the default, so the chrome would be noise.
export function actionDisplay(id: ActionId): {
  name: string;
  badgeLabel: string | null;
} {
  const action = ACTIONS[id];
  const prefix = `${action.scope}.`;
  const name = id.startsWith(prefix) ? id.slice(prefix.length) : id;
  if (action.scope === "global") return { name, badgeLabel: null };
  return { name, badgeLabel: SCOPES[action.scope].label };
}
