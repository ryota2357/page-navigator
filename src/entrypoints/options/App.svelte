<script lang="ts">
  import { onMount } from "svelte";
  import type { Action, ActionId } from "@/lib/action";
  import { type ScopeId, scopeIds, scopes } from "@/lib/scopes";
  import {
    type Binding,
    bindingsItem,
    type Settings,
    settingsItem,
  } from "@/lib/storage";
  import BindingsPage from "./bindings/BindingsPage.svelte";
  import { findConflicts } from "./lib/conflicts";
  import ExportDialog from "./preferences/ExportDialog.svelte";
  import ImportDialog from "./preferences/ImportDialog.svelte";
  import PreferencesPage from "./preferences/PreferencesPage.svelte";
  import AddSiteModal from "./sidebar/AddSiteModal.svelte";
  import Sidebar from "./sidebar/Sidebar.svelte";

  type View = "edit" | "preferences";

  let bindings = $state<Binding[]>([]);
  let settings = $state<Settings>({ sequenceTimeoutMs: 1000, theme: "auto" });
  let selectedScope = $state<ScopeId>("global");
  let view = $state<View>("edit");
  let loaded = $state(false);

  // siteOrder is presentation-only; not persisted. Resets to "all configured
  // sites in scopeIds order" whenever bindings load.
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
    bindings = await bindingsItem.getValue();
    settings = await settingsItem.getValue();
    const configured = new Set(bindings.map((b) => b.scope));
    siteOrder = scopeIds.filter((id) => id !== "global" && configured.has(id));
    loaded = true;
    bindingsItem.watch((v) => {
      bindings = v;
    });
    settingsItem.watch((v) => {
      settings = v;
    });
  });

  // Pin the colour scheme on :root, overriding global.css's `color-scheme: light
  // dark`. "auto" restores that system-driven default; light/dark force one mode.
  $effect(() => {
    document.documentElement.style.colorScheme =
      settings.theme === "auto" ? "light dark" : settings.theme;
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

  const visibleActions = $derived<Record<ActionId, Action>>(
    Object.fromEntries(
      [
        ...scopes.global.actions,
        ...(selectedScope === "global" ? [] : scopes[selectedScope].actions),
      ].map((a) => [a.id, a]),
    ),
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
    onShowPreferences={() => {
      view = "preferences";
    }}
  />

  <main class="main">
    {#if loaded}
      {#if view === "edit"}
        <BindingsPage
          scopeId={selectedScope}
          bindings={visibleBindings}
          actions={visibleActions}
          onAdd={addBinding}
          onUpdate={updateBinding}
          onDelete={deleteBinding}
          onReorder={reorderBindings}
        />
      {:else if view === "preferences"}
        <PreferencesPage
          {settings}
          onChange={updateSettings}
          onShowImport={() => {
            showImport = true;
          }}
          onShowExport={() => {
            showExport = true;
          }}
        />
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
  /* Sidebar + main are inset together inside a (side-w + gap + content-max)
       band so the whole app is centered on the canvas and the main column
       actually reaches its --content-max width. Both columns float on the
       same background. */
  .app {
    --side-gap: 16px;
    display: grid;
    grid-template-columns: var(--side-w) minmax(0, 1fr);
    gap: var(--side-gap);
    max-width: calc(var(--side-w) + var(--side-gap) + var(--content-max));
    margin-inline: auto;
    padding: 0 16px;
    min-height: 100vh;
  }
  .main {
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: 24px 0 80px;
  }
</style>
