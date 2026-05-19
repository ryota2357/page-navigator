<script lang="ts">
  import Globe from "@lucide/svelte/icons/globe";
  import GripVertical from "@lucide/svelte/icons/grip-vertical";
  import Plus from "@lucide/svelte/icons/plus";
  import Settings from "@lucide/svelte/icons/settings";
  import { type ScopeId, scopes } from "@/lib/scopes";
  import { siteBadge } from "../lib/display";
  import SortableList from "../ui/SortableList.svelte";

  type SidebarView = "edit" | "preferences";

  type SiteEntry = {
    id: ScopeId;
    label: string;
    badge: ReturnType<typeof siteBadge>;
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
    onShowPreferences,
  }: Props = $props();

  const sites = $derived<SiteEntry[]>(
    siteOrder.map((id) => ({
      id,
      label: scopes[id].label,
      badge: siteBadge(id),
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
    <button
      type="button"
      class="prefs"
      class:active={view === "preferences"}
      title="Preferences"
      aria-label="Preferences"
      onclick={onShowPreferences}
    >
      <Settings size={14} />
    </button>
  </div>

  <div class="group global">
    <button
      type="button"
      class="item global-item"
      class:active={globalIsActive}
      onclick={() => onSelectScope("global")}
    >
      <span class="icon"><Globe size={14} /></span>
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
        <Plus size={12} />
      </button>
    </div>
    {#if sites.length === 0}
      <button type="button" class="empty-sites" onclick={onShowAddSite}>
        <Plus size={11} />
        Add a site
      </button>
    {:else}
      <SortableList
        items={sites}
        handle=".grip"
        onReorder={(next) => onReorderSites(next.map((s) => s.id))}
        tag="nav"
        class="site-list"
      >
        {#snippet item(site)}
          <div
            class="item site"
            class:active={site.active}
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
              <GripVertical size={12} />
            </span>
            {#if site.badge}
              <span class="fav" style="background: {site.badge.color}">
                {site.badge.initials}
              </span>
            {:else}
              <span class="icon"><Globe size={12} /></span>
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
        {/snippet}
      </SortableList>
    {/if}
  </div>
</aside>

<style>
  /* Floats on the canvas with no surface fill or right border — feels like
       a Notion-style nav rather than a chrome rail. Sticky so it stays put
       while the bindings list scrolls. */
  .sidebar {
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    align-self: start;
    padding: 18px 0;
    max-height: 100vh;
    overflow-y: auto;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 8px 10px;
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
    flex-shrink: 0;
  }
  .name {
    flex: 1;
    min-width: 0;
    font-weight: 600;
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .prefs {
    appearance: none;
    border: 0;
    background: transparent;
    width: 26px;
    height: 26px;
    border-radius: 5px;
    color: var(--text-3);
    display: grid;
    place-items: center;
    cursor: default;
    flex-shrink: 0;
  }
  .prefs:hover {
    background: var(--hover);
    color: var(--text-1);
  }
  .prefs.active {
    background: var(--subtle);
    color: var(--text-1);
  }

  .group {
    padding: 4px 4px;
    display: flex;
    flex-direction: column;
  }
  .group.global {
    padding-top: 6px;
  }
  .group-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 6px 4px;
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
    padding: 6px 8px;
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
    left: -8px;
    top: 6px;
    bottom: 6px;
    width: 2px;
    background: var(--accent);
    border-radius: 0 2px 2px 0;
  }

  .item.site {
    padding-left: 4px;
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

  /* Scoped to :global because the class hops through SortableList's element
       and would otherwise lose its hash. The selector is unique to this app. */
  :global(.site-list) {
    display: flex;
    flex-direction: column;
  }
  .empty-sites {
    appearance: none;
    margin: 2px 6px;
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
</style>
