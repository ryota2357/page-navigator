<script lang="ts">
  import type { OptionSchema } from "@/lib/action";
  import Toggle from "../ui/Toggle.svelte";

  interface Props {
    optionSchema: Record<string, OptionSchema>;
    defaults: Record<string, unknown>;
    values: Record<string, unknown>;
    onChange: (next: Record<string, unknown>) => void;
  }

  let { optionSchema, defaults, values, onChange }: Props = $props();

  // Fall back to the default when no explicit value is set so the row
  // matches what the loader fills in on the next read.
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
    if (!Number.isFinite(n)) return;
    setField(key, n);
  }
</script>

{#if fields.length === 0}
  <span class="empty">no options</span>
{:else}
  <div class="form">
    {#each fields as f (f.key)}
      <div class="row" title={f.key}>
        <span class="key">{f.key}</span>
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
          <div class="bool">
            <Toggle
              pressed={f.value === true}
              ariaLabel={f.key}
              onChange={(next) => setField(f.key, next)}
            />
            <span class="bool-label">
              {f.value === true ? "true" : "false"}
            </span>
          </div>
        {:else if f.schema.kind === "select"}
          <select
            value={typeof f.value === "string" ? f.value : ""}
            onchange={(e) =>
              setField(f.key, (e.currentTarget as HTMLSelectElement).value)}
          >
            {#each f.schema.options as opt (opt)}
              <option value={opt}>{opt}</option>
            {/each}
          </select>
        {/if}
      </div>
    {/each}
  </div>
{/if}

<style>
  .empty {
    color: var(--text-3);
    font-size: 11px;
    font-family: var(--font-mono);
  }
  .form {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .row {
    display: grid;
    grid-template-columns: 90px 1fr;
    gap: 8px;
    align-items: center;
    font-size: 11.5px;
  }
  .key {
    font-family: var(--font-mono);
    color: var(--text-2);
    font-size: 11px;
  }
  .bool {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  input[type="number"] {
    width: 80px;
    height: 24px;
    padding: 0 8px;
    border: 1px solid var(--border-input);
    border-radius: 4px;
    font-family: var(--font-mono);
    font-size: 11.5px;
    background: var(--canvas);
    color: var(--text-1);
  }
  input[type="number"]:focus {
    outline: 0;
    border-color: var(--text-2);
    background: var(--surface);
  }
  .bool-label {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-3);
  }
  select {
    height: 24px;
    padding: 0 24px 0 8px;
    border: 1px solid var(--border-input);
    border-radius: 4px;
    font-family: var(--font-mono);
    font-size: 11.5px;
    background: var(--canvas);
    color: var(--text-1);
    appearance: none;
  }
  select:focus {
    outline: 0;
    border-color: var(--text-2);
    background: var(--surface);
  }
</style>
