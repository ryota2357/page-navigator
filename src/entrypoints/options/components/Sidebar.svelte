<script lang="ts">
  import { SERVICES } from "../../../lib/services/catalog";
  import type { Scope } from "../../../lib/types";

  type Props = {
    selectedScope: Scope;
    bindingCounts: Record<string, number>;
    onSelectScope: (scope: Scope) => void;
  };

  const { selectedScope, bindingCounts, onSelectScope }: Props = $props();

  // Pre-compute the site scope key once so each-blocks don't need
  // `{@const}` (which Biome flags as an assignment in expression).
  type SiteEntry = { id: string; label: string; scope: Scope; count: number };
  const allSites: SiteEntry[] = $derived(
    SERVICES.map((s) => {
      const scope = `site:${s.id}` as Scope;
      return {
        id: s.id,
        label: s.label,
        scope,
        count: bindingCounts[scope] ?? 0,
      };
    }),
  );

  // Configured = the user already has bindings under this site scope.
  // Mock's "configured-only" mode: unconfigured sites live behind the
  // + button so the sidebar doesn't accumulate noise the user never
  // chose to engage with.
  const configuredSites = $derived(allSites.filter((s) => s.count > 0));
  const availableSites = $derived(allSites.filter((s) => s.count === 0));

  let addOpen = $state(false);
</script>

<aside class="sidebar">
  <header class="brand"><strong>page-navigator</strong></header>

  <nav class="section">
    <h2>Scope</h2>
    <ul>
      <li>
        <button
          type="button"
          class="scope"
          aria-current={selectedScope === "global" ? "page" : undefined}
          onclick={() => onSelectScope("global")}
        >
          <span class="label">Global</span>
          <span class="count">{bindingCounts.global ?? 0}</span>
        </button>
      </li>
    </ul>
  </nav>

  <nav class="section">
    <div class="section-head">
      <h2>Site specific</h2>
      <button
        type="button"
        class="add"
        title={addOpen ? "Close" : "Add a site"}
        aria-expanded={addOpen}
        onclick={() => {
          addOpen = !addOpen;
        }}
      >
        {addOpen ? "−" : "+"}
      </button>
    </div>

    <ul>
      {#each configuredSites as s (s.id)}
        <li>
          <button
            type="button"
            class="scope"
            aria-current={selectedScope === s.scope ? "page" : undefined}
            onclick={() => onSelectScope(s.scope)}
          >
            <span class="label">{s.label}</span>
            <span class="count">{s.count}</span>
          </button>
        </li>
      {/each}

      {#if configuredSites.length === 0 && !addOpen}
        <li>
          <button
            type="button"
            class="cta"
            onclick={() => {
              addOpen = true;
            }}
          >
            + Add a site to override Global
          </button>
        </li>
      {/if}
    </ul>

    {#if addOpen}
      <div class="add-panel">
        <p class="add-hint">Available sites</p>
        {#if availableSites.length === 0}
          <p class="muted">All supported sites are already configured.</p>
        {:else}
          <ul>
            {#each availableSites as s (s.id)}
              <li>
                <button
                  type="button"
                  class="scope"
                  onclick={() => {
                    addOpen = false;
                    onSelectScope(s.scope);
                  }}
                >
                  <span class="label">{s.label}</span>
                  <span class="count add">add</span>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {/if}
  </nav>
</aside>

<style>
  .sidebar {
    background: #f4f2ee;
    border-right: 1px solid #e6e3dd;
    padding: 14px 12px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .brand {
    padding: 4px 6px;
  }
  .brand strong {
    font-size: 13px;
    letter-spacing: 0.01em;
  }

  .section h2 {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #8a857a;
    margin: 0 0 6px 6px;
  }
  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 4px;
  }
  .section-head h2 {
    margin-bottom: 6px;
  }
  button.add {
    background: transparent;
    border: 0;
    color: #8a857a;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    width: 18px;
    height: 18px;
    border-radius: 4px;
  }
  button.add:hover {
    background: #ece8e0;
    color: #1a1815;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  button.scope {
    width: 100%;
    background: transparent;
    border: 0;
    padding: 5px 8px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #3a3530;
    text-align: left;
  }
  button.scope:hover {
    background: #ece8e0;
  }
  button.scope[aria-current="page"] {
    background: #1a1815;
    color: #faf9f7;
  }

  .count {
    font-size: 11px;
    color: #8a857a;
    font-variant-numeric: tabular-nums;
  }
  .count.add {
    color: #5b554d;
    font-style: italic;
  }
  button.scope[aria-current="page"] .count {
    color: #c8c2b6;
  }

  button.cta {
    width: 100%;
    background: transparent;
    border: 1px dashed #d8d3c8;
    border-radius: 4px;
    padding: 6px 8px;
    cursor: pointer;
    color: #5b554d;
    font-size: 11px;
    text-align: left;
  }
  button.cta:hover {
    background: #ece8e0;
    border-color: #b3ad9f;
    color: #1a1815;
  }

  .add-panel {
    border-top: 1px solid #e6e3dd;
    margin-top: 6px;
    padding-top: 6px;
  }
  .add-hint {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #8a857a;
    margin: 4px 6px 6px;
  }
  .muted {
    font-size: 11px;
    color: #8a857a;
    margin: 4px 6px;
  }
</style>
