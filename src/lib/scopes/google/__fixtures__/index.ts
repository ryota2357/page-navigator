// URL to re-capture each fixture from. Consumed by the contract test (for the
// file names: <key>.html) and by `pnpm fixtures` (the pages to open). Capture
// logged-out / incognito so no account data lands in the HTML. flights/finance
// tabs are query-dependent, so each lives on its own query.
export const FIXTURE_URLS = {
  "search-page1": "https://www.google.com/search?q=svelte",
  "search-page2": "https://www.google.com/search?q=svelte&start=10",
  flights: "https://www.google.com/search?q=flights+to+tokyo",
  finance: "https://www.google.com/search?q=AAPL+stock",
} as const;
