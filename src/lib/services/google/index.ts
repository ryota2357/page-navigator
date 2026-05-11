import type { Service } from "../../types";
import { googleActions } from "./actions";

// Google search results pages. The pattern intentionally accepts any TLD
// (.com / .co.jp / .de / …) so users on a local Google domain are covered.
// PLAN.md §4 Step 5 task list pinned this exact form.
export const google: Service = {
  id: "google",
  label: "Google",
  urlPattern: /^https:\/\/www\.google\..+\/search/,
};

export { googleActions };
