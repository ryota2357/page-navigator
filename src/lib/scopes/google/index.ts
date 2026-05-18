import * as result from "./result";
import * as tabs from "./tabs";

export const googleActions = [
  result.focusNextResultAction,
  result.focusPrevResultAction,
  result.openResultAction,
  tabs.navigateSearchTabAction,
  tabs.navigateImagesTabAction,
  tabs.navigateVideosTabAction,
  tabs.navigateMapsTabAction,
  tabs.navigateNewsTabAction,
  tabs.navigateShoppingTabAction,
  tabs.navigateBooksTabAction,
  tabs.navigateFlightsTabAction,
  tabs.navigateFinancialTabAction,
] as const;
