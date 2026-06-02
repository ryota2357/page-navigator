<script lang="ts">
  import { Pause, Power } from "@lucide/svelte/icons";

  interface Props {
    on: boolean;
    onToggle: () => void;
  }

  let { on, onToggle }: Props = $props();
</script>

<div class="status">
  <button
    type="button"
    class="power"
    class:on
    aria-pressed={on}
    aria-label={on ? "Pause" : "Resume"}
    title={on ? "Click to pause" : "Click to resume"}
    onclick={onToggle}
  >
    {#if on}
      <Power size={28} strokeWidth={2.1} />
    {:else}
      <Pause size={26} strokeWidth={2} />
    {/if}
  </button>
  <div class="label">
    <div class="title">{on ? "On" : "Paused"}</div>
    <div class="hint">
      {on ? "Active on every page" : "Tap the button to resume"}
    </div>
  </div>
</div>

<style>
  .status {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 8px 20px 18px;
  }

  /* The paused look is the resting state; `.on` layers the active green on top
     so there is no separate "off" modifier to keep in sync. */
  .power {
    appearance: none;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    cursor: pointer;
    background: var(--subtle);
    color: var(--text-3);
    border: 1px solid var(--border-strong);
    transition:
      background 0.16s,
      color 0.16s,
      border-color 0.16s,
      box-shadow 0.16s;
  }
  .power:hover {
    background: var(--hover);
    color: var(--text-2);
  }
  .power.on {
    background: var(--ok);
    color: #fff;
    border-color: var(--ok);
    box-shadow: 0 2px 12px -2px color-mix(in srgb, var(--ok) 55%, transparent);
  }
  .power.on:hover {
    background: color-mix(in srgb, var(--ok) 88%, #000);
  }

  .label {
    text-align: center;
  }
  .title {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  .hint {
    font-size: 11.5px;
    color: var(--text-3);
    margin-top: 2px;
  }
</style>
