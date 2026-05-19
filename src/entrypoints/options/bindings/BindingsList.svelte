<script lang="ts">
  import type { Action, ActionId } from "@/lib/action";
  import type { ScopeId } from "@/lib/scopes";
  import type { Binding } from "@/lib/storage";
  import { bindingHasConflict } from "../lib/conflicts";
  import SortableList from "../ui/SortableList.svelte";
  import BindingRow from "./BindingRow.svelte";

  // The new-row slot is rendered outside SortableList so a half-typed binding
  // never participates in reorder readback. Sortable sees only committed
  // bindings; the new row is appended visually below.
  interface Props {
    bindings: Binding[];
    actions: Record<ActionId, Action>;
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
    actions,
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

<SortableList
  items={bindings}
  {onReorder}
  handle=".row > .cell.handle .grip"
  class="rows"
>
  {#snippet item(b)}
    <BindingRow
      binding={b}
      {actions}
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
  {/snippet}
</SortableList>

{#if newRowId !== null}
  <div class="new-row" class:after-rows={bindings.length > 0}>
    <BindingRow
      binding={null}
      {actions}
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

<style>
  :global(.rows) {
    display: flex;
    flex-direction: column;
  }
  /* The last committed row's bottom border would double up with the
     surrounding card's bottom border (when no new-row) or with the new-row's
     top border. Drop it. The selector lives here because the wrapper that
     decides "lastness" belongs to SortableList, not BindingRow. */
  :global(.rows .sortable-item:last-child .row) {
    border-bottom: 0;
  }
  /* Only separate the new row from a non-empty committed list — otherwise
     the toolbar's bottom border already serves as the separator. */
  .new-row.after-rows {
    border-top: 1px solid var(--border);
  }
</style>
