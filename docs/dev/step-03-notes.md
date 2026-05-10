# Step 3 — Minimal dispatcher with storage (Global only, no UI)

Implemented the data model from `docs/dev/step-02-data-model.md` as a small
library and wired it into the content script. Storage starts empty (no preset
bindings); rows are added via a **throwaway popup** (see "Popup detour" below)
or via devtools (`chrome.storage.local`) until the Step 4 options page lands.

## Module layout

```
src/lib/
  types.ts             KeyToken, Trigger, Scope, Action, Binding, Settings, ...
  log.ts               Prefixed logger (PII-shaped key content never logged — §10 S6)
  keys/
    canonical.ts       Non-printable name table; lookup + lower→canonical
    serialize.ts       (mods, key) → canonical KeyToken (§1.1, §1.4)
    parse.ts           Lenient string → canonical KeyToken (case/order-insensitive)
    normalize.ts       KeyboardEvent → KeyToken with IME guard (§1.5)
  actions/
    registry.ts        getAction / listActions over all scope modules
    global/scroll.ts   scroll.{down,up,pageDown,pageUp,toTop} with pred/defaults/meta
  storage/
    items.ts           bindingsItem (local:bindings), settingsItem (local:settings)
    loader.ts          loadBindings + loadSettings + clampOptions (§5.3 C案)
  dispatcher/
    trie.ts            compileTrie(bindings) → TrieNode (with conflicted leaves)
    dispatcher.ts      Dispatcher class: feed() returns "fired" | "consumed" | "passed"
```

## Key decisions held / bent

| Topic | Status | Notes |
|---|---|---|
| KeyToken canonical form | held | A-C-M-S, UpperCamel non-printables, Shift folding policy implemented as written. |
| Lenient parser | held | Case-insensitive inside `<…>`; out-of-order modifiers accepted; `<f12>` → `<F12>`. Now also rejects unknown multi-char names (e.g. `<C->` → `<C-(empty)>` that sneaks past the modifier regex). |
| IME guard | held | `event.isComposing \|\| event.keyCode === 229`. Biome happens not to flag `keyCode` as deprecated, so no suppression line was needed. |
| Storage shape | held | Single flat `Binding[]` at `local:bindings`; settings at `local:settings`. |
| §5.3 C案 (load == repair) | held | Project keys → clamp → predicate → drop or repair → write-back when changed. Triggers also canonicalised in the same pass (lenient `<c-j>` becomes canonical `<C-j>` and is written back). |
| `clampOptions` typing | bent slightly | Used `Math.min(Math.max(...))` to keep TS happy with the `O[keyof O]` constraint instead of stepwise mutation. Behavior unchanged; test still asserts the expected clamps. |
| Settings repair | bent | NaN / non-number → fallback (1000). Above-range → MAX. Below-range → MIN. Original draft had `!Number.isFinite` as the fallback gate; switched to `Number.isNaN` so `+Infinity` clamps to MAX rather than collapsing to fallback (matches the design intent of "nearest in-range value"). |
| Conflict policy | held | Same-trigger collisions tagged `conflicted: true` at compile; dispatcher logs + does not fire (so neither side's side-effects run, and the conflict is observable). |
| `preventDefault` minimality (S8) | held option (b) | Once mid-sequence the dispatcher claims the prefix; subsequent keys in the sequence are swallowed until fire/abort. First key of an unmatched sequence is **not** consumed — `feed()` returns "passed" at the root with no children-match. |
| `world: ISOLATED` | held | Pinned explicitly on `defineContentScript`. |
| Shadow-DOM activeElement | held | `deepActiveElement()` walks open shadow roots; closed-shadow false-negative documented in §10 S2. |
| iframe activeElement | held | Treated as editable (S3); top-frame-only matches Step 1 decision. |

## Verification

### Automated (passing)

- `pnpm test` — 51 tests across keys (parse / serialize / normalize), loader
  (project / clamp / repair / write-back), and dispatcher (trie compile,
  sequence consumption, timeout, conflict).
- `pnpm typecheck` — no errors. (Existing "no svelte input files" warning
  remains; expected until Step 4 introduces the options page.)
- `pnpm check` — biome clean.
- `pnpm build` and `pnpm build:firefox` — both succeed.

### Manual checklist (user)

Test as `pnpm dev` (Chrome) and `pnpm dev:firefox` (Firefox). The extension
ships **with no default bindings**, so add a row first — either via the
throwaway popup (toolbar icon) or via devtools:

```js
// In any tab's devtools (extension target):
chrome.storage.local.set({
  bindings: [{
    id: crypto.randomUUID(),
    scope: "global",
    triggers: [["j"]],
    actionId: "scroll.down",
    options: { amount: 100, smooth: false },
    enabled: true,
  }],
});
```

| Case | Expected |
|---|---|
| Storage edit takes effect without reload | Watcher rebuilds trie; pressing `j` scrolls. |
| Synthetic `dispatchEvent(new KeyboardEvent("keydown", {key:"j"}))` | Action does **not** fire (S1: `isTrusted` gate). |
| Focus inside open-shadow `<input>` | Action does **not** fire (S2). |
| Focus inside an iframe form | Action does **not** fire (S3). |
| `chrome.storage.local.set({ settings: { sequenceTimeoutMs: -1 } })` | Loader clamps to 100 and writes back; `getValue()` shows 100 next read. |
| Two bindings with the same trigger `["x"]` | Both rows present in storage, trie marks the leaf conflicted, dispatcher logs `[page-navigator] conflict — not firing` and the page receives the keystroke. |
| Multi-key sequence `["g","g"]` | First `g` is consumed; second `g` fires; if the user waits >1000ms after the first `g`, the prefix is dropped (and if `["g"]` was *also* bound, that single-`g` action fires on timeout). |

A small test page with an open shadow root + `<input>` is the easiest way to
reproduce the S2 case:

```html
<custom-input></custom-input>
<script>
class CustomInput extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: "open" }).innerHTML =
      `<input placeholder="type j here">`;
  }
}
customElements.define("custom-input", CustomInput);
</script>
```

## Popup detour

Mid-Step-3, devtools-only binding entry was painful enough that a deliberately
throwaway popup was added so the manual checklist could actually be exercised.
Step 4 will replace this with a real options page.

- `src/entrypoints/popup/{index.html,main.ts,App.svelte}` — Svelte 5 runes,
  ~200 lines total. Lists bindings (toggle / delete), add form (space-separated
  trigger + action `<select>` + Add), sequence-timeout numeric input.
- Trigger input parses through `parseTrigger()` so `j` / `g g` / `<C-j>` /
  `<c-J>` all canonicalise on save.
- Storage watchers keep the popup live-synced; when the popup writes, the
  content-script watcher rebuilds the trie.

Two issues surfaced and were fixed during use:

- **Missing `storage` permission.** WXT 0.20.25 did not auto-add it from
  `wxt/utils/storage` usage in this project, so MV3 silently dropped every
  read/write. Fixed by declaring `manifest.permissions: ["storage"]` in
  `wxt.config.ts`. (This means devtools-only edits in Step 3's "manual
  checklist" were also failing earlier — the checklist was rerun after the
  fix.)
- **Same-context watch did not fire** for the popup's own writes. After
  `setValue([A])` the popup's own `bindingsItem.watch` callback never ran, so
  `bindings` stayed `[]` and a second add resolved to `[...[], B]`,
  overwriting `A`. Fixed in `App.svelte` by switching add/remove/toggle to a
  read-modify-write pattern off `await bindingsItem.getValue()`, plus an
  immediate `bindings = next` for UI sync. (The cross-context case — popup
  writes, content script reads — works fine; only the writer's own watch was
  missing.)

## Carry-forward for Step 4 (options page)

- Action `meta` already encodes UI hints (`kind: "number" | "boolean" | "select"`,
  labels, ranges). The form generator should consume `meta` directly; the
  predicate already enforces shape and the loader already clamps numerics, so
  the form can lean on them rather than re-validating.
- Trigger input UX: tag-style. Each tag's "raw key capture" can call
  `normalize(event)` directly — that's exactly what produces canonical
  KeyTokens, so storing `[ ["<C-j>"], ["j"] ]` requires no UI-side parsing.
- Storage watch already drives live updates; the options page simply
  `setValue()`s and the content script picks it up.
- Conflict detection lives at trie-compile time (`leaf.conflicted === true`).
  When the warning UX arrives, expose this from `compileTrie` so the options
  page can render a badge per row.

## Open question for Step 4

The PLAN.md Step 4 entry asks whether the options page lives at the
`chrome://extensions` "Options" link, the toolbar icon, or both. The current
manifest (auto-generated by WXT from entrypoints) has neither yet — we'll
decide this when the entrypoint is added.
