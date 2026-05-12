import { is, type PredicateType } from "@core/unknownutil";
import { defineAction } from "../../action";
import { setHighlight } from "./highlight";
import { findResultLinks } from "./selectors";

// Module-level cursor. We sync from document.activeElement first so click/Tab
// don't desync, then fall back to the last cursor value.
let cursorIndex = -1;

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

const focusPred = is.ObjectOf({ wrap: is.Boolean });
type FocusOptions = PredicateType<typeof focusPred>;

const focusMeta = {
  wrap: { kind: "boolean", label: "Wrap around" },
} as const;

export const focusNextResult = defineAction<FocusOptions>({
  scope: "google",
  description: "Move focus to the next search result.",
  pred: focusPred,
  defaults: { wrap: false },
  meta: focusMeta,
  run: (_ctx, opts) => moveCursor(+1, opts.wrap),
});

export const focusPrevResult = defineAction<FocusOptions>({
  scope: "google",
  description: "Move focus to the previous search result.",
  pred: focusPred,
  defaults: { wrap: false },
  meta: focusMeta,
  run: (_ctx, opts) => moveCursor(-1, opts.wrap),
});

const openPred = is.ObjectOf({ newTab: is.Boolean });
type OpenOptions = PredicateType<typeof openPred>;

export const openResult = defineAction<OpenOptions>({
  scope: "google",
  description: "Activate the currently focused search result.",
  pred: openPred,
  defaults: { newTab: false },
  meta: { newTab: { kind: "boolean", label: "Open in new tab" } },
  run: (_ctx, opts) => {
    const links = findResultLinks();
    if (links.length === 0) return;
    const idx = currentIndex(links);
    const el = links[idx < 0 ? 0 : idx];

    if (opts.newTab) {
      // Forged Ctrl/Cmd-click — the browser applies its own modifier-click
      // semantics (background tab, etc.) for us.
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
