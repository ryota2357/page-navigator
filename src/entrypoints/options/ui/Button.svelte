<script lang="ts">
  import type { Snippet } from "svelte";

  type Variant = "default" | "primary" | "ghost" | "ghost-danger";

  interface Props {
    variant?: Variant;
    type?: "button" | "submit";
    disabled?: boolean;
    title?: string;
    ariaLabel?: string;
    onclick?: (e: MouseEvent) => void;
    children: Snippet;
  }

  let {
    variant = "default",
    type = "button",
    disabled = false,
    title,
    ariaLabel,
    onclick,
    children,
  }: Props = $props();
</script>

<button
  {type}
  {disabled}
  {title}
  {onclick}
  class="btn"
  data-variant={variant}
  aria-label={ariaLabel}
>
  {@render children()}
</button>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 30px;
    padding: 0 12px;
    border-radius: var(--r-md);
    font: inherit;
    font-size: 12.5px;
    cursor: default;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-1);
    flex-shrink: 0;
  }
  .btn:hover {
    background: var(--hover);
    border-color: var(--border-strong);
  }
  .btn[data-variant="primary"] {
    background: var(--accent);
    color: var(--accent-fg);
    border-color: var(--accent);
  }
  .btn[data-variant="primary"]:hover {
    background: #2c2924;
  }
  .btn[data-variant="ghost"] {
    background: transparent;
    border-color: transparent;
    color: var(--text-2);
  }
  .btn[data-variant="ghost"]:hover {
    background: var(--hover);
    color: var(--text-1);
  }
  .btn[data-variant="ghost-danger"] {
    background: transparent;
    border-color: transparent;
    color: var(--danger);
  }
  .btn[data-variant="ghost-danger"]:hover {
    background: var(--danger-bg);
    color: var(--danger);
  }
  .btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
</style>
