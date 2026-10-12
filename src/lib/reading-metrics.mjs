import matter from "gray-matter";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

const markdownProcessor = unified().use(remarkParse).use(remarkGfm);
const HAN_CHARACTER = /\p{Script=Han}/gu;
const NUMBER_CHARACTER = /\p{N}/u;
const WORD = /(?:\p{L}\.)+\p{L}\.?|\p{L}[\p{L}\p{M}\p{N}]*(?:[-‐‑'’][\p{L}\p{M}\p{N}]+)*/gu;
const HTML_TOKEN = /<!--[\s\S]*?(?:-->|$)|<\/?[A-Za-z][\w:-]*(?:[^<>"']|"[^"]*"|'[^']*')*>|<![^>]*>|[^<]+|</gu;
const EXCLUDED_HTML_TAGS = new Set(["script", "style", "head", "template", "noscript", "pre", "code"]);
const BLOCK_HTML_TAGS = new Set(["address", "article", "aside", "blockquote", "br", "dd", "div", "dl", "dt", "figcaption", "figure", "footer", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hr", "li", "main", "nav", "ol", "p", "section", "table", "td", "th", "tr", "ul"]);
const BLOCK_MARKDOWN_NODES = new Set(["root", "paragraph", "heading", "blockquote", "list", "listItem", "table", "tableRow", "tableCell"]);

function withoutFrontmatter(markdown) {
  // A thematic break followed by ordinary prose is not YAML frontmatter.
  // Only ask gray-matter to strip a closed, mapping-shaped YAML header.
  const header = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(markdown);
  if (!header || !/^\s*(?:[\w.-]+|"[^"\n]+"|'[^'\n]+')\s*:/mu.test(header[1])) return markdown;
  return matter(markdown).content;
}

function decodeHtmlText(value) {
  // remark already knows Markdown's HTML entity table. Escaping markup keeps
  // HTML text literal while reusing that decoder without a browser or new package.
  const escaped = value.replace(/[\\`*{}\[\]()\-.!_<>|]/gu, "\\$&");
  const tree = markdownProcessor.parse(escaped);
  const text = [];
  function collect(node) {
    if (node.type === "text") text.push(node.value);
    else if (node.children) node.children.forEach(collect);
  }
  collect(tree);
  return text.join("");
}

function visibleMarkdownText(markdown) {
  const chunks = [];
  const excludedHtml = [];

  function collectHtml(value) {
    for (const [token] of value.matchAll(HTML_TOKEN)) {
      if (token.startsWith("<!--") || token.startsWith("<!")) continue;
      const tag = /^<(\/)?([A-Za-z][\w:-]*)/u.exec(token);
      if (tag) {
        const name = tag[2].toLowerCase();
        if (tag[1]) {
          const index = excludedHtml.lastIndexOf(name);
          if (index !== -1) excludedHtml.splice(index);
        } else if (EXCLUDED_HTML_TAGS.has(name) && !/\/\s*>$/u.test(token)) {
          excludedHtml.push(name);
        }
        if (!excludedHtml.length && BLOCK_HTML_TAGS.has(name)) chunks.push("\n");
      } else if (!excludedHtml.length) {
        chunks.push(decodeHtmlText(token));
      }
    }
  }

  function collect(node) {
    if (node.type === "html") {
      collectHtml(node.value);
      return;
    }
    if (["code", "inlineCode", "image", "imageReference", "definition"].includes(node.type)) {
      if (!excludedHtml.length) chunks.push(" ");
      return;
    }
    if (node.type === "text") {
      if (!excludedHtml.length) chunks.push(node.value);
      return;
    }
    if (node.type === "link") {
      const label = node.children.every((child) => child.type === "text")
        ? node.children.map((child) => child.value).join("") : "";
      // Bare URL/email autolinks are addresses, not prose words.
      if (label && [node.url, node.url.replace(/^(?:https?:\/\/|mailto:)/iu, "")].includes(label)) {
        if (!excludedHtml.length) chunks.push(" ");
        return;
      }
    }
    if (node.type === "break") {
      if (!excludedHtml.length) chunks.push("\n");
      return;
    }
    const block = BLOCK_MARKDOWN_NODES.has(node.type);
    if (block && !excludedHtml.length) chunks.push("\n");
    node.children?.forEach(collect);
    if (block && !excludedHtml.length) chunks.push("\n");
  }

  collect(markdownProcessor.parse(withoutFrontmatter(markdown.replace(/^\uFEFF/u, ""))));
  return chunks.join("");
}

/** Build-time prose count; each Han character and each non-Han word contributes one. */
export function calculateReadingMetrics(markdown = "") {
  const text = visibleMarkdownText(markdown);
  const chineseCharacters = [...text.matchAll(HAN_CHARACTER)]
    .filter(([character]) => !NUMBER_CHARACTER.test(character)).length;
  const withoutHan = text.replace(HAN_CHARACTER, " ");
  const words = [...withoutHan.matchAll(WORD)].length;
  return { wordCount: chineseCharacters + words };
}

/** One combined total, with localized labels rather than language subtotals. */
export function readingMetricsCopy({ wordCount }) {
  const total = wordCount.toLocaleString("en-US");
  return {
    zh: {
      volume: `${total} 字`,
      description: "中文按汉字、英文等按单词合计；纯数字、代码、网址、图片替代文字和元数据不计。",
    },
    en: {
      volume: `${total} word${wordCount === 1 ? "" : "s"}`,
      description: "Han characters and prose words are combined; standalone numbers, code, URLs, image alt text and metadata are excluded.",
    },
  };
}
