import { is } from "@core/unknownutil";
import { type Binding, isBinding } from "./bindings";
import { isValidSettingValue, type Settings, settingsSchema } from "./settings";

export type TransferConfig = {
  readonly version: 1;
  readonly bindings: Omit<Binding, "id">[];
  readonly settings: Omit<Settings, "enabled">;
};

export function serializeConfig(
  bindings: Binding[],
  settings: Settings,
): string {
  return JSON.stringify(
    {
      version: 1,
      bindings: bindings.map((b) => ({
        scope: b.scope,
        triggers: b.triggers,
        actionId: b.actionId,
        options: b.options,
        enabled: b.enabled,
      })),
      settings: {
        sequenceTimeoutMs: settings.sequenceTimeoutMs,
        theme: settings.theme,
      },
    } satisfies TransferConfig,
    null,
    2,
  );
}

export type DeserializeResult =
  | { ok: true; config: TransferConfig }
  | { ok: false; message: string };

export function deserializeConfig(text: string): DeserializeResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `Not valid JSON: ${reason}` };
  }

  if (!is.ObjectOf({ version: is.Number })(raw)) {
    return {
      ok: false,
      message: "Expected a JSON object with a version number",
    };
  }

  switch (raw.version) {
    case 1:
      return deserializeV1(raw);
    default:
      return {
        ok: false,
        message: `Unsupported version ${raw.version}`,
      };
  }
}

function deserializeV1(raw: Record<PropertyKey, unknown>): DeserializeResult {
  if (
    !is.ObjectOf({
      bindings: is.Array,
      settings: is.RecordObject,
    })(raw)
  ) {
    return {
      ok: false,
      message:
        "Invalid shape for version 1, expected bindings array and settings object",
    };
  }

  const bindings: Omit<Binding, "id">[] = [];
  for (const [i, row] of raw.bindings.entries()) {
    if (!is.OmitOf(isBinding, ["id"])(row)) {
      return { ok: false, message: `Invalid binding at index ${i}` };
    }
    bindings.push({
      scope: row.scope,
      triggers: row.triggers,
      actionId: row.actionId,
      options: row.options,
      enabled: row.enabled,
    });
  }

  const valid: Record<string, unknown> = {};
  for (const key of Object.keys(settingsSchema)) {
    if (!isKeyOf(key, settingsSchema)) {
      return { ok: false, message: `Missing setting: ${key}` };
    }
    const value = raw.settings[key];
    if (!isValidSettingValue(key, value)) {
      return { ok: false, message: `Invalid value for setting "${key}"` };
    }
    valid[key] = value;
  }
  const settings = valid as Omit<Settings, "enabled">;

  return { ok: true, config: { version: 1, bindings, settings } };
}

function isKeyOf<T extends object>(key: PropertyKey, obj: T): key is keyof T {
  return key in obj;
}
