import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { initializeInterface } from "../src/lib/first-paint.mjs";
import { interfaceDate, interfaceLanguage, languageToggleLabel } from "../public/interface-state.js";
import { commandMatches, fragmentId } from "../public/workspace-state.js";
import { matchesWriting, normalizeSearch, readWritingFilters } from "../src/lib/writing.mjs";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("article size and reading time come from the Markdown body at build time", async () => {
  const content = await read("src/lib/content.ts");
  const route = await read("src/pages/writing/[...slug].astro");
  for (const source of [content, route]) {
    assert.match(source, /import\s*\{\s*calculateReadingMetrics\s*\}\s*from\s*["'][^"']*reading-metrics\.mjs["']/);
    assert.match(source, /calculateReadingMetrics\([^)]*(?:post\.)?body\s*\?\?\s*["']["']\)/);
    assert.doesNotMatch(source, /calculateReadingMetrics\([^)]*(?:summary|title|sourceUrl)/);
  }
  assert.match(content, /metrics:\s*\{\s*chineseCharacters:\s*number;\s*words:\s*number;\s*readingMinutes:\s*number\s*\}/);
  assert.match(route, /<ArticleLayout\b[\s\S]*?metrics=\{metrics\}/);
});

test("all writing surfaces reuse the same metrics, with only time on homepage cards", async () => {
  const home = await read("src/pages/index.astro");
  const writing = await read("src/pages/writing/index.astro");
  const layout = await read("src/layouts/ArticleLayout.astro");
  for (const source of [home, writing, layout]) {
    assert.match(source, /import ReadingMetrics from ["'][^"']*components\/ReadingMetrics\.astro["']/);
    assert.equal((source.match(/<ReadingMetrics\b/g) ?? []).length, 1);
  }
  assert.match(home, /<ReadingMetrics\b(?=[^>]*metrics=\{post\.metrics\})(?=[^>]*\bcompact\b)[^>]*\/>/);
  assert.match(writing, /<ReadingMetrics\b[^>]*metrics=\{post\.metrics\}[^>]*\/>/);
  assert.doesNotMatch(writing.match(/<ReadingMetrics\b[^>]*\/>/)?.[0] ?? "", /\bcompact\b/);
  assert.match(layout, /<ReadingMetrics\b[^>]*metrics=\{metrics\}[^>]*\/>/);
  assert.doesNotMatch(layout.match(/<ReadingMetrics\b[^>]*\/>/)?.[0] ?? "", /\bcompact\b/);
});

test("article metrics stay in the heading and do not enter authored body translation exclusions", async () => {
  const layout = await read("src/layouts/ArticleLayout.astro");
  const marker = layout.indexOf("<ReadingMetrics");
  const header = layout.indexOf('<div class="article-heading">');
  const reading = layout.indexOf('<div class="article-reading-layout">');
  const body = layout.indexOf('<article class="article-content"');
  assert.ok(header >= 0 && header < marker && marker < reading && reading < body);
  assert.doesNotMatch(layout.slice(body, layout.indexOf("</article>", body)), /ReadingMetrics/);
});

test("metrics are static bilingual markup with no line count or additional browser dependency", async () => {
  const component = await read("src/components/ReadingMetrics.astro");
  assert.match(component, /const\s*\{\s*metrics,\s*compact\s*=\s*false\s*\}\s*=\s*Astro\.props/);
  assert.match(component, /readingMetricsCopy\(metrics\)/);
  assert.match(component, /data-reading-metrics/);
  assert.match(component, /!compact\s*&&\s*\(\s*<span\b[^>]*data-reading-volume/);
  for (const item of ["volume", "time"]) {
    const element = component.match(new RegExp(`<span\\b[^>]*data-reading-${item}[^>]*>`))?.[0] ?? "";
    assert.match(element, new RegExp(`data-workspace-zh=\\{copy\\.zh\\.${item}\\}`));
    assert.match(element, new RegExp(`data-workspace-en=\\{copy\\.en\\.${item}\\}`));
  }
  for (const language of ["zh", "en"]) {
    assert.ok(component.includes(`data-workspace-title-${language}={copy.${language}.description}`));
  }
  assert.match(component, /title=\{copy\.zh\.description\}/);
  assert.doesNotMatch(component, /<script\b|fetch\(|setTimeout\(|requestAnimationFrame\(|localStorage|data-reading-lines|(?:source|code)?[Ll]ineCount|sourceLines/);
});

test("the shared component can wrap on narrow screens without a second public stylesheet", async () => {
  const component = await read("src/components/ReadingMetrics.astro");
  const style = component.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";
  assert.match(style, /display:\s*flex\s*;/);
  assert.match(style, /flex-wrap:\s*wrap\s*;/);
  assert.match(style, /min-width:\s*0\s*;/);
  assert.match(style, /var\(--muted\)/);
  assert.doesNotMatch(component, /<link\b|<style\s+is:global|@import/);
});

// This small DOM fixture executes existing production language code. It checks
// text/title behavior, not browser layout or the metric calculation algorithm.
class Element {
  constructor(attributes = {}, text = "") {
    this.attributes = new Map(Object.entries(attributes));
    this.textContent = text;
    this.children = [];
    this.dataset = {};
    this.listeners = new Map();
    this.nodeType = 1;
  }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  hasAttribute(name) { return this.attributes.has(name); }
  removeAttribute(name) { this.attributes.delete(name); }
  addEventListener(name, listener) { this.listeners.set(name, listener); }
  closest() { return null; }
  matches(selector) {
    return selector.split(",").some((part) => {
      const item = part.trim();
      if (item.startsWith(".")) return (this.getAttribute("class") ?? "").split(" ").includes(item.slice(1));
      const attribute = item.match(/^\[([^\]=]+)\]$/)?.[1];
      return attribute ? this.hasAttribute(attribute) : false;
    });
  }
  querySelectorAll(selector) {
    return this.children.flatMap((child) => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]);
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
}

function metricsFixture(language) {
  const root = new Element();
  const wrapper = new Element({
    "data-reading-metrics": "", title: "预计浏览正文，不包括练习。",
    "data-workspace-title-zh": "预计浏览正文，不包括练习。",
    "data-workspace-title-en": "Estimated time to browse the text, excluding practice.",
  });
  const volume = new Element({ "data-workspace-zh": "120 字 · 34 词", "data-workspace-en": "120 Chinese characters · 34 words" }, "120 字 · 34 词");
  const time = new Element({ "data-workspace-zh": "约 1 分钟", "data-workspace-en": "About 1 min" }, "约 1 分钟");
  const toggle = new Element({ class: "lang-toggle" });
  wrapper.children.push(volume, time);
  root.children.push(wrapper, toggle);
  const document = {
    documentElement: root, readyState: "loading", title: "Untouched",
    querySelector: (selector) => root.querySelector(selector),
    querySelectorAll: (selector) => root.querySelectorAll(selector),
    addEventListener() {}, removeEventListener() {}, getElementById() { return null; },
  };
  const storage = new Map([["alpaca-lang", language]]);
  let observer;
  class MutationObserver {
    constructor(callback) { this.callback = callback; observer = this; }
    observe() {}
    disconnect() {}
  }
  initializeInterface({
    document, storage: { getItem: (key) => storage.get(key) }, matchMedia: () => ({ matches: false }),
    MutationObserver, location: { search: "" }, matchesWriting, normalizeSearch, readWritingFilters,
  });
  return { root, document, wrapper, volume, time, toggle, storage, MutationObserver, observer: () => observer };
}

for (const language of ["zh", "en"]) {
  test(`saved ${language} localizes metric units and estimate tooltip before external scripts run`, () => {
    const fixture = metricsFixture(language);
    assert.equal(fixture.root.dataset.lang, language);
    for (const element of [fixture.volume, fixture.time]) {
      assert.equal(element.textContent, element.getAttribute(`data-workspace-${language}`));
    }
    assert.equal(fixture.wrapper.getAttribute("title"), fixture.wrapper.getAttribute(`data-workspace-title-${language}`));
  });
}

test("the existing language toggle updates metric text and tooltip together without recalculating content", async () => {
  const fixture = metricsFixture("zh");
  const script = (await read("public/workspace.js")).replace(/^import[^\n]*\n/gm, "");
  vm.runInNewContext(script, {
    document: fixture.document,
    window: { addEventListener() {}, dispatchEvent() {} },
    localStorage: { setItem: (key, value) => fixture.storage.set(key, value) },
    location: { hash: "" },
    MutationObserver: fixture.MutationObserver,
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    HTMLDialogElement: class {}, HTMLDetailsElement: class {},
    commandMatches, fragmentId, interfaceDate, interfaceLanguage, languageToggleLabel,
  });
  for (const language of ["en", "zh"]) {
    fixture.toggle.listeners.get("click")();
    fixture.observer().callback();
    assert.equal(fixture.root.dataset.lang, language);
    assert.equal(fixture.storage.get("alpaca-lang"), language);
    for (const element of [fixture.volume, fixture.time]) {
      assert.equal(element.textContent, element.getAttribute(`data-workspace-${language}`));
    }
    assert.equal(fixture.wrapper.getAttribute("title"), fixture.wrapper.getAttribute(`data-workspace-title-${language}`));
  }
});
