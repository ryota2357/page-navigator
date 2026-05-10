import type { KeyToken } from "../types";
import { isKnownNonPrintable } from "./canonical";
import { type Mods, serialize } from "./serialize";

// Lenient parser: re-canonicalizes any user-authored KeyToken-like string.
// Accepts case-insensitive content inside <…> for both modifier letters and
// printables (so `<C-J>` = `<c-j>` = Ctrl+j). Modifier order doesn't matter.
//
// Input expectations (docs/dev/step-02-data-model.md §1.1, §1.4):
//   - Bare single character ("j", "?", " ") — case significant.
//   - Wrapped form: <[mods-]key> where mods are any of A/C/M/S in any case
//     and any order; key is the printable char or a UpperCamelCase name.
//
// Returns the canonical KeyToken. Throws on syntactically malformed input
// (the storage loader catches and drops the offending row).

const WRAPPED_RE = /^<((?:[ACMSacms]-)+)?(.+)>$/;
const MODIFIER_LETTERS = new Set(["A", "C", "M", "S"]);

export function parse(input: string): KeyToken {
  if (input.length === 0) throw new Error("empty key token");

  if (!input.startsWith("<")) {
    // Bare form: must be exactly one character. (Multi-char unwrapped names
    // are illegal — `Tab` must be `<Tab>`.)
    if (input.length !== 1) {
      throw new Error(`bare key token must be a single character: ${input}`);
    }
    return serialize(emptyMods(), input);
  }

  const match = WRAPPED_RE.exec(input);
  if (!match) throw new Error(`malformed key token: ${input}`);

  const [, modPart, keyPart] = match;
  const mods = emptyMods();

  if (modPart) {
    for (const seg of modPart.split("-")) {
      if (seg.length === 0) continue;
      const letter = seg.toUpperCase();
      if (!MODIFIER_LETTERS.has(letter)) {
        throw new Error(`unknown modifier in key token: ${seg}`);
      }
      switch (letter) {
        case "A":
          mods.alt = true;
          break;
        case "C":
          mods.ctrl = true;
          break;
        case "M":
          mods.meta = true;
          break;
        case "S":
          mods.shift = true;
          break;
      }
    }
  }

  // Validate the key part: either a single printable character, or a known
  // non-printable canonical name (case-insensitive). Anything else (e.g.
  // multi-char garbage like "C-" produced by stray hyphens) is malformed.
  let key = keyPart;
  if (key.length === 1) {
    if (/^[A-Za-z]$/.test(key)) key = key.toLowerCase();
  } else if (!isKnownNonPrintable(key)) {
    throw new Error(`unknown key name in token: <${modPart ?? ""}${keyPart}>`);
  }

  return serialize(mods, key);
}

function emptyMods(): Mods {
  return { alt: false, ctrl: false, meta: false, shift: false };
}

// Convenience: parse an entire trigger sequence (array of canonical or
// lenient strings).
export function parseTrigger(tokens: string[]): KeyToken[] {
  return tokens.map(parse);
}
