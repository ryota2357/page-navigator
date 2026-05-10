import { Dispatcher } from "../lib/dispatcher";
import { normalize } from "../lib/keys";
import { log } from "../lib/log";
import { bindingsItem, settingsItem } from "../lib/storage";
import { loadBindings, loadSettings } from "../lib/storage/loader";

// Walk through open shadow roots to find the real focused element.
// Closed shadow roots remain unreadable from extension code; we accept the
// resulting false-negative rate (binding may fire while typing in a
// closed-shadow input). docs/dev/step-02-data-model.md §10 S2.
function deepActiveElement(): Element | null {
  let el: Element | null = document.activeElement;
  while (el?.shadowRoot?.activeElement) {
    el = el.shadowRoot.activeElement;
  }
  return el;
}

// Returns true iff the keystroke should be ignored because focus is somewhere
// the user is editing text. Conservative on iframes (S3): we can't see inside,
// so treat an <iframe> activeElement as "editable — don't fire".
function isEditable(el: Element | null): boolean {
  if (!el) return false;
  if (el.tagName === "IFRAME") return true;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

export default defineContentScript({
  matches: ["<all_urls>"],
  // Pin world explicitly (docs/dev/step-02-data-model.md §10 S5) — don't rely
  // on WXT's default. If a future action needs MAIN-world execution, do it via
  // a tightly-scoped injected script tag, not by switching the whole content
  // script's world.
  world: "ISOLATED",
  async main() {
    const settings = await loadSettings();
    const bindings = await loadBindings();
    const dispatcher = new Dispatcher(settings.sequenceTimeoutMs);
    dispatcher.rebuild(bindings);

    // Push-direction updates: rebuild trie when bindings change, update the
    // timeout when settings change. Two separate watchers so binding edits
    // don't reset the timer state and vice-versa.
    bindingsItem.watch(async () => {
      const fresh = await loadBindings();
      dispatcher.rebuild(fresh);
      log.debug("dispatcher rebuilt", { count: fresh.length });
    });
    settingsItem.watch(async () => {
      const fresh = await loadSettings();
      dispatcher.setTimeout(fresh.sequenceTimeoutMs);
      log.debug("sequence timeout updated", {
        sequenceTimeoutMs: fresh.sequenceTimeoutMs,
      });
    });

    // Capture-phase listener so the page can't grab keys before us
    // (Vimium pattern). All security gates are checked here so the dispatcher
    // and key-normalizer stay pure.
    window.addEventListener(
      "keydown",
      (event) => {
        // S1: page-synthesised events have isTrusted=false.
        if (!event.isTrusted) return;

        // S2/S3: focus inside an editable element (or iframe) → don't fire.
        if (isEditable(deepActiveElement())) return;

        // IME guard + modifier-only filter live in normalize().
        const token = normalize(event);
        if (token === null) return;

        const result = dispatcher.feed(token);
        if (result !== "passed") {
          // Consume the key: either we fired, or we're mid-sequence and have
          // claimed ownership (S8 option b).
          event.preventDefault();
          event.stopPropagation();
        }
      },
      { capture: true },
    );

    log.info("content script ready", {
      bindings: bindings.length,
      sequenceTimeoutMs: settings.sequenceTimeoutMs,
    });
  },
});
