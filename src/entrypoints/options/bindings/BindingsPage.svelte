<script lang="ts">
  import { Globe, Plus, Search } from "@lucide/svelte/icons";
  import type { Action, ActionId } from "@/lib/action";
  import { type ScopeId, scopes } from "@/lib/scopes";
  import type { Binding } from "@/lib/storage";
  import { findConflicts, serializeTrigger } from "../lib/conflicts";
  import { siteBadge } from "../lib/display";
  import BindingsList from "./BindingsList.svelte";
  import ConflictBanner from "./ConflictBanner.svelte";
  import EmptyState from "./EmptyState.svelte";

  interface Props {
    scopeId: ScopeId;
    bindings: Binding[];
    actions: Record<ActionId, Action>;
    onAdd: (next: Binding) => void;
    onUpdate: (next: Binding) => void;
    onDelete: (id: string) => void;
    onReorder: (next: Binding[]) => void;
  }

  let {
    scopeId,
    bindings,
    actions,
    onAdd,
    onUpdate,
    onDelete,
    onReorder,
  }: Props = $props();

  // A non-null `newRowId` means a fresh editable row is visible. The id is
  // fixed up-front so storage can adopt the row on commit unchanged.
  let newRowId = $state<string | null>(null);
  let editingId = $state<string | null>(null);
  let query = $state("");

  // Drop the in-progress new row + edit selection when the scope changes —
  // otherwise a half-typed binding for Google would float into Global on
  // switch and look like a phantom row.
  $effect(() => {
    void scopeId;
    newRowId = null;
    editingId = null;
  });

  // Computed on committed bindings only. The in-progress new row sees the
  // same set via `triggerConflicts` and highlights its triggers inline.
  const conflicts = $derived(findConflicts(bindings));

  const filteredBindings = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bindings;
    return bindings.filter((b) => {
      const action = actions[b.actionId];
      const haystack = [
        b.actionId,
        action?.description ?? "",
        ...b.triggers.map(serializeTrigger),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  });

  const scopeLabel = $derived(scopes[scopeId].label);
  const badge = $derived(siteBadge(scopeId));
  const conflictCount = $derived(conflicts.size);
  const disabledCount = $derived(bindings.filter((b) => !b.enabled).length);
  const isEmpty = $derived(bindings.length === 0 && newRowId === null);

  function startAdd() {
    if (newRowId === null) newRowId = crypto.randomUUID();
    editingId = newRowId;
  }

  function startEdit(id: string) {
    // Moving focus to a different row while a new-row draft exists drops
    // the draft — same effect as Cancel. Without this the phantom new row
    // would linger below the list with whatever the user had half-typed.
    if (newRowId !== null && id !== newRowId) newRowId = null;
    editingId = id;
  }

  function commit(next: Binding) {
    if (next.id === newRowId) {
      onAdd(next);
      newRowId = null;
    } else {
      onUpdate(next);
    }
    editingId = null;
  }

  function cancel(id: string) {
    if (id === newRowId) newRowId = null;
    editingId = null;
  }

  function deleteBinding(id: string) {
    if (id === newRowId) {
      newRowId = null;
    } else {
      onDelete(id);
    }
    editingId = null;
  }

  function jumpToFirstConflict() {
    const first = bindings.find((b) =>
      b.triggers.some((t) => conflicts.has(serializeTrigger(t))),
    );
    if (!first) return;
    editingId = first.id;
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-row-id="${first.id}"]`);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }
</script>

<header class="head">
  <div class="head-icon">
    {#if badge}
      <span class="fav" style="background: {badge.color}">
        {badge.initials}
      </span>
    {:else}
      <span class="globe"><Globe size={16} /></span>
    {/if}
  </div>
  <div class="head-text">
    <h1>{scopeLabel}</h1>
    <p>
      {#if scopeId === "global"}
        Active on every page. Site-specific bindings, when set, take priority
        over Global.
      {:else}
        Active only on {scopeLabel} pages. Overrides Global where triggers
        overlap.
      {/if}
    </p>
  </div>
  <div class="head-meta">
    {bindings.length}
    binding{bindings.length === 1 ? "" : "s"}
    {#if disabledCount > 0}
      · <span class="muted">{disabledCount} disabled</span>
    {/if}
    {#if conflictCount > 0}
      ·
      <span class="danger">
        {conflictCount}
        conflict{conflictCount === 1 ? "" : "s"}
      </span>
    {/if}
  </div>
</header>

{#if isEmpty}
  <EmptyState {scopeLabel} onAdd={startAdd} />
{:else}
  <div class="toolbar">
    <div class="search">
      <Search size={14} />
      <input
        type="text"
        value={query}
        placeholder="Filter by trigger or action…"
        oninput={(e) => {
          query = (e.currentTarget as HTMLInputElement).value;
        }}
      >
    </div>
    <button type="button" class="add" onclick={startAdd}>
      <Plus size={13} />
      New binding
    </button>
  </div>

  {#if conflictCount > 0}
    <div class="banner-wrap">
      <ConflictBanner count={conflictCount} onJump={jumpToFirstConflict} />
    </div>
  {/if}

  <div class="list-card">
    <BindingsList
      bindings={filteredBindings}
      {actions}
      {newRowId}
      {scopeId}
      {editingId}
      {conflicts}
      onStartEdit={startEdit}
      onCommit={commit}
      onCancel={cancel}
      onDelete={deleteBinding}
      {onReorder}
    />
  </div>
{/if}

<style>
  .head {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 4px 0 18px;
  }
  .head-icon {
    flex-shrink: 0;
  }
  .fav {
    width: 32px;
    height: 32px;
    border-radius: 7px;
    font-size: 13px;
    font-weight: 700;
    display: grid;
    place-items: center;
    color: #fff;
    font-family: var(--font-mono);
  }
  .globe {
    width: 32px;
    height: 32px;
    border-radius: 7px;
    background: var(--subtle);
    display: grid;
    place-items: center;
    color: var(--text-2);
  }
  .head-text {
    flex: 1;
    min-width: 0;
  }
  .head-text h1 {
    font-size: 19px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--text-1);
    margin: 0;
  }
  .head-text p {
    font-size: 12.5px;
    color: var(--text-2);
    margin: 3px 0 0;
  }
  .head-meta {
    flex-shrink: 0;
    font-size: 11.5px;
    color: var(--text-3);
  }
  .head-meta .muted {
    color: var(--text-3);
  }
  .head-meta .danger {
    color: var(--danger);
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 0 12px;
  }
  .search {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 32px;
    padding: 0 10px;
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    background: var(--surface);
    color: var(--text-2);
    max-width: 360px;
  }
  .search:focus-within {
    border-color: var(--border-strong);
  }
  .search input {
    flex: 1;
    border: 0;
    outline: 0;
    background: transparent;
    font: inherit;
    font-size: 12.5px;
    color: var(--text-1);
    min-width: 0;
  }
  .add {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 12px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    color: var(--text-1);
    font: inherit;
    font-size: 12.5px;
    cursor: default;
  }
  .add:hover {
    background: var(--hover);
    border-color: var(--border-strong);
  }

  .banner-wrap {
    margin-bottom: 10px;
  }
  .list-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    overflow: hidden;
  }
</style>
