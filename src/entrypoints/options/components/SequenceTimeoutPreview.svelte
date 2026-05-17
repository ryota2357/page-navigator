<script lang="ts">
  import {
    encodeKeyToken,
    isImeComposing,
    isModifierKey,
    type KeyToken,
  } from "@/lib/keys";
  import { displayKeyToken } from "../triggerFormat";

  interface Props {
    timeoutMs: number;
  }

  let { timeoutMs }: Props = $props();

  type Stroke = { token: KeyToken; at: number };
  let strokes = $state<Stroke[]>([]);
  let armedAt = $state<number | null>(null);
  let progress = $state(0);
  let expired = $state(false);
  let focused = $state(false);

  // Animation loop runs only while a wait window is active. Re-creates when
  // timeoutMs or armedAt changes so a slider tweak takes effect immediately.
  $effect(() => {
    if (armedAt === null) {
      progress = 0;
      return;
    }
    const startedAt = armedAt;
    const windowMs = timeoutMs;
    let raf = 0;
    let stopped = false;
    const tick = () => {
      if (stopped) return;
      const elapsed = performance.now() - startedAt;
      const p = Math.max(0, 1 - elapsed / windowMs);
      progress = p;
      if (p <= 0) {
        armedAt = null;
        expired = true;
        // Two timers: the flash clears after ~1.2s, then we wipe the captured
        // strokes so the next focus starts clean. Split so the user briefly
        // sees the strokes that triggered the timeout.
        setTimeout(() => {
          expired = false;
        }, 1200);
        setTimeout(() => {
          strokes = [];
        }, 1400);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      if (raf) cancelAnimationFrame(raf);
    };
  });

  function onKeydown(e: KeyboardEvent) {
    if (isImeComposing(e) || isModifierKey(e)) return;
    // Let Tab move focus normally so the user can leave the box without
    // having to click away. Everything else gets eaten so the page doesn't
    // scroll or trigger other shortcuts while the preview is focused.
    if (e.key === "Tab") return;
    e.preventDefault();
    e.stopPropagation();
    expired = false;
    const now = performance.now();
    strokes = [...strokes, { token: encodeKeyToken(e), at: now }];
    armedAt = now;
  }

  const remainingMs = $derived(Math.max(0, Math.round(timeoutMs * progress)));
</script>

<!-- role="application" tells AT to forward keypresses verbatim instead of
     treating the box as plain text. Necessary because the widget exists
     specifically to listen to raw key events. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  tabindex="0"
  role="application"
  aria-label="Sequence timeout preview"
  class="box"
  class:focused
  class:expired
  onfocus={() => {
    focused = true;
  }}
  onblur={() => {
    focused = false;
  }}
  onkeydown={onKeydown}
>
  {#if strokes.length === 0 && !expired}
    <div class="placeholder">
      {#if focused}
        <span class="dot"></span>
        Press keys to test the timeout…
      {:else}
        Click here, then press keys to see how the sequence window behaves.
      {/if}
    </div>
  {/if}

  {#if expired && strokes.length === 0}
    <div class="expired-label">Timeout</div>
  {/if}

  {#if strokes.length > 0}
    <div class="timeline">
      {#each strokes as stroke, i (i)}
        <span class="token">{displayKeyToken(stroke.token)}</span>
        {#if strokes[i + 1]}
          {@const gapMs = Math.round(strokes[i + 1].at - stroke.at)}
          <span class="gap" title={`${gapMs} ms`}>
            <span class="gap-line"></span>
            <span class="gap-num">{gapMs} ms</span>
          </span>
        {/if}
      {/each}
      {#if armedAt !== null}
        <span class="waiting">
          <span class="bar">
            <span class="bar-fill" style="transform: scaleX({progress})"></span>
          </span>
          <span class="bar-num">{remainingMs} ms</span>
        </span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .box {
    min-height: 64px;
    padding: 12px 14px;
    background: var(--canvas);
    border: 1px dashed var(--border-strong);
    border-radius: var(--r-sm);
    outline: 0;
    display: flex;
    align-items: center;
    transition:
      border-color 0.15s,
      background 0.15s;
  }
  .box.focused {
    border-color: var(--accent);
    border-style: solid;
    background: var(--surface);
  }
  .box.expired {
    border-color: var(--warn-bd);
    background: var(--warn-bg);
  }
  .placeholder {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--text-3);
    font-size: 12px;
  }
  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent);
    animation: pulse 1.2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.35;
      transform: scale(0.7);
    }
  }
  .expired-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--warn);
    font-size: 12px;
    font-weight: 500;
  }
  .timeline {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .token {
    display: inline-flex;
    align-items: center;
    padding: 4px 8px;
    height: 26px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-bottom-width: 2px;
    border-radius: 5px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-1);
  }
  .gap {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .gap-line {
    width: 20px;
    height: 1px;
    background: repeating-linear-gradient(
      to right,
      var(--text-4) 0 3px,
      transparent 3px 6px
    );
  }
  .gap-num {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-3);
    font-variant-numeric: tabular-nums;
  }
  .waiting {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-left: 4px;
  }
  .bar {
    width: 100px;
    height: 3px;
    background: var(--subtle);
    border-radius: 999px;
    overflow: hidden;
    position: relative;
  }
  .bar-fill {
    position: absolute;
    inset: 0;
    background: var(--accent);
    transform-origin: left center;
    border-radius: 999px;
  }
  .bar-num {
    font-family: var(--font-mono);
    font-size: 10.5px;
    color: var(--text-2);
    font-variant-numeric: tabular-nums;
    min-width: 46px;
  }
</style>
