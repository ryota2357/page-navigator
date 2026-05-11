<script lang="ts">
  import { onMount } from "svelte";
  import { listActions } from "../../lib/actions/registry";
  import { isCompatibleScope } from "../../lib/actions/scope";
  import { bindingsItem, settingsItem } from "../../lib/storage";
  import type { Binding, Scope, Settings } from "../../lib/types";
  import BindingsList from "./components/BindingsList.svelte";
  import SettingsSection from "./components/SettingsSection.svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import Toolbar from "./components/Toolbar.svelte";

  // The options page owns the in-memory copy and writes back through
  // bindingsItem.setValue(). The content script picks changes up via its
  // own storage.watch(). Same-context watch is unreliable for our own
  // writes, so we update local state synchronously after every setValue
  // (see docs/dev/step-03-notes.md "Popup detour").

  let bindings = $state<Binding[]>([]);
  let settings = $state<Settings>({ sequenceTimeoutMs: 1000 });
  let selectedScope = $state<Scope>("global");
  let loaded = $state(false);

  const visibleBindings = $derived(
    bindings.filter((b) => b.scope === selectedScope),
  );

  // Per-scope counts. The sidebar uses `site:<id>` keys for site scopes.
  const bindingCounts = $derived.by(() => {
    const counts: Record<string, number> = {};
    for (const b of bindings) {
      counts[b.scope] = (counts[b.scope] ?? 0) + 1;
    }
    return counts;
  });

  // Action picker only offers actions compatible with the binding's scope
  // (see ../lib/actions/scope.ts).
  const defaultActionForScope = $derived((scope: Scope) =>
    listActions().find((a) => isCompatibleScope(a.scope, scope)),
  );

  onMount(async () => {
    bindings = await bindingsItem.getValue();
    settings = await settingsItem.getValue();
    loaded = true;
    // Cross-context watchers — fire when the content script or another
    // tab edits storage. Same-context writes update `bindings` directly.
    bindingsItem.watch((v) => {
      bindings = v;
    });
    settingsItem.watch((v) => {
      settings = v;
    });
  });

  async function addBinding() {
    const action = defaultActionForScope(selectedScope);
    if (!action) return;
    const next: Binding[] = [
      ...(await bindingsItem.getValue()),
      {
        id: crypto.randomUUID(),
        scope: selectedScope,
        triggers: [],
        actionId: action.id,
        options: structuredClone(action.options.defaults) as Record<
          string,
          unknown
        >,
        enabled: true,
      },
    ];
    await bindingsItem.setValue(next);
    bindings = next;
  }

  async function updateBinding(updated: Binding) {
    // Snapshot before storage write: chrome.storage.set serializes via
    // structuredClone, which is NOT compatible with Svelte 5 $state proxies.
    // The `updated` payload comes from `{ ...binding, ... }` in BindingRow
    // and carries proxies into here; without snapshot the write throws
    // DataCloneError, the watcher never fires, and the in-memory chip just
    // disappears with no new tag committed.
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
