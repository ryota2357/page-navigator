<script lang="ts">
  import type { OptionsMeta } from "../../../lib/types";

  type Props = {
    meta: OptionsMeta<Record<string, unknown>>;
    defaults: Record<string, unknown>;
    values: Record<string, unknown>;
    onChange: (next: Record<string, unknown>) => void;
  };

  const { meta, defaults, values, onChange }: Props = $props();

  const fields = $derived(
    Object.keys(meta).map((key) => ({
      key,
      meta: meta[key],
      // Surface defaults for fields the binding hasn't filled in yet.
      // The loader will fill these in on next read; rendering them here
      // keeps the UI honest about what the action will receive.
      value: key in values ? values[key] : defaults[key],
    })),
  );

  function setField(key: string, value: unknown) {
    onChange({ ...values, [key]: value });
  }

  function setNumber(key: string, raw: string) {
    const n = Number(raw);
    if (Number.isNaN(n)) return;
    setField(key, n);
  }
</script>

{#if fields.length === 0}
  <span class="empty">—</span>
{:else}
  <div class="form">
    {#each fields as f (f.key)}
      <label class="field">
        <span class="key">{f.meta.label}</span>
        {#if f.meta.kind === "number"}
          <input
            type="number"
            value={f.value as number}
            min={f.meta.min}
            max={f.meta.max}
            step={f.meta.step ?? 1}
            onchange={(e) =>
              setNumber(f.key, (e.currentTarget as HTMLInputElement).value)}
          >
        {:else if f.meta.kind === "boolean"}
          <input
            type="checkbox"
            checked={f.value as boolean}
            onchange={(e) =>
              setField(f.key, (e.currentTarget as HTMLInputElement).checked)}
          >
        {:else if f.meta.kind === "select"}
          <select
            value={f.value as string}
            onchange={(e) =>
              setField(
                f.key,
                (e.currentTarget as HTMLSelectElement).value,
              )}
          >
            {#each f.meta.options as opt (opt)}
              <option value={opt}>{opt}</option>
            {/each}
          </select>
        {/if}
      </label>
    {/each}
  </div>
{/if}

<style>
  .empty {
    color: #b3ad9f;
    font-size: 11px;
  }
  .form {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .field {
    display: grid;
    grid-template-columns: 130px 1fr;
    align-items: center;
    gap: 8px;
    font-size: 11px;
  }
  .key {
    color: #5b554d;
  }

  input[type="number"],
  select {
    border: 1px solid #d8d3c8;
    border-radius: 4px;
    padding: 3px 6px;
    font: inherit;
    background: #fff;
    width: 100%;
    min-width: 0;
  }
  input[type="number"]:focus,
  select:focus {
    outline: 1px solid #1a1815;
    border-color: #1a1815;
  }
</style>
