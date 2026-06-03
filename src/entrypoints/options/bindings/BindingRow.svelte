<script lang="ts">
  import GripVertical from "@lucide/svelte/icons/grip-vertical";
  import type { Action, ActionId } from "@/lib/action";
  import { formatTrigger } from "@/lib/keys";
  import type { Binding } from "@/lib/storage";
  import { onActivate } from "@/lib/ui/a11y";
  import KeyCap from "@/lib/ui/KeyCap.svelte";
  import ScopeTag from "@/lib/ui/ScopeTag.svelte";
  import { bindingHasConflict, serializeTrigger } from "../conflicts";
  import { actionLabelParts } from "../display";
  import OptionsSummary from "./OptionsSummary.svelte";

  // Read-only display of a committed binding. Clicking (or Enter/Space) hands
  // off to the editor — this component never enters edit mode itself, which is
  // what keeps it small.
  interface Props {
    binding: Binding;
    actions: Record<ActionId, Action>;
    conflicts: Set<string>;
    onStartEdit: () => void;
  }

  let { binding, actions, conflicts, onStartEdit }: Props = $props();

  const action = $derived<Action | null>(actions[binding.actionId] ?? null);
  const label = $derived(action === null ? null : actionLabelParts(action));
  const isConflict = $derived(bindingHasConflict(binding, conflicts));
</script>

<div
  class="row"
  class:disabled={!binding.enabled}
  class:conflict={isConflict}
  data-row-id={binding.id}
  role="button"
  tabindex="0"
  onclick={onStartEdit}
  onkeydown={onActivate(onStartEdit)}
>
  <div class="cell trigger">
    {#if !binding.enabled}
      <span class="off-badge">OFF</span>
    {/if}
    {#each binding.triggers as t, i (i)}
      <KeyCap
        tone={conflicts.has(serializeTrigger(t)) ? "conflict" : "default"}
      >
        {formatTrigger(t)}
      </KeyCap>
    {/each}
    {#if binding.triggers.length === 0}
      <span class="muted">(no trigger)</span>
    {/if}
  </div>

  <div class="cell action">
    <span class="action-name">
      {#if action && label}
        {label.name}
        {#if label.scopeBadge}
          <ScopeTag>{label.scopeBadge}</ScopeTag>
        {/if}
      {:else}
        <span class="muted">unset</span>
      {/if}
    </span>
    {#if action}
      <span class="action-desc">{action.description}</span>
    {/if}
  </div>

  <div class="cell options">
    {#if action}
      <OptionsSummary
        optionSchema={action.optionSchema}
        defaults={action.defaults}
        values={binding.options}
      />
    {:else}
      <span class="muted">—</span>
    {/if}
  </div>

  <div class="cell handle">
    <span
      class="grip"
      title="Drag to reorder"
      onclick={(e) => e.stopPropagation()}
      role="presentation"
    >
      <GripVertical size={14} />
    </span>
  </div>
</div>

<style>
  /* Column tracks come from --row-cols on the surrounding list card, so the
     view row and the editor stay aligned without repeating the template. */
  .row {
    display: grid;
    grid-template-columns: var(--row-cols);
    gap: 14px;
    align-items: start;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    position: relative;
    background: transparent;
    cursor: default;
  }
  .row:hover {
    background: var(--row-hover);
  }
  .row.conflict::before {
    content: "";
    position: absolute;
    left: 0;
    top: 8px;
    bottom: 8px;
    width: 2px;
    background: var(--danger);
    border-radius: 2px;
  }
  .cell {
    min-width: 0;
    padding-top: 1px;
  }

  .trigger {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
    min-height: 24px;
  }
  .off-badge {
    display: inline-flex;
    align-items: center;
    font-size: 10px;
    font-family: var(--font-mono);
    letter-spacing: 0.06em;
    padding: 2px 7px;
    border-radius: 999px;
    background: var(--subtle);
    border: 1px solid var(--border);
    color: var(--text-3);
    text-transform: uppercase;
  }

  .action {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .action-name {
    font-family: var(--font-mono);
    font-size: 12.5px;
    color: var(--text-1);
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .action-desc {
    font-size: 11.5px;
    color: var(--text-2);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .options {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 11.5px;
    color: var(--text-2);
  }

  .muted {
    color: var(--text-3);
    font-family: var(--font-mono);
    font-size: 11px;
  }

  .handle {
    display: grid;
    place-items: center;
    height: 24px;
  }
  .grip {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    color: var(--text-4);
    cursor: grab;
    opacity: 0;
    transition:
      opacity 0.12s,
      color 0.12s;
    display: grid;
    place-items: center;
  }
  .row:hover .grip {
    opacity: 1;
  }
  .grip:hover {
    background: var(--hover);
    color: var(--text-1);
  }
  .grip:active {
    cursor: grabbing;
  }

  /* Declared last so its higher specificity is also later in source order
     (avoids descending-specificity warnings). Triggers dim alongside
     action/options; the OFF badge stays full-strength so the disabled state
     is legible at a glance. */
  .row.disabled .trigger :global(.keycap),
  .row.disabled .action,
  .row.disabled .options {
    opacity: 0.55;
  }
</style>
