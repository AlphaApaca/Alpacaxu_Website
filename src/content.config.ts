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
    title: z.string().min(1),
    permalink: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    date: z.union([z.string(), z.date()]).transform((value, context) => {
      const normalized = typeof value === "string" ? value : value.toISOString().slice(0, 10);

      if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
        context.addIssue({ code: "custom", message: "date must use YYYY-MM-DD" });
        return z.NEVER;
      }

      return normalized;
    }),
    category: z.string().min(1),
    tags: z.array(z.string()).default([]),
    summary: z.string().min(1),
    comments: z.boolean().default(true),
    lang: z.string().default("zh-CN"),
    sourceRepo: z.string().optional(),
    sourcePath: z.string().optional(),
    sourceUrl: z.url().optional(),
    sourceCommit: z.string().optional()
  })
});

export const collections = { posts };
