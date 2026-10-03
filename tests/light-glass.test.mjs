import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { test } from "node:test";

const app = new URL("../src/app/", import.meta.url);
const css = await readFile(new URL("light-glass.css", app), "utf8");
const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");

async function sourceFiles(directory) {
  const files = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(files.map(async (entry) => {
    const path = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith(".tsx") ? [path] : [];
  }));
  return nested.flat();
}

test("all glass rules and theme tokens are explicitly scoped away from dark mode", () => {
  // This stylesheet deliberately uses flat selectors, with @media/@supports groups.
  const ruleHeaders = [...withoutComments.matchAll(/([^{}]+)\{/g)].map(match => match[1].trim());
  const selectors = ruleHeaders.filter(header => !header.startsWith("@"));
  assert.ok(selectors.length > 30, "the complete light theme should be inspected");
  for (const selector of selectors) {
    assert.ok(selector.startsWith("html:not(.dark)"), `Unscoped rule: ${selector}`);
    // Commas inside :is() are selector arguments, not additional root selectors.
    let depth = 0;
    for (let index = 0; index < selector.length; index++) {
      if (selector[index] === "(") depth++;
      if (selector[index] === ")") depth--;
      if (selector[index] === "," && depth === 0) {
        assert.ok(selector.slice(index + 1).trimStart().startsWith("html:not(.dark)"), `Unscoped branch: ${selector}`);
      }
    }
  }
});

test("glass is automatic in light mode and its stylesheet follows the original theme", async () => {
  const layout = await readFile(new URL("layout.tsx", app), "utf8");
  assert.ok(layout.indexOf('import "./light-glass.css"') > layout.indexOf('import "./globals.css"'));
  assert.doesNotMatch(withoutComments, /\.glass\s/);
  assert.match(css, /--light-glass-canvas:/);
  assert.match(css, /rgb\(0 153 255/);
});

test("shared overlays, composed form controls and both sidebar variants are covered", () => {
  for (const slot of ["card", "dialog-content", "alert-dialog-content", "sheet-content", "popover-content", "select-content", "dropdown-menu-content", "sidebar-inner"]) {
    assert.ok(css.includes(`[data-slot="${slot}"]`), `Missing shared surface: ${slot}`);
  }
  for (const selector of ['input[data-slot="form-control"]', 'textarea[data-slot="form-control"]', 'button[data-slot="form-control"][role="combobox"]', '[data-slot="sidebar"][data-mobile="true"]']) {
    assert.ok(css.includes(selector), `Missing composed surface: ${selector}`);
  }
  assert.ok(css.includes(':not([aria-invalid="true"])'));
});

test("bespoke opaque CRM panels and native tables opt in explicitly", async () => {
  for (const path of await sourceFiles(new URL("dashboard/", app))) {
    const source = await readFile(path, "utf8");
    for (const tag of source.matchAll(/<(?:div|Accordion|table)\b[^>]*>/g)) {
      if (tag[0].startsWith("<table") || /\bbg-white\s+dark:bg-zinc-950/.test(tag[0])) {
        assert.match(tag[0], /data-glass=/, `Missing surface hook in ${path.pathname}: ${tag[0]}`);
      }
    }
  }
});

test("reduced transparency, motion, printing and unsupported browsers have fallbacks", () => {
  assert.match(css, /@supports.*backdrop-filter/);
  assert.match(css, /prefers-reduced-transparency: reduce/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /@media print/);
  assert.match(css, /--light-glass-blur: none/);
  assert.match(css, /--light-glass-floating: #f8fbff/);
});
