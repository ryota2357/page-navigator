import { defineAction } from "@/lib/action";

export const goHistoryBackAction = defineAction("global.goHistoryBack", {
  description: "Go back one step in the browser history.",
  optionSchema: {},
  defaults: {},
  run: () => {
    window.history.back();
  },
});

export const goHistoryForwardAction = defineAction("global.goHistoryForward", {
  description: "Go forward one step in the browser history.",
  optionSchema: {},
  defaults: {},
  run: () => {
    window.history.forward();
  },
});
