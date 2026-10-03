import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import matter from "gray-matter";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("published Markdown uses the shared article layout with content and reader in separate columns", async () => {
  const layout = await read("src/layouts/ArticleLayout.astro");
  assert.match(layout, /<link rel="stylesheet" href="\/article-reader\.css"/);
  assert.match(layout, /<main class="article-shell synced-article article-with-reader">/);
  assert.match(layout, /<div class="article-reading-layout">\s*<div class="article-main">/);
  assert.match(layout, /<article class="article-content" lang=\{lang\}>\s*<slot \/>\s*<\/article>/);
  assert.match(layout, /<\/div>\s*<ArticleReader headings=\{headings\} lang=\{lang\} \/>/);
});

test("reader provides accessible native controls and hides enhanced progress until JavaScript loads", async () => {
  const reader = await read("src/components/ArticleReader.astro");
  assert.match(reader, /<aside class="article-reader" data-article-reader>/);
  assert.match(reader, /<details class="article-reader-panel" open>/);
  assert.match(reader, /<summary>\s*<span data-reader-title>\{title\}<\/span>/);
  assert.match(reader, /class="reader-percentage" data-reader-value hidden>0%/);
  assert.match(reader, /class="reader-progress" data-reader-progress hidden>/);
  assert.match(reader, /<progress data-reader-bar max="100" value="0" aria-label=\{progressLabel\}>0%<\/progress>/);
  assert.match(reader, /<nav class="reader-toc" data-reader-nav aria-label=\{title\}/);
  assert.match(reader, /<script is:inline type="module" src="\/article-reader\.js"><\/script>/);
});

test("server-rendered Markdown TOC uses Astro's real heading slugs and native hash links", async () => {
  const reader = await read("src/components/ArticleReader.astro");
  assert.match(reader, /headings\.filter\(\(\{ depth \}\) => depth === 2 \|\| depth === 3\)/);
  assert.match(reader, /outline\.map\(\(\{ depth, slug, text \}\)/);
  assert.match(reader, /<li class="reader-item" data-depth=\{depth\}>/);
  assert.match(reader, /<a data-reader-link href=\{`#\$\{slug\}`\}>\{text\}<\/a>/);
  assert.match(reader, /outline\.length === 0 && <p class="reader-empty"/);
  assert.doesNotMatch(reader, /article(?:Build|Stack|Notes)|data-i18n(?:-html)?=/);
});

test("the actual synced Markdown body is rendered, with its headings and stable comment association", async () => {
  const route = await read("src/pages/writing/[...slug].astro");
  assert.match(route, /const \{ Content, headings \} = await render\(post\)/);
  assert.match(route, /headings=\{headings\}/);
  assert.match(route, /commentTerm=\{`\/writing\/\$\{post\.data\.permalink\}\/`\}/);
  assert.match(route, /<Content \/>/);
  const markdown = matter(await read("src/content/posts/repytorch/learning_log/2026-10-02-datasets-and-dataloaders.md"));
  assert.equal(markdown.data.publish, true);
  assert.equal(markdown.data.sourceRepo, "AlphaApaca/repytorch");
  assert.equal(markdown.data.sourcePath, "learning_log/2026-10-02-datasets-and-dataloaders.md");
  const headings = [];
  visit(unified().use(remarkParse).parse(markdown.content), "heading", (node) => headings.push(node));
  assert.ok(headings.some(({ depth }) => depth === 2 || depth === 3), "The real published fixture must exercise a nonempty reader outline");
  assert.ok(headings.every(({ depth }) => depth !== 1), "The layout supplies the sole article title");
});

test("reader enhancement follows actual heading text and safely decodes existing Markdown anchors", async () => {
  const script = await read("public/article-reader.js");
  assert.match(script, /article\.querySelectorAll\("h2, h3"\)/);
  assert.match(script, /decodeURIComponent\(link\.hash\.slice\(1\)\)/);
  assert.match(script, /encodeURIComponent\(heading\.id\)/);
  assert.match(script, /link\.textContent = headings\[index\]\.textContent\.trim\(\)/);
  assert.match(script, /link\.setAttribute\("aria-current", "location"\)/);
  assert.match(script, /bar\.setAttribute\("aria-label", progressLabel\)/);
  assert.match(script, /reader\.querySelector\("\[data-reader-progress\]"\)\.hidden = false/);
});
