import { defineAction } from "@/lib/action";

// `#pnprev` / `#pnnext` are the canonical pagination anchor IDs and have
// stayed stable across Google SERP redesigns. They do not exist on the
// image search tab or in continuous-scroll layouts; the actions become
// a no-op there.

export const navigatePreviousPageAction = defineAction(
  "google.navigatePreviousPage",
  {
    description: "Navigate to the previous page of search results.",
    optionSchema: {},
    defaults: {},
    run: () => {
      const link = document.querySelector<HTMLAnchorElement>("#pnprev");
      if (link != null) link.click();
    },
  },
);

export const navigateNextPageAction = defineAction("google.navigateNextPage", {
  description: "Navigate to the next page of search results.",
  optionSchema: {},
  defaults: {},
  run: () => {
    const link = document.querySelector<HTMLAnchorElement>("#pnnext");
    if (link != null) link.click();
  },
});
