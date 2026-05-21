import { describe, expect, it } from "vitest";
import { setResultLinks } from "@/lib/test/dom";
import { focusNextResultAction } from "./result";

// The navigator's cursor logic is tested in
// shared/searchResultNavigation.test.ts; this checks only that the Google
// result action drives it through the `#search a:has(h3)` selector.
describe("google result action wiring", () => {
  it("focuses the first organic result via the shared navigator", () => {
    const links = setResultLinks(["https://e/0", "https://e/1"], {
      containerId: "search",
      wrapH3: true,
    });

    focusNextResultAction.invoke({ wrap: false });

    expect(document.activeElement).toBe(links[0]);
  });
});
