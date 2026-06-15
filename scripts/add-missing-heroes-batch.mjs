#!/usr/bin/env node
/** Add heroImage to MDX files missing it. Usage: node scripts/add-missing-heroes-batch.mjs [--limit N] [--dry] */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '../src/content');
const COLLECTIONS = ['guides', 'areas', 'compare'];
const LIMIT = (() => {
  const i = process.argv.indexOf('--limit');
  return i !== -1 ? parseInt(process.argv[i + 1], 10) : 80;
})();
const DRY = process.argv.includes('--dry');

const HEROES = [
  'https://invest-gulf.com/images/heroes/dubai-marina.jpg',
  'https://invest-gulf.com/images/heroes/dubai-skyline.jpg',
  'https://invest-gulf.com/images/heroes/luxury-villa.jpg',
  'https://invest-gulf.com/images/heroes/modern-tower.jpg',
  'https://invest-gulf.com/images/heroes/glass-towers.jpg',
  'https://invest-gulf.com/images/heroes/coastal-resort.jpg',
  'https://invest-gulf.com/images/heroes/waterfront.jpg',
  'https://invest-gulf.com/images/heroes/interior-luxury.jpg',
  'https://invest-gulf.com/images/heroes/gulf-business.jpg',
];

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const missing = [];
for (const coll of COLLECTIONS) {
  const dir = join(ROOT, coll);
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.mdx')).sort()) {
    const path = join(dir, file);
    const content = readFileSync(path, 'utf8');
    if (/^heroImage:/m.test(content)) continue;
    missing.push({ coll, file, path });
  }
}

const batch = missing.slice(0, LIMIT);
console.log(`Missing total: ${missing.length}, batch: ${batch.length}${DRY ? ' (dry)' : ''}`);

for (const { coll, file, path } of batch) {
  let content = readFileSync(path, 'utf8');
  const hero = HEROES[hash(file) % HEROES.length];
  if (/^readingTime:/m.test(content)) {
    content = content.replace(/^(readingTime:.*)$/m, `$1\nheroImage: "${hero}"`);
  } else if (/^category:/m.test(content)) {
    content = content.replace(/^(category:.*)$/m, `$1\nheroImage: "${hero}"`);
  } else {
    console.warn(`Skip ${coll}/${file} — no readingTime`);
    continue;
  }
  if (/^updatedDate:/m.test(content)) {
    content = content.replace(/^updatedDate:.*$/m, 'updatedDate: 2026-06-07');
  } else if (/^pubDate:/m.test(content)) {
    content = content.replace(/^(pubDate:.*)$/m, `$1\nupdatedDate: 2026-06-07`);
  }
  if (!DRY) writeFileSync(path, content);
  console.log(`+ ${coll}/${file}`);
}

if (!DRY && batch.length) {
  writeFileSync(
    join(import.meta.dirname, 'last-hero-batch.txt'),
    batch.map(({ coll, file }) => `${coll}/${file.replace('.mdx', '')}`).join('\n'),
  );
}
