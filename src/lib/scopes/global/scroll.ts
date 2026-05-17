import { defineAction } from "@/lib/action";

const byPixelOptionSchema = {
  amount: {
    kind: "number",
    label: "Scroll amount (px)",
    min: 1,
    max: 100000,
  },
  smooth: { kind: "boolean", label: "Smooth scroll" },
} as const;

export const scrollDownAction = defineAction("scrollDown", {
  scope: "global",
  description: "Scroll down by a fixed amount.",
  optionSchema: byPixelOptionSchema,
  defaults: { amount: 100, smooth: false },
  run: (options) => {
    window.scrollBy({
      top: options.amount,
      behavior: options.smooth ? "smooth" : "instant",
    });
  },
});

export const scrollUpAction = defineAction("scrollUp", {
  scope: "global",
  description: "Scroll up by a fixed amount.",
  optionSchema: byPixelOptionSchema,
  defaults: { amount: 100, smooth: false },
  run: (options) => {
    window.scrollBy({
      top: -options.amount,
      behavior: options.smooth ? "smooth" : "instant",
    });
  },
});

export const scrollLeftAction = defineAction("scrollLeft", {
  scope: "global",
  description: "Scroll left by a fixed amount.",
  optionSchema: byPixelOptionSchema,
  defaults: { amount: 100, smooth: false },
  run: (options) => {
    window.scrollBy({
      left: -options.amount,
      behavior: options.smooth ? "smooth" : "instant",
    });
  },
});

export const scrollRightAction = defineAction("scrollRight", {
  scope: "global",
  description: "Scroll right by a fixed amount.",
  optionSchema: byPixelOptionSchema,
  defaults: { amount: 100, smooth: false },
  run: (options) => {
    window.scrollBy({
      left: options.amount,
      behavior: options.smooth ? "smooth" : "instant",
    });
  },
});

const byPageOptionSchema = {
  fraction: {
    kind: "number",
    label: "Page fraction (0..1)",
    min: 0.1,
    max: 1,
    step: 0.05,
  },
  smooth: { kind: "boolean", label: "Smooth scroll" },
} as const;

export const scrollPageDownAction = defineAction("scrollPageDown", {
  scope: "global",
  description: "Scroll down by a fraction of the viewport height.",
  optionSchema: byPageOptionSchema,
  defaults: { fraction: 0.85, smooth: false },
  run: (options) => {
    window.scrollBy({
      top: window.innerHeight * options.fraction,
      behavior: options.smooth ? "smooth" : "instant",
    });
  },
});

export const scrollPageUpAction = defineAction("scrollPageUp", {
  scope: "global",
  description: "Scroll up by a fraction of the viewport height.",
  optionSchema: byPageOptionSchema,
  defaults: { fraction: 0.85, smooth: false },
  run: (options) => {
    window.scrollBy({
      top: -window.innerHeight * options.fraction,
      behavior: options.smooth ? "smooth" : "instant",
    });
  },
});

const toEdgeOptionSchema = {
  smooth: { kind: "boolean", label: "Smooth scroll" },
} as const;

export const scrollToTopAction = defineAction("scrollToTop", {
  scope: "global",
  description: "Jump to the very top of the page.",
  optionSchema: toEdgeOptionSchema,
  defaults: { smooth: false },
  run: (options) => {
    window.scrollTo({
      top: 0,
      behavior: options.smooth ? "smooth" : "instant",
    });
  },
});

export const scrollToBottomAction = defineAction("scrollToBottom", {
  scope: "global",
  description: "Jump to the very bottom of the page.",
  optionSchema: toEdgeOptionSchema,
  defaults: { smooth: false },
  run: (options) => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: options.smooth ? "smooth" : "instant",
    });
  },
});

export const scrollToLeftAction = defineAction("scrollToLeft", {
  scope: "global",
  description: "Jump to the leftmost edge of the page.",
  optionSchema: toEdgeOptionSchema,
  defaults: { smooth: false },
  run: (options) => {
    window.scrollTo({
      left: 0,
      behavior: options.smooth ? "smooth" : "instant",
    });
  },
});

export const scrollToRightAction = defineAction("scrollToRight", {
  scope: "global",
  description: "Jump to the rightmost edge of the page.",
  optionSchema: toEdgeOptionSchema,
  defaults: { smooth: false },
  run: (options) => {
    window.scrollTo({
      left: document.documentElement.scrollWidth,
      behavior: options.smooth ? "smooth" : "instant",
    });
  },
});
