<script lang="ts">
  import {
    SEQUENCE_TIMEOUT_MAX_MS,
    SEQUENCE_TIMEOUT_MIN_MS,
    type Settings,
  } from "@/lib/storage/settings";

  type Props = {
    settings: Settings;
    onChange: (patch: Partial<Settings>) => void;
  };

  const { settings, onChange }: Props = $props();

  function onTimeoutChange(raw: string) {
    const n = Number(raw);
    if (Number.isNaN(n)) return;
    onChange({ sequenceTimeoutMs: n });
  }
</script>

<section class="settings">
  <h2>Settings</h2>
  <div class="form">
    <label>
      <span class="key">Sequence timeout (ms)</span>
      <input
        type="number"
        min={SEQUENCE_TIMEOUT_MIN_MS}
        max={SEQUENCE_TIMEOUT_MAX_MS}
        step="50"
        value={settings.sequenceTimeoutMs}
        onchange={(e) =>
          onTimeoutChange((e.currentTarget as HTMLInputElement).value)}
      >
    </label>
    <p class="hint">
      How long to wait for the next key in a multi-key sequence. The loader
      clamps to {SEQUENCE_TIMEOUT_MIN_MS}–{SEQUENCE_TIMEOUT_MAX_MS}
      ms.
    </p>
  </div>
</section>

<style>
  .settings {
    padding: 16px 24px 24px;
    border-top: 1px solid #e6e3dd;
  }
  h2 {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #8a857a;
    margin: 0 0 10px;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-width: 320px;
  }

  label {
    display: grid;
    grid-template-columns: 180px 1fr;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }
  .key {
    color: #5b554d;
  }

  input[type="number"] {
    border: 1px solid #d8d3c8;
    border-radius: 4px;
    padding: 4px 6px;
    font: inherit;
    background: #fff;
    width: 100%;
  }
  input[type="number"]:focus {
    outline: 1px solid #1a1815;
    border-color: #1a1815;
  }

  .hint {
    color: #8a857a;
    font-size: 11px;
    margin: 0;
  }
</style>
