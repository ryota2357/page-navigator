import type { KeyToken } from "../keys/types";
import { log } from "../log";
import type { ActionId, ScopeId } from "../scopes";
import type { Binding } from "../storage/bindings";

type ConcreteLeaf = {
  conflicted?: false;
  bindingId: string;
  scope: ScopeId;
  actionId: ActionId;
  options: unknown;
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

// Two bindings in the same scope with the same trigger become a conflicted
// leaf — the dispatcher logs and drops instead of firing either. Cross-scope
// "same trigger" doesn't reach the trie because activeBindings has already
// resolved precedence (site shadows global).
//
// `enabled === false` rows are skipped here as the final safety net; the
// caller's compose pass should already have filtered them out.
export function compileTrie(bindings: ReadonlyArray<Binding>): TrieNode {
  const root: TrieNode = {};

  for (const b of bindings) {
    if (!b.enabled) continue;

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
          options: b.options,
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
