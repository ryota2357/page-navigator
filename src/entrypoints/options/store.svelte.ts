import type { Action, ActionId } from "@/lib/action";
import { type ScopeId, scopeIds, scopes } from "@/lib/scopes";
import {
  type Binding,
  bindingsItem,
  newBindingId,
  reactiveStore,
  type Settings,
  settingsItem,
  type TransferConfig,
} from "@/lib/storage";
import { findConflicts } from "./conflicts";

type View = "edit" | "preferences";

// Single source of truth for the options page: the two storage items mirrored
// into runes, plus the page's own navigation state. Components import the
// singleton directly instead of threading data and callbacks through props.
class OptionsStore {
  #bindings = reactiveStore(bindingsItem);
  #settings = reactiveStore(settingsItem);

  selectedScope = $state<ScopeId>("global");
  view = $state<View>("edit");

  // Presentation-only: which site scopes show in the sidebar, in order. Not
  // persisted — reset from the configured bindings whenever they (re)load.
  siteOrder = $state<ScopeId[]>([]);

  get loaded(): boolean {
    return this.#bindings.loaded && this.#settings.loaded;
  }
  get bindings(): Binding[] {
    return this.#bindings.value;
  }
  get settings(): Settings {
    return this.#settings.value;
  }

  async init(): Promise<void> {
    await Promise.all([this.#bindings.init(), this.#settings.init()]);
    const configured = new Set(this.bindings.map((b) => b.scope));
    this.siteOrder = scopeIds.filter(
      (id) => id !== "global" && configured.has(id),
    );
  }

  bindingsFor(scope: ScopeId): Binding[] {
    return this.bindings.filter((b) => b.scope === scope);
  }

  // global + site actions, the set the runtime would accept under `scope`.
  actionsFor(scope: ScopeId): Record<ActionId, Action> {
    const list = [
      ...scopes.global.actions,
      ...(scope === "global" ? [] : scopes[scope].actions),
    ];
    return Object.fromEntries(list.map((a) => [a.id, a]));
  }

  countFor(scope: ScopeId): number {
    return this.bindingsFor(scope).length;
  }
  conflictCountFor(scope: ScopeId): number {
    return findConflicts(this.bindingsFor(scope)).size;
  }

  selectScope(scope: ScopeId): void {
    this.selectedScope = scope;
    this.view = "edit";
  }
  showPreferences(): void {
    this.view = "preferences";
  }

  addSite(id: ScopeId): void {
    if (!this.siteOrder.includes(id)) this.siteOrder = [...this.siteOrder, id];
    this.selectScope(id);
  }
  reorderSites(next: ScopeId[]): void {
    this.siteOrder = next;
  }

  // The storage layer caches and fans out changes back into `#bindings.value`,
  // so deriving each write from the live list (rather than re-reading) stays
  // current and keeps these one-liners.
  addBinding(next: Binding): Promise<void> {
    return this.#bindings.set([...this.bindings, next]);
  }
  updateBinding(next: Binding): Promise<void> {
    return this.#bindings.set(
      this.bindings.map((b) => (b.id === next.id ? next : b)),
    );
  }
  deleteBinding(id: string): Promise<void> {
    return this.#bindings.set(this.bindings.filter((b) => b.id !== id));
  }
  // `next` is the reordered list for one scope; other scopes are untouched.
  reorderScope(scope: ScopeId, next: Binding[]): Promise<void> {
    const others = this.bindings.filter((b) => b.scope !== scope);
    return this.#bindings.set([...others, ...next]);
  }

  updateSettings(patch: Partial<Settings>): Promise<void> {
    return this.#settings.set({ ...this.settings, ...patch });
  }

  // Replace-import: only the chosen scopes are overwritten with the file's
  // bindings (re-keyed with fresh ids); unchosen scopes keep their current
  // bindings. `enabled` is never in the file, so it survives a settings import.
  async importConfig(
    config: TransferConfig,
    replaceScopes: Set<ScopeId>,
    includeSettings: boolean,
  ): Promise<void> {
    const kept = this.bindings.filter((b) => !replaceScopes.has(b.scope));
    const incoming: Binding[] = config.bindings
      .filter((b) => replaceScopes.has(b.scope))
      .map((b) => ({ ...b, id: newBindingId() }));
    await this.#bindings.set([...kept, ...incoming]);
    if (includeSettings) {
      await this.#settings.set({ ...this.settings, ...config.settings });
    }
    // Re-derive the sidebar from the new binding set, as init() does.
    const configured = new Set(this.bindings.map((b) => b.scope));
    this.siteOrder = scopeIds.filter(
      (id) => id !== "global" && configured.has(id),
    );
  }
}

export const store = new OptionsStore();
