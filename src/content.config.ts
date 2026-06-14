import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articleSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  author: z.string().default('Invest Gulf Editorial'),
  category: z.string().default('guides'),
  tags: z.array(z.string()).default([]),
  heroImage: z.string().optional(),
  readingTime: z.number().optional(),
  relatedSlugs: z.array(z.string()).default([]),
  noindex: z.boolean().default(false),
  faq: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .optional(),
});

const projectSchema = articleSchema.extend({
  category: z.string().default('projects'),
  heroImage: z.string(),
  developer: z.string(),
  market: z.enum(['dubai', 'abu-dhabi', 'rak', 'sharjah', 'ajman', 'other']).default('dubai'),
  area: z.string().optional(),
  status: z.enum(['off-plan', 'completed']).default('off-plan'),
  priceFromAED: z.number().optional(),
  priceFromUSD: z.number().optional(),
});

const newsSchema = articleSchema.extend({
  category: z.string().default('news'),
  featured: z.boolean().default(false),
});

export const collections = {
  guides: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/guides' }),
    schema: articleSchema,
  }),
  compare: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/compare' }),
    schema: articleSchema,
  }),
  areas: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/areas' }),
    schema: articleSchema.extend({
      category: z.string().default('areas'),
    }),
  }),
  projects: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
    schema: projectSchema,
  }),
  news: defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/news' }),
    schema: newsSchema,
  }),
};
