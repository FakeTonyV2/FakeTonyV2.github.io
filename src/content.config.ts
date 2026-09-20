import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const date = z.coerce.date();
const writing = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(), description: z.string(),
    published: date.optional(), updated: date.optional(),
    tags: z.array(z.string()).default([]),
    type: z.enum(['essay', 'architecture', 'postmortem', 'experiment', 'benchmark', 'research-note']),
    draft: z.boolean().default(true),
    relatedWriting: z.array(z.string()).default([]),
  }).refine((data) => data.draft || Boolean(data.published), {
    message: 'Published articles require a published date.', path: ['published'],
  }).refine((data) => !data.updated || !data.published || data.updated >= data.published, {
    message: 'updated cannot precede published.', path: ['updated'],
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z.object({ title: z.string(), description: z.string(), updated: date.optional() }),
});

export const collections = { writing, pages };
