<script lang="ts">
  import type { OptionSchema } from "@/lib/action";

  interface Props {
    optionSchema: Record<string, OptionSchema>;
    defaults: Record<string, unknown>;
    values: Record<string, unknown>;
  }

  let { optionSchema, defaults, values }: Props = $props();

  const keys = $derived(Object.keys(optionSchema));
</script>

{#if keys.length === 0}
  <span class="empty">—</span>
{:else}
  {#each keys as key (key)}
    {@const value = key in values ? values[key] : defaults[key]}
    <span class="pill">
      <span class="k">{key}</span>
      <span class="v">{String(value)}</span>
    </span>
  {/each}
{/if}

<style>
  .empty {
    color: var(--text-3);
    font-family: var(--font-mono);
    font-size: 11px;
  }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-2);
    padding: 1px 0;
    line-height: 1.5;
  }
  .k {
    color: var(--text-3);
  }
  .v {
    color: var(--text-1);
    font-weight: 500;
  }
</style>
