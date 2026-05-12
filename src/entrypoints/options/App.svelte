<script lang="ts">
  import { onMount } from "svelte";
  import {
    ACTION_IDS,
    ACTIONS,
    isCompatibleScope,
    type ScopeId,
  } from "../../lib/scopes";
  import {
    type Binding,
    bindingsItem,
    loadBindings,
    loadSettings,
    type Settings,
    settingsItem,
  } from "../../lib/storage";
  import BindingsList from "./components/BindingsList.svelte";
  import SettingsSection from "./components/SettingsSection.svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import Toolbar from "./components/Toolbar.svelte";

  // The options page owns the in-memory copy and writes back through
  // bindingsItem.setValue(). The content script picks changes up via its
  // own storage.watch(). Same-context watch is unreliable for our own writes,
  // so we update local state synchronously after every setValue.

  let bindings = $state<Binding[]>([]);
  let settings = $state<Settings>({ sequenceTimeoutMs: 1000 });
  let selectedScope = $state<ScopeId>("global");
  let loaded = $state(false);

  const visibleBindings = $derived(
    bindings.filter((b) => b.scope === selectedScope),
  );

  const bindingCounts = $derived.by(() => {
    const counts: Record<string, number> = {};
    for (const b of bindings) {
      counts[b.scope] = (counts[b.scope] ?? 0) + 1;
    }
    return counts;
  });

  onMount(async () => {
    // loadBindings/loadSettings canonicalise stored values on the first read,
    // so opening options before the content script runs still leaves storage
    // in a clean state.
    bindings = await loadBindings();
    settings = await loadSettings();
    loaded = true;
    bindingsItem.watch((v) => {
      bindings = v;
    });
    settingsItem.watch((v) => {
      settings = v;
    });
  });

  async function addBinding() {
    const seedId = ACTION_IDS.find((id) =>
      isCompatibleScope(ACTIONS[id].scope, selectedScope),
    );
    if (!seedId) return;
    const seed = ACTIONS[seedId];
    const next: Binding[] = [
      ...(await bindingsItem.getValue()),
      {
        id: crypto.randomUUID(),
        scope: selectedScope,
        triggers: [],
        actionId: seedId,
        options: structuredClone(seed.defaults),
        enabled: true,
      },
    ];
    await bindingsItem.setValue(next);
    bindings = next;
  }

  async function updateBinding(updated: Binding) {
    // Snapshot before storage write: chrome.storage.set serializes via
    // structuredClone, which is NOT compatible with Svelte 5 $state proxies.
    // Without snapshot the write throws DataCloneError, the watcher never
    // fires, and the in-memory chip just disappears with no new tag committed.
    const safe = $state.snapshot(updated);
    const next = (await bindingsItem.getValue()).map((b) =>
      b.id === safe.id ? safe : b,
    );
    await bindingsItem.setValue(next);
    bindings = next;
  }

  async function deleteBinding(id: string) {
    const next = (await bindingsItem.getValue()).filter((b) => b.id !== id);
    await bindingsItem.setValue(next);
    bindings = next;
  }

  async function updateSettings(patch: Partial<Settings>) {
    const next: Settings = { ...settings, ...patch };
    await settingsItem.setValue(next);
    settings = next;
  }
</script>

<div class="app">
  <Sidebar
    {selectedScope}
    {bindingCounts}
    onSelectScope={(s) => {
      selectedScope = s;
    }}
  />

  <main class="main">
    <Toolbar currentScope={selectedScope} onAdd={addBinding} />

    {#if loaded}
      <BindingsList
        bindings={visibleBindings}
        onUpdate={updateBinding}
        onDelete={deleteBinding}
        onAdd={addBinding}
      />

      <SettingsSection {settings} onChange={updateSettings} />
    {/if}
  </main>
</div>

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
    color: #1a1815;
    background: #fbfaf8;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  :global(*) {
    box-sizing: border-box;
  }
  :global(button) {
    font: inherit;
  }

  .app {
    display: grid;
    grid-template-columns: 224px 1fr;
    min-height: 100vh;
  }
  .main {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
</style>
