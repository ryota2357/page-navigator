const FOCUSED_CLASS = "pn-google-focused";
const STYLE_ID = "pn-google-focused-style";

// Browsers' native :focus outline is unreliable on Google's SERP — Google's
// stylesheet often suppresses it, and on dark sub-results it's invisible.
// outline+::before avoids layout shift; !important defends against Google
// ever shipping higher-specificity rules.
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
  // bfcache can preserve the DOM node from the previous lifecycle; re-check
  // and clean up any stragglers before re-adding.
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
