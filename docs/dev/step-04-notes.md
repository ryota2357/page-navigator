# Step 4 — Minimal options page (Global only)

The throwaway Step-3 popup is gone. A real options page lives at
`src/entrypoints/options/`, opened in a full tab via
`<meta name="manifest.open_in_tab" content="true">`. Listing, adding,
editing, and deleting Global bindings now works without devtools, and the
content script picks up changes live via the Step-3 storage watcher.

## Module layout

```
src/entrypoints/options/
  index.html                       <meta name="manifest.open_in_tab" content="true">
  main.ts                          mount Svelte 5 app
  App.svelte                       owns state + storage RMW + watchers
  components/
    Sidebar.svelte                 scope picker (Global only for Step 4)
    Toolbar.svelte                 breadcrumb + "+ Add binding"
    BindingsList.svelte            empty state OR table-like list of rows
    BindingRow.svelte              trigger | action picker | options | row-actions
    TriggerInput.svelte            tag-style key capture
    OptionsForm.svelte             generates fields from action.options.meta
    SettingsSection.svelte         sequence-timeout numeric input
```

## Key decisions

| Topic | Decision | Notes |
|---|---|---|
| Manifest placement | `options_ui.open_in_tab=true` only | No toolbar icon yet — popup minimization is a Step 6+ item. Users open the page from `chrome://extensions` (Chrome) / `about:addons` (Firefox). |
| Trigger UX | Tag-style with key capture | Each tag = one `Trigger` (a `KeyToken[]`). `+ Add` enters capture mode; keys accumulate via `normalize()`; ✓ or Enter commits, ✗ or Escape cancels, click-outside cancels. Listener attached on `setTimeout(0)` so the click that opened capture isn't caught by the outside-click handler. |
| Multi-key sequences | Supported per tag | Pending sequence renders inline (e.g. `g g…`); commit produces one Trigger of length N. Step 3's dispatcher handled sequences already. |
| Reserved keys | Enter / Escape during capture | Used as commit / cancel gestures. Binding plain Enter or Escape via this UI isn't exposed; storage edits still work, and the Step-3 loader canonicalises them. |
| Auto-save | Every mutation calls `bindingsItem.setValue()` | No explicit "Save" button. Writes are durable, the content-script watcher rebuilds the trie, and the same-context state stays in sync via the Step-3 RMW pattern (popup detour). |
| Sidebar | Scope-list shape, Global only for now | Structure (`Array<{id, label}>` + count) accommodates site:* without rework when Step 5 lands. |
| Action picker | Plain `<select>` | PLAN §4 explicitly defers fuzzy/preset/categorised pickers to Step 6+. Action list is filtered by binding's scope (`isCompatibleScope`) — same predicate site:* will use later. |
| Options form | Driven by `action.options.meta` | `OptionsForm` dispatches on `meta.kind` (number / boolean / select). Defaults surface for fields the binding hasn't filled in yet (the loader will project on next read). |
| Action change | Resets options to new action's defaults | Carrying values across actions would produce shapes the predicate rejects, which the loader would then drop on next read — better to reset at the source. |

## Edits / refactors outside the new entrypoint

- **None to `src/lib/`.** The options page consumes the Step-3 surface unchanged: `bindingsItem` / `settingsItem`, `listActions()` / `getAction()`, `normalize()`, and the Step-3 `Action.options.meta` shape. The "carry-forward for Step 4" notes in `step-03-notes.md` predicted this and held.
- `src/entrypoints/popup/` removed wholesale. With it, the manifest no longer has any `default_popup` / `browser_action`.
- WXT manifest meta name is `manifest.open_in_tab`, not `manifest.options_ui.open_in_tab` as PLAN §4 originally sketched. WXT wraps the meta into the `options_ui` block automatically. PLAN §4 updated accordingly.

## Snags / quirks

- **`scope=` on a Svelte component triggers the `useValidAriaProps` HTML rule.** Biome interprets `<Toolbar scope={…}>` as the HTML `scope` attribute (used on `<th>`), even though it's a component prop. Renamed the prop to `currentScope` rather than suppressing.
- **`:global(html, body) { … }` does not parse.** Svelte's CSS scoping pragma takes one selector. Split into `:global(html), :global(body) { … }`.
- **`svelte-check` "no svelte input files" warning is gone.** Step 3 noted this was expected until an entrypoint introduced .svelte files; it's resolved now.
- **Svelte 5 `$state` proxies are NOT structuredClone-safe.** First version of the page silently dropped every commit: clicking ✓ closed the capture chip but no tag appeared, because BindingRow's `{ ...binding, triggers }` carried `$state` proxies up into App's `updateBinding`, which fed them straight into `bindingsItem.setValue()`. chrome.storage serializes with `structuredClone`, which throws `DataCloneError` on Svelte proxies. The write failed, the watcher never fired, the local state never updated. Fixed by snapshotting at the storage boundary: `$state.snapshot(updated)` in `updateBinding` before merging into the storage payload. **General rule for this project**: any payload going into `bindingsItem.setValue` or `settingsItem.setValue` must be plain (use `$state.snapshot` if it could carry component-owned reactive values).

## Verification

### Automated

- `pnpm test` — 51 tests across keys / loader / dispatcher (unchanged).
- `pnpm typecheck` — no errors, no warnings.
- `pnpm check` — biome clean.
- `pnpm build` (Chrome MV3) — `options_ui: { open_in_tab: true, page: "options.html" }` in `manifest.json`. ✔
- `pnpm build:firefox` (Firefox MV2) — same `options_ui` shape. ✔ (existing Firefox AMO `data_collection_permissions` warning unchanged from Step 3 — tracked in PLAN §5.)

### Manual checklist (user)

In Chrome: `pnpm dev`, then `chrome://extensions` → "Details" → "Extension options" opens the page in a new tab. In Firefox: `pnpm dev:firefox`, then `about:addons` → page-navigator → "Preferences".

| Case | Expected |
|---|---|
| Empty state | "No bindings yet" + a button that adds one. |
| Add binding | Row appears with empty trigger + first registered action selected + default options. |
| Tag-style trigger capture | `+ Add` chip → press `j` → `j` token chip; press another `j` → second alternative trigger. |
| Multi-key sequence | `+ Add` → press `g` → press `g` → press Enter → tag shows `g g`. |
| Modifier capture | `+ Add` → `Ctrl+Shift+J` → tag shows `<C-S-j>`. |
| Cancel capture | `+ Add` → press a key → press Escape → pending discarded; chip closes. |
| Click outside cancels | `+ Add` → click somewhere else on the page → pending discarded. |
| Action change resets options | Change action via `<select>` → options inputs re-render with new defaults. |
| Toggle + delete | "ON"/"OFF" toggles the row's enabled flag; "×" removes it. |
| Sequence-timeout setting | Change number; switch to a tab; multi-key timing reflects the new value. |
| Live sync | Edit binding via the options page; switch to a tab; new binding fires with no reload. |

## Carry-forward for Step 5 (site-specific scope)

- Sidebar already takes a list shape and a counts dict; adding `site:google` is a one-row append + a counts entry.
- `BindingRow.isCompatibleScope` is the single check that gates which actions appear in the picker. Step 5 needs to either keep the strict equality (`global` actions don't apply on site scopes) or relax it (Global actions also apply when on a site scope). Decide when site logic lands.
- `Toolbar.currentScope` is already a `Scope`, not a hardcoded string.
- `OptionsForm` doesn't care about scope; it consumes action meta directly.

## Open follow-ups (deferred, not blocking)

- Binding Enter / Escape via the UI: today the tag-style capture reserves them. Future "advanced trigger editor" (text-field that goes through `parseTrigger`) would close the gap.
- No explicit "Save" gesture / undo / dirty indicator. With auto-save, undo would need history retention; a polish-phase concern.
- Action picker is a plain `<select>`; description / category / fuzzy search live in Step 6+ per PLAN.
- Responsive layout: the grid columns are fixed-width; narrow viewports clip. Acceptable for a settings page; revisit if it becomes annoying.
