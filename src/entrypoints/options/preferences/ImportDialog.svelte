<script lang="ts">
  import Download from "@lucide/svelte/icons/download";
  import Globe from "@lucide/svelte/icons/globe";
  import Button from "../ui/Button.svelte";
  import Modal from "../ui/Modal.svelte";

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

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

<Modal ariaLabel="Import" width={640} {onClose}>
  {#snippet head({ close })}
    <div class="titles">
      <h1>Import settings</h1>
      <p class="sub">Pick which scopes to read from the JSON file.</p>
    </div>
    <button type="button" class="close-btn" onclick={close}>×</button>
  {/snippet}

  <div class="body">
    <div class="dropzone">
      <Download size={18} />
      <div class="file">
        <b>No file selected</b>
        <span>JSON exported from page-navigator</span>
      </div>
      <Button>Choose file…</Button>
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
            <Globe size={14} />
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

  {#snippet foot({ close })}
    <span class="spacer"></span>
    <Button variant="ghost" onclick={close}>Cancel</Button>
    <Button variant="primary" disabled>Apply ({includedCount})</Button>
  {/snippet}
</Modal>

<style>
  .body {
    padding: 14px 18px;
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
</style>
