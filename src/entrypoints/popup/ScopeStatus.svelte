<script lang="ts">
  import { Globe } from "@lucide/svelte/icons";

  interface Props {
    // null = the page matches no site scope, so only Global applies.
    site: { label: string; favIconUrl: string | undefined } | null;
    enabled: boolean;
  }

  let { site, enabled }: Props = $props();

  let favBroken = $state(false);
</script>

<div class="scope" style:opacity={enabled ? 1 : 0.45}>
  {#if site}
    <div class="row">
      {#if site.favIconUrl && !favBroken}
        <img
          class="favicon"
          src={site.favIconUrl}
          alt=""
          onerror={() => {
            favBroken = true;
          }}
        >
      {:else}
        <span class="glyph favicon-fallback">
          <Globe size={18} strokeWidth={1.9} />
        </span>
      {/if}
      <div class="text">
        <div class="name">{site.label}</div>
        <div class="sub">Active on this site</div>
      </div>
      <span class="tag">Active</span>
    </div>
    <div class="baseline">
      <span class="glyph"><Globe size={13} strokeWidth={2} /></span>
      <span class="baseline-label">Global</span>
      <span class="baseline-note">always on</span>
    </div>
  {:else}
    <div class="row">
      <span class="glyph favicon-fallback">
        <Globe size={18} strokeWidth={1.9} />
      </span>
      <div class="text">
        <div class="name">Global</div>
        <div class="sub">Active on every page</div>
      </div>
      <span class="tag">Active</span>
    </div>
    <div class="baseline">
      <span class="baseline-label">No site added for this page</span>
    </div>
  {/if}
</div>

<style>
  .scope {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 13px 14px 15px;
    transition: opacity 0.16s;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .text {
    flex: 1;
    min-width: 0;
  }
  .favicon {
    width: 22px;
    height: 22px;
    border-radius: 4px;
    object-fit: cover;
    flex-shrink: 0;
  }
  .glyph {
    color: var(--text-2);
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }
  /* Glyph standing in for a 22px favicon (Global scope / missing favicon). */
  .favicon-fallback {
    width: 22px;
    height: 22px;
  }
  .name {
    font-size: 14px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sub {
    font-size: 10.5px;
    color: var(--text-3);
  }
  .tag {
    font-family: var(--font-mono);
    font-size: 8.5px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ok);
    background: var(--ok-bg);
    border: 1px solid var(--ok-bd);
    padding: 2px 6px;
    border-radius: 999px;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .baseline {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 11px;
    color: var(--text-3);
  }
  .baseline .glyph {
    color: var(--text-3);
  }
  .baseline-label {
    flex: 1;
  }
  .baseline-note {
    color: var(--text-4);
  }
</style>
