import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { commandMatches, fragmentId } from "../public/workspace-state.js";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("quick navigation search normalizes case, full-width text and Unicode", () => {
  const text = "MuJoCo ROS2 机器人规划 PyTorch café";
  for (const query of ["mujoco", "ＲＯＳ２", "规划", "ＰＹＴＯＲＣＨ", "cafe\u0301"]) {
    assert.equal(commandMatches(text, query), true, query);
  }
  assert.equal(commandMatches(text, "missing"), false);
});

test("quick navigation combines every whitespace-separated word with AND", () => {
  const text = "PyTorch datasets DataLoader 学习记录";
  assert.equal(commandMatches(text, "pytorch dataloader"), true);
  assert.equal(commandMatches(text, " 学习\n\tＤＡＴＡＬＯＡＤＥＲ "), true);
  assert.equal(commandMatches(text, "pytorch unknown"), false);
  assert.equal(commandMatches(text, "pytorch 学习 unknown"), false);
});

test("empty quick navigation queries retain every destination without interpreting markup", () => {
  for (const query of [undefined, "", " \n\t ", "\u3000"]) {
    assert.equal(commandMatches("Projects & notes", query), true);
    assert.equal(commandMatches("", query), true);
  }
  assert.equal(commandMatches("", "projects"), false);
  assert.equal(commandMatches("Projects <script> notes", "<script>"), true);
  assert.equal(commandMatches("Projects & notes", "[projects]"), false);
});

test("fragment decoding preserves native IDs and decodes exactly once", () => {
  assert.equal(fragmentId("#projects"), "projects");
  assert.equal(fragmentId("#planning-project"), "planning-project");
  assert.equal(fragmentId("#%E4%BB%8A%E5%A4%A9%E7%9A%84%E7%9B%AE%E6%A0%87"), "今天的目标");
  assert.equal(fragmentId("#section%20one"), "section one");
  assert.equal(fragmentId("#%2520"), "%20");
  assert.equal(fragmentId("#x+y"), "x+y");
});

test("empty or malformed fragments cannot throw during bookmarked-section recovery", () => {
  for (const hash of ["", "#", "#%", "#%2", "#%GG", "#%E0%A4%A", undefined, null]) {
    assert.equal(fragmentId(hash), "", String(hash));
  }
});

test("homepage preserves every legacy section and native in-page targets exactly once", async () => {
  const homepage = await read("src/pages/index.astro");
  const legacy = await read("index.html");
  const sectionCalls = [...homepage.matchAll(/\bsection\("([^"]+)"\)/g)].map(([, id]) => id);
  assert.deepEqual(new Set(sectionCalls), new Set(["projects", "profile", "experience", "objective", "about", "cpd", "notes"]));
  const preserved = sectionCalls.map((id) => {
    const match = legacy.match(new RegExp(`<section\\b[^>]*\\bid="${id}"[^>]*>[\\s\\S]*?<\\/section>`));
    assert.ok(match, `Legacy section #${id} must exist`);
    return match[0];
  }).join("\n");
  // Literal homepage IDs include the two IDs inserted into project markup.
  const identifiers = [...`${homepage}\n${preserved}`.matchAll(/\bid="([^"$]+)"/g)].map(([, id]) => id);
  assert.equal(new Set(identifiers).size, identifiers.length, "Homepage IDs must stay unique");
  for (const id of ["projects", "experience", "posts", "profile", "objective", "about", "cpd", "notes", "planning-project", "navigation-project"]) {
    assert.ok(identifiers.includes(id), `Preserve direct links to #${id}`);
  }
  for (const [, fragment] of homepage.matchAll(/\bhref="#([^"]+)"/g)) {
    assert.ok(identifiers.includes(fragment), `Native homepage link #${fragment} needs a real target`);
  }
});

test("homepage and command menu link to real project evidence and the unified writing source", async () => {
  const homepage = await read("src/pages/index.astro");
  const legacy = await read("index.html");
  const tools = await read("src/components/WorkspaceTools.astro");
  assert.match(legacy, /href="https:\/\/github\.com\/AlphaApaca\/flexplan-mujoco-dissertation"/);
  assert.match(legacy, /href="https:\/\/github\.com\/allanbissac\/V\.I\.S\.O\.R\."/);
  assert.match(homepage, /getWritingPosts\(\)/);
  assert.match(homepage, /href=\{post\.url\}/);
  assert.match(tools, /getWritingPosts\(\)/);
  assert.match(tools, /href=\{post\.url\}/);
  for (const url of ["/#projects", "/#experience", "/writing/", "/about/"]) {
    assert.ok(tools.includes(`url: "${url}"`), `Command destination ${url} must remain a real route`);
  }
  assert.doesNotMatch(`${homepage}\n${tools}`, /(?:href|url)\s*[:=]\s*["']\/projects\//, "Prototype topic labels must not become nonexistent routes");
  assert.match(homepage, /<details\b[^>]*class="workspace-notebook"/);
  assert.match(homepage, /<details\b[^>]*class="workspace-project-detail"/);
});

test("visual enhancements retain publishing, provenance, reader and progressive command contracts", async () => {
  const schema = await read("src/content.config.ts");
  const content = await read("src/lib/content.ts");
  const layout = await read("src/layouts/BaseLayout.astro");
  const header = await read("src/components/SiteHeader.astro");
  const article = await read("src/layouts/ArticleLayout.astro");
  assert.match(schema, /publish:\s*z\.boolean\(\)\.default\(false\)/);
  assert.match(content, /getCollection\("posts",\s*\(\{ data \}\)\s*=>\s*data\.publish\)/);
  for (const key of ["sourceRepo", "sourcePath", "sourceUrl", "sourceCommit"]) {
    assert.match(schema, new RegExp(`\\b${key}:`));
  }
  assert.match(article, /<ArticleReader headings=\{headings\} lang=\{lang\}/);
  assert.match(article, /<GiscusComments term=\{commentTerm\} lang=\{lang\}/);
  assert.match(article, /href=\{sourceUrl\}/);
  assert.match(layout, /<script\b[^>]*type="module"[^>]*src="\/workspace\.js"/);
  const trigger = header.match(/<button\b[^>]*class="workspace-command-trigger"[^>]*>/)?.[0];
  assert.ok(trigger);
  assert.match(trigger, /\bhidden\b/, "Quick navigation must remain hidden until its dialog enhancement is available");
  assert.match(header, /<header class="site-header">/);
  assert.match(header, /class="icon-button theme-toggle"/);
  assert.equal(await read("public/script.js"), await read("script.js"), "Legacy bridge copies must stay synchronized");
});
