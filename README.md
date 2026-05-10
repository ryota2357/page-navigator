# page-navigator

A keybinding-based page-navigation browser extension for Chrome and Firefox.

User-defined keys (single keys like `j` allowed; modifiers optional) trigger page
actions: scrolling, focus, tab ops, site-specific navigation, etc. Bindings live
in two scopes — Global (always on) and Site-specific (services defined by the
extension); Site-specific wins on the same key.

> Status: under active development. See [`PLAN.md`](./PLAN.md) for the implementation roadmap and [`docs/dev/`](./docs/dev/) for per-step notes.

## Development

```sh
pnpm install
pnpm dev           # Chrome
pnpm dev:firefox   # Firefox
```

`pnpm check` runs Biome (lint + format check). `pnpm format` writes formatting fixes.
