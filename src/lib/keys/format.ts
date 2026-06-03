import type { KeyToken, Trigger } from "./token";

// KeyTokens are already vim-style (`<C-Tab>`, bare printables). Wrap bare
// non-printables (Space, Enter, …) so they read as a token on screen.
export function formatKeyToken(token: KeyToken): string {
  if (token.startsWith("<") && token.endsWith(">")) return token;
  if (token.length === 1) return token;
  return `<${token}>`;
}

// Vim-style concatenation: ["g", "g"] -> "gg", ["<C-w>", "s"] -> "<C-w>s".
export function formatTrigger(trigger: Trigger): string {
  return trigger.map(formatKeyToken).join("");
}
