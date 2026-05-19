import { browser } from "wxt/browser";
import { onMessage } from "./messaging";

function getSenderTab(sender: Browser.runtime.MessageSender): Browser.tabs.Tab {
  const tab = sender.tab;
  if (tab === undefined) {
    throw new Error("sender tab info missing");
  }
  return tab;
}

async function queryWindowTabs(windowId: number) {
  const tabs = await browser.tabs.query({ windowId });
  return tabs.slice().sort((a, b) => a.index - b.index);
}

export function registerBackgroundMessageHandlers(): void {
  onMessage("createTab", async ({ data, sender }) => {
    const tab = getSenderTab(sender);
    switch (data.position) {
      case "after":
        await browser.tabs.create({
          windowId: tab.windowId,
          index: tab.index + 1,
        });
        break;
      case "before":
        await browser.tabs.create({
          windowId: tab.windowId,
          index: tab.index,
        });
        break;
      default:
        data.position satisfies never;
    }
  });

  onMessage("switchTab", async ({ data, sender }) => {
    const tab = getSenderTab(sender);
    if (!tab.id) return;
    const tabs = await queryWindowTabs(tab.windowId);
    if (tabs.length === 0) throw new Error("no tabs");
    const activateTab = (tab: Browser.tabs.Tab) => {
      if (!tab.id) return;
      return browser.tabs.update(tab.id, { active: true });
    };
    switch (data.to) {
      case "next":
        if (tab.index + 1 >= tabs.length) {
          if (!data.wrap) return;
          await activateTab(tabs[0]);
        } else {
          await activateTab(tabs[tab.index + 1]);
        }
        break;
      case "previous":
        if (tab.index - 1 < 0) {
          if (!data.wrap) return;
          await activateTab(tabs[tabs.length - 1]);
        } else {
          await activateTab(tabs[tab.index - 1]);
        }
        break;
      case "first":
        await activateTab(tabs[0]);
        break;
      case "last":
        await activateTab(tabs[tabs.length - 1]);
        break;
      default:
        data.to satisfies never;
    }
  });

  onMessage("duplicateTab", async ({ sender }) => {
    const tab = getSenderTab(sender);
    if (!tab.id) return;
    await browser.tabs.duplicate(tab.id);
  });

  onMessage("closeTab", async ({ sender }) => {
    const tab = getSenderTab(sender);
    if (!tab.id) return;
    await browser.tabs.remove(tab.id);
  });

  onMessage("restoreTab", async () => {
    const recent = await browser.sessions.getRecentlyClosed({ maxResults: 1 });
    if (recent.length === 0) throw new Error("no recently closed sessions");
    await browser.sessions.restore();
  });

  onMessage("togglePinTab", async ({ sender }) => {
    const tab = getSenderTab(sender);
    if (!tab.id) return;
    await browser.tabs.update(tab.id, { pinned: !tab.pinned });
  });

  onMessage("toggleMuteTab", async ({ sender }) => {
    const tab = getSenderTab(sender);
    if (!tab.id || !tab.mutedInfo) return;
    await browser.tabs.update(tab.id, { muted: !tab.mutedInfo.muted });
  });

  onMessage("moveTab", async ({ data, sender }) => {
    const tab = getSenderTab(sender);
    if (!tab.id) return;
    const tabs = await queryWindowTabs(tab.windowId);
    const next = tab.index + data.offset;
    if (0 <= next && next < tabs.length) {
      await browser.tabs.move(tab.id, { index: next });
    }
  });

  onMessage("moveTabToNewWindow", async ({ sender }) => {
    const tab = getSenderTab(sender);
    if (!tab.id) return;
    await browser.windows.create({ tabId: tab.id });
  });

  onMessage("closeTabs", async ({ data, sender }) => {
    const tab = getSenderTab(sender);
    const tabs = await queryWindowTabs(tab.windowId);
    const includePinned = data.includePinned;
    let targetTabs: Browser.tabs.Tab[];
    switch (data.scope) {
      case "before":
        targetTabs = tabs.slice(0, tab.index);
        break;
      case "after":
        targetTabs = tabs.slice(tab.index + 1);
        break;
      case "other":
        targetTabs = tabs.filter((_, i) => i !== tab.index);
        break;
      default:
        data.scope satisfies never;
        targetTabs = [];
    }
    const removableIds = [];
    for (const t of targetTabs) {
      if (!t.id) continue;
      if (!includePinned && t.pinned) continue;
      removableIds.push(t.id);
    }
    await browser.tabs.remove(removableIds);
  });

  function clampZoomFactor(factor: number): number {
    return Math.min(5, Math.max(0.25, factor));
  }

  onMessage("setZoom", async ({ data, sender }) => {
    const tab = getSenderTab(sender);
    if (!tab.id) return;
    const factor = data.factor === 0 ? 0 : clampZoomFactor(data.factor);
    await browser.tabs.setZoom(tab.id, factor);
  });

  onMessage("adjustZoom", async ({ data, sender }) => {
    const tab = getSenderTab(sender);
    if (!tab.id) return;
    const current = await browser.tabs.getZoom(tab.id);
    await browser.tabs.setZoom(tab.id, clampZoomFactor(current + data.delta));
  });

  onMessage("openUrlInNewTab", async ({ data, sender }) => {
    const tab = getSenderTab(sender);
    await browser.tabs.create({
      url: data.url,
      active: data.active,
      windowId: tab.windowId,
      index: tab.index + 1,
    });
  });
}
