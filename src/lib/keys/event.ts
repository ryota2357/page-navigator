export function isImeComposing(event: KeyboardEvent): boolean {
  // Safari may report isComposing=false during IME; keyCode 229 is the fallback.
  return event.isComposing || event.keyCode === 229;
}

const MODIFIER_KEYS = new Set([
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "AltGraph",
  "OS",
  "Hyper",
  "Super",
]);

export function isModifierKey(event: KeyboardEvent): boolean {
  return MODIFIER_KEYS.has(event.key);
}
