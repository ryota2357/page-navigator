import { afterEach, describe, expect, it, vi } from "vitest";
import { goHistoryBackAction, goHistoryForwardAction } from "./history";

describe("history actions", () => {
  afterEach(() => vi.restoreAllMocks());

  it("goHistoryBack steps back once in the browser history", () => {
    const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
    goHistoryBackAction.invoke({});
    expect(back).toHaveBeenCalledTimes(1);
  });

  it("goHistoryForward steps forward once in the browser history", () => {
    const forward = vi
      .spyOn(window.history, "forward")
      .mockImplementation(() => {});
    goHistoryForwardAction.invoke({});
    expect(forward).toHaveBeenCalledTimes(1);
  });
});
