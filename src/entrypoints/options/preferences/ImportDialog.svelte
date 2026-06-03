<script lang="ts">
  import { Download, Globe } from "@lucide/svelte/icons";
  import Button from "@/lib/ui/Button.svelte";
  import Modal from "@/lib/ui/Modal.svelte";
  import Segmented from "@/lib/ui/Segmented.svelte";

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  // UI-only stub: the dialog exercises the layout the import flow will use (file
  // picker, scope table, merge/replace toggle) but doesn't actually parse a file
  // or mutate storage yet.
  type Mode = "merge" | "replace";
  type ScopeRow = {
    id: string;
    name: string;
    count: number;
    include: boolean;
    mode: Mode;
  };

  let rows = $state<ScopeRow[]>([
    { id: "global", name: "Global", count: 0, include: true, mode: "replace" },
    { id: "google", name: "Google", count: 0, include: true, mode: "replace" },
  ]);

  const modeOptions = [
    { value: "merge", label: "Merge" },
    { value: "replace", label: "Replace" },
  ] as const;

  const includedCount = $derived(rows.filter((r) => r.include).length);

  function toggleInclude(id: string) {
    rows = rows.map((r) => (r.id === id ? { ...r, include: !r.include } : r));
  }
  function setMode(id: string, mode: Mode) {
    rows = rows.map((r) => (r.id === id ? { ...r, mode } : r));
  }
</script>

<Modal
  ariaLabel="Import"
  title="Import settings"
  subtitle="Pick which scopes to read from the JSON file."
  width={640}
  {onClose}
>
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
        <Segmented
          options={modeOptions}
          value={r.mode}
          variant="soft"
          ariaLabel={`Import mode for ${r.name}`}
          disabled={!r.include}
          onChange={(mode) => setMode(r.id, mode)}
        />
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
    border-left: 1.5px solid var(--accent-fg);
    border-bottom: 1.5px solid var(--accent-fg);
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
