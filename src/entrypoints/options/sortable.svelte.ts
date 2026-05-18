import Sortable, { type Options, type SortableEvent } from "sortablejs";

export type SortableActionOpts<T extends { id: string }> = {
  items: T[];
  onReorder: (next: T[]) => void;
  handle?: string;
  group?: string;
};

// Sortable.js mutates the DOM directly; to stay coherent with Svelte 5's
// keyed {#each}, we read the post-drop child order off `data-id` and hand
// back a reordered array. The parent then reassigns its $state and Svelte
// reconciles without re-creating nodes — so Sortable's listeners survive.
//
// Each child of `node` MUST carry `data-id={item.id}`, and the {#each}
// block MUST be keyed on the same id.
export function sortable<T extends { id: string }>(
  node: HTMLElement,
  opts: SortableActionOpts<T>,
) {
  let current = opts;

  function readOrder(): T[] {
    const ids = Array.from(node.children)
      .map((el) => (el as HTMLElement).dataset.id)
      .filter((id) => id !== undefined);
    const byId = new Map(current.items.map((item) => [item.id, item]));
    return ids.map((id) => byId.get(id)).filter((item) => item !== undefined);
  }

  const options: Options = {
    animation: 150,
    handle: opts.handle,
    group: opts.group,
    // forceFallback gives consistent cursor visuals and avoids the native
    // drag preview fighting Svelte's proxy. Worth it for every sortable here.
    forceFallback: true,
    fallbackClass: "sortable-drag",
    ghostClass: "sortable-ghost",
    chosenClass: "sortable-chosen",
    onEnd(event: SortableEvent) {
      if (event.oldIndex === event.newIndex) return;
      current.onReorder(readOrder());
    },
  };

  const instance = Sortable.create(node, options);

  return {
    update(next: SortableActionOpts<T>) {
      current = next;
    },
    destroy() {
      instance.destroy();
    },
  };
}
