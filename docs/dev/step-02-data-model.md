# Step 2 — Internal data model design (spike)

> **Status**: design **decided** post-review. Originally drafted with
> trade-offs and `Lean:` markers; user-reviewed and converged on the
> decisions captured in §7 ("Decisions log"). The trade-off discussion is
> retained inline so future-us understands *why* each path was picked over
> the alternatives. **No code in `src/`** — per PLAN.md §4 / Step 2, this
> file is the only deliverable.
>
> **Anti-scope**: design mock (`.claude/page-navigator.zip`) is **not** consulted
> in this step (per PLAN.md §1). Mock informs Step 4 UI, not the data model.

References used while drafting:
- Vimium (`/Users/ryota2357/ghq/github.com/philc/vimium`):
  `lib/keyboard_utils.js`, `content_scripts/mode_key_handler.js`,
  `lib/handler_stack.js`, `background_scripts/all_commands.js`,
  `background_scripts/commands.js`, `lib/settings.js`,
  `background_scripts/exclusions.js`.
- web-search-navigator (`/Users/ryota2357/ghq/github.com/infokiller/web-search-navigator`):
  `src/search_engines.js`, `src/options.js`, `src/main.js`, `src/manifest.json`.
- WXT docs (`/Users/ryota2357/ghq/github.com/wxt-dev/wxt/docs/...`):
  `storage.md`, `guide/essentials/messaging.md`,
  `guide/essentials/content-scripts.md`, `guide/essentials/entrypoints.md`,
  `guide/essentials/extension-apis.md`.

Carry-forward from Step 1 notes (`docs/dev/step-01-notes.md`): modifier policy,
IME / `event.isComposing`, and `event.key` vs `event.code` were deferred here.
All three are addressed in §1 below.

---

## §1. Key normalization

### 1.1 What is a "key" internally?

The atomic unit is what I'll call a **`KeyToken`** — the result of normalizing
one `keydown`. A binding's trigger is a sequence of `KeyToken`s.

**Option A — String token (Vimium style)**

```ts
type KeyToken = string;          // "j", "<c-j>", "<a-s-Left>", "<Esc>"
```

Vimium's `keyboard_utils.js` (`getKeyChar`, ~lines 34–96) folds modifiers
alphabetically (`a`, `c`, `m`, `s`) and wraps them in angle brackets. Plain
single-character keys stay bare.

| Pros | Cons |
|---|---|
| Trivial to store, log, render in the options UI as text. | Parsing is ad-hoc — the format *is* the schema. |
| Matches a 15-year-old idiom users already recognize from Vim/Vimium. | Edge cases (`<`, `>`, space, `+` literally) need escaping rules. |
| Trie/prefix lookup works on plain strings — fast and simple. | Less self-documenting than a structured object. |

**Option B — Structured token**

```ts
type KeyToken = {
  key: string;                   // "j", "ArrowDown", "Escape"
  mods: { ctrl?: true; alt?: true; meta?: true; shift?: true };
};
```

| Pros | Cons |
|---|---|
| Self-describing; no parser needed. | Slightly more verbose in storage and in code. |
| Trivially extensible (e.g. `usingCode: true` per token, see §1.2). | Equality/hashing for trie keys requires a canonical serialization anyway, so we end up serializing to a string at compile time. |
| Easier to type-check option-page UI input. | Two representations (object on the wire, string at runtime) doubles surface area. |

**Decision: Option A** — string `KeyToken`, with a single canonical
serializer/parser pair. Reasoning: (a) we end up needing the string form
anyway for the trie lookup, (b) one shape is easier to reason about than two.
Escaping rules for literal `<`, `>`, `+`, space are a small one-time cost.

#### Canonical form (decided)

- Modifier letters inside `<…>` are **uppercase** (vim convention):
  `<C-j>`, `<S-ArrowDown>`, `<A-x>`, `<M-Tab>`. Vimium uses lowercase; we use
  upper for vim familiarity / debug-log readability.
- Non-printable key names inside `<…>` use **UpperCamelCase** matching the
  DOM `event.key` values: `<Escape>` (not `<Esc>`), `<ArrowDown>`,
  `<PageDown>`, `<Tab>`, `<Enter>`, etc.
- **Printable keys inside `<…>` are always lowercase in canonical form**:
  `<C-j>`, not `<C-J>`. The case of a printable inside `<…>` carries no
  meaning — Shift is encoded as the explicit `<S->` modifier when paired
  with another modifier. (See §1.4 for the full Shift-folding policy and
  the asymmetry between bare and modified printables.)
- Bare printable keys are not wrapped: `j`, `J`, `?`, ` ` (space — see
  escaping rules below). For bare printables case **is** significant:
  `j` and `J` are distinct (`J` = Shift+j, see §1.4).
- Modifier order inside `<…>` is fixed at serialization: **`A`, `C`, `M`, `S`**
  (alphabetical, matching Vimium's `acms`). Lock it so equality on the
  serialized form is reliable.

#### Parser case-policy (decided)

The **internal canonical** form is the only one the dispatcher trie sees.
But the **import / parse** path (settings import JSON, future text format,
copy-pasted bindings) accepts **case-insensitive** content inside `<…>`:

| Input (parse accepts) | Canonical (after parse) | Means at runtime |
|---|---|---|
| `<S-J>` / `<S-j>` | `J` | Shift+j (no other modifier — Shift folded into printable case, see §1.4) |
| `<s-arrowdown>` | `<S-ArrowDown>` | Shift+ArrowDown (non-printable: Shift kept as modifier) |
| `<C-j>` / `<C-J>` / `<c-j>` / `<c-J>` | `<C-j>` | Ctrl+j (printable case inside `<…>` is **not** significant) |
| `<C-S-j>` / `<C-S-J>` / `<S-C-j>` | `<C-S-j>` | Ctrl+Shift+j (Shift on printable + other modifier: kept as `<S->`, printable lowercased) |
| `<S-Tab>` / `<s-tab>` | `<S-Tab>` | Shift+Tab |
| `<C-S-Tab>` / `<S-C-tab>` | `<C-S-Tab>` | Ctrl+Shift+Tab |
| `<c-A-tab>` | `<A-C-Tab>` | Ctrl+Alt+Tab (mods alphabetised, key UpperCamel'd) |

The serializer always emits canonical form; the parser is forgiving. This
means user-imported configs from other tools or hand-written JSON survive
case mismatches. Round-tripping (parse → serialize) always lands in canonical.

Rationale: canonical-on-output is needed for trie equality; lenient-on-input
is needed because import configs are user-authored.

### 1.2 `event.key` vs `event.code` (layout policy)

The trade-off is "**what the user sees**" (`event.key`) vs "**where the user's
finger is**" (`event.code`):

- `event.key === "j"` on a JIS layout is the same physical key as on QWERTY,
  but on AZERTY the same physical key gives `"j"` too — `key` is layout-aware.
- `event.code === "KeyJ"` always identifies the same physical key regardless
  of layout. But a binding written as `<KeyJ>` is hostile to read.

Vimium uses `event.key` by default and falls back to `event.code` only for
specific situations (`ignoreKeyboardLayout` setting, Mac+Alt to dodge symbol
mangling, Numpad keys) — `lib/keyboard_utils.js` ~lines 34–96.

**Option A — `event.key` always.**
Simplest. Hostile to non-Latin layouts (a Russian layout user can't bind `j`
without switching layout).

**Option B — `event.key` by default, `event.code` per-binding opt-in.**
Vimium-ish. Adds a flag on the binding (e.g. `useCode: true` or a token
prefix) to escape from the layout-dependent form when the user wants
"physical key".

**Option C — `event.code` always.**
Layout-independent for free, but the user-facing names (`KeyJ`, `BracketLeft`)
are jarring; the options UI would have to translate them back to "what you
typed" using a layout-sensitive lookup, which is exactly what we wanted to
avoid.

**Decision: Option A for v1, with the door open to B in a later step.** Most
likely users in scope are Latin-keyboard QWERTY users; deferring layout
escape-hatches keeps the model small. The compiler should still serialize
in a way that B can be added without a migration (e.g., reserve an optional
`raw: true` flag).

### 1.3 Multi-key sequence shape

A binding's trigger is a *sequence* (`gg`, `g h`, etc.) and a binding holds
one or more sequences (the "set of triggers" from PLAN.md §3).

**Option A — Sequence as flat array**

```ts
type Trigger = KeyToken[];        // ["g", "g"] or ["<c-w>", "h"]
type Triggers = Trigger[];        // multiple triggers per binding
```

**Option B — Sequence as space-separated string** (WSN style: `"z z"`,
`"ctrl+return"` — `src/options.js:122-156`)

```ts
type Trigger = string;            // "g g", "<c-w> h"
type Triggers = string[];
```

| | Array | String |
|---|---|---|
| Storage compactness | identical (array of strings) | identical |
| Parsing cost at boot | none | one `split(" ")` per binding (negligible) |
| Editing in UI | natural (one tag per token) | needs splitting in/out |
| Equality / dedup | array equality is annoying | string equality is free |
| Mistyping resistance | structural | structural after parse |

**Decision: Option A (array)** for the in-memory and storage representations,
**because the options UI is naturally tag-based** (Step 4 trigger input is
described as "tag-style multi-key input" in PLAN.md). String form is the
*display* form, not the storage form.

### 1.4 Modifier policy at the listener boundary

Step 1 unconditionally filters `ctrl`/`meta`/`alt` events. Step 2 needs to
decide whether modifier keys are part of the binding language.

**Option A — Modifiers always pass through to the normalizer**, and bindings
opt in via `<c-j>`. Browser shortcuts (`Cmd+T`) aren't bindings, so they
never match — but the listener still sees them. Risk: we accidentally
swallow a browser shortcut if we have a colliding binding. Mitigation:
never `preventDefault()` unless we found a match.

**Option B — Modifiers filtered at listener boundary** (Step 1 today). No
binding can ever use Ctrl/Cmd/Alt. Simple and safe; insufficient for the
design intent (the prompt explicitly mentions modifier keys are allowed).

**Decision: Option A.** Only call `preventDefault()` when we've matched and
fired. Modifier-bearing keystrokes that don't match any binding fall through
to the browser untouched.

#### `Shift` is special (decided)

Encoding rules — applied at the listener boundary when serializing a
keydown to canonical KeyToken:

| Key kind | Other modifier present? | Shift handling | Examples |
|---|---|---|---|
| Printable | No | **Fold into printable case** (no `<S->` wrapper) | `Shift+j` → `J`; `Shift+1` → `!` |
| Printable | Yes | **Preserve `<S->` modifier; printable lowercased** | `Ctrl+Shift+j` → `<C-S-j>`; `Alt+Shift+x` → `<A-S-x>` |
| Non-printable | (any) | **Preserve `<S->` modifier** | `Shift+Tab` → `<S-Tab>`; `Ctrl+Shift+Tab` → `<C-S-Tab>` |

Why the asymmetry on printables:
- **Bare printable** (no modifier): the case naturally encodes Shift
  (`j` vs `J`), and users expect `j` and `J` to be different bindings.
- **Printable + Ctrl/Alt/Meta**: the case of the printable inside `<…>`
  carries no meaning (vim convention). `<C-j>` and `<C-J>` are the same
  KeyToken. To explicitly want the Shift-bearing chord, use `<C-S-j>`.

Parsing (lenient — see §1.1 case-policy):
- Modifier letters case-insensitive: `<c-j>` = `<C-j>`.
- Modifier order doesn't matter: `<S-C-j>` = `<C-S-j>`.
- Printable inside `<…>` case-insensitive: `<C-J>` = `<C-j>`.
- Bare-Shift wrappers fold: `<S-J>`, `<S-j>` both → `J`.
- Bare-printable case **is** significant: `J` ≠ `j`.

This lets imported configs use any case / order without surprise, while
the canonical form is unambiguous.

### 1.5 IME / composing (decided)

Step 1 doesn't handle IME at all. Step 2 policy:

```ts
// Both checks are required — see notes below.
// biome-ignore lint/correctness/noDeprecatedApi: Safari isComposing bug, see comment
if (event.isComposing || event.keyCode === 229) return;
```

Why both:
- `event.isComposing` is the modern, standard API.
- `event.keyCode` is **deprecated** (lint/types may warn — silence locally
  with a focused biome ignore + comment).
- `event.keyCode === 229` is still required as a Safari fallback: Safari has
  historically reported `isComposing: false` for events that are actually IME
  composition events. The `229` keyCode marker is the only reliable signal
  there. Vimium relies on `keyCode === 229` only (`keyboard_utils.js:104-109`);
  we belt-and-braces both.

The lint suppression should carry a one-line comment pointing at this section
of the design doc (`docs/dev/step-02-data-model.md` §1.5), so future-us doesn't
"clean up" the legacy check.

### 1.6 Dead keys / non-printables

Out of scope for this step. The normalization layer must not crash on them
but treating them is a Step 6+ concern.

---

## §2. Action registry

### 2.1 Action shape (sketch — see §2.2 for the options field detail)

```ts
type Action<O = unknown> = {
  id: string;                          // "scroll.down", "google.focusNextResult"
  label: string;                       // "Scroll down" — for UI
  description?: string;                // longer help text
  scope: Scope;                        // where this action makes sense
  runtime: "content" | "background";   // see 2.4
  options: ActionOptions<O>;           // see 2.2 — { pred, defaults, meta }
  run: (ctx: ActionContext, opts: O) => void | Promise<void>;
};
```

Vimium's `all_commands.js` ships actions as plain objects with a `command`
name and a per-command options schema parsed from the user's `map` line. We
adopt that shape but with explicit TypeScript types and a 3-artifact options
field (validator + defaults + UI meta — see §2.2).

Note: `options` is required, not optional. An action with no options uses
an empty predicate (`is.ObjectOf({})`), empty defaults (`{}`), and empty
meta (`{}`). That keeps the registry uniform; no special-casing for "no
options" actions.

### 2.2 Options schema (decided: `@core/unknownutil`)

PLAN.md flagged this as open. Decision: use **`@core/unknownutil`**
(jsr:`@core/unknownutil@4.4.0-pre.1`) as the runtime validator, with type
inference from predicates. This is a different design point than zod/valibot —
unknownutil only validates "does this `unknown` match this shape" with full TS
narrowing; it does **not** do defaults, coercion, transforms, or pretty error
messages. That intentional minimalism fits our needs.

#### Per-action shape

Each action declares **three small artifacts** rather than one combined schema:

```ts
import { is, as, type PredicateType } from "@core/unknownutil";

// 1) Predicate (validator + type source)
const scrollDownOptionsPred = is.ObjectOf({
  amount: is.Number,
  smooth: is.Boolean,
});
type ScrollDownOptions = PredicateType<typeof scrollDownOptionsPred>;
// → { amount: number; smooth: boolean }

// 2) Defaults (typed against the predicate's output)
const scrollDownDefaults: ScrollDownOptions = {
  amount: 100,
  smooth: false,
};

// 3) UI metadata (labels, ranges — only what the form generator needs)
const scrollDownOptionsMeta: OptionsMeta<ScrollDownOptions> = {
  amount: { label: "Scroll amount (px)", min: 1, kind: "number" },
  smooth: { label: "Smooth scroll", kind: "boolean" },
};

const scrollDown: Action<ScrollDownOptions> = {
  id: "scroll.down",
  label: "Scroll down",
  scope: "global",
  runtime: "content",
  options: {
    pred: scrollDownOptionsPred,
    defaults: scrollDownDefaults,
    meta: scrollDownOptionsMeta,
  },
  run: (ctx, opts) => {
    // opts is typed as ScrollDownOptions thanks to Action<T>
    window.scrollBy({ top: opts.amount, behavior: opts.smooth ? "smooth" : "auto" });
  },
};
```

The `OptionsMeta<T>` shape is project-defined (small):

```ts
type FieldMeta =
  | { kind: "number";  label: string; description?: string; min?: number; max?: number; step?: number }
  | { kind: "boolean"; label: string; description?: string }
  | { kind: "select";  label: string; description?: string; options: string[] };

type OptionsMeta<T> = { [K in keyof T]: FieldMeta };
```

The `kind` in `FieldMeta` drives the form widget; the predicate (separately)
drives validation. We do **not** double-declare types because `OptionsMeta<T>`
is `keyof T`-keyed.

#### Why three artifacts, not one

zod-style "all-in-one schema" couples four concerns (type, default, validator,
UI hint) into one DSL. That's powerful but verbose, and forces our action
authors to learn the DSL even when the UI hint isn't needed yet. Splitting
into (predicate / defaults / meta) keeps each artifact tiny:

| Concern | Artifact | Notes |
|---|---|---|
| Runtime shape check | `pred` (unknownutil) | Used at storage load and import. |
| TS type | `PredicateType<typeof pred>` | Inferred — no double declaration. |
| Defaults | `defaults: Options` | Used for new bindings (UI prefill) + missing-field write-back (§5.3). |
| UI form hints | `meta: OptionsMeta<Options>` | Used by Step 4 form generator. |

Trade-offs we accept by using unknownutil:
- **No range validation in the predicate.** unknownutil checks "is a number" but
  not "≥ 1". `min`/`max` lives in `meta` and is enforced by the UI form +
  by a small `clampOptions(opts, meta)` helper at storage load. (zod would
  encode this in the schema; we accept the duplication for the simpler
  validator.)
- **No pretty error messages.** Acceptable: errors at storage load mean the
  data is corrupt — log + drop the row + use defaults is the right behavior,
  not user-facing messaging.
- **JSR-only publication, but pnpm handles JSR natively.** Add to
  `package.json` as `"@core/unknownutil": "jsr:4.4.0-pre.1"` (the same idiom
  already used in `~/ghq/github.com/ryota2357/typfill`). No shim, no
  vendoring needed.

### 2.3 Where do actions live?

**Option A — One `actions.ts` module.** Easy to grep, but grows quickly when
site-specific actions arrive in Step 5+.

**Option B — Per-category modules** (`actions/scroll.ts`, `actions/focus.ts`)
with a registry that imports them. More files, but clearer structure as the
catalog grows.

**Option C — Per-scope modules** (`actions/global/*.ts`,
`services/google/actions.ts`). Mirrors the scope model directly; site-specific
actions colocate with their selectors and URL patterns. **WSN groups
selectors+behaviors per site** (`src/search_engines.js` Google class).

**Decision: Option C.** The colocation argument wins for site-specific scope.
Global actions can either stay in one module (Option A inside C) or split by
category as they grow.

```
src/lib/
  actions/
    registry.ts            // assembles the registry from scope modules
    global/
      scroll.ts            // scrollDown, scrollUp, ...
  services/
    google/
      index.ts             // urlPattern, label, id
      actions.ts           // focusNextResult, ...
      selectors.ts         // private DOM selectors
```

### 2.4 Runtime location: content vs background

Some actions are content-script-only (scroll, DOM focus). Some need the
background (open/close tab, switch tab). Some are split (e.g., a scroll
action could announce itself, but no real reason to).

The `runtime: "content" | "background"` field on the action declares this.
Dispatcher in the content script either calls `run()` directly (content
actions) or sends an RPC (`@webext-core/messaging`) to the background
(background actions). See §6.

For Step 3, all five scroll actions are `runtime: "content"`. Background
actions arrive when tab ops do.

---

## §3. Binding & scope model

### 3.1 Concrete shape (decided)

```ts
type Scope = "global" | `site:${string}`;

// The same shape lives in storage and at runtime — no Stored/Resolved split.
// See §5.3 for the "missing field write-back" mechanism that makes this safe
// across schema evolution.
type Binding<O = Record<string, unknown>> = {
  id: string;                 // stable UUID, never reused
  scope: Scope;
  triggers: Trigger[];        // KeyToken[][] — multiple sequences per binding
  actionId: string;           // foreign key into the Action registry
  options: O;                 // FULL options for the action (no partials)
  enabled: boolean;           // soft-disable without deleting
};
```

Notes:
- `id` exists so the options UI can edit/delete a row stably without
  identifying it by trigger (which can change). Vimium doesn't have this
  because its config is text — we have a structured store and benefit from
  stable IDs. Generated as a UUID at create time; never reused.
- `enabled` is included (per the user's confirmation): the options page
  list will offer a per-row toggle so the user can soft-disable a binding
  without deleting and recreating it. Cost: one boolean per row.
- `options` is the **full, resolved** options bag. There is no
  `Partial<Options>` wire format — storage always holds a complete bag,
  consistent with the user-facing model that bindings are created via a
  form where every option is visible and confirmed. The single asymmetric
  case (extension update adds a new option to an action) is handled by §5.3
  C案, which writes the new default into the row at load time.

#### Why no separate `StoredBinding` type

Earlier draft of this doc proposed `StoredBinding` (with `Partial<options>`)
distinct from a runtime `Binding` (with `ResolvedOptions`). With the C案
write-back, the two become identical, so we collapse to one type. The
benefits of one shape:
- Reading a storage row in devtools tells you exactly what it does.
- No mental load remembering "is this the storage form or the loaded form".
- Validators (unknownutil predicates) work on the same shape on both sides
  of the boundary.

### 3.2 Where the scope lives

The `scope` field on the binding is authoritative. The binding lives wherever
its scope says it does (e.g., a `scope: "site:google"` binding never fires
outside Google).

Multi-scope bindings (one row applying to both Google and YouTube) were
considered. Vimium doesn't allow them; WSN doesn't; the prompt's model
`binding = trigger × action × options` doesn't include scope as a factored
dimension. **Decision: one scope per binding.** A user who wants the same
trigger on two sites creates two bindings.

### 3.3 Storage layout

**Option A — Single flat list.**

```ts
storage.defineItem<Binding[]>("local:bindings", { /* ... */ });
```

| Pros | Cons |
|---|---|
| Trivial. One read, one write, one watcher. | Every save rewrites the whole list (small, but feel-bad). |
| Works fine at MVP scale (~20–50 bindings). | Conflict resolution between scopes happens in the loader, not in the storage shape. |

**Option B — Per-scope items.**

```ts
storage.defineItem<Binding[]>("local:bindings:global", { /* ... */ });
storage.defineItem<Binding[]>("local:bindings:site:google", { /* ... */ });
```

| Pros | Cons |
|---|---|
| Content script can subscribe only to relevant scopes. | More moving parts; the watcher set is dynamic when services come and go. |
| Migration to/from a service is just deleting/renaming a key. | Cross-scope queries (the options page lists all bindings) re-aggregate. |

**Decision: Option A.** B is a premature optimization. Note for future-us:
**if A starts to hurt, B is *not* the next step** — splitting by `scope` would
be partitioning storage by a field that lives on the `Binding` itself, which
is a smell ("the storage layout encodes a property of the row"). If/when we
hit the wall we'll design something different (e.g. shard by something
storage-shaped like write-bucket or LRU, not by domain field).

### 3.4 Conflict detection (data only)

Conflict UX is deferred (PLAN.md §3). The data model needs to *detect*
conflicts though, so the future warning UI has something to render.

A conflict is two enabled bindings in the same scope whose trigger sets
overlap on at least one trigger sequence. The detector is a pure function
on `Binding[]` that returns `Array<{ a: BindingId; b: BindingId; trigger: Trigger }>`.

For the dispatcher's runtime behavior on conflicts, see §4.3.

---

## §4. Compiled dispatcher

### 4.1 Storage shape vs compiled shape (PLAN.md open question)

> *Do we want a separate "compiled" representation distinct from the storage
> representation, or is one shape sufficient?*

**Option A — One shape (storage shape used directly).** On every keystroke,
walk all bindings; for each one, walk its triggers; check if the typed prefix
matches. O(bindings × triggers × prefix). For ~50 bindings × ~2 triggers ×
~3 keys = 300 comparisons per keystroke. Fine in raw terms; ugly architecture.

**Option B — Compile to a key trie at load time.** Walk all bindings once
into a trie keyed by the serialized `KeyToken` strings. Each leaf points to
`{ bindingId, actionId, options }`. Dispatch is one trie walk per keystroke,
O(prefix length).

```ts
type TrieNode = {
  // direct match → fire
  leaf?: { bindingId: string; actionId: string; options: unknown };
  // prefix match → wait for next key (with timeout)
  children?: Map<KeyToken, TrieNode>;
};

type CompiledDispatcher = {
  trie: TrieNode;
  scope: Scope;     // for diagnostics
};
```

(`options: unknown` because the trie holds bindings for many different actions
with different `O` types; the action's predicate is run before invoking
`run()` and narrows it.)

| | One shape | Compiled trie |
|---|---|---|
| Performance | OK at MVP scale | Great |
| Complexity | None | Modest — ~50 lines |
| Prefix detection (`gg`) | Have to scan all triggers each step | Native — `node.children` says "more keys could complete this" |
| Maintenance | Lower today | Lower tomorrow when we add timeout, leader keys, etc. |

**Decision: Option B (compiled trie).** Prefix detection is the killer reason —
we need to know "is the user mid-sequence?" to decide whether to swallow the
key, and the trie answers that natively. Vimium does this in
`mode_key_handler.js` using a similar nested-mappings shape.

### 4.2 Multi-key sequence timing (decided)

When a sequence prefix matches, we have to decide: wait for the next key, or
fire after a timeout. Vimium uses a per-keystroke continuation in
`mode_key_handler.js`; WSN sidesteps it via Mousetrap.

Policy:
- A fixed timeout after a partial-prefix match. If a new key arrives within
  the window, extend the prefix and re-check. If the timeout elapses without
  reaching a leaf, drop the prefix.
- The timeout is **user-configurable as one global setting**, stored
  alongside bindings:

  ```ts
  storage.defineItem<{ sequenceTimeoutMs: number }>(
    "local:settings",
    { fallback: { sequenceTimeoutMs: 1000 }, version: 1, migrations: {} },
  );
  ```
- **Default: 1000 ms.**
- **Allowed range: 100 ms – 60000 ms.** Loaded values are clamped to this
  range at read time (same hardening as bindings — see §10 S4). Out-of-range
  values from poisoned storage / imports become the nearest in-range value
  and are written back. `0` or negative would mean "drop prefix immediately"
  → unusable; absurdly large values mean "trie state never resets" → mild
  DoS. The clamp eliminates both.
- Not per-scope, not per-binding — confirmed YAGNI for now. If anyone ever
  asks for per-scope, that's a Step 6+ extension.

The settings item is a separate storage key from `bindings` so the bindings
watcher fires only on binding changes (and vice-versa). Both watchers are
cheap, but separating them avoids unnecessary trie rebuilds when only the
timeout changes. Each storage item has its own load-time hardening function
(`loadBindings()` for bindings, `loadSettings()` for settings); both follow
the §5.3 "load == repair == import" pattern.

### 4.3 Conflict resolution at runtime

PLAN.md §4 Step 2 already states the policy: "log + don't fire". Concretely:

- Compile time: when two bindings in the same scope produce a leaf at the same
  trie path, record both and mark the leaf as "conflicted".
- Dispatch time: on a conflicted leaf, log to `console.warn` (with binding IDs
  for debugging) and **do not fire either action**. Pass the keystroke through.

This differs from Vimium's "first-write-wins silently" (`commands.js:343-346`)
and is intentional — we want users to notice conflicts so they fix them,
which lays the groundwork for the warning UX later.

Cross-scope is *not* a conflict: site-specific wins over global on the same
trigger by design (PLAN.md §1).

### 4.4 Scope resolver

At content-script init:

```ts
function resolveActiveScopes(url: string, services: Service[]): Scope[] {
  const matched = services.find(s => s.urlPattern.test(url));
  return matched ? ["global", `site:${matched.id}`] : ["global"];
}
```

The dispatcher loads bindings for each active scope and compiles **two
tries**, then dispatches in priority order (site-specific first, global
second). Cross-scope "shadowing" is the explicit behavior; it isn't a
conflict.

URL pattern shape: WSN uses regex (`urlPattern: /^https:\/\/(www\.)?google\./`).
**Lean**: same — regex per service, defined alongside the service module.

### 4.5 Frame scope

Step 1 decided top-frame only. The dispatcher should not assume `window.top
=== window`; if we add `allFrames: true` later, the resolver runs per-frame
with the iframe's URL, and the scope might differ from the top frame.
Documenting now to avoid baking the assumption in.

---

## §5. Storage schema

### 5.1 Item layout

Per §3.3, one item:

```ts
import { storage } from "wxt/storage";

// Per the user's clarification: this extension has no concept of
// "default keymapping". A fresh install starts with an empty bindings list;
// the user adds bindings via the options UI, where each option is shown with
// its action-defined default value as the form's initial value.
export const bindingsItem = storage.defineItem<Binding[]>(
  "local:bindings",
  {
    fallback: [],     // empty — no preset bindings
    version: 1,
    migrations: {
      // (none yet; placeholder so the migration plumbing exists from day one)
    },
  },
);
```

`storage.defineItem` is the WXT-recommended path and gives us:
- A typed get/set/remove API.
- A built-in watcher (`bindingsItem.watch(cb)`) for live updates.
- Versioned migrations (synchronous, run lazily on first access).

### 5.2 Sync vs local

| | Vimium | WSN | Notes |
|---|---|---|---|
| User bindings | `sync` | `sync` | Both default to sync. |
| Per-device transient state | n/a | `local` (last query, last focused index) | Only relevant if we add such state. |

WXT-cited limits: `sync:` is browser-quota-bound (~100KB per item, ~10MB
total typical), `local:` is effectively unlimited.

**Decision: `local:` for Step 3.** Migrations are cheap to write later;
commitment to sync brings quota-management overhead we don't yet need.
When/if multi-device sync becomes a user need, we move with a one-shot
migration (`local:bindings` → `sync:bindings`, clear local). The data
shape itself is independent of the area.

Note on §3.3: the "if we hit the wall, splitting per scope is wrong" rule
also applies here — we wouldn't fix a `sync:` quota issue by per-scope
sharding either.

### 5.3 Schema evolution: missing-field write-back (decided: C案)

**Premise correction**: this section in the earlier draft conflated two
unrelated concerns. To clarify:

- **(a) Per-binding option defaults** at *user creation time* are not a
  concern of the data model — they are a UI concern. The options page form
  prefills the action's default values; the user reviews and confirms; the
  saved row contains the full resolved options. Storage is always complete.
- **(b) Schema evolution** is what this section is actually about. When the
  extension is updated and `Action.scrollDown` gains a new option `smooth`,
  existing user bindings in storage have no `smooth` field. What happens?

#### Decision: C案 — load-time write-back

```ts
async function loadBindings(): Promise<Binding[]> {
  const stored = await bindingsItem.getValue();         // possibly missing or extra fields
  const repaired: Binding[] = [];
  let didRepair = false;

  for (const row of stored) {
    const action = actionRegistry.get(row.actionId);
    if (!action) {
      // Action removed by an update — drop the row, log it.
      console.warn(`Dropping binding ${row.id}: unknown actionId ${row.actionId}`);
      didRepair = true;
      continue;
    }

    const rowOpts = (row.options ?? {}) as Record<string, unknown>;
    const defaults = action.options.defaults as Record<string, unknown>;

    // 1) Project rowOpts onto the keys the action *currently* declares
    //    (drops fields removed by updates), then fill missing keys from
    //    defaults (handles fields added by updates).
    const allowedKeys = Object.keys(defaults);
    const projected: Record<string, unknown> = {};
    for (const k of allowedKeys) {
      projected[k] = k in rowOpts ? rowOpts[k] : defaults[k];
    }

    // 2) Range-clamp numeric fields against meta (defends against poisoned
    //    storage / imported configs — see §10 S4). Mutates `projected`.
    clampOptions(projected, action.options.meta);

    // 3) Validate shape with the action's predicate. On failure, drop.
    if (!action.options.pred(projected)) {
      console.warn(`Dropping binding ${row.id}: options failed predicate`);
      didRepair = true;
      continue;
    }

    // 4) Detect repair: did *any* of (a) keys dropped, (b) keys added, or
    //    (c) values changed (e.g. clamp adjusted a number) actually happen?
    //    Length-only or key-set-only checks miss the "value changed by clamp"
    //    case, leaving poisoned values in storage forever.
    const beforeKeys = Object.keys(rowOpts);
    const sameShape  = beforeKeys.length === allowedKeys.length
                    && beforeKeys.every(k => k in projected);
    const sameValues = sameShape
                    && allowedKeys.every(k => Object.is(rowOpts[k], projected[k]));
    if (!sameValues) didRepair = true;

    repaired.push({ ...row, options: projected });
  }

  if (didRepair) await bindingsItem.setValue(repaired);   // write back canonicalised data
  return repaired;
}
```

Properties:
- Storage is **always** in canonical/complete form after the first load
  following an update. Devtools inspection shows the real values.
- New options added by an update silently take effect with their declared
  defaults — the same value the UI form would have prefilled, so no surprise.
- Removed options are stripped on the next load (step 1 in the example),
  not deferred to "next save".
- Extra/unknown fields in storage are stripped (they're simply not in
  `allowedKeys`). This matters for poisoned imports — see §11 S4.
- Range-clamping happens before predicate check; predicate guarantees shape,
  clamp guarantees values.
- Corrupt rows (predicate fails after merge) are dropped, not propagated.
  Logging is to `console.warn` for now; later steps may surface to a UI.

Notes:
- `bindingsItem.setValue(...)` returns a Promise; the loader is `async`.
- `clampOptions(opts, meta)` is a small helper: walks `meta`, for each
  `{ kind: "number", min, max }` field clamps `opts[k]` to range. Defined
  in the same module as the loader.

#### Why not A案 (require an explicit migration on every option add)

Per-action option additions are too small a unit to warrant a migration each
time. Forcing a migration would slow down adding new options to existing
actions in Step 6+. C案 makes the merge implicit and is the same code path
we'd have written *inside* every migration anyway.

#### Why not B案 (storage stays partial, never written back)

It's the simplest to write but leaves storage in a state where what you see
in devtools doesn't match what the dispatcher uses. The user explicitly
wants storage to be the resolved value. C案 gives that property without
requiring per-update migrations.

### 5.4 Service catalog

Static module, not in storage:

```ts
// src/lib/services/catalog.ts
import { google } from "./google";
export const SERVICES = [google] as const;
export type ServiceId = (typeof SERVICES)[number]["id"];
```

Each service module exports `{ id, urlPattern, label }` (and its actions /
selectors). Adding a service is a code change, not user data — matches the
PLAN.md decision that services are extension-defined, not user-defined.

### 5.5 Migrations

`version: 1` from day one, even with no migrations defined. Keeps the
plumbing in place so the first real schema change doesn't have to retrofit
versioning. (WXT defaults the previous version to `1` if missing — see
`storage.md:160-298` — but explicit is friendlier.)

Migration philosophy:
- Pure data transforms. No DOM, no async I/O.
- Each migration handles only the previous-version → next-version step.
- If a migration encounters genuinely unmappable data, drop the row and log
  rather than throwing — losing one binding is recoverable; refusing to load
  is not.

---

## §6. Messaging boundaries

### 6.1 What needs the background?

Pre-MVP catalog (anticipated, not all in Step 3):

| Action | Runtime | Why |
|---|---|---|
| `scroll.*` | content | DOM only. |
| `focus.*` | content | DOM only. |
| `tab.next` / `tab.prev` / `tab.close` / `tab.new` | background | `browser.tabs.*` is background-only. |
| `google.focusNextResult` etc. | content | DOM only. |
| `history.back` / `history.forward` | content | `window.history` is fine. |
| `hint.*` (deferred) | content | DOM. |

**Step 3 is content-only.** Background entrypoint stays empty until tab ops
arrive.

### 6.2 RPC vs storage watcher

Two things flow between contexts:

1. **Settings change → content script.** Push direction. `storage.watch()`
   on `bindingsItem` is sufficient — no RPC needed.
2. **Content script → background, "do this action".** Request/reply.
   `@webext-core/messaging` (WXT's recommendation) gives us a typed RPC
   schema with one definition file used by both sides.

For Step 3, neither (1) nor (2) is wired:
- (1) is just `bindingsItem.watch(rebuildTrie)` inside the content script.
- (2) doesn't exist yet because all actions are content-runtime.

**Decision**: hold off on `@webext-core/messaging` until the first background
action lands. Adding it then is a 30-line change.

### 6.3 Live update during `wxt dev`

WXT docs (`content-scripts.md`) confirm: content scripts **do not HMR**
unless they're an `IframeUi`. Page refresh required after a content-script
edit. `storage.watch` itself works fine in dev — change a value via devtools
or the options page and the watcher fires without reload.

For the Step 3 "edit a binding via devtools, see it take effect live"
verification, this is exactly what we want.

---

## §7. Decisions log (post-review)

After review, all items are now decided. Recording the lean → decision
trail so Step 3 doesn't have to re-derive them.

| # | Topic | Decision |
|---|---|---|
| 1 | §1.1 KeyToken shape | **string** (canonical: UpperCamel inside `<…>`, uppercase modifier letters `<C-…>`/`<S-…>`, mod order A-C-M-S alphabetical) |
| 2 | §1.2 Layout policy | **`event.key` always for v1**; `useCode` flag reserved for later |
| 3 | §1.3 Sequence shape | **array** (`KeyToken[]`); string is display-only |
| 4 | §1.4 Shift handling | **bare printable + Shift**: fold into case (`J`). **printable + Shift + other mod**: keep `<S->`, lowercase printable (`<C-S-j>`). **non-printable + Shift**: keep `<S->` (`<S-Tab>`). Parser: case-insensitive inside `<…>` for both modifiers and printables (so `<C-J>` = `<C-j>` = Ctrl+j) |
| 5 | §1.5 IME | **`isComposing || keyCode === 229`** (both — Safari fallback) |
| 6 | §2.2 Options validator | **`@core/unknownutil` (jsr 4.4.0-pre.1)**; per action: `pred + defaults + meta` |
| 7 | §2.3 Action file layout | **per-scope colocation** (`actions/global/*`, `services/<id>/actions.ts`) |
| 8 | §3.1 `enabled` field | **included** |
| 9 | §3.2 Scope per binding | **single scope per binding** |
| 10 | §3.3 Storage layout | **single flat `Binding[]`**; if it ever hurts, do NOT shard by scope |
| 11 | §4.1 Compiled vs storage | **compiled trie at load time**; storage is `Binding[]` |
| 12 | §4.2 Sequence timeout | **user-configurable global setting**, default 1000ms, in `local:settings` |
| 13 | §4.3 Conflict policy | **log + don't fire** (cross-scope is shadowing, not conflict) |
| 14 | §4.4 URL pattern | **regex**, defined in service module |
| 15 | §5.2 Storage area | **`local:`** for Step 3; sync migration deferred |
| 16 | §5.3 Schema evolution | **C案: load-time write-back** — storage always resolved |
| 17 | §6.2 Messaging | **`@webext-core/messaging`** introduced when first background action lands |

Security observations (§10) are part of the design contract too —
items S1–S5 are mandatory for Step 3; S6–S10 are forward-looking notes.

---

## §8. Summary of the proposed shape (for skimming)

```ts
import { is, as, type Predicate, type PredicateType } from "@core/unknownutil";

// === keys ===
// Canonical string form. Examples:
//   "j", "J", "?"            — bare printable; Shift folds into case
//   "<C-j>"                  — Ctrl+j; printable lowercased; case inside <…> not significant
//   "<C-S-j>"                — Ctrl+Shift+j; explicit <S-> when paired with another modifier
//   "<S-Tab>", "<C-S-Tab>"   — non-printable: Shift always kept as modifier
// Modifier letters uppercase, modifier order A-C-M-S (alphabetical),
// non-printable key names UpperCamelCase. Parser inside <…> is case-
// and order-insensitive: "<c-J>" parses to "<C-j>", "<S-C-tab>" → "<C-S-Tab>".
type KeyToken = string;
type Trigger  = KeyToken[];                      // ["g", "g"]

// === scopes ===
type Scope = "global" | `site:${string}`;

// === actions ===
type FieldMeta =
  | { kind: "number";  label: string; description?: string; min?: number; max?: number; step?: number }
  | { kind: "boolean"; label: string; description?: string }
  | { kind: "select";  label: string; description?: string; options: string[] };
type OptionsMeta<T> = { [K in keyof T]: FieldMeta };

type Action<O = unknown> = {
  id: string;
  label: string;
  description?: string;
  scope: Scope;
  runtime: "content" | "background";
  options: {
    pred: Predicate<O>;            // unknownutil predicate; type source
    defaults: O;                   // typed against pred
    meta: OptionsMeta<O>;          // keyof O — drives the form generator
  };
  run: (ctx: ActionContext, opts: O) => void | Promise<void>;
};

// === bindings (storage AND runtime — same shape, see §3.1, §5.3) ===
type Binding<O = Record<string, unknown>> = {
  id: string;                      // stable UUID
  scope: Scope;
  triggers: Trigger[];
  actionId: string;
  options: O;                      // FULL options bag, no Partial
  enabled: boolean;
};

// === dispatcher ===
type TrieNode = {
  leaf?:
    | { bindingId: string; actionId: string; options: unknown }
    | { conflicted: true; bindingIds: string[] };
  children?: Map<KeyToken, TrieNode>;
};

// === services ===
type Service = {
  id: string;                      // "google"
  label: string;                   // "Google"
  urlPattern: RegExp;
};

// === storage ===
import { storage } from "wxt/storage";
const bindingsItem = storage.defineItem<Binding[]>(
  "local:bindings",
  { fallback: [], version: 1, migrations: {} },
);
const settingsItem = storage.defineItem<{ sequenceTimeoutMs: number }>(
  "local:settings",
  { fallback: { sequenceTimeoutMs: 1000 }, version: 1, migrations: {} },
);
```

---

## §9. What this design does **not** decide

- The exact shape of `ActionContext` (passed into `Action.run`). Step 3
  decides as it implements the first actions.
- The exhaustive list of canonical `<…>` names for non-printable keys
  (`<Escape>`, `<Tab>`, `<ArrowDown>`, etc.). Step 3 sets the table for the
  keys actually exercised by the seed bindings; expand as needed.
- The exact UI affordances on the options page (Step 4 territory) — including
  how the "missing field write-back" is surfaced (probably silent for now).
- Whether the eventual conflict-detection result is exposed to the options
  UI as a live signal or a periodic batch (Step 6+ topic).
- The format used for "settings import" (mentioned in §1.1 as a reason for
  case-insensitive parsing). The case-insensitive parser is enough for now;
  the file format itself is a later concern.

---

## §10. Security considerations (identified at design time)

These are security observations identifiable at the data-model design stage.
S1–S5 are **mandatory for Step 3 implementation**; S6–S10 are forward-looking
notes captured here so future steps don't have to rediscover them.

### S1 — `event.isTrusted` gate (mandatory)

A page can synthesize keyboard events:

```js
window.dispatchEvent(new KeyboardEvent("keydown", { key: "j" }));  // isTrusted: false
```

If the content script's listener doesn't filter on `event.isTrusted`, any
page can remotely trigger our actions. For the Step 3 catalog (scroll only)
the worst outcome is "the page can scroll itself" — already trivial to do.
But once tab actions or hint mode arrive, the same vector becomes a
clickjacking-grade primitive (e.g., trigger "open new tab → URL").

**Decision**: the listener gates on `event.isTrusted === true` from Step 3.
Untrusted events are passed through to the page (no `preventDefault`).

### S2 — Shadow DOM editable detection (mandatory)

`document.activeElement` returns the outermost element. When focus is inside
a (closed or open) shadow root containing an `<input>`, `activeElement` is
the **shadow host**, not the input. Our current Step 1 `isEditable()`
returns false → bindings fire while the user is typing.

Vimium walks shadow roots to find the real focused element. We should do the
same:

```ts
function deepActiveElement(): Element | null {
  let el: Element | null = document.activeElement;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
  return el;
}
```

Closed shadow roots remain unreadable from the extension; for those we
accept a small false-negative rate (binding may fire while typing in a
closed-shadow input). Document the limitation; that's the best we can do
without `chrome.dom.openOrClosedShadowRoot()` (Chrome-only, MV3-gated).

**Decision**: `isEditable()` walks open shadow roots from Step 3.

### S3 — iframe focus blind spot

When focus is inside an iframe (any frame other than top), the top frame's
`document.activeElement` is the `<iframe>` element itself — not editable by
our check. While we run **top-frame only** (Step 1 decision), bindings will
fire even when the user is typing in an iframe input.

**Decision for Step 3**: explicitly guard for `<iframe>` as activeElement
and treat it as "input may be elsewhere — do not fire". This is a
conservative false-positive (we sometimes skip a binding that *would* be
safe), but it eliminates the "type in iframe form, see page scroll" footgun.

```ts
function isEditable(el: Element | null): boolean {
  if (!el) return false;
  if (el.tagName === "IFRAME") return true;        // can't see inside; play safe
  // ...existing checks
}
```

When `allFrames: true` arrives in a later step, this guard relaxes (each
frame runs its own listener and can see its own focus).

### S4 — Settings import / poisoned storage hardening

§1.1 mentioned that an import path is anticipated (lenient case-insensitive
parser justified by it). Whenever that lands, the import boundary must:

1. **Re-validate every binding** through its action's unknownutil predicate
   (same path as load — see §5.3). Don't trust any field.
2. **Regenerate UUIDs on import** rather than trusting incoming `id` fields.
   Prevents collision with existing bindings and prevents a crafted file
   from "overwriting" a binding by ID match.
3. **Drop rows with unknown `actionId`** rather than silently keeping them.
4. **Range-clamp numeric options** via `clampOptions` (§5.3 step 2). A
   poisoned file could otherwise set `sequenceTimeoutMs: -1` (busy loop) or
   `Number.MAX_SAFE_INTEGER` (key-press never fires). The clamp is the same
   one used at load, so import is just "treat the file as fresh storage".
5. **Strip unknown extra fields** (§5.3 step 1 already does this on load).

Even though Step 3 doesn't ship import, building load (§5.3) such that it
*is* the import code path means we get this for free when import lands.
This is the design payoff for the "load == repair" architecture.

### S5 — Pin content script `world: ISOLATED`

WXT's default for `defineContentScript` is `world: "ISOLATED"`. Switching
to `"MAIN"` would put our code in the page's JS realm, exposing internal
state (storage cache, registry, dispatcher state) to the page script.

**Decision**: pin `world: "ISOLATED"` explicitly from Step 3 (don't rely
on the default). If a future action genuinely needs MAIN-world execution
(e.g., to call a page-defined global), do it via a tightly-scoped injected
`<script>` tag rather than running our whole content script in MAIN.

### S6 — Never log raw `KeyToken`s

Current logs (§4.3, §5.3) emit binding IDs (UUIDs) and action IDs only —
no raw key strings. **Keep this rule**: keystrokes are PII-shaped (passwords
mistyped outside `<input>`s land as keydowns we observe).

**Rule**: any future debug/diagnostic log may include `bindingId`,
`actionId`, `scope`, trie depth, timing — but **not** `KeyToken` values
or `event.key` content. If we need to log "what key was pressed" for
debugging, redact to a category (e.g., `"<printable>"`, `"<modifier-only>"`,
`"<sequence-prefix>"`).

### S7 — Sync storage privacy (forward-looking)

When/if we move from `local:` to `sync:` (§5.2), bindings ride through the
browser's sync infrastructure (Google for Chrome sync, Mozilla for Firefox
sync). The set of `site:*` bindings is a weak fingerprint of which services
the user uses.

Not a blocker — most users opt into sync knowingly — but worth a one-line
mention in the user-facing settings UI when the sync toggle eventually
appears. Recorded here so we don't ship sync without thinking about it.

### S8 — `preventDefault` minimality (already decided, restated)

§1.4 already decided: only call `preventDefault()` when a binding matched
*and fired*. Restated here because it's load-bearing for security:
unconditionally swallowing keys can disable browser-level escape hatches
(`Esc` to leave fullscreen, `Ctrl+W` to close a tab, etc.), which a hostile
page could exploit if combined with a fullscreen-takeover attempt.

The minimality rule means: even if the trie matches a prefix, **do not**
`preventDefault` until either (a) a leaf fires, or (b) we explicitly decide
the prefix is "ours and we'll consume the rest". Vimium does this; we
should too.

### S9 — RPC sender re-validation (forward-looking)

When `@webext-core/messaging` is wired in (§6.2), the background handler
will receive RPC calls from content scripts. Cross-extension messaging is
disabled by default in WebExtensions, so the sender is one of *our* content
scripts. Still, for site-specific actions (e.g. a `google.openResult`
called from a `site:google` content), the background handler should
**re-verify the sender's tab URL** matches the action's expected scope
before executing.

Why: a content script in a frame whose URL changed mid-session (via
History API) might still hold a stale dispatcher; we don't want a
formerly-Google tab to issue Google-specific actions after navigating away.
Cheap to do (`browser.tabs.get(sender.tab.id)`); a one-line check at the
start of each background action handler.

### S10 — Predicates are static; no dynamic code

unknownutil predicates are pure compositions of `is.X` / `as.X` calls.
**Rule**: never construct predicates from strings via `new Function()` /
`eval()`. Even if a future "user-defined action" feature is requested, the
action *implementation* must be vendored extension code, not JS strings
loaded from storage or imports.

This matches the extension's manifest CSP (no `unsafe-eval`) and keeps the
attack surface minimal even if our storage is somehow tampered with.

---

## §11. Next step (Step 3) preconditions

The decisions in §7 are settled. Step 3 can implement:

- `KeyToken` parser (lenient case) + serializer (canonical) + listener-side
  normalization including IME/composing guard (§1).
- Listener gates: `event.isTrusted` (§10 S1), shadow-DOM-aware
  `isEditable()` (§10 S2), iframe activeElement guard (§10 S3),
  `world: "ISOLATED"` pinned explicitly (§10 S5).
- Action registry plumbing with ~5 scroll actions, using
  `@core/unknownutil` predicate + defaults + meta per action (§2).
- `storage.defineItem` for `bindings` and `settings`, plus the load-time
  write-back logic (§5.3) including projection / clamping / Set-diff repair
  detection.
- Compiled-trie dispatcher with conflict logging, prefix timeout (driven by
  `settings.sequenceTimeoutMs`), and `storage.watch` to rebuild on change
  (§4).
- Logging discipline (§10 S6): no raw `KeyToken`s in logs.

That maps 1:1 onto the Step 3 task list in PLAN.md, plus the §10 security
items which extend Step 3's verify checklist (test that synthetic
`dispatchEvent` events are ignored; test focus inside a shadow-DOM input).
