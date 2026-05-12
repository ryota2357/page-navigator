# TASK

Forward-looking notes: planned work, known bugs, and invariants worth carrying forward.

## Planned work

### Binding list redesign (mock-aligned)
- Row click enters edit mode; no auto-save while editing.
- "Done" button commits the row; "Cancel" discards.
- Hover indicator on the right edge is a drag handle (reorder), not a delete button. Delete moves to row-detail / context menu.
- The "+ Add binding" button moves next to the existing search input (the toolbar primary button is removed).

### Preferences page
- Move `sequenceTimeoutMs` out of the bindings page footer into a dedicated Preferences view.
- Add a force-disable URL pattern field: extension is off (no listener) on URLs matching any user-provided pattern.
- This is the natural home for future per-scope toggles, per-binding overrides, theme toggle, etc.

### Sidebar redesign
- Drop the SCOPE section header (only `global` lives there) and the special-cased "Global" row.
- Reshape "add a site" as part of a single unified scope list.
- See sidebar mock in the design spec for direction.

### Conflict reporting (UX)
- Detection is already a pure function on `Binding[]` (any two enabled rows in the same scope whose trigger sets overlap).
- Runtime stays "log + don't fire". Surface a per-row warning indicator and a top-level summary count.

### Enter as a bindable trigger
- The loader and dispatcher already handle Enter. The blocker is the trigger-capture UI, which reserves Enter for "commit".
- Likely fix: switch the capture chip to a two-step "press keys" → "click Confirm" interaction so Enter falls through to the normalizer.

## Known bugs

- `google.focusNextResult` / `focusPrevResult` are sometimes inconsistent. Root cause not yet identified — could be selector flakiness, cursor-sync drift, or focus-vs-scrollIntoView ordering. Add diagnostics before guessing.
- `google.openResult` triggers on Enter even when no binding for Enter exists. The page's own Enter handler is being invoked.
- Enter cannot be configured as a trigger from the options UI (see Planned work above).

## Won't do (deliberate non-goals)
- Hint mode (Vimium-style `f` to label clickables). Captured here so future planning skips it.

---

## Invariants to preserve

### Security gates (content.ts listener boundary)
1. **`event.isTrusted === true`** — drop synthetic page-dispatched key events. Otherwise any page can remote-trigger our actions, which becomes clickjacking-grade once tab ops or hint mode land.
2. **`deepActiveElement` + `isEditable`** — walk open shadow roots to find the real focused element; closed shadow roots remain unreadable (documented false-negative). Treat `<iframe>` activeElement as editable (top-frame only; relaxes when `allFrames: true` arrives).
3. **`world: "ISOLATED"`** — pinned explicitly on the content script. Don't rely on the WXT default. If a future action needs MAIN-world execution, inject a tightly-scoped `<script>` tag; do not switch the whole content script.
4. **`preventDefault` minimality** — only call it when a leaf fires OR we've explicitly claimed ownership mid-sequence. Unconditional swallowing lets a hostile page disable browser-level escape hatches (Esc, Ctrl+W, etc.).

### Logging policy
- **Never** log raw `KeyToken` values or `event.key` content. Keystrokes are PII-shaped — passwords mistyped outside `<input>`s land as keydowns the extension observes.
- Logs may carry `bindingId`, `actionId`, `scope`, sequence depth, timing, and counts. If a key category must be logged, redact (e.g. `"<printable>"`, `"<sequence-prefix>"`).
- No `eval` / `new Function`. The CSP forbids it, and predicates are static compositions of `is.X` calls — keep them that way even if a "user-defined action" feature is ever requested.

### Schema evolution: load = repair = import
- `loadBindings()` is the single boundary: project options onto current `defaults` keys (drops fields removed by updates, fills fields added by updates), clamp numerics against `meta`, validate against `pred`, drop unparseable rows, write back if anything changed.
- A future settings-import path should reuse this code path. That gives unknown-actionId drop, range clamping, extra-field stripping, and UUID hygiene for free.
- On import specifically: regenerate UUIDs on incoming rows rather than trusting them, so a crafted file can't overwrite an existing binding by ID match.

### Sequence timeout clamping
- Range `[100, 60000] ms`. Below 100 = unusable (drops prefix instantly). Above 60000 = trie state never resets (mild DoS). The loader clamps on read and writes the clamped value back.

### Storage layout
- Single flat `Binding[]` at `local:bindings`. Settings at `local:settings`. Two separate watchers so binding edits don't reset timer state and vice versa.
- If this ever hurts at scale, do NOT shard by `scope` — that's partitioning storage by a row field. Pick a storage-shaped split (write-bucket, LRU) instead.
- `local:` for now. Sync migration is deferred; the data shape is independent of storage area.

### Cross-scope precedence
- Site scopes shadow Global on **exact** trigger sequence match. Prefix overlap (site `gg` vs global `g`) is intentionally not shadowed — both bindings stay and the dispatcher's leaf+children timeout disambiguates at runtime.
- Implementation: `activeBindings(all, scopes)` strips matching global triggers before the trie compiler runs. Same-scope conflicts surface as conflicted leaves; the dispatcher logs and drops without firing.

### Key normalization
- `event.key` always for v1. `event.code` (layout-independent) is a future opt-in flag per binding.
- IME guard: `event.isComposing || event.keyCode === 229` (both — Safari has historically reported `isComposing: false` for true composition events, so the legacy `keyCode === 229` is the only reliable Safari signal).
- Modifier-only key presses produce no token.
- Canonical form: modifier letters uppercase (`<C-…>`), non-printable key names UpperCamelCase (`<ArrowDown>`), modifier order alphabetical (A-C-M-S). The parser is case-insensitive inside `<…>` so imports survive case mismatch; the serializer always emits canonical.
- Shift folding:
  - bare printable + Shift → fold into case (`Shift+j` → `"J"`)
  - printable + Shift + other modifier → keep `<S->`, lowercase printable (`"<C-S-j>"`)
  - non-printable + Shift → keep `<S->` (`"<S-Tab>"`)

### Adding things

**A new scope**
1. Add the id to `ScopeId` in `src/lib/action.ts`.
2. Create `src/lib/scopes/<id>/{index,actions,…}.ts`. `index.ts` exports `<id>Scope` (label + urlPattern) and `<id>Actions` (record).
3. Add the entry to `SCOPES` in `src/lib/scopes/index.ts` and spread the actions record into `ACTIONS`.
4. Action ids in the new scope should be prefixed `"<id>.actionName"` for display; the runtime ignores the prefix.

**A new option on an existing action**
- Add the field to the action's `defaults`, `meta`, and `pred`. Existing stored bindings pick up the new field's default on next `loadBindings()` — no migration needed.

### Quirks (small, but expensive to rediscover)

- **Svelte 5 `$state` proxies are not structured-cloneable.** `chrome.storage.set` serializes via `structuredClone` and throws `DataCloneError` (often silently — the watcher never fires and the in-memory chip just disappears). Call `$state.snapshot()` before writing a `$state`-derived object to storage.
- **Biome flags Svelte `{@const}` in templates** as assignment-in-expression. Pre-derive per-iteration values into a `$derived` array in `<script>` instead.
- **`manifest.permissions: ["storage"]` must be explicit in `wxt.config.ts`.** WXT 0.20.25 does not auto-add it from `wxt/utils/storage` usage; without it MV3 silently fails every read/write.
- **AMO requires `data_collection_permissions`** for new extensions submitted on/after 2025-11-03. Configure before AMO submission.

### When the first background action lands
- Wire `@webext-core/messaging` (WXT's recommendation). Add a `runtime: "content" | "background"` field on `Action`.
- The background handler must re-verify the sender's tab URL against the action's expected scope before executing. A tab can navigate mid-session via History API; a stale dispatcher in a former-Google tab should not be able to issue Google actions after navigating away.
