<script lang="ts">
  import type { OptionSchema } from "@/lib/action";

  interface Props {
    optionSchema: Record<string, OptionSchema>;
    defaults: Record<string, unknown>;
    values: Record<string, unknown>;
    onChange: (next: Record<string, unknown>) => void;
  }

  let { optionSchema, defaults, values, onChange }: Props = $props();

  // Show the default when no explicit value is set so the row matches what
  // the loader will fill in on the next read.
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
      <div class="row" title={f.schema.label}>
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
            <button
              type="button"
              class="toggle"
              data-on={String(f.value === true)}
              onclick={() => setField(f.key, !(f.value === true))}
              aria-label={f.schema.label}
            >
              <i></i>
            </button>
            <span class="bool-label"
              >{f.value === true ? "true" : "false"}</span
            >
          </div>
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
  .toggle {
    appearance: none;
    width: 28px;
    height: 16px;
    border-radius: 999px;
    background: var(--border-strong);
    border: 0;
    padding: 0;
    position: relative;
    cursor: default;
    transition: background 0.15s;
  }
  .toggle[data-on="true"] {
    background: var(--accent);
  }
  .toggle i {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    transition: transform 0.15s;
  }
  .toggle[data-on="true"] i {
    transform: translateX(12px);
  }
</style>
