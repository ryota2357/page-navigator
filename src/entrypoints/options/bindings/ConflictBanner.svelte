<script lang="ts">
  import TriangleAlert from "@lucide/svelte/icons/triangle-alert";

  interface Props {
    count: number;
    onJump: () => void;
  }

  let { count, onJump }: Props = $props();
</script>

<div class="alert" role="alert">
  <TriangleAlert size={14} />
  <div class="body">
    <b>{count} key conflict{count === 1 ? "" : "s"}</b>
    <span>
      The same trigger is bound to multiple bindings. None of them will fire
      until the conflict is resolved.
    </span>
  </div>
  <button type="button" class="jump" onclick={onJump}>
    Jump to first conflict
  </button>
</div>

<style>
  .alert {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    background: var(--danger-bg);
    border: 1px solid var(--danger-bd);
    border-radius: var(--r-md);
    font-size: 12.5px;
    color: var(--danger);
    line-height: 1.5;
  }
  .body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .body b {
    font-weight: 600;
  }
  .jump {
    appearance: none;
    background: transparent;
    border: 0;
    color: var(--danger);
    font: inherit;
    font-size: 11.5px;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: default;
  }
  .jump:hover {
    background: rgba(180, 35, 24, 0.08);
  }
</style>
