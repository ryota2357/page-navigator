import { is, type PredicateType } from "@core/unknownutil";
import type { Action } from "../../types";

// History navigation. The browser's history stack is the source of truth;
// no options are needed for now (Vimium accepts a count, but the binding
// can be invoked repeatedly to step further — simpler model for v1).

const historyPred = is.ObjectOf({});
type HistoryOptions = PredicateType<typeof historyPred>;

const goHistoryBack: Action<HistoryOptions> = {
  id: "goHistoryBack",
  description: "Go back one step in the browser history.",
  scope: "global",
  runtime: "content",
  options: {
    pred: historyPred,
    defaults: {},
    meta: {},
  },
  run: () => {
    window.history.back();
  },
};

const goHistoryForward: Action<HistoryOptions> = {
  id: "goHistoryForward",
  description: "Go forward one step in the browser history.",
  scope: "global",
  runtime: "content",
  options: {
    pred: historyPred,
    defaults: {},
    meta: {},
  },
  run: () => {
    window.history.forward();
  },
};

// biome-ignore lint/suspicious/noExplicitAny: heterogeneous action list — each Action<O> has its own O
export const historyActions: ReadonlyArray<Action<any>> = [
  goHistoryBack,
  goHistoryForward,
];
