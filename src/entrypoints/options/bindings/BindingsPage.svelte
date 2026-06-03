<script lang="ts">
  import { Plus } from "@lucide/svelte/icons";
  import { scopes } from "@/lib/scopes";
  import type { Binding } from "@/lib/storage";
  import ScopeAvatar from "@/lib/ui/ScopeAvatar.svelte";
  import SearchInput from "@/lib/ui/SearchInput.svelte";
  import { findConflicts, serializeTrigger } from "../conflicts";
  import { scopeDescription, siteBadge } from "../display";
  import { store } from "../store.svelte";
  import BindingsList from "./BindingsList.svelte";
  import ConflictBanner from "./ConflictBanner.svelte";
  import EmptyState from "./EmptyState.svelte";

  // Scope is fixed for this component's lifetime — App keys it on the selected
  // scope, so switching scopes remounts a fresh page (dropping drafts/filter).
  const scopeId = store.selectedScope;
  const scopeLabel = scopes[scopeId].label;
  const badge = siteBadge(scopeId);
  const actions = store.actionsFor(scopeId);

  const bindings = $derived(store.bindingsFor(scopeId));

  // A non-null `newRowId` means a fresh editable row is visible. The id is fixed
  // up-front so storage can adopt the row on commit unchanged.
  let newRowId = $state<string | null>(null);
  let editingId = $state<string | null>(null);
  let query = $state("");

  // Computed on committed bindings only. The in-progress new row sees the same
  // set and highlights its conflicting triggers inline.
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

  const conflictCount = $derived(conflicts.size);
  const disabledCount = $derived(bindings.filter((b) => !b.enabled).length);
  const isEmpty = $derived(bindings.length === 0 && newRowId === null);

  function startAdd() {
    if (newRowId === null) newRowId = crypto.randomUUID();
    editingId = newRowId;
  }

  function startEdit(id: string) {
    // Moving focus to a different row while a new-row draft exists drops the
    // draft — same as Cancel. Otherwise the phantom new row would linger below
    // the list with whatever the user had half-typed.
    if (newRowId !== null && id !== newRowId) newRowId = null;
    editingId = id;
  }

  function commit(next: Binding) {
    if (next.id === newRowId) {
      store.addBinding(next);
      newRowId = null;
    } else {
      store.updateBinding(next);
    }
    editingId = null;
  }

  function cancel(id: string) {
    if (id === newRowId) newRowId = null;
    editingId = null;
  }

  function remove(id: string) {
    if (id === newRowId) {
      newRowId = null;
    } else {
      store.deleteBinding(id);
    }
    editingId = null;
  }

  function reorder(reorderedVisible: Binding[]) {
    // SortableList only sees the filtered rows; splice their new order back
    // into the full scope list so a reorder under an active filter never drops
    // the rows that were filtered out.
    const visible = new Set(reorderedVisible.map((b) => b.id));
    let i = 0;
    const merged = bindings.map((b) =>
      visible.has(b.id) ? reorderedVisible[i++] : b,
    );
    store.reorderScope(scopeId, merged);
  }

  function jumpToFirstConflict() {
    const first = bindings.find((b) =>
      b.triggers.some((t) => conflicts.has(serializeTrigger(t))),
    );
    if (!first) return;
    editingId = first.id;
    requestAnimationFrame(() => {
      document
        .querySelector(`[data-row-id="${first.id}"]`)
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }
</script>

<header class="head">
  <div class="head-icon"><ScopeAvatar {badge} size="md" /></div>
  <div class="head-text">
    <h1>{scopeLabel}</h1>
    <p>{scopeDescription(scopeId)}</p>
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
    <div class="toolbar-search">
      <SearchInput
        value={query}
        placeholder="Filter by trigger or action…"
        oninput={(v) => {
          query = v;
        }}
      />
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
      {scopeId}
      {newRowId}
      {editingId}
      {conflicts}
      onStartEdit={startEdit}
      onCommit={commit}
      onCancel={cancel}
      onDelete={remove}
      onReorder={reorder}
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
  .toolbar-search {
    flex: 1;
    max-width: 360px;
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
  /* --row-cols is the single source of truth for the binding row's column
     tracks; BindingRow and BindingEditor both read it. */
  .list-card {
    --row-cols: minmax(140px, 200px) minmax(0, 1.4fr) minmax(140px, 0.9fr) 32px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    overflow: hidden;
  }
</style>
