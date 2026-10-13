import assert from "node:assert/strict";
import test from "node:test";
import { calculateReadingMetrics, readingMetricsCopy } from "../src/lib/reading-metrics.mjs";

test("mixed prose combines Han characters and words, but not numbers", () => {
  assert.deepEqual(calculateReadingMetrics("中文学习 PyTorch DataLoader 2026 3.14"), {
    wordCount: 6,
  });
});

test("YAML metadata, Markdown markers and comments do not contribute", () => {
  const markdown = `---\ntitle: A hidden title 中文\ntags: [many, words]\npublish: true\n---\n# Visible 标题\n\n<!-- Invisible 中文 -->\n\n**hello** and _world_.`;
  assert.deepEqual(calculateReadingMetrics(markdown), {
    wordCount: 6,
  });
});

test("ordinary headings and thematic breaks are not mistaken for frontmatter", () => {
  for (const markdown of ["# Heading 标题\n\nText 正文", "---\n# Heading 标题\n\nText 正文", "---\n# Heading 标题\n\nText 正文\n---"]) {
    assert.deepEqual(calculateReadingMetrics(markdown), {
      wordCount: 6,
    });
  }
});

test("fenced, indented and inline code are excluded while adjacent prose remains", () => {
  const markdown = "Before `hidden 代码` after.\n\n```python\nprint('many hidden words 中文')\n```\n\n    hidden indented 代码\n\n最后";
  assert.deepEqual(calculateReadingMetrics(markdown), {
    wordCount: 4,
  });
});

test("link labels count, but addresses, definitions, image alt and titles do not", () => {
  const markdown = `[Readable 文字](https://hidden.example/with/words "Hidden title")\n\n[Reference][ref]\n\n[ref]: https://definition.example/words "Hidden words"\n\n![Invisible 图片说明](image-name-with-words.png)\n\n![Invisible reference][image]\n\n[image]: image.png\n\n<https://autolink.example/words>\n\nhttps://bare.example/words\n\n<person@example.com>`;
  assert.deepEqual(calculateReadingMetrics(markdown), {
    wordCount: 4,
  });
});

test("GFM table cells, headings and list prose are counted without checkboxes", () => {
  const markdown = "## Table 表格\n\n| Name 名称 | Result 结果 |\n| --- | --- |\n| PyTorch | 正常 |\n\n- [x] Done 完成\n- [ ] Pending 待办";
  assert.deepEqual(calculateReadingMetrics(markdown), {
    wordCount: 18,
  });
});

test("astral Han characters count once rather than as UTF-16 surrogate pairs", () => {
  assert.deepEqual(calculateReadingMetrics("𠮷𠀀汉字 emoji 😀 123"), {
    wordCount: 5,
  });
});

test("apostrophes, hyphenated words, Unicode letters and embedded digits stay together", () => {
  assert.equal(calculateReadingMetrics("don't it’s state-of-the-art COVID-19 café naïve PyTorch2 3D 123").wordCount, 8);
  assert.equal(calculateReadingMetrics("e.g. i.e. U.S.A. CNN").wordCount, 4);
  assert.equal(calculateReadingMetrics("inter**national**").wordCount, 1);
});

test("HTML structure, attributes, comments and script/style/code content do not count", () => {
  const markdown = `<div class="invisible attribute words"><p>Visible 中文 &amp; text &#x6587;</p><img alt="Invisible words 中文" src="image.png" /><script>hidden script 中文</script><style>hidden style 中文</style><pre><code>hidden code 中文</code></pre><!-- hidden comment 中文 --></div>\n\nInline <span title="Invisible words">visible</span> <code>hidden code</code> words.`;
  assert.deepEqual(calculateReadingMetrics(markdown), {
    wordCount: 8,
  });
});

test("pure Chinese, pure English and mixed content all use one combined count", () => {
  assert.deepEqual(calculateReadingMetrics("字".repeat(300)), { wordCount: 300 });
  assert.deepEqual(calculateReadingMetrics("word ".repeat(200)), { wordCount: 200 });
  assert.deepEqual(calculateReadingMetrics(`${"字".repeat(150)} ${"word ".repeat(100)}`), { wordCount: 250 });
  assert.deepEqual(calculateReadingMetrics(`${"字".repeat(1234)} ${"word ".repeat(397)}`), { wordCount: 1631 });
});

test("empty, numeric-only and code-only text show a zero total", () => {
  for (const markdown of ["", "123\n456.78\n😀", "```js\nconst words = '中文 hidden';\n```", "`code-only words 中文`"]) {
    const metrics = calculateReadingMetrics(markdown);
    assert.deepEqual(metrics, { wordCount: 0 });
    const copy = readingMetricsCopy(metrics);
    assert.equal(copy.zh.volume, "0 字");
    assert.equal(copy.en.volume, "0 words");
    assert.equal(Object.hasOwn(copy.zh, "time"), false);
    assert.equal(Object.hasOwn(copy.en, "time"), false);
  }
});

test("bilingual formatting groups one total and handles English singular and plural", () => {
  const total = readingMetricsCopy({ wordCount: 1631 });
  assert.equal(total.zh.volume, "1,631 字");
  assert.equal(total.en.volume, "1,631 words");
  assert.equal(readingMetricsCopy({ wordCount: 1 }).zh.volume, "1 字");
  assert.equal(readingMetricsCopy({ wordCount: 1 }).en.volume, "1 word");
  assert.equal(readingMetricsCopy({ wordCount: 2 }).en.volume, "2 words");
  assert.match(total.zh.description, /汉字.*单词合计.*代码.*网址/);
  assert.match(total.en.description, /Han characters.*prose words.*combined.*code.*URLs/);
  for (const copy of [total.zh, total.en]) {
    assert.deepEqual(Object.keys(copy), ["volume", "description"]);
    assert.doesNotMatch(copy.volume + copy.description, /300|200|分钟|minute|Chinese character/);
    assert.doesNotMatch(copy.volume, /\+|词|character/);
  }
});

test("results are deterministic and contain no time, line count or language subtotals", () => {
  const markdown = "# 中文 title\n\nWords with [label](https://example.com) and `ignored`.";
  const first = calculateReadingMetrics(markdown);
  for (let index = 0; index < 5; index += 1) assert.deepEqual(calculateReadingMetrics(markdown), first);
  assert.deepEqual(Object.keys(first), ["wordCount"]);
  assert.deepEqual(calculateReadingMetrics(markdown.replaceAll("\n", "\r\n")), first);
});
