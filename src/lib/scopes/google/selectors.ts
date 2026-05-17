// Google SERP DOM is class-soup that shifts every few months. The stable shape
// we rely on: organic-result title links are <a> elements wrapping an <h3>.
// We probe a small set of container selectors and accept the first that yields
// hits, so layout experiments stay reachable without an extension update.
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

// Sub-tab nav lives in two places depending on viewport / experiment bucket:
// the inline tab bar near the search box, or the overflow "more" menu. Google
// has also been migrating `tbm=` query params to `udm=`, so each tab keeps
// fallbacks across both schemes. First match wins.
const SUB_TAB_SELECTORS = {
  search: [
    // "All" tab — a /search link with neither a tab-mode param nor a domain
    // hop. The `:not(...)` filters exclude image/video/maps variants.
    'a[href*="/search?"]:not([href*="tbm="]):not([href*="udm="]):not([href*="maps.google."])',
  ],
  images: ['a[href*="tbm=isch"]', 'a[href*="udm=2"]'],
  videos: ['a[href*="tbm=vid"]', 'a[href*="udm=7"]'],
  maps: ['a[href*="maps.google."]'],
  news: ['a[href*="tbm=nws"]', 'a[href*="udm=12"]'],
  shopping: ['a[href*="tbm=shop"]', 'a[href*="udm=28"]'],
  books: ['a[href*="tbm=bks"]', 'a[href*="udm=36"]'],
  flights: ['a[href*="tbm=flm"]'],
  financial: ['a[href*="/finance?"]', 'a[href*="/finance/"]'],
} as const;

export type SubTabId = keyof typeof SUB_TAB_SELECTORS;

export function findSubTabLink(tab: SubTabId): HTMLAnchorElement | null {
  for (const sel of SUB_TAB_SELECTORS[tab]) {
    const el = document.querySelector<HTMLAnchorElement>(sel);
    if (el != null) return el;
  }
  return null;
}
