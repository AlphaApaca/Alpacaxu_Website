import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { matchesWriting, normalizeSearch, readWritingFilters, writingFilterUrl } from "../src/lib/writing.mjs";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("writing and About supply bilingual page metadata without the homepage-only legacy bridge", async () => {
  for (const path of ["src/pages/writing/index.astro", "src/pages/about.astro"]) {
    const source = await read(path);
    assert.match(source, /localizedMeta=\{localizedMeta\}/);
    assert.match(source, /zh:\s*\{ title:/);
    assert.match(source, /en:\s*\{ title:/);
    assert.doesNotMatch(source, /legacyI18n/);
  }
});

test("archive translations preserve category counts, authored content and exact filter values", async () => {
  const source = await read("src/pages/writing/index.astro");
  assert.match(source, /data-workspace-placeholder-en="Search titles, summaries or tags"/);
  assert.match(source, /data-workspace-aria-en="Writing categories"/);
  assert.match(source, /Object\.hasOwn\(categoryCopy, category\)/);
  assert.match(source, /: \{ zh: categoryLabel\(category\), en: categoryLabel\(category\) \}/);
  assert.match(source, /data-writing-category=\{category\}>\s*<span data-workspace-zh=/);
  assert.match(source, /<\/span> <span>\{posts\.filter\(\(post\) => post\.category === category\)\.length\}<\/span>/);
  const title = source.match(/<h2><a href=\{post\.url\}[\s\S]*?<\/h2>/)?.[0];
  const summary = source.match(/<p class="writing-entry-summary"[\s\S]*?<\/p>/)?.[0];
  assert.ok(title?.includes("{post.title}"));
  assert.ok(summary?.includes("{post.summary}"));
  assert.doesNotMatch(`${title}\n${summary}`, /data-workspace-(?:zh|en)/);
  assert.match(source, /data-tags=\{JSON\.stringify\(post\.tags\)\}/);
});

test("About translations retain graduation expectations, individual contributions and guestbook identity", async () => {
  const source = await read("src/pages/about.astro");
  assert.match(source, /graduation expected in December 2026/);
  assert.match(source, /mainly worked on validating and tuning SLAM and Nav2 navigation on the Leo Rover/);
  assert.match(source, /data-workspace-alt-en=\{`Portrait of \$\{site\.name\}`\}/);
  assert.match(source, /<GiscusComments term="about-guestbook" guestbook \/>/);
  for (const link of ["/#projects", "/writing/", "https://github.com/AlphaApaca"]) {
    assert.ok(source.includes(`href="${link}"`), link);
  }
  assert.match(source, /href=\{`mailto:\$\{site\.email\}`\}/);
});

test("translation spans keep the archive's heading and count typography separate", async () => {
  const editorial = await read("public/writing-editorial.css");
  const shared = await read("public/astro.css");
  assert.match(editorial, /\.writing-heading h1 span:last-child\s*\{/);
  for (const css of [editorial, shared]) {
    assert.match(css, /\.writing-categories a > span:not\(\[data-workspace-zh\]\)\s*\{/);
  }
});

// A small DOM fixture runs the actual compiled archive enhancement. Browser QA owns visual layout.
class Element {
  constructor(dataset = {}) { this.dataset = dataset; this.listeners = new Map(); this.attributes = new Map(); this.hidden = false; this.textContent = ""; }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  setAttribute(name, value) { this.attributes.set(name, value); }
  removeAttribute(name) { this.attributes.delete(name); }
}

class Option {
  constructor(text, value) { this.text = text; this.value = value; this.dataset = {}; }
  remove() { this.owner.options = this.owner.options.filter((option) => option !== this); }
}

class Select extends Element {
  constructor() { super(); this.options = []; this.value = ""; }
  add(option) { option.owner = this; this.options.push(option); }
  querySelectorAll() { return this.options.filter((option) => option.dataset.transient); }
}

async function archiveFixture(search = "") {
  const source = await read("src/pages/writing/index.astro");
  const script = source.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script, "The archive enhancement must remain testable");
  const compiled = ts.transpileModule(script.replace(/\s*import[^;]+;\s*/, ""), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
  const index = new Element();
  const form = new Element();
  const query = Object.assign(new Element(), { value: "" });
  const category = Object.assign(new Element(), { value: "" });
  const tag = new Select();
  tag.add(new Option("All tags", ""));
  tag.add(new Option("PyTorch", "PyTorch"));
  const results = new Element();
  const empty = new Element();
  const emptyHint = new Element();
  const clearButton = new Element();
  const card = new Element({ category: "learning-log", tags: '["PyTorch"]', search: "PyTorch datasets 学习日志" });
  const categories = ["", "learning-log", "note", "essay"].map((value) => new Element({ writingCategory: value }));
  const tagLink = new Element({ writingTag: "PyTorch" });
  const enhanced = [form, new Element()];
  form.querySelector = (selector) => ({ "[name=q]": query, "[name=category]": category, "[name=tag]": tag })[selector];
  index.querySelector = (selector) => ({ form, "#writingResults": results, "#writingEmpty": empty, "#writingEmptyHint": emptyHint, "[data-writing-clear]": clearButton })[selector];
  index.querySelectorAll = (selector) => ({
    "[data-writing-post]": [card],
    ".writing-categories [data-writing-category]": categories,
    "[data-writing-category]": categories,
    "[data-writing-tag]": [tagLink],
    "[data-writing-enhanced]": enhanced,
  })[selector];
  const root = { dataset: { lang: "zh" }, lang: "zh-CN" };
  const document = { documentElement: root, querySelector: () => index };
  const location = new URL(`https://example.com/writing/${search}`);
  const window = new Element();
  const historyCalls = [];
  const history = Object.fromEntries(["pushState", "replaceState"].map((mode) => [mode, (_data, _title, url) => {
    historyCalls.push(mode);
    location.href = url.href;
  }]));
  vm.runInNewContext(compiled, { document, window, location, history, Option, URL, matchesWriting, normalizeSearch, readWritingFilters, writingFilterUrl, setTimeout, clearTimeout });
  const language = (value) => { root.dataset.lang = value; root.lang = value === "zh" ? "zh-CN" : "en"; window.listeners.get("site:language-change")(); };
  return { query, category, tag, results, empty, emptyHint, card, location, historyCalls, language };
}

test("changing archive language preserves unknown tags, searches, categories, URL and history", async () => {
  const fixture = await archiveFixture("?q=PyTorch&category=learning-log&tag=Missing&utm_source=test#saved");
  const originalUrl = fixture.location.href;
  assert.equal(fixture.results.textContent, "显示 0 / 1 篇文章");
  assert.equal(fixture.tag.options.at(-1).text, "Missing（未收录）");
  fixture.language("en");
  assert.equal(fixture.results.textContent, "Showing 0 of 1 article");
  assert.equal(fixture.tag.options.at(-1).text, "Missing (not indexed)");
  assert.equal(fixture.emptyHint.textContent, "Try another keyword, or clear the category and tag filters.");
  assert.equal(fixture.query.value, "PyTorch");
  assert.equal(fixture.category.value, "learning-log");
  assert.equal(fixture.tag.value, "Missing");
  assert.equal(fixture.location.href, originalUrl);
  assert.deepEqual(fixture.historyCalls, []);
  assert.equal(fixture.card.hidden, true);
  fixture.language("zh");
  assert.equal(fixture.tag.options.filter((option) => option.dataset.transient).length, 1);
  assert.equal(fixture.tag.options.at(-1).text, "Missing（未收录）");
});

test("essay empty-state translation updates live without changing the selected category", async () => {
  const fixture = await archiveFixture("?category=essay");
  assert.equal(fixture.empty.hidden, false);
  assert.equal(fixture.emptyHint.textContent, "这里还没有已发布的杂文。留一些位置，给以后的随想。");
  fixture.language("en");
  assert.equal(fixture.emptyHint.textContent, "No published essays yet. Leaving a little room for future thoughts.");
  assert.equal(fixture.category.value, "essay");
  assert.equal(fixture.location.search, "?category=essay");
  assert.deepEqual(fixture.historyCalls, []);
});

test("normal filtering after a language switch still preserves unrelated URL parameters and fragments", async () => {
  const fixture = await archiveFixture("?q=PyTorch&category=learning-log&utm_source=test#saved");
  fixture.language("en");
  fixture.tag.value = "PyTorch";
  fixture.tag.listeners.get("change")();
  assert.equal(fixture.results.textContent, "Showing 1 of 1 article");
  assert.equal(fixture.card.hidden, false);
  assert.equal(fixture.location.searchParams.get("utm_source"), "test");
  assert.equal(fixture.location.hash, "#saved");
  assert.equal(fixture.location.searchParams.get("tag"), "PyTorch");
  assert.deepEqual(fixture.historyCalls, ["pushState"]);
  fixture.language("zh");
  assert.equal(fixture.results.textContent, "显示 1 / 1 篇文章");
  assert.deepEqual(fixture.historyCalls, ["pushState"]);
});
