import { defineAction } from "@/lib/action";

// Scholar's pager renders the prev/next arrows as icon spans
// (`.gs_ico_nav_previous` / `.gs_ico_nav_next`) wrapped in the clickable `<a>`;
// the icon itself isn't the link, so we click its parent. Either arrow is
// absent at the list ends, making the action a no-op there.
function clickPagerArrow(iconSelector: string): void {
  const icon = document.querySelector(iconSelector);
  const anchor = icon?.parentElement;
  if (anchor instanceof HTMLElement) anchor.click();
}

export const navigatePreviousPageAction = defineAction(
  "gscholar.navigatePreviousPage",
  {
    description: "Navigate to the previous page of search results.",
    optionSchema: {},
    defaults: {},
    run: () => clickPagerArrow(".gs_ico_nav_previous"),
  },
);

export const navigateNextPageAction = defineAction(
  "gscholar.navigateNextPage",
  {
    description: "Navigate to the next page of search results.",
    optionSchema: {},
    defaults: {},
    run: () => clickPagerArrow(".gs_ico_nav_next"),
  },
);
