# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

A keybinding-based page-navigation browser extension for Chrome and Firefox, built on [WXT](https://wxt.dev/) + Svelte 5 (Manifest V3). User-defined keys (single or multi-key sequences, modifiers optional) trigger page actions.

## Commands

```sh
pnpm dev / dev:firefox   # run with HMR
pnpm build               # build:firefox for FF; pnpm zip to package
pnpm test                # vitest run; test:watch to watch; `pnpm test <file>` or `-t <name>` for one
pnpm typecheck           # svelte-check, NOT tsc
pnpm check               # Biome lint+format check (read-only)
pnpm format              # Biome format --write
```

`pnpm` only — `npm`/`npx` are unavailable here.

## Architecture

Two runtime contexts (content, background) + two HTML pages (options, popup), all sharing `src/lib/`. Path alias `@/` → `src/`.

**Keystroke pipeline** — `src/entrypoints/content.ts` (ISOLATED world, `<all_urls>`): resolves active scopes for the URL (fixed at init, no SPA re-scoping), loads/`watch`es bindings + settings, feeds capture-phase keydowns into a `Dispatcher`. The dispatcher (`src/lib/dispatcher/`) walks a `KeyToken` trie; `feed` returns `fired`/`consumed`/`passed` (only `passed` reaches the page). Multi-key disambiguation uses a timeout; same-trigger conflicts within a scope refuse to fire.

**Scopes & actions** (`src/lib/scopes/`) — a scope is `{ label, urlPattern, actions }`; `urlPattern: null` = always active (that's how `global` is a peer of site scopes). Cross-scope: site bindings shadow `global` on identical triggers (`scopes/active.ts`). Actions are defined via `defineAction` (`src/lib/action.ts`) with a typed `optionSchema`; they run in the page context.

**Background messaging** (`src/lib/background/`, `src/entrypoints/background.ts`) — tab/window/zoom/session ops that the content script can't do go through `sendMessage`; `BackgroundProtocolMap` (`messaging.ts`) is the typed contract, handlers in `handlers.ts`.

**Keys** (`src/lib/keys/`) — `KeyToken` is a branded string with a canonical form; `encodeKeyToken` is its only minter, `parse`/`isKeyToken` validate. A `Trigger` is `KeyToken[]`.

**Storage** (`src/lib/storage/`) — `defineStorageItem` wraps WXT storage with validate-and-repair, caching, and watcher fan-out. Items: `local:bindings`, `local:settings`.

**Shared UI** (`src/lib/ui/`) — Svelte primitives (Modal, SortableList, KeyCap, SearchInput, …) plus `theme.svelte.ts` (color-scheme) used by both pages; a change here can hit options and popup.

**Options UI** (`src/entrypoints/options/`) — Svelte 5 runes; `store.svelte.ts` holds the page state components read directly. Edits the same storage items the content script watches, so changes apply live. `conflicts.ts` is display-only conflict detection (distinct from the dispatcher's runtime conflicts).

**Popup UI** (`src/entrypoints/popup/`) — the toolbar popup: global enable + theme toggle and the active-scope readout for the current tab.

## Testing

Vitest + happy-dom, colocated `*.test.ts`. The non-obvious suite is the **selector-contract** tests (`src/lib/scopes/*/selectors.contract.test.ts`): they assert a scope's site selectors still hit real, checked-in HTML (`__fixtures__/`, refreshed by `pnpm fixtures` → `scripts/fixtures.ts`). Red = the site's markup drifted; re-capture and fix the selector.

## Conventions

- Runtime shape-checking of stored/imported data uses `@core/unknownutil` (`is.*`).
