<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    title: string;
    onclick: () => void;
    children: Snippet;
  }

  let { title, onclick, children }: Props = $props();
</script>

<button type="button" class="icon-button" {title} aria-label={title} {onclick}>
  {@render children()}
</button>

<style>
  .icon-button {
    appearance: none;
    border: 0;
    background: transparent;
    color: var(--text-3);
    width: 28px;
    height: 28px;
    border-radius: var(--r-md);
    display: grid;
    place-items: center;
    flex-shrink: 0;
    cursor: pointer;
    transition:
      background 0.12s,
      color 0.12s;
  }
  .icon-button:hover {
    background: var(--hover);
    color: var(--text-1);
  }
</style>
