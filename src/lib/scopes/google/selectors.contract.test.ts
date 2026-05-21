import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadFixtureDocument, selectorSetHits } from "@/lib/test/fixture";
import { NEXT_PAGE_SELECTOR } from "./pagination";
import { RESULT_LINK_SELECTORS } from "./result";
import { SEARCH_INPUT_SELECTORS } from "./searchInput";
import { SUB_TAB_SELECTORS } from "./tabs";

// Drift detector: assert the Google site selectors still hit a real SERP. A
// failure here ALWAYS means the same thing — Google changed its markup, so
// re-capture serp.html (tools/capture-serp.md) and fix the selector. The HTML
// is captured offline and checked in; CI never touches Google.
const doc = loadFixtureDocument(
  join(import.meta.dirname, "__fixtures__/serp.html"),
);

// `svelte` SERP page 1: these sub-tabs render. flights/financial are
// query-dependent and absent here, and #pnprev only exists past page 1 — so
// they are intentionally out of scope for this fixture rather than asserted
// (asserting an absent control would be a false drift signal).
const ABSENT_TABS = new Set<keyof typeof SUB_TAB_SELECTORS>([
  "flights",
  "financial",
]);

describe("Google selector contract (re-capture serp.html on failure)", () => {
  it("organic result title links still match", () => {
    expect(selectorSetHits(doc, RESULT_LINK_SELECTORS)).toBe(true);
  });

  it("search input box still matches", () => {
    expect(selectorSetHits(doc, SEARCH_INPUT_SELECTORS)).toBe(true);
  });

  it("next-page pager anchor still matches", () => {
    expect(doc.querySelectorAll(NEXT_PAGE_SELECTOR).length).toBeGreaterThan(0);
  });

  for (const [tab, selectors] of Object.entries(SUB_TAB_SELECTORS)) {
    const key = tab as keyof typeof SUB_TAB_SELECTORS;
    const register = ABSENT_TABS.has(key) ? it.skip : it;
    register(`${tab} sub-tab anchor still matches`, () => {
      expect(selectorSetHits(doc, selectors)).toBe(true);
    });
  }
});
