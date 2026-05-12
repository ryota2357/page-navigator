import type { Predicate } from "@core/unknownutil";

export type ScopeId = "global" | "google";

export type FieldMeta =
  | {
      kind: "number";
      label: string;
      description?: string;
      min?: number;
      max?: number;
      step?: number;
    }
  | {
      kind: "boolean";
      label: string;
      description?: string;
    }
  | {
      kind: "select";
      label: string;
      description?: string;
      options: string[];
    };

export type ActionContext = {
  bindingId: string;
  scope: ScopeId;
};

// Uniform action shape that the runtime (dispatcher, loader, UI) sees:
// options are erased to a Record so the registry is heterogeneous-O-safe.
// Use defineAction() to declare one — its closure carries the typed run()
// body and the pred-narrowing happens inside invoke(), so callers never see
// the option type variance.
export type Action = {
  scope: ScopeId;
  description: string;
  defaults: Record<string, unknown>;
  meta: Record<string, FieldMeta>;
  validate: (opts: unknown) => boolean;
  invoke: (ctx: ActionContext, opts: unknown) => void | Promise<void>;
};

export function defineAction<O extends Record<string, unknown>>(spec: {
  scope: ScopeId;
  description: string;
  pred: Predicate<O>;
  defaults: O;
  meta: { [K in keyof O]: FieldMeta };
  run: (ctx: ActionContext, opts: O) => void | Promise<void>;
}): Action {
  return {
    scope: spec.scope,
    description: spec.description,
    defaults: spec.defaults,
    meta: spec.meta,
    validate: spec.pred,
    invoke: (ctx, opts) => {
      if (!spec.pred(opts)) return;
      return spec.run(ctx, opts);
    },
  };
}
