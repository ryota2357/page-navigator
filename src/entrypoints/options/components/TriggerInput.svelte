<script lang="ts">
  import { normalize } from "../../../lib/keys";

  type Props = {
    triggers: string[][];
    onChange: (next: string[][]) => void;
  };

  const { triggers, onChange }: Props = $props();

  // Each tag in the UI is one Trigger (a KeyToken sequence). Adding a new
  // tag puts the row into "capturing" mode: keystrokes accumulate into
  // `pending` until the user explicitly commits (Enter / ✓ button) or
  // cancels (Escape / ✗ button / click outside the chip).
  //
  // Enter / Escape are reserved as commit / cancel during capture; binding
  // them as actual keys is not supported via this UI for now (storage
  // edits still work, and the loader canonicalizes them — see
  // docs/dev/step-04-notes.md).
  let capturing = $state(false);
  let pending = $state<string[]>([]);
  let chipEl: HTMLSpanElement | undefined = $state();

  function enterCapture() {
    pending = [];
    capturing = true;
  }
  function commit() {
    if (pending.length > 0) {
      onChange([...triggers, pending]);
    }
    capturing = false;
    pending = [];
  }
  function cancel() {
    capturing = false;
    pending = [];
  }
  function removeAt(i: number) {
    onChange(triggers.filter((_, j) => j !== i));
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
      return;
    }
    // Plain Enter is the commit gesture. Modifier-Enter would be a real
    // bindable token, but pn doesn't expose it via this UI yet.
    if (
      e.key === "Enter" &&
      !e.ctrlKey &&
      !e.altKey &&
      !e.metaKey &&
      !e.shiftKey
    ) {
      e.preventDefault();
      commit();
      return;
    }

    const token = normalize(e);
    if (token === null) return; // composition or modifier-only press
    e.preventDefault();
    e.stopPropagation();
    pending = [...pending, token];
  }

  function onPointerDown(e: PointerEvent) {
    if (chipEl && !chipEl.contains(e.target as Node)) {
      cancel();
    }
  }

  $effect(() => {
    if (!capturing) return;
    // Capture-phase listeners so we win over inputs that happen to be
    // focused. Deferred via timeout 0 so the click that opened capture
    // mode doesn't immediately close it via the outside-click handler.
    let active = false;
    const t = setTimeout(() => {
      window.addEventListener("keydown", onKeydown, true);
      document.addEventListener("pointerdown", onPointerDown, true);
      active = true;
    }, 0);
    return () => {
      clearTimeout(t);
      if (active) {
        window.removeEventListener("keydown", onKeydown, true);
        document.removeEventListener("pointerdown", onPointerDown, true);
      }
    };
  });
</script>

<div class="trigger-input">
  {#each triggers as t, i (i)}
    <span class="tag">
      <span class="seq">{t.join(" ")}</span>
      <button
        type="button"
        class="x"
        title="Remove"
        onclick={() => removeAt(i)}
      >
        ×
      </button>
    </span>
  {/each}

  {#if capturing}
    <span class="tag pending" bind:this={chipEl}>
      {#if pending.length === 0}
        <span class="hint">press a key…</span>
      {:else}
        <span class="seq">{pending.join(" ")}</span>
      {/if}
      <button
        type="button"
        class="ok"
        title="Commit (Enter)"
        onclick={commit}
        disabled={pending.length === 0}
      >
        ✓
      </button>
      <button type="button" class="x" title="Cancel (Esc)" onclick={cancel}>
        ×
      </button>
    </span>
  {:else}
    <button type="button" class="add" onclick={enterCapture}>+ Add</button>
  {/if}
</div>

<style>
  .trigger-input {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    background: #f4f2ee;
    border: 1px solid #e6e3dd;
    border-radius: 4px;
    padding: 2px 4px 2px 6px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
  }
  .tag.pending {
    background: #fff;
    border-color: #1a1815;
    box-shadow: 0 0 0 2px #1a181522;
  }

  .seq {
    color: #1a1815;
  }
  .hint {
    color: #8a857a;
    font-style: italic;
  }

  .tag button {
    border: 0;
    background: transparent;
    cursor: pointer;
    color: #5b554d;
    font-size: 11px;
    line-height: 1;
    padding: 0 4px;
    border-radius: 3px;
  }
  .tag button:hover {
    background: #ece8e0;
  }
  .tag button:disabled {
    color: #c8c2b6;
    cursor: not-allowed;
  }

  button.add {
    border: 1px dashed #d8d3c8;
    background: transparent;
    border-radius: 4px;
    padding: 2px 8px;
    cursor: pointer;
    font-size: 11px;
    color: #5b554d;
  }
  button.add:hover {
    background: #f4f2ee;
    border-color: #b3ad9f;
    color: #1a1815;
  }
</style>
