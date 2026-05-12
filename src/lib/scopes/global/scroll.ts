import { is, type PredicateType } from "@core/unknownutil";
import { defineAction } from "../../action";

function behavior(smooth: boolean): ScrollBehavior {
  return smooth ? "smooth" : "auto";
}

const byPixelPred = is.ObjectOf({
  amount: is.Number,
  smooth: is.Boolean,
});
type ByPixel = PredicateType<typeof byPixelPred>;

const byPixelMeta = {
  amount: {
    kind: "number",
    label: "Scroll amount (px)",
    min: 1,
    max: 100000,
  },
  smooth: { kind: "boolean", label: "Smooth scroll" },
} as const;

export const scrollDown = defineAction<ByPixel>({
  scope: "global",
  description: "Scroll down by a fixed amount.",
  pred: byPixelPred,
  defaults: { amount: 100, smooth: false },
  meta: byPixelMeta,
  run: (_ctx, opts) => {
    window.scrollBy({ top: opts.amount, behavior: behavior(opts.smooth) });
  },
});

export const scrollUp = defineAction<ByPixel>({
  scope: "global",
  description: "Scroll up by a fixed amount.",
  pred: byPixelPred,
  defaults: { amount: 100, smooth: false },
  meta: byPixelMeta,
  run: (_ctx, opts) => {
    window.scrollBy({ top: -opts.amount, behavior: behavior(opts.smooth) });
  },
});

const byPagePred = is.ObjectOf({
  fraction: is.Number,
  smooth: is.Boolean,
});
type ByPage = PredicateType<typeof byPagePred>;

const byPageMeta = {
  fraction: {
    kind: "number",
    label: "Page fraction (0..1)",
    min: 0.1,
    max: 1,
    step: 0.05,
  },
  smooth: { kind: "boolean", label: "Smooth scroll" },
} as const;

export const scrollPageDown = defineAction<ByPage>({
  scope: "global",
  description: "Scroll down by a fraction of the viewport height.",
  pred: byPagePred,
  defaults: { fraction: 0.85, smooth: false },
  meta: byPageMeta,
  run: (_ctx, opts) => {
    window.scrollBy({
      top: window.innerHeight * opts.fraction,
      behavior: behavior(opts.smooth),
    });
  },
});

export const scrollPageUp = defineAction<ByPage>({
  scope: "global",
  description: "Scroll up by a fraction of the viewport height.",
  pred: byPagePred,
  defaults: { fraction: 0.85, smooth: false },
  meta: byPageMeta,
  run: (_ctx, opts) => {
    window.scrollBy({
      top: -window.innerHeight * opts.fraction,
      behavior: behavior(opts.smooth),
    });
  },
});

const toEdgePred = is.ObjectOf({
  smooth: is.Boolean,
});
type ToEdge = PredicateType<typeof toEdgePred>;

const toEdgeMeta = {
  smooth: { kind: "boolean", label: "Smooth scroll" },
} as const;

export const scrollToTop = defineAction<ToEdge>({
  scope: "global",
  description: "Jump to the very top of the page.",
  pred: toEdgePred,
  defaults: { smooth: false },
  meta: toEdgeMeta,
  run: (_ctx, opts) => {
    window.scrollTo({ top: 0, behavior: behavior(opts.smooth) });
  },
});

export const scrollToBottom = defineAction<ToEdge>({
  scope: "global",
  description: "Jump to the very bottom of the page.",
  pred: toEdgePred,
  defaults: { smooth: false },
  meta: toEdgeMeta,
  run: (_ctx, opts) => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: behavior(opts.smooth),
    });
  },
});
