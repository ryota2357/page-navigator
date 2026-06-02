<script lang="ts">
  import { onMount } from "svelte";
  import { resolveActiveScopes, scopes } from "@/lib/scopes";
  import { type Settings, settingsItem } from "@/lib/storage";
  import Footer from "./Footer.svelte";
  import PowerStatus from "./PowerStatus.svelte";
  import ScopeStatus from "./ScopeStatus.svelte";
  import TopBar from "./TopBar.svelte";

  const THEME_CYCLE = [
    "light",
    "dark",
    "auto",
  ] as const satisfies Settings["theme"][];

  let settings = $state<Settings | null>(null);
  // The non-global scope matching the active tab, if any. null = Global-only.
  let site = $state<{ label: string; favIconUrl: string | undefined } | null>(
    null,
  );
  // Tracks the OS preference so "auto" resolves to a concrete light/dark. A
  // color-scheme pinned on :root doesn't surface through prefers-color-scheme,
  // so the explicit modes come from settings and only "auto" reads the query.
  let systemDark = $state(false);

  const resolvedTheme = $derived<"light" | "dark">(
    settings == null || settings.theme === "auto"
      ? systemDark
        ? "dark"
        : "light"
      : settings.theme,
  );

  onMount(async () => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    systemDark = media.matches;
    media.addEventListener("change", (e) => {
      systemDark = e.matches;
    });

    settings = await settingsItem.getValue();
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

  // Pin color-scheme on :root from settings.theme, like the options page:
  // "auto" restores the system default; light/dark force one mode and the
  // light-dark() tokens re-resolve. The popup is the only writer of its own
  // settings, so reacting to its own state is enough — no watcher needed.
  $effect(() => {
    if (!settings) return;
    document.documentElement.style.colorScheme =
      settings.theme === "auto" ? "light dark" : settings.theme;
  });

  async function patch(next: Partial<Settings>) {
    if (!settings) return;
    const merged = { ...settings, ...next };
    await settingsItem.setValue(merged);
    settings = merged;
  }

  function nextTheme(current: Settings["theme"]): Settings["theme"] {
    const i = THEME_CYCLE.indexOf(current);
    return THEME_CYCLE[(i + 1) % THEME_CYCLE.length];
  }
</script>

{#if settings}
  {@const s = settings}
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
