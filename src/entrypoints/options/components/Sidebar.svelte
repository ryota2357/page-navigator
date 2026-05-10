<script lang="ts">
  import type { Scope } from "../../../lib/types";

  type Props = {
    selectedScope: Scope;
    bindingCounts: Record<string, number>;
    onSelectScope: (scope: Scope) => void;
  };

  const { selectedScope, bindingCounts, onSelectScope }: Props = $props();

  // Step 4 lists Global only. Step 5 will introduce site:* scopes; the
  // structure here (scope item with label + count) already accommodates them
  // so no rework is needed when the site catalog lands.
  const scopes: Array<{ id: Scope; label: string }> = [
    { id: "global", label: "Global" },
  ];
</script>

<aside class="sidebar">
  <header class="brand"><strong>page-navigator</strong></header>

  <nav>
    <h2>Scope</h2>
    <ul>
      {#each scopes as s (s.id)}
        <li>
          <button
            type="button"
            class="scope"
            aria-current={selectedScope === s.id ? "page" : undefined}
            onclick={() => onSelectScope(s.id)}
          >
            <span class="label">{s.label}</span>
            <span class="count">{bindingCounts[s.id] ?? 0}</span>
          </button>
        </li>
      {/each}
    </ul>
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

  nav h2 {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #8a857a;
    margin: 0 0 6px 6px;
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
  button.scope[aria-current="page"] .count {
    color: #c8c2b6;
  }
</style>
