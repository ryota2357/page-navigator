import { activeBindings, Dispatcher } from "../lib/dispatcher";
import { normalize } from "../lib/keys";
import { log } from "../lib/log";
import { resolveActiveScopes } from "../lib/scopes";
import {
  bindingsItem,
  loadBindings,
  loadSettings,
  settingsItem,
} from "../lib/storage";

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

    // Two watchers so binding edits don't reset the timer state and vice-versa.
    bindingsItem.watch(async () => {
      const fresh = await loadBindings();
      const scoped = activeBindings(fresh, activeScopes);
      dispatcher.rebuild(scoped);
      log.debug("dispatcher rebuilt", { count: scoped.length });
    });
    settingsItem.watch(async () => {
      const fresh = await loadSettings();
      dispatcher.setTimeout(fresh.sequenceTimeoutMs);
      log.debug("sequence timeout updated", {
        sequenceTimeoutMs: fresh.sequenceTimeoutMs,
      });
    });

    // Capture-phase listener so the page can't grab keys before us.
    window.addEventListener(
      "keydown",
      (event) => {
        // Drop page-synthesised events; only trusted user input fires bindings.
        if (!event.isTrusted) return;
        if (isEditable(deepActiveElement())) return;

        const token = normalize(event);
        if (token === null) return;

        const result = dispatcher.feed(token);
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
