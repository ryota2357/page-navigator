import { beforeEach, describe, expect, it } from "vitest";
import { focusSearchInputAction } from "./searchInput";

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("google focusSearchInput", () => {
  it("returns ok and leaves focus untouched when no search box is present", async () => {
    const before = document.activeElement;
    expect(await focusSearchInputAction.invoke({})).toEqual({ ok: true });
    expect(document.activeElement).toBe(before);
  });
});
