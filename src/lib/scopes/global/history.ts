import { is } from "@core/unknownutil";
import { defineAction } from "../../action";

const noOptionsPred = is.ObjectOf({});

export const goHistoryBack = defineAction({
  scope: "global",
  description: "Go back one step in the browser history.",
  pred: noOptionsPred,
  defaults: {},
  meta: {},
  run: () => {
    window.history.back();
  },
});

export const goHistoryForward = defineAction({
  scope: "global",
  description: "Go forward one step in the browser history.",
  pred: noOptionsPred,
  defaults: {},
  meta: {},
  run: () => {
    window.history.forward();
  },
});
