import { canonicalizeKeyName, SPACE_BARE, SPACE_WRAPPED } from "./canonical";
import type { KeyToken } from "./types";

export type Mods = {
  alt: boolean;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
};

const MOD_ORDER: ReadonlyArray<["alt" | "ctrl" | "meta" | "shift", string]> = [
  ["alt", "A"],
  ["ctrl", "C"],
  ["meta", "M"],
  ["shift", "S"],
];

// Length-1 strings from event.key are always printable (a single char).
// Multi-char strings are key names (ArrowDown, Escape, F12, ...).
function isPrintable(key: string): boolean {
  return key.length === 1;
}

// Strict ASCII letter test — Shift folds case for ASCII letters; non-ASCII
// printables (e.g. shifted digits like "!") have no case-folded form, so
// Shift stays as <S->.
function isLetter(ch: string): boolean {
  return /^[A-Za-z]$/.test(ch);
}

// Serialize a normalized {mods, key} pair to canonical KeyToken form.
//
//   bare printable (no other mod):     fold Shift into case ("J")
//   printable + non-Shift mod:         keep <S->, lowercase printable
//   non-printable (any mods):          always wrap, keep <S->
//   space character:                   bare " " or wrapped "Space"
export function serialize(mods: Mods, rawKey: string): KeyToken {
  const key = canonicalizeKeyName(rawKey);
  const printable = isPrintable(key);
  const otherModHeld = mods.alt || mods.ctrl || mods.meta;
  const wrap = !printable || otherModHeld;

  if (!wrap) {
    // Bare printable. From the listener path the browser already case-folded
    // (Shift+j → "J"); from the parser path mods may carry shift=true with a
    // lowercase letter — fold here so both paths converge.
    if (mods.shift && isLetter(key)) return key.toUpperCase();
    return key;
  }

  let inner = "";
  for (const [m, letter] of MOD_ORDER) {
    if (m === "shift") {
      // Shift inside <…>: kept iff non-printable, or at least one other
      // modifier is also held. Bare printable + Shift was handled above.
      const keepShift = !printable || otherModHeld;
      if (mods.shift && keepShift) inner += `${letter}-`;
    } else if (mods[m]) {
      inner += `${letter}-`;
    }
  }

  // Inside <…> the printable case is not significant; lowercase ASCII letters
  // so `<C-J>` and `<C-j>` collapse to one canonical form.
  let innerKey = key;
  if (printable) {
    if (key === SPACE_BARE) {
      innerKey = SPACE_WRAPPED;
    } else if (isLetter(key)) {
      innerKey = key.toLowerCase();
    }
  }

  return `<${inner}${innerKey}>`;
}
