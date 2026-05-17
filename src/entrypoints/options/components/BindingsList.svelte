<script lang="ts">
  import type { ScopeId } from "@/lib/scopes";
  import type { Binding } from "@/lib/storage";
  import { bindingHasConflict } from "../conflicts";
  import { sortable } from "../sortable.svelte";
  import BindingRow from "./BindingRow.svelte";

  // The new-row slot is rendered outside the sortable container so a
  // half-typed binding never participates in reorder readback. Sortable
  // only sees committed bindings; the new row is appended visually below.
  interface Props {
    bindings: Binding[];
    newRowId: string | null;
    scopeId: ScopeId;
    editingId: string | null;
    conflicts: Set<string>;
    onStartEdit: (id: string) => void;
    onCommit: (next: Binding) => void;
    onCancel: (id: string) => void;
    onDelete: (id: string) => void;
    onReorder: (next: Binding[]) => void;
  }

  let {
    bindings,
    newRowId,
    scopeId,
    editingId,
    conflicts,
    onStartEdit,
    onCommit,
    onCancel,
    onDelete,
    onReorder,
  }: Props = $props();
</script>

<div class="bindings">
  <div class="header">
    <div>Trigger</div>
    <div>Action</div>
    <div>Options</div>
    <div class="bh-handle"></div>
  </div>
  <div
    class="rows"
    use:sortable={{
      items: bindings,
      onReorder,
      handle: ".row > .cell.handle .grip",
    }}
  >
    {#each bindings as b (b.id)}
      <BindingRow
        binding={b}
        {scopeId}
        rowId={b.id}
        editing={editingId === b.id}
        isConflict={bindingHasConflict(b, conflicts)}
        triggerConflicts={conflicts}
        onStartEdit={() => onStartEdit(b.id)}
        {onCommit}
        onCancel={() => onCancel(b.id)}
        onDelete={() => onDelete(b.id)}
      />
    {/each}
  </div>
  {#if newRowId !== null}
    <div class="new-row">
      <BindingRow
        binding={null}
        {scopeId}
        rowId={newRowId}
        editing={editingId === newRowId}
        isConflict={false}
        triggerConflicts={conflicts}
        onStartEdit={() => onStartEdit(newRowId)}
        {onCommit}
        onCancel={() => onCancel(newRowId)}
        onDelete={() => onDelete(newRowId)}
      />
    </div>
  {/if}
</div>

<style>
  .bindings {
    padding: 4px 28px 80px;
  }
  .header {
    display: grid;
    grid-template-columns:
      minmax(140px, 200px)
      minmax(0, 1fr)
      minmax(170px, 1fr)
      32px;
    gap: 14px;
    padding: 10px 12px 8px;
    font-size: 10.5px;
    color: var(--text-3);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-weight: 600;
    border-bottom: 1px solid var(--border);
  }
  .bh-handle {
    color: transparent;
  }
  .rows {
    display: flex;
    flex-direction: column;
  }
  .new-row {
    display: flex;
    flex-direction: column;
  }
  :global(.sortable-ghost) {
    opacity: 0.35;
  }
  :global(.sortable-chosen) {
    cursor: grabbing;
  }
  :global(.sortable-drag) {
    box-shadow: var(--shadow-pop);
  }
</style>
