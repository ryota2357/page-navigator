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

export const scrollDownAction = defineAction("global.scrollDown", {
  description: "Scroll down by a fixed amount.",
  optionSchema: byPixelOptionSchema,
  defaults: { amount: 100, smooth: false },
  run: ({ amount, smooth }) => {
    window.scrollBy({
      top: amount,
      behavior: smooth ? "smooth" : "instant",
    });
  },
});

export const scrollUpAction = defineAction("global.scrollUp", {
  description: "Scroll up by a fixed amount.",
  optionSchema: byPixelOptionSchema,
  defaults: { amount: 100, smooth: false },
  run: ({ amount, smooth }) => {
    window.scrollBy({
      top: -amount,
      behavior: smooth ? "smooth" : "instant",
    });
  },
});

export const scrollLeftAction = defineAction("global.scrollLeft", {
  description: "Scroll left by a fixed amount.",
  optionSchema: byPixelOptionSchema,
  defaults: { amount: 100, smooth: false },
  run: ({ amount, smooth }) => {
    window.scrollBy({
      left: -amount,
      behavior: smooth ? "smooth" : "instant",
    });
  },
});

export const scrollRightAction = defineAction("global.scrollRight", {
  description: "Scroll right by a fixed amount.",
  optionSchema: byPixelOptionSchema,
  defaults: { amount: 100, smooth: false },
  run: ({ amount, smooth }) => {
    window.scrollBy({
      left: amount,
      behavior: smooth ? "smooth" : "instant",
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

export const scrollPageDownAction = defineAction("global.scrollPageDown", {
  description: "Scroll down by a fraction of the viewport height.",
  optionSchema: byPageOptionSchema,
  defaults: { fraction: 0.85, smooth: false },
  run: ({ fraction, smooth }) => {
    window.scrollBy({
      top: window.innerHeight * fraction,
      behavior: smooth ? "smooth" : "instant",
    });
  },
});

export const scrollPageUpAction = defineAction("global.scrollPageUp", {
  description: "Scroll up by a fraction of the viewport height.",
  optionSchema: byPageOptionSchema,
  defaults: { fraction: 0.85, smooth: false },
  run: ({ fraction, smooth }) => {
    window.scrollBy({
      top: -window.innerHeight * fraction,
      behavior: smooth ? "smooth" : "instant",
    });
  },
});

const toEdgeOptionSchema = {
  smooth: { kind: "boolean", label: "Smooth scroll" },
} as const;

export const scrollToTopAction = defineAction("global.scrollToTop", {
  description: "Jump to the very top of the page.",
  optionSchema: toEdgeOptionSchema,
  defaults: { smooth: false },
  run: ({ smooth }) => {
    window.scrollTo({
      top: 0,
      behavior: smooth ? "smooth" : "instant",
    });
  },
});

export const scrollToBottomAction = defineAction("global.scrollToBottom", {
  description: "Jump to the very bottom of the page.",
  optionSchema: toEdgeOptionSchema,
  defaults: { smooth: false },
  run: ({ smooth }) => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: smooth ? "smooth" : "instant",
    });
  },
});

export const scrollToLeftAction = defineAction("global.scrollToLeft", {
  description: "Jump to the leftmost edge of the page.",
  optionSchema: toEdgeOptionSchema,
  defaults: { smooth: false },
  run: ({ smooth }) => {
    window.scrollTo({
      left: 0,
      behavior: smooth ? "smooth" : "instant",
    });
  },
});

export const scrollToRightAction = defineAction("global.scrollToRight", {
  description: "Jump to the rightmost edge of the page.",
  optionSchema: toEdgeOptionSchema,
  defaults: { smooth: false },
  run: ({ smooth }) => {
    window.scrollTo({
      left: document.documentElement.scrollWidth,
      behavior: smooth ? "smooth" : "instant",
    });
  },
});
