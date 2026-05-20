import * as history from "./history";
import * as noop from "./noop";
import * as scroll from "./scroll";
import * as tabs from "./tabs";
import * as zoom from "./zoom";

export const globalActions = [
  noop.noopAction,
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
  tabs.createTabAction,
  tabs.nextTabAction,
  tabs.previousTabAction,
  tabs.firstTabAction,
  tabs.lastTabAction,
  tabs.duplicateTabAction,
  tabs.closeTabAction,
  tabs.restoreTabAction,
  tabs.togglePinTabAction,
  tabs.toggleMuteTabAction,
  tabs.moveTabPreviousAction,
  tabs.moveTabNextAction,
  tabs.moveTabToNewWindowAction,
  tabs.closeTabsBeforeAction,
  tabs.closeTabsAfterAction,
  tabs.closeOtherTabsAction,
  zoom.setZoomAction,
  zoom.zoomInAction,
  zoom.zoomOutAction,
  zoom.zoomResetAction,
] as const;
