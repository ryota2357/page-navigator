<script lang="ts">
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import Plus from "@lucide/svelte/icons/plus";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import { untrack } from "svelte";
  import type { Action, ActionId } from "@/lib/action";
  import { formatTrigger, type Trigger } from "@/lib/keys";
  import type { ScopeId } from "@/lib/scopes";
  import type { Binding, BindingId } from "@/lib/storage";
  import Button from "@/lib/ui/Button.svelte";
  import KeyCap from "@/lib/ui/KeyCap.svelte";
  import ScopeTag from "@/lib/ui/ScopeTag.svelte";
  import Toggle from "@/lib/ui/Toggle.svelte";
  import { serializeTrigger } from "../conflicts";
  import { actionLabelParts } from "../display";
  import ActionPicker from "./ActionPicker.svelte";
  import OptionsForm from "./OptionsForm.svelte";
  import TriggerCapture from "./TriggerCapture.svelte";

  // The edit form for one binding. `binding === null` is a fresh draft. Mounted
  // only while editing and discarded on commit/cancel — so the draft fields can
  // seed once from `binding` here, with no effect to reset them on re-entry.
  interface Props {
    binding: Binding | null;
    actions: Record<ActionId, Action>;
    scopeId: ScopeId;
    rowId: BindingId;
    conflicts: Set<string>;
    onCommit: (next: Binding) => void;
    onCancel: () => void;
    onDelete: () => void;
  }

  let {
    binding,
    actions,
    scopeId,
    rowId,
    conflicts,
    onCommit,
    onCancel,
    onDelete,
  }: Props = $props();

  // Seed the draft once from `binding` (null = new). `untrack` makes the
  // capture-the-initial-value intent explicit — re-entering edit mounts a fresh
  // editor anyway, so the draft deliberately ignores later changes to `binding`.
  const initial: {
    triggers: Trigger[];
    actionId: ActionId | null;
    options: Record<string, unknown>;
    enabled: boolean;
  } = untrack(() =>
    binding
      ? {
          triggers: $state.snapshot(binding.triggers) as Trigger[],
          actionId: binding.actionId,
          options: $state.snapshot(binding.options),
          enabled: binding.enabled,
        }
      : { triggers: [], actionId: null, options: {}, enabled: true },
  );

  let triggers = $state<Trigger[]>(initial.triggers);
  let actionId = $state<ActionId | null>(initial.actionId);
  let options = $state<Record<string, unknown>>(initial.options);
  let enabled = $state(initial.enabled);

  let pickerOpen = $state(false);
  let captureOpen = $state(false);

  const action = $derived<Action | null>(
    actionId === null ? null : (actions[actionId] ?? null),
  );
  const label = $derived(action === null ? null : actionLabelParts(action));

  // Done is gated on a real action and at least one trigger — otherwise the
  // saved binding would be silently dropped by the loader.
  const canCommit = $derived(actionId !== null && triggers.length > 0);

  function pickAction(nextId: ActionId, next: Action) {
    pickerOpen = false;
    if (nextId === actionId) return;
    // Different actions have different option shapes; carrying values across
    // would just produce bindings the loader drops.
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
</script>

<div class="row" data-row-id={rowId}>
  <div class="cell trigger">
    {#each triggers as t, i (i)}
      <KeyCap
        removable
        tone={conflicts.has(serializeTrigger(t)) ? "conflict" : "default"}
        onRemove={() => removeTrigger(i)}
      >
        {formatTrigger(t)}
      </KeyCap>
    {/each}
    <button
      type="button"
      class="add-key"
      onclick={() => {
        captureOpen = true;
      }}
    >
      <Plus size={10} />
      add key
    </button>
  </div>

  <div class="cell action">
    <button
      type="button"
      class="action-picker"
      onclick={() => {
        pickerOpen = true;
      }}
    >
      {#if action && label}
        <span class="action-name">{label.name}</span>
        {#if label.scopeBadge}
          <ScopeTag>{label.scopeBadge}</ScopeTag>
        {/if}
      {:else}
        <span class="muted">Pick an action…</span>
      {/if}
      <span class="chev"><ChevronDown size={10} /></span>
    </button>
    {#if action}
      <span class="action-desc">{action.description}</span>
    {/if}
  </div>

  <div class="cell options">
    {#if action}
      <OptionsForm
        optionSchema={action.optionSchema}
        defaults={action.defaults}
        values={options}
        onChange={(next) => {
          options = next;
        }}
      />
    {:else}
      <span class="muted">pick an action first</span>
    {/if}
  </div>

  <div class="cell handle"></div>

  <div class="edit-actions">
    {#if binding !== null}
      <Button variant="ghost-danger" onclick={onDelete}>
        <Trash2 size={12} />
        Delete
      </Button>
    {/if}
    <span class="enable">
      <Toggle
        pressed={enabled}
        ariaLabel={enabled ? "Disable this binding" : "Enable this binding"}
        onChange={(next) => {
          enabled = next;
        }}
      />
      <span class="enable-label">{enabled ? "Enabled" : "Disabled"}</span>
    </span>
    <span class="spacer"></span>
    <Button variant="ghost" onclick={onCancel}>Cancel</Button>
    <Button variant="primary" disabled={!canCommit} onclick={commit}
      >Done</Button
    >
  </div>
</div>

{#if captureOpen}
  <TriggerCapture
    onCancel={() => {
      captureOpen = false;
    }}
    onCommit={addTrigger}
  />
{/if}

{#if pickerOpen}
  <ActionPicker
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
  /* Mirrors BindingRow's column tracks (via --row-cols) so an editing row keeps
     its cells aligned with the surrounding view rows. The outline replaces the
     border so the row "lifts" without shifting content. */
  .row {
    display: grid;
    grid-template-columns: var(--row-cols);
    gap: 14px;
    align-items: start;
    padding: 12px 16px;
    position: relative;
    background: var(--surface);
    outline: 1px solid var(--border-strong);
    outline-offset: -1px;
    border-bottom: 1px solid transparent;
    border-radius: var(--r-md);
    z-index: 2;
    box-shadow: var(--shadow-edit);
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
  /* Picker mimics the static name's box so swapping in/out of edit mode doesn't
     shift the action column. Negative margin lets the hover halo surround the
     text without changing the layout origin. */
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
