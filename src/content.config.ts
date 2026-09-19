import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const date = z.coerce.date();
const related = {
  relatedWork: z.array(z.string()).default([]),
  relatedWriting: z.array(z.string()).default([]),
};

const work = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/work' }),
  schema: ({ image }) => z.object({
    title: z.string(), summary: z.string(), status: z.string(),
    startDate: date.optional(), endDate: date.optional(),
    featured: z.boolean().default(false), tags: z.array(z.string()).default([]),
    github: z.url().optional(), external: z.url().optional(),
    cover: image().optional(), coverAlt: z.string().optional(),
    ...related,
  }).refine((data) => !data.cover || Boolean(data.coverAlt?.trim()), {
    message: 'A cover image needs descriptive coverAlt text.', path: ['coverAlt'],
  }),
});

const writing = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(), description: z.string(),
    published: date.optional(), updated: date.optional(),
    tags: z.array(z.string()).default([]),
    type: z.enum(['essay', 'architecture', 'postmortem', 'experiment', 'benchmark', 'research-note']),
    draft: z.boolean().default(true),
    ...related,
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

export const collections = { work, writing, pages };
