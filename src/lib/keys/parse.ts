import { isKnownNonPrintable } from "./canonical";
import { encodeKeyToken } from "./encode";
import type { KeyToken, Trigger } from "./token";

const WRAPPED_RE = /^<((?:[ACMSacms]-)+)?(.+)>$/;
const MODIFIER_LETTERS = new Set(["A", "C", "M", "S"]);

function noMods() {
  return { altKey: false, ctrlKey: false, metaKey: false, shiftKey: false };
}

// Lenient: case-insensitive modifiers/letters, any modifier order.
// Throws on malformed input — `loadBindings` catches and drops the row.
export function parse(input: string): KeyToken {
  if (input.length === 0) throw new Error("empty key token");

  if (!input.startsWith("<")) {
    if (input.length !== 1) {
      throw new Error(`bare key token must be a single character: ${input}`);
    }
    return encodeKeyToken({ ...noMods(), key: input });
  }

  const match = WRAPPED_RE.exec(input);
  if (!match) throw new Error(`malformed key token: ${input}`);

  const [, modPart, keyPart] = match;
  const mods = noMods();

  if (modPart) {
    for (const seg of modPart.split("-")) {
      if (seg.length === 0) continue;
      const letter = seg.toUpperCase();
      if (!MODIFIER_LETTERS.has(letter)) {
        throw new Error(`unknown modifier in key token: ${seg}`);
      }
      switch (letter) {
        case "A":
          mods.altKey = true;
          break;
        case "C":
          mods.ctrlKey = true;
          break;
        case "M":
          mods.metaKey = true;
          break;
        case "S":
          mods.shiftKey = true;
          break;
      }
    }
  }

  let key = keyPart;
  if (key.length === 1) {
    if (/^[A-Za-z]$/.test(key)) key = key.toLowerCase();
  } else if (!isKnownNonPrintable(key)) {
    throw new Error(`unknown key name in token: <${modPart ?? ""}${keyPart}>`);
  }

  return encodeKeyToken({ ...mods, key });
}

export function parseTrigger(tokens: string[]): Trigger {
  return tokens.map(parse);
}
