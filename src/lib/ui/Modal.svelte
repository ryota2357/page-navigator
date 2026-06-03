<script lang="ts">
  import type { Snippet } from "svelte";

  // `close` is exposed through every snippet so internal close buttons can
  // trigger the native <dialog> close path — which fires `onclose`, which in
  // turn invokes the parent's `onClose`. Keeps the close logic single-sourced
  // rather than duplicating "set showXxx = false" everywhere.
  type Helpers = { close: () => void };

  interface Props {
    ariaLabel: string;
    // Pass title/subtitle for the default header (title + × close). For a fully
    // custom header (e.g. the capture modal's pulsing dot), pass `head` instead.
    title?: string;
    subtitle?: string;
    width?: number;
    closeOnBackdrop?: boolean;
    onClose: () => void;
    // Return "prevent" to suppress Esc-to-close — used by the key-capture modal
    // where Esc is itself a bindable key.
    onCancel?: () => "prevent" | undefined;
    head?: Snippet<[Helpers]>;
    children: Snippet<[Helpers]>;
    foot?: Snippet<[Helpers]>;
  }

  let {
    ariaLabel,
    title,
    subtitle,
    width = 560,
    closeOnBackdrop = true,
    onClose,
    onCancel,
    head,
    children,
    foot,
  }: Props = $props();

  let dialog: HTMLDialogElement | undefined = $state();

  $effect(() => {
    dialog?.showModal();
  });

  function close() {
    dialog?.close();
  }

  const helpers: Helpers = { close };
</script>

<dialog
  class="modal"
  bind:this={dialog}
  aria-label={ariaLabel}
  style:--modal-w="{width}px"
  onclose={onClose}
  oncancel={(e) => {
    if (onCancel?.() === "prevent") e.preventDefault();
  }}
  onclick={(e) => {
    if (closeOnBackdrop && e.target === dialog) close();
  }}
>
  {#if head}
    <header class="modal-head">{@render head(helpers)}</header>
  {:else if title}
    <header class="modal-head">
      <div class="titles">
        <h1>{title}</h1>
        {#if subtitle}
          <p class="sub">{subtitle}</p>
        {/if}
      </div>
      <button
        type="button"
        class="close-btn"
        title="Close"
        aria-label="Close"
        onclick={close}
      >
        ×
      </button>
    </header>
  {/if}
  <div class="modal-body">{@render children(helpers)}</div>
  {#if foot}
    <footer class="modal-foot">{@render foot(helpers)}</footer>
  {/if}
</dialog>

<style>
  .modal {
    margin: 12vh auto auto;
    padding: 0;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    box-shadow: var(--shadow-modal);
    width: min(var(--modal-w), calc(100vw - 32px));
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: modal-fadein 0.15s ease-out;
  }
  .modal::backdrop {
    background: rgba(0, 0, 0, 0.32);
    backdrop-filter: blur(2px);
  }
  @keyframes modal-fadein {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  .modal-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 18px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .modal-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    /* Flex column so a consumer can hand its content a definite height via
       `flex: 1; min-height: 0` and own its scrolling, instead of letting the
       whole body scroll. Plain-flow consumers are unaffected. */
    display: flex;
    flex-direction: column;
  }
  .modal-foot {
    padding: 12px 18px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--canvas);
    flex-shrink: 0;
  }

  /* Header/footer helpers consumers can reuse: the default header above uses
     them, and custom `head` snippets (e.g. the capture modal) reuse the title
     styles so headings stay consistent. */
  :global(.modal .close-btn) {
    appearance: none;
    border: 0;
    background: transparent;
    cursor: default;
    font-size: 18px;
    color: var(--text-3);
    line-height: 1;
    padding: 2px 6px;
    border-radius: 5px;
  }
  :global(.modal .close-btn:hover) {
    background: var(--hover);
    color: var(--text-1);
  }
  :global(.modal .titles h1) {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 2px;
  }
  :global(.modal .titles .sub) {
    font-size: 12px;
    color: var(--text-2);
    margin: 0;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  :global(.modal .modal-foot .spacer) {
    flex: 1;
  }
</style>
