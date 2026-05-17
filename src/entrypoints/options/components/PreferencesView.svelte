<script lang="ts">
  import { type Settings, settingsSchema } from "@/lib/storage";
  import Icon from "./Icon.svelte";
  import SequenceTimeoutPreview from "./SequenceTimeoutPreview.svelte";

  interface Props {
    settings: Settings;
    onChange: (patch: Partial<Settings>) => void;
  }

  let { settings, onChange }: Props = $props();

  function onTimeoutChange(raw: string) {
    const n = Number(raw);
    if (Number.isNaN(n)) return;
    onChange({ sequenceTimeoutMs: n });
  }

  // Disabled-pages is UI-only for now — kept in local state so the section
  // exercises the layout (add / list / remove) without a storage entry to
  // back it. Wire to a real Settings field when the feature lands.
  let disabledPages = $state<string[]>([]);
  let draft = $state("");

  const trimmed = $derived(draft.trim());
  const isDup = $derived(trimmed.length > 0 && disabledPages.includes(trimmed));

  function addPattern() {
    if (!trimmed || isDup) return;
    disabledPages = [...disabledPages, trimmed];
    draft = "";
  }
  function removePattern(p: string) {
    disabledPages = disabledPages.filter((x) => x !== p);
  }
</script>

<div class="prefs">
  <div class="head">
    <h1>Preferences</h1>
  </div>

  <div class="sections">
    <section>
      <div class="row">
        <div class="label">
          <div class="title">Sequence timeout</div>
          <div class="desc">
            How long to wait for the next key in a multi-key sequence (e.g.
            <code>g g</code>). Clamped to
            {settingsSchema.sequenceTimeoutMs.min}–{settingsSchema.sequenceTimeoutMs.max}
            ms.
          </div>
        </div>
        <div class="num-wrap">
          <input
            type="number"
            min={settingsSchema.sequenceTimeoutMs.min}
            max={settingsSchema.sequenceTimeoutMs.max}
            step="50"
            value={settings.sequenceTimeoutMs}
            onchange={(e) =>
              onTimeoutChange((e.currentTarget as HTMLInputElement).value)}
          >
          <span class="unit">ms</span>
        </div>
      </div>
      <SequenceTimeoutPreview timeoutMs={settings.sequenceTimeoutMs} />
    </section>

    <section>
      <div class="row">
        <div class="label">
          <div class="title">Disabled pages</div>
          <div class="desc">
            URLs matching these patterns will ignore page-navigator key presses.
            Use <code>*</code> as a wildcard. (UI preview — not wired up to
            runtime yet.)
          </div>
        </div>
      </div>
      <div class="pattern-input">
        <input
          type="text"
          spellcheck="false"
          value={draft}
          placeholder="e.g. mail.google.com/*"
          oninput={(e) => {
            draft = (e.currentTarget as HTMLInputElement).value;
          }}
          onkeydown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addPattern();
            }
          }}
        >
        <button
          type="button"
          class="add-btn"
          onclick={addPattern}
          disabled={!trimmed || isDup}
        >
          Add
        </button>
      </div>
      {#if disabledPages.length > 0}
        <ul class="pattern-rows">
          {#each disabledPages as p (p)}
            <li class="pattern-row">
              <code class="pattern-text">{p}</code>
              <button
                type="button"
                class="pattern-rm"
                aria-label={`Remove ${p}`}
                onclick={() => removePattern(p)}
              >
                <Icon name="trash" size={12} />
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  </div>
</div>

<style>
  .prefs {
    padding: 0 0 80px;
    max-width: 720px;
  }
  .head {
    padding: 24px 28px 4px;
  }
  .head h1 {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--text-1);
    margin: 0;
  }
  .sections {
    padding: 0 28px;
    display: flex;
    flex-direction: column;
  }
  section {
    padding: 20px 0;
    border-bottom: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  section:last-child {
    border-bottom: 0;
  }
  .row {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: start;
    gap: 24px;
  }
  .label {
    min-width: 0;
  }
  .title {
    font-size: 13.5px;
    font-weight: 500;
    color: var(--text-1);
  }
  .desc {
    font-size: 12px;
    line-height: 1.5;
    color: var(--text-2);
    margin-top: 3px;
  }
  code {
    font-family: var(--font-mono);
    background: var(--subtle);
    padding: 0 4px;
    border-radius: 3px;
    font-size: 11px;
  }

  .num-wrap {
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
    flex-shrink: 0;
  }
  .num-wrap input {
    width: 80px;
    height: 28px;
    padding: 0 8px;
    border: 1px solid var(--border-input);
    border-radius: var(--r-sm);
    font-family: var(--font-mono);
    font-size: 12.5px;
    background: var(--surface);
    color: var(--text-1);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .num-wrap input:focus {
    outline: 0;
    border-color: var(--text-2);
  }
  .unit {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-3);
  }

  .pattern-input {
    display: flex;
    gap: 6px;
  }
  .pattern-input input {
    flex: 1;
    height: 30px;
    padding: 0 10px;
    border: 1px solid var(--border-input);
    border-radius: var(--r-sm);
    background: var(--surface);
    font-family: var(--font-mono);
    font-size: 12.5px;
    color: var(--text-1);
    min-width: 0;
  }
  .pattern-input input:focus {
    outline: 0;
    border-color: var(--text-2);
  }
  .add-btn {
    height: 30px;
    padding: 0 14px;
    border: 1px solid var(--border);
    background: var(--surface);
    border-radius: var(--r-sm);
    font: inherit;
    font-size: 12.5px;
    color: var(--text-1);
    cursor: default;
  }
  .add-btn:hover {
    background: var(--hover);
    border-color: var(--border-strong);
  }
  .add-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .pattern-rows {
    list-style: none;
    margin: 0;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    background: var(--surface);
    overflow: hidden;
  }
  .pattern-row {
    display: flex;
    align-items: center;
    padding: 6px 10px 6px 12px;
    border-bottom: 1px solid var(--border);
  }
  .pattern-row:last-child {
    border-bottom: 0;
  }
  .pattern-row:hover {
    background: var(--canvas);
  }
  .pattern-text {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-1);
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    background: transparent;
    padding: 0;
  }
  .pattern-rm {
    appearance: none;
    border: 0;
    background: transparent;
    width: 22px;
    height: 22px;
    border-radius: 4px;
    color: var(--text-4);
    display: grid;
    place-items: center;
    cursor: default;
  }
  .pattern-rm:hover {
    background: var(--danger-bg);
    color: var(--danger);
  }
</style>
