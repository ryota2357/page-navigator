<script lang="ts">
  import { onMount } from "svelte";
  import { applyColorScheme } from "@/lib/ui/theme.svelte";
  import BindingsPage from "./bindings/BindingsPage.svelte";
  import ExportDialog from "./preferences/ExportDialog.svelte";
  import ImportDialog from "./preferences/ImportDialog.svelte";
  import PreferencesPage from "./preferences/PreferencesPage.svelte";
  import AddSiteModal from "./sidebar/AddSiteModal.svelte";
  import Sidebar from "./sidebar/Sidebar.svelte";
  import { store } from "./store.svelte";

  // App-level dialogs; everything else reads/writes the store directly.
  let showAddSite = $state(false);
  let showImport = $state(false);
  let showExport = $state(false);

  onMount(() => {
    store.init();
  });

  $effect(() => {
    applyColorScheme(store.settings.theme);
  });
</script>

<div class="app">
  <Sidebar
    onShowAddSite={() => {
      showAddSite = true;
    }}
  />

  <main class="main">
    {#if store.loaded}
      {#if store.view === "edit"}
        <!-- Remount on scope change so the page's draft/filter state resets. -->
        {#key store.selectedScope}
          <BindingsPage />
        {/key}
      {:else}
        <PreferencesPage
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
    onClose={() => {
      showAddSite = false;
    }}
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
     actually reaches its --content-max width. Both columns float on the same
     background. */
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
