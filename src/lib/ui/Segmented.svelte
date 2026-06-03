<script lang="ts" generics="T extends string">
  // `outline` is the bordered control used in Preferences; `soft` is the inset
  // pill control used inside the import dialog. One component, two looks.
  type Variant = "outline" | "soft";

  interface Props {
    options: readonly { value: T; label: string }[];
    value: T;
    ariaLabel: string;
    variant?: Variant;
    disabled?: boolean;
    onChange: (value: T) => void;
  }

  let {
    options,
    value,
    ariaLabel,
    variant = "outline",
    disabled = false,
    onChange,
  }: Props = $props();
</script>

<div
  class="seg"
  data-variant={variant}
  class:disabled
  role="group"
  aria-label={ariaLabel}
>
  {#each options as opt (opt.value)}
    <button
      type="button"
      class="seg-btn"
      class:active={value === opt.value}
      aria-pressed={value === opt.value}
      {disabled}
      onclick={() => onChange(opt.value)}
    >
      {opt.label}
    </button>
  {/each}
</div>

<style>
  .seg {
    display: inline-flex;
    flex-shrink: 0;
  }
  .seg.disabled {
    opacity: 0.45;
  }
  .seg-btn {
    appearance: none;
    font: inherit;
    cursor: default;
  }
  .seg-btn:disabled {
    cursor: not-allowed;
  }

  /* outline */
  .seg[data-variant="outline"] {
    border: 1px solid var(--border-input);
    border-radius: var(--r-sm);
    background: var(--surface);
    overflow: hidden;
  }
  .seg[data-variant="outline"] .seg-btn {
    border: 0;
    border-left: 1px solid var(--border-input);
    height: 30px;
    padding: 0 14px;
    background: transparent;
    font-size: 12.5px;
    color: var(--text-2);
  }
  .seg[data-variant="outline"] .seg-btn:first-child {
    border-left: 0;
  }
  .seg[data-variant="outline"] .seg-btn:hover {
    background: var(--hover);
  }
  .seg[data-variant="outline"] .seg-btn.active {
    background: var(--accent);
    color: var(--accent-fg);
  }
  .seg[data-variant="outline"] .seg-btn.active:hover {
    background: var(--accent-hover);
  }

  /* soft */
  .seg[data-variant="soft"] {
    background: var(--subtle);
    border-radius: var(--r-sm);
    padding: 2px;
  }
  .seg[data-variant="soft"] .seg-btn {
    border: 0;
    background: transparent;
    padding: 3px 9px;
    border-radius: 3px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-2);
  }
  .seg[data-variant="soft"] .seg-btn.active {
    background: var(--surface);
    color: var(--text-1);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  }
</style>
