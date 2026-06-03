<script lang="ts">
  import { onMount } from "svelte";
  import { resolveActiveScopes, scopes } from "@/lib/scopes";
  import { reactiveStore, type Settings, settingsItem } from "@/lib/storage";
  import { applyColorScheme, systemPrefersDark } from "@/lib/ui/theme.svelte";
  import Footer from "./Footer.svelte";
  import PowerStatus from "./PowerStatus.svelte";
  import ScopeStatus from "./ScopeStatus.svelte";
  import TopBar from "./TopBar.svelte";

  const THEME_CYCLE = [
    "light",
    "dark",
    "auto",
  ] as const satisfies Settings["theme"][];

  const settings = reactiveStore(settingsItem);
  const system = systemPrefersDark();

  // The non-global scope matching the active tab, if any. null = Global-only.
  let site = $state<{ label: string; favIconUrl: string | undefined } | null>(
    null,
  );

  // "auto" resolves to a concrete light/dark via the OS query — a color-scheme
  // pinned on :root doesn't surface back through prefers-color-scheme, so the
  // explicit modes come straight from settings.
  const resolvedTheme = $derived<"light" | "dark">(
    settings.value.theme === "auto"
      ? system.dark
        ? "dark"
        : "light"
      : settings.value.theme,
  );

  onMount(async () => {
    await settings.init();
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.url) return;
    const matched = [...resolveActiveScopes(new URL(tab.url))].find(
      (id) => id !== "global",
    );
    if (matched) {
      site = { label: scopes[matched].label, favIconUrl: tab.favIconUrl };
    }
  });

  // Pin color-scheme from settings.theme like the options page: "auto" restores
  // the system default; light/dark force one mode and the light-dark() tokens
  // re-resolve.
  $effect(() => {
    applyColorScheme(settings.value.theme);
  });

  function patch(next: Partial<Settings>) {
    settings.set({ ...settings.value, ...next });
  }

  function nextTheme(current: Settings["theme"]): Settings["theme"] {
    const i = THEME_CYCLE.indexOf(current);
    return THEME_CYCLE[(i + 1) % THEME_CYCLE.length];
  }
</script>

{#if settings.loaded}
  {@const s = settings.value}
  <main class="popup">
    <TopBar
      theme={s.theme}
      onCycleTheme={() => patch({ theme: nextTheme(s.theme) })}
      onOpenOptions={() => browser.runtime.openOptionsPage()}
    />
    <PowerStatus
      on={s.enabled}
      onToggle={() => patch({ enabled: !s.enabled })}
    />
    <hr class="divider">
    <ScopeStatus {site} enabled={s.enabled} />
    <Footer theme={resolvedTheme} />
  </main>
{/if}

<style>
  .popup {
    display: flex;
    flex-direction: column;
  }
  .divider {
    height: 1px;
    background: var(--border);
    border: 0;
    margin: 0 14px;
  }
</style>
