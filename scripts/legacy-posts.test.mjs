import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { LEGACY_POSTS } from "../src/data/legacy-posts.mjs";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const articleNames = ["build-personal-blog", "choose-stack", "notes-system"];

test("legacy index preserves exactly the three original article URLs without invented dates", () => {
  assert.deepEqual(LEGACY_POSTS.map((post) => post.url), articleNames.map((name) => `/articles/${name}.html`));
  assert.equal(new Set(LEGACY_POSTS.map((post) => post.url)).size, 3);
  for (const post of LEGACY_POSTS) {
    assert.equal(post.category, "note");
    assert.equal(post.date, null);
    assert.equal(typeof post.searchText, "string");
    assert.ok(post.searchText.length > 0);
  }
});

test("legacy metadata comes from the original HTML and existing homepage tags", async () => {
  const homepage = await read("index.html");
  const englishTranslations = (await read("public/script.js")).split("\n  en: {")[1];
  for (const post of LEGACY_POSTS) {
    const html = await read(post.url.slice(1));
    const servedHtml = await read(`public${post.url}`);
    assert.equal(servedHtml, html, `${post.url}: public and original copies must match`);
    assert.equal(html.match(/<h1\b[^>]*>([^<]+)<\/h1>/)?.[1], post.title);
    assert.equal(html.match(/<p class="article-lead"[^>]*>([^<]+)<\/p>/)?.[1], post.summary);
    const card = [...homepage.matchAll(/<article class="post-card"[^>]*>[\s\S]*?<\/article>/g)]
      .find((match) => match[0].includes(`href="${post.url.slice(1)}"`))?.[0];
    assert.ok(card, `The homepage must reference ${post.url}`);
    const tagsHtml = card.match(/<div class="tags">([\s\S]*?)<\/div>/)?.[1];
    assert.ok(tagsHtml, `The homepage card must retain tags for ${post.url}`);
    assert.deepEqual([...tagsHtml.matchAll(/<(span|a)\b[^>]*>([^<]+)<\/\1>/g)].map((match) => match[2]), post.tags);
    const translationKey = html.match(/data-page="([^"]+)"/)?.[1];
    for (const suffix of ["title", "lead"]) {
      const text = englishTranslations.match(new RegExp(`"${translationKey}\\.${suffix}": "([^"]+)"`))?.[1];
      assert.ok(text, `${translationKey}.${suffix} must exist in the original English translations`);
      assert.ok(post.searchText.includes(text), `${post.url} must be searchable by its original English ${suffix}`);
    }
    const originalKeywords = card.match(/data-search="([^"]+)"/)?.[1];
    assert.ok(originalKeywords && post.searchText.includes(originalKeywords));
  }
});

test("legacy article navigation reaches the unified writing index and current homepage sections", async () => {
  for (const post of LEGACY_POSTS) {
    for (const prefix of ["", "public"]) {
      const html = await read(`${prefix}${post.url}`.replace(/^\//, ""));
      assert.match(html, /<a class="brand" href="\/"/);
      const nav = html.match(/<nav class="nav-links"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
      assert.ok(nav);
      assert.deepEqual([...nav.matchAll(/href="([^"]+)"/g)].map((match) => match[1]), ["/#projects", "/#experience", "/writing/", "/about/"]);
      assert.match(nav, /href="\/#experience" data-i18n="nav\.experience"/);
      assert.match(html, /<link rel="stylesheet" href="\.\.\/styles\.css">/);
      assert.match(html, /<script src="\.\.\/script\.js"><\/script>/);
    }
  }
});
