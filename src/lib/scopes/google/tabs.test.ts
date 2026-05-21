import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  navigateBooksTabAction,
  navigateFinancialTabAction,
  navigateFlightsTabAction,
  navigateImagesTabAction,
  navigateMapsTabAction,
  navigateNewsTabAction,
  navigateSearchTabAction,
  navigateShoppingTabAction,
  navigateVideosTabAction,
} from "./tabs";

beforeEach(() => {
  document.body.innerHTML = "";
});

function spyOnLinkClick(href: string) {
  const link = document.createElement("a");
  link.setAttribute("href", href);
  link.textContent = "tab";
  document.body.appendChild(link);
  return vi.spyOn(link, "click").mockImplementation(() => {});
}

describe("google sub-tab navigation clicks the matching anchor", () => {
  it.each([
    {
      name: "search (All)",
      action: navigateSearchTabAction,
      href: "https://www.google.com/search?q=test",
    },
    {
      name: "images (tbm)",
      action: navigateImagesTabAction,
      href: "https://www.google.com/search?q=test&tbm=isch",
    },
    {
      name: "videos",
      action: navigateVideosTabAction,
      href: "https://www.google.com/search?q=test&tbm=vid",
    },
    {
      name: "maps",
      action: navigateMapsTabAction,
      href: "https://maps.google.com/maps?q=test",
    },
    {
      name: "news",
      action: navigateNewsTabAction,
      href: "https://www.google.com/search?q=test&tbm=nws",
    },
    {
      name: "shopping",
      action: navigateShoppingTabAction,
      href: "https://www.google.com/search?q=test&tbm=shop",
    },
    {
      name: "books",
      action: navigateBooksTabAction,
      href: "https://www.google.com/search?q=test&tbm=bks",
    },
    {
      name: "flights",
      action: navigateFlightsTabAction,
      href: "https://www.google.com/search?q=test&tbm=flm",
    },
    {
      name: "financial",
      action: navigateFinancialTabAction,
      href: "https://www.google.com/finance?q=AAPL",
    },
  ])("$name", ({ action, href }) => {
    const click = spyOnLinkClick(href);
    action.invoke({});
    expect(click).toHaveBeenCalledTimes(1);
  });
});

describe("google sub-tab fallbacks and filters", () => {
  it("falls back from the tbm= selector to the newer udm= scheme", () => {
    const click = spyOnLinkClick("https://www.google.com/search?q=test&udm=2");
    navigateImagesTabAction.invoke({});
    expect(click).toHaveBeenCalledTimes(1);
  });

  it("does not treat a tbm= image link as the All tab", () => {
    const click = spyOnLinkClick(
      "https://www.google.com/search?q=test&tbm=isch",
    );
    navigateSearchTabAction.invoke({});
    expect(click).not.toHaveBeenCalled();
  });

  it("is a no-op when no matching sub-tab anchor exists", () => {
    expect(() => navigateImagesTabAction.invoke({})).not.toThrow();
  });
});
