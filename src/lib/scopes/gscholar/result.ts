import { defineAction } from "@/lib/action";
import {
  openOptionSchema,
  SearchResultNavigator,
} from "../shared/searchResultNavigation";

// Scholar result titles are `<a>` inside `.gs_rt`; [CITATION]/[BOOK] entries
// without a link have no `<a>` there, so `.gs_rt a` selects exactly the
// navigable results. Scholar's DOM has been far more stable than the main SERP.
const nav = new SearchResultNavigator({
  linkSelectors: [".gs_rt a"],
  focusedClass: "pn-gscholar-focused",
  styleId: "pn-gscholar-focused-style",
  color: { light: "#1a73e8", dark: "#8ab4f8" },
});

const focusOptionSchema = {
  wrap: { kind: "boolean" },
} as const;

export const focusNextResultAction = defineAction("gscholar.focusNextResult", {
  description: "Move focus to the next search result.",
  optionSchema: focusOptionSchema,
  defaults: { wrap: false },
  run: ({ wrap }) => nav.moveCursor(+1, wrap),
});

export const focusPrevResultAction = defineAction("gscholar.focusPrevResult", {
  description: "Move focus to the previous search result.",
  optionSchema: focusOptionSchema,
  defaults: { wrap: false },
  run: ({ wrap }) => nav.moveCursor(-1, wrap),
});

export const openResultAction = defineAction("gscholar.openResult", {
  description: "Activate the currently focused search result.",
  optionSchema: openOptionSchema,
  defaults: { target: "current" },
  run: ({ target }) => nav.openResult(target),
});

export const copyResultUrlAction = defineAction("gscholar.copyResultUrl", {
  description: "Copy the focused search result's URL to the clipboard.",
  optionSchema: {},
  defaults: {},
  run: () => nav.copyResultUrl(),
});
