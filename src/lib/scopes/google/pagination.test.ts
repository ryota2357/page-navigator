import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  navigateNextPageAction,
  navigatePreviousPageAction,
} from "./pagination";

beforeEach(() => {
  document.body.innerHTML = "";
});

function spyOnPagerClick(id: string) {
  const link = document.createElement("a");
  link.id = id;
  link.setAttribute("href", "/page");
  document.body.appendChild(link);
  return vi.spyOn(link, "click").mockImplementation(() => {});
}

describe("google pagination", () => {
  it("clicks the #pnnext anchor to go forward", () => {
    const click = spyOnPagerClick("pnnext");

    navigateNextPageAction.invoke({});

    expect(click).toHaveBeenCalledTimes(1);
  });

  it("clicks the #pnprev anchor to go back", () => {
    const click = spyOnPagerClick("pnprev");

    navigatePreviousPageAction.invoke({});

    expect(click).toHaveBeenCalledTimes(1);
  });

  it("is a no-op when the pager is absent (image tab / infinite scroll)", () => {
    expect(() => navigateNextPageAction.invoke({})).not.toThrow();
    expect(() => navigatePreviousPageAction.invoke({})).not.toThrow();
  });
});
