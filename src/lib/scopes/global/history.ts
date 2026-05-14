import { defineAction } from "@/lib/action";

export const goHistoryBackAction = defineAction("goHistoryBack", {
  scope: "global",
  description: "Go back one step in the browser history.",
  optionSchema: {},
  defaults: {},
  bind: () => () => {
    window.history.back();
  },
});

export const goHistoryForwardAction = defineAction("goHistoryForward", {
  scope: "global",
  description: "Go forward one step in the browser history.",
  optionSchema: {},
  defaults: {},
  bind: () => () => {
    window.history.forward();
  },
});
