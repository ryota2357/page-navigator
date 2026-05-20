import * as pagination from "./pagination";
import * as result from "./result";
import * as searchInput from "./searchInput";

export const gscholarActions = [
  result.focusNextResultAction,
  result.focusPrevResultAction,
  result.openResultAction,
  result.copyResultUrlAction,
  searchInput.focusSearchInputAction,
  pagination.navigatePreviousPageAction,
  pagination.navigateNextPageAction,
] as const;
