import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-svelte"],
  manifest: {
    // wxt/utils/storage uses chrome.storage.local; without this the popup and
    // content script both silently fail to read/write bindings.
    permissions: ["storage"],
  },
});
