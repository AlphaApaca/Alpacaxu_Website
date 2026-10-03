import { getCollection } from "astro:content";
import { LEGACY_POSTS } from "../data/legacy-posts.mjs";
import { assertUniqueWritingPaths, categoryLabel, sortWriting, writingSearchText } from "./writing.mjs";

export { categoryLabel };

export interface WritingPost {
  url: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  date: string | null;
  searchText: string;
  kind: "markdown" | "legacy";
}

export function postPath(permalink: string) {
  return `/writing/${permalink}/`;
}

export async function getPublishedPosts() {
  const posts = await getCollection("posts", ({ data }) => data.publish);
  assertUniqueWritingPaths(posts.map((post) => ({ url: postPath(post.data.permalink) })));
  return posts.sort((left, right) => right.data.date.localeCompare(left.data.date) || left.data.permalink.localeCompare(right.data.permalink));
}

export async function getWritingPosts(): Promise<WritingPost[]> {
  const posts = await getPublishedPosts();
  const entries: WritingPost[] = posts.map(({ data }) => ({
    url: postPath(data.permalink),
    title: data.title,
    summary: data.summary,
    category: data.category,
    tags: data.tags,
    date: data.date,
    searchText: writingSearchText(data),
    kind: "markdown",
  }));
  entries.push(...LEGACY_POSTS.map((post) => ({
    ...post,
    searchText: writingSearchText(post),
    kind: "legacy" as const,
  })));
  assertUniqueWritingPaths(entries);
  return sortWriting(entries);
}
