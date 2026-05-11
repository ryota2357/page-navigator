// Google SERP DOM is class-soup that shifts every few months. The stable
// shape we rely on: organic-result title links are <a> elements wrapping an
// <h3>, contained under the search results region. We probe a small set of
// container selectors and accept the first that yields hits, so layout
// experiments stay reachable without an extension update.

const RESULT_LINK_SELECTORS = [
  "#search a:has(h3)",
  "#rso a:has(h3)",
  "#main a:has(h3)",
];

export function findResultLinks(): HTMLAnchorElement[] {
  for (const sel of RESULT_LINK_SELECTORS) {
    const found = document.querySelectorAll<HTMLAnchorElement>(sel);
    if (found.length > 0) return Array.from(found);
  }
  return [];
}
