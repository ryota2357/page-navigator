import { describe, expect, it } from "vitest";
import { isKeyToken, isTrigger } from "./token";

describe("isKeyToken", () => {
  it("accepts already-canonical tokens", () => {
    expect(isKeyToken("j")).toBe(true);
    expect(isKeyToken("J")).toBe(true);
    expect(isKeyToken("<C-j>")).toBe(true);
    expect(isKeyToken("<A-C-M-S-x>")).toBe(true);
    expect(isKeyToken("<S-Tab>")).toBe(true);
  });

  it("rejects parseable-but-non-canonical strings", () => {
    // `parse` would rewrite these, so they are not themselves canonical.
    expect(isKeyToken("<c-j>")).toBe(false);
    expect(isKeyToken("<S-C-j>")).toBe(false);
    expect(isKeyToken("<S-j>")).toBe(false);
    expect(isKeyToken("<arrowdown>")).toBe(false);
  });

  it("rejects malformed strings and non-strings", () => {
    expect(isKeyToken("")).toBe(false);
    expect(isKeyToken("ab")).toBe(false);
    expect(isKeyToken("<C->")).toBe(false);
    expect(isKeyToken(42)).toBe(false);
    expect(isKeyToken(null)).toBe(false);
  });
});

describe("isTrigger", () => {
  it("accepts arrays of canonical tokens", () => {
    expect(isTrigger([])).toBe(true);
    expect(isTrigger(["g", "g"])).toBe(true);
    expect(isTrigger(["<C-j>", "<S-Tab>"])).toBe(true);
  });

  it("rejects arrays holding a non-canonical token", () => {
    expect(isTrigger(["g", "<c-j>"])).toBe(false);
  });

  it("rejects non-arrays", () => {
    expect(isTrigger("g")).toBe(false);
    expect(isTrigger(null)).toBe(false);
  });
});
