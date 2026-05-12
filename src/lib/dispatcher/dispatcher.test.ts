import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Binding } from "../storage/bindings";
import { Dispatcher } from "./dispatcher";
import { compileTrie } from "./trie";

function bindScrollDown(id: string, triggers: string[][]): Binding {
  return {
    id,
    scope: "global",
    triggers,
    actionId: "scrollDown",
    options: { amount: 1, smooth: false },
    enabled: true,
  };
}

describe("compileTrie", () => {
  it("builds a single-leaf trie for one binding", () => {
    const trie = compileTrie([bindScrollDown("b1", [["j"]])]);
    expect(trie.children?.get("j")?.leaf).toMatchObject({
      bindingId: "b1",
      actionId: "scrollDown",
    });
  });

  it("branches on shared prefix", () => {
    const trie = compileTrie([
      bindScrollDown("b1", [["g", "g"]]),
      bindScrollDown("b2", [["g", "h"]]),
    ]);
    const g = trie.children?.get("g");
    expect(g?.children?.get("g")?.leaf).toMatchObject({ bindingId: "b1" });
    expect(g?.children?.get("h")?.leaf).toMatchObject({ bindingId: "b2" });
  });

  it("marks identical-trigger collisions as conflicted", () => {
    const trie = compileTrie([
      bindScrollDown("b1", [["x"]]),
      bindScrollDown("b2", [["x"]]),
    ]);
    const leaf = trie.children?.get("x")?.leaf;
    expect(leaf).toMatchObject({ conflicted: true });
    if (leaf && "bindingIds" in leaf) {
      expect(leaf.bindingIds).toEqual(["b1", "b2"]);
    }
  });

  it("skips disabled bindings", () => {
    const trie = compileTrie([
      { ...bindScrollDown("b1", [["j"]]), enabled: false },
    ]);
    expect(trie.children?.size ?? 0).toBe(0);
  });
});

describe("Dispatcher.feed", () => {
  let dispatcher: Dispatcher;
  beforeEach(() => {
    vi.useFakeTimers();
    // Spy on window.scrollBy so we can assert the action ran.
    vi.spyOn(window, "scrollBy").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("fires on a single-key leaf and runs the action", () => {
    dispatcher = new Dispatcher(1000);
    dispatcher.rebuild([bindScrollDown("b1", [["j"]])]);
    expect(dispatcher.feed("j")).toBe("fired");
    expect(window.scrollBy).toHaveBeenCalledOnce();
    expect(dispatcher.isMidSequence()).toBe(false);
  });

  it("returns 'consumed' for a prefix and 'fired' on completion", () => {
    dispatcher = new Dispatcher(1000);
    dispatcher.rebuild([bindScrollDown("b1", [["g", "g"]])]);
    expect(dispatcher.feed("g")).toBe("consumed");
    expect(dispatcher.isMidSequence()).toBe(true);
    expect(dispatcher.feed("g")).toBe("fired");
    expect(window.scrollBy).toHaveBeenCalledOnce();
    expect(dispatcher.isMidSequence()).toBe(false);
  });

  it("returns 'passed' for an unknown key at root", () => {
    dispatcher = new Dispatcher(1000);
    dispatcher.rebuild([bindScrollDown("b1", [["j"]])]);
    expect(dispatcher.feed("x")).toBe("passed");
    expect(window.scrollBy).not.toHaveBeenCalled();
  });

  it("aborts mid-sequence on an unmatched extension", () => {
    dispatcher = new Dispatcher(1000);
    dispatcher.rebuild([bindScrollDown("b1", [["g", "g"]])]);
    expect(dispatcher.feed("g")).toBe("consumed");
    expect(dispatcher.feed("x")).toBe("passed");
    expect(dispatcher.isMidSequence()).toBe(false);
    expect(window.scrollBy).not.toHaveBeenCalled();
  });

  it("on timeout at a leaf+children node, fires the leaf", () => {
    dispatcher = new Dispatcher(500);
    dispatcher.rebuild([
      bindScrollDown("b1", [["g"]]),
      bindScrollDown("b2", [["g", "g"]]),
    ]);
    // After single g, we should be mid-sequence (the node has both leaf and children).
    expect(dispatcher.feed("g")).toBe("consumed");
    expect(dispatcher.isMidSequence()).toBe(true);

    vi.advanceTimersByTime(499);
    expect(window.scrollBy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(window.scrollBy).toHaveBeenCalledOnce();
    expect(dispatcher.isMidSequence()).toBe(false);
  });

  it("rebuild() resets the cursor", () => {
    dispatcher = new Dispatcher(1000);
    dispatcher.rebuild([bindScrollDown("b1", [["g", "g"]])]);
    expect(dispatcher.feed("g")).toBe("consumed");
    dispatcher.rebuild([bindScrollDown("b2", [["j"]])]);
    expect(dispatcher.isMidSequence()).toBe(false);
    expect(dispatcher.feed("j")).toBe("fired");
  });

  it("does not fire a conflicted leaf", () => {
    dispatcher = new Dispatcher(1000);
    dispatcher.rebuild([
      bindScrollDown("b1", [["x"]]),
      bindScrollDown("b2", [["x"]]),
    ]);
    expect(dispatcher.feed("x")).toBe("fired"); // walked to the leaf — but the leaf is conflicted, so action doesn't run
    expect(window.scrollBy).not.toHaveBeenCalled();
  });
});
