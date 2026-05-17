<script lang="ts">
  import {
    encodeKeyToken,
    isImeComposing,
    isModifierKey,
    type KeyToken,
    type Trigger,
  } from "@/lib/keys";
  import { displayKeyToken } from "../triggerFormat";
  import Icon from "./Icon.svelte";

  interface Props {
    onCancel: () => void;
    onCommit: (trigger: Trigger) => void;
  }

  let { onCancel, onCommit }: Props = $props();

  let sequence = $state<KeyToken[]>([]);
  let mods = $state({ ctrl: false, shift: false, alt: false, meta: false });
  let dialog: HTMLDialogElement | undefined = $state();

  $effect(() => {
    dialog?.showModal();
  });

  // Window-level capture-phase listeners so every key (including Tab, Enter,
  // Esc) reaches the modal first and gets captured as a binding token rather
  // than activating buttons, moving focus, or being handled by anything else.
  // <dialog>'s native Esc-to-close is disabled via the cancel handler below.
  $effect(() => {
    function readMods(e: KeyboardEvent) {
      mods = {
        ctrl: e.ctrlKey,
        shift: e.shiftKey,
        alt: e.altKey,
        meta: e.metaKey,
      };
    }
    function onKey(e: KeyboardEvent) {
      e.preventDefault();
      e.stopPropagation();
      readMods(e);
      if (isImeComposing(e) || isModifierKey(e)) return;
      sequence = [...sequence, encodeKeyToken(e)];
    }
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("keyup", readMods, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("keyup", readMods, true);
    };
  });

  function popLast() {
    sequence = sequence.slice(0, -1);
  }
  function clear() {
    sequence = [];
  }
  function commit() {
    if (sequence.length === 0) return;
    onCommit(sequence);
  }
</script>

<dialog
  class="modal"
  bind:this={dialog}
  aria-label="Capture key"
  onclose={onCancel}
  oncancel={(e) => e.preventDefault()}
  onclick={(e) => {
    if (e.target === dialog) dialog.close();
  }}
>
  <header class="head">
    <span class="dot" aria-hidden="true"></span>
    <div class="titles">
      <h1>Capturing keys…</h1>
      <p class="sub">
        <Icon name="keyboard" size={11} />
        Press any key to append to the sequence.
      </p>
    </div>
  </header>

  <div class="body">
    <div class="stage">
      {#if sequence.length === 0}
        <div class="empty">
          <span class="empty-icon"><Icon name="record" size={20} /></span>
          <div>
            <b>Press a key</b>
            <span class="hint">
              e.g. <code>j</code> ·
              <code>&lt;C-a&gt;</code>
              ·
              <code>g g</code>
              (multi-step sequence)
            </span>
          </div>
        </div>
      {:else}
        <div class="seq">
          {#each sequence as token, i (i)}
            <span class="tok" class:flash={i === sequence.length - 1}>
              {displayKeyToken(token)}
            </span>
          {/each}
          <span class="caret" aria-hidden="true"></span>
        </div>
      {/if}
    </div>

    <div class="mods">
      <span class="mods-label">Modifiers</span>
      <span class="chip" class:on={mods.ctrl}>Ctrl</span>
      <span class="chip" class:on={mods.shift}>Shift</span>
      <span class="chip" class:on={mods.alt}>Alt</span>
      <span class="chip" class:on={mods.meta}>⌘ / Meta</span>
      <span class="captured">
        {sequence.length}
        key{sequence.length === 1 ? "" : "s"}
        captured
      </span>
    </div>
  </div>

  <footer class="foot">
    <button
      type="button"
      class="btn ghost"
      disabled={sequence.length === 0}
      onclick={popLast}
    >
      <Icon name="arrow-left" size={12} />
      Undo
    </button>
    <button
      type="button"
      class="btn ghost"
      disabled={sequence.length === 0}
      onclick={clear}
    >
      Clear
    </button>
    <span class="spacer"></span>
    <button type="button" class="btn ghost" onclick={onCancel}>Cancel</button>
    <button
      type="button"
      class="btn primary"
      disabled={sequence.length === 0}
      onclick={commit}
    >
      <Icon name="check" size={12} />
      Confirm
    </button>
  </footer>
</dialog>

<style>
  .modal {
    margin: 16vh auto auto;
    padding: 0;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    box-shadow: var(--shadow-modal);
    width: min(560px, calc(100vw - 32px));
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .modal::backdrop {
    background: rgba(20, 18, 15, 0.46);
    backdrop-filter: blur(2px);
  }

  .head {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px 20px 16px;
    border-bottom: 1px solid var(--border);
  }
  .dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--danger);
    position: relative;
    flex-shrink: 0;
  }
  .dot::before {
    content: "";
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border: 2px solid var(--danger);
    opacity: 0.4;
    animation: pulse 1.4s ease-out infinite;
  }
  @keyframes pulse {
    0% {
      transform: scale(0.6);
      opacity: 0.6;
    }
    100% {
      transform: scale(1.4);
      opacity: 0;
    }
  }
  .titles h1 {
    font-size: 14px;
    font-weight: 600;
    margin: 0;
  }
  .sub {
    font-size: 12px;
    color: var(--text-2);
    margin: 2px 0 0;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .body {
    padding: 18px 20px;
    background: var(--canvas);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .stage {
    min-height: 84px;
    border: 1.5px dashed var(--border-strong);
    border-radius: var(--r-md);
    background: var(--surface);
    padding: 14px 16px;
    display: flex;
    align-items: center;
  }
  .empty {
    display: flex;
    align-items: center;
    gap: 14px;
    color: var(--text-2);
    font-size: 12.5px;
  }
  .empty b {
    color: var(--text-1);
    display: block;
    font-weight: 500;
    margin-bottom: 2px;
  }
  .hint {
    font-size: 11.5px;
    color: var(--text-3);
  }
  .hint code {
    font-family: var(--font-mono);
    background: var(--subtle);
    padding: 0 4px;
    border-radius: 3px;
    color: var(--text-2);
  }
  .empty-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--danger-bg);
    color: var(--danger);
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .seq {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }
  .tok {
    display: inline-flex;
    align-items: center;
    padding: 4px 8px;
    height: 30px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-bottom-width: 2px;
    border-radius: 5px;
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--text-1);
  }
  .tok.flash {
    background: #fff7d6;
    border-color: #e7c97a;
    animation: tok-flash 0.28s ease-out;
  }
  @keyframes tok-flash {
    from {
      transform: translateY(-2px) scale(1.04);
    }
    to {
      transform: translateY(0) scale(1);
    }
  }
  .caret {
    width: 2px;
    height: 22px;
    background: var(--accent);
    animation: caret 1s steps(1) infinite;
  }
  @keyframes caret {
    50% {
      opacity: 0;
    }
  }

  .mods {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .mods-label {
    font-size: 11px;
    color: var(--text-3);
  }
  .chip {
    font-family: var(--font-mono);
    font-size: 10.5px;
    padding: 2px 7px;
    border-radius: 999px;
    background: var(--subtle);
    color: var(--text-3);
    border: 1px solid transparent;
    transition:
      background 0.12s,
      color 0.12s;
  }
  .chip.on {
    background: var(--accent);
    color: var(--accent-fg);
    border-color: var(--accent);
  }
  .captured {
    margin-left: auto;
    font-size: 11px;
    color: var(--text-3);
  }

  .foot {
    padding: 12px 18px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--canvas);
  }
  .spacer {
    flex: 1;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 30px;
    padding: 0 11px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    color: var(--text-1);
    font-size: 12.5px;
    cursor: default;
    font-family: inherit;
  }
  .btn:hover {
    background: var(--hover);
    border-color: var(--border-strong);
  }
  .btn.ghost {
    background: transparent;
    border-color: transparent;
    color: var(--text-2);
  }
  .btn.ghost:hover {
    background: var(--hover);
    color: var(--text-1);
  }
  .btn.primary {
    background: var(--accent);
    color: var(--accent-fg);
    border-color: var(--accent);
  }
  .btn.primary:hover {
    background: #2c2924;
  }
  .btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
</style>
