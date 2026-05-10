<script lang="ts">
  import { onMount } from "svelte";
  import { listActions } from "../../lib/actions/registry";
  import { parseTrigger } from "../../lib/keys";
  import { bindingsItem, settingsItem } from "../../lib/storage";
  import type { Binding, Settings } from "../../lib/types";

  // Throwaway dev-only UI. Step 4 will replace this with a real options page.

  const actions = listActions();

  let bindings = $state<Binding[]>([]);
  let settings = $state<Settings>({ sequenceTimeoutMs: 1000 });

  let formTrigger = $state("");
  let formActionId = $state(actions[0]?.id ?? "");
  let formError = $state("");

  onMount(async () => {
    bindings = await bindingsItem.getValue();
    settings = await settingsItem.getValue();
    bindingsItem.watch((v) => {
      bindings = v;
    });
    settingsItem.watch((v) => {
      settings = v;
    });
  });

  async function addBinding(e: SubmitEvent) {
    e.preventDefault();
    formError = "";

    const action = actions.find((a) => a.id === formActionId);
    if (!action) {
      formError = "select an action";
      return;
    }

    const tokens = formTrigger.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) {
      formError = "trigger is empty";
      return;
    }

    let canon: string[];
    try {
      canon = parseTrigger(tokens);
    } catch (err) {
      formError = `invalid: ${(err as Error).message}`;
      return;
    }

    // Read-modify-write off the live storage value, not the local state.
    // The popup's own watch callback doesn't fire reliably on its own writes,
    // so reading first avoids a stale-state overwrite on rapid successive adds.
    const current = await bindingsItem.getValue();
    const next: Binding[] = [
      ...current,
      {
        id: crypto.randomUUID(),
        scope: "global",
        triggers: [canon],
        actionId: action.id,
        options: structuredClone(action.options.defaults) as Record<
          string,
          unknown
        >,
        enabled: true,
      },
    ];
    await bindingsItem.setValue(next);
    bindings = next;
    formTrigger = "";
  }

  async function removeBinding(id: string) {
    const current = await bindingsItem.getValue();
    const next = current.filter((b) => b.id !== id);
    await bindingsItem.setValue(next);
    bindings = next;
  }

  async function toggleEnabled(id: string) {
    const current = await bindingsItem.getValue();
    const next = current.map((b) =>
      b.id === id ? { ...b, enabled: !b.enabled } : b,
    );
    await bindingsItem.setValue(next);
    bindings = next;
  }

  async function updateTimeout(value: string) {
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    await settingsItem.setValue({ sequenceTimeoutMs: n });
  }

  function showTrigger(triggers: string[][]): string {
    return triggers.map((t) => t.join(" ")).join(" / ");
  }
</script>

<main>
  <header>
    <strong>page-navigator</strong>
    <span class="dev">dev</span>
  </header>

  <section>
    <h2>Bindings ({bindings.length})</h2>
    {#if bindings.length === 0}
      <p class="empty">No bindings yet. Add one below.</p>
    {:else}
      <ul class="bindings">
        {#each bindings as b (b.id)}
          <li class:disabled={!b.enabled}>
            <code class="trigger">{showTrigger(b.triggers)}</code>
            <span class="arrow">→</span>
            <span class="action">{b.actionId}</span>
            <div class="row-actions">
              <button
                type="button"
                class="toggle"
                title={b.enabled ? "disable" : "enable"}
                onclick={() => toggleEnabled(b.id)}
              >
                {b.enabled ? "on" : "off"}
              </button>
              <button
                type="button"
                class="del"
                title="delete"
                onclick={() => removeBinding(b.id)}
              >
                ×
              </button>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section>
    <h2>Add binding</h2>
    <form onsubmit={addBinding}>
      <label>
        <span>Trigger</span>
        <input
          type="text"
          placeholder="e.g.  j   or   g g   or   <C-j>"
          bind:value={formTrigger}
        >
      </label>
      <label>
        <span>Action</span>
        <select bind:value={formActionId}>
          {#each actions as a (a.id)}
            <option value={a.id}>{a.label}</option>
          {/each}
        </select>
      </label>
      <button type="submit">Add</button>
      {#if formError}
        <p class="error">{formError}</p>
      {/if}
    </form>
    <p class="hint">
      Tokens are space-separated. Single key like <code>j</code>, sequence
      <code>g g</code>, or wrapped <code>&lt;C-j&gt;</code>. Lenient — case and
      modifier order don't matter.
    </p>
  </section>

  <section>
    <h2>Settings</h2>
    <label>
      <span>Sequence timeout (ms)</span>
      <input
        type="number"
        min="100"
        max="60000"
        step="50"
        value={settings.sequenceTimeoutMs}
        onchange={(e) => updateTimeout((e.target as HTMLInputElement).value)}
      >
    </label>
  </section>
</main>

<style>
  :global(html) {
    margin: 0;
    padding: 0;
  }
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 13px;
    color: #1a1a1a;
    background: #fafafa;
  }

  main {
    width: 360px;
    padding: 12px 14px 14px;
  }

  header {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-bottom: 8px;
  }
  header strong {
    font-size: 14px;
  }
  header .dev {
    font-size: 10px;
    color: #888;
    background: #eee;
    padding: 1px 5px;
    border-radius: 3px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  h2 {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #666;
    margin: 12px 0 6px;
  }

  section {
    border-top: 1px solid #eee;
    padding-top: 4px;
  }

  .empty {
    color: #888;
    margin: 6px 0;
    font-style: italic;
  }

  ul.bindings {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  ul.bindings li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1.2fr) auto;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
    border-bottom: 1px solid #f2f2f2;
  }
  ul.bindings li.disabled {
    opacity: 0.45;
  }
  .trigger {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px;
    background: #f1f1f1;
    padding: 1px 5px;
    border-radius: 3px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .arrow {
    color: #999;
  }
  .action {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    color: #444;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .row-actions {
    display: flex;
    gap: 4px;
  }

  button {
    font: inherit;
    cursor: pointer;
    border: 1px solid #ccc;
    background: #fff;
    border-radius: 3px;
    padding: 2px 6px;
  }
  button:hover {
    background: #f4f4f4;
  }
  button.del {
    color: #b22;
    width: 22px;
  }
  button.toggle {
    font-size: 10px;
    text-transform: uppercase;
    width: 30px;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  label {
    display: grid;
    grid-template-columns: 80px 1fr;
    align-items: center;
    gap: 8px;
  }
  label span {
    color: #666;
  }
  input[type="text"],
  input[type="number"],
  select {
    border: 1px solid #ccc;
    border-radius: 3px;
    padding: 3px 6px;
    font: inherit;
    background: #fff;
  }
  input[type="text"]:focus,
  input[type="number"]:focus,
  select:focus {
    outline: 1px solid #4a90e2;
    border-color: #4a90e2;
  }
  form button[type="submit"] {
    align-self: flex-end;
    padding: 3px 12px;
  }

  .hint {
    color: #888;
    font-size: 11px;
    margin: 6px 0 0;
    line-height: 1.4;
  }
  .hint code {
    background: #f1f1f1;
    padding: 0 3px;
    border-radius: 2px;
  }

  .error {
    color: #b22;
    font-size: 11px;
    margin: 0;
  }
</style>
