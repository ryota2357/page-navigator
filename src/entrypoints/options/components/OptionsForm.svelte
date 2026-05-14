<script lang="ts">
  import type { OptionSchema } from "@/lib/action";

  type Props = {
    optionSchema: Record<string, OptionSchema>;
    defaults: Record<string, unknown>;
    values: Record<string, unknown>;
    onChange: (next: Record<string, unknown>) => void;
  };

  const { optionSchema, defaults, values, onChange }: Props = $props();

  // Defaults are surfaced for fields the binding hasn't filled in yet so the
  // UI shows what the action will actually receive (the loader will fill
  // these in on next read).
  const fields = $derived(
    Object.keys(optionSchema).map((key) => ({
      key,
      schema: optionSchema[key],
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
        <span class="key">{f.schema.label}</span>
        {#if f.schema.kind === "number"}
          <input
            type="number"
            value={typeof f.value === "number" ? f.value : 0}
            min={f.schema.min}
            max={f.schema.max}
            step={f.schema.step ?? 1}
            onchange={(e) =>
              setNumber(f.key, (e.currentTarget as HTMLInputElement).value)}
          >
        {:else if f.schema.kind === "boolean"}
          <input
            type="checkbox"
            checked={f.value === true}
            onchange={(e) =>
              setField(f.key, (e.currentTarget as HTMLInputElement).checked)}
          >
        {:else if f.schema.kind === "select"}
          <select
            value={typeof f.value === "string" ? f.value : ""}
            onchange={(e) =>
              setField(
                f.key,
                (e.currentTarget as HTMLSelectElement).value,
              )}
          >
            {#each f.schema.options as opt (opt)}
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
