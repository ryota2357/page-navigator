<script lang="ts">
  import { onMount } from "svelte";
  import { SCOPE_IDS, type ScopeId } from "@/lib/scopes";
  import {
    type Binding,
    bindingsItem,
    loadBindings,
  } from "@/lib/storage/bindings";
  import {
    loadSettings,
    type Settings,
    settingsItem,
  } from "@/lib/storage/settings";
  import AddSiteModal from "./components/AddSiteModal.svelte";
  import BindingsView from "./components/BindingsView.svelte";
  import ExportDialog from "./components/ExportDialog.svelte";
  import ImportDialog from "./components/ImportDialog.svelte";
  import PreferencesView from "./components/PreferencesView.svelte";
  import ReferenceView from "./components/ReferenceView.svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import { findConflicts } from "./conflicts";

  type View = "edit" | "reference" | "preferences";

  let bindings = $state<Binding[]>([]);
  let settings = $state<Settings>({ sequenceTimeoutMs: 1000 });
  let selectedScope = $state<ScopeId>("global");
  let view = $state<View>("edit");
  let loaded = $state(false);

  // siteOrder is presentation-only; not persisted. Resets to "all
  // configured sites in SCOPE_IDS order" whenever bindings load.
  let siteOrder = $state<ScopeId[]>([]);
  let showAddSite = $state(false);
  let showImport = $state(false);
  let showExport = $state(false);

  const bindingCounts = $derived.by(() => {
    const counts: Record<string, number> = {};
    for (const b of bindings) {
      counts[b.scope] = (counts[b.scope] ?? 0) + 1;
    }
    return counts;
  });

  const conflictCounts = $derived.by(() => {
    const grouped: Record<string, Binding[]> = {};
    for (const b of bindings) {
      const list = grouped[b.scope] ?? [];
      list.push(b);
      grouped[b.scope] = list;
    }
    const counts: Record<string, number> = {};
    for (const [scope, list] of Object.entries(grouped)) {
      counts[scope] = findConflicts(list).size;
    }
    return counts;
  });

  onMount(async () => {
    bindings = await loadBindings();
    settings = await loadSettings();
    const configured = new Set(bindings.map((b) => b.scope));
    siteOrder = SCOPE_IDS.filter((id) => id !== "global" && configured.has(id));
    loaded = true;
    bindingsItem.watch((v) => {
      bindings = v;
    });
    settingsItem.watch((v) => {
      settings = v;
    });
  });

  // browser.storage.local.set serialises via structuredClone, which rejects
  // Svelte 5 $state proxies with DataCloneError. $state.snapshot strips the
  // reactivity, leaving a plain object the storage layer can accept.
  async function addBinding(next: Binding) {
    const persisted = [
      ...(await bindingsItem.getValue()),
      $state.snapshot(next),
    ];
    await bindingsItem.setValue(persisted);
    bindings = persisted;
  }

  async function updateBinding(next: Binding) {
    const snapshot = $state.snapshot(next);
    const persisted = (await bindingsItem.getValue()).map((b) =>
      b.id === snapshot.id ? snapshot : b,
    );
    await bindingsItem.setValue(persisted);
    bindings = persisted;
  }

  async function deleteBinding(id: string) {
    const persisted = (await bindingsItem.getValue()).filter(
      (b) => b.id !== id,
    );
    await bindingsItem.setValue(persisted);
    bindings = persisted;
  }

  async function reorderBindings(nextForScope: Binding[]) {
    const others = (await bindingsItem.getValue()).filter(
      (b) => b.scope !== selectedScope,
    );
    const persisted = [
      ...others,
      ...nextForScope.map((b) => $state.snapshot(b)),
    ];
    await bindingsItem.setValue(persisted);
    bindings = persisted;
  }

  async function updateSettings(patch: Partial<Settings>) {
    const next: Settings = { ...settings, ...patch };
    await settingsItem.setValue(next);
    settings = next;
  }

  function selectScope(scope: ScopeId) {
    selectedScope = scope;
    view = "edit";
  }

  function addSite(id: ScopeId) {
    if (!siteOrder.includes(id)) siteOrder = [...siteOrder, id];
    selectScope(id);
    showAddSite = false;
  }

  const visibleBindings = $derived(
    bindings.filter((b) => b.scope === selectedScope),
  );
</script>

<div class="app">
  <Sidebar
    {selectedScope}
    {view}
    {bindingCounts}
    {conflictCounts}
    {siteOrder}
    onSelectScope={selectScope}
    onReorderSites={(next) => {
      siteOrder = next;
    }}
    onShowAddSite={() => {
      showAddSite = true;
    }}
    onShowReference={() => {
      view = "reference";
    }}
    onShowImport={() => {
      showImport = true;
    }}
    onShowExport={() => {
      showExport = true;
    }}
    onShowPreferences={() => {
      view = "preferences";
    }}
  />

  <main class="main">
    {#if loaded}
      {#if view === "edit"}
        <BindingsView
          scopeId={selectedScope}
          bindings={visibleBindings}
          onAdd={addBinding}
          onUpdate={updateBinding}
          onDelete={deleteBinding}
          onReorder={reorderBindings}
        />
      {:else if view === "reference"}
        <ReferenceView />
      {:else if view === "preferences"}
        <PreferencesView {settings} onChange={updateSettings} />
      {/if}
    {/if}
  </main>
</div>

{#if showAddSite}
  <AddSiteModal
    existing={siteOrder}
    onClose={() => {
      showAddSite = false;
    }}
    onPick={addSite}
  />
{/if}

{#if showImport}
  <ImportDialog
    onClose={() => {
      showImport = false;
    }}
  />
{/if}

{#if showExport}
  <ExportDialog
    onClose={() => {
      showExport = false;
    }}
  />
{/if}

<style>
  :global(html),
  :global(body) {
    margin: 0;
    padding: 0;
    height: 100%;
  }
  :global(body) {
    font-family:
      YuGothic, "Yu Gothic", "ヒラギノ角ゴ ProN W3", "ＭＳ ゴシック", sans-serif;
    font-size: 13px;
    color: var(--text-1);
    background: var(--canvas);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  :global(*) {
    box-sizing: border-box;
  }
  :global(button) {
    font: inherit;
  }
  :global(::selection) {
    background: #e7d6a8;
  }

  :global(:root) {
    --font-mono: ui-monospace, Consolas, "Liberation Mono", monospace;

    --canvas: #fbfaf8;
    --surface: #ffffff;
    --subtle: #f4f3f0;
    --hover: #efeeea;
    --pressed: #e8e6e0;

    --border: #e6e3dc;
    --border-strong: #d4d0c7;
    --border-input: #d8d4cc;

    --text-1: #1a1815;
    --text-2: #5a564e;
    --text-3: #918b80;
    --text-4: #b9b3a7;

    --accent: #1a1815;
    --accent-fg: #ffffff;

    --warn: #b45309;
    --warn-bg: #fef6e6;
    --warn-bd: #f0d9a8;

    --danger: #b42318;
    --danger-bg: #fdecea;
    --danger-bd: #f3c2bb;

    --ok: #1f7a3a;
    --ok-bg: #ecf5ee;

    --site-tag: #6b21a8;
    --site-bg: #f3ebfb;
    --site-bd: #e1d0f3;

    --r-sm: 4px;
    --r-md: 6px;
    --r-lg: 8px;
    --r-xl: 12px;

    --shadow-pop:
      0 1px 0 rgba(0, 0, 0, 0.04), 0 6px 18px rgba(20, 18, 15, 0.1),
      0 1px 3px rgba(20, 18, 15, 0.06);
    --shadow-modal:
      0 1px 0 rgba(0, 0, 0, 0.04), 0 24px 60px rgba(20, 18, 15, 0.18);

    --side-w: 240px;
  }

  .app {
    display: grid;
    grid-template-columns: var(--side-w) 1fr;
    min-height: 100vh;
  }
  .main {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
</style>
