import { beforeEach, describe, expect, it, vi } from "vitest";
import { navigateImagesTabAction, navigateSearchTabAction } from "./tabs";

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

// All nine sub-tab actions are built by one factory (defineSubTabAction) and
// differ only in their selector list, so we don't test each tab. Instead we
// cover the factory once and then the two selectors that carry real logic the
// contract test can't verify: the All tab's :not() exclusion and the tbm=/udm=
// fallback. Per-tab selector validity against a real SERP is the contract
// test's job.
describe("google sub-tab navigation", () => {
  it("clicks the first anchor matching the tab's selector", () => {
    const click = spyOnLinkClick(
      "https://www.google.com/search?q=test&tbm=isch",
    );
    navigateImagesTabAction.invoke({});
    expect(click).toHaveBeenCalledTimes(1);
  });

  // tbm= is Google's legacy tab param, migrating to udm=; each tab lists both
  // and the factory falls through to udm when tbm is absent. This is a
  // Google-side rollout, not query-dependent. The contract fixture only
  // captures one scheme, so this is the only guard on the fallback path.
  it("falls back from the tbm= selector to the newer udm= scheme", () => {
    const click = spyOnLinkClick("https://www.google.com/search?q=test&udm=2");
    navigateImagesTabAction.invoke({});
    expect(click).toHaveBeenCalledTimes(1);
  });

  // The All tab selector must match a bare /search link...
  it("matches a plain /search link for the All tab", () => {
    const click = spyOnLinkClick("https://www.google.com/search?q=test");
    navigateSearchTabAction.invoke({});
    expect(click).toHaveBeenCalledTimes(1);
  });

  // ...while excluding the image/video/maps variants that are also /search
  // links carrying a tbm= param.
  it("does not treat a tbm= image link as the All tab", () => {
    const click = spyOnLinkClick(
      "https://www.google.com/search?q=test&tbm=isch",
    );
    navigateSearchTabAction.invoke({});
    expect(click).not.toHaveBeenCalled();
  });

  // {ok:true} rather than .not.toThrow: the latter only catches synchronous
  // throws, so it would silently pass if invoke ever became async.
  it("returns ok without clicking when no sub-tab anchor matches", () => {
    expect(navigateImagesTabAction.invoke({})).toEqual({ ok: true });
  });
});
