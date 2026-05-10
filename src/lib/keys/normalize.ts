import type { KeyToken } from "../types";
import { type Mods, serialize } from "./serialize";

// Modifier keys themselves don't produce KeyTokens — they only matter as
// modifiers on the next non-modifier press.
const MODIFIER_KEYS = new Set([
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "AltGraph",
  // Some browsers report these for the OS-key when held alone.
  "OS",
  "Hyper",
  "Super",
]);

// IME guard. Both checks are required: `event.isComposing` is the standard
// API; Safari has historically reported `isComposing: false` for events that
// are actually IME composition. `keyCode === 229` is the only reliable signal
// there — keep the legacy check despite the deprecation.
// See docs/dev/step-02-data-model.md §1.5.
const isComposingEvent = (e: KeyboardEvent) =>
  e.isComposing || e.keyCode === 229;

// Convert a `keydown` KeyboardEvent into a canonical KeyToken.
// Returns null when the event should be ignored (IME, modifier-only press).
//
// Caller is responsible for the `event.isTrusted` (S1) and editable-target
// (S2/S3) gates — those live in the dispatcher entry point so this function
// stays pure / testable.
export function normalize(event: KeyboardEvent): KeyToken | null {
  if (isComposingEvent(event)) return null;
  if (MODIFIER_KEYS.has(event.key)) return null;

  const mods: Mods = {
    alt: event.altKey,
    ctrl: event.ctrlKey,
    meta: event.metaKey,
    shift: event.shiftKey,
  };

  return serialize(mods, event.key);
}
