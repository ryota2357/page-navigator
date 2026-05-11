<script lang="ts">
  import { tick } from "svelte";
  import { listActions } from "../../../lib/actions/registry";
  import { isCompatibleScope } from "../../../lib/actions/scope";
  import { findService } from "../../../lib/services/catalog";
  import type { Action, FieldMeta, Scope } from "../../../lib/types";

  type MetaEntry = {
    key: string;
    kind: FieldMeta["kind"];
    defaultValue: unknown;
  };

  type Props = {
    bindingScope: Scope;
    currentActionId: string;
    onClose: () => void;
    onPick: (action: Action<unknown>) => void;
  };

  const { bindingScope, currentActionId, onClose, onPick }: Props = $props();

  let query = $state("");
  let focusIdx = $state(0);
  let inputEl: HTMLInputElement | undefined = $state();

  // Compatibility filter is the same predicate the action runtime uses,
  // so the picker never offers an action the dispatcher would refuse.
  const compatibleActions = $derived(
    listActions().filter((a) => isCompatibleScope(a.scope, bindingScope)),
  );

  // Substring match across label, description, id, scope-label. Case-
  // insensitive. The flat-then-grouped shape keeps keyboard navigation
  // index-based (focusIdx counts visible rows in their displayed order).
  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return compatibleActions;
    return compatibleActions.filter((a) => {
      const haystack = [a.label, a.description ?? "", a.id, scopeLabel(a.scope)]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  });

  // Group by scope: Global first, then each site. Same order the dispatcher
  // resolves priority — feels natural to the eye. Each item carries its
  // index in the flat list so the template doesn't need {@const} (Biome
  // flags that as assign-in-expression).
  type GroupItem = { action: Action<unknown>; idx: number };
  type Group = { scope: Scope; label: string; items: GroupItem[] };
  const grouped = $derived.by<Group[]>(() => {
    const buckets = new Map<Scope, Action<unknown>[]>();
    for (const a of filtered) {
      const list = buckets.get(a.scope) ?? [];
      list.push(a);
      buckets.set(a.scope, list);
    }
    const order: Scope[] = ["global"];
    for (const a of filtered) {
      if (a.scope !== "global" && !order.includes(a.scope)) order.push(a.scope);
    }
    let cursor = 0;
    const groups: Group[] = [];
    for (const s of order) {
      const bucket = buckets.get(s);
      if (!bucket) continue;
      const items = bucket.map((action) => ({ action, idx: cursor++ }));
      groups.push({ scope: s, label: scopeLabel(s), items });
    }
    return groups;
  });

  const flat = $derived(grouped.flatMap((g) => g.items.map((i) => i.action)));
  const focused = $derived<Action<unknown> | undefined>(flat[focusIdx]);

  // Resolve action.options.meta into a typed array. Action's `O` is
  // `unknown` here, so we deliberately project through Record<…> for the
  // template, but the per-field `kind` is always one of FieldMeta's
  // variants because every Action declares it that way.
  const focusedMeta = $derived<MetaEntry[]>(
    focused
      ? Object.entries(focused.options.meta as Record<string, FieldMeta>).map(
          ([key, meta]) => ({
            key,
            kind: meta.kind,
            defaultValue: (focused.options.defaults as Record<string, unknown>)[
              key
            ],
          }),
        )
      : [],
  );

  function scopeLabel(scope: Scope): string {
    if (scope === "global") return "Global";
    const id = scope.slice("site:".length);
    return findService(id)?.label ?? scope;
  }

  // Reset focus when filter changes so cursor doesn't strand off-list.
  // Note: an unconditional effect on `query` plus reading `flat.length`
  // would re-clamp on every list change, which is what we want for both
  // typing and the initial mount.
  $effect(() => {
    const len = flat.length;
    if (focusIdx >= len) focusIdx = Math.max(0, len - 1);
  });

  // Initial focus: search input, with cursor on the current action so
  // ↵ without typing keeps the existing choice.
  $effect(() => {
    tick().then(() => inputEl?.focus());
    const cur = flat.findIndex((a) => a.id === currentActionId);
    if (cur >= 0) focusIdx = cur;
  });

  function pick(action: Action<unknown> | undefined) {
    if (!action) return;
    onPick(action);
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusIdx = Math.min(flat.length - 1, focusIdx + 1);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      focusIdx = Math.max(0, focusIdx - 1);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      pick(focused);
      return;
    }
  }

  function onScrimClick(e: MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }
</script>

<!-- Scrim swallows outside clicks; the modal body stops propagation. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="scrim" onclick={onScrimClick} onkeydown={onKeydown}>
  <div
    class="modal"
    role="dialog"
    aria-modal="true"
    aria-label="Pick an action"
  >
    <header class="head">
      <div class="titles">
        <h1>Pick an action</h1>
        <p class="sub">
          {#if bindingScope === "global"}
            Global actions only
          {:else}
            Global + {scopeLabel(bindingScope)} actions
          {/if}
        </p>
      </div>
      <button type="button" class="close" title="Close" onclick={onClose}>
        ×
      </button>
    </header>

    <div class="body">
      <section class="left">
        <div class="search">
          <input
            bind:this={inputEl}
            type="text"
            value={query}
            oninput={(e) => {
              query = (e.currentTarget as HTMLInputElement).value;
            }}
            placeholder="Search actions…"
            aria-label="Search actions"
          >
          <kbd>esc</kbd>
        </div>

        <ol class="list" role="listbox">
          {#each grouped as g (g.scope)}
            <li class="group">
              <p class="group-label">{g.label}</p>
              <ul>
                {#each g.items as item (item.action.id)}
                  <li>
                    <button
                      type="button"
                      class="item"
                      class:focused={item.idx === focusIdx}
                      onmousemove={() => {
                        focusIdx = item.idx;
                      }}
                      onclick={() => pick(item.action)}
                    >
                      <span class="name">{item.action.label}</span>
                      <span class="id">{item.action.id}</span>
                    </button>
                  </li>
                {/each}
              </ul>
            </li>
          {:else}
            <li class="empty">No matches.</li>
          {/each}
        </ol>
      </section>

      <aside class="right">
        {#if focused}
          <h2 class="detail-label">{focused.label}</h2>
          <p class="detail-id">{focused.id}</p>
          {#if focused.scope !== "global"}
            <p class="badge">Only on {scopeLabel(focused.scope)}</p>
          {/if}
          {#if focused.description}
            <p class="desc">{focused.description}</p>
          {/if}

          <h3 class="opts-label">Options</h3>
          {#if focusedMeta.length === 0}
            <p class="opts-none">(no options)</p>
          {:else}
            <ul class="opts">
              {#each focusedMeta as f (f.key)}
                <li>
                  <span class="opt-key">{f.key}</span>
                  <span class="opt-kind">: {f.kind}</span>
                  <span class="opt-default"
                    >= {JSON.stringify(f.defaultValue)}</span
                  >
                </li>
              {/each}
            </ul>
          {/if}
        {:else}
          <p class="muted">No matches.</p>
        {/if}
      </aside>
    </div>

    <footer class="foot">
      <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
      <span><kbd>↵</kbd> select</span>
      <span><kbd>esc</kbd> close</span>
    </footer>
  </div>
</div>

<style>
  .scrim {
    position: fixed;
    inset: 0;
    background: rgba(26, 24, 21, 0.5);
    z-index: 100;
    display: grid;
    place-items: start center;
    padding-top: 8vh;
  }

  .modal {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 14px 48px rgba(20, 18, 15, 0.35);
    width: min(760px, calc(100vw - 32px));
    max-height: 76vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 12px 14px;
    border-bottom: 1px solid #e6e3dd;
  }
  .titles h1 {
    font-size: 13px;
    font-weight: 600;
    margin: 0 0 2px;
  }
  .titles .sub {
    font-size: 11px;
    color: #8a857a;
    margin: 0;
  }
  button.close {
    border: 0;
    background: transparent;
    cursor: pointer;
    font-size: 18px;
    color: #5b554d;
    line-height: 1;
    padding: 2px 6px;
    border-radius: 4px;
  }
  button.close:hover {
    background: #f4f2ee;
  }

  .body {
    display: grid;
    grid-template-columns: 1fr 280px;
    min-height: 0;
    flex: 1;
  }

  .left {
    display: flex;
    flex-direction: column;
    min-height: 0;
    border-right: 1px solid #e6e3dd;
  }
  .search {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-bottom: 1px solid #e6e3dd;
  }
  .search input {
    flex: 1;
    border: 0;
    background: transparent;
    font: inherit;
    font-size: 13px;
    outline: 0;
  }
  kbd {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10px;
    color: #5b554d;
    background: #f4f2ee;
    border: 1px solid #e6e3dd;
    border-radius: 3px;
    padding: 1px 4px;
  }

  .list {
    list-style: none;
    margin: 0;
    padding: 4px 0;
    overflow-y: auto;
    flex: 1;
  }
  .group {
    padding: 4px 0;
  }
  .group-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #8a857a;
    margin: 4px 12px 2px;
    font-weight: 600;
  }
  .group ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  button.item {
    width: 100%;
    text-align: left;
    background: transparent;
    border: 0;
    cursor: pointer;
    padding: 6px 12px;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    color: #1a1815;
  }
  button.item.focused,
  button.item:hover {
    background: #f4f2ee;
  }
  .name {
    font-size: 12.5px;
  }
  .id {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    color: #8a857a;
  }
  .empty {
    padding: 16px;
    color: #8a857a;
    font-size: 12px;
    text-align: center;
  }

  .right {
    padding: 14px 14px 16px;
    overflow-y: auto;
    background: #faf9f7;
    font-size: 12px;
    color: #3a3530;
    min-width: 0;
  }
  .detail-label {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 2px;
  }
  .detail-id {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    color: #8a857a;
    margin: 0 0 8px;
  }
  .badge {
    display: inline-block;
    font-size: 10.5px;
    color: #3a3530;
    background: #ece8e0;
    border: 1px solid #d8d3c8;
    border-radius: 999px;
    padding: 1px 8px;
    margin: 0 0 8px;
  }
  .desc {
    margin: 0 0 12px;
    line-height: 1.5;
    color: #5b554d;
  }
  .opts-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #8a857a;
    margin: 12px 0 6px;
  }
  .opts {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .opts li {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    padding: 2px 0;
  }
  .opt-key {
    color: #1a1815;
  }
  .opt-kind {
    color: #8a857a;
  }
  .opt-default {
    color: #8a857a;
    margin-left: 4px;
  }
  .opts-none {
    font-size: 11px;
    color: #8a857a;
    margin: 0;
  }
  .muted {
    color: #8a857a;
    font-size: 12px;
  }

  .foot {
    display: flex;
    gap: 14px;
    padding: 8px 14px;
    border-top: 1px solid #e6e3dd;
    color: #8a857a;
    font-size: 11px;
    background: #faf9f7;
  }
  .foot span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
</style>
