<script lang="ts">
  import type { Action } from "@/lib/action";
  import type { Trigger } from "@/lib/keys";
  import type { ScopeId } from "@/lib/scopes";
  import { ACTIONS, type ValidActionId } from "@/lib/scopes/actions";
  import type { Binding } from "@/lib/storage";
  import { actionDisplay } from "../actionDisplay";
  import ActionPickerModal from "./ActionPickerModal.svelte";
  import Icon from "./Icon.svelte";
  import KeyTag from "./KeyTag.svelte";
  import OptionsForm from "./OptionsForm.svelte";
  import OptionsSummary from "./OptionsSummary.svelte";
  import TriggerCaptureModal from "./TriggerCaptureModal.svelte";

  interface Props {
    binding: Binding | null;
    scopeId: ScopeId;
    rowId: string;
    editing: boolean;
    isConflict: boolean;
    triggerConflicts: Set<string>;
    onStartEdit: () => void;
    onCommit: (next: Binding) => void;
    onCancel: () => void;
    onDelete: () => void;
  }

  let {
    binding,
    scopeId,
    rowId,
    editing,
    isConflict,
    triggerConflicts,
    onStartEdit,
    onCommit,
    onCancel,
    onDelete,
  }: Props = $props();

  // Each edit-mode field stands on its own so a new binding can be built
  // incrementally — every field starts unspecified. The effect re-seeds
  // from `binding` on every entry into edit mode, so Cancel just flips
  // `editing` off and the in-flight values are dropped on the next entry.
  let triggers = $state<Trigger[]>([]);
  let actionId = $state<ValidActionId | null>(null);
  let options = $state<Record<string, unknown>>({});

  $effect(() => {
    if (!editing) return;
    triggers = binding ? $state.snapshot(binding.triggers) : [];
    actionId = binding?.actionId ?? null;
    options = binding ? $state.snapshot(binding.options) : {};
  });

  let pickerOpen = $state(false);
  let captureOpen = $state(false);

  const editAction = $derived<Action | null>(
    actionId === null ? null : ACTIONS[actionId],
  );
  const editDisplay = $derived(
    actionId === null ? null : actionDisplay(actionId),
  );
  const viewAction = $derived<Action | null>(
    binding === null ? null : ACTIONS[binding.actionId],
  );
  const viewDisplay = $derived(
    binding === null ? null : actionDisplay(binding.actionId),
  );

  // Done is gated on a real action and at least one trigger — otherwise
  // the saved binding would be silently dropped by the loader.
  const canCommit = $derived(actionId !== null && triggers.length > 0);

  function pickAction(nextId: ValidActionId, next: Action) {
    pickerOpen = false;
    if (nextId === actionId) return;
    // Different actions have different option shapes; carrying values
    // across would just produce bindings the loader drops.
    actionId = nextId;
    options = structuredClone(next.defaults);
  }

  function addTrigger(trigger: Trigger) {
    captureOpen = false;
    triggers = [...triggers, trigger];
  }

  function removeTrigger(i: number) {
    triggers = triggers.filter((_, j) => j !== i);
  }

  function setOptions(next: Record<string, unknown>) {
    options = next;
  }

  function commit() {
    if (actionId === null) return;
    onCommit({
      id: binding?.id ?? rowId,
      scope: binding?.scope ?? scopeId,
      triggers,
      actionId,
      options,
      enabled: binding?.enabled ?? true,
    });
  }

  function onRowClick() {
    if (!editing) onStartEdit();
  }

  // The row acts as a button that opens edit mode. While editing, the
  // click handler is a no-op (focus and clicks belong to the inner inputs)
  // but the role / tab-stop stay so AT keeps a stable identity.
  function onRowKeydown(e: KeyboardEvent) {
    if (editing) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onStartEdit();
    }
  }
</script>

<div
  class="row"
  class:editing
  class:conflict={isConflict && !editing}
  data-id={rowId}
  role="button"
  tabindex={editing ? -1 : 0}
  onclick={onRowClick}
  onkeydown={onRowKeydown}
>
  <div class="cell trigger">
    {#if editing}
      {#each triggers as t, i (i)}
        <KeyTag
          trigger={t}
          conflict={triggerConflicts.has(t.join(" "))}
          removable
          onRemove={() => removeTrigger(i)}
        />
      {/each}
      <button
        type="button"
        class="add-key"
        onclick={(e) => {
          e.stopPropagation();
          captureOpen = true;
        }}
      >
        <Icon name="plus" size={10} />
        add key
      </button>
    {:else if binding}
      {#each binding.triggers as t, i (i)}
        <KeyTag trigger={t} conflict={triggerConflicts.has(t.join(" "))} />
      {/each}
      {#if binding.triggers.length === 0}
        <span class="muted">(no trigger)</span>
      {/if}
    {/if}
  </div>

  <div class="cell action">
    {#if editing}
      <button
        type="button"
        class="action-picker"
        onclick={(e) => {
          e.stopPropagation();
          pickerOpen = true;
        }}
      >
        {#if editAction && editDisplay}
          <span class="action-name">{editDisplay.name}</span>
          {#if editDisplay.badgeLabel}
            <span class="badge site">{editDisplay.badgeLabel}</span>
          {/if}
        {:else}
          <span class="muted">Pick an action…</span>
        {/if}
        <span class="chev"><Icon name="down" size={10} /></span>
      </button>
      {#if editAction}
        <span class="action-desc">{editAction.description}</span>
      {/if}
    {:else if binding}
      <span class="action-name">
        {#if viewAction && viewDisplay}
          {viewDisplay.name}
          {#if viewDisplay.badgeLabel}
            <span class="badge site">{viewDisplay.badgeLabel}</span>
          {/if}
        {:else}
          <span class="muted">unset</span>
        {/if}
      </span>
      {#if viewAction}
        <span class="action-desc">{viewAction.description}</span>
      {/if}
    {/if}
  </div>

  <div class="cell options">
    {#if editing}
      {#if editAction}
        <OptionsForm
          optionSchema={editAction.optionSchema}
          defaults={editAction.defaults}
          values={options}
          onChange={setOptions}
        />
      {:else}
        <span class="muted">pick an action first</span>
      {/if}
    {:else if binding && viewAction}
      <OptionsSummary
        optionSchema={viewAction.optionSchema}
        defaults={viewAction.defaults}
        values={binding.options}
      />
    {:else}
      <span class="muted">—</span>
    {/if}
  </div>

  <div class="cell handle">
    {#if !editing}
      <span
        class="grip"
        title="Drag to reorder"
        onclick={(e) => e.stopPropagation()}
        role="presentation"
      >
        <Icon name="grip" size={14} />
      </span>
    {/if}
  </div>

  {#if editing}
    <div class="edit-actions">
      {#if binding !== null}
        <button
          type="button"
          class="btn ghost danger"
          onclick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Icon name="trash" size={12} />
          Delete
        </button>
      {/if}
      <span class="spacer"></span>
      <button
        type="button"
        class="btn ghost"
        onclick={(e) => {
          e.stopPropagation();
          onCancel();
        }}
      >
        Cancel
      </button>
      <button
        type="button"
        class="btn primary"
        disabled={!canCommit}
        onclick={(e) => {
          e.stopPropagation();
          commit();
        }}
      >
        Done
      </button>
    </div>
  {/if}
</div>

{#if captureOpen}
  <TriggerCaptureModal
    onCancel={() => {
      captureOpen = false;
    }}
    onCommit={addTrigger}
  />
{/if}

{#if pickerOpen}
  <ActionPickerModal
    bindingScope={binding?.scope ?? scopeId}
    currentActionId={actionId}
    onClose={() => {
      pickerOpen = false;
    }}
    onPick={pickAction}
  />
{/if}

<style>
  .row {
    display: grid;
    grid-template-columns:
      minmax(140px, 200px)
      minmax(0, 1fr)
      minmax(170px, 1fr)
      32px;
    gap: 14px;
    align-items: start;
    padding: 12px;
    border-bottom: 1px solid var(--border);
    position: relative;
    background: transparent;
  }
  .row:hover {
    background: rgba(0, 0, 0, 0.012);
  }
  .row.editing {
    background: var(--surface);
    outline: 1px solid var(--border-strong);
    border-radius: var(--r-md);
    border-bottom-color: transparent;
    z-index: 2;
    box-shadow:
      0 1px 0 rgba(0, 0, 0, 0.02),
      0 6px 18px rgba(20, 18, 15, 0.06);
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
  }

  .trigger {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
    min-height: 24px;
  }
  .add-key {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    height: 22px;
    padding: 0 7px;
    border: 1px dashed var(--border-strong);
    border-radius: 5px;
    background: transparent;
    color: var(--text-3);
    font-family: var(--font-mono);
    font-size: 11px;
    cursor: default;
  }
  .add-key:hover {
    color: var(--text-1);
    border-color: var(--text-3);
    background: var(--surface);
  }

  .action {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .action-picker {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 4px;
    border-radius: 4px;
    margin: -2px -4px;
    cursor: default;
    border: 0;
    background: transparent;
    font: inherit;
    text-align: left;
    color: inherit;
  }
  .action-picker:hover {
    background: var(--hover);
  }
  .action-picker .chev {
    color: var(--text-3);
    margin-left: auto;
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
  .row.editing .action-desc {
    -webkit-line-clamp: unset;
    line-clamp: unset;
  }
  .badge.site {
    display: inline-flex;
    align-items: center;
    font-size: 10px;
    font-weight: 500;
    padding: 1px 6px;
    border-radius: 999px;
    background: var(--site-bg);
    color: var(--site-tag);
  }

  .options {
    display: flex;
    flex-direction: column;
    gap: 4px;
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

  .edit-actions {
    grid-column: 1 / -1;
    display: flex;
    gap: 8px;
    padding-top: 8px;
    margin-top: 4px;
    border-top: 1px dashed var(--border);
    align-items: center;
  }
  .spacer {
    flex: 1;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 30px;
    padding: 0 11px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    color: var(--text-1);
    font-size: 12.5px;
    font-family: inherit;
    cursor: default;
  }
  .btn:hover {
    background: var(--hover);
    border-color: var(--border-strong);
  }
  .btn.ghost {
    background: transparent;
    border-color: transparent;
    color: var(--text-2);
  }
  .btn.ghost:hover {
    background: var(--hover);
    color: var(--text-1);
  }
  .btn.ghost.danger {
    color: var(--danger);
  }
  .btn.ghost.danger:hover {
    background: var(--danger-bg);
  }
  .btn.primary {
    background: var(--accent);
    color: var(--accent-fg);
    border-color: var(--accent);
  }
  .btn.primary:hover {
    background: #2c2924;
  }
  .btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
</style>
