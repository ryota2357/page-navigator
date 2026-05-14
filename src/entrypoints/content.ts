import { activeBindings, Dispatcher } from "@/lib/dispatcher";
import { encodeKeyToken, isImeComposing, isModifierKey } from "@/lib/keys";
import { log } from "@/lib/log";
import { resolveActiveScopes } from "@/lib/scopes";
import { bindingsItem, loadBindings } from "@/lib/storage/bindings";
import { loadSettings, settingsItem } from "@/lib/storage/settings";

export default defineContentScript({
  matches: ["<all_urls>"],
  // ISOLATED keeps our state out of the page's JS realm. A future MAIN-world
  // action should use a tightly-scoped injected <script>, not switch this.
  world: "ISOLATED",
  async main() {
    // Fixed at init: we don't observe SPA URL changes for rescoping yet.
    // Google's SERP is a full nav per query so this holds in practice.
    const activeScopes = resolveActiveScopes(location.href);

    const settings = await loadSettings();
    const allBindings = await loadBindings();
    const dispatcher = new Dispatcher(settings.sequenceTimeoutMs);
    dispatcher.rebuild(activeBindings(allBindings, activeScopes));

    bindingsItem.watch((newValue) => {
      const scoped = activeBindings(newValue, activeScopes);
      dispatcher.rebuild(scoped);
      log.debug("dispatcher rebuilt", { count: scoped.length });
    });
    settingsItem.watch((newValue) => {
      dispatcher.setTimeout(newValue.sequenceTimeoutMs);
      log.debug("sequence timeout updated", {
        sequenceTimeoutMs: newValue.sequenceTimeoutMs,
      });
    });

    window.addEventListener(
      "keydown",
      (event) => {
        if (!event.isTrusted) return;
        if (isImeComposing(event) || isModifierKey(event)) return;
        if (isEditable(deepActiveElement())) return;

        const result = dispatcher.feed(encodeKeyToken(event));
        if (result !== "passed") {
          event.preventDefault();
          event.stopPropagation();
        }
      },
      { capture: true },
    );

    log.info("content script ready", {
      bindings: allBindings.length,
      activeScopes: [...activeScopes],
      sequenceTimeoutMs: settings.sequenceTimeoutMs,
    });
  },
});

// Walks open shadow roots to find the actual focused element. Closed shadow
// roots remain unreadable from extension code; we accept a small false-
// negative rate (binding may fire while typing in a closed-shadow input).
function deepActiveElement(): Element | null {
  let el: Element | null = document.activeElement;
  while (el?.shadowRoot?.activeElement) {
    el = el.shadowRoot.activeElement;
  }
  return el;
}

// True iff the keystroke should be ignored because focus is somewhere the
// user is editing text. <iframe> activeElement is conservative — we can't
// see inside, so treat it as "editable — don't fire" (top-frame only).
function isEditable(el: Element | null): boolean {
  if (!el) return false;
  if (el.tagName === "IFRAME") return true;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el instanceof HTMLElement && el.isContentEditable) return true;
  return false;
}
