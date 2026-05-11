import type { Predicate } from "@core/unknownutil";

// === keys ===
//
// Canonical string form. Examples:
//   "j", "J", "?"            — bare printable; Shift folds into case
//   "<C-j>"                  — Ctrl+j; printable lowercased; case inside <…> not significant
//   "<C-S-j>"                — Ctrl+Shift+j; explicit <S-> when paired with another modifier
//   "<S-Tab>", "<C-S-Tab>"   — non-printable: Shift always kept as modifier
//
// Modifier letters uppercase, modifier order A-C-M-S (alphabetical),
// non-printable key names UpperCamelCase. See docs/dev/step-02-data-model.md §1.
export type KeyToken = string;
export type Trigger = KeyToken[];

// === scopes ===
export type Scope = "global" | `site:${string}`;

// === actions ===
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

export type OptionsMeta<T> = { [K in keyof T]: FieldMeta };

export type ActionContext = {
  bindingId: string;
  scope: Scope;
};

export type Action<O = unknown> = {
  id: string;
  description?: string;
  scope: Scope;
  runtime: "content" | "background";
  options: {
    pred: Predicate<O>;
    defaults: O;
    meta: OptionsMeta<O>;
  };
  run: (ctx: ActionContext, opts: O) => void | Promise<void>;
};

// === bindings (storage AND runtime — same shape) ===
export type Binding<O = Record<string, unknown>> = {
  id: string;
  scope: Scope;
  triggers: Trigger[];
  actionId: string;
  options: O;
  enabled: boolean;
};

// === settings ===
export type Settings = {
  sequenceTimeoutMs: number;
};

// === services ===
export type Service = {
  id: string;
  label: string;
  urlPattern: RegExp;
};
