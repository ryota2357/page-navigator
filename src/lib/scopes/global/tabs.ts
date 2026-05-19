import { defineAction } from "@/lib/action";
import { sendMessage } from "@/lib/background/messaging";

const wrapOptionSchema = {
  wrap: { kind: "boolean", label: "Wrap around" },
} as const;

export const createTabAction = defineAction("global.createTab", {
  description: "Open a new tab in the current window.",
  optionSchema: {
    position: {
      kind: "select",
      label: "Position",
      options: ["before", "after"] as const,
    },
  },
  defaults: { position: "after" },
  run: ({ position }) => sendMessage("createTab", { position }),
});

export const nextTabAction = defineAction("global.nextTab", {
  description: "Switch to the next tab in the current window.",
  optionSchema: wrapOptionSchema,
  defaults: { wrap: true },
  run: ({ wrap }) => sendMessage("switchTab", { to: "next", wrap }),
});

export const previousTabAction = defineAction("global.previousTab", {
  description: "Switch to the previous tab in the current window.",
  optionSchema: wrapOptionSchema,
  defaults: { wrap: true },
  run: ({ wrap }) => sendMessage("switchTab", { to: "previous", wrap }),
});

export const firstTabAction = defineAction("global.firstTab", {
  description: "Switch to the first tab in the current window.",
  optionSchema: {},
  defaults: {},
  run: () => sendMessage("switchTab", { to: "first", wrap: false }),
});

export const lastTabAction = defineAction("global.lastTab", {
  description: "Switch to the last tab in the current window.",
  optionSchema: {},
  defaults: {},
  run: () => sendMessage("switchTab", { to: "last", wrap: false }),
});

export const duplicateTabAction = defineAction("global.duplicateTab", {
  description: "Duplicate the current tab.",
  optionSchema: {},
  defaults: {},
  run: () => sendMessage("duplicateTab"),
});

export const closeTabAction = defineAction("global.closeTab", {
  description: "Close the current tab.",
  optionSchema: {},
  defaults: {},
  run: () => sendMessage("closeTab"),
});

export const restoreTabAction = defineAction("global.restoreTab", {
  description: "Reopen the most recently closed tab or window.",
  optionSchema: {},
  defaults: {},
  run: () => sendMessage("restoreTab"),
});

export const togglePinTabAction = defineAction("global.togglePinTab", {
  description: "Toggle the pinned state of the current tab.",
  optionSchema: {},
  defaults: {},
  run: () => sendMessage("togglePinTab"),
});

export const toggleMuteTabAction = defineAction("global.toggleMuteTab", {
  description: "Toggle the muted state of the current tab.",
  optionSchema: {},
  defaults: {},
  run: () => sendMessage("toggleMuteTab"),
});

export const moveTabPreviousAction = defineAction("global.moveTabPrevious", {
  description: "Move the current tab one position to the left.",
  optionSchema: {},
  defaults: {},
  run: () => sendMessage("moveTab", { offset: -1 }),
});

export const moveTabNextAction = defineAction("global.moveTabNext", {
  description: "Move the current tab one position to the right.",
  optionSchema: {},
  defaults: {},
  run: () => sendMessage("moveTab", { offset: 1 }),
});

export const moveTabToNewWindowAction = defineAction(
  "global.moveTabToNewWindow",
  {
    description: "Move the current tab into a new window.",
    optionSchema: {},
    defaults: {},
    run: () => sendMessage("moveTabToNewWindow"),
  },
);

const closeRangeOptionSchema = {
  includePinned: { kind: "boolean", label: "Include pinned tabs" },
} as const;

export const closeTabsBeforeAction = defineAction("global.closeTabsBefore", {
  description: "Close every tab to the left of the current tab.",
  optionSchema: closeRangeOptionSchema,
  defaults: { includePinned: false },
  run: ({ includePinned }) => {
    return sendMessage("closeTabs", {
      scope: "before",
      includePinned,
    });
  },
});

export const closeTabsAfterAction = defineAction("global.closeTabsAfter", {
  description: "Close every tab to the right of the current tab.",
  optionSchema: closeRangeOptionSchema,
  defaults: { includePinned: false },
  run: ({ includePinned }) => {
    return sendMessage("closeTabs", {
      scope: "after",
      includePinned,
    });
  },
});

export const closeOtherTabsAction = defineAction("global.closeOtherTabs", {
  description: "Close every tab except the current one.",
  optionSchema: closeRangeOptionSchema,
  defaults: { includePinned: false },
  run: ({ includePinned }) => {
    return sendMessage("closeTabs", {
      scope: "other",
      includePinned,
    });
  },
});
