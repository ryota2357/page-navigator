import { canonicalizeKeyName, SPACE_BARE, SPACE_WRAPPED } from "./canonical";
import type { KeyToken } from "./token";

// Shaped so KeyboardEvent is structurally assignable.
type KeyInput = {
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
  readonly key: string;
};

const MOD_ORDER: ReadonlyArray<
  ["altKey" | "ctrlKey" | "metaKey" | "shiftKey", string]
> = [
  ["altKey", "A"],
  ["ctrlKey", "C"],
  ["metaKey", "M"],
  ["shiftKey", "S"],
];

// length-1 from event.key is always a printable char; longer is a named key.
function isPrintable(key: string): boolean {
  return key.length === 1;
}

// Strict ASCII: only ASCII letters have a case-folded form under Shift.
function isLetter(ch: string): boolean {
  return /^[A-Za-z]$/.test(ch);
}

// Sole minter of `KeyToken` — the `as KeyToken` casts are the trust boundary.
// See the `KeyToken` doc for the canonical form spec.
export function encodeKeyToken(input: KeyInput): KeyToken {
  const key = canonicalizeKeyName(input.key);
  const printable = isPrintable(key);
  const otherModHeld = input.altKey || input.ctrlKey || input.metaKey;
  const wrap = !printable || otherModHeld;

  if (!wrap) {
    // Browser delivers Shift+j as key='J', but `parse` passes shiftKey=true
    // with lowercase — fold both into the same casing.
    if (input.shiftKey && isLetter(key)) return key.toUpperCase() as KeyToken;
    return key as KeyToken;
  }

  let inner = "";
  for (const [m, letter] of MOD_ORDER) {
    if (m === "shiftKey") {
      const keepShift = !printable || otherModHeld;
      if (input.shiftKey && keepShift) inner += `${letter}-`;
    } else if (input[m]) {
      inner += `${letter}-`;
    }
  }

  let innerKey = key;
  if (printable) {
    if (key === SPACE_BARE) {
      innerKey = SPACE_WRAPPED;
    } else if (isLetter(key)) {
      innerKey = key.toLowerCase();
    }
  }

  return `<${inner}${innerKey}>` as KeyToken;
}
