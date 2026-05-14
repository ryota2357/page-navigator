import { describe, expect, it } from "vitest";
import { parse, parseTrigger } from "./parse";

describe("parse (lenient → canonical)", () => {
  it("round-trips canonical input", () => {
    expect(parse("j")).toBe("j");
    expect(parse("J")).toBe("J");
    expect(parse("<C-j>")).toBe("<C-j>");
    expect(parse("<C-S-j>")).toBe("<C-S-j>");
    expect(parse("<S-Tab>")).toBe("<S-Tab>");
    expect(parse("<C-S-Tab>")).toBe("<C-S-Tab>");
  });

  it("accepts case-insensitive modifier letters", () => {
    expect(parse("<c-j>")).toBe("<C-j>");
    expect(parse("<c-J>")).toBe("<C-j>");
    expect(parse("<C-J>")).toBe("<C-j>");
  });

  it("accepts modifier order swaps", () => {
    expect(parse("<S-C-j>")).toBe("<C-S-j>");
    expect(parse("<c-A-tab>")).toBe("<A-C-Tab>");
  });

  it("folds bare <S-…> on letters into uppercase", () => {
    expect(parse("<S-j>")).toBe("J");
    expect(parse("<s-J>")).toBe("J");
  });

  it("keeps <S-…> on non-printable keys", () => {
    expect(parse("<S-Tab>")).toBe("<S-Tab>");
    expect(parse("<s-tab>")).toBe("<S-Tab>");
    expect(parse("<S-arrowdown>")).toBe("<S-ArrowDown>");
  });

  it("canonicalizes UpperCamel non-printable names", () => {
    expect(parse("<arrowdown>")).toBe("<ArrowDown>");
    expect(parse("<PAGEUP>")).toBe("<PageUp>");
    expect(parse("<f12>")).toBe("<F12>");
  });

  it("rejects malformed input", () => {
    expect(() => parse("")).toThrow();
    expect(() => parse("ab")).toThrow();
    expect(() => parse("<C->")).toThrow();
    expect(() => parse("<X-j>")).toThrow();
  });

  it("parseTrigger maps an array", () => {
    expect(parseTrigger(["g", "g"])).toEqual(["g", "g"]);
    expect(parseTrigger(["<c-j>", "<S-tab>"])).toEqual(["<C-j>", "<S-Tab>"]);
  });
});
