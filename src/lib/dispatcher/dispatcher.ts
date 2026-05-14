import type { KeyToken } from "../keys";
import { log } from "../log";
import type { Binding } from "../storage/bindings";
import { compileTrie, type Leaf, type TrieNode } from "./trie";

// "passed" is the only outcome where the content script lets the keystroke
// reach the page; "fired" and "consumed" both swallow it. "consumed" keeps
// the cursor mid-sequence waiting for more keys.
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
    // The new trie may not contain the path the cursor was walking.
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
      // Mid-sequence: the unmatched key acts as the user's abort signal and
      // is passed through. Earlier keys of the aborted sequence stay
      // swallowed — we can't un-preventDefault them.
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

    // Ambiguous (leaf + children): wait for either another key or the
    // disambiguation timeout to decide whether to fire the leaf.
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
    try {
      const ret = leaf.instance.invoke();
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
