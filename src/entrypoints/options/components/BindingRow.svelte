<script lang="ts">
  import type { Action } from "@/lib/action";
  import type { Trigger } from "@/lib/keys";
  import { ACTIONS, type ValidActionId } from "@/lib/scopes/actions";
  import type { Binding } from "@/lib/storage/bindings";
  import { actionDisplay } from "../actionDisplay";
  import ActionPickerModal from "./ActionPickerModal.svelte";
  import OptionsForm from "./OptionsForm.svelte";
  import TriggerInput from "./TriggerInput.svelte";

  type Props = {
    binding: Binding;
    onUpdate: (b: Binding) => void;
    onDelete: () => void;
  };

  const { binding, onUpdate, onDelete }: Props = $props();

  // `binding.actionId` is a registered ValidActionId, so the lookup and the
  // display formatting always resolve.
  const action = $derived(ACTIONS[binding.actionId]);
  const display = $derived(actionDisplay(binding.actionId));

  let pickerOpen = $state(false);

  function pickAction(nextId: ValidActionId, next: Action) {
    pickerOpen = false;
    if (nextId === binding.actionId) return;
    // Reset options to the new action's defaults — different actions have
    // different options shapes, so carrying values over would just produce
    // bindings the loader drops on the next read.
    onUpdate({
      ...binding,
      actionId: nextId,
      options: structuredClone(next.defaults),
    });
  }

  function onTriggersChange(triggers: Trigger[]) {
    onUpdate({ ...binding, triggers });
  }

  function onOptionsChange(options: Record<string, unknown>) {
    onUpdate({ ...binding, options });
  }

  function onToggleEnabled() {
    onUpdate({ ...binding, enabled: !binding.enabled });
  }
</script>

<div class="row" class:disabled={!binding.enabled}>
  <div class="cell trigger">
    <TriggerInput triggers={binding.triggers} onChange={onTriggersChange} />
  </div>

  <div class="cell action">
    <button
      type="button"
      class="action-button"
      onclick={() => {
        pickerOpen = true;
      }}
      title="Change action"
    >
      <span class="action-name">{display.name}</span>
      {#if display.badgeLabel}
        <span class="badge site">{display.badgeLabel}</span>
      {/if}
      <span class="chev">▾</span>
    </button>
  </div>

  <div class="cell options">
    <OptionsForm
      optionSchema={action.optionSchema}
      defaults={action.defaults}
      values={binding.options}
      onChange={onOptionsChange}
    />
  </div>

  <div class="cell row-actions">
    <button
      type="button"
      class="toggle"
      title={binding.enabled ? "Disable" : "Enable"}
      onclick={onToggleEnabled}
    >
      {binding.enabled ? "ON" : "OFF"}
    </button>
    <button type="button" class="del" title="Delete" onclick={onDelete}>
      ×
    </button>
  </div>
</div>

{#if pickerOpen}
  <ActionPickerModal
    bindingScope={binding.scope}
    currentActionId={binding.actionId}
    onClose={() => {
      pickerOpen = false;
    }}
    onPick={pickAction}
  />
{/if}

<style>
  .row {
    display: grid;
    grid-template-columns: 220px 1fr 1fr 80px;
    gap: 12px;
    padding: 10px 12px;
    border-top: 1px solid #f0ede7;
    align-items: start;
    background: #fff;
  }
  .row:first-child {
    border-top: 0;
  }
  .row.disabled {
    opacity: 0.55;
  }

  .cell {
    min-width: 0;
  }

  button.action-button {
    width: 100%;
    border: 1px solid #d8d3c8;
    border-radius: 4px;
    padding: 4px 8px;
    font: inherit;
    background: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    text-align: left;
  }
  button.action-button:hover {
    background: #f4f2ee;
    border-color: #b3ad9f;
  }
  button.action-button:focus-visible {
    outline: 1px solid #1a1815;
    border-color: #1a1815;
  }
  .action-name {
    font-family: ui-monospace, Consolas, "Liberation Mono", monospace;
    font-size: 12px;
    color: #1a1815;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }
  .badge.site {
    display: inline-flex;
    align-items: center;
    font-size: 10px;
    color: #6b21a8;
    background: #f3ebfb;
    border: 1px solid #e1d0f3;
    padding: 1px 6px;
    border-radius: 999px;
    letter-spacing: 0.02em;
    flex-shrink: 0;
  }
  .chev {
    color: #8a857a;
    font-size: 10px;
  }

  .row-actions {
    display: flex;
    gap: 4px;
    justify-content: flex-end;
  }
  button.toggle,
  button.del {
    border: 1px solid #d8d3c8;
    background: #fff;
    border-radius: 4px;
    padding: 3px 6px;
    cursor: pointer;
    font-size: 11px;
  }
  button.toggle:hover,
  button.del:hover {
    background: #f4f2ee;
  }
  button.toggle {
    width: 36px;
    text-transform: uppercase;
    font-size: 10px;
    letter-spacing: 0.04em;
  }
  button.del {
    width: 24px;
    color: #b22;
  }
</style>
