# Capture a real SERP for the selector-contract fixtures

The selector-contract tests (`*.contract.test.ts`) assert that the site DOM selectors this extension relies on still hit ≥1 element in **real** search-result HTML.
CI never touches Google — the HTML is captured once, by hand, and checked in.
When a contract test goes red it means the site changed its markup: re-capture and fix the selector.

## How to capture (rare, ~1 click)

1. Open the target page in an **Incognito window** (logged out — keeps name / avatar / location / session out of the HTML; automation-driven browsers get CAPTCHA'd, which is why this is manual):
   - Google: `https://www.google.com/search?q=svelte`
   - Google Scholar: `https://scholar.google.com/scholar?q=attention+is+all+you+need`
2. Run the download bookmarklet below. It saves the full page as `<hostname>.html`.
3. Move both saved files to the repo root, then trim each into its checked-in fixture with `tools/trim-serp.mjs`:
   ```sh
   node tools/trim-serp.mjs www.google.com.html     src/lib/scopes/google/__fixtures__/serp.html
   node tools/trim-serp.mjs scholar.google.com.html src/lib/scopes/gscholar/__fixtures__/serp.html
   ```
4. Confirm the contract tests pass against the fresh capture, then delete the raw `*.google.com.html` files:
   ```sh
   pnpm test selectors.contract
   ```

## Bookmarklet

```js
javascript:(function(){const b=new Blob([document.documentElement.outerHTML],{type:'text/html'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=location.hostname+'.html';a.click();})();
```

## What `trim-serp.mjs` does (and why)

The raw capture is 1–2 MB; `trim-serp.mjs` cuts it to a small, inert fixture:

- Removes `<script>`/`<style>`/comments — the bulk of the bytes.
- Removes every subresource tag (`<iframe>`, `<link>`, `<img>`, `<svg>`, `<video>`, …). happy-dom eagerly **fetches** these when it parses the fixture; stripping them keeps the contract tests fully offline. The selectors only target `<a>`/`<input>`/`<form>`/`<h3>`/`<span>`, so hit counts are unchanged.

PII: always capture **logged out / Incognito** so no name, avatar, location, or session token is embedded — the trim step does not scrub identifiers.

## Scope of the fixtures

`#pnprev` (Google) and `.gs_ico_nav_previous` (Scholar) only render past page 1, and the Google `flights`/`financial` sub-tabs are query-dependent — none appear on a `?q=svelte` page-1 capture, so the contract tests intentionally skip them rather than assert an absent control.
To cover them, capture a page-2 / matching query and extend the contract test.
