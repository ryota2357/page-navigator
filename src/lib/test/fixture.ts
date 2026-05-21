import { readFileSync } from "node:fs";

// Parse a checked-in real-SERP fixture into a Document for selector-contract
// tests. The fixture is captured + trimmed offline (see tools/capture-serp.md);
// CI only reads it, so these tests never touch a live site.
export function loadFixtureDocument(path: string): Document {
  const html = readFileSync(path, "utf8");
  return new DOMParser().parseFromString(html, "text/html");
}

// A fallback selector set is satisfied when *any* member hits, mirroring the
// actions' first-match-wins probing. Individual members legitimately return 0
// (e.g. Google's tbm= selectors after the udm= migration), so per-set is the
// granularity that signals real drift.
export function selectorSetHits(
  doc: Document,
  selectors: readonly string[],
): boolean {
  return selectors.some((sel) => doc.querySelectorAll(sel).length > 0);
}
