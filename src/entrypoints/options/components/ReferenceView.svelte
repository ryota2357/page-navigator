<script lang="ts">
  import Icon from "./Icon.svelte";
</script>

<div class="ref">
  <div class="placeholder">
    <span class="icon"><Icon name="keyboard" size={28} /></span>
    <h1>Reference</h1>
    <p>
      A read-only keyboard-layout view of every binding active on the current
      page. The visual design is still under discussion, so this view is a
      placeholder for now.
    </p>
    <span class="badge">Coming soon</span>
  </div>
</div>

<style>
  .ref {
    padding: 56px 28px 80px;
    display: grid;
    place-items: center;
  }
  .placeholder {
    max-width: 480px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;
    padding: 36px 32px;
    border: 1px dashed var(--border-strong);
    border-radius: var(--r-lg);
    background: var(--surface);
  }
  .icon {
    color: var(--text-3);
  }
  h1 {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
  }
  p {
    margin: 0;
    font-size: 12.5px;
    color: var(--text-2);
    line-height: 1.55;
  }
  .badge {
    font-family: var(--font-mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    padding: 3px 10px;
    border-radius: 999px;
    background: var(--subtle);
    color: var(--text-2);
  }
</style>
