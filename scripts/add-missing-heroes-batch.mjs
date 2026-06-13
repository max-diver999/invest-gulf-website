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
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80',
  'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80',
  'https://images.unsplash.com/photo-1486712590487-83b5bbf1b114?w=1200&q=80',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80',
  'https://images.unsplash.com/photo-1566073771259-6a8506099925?w=1200&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
  'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=1200&q=80',
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80',
  'https://images.unsplash.com/photo-1573844598162-65db1fd5d8f4?w=1200&q=80',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80',
  'https://images.unsplash.com/photo-1563013547-7f01c488a8e1?w=1200&q=80',
  'https://images.unsplash.com/photo-1597074863935-3f9dd18687d9?w=1200&q=80',
  'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&q=80',
  'https://images.unsplash.com/photo-1544622357-20f1d3392c8d?w=1200&q=80',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
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
