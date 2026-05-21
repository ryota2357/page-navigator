import { vi } from "vitest";

// Synthetic DOM fixtures + browser-API seams shared by action tests. happy-dom
// implements scrollIntoView / scrollBy / clipboard as real functions, so callers
// spy on them directly; these helpers only cut the boilerplate.

// Build a result list under `#<containerId>`. A null entry yields an <a> with
// no href — the [CITATION]/[BOOK]-style links the strict open/copy paths skip.
// `wrapH3` nests an <h3> in each anchor for selectors like `a:has(h3)`.
export function setResultLinks(
  hrefs: ReadonlyArray<string | null>,
  opts: { containerId?: string; wrapH3?: boolean } = {},
): HTMLAnchorElement[] {
  const { containerId = "results", wrapH3 = false } = opts;
  const container = document.createElement("div");
  container.id = containerId;
  for (const href of hrefs) {
    const a = document.createElement("a");
    if (wrapH3) {
      const h3 = document.createElement("h3");
      h3.textContent = "result";
      a.appendChild(h3);
    } else {
      a.textContent = "result";
    }
    if (href !== null) a.setAttribute("href", href);
    container.appendChild(a);
  }
  document.body.appendChild(container);
  return Array.from(container.querySelectorAll("a"));
}

// Spy on the clipboard so copy actions can be asserted without a real write.
export function stubClipboardWriteText() {
  return vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
}
