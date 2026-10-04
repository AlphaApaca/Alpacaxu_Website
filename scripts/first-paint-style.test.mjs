import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(new URL("../public/workspace.css", import.meta.url), "utf8");
const layout = await readFile(new URL("../src/layouts/BaseLayout.astro", import.meta.url), "utf8");

test("every page waits for the closed main before capturing its incoming snapshot", () => {
  const head = layout.match(/<head>[\s\S]*?<\/head>/)?.[0] ?? "";
  assert.match(head, /<link rel="expect" blocking="render" href="#page-content-ready"\s*\/>/);
  assert.equal((layout.match(/id="page-content-ready"/g) ?? []).length, 1);
  assert.match(layout, /<Fragment set:html=\{pageContent\}\s*\/>\s*<span id="page-content-ready" hidden aria-hidden="true"><\/span>\s*<SiteFooter/);
  assert.ok(head.indexOf('set:html={bootstrap}') < head.indexOf('rel="expect"'));
  assert.doesNotMatch(layout, /window\.onload|document\.fonts\.ready|Promise\.all|setTimeout/);
});

test("desktop navigation is centered independently from stable header action slots", () => {
  assert.match(css, /html\s*\{\s*scrollbar-gutter:\s*stable;/);
  assert.match(css, /\.site-header\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto minmax\(0, 1fr\);/);
  assert.match(css, /\.site-header > \.brand\s*\{[^}]*justify-self:\s*start;/);
  assert.match(css, /\.site-header > \.nav-links\s*\{[^}]*justify-self:\s*center;/);
  assert.match(css, /\.header-actions\s*\{[^}]*min-width:\s*max-content;[^}]*justify-self:\s*end;/);
});

test("only header controls reserve their hidden geometry", () => {
  assert.match(css, /\.site-header \.workspace-command-trigger\[hidden\]\s*\{[^}]*display:\s*inline-flex !important;[^}]*visibility:\s*hidden;[^}]*pointer-events:\s*none;/);
  assert.match(css, /\.site-header \.lang-toggle\[hidden\]\s*\{[^}]*display:\s*inline-grid !important;[^}]*visibility:\s*hidden;[^}]*pointer-events:\s*none;/);
  assert.match(css, /\.workspace-command \[hidden\], \.workspace-main \[hidden\]\s*\{\s*display:\s*none !important;/);
  assert.doesNotMatch(css, /\.workspace-command-trigger\[hidden\][^{]*\.workspace-command \[hidden\][^{]*\{[^}]*display:\s*none/);
});

test("mobile keeps a complete two-row header", () => {
  assert.match(css, /@media \(max-width:\s*680px\)\s*\{[\s\S]*?\.site-header\s*\{[^}]*display:\s*flex;[^}]*flex-wrap:\s*wrap;/);
  assert.match(css, /@media \(max-width:\s*680px\)\s*\{[\s\S]*?\.nav-links\s*\{[^}]*order:\s*3;[^}]*width:\s*100%;/);
  assert.match(css, /@media \(pointer:\s*coarse\)\s*\{[\s\S]*?\.workspace-command-trigger, \.lang-toggle, \.icon-button\s*\{[^}]*min-height:\s*44px;/);
});

test("cross-document motion reveals incoming content over an opaque fallback without blocking controls", () => {
  assert.match(css, /@view-transition\s*\{\s*navigation:\s*auto;/);
  assert.match(css, /::view-transition\s*\{\s*pointer-events:\s*none;/);
  assert.match(css, /body > main\s*\{\s*view-transition-name:\s*page-content;/);
  assert.match(css, /\.site-header\s*\{[^}]*view-transition-name:\s*site-header;/);
  const transitionCss = css.slice(0, css.indexOf(".brand {"));
  assert.doesNotMatch(transitionCss, /page-content-leave|filter:\s*blur/);
  assert.match(css, /@keyframes page-content-enter\s*\{\s*from\s*\{\s*opacity:\s*0;\s*\}\s*to\s*\{\s*opacity:\s*1;/);
  assert.match(css, /::view-transition-group\(root\)\s*\{\s*animation:\s*none;/);
  for (const name of ["root", "page-content", "site-header"]) {
    assert.match(css, new RegExp(`::view-transition-old\\(${name}\\)\\s*\\{\\s*animation:\\s*none;\\s*opacity:\\s*1;\\s*mix-blend-mode:\\s*normal;`));
  }
  for (const name of ["root", "page-content"]) {
    assert.match(css, new RegExp(`::view-transition-new\\(${name}\\)\\s*\\{\\s*animation:\\s*300ms ease-out both page-content-enter;\\s*mix-blend-mode:\\s*normal;`));
  }
  assert.match(css, /::view-transition-group\(page-content\)\s*\{[^}]*animation-duration:\s*300ms;[^}]*animation-timing-function:\s*ease-out;/);
  assert.match(css, /::view-transition-new\(page-content\)\s*\{[^}]*background:\s*var\(--bg\);/);
  assert.match(css, /::view-transition-group\(site-header\)\s*\{\s*animation:\s*none;/);
  assert.match(css, /::view-transition-new\(site-header\)\s*\{\s*animation:\s*none;\s*mix-blend-mode:\s*normal;/);
  assert.match(css, /::view-transition-new\(site-header\)\s*\{[^}]*background:\s*var\(--bg\);/);
});

test("reduced motion disables native navigation and every named transition", () => {
  const reduced = css.match(/@media \(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*)\}\s*$/)?.[1] ?? "";
  assert.match(reduced, /@view-transition\s*\{\s*navigation:\s*none;/);
  for (const name of ["root", "site-header", "page-content"]) {
    assert.match(reduced, new RegExp(`::view-transition-group\\(${name}\\)`));
    assert.match(reduced, new RegExp(`::view-transition-old\\(${name}\\)`));
    assert.match(reduced, new RegExp(`::view-transition-new\\(${name}\\)`));
  }
  assert.match(reduced, /animation:\s*none !important;/);
});

test("acceptance diagnostics are early, hidden by default and prolong only incoming snapshots", () => {
  const head = layout.match(/<head>[\s\S]*?<\/head>/)?.[0] ?? "";
  assert.match(head, /<script is:inline set:html=\{motionCheck\}><\/script>/);
  assert.ok(head.indexOf("set:html={motionCheck}") < head.indexOf("set:html={bootstrap}"));
  assert.match(layout, /<aside id="motion-check-panel" class="motion-check-panel" hidden/);
  assert.match(layout, /data-motion-check-status role="status" aria-live="polite"/);
  assert.match(css, /html\[data-motion-check="true"\]::view-transition-new\(root\),\s*html\[data-motion-check="true"\]::view-transition-new\(page-content\),\s*html\[data-motion-check="true"\]::view-transition-group\(page-content\)\s*\{\s*animation-duration:\s*600ms;/);
  assert.match(css, /\.motion-check-panel\[hidden\]\s*\{\s*display:\s*none !important;/);
  assert.match(css, /\.motion-check-panel\s*\{\s*position:\s*fixed;/);
});
