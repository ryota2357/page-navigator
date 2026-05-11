import { is, type PredicateType } from "@core/unknownutil";
import type { Action } from "../../types";
import { setHighlight } from "./highlight";
import { findResultLinks } from "./selectors";

// Cursor for the active result. We sync from document.activeElement first
// (handles tab/click), then fall back to the last cursor value. -1 means
// "no selection yet"; the first focus call lands on index 0.
let cursorIndex = -1;

function currentIndex(links: HTMLAnchorElement[]): number {
  const focusedIdx = links.indexOf(document.activeElement as HTMLAnchorElement);
  return focusedIdx >= 0 ? focusedIdx : cursorIndex;
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

// --- google.focusNextResult / google.focusPrevResult --------------------

const focusPred = is.ObjectOf({ wrap: is.Boolean });
type FocusOptions = PredicateType<typeof focusPred>;

const focusMeta = {
  wrap: { kind: "boolean" as const, label: "Wrap around" },
};

const focusNextResult: Action<FocusOptions> = {
  id: "google.focusNextResult",
  label: "Focus next result",
  description: "Move focus to the next search result.",
  scope: "site:google",
  runtime: "content",
  options: {
    pred: focusPred,
    defaults: { wrap: false },
    meta: focusMeta,
  },
  run: (_ctx, opts) => moveCursor(+1, opts.wrap),
};

const focusPrevResult: Action<FocusOptions> = {
  id: "google.focusPrevResult",
  label: "Focus previous result",
  description: "Move focus to the previous search result.",
  scope: "site:google",
  runtime: "content",
  options: {
    pred: focusPred,
    defaults: { wrap: false },
    meta: focusMeta,
  },
  run: (_ctx, opts) => moveCursor(-1, opts.wrap),
};

// --- google.openResult --------------------------------------------------

const openPred = is.ObjectOf({ newTab: is.Boolean });
type OpenOptions = PredicateType<typeof openPred>;

const openResult: Action<OpenOptions> = {
  id: "google.openResult",
  label: "Open focused result",
  description: "Activate the currently focused search result.",
  scope: "site:google",
  runtime: "content",
  options: {
    pred: openPred,
    defaults: { newTab: false },
    meta: {
      newTab: { kind: "boolean", label: "Open in new tab" },
    },
  },
  run: (_ctx, opts) => {
    const links = findResultLinks();
    if (links.length === 0) return;
    const idx = currentIndex(links);
    // Cursor still -1: nothing has been focused yet — open the first result
    // so the user doesn't have to navigate first before pressing the open key.
    const el = links[idx < 0 ? 0 : idx];

    if (opts.newTab) {
      // Forge a Ctrl/Cmd-click; the browser handles "open in background tab"
      // for us, which respects the user's modifier-key preferences.
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
};

// biome-ignore lint/suspicious/noExplicitAny: heterogeneous action list — each Action<O> has its own O
export const googleActions: ReadonlyArray<Action<any>> = [
  focusNextResult,
  focusPrevResult,
  openResult,
];
