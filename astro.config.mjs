import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://invest-gulf.com',
  output: 'static',
  trailingSlash: 'always',
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap({
      filter(page) {
        return !page.includes('/thanks/');
      },
      serialize(item) {
        if (item.url === 'https://invest-gulf.com/') {
          return { ...item, priority: 1.0, changefreq: 'weekly' };
        }
        if (item.url.includes('/guides/')) {
          return { ...item, priority: 0.85, changefreq: 'weekly' };
        }
        if (item.url.includes('/compare/')) {
          return { ...item, priority: 0.8, changefreq: 'weekly' };
        }
        return { ...item, priority: 0.7, changefreq: 'monthly' };
      },
    }),
    mdx(),
  ],
});
