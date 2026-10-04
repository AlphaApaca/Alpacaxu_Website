import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(new URL("../public/workspace.css", import.meta.url), "utf8");

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

test("cross-document motion blurs only named page content and never blocks controls", () => {
  assert.match(css, /@view-transition\s*\{\s*navigation:\s*auto;/);
  assert.match(css, /::view-transition\s*\{\s*pointer-events:\s*none;/);
  assert.match(css, /body > main\s*\{\s*view-transition-name:\s*page-content;/);
  assert.match(css, /\.site-header\s*\{[^}]*view-transition-name:\s*site-header;/);
  assert.match(css, /@keyframes page-content-leave\s*\{[^}]*opacity:\s*1;[^}]*filter:\s*blur\(0\);[^}]*\}[^}]*opacity:\s*0;[^}]*filter:\s*blur\(2px\);/);
  assert.match(css, /@keyframes page-content-enter\s*\{[^}]*opacity:\s*0;[^}]*filter:\s*blur\(2px\);[^}]*\}[^}]*opacity:\s*1;[^}]*filter:\s*blur\(0\);/);
  assert.match(css, /::view-transition-group\(root\)\s*\{\s*animation:\s*none;/);
  assert.match(css, /::view-transition-old\(root\)\s*\{\s*animation:\s*none;\s*opacity:\s*0;/);
  assert.match(css, /::view-transition-new\(root\)\s*\{\s*animation:\s*none;\s*mix-blend-mode:\s*normal;/);
  assert.match(css, /::view-transition-group\(page-content\)\s*\{[^}]*animation-duration:\s*200ms;[^}]*animation-timing-function:\s*ease-out;/);
  assert.match(css, /::view-transition-old\(page-content\)\s*\{\s*animation:\s*180ms[^}]*page-content-leave;/);
  assert.match(css, /::view-transition-new\(page-content\)\s*\{\s*animation:\s*200ms[^}]*page-content-enter;/);
  assert.match(css, /::view-transition-group\(site-header\)\s*\{\s*animation:\s*none;/);
  assert.match(css, /::view-transition-old\(site-header\)\s*\{\s*animation:\s*none;\s*opacity:\s*0;/);
  assert.match(css, /::view-transition-new\(site-header\)\s*\{\s*animation:\s*none;\s*mix-blend-mode:\s*normal;/);
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
