// Semi-automatic refresher for the selector-contract fixtures.
//
//   pnpm fixtures
//
// Discovers every scope that ships a __fixtures__/index.ts, lets you pick which
// to refresh, prints the pages to open (capture them by hand — automation gets
// CAPTCHA'd), then trims the saved HTML into the checked-in fixtures, runs the
// contract tests, and commits. The working tree must be clean first so the
// auto-commit contains only the refreshed fixtures.
//
// Runs on Node's native TypeScript (Node >= 23.6); no build step.

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCOPES_DIR = join(REPO_ROOT, "src/lib/scopes");
const TMP_DIR = join(REPO_ROOT, "scripts/.capture-tmp");

// One installed bookmarklet, reused for every page: it dumps the *rendered* DOM
// (not the JS-free page source) and asks for the filename the script printed.
const BOOKMARKLET =
  "javascript:(()=>{const n=prompt('Save fixture as (filename):');if(!n)return;const b=new Blob([document.documentElement.outerHTML],{type:'text/html'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;a.click();})();";

type Fixture = {
  scope: string;
  name: string;
  url: string;
  tmpFile: string;
  destFile: string;
};

type ScopeFixtures = { scope: string; fixtures: Fixture[] };

type Rl = ReturnType<typeof createInterface>;

function ensureCleanTree(): void {
  const r = spawnSync("git", ["status", "--porcelain"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  if (r.status !== 0) throw new Error(`git status failed: ${r.stderr}`);
  if (r.stdout.trim() !== "") {
    throw new Error(
      "Working tree is dirty. Commit or stash first — this script commits only the refreshed fixtures.",
    );
  }
}

async function discoverScopes(): Promise<ScopeFixtures[]> {
  const scopes: ScopeFixtures[] = [];
  for (const entry of readdirSync(SCOPES_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const indexPath = join(SCOPES_DIR, entry.name, "__fixtures__/index.ts");
    if (!existsSync(indexPath)) continue;
    const mod = await import(pathToFileURL(indexPath).href);
    const urls = mod.FIXTURE_URLS as Record<string, string> | undefined;
    if (urls == null) continue;
    const fixtures = Object.entries(urls).map(([name, url]) => ({
      scope: entry.name,
      name,
      url,
      tmpFile: join(TMP_DIR, `${entry.name}__${name}.html`),
      destFile: join(SCOPES_DIR, entry.name, "__fixtures__", `${name}.html`),
    }));
    scopes.push({ scope: entry.name, fixtures });
  }
  return scopes;
}

async function selectScopes(
  scopes: ScopeFixtures[],
  rl: Rl,
): Promise<ScopeFixtures[]> {
  console.log("Scopes with fixtures:");
  scopes.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.scope} (${s.fixtures.length} fixtures)`);
  });
  const answer = (
    await rl.question("Which to refresh? (e.g. 1,2 or 'all'): ")
  ).trim();
  if (answer === "" || answer.toLowerCase() === "all") return scopes;
  const picked = answer
    .split(",")
    .map((t) => Number.parseInt(t.trim(), 10))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= scopes.length)
    .map((n) => scopes[n - 1]);
  if (picked.length === 0) throw new Error("No valid scope selected.");
  return picked;
}

function printCaptureSteps(fixtures: Fixture[]): void {
  console.log("\nCapture in a logged-out / incognito window.\n");
  console.log("1. Add this bookmarklet to your bookmarks bar (once):\n");
  console.log(`   ${BOOKMARKLET}\n`);
  console.log(
    `2. For each page: open the URL, run the bookmarklet, and save into\n   ${TMP_DIR}\n   with the exact filename shown.\n`,
  );
  for (const f of fixtures) {
    console.log(`   open: ${f.url}`);
    console.log(`   save: ${f.scope}__${f.name}.html\n`);
  }
}

async function waitForFiles(fixtures: Fixture[], rl: Rl): Promise<void> {
  while (true) {
    await rl.question(
      "Press Enter once every file is saved (Ctrl-C aborts)... ",
    );
    const missing = fixtures.filter((f) => !existsSync(f.tmpFile));
    if (missing.length === 0) return;
    console.log("Still missing:");
    for (const f of missing) console.log(`  - ${f.scope}__${f.name}.html`);
  }
}

// Strip the saved page to an inert, checked-in fixture: drop scripts, styles,
// and subresource tags (~2/3 of the bytes) that the selectors never inspect and
// that happy-dom would try to fetch. The selectors only target
// <a>/<input>/<form>/<h3>/<span>, so no hit count changes.
const CONTAINER_TAGS = [
  "script",
  "style",
  "noscript",
  "svg",
  "iframe",
  "video",
  "audio",
  "object",
  "picture",
];
const VOID_TAGS = ["link", "img", "source", "track", "embed"];

// Repeat each removal to a fixpoint: one pass can reveal a fresh match when a
// construct is nested inside another (e.g. `<li<link>nk>` reconstituting).
function stripToFixpoint(html: string, pattern: RegExp): string {
  let previous: string;
  do {
    previous = html;
    html = html.replace(pattern, "");
  } while (html !== previous);
  return html;
}

function trimHtml(html: string): string {
  let out = html;
  for (const tag of CONTAINER_TAGS) {
    out = stripToFixpoint(
      out,
      new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?</${tag}>`, "gi"),
    );
  }
  for (const tag of VOID_TAGS) {
    out = stripToFixpoint(out, new RegExp(`<${tag}\\b[^>]*>`, "gi"));
  }
  out = stripToFixpoint(out, /<!--[\s\S]*?-->/g);
  out = stripToFixpoint(out, /<meta\b[^>]*http-equiv=["']?refresh[^>]*>/gi);
  return out
    .replace(/(src|href)="data:[^"]*"/gi, '$1="data:stub"')
    .replace(/\n[ \t]*\n+/g, "\n");
}

function installFixtures(fixtures: Fixture[]): void {
  for (const f of fixtures) {
    writeFileSync(f.destFile, trimHtml(readFileSync(f.tmpFile, "utf8")));
    console.log(`installed ${f.scope}/__fixtures__/${f.name}.html`);
  }
}

function runContractTests(selected: ScopeFixtures[]): boolean {
  const patterns = selected.map((s) => `${s.scope}/selectors.contract`);
  const r = spawnSync("pnpm", ["test", ...patterns], {
    cwd: REPO_ROOT,
    stdio: "inherit",
  });
  return r.status === 0;
}

function commit(selected: ScopeFixtures[], fixtures: Fixture[]): void {
  const add = spawnSync("git", ["add", ...fixtures.map((f) => f.destFile)], {
    cwd: REPO_ROOT,
    stdio: "inherit",
  });
  if (add.status !== 0) throw new Error("git add failed");
  const scopes = selected.map((s) => s.scope).join(", ");
  const message = `test: recapture ${scopes} selector-contract fixtures`;
  const res = spawnSync("git", ["commit", "-m", message], {
    cwd: REPO_ROOT,
    stdio: "inherit",
  });
  if (res.status !== 0) throw new Error("git commit failed");
}

async function main(): Promise<void> {
  ensureCleanTree();
  const scopes = await discoverScopes();
  if (scopes.length === 0) {
    console.log("No scopes with __fixtures__/index.ts found.");
    return;
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const selected = await selectScopes(scopes, rl);
    const fixtures = selected.flatMap((s) => s.fixtures);

    mkdirSync(TMP_DIR, { recursive: true });
    printCaptureSteps(fixtures);
    await waitForFiles(fixtures, rl);

    installFixtures(fixtures);
    const passed = runContractTests(selected);
    commit(selected, fixtures);
    rmSync(TMP_DIR, { recursive: true, force: true });

    console.log(
      passed
        ? "\n✅ Fixtures refreshed, contract tests pass, committed."
        : "\n⚠️  Fixtures refreshed and committed, but a contract test FAILED — a selector likely needs fixing.",
    );
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
