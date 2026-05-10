// Step 1 smoke test: hardcoded j/k scroll. No abstraction, no registry.
// Replaced wholesale in Step 3 once the dispatcher exists.

const SCROLL_AMOUNT = 100;

function isEditable(element: Element | null): boolean {
  if (!element) return false;
  const tag = element.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return true;
  return (element as HTMLElement).isContentEditable;
}

export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    // Listen on window in capture phase so the page can't grab keys before us
    // (Vimium pattern: vimium_frontend.js installListeners).
    window.addEventListener(
      "keydown",
      (event) => {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        if (isEditable(document.activeElement)) return;

        if (event.key === "j") {
          window.scrollBy({ top: SCROLL_AMOUNT });
          event.preventDefault();
        } else if (event.key === "k") {
          window.scrollBy({ top: -SCROLL_AMOUNT });
          event.preventDefault();
        }
      },
      { capture: true },
    );
  },
});
