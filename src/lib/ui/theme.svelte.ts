import type { Settings } from "@/lib/storage";

export type Theme = Settings["theme"];

// Pin `color-scheme` on :root, overriding theme.css's `light dark` default.
// "auto" restores that system-driven default; light/dark force one mode, which
// re-resolves every light-dark() token. Both pages call this from an $effect.
export function applyColorScheme(theme: Theme): void {
  document.documentElement.style.colorScheme =
    theme === "auto" ? "light dark" : theme;
}

// Reactive reader of the OS color-scheme preference. Needed to resolve "auto"
// to a concrete light/dark — a color-scheme pinned on :root doesn't surface
// back through prefers-color-scheme, so the explicit modes can't rely on it.
export function systemPrefersDark(): { readonly dark: boolean } {
  let dark = $state(false);
  $effect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    dark = media.matches;
    const onChange = (e: MediaQueryListEvent) => {
      dark = e.matches;
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  });
  return {
    get dark() {
      return dark;
    },
  };
}
