import { defineAction } from "@/lib/action";
import { SearchResultNavigator } from "../shared/searchResultNavigation";

// Google SERP DOM is class-soup that shifts every few months. The stable shape
// we rely on: organic-result title links are <a> elements wrapping an <h3>.
// We probe a small set of container selectors and accept the first that yields
// hits, so layout experiments stay reachable without an extension update.
export const RESULT_LINK_SELECTORS = [
  "#search a:has(h3)",
  "#rso a:has(h3)",
  "#main a:has(h3)",
];

const nav = new SearchResultNavigator({
  linkSelectors: RESULT_LINK_SELECTORS,
  focusedClass: "pn-google-focused",
  styleId: "pn-google-focused-style",
  color: { light: "#1a73e8", dark: "#8ab4f8" },
});

const focusOptionSchema = {
  wrap: { kind: "boolean" },
} as const;

export const focusNextResultAction = defineAction("google.focusNextResult", {
  description: "Move focus to the next search result.",
  optionSchema: focusOptionSchema,
  defaults: { wrap: false },
  run: ({ wrap }) => nav.moveCursor(+1, wrap),
});

export const focusPrevResultAction = defineAction("google.focusPrevResult", {
  description: "Move focus to the previous search result.",
  optionSchema: focusOptionSchema,
  defaults: { wrap: false },
  run: ({ wrap }) => nav.moveCursor(-1, wrap),
});

export const openResultAction = defineAction("google.openResult", {
  description: "Activate the currently focused search result.",
  optionSchema: {
    tab: {
      kind: "select",
      options: ["current", "new", "background"] as const,
    },
  },
  defaults: { tab: "current" },
  run: ({ tab }) => nav.openResult(tab),
});

export const copyResultUrlAction = defineAction("google.copyResultUrl", {
  description: "Copy the focused search result's URL to the clipboard.",
  optionSchema: {},
  defaults: {},
  run: () => nav.copyResultUrl(),
});
