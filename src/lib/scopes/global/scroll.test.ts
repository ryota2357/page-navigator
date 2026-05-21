import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  scrollDownAction,
  scrollLeftAction,
  scrollPageDownAction,
  scrollPageUpAction,
  scrollRightAction,
  scrollToBottomAction,
  scrollToLeftAction,
  scrollToRightAction,
  scrollToTopAction,
  scrollUpAction,
} from "./scroll";

describe("scroll-by-pixel actions", () => {
  let scrollBy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    scrollBy = vi.spyOn(window, "scrollBy").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("scrolls down by a positive top offset", () => {
    scrollDownAction.invoke({ amount: 250, smooth: false });
    expect(scrollBy).toHaveBeenCalledWith({ top: 250, behavior: "instant" });
  });

  it("scrolls up by a negative top offset", () => {
    scrollUpAction.invoke({ amount: 250, smooth: false });
    expect(scrollBy).toHaveBeenCalledWith({ top: -250, behavior: "instant" });
  });

  it("scrolls left by a negative left offset", () => {
    scrollLeftAction.invoke({ amount: 250, smooth: false });
    expect(scrollBy).toHaveBeenCalledWith({ left: -250, behavior: "instant" });
  });

  it("scrolls right by a positive left offset", () => {
    scrollRightAction.invoke({ amount: 250, smooth: false });
    expect(scrollBy).toHaveBeenCalledWith({ left: 250, behavior: "instant" });
  });

  it("maps smooth:true onto behavior 'smooth'", () => {
    scrollDownAction.invoke({ amount: 100, smooth: true });
    expect(scrollBy).toHaveBeenCalledWith({ top: 100, behavior: "smooth" });
  });

  it("fills in default amount and smooth when options are omitted", () => {
    scrollDownAction.invoke({});
    expect(scrollBy).toHaveBeenCalledWith({ top: 100, behavior: "instant" });
  });
});

describe("scroll-by-page actions", () => {
  let scrollBy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    scrollBy = vi.spyOn(window, "scrollBy").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("scrolls down by the requested fraction of the viewport height", () => {
    scrollPageDownAction.invoke({ fraction: 0.5, smooth: false });
    expect(scrollBy).toHaveBeenCalledWith({
      top: window.innerHeight * 0.5,
      behavior: "instant",
    });
  });

  it("scrolls up by the negated fraction of the viewport height", () => {
    scrollPageUpAction.invoke({ fraction: 0.5, smooth: false });
    expect(scrollBy).toHaveBeenCalledWith({
      top: -window.innerHeight * 0.5,
      behavior: "instant",
    });
  });

  it("uses the default fraction when omitted", () => {
    scrollPageDownAction.invoke({});
    expect(scrollBy).toHaveBeenCalledWith({
      top: window.innerHeight * 0.85,
      behavior: "instant",
    });
  });
});

describe("scroll-to-edge actions", () => {
  let scrollTo: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("jumps to the top", () => {
    scrollToTopAction.invoke({ smooth: false });
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "instant" });
  });

  it("jumps to the bottom using the document scroll height", () => {
    scrollToBottomAction.invoke({ smooth: false });
    expect(scrollTo).toHaveBeenCalledWith({
      top: document.documentElement.scrollHeight,
      behavior: "instant",
    });
  });

  it("jumps to the leftmost edge", () => {
    scrollToLeftAction.invoke({ smooth: false });
    expect(scrollTo).toHaveBeenCalledWith({ left: 0, behavior: "instant" });
  });

  it("jumps to the rightmost edge using the document scroll width", () => {
    scrollToRightAction.invoke({ smooth: false });
    expect(scrollTo).toHaveBeenCalledWith({
      left: document.documentElement.scrollWidth,
      behavior: "instant",
    });
  });

  it("honors smooth:true at the edges", () => {
    scrollToTopAction.invoke({ smooth: true });
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
});
