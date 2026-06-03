<script lang="ts">
  import type { Snippet } from "svelte";

  // One visual key chip. `sm` renders a committed trigger in a row, `md` the
  // timeout preview, `lg` the capture stage — the three places that used to
  // each carry their own near-identical chip styles.
  type Size = "sm" | "md" | "lg";
  type Tone = "default" | "conflict" | "flash";

  interface Props {
    size?: Size;
    tone?: Tone;
    removable?: boolean;
    onRemove?: () => void;
    children: Snippet;
  }

  let {
    size = "sm",
    tone = "default",
    removable = false,
    onRemove,
    children,
  }: Props = $props();
</script>

<span class="keycap" data-size={size} data-tone={tone} class:removable>
  <span class="text">{@render children()}</span>
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
  .keycap {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 5px;
    font-family: var(--font-mono);
    color: var(--text-1);
    line-height: 1;
  }
  .keycap[data-size="sm"] {
    height: 22px;
    padding: 2px 6px;
    font-size: 11.5px;
    border-bottom-width: 1.5px;
  }
  .keycap[data-size="md"] {
    height: 26px;
    padding: 4px 8px;
    font-size: 12px;
    border-bottom-width: 2px;
  }
  .keycap[data-size="lg"] {
    height: 30px;
    padding: 4px 8px;
    font-size: 13px;
    border-bottom-width: 2px;
  }
  .keycap.removable {
    padding-right: 4px;
  }
  .keycap[data-tone="conflict"] {
    border-color: var(--danger-bd);
    background: var(--danger-bg);
    color: var(--danger);
  }
  /* Brief "captured" pulse; reuses the warn tones so it adapts with the theme
     (amber on light, dim amber on dark). */
  .keycap[data-tone="flash"] {
    background: var(--warn-bg);
    border-color: var(--warn-bd);
    animation: keycap-flash 0.28s ease-out;
  }
  @keyframes keycap-flash {
    from {
      transform: translateY(-2px) scale(1.04);
    }
    to {
      transform: translateY(0) scale(1);
    }
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
