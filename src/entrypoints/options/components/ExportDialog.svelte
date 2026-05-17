<script lang="ts">
  import Icon from "./Icon.svelte";

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  let dialog: HTMLDialogElement | undefined = $state();

  $effect(() => {
    dialog?.showModal();
  });
</script>

<dialog
  class="modal"
  bind:this={dialog}
  aria-label="Export"
  onclose={onClose}
  onclick={(e) => {
    if (e.target === dialog) dialog.close();
  }}
>
  <header class="head">
    <div>
      <h1>Export settings</h1>
      <p class="sub">Write all scopes to a single JSON file.</p>
    </div>
    <button type="button" class="close" onclick={() => dialog?.close()}>
      ×
    </button>
  </header>

  <div class="body">
    <div class="dropzone">
      <Icon name="export" size={18} />
      <div class="file">
        <b>page-navigator-config.json</b>
        <span>All scopes · all bindings</span>
      </div>
    </div>
    <div class="note">
      Import lets you pick scopes individually, so a per-scope export is
      unnecessary here.
    </div>
  </div>

  <footer class="foot">
    <button type="button" class="btn ghost" onclick={() => dialog?.close()}>
      Cancel
    </button>
    <button type="button" class="btn primary" disabled>
      <Icon name="export" size={12} />
      Download
    </button>
  </footer>
</dialog>

<style>
  .modal {
    margin: 12vh auto auto;
    padding: 0;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    box-shadow: var(--shadow-modal);
    width: min(560px, calc(100vw - 32px));
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .modal::backdrop {
    background: rgba(20, 18, 15, 0.32);
    backdrop-filter: blur(2px);
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 16px 18px;
    border-bottom: 1px solid var(--border);
  }
  .head h1 {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 2px;
  }
  .sub {
    font-size: 12px;
    color: var(--text-2);
    margin: 0;
  }
  .close {
    border: 0;
    background: transparent;
    cursor: default;
    font-size: 18px;
    color: var(--text-3);
    line-height: 1;
    padding: 2px 6px;
    border-radius: 5px;
  }
  .close:hover {
    background: var(--hover);
    color: var(--text-1);
  }
  .body {
    padding: 14px 18px;
  }
  .dropzone {
    border: 1.5px solid var(--border-strong);
    border-radius: var(--r-md);
    padding: 14px;
    background: var(--canvas);
    font-size: 12.5px;
    color: var(--text-2);
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .file {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 1px;
  }
  .file b {
    color: var(--text-1);
    font-family: var(--font-mono);
    font-weight: 500;
    font-size: 12.5px;
  }
  .file span {
    font-size: 11.5px;
    color: var(--text-3);
  }
  .note {
    background: var(--subtle);
    padding: 10px 12px;
    border-radius: var(--r-md);
    font-size: 11.5px;
    color: var(--text-2);
    line-height: 1.5;
    margin-top: 14px;
  }
  .foot {
    padding: 12px 18px;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    background: var(--canvas);
  }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 30px;
    padding: 0 11px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    color: var(--text-1);
    font: inherit;
    font-size: 12.5px;
    cursor: default;
  }
  .btn.ghost {
    background: transparent;
    border-color: transparent;
    color: var(--text-2);
  }
  .btn.ghost:hover {
    background: var(--hover);
    color: var(--text-1);
  }
  .btn.primary {
    background: var(--accent);
    color: var(--accent-fg);
    border-color: var(--accent);
  }
  .btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
</style>
