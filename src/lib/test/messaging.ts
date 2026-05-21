import { vi } from "vitest";
import { sendMessage } from "@/lib/background/messaging";

// Actions that delegate to the background script are tested by asserting the
// `sendMessage` call. Vitest hoists `vi.mock` above imports and requires the
// module path spelled out literally, so each test file still declares the
// one-liner factory itself:
//
//   vi.mock("@/lib/background/messaging", () => ({ sendMessage: vi.fn() }));
//
// then imports this typed accessor to inspect the calls.
export const sendMessageMock = vi.mocked(sendMessage);
