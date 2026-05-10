<script lang="ts">
  import type { Scope } from "../../../lib/types";

  type Props = {
    currentScope: Scope;
    onAdd: () => void;
  };

  const { currentScope, onAdd }: Props = $props();

  const scopeLabel = $derived(
    currentScope === "global" ? "Global" : currentScope,
  );
</script>

<header class="toolbar">
  <div class="crumb">
    <span class="kind">{scopeLabel}</span>
    <span class="sep">/</span>
    <span class="page">Bindings</span>
  </div>

  <div class="actions">
    <button type="button" class="primary" onclick={onAdd}>+ Add binding</button>
  </div>
</header>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 24px;
    border-bottom: 1px solid #e6e3dd;
    background: #faf9f7;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .crumb {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #5b554d;
    font-size: 12px;
  }
  .crumb .kind {
    color: #8a857a;
  }
  .crumb .sep {
    color: #c8c2b6;
  }
  .crumb .page {
    color: #1a1815;
    font-weight: 500;
  }

  .actions {
    display: flex;
    gap: 6px;
  }
  button.primary {
    background: #1a1815;
    color: #faf9f7;
    border: 1px solid #1a1815;
    border-radius: 4px;
    padding: 5px 10px;
    cursor: pointer;
    font-size: 12px;
  }
  button.primary:hover {
    background: #2a2520;
  }
</style>
