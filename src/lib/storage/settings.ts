import { storage } from "wxt/utils/storage";

export type Settings = {
  sequenceTimeoutMs: number;
};

// `0` or negative would mean "drop prefix immediately" → unusable; absurdly
// large values mean "trie state never resets" → mild DoS. Out-of-range values
// from poisoned storage clamp to the nearest valid value on load.
export const SEQUENCE_TIMEOUT_MIN_MS = 100;
export const SEQUENCE_TIMEOUT_MAX_MS = 60_000;
const SEQUENCE_TIMEOUT_FALLBACK_MS = 1000;

export const settingsItem = storage.defineItem<Settings>("local:settings", {
  fallback: { sequenceTimeoutMs: SEQUENCE_TIMEOUT_FALLBACK_MS },
  version: 1,
  migrations: {},
});

export async function loadSettings(): Promise<Settings> {
  const stored = await settingsItem.getValue();
  let timeout = stored.sequenceTimeoutMs;
  let changed = false;
  if (typeof timeout !== "number" || Number.isNaN(timeout)) {
    timeout = SEQUENCE_TIMEOUT_FALLBACK_MS;
    changed = true;
  } else if (timeout < SEQUENCE_TIMEOUT_MIN_MS) {
    timeout = SEQUENCE_TIMEOUT_MIN_MS;
    changed = true;
  } else if (timeout > SEQUENCE_TIMEOUT_MAX_MS) {
    timeout = SEQUENCE_TIMEOUT_MAX_MS;
    changed = true;
  }

  const repaired: Settings = { sequenceTimeoutMs: timeout };
  if (changed) await settingsItem.setValue(repaired);
  return repaired;
}
