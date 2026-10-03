import assert from "node:assert/strict";
import test from "node:test";
import { assertUniqueWritingPaths, categoryLabel, matchesWriting, normalizeSearch, readWritingFilters, sortWriting, writingFilterUrl, writingSearchText } from "../src/lib/writing.mjs";

const post = {
  category: "learning-log", tags: ["PyTorch", "DataLoader", "中文标签"],
  searchText: "Dataset & DataLoader 中英混写 PyTorch 理解数据加载",
};

test("keyword search handles Chinese, mixed case, full-width characters and multi-word AND", () => {
  for (const q of ["", " 数据加载 ", "ＰＹＴＯＲＣＨ", "DATASET pytorch", "pytorch\nDataLoader"]) {
    assert.equal(matchesWriting(post, { q }), true, q);
  }
  assert.equal(matchesWriting(post, { q: "PyTorch missing" }), false);
  assert.equal(normalizeSearch(" Ａ  Ｂ "), "a b");
});

test("category and exact tag combine with search without matching partial tags", () => {
  assert.equal(matchesWriting(post, { category: "learning-log", tag: "pytorch", q: "理解" }), true);
  assert.equal(matchesWriting(post, { category: "essay" }), false);
  assert.equal(matchesWriting(post, { tag: "Torch" }), false);
  assert.equal(matchesWriting(post, { tag: "中文标签", q: "not in article" }), false);
  assert.equal(matchesWriting(post, { category: "unknown", tag: "unknown" }), false);
});

test("published Markdown search includes its title, summary, readable category and tags", () => {
  const article = {
    title: "2026-10-02 · Datasets & DataLoaders",
    summary: "理解 Dataset 与 DataLoader 的职责，并完成 FashionMNIST 数据加载练习。",
    category: "learning-log",
    tags: ["PyTorch", "DataLoader"],
  };
  const indexed = { ...article, searchText: writingSearchText(article) };
  for (const q of [article.title, "职责", "FashionMNIST", "学习日志", "Learning Log", ...article.tags]) {
    assert.equal(matchesWriting(indexed, { q }), true, q);
  }
  assert.equal(matchesWriting(indexed, { q: "retired demo" }), false);
});

test("query state round-trips Chinese, spaces, punctuation without HTML or URL injection", () => {
  const state = { q: "数据 & <script>", category: "essay", tag: "C++ / 技术" };
  const url = writingFilterUrl(state);
  assert.equal(url.startsWith("/writing/?"), true);
  assert.equal(url.includes("<script>"), false);
  assert.deepEqual(readWritingFilters(new URL(url, "https://example.com").search), state);
  assert.equal(writingFilterUrl(), "/writing/");
  assert.deepEqual(readWritingFilters("?utm_source=test"), { q: "", category: "", tag: "" });
});

test("published writing sorts newest first with deterministic URL tie-breaks", () => {
  const posts = [
    { url: "/writing/z-note/", date: "2026-10-02" },
    { url: "/writing/earlier/", date: "2026-10-01" },
    { url: "/writing/latest/", date: "2026-10-02" },
  ];
  assert.deepEqual(sortWriting(posts).map((post) => post.url), ["/writing/latest/", "/writing/z-note/", "/writing/earlier/"]);
  assert.equal(posts[0].url, "/writing/z-note/", "Sorting must not mutate the caller's list");
});

test("duplicate published URLs fail instead of silently shadowing a synced article", () => {
  assertUniqueWritingPaths([{ url: "/writing/one/" }, { url: "/writing/two/" }]);
  assert.throws(() => assertUniqueWritingPaths([{ url: "/writing/one/" }, { url: "/writing/one/" }]), /Duplicate published article URL/);
});

test("known and future custom categories retain readable labels", () => {
  assert.match(categoryLabel("note"), /技术笔记/);
  assert.match(categoryLabel("essay"), /杂文/);
  assert.equal(categoryLabel("robotics"), "robotics");
  assert.equal(categoryLabel("constructor"), "constructor");
  assert.equal(categoryLabel("toString"), "toString");
});
