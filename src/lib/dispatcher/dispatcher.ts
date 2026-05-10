import { getAction } from "../actions/registry";
import { log } from "../log";
import type { Binding, KeyToken } from "../types";
import { compileTrie, type Leaf, type TrieNode } from "./trie";

// Outcome of feeding one normalized KeyToken to the dispatcher.
//   "fired"    — leaf reached and the action ran (or a conflict was logged).
//   "consumed" — partial-prefix match; awaiting more keys.
//   "passed"   — no match at the current state; pass through to the page.
//
// The content-script entry point uses this to decide whether to call
// `event.preventDefault()`. Per docs/dev/step-02-data-model.md §10 S8 the
// dispatcher consumes intermediate keys of a sequence (option (b)) — once a
// sequence has started, subsequent keys are ours until we fire or abort.
export type FeedResult = "fired" | "consumed" | "passed";

type TimerHandle = ReturnType<typeof setTimeout>;

export class Dispatcher {
  private trie: TrieNode = {};
  private cursor: TrieNode | null = null; // null = at root, awaiting first key
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

    // Walked into next. Decide based on what's at this node.
    const hasLeaf = next.leaf !== undefined;
    const hasChildren = (next.children?.size ?? 0) > 0;

    if (hasLeaf && !hasChildren) {
      // Unambiguous leaf — fire now.
      this.fire(next.leaf as Leaf);
      this.resetCursor();
      return "fired";
    }

    // Either pure-prefix node (children only) or ambiguous (leaf+children).
    // Walk into it and start/restart the disambiguation timer.
    this.cursor = next;
    this.scheduleTimeout();
    return "consumed";
  }

  // For tests: peek at internal state.
  isMidSequence(): boolean {
    return this.cursor !== null;
  }

  // For tests / shutdown: cancel any pending timer.
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
      // Log + don't fire (docs/dev/step-02-data-model.md §4.3).
      log.warn("conflict — not firing", { bindingIds: leaf.bindingIds });
      return;
    }
    const action = getAction(leaf.actionId);
    if (!action) {
      log.warn("missing action at fire time", {
        bindingId: leaf.bindingId,
        actionId: leaf.actionId,
      });
      return;
    }
    try {
      const ret = action.run(
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
