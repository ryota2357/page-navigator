import * as history from "./history";
import * as scroll from "./scroll";

export const globalScope = {
  label: "Global",
  urlPattern: null,
} as const;

export const globalActions = [
  scroll.scrollDownAction,
  scroll.scrollUpAction,
  scroll.scrollPageDownAction,
  scroll.scrollPageUpAction,
  scroll.scrollToTopAction,
  scroll.scrollToBottomAction,
  history.goHistoryBackAction,
  history.goHistoryForwardAction,
] as const;
