import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendMessageMock } from "@/lib/test/messaging";
import {
  closeOtherTabsAction,
  closeTabAction,
  closeTabsAfterAction,
  closeTabsBeforeAction,
  createTabAction,
  duplicateTabAction,
  firstTabAction,
  lastTabAction,
  moveTabNextAction,
  moveTabPreviousAction,
  moveTabToNewWindowAction,
  nextTabAction,
  previousTabAction,
  restoreTabAction,
  toggleMuteTabAction,
  togglePinTabAction,
} from "./tabs";

vi.mock("@/lib/background/messaging", () => ({ sendMessage: vi.fn() }));

beforeEach(() => vi.clearAllMocks());

describe("createTab message contract", () => {
  it("places the new tab after the current one by default", () => {
    createTabAction.invoke({});
    expect(sendMessageMock).toHaveBeenCalledWith("createTab", {
      position: "after",
    });
  });

  it("forwards the chosen position", () => {
    createTabAction.invoke({ position: "before" });
    expect(sendMessageMock).toHaveBeenCalledWith("createTab", {
      position: "before",
    });
  });
});

describe("switchTab message contract", () => {
  it("requests the next tab, wrapping by default", () => {
    nextTabAction.invoke({});
    expect(sendMessageMock).toHaveBeenCalledWith("switchTab", {
      to: "next",
      wrap: true,
    });
  });

  it("forwards wrap:false to the next tab", () => {
    nextTabAction.invoke({ wrap: false });
    expect(sendMessageMock).toHaveBeenCalledWith("switchTab", {
      to: "next",
      wrap: false,
    });
  });

  it("requests the previous tab", () => {
    previousTabAction.invoke({ wrap: true });
    expect(sendMessageMock).toHaveBeenCalledWith("switchTab", {
      to: "previous",
      wrap: true,
    });
  });

  it("requests the first tab without wrapping", () => {
    firstTabAction.invoke({});
    expect(sendMessageMock).toHaveBeenCalledWith("switchTab", {
      to: "first",
      wrap: false,
    });
  });

  it("requests the last tab without wrapping", () => {
    lastTabAction.invoke({});
    expect(sendMessageMock).toHaveBeenCalledWith("switchTab", {
      to: "last",
      wrap: false,
    });
  });
});

describe("parameterless tab message contracts", () => {
  it.each([
    { action: duplicateTabAction, message: "duplicateTab" },
    { action: closeTabAction, message: "closeTab" },
    { action: restoreTabAction, message: "restoreTab" },
    { action: togglePinTabAction, message: "togglePinTab" },
    { action: toggleMuteTabAction, message: "toggleMuteTab" },
    { action: moveTabToNewWindowAction, message: "moveTabToNewWindow" },
  ])("sends the bare $message message with no payload", ({
    action,
    message,
  }) => {
    action.invoke({});
    expect(sendMessageMock).toHaveBeenCalledWith(message);
  });
});

describe("moveTab message contract", () => {
  it("moves one position to the left", () => {
    moveTabPreviousAction.invoke({});
    expect(sendMessageMock).toHaveBeenCalledWith("moveTab", { offset: -1 });
  });

  it("moves one position to the right", () => {
    moveTabNextAction.invoke({});
    expect(sendMessageMock).toHaveBeenCalledWith("moveTab", { offset: 1 });
  });
});

describe("closeTabs message contract", () => {
  it("closes tabs before the current one, excluding pinned by default", () => {
    closeTabsBeforeAction.invoke({});
    expect(sendMessageMock).toHaveBeenCalledWith("closeTabs", {
      scope: "before",
      includePinned: false,
    });
  });

  it("closes tabs after the current one", () => {
    closeTabsAfterAction.invoke({});
    expect(sendMessageMock).toHaveBeenCalledWith("closeTabs", {
      scope: "after",
      includePinned: false,
    });
  });

  it("closes every other tab", () => {
    closeOtherTabsAction.invoke({});
    expect(sendMessageMock).toHaveBeenCalledWith("closeTabs", {
      scope: "other",
      includePinned: false,
    });
  });

  it("forwards includePinned:true", () => {
    closeOtherTabsAction.invoke({ includePinned: true });
    expect(sendMessageMock).toHaveBeenCalledWith("closeTabs", {
      scope: "other",
      includePinned: true,
    });
  });
});
