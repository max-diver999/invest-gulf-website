import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import vercel from '@astrojs/vercel';
import {
  collectSitemapExclusions,
  pageIsExcluded,
} from './scripts/lib/sitemap-exclusions.mjs';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const SITE = 'https://invest-gulf.com';

const CONTENT_COLLECTIONS = {
  guides: 'guides',
  compare: 'compare',
  areas: 'areas',
  news: 'news',
  projects: 'projects',
};

const SITEMAP_EXCLUDED = collectSitemapExclusions(ROOT, CONTENT_COLLECTIONS);

export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'always',
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap({
      filter(page) {
        return !pageIsExcluded(page, SITE, SITEMAP_EXCLUDED);
      },
      serialize(item) {
        if (item.url === 'https://invest-gulf.com/') {
          return { ...item, priority: 1.0, changefreq: 'weekly' };
        }
        if (item.url.includes('/guides/')) {
          return { ...item, priority: 0.85, changefreq: 'weekly' };
        }
        if (item.url.includes('/areas/')) {
          return { ...item, priority: 0.88, changefreq: 'weekly' };
        }
        if (item.url.includes('/compare/')) {
          return { ...item, priority: 0.8, changefreq: 'weekly' };
        }
        if (item.url.includes('/projects/')) {
          return { ...item, priority: 0.82, changefreq: 'weekly' };
        }
        if (item.url.includes('/news/')) {
          return { ...item, priority: 0.75, changefreq: 'weekly' };
        }
        return { ...item, priority: 0.7, changefreq: 'monthly' };
      },
    }),
    mdx(),
  ],
});
