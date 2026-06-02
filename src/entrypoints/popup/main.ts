import { mount } from "svelte";
import App from "./App.svelte";
import "./global.css";

const app = mount(App, {
  // biome-ignore lint/style/noNonNullAssertion: #app is statically present in index.html
  target: document.getElementById("app")!,
});

export default app;
