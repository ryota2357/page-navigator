// URL to re-capture each fixture from. Consumed by the contract test (for the
// file names: <key>.html) and by `pnpm fixtures` (the pages to open). Capture
// logged-out / incognito so no account data lands in the HTML.
export const FIXTURE_URLS = {
  page1: "https://scholar.google.com/scholar?q=attention+is+all+you+need",
  page2: "https://scholar.google.com/scholar?q=attention+is+all+you+need&start=10",
} as const;
