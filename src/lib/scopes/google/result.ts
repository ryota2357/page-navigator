import { defineAction } from "@/lib/action";
import { sendMessage } from "@/lib/background/messaging";

// Google SERP DOM is class-soup that shifts every few months. The stable shape
// we rely on: organic-result title links are <a> elements wrapping an <h3>.
// We probe a small set of container selectors and accept the first that yields
// hits, so layout experiments stay reachable without an extension update.
const RESULT_LINK_SELECTORS = [
  "#search a:has(h3)",
  "#rso a:has(h3)",
  "#main a:has(h3)",
];

function findResultLinks(): HTMLAnchorElement[] {
  for (const sel of RESULT_LINK_SELECTORS) {
    const found = document.querySelectorAll<HTMLAnchorElement>(sel);
    if (found.length > 0) return Array.from(found);
  }
  return [];
}

const FOCUSED_CLASS = "pn-google-focused";
const STYLE_ID = "pn-google-focused-style";

// Browsers' native :focus outline is unreliable on Google's SERP — Google's
// stylesheet often suppresses it, and on dark sub-results it's invisible.
// outline+::before avoids layout shift; !important defends against Google
// ever shipping higher-specificity rules.
const FOCUSED_CSS = `
.${FOCUSED_CLASS} {
  position: relative !important;
  outline: 2px solid #1a73e8 !important;
  outline-offset: 3px !important;
  border-radius: 2px !important;
}
.${FOCUSED_CLASS}::before {
  content: "▶";
  position: absolute !important;
  left: -22px;
  top: 0;
  color: #1a73e8;
  font-size: 14px;
  line-height: 1.2;
  pointer-events: none;
}
@media (prefers-color-scheme: dark) {
  .${FOCUSED_CLASS} {
    outline-color: #8ab4f8 !important;
  }
  .${FOCUSED_CLASS}::before {
    color: #8ab4f8;
  }
}
`;

let stylesInjected = false;
let highlighted: HTMLElement | null = null;

function setHighlight(el: HTMLElement | null): void {
  if (highlighted === el) return;
  if (highlighted) highlighted.classList.remove(FOCUSED_CLASS);
  if (el) {
    if (!stylesInjected) {
      // bfcache can preserve the DOM node from the previous lifecycle;
      // re-check and clean up any stragglers before re-adding.
      if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = FOCUSED_CSS;
        document.head.appendChild(style);
      }
      for (const stale of document.querySelectorAll(`.${FOCUSED_CLASS}`)) {
        stale.classList.remove(FOCUSED_CLASS);
      }
      stylesInjected = true;
    }
    el.classList.add(FOCUSED_CLASS);
  }
  highlighted = el;
}

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
  wrap: { kind: "boolean" },
} as const;

export const focusNextResultAction = defineAction("google.focusNextResult", {
  description: "Move focus to the next search result.",
  optionSchema: focusOptionSchema,
  defaults: { wrap: false },
  run: ({ wrap }) => moveCursor(+1, wrap),
});

export const focusPrevResultAction = defineAction("google.focusPrevResult", {
  description: "Move focus to the previous search result.",
  optionSchema: focusOptionSchema,
  defaults: { wrap: false },
  run: ({ wrap }) => moveCursor(-1, wrap),
});

export const openResultAction = defineAction("google.openResult", {
  description: "Activate the currently focused search result.",
  optionSchema: {
    target: {
      kind: "select",
      options: ["current", "newTabBackground", "newTabForeground"] as const,
    },
  },
  defaults: { target: "current" },
  run: ({ target }) => {
    const links = findResultLinks();
    if (links.length === 0) return;
    const idx = currentIndex(links);
    const el = links[idx < 0 ? 0 : idx];

    if (target === "current") {
      // Bypass Google's onclick redirect (which routes through
      // /url?q=... for tracking) by navigating to the raw href directly.
      // Fall back to click() for anchors without an href.
      if (el.href) {
        window.location.href = el.href;
      } else {
        el.click();
      }
      return;
    }
    if (!el.href) return;
    sendMessage("openUrlInNewTab", {
      url: el.href,
      active: target === "newTabForeground",
    });
  },
});

export const copyResultUrlAction = defineAction("google.copyResultUrl", {
  description: "Copy the focused search result's URL to the clipboard.",
  optionSchema: {},
  defaults: {},
  // Strict: do nothing if no result is focused yet. Avoids leaking the first
  // result's URL on an accidental keypress.
  run: async () => {
    const links = findResultLinks();
    if (links.length === 0) return;
    const idx = currentIndex(links);
    if (idx < 0) return;
    const url = links[idx].href;
    if (!url) return;
    await navigator.clipboard.writeText(url);
  },
});
