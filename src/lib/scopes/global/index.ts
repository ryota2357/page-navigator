import { goHistoryBack, goHistoryForward } from "./history";
import {
  scrollDown,
  scrollPageDown,
  scrollPageUp,
  scrollToBottom,
  scrollToTop,
  scrollUp,
} from "./scroll";

export const globalScope = {
  label: "Global",
  urlPattern: null,
} as const;

export const globalActions = {
  scrollDown,
  scrollUp,
  scrollPageDown,
  scrollPageUp,
  scrollToTop,
  scrollToBottom,
  goHistoryBack,
  goHistoryForward,
};
