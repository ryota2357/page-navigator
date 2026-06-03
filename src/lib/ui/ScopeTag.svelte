<script lang="ts">
  import type { Snippet } from "svelte";

  // The small pill marking a binding/action as site-specific (e.g. its scope
  // label). Global has no tag.
  let { children }: { children: Snippet } = $props();
</script>

<span class="scope-tag">{@render children()}</span>

<style>
  .scope-tag {
    display: inline-flex;
    align-items: center;
    font-size: 10px;
    font-weight: 500;
    padding: 1px 6px;
    border-radius: 999px;
    background: var(--site-bg);
    color: var(--site-tag);
    border: 1px solid var(--site-bd);
    white-space: nowrap;
    flex-shrink: 0;
  }
</style>
