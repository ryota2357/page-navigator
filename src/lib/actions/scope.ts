import type { Scope } from "../types";

// An action is compatible with a binding's scope when the action will
// always have a meaningful DOM context to run in:
//   - Global actions (DOM-agnostic) work on every page → compatible with
//     any binding scope.
//   - Site-specific actions only make sense on their site → compatible
//     only when the binding lives on that same site scope.
//
// This is the single predicate the action picker uses to filter candidates
// (Step 4 introduced it; Step 5 relaxes "strict equality" to "global wins
// everywhere"). Keep all scope-compat logic flowing through this function.
export function isCompatibleScope(
  actionScope: Scope,
  bindingScope: Scope,
): boolean {
  if (actionScope === "global") return true;
  return actionScope === bindingScope;
}
