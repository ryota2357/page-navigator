import { log } from "../log";
import type { Binding, KeyToken, Scope } from "../types";

export type ConcreteLeaf = {
  conflicted?: false;
  bindingId: string;
  scope: Scope;
  actionId: string;
  options: unknown;
};

export type ConflictedLeaf = {
  conflicted: true;
  bindingIds: string[];
};

export type Leaf = ConcreteLeaf | ConflictedLeaf;

export type TrieNode = {
  leaf?: Leaf;
  children?: Map<KeyToken, TrieNode>;
};

// Compile bindings to a key-token trie.
//
// Conflicts (two bindings producing a leaf at the same path) are recorded
// at the leaf and surfaced with `conflicted: true` so the dispatcher can
// log + drop instead of firing either action (docs/dev/step-02-data-model.md §4.3).
//
// `enabled === false` rows are skipped at compile time; rebuild on toggle.
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
