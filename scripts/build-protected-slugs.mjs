#!/usr/bin/env node
/**
 * Seed scripts/protected-content-slugs.json from money-pillar list + GSC URL export.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const OUT = join(SCRIPT_DIR, 'protected-content-slugs.json');
const PRUNE = join(SCRIPT_DIR, 'selective-prune-phase2.mjs');
const GSC = join(SCRIPT_DIR, 'gsc-pages-90d.json');

const src = readFileSync(PRUNE, 'utf8');
const block = src.match(/PROTECT_SLUGS = new Set\(\[([\s\S]*?)\]\)/)?.[1] || '';
const protectSlugs = [...block.matchAll(/'([^']+)'/g)].map((m) => m[1]);

const gscSlugs = {};
if (existsSync(GSC)) {
  const data = JSON.parse(readFileSync(GSC, 'utf8'));
  for (const url of data.pages || []) {
    try {
      const parts = new URL(url).pathname.split('/').filter(Boolean);
      if (parts.length < 2) continue;
      const slug = parts[parts.length - 1];
      gscSlugs[slug] = parts[parts.length - 2];
    } catch {
      /* skip */
    }
  }
}

const slugs = {};
for (const slug of protectSlugs) {
  slugs[slug] = {
    collection: gscSlugs[slug] || 'guides',
    protected: true,
    tier: 'A',
    source: 'money-pillar',
  };
}
for (const [slug, collection] of Object.entries(gscSlugs)) {
  if (slugs[slug]) continue;
  slugs[slug] = {
    collection,
    protected: true,
    tier: 'B',
    source: 'gsc-90d-impression',
  };
}

writeFileSync(
  OUT,
  `${JSON.stringify(
    {
      source: `Phase 3 seed ${new Date().toISOString().slice(0, 10)}`,
      rule: 'Never noindex. Upgrade content only.',
      slugs,
    },
    null,
    2,
  )}\n`,
);
console.log(`[build-protected] ${OUT} — ${Object.keys(slugs).length} slugs`);
