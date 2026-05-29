import { beforeEach, describe, expect, it } from "vitest";
import { focusSearchInputAction } from "./searchInput";

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("gscholar focusSearchInput", () => {
  it("returns ok and leaves focus untouched when no search box is present", () => {
    const before = document.activeElement;
    expect(focusSearchInputAction.invoke({})).toEqual({ ok: true });
    expect(document.activeElement).toBe(before);
  });
});
