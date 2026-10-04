import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { firstPaintScript } from "../src/lib/first-paint.mjs";

// A parser/MutationObserver fixture, not a visual browser substitute. It runs
// the exact shipped inline script while every external module remains absent.
const dataName = (key) => `data-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
class Element {
  constructor(document, tag, attributes = {}, text = "") {
    this.document = document; this.tagName = tag; this.nodeType = 1;
    this.attributes = new Map(Object.entries(attributes)); this.children = []; this._text = text;
    this.disabled = false; this.hidden = this.hasAttribute("hidden"); this.value = attributes.value ?? "";
    this.dataset = new Proxy({}, {
      get: (_, key) => this.getAttribute(dataName(key)) ?? undefined,
      set: (_, key, value) => { this.setAttribute(dataName(key), value); return true; },
    });
  }
  get id() { return this.getAttribute("id"); }
  get name() { return this.getAttribute("name"); }
  get lang() { return this.getAttribute("lang"); }
  set lang(value) { this.setAttribute("lang", value); }
  get options() { return this.children.filter((child) => child.tagName === "option"); }
  get textContent() { return this._text + this.children.map((child) => child.textContent).join(""); }
  set textContent(value) {
    this.children = []; this._text = value;
    this.document.queue(this, [{ nodeType: 3, parentElement: this }]);
  }
  getAttribute(key) { return this.attributes.get(key) ?? null; }
  hasAttribute(key) { return this.attributes.has(key); }
  setAttribute(key, value) { this.attributes.set(key, String(value)); }
  removeAttribute(key) { this.attributes.delete(key); }
  append(child) { child.parentElement = this; this.children.push(child); this.document.queue(this, [child]); }
  remove() { this.parentElement.children = this.parentElement.children.filter((node) => node !== this); this.document.queue(this.parentElement, []); }
  matches(selector) {
    return selector.split(",").some((item) => {
      let rest = item.trim();
      const tag = rest.match(/^[a-z][\w-]*/)?.[0];
      if (tag) { if (tag !== this.tagName) return false; rest = rest.slice(tag.length); }
      for (const match of rest.matchAll(/([.#])([\w-]+)|\[([^\]=]+)(?:=([^\]]+))?\]/g)) {
        const [, prefix, key, name, value] = match;
        if (prefix === "#" && this.id !== key) return false;
        if (prefix === "." && !(this.getAttribute("class") ?? "").split(" ").includes(key)) return false;
        if (name && (!this.hasAttribute(name) || (value !== undefined && this.getAttribute(name) !== value.replace(/^['"]|['"]$/g, "")))) return false;
      }
      return true;
    });
  }
  closest(selector) { for (let node = this; node; node = node.parentElement) if (node.matches(selector)) return node; return null; }
  querySelectorAll(selector) { return this.children.flatMap((child) => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
}
function fixture({ language = "en", theme, storageBlocked = false, search = "", writingManifest = [] } = {}) {
  const listeners = new Map(); const records = [];
  let observer;
  const document = {
    readyState: "loading", title: "中文初始标题",
    queue(target, addedNodes) { if (observer?.active) records.push({ target, addedNodes }); },
    querySelector(selector) { return this.documentElement.querySelector(selector); },
    createElement(tag) { return new Element(this, tag); },
    addEventListener(type, listener) { listeners.set(type, listener); },
    removeEventListener(type) { listeners.delete(type); },
    finish() { this.readyState = "interactive"; listeners.get("readystatechange")?.(); },
    flush() {
      for (let iterations = 0; records.length && observer?.active; iterations++) {
        assert.ok(iterations < 30, "bootstrap must settle instead of looping on its own mutations");
        observer.callback(records.splice(0));
      }
      records.length = 0;
    },
  };
  const root = new Element(document, "html", { lang: "zh-CN", "data-page-title-zh": "中文标题", "data-page-title-en": "English title" });
  document.documentElement = root;
  class MutationObserver {
    constructor(callback) { this.callback = callback; observer = this; }
    observe(_, options) { this.active = true; this.options = options; }
    disconnect() { this.active = false; }
  }
  const storage = { getItem(key) { if (storageBlocked) throw new Error("blocked"); return key === "alpaca-lang" ? language : theme ?? null; } };
  vm.runInNewContext(firstPaintScript({ writingManifest }), {
    document, localStorage: storage, window: { matchMedia: () => ({ matches: true }) }, MutationObserver,
    location: { search }, URLSearchParams,
  });
  const append = (tag, attrs, text, parent = root) => { const node = new Element(document, tag, attrs, text); parent.append(node); document.flush(); return node; };
  return { document, root, append, get observer() { return observer; } };
}

for (const language of ["zh", "en"]) {
  test(`saved ${language} is applied to streamed chrome and content before external modules exist`, () => {
    const { document, root, append, observer } = fixture({ language });
    assert.equal(root.dataset.lang, language);
    assert.equal(root.lang, language === "zh" ? "zh-CN" : "en");
    const link = append("a", { "data-workspace-zh": "文章", "data-workspace-en": "Writing" }, "Writing");
    const heading = append("h1", { "data-workspace-zh": "关于我", "data-workspace-en": "About me" }, "关于我");
    const toggle = append("button", { class: "lang-toggle", hidden: "" }, "中文");
    const meta = append("meta", { "data-localized-zh": "中文描述", "data-localized-en": "English description", content: "中文描述" });
    const field = append("input", { "data-workspace-placeholder-zh": "搜索文章", "data-workspace-placeholder-en": "Search writing" });
    assert.equal(link.textContent, language === "zh" ? "文章" : "Writing");
    assert.equal(heading.textContent, language === "zh" ? "关于我" : "About me");
    assert.equal(toggle.textContent, language === "zh" ? "EN" : "中文");
    assert.equal(toggle.hidden, false);
    assert.equal(toggle.disabled, true, "a visible button is enabled only once its click handler exists");
    assert.equal(meta.getAttribute("content"), language === "zh" ? "中文描述" : "English description");
    assert.equal(field.getAttribute("placeholder"), language === "zh" ? "搜索文章" : "Search writing");
    assert.equal(document.title, language === "zh" ? "中文标题" : "English title");
    // A later parser text chunk must not reintroduce the server's initial text.
    link._text += "Writing";
    assert.equal(observer.options.characterData, true, "parser can append characters to an existing Text node");
    document.queue({ nodeType: 3, parentElement: link }, []);
    document.flush();
    assert.equal(link.textContent, language === "zh" ? "文章" : "Writing");
  });
}

test("blocked or absent preference storage uses English and the system theme without throwing", () => {
  for (const options of [{ storageBlocked: true }, { language: null }, { language: "invalid" }]) {
    const { root } = fixture(options);
    assert.equal(root.dataset.lang, "en");
    assert.equal(root.dataset.theme, "dark");
  }
  assert.equal(fixture({ theme: "light" }).root.dataset.theme, "light");
});

test("bootstrap stops at parser completion before interactive modules can change user state", () => {
  const { document, root, append, observer } = fixture();
  const heading = append("h1", { "data-workspace-zh": "中文", "data-workspace-en": "English" }, "中文");
  document.finish();
  assert.equal(observer.active, false);
  root.dataset.lang = "zh";
  heading.textContent = "新的中文";
  document.flush();
  assert.equal(heading.textContent, "新的中文");
});

test("article author content and executable/style sources are never rewritten", () => {
  const { append } = fixture();
  const article = append("article", { class: "article-content", lang: "zh-CN" });
  const body = append("p", { "data-workspace-zh": "原文", "data-workspace-en": "Do not translate" }, "原文", article);
  const script = append("script", { "data-workspace-zh": "bad", "data-workspace-en": "bad" }, "original code");
  const style = append("style", { "data-workspace-zh": "bad", "data-workspace-en": "bad" }, "original style");
  const invalidDate = append("time", { "data-interface-date": "", datetime: "2026-02-30" }, "2026-02-30");
  const date = append("time", { "data-interface-date": "", datetime: "2026-10-02" }, "2026-10-02");
  assert.equal(body.textContent, "原文");
  assert.equal(script.textContent, "original code");
  assert.equal(style.textContent, "original style");
  assert.equal(invalidDate.textContent, "2026-02-30");
  assert.equal(date.textContent, "October 2, 2026");
});

test("URL filters, matching cards and canonical tag selection appear before archive enhancement", () => {
  const writingManifest = [
    { category: "note", tags: ["PyTorch"], searchText: "Datasets PyTorch" },
    { category: "learning-log", tags: ["Python"], searchText: "Setup Python" },
  ];
  const { append, document } = fixture({ search: "?category=note&tag=pytorch&q=Datasets", writingManifest });
  const main = append("main", { "data-writing-index": "" });
  const search = append("input", { name: "q" }, "", main);
  const category = append("input", { name: "category" }, "", main);
  const select = append("select", { id: "writingTag" }, "", main);
  append("option", { value: "" }, "All tags", select);
  append("option", { value: "PyTorch" }, "PyTorch", select);
  const cards = writingManifest.map((post) => append("article", { "data-writing-post": "", "data-category": post.category, "data-tags": JSON.stringify(post.tags), "data-search": post.searchText }, "authored title", main));
  const results = append("p", { id: "writingResults" }, "共2篇", main);
  const empty = append("div", { id: "writingEmpty", hidden: "" }, "", main);
  document.finish();
  assert.equal(search.value, "Datasets");
  assert.equal(category.value, "note");
  assert.equal(select.value, "PyTorch");
  assert.equal(select.querySelectorAll("[data-transient]").length, 0);
  assert.deepEqual(cards.map((card) => card.hidden), [false, true]);
  assert.equal(results.textContent, "Showing 1 of 2 articles");
  assert.equal(empty.hidden, true);
});

test("unknown tags remain selected safely with no all-articles flash", () => {
  const value = '<script>alert("x")</script>';
  const { append, document } = fixture({ search: `?tag=${encodeURIComponent(value)}`, writingManifest: [{ category: "note", tags: ["PyTorch"], searchText: "datasets" }] });
  const select = append("select", { id: "writingTag" });
  append("option", { value: "" }, "All tags", select);
  const results = append("p", { id: "writingResults" });
  const empty = append("div", { id: "writingEmpty", hidden: "" });
  document.finish();
  assert.equal(select.value, value);
  assert.equal(select.querySelectorAll("[data-transient]").length, 1);
  assert.equal(select.querySelector("[data-transient]").textContent, `${value} (not indexed)`);
  assert.equal(results.textContent, "Showing 0 of 1 article");
  assert.equal(empty.hidden, false);
});

test("serialized metadata cannot terminate the inline script or add a network dependency", () => {
  const script = firstPaintScript({ writingManifest: [{ category: "note", tags: ["</script>"], searchText: "</script><script>injected()</script>" }] });
  assert.doesNotMatch(script, /<\/script>|\bimport\b|fetch\(|setTimeout\(|requestAnimationFrame\(|document\.body\.(?:hidden|style)/);
  assert.match(script, /\\u003c\/script>/);
});
