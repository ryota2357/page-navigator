import { defineAction } from "@/lib/action";

export const noopAction = defineAction("global.noop", {
  description: "Do nothing.",
  optionSchema: {},
  defaults: {},
  run: () => {},
});
