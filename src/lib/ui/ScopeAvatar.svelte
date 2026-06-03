<script lang="ts">
  import { Globe } from "@lucide/svelte/icons";

  // The square site glyph: a colored monogram when the scope has a badge, a
  // globe otherwise. `sm` is the sidebar size (bare globe), `md` the page
  // header size (boxed globe).
  type Size = "sm" | "md";

  interface Props {
    badge: { initials: string; color: string } | null;
    size?: Size;
  }

  let { badge, size = "sm" }: Props = $props();
</script>

{#if badge}
  <span
    class="avatar monogram"
    data-size={size}
    style="background: {badge.color}"
  >
    {badge.initials}
  </span>
{:else}
  <span class="avatar globe" data-size={size}>
    <Globe size={size === "md" ? 16 : 13} />
  </span>
{/if}

<style>
  .avatar {
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }
  .avatar[data-size="sm"] {
    width: 16px;
    height: 16px;
    border-radius: 4px;
  }
  .avatar[data-size="md"] {
    width: 32px;
    height: 32px;
    border-radius: 7px;
  }
  .monogram {
    color: #fff;
    font-family: var(--font-mono);
    font-weight: 700;
  }
  .monogram[data-size="sm"] {
    font-size: 10px;
  }
  .monogram[data-size="md"] {
    font-size: 13px;
  }
  .globe {
    color: var(--text-2);
  }
  .globe[data-size="md"] {
    background: var(--subtle);
  }
</style>
