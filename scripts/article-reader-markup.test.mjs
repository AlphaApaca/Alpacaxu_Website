import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const originalArticles = [
  {
    name: "build-personal-blog",
    key: "articleBuild",
    body: [
      ["h2", "h2a", "先说明方向与边界"],
      ["p", "p1", "首页应让访问者快速看清我已完成的 MuJoCo 规划评测和 ROS2 导航工作，也分清我仍在学习的 Robot Learning 方向。"],
      ["h2", "h2b", "再展开项目证据"],
      ["p", "p2", "每个项目都应交代问题、方法、个人贡献和评测结果；没有可访问的仓库或报告时，不放占位链接。"],
      ["h2", "h2c", "持续记录限制与反思"],
      ["p", "p3", "例如，规划可行性评测不能替代策略训练，团队机器人系统的结果也不能写成个人独立完成。明确边界能让工程证据更可信。"],
      ["h2", "h2d", "保持易维护"],
      ["p", "p4", "当前版本是轻量静态站。内容多起来后，再考虑用 Markdown/MDX 管理项目与文章。"],
    ],
  },
  {
    name: "choose-stack",
    key: "articleStack",
    body: [
      ["h2", "h2a", "适合 Astro 的情况"],
      ["p", "p1", "如果网站以文章、项目展示和静态页面为主，Astro 很合适。它默认输出更轻，Markdown 内容管理也自然。"],
      ["h2", "h2b", "适合 Next.js 的情况"],
      ["p", "p2", "如果你计划加入登录、数据库、后台、复杂交互或产品化能力，Next.js 的扩展空间更大。"],
      ["h2", "h2c", "我的建议"],
      ["p", "p3", "个人作品集第一版优先选择低维护方案。先把项目证据、设计和反思结构跑通，再决定是否需要更重的应用框架。"],
    ],
  },
  {
    name: "notes-system",
    key: "articleNotes",
    body: [
      ["h2", "h2a", "先记录，再整理"],
      ["p", "p1", "不要让分类系统挡在输入之前。一个收集入口和一个每周整理节奏，通常比复杂标签更可靠。"],
      ["h2", "h2b", "公开输出要更小"],
      ["p", "p2", "短笔记可以只回答一个问题、解释一个概念，或记录一次决策。小而完整的输出更容易持续。"],
    ],
  },
];

test("legacy reader markup retains matching public copies and original article URLs", async () => {
  for (const { name } of originalArticles) {
    const original = await read(`articles/${name}.html`);
    assert.equal(await read(`public/articles/${name}.html`), original);
    assert.match(original, /<main class="article-shell article-with-reader">/);
    assert.match(original, /<div class="article-heading">/);
    assert.match(original, /<div class="article-reading-layout">\s*<div class="article-main">/);
    assert.match(original, /<\/article>\s*<\/div>\s*<aside class="article-reader" data-article-reader>/);
  }
});

test("legacy reader uses shared styling, native accessible controls and a deferred module", async () => {
  for (const { name } of originalArticles) {
    const html = await read(`public/articles/${name}.html`);
    assert.match(html, /<link rel="stylesheet" href="\/article-reader\.css">/);
    assert.match(html, /<script src="\.\.\/script\.js"><\/script>\s*<script type="module" src="\/article-reader\.js"><\/script>/);
    assert.match(html, /<details class="article-reader-panel" open>/);
    assert.match(html, /<summary><span data-reader-title>文章目录<\/span>/);
    assert.match(html, /class="reader-percentage" data-reader-value hidden>0%/);
    assert.match(html, /class="reader-progress" data-reader-progress hidden>/);
    assert.match(html, /<progress data-reader-bar max="100" value="0" aria-label="阅读进度"><\/progress>/);
    assert.match(html, /<nav class="reader-toc" data-reader-nav aria-label="文章目录">/);
  }
});

test("every legacy TOC link targets one stable, unique article heading", async () => {
  for (const { name, key } of originalArticles) {
    const html = await read(`public/articles/${name}.html`);
    const article = html.match(/<article class="article-content">([\s\S]*?)<\/article>/)?.[1];
    assert.ok(article);
    const headings = [...article.matchAll(/<h([23])\b([^>]*)>([^<]+)<\/h\1>/g)].map(([, depth, attrs, text]) => ({
      depth,
      id: attrs.match(/\bid="([^"]+)"/)?.[1],
      translation: attrs.match(/\bdata-i18n="([^"]+)"/)?.[1],
      text,
    }));
    assert.ok(headings.length > 0);
    const allIds = [...html.matchAll(/\bid="([^"]*)"/g)].map(([, id]) => id);
    assert.equal(new Set(allIds).size, allIds.length);
    assert.ok(allIds.every((id) => id.length > 0));
    for (const heading of headings) {
      assert.ok(heading.translation.startsWith(`${key}.`));
      assert.equal(heading.id, heading.translation.replaceAll(".", "-"));
    }
    const toc = html.match(/<nav class="reader-toc"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
    assert.ok(toc);
    const links = [...toc.matchAll(/<li class="reader-item" data-depth="([23])"><a data-reader-link href="#([^"]+)">([^<]+)<\/a><\/li>/g)]
      .map(([, depth, id, text]) => ({ depth, id, text }));
    assert.deepEqual(links, headings.map(({ depth, id, text }) => ({ depth, id, text })));
    assert.doesNotMatch(toc, /data-i18n(?:-html)?=/, "Reader labels must follow the translated heading without duplicate translation keys");
  }
});

test("legacy reader preserves the original article headings, paragraphs and translation keys", async () => {
  for (const { name, key, body } of originalArticles) {
    const html = await read(`public/articles/${name}.html`);
    const article = html.match(/<article class="article-content">([\s\S]*?)<\/article>/)?.[1];
    const actual = [...article.matchAll(/<(h[23]|p)\b[^>]*\bdata-i18n(?:-html)?="([^"]+)"[^>]*>([^<]+)<\/\1>/g)]
      .map(([, tag, translation, text]) => [tag, translation, text]);
    assert.deepEqual(actual, body.map(([tag, suffix, text]) => [tag, `${key}.${suffix}`, text]));
    for (const [, suffix] of body) {
      assert.equal(html.match(new RegExp(`data-i18n(?:-html)?="${key}\\.${suffix}"`, "g"))?.length, 1);
    }
  }
});

test("existing Chinese and English article translations remain unchanged", async () => {
  for (const path of ["script.js", "public/script.js"]) {
    const script = await read(path);
    const entries = [...script.matchAll(/"(article(?:Build|Stack|Notes)\.[^"]+)": "([^\n]+)"/g)].map(([, key, value]) => [key, value]);
    assert.equal(entries.length, 60);
    assert.equal(createHash("sha256").update(JSON.stringify(entries)).digest("hex"), "6a9e58df5714696fac8881a57490d055ce17486769881a1cb7f86c57e6e1d3c4");
  }
});
