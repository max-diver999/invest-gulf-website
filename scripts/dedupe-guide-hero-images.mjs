#!/usr/bin/env node
/**
 * Remove misassigned project heroes from guides/compare/news and spread
 * overused area heroes using per-slug regional rotation.
 *
 * Usage:
 *   node scripts/dedupe-guide-hero-images.mjs
 *   node scripts/dedupe-guide-hero-images.mjs --apply
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  pickCanonicalHero,
  parseFrontmatter,
  slugMatchesProjectHero,
} from './lib/invest-gulf-hero-picker.mjs';

const ROOT = join(import.meta.dirname, '..');
const CONTENT = join(ROOT, 'src/content');
const APPLY = process.argv.includes('--apply');
const CONTENT_COLLECTIONS = ['guides', 'compare', 'news'];
const ALL_COLLECTIONS = ['guides', 'areas', 'compare', 'projects', 'news'];

const changes = [];

for (const coll of ALL_COLLECTIONS) {
  const dir = join(CONTENT, coll);
  if (!existsSync(dir)) continue;

  for (const file of readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
    const rel = `${coll}/${file}`;
    const path = join(dir, file);
    const raw = readFileSync(path, 'utf8');
    const parsed = parseFrontmatter(raw);
    if (!parsed?.hero) continue;

    const slug = file.replace(/\.mdx$/, '');
    const newHero = pickCanonicalHero({
      collection: coll,
      slug,
      tags: parsed.tags,
      title: parsed.title,
    });

    const isContentPage = CONTENT_COLLECTIONS.includes(coll);
    const wrongProject =
      isContentPage && parsed.hero.includes('/images/projects/') && !slugMatchesProjectHero(slug, parsed.hero);

    const needsUpdate = wrongProject || newHero !== parsed.hero;
    if (!needsUpdate) continue;

    changes.push({
      rel,
      slug,
      collection: coll,
      oldHero: parsed.hero,
      newHero,
      reason: wrongProject ? 'unrelated-project-hero' : 'canonical-resync',
    });

    if (APPLY) {
      writeFileSync(path, raw.replace(/^heroImage:\s*"[^"]+"/m, `heroImage: "${newHero}"`));
    }
  }
}

console.log('=== Dedupe guide/compare hero images ===');
console.log(`Mode: ${APPLY ? 'APPLY' : 'dry-run'}`);
console.log(`Updates: ${changes.length}`);
console.log(`  unrelated project hero: ${changes.filter((c) => c.reason === 'unrelated-project-hero').length}`);
console.log(`  canonical resync: ${changes.filter((c) => c.reason === 'canonical-resync').length}\n`);

const byOld = changes.reduce((acc, c) => {
  const key = c.oldHero.replace('https://invest-gulf.com', '');
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});
console.log('Top replaced heroes:');
for (const [k, v] of Object.entries(byOld).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
  console.log(`  ${v}\t${k}`);
}

console.log('\nSample:');
for (const c of changes.slice(0, 10)) {
  console.log(`  ${c.rel} (${c.reason})`);
  console.log(`    → ${c.newHero.replace('https://invest-gulf.com', '')}`);
}

if (APPLY) {
  writeFileSync(join(import.meta.dirname, 'last-dedupe-hero-log.json'), JSON.stringify(changes, null, 2));
  console.log('\nLog: scripts/last-dedupe-hero-log.json');
} else {
  console.log('\nRun with --apply to write.');
}
