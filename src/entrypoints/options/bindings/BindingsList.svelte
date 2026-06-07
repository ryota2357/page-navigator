<script lang="ts">
  import type { Action, ActionId } from "@/lib/action";
  import type { ScopeId } from "@/lib/scopes";
  import type { Binding, BindingId } from "@/lib/storage";
  import SortableList from "@/lib/ui/SortableList.svelte";
  import BindingEditor from "./BindingEditor.svelte";
  import BindingRow from "./BindingRow.svelte";

  // Each committed binding renders as a view row, or the editor when it's the
  // one being edited. The new-row draft renders outside SortableList so a
  // half-typed binding never participates in reorder readback.
  interface Props {
    bindings: Binding[];
    actions: Record<ActionId, Action>;
    scopeId: ScopeId;
    newRowId: BindingId | null;
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
    actions,
    scopeId,
    newRowId,
    editingId,
    conflicts,
    onStartEdit,
    onCommit,
    onCancel,
    onDelete,
    onReorder,
  }: Props = $props();
</script>

<SortableList
  items={bindings}
  {onReorder}
  handle=".row > .cell.handle .grip"
  class="rows"
>
  {#snippet item(b)}
    {#if editingId === b.id}
      <BindingEditor
        binding={b}
        {actions}
        {scopeId}
        rowId={b.id}
        {conflicts}
        {onCommit}
        onCancel={() => onCancel(b.id)}
        onDelete={() => onDelete(b.id)}
      />
    {:else}
      <BindingRow
        binding={b}
        {actions}
        {conflicts}
        onStartEdit={() => onStartEdit(b.id)}
      />
    {/if}
  {/snippet}
</SortableList>

{#if newRowId !== null}
  <div class="new-row" class:after-rows={bindings.length > 0}>
    <BindingEditor
      binding={null}
      {actions}
      {scopeId}
      rowId={newRowId}
      {conflicts}
      {onCommit}
      onCancel={() => onCancel(newRowId)}
      onDelete={() => onDelete(newRowId)}
    />
  </div>
{/if}

<style>
  :global(.rows) {
    display: flex;
    flex-direction: column;
  }
  /* The last committed view row's bottom border would double up with the card's
     own bottom border (or the new-row's top border). Drop it. The selector
     lives here because "lastness" belongs to the list, not the row. */
  :global(.rows .sortable-item:last-child .row) {
    border-bottom: 0;
  }
  /* Only separate the new row from a non-empty committed list — otherwise the
     toolbar's bottom border already serves as the separator. */
  .new-row.after-rows {
    border-top: 1px solid var(--border);
  }
</style>
