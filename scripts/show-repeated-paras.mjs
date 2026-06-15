#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../src/content');
const COLS = ['guides', 'compare', 'areas'];

function parseBody(raw) {
  const m = raw.match(/^---\n[\s\S]*?\n---/);
  return m ? raw.slice(m[0].length) : raw;
}

function normText(s) {
  return s.replace(/\s+/g, ' ').trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
}

const paraHash = new Map();
for (const coll of COLS) {
  const dir = join(ROOT, coll);
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.mdx'))) {
    const body = parseBody(readFileSync(join(dir, f), 'utf8'));
    for (const para of body.split(/\n\n+/)) {
      const clean = normText(para.replace(/\[.*?\]\(.*?\)/g, ''));
      if (clean.length < 120) continue;
      const h = createHash('md5').update(clean.slice(0, 400)).digest('hex');
      if (!paraHash.has(h)) paraHash.set(h, { text: para.trim(), ids: [] });
      paraHash.get(h).ids.push(`${coll}/${f.replace('.mdx', '')}`);
    }
  }
}

const top = [...paraHash.values()]
  .map((v) => ({ ...v, count: new Set(v.ids).size }))
  .filter((v) => v.count >= 3)
  .sort((a, b) => b.count - a.count);

for (const item of top.slice(0, 5)) {
  console.log(`\n=== ${item.count} files ===`);
  console.log(item.text.slice(0, 350));
  console.log('...', item.ids.slice(0, 4).join(', '));
}
