import type { Trigger } from "@/lib/keys";
import type { Binding } from "@/lib/storage";

// Stable string key for a Trigger; identical sequences collapse to one entry.
export function serializeTrigger(trigger: Trigger): string {
  return trigger.join(" ");
}

// Trigger-strings appearing on more than one binding within the list.
export function findConflicts(bindings: Binding[]): Set<string> {
  const owners = new Map<string, Set<string>>();
  for (const binding of bindings) {
    for (const trigger of binding.triggers) {
      const key = serializeTrigger(trigger);
      const set = owners.get(key) ?? new Set<string>();
      set.add(binding.id);
      owners.set(key, set);
    }
  }
  const conflicts = new Set<string>();
  for (const [key, ids] of owners) {
    if (ids.size > 1) conflicts.add(key);
  }
  return conflicts;
}

export function bindingHasConflict(
  binding: Binding,
  conflicts: Set<string>,
): boolean {
  return binding.triggers.some((trigger) =>
    conflicts.has(serializeTrigger(trigger)),
  );
}
