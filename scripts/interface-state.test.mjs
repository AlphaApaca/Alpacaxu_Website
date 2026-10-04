import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { interfaceDate, interfaceLanguage, languageToggleLabel, preferredInterfaceLanguage } from "../public/interface-state.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("interface language normalizes Chinese and English without translating author text", () => {
  for (const value of ["zh", "zh-CN", "ZH-Hant"]) assert.equal(interfaceLanguage(value), "zh");
  for (const value of ["en", "en-US", "", null, undefined, "unsupported"]) assert.equal(interfaceLanguage(value), "en");
});

test("one saved UI preference is shared with home and survives storage being unavailable", () => {
  for (const saved of ["zh", "en"]) {
    assert.equal(preferredInterfaceLanguage({ getItem: (key) => { assert.equal(key, "alpaca-lang"); return saved; } }), saved);
  }
  for (const storage of [undefined, { getItem: () => null }, { getItem: () => "unexpected" }, { getItem: () => { throw new Error("disabled"); } }]) {
    assert.equal(preferredInterfaceLanguage(storage), "en");
  }
});

test("toggle copy tells the user which language they will switch to", () => {
  assert.deepEqual(languageToggleLabel("zh-CN"), { text: "EN", action: "Switch to English" });
  assert.deepEqual(languageToggleLabel("en"), { text: "中文", action: "切换到中文" });
});

test("generated date labels translate in UTC while invalid or author strings are left intact", () => {
  assert.equal(interfaceDate("2026-10-02", "en"), "October 2, 2026");
  assert.equal(interfaceDate("2026-10-02", "zh"), "2026年10月2日");
  for (const value of ["2026-02-30", "not a date", "2026-10-2", ""]) assert.equal(interfaceDate(value, "en"), value);
});

test("all shared pages expose the language control without attaching home handlers twice", async () => {
  const layout = await read("src/layouts/BaseLayout.astro");
  assert.match(layout, /<SiteHeader \/>/);
  assert.doesNotMatch(layout, /showLanguageToggle=\{legacyI18n\}/);
  assert.match(layout, /data-content-lang=\{lang\}/);
  const script = await read("public/workspace.js");
  assert.doesNotMatch(script, /root\.dataset\.legacyI18n/);
  assert.doesNotMatch(layout, /src="\/script\.js"/);
  assert.match(layout, /evidenceMarkup\(legacyScript, renderedContent\)/);
  assert.match(script, /button\.disabled = false/);
  assert.match(script, /localStorage\.setItem\("alpaca-lang", next\)/);
  assert.match(script, /CustomEvent\("site:language-change"/);
  for (const attribute of ["aria-label", "placeholder", "alt", "title"]) assert.ok(script.includes(`"${attribute}"`));
});

test("article bodies and stable comment associations are independent of interface language", async () => {
  const article = await read("src/layouts/ArticleLayout.astro");
  assert.match(article, /<article class="article-content" lang=\{lang\}>\s*<slot \/>/);
  assert.match(article, /<h1 lang=\{lang\}>\{title\}<\/h1>/);
  assert.match(article, /<GiscusComments term=\{commentTerm\} lang=\{lang\}/);
  const comments = await read("src/components/GiscusComments.astro");
  assert.match(comments, /setConfig: \{ theme: theme\(\), lang: language\(\) \}/);
  assert.match(comments, /giscusOrigin\s*\n\s*\)/);
  assert.match(comments, /mapping: "specific"/);
  assert.match(comments, /term: section\.dataset\.term/);
  assert.doesNotMatch(comments, /setConfig: \{[^}]*term:/);
});

test("page transition snapshots do not block the real language and navigation controls", async () => {
  const css = await read("public/workspace.css");
  assert.match(css, /::view-transition\s*\{\s*pointer-events:\s*none;/);
  assert.match(css, /@view-transition\s*\{\s*navigation:\s*auto;/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*@view-transition\s*\{\s*navigation:\s*none;/);
});
