<script lang="ts">
  type IconName =
    | "globe"
    | "search"
    | "plus"
    | "down"
    | "book"
    | "import"
    | "export"
    | "warn"
    | "trash"
    | "check"
    | "gear"
    | "enter"
    | "grip"
    | "arrow-left"
    | "keyboard"
    | "record";

  interface Props {
    name: IconName;
    size?: number;
  }

  let { name, size = 14 }: Props = $props();
</script>

{#if name === "globe"}
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" />
    <path
      d="M2 8h12M8 2c2 1.8 3 4 3 6s-1 4.2-3 6c-2-1.8-3-4-3-6s1-4.2 3-6Z"
      stroke="currentColor"
      stroke-width="1.5"
    />
  </svg>
{:else if name === "search"}
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.5" />
    <path
      d="m10.5 10.5 3 3"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
    />
  </svg>
{:else if name === "plus"}
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M8 3v10M3 8h10"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
    />
  </svg>
{:else if name === "down"}
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="m4 6 4 4 4-4"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
{:else if name === "book"}
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M3 3h6a2 2 0 0 1 2 2v8M3 3v8a2 2 0 0 0 2 2h6M3 3a1 1 0 0 0 0 2h6"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
{:else if name === "import"}
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M8 3v7M5 7l3 3 3-3M3 11v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
{:else if name === "export"}
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M8 10V3M5 6l3-3 3 3M3 11v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
{:else if name === "warn"}
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M8 2 1.5 13.5h13L8 2Z"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linejoin="round"
    />
    <path
      d="M8 6.5v3.5M8 12v.01"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
    />
  </svg>
{:else if name === "trash"}
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M3 4.5h10M5.5 4.5V3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.5M4 4.5v8.5a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.5M7 7v4M9 7v4"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
    />
  </svg>
{:else if name === "check"}
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="m3 8.5 3 3 7-7"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
{:else if name === "gear"}
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5" />
    <path
      d="M8 2v1.6M8 12.4V14M2 8h1.6M12.4 8H14M3.8 3.8l1.1 1.1M11.1 11.1l1.1 1.1M3.8 12.2l1.1-1.1M11.1 4.9l1.1-1.1"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
    />
  </svg>
{:else if name === "enter"}
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M13 4v3a2 2 0 0 1-2 2H4M7 6 4 9l3 3"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
{:else if name === "grip"}
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
  >
    <circle cx="6" cy="4" r="1.1" />
    <circle cx="10" cy="4" r="1.1" />
    <circle cx="6" cy="8" r="1.1" />
    <circle cx="10" cy="8" r="1.1" />
    <circle cx="6" cy="12" r="1.1" />
    <circle cx="10" cy="12" r="1.1" />
  </svg>
{:else if name === "arrow-left"}
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M13 8H3M7 4 3 8l4 4"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
{:else if name === "keyboard"}
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <rect
      x="1.5"
      y="4"
      width="13"
      height="8"
      rx="1.5"
      stroke="currentColor"
      stroke-width="1.5"
    />
    <path
      d="M4 7h.01M6.5 7h.01M9 7h.01M11.5 7h.01M4 10h7"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
    />
  </svg>
{:else if name === "record"}
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="8" cy="8" r="3" fill="currentColor" />
    <circle
      cx="8"
      cy="8"
      r="6"
      stroke="currentColor"
      stroke-width="1.5"
      opacity=".4"
    />
  </svg>
{/if}
