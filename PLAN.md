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

**Open questions**:
- Do we want a separate "compiled" representation distinct from the storage representation, or is one shape sufficient?
- Should `options` carry per-action defaults at storage time, or be filled in at compile time from the action's schema?

---

### Step 3 — Minimal dispatcher with storage (Global only, no UI)

**Goal**: Implement the data model from Step 2 as a small library and wire it into the content script. Bindings are stored in `wxt/storage`; for now they're seeded from a hardcoded default and modifiable only via devtools / a one-shot script. **No options UI yet.**

**Tasks**:
- Implement key normalization module + unit tests (vitest, WxtVitest plugin).
- Implement action registry with ~5 scroll actions (`scrollDown`, `scrollUp`, `scrollPageDown`, `scrollPageUp`, `scrollToTop`).
- Implement binding store with `storage.defineItem('local:bindings', { version: 1, fallback: <default seed> })`.
- Implement dispatcher: subscribe to storage; on change rebuild key trie; on `keydown` walk the trie.
- Replace the hardcoded `if` ladder from Step 1.
- Edit-via-devtools sanity check: change a binding through the storage area, confirm content script picks it up live.

**Verify**: same manual walk-through as Step 1 plus: change a binding in Chrome devtools `chrome.storage.local`, verify it takes effect on next keypress without reload.

**Output**: `src/lib/` modules for normalize/registry/store/dispatcher. Unit tests for normalize + dispatcher trie. `docs/dev/step-03-notes.md` recording where the design held up and where it had to bend.

**Feedback checkpoint**: data model survived contact with code. Update Step 2 doc with corrections. Decide on Step 4 details.

---

### Step 4 — Minimal options page (Global only)

**Goal**: A working settings page that lists Global bindings and lets the user add / edit / delete one binding at a time. **Not the polished design mock** — a deliberately bare list, just enough to manage bindings without devtools.

**Tasks**:
- Define the options entrypoint: `src/entrypoints/options/index.html` + Svelte app (see WXT `entrypoints.md`).
- Open-in-tab mode (`<meta name="manifest.options_ui.open_in_tab" content="true" />`) so it's a full page, not a popup.
- List view: each row = `triggers | action | options`.
- Add binding: action picker = simple `<select>` with the ~5 actions (no fuzzy search yet — that's part of the deferred polish).
- Trigger input: tag-style multi-key input (the smallest version that works; capture key, render token, allow remove).
- Save → write to storage; content script reacts via storage watcher.
- Visual minimum: clean default style, no design system yet.

**Verify**: edit a binding via the options page, switch to a tab, confirm the new binding fires.

**Output**: `src/entrypoints/options/`, options-page Svelte components. `docs/dev/step-04-notes.md`.

**Feedback checkpoint**: review the options-page architecture. Decide: how much polish before introducing site-specific scope?

**Open questions**:
- The mock uses tag-style trigger input with auto key-capture. Is that the right interaction at this stage, or do we start with a text input and parse?
- Where does the options page live in the manifest — `chrome://extensions` "Options" link, browser toolbar icon, both?

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
