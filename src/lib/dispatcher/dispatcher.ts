import type { KeyToken } from "../keys/types";
import { log } from "../log";
import { ACTIONS } from "../scopes";
import type { Binding } from "../storage/bindings";
import { compileTrie, type Leaf, type TrieNode } from "./trie";

// Outcome of feeding one normalized KeyToken to the dispatcher.
//   "fired"    — leaf reached and the action ran (or a conflict was logged).
//   "consumed" — partial-prefix match; awaiting more keys.
//   "passed"   — no match at the current state; pass through to the page.
//
// The content-script entry point uses this to decide whether to call
// `event.preventDefault()`. The dispatcher consumes intermediate keys of a
// sequence — once a sequence has started, subsequent keys are ours until we
// fire or abort.
export type FeedResult = "fired" | "consumed" | "passed";

type TimerHandle = ReturnType<typeof setTimeout>;

export class Dispatcher {
  private trie: TrieNode = {};
  private cursor: TrieNode | null = null;
  private timer: TimerHandle | null = null;
  private timeoutMs: number;

  constructor(initialTimeoutMs: number) {
    this.timeoutMs = initialTimeoutMs;
  }

  rebuild(bindings: ReadonlyArray<Binding>): void {
    // Mid-sequence rebuild: drop any in-flight cursor — the new trie may not
    // contain the path the user was walking.
    this.resetCursor();
    this.trie = compileTrie(bindings);
  }

  setTimeout(ms: number): void {
    this.timeoutMs = ms;
  }

  feed(token: KeyToken): FeedResult {
    const current = this.cursor ?? this.trie;
    const next = current.children?.get(token);

    if (!next) {
      // No child at the cursor — abort the sequence (if any) and pass the key
      // through. Mid-sequence: previous keys were already swallowed, this
      // trailing key is the user's "abort" key. At root: unbound first key.
      this.resetCursor();
      return "passed";
    }

    const hasLeaf = next.leaf !== undefined;
    const hasChildren = (next.children?.size ?? 0) > 0;

    if (hasLeaf && !hasChildren && next.leaf) {
      this.fire(next.leaf);
      this.resetCursor();
      return "fired";
    }

    // Pure-prefix node (children only) or ambiguous (leaf+children) — walk
    // in and start the disambiguation timer.
    this.cursor = next;
    this.scheduleTimeout();
    return "consumed";
  }

  isMidSequence(): boolean {
    return this.cursor !== null;
  }

  cancel(): void {
    this.resetCursor();
  }

  private scheduleTimeout(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      // Timeout while at a leaf+children node fires the leaf.
      const leaf = this.cursor?.leaf;
      if (leaf) this.fire(leaf);
      this.resetCursor();
    }, this.timeoutMs);
  }

  private resetCursor(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.cursor = null;
  }

  private fire(leaf: Leaf): void {
    if (leaf.conflicted) {
      log.warn("conflict — not firing", { bindingIds: leaf.bindingIds });
      return;
    }
    const action = ACTIONS[leaf.actionId];
    try {
      const ret = action.invoke(
        { bindingId: leaf.bindingId, scope: leaf.scope },
        leaf.options,
      );
      if (ret instanceof Promise) {
        ret.catch((e) => {
          log.error("action threw", {
            bindingId: leaf.bindingId,
            actionId: leaf.actionId,
            error: String(e),
          });
        });
      }
    } catch (e) {
      log.error("action threw", {
        bindingId: leaf.bindingId,
        actionId: leaf.actionId,
        error: String(e),
      });
    }
  }
}
