import { sendMessage } from "@/lib/background/messaging";

// Cursor-over-result-links navigation shared by search-result site scopes
// (Google, Google Scholar, ...). The state machine here is site-agnostic; each
// site supplies only its DOM coupling (link selectors) and highlight cosmetics
// (class/style id/color) so those can drift per-site without touching the core.

export type SearchResultNavigatorConfig = {
  // Container selectors probed in order; the first that yields any hits wins,
  // so layout experiments stay reachable without a code change.
  linkSelectors: readonly string[];
  // Unique highlight class + <style> element id, namespaced per site so two
  // active scopes never fight over the same nodes.
  focusedClass: string;
  styleId: string;
  // Outline + marker color for light / dark color schemes.
  color: { light: string; dark: string };
};

export class SearchResultNavigator {
  readonly #linkSelectors: readonly string[];
  readonly #focusedClass: string;
  readonly #styleId: string;
  readonly #focusedCss: string;

  // Cursor + highlight state, owned per instance so two active scopes never
  // share a cursor or fight over the same highlighted node.
  #cursorIndex = -1;
  #highlighted: HTMLElement | null = null;
  #stylesInjected = false;

  constructor(config: SearchResultNavigatorConfig) {
    this.#linkSelectors = config.linkSelectors;
    this.#focusedClass = config.focusedClass;
    this.#styleId = config.styleId;

    // Browsers' native :focus outline is unreliable on these SERPs — site
    // stylesheets often suppress it, and on dark sub-results it's invisible.
    // outline+::before avoids layout shift; !important defends against the site
    // ever shipping higher-specificity rules.
    const { focusedClass, color } = config;
    this.#focusedCss = `
.${focusedClass} {
  position: relative !important;
  outline: 2px solid ${color.light} !important;
  outline-offset: 3px !important;
  border-radius: 2px !important;
}
.${focusedClass}::before {
  content: "▶";
  position: absolute !important;
  left: -22px;
  top: 0;
  color: ${color.light};
  font-size: 14px;
  line-height: 1.2;
  pointer-events: none;
}
@media (prefers-color-scheme: dark) {
  .${focusedClass} {
    outline-color: ${color.dark} !important;
  }
  .${focusedClass}::before {
    color: ${color.dark};
  }
}
`;
  }

  moveCursor(delta: number, wrap: boolean): void {
    const links = this.#findResultLinks();
    if (links.length === 0) return;

    const base = this.#currentIndex(links);
    const start = base < 0 ? (delta > 0 ? -1 : links.length) : base;
    let next = start + delta;
    if (wrap) {
      next = ((next % links.length) + links.length) % links.length;
    } else {
      next = Math.max(0, Math.min(links.length - 1, next));
    }
    this.#cursorIndex = next;

    const el = links[next];
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: "center" });
    this.#setHighlight(el);
  }

  openResult(tab: "current" | "new" | "background"): void {
    const links = this.#findResultLinks();
    if (links.length === 0) return;
    const idx = this.#currentIndex(links);
    const el = links[idx < 0 ? 0 : idx];

    if (tab === "current") {
      // Navigate to the raw href directly when present; falls back to click()
      // for anchors without an href (and bypasses any onclick redirect the
      // site wires onto result links for tracking).
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
      active: tab === "new",
    });
  }

  // Strict: do nothing if no result is focused yet. Avoids leaking the first
  // result's URL on an accidental keypress.
  async copyResultUrl(): Promise<void> {
    const links = this.#findResultLinks();
    if (links.length === 0) return;
    const idx = this.#currentIndex(links);
    if (idx < 0) return;
    const url = links[idx].href;
    if (!url) return;
    await navigator.clipboard.writeText(url);
  }

  #findResultLinks(): HTMLAnchorElement[] {
    for (const sel of this.#linkSelectors) {
      const found = document.querySelectorAll<HTMLAnchorElement>(sel);
      if (found.length > 0) return Array.from(found);
    }
    return [];
  }

  // Read activeElement first so the cursor stays aligned after a click or Tab
  // landed on a different result outside of our cursor moves.
  #currentIndex(links: ReadonlyArray<HTMLAnchorElement>): number {
    const active = document.activeElement;
    if (active instanceof HTMLAnchorElement) {
      const focusedIdx = links.indexOf(active);
      if (focusedIdx >= 0) return focusedIdx;
    }
    return this.#cursorIndex;
  }

  #setHighlight(el: HTMLElement | null): void {
    if (this.#highlighted === el) return;
    if (this.#highlighted)
      this.#highlighted.classList.remove(this.#focusedClass);
    if (el) {
      if (!this.#stylesInjected) {
        // bfcache can preserve the DOM node from the previous lifecycle;
        // re-check and clean up any stragglers before re-adding.
        if (!document.getElementById(this.#styleId)) {
          const style = document.createElement("style");
          style.id = this.#styleId;
          style.textContent = this.#focusedCss;
          document.head.appendChild(style);
        }
        for (const stale of document.querySelectorAll(
          `.${this.#focusedClass}`,
        )) {
          stale.classList.remove(this.#focusedClass);
        }
        this.#stylesInjected = true;
      }
      el.classList.add(this.#focusedClass);
    }
    this.#highlighted = el;
  }
}
