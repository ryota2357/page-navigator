// Visible focus indicator for the currently-cursored result. Browsers'
// native :focus outline is unreliable here — Google's stylesheet often
// suppresses it, and on dark-themed sub-results it's invisible. So we
// inject our own style + class (web-search-navigator pattern) and toggle
// the class on every cursor move.
//
// The class lives in the page DOM but the rule is scoped to our class
// name, so we don't bleed into Google's CSS. Injection is idempotent.

const FOCUSED_CLASS = "pn-google-focused";
const STYLE_ID = "pn-google-focused-style";

// `outline` (not `border`) so we don't shift result layout. The arrow
// renders via ::before with `position: absolute` for the same reason —
// no surrounding-element reflow when we move. !important defends against
// Google ever shipping rules at higher specificity.
const CSS = `
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
function ensureStyles(): void {
  if (stylesInjected) return;
  // Re-check via DOM in case a previous content-script lifecycle injected
  // the element (full-page nav resets the JS module, but on bfcache the
  // node can survive). Same bfcache hazard for the class itself: clean up
  // any stragglers from the previous lifecycle so we don't double-highlight
  // on the first move.
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }
  for (const el of document.querySelectorAll(`.${FOCUSED_CLASS}`)) {
    el.classList.remove(FOCUSED_CLASS);
  }
  stylesInjected = true;
}

let highlighted: HTMLElement | null = null;

export function setHighlight(el: HTMLElement | null): void {
  if (highlighted === el) return;
  if (highlighted) highlighted.classList.remove(FOCUSED_CLASS);
  if (el) {
    ensureStyles();
    el.classList.add(FOCUSED_CLASS);
  }
  highlighted = el;
}
