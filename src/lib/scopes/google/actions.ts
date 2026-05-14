import { defineAction } from "@/lib/action";
import { setHighlight } from "./highlight";
import { findResultLinks } from "./selectors";

let cursorIndex = -1;

// Read activeElement first so the cursor stays aligned after a click or Tab
// landed on a different result outside of our cursor moves.
function currentIndex(links: ReadonlyArray<HTMLAnchorElement>): number {
  const active = document.activeElement;
  if (active instanceof HTMLAnchorElement) {
    const focusedIdx = links.indexOf(active);
    if (focusedIdx >= 0) return focusedIdx;
  }
  return cursorIndex;
}

function moveCursor(delta: number, wrap: boolean): void {
  const links = findResultLinks();
  if (links.length === 0) return;

  const base = currentIndex(links);
  const start = base < 0 ? (delta > 0 ? -1 : links.length) : base;
  let next = start + delta;
  if (wrap) {
    next = ((next % links.length) + links.length) % links.length;
  } else {
    next = Math.max(0, Math.min(links.length - 1, next));
  }
  cursorIndex = next;

  const el = links[next];
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: "center" });
  setHighlight(el);
}

const focusOptionSchema = {
  wrap: { kind: "boolean", label: "Wrap around" },
} as const;

export const focusNextResultAction = defineAction("google.focusNextResult", {
  scope: "google",
  description: "Move focus to the next search result.",
  optionSchema: focusOptionSchema,
  defaults: { wrap: false },
  bind: (options) => () => moveCursor(+1, options.wrap),
});

export const focusPrevResultAction = defineAction("google.focusPrevResult", {
  scope: "google",
  description: "Move focus to the previous search result.",
  optionSchema: focusOptionSchema,
  defaults: { wrap: false },
  bind: (options) => () => moveCursor(-1, options.wrap),
});

export const openResultAction = defineAction("google.openResult", {
  scope: "google",
  description: "Activate the currently focused search result.",
  optionSchema: { newTab: { kind: "boolean", label: "Open in new tab" } },
  defaults: { newTab: false },
  bind: (options) => () => {
    const links = findResultLinks();
    if (links.length === 0) return;
    const idx = currentIndex(links);
    const el = links[idx < 0 ? 0 : idx];

    if (options.newTab) {
      // Forged modifier-click — the browser handles background-tab semantics
      // for us. ctrl+meta covers both Linux/Windows and macOS.
      el.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          ctrlKey: true,
          metaKey: true,
        }),
      );
    } else {
      el.click();
    }
  },
});
