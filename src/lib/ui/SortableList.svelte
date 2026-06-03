<script lang="ts" generics="T extends { id: string }">
  import Sortable, { type SortableEvent } from "sortablejs";
  import type { Snippet } from "svelte";

  interface Props {
    items: T[];
    onReorder: (next: T[]) => void;
    handle?: string;
    tag?: keyof HTMLElementTagNameMap;
    class?: string;
    item: Snippet<[T, number]>;
  }

  let {
    items,
    onReorder,
    handle,
    tag = "div",
    class: className,
    item,
  }: Props = $props();

  let host: HTMLElement | undefined = $state();

  // Sortable.js mutates DOM directly; after a drop we read the children's
  // `data-id` back to produce the reordered list. The parent reassigns its
  // $state and Svelte reconciles in place — Sortable's listeners survive.
  $effect(() => {
    const el = host;
    if (!el) return;
    const instance = Sortable.create(el, {
      animation: 150,
      handle,
      // forceFallback avoids the native drag preview fighting Svelte's proxy.
      forceFallback: true,
      fallbackClass: "sortable-drag",
      ghostClass: "sortable-ghost",
      chosenClass: "sortable-chosen",
      onEnd(event: SortableEvent) {
        if (event.oldIndex === event.newIndex) return;
        const ids = Array.from(el.children)
          .map((child) => (child as HTMLElement).dataset.id)
          .filter((id) => id !== undefined);
        const byId = new Map(items.map((it) => [it.id, it]));
        const next = ids
          .map((id) => byId.get(id))
          .filter((it) => it !== undefined);
        onReorder(next);
      },
    });
    return () => instance.destroy();
  });
</script>

<svelte:element this={tag} bind:this={host} class={className}>
  {#each items as it, i (it.id)}
    <div class="sortable-item" data-id={it.id}>
      {@render item(it, i)}
    </div>
  {/each}
</svelte:element>

<style>
  :global(.sortable-ghost) {
    opacity: 0.35;
  }
  :global(.sortable-chosen) {
    cursor: grabbing;
  }
  :global(.sortable-drag) {
    box-shadow: var(--shadow-pop);
  }
</style>
