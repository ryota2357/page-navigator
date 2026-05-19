import { is } from "@core/unknownutil";
import { isScopeId, type ScopeId } from "./scopes";

export type ActionId = `${ScopeId}.${string}`;

export function isActionId(value: unknown): value is ActionId {
  if (!is.String(value)) return false;
  const dotIdx = value.indexOf(".");
  if (dotIdx === -1) return false;
  const scope = value.slice(0, dotIdx);
  const rest = value.slice(dotIdx + 1);
  return isScopeId(scope) && rest.length > 1;
}

export type Action<
  S extends Record<string, OptionSchema> = Record<string, OptionSchema>,
> = {
  id: ActionId;
  scope: ScopeId;
  description: string;
  optionSchema: S;
  defaults: OptionValue<S>;
  invoke: (
    option: Record<PropertyKey, unknown>,
  ) => InvokeResult | Promise<InvokeResult>;
};

export type InvokeResult = { ok: true } | { ok: false; reason: string };

export type OptionSchema =
  | {
      kind: "number";
      min?: number;
      max?: number;
      step?: number;
    }
  | {
      kind: "boolean";
    }
  | {
      kind: "select";
      options: readonly string[];
    };

export type OptionValue<S extends Record<string, OptionSchema>> = {
  [K in keyof S]: S[K] extends { kind: "number" }
    ? number
    : S[K] extends { kind: "boolean" }
      ? boolean
      : S[K] extends { kind: "select"; options: readonly (infer V)[] }
        ? V
        : never;
};

function isOptionValue<S extends Record<string, OptionSchema>>(
  values: Record<string, unknown>,
  schema: S,
): values is OptionValue<S> {
  for (const key of Object.keys(schema)) {
    const value = values[key];
    switch (schema[key].kind) {
      case "number":
        if (!is.Number(value) || !Number.isFinite(value)) return false;
        if (schema[key].min !== undefined && value < schema[key].min)
          return false;
        if (schema[key].max !== undefined && value > schema[key].max)
          return false;
        break;
      case "boolean":
        if (!is.Boolean(value)) return false;
        break;
      case "select":
        if (!is.String(value) || !schema[key].options.includes(value)) {
          return false;
        }
        break;
      default:
        schema[key] satisfies never;
    }
  }
  return true;
}

export function defineAction<
  const Id extends ActionId,
  S extends Record<string, OptionSchema>,
>(
  id: Id,
  spec: {
    description: string;
    optionSchema: S;
    defaults: OptionValue<S>;
    run: (options: OptionValue<S>) => void | Promise<void>;
  },
): Action<S> & { id: Id } {
  const dotIdx = id.indexOf(".");
  const scope = id.slice(0, dotIdx) as ScopeId;
  return {
    id,
    scope,
    description: spec.description,
    optionSchema: spec.optionSchema,
    defaults: spec.defaults,
    invoke: (option: Record<string, unknown>) => {
      const optv: Record<string, unknown> = {};
      for (const key of Object.keys(spec.optionSchema)) {
        optv[key] = key in option ? option[key] : spec.defaults[key];
      }
      if (!isOptionValue(optv, spec.optionSchema)) {
        return { ok: false, reason: "invalid options" };
      }
      const ret = spec.run(optv);
      if (ret instanceof Promise) return ret.then(() => ({ ok: true }));
      return { ok: true };
    },
  };
}
