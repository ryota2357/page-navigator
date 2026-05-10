<script lang="ts">
  import { getAction, listActions } from "../../../lib/actions/registry";
  import type { Binding, Scope } from "../../../lib/types";
  import OptionsForm from "./OptionsForm.svelte";
  import TriggerInput from "./TriggerInput.svelte";

  type Props = {
    binding: Binding;
    onUpdate: (b: Binding) => void;
    onDelete: () => void;
  };

  const { binding, onUpdate, onDelete }: Props = $props();

  // Filter the registry to actions valid for this binding's scope.
  // Step 4 has Global only, but the structure works once site:* arrives.
  const candidateActions = $derived.by(() => {
    const all = listActions();
    return all.filter((a) => isCompatibleScope(a.scope, binding.scope));
  });

  const action = $derived(getAction(binding.actionId));

  function isCompatibleScope(actionScope: Scope, bindingScope: Scope): boolean {
    return actionScope === bindingScope;
  }

  function onActionChange(newId: string) {
    const next = getAction(newId);
    if (!next) return;
    // Reset options to the new action's defaults — different actions have
    // different options shapes, so carrying values over would just produce
    // invalid bindings the loader would have to repair on the next read.
    onUpdate({
      ...binding,
      actionId: newId,
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
    <select
      value={binding.actionId}
      onchange={(e) => onActionChange((e.currentTarget as HTMLSelectElement).value)}
    >
      {#each candidateActions as a (a.id)}
        <option value={a.id}>{a.label}</option>
      {/each}
    </select>
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

  select {
    width: 100%;
    border: 1px solid #d8d3c8;
    border-radius: 4px;
    padding: 4px 6px;
    font: inherit;
    background: #fff;
  }
  select:focus {
    outline: 1px solid #1a1815;
    border-color: #1a1815;
  }

  .row-actions {
    display: flex;
    gap: 4px;
    justify-content: flex-end;
  }
  button {
    border: 1px solid #d8d3c8;
    background: #fff;
    border-radius: 4px;
    padding: 3px 6px;
    cursor: pointer;
    font-size: 11px;
  }
  button:hover {
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
