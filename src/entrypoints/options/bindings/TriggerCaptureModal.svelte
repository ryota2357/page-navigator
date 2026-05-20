<script lang="ts">
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import Check from "@lucide/svelte/icons/check";
  import Disc from "@lucide/svelte/icons/disc";
  import Info from "@lucide/svelte/icons/info";
  import Keyboard from "@lucide/svelte/icons/keyboard";
  import {
    encodeKeyToken,
    isImeComposing,
    isModifierKey,
    type KeyToken,
    type Trigger,
  } from "@/lib/keys";
  import { formatKeyToken } from "../lib/display";
  import Button from "../ui/Button.svelte";
  import Modal from "../ui/Modal.svelte";
  import Toggle from "../ui/Toggle.svelte";

  interface Props {
    onCancel: () => void;
    onCommit: (trigger: Trigger) => void;
  }

  let { onCancel, onCommit }: Props = $props();

  let sequence = $state<KeyToken[]>([]);
  let mods = $state({ ctrl: false, shift: false, alt: false, meta: false });
  // When OFF, bare Enter/Esc/Backspace drive Confirm/Cancel/Undo. When ON,
  // they are captured as binding tokens like any other key.
  let bindReserved = $state(false);

  // Window-level capture-phase listeners so every key (including Tab, Enter,
  // Esc) reaches the modal first and gets captured as a binding token rather
  // than activating buttons, moving focus, or being handled by anything else.
  // Native Esc-to-close is disabled via Modal's `onCancel` returning "prevent".
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
      const action = reservedAction(e);
      if (action) {
        action();
        return;
      }
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

  function hasModifier(e: KeyboardEvent): boolean {
    return e.ctrlKey || e.altKey || e.metaKey || e.shiftKey;
  }
  // A reserved key only triggers its action when bare; modified combos like
  // <C-CR> stay capturable even with the toggle off.
  function reservedAction(e: KeyboardEvent): (() => void) | null {
    if (bindReserved || hasModifier(e)) return null;
    switch (e.key) {
      case "Enter":
        return commit;
      case "Escape":
        return onCancel;
      case "Backspace":
        return popLast;
      default:
        return null;
    }
  }
</script>

<Modal ariaLabel="Capture key" onClose={onCancel} onCancel={() => "prevent"}>
  {#snippet head()}
    <div class="head-inner">
      <span class="dot" aria-hidden="true"></span>
      <div class="titles">
        <h1>Capturing keys…</h1>
        <p class="sub">
          <Keyboard size={11} />
          Press any key to append to the sequence.
        </p>
      </div>
    </div>
  {/snippet}

  <div class="body">
    <div class="stage">
      {#if sequence.length === 0}
        <div class="empty">
          <span class="empty-icon"><Disc size={20} /></span>
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
              {formatKeyToken(token)}
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

    <div class="reserved" class:on={bindReserved}>
      <Info size={13} />
      <span class="reserved-text">
        {#if bindReserved}
          <b>Capturing</b>
          ⏎ / ⎋ / ⌫ as keys — use the buttons to confirm or cancel.
        {:else}
          <kbd>⏎</kbd>
          confirms · <kbd>⎋</kbd> cancels · <kbd>⌫</kbd> undoes. Toggle to bind
          them instead.
        {/if}
      </span>
      <Toggle
        pressed={bindReserved}
        tone="ok"
        ariaLabel="Bind reserved keys"
        onChange={(next) => (bindReserved = next)}
      />
    </div>
  </div>

  {#snippet foot()}
    <Button variant="ghost" disabled={sequence.length === 0} onclick={popLast}>
      <ArrowLeft size={12} />
      Undo
    </Button>
    <Button variant="ghost" disabled={sequence.length === 0} onclick={clear}>
      Clear
    </Button>
    <span class="spacer"></span>
    <Button variant="ghost" onclick={onCancel}>Cancel</Button>
    <Button variant="primary" disabled={sequence.length === 0} onclick={commit}>
      <Check size={12} />
      Confirm
    </Button>
  {/snippet}
</Modal>

<style>
  .head-inner {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 1;
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

  .reserved {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: var(--r-md);
    background: var(--subtle);
    border: 1px solid var(--border);
    font-size: 11.5px;
    color: var(--text-2);
    transition:
      background 0.14s,
      border-color 0.14s,
      color 0.14s;
  }
  .reserved.on {
    background: var(--warn-bg);
    border-color: var(--warn-bd);
    color: var(--warn);
  }
  .reserved :global(svg) {
    flex-shrink: 0;
  }
  .reserved-text {
    flex: 1;
  }
  .reserved-text b {
    font-weight: 600;
  }
  .reserved kbd {
    font-family: var(--font-mono);
    font-size: 10px;
    padding: 0 4px;
    border-radius: 3px;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-2);
    margin: 0 2px;
  }
</style>
