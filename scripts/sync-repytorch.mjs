#!/usr/bin/env node

/**
 * Import explicitly published Markdown from AlphaApaca/repytorch.
 *
 * The source repository remains the source of truth. This script resolves the
 * requested ref to an immutable commit, validates every publishable document,
 * rewrites repository-relative links, and replaces the generated
 * `src/content/posts/repytorch` directory.
 */

import { mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join, posix, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import matter from "gray-matter";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import { visit } from "unist-util-visit";

const DEFAULT_REPOSITORY = "AlphaApaca/repytorch";
const DEFAULT_REF = "main";
const SITE_ROUTE_PREFIX = "/writing";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, "..");
const OUTPUT_DIR = join(PROJECT_ROOT, "src/content/posts/repytorch");
const SNAPSHOT_FILE = "snapshot.json";
const markdownProcessor = unified().use(remarkParse).use(remarkGfm).use(remarkStringify, {
  bullet: "-",
  fences: true,
});

const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");
const dryRun = args.has("--dry-run");
const unknownArgs = [...args].filter((arg) => !["--check", "--dry-run"].includes(arg));

if (unknownArgs.length > 0) {
  throw new Error(`Unknown argument${unknownArgs.length === 1 ? "" : "s"}: ${unknownArgs.join(", ")}`);
}

if (checkOnly && dryRun) {
  throw new Error("Use either --check or --dry-run, not both.");
}

const repository = process.env.REPYTORCH_REPOSITORY || DEFAULT_REPOSITORY;
const sourceRef = process.env.REPYTORCH_REF || DEFAULT_REF;
const githubToken = process.env.GITHUB_TOKEN?.trim();
const [owner, repo] = repository.split("/");

if (!owner || !repo || repository.split("/").length !== 2) {
  throw new Error(`REPYTORCH_REPOSITORY must be in owner/repository form; received ${repository}.`);
}

function apiHeaders() {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Alpacaxu-Website-content-sync",
    ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
  };
}

async function githubJson(url) {
  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== "https:" || parsedUrl.hostname !== "api.github.com") {
    throw new Error(`Refusing to send GitHub API credentials to an unexpected URL: ${parsedUrl.origin}`);
  }

  let response;

  try {
    response = await fetch(url, {
      headers: apiHeaders(),
      redirect: "error",
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    throw new Error(`Could not reach GitHub while requesting ${url}: ${error.message}`, { cause: error });
  }

  if (!response.ok) {
    const remaining = response.headers.get("x-ratelimit-remaining");
    const rateLimitHint = remaining === "0" ? " Set GITHUB_TOKEN to increase the API rate limit." : "";
    throw new Error(`GitHub returned ${response.status} ${response.statusText} for ${url}.${rateLimitHint}`);
  }

  return response.json();
}

function isAllowlistedMarkdown(path) {
  if (basename(path).toLowerCase() === "readme.md") return false;

  return (
    /^learning_log\/\d{4}-\d{2}-\d{2}[^/]*\.md$/i.test(path) ||
    /^notes\/[^/]+\.md$/i.test(path)
  );
}

function encodeRepoPath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function sourceBlobUrl(commit, path) {
  return `https://github.com/${owner}/${repo}/blob/${commit}/${encodeRepoPath(path)}`;
}

function sourceTreeUrl(commit, path) {
  return `https://github.com/${owner}/${repo}/tree/${commit}/${encodeRepoPath(path)}`;
}

function rawSourceUrl(commit, path) {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${commit}/${encodeRepoPath(path)}`;
}

function nodeText(node) {
  if (typeof node.value === "string") return node.value;
  if (node.type === "image" && typeof node.alt === "string") return node.alt;
  if (!Array.isArray(node.children)) return "";
  return node.children.map(nodeText).join("");
}

function markdownTitle(tree, sourcePath) {
  const headings = tree.children.filter((node) => node.type === "heading" && node.depth === 1);
  if (headings.length === 0) {
    throw new Error(`${sourcePath}: published Markdown must contain an H1 title.`);
  }
  if (headings.length > 1) {
    throw new Error(`${sourcePath}: published Markdown must contain exactly one H1 title.`);
  }

  const title = nodeText(headings[0]).trim();

  if (!title) {
    throw new Error(`${sourcePath}: the first H1 title is empty.`);
  }

  return title;
}

function removeFirstH1(tree) {
  const index = tree.children.findIndex((node) => node.type === "heading" && node.depth === 1);
  if (index >= 0) tree.children.splice(index, 1);
}

function inferredSlug(sourcePath) {
  const stem = basename(sourcePath, posix.extname(sourcePath));
  const slug = stem
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) {
    throw new Error(`${sourcePath}: could not infer a URL slug from the filename.`);
  }

  return slug;
}

function normalizeSlug(value, sourcePath) {
  if (value !== undefined && value !== null && value !== "" && typeof value !== "string") {
    throw new Error(`${sourcePath}: slug must be a string.`);
  }

  const slug = (value ? value.trim().replace(/^\/+|\/+$/g, "") : inferredSlug(sourcePath));
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`${sourcePath}: slug must use lowercase ASCII kebab-case.`);
  }

  return slug;
}

function normalizeDate(value, sourcePath) {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00Z`);
    if (!Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value) return value;
  }

  throw new Error(`${sourcePath}: date must be a real calendar date in YYYY-MM-DD form.`);
}

function normalizeLanguageTag(value, sourcePath) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${sourcePath}: lang must be a non-empty BCP-47 language tag.`);
  }

  try {
    return Intl.getCanonicalLocales(value.trim())[0];
  } catch {
    throw new Error(`${sourcePath}: lang must be a valid BCP-47 language tag, such as zh-CN or en.`);
  }
}

function validateMetadata(data, sourcePath) {
  const requiredString = (key) => {
    if (typeof data[key] !== "string" || !data[key].trim()) {
      throw new Error(`${sourcePath}: ${key} must be a non-empty string.`);
    }
    return data[key].trim();
  };

  if (data.publish !== true) {
    throw new Error(`${sourcePath}: internal error: attempted to import a document without publish: true.`);
  }

  if (!Array.isArray(data.tags) || data.tags.some((tag) => typeof tag !== "string" || !tag.trim())) {
    throw new Error(`${sourcePath}: tags must be a YAML list of non-empty strings.`);
  }

  if (data.comments !== undefined && typeof data.comments !== "boolean") {
    throw new Error(`${sourcePath}: comments must be true or false.`);
  }

  return {
    date: normalizeDate(data.date, sourcePath),
    category: requiredString("category"),
    tags: data.tags.map((tag) => tag.trim()),
    summary: requiredString("summary"),
    comments: data.comments ?? true,
  };
}

function findLocalPaths(content) {
  const patterns = [
    /(?:^|[\s('"`])\/Users\/[^\s)'"`]+/g,
    /(?:^|[\s('"`])\/home\/[^\s)'"`]+/g,
    /(?:^|[\s('"`])[A-Za-z]:\\[^\s)'"`]+/g,
    /file:\/\/\/[^\s)'"`]+/gi,
  ];
  const hits = [];

  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      const index = (match.index ?? 0) + match[0].length - match[0].trimStart().length;
      hits.push(content.slice(0, index).split("\n").length);
    }
  }

  return [...new Set(hits)].sort((a, b) => a - b);
}

function splitTarget(target) {
  const separatorIndex = target.search(/[?#]/);
  if (separatorIndex === -1) return { pathname: target, suffix: "" };
  return { pathname: target.slice(0, separatorIndex), suffix: target.slice(separatorIndex) };
}

function isExternalOrSiteLink(target, sourcePath) {
  if (!target || target.startsWith("#") || target.startsWith("/")) return true;

  const protocol = target.match(/^([a-z][a-z\d+.-]*):/i)?.[1]?.toLowerCase();
  if (!protocol) return false;
  if (["http", "https", "mailto"].includes(protocol)) return true;

  throw new Error(`${sourcePath}: unsafe or unsupported link protocol "${protocol}:".`);
}

function resolveRepoTarget(sourcePath, rawPathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(rawPathname);
  } catch {
    throw new Error(`${sourcePath}: relative link contains invalid percent encoding: ${rawPathname}`);
  }

  const targetPath = posix.normalize(posix.join(posix.dirname(sourcePath), decoded));
  if (targetPath === ".." || targetPath.startsWith("../") || posix.isAbsolute(targetPath)) {
    throw new Error(`${sourcePath}: relative link escapes the repository: ${rawPathname}`);
  }

  return targetPath.replace(/^\.\//, "");
}

function rewriteTarget({ rawTarget, sourcePath, entriesByPath, publishedByPath, commit, image = false }) {
  if (isExternalOrSiteLink(rawTarget, sourcePath)) return rawTarget;

  const { pathname, suffix } = splitTarget(rawTarget);
  if (!pathname) return rawTarget;

  const targetPath = resolveRepoTarget(sourcePath, pathname);
  const targetEntry = entriesByPath.get(targetPath);
  if (!targetEntry) {
    throw new Error(`${sourcePath}: relative link target does not exist in ${repository}@${commit}: ${rawTarget}`);
  }

  const importedTarget = publishedByPath.get(targetPath);
  if (importedTarget && targetPath.toLowerCase().endsWith(".md")) {
    return `${SITE_ROUTE_PREFIX}/${encodeURIComponent(importedTarget.slug)}/${suffix}`;
  }

  if (image && targetEntry.type === "blob") return `${rawSourceUrl(commit, targetPath)}${suffix}`;
  if (targetEntry.type === "tree") return `${sourceTreeUrl(commit, targetPath)}${suffix}`;
  return `${sourceBlobUrl(commit, targetPath)}${suffix}`;
}

function rewriteMarkdownLinks(tree, context) {
  visit(tree, (node) => {
    if (["link", "definition", "image"].includes(node.type) && typeof node.url === "string") {
      node.url = rewriteTarget({
        ...context,
        rawTarget: node.url,
        image: node.type === "image",
      });
      return;
    }

    // Automated imports accept Markdown, not executable or parser-dependent HTML.
    // Literal HTML remains available inside fenced/inline code examples.
    if (node.type === "html") {
      throw new Error(`${context.sourcePath}: raw HTML is not allowed in published Markdown. Use Markdown syntax or a fenced code example.`);
    }
  });
}

async function listFiles(root) {
  const files = [];

  async function visit(directory) {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error.code === "ENOENT") return;
      throw error;
    }

    for (const entry of entries) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await visit(path);
      if (entry.isFile()) files.push(relative(root, path));
    }
  }

  await visit(root);
  return files.sort();
}

async function assertDirectoriesEqual(expectedRoot, actualRoot) {
  const [expectedFiles, actualFiles] = await Promise.all([listFiles(expectedRoot), listFiles(actualRoot)]);
  const expectedNames = JSON.stringify(expectedFiles);
  const actualNames = JSON.stringify(actualFiles);

  if (expectedNames !== actualNames) {
    throw new Error("Generated repytorch content is out of date (the file list differs). Run the sync command.");
  }

  for (const path of expectedFiles) {
    const [expected, actual] = await Promise.all([
      readFile(join(expectedRoot, path), "utf8"),
      readFile(join(actualRoot, path), "utf8"),
    ]);
    if (expected !== actual) {
      throw new Error(`Generated repytorch content is out of date: ${path}. Run the sync command.`);
    }
  }
}

function snapshotManifest(commit, published) {
  return {
    sourceRepo: repository,
    sourceCommit: commit,
    articles: published.map((document) => ({
      sourcePath: document.sourcePath,
      permalink: document.slug,
    })),
  };
}

function snapshotCommitFromManifest(manifest) {
  if (manifest?.sourceRepo !== repository || !/^[a-f\d]{40}$/i.test(manifest?.sourceCommit ?? "") ||
      !Array.isArray(manifest.articles) || manifest.articles.some((article) =>
        typeof article?.sourcePath !== "string" || !isAllowlistedMarkdown(article.sourcePath) ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article?.permalink ?? ""))) {
    throw new Error("Generated repytorch snapshot manifest is invalid. Run the sync command.");
  }
  return manifest.sourceCommit;
}

async function pinnedSnapshotCommit() {
  // Retain provenance even when the author unpublishes the last article.
  try {
    const manifest = JSON.parse(await readFile(join(OUTPUT_DIR, SNAPSHOT_FILE), "utf8"));
    return snapshotCommitFromManifest(manifest);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const files = (await listFiles(OUTPUT_DIR)).filter((path) => path.endsWith(".md"));
  if (files.length === 0) {
    throw new Error("No generated repytorch snapshot exists. Run the sync command first.");
  }

  const commits = new Set();
  for (const path of files) {
    const parsed = matter(await readFile(join(OUTPUT_DIR, path), "utf8"));
    if (parsed.data.sourceRepo !== repository || !/^[a-f\d]{40}$/i.test(parsed.data.sourceCommit ?? "")) {
      throw new Error(`${path}: generated snapshot is missing valid sourceRepo/sourceCommit metadata.`);
    }
    commits.add(parsed.data.sourceCommit);
  }

  if (commits.size !== 1) {
    throw new Error("Generated repytorch snapshot contains more than one source commit.");
  }

  return [...commits][0];
}

async function main() {
  const requestedRef = checkOnly && !process.env.REPYTORCH_REF
    ? await pinnedSnapshotCommit()
    : sourceRef;
  const commitData = await githubJson(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(requestedRef)}`,
  );
  const commit = commitData.sha;
  if (typeof commit !== "string" || !/^[a-f\d]{40}$/i.test(commit)) {
    throw new Error(`GitHub did not return a valid commit for ${repository}@${requestedRef}.`);
  }
  const treeSha = commitData.commit?.tree?.sha;
  if (typeof treeSha !== "string" || !/^[a-f\d]{40}$/i.test(treeSha)) {
    throw new Error(`GitHub did not return a valid tree for ${repository}@${commit}.`);
  }

  const treeData = await githubJson(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${treeSha}?recursive=1`,
  );
  if (treeData.truncated) {
    throw new Error(`GitHub truncated the repository tree for ${repository}@${commit}; refusing a partial sync.`);
  }
  if (!Array.isArray(treeData.tree)) {
    throw new Error(`GitHub did not return a repository tree for ${repository}@${commit}.`);
  }

  const entriesByPath = new Map(treeData.tree.map((entry) => [entry.path, entry]));
  const candidates = treeData.tree.filter(
    (entry) => entry.type === "blob" && isAllowlistedMarkdown(entry.path),
  );

  const parsedCandidates = await Promise.all(
    candidates.map(async (entry) => {
      const blob = await githubJson(entry.url);
      if (blob.encoding !== "base64" || typeof blob.content !== "string") {
        throw new Error(`${entry.path}: GitHub returned an unsupported blob encoding.`);
      }

      const source = Buffer.from(blob.content.replace(/\n/g, ""), "base64").toString("utf8");
      let parsed;
      try {
        parsed = matter(source);
      } catch (error) {
        throw new Error(`${entry.path}: invalid YAML frontmatter: ${error.message}`, { cause: error });
      }

      return { sourcePath: entry.path, source, ...parsed };
    }),
  );

  const published = parsedCandidates
    .filter((document) => document.data.publish === true)
    .map((document) => {
      const metadata = validateMetadata(document.data, document.sourcePath);
      const tree = markdownProcessor.parse(document.content);
      const title = markdownTitle(tree, document.sourcePath);
      const slug = normalizeSlug(document.data.slug, document.sourcePath);
      const lang = normalizeLanguageTag(document.data.lang ?? "zh-CN", document.sourcePath);
      const localPathLines = findLocalPaths(document.content);
      if (localPathLines.length > 0) {
        throw new Error(
          `${document.sourcePath}: published content exposes an absolute local path on line${
            localPathLines.length === 1 ? "" : "s"
          } ${localPathLines.join(", ")}. Remove or redact it before publishing.`,
        );
      }

      return { ...document, ...metadata, tree, title, slug, lang };
    });

  const publishedByPath = new Map();
  const publishedBySlug = new Map();
  for (const document of published) {
    if (publishedBySlug.has(document.slug)) {
      throw new Error(
        `Duplicate article slug "${document.slug}" in ${publishedBySlug.get(document.slug).sourcePath} and ${document.sourcePath}.`,
      );
    }
    publishedByPath.set(document.sourcePath, document);
    publishedBySlug.set(document.slug, document);
  }

  const outputParent = dirname(OUTPUT_DIR);
  await mkdir(outputParent, { recursive: true });
  const temporaryOutput = await mkdtemp(join(outputParent, ".repytorch-sync-"));

  try {
    for (const document of published.sort((a, b) => a.sourcePath.localeCompare(b.sourcePath))) {
      removeFirstH1(document.tree);
      rewriteMarkdownLinks(document.tree, {
        sourcePath: document.sourcePath,
        entriesByPath,
        publishedByPath,
        commit,
      });
      const rewrittenContent = markdownProcessor.stringify(document.tree);
      const sourceUrl = sourceBlobUrl(commit, document.sourcePath);
      const normalizedData = {
        publish: true,
        title: document.title,
        permalink: document.slug,
        date: document.date,
        category: document.category,
        tags: document.tags,
        summary: document.summary,
        comments: document.comments,
        lang: document.lang,
        sourceRepo: repository,
        sourcePath: document.sourcePath,
        sourceUrl,
        sourceCommit: commit,
      };
      const generatedNotice =
        "<!-- Generated by scripts/sync-repytorch.mjs; edit the source file in repytorch instead. -->\n\n";
      const output = matter.stringify(`${generatedNotice}${rewrittenContent.replace(/^\s+/, "")}`, normalizedData);
      const destination = join(temporaryOutput, document.sourcePath);
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, output.endsWith("\n") ? output : `${output}\n`, "utf8");
    }

    await writeFile(join(temporaryOutput, SNAPSHOT_FILE), `${JSON.stringify(snapshotManifest(commit, published), null, 2)}\n`, "utf8");

    if (dryRun) {
      console.log(`Validated ${published.length} published article(s) from ${repository}@${commit}.`);
      return;
    }

    if (checkOnly) {
      await assertDirectoriesEqual(temporaryOutput, OUTPUT_DIR);
      console.log(`Generated content is current at ${repository}@${commit} (${published.length} article(s)).`);
      return;
    }

    await rm(OUTPUT_DIR, { recursive: true, force: true });
    await rename(temporaryOutput, OUTPUT_DIR);
    console.log(`Synced ${published.length} article(s) from ${repository}@${commit}.`);
  } finally {
    await rm(temporaryOutput, { recursive: true, force: true });
  }
}

export {
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
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
