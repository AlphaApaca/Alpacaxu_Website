import assert from "node:assert/strict";
import test from "node:test";
import { calculateReadingMetrics, readingMetricsCopy } from "../src/lib/reading-metrics.mjs";

test("mixed prose counts Han characters and words separately, but not numbers", () => {
  assert.deepEqual(calculateReadingMetrics("中文学习 PyTorch DataLoader 2026 3.14"), {
    chineseCharacters: 4, words: 2, readingMinutes: 1,
  });
});

test("YAML metadata, Markdown markers and comments do not contribute", () => {
  const markdown = `---\ntitle: A hidden title 中文\ntags: [many, words]\npublish: true\n---\n# Visible 标题\n\n<!-- Invisible 中文 -->\n\n**hello** and _world_.`;
  assert.deepEqual(calculateReadingMetrics(markdown), {
    chineseCharacters: 2, words: 4, readingMinutes: 1,
  });
});

test("ordinary headings and thematic breaks are not mistaken for frontmatter", () => {
  for (const markdown of ["# Heading 标题\n\nText 正文", "---\n# Heading 标题\n\nText 正文", "---\n# Heading 标题\n\nText 正文\n---"]) {
    assert.deepEqual(calculateReadingMetrics(markdown), {
      chineseCharacters: 4, words: 2, readingMinutes: 1,
    });
  }
});

test("fenced, indented and inline code are excluded while adjacent prose remains", () => {
  const markdown = "Before `hidden 代码` after.\n\n```python\nprint('many hidden words 中文')\n```\n\n    hidden indented 代码\n\n最后";
  assert.deepEqual(calculateReadingMetrics(markdown), {
    chineseCharacters: 2, words: 2, readingMinutes: 1,
  });
});

test("link labels count, but addresses, definitions, image alt and titles do not", () => {
  const markdown = `[Readable 文字](https://hidden.example/with/words "Hidden title")\n\n[Reference][ref]\n\n[ref]: https://definition.example/words "Hidden words"\n\n![Invisible 图片说明](image-name-with-words.png)\n\n![Invisible reference][image]\n\n[image]: image.png\n\n<https://autolink.example/words>\n\nhttps://bare.example/words\n\n<person@example.com>`;
  assert.deepEqual(calculateReadingMetrics(markdown), {
    chineseCharacters: 2, words: 2, readingMinutes: 1,
  });
});

test("GFM table cells, headings and list prose are counted without checkboxes", () => {
  const markdown = "## Table 表格\n\n| Name 名称 | Result 结果 |\n| --- | --- |\n| PyTorch | 正常 |\n\n- [x] Done 完成\n- [ ] Pending 待办";
  assert.deepEqual(calculateReadingMetrics(markdown), {
    chineseCharacters: 12, words: 6, readingMinutes: 1,
  });
});

test("astral Han characters count once rather than as UTF-16 surrogate pairs", () => {
  assert.deepEqual(calculateReadingMetrics("𠮷𠀀汉字 emoji 😀 123"), {
    chineseCharacters: 4, words: 1, readingMinutes: 1,
  });
});

test("apostrophes, hyphenated words, Unicode letters and embedded digits stay together", () => {
  assert.equal(calculateReadingMetrics("don't it’s state-of-the-art COVID-19 café naïve PyTorch2 3D 123").words, 8);
  assert.equal(calculateReadingMetrics("e.g. i.e. U.S.A. CNN").words, 4);
  assert.equal(calculateReadingMetrics("inter**national**").words, 1);
});

test("HTML structure, attributes, comments and script/style/code content do not count", () => {
  const markdown = `<div class="invisible attribute words"><p>Visible 中文 &amp; text &#x6587;</p><img alt="Invisible words 中文" src="image.png" /><script>hidden script 中文</script><style>hidden style 中文</style><pre><code>hidden code 中文</code></pre><!-- hidden comment 中文 --></div>\n\nInline <span title="Invisible words">visible</span> <code>hidden code</code> words.`;
  assert.deepEqual(calculateReadingMetrics(markdown), {
    chineseCharacters: 3, words: 5, readingMinutes: 1,
  });
});

test("reading time adds both language contributions and rounds up only once", () => {
  assert.equal(calculateReadingMetrics("字".repeat(300)).readingMinutes, 1);
  assert.equal(calculateReadingMetrics("字".repeat(301)).readingMinutes, 2);
  assert.equal(calculateReadingMetrics("word ".repeat(200)).readingMinutes, 1);
  assert.equal(calculateReadingMetrics("word ".repeat(201)).readingMinutes, 2);
  assert.equal(calculateReadingMetrics(`${"字".repeat(150)} ${"word ".repeat(100)}`).readingMinutes, 1);
  assert.equal(calculateReadingMetrics(`${"字".repeat(151)} ${"word ".repeat(100)}`).readingMinutes, 2);
  assert.equal(calculateReadingMetrics(`${"字".repeat(300)} ${"word ".repeat(200)}`).readingMinutes, 2);
});

test("empty, numeric-only and code-only text preserve the minimum result but show under one minute", () => {
  for (const markdown of ["", "123\n456.78\n😀", "```js\nconst words = '中文 hidden';\n```", "`code-only words 中文`"]) {
    const metrics = calculateReadingMetrics(markdown);
    assert.deepEqual(metrics, { chineseCharacters: 0, words: 0, readingMinutes: 1 });
    const copy = readingMetricsCopy(metrics);
    assert.equal(copy.zh.volume, "0 字");
    assert.equal(copy.en.volume, "0 words");
    assert.equal(copy.zh.time, "不足 1 分钟");
    assert.equal(copy.en.time, "<1 min");
  }
});

test("bilingual formatting gives grouped mixed totals and language-specific pure totals", () => {
  const mixed = readingMetricsCopy({ chineseCharacters: 1234, words: 210, readingMinutes: 6 });
  assert.equal(mixed.zh.volume, "1,234 字 + 210 词");
  assert.equal(mixed.en.volume, "1,234 Chinese characters + 210 words");
  assert.equal(mixed.zh.time, "约 6 分钟");
  assert.equal(mixed.en.time, "~6 min");
  assert.equal(readingMetricsCopy({ chineseCharacters: 1234, words: 0, readingMinutes: 5 }).zh.volume, "1,234 字");
  assert.equal(readingMetricsCopy({ chineseCharacters: 0, words: 210, readingMinutes: 2 }).zh.volume, "210 词");
  assert.equal(readingMetricsCopy({ chineseCharacters: 0, words: 210, readingMinutes: 2 }).en.volume, "210 words");
  assert.equal(readingMetricsCopy({ chineseCharacters: 1, words: 1, readingMinutes: 1 }).en.volume, "1 Chinese character + 1 word");
  assert.match(mixed.zh.description, /300 字.*200 词.*运行代码.*实验/);
  assert.match(mixed.en.description, /300 Chinese characters.*200 words.*running code.*experiments/);
});

test("results are deterministic across repeated calls and never report a line count", () => {
  const markdown = "# 中文 title\n\nWords with [label](https://example.com) and `ignored`.";
  const first = calculateReadingMetrics(markdown);
  for (let index = 0; index < 5; index += 1) assert.deepEqual(calculateReadingMetrics(markdown), first);
  assert.deepEqual(Object.keys(first), ["chineseCharacters", "words", "readingMinutes"]);
  assert.deepEqual(calculateReadingMetrics(markdown.replaceAll("\n", "\r\n")), first);
});
