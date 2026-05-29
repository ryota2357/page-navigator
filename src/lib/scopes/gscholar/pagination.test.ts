import { beforeEach, describe, expect, it } from "vitest";
import {
  navigateNextPageAction,
  navigatePreviousPageAction,
} from "./pagination";

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("gscholar pagination", () => {
  it("returns ok without acting when the next pager is absent", async () => {
    const before = document.activeElement;
    expect(await navigateNextPageAction.invoke({})).toEqual({ ok: true });
    expect(document.activeElement).toBe(before);
  });
  it("returns ok without acting when the previous pager is absent", async () => {
    const before = document.activeElement;
    expect(await navigatePreviousPageAction.invoke({})).toEqual({ ok: true });
    expect(document.activeElement).toBe(before);
  });
});
