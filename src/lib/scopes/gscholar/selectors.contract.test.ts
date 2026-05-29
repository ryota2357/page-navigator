import { join } from "node:path";
import { defineSelectorContract } from "@/lib/test/fixture";
import type { FIXTURE_URLS } from "./__fixtures__";
import { NEXT_PAGE_ICON_SELECTOR, PREV_PAGE_ICON_SELECTOR } from "./pagination";
import { RESULT_LINK_SELECTORS } from "./result";
import { SEARCH_INPUT_SELECTOR } from "./searchInput";

const CONTRACTS: Record<
  keyof typeof FIXTURE_URLS,
  Record<string, readonly string[]>
> = {
  page1: {
    "result title links": RESULT_LINK_SELECTORS,
    "search input box": [SEARCH_INPUT_SELECTOR],
    "next-page pager arrow": [NEXT_PAGE_ICON_SELECTOR],
  },
  page2: {
    "previous-page pager arrow": [PREV_PAGE_ICON_SELECTOR],
    "next-page pager arrow": [NEXT_PAGE_ICON_SELECTOR],
  },
};

defineSelectorContract(
  "Scholar selector contract",
  join(import.meta.dirname, "__fixtures__"),
  CONTRACTS,
);
