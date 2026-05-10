import { describe, expect, it } from "vitest";
import { normalize } from "./normalize";
import { parse, parseTrigger } from "./parse";
import { serialize } from "./serialize";

// Helper: synthesize a KeyboardEvent for normalize() tests. happy-dom provides
// a real KeyboardEvent constructor; default `isTrusted` is false (we don't
// care here — normalize doesn't gate on isTrusted, the listener does).
function ev(
  key: string,
  opts: Partial<{
    ctrl: boolean;
    alt: boolean;
    meta: boolean;
    shift: boolean;
    isComposing: boolean;
    keyCode: number;
  }> = {},
): KeyboardEvent {
  return new KeyboardEvent("keydown", {
    key,
    ctrlKey: opts.ctrl,
    altKey: opts.alt,
    metaKey: opts.meta,
    shiftKey: opts.shift,
    isComposing: opts.isComposing,
    keyCode: opts.keyCode,
  });
}

describe("serialize", () => {
  it("emits bare printable for unmodified single char", () => {
    expect(
      serialize({ alt: false, ctrl: false, meta: false, shift: false }, "j"),
    ).toBe("j");
    expect(
      serialize({ alt: false, ctrl: false, meta: false, shift: false }, "?"),
    ).toBe("?");
  });

  it("folds bare-printable Shift into the printable's case", () => {
    // Browser already case-folded "j" → "J" via event.key; serialize trusts
    // that and just emits the case. (Sanity test — covered more fully via
    // normalize().)
    expect(
      serialize({ alt: false, ctrl: false, meta: false, shift: true }, "J"),
    ).toBe("J");
  });

  it("wraps non-printables with canonical UpperCamel", () => {
    expect(
      serialize(
        { alt: false, ctrl: false, meta: false, shift: false },
        "ArrowDown",
      ),
    ).toBe("<ArrowDown>");
    expect(
      serialize({ alt: false, ctrl: false, meta: false, shift: true }, "Tab"),
    ).toBe("<S-Tab>");
  });

  it("wraps printable + non-Shift modifier; lowercases ASCII letter inside", () => {
    expect(
      serialize({ alt: false, ctrl: true, meta: false, shift: false }, "j"),
    ).toBe("<C-j>");
    expect(
      serialize({ alt: false, ctrl: true, meta: false, shift: true }, "J"),
    ).toBe("<C-S-j>");
    expect(
      serialize({ alt: true, ctrl: false, meta: false, shift: true }, "X"),
    ).toBe("<A-S-x>");
  });

  it("orders modifiers alphabetically A-C-M-S", () => {
    expect(
      serialize({ alt: true, ctrl: true, meta: true, shift: true }, "x"),
    ).toBe("<A-C-M-S-x>");
  });

  it("uses Space inside <…> but bare space stays as ' '", () => {
    expect(
      serialize({ alt: false, ctrl: false, meta: false, shift: false }, " "),
    ).toBe(" ");
    expect(
      serialize({ alt: false, ctrl: true, meta: false, shift: false }, " "),
    ).toBe("<C-Space>");
  });

  it("preserves <S-> on non-letter shifted printables (cannot lowercase)", () => {
    expect(
      serialize({ alt: false, ctrl: true, meta: false, shift: true }, "!"),
    ).toBe("<C-S-!>");
  });
});

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

describe("normalize (KeyboardEvent → KeyToken)", () => {
  it("returns canonical token for bare printable", () => {
    expect(normalize(ev("j"))).toBe("j");
  });

  it("returns case-folded printable for Shift+letter", () => {
    expect(normalize(ev("J", { shift: true }))).toBe("J");
  });

  it("wraps non-printable", () => {
    expect(normalize(ev("ArrowDown"))).toBe("<ArrowDown>");
    expect(normalize(ev("Tab", { shift: true }))).toBe("<S-Tab>");
  });

  it("emits <C-j> for Ctrl+j", () => {
    expect(normalize(ev("j", { ctrl: true }))).toBe("<C-j>");
  });

  it("emits <C-S-j> for Ctrl+Shift+j (browser delivers key='J')", () => {
    expect(normalize(ev("J", { ctrl: true, shift: true }))).toBe("<C-S-j>");
  });

  it("ignores IME composition events (isComposing)", () => {
    expect(normalize(ev("a", { isComposing: true }))).toBeNull();
  });

  it("ignores Safari IME fallback (keyCode === 229)", () => {
    expect(normalize(ev("a", { keyCode: 229 }))).toBeNull();
  });

  it("ignores modifier-only key presses", () => {
    expect(normalize(ev("Shift", { shift: true }))).toBeNull();
    expect(normalize(ev("Control", { ctrl: true }))).toBeNull();
    expect(normalize(ev("Alt", { alt: true }))).toBeNull();
    expect(normalize(ev("Meta", { meta: true }))).toBeNull();
  });

  it("emits <C-Space> for Ctrl+Space and bare ' ' for space", () => {
    expect(normalize(ev(" "))).toBe(" ");
    expect(normalize(ev(" ", { ctrl: true }))).toBe("<C-Space>");
  });
});
