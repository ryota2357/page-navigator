import * as pagination from "./pagination";
import * as result from "./result";
import * as searchInput from "./searchInput";
import * as tabs from "./tabs";

export const googleActions = [
  result.focusNextResultAction,
  result.focusPrevResultAction,
  result.openResultAction,
  result.copyResultUrlAction,
  searchInput.focusSearchInputAction,
  pagination.navigatePreviousPageAction,
  pagination.navigateNextPageAction,
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
