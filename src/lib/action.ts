import { is } from "@core/unknownutil";
import type { ScopeId } from "./scopes";

export type ActionInstance = {
  id: string;
  scope: ScopeId;
  option: Record<string, number | boolean | string>;
  invoke: () => void | Promise<void>;
};

export type Action<
  S extends Record<string, OptionSchema> = Record<string, OptionSchema>,
> = {
  id: string;
  scope: ScopeId;
  description: string;
  optionSchema: S;
  defaults: OptionValue<S>;
  build: (option: Record<PropertyKey, unknown>) => ActionInstance | null;
};

export type OptionSchema = {
  label: string;
  description?: string;
} & (
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
    }
);

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
  const Id extends string,
  S extends Record<string, OptionSchema>,
>(
  id: Id,
  spec: {
    scope: ScopeId;
    description: string;
    optionSchema: S;
    defaults: OptionValue<S>;
    bind: (options: OptionValue<S>) => () => void | Promise<void>;
  },
): Action<S> & { id: Id } {
  return {
    id,
    scope: spec.scope,
    description: spec.description,
    optionSchema: spec.optionSchema,
    defaults: spec.defaults,
    build: (option: Record<string, unknown> = {}): ActionInstance | null => {
      const optv: Record<string, unknown> = {};
      for (const key of Object.keys(spec.optionSchema)) {
        optv[key] = key in option ? option[key] : spec.defaults[key];
      }
      if (!isOptionValue(optv, spec.optionSchema)) return null;
      return {
        id,
        scope: spec.scope,
        option: optv as Record<string, number | boolean | string>,
        invoke: spec.bind(optv),
      };
    },
  };
}
