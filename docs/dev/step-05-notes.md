# Step 5 — Site-specific scope (Google) + action picker modal

Introduced the scope concept end-to-end with `site:google` as the first
concrete service. Wired the content script to detect Google search pages,
shadow conflicting global triggers, and run Google-specific actions. The
options page sidebar gained a Site-specific section; the action `<select>`
was replaced by a modal picker that groups + filters compatible actions.

## Module layout

```
src/lib/
  actions/
    scope.ts             isCompatibleScope (Step 4's predicate, now relaxed)
    registry.ts          assembles scrollActions + googleActions
  services/
    catalog.ts           SERVICES, findService, isKnownServiceId,
                         resolveActiveScopes, resolveActiveService
    google/
      index.ts           google: Service definition (id, label, urlPattern)
      actions.ts         google.focus{Next,Prev}Result, google.openResult
      selectors.ts       findResultLinks() with selector-list probe
      highlight.ts       page-DOM CSS injection + class toggle (WSN-style)
  dispatcher/
    scope.ts             selectBindingsForScope (single-trie merge approach)
  storage/
    loader.ts            isValidScope now rejects unknown site:* against catalog

src/entrypoints/
  content.ts             resolves active service; merges + rebuilds on watch
  options/
    App.svelte           per-scope counts; default action picked per scope
    components/
      Sidebar.svelte     Global + Site-specific sections; configured-only
      Toolbar.svelte     scope label resolves through findService()
      BindingRow.svelte  modal trigger button replaces <select>
      ActionPickerModal.svelte  NEW — modal with search, grouped by scope,
                                right panel with description + options
```

## Key decisions

| Topic | Decision | Notes |
|---|---|---|
| Picker variant | Modal only | mock has inline / modal / palette; we ship the modal so the implementation cost stays one widget. The variant-toggle is a Step 6+ concern. |
| Site visibility | Configured-only (mock's `configured-only`) | Sites with ≥1 binding appear in the sidebar; the `+` button opens an "Available sites" sub-list to onboard a new site. With one service total, this is mostly structural — but the same shape lands the GitHub/YouTube cases later. |
| Google focus impl | `el.focus({ preventScroll: true }) + scrollIntoView({ block: 'center' }) + setHighlight(el)` | Closer to web-search-navigator than to Vimium's overlay-frame pattern. `document.activeElement` becomes the source of truth; we sync our `cursorIndex` from it so click/Tab don't desync. Native `:focus` outline is suppressed by Google's CSS on most result links, so `highlight.ts` injects a scoped `.pn-google-focused` rule (outline + `▶` arrow via `::before`) and toggles the class on each move. bfcache hazard handled: first `ensureStyles` after a module reload sweeps any straggler class from the previous lifecycle. |
| Scope compatibility | `actionScope === 'global' \|\| actionScope === bindingScope` | Step 4 carried-forward question. Relaxed: global actions can be bound on site scopes (`scroll.down` works inside a `site:google` binding). Site actions still only sit on their own site scope. Single predicate in `actions/scope.ts`. |
| Cross-scope precedence | Single-trie merge, exact-trigger shadow | `selectBindingsForScope` filters global triggers that exactly match a site trigger before compile. Prefix-overlap (site `j j` vs global `j`) is **not** shadowed — both remain and the dispatcher's leaf+children timeout disambiguates. Diverges from design-doc §4.4's "two tries" sketch; same observable behaviour for the "same trigger" rule with much less code. |
| Loader hardening | `site:<known-id>` only | `isValidScope` now consults the catalog. Orphan rows for removed services drop on load + write-back. New test covers both the accept path (`site:google`) and the drop path (`site:unknown`). |
| Catalog file name | `services/catalog.ts` | Per docs/dev/step-02-data-model.md §5.4 (vs. `index.ts`). `services/google/index.ts` exports the service def + actions array. |
| Active scope freezing | URL at init only | Content script doesn't re-resolve on SPA navigation. Google's SERP is a hard nav per query, so this is fine in practice; documented in content.ts. |
| `openResult` newTab path | Synthetic `MouseEvent('click', { ctrlKey, metaKey })` | Lets the browser apply its own modifier-click semantics (background tab, etc.) rather than us doing `window.open()`. |
| Modal categorisation | None — group by `action.scope` | Earlier draft introduced a `category` field on `Action` + a `categories.ts` module mirroring the mock. Removed at user request: with the current action set (2 categories anyway) scope grouping carries the same information. `Action.category` would have been carrying weight only the picker reads — leave it out until we have ≥3 categories within a single scope. |

## Edits / refactors outside the new files

- **`Sidebar.svelte`**: rewritten — added Site-specific section, configured-vs-available split, "+ Add a site" affordance. Step 4 stub structure made this drop-in.
- **`Toolbar.svelte`**: scope label resolves through `findService()` instead of printing the raw `site:google` string.
- **`App.svelte`**:
  - `bindingCounts` derived per scope (was hardcoded for `global`).
  - `defaultActionForScope` picks the first compatible action when adding a binding (so a "+ Add binding" in the Google scope starts with a Google-compatible action, not the first global one).
  - `globalActions` local constant removed (was Step 4 ergonomics, no longer needed).
- **`BindingRow.svelte`**: `<select>` replaced by a button + modal. The reset-to-defaults logic on action change is preserved; the `onActionChange` indirection was inlined into `pickAction`.
- **`loader.ts`**: `isValidScope` consults `isKnownServiceId` for `site:*` scopes.
- **`registry.ts`**: now spreads `[...scrollActions, ...googleActions]`.

## Snags / quirks

- **Biome's `{@const}` aversion**. Svelte allows in-template `{@const}`; Biome flags it as `noAssignInExpressions`. Two places (`Sidebar` site list, `ActionPickerModal` flat-index lookup) were refactored to pre-derive in the `<script>` block instead. Pattern: emit a typed array shape from `$derived` that includes every value the template would have computed.
- **`Action<unknown>.options.meta` indexes as `unknown`**. `OptionsMeta<unknown>` doesn't expose its variants via `Object.entries`. Projected through `Record<string, FieldMeta>` in `ActionPickerModal`'s `focusedMeta` derived; the per-field `kind` is then typed correctly. (Same issue would have hit Step 4's `OptionsForm` had it consumed meta from an unknown-typed action; it's fine there because it gets the concrete action's `options.meta` from the registry directly.)
- **Suppression comment churn for the scrim**. The scrim `<div>` has click+keydown handlers. Biome's `useKeyWithClickEvents` (a11y) no longer fires on Svelte attributes in this setup, so a `biome-ignore` line for it became an "unknown rule" warning. Final state: only the `<!-- svelte-ignore a11y_no_static_element_interactions -->` line stays — Svelte's own rule is the only one that fires here.
- **Single-trie merge limitation**. Documented in `dispatcher/scope.ts`: same-trigger shadow works; prefix-overlap doesn't (both bindings remain and disambiguate at runtime). Design-doc §4.4's "two-tries" plan would cover prefix-overlap too. Re-revisit if a real user case requires it.

## Verification

### Automated

- `pnpm test` — 60 tests (51 from Step 3/4 + 7 new in `dispatcher/scope.test.ts` + 2 new in `storage/loader.test.ts` for scope acceptance + drop).
- `pnpm typecheck` — no errors, no warnings.
- `pnpm check` — biome clean.
- `pnpm build` (Chrome MV3) — bundle 121 kB total, no warnings.
- `pnpm build:firefox` (Firefox MV2) — same shape; only the pre-existing AMO `data_collection_permissions` notice remains (tracked in PLAN.md §5).

### Manual checklist (user)

In Chrome: `pnpm dev`; in Firefox: `pnpm dev:firefox`. Open the options page from `chrome://extensions` / `about:addons`.

| Case | Expected |
|---|---|
| Sidebar: Global only (default) | Site-specific section shows "+ Add a site to override Global"; clicking expands the available list. |
| Add Google scope | Click "Google" in the Available list → page switches to Google scope; bindings list empty. |
| Add a binding on Google scope | "+ Add binding" → row appears with `google.focusNextResult` as the default action (first compatible). |
| Action picker modal | Click action button → modal opens; search filters across label / id / description / scope label; ↑/↓ navigate; Enter selects; Esc closes; clicking outside closes. |
| Picker grouping | On a `site:google` binding, modal shows two groups: "Global" + "Google". On a `global` binding, only "Global" is shown. |
| Right-panel details | Hovering / arrowing onto an action shows label + id + scope badge (if non-global) + description + options (key : kind = default). |
| Reset on action change | Pick a different action → options form re-renders with the new action's default values. |
| Configured-only sidebar | Once Google has ≥1 binding, it stays visible without "+ Add". Deleting the last binding hides it again until "+ Add" is reopened. |
| Live dispatch on Google | On `https://www.google.com/search?q=anything`: binding `j` → focus next result; `k` → focus prev; `Enter` (with `openResult`) → navigates. |
| Focused result is visually distinguished | Currently-focused result gets a blue 2px outline + a `▶` arrow on its left margin. Dark Google theme switches the colour. |
| Cross-scope shadowing | Global has `j` → scroll.down; Google has `j` → focus next. On Google: focus next fires; scroll.down does not. On non-Google: scroll.down fires. |
| Live update | Edit a Google binding via the options page; switch to a Google tab → new binding fires without reload. |
| Loader hardening | Manually set `chrome.storage.local.bindings` with a `scope: "site:unknown"` row → on next page load it's dropped + written back. |

## Carry-forward for Step 6+

- **Inline picker variant / palette variant**: scaffolding exists in the mock; current modal uses the same data shape (filtered + grouped actions), so swapping the chrome is a presentation-only change.
- **Action `category` field**: deliberately deferred. Add when a single scope's action set grows past ~7–10 items and grouping by scope alone isn't enough.
- **Prefix-overlap shadowing**: keep the single-trie merge until a user-reported case proves it wrong. If/when needed, the two-tries dispatcher sketched in §4.4 is the migration target.
- **SPA scope tracking**: content script captures the URL once at init. Google's SERP being a full nav per query means this is fine today; YouTube/GitHub will need URL-change tracking (popstate + a small router) before they can move from "open on this page" to "switch site mid-session".
- **`openResult` accuracy**: synthetic Ctrl+click works on Google but may not on every site once site catalog grows. A `window.open(el.href)` fallback is the next escape hatch.

## Open follow-ups (deferred, not blocking)

- Picker keyboard-nav doesn't yet auto-scroll the focused row into view on `↑`/`↓`. Acceptable while the list is short (< modal height); revisit when categories arrive.
- "Configured sites" recompute on every render. List length is tiny so unmeasurable; flag this if SERVICES grows past ~20.
- `findResultLinks()` selectors are best-effort. Google occasionally ships layout experiments that invalidate them; the selector list is the only thing to update when that happens.
