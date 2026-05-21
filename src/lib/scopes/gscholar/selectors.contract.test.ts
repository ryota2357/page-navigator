import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadFixtureDocument, selectorSetHits } from "@/lib/test/fixture";
import { NEXT_PAGE_ICON_SELECTOR } from "./pagination";
import { RESULT_LINK_SELECTORS } from "./result";
import { SEARCH_INPUT_SELECTOR } from "./searchInput";

// Drift detector: assert the Scholar site selectors still hit a real SERP. A
// failure here ALWAYS means Scholar changed its markup — re-capture serp.html
// (tools/capture-serp.md) and fix the selector. The HTML is captured offline
// and checked in; CI never touches Scholar.
const doc = loadFixtureDocument(
  join(import.meta.dirname, "__fixtures__/serp.html"),
);

describe("Scholar selector contract (re-capture serp.html on failure)", () => {
  it("result title links still match", () => {
    expect(selectorSetHits(doc, RESULT_LINK_SELECTORS)).toBe(true);
  });

  it("search input box still matches", () => {
    expect(doc.querySelectorAll(SEARCH_INPUT_SELECTOR).length).toBeGreaterThan(
      0,
    );
  });

  // #pnprev's Scholar equivalent (.gs_ico_nav_previous) only renders past
  // page 1, so the captured page-1 fixture asserts only the next arrow.
  it("next-page pager arrow still matches", () => {
    expect(
      doc.querySelectorAll(NEXT_PAGE_ICON_SELECTOR).length,
    ).toBeGreaterThan(0);
  });
});
