<script lang="ts">
  import { tick, untrack } from "svelte";
  import type { Action, ActionId, OptionSchema } from "@/lib/action";
  import { type ScopeId, scopes } from "@/lib/scopes";
  import Kbd from "@/lib/ui/Kbd.svelte";
  import Modal from "@/lib/ui/Modal.svelte";
  import ScopeTag from "@/lib/ui/ScopeTag.svelte";
  import SearchInput from "@/lib/ui/SearchInput.svelte";
  import { actionLabelParts } from "../display";

  interface Props {
    actions: Record<ActionId, Action>;
    bindingScope: ScopeId;
    currentActionId: ActionId | null;
    onClose: () => void;
    onPick: (id: ActionId, action: Action) => void;
  }

  let { actions, bindingScope, currentActionId, onClose, onPick }: Props =
    $props();

  let query = $state("");
  let itemEls: HTMLButtonElement[] = $state([]);

  // `actions` is pre-filtered upstream to global + bindingScope, so every entry
  // here is one the runtime would accept under bindingScope.
  const compatibleActions = $derived(Object.values(actions));

  const filteredActions = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return compatibleActions;
    return compatibleActions.filter((action) => {
      const haystack = [
        action.id,
        action.description,
        scopes[action.scope].label,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  });

  type Item = {
    id: ActionId;
    action: Action;
    idx: number;
    name: string;
    scopeBadge: string | null;
  };
  const items = $derived.by<Item[]>(() => {
    // Site-specific actions float above globals because that's why the user
    // opened the picker on a site scope.
    const globalLast = (action: Action) => (action.scope === "global" ? 1 : 0);
    const ordered = filteredActions
      .slice()
      .sort((a, b) => globalLast(a) - globalLast(b));
    return ordered.map((action, idx) => {
      const { name, scopeBadge } = actionLabelParts(action);
      return { id: action.id, action, idx, name, scopeBadge };
    });
  });

  // Open on the action this binding currently uses, if any. Read once: later
  // navigation owns focusIdx, so the initial list order is all we need here.
  let focusIdx = $state(
    untrack(() =>
      Math.max(
        0,
        items.findIndex((i) => i.id === currentActionId),
      ),
    ),
  );

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

  // A shrinking result set must not strand the cursor past the last row.
  $effect(() => {
    if (focusIdx >= items.length) focusIdx = Math.max(0, items.length - 1);
  });

  // Keep the active row in view when arrowing past the list's edges.
  $effect(() => {
    const el = itemEls[focusIdx];
    tick().then(() => el?.scrollIntoView({ block: "nearest" }));
  });

  function pick(item: Item | undefined) {
    if (!item) return;
    onPick(item.id, item.action);
  }

  // ArrowUp/Down/Enter for keyboard list navigation. Escape is handled by
  // <dialog>'s native cancel event.
  function onKeydown(e: KeyboardEvent) {
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
    }
  }

  const subtitle = $derived(
    bindingScope === "global"
      ? "Global actions only"
      : `Global + ${scopes[bindingScope].label} actions`,
  );
</script>

<svelte:window onkeydown={onKeydown} />

<Modal
  ariaLabel="Pick an action"
  title="Pick an action"
  {subtitle}
  width={720}
  {onClose}
>
  <div class="cols">
    <section class="left">
      <SearchInput
        value={query}
        variant="bar"
        focusOnMount
        placeholder="Search actions by name or description…"
        ariaLabel="Search actions"
        oninput={(v) => {
          query = v;
        }}
      />
      <ol class="list" role="listbox">
        {#each items as item (item.id)}
          <li>
            <button
              bind:this={itemEls[item.idx]}
              type="button"
              class="item"
              class:focused={item.idx === focusIdx}
              onmousemove={() => {
                focusIdx = item.idx;
              }}
              onclick={() => pick(item)}
            >
              <span class="name">{item.name}</span>
              {#if item.scopeBadge}
                <ScopeTag>{item.scopeBadge}</ScopeTag>
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
          {#if focused.scopeBadge}
            <ScopeTag>Only on {focused.scopeBadge}</ScopeTag>
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

  {#snippet foot()}
    <span class="hint"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
    <span class="hint"><Kbd>↵</Kbd> select</span>
    <span class="hint"><Kbd>esc</Kbd> close</span>
  {/snippet}
</Modal>

<style>
  /* Fill the (flex) modal body and cap the single grid row to that height, so
     the only thing tall enough to scroll is the list inside .left — the search
     bar and detail pane stay fixed by sitting outside that scroller. */
  .cols {
    display: grid;
    grid-template-columns: 1fr 280px;
    grid-template-rows: minmax(0, 1fr);
    flex: 1;
    min-height: 0;
  }
  .left {
    display: flex;
    flex-direction: column;
    min-height: 0;
    border-right: 1px solid var(--border);
  }

  .list {
    list-style: none;
    margin: 0;
    padding: 4px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }
  .list li {
    list-style: none;
  }
  .item {
    width: 100%;
    text-align: left;
    background: transparent;
    border: 0;
    cursor: default;
    padding: 7px 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-1);
    border-radius: 5px;
    font: inherit;
  }
  .item.focused,
  .item:hover {
    background: var(--subtle);
  }
  .name {
    font-family: var(--font-mono);
    font-size: 12.5px;
    font-weight: 500;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .empty {
    padding: 16px;
    color: var(--text-3);
    font-size: 12px;
    text-align: center;
  }

  .right {
    padding: 14px 14px 16px;
    overflow-y: auto;
    background: var(--canvas);
    font-size: 12px;
    color: var(--text-2);
    min-width: 0;
    min-height: 0;
  }
  .detail-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 8px;
    flex-wrap: wrap;
  }
  .detail-name {
    font-family: var(--font-mono);
    font-size: 14px;
    font-weight: 600;
    margin: 0;
    color: var(--text-1);
  }
  .desc {
    margin: 0 0 12px;
    line-height: 1.5;
  }
  .opts-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-3);
    margin: 12px 0 6px;
  }
  .opts {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .opts li {
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 2px 0;
  }
  .opt-key {
    color: var(--text-1);
  }
  .opt-kind {
    color: var(--text-3);
  }
  .opt-default {
    color: var(--text-3);
    margin-left: 4px;
  }
  .opts-none {
    font-size: 11px;
    color: var(--text-3);
    margin: 0;
  }
  .muted {
    color: var(--text-3);
    font-size: 12px;
  }

  .hint {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--text-3);
    font-size: 11px;
  }
</style>
