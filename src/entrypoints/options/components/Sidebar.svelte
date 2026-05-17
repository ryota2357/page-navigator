<script lang="ts">
  import { SCOPES, type ScopeId } from "@/lib/scopes";
  import { siteDisplay } from "../siteDisplay";
  import { sortable } from "../sortable.svelte";
  import Icon from "./Icon.svelte";

  type SidebarView = "edit" | "reference" | "preferences";

  type SiteEntry = {
    id: ScopeId;
    label: string;
    display: ReturnType<typeof siteDisplay>;
    active: boolean;
  };

  interface Props {
    selectedScope: ScopeId;
    view: SidebarView;
    bindingCounts: Record<string, number>;
    conflictCounts: Record<string, number>;
    siteOrder: ScopeId[];
    onSelectScope: (scope: ScopeId) => void;
    onReorderSites: (next: ScopeId[]) => void;
    onShowAddSite: () => void;
    onShowReference: () => void;
    onShowImport: () => void;
    onShowExport: () => void;
    onShowPreferences: () => void;
  }

  let {
    selectedScope,
    view,
    bindingCounts,
    conflictCounts,
    siteOrder,
    onSelectScope,
    onReorderSites,
    onShowAddSite,
    onShowReference,
    onShowImport,
    onShowExport,
    onShowPreferences,
  }: Props = $props();

  const sites = $derived<SiteEntry[]>(
    siteOrder.map((id) => ({
      id,
      label: SCOPES[id].label,
      display: siteDisplay(id),
      active: view === "edit" && selectedScope === id,
    })),
  );

  const globalIsActive = $derived(
    view === "edit" && selectedScope === "global",
  );
</script>

<aside class="sidebar">
  <div class="brand">
    <div class="mark">pn</div>
    <div class="name">page-navigator</div>
    <span class="state">on</span>
  </div>

  <div class="group global">
    <button
      type="button"
      class="item global-item"
      class:active={globalIsActive}
      onclick={() => onSelectScope("global")}
    >
      <span class="icon"><Icon name="globe" /></span>
      <span class="label">Global</span>
      {#if conflictCounts.global > 0}
        <span
          class="conflict-dot"
          title={`${conflictCounts.global} conflicts`}
        ></span>
      {/if}
      <span class="count">{bindingCounts.global ?? 0}</span>
    </button>
  </div>

  <div class="group">
    <div class="group-head">
      <span class="group-title">Sites</span>
      <button
        type="button"
        class="group-add"
        title="Add a site"
        onclick={onShowAddSite}
      >
        <Icon name="plus" size={12} />
      </button>
    </div>
    {#if sites.length === 0}
      <button type="button" class="empty-sites" onclick={onShowAddSite}>
        <Icon name="plus" size={11} />
        Add a site
      </button>
    {:else}
      <nav
        class="site-list"
        use:sortable={{
          items: sites,
          onReorder: (next) => onReorderSites(next.map((s) => s.id)),
          handle: ".grip",
        }}
      >
        {#each sites as site (site.id)}
          <div
            class="item site"
            class:active={site.active}
            data-id={site.id}
            role="button"
            tabindex="0"
            onclick={() => onSelectScope(site.id)}
            onkeydown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectScope(site.id);
              }
            }}
          >
            <span
              class="grip"
              title="Drag to reorder"
              onclick={(e) => e.stopPropagation()}
              role="presentation"
            >
              <Icon name="grip" size={12} />
            </span>
            {#if site.display}
              <span class="fav" style="background: {site.display.color}"
                >{site.display.initials}</span
              >
            {:else}
              <span class="icon"><Icon name="globe" size={12} /></span>
            {/if}
            <span class="label">{site.label}</span>
            {#if conflictCounts[site.id] > 0}
              <span
                class="conflict-dot"
                title={`${conflictCounts[site.id]} conflicts`}
              ></span>
            {/if}
            <span class="count">{bindingCounts[site.id] ?? 0}</span>
          </div>
        {/each}
      </nav>
    {/if}
  </div>

  <div class="spacer"></div>

  <div class="footer">
    <button
      type="button"
      class="item"
      class:active={view === "reference"}
      onclick={onShowReference}
    >
      <span class="icon"><Icon name="book" /></span>
      <span class="label">Reference</span>
    </button>
    <button type="button" class="item" onclick={onShowImport}>
      <span class="icon"><Icon name="import" /></span>
      <span class="label">Import…</span>
    </button>
    <button type="button" class="item" onclick={onShowExport}>
      <span class="icon"><Icon name="export" /></span>
      <span class="label">Export…</span>
    </button>
    <button
      type="button"
      class="item"
      class:active={view === "preferences"}
      onclick={onShowPreferences}
    >
      <span class="icon"><Icon name="gear" /></span>
      <span class="label">Preferences</span>
    </button>
  </div>
</aside>

<style>
  .sidebar {
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    height: 100vh;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 18px 18px 16px;
    border-bottom: 1px solid var(--border);
  }
  .mark {
    width: 22px;
    height: 22px;
    border-radius: 5px;
    background: var(--accent);
    color: var(--accent-fg);
    display: grid;
    place-items: center;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
  }
  .name {
    font-weight: 600;
    font-size: 13px;
  }
  .state {
    margin-left: auto;
    font-size: 10px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 7px;
    background: var(--ok-bg);
    color: var(--ok);
    border-radius: 999px;
    font-weight: 500;
  }
  .state::before {
    content: "";
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--ok);
  }

  .group {
    padding: 6px 10px 4px;
    display: flex;
    flex-direction: column;
  }
  .group.global {
    padding-top: 10px;
    padding-bottom: 6px;
  }
  .group-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 8px 4px;
  }
  .group-title {
    font-size: 10px;
    font-weight: 600;
    color: var(--text-3);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .group-add {
    border: 0;
    background: transparent;
    color: var(--text-3);
    width: 20px;
    height: 20px;
    border-radius: 4px;
    display: grid;
    place-items: center;
    cursor: default;
  }
  .group-add:hover {
    background: var(--hover);
    color: var(--text-1);
  }

  .item {
    appearance: none;
    border: 0;
    background: transparent;
    text-align: left;
    color: var(--text-1);
    font: inherit;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 6px 9px;
    border-radius: var(--r-md);
    cursor: default;
    position: relative;
    line-height: 1.3;
  }
  .item:hover {
    background: var(--hover);
  }
  .item.active {
    background: var(--subtle);
  }
  .item.active::before {
    content: "";
    position: absolute;
    left: -10px;
    top: 6px;
    bottom: 6px;
    width: 2px;
    background: var(--accent);
    border-radius: 0 2px 2px 0;
  }

  .item.site {
    padding-left: 4px;
  }
  .global-item {
    padding-left: 9px;
  }
  .grip {
    width: 14px;
    display: grid;
    place-items: center;
    color: var(--text-4);
    opacity: 0;
    transition: opacity 0.12s;
    cursor: grab;
    flex-shrink: 0;
  }
  .item.site:hover .grip,
  .item.site.active .grip {
    opacity: 1;
  }
  .grip:active {
    cursor: grabbing;
  }

  .icon {
    width: 16px;
    height: 16px;
    display: grid;
    place-items: center;
    color: var(--text-2);
    flex-shrink: 0;
  }
  .fav {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    display: grid;
    place-items: center;
    color: #fff;
    flex-shrink: 0;
    font-family: var(--font-mono);
  }
  .label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .count {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-3);
    background: var(--subtle);
    padding: 1px 6px;
    border-radius: 999px;
    font-variant-numeric: tabular-nums;
  }
  .item.active .count {
    background: var(--surface);
    border: 1px solid var(--border);
  }
  .conflict-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--danger);
  }

  .site-list {
    display: flex;
    flex-direction: column;
  }
  .empty-sites {
    appearance: none;
    margin: 2px 8px;
    padding: 6px 9px;
    border: 1px dashed var(--border-strong);
    background: transparent;
    border-radius: var(--r-md);
    color: var(--text-3);
    font-size: 11.5px;
    cursor: default;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: inherit;
  }
  .empty-sites:hover {
    background: var(--hover);
    color: var(--text-1);
    border-color: var(--text-3);
  }

  .spacer {
    flex: 1;
  }

  .footer {
    border-top: 1px solid var(--border);
    padding: 8px 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
</style>
