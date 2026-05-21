import { describe, expect, it } from "vitest";
import { noopAction } from "./noop";

describe("noop action", () => {
  it("reports ok without any side effect", () => {
    expect(noopAction.invoke({})).toEqual({ ok: true });
  });
});
