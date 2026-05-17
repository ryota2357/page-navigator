import type { KeyToken, Trigger } from "@/lib/keys";

// Format a single KeyToken for human display. KeyTokens already use the
// vim-style `<C-Tab>` notation, so most are passed through. Bare printable
// keys render as-is; named non-printable keys are wrapped in `<…>` (Space
// becomes `<Space>`, Enter `<Enter>`, etc.) for visual parity with modified
// keys.
export function displayKeyToken(token: KeyToken): string {
  if (token.startsWith("<") && token.endsWith(">")) return token;
  if (token.length === 1) return token;
  return `<${token}>`;
}

// Pieces of a Trigger for tag rendering: one tag per sequence step.
export function triggerPieces(trigger: Trigger): string[] {
  return trigger.map(displayKeyToken);
}
