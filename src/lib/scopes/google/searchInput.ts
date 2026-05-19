import { defineAction } from "@/lib/action";

// `form[role=search]` is the only selector that survived Google's 2020
// search-box migration across regular and image sub-tabs; the bare `[name=q]`
// variants stay as fallbacks for experimental layouts.
const SEARCH_INPUT_SELECTORS = [
  'form[role="search"] [name="q"]',
  'input[name="q"]',
  'textarea[name="q"]',
];

export const focusSearchInputAction = defineAction("google.focusSearchInput", {
  description: "Focus the search input box; blur it when already focused.",
  optionSchema: {},
  defaults: {},
  run: () => {
    let input: HTMLElement | null = null;
    for (const sel of SEARCH_INPUT_SELECTORS) {
      input = document.querySelector<HTMLElement>(sel);
      if (input != null) break;
    }
    if (input == null) return;
    if (document.activeElement === input) {
      input.blur();
    } else {
      input.focus();
    }
  },
});
