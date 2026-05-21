import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendMessage } from "@/lib/background/messaging";
import {
  SearchResultNavigator,
  type SearchResultNavigatorConfig,
} from "./searchResultNavigation";

// The new/background-tab path delegates to the background script; we only
// assert the message contract, never a real tab open.
vi.mock("@/lib/background/messaging", () => ({ sendMessage: vi.fn() }));
const sendMessageMock = vi.mocked(sendMessage);

const baseConfig: SearchResultNavigatorConfig = {
  linkSelectors: ["#results a"],
  focusedClass: "test-focused",
  styleId: "test-focused-style",
  color: { light: "#111", dark: "#222" },
};

function newNavigator(
  overrides: Partial<SearchResultNavigatorConfig> = {},
): SearchResultNavigator {
  return new SearchResultNavigator({ ...baseConfig, ...overrides });
}

// Build a result list under `#results`; a null entry yields an <a> with no
// href (the [CITATION]-style links the strict paths must skip).
function setResults(
  hrefs: ReadonlyArray<string | null>,
  containerId = "results",
): HTMLAnchorElement[] {
  const container = document.createElement("div");
  container.id = containerId;
  for (const href of hrefs) {
    const a = document.createElement("a");
    a.textContent = "result";
    if (href !== null) a.setAttribute("href", href);
    container.appendChild(a);
  }
  document.body.appendChild(container);
  return Array.from(container.querySelectorAll("a"));
}

beforeEach(() => {
  document.head.innerHTML = "";
  document.body.innerHTML = "";
  vi.clearAllMocks();
});

describe("SearchResultNavigator linkSelectors fallback", () => {
  it("uses the first selector that yields any hits", () => {
    setResults(["https://e/1", "https://e/2"], "rso");
    const nav = newNavigator({ linkSelectors: ["#search a", "#rso a"] });

    nav.moveCursor(+1, false);

    expect((document.activeElement as HTMLAnchorElement).href).toBe(
      "https://e/1",
    );
  });
});

describe("SearchResultNavigator moveCursor from an undetermined cursor", () => {
  it("starts at the first link when moving forward", () => {
    const links = setResults(["https://e/1", "https://e/2", "https://e/3"]);
    const nav = newNavigator();

    nav.moveCursor(+1, false);

    expect(document.activeElement).toBe(links[0]);
  });

  it("starts at the last link when moving backward", () => {
    const links = setResults(["https://e/1", "https://e/2", "https://e/3"]);
    const nav = newNavigator();

    nav.moveCursor(-1, false);

    expect(document.activeElement).toBe(links[2]);
  });
});

describe("SearchResultNavigator wrap behavior at the ends", () => {
  it("wraps modulo when wrap is true", () => {
    const links = setResults(["https://e/1", "https://e/2"]);
    const nav = newNavigator();
    nav.moveCursor(-1, true); // land on the last link

    nav.moveCursor(+1, true);

    expect(document.activeElement).toBe(links[0]);
  });

  it("clamps at the edge when wrap is false", () => {
    const links = setResults(["https://e/1", "https://e/2"]);
    const nav = newNavigator();
    nav.moveCursor(-1, false); // land on the last link

    nav.moveCursor(+1, false);

    expect(document.activeElement).toBe(links[1]);
  });
});

describe("SearchResultNavigator highlight class lifecycle", () => {
  it("focuses the link and adds the highlight class", () => {
    const links = setResults(["https://e/1", "https://e/2"]);
    const nav = newNavigator();

    nav.moveCursor(+1, false);

    expect(document.activeElement).toBe(links[0]);
    expect(links[0].classList.contains("test-focused")).toBe(true);
  });

  it("moves the highlight class off the old link and onto the new one", () => {
    const links = setResults(["https://e/1", "https://e/2"]);
    const nav = newNavigator();
    nav.moveCursor(+1, false);

    nav.moveCursor(+1, false);

    expect(links[0].classList.contains("test-focused")).toBe(false);
    expect(links[1].classList.contains("test-focused")).toBe(true);
  });
});

describe("SearchResultNavigator with no result links", () => {
  it("is a no-op and leaves the active element unchanged", () => {
    setResults([], "empty"); // selector "#results a" matches nothing
    const before = document.activeElement;
    const nav = newNavigator();

    expect(() => nav.moveCursor(+1, false)).not.toThrow();
    expect(document.activeElement).toBe(before);
  });
});

describe("SearchResultNavigator cursor realignment via activeElement", () => {
  it("moves relative to a link the user focused outside the cursor", () => {
    const links = setResults(["https://e/1", "https://e/2", "https://e/3"]);
    const nav = newNavigator();
    // User clicks/tabs onto the 2nd result directly, bypassing moveCursor.
    links[1].focus();

    nav.moveCursor(+1, false);

    expect(document.activeElement).toBe(links[2]);
  });
});

describe("SearchResultNavigator openResult in the current tab", () => {
  it("navigates to the href when the link has one", () => {
    setResults(["https://e/1", "https://e/2"]);
    const nav = newNavigator();
    nav.moveCursor(+1, false); // focus the first result

    nav.openResult("current");

    expect(window.location.href).toBe("https://e/1");
  });

  it("clicks the link when it has no href", () => {
    const links = setResults([null]);
    const clickSpy = vi.spyOn(links[0], "click");
    const nav = newNavigator();
    nav.moveCursor(+1, false);

    nav.openResult("current");

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});

describe("SearchResultNavigator openResult in a new/background tab", () => {
  it("requests an active tab for 'new'", () => {
    setResults(["https://e/1"]);
    const nav = newNavigator();
    nav.moveCursor(+1, false);

    nav.openResult("new");

    expect(sendMessageMock).toHaveBeenCalledWith("openUrlInNewTab", {
      url: "https://e/1",
      active: true,
    });
  });

  it("requests a background tab for 'background'", () => {
    setResults(["https://e/1"]);
    const nav = newNavigator();
    nav.moveCursor(+1, false);

    nav.openResult("background");

    expect(sendMessageMock).toHaveBeenCalledWith("openUrlInNewTab", {
      url: "https://e/1",
      active: false,
    });
  });

  it("sends nothing when the focused link has no href", () => {
    setResults([null]);
    const nav = newNavigator();
    nav.moveCursor(+1, false);

    nav.openResult("new");

    expect(sendMessageMock).not.toHaveBeenCalled();
  });
});

describe("SearchResultNavigator copyResultUrl strictness", () => {
  it("does not copy when no result is focused", async () => {
    setResults(["https://e/1"]);
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue();
    const nav = newNavigator();

    await nav.copyResultUrl();

    expect(writeText).not.toHaveBeenCalled();
  });

  it("copies the focused result's href", async () => {
    setResults(["https://e/1", "https://e/2"]);
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue();
    const nav = newNavigator();
    nav.moveCursor(-1, false); // focus the last result

    await nav.copyResultUrl();

    expect(writeText).toHaveBeenCalledWith("https://e/2");
  });
});

describe("SearchResultNavigator style injection", () => {
  it("injects the <style> element exactly once", () => {
    setResults(["https://e/1", "https://e/2"]);
    const nav = newNavigator();

    nav.moveCursor(+1, false);
    nav.moveCursor(+1, false);

    expect(document.querySelectorAll("#test-focused-style").length).toBe(1);
  });

  it("clears stale highlight nodes left over from a previous lifecycle", () => {
    // Simulate a node the bfcache restored still wearing the highlight class.
    const links = setResults(["https://e/1", "https://e/2"]);
    links[1].classList.add("test-focused");
    const nav = newNavigator();

    nav.moveCursor(+1, false); // first injection triggers the cleanup

    expect(links[1].classList.contains("test-focused")).toBe(false);
    expect(links[0].classList.contains("test-focused")).toBe(true);
  });
});
