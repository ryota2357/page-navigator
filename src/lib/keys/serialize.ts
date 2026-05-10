import type { KeyToken } from "../types";
import { canonicalizeKeyName, SPACE_BARE, SPACE_WRAPPED } from "./canonical";

// Internal modifier bag — set members reflect "modifier was held".
// Modifier-only key presses (e.g. just Shift) are filtered upstream.
export type Mods = {
  alt: boolean;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
};

// Modifier order at serialization is fixed alphabetical: A-C-M-S
// (docs/dev/step-02-data-model.md §1.1).
const MOD_ORDER: ReadonlyArray<["alt" | "ctrl" | "meta" | "shift", string]> = [
  ["alt", "A"],
  ["ctrl", "C"],
  ["meta", "M"],
  ["shift", "S"],
];

function isPrintable(key: string): boolean {
  // Length-1 strings from event.key are always printable (a single char).
  // Multi-char strings are key names (ArrowDown, Escape, F12, ...).
  return key.length === 1;
}

function isLetter(ch: string): boolean {
  // Strict ASCII letter test — Shift folds case for ASCII letters; non-ASCII
  // printables (e.g. shifted digits like "!" or symbols) do not have a
  // case-folded form, so Shift is preserved as <S->.
  return /^[A-Za-z]$/.test(ch);
}

// Serialize a normalized {mods, key} pair to canonical KeyToken form.
//
// Rules (docs/dev/step-02-data-model.md §1.4):
//   bare printable (no other mod):     fold Shift into case ("J")
//   printable + non-Shift mod:         keep <S->, lowercase printable
//   non-printable (any mods):          always wrap, keep <S->
//   space character:                   bare " " or wrapped "Space"
export function serialize(mods: Mods, rawKey: string): KeyToken {
  const key = canonicalizeKeyName(rawKey);
  const printable = isPrintable(key);

  // Decide if we render as bare (no <…>) or wrapped (<…>).
  const otherModHeld = mods.alt || mods.ctrl || mods.meta;
  const wrap = !printable || otherModHeld;

  if (!wrap) {
    // Bare printable. Shift is encoded by the character's case. From the
    // listener path the browser already case-folded (Shift+j → "J"); from the
    // parser path mods may carry shift=true with a lowercase letter — fold
    // here so both paths converge.
    if (mods.shift && isLetter(key)) return key.toUpperCase();
    return key;
  }

  // Wrapped. Build modifier prefixes in canonical A-C-M-S order.
  let inner = "";
  for (const [m, letter] of MOD_ORDER) {
    if (m === "shift") {
      // Shift inside <…>: kept iff (a) non-printable, or (b) at least one
      // other modifier is also held. Bare-printable + Shift was handled
      // above (we never reach here in that case).
      const keepShift = !printable || otherModHeld;
      if (mods.shift && keepShift) inner += `${letter}-`;
    } else if (mods[m]) {
      inner += `${letter}-`;
    }
  }

  // Inside <…> the printable case is not significant — lowercase ASCII letters
  // so `<C-J>` and `<C-j>` collapse to one canonical form.
  let inner_key = key;
  if (printable) {
    if (key === SPACE_BARE) {
      inner_key = SPACE_WRAPPED;
    } else if (isLetter(key)) {
      inner_key = key.toLowerCase();
    }
  }

  return `<${inner}${inner_key}>`;
}
