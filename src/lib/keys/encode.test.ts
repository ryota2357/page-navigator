import { describe, expect, it } from "vitest";
import { encodeKeyToken } from "./encode";

function input(
  key: string,
  mods: Partial<{
    ctrl: boolean;
    alt: boolean;
    meta: boolean;
    shift: boolean;
  }> = {},
) {
  return {
    altKey: mods.alt ?? false,
    ctrlKey: mods.ctrl ?? false,
    metaKey: mods.meta ?? false,
    shiftKey: mods.shift ?? false,
    key,
  };
}

describe("encodeKeyToken", () => {
  it("emits bare printable for an unmodified single char", () => {
    expect(encodeKeyToken(input("j"))).toBe("j");
    expect(encodeKeyToken(input("?"))).toBe("?");
  });

  it("folds Shift+letter into case (browser delivers key='J')", () => {
    expect(encodeKeyToken(input("J", { shift: true }))).toBe("J");
  });

  it("wraps non-printables with canonical UpperCamel", () => {
    expect(encodeKeyToken(input("ArrowDown"))).toBe("<ArrowDown>");
    expect(encodeKeyToken(input("Tab", { shift: true }))).toBe("<S-Tab>");
  });

  it("wraps printable + non-Shift modifier; lowercases ASCII letter inside", () => {
    expect(encodeKeyToken(input("j", { ctrl: true }))).toBe("<C-j>");
    // Ctrl+Shift+j — browser delivers key='J'
    expect(encodeKeyToken(input("J", { ctrl: true, shift: true }))).toBe(
      "<C-S-j>",
    );
    expect(encodeKeyToken(input("X", { alt: true, shift: true }))).toBe(
      "<A-S-x>",
    );
  });

  it("orders modifiers alphabetically A-C-M-S", () => {
    expect(
      encodeKeyToken(
        input("x", { alt: true, ctrl: true, meta: true, shift: true }),
      ),
    ).toBe("<A-C-M-S-x>");
  });

  it("preserves <S-> on non-letter shifted printables (cannot lowercase)", () => {
    expect(encodeKeyToken(input("!", { ctrl: true, shift: true }))).toBe(
      "<C-S-!>",
    );
  });

  it("uses Space inside <…> but bare space stays as ' '", () => {
    expect(encodeKeyToken(input(" "))).toBe(" ");
    expect(encodeKeyToken(input(" ", { ctrl: true }))).toBe("<C-Space>");
  });
});
