<script lang="ts">
  import { Bolt, Monitor, Moon, Sun } from "@lucide/svelte/icons";
  import type { Settings } from "@/lib/storage";
  import IconButton from "@/lib/ui/IconButton.svelte";

  interface Props {
    theme: Settings["theme"];
    onCycleTheme: () => void;
    onOpenOptions: () => void;
  }

  let { theme, onCycleTheme, onOpenOptions }: Props = $props();

  // The theme button is a single cycler: the icon shows the *current* mode and
  // clicking advances to the next.
  const THEME_META = {
    light: { Icon: Sun, label: "Light" },
    dark: { Icon: Moon, label: "Dark" },
    auto: { Icon: Monitor, label: "Auto" },
  } as const;

  const ThemeIcon = $derived(THEME_META[theme].Icon);
</script>

<header class="top-bar">
  <span class="wordmark">page-navigator</span>
  <IconButton
    title={`Theme: ${THEME_META[theme].label}`}
    onclick={onCycleTheme}
  >
    <ThemeIcon size={16} strokeWidth={1.9} />
  </IconButton>
  <IconButton title="Options" onclick={onOpenOptions}>
    <Bolt size={16} strokeWidth={1.8} />
  </IconButton>
</header>

<style>
  .top-bar {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 11px 12px;
  }
  .wordmark {
    /* flex-grow pushes the buttons to the trailing edge. */
    flex: 1;
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 600;
    color: var(--text-1);
    letter-spacing: -0.01em;
    white-space: nowrap;
  }
</style>
