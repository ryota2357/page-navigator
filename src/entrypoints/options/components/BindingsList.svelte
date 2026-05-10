<script lang="ts">
  import type { Binding } from "../../../lib/types";
  import BindingRow from "./BindingRow.svelte";

  type Props = {
    bindings: Binding[];
    onUpdate: (b: Binding) => void;
    onDelete: (id: string) => void;
    onAdd: () => void;
  };

  const { bindings, onUpdate, onDelete, onAdd }: Props = $props();
</script>

<section class="bindings">
  {#if bindings.length === 0}
    <div class="empty">
      <p>No bindings yet.</p>
      <button type="button" class="primary" onclick={onAdd}>
        + Add your first binding
      </button>
    </div>
  {:else}
    <div class="list">
      <div class="header">
        <div>Trigger</div>
        <div>Action</div>
        <div>Options</div>
        <div></div>
      </div>
      {#each bindings as b (b.id)}
        <BindingRow
          binding={b}
          onUpdate={(next) => onUpdate(next)}
          onDelete={() => onDelete(b.id)}
        />
      {/each}
    </div>
  {/if}
</section>

<style>
  .bindings {
    padding: 20px 24px 24px;
    flex: 1;
  }

  .empty {
    border: 1px dashed #d8d3c8;
    border-radius: 6px;
    padding: 36px 20px;
    text-align: center;
    color: #5b554d;
  }
  .empty p {
    margin: 0 0 12px;
    font-size: 12px;
  }
  button.primary {
    background: #1a1815;
    color: #faf9f7;
    border: 1px solid #1a1815;
    border-radius: 4px;
    padding: 5px 12px;
    cursor: pointer;
    font-size: 12px;
  }
  button.primary:hover {
    background: #2a2520;
  }

  .list {
    display: flex;
    flex-direction: column;
    border: 1px solid #e6e3dd;
    border-radius: 6px;
    overflow: hidden;
    background: #fff;
  }

  .header {
    display: grid;
    grid-template-columns: 220px 1fr 1fr 32px;
    gap: 12px;
    padding: 8px 12px;
    border-bottom: 1px solid #e6e3dd;
    background: #f4f2ee;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #8a857a;
  }
</style>
