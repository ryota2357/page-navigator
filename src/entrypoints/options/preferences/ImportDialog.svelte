<script lang="ts">
  import { FileJson, X } from "@lucide/svelte/icons";
  import { type ScopeId, scopeIds, scopes } from "@/lib/scopes";
  import { deserializeConfig, type TransferConfig } from "@/lib/storage";
  import Button from "@/lib/ui/Button.svelte";
  import Modal from "@/lib/ui/Modal.svelte";
  import Toggle from "@/lib/ui/Toggle.svelte";
  import { store } from "../store.svelte";

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  let fileInput = $state<HTMLInputElement>();
  let fileName = $state<string | null>(null);
  let parsed = $state<TransferConfig | null>(null);
  let error = $state<string | null>(null);
  // Scopes whose current bindings will be replaced by the file's.
  let selected = $state<Set<ScopeId>>(new Set());
  let includeSettings = $state(true);
  let dragOver = $state(false);

  // Only the scopes actually present in the file, in canonical order.
  const scopeRows = $derived.by(() => {
    if (!parsed) return [];
    const counts = new Map<ScopeId, number>();
    for (const b of parsed.bindings) {
      counts.set(b.scope, (counts.get(b.scope) ?? 0) + 1);
    }
    return scopeIds
      .filter((id) => counts.has(id))
      .map((id) => ({
        id,
        label: scopes[id].label,
        count: counts.get(id) ?? 0,
      }));
  });
  const selectedCount = $derived(selected.size);
  const canApply = $derived(
    parsed !== null && (selectedCount > 0 || includeSettings),
  );

  async function readFile(file: File) {
    fileName = file.name;
    const result = deserializeConfig(await file.text());
    if (!result.ok) {
      error = result.message;
      parsed = null;
      selected = new Set();
      return;
    }
    error = null;
    parsed = result.config;
    selected = new Set(result.config.bindings.map((b) => b.scope));
  }

  function onPick(e: Event) {
    const file = (e.currentTarget as HTMLInputElement).files?.[0];
    if (file) readFile(file);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    const file = e.dataTransfer?.files?.[0];
    if (file) readFile(file);
  }

  function clearFile() {
    fileName = null;
    parsed = null;
    error = null;
    selected = new Set();
    // Reset the input so re-picking the same file still fires `change`.
    if (fileInput) fileInput.value = "";
  }

  function toggleScope(id: ScopeId, on: boolean) {
    const next = new Set(selected);
    if (on) next.add(id);
    else next.delete(id);
    selected = next;
  }

  async function apply(close: () => void) {
    if (!parsed) return;
    await store.importConfig(parsed, selected, includeSettings);
    close();
  }
</script>

<Modal
  ariaLabel="Import"
  title="Import settings"
  subtitle="Load a JSON file, then choose what to apply."
  width={620}
  {onClose}
>
  <div class="body">
    <input
      bind:this={fileInput}
      type="file"
      accept=".json,application/json"
      class="hidden-input"
      onchange={onPick}
    >

    <!-- One drop/browse zone that morphs to show the chosen file. Drag & drop is
         a progressive enhancement over the Browse button and the remove (×). -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="dropzone"
      class:drag={dragOver}
      class:filled={fileName != null}
      ondragover={(e) => {
        e.preventDefault();
        dragOver = true;
      }}
      ondragleave={() => {
        dragOver = false;
      }}
      ondrop={onDrop}
    >
      <FileJson size={18} />
      {#if fileName == null}
        <span class="dz-text">Drop a JSON file here, or</span>
        <Button onclick={() => fileInput?.click()}>Browse…</Button>
      {:else}
        <span class="file-name">{fileName}</span>
        <button
          type="button"
          class="remove"
          aria-label="Remove file"
          onclick={clearFile}
        >
          <X size={14} />
        </button>
      {/if}
    </div>

    {#if error}
      <div class="error">{error}</div>
    {/if}

    {#if parsed}
      <div class="scopes-head">
        <span class="title">Scopes in file</span>
        <span class="count">{selectedCount} / {scopeRows.length} selected</span>
      </div>

      {#each scopeRows as row (row.id)}
        <div class="scope-row">
          <span class="nm">{row.label}</span>
          <span class="cnt">
            {row.count}
            {row.count === 1 ? "binding" : "bindings"}
          </span>
          <Toggle
            pressed={selected.has(row.id)}
            ariaLabel={`Import ${row.label}`}
            onChange={(on) => toggleScope(row.id, on)}
          />
        </div>
      {/each}

      <div class="scope-row settings-row">
        <span class="nm">Settings</span>
        <span class="cnt">theme, sequence timeout</span>
        <Toggle
          pressed={includeSettings}
          ariaLabel="Import settings values"
          onChange={(on) => {
            includeSettings = on;
          }}
        />
      </div>

      <p class="note">
        Only scopes turned on are replaced with the file's bindings. Everything
        else is left unchanged — including scopes not in the file.
      </p>
    {/if}
  </div>

  {#snippet foot({ close })}
    <span class="spacer"></span>
    <Button variant="ghost" onclick={close}>Cancel</Button>
    <Button variant="primary" disabled={!canApply} onclick={() => apply(close)}>
      Apply
    </Button>
  {/snippet}
</Modal>

<style>
  .body {
    padding: 14px 18px;
  }
  .hidden-input {
    display: none;
  }
  .dropzone {
    display: flex;
    align-items: center;
    gap: 12px;
    border: 1.5px dashed var(--border-strong);
    border-radius: var(--r-md);
    padding: 12px 14px;
    background: var(--canvas);
    font-size: 12.5px;
    color: var(--text-2);
  }
  .dropzone.filled {
    border-style: solid;
  }
  .dropzone.drag {
    border-color: var(--accent);
    background: var(--subtle);
  }
  .dz-text {
    flex: 1;
  }
  .file-name {
    flex: 1;
    min-width: 0;
    font-family: var(--font-mono);
    font-size: 12.5px;
    color: var(--text-1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .remove {
    appearance: none;
    border: 0;
    background: transparent;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    color: var(--text-3);
    display: grid;
    place-items: center;
    cursor: default;
    flex-shrink: 0;
  }
  .remove:hover {
    background: var(--danger-bg);
    color: var(--danger);
  }

  .error {
    margin-top: 10px;
    padding: 8px 12px;
    border-radius: var(--r-md);
    background: var(--danger-bg);
    color: var(--danger);
    font-size: 12px;
    line-height: 1.5;
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
    grid-template-columns: 1fr auto auto;
    gap: 12px;
    align-items: center;
    padding: 10px 4px;
    border-bottom: 1px solid var(--border);
  }
  .scope-row:last-of-type {
    border-bottom: 0;
  }
  .settings-row {
    margin-top: 8px;
    border-top: 1px solid var(--border);
  }
  .nm {
    font-size: 13px;
    color: var(--text-1);
  }
  .cnt {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-3);
  }
  .note {
    margin: 14px 0 0;
    background: var(--subtle);
    padding: 10px 12px;
    border-radius: var(--r-md);
    font-size: 11.5px;
    color: var(--text-2);
    line-height: 1.5;
  }
</style>
