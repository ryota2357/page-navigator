import { beforeEach, describe, expect, it } from "vitest";
import { focusSearchInputAction } from "./searchInput";

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("google focusSearchInput", () => {
  it("focuses the search box when nothing is focused", () => {
    document.body.innerHTML =
      '<form role="search"><input name="q" id="q"></form>';

    focusSearchInputAction.invoke({});

    expect(document.activeElement).toBe(document.getElementById("q"));
  });

  it("blurs the search box when it is already focused (toggle)", () => {
    document.body.innerHTML =
      '<form role="search"><input name="q" id="q"></form>';
    document.getElementById("q")?.focus();

    focusSearchInputAction.invoke({});

    expect(document.activeElement).not.toBe(document.getElementById("q"));
  });

  it("falls back to a bare [name=q] input when no search form exists", () => {
    document.body.innerHTML = '<input name="q" id="q">';

    focusSearchInputAction.invoke({});

    expect(document.activeElement).toBe(document.getElementById("q"));
  });

  it("is a no-op when no search box is present", () => {
    const before = document.activeElement;
    expect(() => focusSearchInputAction.invoke({})).not.toThrow();
    expect(document.activeElement).toBe(before);
  });
});
