import { is, type PredicateType } from "@core/unknownutil";
import { parse } from "./parse";

declare const keyTokenBrand: unique symbol;

// Canonical key form. Modifier letters uppercase, ordered A-C-M-S, separated
// by `-`. Non-printable key names UpperCamelCase. Examples:
//   "j", "?"              bare printable; Shift folds into case ("J")
//   "<C-j>", "<C-S-j>"    printable + modifiers; lowercased inside <…>
//   "<S-Tab>"             non-printable; Shift kept as a modifier
//
// Branded so only `encodeKeyToken` can produce values of this type.
export type KeyToken = string & { readonly [keyTokenBrand]: true };

// `parse` is idempotent on canonical input, rewrites non-canonical, and
// throws on malformed — so `x` is canonical iff `parse(x) === x`.
export function isKeyToken(x: unknown): x is KeyToken {
  if (!is.String(x)) return false;
  try {
    return parse(x) === x;
  } catch {
    return false;
  }
}

export const isTrigger = is.ArrayOf(isKeyToken);

// Derived so the type and its runtime guard can't drift apart.
export type Trigger = PredicateType<typeof isTrigger>;
