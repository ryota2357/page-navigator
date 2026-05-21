import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendMessageMock } from "@/lib/test/messaging";
import {
  setZoomAction,
  zoomInAction,
  zoomOutAction,
  zoomResetAction,
} from "./zoom";

vi.mock("@/lib/background/messaging", () => ({ sendMessage: vi.fn() }));

beforeEach(() => vi.clearAllMocks());

describe("setZoom message contract", () => {
  it("forwards the requested factor", () => {
    setZoomAction.invoke({ factor: 1.5 });
    expect(sendMessageMock).toHaveBeenCalledWith("setZoom", { factor: 1.5 });
  });

  it("defaults to factor 1", () => {
    setZoomAction.invoke({});
    expect(sendMessageMock).toHaveBeenCalledWith("setZoom", { factor: 1 });
  });
});

describe("adjustZoom message contract", () => {
  it("zooms in by a positive delta", () => {
    zoomInAction.invoke({ step: 0.2 });
    expect(sendMessageMock).toHaveBeenCalledWith("adjustZoom", { delta: 0.2 });
  });

  it("zooms out by a negative delta", () => {
    zoomOutAction.invoke({ step: 0.2 });
    expect(sendMessageMock).toHaveBeenCalledWith("adjustZoom", { delta: -0.2 });
  });

  it("uses the default step when omitted", () => {
    zoomInAction.invoke({});
    expect(sendMessageMock).toHaveBeenCalledWith("adjustZoom", { delta: 0.1 });
  });
});

describe("zoomReset message contract", () => {
  // factor 0 tells browser.tabs.setZoom() to restore the per-site default.
  it("sends setZoom with factor 0", () => {
    zoomResetAction.invoke({});
    expect(sendMessageMock).toHaveBeenCalledWith("setZoom", { factor: 0 });
  });
});
