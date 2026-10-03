import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("writing tag filter retains its native labelled select and change behavior", async () => {
  const page = await read("src/pages/writing/index.astro");
  assert.match(page, /<label class="writing-tag-select" for="writingTag">/);
  assert.match(page, /<select id="writingTag" name="tag">/);
  assert.match(page, /<option value=""/);
  assert.match(page, /tag\.addEventListener\("change", \(\) => update\("pushState"\)\)/);
  assert.doesNotMatch(page, /role="(?:combobox|listbox)"/);
});

test("closed tag control uses scoped editorial colors, sans-serif text and a noninteractive arrow", async () => {
  const css = await read("public/writing-editorial.css");
  assert.match(css, /font-family: Inter, ui-sans-serif,[^;]*"PingFang SC"[^;]*"Noto Sans SC"[^;]*"Microsoft YaHei"[^;]*sans-serif;/);
  assert.match(css, /\.editorial-writing \.writing-controls select \{[^}]*appearance: none;[^}]*padding-inline-end: 42px;/);
  assert.match(css, /\.editorial-writing \.writing-tag-select::after \{[^}]*border-right: 1\.5px solid var\(--muted\);[^}]*pointer-events: none;/);
  assert.match(css, /\.editorial-writing \.writing-controls select option \{[^}]*font-family: inherit;[^}]*background: var\(--surface\);[^}]*color: var\(--text\);/);
  assert.match(css, /\.editorial-writing \.writing-controls select:focus-visible \{[^}]*outline: 2px solid var\(--accent\);[^}]*outline-offset: 3px;/);
});

test("tag filter recovers the native high-contrast arrow and disables motion when requested", async () => {
  const css = await read("public/writing-editorial.css");
  assert.match(css, /@media \(forced-colors: active\) \{[\s\S]*?appearance: auto;[\s\S]*?background: Canvas;[\s\S]*?content: none;/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{[^}]*\.editorial-writing \.writing-controls select \{[^}]*transition: none;/);
  assert.match(css, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(css, /@media \(max-width: 540px\) \{[\s\S]*?\.editorial-writing \.writing-controls \{\s*grid-template-columns: minmax\(0, 1fr\);/);
  assert.doesNotMatch(css, /\.writing-controls select[^}]*outline:\s*(?:none|0)/);
});

test("browser-supported picker enhancement keeps mobile and forced-colors native", async () => {
  const css = await read("public/writing-editorial.css");
  assert.match(css, /@supports \(appearance: base-select\) and selector\(::picker\(select\)\) \{\s*@media \(pointer: fine\) and \(hover: hover\) and \(forced-colors: none\)/);
  assert.match(css, /\.editorial-writing \.writing-controls select,\s*\.editorial-writing \.writing-controls select::picker\(select\) \{\s*appearance: base-select;/);
  assert.match(css, /\.editorial-writing \.writing-controls select \{\s*align-items: center;\s*justify-content: flex-start;/);
  assert.match(css, /select::picker\(select\) \{[^}]*background: var\(--surface\);[^}]*font-family: Inter, ui-sans-serif/);
  assert.match(css, /select option:focus-visible \{[^}]*outline: 1px solid var\(--accent\);/);
  assert.match(css, /select option:checked \{[^}]*color: var\(--accent\);/);
});
