# page-navigator — Implementation Plan

> This document is the living implementation plan for the `page-navigator` browser extension. It is intended to live at the repository root as `PLAN.md` and be updated between steps. Each step has a feedback checkpoint; the next step may be rewritten based on what was learned.

---

## 1. Context

`page-navigator` is a keybinding-based page-navigation browser extension for Chrome **and Firefox** (full parity — Firefox is the author's daily driver, not a tier-2 target). The product is conceptually similar to Vimium and web-search-navigator: user-defined keys (single keys like `j` allowed; modifiers optional) trigger page actions (scrolling, focus, tab ops, site-specific navigation, etc.).

Two core models are fixed by the design prompt and treated as immutable internal contracts:

- **Binding model**: `1 binding = (trigger keys) × (action) × (options)`. The same action with different options is a separate binding. Triggers are sets of key sequences (so `j` and `ArrowDown` can both fire the same binding).
- **Scope model**: `Global` (always on) vs `Site-specific` (services defined by the extension, not by user). Site-specific match wins over Global on the same key.

A separate **design mock** exists (`.claude/page-navigator.zip`) and provides a directional UX picture, but **the internal data structure must be designed independently of the mock** (UI abstraction tools differ from code abstraction tools). The mock will be referenced for visual/interaction direction, not for data modeling.

### Working style

- Iterative. Each step has a clear scope, a verification step, and a feedback checkpoint with the user.
- This file is updated between steps as understanding sharpens.
- Claude does not autonomously execute multiple steps. The user directs each step; Claude implements within the step boundary.
- Tech-validation phases are expected mid-stream when an unknown comes up. Don't pretend they aren't needed.

---

## 2. Reference materials

Absolute paths so this is usable from a fresh session.

### This repo
- Design prompt: `/Users/ryota2357/ghq/github.com/ryota2357/page-navigator/.claude/page-navigator-design-prompt.md`
- Design mock zip: `/Users/ryota2357/ghq/github.com/ryota2357/page-navigator/.claude/page-navigator.zip` (extract to a tmp dir to inspect; the prototype is React + vanilla CSS, treat it as wireframes)
- Current scaffolding: `wxt-svelte-starter` template (Svelte 5.55, WXT 0.20). Starter demo files (Counter.svelte, popup, etc.) need to be cleaned up in Step 0.

### Cloned dependencies (read-only references)
- WXT framework: `/Users/ryota2357/ghq/github.com/wxt-dev/wxt`
- Vimium (architectural reference): `/Users/ryota2357/ghq/github.com/philc/vimium`
- web-search-navigator (per-site pattern reference): `/Users/ryota2357/ghq/github.com/infokiller/web-search-navigator`

### Key WXT docs to read before specific steps
| Topic | Path (relative to wxt repo) |
|---|---|
| Cross-browser targeting | `docs/guide/essentials/target-different-browsers.md` |
| Manifest config (auto MV2/MV3) | `docs/guide/essentials/config/manifest.md` |
| Browser API abstraction | `docs/guide/essentials/extension-apis.md` |
| Storage (defineItem, versioning, watchers) | `docs/storage.md` |
| Entrypoints (incl. options page) | `docs/guide/essentials/entrypoints.md` |
| Messaging (recommends @webext-core/messaging) | `docs/guide/essentials/messaging.md` |
| Content scripts | `docs/guide/essentials/content-scripts.md` |
| Unit testing (WxtVitest + fake-browser) | `docs/guide/essentials/unit-testing.md` |
| E2E testing (Playwright) | `docs/guide/essentials/e2e-testing.md` |
| Browser startup (web-ext, profiles) | `docs/guide/essentials/config/browser-startup.md` |
| Project structure | `docs/guide/essentials/project-structure.md` |
| Frontend frameworks (Svelte hash router etc.) | `docs/guide/essentials/frontend-frameworks.md` |

### Key Vimium files worth re-reading per step
| Topic | Path (relative to vimium repo) |
|---|---|
| Cross-browser manifest build | `make.js` (`createFirefoxManifest`, ~line 32–85) |
| Key normalization | `lib/keyboard_utils.js` |
| Handler stack pattern | `lib/handler_stack.js` |
| Mode + key state machine | `content_scripts/mode_key_handler.js`, `content_scripts/mode.js` |
| Command/action registry | `background_scripts/all_commands.js`, `background_scripts/commands.js` |
| Settings + migration | `lib/settings.js` |
| Exclusion (per-URL) rules | `background_scripts/exclusions.js` |
| Hint mode (deferred for now) | `content_scripts/link_hints.js` |

### Key web-search-navigator files
| Topic | Path (relative to wsn repo) |
|---|---|
| Per-site class registry | `src/search_engines.js` (esp. `getSearchEngine`, ~line 1545–1567) |
| `SearchResult` abstraction | `src/search_engines.js` (~line 37–82) |
| Optional-permissions per site | `src/manifest.json` (`optional_permissions`) and `src/options_page.js` |
| Default keybindings shape | `src/options.js` (`DEFAULT_KEYBINDINGS`, ~line 122–156) |

---

## 3. Initial design decisions (locked in for now)

From the prompt + clarifications gathered before this plan was written:

- **Concept model**: `binding = trigger × action × options`. Fixed. Same action × different options = separate bindings.
- **Scope model**: Global + Site-specific (extension-defined services). Fixed. Site-specific match wins on a given key.
- **Browser parity**: Chrome and Firefox are equal first-class targets. Build/dev for both must be working from Step 1.
- **Initial implementation explicitly defers**:
  - Hint mode (Vimium `f`-style) — separate later phase
  - Presets / Import-Export
  - Conflict warnings UI (the data model should still allow detecting conflicts, but the warning UX is later)
  - Site-specific scope: only **Google** initially
- **Visual direction**: high-density minimal (Linear / Raycast / Vercel dashboard style), no dark mode initially, design mock provides direction not pixel spec
- **Design changes from mock**: small accent / labeling adjustments only (per user); structural mock layout is acceptable as a starting point

### Tech-stack defaults (overridable later)
- **Framework**: continue WXT + Svelte 5
- **Storage**: `wxt/storage` with `storage.defineItem()` + version migration from v1
- **Messaging**: `@webext-core/messaging` (when needed; not Step 1)
- **Cross-browser manifest**: rely on WXT's auto MV3→MV2 conversion + `import.meta.env.FIREFOX` for runtime branches
- **Style**: plain CSS for now; revisit if it gets unwieldy
- **Formatter/linter**: Biome 2.4.13 (`biome.json`). `.svelte` covered partially via `html.experimentalFullSupportEnabled`; revisit if Svelte-aware tooling becomes necessary.
- **Testing**: vitest (WxtVitest plugin) for pure logic when introduced; Playwright e2e considered after Step 4 if it's worth the time investment

---

## 4. Steps

Each step has: **Goal**, **Tasks**, **Verify**, **Output**, **Feedback checkpoint**, **Open questions**. Steps after Step 5 are intentionally vague — we plan them when we get there.

### Step 0 — Hygiene & repo setup

**Goal**: Strip the starter template down to nothing demo-related, so Step 1 starts on a clean slate.

**Tasks**:
- Rename `package.json` `"name"` from `wxt-svelte-starter` to `page-navigator` (and `description`).
- Delete `src/lib/Counter.svelte`, `src/assets/svelte.svg`, the popup demo (`src/entrypoints/popup/*` content), and placeholder logic in `src/entrypoints/content.ts`, `src/entrypoints/background.ts`. Keep the entrypoint files but empty/minimal.
- Decide on formatter (prettier? biome?). Add config and a `pnpm format` script. (User decision)
- Confirm `pnpm dev` and `pnpm dev:firefox` both launch a blank extension successfully.
- Add a `docs/dev/` directory for per-step note files.

**Verify**: extension loads in Chrome and Firefox dev runs with no console errors and does literally nothing.

**Output**: clean repo, single commit. `docs/dev/step-00-notes.md` (≤ 1 paragraph).

**Feedback checkpoint**: agree the slate is clean before Step 1.

**Decisions made in Step 0**:
- Formatter: Biome 2.4.13 (config mirrored from `typfill`, with `.output`, `.wxt`, and `.claude/settings.local.json` excluded). Scripts: `format`, `check`, `check:write`.
- Popup: entrypoint deleted entirely. Re-introduce only when there's a concrete need (current design minimizes popup to toggle + settings link, which can come later).
- WXT auto-converts MV3 → MV2 cleanly for Firefox; no manual manifest branching required at this stage.

---

### Step 1 — Tech validation: cross-browser content script + key capture

**Goal**: Prove WXT can ship a content script to Chrome **and** Firefox that captures `keydown` reliably and dispatches a hardcoded action. **Internal data structure is intentionally postponed to Step 2.**

**Tasks**:
- Add a content script entrypoint that listens to `keydown` on `window` in capture phase (Vimium pattern, see `vimium_frontend.js:227–238`).
- Hardcode two actions: `j` → scroll down 100px, `k` → scroll up 100px. (No registry, no abstraction. Just an `if` ladder.)
- Don't fire when `document.activeElement` is an editable element (`input`, `textarea`, `[contenteditable]`).
- Don't fire when modifier keys are held (we want Cmd+J etc. to pass through).
- Manually verify on Chrome (`pnpm dev`) and Firefox (`pnpm dev:firefox`):
  - Regular pages: works
  - Pages with input focus: doesn't fire while typing
  - chrome://, about:, file:// pages: extension isn't injected (expected, document the limitation)
  - PDF viewer: document the behavior
  - iframes: document but don't try to fix (Step 2 territory)
- For Firefox dev load: WXT uses `web-ext`. If anything is annoying about persistent Firefox profiles or addon ID, document it now (see `docs/guide/essentials/config/browser-startup.md`).

**Verify**: open Chrome and Firefox; on `https://example.com`, `j`/`k` scroll. On a Google search page focused in the search box, `j`/`k` type letters (don't trigger).

**Output**: minimal content script, no abstraction. `docs/dev/step-01-notes.md` capturing:
- What worked in both browsers
- Any browser-specific quirks observed
- Anything WXT did automatically that we should know about

**Feedback checkpoint**: cross-browser baseline confirmed. Decide whether anything from Step 1 changes Step 2.

**Open questions**:
- Should the content script be `all_frames: true` from the start, or top-frame only? (Vimium uses all_frames; we may want to defer.)
- Do we want to keep the hardcoded code as a "smoke test" file separate from the real content script later?

**Decisions made in Step 1**:
- Frame scope: **top-frame only** (`all_frames: false`). iframe behavior deferred to Step 2 (data model) and beyond.
- Smoke-test file separation: kept hardcoded code directly in `content.ts`; revisit in Step 3 when the real dispatcher replaces it.
- Modifier-key handling at the listener boundary is intentionally crude (filter when `ctrl`/`meta`/`alt` held). Step 2 key-normalization design owns the real policy (`<c-j>` etc.).
- IME / `event.isComposing` and layout policy (`event.key` vs `event.code`) are **not** addressed in Step 1 — they're Step 2 design topics.
- Cross-browser parity confirmed: WXT's auto MV3→MV2 conversion + dedicated dev profiles per browser mean no manual branching was needed. No browser-specific quirks observed at this layer.

---

### Step 2 — Internal data model design (spike, no production code)

**Goal**: Settle on internal representations for trigger keys, actions, bindings, scopes, and storage — *without referring to the design mock's data shapes*. Output is a written design doc; **no implementation in this step**.

**Topics to think through (each gets a short section in the design doc)**:

1. **Key normalization**
   - What is a "key" internally? Vimium uses a string like `<c-x>` or `j`. Pros/cons of that vs. a structured object `{key, modifiers}`.
   - Layout-independence: `event.key` vs `event.code` (Vimium falls back per situation, see `lib/keyboard_utils.js`). What policy do we want?
   - Multi-key sequences: a binding's trigger is a sequence of normalized keys. Decision: are sequences a flat array `["g","g"]` or a string `"gg"` with parsing rules?
   - IME / dead keys: how to ignore composing input.

2. **Action registry**
   - Action = `{id, label, description, scope?: 'global'|'site:<id>', optionsSchema}`.
   - Options schema: number / boolean / select. Decision: schema-as-data vs schema-as-types.
   - Where actions live (a single static module? per-category modules?).
   - How an action is implemented (function in content script vs background; some need both).

3. **Binding & scope model**
   - Concrete shape: `{id, scope, triggers: KeyToken[][], actionId, options}`. Refine.
   - Storage layout: one big object vs per-scope items.

4. **Compiled dispatcher**
   - At runtime, bindings get compiled to a key trie for efficient sequence matching (Vimium's `installKeyStateMapping`).
   - Conflict resolution: when same trigger maps to multiple actions in the same scope (intentionally allowed by the model). Initial behavior: log + don't fire (matches design intent for the conflict warning later).
   - Site-specific resolver: how the content script knows which scope to use (URL match → service id → load that scope's bindings + Global; site-specific wins on overlap).

5. **Storage schema**
   - Use `storage.defineItem` with `version: 1` and migration support (`docs/storage.md`).
   - What's synced (`sync:` prefix) vs local? Vimium uses sync; WSN uses both.
   - What does "service id" look like and where is the service catalog defined? (Initially: a static module with `google` only.)

6. **Messaging boundaries**
   - Which actions need to live in the background (e.g. tab ops) vs content script (scroll, focus)?
   - When does the options page push changes, and how does the content script learn? (Vimium uses `chrome.storage.onChanged`; WXT's storage watchers do the same with nicer DX.)

**Output**: `docs/dev/step-02-data-model.md` — pseudo-types in TypeScript syntax + 1 paragraph rationale per decision. **No code in `src/`**.

**Feedback checkpoint**: User reviews the design doc. We iterate on it before Step 3 begins. This is where Claude's job is to lay out trade-offs clearly, not pick winners alone.

**Open questions** *(resolved in Step 2 — see decisions below)*:
- ~~Do we want a separate "compiled" representation distinct from the storage representation, or is one shape sufficient?~~ Compiled trie at load time; storage and runtime share one `Binding<O>` shape (§4.1, §3.1).
- ~~Should `options` carry per-action defaults at storage time, or be filled in at compile time from the action's schema?~~ Storage is always **resolved** (full options); load-time write-back fills in any new defaults from schema evolution (§5.3 C案).

**Decisions made in Step 2** (full reasoning + trade-offs in `docs/dev/step-02-data-model.md`):

- **KeyToken**: string canonical (`"j"`, `"<C-j>"`, `"<S-ArrowDown>"`); modifier letters uppercase, key names UpperCamelCase (DOM-aligned), modifier order alphabetical `A-C-M-S`. Parser is case-insensitive inside `<…>` so imports survive case mismatch; serializer always emits canonical.
- **Layout policy**: `event.key` always for v1; `event.code`-based opt-in deferred.
- **Sequence shape**: array `KeyToken[]` (not space-separated string). Display form is the only place strings appear.
- **Shift handling**: bare printable + Shift folds into the printable's case (`Shift+j` → `J`). Printable + Shift + another modifier keeps `<S->` and lowercases the printable (`Ctrl+Shift+j` → `<C-S-j>`); non-printable + Shift keeps `<S->` (`<S-Tab>`). Parser inside `<…>` is case- and order-insensitive (`<C-J>` = `<c-j>` = Ctrl+j; explicit `<C-S-j>` required for Ctrl+Shift+j).
- **IME guard**: `event.isComposing || event.keyCode === 229` (both — Safari `isComposing` bug requires the legacy fallback). Lint suppression for `keyCode` deprecation, with comment back to §1.5.
- **Options validator**: `@core/unknownutil` (jsr `4.4.0-pre.1`). Each action declares 3 small artifacts: `pred` (predicate / type source) + `defaults` + `meta` (UI hint). Range constraints live in `meta` and are enforced by a `clampOptions()` helper at storage load. pnpm handles JSR natively (`"jsr:4.4.0-pre.1"` in package.json, same idiom as `~/ghq/github.com/ryota2357/typfill`).
- **Action file layout**: per-scope colocation (`actions/global/*`, `services/<id>/actions.ts`).
- **Binding shape**: `{ id (UUID), scope, triggers: Trigger[], actionId, options: O, enabled }`. One scope per binding. Storage and runtime share the same shape — no `StoredBinding` / `Binding` split.
- **Storage layout**: single flat `Binding[]` at `local:bindings`; if/when this hurts, do **not** shard by `scope` (would be partitioning storage by a row field). Settings live separately at `local:settings`.
- **Storage area**: `local:` for Step 3; sync migration deferred to a later step.
- **Schema evolution**: load-time write-back (§5.3 C案). Loader projects onto current `defaults` keys, fills missing, clamps numerics, validates with predicate, drops corrupt rows, writes back if any repair happened (key set change OR clamp value change). The same code path is intentionally also the import code path.
- **Dispatcher**: compiled trie at load time; conflicts logged + dropped (don't fire); cross-scope is shadowing (site wins over global), not conflict.
- **Sequence timeout**: user-configurable global setting, default 1000ms, clamped to 100–60000ms at load. Stored in `local:settings`.
- **Messaging**: `@webext-core/messaging` introduced when the first background action lands; `storage.watch()` covers all push-direction needs until then.

**Security observations identified at design time** (§10 of design doc, S1–S5 mandatory for Step 3):
- **S1**: gate listener on `event.isTrusted === true` (page can `dispatchEvent` synthetic key events).
- **S2**: `isEditable()` walks open shadow roots via `deepActiveElement()`; closed-shadow false-negative documented.
- **S3**: treat `<iframe>` as activeElement as "editable / do not fire" (top-frame only; relaxes when `allFrames: true` arrives).
- **S4**: load == repair == import code path; harden against poisoned storage (re-validate, regenerate UUIDs on import, drop unknown actionId, range-clamp, strip extras).
- **S5**: pin `world: "ISOLATED"` explicitly (don't rely on default).
- **S6–S10**: forward-looking notes (no raw `KeyToken` in logs, sync privacy, `preventDefault` minimality, RPC sender re-validation, no dynamic predicate construction).

---

### Step 3 — Minimal dispatcher with storage (Global only, no UI)

**Goal**: Implement the data model from Step 2 as a small library and wire it into the content script. Bindings are stored in `wxt/storage`; for the duration of Step 3 they're modifiable only via devtools / a one-shot script. **No options UI yet.**

**Tasks** *(updated post-Step-2 decisions; refer to `docs/dev/step-02-data-model.md` for the full rationale)*:

- Add `@core/unknownutil` (`"jsr:4.4.0-pre.1"`) to `package.json`.
- **Key normalization module** + unit tests (vitest, WxtVitest plugin):
  - Canonical serializer (`A-C-M-S` order, UpperCamel inside `<…>`, Shift-folding into printable, non-printable Shift wrapping).
  - Lenient parser (case-insensitive inside `<…>`).
  - IME guard: `event.isComposing || event.keyCode === 229` (with a single biome-ignore line referencing §1.5).
- **Listener-side security gates** (§10 S1–S5):
  - Pin `world: "ISOLATED"` explicitly on `defineContentScript`.
  - Drop events with `event.isTrusted === false`.
  - `deepActiveElement()` walks open shadow roots; treat `<iframe>` as non-firable.
- **Action registry** with ~5 scroll actions (`scroll.down`, `scroll.up`, `scroll.pageDown`, `scroll.pageUp`, `scroll.toTop`). Each declares `{ pred, defaults, meta }` per §2.2; `clampOptions(opts, meta)` helper colocated with the loader.
- **Storage**: `storage.defineItem('local:bindings', { fallback: [], version: 1, migrations: {} })` and `storage.defineItem('local:settings', { fallback: { sequenceTimeoutMs: 1000 }, version: 1, migrations: {} })`. Empty fallback for bindings — no default keymap concept.
- **Loader** (`loadBindings()`, `loadSettings()`) per §5.3 C案: project onto current keys → clamp → predicate → drop or repair → write-back if changed.
- **Compiled-trie dispatcher**: build trie from loaded bindings; on `keydown` walk trie; honor sequence timeout from `local:settings`; conflict policy = log + don't fire; `preventDefault` only on leaf-fire (§10 S8).
- **Watchers**: `bindingsItem.watch(rebuildTrie)` and `settingsItem.watch(updateTimeout)` (separate so binding changes don't reset timer state and vice-versa).
- **Logging discipline** (§10 S6): log `bindingId` / `actionId` / `scope` / depth / timing; never `KeyToken` content.
- Replace the hardcoded `if` ladder from Step 1.
- Edit-via-devtools sanity check: add a binding via `chrome.storage.local`, confirm the content script picks it up live without reload.

**Verify**: same manual walk-through as Step 1, plus:
- Add a binding via Chrome devtools `chrome.storage.local`, verify it takes effect without reload.
- Synthetic `dispatchEvent(new KeyboardEvent("keydown", {key:"j"}))` from page console does **not** trigger any action (S1).
- Focus inside an open-shadow-DOM `<input>` does **not** trigger bindings (S2). Spec a small test page with a `<custom-element>` containing `mode: "open"` shadow root + input for this.
- Focus in an iframe does **not** trigger bindings (S3).
- Set `local:settings.sequenceTimeoutMs` to `-1` via devtools → loader clamps it to 100 and writes back.

**Output**: `src/lib/` modules for normalize / registry / store / loader / dispatcher. Unit tests for normalize, loader (project/clamp/repair), and dispatcher trie. `docs/dev/step-03-notes.md` recording where the design held up and where it had to bend.

**Feedback checkpoint**: data model survived contact with code. Update Step 2 doc with corrections. Decide on Step 4 details.

**Decisions made in Step 3** (full notes in `docs/dev/step-03-notes.md`):

- Module layout: nested under `src/lib/{keys,actions,storage,dispatcher}/`. Tests colocated (`keys.test.ts`, `loader.test.ts`, `dispatcher.test.ts`).
- Test setup: full WxtVitest + happy-dom + `wxt/testing/fake-browser`. 51 tests passing across keys / loader / dispatcher.
- Settings repair tweak: `Number.isNaN` (not `!Number.isFinite`) gates the fallback path, so `+Infinity` clamps to MAX rather than collapsing to default. Matches the design intent of "nearest in-range value" for the unbounded sentinels.
- Parser tightened: multi-character key names inside `<…>` must hit the canonical-name table. Catches `<C->` (regex backtrack quirk) instead of letting it through.
- `clampOptions` typing: switched from stepwise mutation to `Math.min(Math.max(...))` to satisfy the `O[keyof O] & number` constraint without an `as` cast.
- `world: ISOLATED` pinned explicitly on `defineContentScript` (S5).
- `manifest.permissions: ["storage"]` declared explicitly in `wxt.config.ts`. WXT 0.20.25 did not auto-add it from `wxt/utils/storage` usage; without it MV3 silently failed every read/write.

**Detours in Step 3** (out of scope, but happened):

- A throwaway popup (`src/entrypoints/popup/`) was added so the manual checklist could be exercised without `chrome.storage.local.set`. It will be replaced wholesale by Step 4's options page; the logic (`parseTrigger`, `bindingsItem`, `listActions()`) is reusable.

---

### Step 4 — Minimal options page (Global only)

**Goal**: A working settings page that lists Global bindings and lets the user add / edit / delete one binding at a time. **Not the polished design mock** — a deliberately bare list, just enough to manage bindings without devtools.

**Tasks**:
- Define the options entrypoint: `src/entrypoints/options/index.html` + Svelte app (see WXT `entrypoints.md`).
- Open-in-tab mode (`<meta name="manifest.open_in_tab" content="true">` — WXT wraps it under `options_ui` automatically) so it's a full page, not a popup.
- List view: each row = `triggers | action | options`.
- Add binding: action picker = simple `<select>` with the ~5 actions (no fuzzy search yet — that's part of the deferred polish).
- Trigger input: tag-style multi-key input (the smallest version that works; capture key, render token, allow remove).
- Save → write to storage; content script reacts via storage watcher.
- Visual minimum: clean default style, no design system yet.

**Verify**: edit a binding via the options page, switch to a tab, confirm the new binding fires.

**Output**: `src/entrypoints/options/`, options-page Svelte components. `docs/dev/step-04-notes.md`.

**Feedback checkpoint**: review the options-page architecture. Decide: how much polish before introducing site-specific scope?

**Decisions made in Step 4** (full notes in `docs/dev/step-04-notes.md`):

- **Trigger UX**: tag-style with key capture. Each tag is one `Trigger` (`KeyToken[]`); `+ Add` enters capture mode; keys accumulate via `normalize()`; ✓ / Enter commits, ✗ / Escape / click-outside cancels. Multi-key sequences supported per tag. Limitation: binding plain Enter / Escape via this UI is not exposed (storage edits still work; loader canonicalises).
- **Manifest placement**: `options_ui.open_in_tab=true` only. Throwaway popup deleted; toolbar icon left empty. Step 6+ "popup minimization" can re-introduce a popup later.
- **Auto-save** (no explicit Save button). Each mutation does a read-modify-write off `bindingsItem.getValue()`, sets it back, and updates local state synchronously (Step 3 popup-detour rationale still holds — the writer's own watch doesn't fire reliably).
- **Sidebar shape**: scope list with label + binding count; Global only today, structure already accommodates `site:*` for Step 5.
- **Action picker**: plain `<select>`, filtered by `isCompatibleScope(action.scope, binding.scope)`. Same predicate Step 5 will reuse / relax.
- **Options form**: generated from `action.options.meta`; resets to defaults on action change.
- **WXT meta name correction**: `manifest.open_in_tab` (not `manifest.options_ui.open_in_tab` as the original task list sketched). PLAN §4 task list updated above.

**Step-4 quirks to remember** (Biome + Svelte CSS):
- `scope=` on a Svelte component is misread by Biome's a11y rule as the HTML `scope` attribute; rename the prop instead of suppressing.
- `:global(...)` accepts one selector; split `html, body` into two.

---

### Step 5 — Site-specific scope (Google only)

**Goal**: Introduce the scope concept end-to-end with a single concrete service: Google search results.

**Tasks**:
- Extend the data model from Step 3 with scopes: `'global' | 'site:google'`.
- Implement a service catalog module (initially: `[{ id: 'google', urlPattern: /^https:\/\/www\.google\..+\/search/, label: 'Google' }]`). Pattern lookup borrows from web-search-navigator (`getSearchEngine`).
- Resolver: at content-script init, determine the active scope (Global always; site-specific if URL matches).
- Add 2-3 Google-specific actions: `focusNextResult`, `focusPrevResult`, `openResult`. Selectors live with the service module (per-site class pattern from web-search-navigator).
- Extend the options page with a sidebar (Global / Google), only the Global + matched-site bindings shown.
- Decide: optional permissions per site (web-search-navigator's pattern) vs default permission. Likely default for the MVP.

**Verify**: on Google search results, j/k navigates results (overrides the global scroll j/k). On other sites, j/k still scrolls.

**Output**: `src/lib/services/google.ts`, scope-aware dispatcher, sidebar in options page. `docs/dev/step-05-notes.md`.

**Feedback checkpoint**: sites-as-modules pattern feels right? Anything to revise before adding more services?

**Open questions**:
- Does the service module own the action *definition* or only the *implementation* (with defs in a central registry)? Affects how Step 6+ scales.
- How do we represent service-id in storage to keep migration sane when services are renamed/removed?

---

### Step 6+ — TBD per iteration

We'll plan these when we get there. Likely candidates (not ordered, not committed):

- More services (GitHub, YouTube, etc.)
- Conflict detection + warning UX
- Action picker upgrade (fuzzy search, descriptions, badges for site-specific)
- "Site keymap reference" view
- Presets + initial empty-state flow
- Import / Export JSON
- Hint mode (`f` to label clickables) — likely a big standalone phase
- Popup minimization (current state + open settings button)
- Polish pass on visual design
- Distribution prep: Chrome Web Store + Mozilla AMO submission
- E2E tests with Playwright

---

## 5. Tech-validation backlog (continuous)

Open questions that we should validate when they become relevant — not all at once.

- Firefox MV3 background script behavior (it's `scripts: []` not `service_worker`). Does WXT abstract this fully?
- Storage HMR during `wxt dev` — does the content script see live changes?
- Cross-frame messaging (iframes) — when does it actually matter for a navigator?
- Action dispatch boundary: which actions must run in background (tab ops) vs content script.
- IME / composition events — should `keydown` be ignored while `isComposing`?
- Keyboard layout sensitivity: `event.code` vs `event.key` policy. Re-read Vimium `keyboard_utils.js` when this matters.
- Per-site `optional_permissions` — needed for Google? GitHub? Probably for some, not all.
- Firefox AMO requires `data_collection_permissions` for new extensions submitted on/after 2025-11-03 (warned by `wxt build -b firefox`). Configure in `wxt.config.ts` before AMO submission; not blocking until distribution prep.

---

## 6. Per-step protocol

Between every step:

1. Append a short notes file at `docs/dev/step-NN-notes.md` recording: what was tried, what worked, what surprised. Keep it terse.
2. Update this `PLAN.md` (revise upcoming steps if learnings demand it).
3. User reviews before next step starts. Claude does not start the next step automatically.

Commit style at this stage: one commit per step is fine — message like `feat: done step N`. Don't try to carve "meaningful" sub-commits at this early stage; it's not worth the effort.

---

## 7. Things this plan deliberately does NOT decide yet

- The exact internal data shape (Step 2 produces it).
- Styling system (plain CSS unless it gets unwieldy).
- Testing depth (keep proportional to risk; pure logic gets unit tests, UI doesn't until it stabilizes).
- Distribution timeline.
- Whether the popup ever exists.
