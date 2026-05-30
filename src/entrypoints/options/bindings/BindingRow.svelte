<script lang="ts">
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import GripVertical from "@lucide/svelte/icons/grip-vertical";
  import Plus from "@lucide/svelte/icons/plus";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import type { Action, ActionId } from "@/lib/action";
  import type { Trigger } from "@/lib/keys";
  import type { ScopeId } from "@/lib/scopes";
  import type { Binding } from "@/lib/storage";
  import { actionLabelParts } from "../lib/display";
  import Button from "../ui/Button.svelte";
  import KeyTag from "../ui/KeyTag.svelte";
  import Toggle from "../ui/Toggle.svelte";
  import ActionPickerModal from "./ActionPickerModal.svelte";
  import OptionsForm from "./OptionsForm.svelte";
  import OptionsSummary from "./OptionsSummary.svelte";
  import TriggerCaptureModal from "./TriggerCaptureModal.svelte";

  interface Props {
    binding: Binding | null;
    actions: Record<ActionId, Action>;
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
    actions,
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
  // incrementally. The effect re-seeds from `binding` on every entry into
  // edit mode, so Cancel just flips `editing` off and the in-flight values
  // are dropped on the next entry.
  let triggers = $state<Trigger[]>([]);
  let actionId = $state<ActionId | null>(null);
  let options = $state<Record<string, unknown>>({});
  let enabled = $state(true);

  $effect(() => {
    if (!editing) return;
    triggers = binding ? $state.snapshot(binding.triggers) : [];
    actionId = binding?.actionId ?? null;
    options = binding ? $state.snapshot(binding.options) : {};
    enabled = binding?.enabled ?? true;
  });

  let pickerOpen = $state(false);
  let captureOpen = $state(false);

  const editAction = $derived<Action | null>(
    actionId === null ? null : (actions[actionId] ?? null),
  );
  const editLabel = $derived(
    editAction === null ? null : actionLabelParts(editAction),
  );
  const viewAction = $derived<Action | null>(
    binding === null ? null : (actions[binding.actionId] ?? null),
  );
  const viewLabel = $derived(
    viewAction === null ? null : actionLabelParts(viewAction),
  );

  // Done is gated on a real action and at least one trigger — otherwise
  // the saved binding would be silently dropped by the loader.
  const canCommit = $derived(actionId !== null && triggers.length > 0);

  const disabled = $derived(binding !== null && !binding.enabled);

  function pickAction(nextId: ActionId, next: Action) {
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
      enabled,
    });
  }

  // The row acts as a button that opens edit mode. While editing, click /
  // keyboard activation is a no-op (focus and clicks belong to inner inputs)
  // but role / tab-stop stay so AT keeps a stable identity.
  function onRowClick() {
    if (!editing) onStartEdit();
  }
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
  class:disabled={disabled && !editing}
  class:conflict={isConflict && !editing}
  data-row-id={rowId}
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
        <Plus size={10} />
        add key
      </button>
    {:else if binding}
      {#if disabled}
        <span class="off-badge">OFF</span>
      {/if}
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
        {#if editAction && editLabel}
          <span class="action-name">{editLabel.name}</span>
          {#if editLabel.scopeBadge}
            <span class="badge site">{editLabel.scopeBadge}</span>
          {/if}
        {:else}
          <span class="muted">Pick an action…</span>
        {/if}
        <span class="chev"><ChevronDown size={10} /></span>
      </button>
      {#if editAction}
        <span class="action-desc">{editAction.description}</span>
      {/if}
    {:else if binding}
      <span class="action-name">
        {#if viewAction && viewLabel}
          {viewLabel.name}
          {#if viewLabel.scopeBadge}
            <span class="badge site">{viewLabel.scopeBadge}</span>
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
        <GripVertical size={14} />
      </span>
    {/if}
  </div>

  {#if editing}
    <div class="edit-actions">
      {#if binding !== null}
        <Button
          variant="ghost-danger"
          onclick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 size={12} />
          Delete
        </Button>
      {/if}
      <span class="enable">
        <Toggle
          pressed={enabled}
          ariaLabel={enabled
            ? "Disable this binding"
            : "Enable this binding"}
          onChange={(next) => {
            enabled = next;
          }}
        />
        <span class="enable-label">{enabled ? "Enabled" : "Disabled"}</span>
      </span>
      <span class="spacer"></span>
      <Button
        variant="ghost"
        onclick={(e) => {
          e.stopPropagation();
          onCancel();
        }}
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        disabled={!canCommit}
        onclick={(e) => {
          e.stopPropagation();
          commit();
        }}
      >
        Done
      </Button>
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
    {actions}
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
      minmax(0, 1.4fr)
      minmax(140px, 0.9fr)
      32px;
    gap: 14px;
    align-items: start;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    position: relative;
    background: transparent;
    cursor: default;
  }
  .row:hover:not(.editing) {
    background: var(--row-hover);
  }
  /* Editing state: the outline replaces the border so the row "lifts"
       without shifting its content. Inset the outline so cells stay on the
       same column tracks as the neighbouring rows. */
  .row.editing {
    background: var(--surface);
    outline: 1px solid var(--border-strong);
    outline-offset: -1px;
    border-bottom-color: transparent;
    border-radius: var(--r-md);
    z-index: 2;
    box-shadow: var(--shadow-edit);
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
  /* Picker mimics the static name's box so swapping in/out of edit mode
       doesn't shift the action column. Negative margin lets the hover halo
       visually surround the text without changing the layout origin. */
  .action-picker {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 6px;
    margin: -2px -6px;
    border: 0;
    background: transparent;
    border-radius: 4px;
    font: inherit;
    text-align: left;
    color: inherit;
    cursor: default;
  }
  .action-picker:hover {
    background: var(--hover);
  }
  .action-picker .chev {
    color: var(--text-3);
    display: inline-flex;
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
    font-size: 11.5px;
    color: var(--text-2);
  }

  /* Disabled state — declared after per-cell rules so its higher specificity
     is also later in source order (avoids descending-specificity warnings).
     Triggers dim alongside action/options; the OFF badge stays full-strength
     so the disabled state remains legible at a glance. */
  .row.disabled .trigger :global(.tkey),
  .row.disabled .action,
  .row.disabled .options {
    opacity: 0.55;
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
    gap: 10px;
    padding-top: 10px;
    margin-top: 8px;
    border-top: 1px dashed var(--border);
    align-items: center;
  }
  .spacer {
    flex: 1;
  }
  .enable {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--text-1);
  }
  .enable-label {
    user-select: none;
  }
</style>
