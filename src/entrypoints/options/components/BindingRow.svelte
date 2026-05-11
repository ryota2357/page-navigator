<script lang="ts">
  import { getAction } from "../../../lib/actions/registry";
  import type { Action, Binding } from "../../../lib/types";
  import ActionPickerModal from "./ActionPickerModal.svelte";
  import OptionsForm from "./OptionsForm.svelte";
  import TriggerInput from "./TriggerInput.svelte";

  type Props = {
    binding: Binding;
    onUpdate: (b: Binding) => void;
    onDelete: () => void;
  };

  const { binding, onUpdate, onDelete }: Props = $props();

  const action = $derived(getAction(binding.actionId));

  let pickerOpen = $state(false);

  function pickAction(next: Action<unknown>) {
    pickerOpen = false;
    if (next.id === binding.actionId) return;
    // Reset options to the new action's defaults — different actions have
    // different options shapes, so carrying values over would just produce
    // invalid bindings the loader would have to repair on the next read.
    onUpdate({
      ...binding,
      actionId: next.id,
      options: structuredClone(next.options.defaults) as Record<
        string,
        unknown
      >,
    });
  }

  function onTriggersChange(triggers: string[][]) {
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
      <span class="action-label">{action?.label ?? "Pick an action…"}</span>
      <span class="chev">▾</span>
    </button>
  </div>

  <div class="cell options">
    {#if action}
      <OptionsForm
        meta={action.options.meta}
        defaults={action.options.defaults}
        values={binding.options}
        onChange={onOptionsChange}
      />
    {/if}
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
  .action-label {
    font-size: 12px;
    color: #1a1815;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
