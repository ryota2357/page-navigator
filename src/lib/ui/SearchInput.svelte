<script lang="ts">
  import { Search } from "@lucide/svelte/icons";
  import { tick } from "svelte";

  // `field` is a standalone rounded box (toolbars); `bar` is a flush, full-width
  // row meant to sit at the top of a modal body with its own bottom border.
  type Variant = "field" | "bar";

  interface Props {
    value: string;
    placeholder?: string;
    ariaLabel?: string;
    variant?: Variant;
    // Named to avoid the literal `autofocus` HTML attribute (and its a11y lint);
    // focus is driven imperatively below, only when asked.
    focusOnMount?: boolean;
    oninput: (value: string) => void;
  }

  let {
    value,
    placeholder,
    ariaLabel,
    variant = "field",
    focusOnMount = false,
    oninput,
  }: Props = $props();

  let input: HTMLInputElement | undefined = $state();

  $effect(() => {
    if (focusOnMount) tick().then(() => input?.focus());
  });
</script>

<div class="search" data-variant={variant}>
  <Search size={14} />
  <input
    bind:this={input}
    type="text"
    {value}
    {placeholder}
    aria-label={ariaLabel}
    oninput={(e) => oninput(e.currentTarget.value)}
  >
</div>

<style>
  .search {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-2);
  }
  .search input {
    flex: 1;
    border: 0;
    outline: 0;
    background: transparent;
    font: inherit;
    color: var(--text-1);
    min-width: 0;
  }

  .search[data-variant="field"] {
    height: 32px;
    padding: 0 10px;
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    background: var(--surface);
  }
  .search[data-variant="field"]:focus-within {
    border-color: var(--border-strong);
  }
  .search[data-variant="field"] input {
    font-size: 12.5px;
  }

  .search[data-variant="bar"] {
    padding: 10px 12px;
    border-bottom: 1px solid var(--border);
    /* Keep the bar at content height when it shares a flex column with a
       scrollable list (the action picker / add-site modals). */
    flex-shrink: 0;
  }
  .search[data-variant="bar"] input {
    font-size: 13px;
  }
</style>
