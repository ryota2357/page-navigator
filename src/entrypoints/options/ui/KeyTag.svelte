<script lang="ts">
  import type { Trigger } from "@/lib/keys";
  import { formatTrigger } from "../lib/display";

  interface Props {
    trigger: Trigger;
    conflict?: boolean;
    removable?: boolean;
    onRemove?: () => void;
  }

  let {
    trigger,
    conflict = false,
    removable = false,
    onRemove,
  }: Props = $props();

  const text = $derived(formatTrigger(trigger));
</script>

<span class="tkey" class:conflict class:removable>
  <span class="text">{text}</span>
  {#if removable}
    <button
      type="button"
      class="x"
      title="Remove"
      aria-label="Remove trigger"
      onclick={(e) => {
        e.stopPropagation();
        onRemove?.();
      }}
    >
      ×
    </button>
  {/if}
</span>

<style>
  .tkey {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-bottom-width: 1.5px;
    border-radius: 5px;
    font-family: var(--font-mono);
    font-size: 11.5px;
    color: var(--text-1);
    line-height: 1;
    height: 22px;
  }
  .tkey.removable {
    padding-right: 4px;
  }
  .tkey.conflict {
    border-color: var(--danger-bd);
    background: var(--danger-bg);
    color: var(--danger);
  }
  .text {
    white-space: nowrap;
  }
  .x {
    border: 0;
    background: transparent;
    color: var(--text-3);
    width: 14px;
    height: 14px;
    border-radius: 3px;
    display: grid;
    place-items: center;
    cursor: default;
    font-size: 12px;
    line-height: 1;
    padding: 0;
  }
  .x:hover {
    background: var(--hover);
    color: var(--text-1);
  }
</style>
