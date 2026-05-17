import { defineAction } from "@/lib/action";
import { findSubTabLink, type SubTabId } from "./selectors";

function defineSubTabAction<Id extends `google.${string}`>(
  id: Id,
  description: string,
  tab: SubTabId,
) {
  return defineAction(id, {
    description,
    optionSchema: {},
    defaults: {},
    run: () => {
      const link = findSubTabLink(tab);
      if (link != null) link.click();
    },
  });
}

export const navigateSearchTabAction = defineSubTabAction(
  "google.navigateSearchTab",
  "Switch to the All (Web) search tab.",
  "search",
);

export const navigateImagesTabAction = defineSubTabAction(
  "google.navigateImagesTab",
  "Switch to the Images tab.",
  "images",
);

export const navigateVideosTabAction = defineSubTabAction(
  "google.navigateVideosTab",
  "Switch to the Videos tab.",
  "videos",
);

export const navigateMapsTabAction = defineSubTabAction(
  "google.navigateMapsTab",
  "Switch to the Maps tab.",
  "maps",
);

export const navigateNewsTabAction = defineSubTabAction(
  "google.navigateNewsTab",
  "Switch to the News tab.",
  "news",
);

export const navigateShoppingTabAction = defineSubTabAction(
  "google.navigateShoppingTab",
  "Switch to the Shopping tab.",
  "shopping",
);

export const navigateBooksTabAction = defineSubTabAction(
  "google.navigateBooksTab",
  "Switch to the Books tab.",
  "books",
);

export const navigateFlightsTabAction = defineSubTabAction(
  "google.navigateFlightsTab",
  "Switch to the Flights tab.",
  "flights",
);

export const navigateFinancialTabAction = defineSubTabAction(
  "google.navigateFinancialTab",
  "Switch to the Finance tab.",
  "financial",
);
