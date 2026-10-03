import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";
import matter from "gray-matter";

test("essay template is a legal unpublished example outside the article loader", async () => {
  const template = matter(await readFile(new URL("../docs/essay-template.md", import.meta.url), "utf8"));
  assert.equal(template.data.publish, false);
  assert.equal(template.data.category, "essay");
  assert.match(template.data.permalink, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.equal(typeof template.data.title, "string");
  assert.equal(typeof template.data.summary, "string");
  assert.ok(template.data.title.trim());
  assert.ok(template.data.summary.trim());
  assert.ok(Array.isArray(template.data.tags));
  assert.equal(new Date(`${template.data.date}T00:00:00Z`).toISOString().slice(0, 10), template.data.date);
  assert.equal(Intl.getCanonicalLocales(template.data.lang)[0], "zh-CN");
  assert.doesNotMatch(template.content, /^# /m);
});

test("reserved essay directory exists without publishing a fictional sample or template", async () => {
  const path = new URL("../src/content/posts/essays/", import.meta.url);
  await access(path);
  const entries = await readdir(path);
  assert.ok(entries.includes(".gitkeep"));
  assert.equal(entries.includes("qa-local-essay-fixture.md"), false);
  assert.equal(entries.includes("essay-template.md"), false);
  assert.equal(entries.includes("README.md"), false);
});
