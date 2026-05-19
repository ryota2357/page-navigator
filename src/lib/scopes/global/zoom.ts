import { defineAction } from "@/lib/action";
import { sendMessage } from "@/lib/background/messaging";

export const setZoomAction = defineAction("global.setZoom", {
  description: "Set the zoom factor of the current tab.",
  optionSchema: {
    factor: {
      kind: "number",
      label: "Zoom factor",
      min: 0.25,
      max: 5,
      step: 0.05,
    },
  },
  defaults: { factor: 1 },
  run: ({ factor }) => sendMessage("setZoom", { factor }),
});

const stepOptionSchema = {
  step: {
    kind: "number",
    label: "Zoom step",
    min: 0.05,
    max: 1,
    step: 0.05,
  },
} as const;

export const zoomInAction = defineAction("global.zoomIn", {
  description: "Increase the zoom factor of the current tab.",
  optionSchema: stepOptionSchema,
  defaults: { step: 0.1 },
  run: ({ step }) => sendMessage("adjustZoom", { delta: step }),
});

export const zoomOutAction = defineAction("global.zoomOut", {
  description: "Decrease the zoom factor of the current tab.",
  optionSchema: stepOptionSchema,
  defaults: { step: 0.1 },
  run: ({ step }) => sendMessage("adjustZoom", { delta: -step }),
});

export const zoomResetAction = defineAction("global.zoomReset", {
  description: "Reset the zoom factor to the per-site default.",
  optionSchema: {},
  defaults: {},
  // factor: 0 sets the tab to its current default zoom factor (see browser.tabs.setZoom()).
  run: () => sendMessage("setZoom", { factor: 0 }),
});
