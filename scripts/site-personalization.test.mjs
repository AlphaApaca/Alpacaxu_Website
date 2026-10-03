import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";
import { homeCopy, site } from "../src/data/site.mjs";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("editable homepage copy has two independent languages and a complete public identity", () => {
  assert.equal(site.name, "Alpaca");
  assert.match(site.avatar, /^\/assets\//);
  for (const language of ["zh", "en"]) {
    const copy = homeCopy[language];
    assert.equal(copy.heading.length, 2);
    for (const value of [copy.title, copy.description, copy.intro, ...copy.heading]) {
      assert.equal(typeof value, "string");
      assert.ok(value.trim());
    }
  }
});

test("homepage layout reads opening copy and localized metadata from the editable file", async () => {
  const page = await read("src/pages/index.astro");
  assert.match(page, /import \{ homeCopy \} from "\.\.\/data\/site\.mjs"/);
  assert.match(page, /localizedMeta=\{homeCopy\}/);
  for (const value of ["homeCopy.zh.heading[0]", "homeCopy.en.heading[1]", "homeCopy.zh.intro", "homeCopy.en.intro"]) {
    assert.ok(page.includes(value));
  }
  const script = await read("public/script.js");
  assert.match(script, /data-page-title-\$\{language\}/);
  assert.match(script, /data-localized-\$\{language\}/);
});

test("shared pages and translation bridge do not expose the real name or initials", async () => {
  for (const path of [
    "src/data/site.mjs", "src/components/SiteHeader.astro", "src/components/SiteFooter.astro",
    "src/pages/index.astro", "src/pages/about.astro", "src/pages/writing/index.astro", "src/pages/404.astro",
    "src/layouts/ArticleLayout.astro", "index.html", "public/script.js", "script.js",
    "public/favicon.svg", "favicon.svg",
  ]) {
    assert.doesNotMatch(await read(path), /Mingyang\s+Xu|许明阳|>MX</, path);
  }
  assert.doesNotMatch(await read("src/components/SiteFooter.astro"), />mingyang[^<]+</);
});

test("cartoon avatar is a small explicit-size decorative image inside the home link", async () => {
  const header = await read("src/components/SiteHeader.astro");
  assert.match(header, /<img class="brand-avatar" src=\{site\.avatar\} alt="" width="40" height="40"/);
  assert.ok((await stat(new URL(`../public${site.avatar}`, import.meta.url))).size < 100_000);
});

test("appearance initializes in the head and native navigation remains progressive", async () => {
  const layout = await read("src/layouts/BaseLayout.astro");
  const head = layout.match(/<head>[\s\S]*?<\/head>/)?.[0];
  assert.ok(head);
  assert.match(head, /localStorage\.getItem\("alpaca-theme"\)/);
  assert.ok(head.indexOf('localStorage.getItem("alpaca-theme")') < head.indexOf('href="/styles.css"'));
  assert.doesNotMatch(layout, /ClientRouter|astro:transitions/);
  const config = await read("astro.config.mjs");
  assert.match(config, /prefetchAll:\s*false/);
  assert.match(config, /defaultStrategy:\s*"hover"/);
  const css = await read("public/workspace.css");
  assert.match(css, /@view-transition\s*\{\s*navigation:\s*auto/);
  assert.match(css, /animation-duration:\s*150ms/);
  const reducedMotion = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
  assert.match(reducedMotion, /@view-transition\s*\{\s*navigation:\s*none/);
});
