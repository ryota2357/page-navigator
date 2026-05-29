import { join } from "node:path";
import { defineSelectorContract } from "@/lib/test/fixture";
import type { FIXTURE_URLS } from "./__fixtures__";
import { NEXT_PAGE_SELECTOR, PREV_PAGE_SELECTOR } from "./pagination";
import { RESULT_LINK_SELECTORS } from "./result";
import { SEARCH_INPUT_SELECTORS } from "./searchInput";
import { SUB_TAB_SELECTORS } from "./tabs";

const CONTRACTS: Record<
  keyof typeof FIXTURE_URLS,
  Record<string, readonly string[]>
> = {
  "search-page1": {
    "organic result title links": RESULT_LINK_SELECTORS,
    "search input box": SEARCH_INPUT_SELECTORS,
    "next-page pager anchor": [NEXT_PAGE_SELECTOR],
    "All sub-tab anchor": SUB_TAB_SELECTORS.search,
    "Images sub-tab anchor": SUB_TAB_SELECTORS.images,
    "Videos sub-tab anchor": SUB_TAB_SELECTORS.videos,
    "Maps sub-tab anchor": SUB_TAB_SELECTORS.maps,
    "News sub-tab anchor": SUB_TAB_SELECTORS.news,
    "Shopping sub-tab anchor": SUB_TAB_SELECTORS.shopping,
    "Books sub-tab anchor": SUB_TAB_SELECTORS.books,
  },
  "search-page2": {
    "previous-page pager anchor": [PREV_PAGE_SELECTOR],
    "next-page pager anchor": [NEXT_PAGE_SELECTOR],
  },
  flights: {
    "Flights sub-tab anchor": SUB_TAB_SELECTORS.flights,
  },
  finance: {
    "Finance sub-tab anchor": SUB_TAB_SELECTORS.financial,
  },
};

defineSelectorContract(
  "Google selector contract",
  join(import.meta.dirname, "__fixtures__"),
  CONTRACTS,
);
