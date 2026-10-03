import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const retiredArticles = ["build-personal-blog", "choose-stack", "notes-system"];

test("the three retired demo articles have no source or publicly served HTML copies", async () => {
  for (const name of retiredArticles) {
    for (const prefix of ["articles", "public/articles"]) {
      await assert.rejects(access(new URL(`${prefix}/${name}.html`, root)), { code: "ENOENT" });
    }
  }
  await assert.rejects(access(new URL("src/data/legacy-posts.mjs", root)), { code: "ENOENT" });
});

test("the writing collection contains only explicitly published Markdown, without a demo append", async () => {
  const source = await read("src/lib/content.ts");
  assert.match(source, /getCollection\("posts",\s*\(\{ data \}\) => data\.publish\)/);
  assert.match(source, /const posts = await getPublishedPosts\(\)/);
  assert.match(source, /url: postPath\(data\.permalink\)/);
  assert.doesNotMatch(source, /LEGACY_POSTS|legacy-posts|entries\.push|kind:\s*"legacy"/);
  for (const name of retiredArticles) assert.doesNotMatch(source, new RegExp(name));
});

test("homepage cards and index mappings cannot reintroduce the retired demo routes", async () => {
  for (const path of ["index.html", "src/pages/index.astro"]) {
    const homepage = await read(path);
    for (const name of retiredArticles) assert.doesNotMatch(homepage, new RegExp(`articles/${name}\\.html`), path);
  }
});
