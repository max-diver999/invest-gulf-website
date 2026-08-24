import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import { rehypeImageAttrs } from './scripts/lib/rehype-image-attrs.mjs';
import vercel from '@astrojs/vercel';
import {
  collectSitemapExclusions,
  pageIsExcluded,
} from './scripts/lib/sitemap-exclusions.mjs';
import referenceConfig from './reference-infra.config.json' with { type: 'json' };
import { collectContentLastmod } from './scripts/reference-infra/content-lastmod.mjs';

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
const CONTENT_LASTMOD = await collectContentLastmod(referenceConfig, { root: ROOT });
const LASTMOD_BY_URL = new Map(CONTENT_LASTMOD.map((item) => [item.url, item.lastmod]));

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
        const lastmod = LASTMOD_BY_URL.get(item.url);
        const page = lastmod
          ? { ...item, lastmod: new Date(`${lastmod}T00:00:00Z`) }
          : item;
        if (item.url === 'https://invest-gulf.com/') {
          return { ...page, priority: 1.0, changefreq: 'weekly' };
        }
        if (item.url.includes('/guides/')) {
          return { ...page, priority: 0.85, changefreq: 'weekly' };
        }
        if (item.url.includes('/areas/')) {
          return { ...page, priority: 0.88, changefreq: 'weekly' };
        }
        if (item.url.includes('/compare/')) {
          return { ...page, priority: 0.8, changefreq: 'weekly' };
        }
        if (item.url.includes('/projects/')) {
          return { ...page, priority: 0.82, changefreq: 'weekly' };
        }
        if (item.url.includes('/news/')) {
          return { ...page, priority: 0.75, changefreq: 'weekly' };
        }
        return { ...page, priority: 0.7, changefreq: 'monthly' };
      },
    }),
    mdx({ rehypePlugins: [rehypeImageAttrs] }),
  ],
});
