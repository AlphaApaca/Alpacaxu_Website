import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { evidenceCopy, evidenceMarkup } from "../src/lib/evidence-copy.mjs";

test("home evidence is compiled into the shared bilingual attributes, without executing the old client", async () => {
  const [source, document] = await Promise.all(["public/script.js", "index.html"].map((path) => readFile(new URL(`../${path}`, import.meta.url), "utf8")));
  const evidence = document.match(/<section\b[^>]*id="projects"[\s\S]*?<\/section>/)[0];
  const dictionary = evidenceCopy(source, evidence);
  const enriched = evidenceMarkup(source, evidence);
  assert.equal((enriched.match(/\bdata-workspace-(?:alt-|aria-)?zh=/g) ?? []).length, (evidence.match(/\bdata-i18n(?:-alt|-aria-label)?=/g) ?? []).length);
  assert.ok(enriched.includes(dictionary.en["home.projects.heading"]));
  assert.ok(enriched.includes(dictionary.zh["home.projects.heading"]));
  assert.match(enriched, /data-i18n-alt="home.projects.leo.imageAlt"[^>]*data-workspace-alt-zh=/);
  assert.match(enriched, /href="https:\/\/github.com\/allanbissac\/V\.I\.S\.O\.R\."/);
});

test("only referenced static translation values are read; expressions cannot execute at build time", () => {
  const source = 'const translations = { zh: { key: "甲", unused: "unused" }, en: { key: "A", unused: "unused" } }; throw new Error("must not run");';
  assert.deepEqual(evidenceCopy(source, '<p data-i18n="key">A</p>'), { zh: { key: "甲" }, en: { key: "A" } });
  assert.throws(() => evidenceCopy('const translations = runCode();', ""), /static strings/);
  assert.throws(() => evidenceCopy('const translations = { [runCode()]: "A" };', ""), /computed properties/);
  assert.throws(() => evidenceCopy(source, '<p data-i18n="missing"></p>'), /Missing evidence copy/);
  assert.throws(() => evidenceMarkup(source, '<p data-i18n-html="key"></p>'), /text-only bilingual leaf nodes/);
});

test("attribute copy is escaped without changing nested markup, links, or authored content", () => {
  const source = `const translations = { zh: { key: '甲 & "乙" <tag>' }, en: { key: 'A & "B" > C' } };`;
  const markup = '<div><a data-i18n="key" href="/?a=1&amp;b=2">A</a><p>Original body</p><img data-i18n-alt="key" /></div>';
  const result = evidenceMarkup(source, markup);
  assert.match(result, /data-workspace-en="A &amp; &quot;B&quot; &gt; C"/);
  assert.match(result, /data-workspace-alt-zh="甲 &amp; &quot;乙&quot; &lt;tag&gt;"/);
  assert.match(result, /<img[^>]+ \/>/);
  assert.ok(result.includes('href="/?a=1&amp;b=2"'));
  assert.ok(result.includes("<p>Original body</p>"));
});
