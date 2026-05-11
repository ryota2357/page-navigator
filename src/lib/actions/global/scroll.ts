import { is, type PredicateType } from "@core/unknownutil";
import type { Action } from "../../types";

// Each action declares three artifacts (docs/dev/step-02-data-model.md §2.2):
//   pred:     unknownutil predicate (also the type source via PredicateType)
//   defaults: full options bag, typed against pred
//   meta:     UI hints — drives the form generator AND range-clamp at load

// --- scrollDown / scrollUp ----------------------------------------------

const scrollByPred = is.ObjectOf({
  amount: is.Number,
  smooth: is.Boolean,
});
type ScrollByOptions = PredicateType<typeof scrollByPred>;

const scrollByMeta = {
  amount: {
    kind: "number" as const,
    label: "Scroll amount (px)",
    min: 1,
    max: 100000,
  },
  smooth: { kind: "boolean" as const, label: "Smooth scroll" },
};

const scrollDown: Action<ScrollByOptions> = {
  id: "scrollDown",
  description: "Scroll down by a fixed amount.",
  scope: "global",
  runtime: "content",
  options: {
    pred: scrollByPred,
    defaults: { amount: 100, smooth: false },
    meta: scrollByMeta,
  },
  run: (_ctx, opts) => {
    window.scrollBy({
      top: opts.amount,
      behavior: opts.smooth ? "smooth" : "auto",
    });
  },
};

const scrollUp: Action<ScrollByOptions> = {
  id: "scrollUp",
  description: "Scroll up by a fixed amount.",
  scope: "global",
  runtime: "content",
  options: {
    pred: scrollByPred,
    defaults: { amount: 100, smooth: false },
    meta: scrollByMeta,
  },
  run: (_ctx, opts) => {
    window.scrollBy({
      top: -opts.amount,
      behavior: opts.smooth ? "smooth" : "auto",
    });
  },
};

// --- scrollPageDown / scrollPageUp --------------------------------------

const pageScrollPred = is.ObjectOf({
  fraction: is.Number,
  smooth: is.Boolean,
});
type PageScrollOptions = PredicateType<typeof pageScrollPred>;

const pageScrollMeta = {
  fraction: {
    kind: "number" as const,
    label: "Page fraction (0..1)",
    min: 0.1,
    max: 1,
    step: 0.05,
  },
  smooth: { kind: "boolean" as const, label: "Smooth scroll" },
};

const scrollPageDown: Action<PageScrollOptions> = {
  id: "scrollPageDown",
  description: "Scroll down by a fraction of the viewport height.",
  scope: "global",
  runtime: "content",
  options: {
    pred: pageScrollPred,
    defaults: { fraction: 0.85, smooth: false },
    meta: pageScrollMeta,
  },
  run: (_ctx, opts) => {
    window.scrollBy({
      top: window.innerHeight * opts.fraction,
      behavior: opts.smooth ? "smooth" : "auto",
    });
  },
};

const scrollPageUp: Action<PageScrollOptions> = {
  id: "scrollPageUp",
  description: "Scroll up by a fraction of the viewport height.",
  scope: "global",
  runtime: "content",
  options: {
    pred: pageScrollPred,
    defaults: { fraction: 0.85, smooth: false },
    meta: pageScrollMeta,
  },
  run: (_ctx, opts) => {
    window.scrollBy({
      top: -window.innerHeight * opts.fraction,
      behavior: opts.smooth ? "smooth" : "auto",
    });
  },
};

// --- scrollToTop / scrollToBottom ---------------------------------------

const toEdgePred = is.ObjectOf({
  smooth: is.Boolean,
});
type ToEdgeOptions = PredicateType<typeof toEdgePred>;

const toEdgeMeta = {
  smooth: { kind: "boolean" as const, label: "Smooth scroll" },
};

const scrollToTop: Action<ToEdgeOptions> = {
  id: "scrollToTop",
  description: "Jump to the very top of the page.",
  scope: "global",
  runtime: "content",
  options: {
    pred: toEdgePred,
    defaults: { smooth: false },
    meta: toEdgeMeta,
  },
  run: (_ctx, opts) => {
    window.scrollTo({
      top: 0,
      behavior: opts.smooth ? "smooth" : "auto",
    });
  },
};

const scrollToBottom: Action<ToEdgeOptions> = {
  id: "scrollToBottom",
  description: "Jump to the very bottom of the page.",
  scope: "global",
  runtime: "content",
  options: {
    pred: toEdgePred,
    defaults: { smooth: false },
    meta: toEdgeMeta,
  },
  run: (_ctx, opts) => {
    // document.documentElement.scrollHeight covers both quirks-mode and
    // standards-mode roots; window.scrollTo with a number past the max is
    // clamped by the browser, so no need to measure first.
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: opts.smooth ? "smooth" : "auto",
    });
  },
};

// biome-ignore lint/suspicious/noExplicitAny: heterogeneous action list — each Action<O> has its own O
export const scrollActions: ReadonlyArray<Action<any>> = [
  scrollDown,
  scrollUp,
  scrollPageDown,
  scrollPageUp,
  scrollToTop,
  scrollToBottom,
];
