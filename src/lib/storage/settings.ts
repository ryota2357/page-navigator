import { is } from "@core/unknownutil";
import { log } from "../log";
import { defineStorageItem } from "./storage";

export type Settings = {
  [K in keyof typeof settingsSchema]: (typeof settingsSchema)[K] extends {
    type: "number";
  }
    ? number
    : (typeof settingsSchema)[K] extends { type: "boolean" }
      ? boolean
      : (typeof settingsSchema)[K] extends {
            type: "select";
            options: readonly (infer V)[];
          }
        ? V
        : never;
};

export const settingsSchema = {
  enabled: {
    type: "boolean",
    default: true,
  },
  sequenceTimeoutMs: {
    type: "number",
    min: 20,
    max: 60_000,
    default: 1000,
  },
  theme: {
    type: "select",
    options: ["auto", "light", "dark"],
    default: "auto",
  },
} as const;

export function isValidSettingValue<K extends keyof Settings>(
  key: K,
  value: unknown,
): value is Settings[K] {
  const schema = settingsSchema[key];
  switch (schema.type) {
    case "number":
      return (
        is.Number(value) &&
        Number.isFinite(value) &&
        schema.min <= value &&
        value <= schema.max
      );
    case "boolean":
      return is.Boolean(value);
    case "select":
      return is.String(value) && schema.options.some((v) => v === value);
    default:
      return schema satisfies never;
  }
}

const defaultSettings = Object.fromEntries(
  Object.entries(settingsSchema).map(([key, schema]) => [key, schema.default]),
) as Settings;

function isKeyOf<T extends object>(key: PropertyKey, obj: T): key is keyof T {
  return key in obj;
}

export const settingsItem = defineStorageItem<Settings>("local:settings", {
  fallback: defaultSettings,
  version: 1,
  migrations: {},
  validate: (raw) => {
    if (!is.RecordObject(raw)) {
      log.warn("reset all settings: stored value is not a record", { raw });
      return { ok: false, fallback: defaultSettings };
    }
    const valid: Record<string, unknown> = {};
    let changed = false;
    for (const key of Object.keys(raw)) {
      if (!isKeyOf(key, settingsSchema)) {
        log.warn("dropping unknown setting", { key });
        changed = true;
        continue;
      }
      const value = raw[key];
      if (isValidSettingValue(key, value)) {
        valid[key] = value;
      } else {
        valid[key] = settingsSchema[key].default;
        changed = true;
      }
    }
    return changed ? { ok: false, fallback: valid as Settings } : { ok: true };
  },
});
