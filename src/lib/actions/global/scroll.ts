import { is, type PredicateType } from "@core/unknownutil";
import type { Action } from "../../types";

// Each action declares three artifacts (docs/dev/step-02-data-model.md §2.2):
//   pred:     unknownutil predicate (also the type source via PredicateType)
//   defaults: full options bag, typed against pred
//   meta:     UI hints — drives the form generator AND range-clamp at load

// --- scroll.down / scroll.up --------------------------------------------

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
  id: "scroll.down",
  label: "Scroll down",
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
  id: "scroll.up",
  label: "Scroll up",
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

// --- scroll.pageDown / scroll.pageUp ------------------------------------

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
  id: "scroll.pageDown",
  label: "Scroll page down",
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
  id: "scroll.pageUp",
  label: "Scroll page up",
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

// --- scroll.toTop -------------------------------------------------------

const toTopPred = is.ObjectOf({
  smooth: is.Boolean,
});
type ToTopOptions = PredicateType<typeof toTopPred>;

const scrollToTop: Action<ToTopOptions> = {
  id: "scroll.toTop",
  label: "Scroll to top",
  scope: "global",
  runtime: "content",
  options: {
    pred: toTopPred,
    defaults: { smooth: false },
    meta: {
      smooth: { kind: "boolean", label: "Smooth scroll" },
    },
  },
  run: (_ctx, opts) => {
    window.scrollTo({
      top: 0,
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
];
