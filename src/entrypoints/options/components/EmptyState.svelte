<script lang="ts">
  import Icon from "./Icon.svelte";

  interface Props {
    scopeLabel: string;
    onAdd: () => void;
  }

  let { scopeLabel, onAdd }: Props = $props();
</script>

<div class="empty">
  <h1>No bindings in {scopeLabel} yet</h1>
  <p>Add your first binding to start mapping keys to actions in this scope.</p>
  <button type="button" class="add" onclick={onAdd}>
    <Icon name="plus" size={14} />
    Add a binding
  </button>
</div>

<style>
  .empty {
    padding: 56px 28px 80px;
    max-width: 720px;
    margin: 0 auto;
    text-align: center;
  }
  h1 {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.01em;
    margin: 0 0 6px;
  }
  p {
    font-size: 13px;
    color: var(--text-2);
    margin: 0 0 24px;
  }
  .add {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 14px;
    background: var(--accent);
    color: var(--accent-fg);
    border: 1px solid var(--accent);
    border-radius: var(--r-md);
    font: inherit;
    font-size: 12.5px;
    cursor: default;
  }
  .add:hover {
    background: #2c2924;
  }
</style>
