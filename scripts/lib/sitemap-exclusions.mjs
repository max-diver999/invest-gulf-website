import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export function collectSitemapExclusions(root, collections) {
  const paths = new Set(['/site-report/', '/thanks/', '/404/']);

  for (const [dir, segment] of Object.entries(collections)) {
    const contentDir = join(root, 'src/content', dir);
    if (!existsSync(contentDir)) continue;
    for (const file of readdirSync(contentDir)) {
      if (!file.endsWith('.mdx')) continue;
      const src = readFileSync(join(contentDir, file), 'utf8');
      const fm = src.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
      if (/^noindex:\s*true\s*$/m.test(fm)) {
        paths.add(`/${segment}/${file.replace(/\.mdx$/, '')}/`);
      }
    }
  }

  const vercelPath = join(root, 'vercel.json');
  if (existsSync(vercelPath)) {
    const vercel = JSON.parse(readFileSync(vercelPath, 'utf8'));
    for (const rule of vercel.redirects ?? []) {
      if (rule.has?.some((h) => h.type === 'host')) continue;
      if (!rule.source || rule.source === '/:path*') continue;
      paths.add(normalizeRedirectSource(rule.source));
    }
  }

  return [...paths].sort();
}

function normalizeRedirectSource(source) {
  let s = source
    .replace(/\{path\*\}/g, '')
    .replace(/\{\/\}\?/g, '')
    .replace(/\?$/g, '');
  if (!s.startsWith('/')) s = `/${s}`;
  if (!s.endsWith('/')) s = `${s}/`;
  return s;
}

export function pageIsExcluded(pageUrl, site, excludedPaths) {
  const path = pageUrl.replace(site, '').replace(/\/$/, '') || '/';
  return excludedPaths.some((ex) => {
    const norm = ex.replace(/\/$/, '') || '/';
    return path === norm || pageUrl.includes(ex);
  });
}
