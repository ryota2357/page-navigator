import * as history from "./history";
import * as scroll from "./scroll";

export const globalScope = {
  label: "Global",
  urlPattern: null,
} as const;

export const globalActions = [
  scroll.scrollDownAction,
  scroll.scrollUpAction,
  scroll.scrollLeftAction,
  scroll.scrollRightAction,
  scroll.scrollPageDownAction,
  scroll.scrollPageUpAction,
  scroll.scrollToTopAction,
  scroll.scrollToBottomAction,
  scroll.scrollToLeftAction,
  scroll.scrollToRightAction,
  history.goHistoryBackAction,
  history.goHistoryForwardAction,
] as const;
