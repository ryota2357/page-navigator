<script lang="ts">
  import { Upload } from "@lucide/svelte/icons";
  import Button from "@/lib/ui/Button.svelte";
  import Modal from "@/lib/ui/Modal.svelte";

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();
</script>

<Modal
  ariaLabel="Export"
  title="Export settings"
  subtitle="Write all scopes to a single JSON file."
  width={560}
  {onClose}
>
  <div class="body">
    <div class="dropzone">
      <Upload size={18} />
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

  {#snippet foot({ close })}
    <span class="spacer"></span>
    <Button variant="ghost" onclick={close}>Cancel</Button>
    <Button variant="primary" disabled>
      <Upload size={12} />
      Download
    </Button>
  {/snippet}
</Modal>

<style>
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
</style>
