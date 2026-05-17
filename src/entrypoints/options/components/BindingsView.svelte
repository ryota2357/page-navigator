<script lang="ts">
  import { SCOPES, type ScopeId } from "@/lib/scopes";
  import { ACTIONS } from "@/lib/scopes/actions";
  import type { Binding } from "@/lib/storage/bindings";
  import { findConflicts, serializeTrigger } from "../conflicts";
  import { siteDisplay } from "../siteDisplay";
  import BindingsList from "./BindingsList.svelte";
  import ConflictBanner from "./ConflictBanner.svelte";
  import EmptyState from "./EmptyState.svelte";
  import Icon from "./Icon.svelte";

  interface Props {
    scopeId: ScopeId;
    bindings: Binding[];
    onAdd: (next: Binding) => void;
    onUpdate: (next: Binding) => void;
    onDelete: (id: string) => void;
    onReorder: (next: Binding[]) => void;
  }

  let { scopeId, bindings, onAdd, onUpdate, onDelete, onReorder }: Props =
    $props();

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
      const action = ACTIONS[b.actionId];
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

  const scopeLabel = $derived(SCOPES[scopeId].label);
  const display = $derived(siteDisplay(scopeId));
  const conflictCount = $derived(conflicts.size);
  const isEmpty = $derived(bindings.length === 0 && newRowId === null);

  function startAdd() {
    if (newRowId === null) newRowId = crypto.randomUUID();
    editingId = newRowId;
  }

  function startEdit(id: string) {
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
      const el = document.querySelector(`[data-id="${first.id}"]`);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }
</script>

<div class="view">
  <div class="head">
    <div class="head-icon">
      {#if display}
        <span class="fav" style="background: {display.color}">
          {display.initials}
        </span>
      {:else}
        <span class="globe"><Icon name="globe" size={14} /></span>
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
      <span class="meta-text">
        {bindings.length}
        binding{bindings.length === 1 ? "" : "s"}
        {#if conflictCount > 0}
          ·
          <span class="danger">
            {conflictCount}
            conflict{conflictCount === 1 ? "" : "s"}
          </span>
        {/if}
      </span>
    </div>
  </div>

  {#if conflictCount > 0}
    <ConflictBanner count={conflictCount} onJump={jumpToFirstConflict} />
  {/if}

  {#if isEmpty}
    <EmptyState {scopeLabel} onAdd={startAdd} />
  {:else}
    <div class="toolbar">
      <div class="search">
        <Icon name="search" size={14} />
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
        <Icon name="plus" size={13} />
        New binding
      </button>
    </div>

    <BindingsList
      bindings={filteredBindings}
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
  {/if}
</div>

<style>
  .view {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 24px 28px 12px;
  }
  .head-icon {
    flex-shrink: 0;
  }
  .fav {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
    display: grid;
    place-items: center;
    color: #fff;
    font-family: var(--font-mono);
  }
  .globe {
    width: 28px;
    height: 28px;
    border-radius: 6px;
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
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--text-1);
    margin: 0;
  }
  .head-text p {
    font-size: 12px;
    color: var(--text-2);
    margin: 2px 0 0;
  }
  .head-meta {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .meta-text {
    font-size: 11.5px;
    color: var(--text-3);
  }
  .meta-text .danger {
    color: var(--danger);
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 28px 10px;
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
</style>
