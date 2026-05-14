import { is, type PredicateType } from "@core/unknownutil";
import { storage } from "wxt/utils/storage";
import { isTrigger, parseTrigger, type Trigger } from "../keys";
import { log } from "../log";
import { isScopeId } from "../scopes";
import { ACTIONS, isValidActionId } from "../scopes/actions";

const isBinding = is.ObjectOf({
  id: is.String,
  scope: isScopeId,
  triggers: is.ArrayOf(isTrigger),
  actionId: isValidActionId,
  options: is.RecordObject,
  enabled: is.Boolean,
});

export type Binding = PredicateType<typeof isBinding>;

export const bindingsItem = storage.defineItem<Binding[]>("local:bindings", {
  fallback: [],
  version: 1,
  migrations: {},
});

export async function loadBindings(): Promise<Binding[]> {
  // NOTE: we should check stored data is valid and ommit invalid ones, so not trust type.
  const stored: Partial<Binding>[] = await bindingsItem.getValue();
  const valid: Binding[] = [];

  for (const row of stored) {
    if (typeof row !== "object") {
      log.warn("dropping binding: not an object", { value: row });
      continue;
    }
    if (!isValidActionId(row?.actionId)) {
      log.warn("dropping binding: unknown action", {
        bindingId: row?.id ?? "undefined",
        actionId: row?.actionId ?? undefined,
      });
      continue;
    }

    const instance = ACTIONS[row.actionId].build(row?.options ?? {});
    if (!instance) {
      log.warn("dropping binding: options failed schema", {
        bindingId: row.id,
        actionId: row.actionId,
      });
      continue;
    }

    let triggers: Trigger[] | undefined;
    try {
      triggers = row.triggers?.map(parseTrigger);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      log.warn("dropping binding: unparseable trigger", {
        bindingId: row.id,
        actionId: row.actionId,
        reason: message,
      });
      continue;
    }

    const candidate = {
      id: row.id,
      scope: row.scope,
      triggers,
      actionId: row.actionId,
      options: instance.option,
      enabled: row.enabled,
    };
    if (!isBinding(candidate)) {
      log.warn("dropping binding: unknown scope", {
        bindingId: row.id,
        scope: row.scope,
      });
      continue;
    }
    valid.push(candidate);
  }

  if (valid.length !== stored.length) {
    await bindingsItem.setValue(valid);
  }

  return valid;
}
