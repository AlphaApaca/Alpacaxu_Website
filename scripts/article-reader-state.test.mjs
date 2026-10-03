import assert from "node:assert/strict";
import test from "node:test";
import { activeHeadingIndex, readingProgress } from "../public/article-reader-state.js";

const article = { viewportHeight: 800, articleTop: 400, articleBottom: 2400, readingOffset: 100 };

test("reading progress runs from正文开始to正文底部, excluding comments", () => {
  assert.equal(readingProgress({ ...article, scrollY: 0 }), 0);
  assert.equal(readingProgress({ ...article, scrollY: 300 }), 0);
  assert.equal(readingProgress({ ...article, scrollY: 950 }), 50);
  assert.equal(readingProgress({ ...article, scrollY: 1600 }), 100);
  assert.equal(readingProgress({ ...article, scrollY: 4000 }), 100);
});

test("a short article finishes only when its bottom is visible", () => {
  const short = { ...article, articleTop: 500, articleBottom: 900 };
  assert.equal(readingProgress({ ...short, scrollY: 0 }), 0);
  assert.equal(readingProgress({ ...short, scrollY: 100 }), 100);
});

test("progress adapts to viewport and mobile sticky reader", () => {
  assert.equal(readingProgress({ ...article, viewportHeight: 600, readingOffset: 180, scrollY: 1010 }), 50);
  assert.equal(readingProgress({ ...article, viewportHeight: 600, readingOffset: 180, scrollY: 1800 }), 100);
});

test("invalid and empty geometry cannot generate NaN or negative progress", () => {
  for (const changes of [{ articleBottom: 400 }, { viewportHeight: 0 }, { scrollY: NaN }, { readingOffset: Infinity }]) {
    assert.equal(readingProgress({ ...article, scrollY: 300, ...changes }), 0);
  }
});

test("current section handles the first heading, nested headings and reverse scroll", () => {
  const positions = [400, 700, 1100, 1500];
  assert.equal(activeHeadingIndex(positions, 100), 0);
  assert.equal(activeHeadingIndex(positions, 700), 1);
  assert.equal(activeHeadingIndex(positions, 1101), 2);
  assert.equal(activeHeadingIndex(positions, 2000), 3);
  assert.equal(activeHeadingIndex(positions, 500), 0);
  assert.equal(activeHeadingIndex([], 100), -1);
  assert.equal(activeHeadingIndex(positions, NaN), -1);
});

test("the last section highlights at document bottom even when a short page cannot scroll further", () => {
  assert.equal(activeHeadingIndex([380, 560], 180), 0);
  assert.equal(activeHeadingIndex([380, 560], 180, { atDocumentEnd: true }), 1);
  assert.equal(activeHeadingIndex([], 180, { atDocumentEnd: true }), -1);
});

test("a fully visible short page honors its native hash selection without any scroll", () => {
  assert.equal(activeHeadingIndex([380, 560], 84, { selectedIndex: 1 }), 1);
  assert.equal(activeHeadingIndex([380, 560], 84, { selectedIndex: 0 }), 0);
  assert.equal(activeHeadingIndex([380, 560], 84, { selectedIndex: 9 }), 0);
});
