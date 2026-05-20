<script lang="ts">
  import { Plus, Search } from "@lucide/svelte/icons";
  import { tick } from "svelte";
  import { type ScopeId, scopeIds, scopes } from "@/lib/scopes";
  import Button from "../ui/Button.svelte";
  import Modal from "../ui/Modal.svelte";

  interface Props {
    existing: ScopeId[];
    onClose: () => void;
    onPick: (id: ScopeId) => void;
  }

  let { existing, onClose, onPick }: Props = $props();

  let query = $state("");
  let searchInput: HTMLInputElement | undefined = $state();

  $effect(() => {
    tick().then(() => searchInput?.focus());
  });

  const available = $derived.by(() => {
    const ids = new Set<ScopeId>(existing);
    return scopeIds
      .filter((id) => id !== "global" && !ids.has(id))
      .map((id) => ({ id, label: scopes[id].label }));
  });

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter((s) => s.label.toLowerCase().includes(q));
  });
</script>

<Modal ariaLabel="Add site" width={480} {onClose}>
  {#snippet head({ close })}
    <div class="titles">
      <h1>Add a site</h1>
      <p class="sub">Open a scope for site-specific bindings.</p>
    </div>
    <button type="button" class="close-btn" onclick={close}>×</button>
  {/snippet}

  <div class="search">
    <Search size={14} />
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
            <span class="add"><Plus size={12} /> Add</span>
          </button>
        {/each}
      </div>
    {/if}
  </div>

  {#snippet foot({ close })}
    <span class="spacer"></span>
    <Button variant="ghost" onclick={close}>Close</Button>
  {/snippet}
</Modal>

<style>
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
</style>
