import { registerBackgroundMessageHandlers } from "@/lib/background/handlers";

export default defineBackground(() => {
  registerBackgroundMessageHandlers();
});
