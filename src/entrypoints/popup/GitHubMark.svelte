<script lang="ts">
  // GitHub's brand guidelines require the official Invertocat mark used
  // unmodified, so ship both supplied variants and pick by theme instead of
  // recoloring a single file.
  import markBlack from "@/assets/GitHub_Invertocat_Black.svg";
  import markWhite from "@/assets/GitHub_Invertocat_White.svg";

  interface Props {
    theme: "light" | "dark";
    size?: number;
  }

  let { theme, size = 15 }: Props = $props();
</script>

<img
  class="mark"
  src={theme === "dark" ? markWhite : markBlack}
  alt="GitHub"
  width={size}
  height={size}
>

<style>
  .mark {
    display: block;
  }
</style>
