import { is } from "@core/unknownutil";
import { defineStorageItem } from "./storage";

export type Settings = {
  [K in keyof typeof settingsSchema]: (typeof settingsSchema)[K] extends {
    type: "number";
  }
    ? number
    : never;
};

export const settingsSchema = {
  sequenceTimeoutMs: {
    type: "number",
    min: 20,
    max: 60_000,
    default: 1000,
  },
} as const;

const defalutSettings = Object.fromEntries(
  Object.entries(settingsSchema).map(([key, { default: value }]) => [
    key,
    value,
  ]),
) as Settings;

export const settingsItem = defineStorageItem<Settings>("local:settings", {
  fallback: defalutSettings,
  version: 1,
  migrations: {},
  validate: (raw) => {
    if (!is.RecordObject(raw)) {
      return {
        ok: false,
        fallback: defalutSettings,
      };
    }
    const valid: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (!(key in settingsSchema)) continue;
      const schema = settingsSchema[key as keyof typeof settingsSchema];
      if (typeof value !== schema.type) continue;
      switch (schema.type) {
        case "number":
          if (is.Number(value) && Number.isFinite(value)) {
            if (schema.min <= value && value <= schema.max) {
              valid[key] = value;
            }
            continue;
          }
          valid[key] = schema.default;
          break;
        default:
          schema.type satisfies never;
      }
    }
    return { ok: true };
  },
});
