<script lang="ts">
  import { MessageSquareWarning } from "@lucide/svelte/icons";
  import IconButton from "@/lib/ui/IconButton.svelte";
  import GitHubMark from "./GitHubMark.svelte";

  interface Props {
    // Resolved light/dark so the GitHub mark can pick its black/white variant.
    theme: "light" | "dark";
  }

  let { theme }: Props = $props();

  const REPO_URL = "https://github.com/ryota2357/page-navigator";
  const ISSUES_URL = `${REPO_URL}/issues`;
  const version = browser.runtime.getManifest().version;

  const openTab = (url: string) => browser.tabs.create({ url });
</script>

<footer class="footer">
  <span class="version">v{version}</span>
  <div class="links">
    <IconButton title="GitHub" onclick={() => openTab(REPO_URL)}>
      <GitHubMark {theme} />
    </IconButton>
    <IconButton title="Send feedback" onclick={() => openTab(ISSUES_URL)}>
      <MessageSquareWarning size={15} strokeWidth={1.9} />
    </IconButton>
  </div>
</footer>

<style>
  .footer {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 10px 9px 12px;
    border-top: 1px solid var(--border);
  }
  .version {
    /* flex-grow pushes the links to the trailing edge. */
    flex: 1;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-4);
  }
  .links {
    display: flex;
    align-items: center;
    gap: 2px;
  }
</style>
