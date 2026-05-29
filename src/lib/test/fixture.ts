import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

function loadFixtureDocument(path: string): Document {
  const html = readFileSync(path, "utf8");
  return new DOMParser().parseFromString(html, "text/html");
}

// A selector set is satisfied when *any* member hits, mirroring the actions'
// first-match-wins probing. Individual fallbacks legitimately return 0 (e.g.
// Google's tbm= variants after the udm= migration), so the set — not the lone
// selector — is the unit that signals real drift.
function selectorSetHits(doc: Document, selectors: readonly string[]): boolean {
  return selectors.some((sel) => doc.querySelectorAll(sel).length > 0);
}

// Register one suite per fixture, asserting each named selector set still hits
// its checked-in HTML. A red test means the site changed its markup: re-capture
// with `pnpm fixtures` and fix the selector.
export function defineSelectorContract(
  title: string,
  fixtureDir: string,
  contracts: Record<string, Record<string, readonly string[]>>,
): void {
  describe(title, () => {
    for (const [fixture, sets] of Object.entries(contracts)) {
      describe(fixture, () => {
        let doc: Document;
        beforeAll(() => {
          doc = loadFixtureDocument(join(fixtureDir, `${fixture}.html`));
        });
        for (const [label, selectors] of Object.entries(sets)) {
          it(`${label} still matches`, () => {
            expect(selectorSetHits(doc, selectors)).toBe(true);
          });
        }
      });
    }
  });
}
