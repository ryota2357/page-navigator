<script lang="ts">
  // Used both for binding enable/disable (ok-green) and option-form
  // booleans (accent). Same shape, different "on" color.
  interface Props {
    pressed: boolean;
    ariaLabel: string;
    tone?: "accent" | "ok";
    onChange: (next: boolean) => void;
  }

  let { pressed, ariaLabel, tone = "accent", onChange }: Props = $props();
</script>

<button
  type="button"
  class="toggle"
  class:on={pressed}
  data-tone={tone}
  aria-pressed={pressed}
  aria-label={ariaLabel}
  onclick={(e) => {
    e.stopPropagation();
    onChange(!pressed);
  }}
></button>

<style>
  .toggle {
    appearance: none;
    border: 0;
    padding: 0;
    width: 28px;
    height: 16px;
    background: var(--border-strong);
    border-radius: 999px;
    position: relative;
    cursor: default;
    transition: background 0.14s;
    flex-shrink: 0;
  }
  .toggle::after {
    content: "";
    position: absolute;
    top: 2px;
    left: 2px;
    width: 12px;
    height: 12px;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.14s;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
  }
  .toggle.on[data-tone="accent"] {
    background: var(--accent);
  }
  .toggle.on[data-tone="ok"] {
    background: var(--ok);
  }
  .toggle.on::after {
    transform: translateX(12px);
  }
  .toggle:hover {
    filter: brightness(0.94);
  }
</style>
