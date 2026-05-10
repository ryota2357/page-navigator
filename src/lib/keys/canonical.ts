// Canonical name table for non-printable DOM `event.key` values.
// All forms compare lowercased; the value is the canonical UpperCamelCase
// emitted by the serializer / parser.
//
// Spec ref: docs/dev/step-02-data-model.md §1.1.

const NAMES: ReadonlyArray<string> = [
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "Tab",
  "Enter",
  "Escape",
  "Space",
  "Backspace",
  "Delete",
  "Insert",
  "Home",
  "End",
  "PageDown",
  "PageUp",
  "ContextMenu",
  "CapsLock",
  "NumLock",
  "ScrollLock",
  ...Array.from({ length: 24 }, (_, i) => `F${i + 1}`),
];

const LOWER_TO_CANONICAL = new Map<string, string>(
  NAMES.map((name) => [name.toLowerCase(), name]),
);

export function canonicalizeKeyName(raw: string): string {
  // Single-char printables (case significant on bare; case-flattened only
  // when wrapped — handled by the caller).
  if (raw.length === 1) return raw;

  // Empty string is invalid; let it fall through to the lookup which won't
  // find it, then hit the fallback. Defensive only.
  return LOWER_TO_CANONICAL.get(raw.toLowerCase()) ?? raw;
}

// Whether the given multi-char name is a registered canonical key. Used by
// the parser to reject obviously malformed names (e.g. "C-") rather than
// silently passing them through.
export function isKnownNonPrintable(name: string): boolean {
  return LOWER_TO_CANONICAL.has(name.toLowerCase());
}

// Bare-form rendering for the literal space key. Inside <…> we always use
// "Space" instead of a literal space character (so `<C-Space>`, not `<C- >`).
export const SPACE_BARE = " ";
export const SPACE_WRAPPED = "Space";
