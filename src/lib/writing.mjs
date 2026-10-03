export const DEFAULT_CATEGORIES = ["learning-log", "note", "essay"];

const CATEGORY_LABELS = {
  "learning-log": "学习日志 · Learning Log",
  note: "技术笔记 · Note",
  essay: "杂文 · Essay",
};

export function categoryLabel(category) {
  return Object.hasOwn(CATEGORY_LABELS, category) ? CATEGORY_LABELS[category] : category;
}

export function normalizeSearch(value = "") {
  return value.normalize("NFKC").toLowerCase().trim().replace(/\s+/gu, " ");
}

export function writingSearchText(post) {
  return [post.title, post.summary, categoryLabel(post.category), ...post.tags, post.searchText ?? ""].join(" ");
}

export function matchesWriting(post, { q = "", category = "", tag = "" } = {}) {
  if (category && post.category !== category) return false;
  if (tag && !post.tags.some((value) => normalizeSearch(value) === normalizeSearch(tag))) return false;
  const text = normalizeSearch(post.searchText);
  return normalizeSearch(q).split(" ").filter(Boolean).every((word) => text.includes(word));
}

export function writingFilterUrl({ q = "", category = "", tag = "" } = {}) {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  if (category) params.set("category", category);
  if (tag) params.set("tag", tag);
  const query = params.toString();
  return `/writing/${query ? `?${query}` : ""}`;
}

export function readWritingFilters(search) {
  const params = new URLSearchParams(search);
  return {
    q: params.get("q") ?? "",
    category: params.get("category") ?? "",
    tag: params.get("tag") ?? "",
  };
}

export function assertUniqueWritingPaths(posts) {
  const seen = new Set();
  for (const post of posts) {
    if (seen.has(post.url)) throw new Error(`Duplicate published article URL: ${post.url}. Choose a unique permalink before publishing.`);
    seen.add(post.url);
  }
}

export function sortWriting(posts) {
  return [...posts].sort((left, right) => (right.date ?? "").localeCompare(left.date ?? "") || left.url.localeCompare(right.url));
}
