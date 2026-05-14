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
  if (raw.length === 1) return raw;
  return LOWER_TO_CANONICAL.get(raw.toLowerCase()) ?? raw;
}

export function isKnownNonPrintable(name: string): boolean {
  return LOWER_TO_CANONICAL.has(name.toLowerCase());
}

// Space gets a name inside <…> so `<C-Space>` doesn't render as `<C- >`.
export const SPACE_BARE = " ";
export const SPACE_WRAPPED = "Space";
