import { SCOPES } from "@/lib/scopes";
import { ACTIONS, type ValidActionId } from "@/lib/scopes/actions";

// Site-scoped action ids carry a "scope." prefix for human readability; we
// strip it for display and surface the scope as a separate badge. Purely a
// presentation concern, so it lives with the options UI rather than the
// action registry.
export function actionDisplay(id: ValidActionId): {
  name: string;
  badgeLabel: string | null;
} {
  const action = ACTIONS[id];
  if (action.scope === "global") return { name: id, badgeLabel: null };
  const prefix = `${action.scope}.`;
  const visible = id.startsWith(prefix) ? id.slice(prefix.length) : id;
  return { name: visible, badgeLabel: SCOPES[action.scope].label };
}
