<script lang="ts">
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();
</script>

<kbd class="kbd">{@render children()}</kbd>

<style>
  .kbd {
    display: inline-block;
    vertical-align: baseline;
    font-family: var(--font-mono);
    font-size: 10px;
    line-height: 1;
    color: var(--text-2);
    background: var(--surface);
    border: 1px solid var(--border);
    border-bottom-width: 1.5px;
    border-radius: 4px;
    padding: 2px 5px;
  }
</style>
