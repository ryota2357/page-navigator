import { defineAction } from "@/lib/action";

// Scholar's search box has a stable id; no fallbacks needed (unlike the main
// Google SERP, whose search box selector churns across experiments).
const SEARCH_INPUT_SELECTOR = "#gs_hdr_tsi";

export const focusSearchInputAction = defineAction(
  "gscholar.focusSearchInput",
  {
    description: "Focus the search input box; blur it when already focused.",
    optionSchema: {},
    defaults: {},
    run: () => {
      const input = document.querySelector<HTMLElement>(SEARCH_INPUT_SELECTOR);
      if (input == null) return;
      if (document.activeElement === input) {
        input.blur();
      } else {
        input.focus();
      }
    },
  },
);
