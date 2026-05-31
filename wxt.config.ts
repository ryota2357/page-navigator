import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-svelte"],
  manifestVersion: 3,
  manifest: {
    permissions: ["storage", "tabs", "sessions"],
  },
  // The options page pins a manual light/dark theme by overriding `color-scheme` on
  // :root, which only flips the light-dark() tokens while the built CSS keeps them
  // native. A modern cssTarget stops the CSS minifier (lightningcss) from lowering
  // light-dark() to a prefers-color-scheme polyfill the override can't reach.
  // ref: https://caniuse.com/?search=light-dark
  vite: () => ({
    build: {
      cssTarget: ["chrome123", "edge123", "firefox120", "safari17.5"],
    },
  }),
});
