<script lang="ts">
  import { tick } from "svelte";
  import type { Action, OptionSchema } from "@/lib/action";
  import { SCOPES, type ScopeId } from "@/lib/scopes";
  import {
    ACTION_IDS,
    ACTIONS,
    type ValidActionId,
  } from "@/lib/scopes/actions";
  import { actionDisplay } from "../actionDisplay";

  type Props = {
    bindingScope: ScopeId;
    currentActionId: ValidActionId;
    onClose: () => void;
    onPick: (id: ValidActionId, action: Action) => void;
  };

  const { bindingScope, currentActionId, onClose, onPick }: Props = $props();

  let query = $state("");
  let focusIdx = $state(0);
  let inputEl: HTMLInputElement | undefined = $state();

  // A global action works under any scope; a site action only under its own —
  // the picker must never offer an action the runtime would refuse.
  const compatibleIds = $derived(
    ACTION_IDS.filter((id) => {
      const scope = ACTIONS[id].scope;
      return scope === "global" || scope === bindingScope;
    }),
  );

  // Substring match across id and description.
  const filteredIds = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return compatibleIds;
    return compatibleIds.filter((id) => {
      const action = ACTIONS[id];
      const haystack = [id, action.description, SCOPES[action.scope].label]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  });

  // Single flat list. Site-specific actions float above global ones because
  // that's why the user opened the picker on a site scope. Per-iteration
  // values are pre-derived (Biome flags {@const} in templates).
  type Item = {
    id: ValidActionId;
    action: Action;
    idx: number;
    name: string;
    badgeLabel: string | null;
  };
  const items = $derived.by<Item[]>(() => {
    const globalLast = (id: ValidActionId) =>
      ACTIONS[id].scope === "global" ? 1 : 0;
    const ordered = filteredIds
      .slice()
      .sort((a, b) => globalLast(a) - globalLast(b));
    return ordered.map((id, idx) => {
      const d = actionDisplay(id);
      return {
        id,
        action: ACTIONS[id],
        idx,
        name: d.name,
        badgeLabel: d.badgeLabel,
      };
    });
  });

  const focused = $derived<Item | undefined>(items[focusIdx]);

  type SchemaEntry = {
    key: string;
    kind: OptionSchema["kind"];
    defaultValue: unknown;
  };
  const focusedSchema = $derived<SchemaEntry[]>(
    focused
      ? Object.entries(focused.action.optionSchema).map(([key, schema]) => ({
          key,
          kind: schema.kind,
          defaultValue: focused.action.defaults[key],
        }))
      : [],
  );

  // Reset focus when the filter changes so the cursor doesn't strand off-list.
  $effect(() => {
    const len = items.length;
    if (focusIdx >= len) focusIdx = Math.max(0, len - 1);
  });

  // Initial focus: search input, with cursor on the current action so ↵
  // without typing keeps the existing choice.
  $effect(() => {
    tick().then(() => inputEl?.focus());
    const cur = items.findIndex((i) => i.id === currentActionId);
    if (cur >= 0) focusIdx = cur;
  });

  function pick(item: Item | undefined) {
    if (!item) return;
    onPick(item.id, item.action);
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusIdx = Math.min(items.length - 1, focusIdx + 1);
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
            Global + {SCOPES[bindingScope].label} actions
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
          {#each items as item (item.id)}
            <li>
              <button
                type="button"
                class="item"
                class:focused={item.idx === focusIdx}
                onmousemove={() => {
                  focusIdx = item.idx;
                }}
                onclick={() => pick(item)}
              >
                <span class="name">{item.name}</span>
                {#if item.badgeLabel}
                  <span class="badge site">{item.badgeLabel}</span>
                {/if}
              </button>
            </li>
          {:else}
            <li class="empty">No matches.</li>
          {/each}
        </ol>
      </section>

      <aside class="right">
        {#if focused}
          <div class="detail-head">
            <h2 class="detail-name">{focused.name}</h2>
            {#if focused.badgeLabel}
              <span class="badge site">Only on {focused.badgeLabel}</span>
            {/if}
          </div>
          <p class="desc">{focused.action.description}</p>

          <h3 class="opts-label">Options</h3>
          {#if focusedSchema.length === 0}
            <p class="opts-none">(no options)</p>
          {:else}
            <ul class="opts">
              {#each focusedSchema as f (f.key)}
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
    background: rgba(20, 18, 15, 0.32);
    backdrop-filter: blur(2px);
    z-index: 100;
    display: grid;
    place-items: start center;
    padding-top: 12vh;
    animation: fadein 0.15s ease-out;
  }
  @keyframes fadein {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .modal {
    background: #ffffff;
    border: 1px solid #e6e3dc;
    border-radius: 12px;
    box-shadow:
      0 1px 0 rgba(0, 0, 0, 0.04),
      0 24px 60px rgba(20, 18, 15, 0.18);
    width: min(720px, calc(100vw - 32px));
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 16px 18px;
    border-bottom: 1px solid #e6e3dc;
  }
  .titles h1 {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 2px;
  }
  .titles .sub {
    font-size: 12px;
    color: #5a564e;
    margin: 0;
  }
  button.close {
    border: 0;
    background: transparent;
    cursor: pointer;
    font-size: 18px;
    color: #918b80;
    line-height: 1;
    padding: 2px 6px;
    border-radius: 5px;
  }
  button.close:hover {
    background: #efeeea;
    color: #1a1815;
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
    border-right: 1px solid #e6e3dc;
  }
  .search {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-bottom: 1px solid #e6e3dc;
  }
  .search input {
    flex: 1;
    border: 0;
    background: transparent;
    font: inherit;
    font-size: 13px;
    outline: 0;
    color: #1a1815;
  }
  kbd {
    font-family: ui-monospace, Consolas, "Liberation Mono", monospace;
    font-size: 10px;
    color: #5a564e;
    background: #ffffff;
    border: 1px solid #e6e3dc;
    border-bottom-width: 1.5px;
    border-radius: 4px;
    padding: 1px 5px;
    line-height: 1;
  }

  .list {
    list-style: none;
    margin: 0;
    padding: 4px;
    overflow-y: auto;
    flex: 1;
  }
  .list li {
    list-style: none;
  }
  button.item {
    width: 100%;
    text-align: left;
    background: transparent;
    border: 0;
    cursor: pointer;
    padding: 7px 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #1a1815;
    border-radius: 5px;
  }
  button.item.focused,
  button.item:hover {
    background: #f4f3f0;
  }
  .name {
    font-family: ui-monospace, Consolas, "Liberation Mono", monospace;
    font-size: 12.5px;
    font-weight: 500;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .badge.site {
    display: inline-flex;
    align-items: center;
    font-size: 10px;
    color: #6b21a8;
    background: #f3ebfb;
    border: 1px solid #e1d0f3;
    padding: 1px 6px;
    border-radius: 999px;
    letter-spacing: 0.02em;
    flex-shrink: 0;
  }
  .empty {
    padding: 16px;
    color: #918b80;
    font-size: 12px;
    text-align: center;
  }

  .right {
    padding: 14px 14px 16px;
    overflow-y: auto;
    background: #fbfaf8;
    font-size: 12px;
    color: #3a3530;
    min-width: 0;
  }
  .detail-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 8px;
    flex-wrap: wrap;
  }
  .detail-name {
    font-family: ui-monospace, Consolas, "Liberation Mono", monospace;
    font-size: 14px;
    font-weight: 600;
    margin: 0;
    color: #1a1815;
  }
  .desc {
    margin: 0 0 12px;
    line-height: 1.5;
    color: #5a564e;
  }
  .opts-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #918b80;
    margin: 12px 0 6px;
  }
  .opts {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .opts li {
    font-family: ui-monospace, Consolas, "Liberation Mono", monospace;
    font-size: 11px;
    padding: 2px 0;
  }
  .opt-key {
    color: #1a1815;
  }
  .opt-kind {
    color: #918b80;
  }
  .opt-default {
    color: #918b80;
    margin-left: 4px;
  }
  .opts-none {
    font-size: 11px;
    color: #918b80;
    margin: 0;
  }
  .muted {
    color: #918b80;
    font-size: 12px;
  }

  .foot {
    display: flex;
    gap: 14px;
    padding: 8px 14px;
    border-top: 1px solid #e6e3dc;
    color: #918b80;
    font-size: 11px;
    background: #fbfaf8;
  }
  .foot span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
</style>
