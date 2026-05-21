import { describe, expect, it } from "vitest";
import { focusNextResultAction } from "./result";

// The navigator's cursor logic is tested in
// shared/searchResultNavigation.test.ts; this checks only that the Scholar
// result action drives it through the `.gs_rt a` selector.
describe("gscholar result action wiring", () => {
  it("focuses the first result title link via the shared navigator", () => {
    document.body.innerHTML = `
      <div class="gs_rt"><a id="r0" href="https://e/0">first</a></div>
      <div class="gs_rt"><a id="r1" href="https://e/1">second</a></div>`;

    focusNextResultAction.invoke({ wrap: false });

    expect(document.activeElement).toBe(document.getElementById("r0"));
  });
});
