import { storage } from "wxt/utils/storage";
import type { Binding, Settings } from "../types";

// Single flat list of bindings (docs/dev/step-02-data-model.md §3.3, §5.1).
// Empty fallback — no preset bindings; user adds via the options UI.
export const bindingsItem = storage.defineItem<Binding[]>("local:bindings", {
  fallback: [],
  version: 1,
  migrations: {},
});

// Global settings (docs/dev/step-02-data-model.md §4.2).
// Sequence timeout default 1000ms; loader clamps to [100, 60000].
export const settingsItem = storage.defineItem<Settings>("local:settings", {
  fallback: { sequenceTimeoutMs: 1000 },
  version: 1,
  migrations: {},
});

// Allowed range for sequenceTimeoutMs. Centralised so loader and tests share.
export const SEQUENCE_TIMEOUT_MIN_MS = 100;
export const SEQUENCE_TIMEOUT_MAX_MS = 60_000;
