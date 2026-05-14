import * as actions from "./actions";

export const googleScope = {
  label: "Google",
  // Accepts any TLD (.com / .co.jp / .de / …) so users on a local Google domain are covered.
  urlPattern: /^https:\/\/www\.google\..+\/search/,
} as const;

export const googleActions = [
  actions.focusNextResultAction,
  actions.focusPrevResultAction,
  actions.openResultAction,
] as const;
