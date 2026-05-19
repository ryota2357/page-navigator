import { defineExtensionMessaging } from "@webext-core/messaging";

export interface BackgroundProtocolMap {
  createTab(data: { position: "before" | "after" }): void;
  switchTab(data: {
    to: "next" | "previous" | "first" | "last";
    wrap: boolean;
  }): void;
  duplicateTab(): void;
  closeTab(): void;
  restoreTab(): void;
  togglePinTab(): void;
  toggleMuteTab(): void;
  moveTab(data: { offset: number }): void;
  moveTabToNewWindow(): void;
  closeTabs(data: {
    scope: "before" | "after" | "other";
    includePinned: boolean;
  }): void;
  setZoom(data: { factor: number }): void;
  adjustZoom(data: { delta: number }): void;
  openUrlInNewTab(data: { url: string; active: boolean }): void;
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<BackgroundProtocolMap>();
