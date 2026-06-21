<script lang="ts">
  import { Download, FileJson } from "@lucide/svelte/icons";
  import { type ScopeId, scopeIds, scopes } from "@/lib/scopes";
  import { serializeConfig } from "@/lib/storage";
  import Button from "@/lib/ui/Button.svelte";
  import Modal from "@/lib/ui/Modal.svelte";
  import { store } from "../store.svelte";

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  const fileName = "page-navigator-config.json";

  // Per-scope binding counts, only scopes that actually have bindings.
  const scopeRows = $derived.by(() => {
    const counts = new Map<ScopeId, number>();
    for (const b of store.bindings) {
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
  const bindingCount = $derived(store.bindings.length);

  function download() {
    const text = serializeConfig(store.bindings, store.settings);
    const url = URL.createObjectURL(
      new Blob([text], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<Modal
  ariaLabel="Export"
  title="Export settings"
  subtitle="Save every scope and your settings to a JSON file."
  width={520}
  {onClose}
>
  <div class="body">
    <div class="head">
      <span class="title">Included</span>
      <span class="count">
        {bindingCount}
        {bindingCount === 1 ? "binding" : "bindings"}
      </span>
    </div>

    {#each scopeRows as row (row.id)}
      <div class="row">
        <span class="nm">{row.label}</span>
        <span class="cnt">
          {row.count}
          {row.count === 1 ? "binding" : "bindings"}
        </span>
      </div>
    {/each}

    <div class="row settings-row">
      <span class="nm">Settings</span>
      <span class="cnt">theme, sequence timeout</span>
    </div>

    <div class="file-line">
      <FileJson size={14} />
      <span>{fileName}</span>
    </div>
  </div>

  {#snippet foot({ close })}
    <span class="spacer"></span>
    <Button variant="ghost" onclick={close}>Cancel</Button>
    <Button
      variant="primary"
      onclick={() => {
        download();
        close();
      }}
    >
      <Download size={12} />
      Download
    </Button>
  {/snippet}
</Modal>

<style>
  .body {
    padding: 14px 18px;
  }
  .head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin: 0 0 6px;
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
  .row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 12px;
    align-items: center;
    padding: 10px 4px;
    border-bottom: 1px solid var(--border);
  }
  .row:last-of-type {
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
  .file-line {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 16px;
    color: var(--text-3);
    font-family: var(--font-mono);
    font-size: 11.5px;
  }
</style>
