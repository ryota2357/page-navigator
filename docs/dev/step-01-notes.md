# Step 1 — Cross-browser content script + key capture

Hardcoded `j` / `k` → `window.scrollBy(±100px)` in `src/entrypoints/content.ts`.
Listener registered on `window` in capture phase (Vimium pattern). Suppressed when
`document.activeElement` is `<input>`, `<textarea>`, or contenteditable, and when
`ctrlKey` / `metaKey` / `altKey` is held (Shift is implicitly handled because it
changes `event.key` from `j` to `J`). No registry, no abstraction — single `if`
ladder, to be replaced in Step 3.

## Verification

Manually verified on Chrome and Firefox (`pnpm dev` / `pnpm dev:firefox`):

| Case | Result |
|---|---|
| Regular page (`example.com`): `j`/`k` scrolls | OK |
| Input/contenteditable focused: `j`/`k` types normally | OK |
| `Cmd+J` / `Ctrl+J` passes through to browser | OK |
| `chrome://`, `about:`, `file://`: not injected | OK (expected) |
| Built-in PDF viewer: as expected | OK |
| iframes: as expected (no special handling, observation only) | OK |

No browser-specific quirks observed. Both browsers behave identically with the
current minimal listener.

## What WXT did for us

- `pnpm dev` / `pnpm dev:firefox` launch each browser with a **dedicated dev
  profile**, so the user's normal extensions/profile aren't touched and don't
  interfere. No setup needed.
- MV3 → MV2 manifest conversion for Firefox is automatic
  (`background.service_worker` → `background.scripts`); no manual branching.
- `defineContentScript({ matches: ["<all_urls>"] })` produces the same
  `content_scripts` block in both manifests; `all_frames` defaults to false.

## Resolved open questions

- **Frame scope**: top-frame only (`all_frames: false`). iframe behavior is
  Step 2 territory.
- **Smoke-test file separation**: kept the hardcoded code directly in
  `content.ts`. Will reconsider in Step 3 whether any of it is worth retaining
  as a separate smoke-test entrypoint.

## Carry-forward for Step 2

- Modifier-key policy currently checks ctrl/meta/alt at the listener boundary.
  Step 2 design needs to decide whether modifiers belong in the **key
  normalization** layer (so a binding can opt-in to `<c-j>` etc.) instead of
  being filtered out unconditionally.
- IME / `event.isComposing` is **not** guarded yet. Step 2 normalization
  should decide the policy.
- `event.key` is used as-is. Layout-independence (`event.code`) policy is
  Step 2 territory (see Vimium `lib/keyboard_utils.js`).
