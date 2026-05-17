<script lang="ts">
  import { SCOPE_IDS, SCOPES, type ScopeId } from "@/lib/scopes";
  import Icon from "./Icon.svelte";

  interface Props {
    existing: ScopeId[];
    onClose: () => void;
    onPick: (id: ScopeId) => void;
  }

  let { existing, onClose, onPick }: Props = $props();

  let query = $state("");
  let dialog: HTMLDialogElement | undefined = $state();
  let searchInput: HTMLInputElement | undefined = $state();

  $effect(() => {
    dialog?.showModal();
    searchInput?.focus();
  });

  const available = $derived.by(() => {
    const ids = new Set<ScopeId>(existing);
    return SCOPE_IDS.filter((id) => id !== "global" && !ids.has(id)).map(
      (id) => ({ id, label: SCOPES[id].label }),
    );
  });

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter((s) => s.label.toLowerCase().includes(q));
  });
</script>

<dialog
  class="modal"
  bind:this={dialog}
  aria-label="Add site"
  onclose={onClose}
  onclick={(e) => {
    if (e.target === dialog) dialog.close();
  }}
>
  <header class="head">
    <div>
      <h1>Add a site</h1>
      <p class="sub">Open a scope for site-specific bindings.</p>
    </div>
    <button type="button" class="close" onclick={() => dialog?.close()}>
      ×
    </button>
  </header>

  <div class="search">
    <Icon name="search" size={14} />
    <input
      type="text"
      value={query}
      placeholder="Filter by site name…"
      bind:this={searchInput}
      oninput={(e) => {
        query = (e.currentTarget as HTMLInputElement).value;
      }}
    >
  </div>

  <div class="body">
    {#if filtered.length === 0}
      <p class="muted">
        {available.length === 0
          ? "All supported sites are already added."
          : "No matches."}
      </p>
    {:else}
      <div class="list">
        {#each filtered as s (s.id)}
          <button type="button" class="item" onclick={() => onPick(s.id)}>
            <span class="name">{s.label}</span>
            <span class="add"> <Icon name="plus" size={12} /> Add </span>
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <footer class="foot">
    <button type="button" class="btn ghost" onclick={() => dialog?.close()}>
      Close
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
    width: min(480px, calc(100vw - 32px));
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
  .search {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--border);
    color: var(--text-2);
  }
  .search input {
    flex: 1;
    border: 0;
    outline: 0;
    background: transparent;
    font: inherit;
    font-size: 13px;
    color: var(--text-1);
  }
  .body {
    padding: 6px;
    max-height: 50vh;
    overflow-y: auto;
  }
  .muted {
    color: var(--text-3);
    font-size: 12px;
    text-align: center;
    padding: 24px;
    margin: 0;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .item {
    appearance: none;
    border: 0;
    background: transparent;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    border-radius: 6px;
    cursor: default;
    font: inherit;
    font-size: 13px;
    color: var(--text-1);
  }
  .item:hover {
    background: var(--subtle);
  }
  .name {
    flex: 1;
    text-align: left;
  }
  .add {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11.5px;
    color: var(--text-2);
    padding: 3px 8px;
    border-radius: 4px;
    background: var(--subtle);
  }
  .item:hover .add {
    background: var(--accent);
    color: var(--accent-fg);
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
    background: transparent;
    border: 0;
    border-radius: var(--r-md);
    color: var(--text-2);
    font: inherit;
    font-size: 12.5px;
    cursor: default;
  }
  .btn.ghost:hover {
    background: var(--hover);
    color: var(--text-1);
  }
</style>
