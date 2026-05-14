import type { ActionInstance } from "../action";
import type { KeyToken } from "../keys";
import { log } from "../log";
import type { ScopeId } from "../scopes";
import { ACTIONS, type ValidActionId } from "../scopes/actions";
import type { Binding } from "../storage/bindings";

type ConcreteLeaf = {
  conflicted?: false;
  bindingId: string;
  scope: ScopeId;
  actionId: ValidActionId;
  instance: ActionInstance;
};

type ConflictedLeaf = {
  conflicted: true;
  bindingIds: string[];
};

export type Leaf = ConcreteLeaf | ConflictedLeaf;

export type TrieNode = {
  leaf?: Leaf;
  children?: Map<KeyToken, TrieNode>;
};

// Same-trigger collisions within a scope produce a conflicted leaf the
// dispatcher refuses to fire. Cross-scope collisions never reach here —
// `activeBindings` shadows global with site before this is called.
//
// `enabled` and `build` filters here are safety nets; the loader is
// expected to have filtered upstream. `actionId` needs no check — `Binding`
// types it as a registered `ValidActionId`.
export function compileTrie(bindings: ReadonlyArray<Binding>): TrieNode {
  const root: TrieNode = {};

  for (const b of bindings) {
    if (!b.enabled) continue;

    const instance = ACTIONS[b.actionId].build(b.options);
    if (!instance) {
      log.warn("skipping binding: options failed validation", {
        bindingId: b.id,
        actionId: b.actionId,
      });
      continue;
    }

    for (const trigger of b.triggers) {
      if (trigger.length === 0) {
        log.warn("skipping empty trigger", { bindingId: b.id });
        continue;
      }

      let node = root;
      for (const tok of trigger) {
        node.children ??= new Map();
        let next = node.children.get(tok);
        if (!next) {
          next = {};
          node.children.set(tok, next);
        }
        node = next;
      }

      if (!node.leaf) {
        node.leaf = {
          bindingId: b.id,
          scope: b.scope,
          actionId: b.actionId,
          instance,
        };
      } else if (node.leaf.conflicted) {
        node.leaf.bindingIds.push(b.id);
      } else {
        node.leaf = {
          conflicted: true,
          bindingIds: [node.leaf.bindingId, b.id],
        };
      }
    }
  }

  return root;
}
