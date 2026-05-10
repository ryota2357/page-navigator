# Step 0 — Hygiene & repo setup

Stripped the `wxt-svelte-starter` demo down: removed `Counter.svelte`, the popup
entrypoint (`src/entrypoints/popup/*`), `src/assets/svelte.svg`, and `public/wxt.svg`;
emptied `content.ts` / `background.ts` to no-op stubs (`<all_urls>` match retained on
the content script). Adopted Biome 2.4.13 as the formatter/linter (config mirrored from
`typfill`, with `.output`, `.wxt`, and `.claude/settings.local.json` excluded), wired up
`format` / `check` / `check:write` scripts, and renamed the package to `page-navigator`.
Popup entrypoint deleted entirely per Step 0 decision.

## Verification

`pnpm build` (chrome-mv3) and `pnpm build:firefox` (firefox-mv2) both succeed. WXT
auto-converts the MV3 background `service_worker` to MV2 `background.scripts` for
Firefox without manual config.

## Notes for later

- Firefox emitted a warning: AMO requires `data_collection_permissions` for new
  extensions submitted on/after 2025-11-03. Not blocking now, but must be set in
  `wxt.config.ts` (`manifest.browser_specific_settings.gecko.data_collection_permissions`)
  before AMO submission.
- `pnpm typecheck` warns "no svelte input files were found" — expected after the demo
  cleanup; the warning will go away once Step 4 introduces the options page.
- `.svelte` files get partial Biome coverage via `html.experimentalFullSupportEnabled`
  (formatter + lint apply to the HTML/script segments). Not full Svelte-syntax aware,
  but enough at this stage; revisit if it bites.
