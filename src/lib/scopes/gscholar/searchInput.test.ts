import { beforeEach, describe, expect, it } from "vitest";
import { focusSearchInputAction } from "./searchInput";

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("gscholar focusSearchInput", () => {
  it("focuses the search box when nothing is focused", () => {
    document.body.innerHTML = '<input id="gs_hdr_tsi">';

    focusSearchInputAction.invoke({});

    expect(document.activeElement).toBe(document.getElementById("gs_hdr_tsi"));
  });

  it("blurs the search box when it is already focused (toggle)", () => {
    document.body.innerHTML = '<input id="gs_hdr_tsi">';
    document.getElementById("gs_hdr_tsi")?.focus();

    focusSearchInputAction.invoke({});

    expect(document.activeElement).not.toBe(
      document.getElementById("gs_hdr_tsi"),
    );
  });

  it("is a no-op when no search box is present", () => {
    const before = document.activeElement;
    expect(() => focusSearchInputAction.invoke({})).not.toThrow();
    expect(document.activeElement).toBe(before);
  });
});
