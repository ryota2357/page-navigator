import { is, type PredicateType } from "@core/unknownutil";
import { isActionId } from "../action";
import { isTrigger } from "../keys";
import { log } from "../log";
import { isScopeId } from "../scopes";
import { defineStorageItem } from "./storage";

declare const bindingIdBrand: unique symbol;
// The value is opaque (currently a UUIDv4) — nothing downstream may depend on its format, so the runtime check stays a bare string.
export type BindingId = string & { readonly [bindingIdBrand]: true };

export const isBindingId = (value: unknown): value is BindingId =>
  is.String(value);

export function newBindingId(): BindingId {
  return crypto.randomUUID() as BindingId;
}

export const isBinding = is.ObjectOf({
  id: isBindingId,
  scope: isScopeId,
  triggers: is.ArrayOf(isTrigger),
  actionId: isActionId,
  options: is.RecordObject,
  enabled: is.Boolean,
});

export type Binding = PredicateType<typeof isBinding>;

export const bindingsItem = defineStorageItem<Binding[]>("local:bindings", {
  fallback: [],
  version: 1,
  migrations: {},
  validate: (raw) => {
    if (!is.Array(raw)) {
      log.warn("dropping all bindings: stored value is not an array", {
        value: raw,
      });
      return { ok: false, fallback: [] };
    }
    const valid: Binding[] = [];
    for (const row of raw) {
      if (!isBinding(row)) {
        log.warn("dropping binding: invalid shape", { value: row });
        continue;
      }
      valid.push(row);
    }
    if (valid.length === raw.length) {
      return { ok: true };
    } else {
      return { ok: false, fallback: valid };
    }
  },
});
