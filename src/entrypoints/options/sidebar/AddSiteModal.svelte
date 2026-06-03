<script lang="ts">
  import { Plus } from "@lucide/svelte/icons";
  import { type ScopeId, scopeIds, scopes } from "@/lib/scopes";
  import Button from "@/lib/ui/Button.svelte";
  import Modal from "@/lib/ui/Modal.svelte";
  import SearchInput from "@/lib/ui/SearchInput.svelte";
  import { store } from "../store.svelte";

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  let query = $state("");

  const available = $derived.by(() => {
    const taken = new Set<ScopeId>(store.siteOrder);
    return scopeIds
      .filter((id) => id !== "global" && !taken.has(id))
      .map((id) => ({ id, label: scopes[id].label }));
  });

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter((s) => s.label.toLowerCase().includes(q));
  });

  function pick(id: ScopeId) {
    store.addSite(id);
    onClose();
  }
</script>

<Modal
  ariaLabel="Add site"
  title="Add a site"
  subtitle="Open a scope for site-specific bindings."
  width={480}
  {onClose}
>
  <SearchInput
    value={query}
    variant="bar"
    focusOnMount
    placeholder="Filter by site name…"
    oninput={(v) => {
      query = v;
    }}
  />

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
          <button type="button" class="item" onclick={() => pick(s.id)}>
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
