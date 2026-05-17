import * as result from "./result";
import * as tabs from "./tabs";

export const googleScope = {
  label: "Google",
  // Accepts any TLD (.com / .co.jp / .de / …) so users on a local Google domain are covered.
  urlPattern: /^https:\/\/www\.google\..+\/search/,
} as const;

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
