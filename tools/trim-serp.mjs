// Trim a raw captured SERP down to a checked-in selector-contract fixture.
//
// A raw Google SERP is ~1.5 MB, two-thirds of which is inline <script>/<style>.
// The contract tests (src/lib/scopes/**/*.contract.test.ts) only need the
// structural anchors/inputs the site selectors target, so we strip the weight
// while leaving the DOM structure — and thus every selector's hit count —
// untouched. See tools/capture-serp.md for the full refresh procedure.
//
// Usage:
//   node tools/trim-serp.mjs <input.html> <output.html>
// Example:
//   node tools/trim-serp.mjs www.google.com.html \
//     src/lib/scopes/google/__fixtures__/serp.html

import { readFileSync, writeFileSync } from "node:fs";

// Paired tags whose contents are dropped wholesale.
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
// Void / self-contained subresource tags that trigger a network fetch on parse.
const VOID_TAGS = ["link", "img", "source", "track", "embed"];

// Remove every match, repeating until the string stops changing. A single pass
// can leave a fresh match behind when one construct is nested inside another
// (e.g. `<!--<!-- -->-->` or `<li<link>nk>` reconstituting after the inner
// removal), so we strip to a fixpoint rather than once.
function stripAll(html, pattern) {
  let previous;
  do {
    previous = html;
    html = html.replace(pattern, "");
  } while (html !== previous);
  return html;
}

function trim(html) {
  let out = html;
  for (const tag of CONTAINER_TAGS) {
    out = stripAll(
      out,
      new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi"),
    );
  }
  for (const tag of VOID_TAGS) {
    out = stripAll(out, new RegExp(`<${tag}\\b[^>]*>`, "gi"));
  }
  // The contract tests parse this fixture with happy-dom, which eagerly fetches
  // any remaining subresource the markup references. Stripping the tags above
  // (plus scripts/styles) keeps the fixture inert so the tests stay fully
  // offline. The selectors only target <a>/<input>/<form>/<h3>/<span>, so none
  // of these removals change a selector's hit count.
  out = stripAll(out, /<!--[\s\S]*?-->/g);
  out = stripAll(out, /<meta\b[^>]*http-equiv=["']?refresh[^>]*>/gi);
  return (
    out
      // Drop heavy inline base64 payloads still referenced by other attributes.
      .replace(/(src|href)="data:[^"]*"/gi, '$1="data:stub"')
      // Collapse the blank lines the removals leave behind.
      .replace(/\n[ \t]*\n+/g, "\n")
  );
}

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("usage: node tools/trim-serp.mjs <input.html> <output.html>");
  process.exit(1);
}

const raw = readFileSync(input, "utf8");
const trimmed = trim(raw);
writeFileSync(output, trimmed);

const pct = Math.round((trimmed.length / raw.length) * 100);
console.log(
  `${input} -> ${output}: ${raw.length} -> ${trimmed.length} bytes (${pct}%)`,
);
