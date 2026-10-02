import assert from "node:assert/strict";
import test from "node:test";

import {
  findLocalPaths,
  isAllowlistedMarkdown,
  markdownProcessor,
  markdownTitle,
  normalizeDate,
  normalizeLanguageTag,
  normalizeSlug,
  removeFirstH1,
  resolveRepoTarget,
  rewriteMarkdownLinks,
  snapshotCommitFromManifest,
  snapshotManifest,
  validateMetadata,
} from "./sync-repytorch.mjs";

const sourcePath = "learning_log/2026-10-02-datasets-and-dataloaders.md";
const commit = "a".repeat(40);
const context = {
  sourcePath,
  commit,
  entriesByPath: new Map([
    ["notes/published.md", { type: "blob" }],
    ["notes/draft.md", { type: "blob" }],
    ["assets/plot.png", { type: "blob" }],
    ["tutorials/example.py", { type: "blob" }],
    ["tutorials", { type: "tree" }],
  ]),
  publishedByPath: new Map([["notes/published.md", { slug: "published-note" }]]),
};

function rewrite(markdown) {
  const tree = markdownProcessor.parse(markdown);
  rewriteMarkdownLinks(tree, context);
  return markdownProcessor.stringify(tree);
}

test("only the approved log and note paths are candidates, never READMEs", () => {
  for (const path of [sourcePath, "notes/example.md", "notes/EXAMPLE.MD"]) {
    assert.equal(isAllowlistedMarkdown(path), true, path);
  }
  for (const path of ["README.md", "notes/README.md", "notes/sub/example.md", "private/example.md", "learning_log/plan.md"]) {
    assert.equal(isAllowlistedMarkdown(path), false, path);
  }
});

test("publication metadata is explicit and comments can be disabled", () => {
  const metadata = {
    publish: true,
    date: "2026-10-02",
    category: "learning-log",
    tags: [" PyTorch ", "DataLoader"],
    summary: " Dataset and DataLoader notes ",
    comments: false,
  };
  assert.deepEqual(validateMetadata(metadata, sourcePath), {
    date: "2026-10-02",
    category: "learning-log",
    tags: ["PyTorch", "DataLoader"],
    summary: "Dataset and DataLoader notes",
    comments: false,
  });
  assert.equal(validateMetadata({ ...metadata, comments: undefined }, sourcePath).comments, true);
  assert.throws(() => validateMetadata({ ...metadata, publish: "true" }, sourcePath), /publish: true/);
  assert.throws(() => validateMetadata({ ...metadata, comments: "false" }, sourcePath), /comments/);
  assert.throws(() => validateMetadata({ ...metadata, tags: "PyTorch" }, sourcePath), /tags/);
  assert.throws(() => validateMetadata({ ...metadata, summary: " " }, sourcePath), /summary/);
});

test("calendar dates and language tags are validated before rendering", () => {
  assert.equal(normalizeDate("2024-02-29", sourcePath), "2024-02-29");
  assert.throws(() => normalizeDate("2026-02-29", sourcePath), /real calendar date/);
  assert.throws(() => normalizeDate("2026-13-02", sourcePath), /real calendar date/);
  assert.equal(normalizeLanguageTag(" zh-cn ", sourcePath), "zh-CN");
  assert.equal(normalizeLanguageTag("en", sourcePath), "en");
  for (const lang of ["zh_CN", "../bad", "", 12]) {
    assert.throws(() => normalizeLanguageTag(lang, sourcePath), /language tag/);
  }
});

test("permalinks use stable ASCII kebab-case", () => {
  assert.equal(normalizeSlug(undefined, sourcePath), "2026-10-02-datasets-and-dataloaders");
  assert.equal(normalizeSlug("/my-note/", sourcePath), "my-note");
  for (const slug of ["你好", "two/paths", "Uppercase", "../escape", 123]) {
    assert.throws(() => normalizeSlug(slug, sourcePath), /slug/);
  }
});

test("exactly one real H1 supplies the title and is removed from the body", () => {
  const tree = markdownProcessor.parse("# Mixed 中文 title\n\n## Section\n\n```md\n# Not another title\n```\n");
  assert.equal(markdownTitle(tree, sourcePath), "Mixed 中文 title");
  removeFirstH1(tree);
  assert.equal(tree.children.some((node) => node.type === "heading" && node.depth === 1), false);
  assert.match(markdownProcessor.stringify(tree), /# Not another title/);
  assert.throws(() => markdownTitle(markdownProcessor.parse("## No title"), sourcePath), /H1/);
  assert.throws(() => markdownTitle(markdownProcessor.parse("# First\n\n# Second"), sourcePath), /exactly one/);
});

test("published links become site paths while drafts and code stay SHA-pinned", () => {
  const output = rewrite("[published](../notes/published.md#section)\n\n[draft](../notes/draft.md)\n\n[code](../tutorials/example.py)\n\n[folder](../tutorials)");
  assert.match(output, /\(\/writing\/published-note\/#section\)/);
  assert.ok(output.includes(`https://github.com/AlphaApaca/repytorch/blob/${commit}/notes/draft.md`));
  assert.ok(output.includes(`https://github.com/AlphaApaca/repytorch/blob/${commit}/tutorials/example.py`));
  assert.ok(output.includes(`https://github.com/AlphaApaca/repytorch/tree/${commit}/tutorials`));
});

test("reference links and Markdown images are rewritten without changing code examples", () => {
  const output = rewrite("[note][ref]\n\n[ref]: ../notes/published.md\n\n![plot](../assets/plot.png)\n\n`[literal](../missing.md)`\n\n```html\n<a href = \"javascript:alert(1)\">example</a>\n```\n");
  assert.match(output, /\[ref\]: \/writing\/published-note\//);
  assert.ok(output.includes(`https://raw.githubusercontent.com/AlphaApaca/repytorch/${commit}/assets/plot.png`));
  assert.ok(output.includes("`[literal](../missing.md)`"));
  assert.ok(output.includes('href = "javascript:alert(1)"'));
});

test("missing targets, escapes and executable protocols fail closed", () => {
  assert.throws(() => rewrite("[missing](../notes/missing.md)"), /does not exist/);
  assert.throws(() => rewrite("[escape](../../secrets.md)"), /escapes the repository/);
  assert.throws(() => resolveRepoTarget(sourcePath, "%ZZ.md"), /invalid percent encoding/);
  for (const target of ["javascript:alert", "data:text/html,example", "vbscript:example", "file:///tmp/example"]) {
    assert.throws(() => rewrite(`[bad](${target})`), /unsafe or unsupported/);
  }
  const output = rewrite("[docs](https://pytorch.org/)\n\n[mail](mailto:hello@example.com)\n\n[anchor](#section)\n\n[site](/about/)");
  assert.ok(output.includes("https://pytorch.org/"));
  assert.ok(output.includes("mailto:hello@example.com"));
  assert.ok(output.includes("(#section)"));
  assert.ok(output.includes("(/about/)"));
});

test("all raw HTML variants are rejected, including the old spaced-href bypass", () => {
  for (const html of [
    '<a href = "javascript:alert(1)">bad</a>',
    "<a href=javascript:alert(1)>bad</a>",
    '<img src="x" onerror="alert(1)">',
    "<script>alert(1)</script>",
    '<iframe src="https://example.com"></iframe>',
    "<br>",
    "<!-- unpublished annotation -->",
  ]) {
    assert.throws(() => rewrite(html), /raw HTML is not allowed/, html);
  }
});

test("GFM tables and task lists remain Markdown, not HTML", () => {
  const output = rewrite("| Name | Value |\n| --- | --- |\n| Dataset | 1 |\n\n- [x] Read docs\n- [ ] Practice\n");
  assert.match(output, /\| Name/);
  assert.match(output, /- \[x\] Read docs/);
});

test("absolute workstation paths are flagged with source line numbers", () => {
  assert.deepEqual(findLocalPaths("Safe\nPath /Users/example/private/file.md\n/home/example/file\nfile:///tmp/file\nC:\\Users\\example\\file"), [2, 3, 4, 5]);
  assert.deepEqual(findLocalPaths("https://github.com/AlphaApaca/repytorch\n../notes/example.md"), []);
});

test("an empty published snapshot still retains immutable source provenance", () => {
  const empty = snapshotManifest(commit, []);
  assert.deepEqual(empty.articles, []);
  assert.equal(snapshotCommitFromManifest(empty), commit);
  const populated = snapshotManifest(commit, [{ sourcePath, slug: "datasets-and-dataloaders" }]);
  assert.equal(populated.articles[0].permalink, "datasets-and-dataloaders");
  assert.equal(snapshotCommitFromManifest(populated), commit);
  assert.throws(() => snapshotCommitFromManifest({ ...empty, sourceCommit: "main" }), /manifest is invalid/);
  assert.throws(() => snapshotCommitFromManifest({ ...empty, sourceRepo: "other/repo" }), /manifest is invalid/);
  assert.throws(() => snapshotCommitFromManifest({ ...empty, articles: [{ sourcePath: "README.md", permalink: "readme" }] }), /manifest is invalid/);
});
