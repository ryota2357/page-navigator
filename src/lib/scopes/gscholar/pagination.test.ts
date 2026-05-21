import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  navigateNextPageAction,
  navigatePreviousPageAction,
} from "./pagination";

beforeEach(() => {
  document.body.innerHTML = "";
});

// Scholar wraps the arrow icon span in the clickable <a>; build that shape and
// spy on the anchor the action should reach via the icon's parent.
function spyOnPagerArrowClick(iconClass: string) {
  const anchor = document.createElement("a");
  anchor.setAttribute("href", "/page");
  const icon = document.createElement("span");
  icon.className = iconClass;
  anchor.appendChild(icon);
  document.body.appendChild(anchor);
  return vi.spyOn(anchor, "click").mockImplementation(() => {});
}

describe("gscholar pagination", () => {
  it("clicks the anchor wrapping the next-arrow icon", () => {
    const click = spyOnPagerArrowClick("gs_ico_nav_next");

    navigateNextPageAction.invoke({});

    expect(click).toHaveBeenCalledTimes(1);
  });

  it("clicks the anchor wrapping the previous-arrow icon", () => {
    const click = spyOnPagerArrowClick("gs_ico_nav_previous");

    navigatePreviousPageAction.invoke({});

    expect(click).toHaveBeenCalledTimes(1);
  });

  it("is a no-op when the arrow is absent at a list end", () => {
    expect(() => navigateNextPageAction.invoke({})).not.toThrow();
    expect(() => navigatePreviousPageAction.invoke({})).not.toThrow();
  });
});
