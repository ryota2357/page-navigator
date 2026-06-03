<script lang="ts">
  import { GripVertical, Plus, Settings } from "@lucide/svelte/icons";
  import { type ScopeId, scopes } from "@/lib/scopes";
  import { onActivate } from "@/lib/ui/a11y";
  import ScopeAvatar from "@/lib/ui/ScopeAvatar.svelte";
  import SortableList from "@/lib/ui/SortableList.svelte";
  import { siteBadge } from "../display";
  import { store } from "../store.svelte";

  interface Props {
    onShowAddSite: () => void;
  }

  let { onShowAddSite }: Props = $props();

  const sites = $derived(
    store.siteOrder.map((id) => ({
      id,
      label: scopes[id].label,
      badge: siteBadge(id),
    })),
  );

  function isActive(scope: ScopeId): boolean {
    return store.view === "edit" && store.selectedScope === scope;
  }
</script>

<aside class="sidebar">
  <div class="brand">
    <div class="mark">pn</div>
    <div class="name">page-navigator</div>
    <button
      type="button"
      class="prefs"
      class:active={store.view === "preferences"}
      title="Preferences"
      aria-label="Preferences"
      onclick={() => store.showPreferences()}
    >
      <Settings size={14} />
    </button>
  </div>

  <div class="group global">
    <button
      type="button"
      class="item global-item"
      class:active={isActive("global")}
      onclick={() => store.selectScope("global")}
    >
      <ScopeAvatar badge={null} />
      <span class="label">Global</span>
      {#if store.conflictCountFor("global") > 0}
        <span
          class="conflict-dot"
          title={`${store.conflictCountFor("global")} conflicts`}
        ></span>
      {/if}
      <span class="count">{store.countFor("global")}</span>
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
        onReorder={(next) => store.reorderSites(next.map((s) => s.id))}
        tag="nav"
        class="site-list"
      >
        {#snippet item(site)}
          <div
            class="item site"
            class:active={isActive(site.id)}
            role="button"
            tabindex="0"
            onclick={() => store.selectScope(site.id)}
            onkeydown={onActivate(() => store.selectScope(site.id))}
          >
            <span
              class="grip"
              title="Drag to reorder"
              onclick={(e) => e.stopPropagation()}
              role="presentation"
            >
              <GripVertical size={12} />
            </span>
            <ScopeAvatar badge={site.badge} />
            <span class="label">{site.label}</span>
            {#if store.conflictCountFor(site.id) > 0}
              <span
                class="conflict-dot"
                title={`${store.conflictCountFor(site.id)} conflicts`}
              ></span>
            {/if}
            <span class="count">{store.countFor(site.id)}</span>
          </div>
        {/snippet}
      </SortableList>
    {/if}
  </div>
</aside>

<style>
  /* Floats on the canvas with no surface fill or right border — feels like a
     Notion-style nav rather than a chrome rail. Sticky so it stays put while
     the bindings list scrolls. */
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

  /* Scoped to :global because the class hops through SortableList's element and
     would otherwise lose its hash. The selector is unique to this app. */
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
