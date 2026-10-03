import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const posts = defineCollection({
  loader: glob({
    base: "./src/content/posts",
    pattern: "**/*.md"
  }),
  schema: z.object({
    publish: z.boolean().default(false),
    title: z.string().trim().min(1),
    permalink: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    date: z.union([z.string(), z.date()]).transform((value, context) => {
      const normalized = typeof value === "string" ? value : value.toISOString().slice(0, 10);

      const parsed = new Date(`${normalized}T00:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== normalized) {
        context.addIssue({ code: "custom", message: "date must be a real calendar date in YYYY-MM-DD format" });
        return z.NEVER;
      }

      return normalized;
    }),
    category: z.string().trim().min(1),
    tags: z.array(z.string().trim().min(1)).default([]).transform((tags) => [...new Set(tags)]),
    summary: z.string().trim().min(1),
    comments: z.boolean().default(true),
    lang: z.string().default("zh-CN").transform((value, context) => {
      try {
        return Intl.getCanonicalLocales(value.trim())[0];
      } catch {
        context.addIssue({ code: "custom", message: "lang must be a valid language tag, such as zh-CN or en" });
        return z.NEVER;
      }
    }),
    sourceRepo: z.string().optional(),
    sourcePath: z.string().optional(),
    sourceUrl: z.url().optional(),
    sourceCommit: z.string().optional()
  })
});

export const collections = { posts };
