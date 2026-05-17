<script lang="ts">
  import Icon from "./Icon.svelte";

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  let dialog: HTMLDialogElement | undefined = $state();

  $effect(() => {
    dialog?.showModal();
  });

  // UI-only stub: the dialog exercises the layout the import flow will use
  // (file picker, scope table, merge/replace toggle) but doesn't actually
  // parse a file or mutate storage yet.
  type ScopeRow = {
    id: string;
    name: string;
    count: number;
    include: boolean;
    mode: "merge" | "replace";
  };
  let rows = $state<ScopeRow[]>([
    { id: "global", name: "Global", count: 0, include: true, mode: "replace" },
    { id: "google", name: "Google", count: 0, include: true, mode: "replace" },
  ]);

  const includedCount = $derived(rows.filter((r) => r.include).length);

  function toggleInclude(id: string) {
    rows = rows.map((r) => (r.id === id ? { ...r, include: !r.include } : r));
  }
  function setMode(id: string, mode: "merge" | "replace") {
    rows = rows.map((r) => (r.id === id ? { ...r, mode } : r));
  }
</script>

<dialog
  class="modal"
  bind:this={dialog}
  aria-label="Import"
  onclose={onClose}
  onclick={(e) => {
    if (e.target === dialog) dialog.close();
  }}
>
  <header class="head">
    <div>
      <h1>Import settings</h1>
      <p class="sub">Pick which scopes to read from the JSON file.</p>
    </div>
    <button type="button" class="close" onclick={() => dialog?.close()}>
      ×
    </button>
  </header>

  <div class="body">
    <div class="dropzone">
      <Icon name="import" size={18} />
      <div class="file">
        <b>No file selected</b>
        <span>JSON exported from page-navigator</span>
      </div>
      <button type="button" class="btn">Choose file…</button>
    </div>

    <div class="scopes-head">
      <span class="title">Scopes in file</span>
      <span class="count">{includedCount} / {rows.length} selected</span>
    </div>

    {#each rows as r (r.id)}
      <div class="scope-row">
        <button
          type="button"
          class="checkbox"
          data-on={String(r.include)}
          aria-checked={r.include}
          aria-label={`Include ${r.name}`}
          role="checkbox"
          onclick={() => toggleInclude(r.id)}
        ></button>
        <div class="nm">
          {#if r.id === "global"}
            <Icon name="globe" size={14} />
          {/if}
          <span>{r.name}</span>
        </div>
        <div class="cnt">{r.count} bindings</div>
        <div class="seg" class:disabled={!r.include}>
          <button
            type="button"
            data-on={String(r.mode === "merge")}
            onclick={() => setMode(r.id, "merge")}
            disabled={!r.include}
          >
            Merge
          </button>
          <button
            type="button"
            data-on={String(r.mode === "replace")}
            onclick={() => setMode(r.id, "replace")}
            disabled={!r.include}
          >
            Replace
          </button>
        </div>
      </div>
    {/each}

    <div class="note">
      <b>Merge:</b>
      Keep existing bindings; add new ones. Duplicate triggers will be flagged
      as conflicts.
      <br>
      <b>Replace:</b>
      Delete existing bindings in this scope before importing.
    </div>
  </div>

  <footer class="foot">
    <button type="button" class="btn ghost" onclick={() => dialog?.close()}>
      Cancel
    </button>
    <button type="button" class="btn primary" disabled>
      Apply ({includedCount})
    </button>
  </footer>
</dialog>

<style>
  .modal {
    margin: 12vh auto auto;
    padding: 0;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    box-shadow: var(--shadow-modal);
    width: min(640px, calc(100vw - 32px));
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .modal::backdrop {
    background: rgba(20, 18, 15, 0.32);
    backdrop-filter: blur(2px);
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 16px 18px;
    border-bottom: 1px solid var(--border);
  }
  .head h1 {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 2px;
  }
  .sub {
    font-size: 12px;
    color: var(--text-2);
    margin: 0;
  }
  .close {
    border: 0;
    background: transparent;
    cursor: default;
    font-size: 18px;
    color: var(--text-3);
    line-height: 1;
    padding: 2px 6px;
    border-radius: 5px;
  }
  .close:hover {
    background: var(--hover);
    color: var(--text-1);
  }
  .body {
    padding: 14px 18px;
    overflow-y: auto;
  }
  .dropzone {
    border: 1.5px dashed var(--border-strong);
    border-radius: var(--r-md);
    padding: 14px;
    background: var(--canvas);
    font-size: 12.5px;
    color: var(--text-2);
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .file {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 1px;
  }
  .file b {
    color: var(--text-1);
    font-weight: 500;
    font-family: var(--font-mono);
    font-size: 12.5px;
  }
  .file span {
    font-size: 11.5px;
    color: var(--text-3);
  }

  .scopes-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin: 18px 0 6px;
  }
  .title {
    font-size: 11px;
    color: var(--text-3);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-weight: 600;
  }
  .count {
    font-size: 11.5px;
    color: var(--text-3);
  }

  .scope-row {
    display: grid;
    grid-template-columns: 32px 1fr auto auto;
    gap: 12px;
    align-items: center;
    padding: 10px 4px;
    border-bottom: 1px solid var(--border);
  }
  .scope-row:last-of-type {
    border-bottom: 0;
  }
  .nm {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
  }
  .cnt {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-3);
  }
  .seg {
    display: flex;
    background: var(--subtle);
    border-radius: var(--r-sm);
    padding: 2px;
  }
  .seg.disabled {
    opacity: 0.45;
  }
  .seg button {
    appearance: none;
    border: 0;
    background: transparent;
    padding: 3px 9px;
    border-radius: 3px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-2);
    cursor: default;
  }
  .seg button[data-on="true"] {
    background: var(--surface);
    color: var(--text-1);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  }
  .checkbox {
    appearance: none;
    width: 16px;
    height: 16px;
    border: 1.5px solid var(--border-strong);
    border-radius: 3px;
    background: var(--surface);
    cursor: default;
    display: grid;
    place-items: center;
    padding: 0;
  }
  .checkbox[data-on="true"] {
    background: var(--accent);
    border-color: var(--accent);
  }
  .checkbox[data-on="true"]::after {
    content: "";
    width: 8px;
    height: 4px;
    border-left: 1.5px solid #fff;
    border-bottom: 1.5px solid #fff;
    transform: rotate(-45deg) translate(0, -1px);
  }
  .note {
    background: var(--subtle);
    padding: 10px 12px;
    border-radius: var(--r-md);
    font-size: 11.5px;
    color: var(--text-2);
    line-height: 1.5;
    margin-top: 14px;
  }
  .note b {
    color: var(--text-1);
    font-weight: 500;
  }
  .foot {
    padding: 12px 18px;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    background: var(--canvas);
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
    font: inherit;
    font-size: 12.5px;
    cursor: default;
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
