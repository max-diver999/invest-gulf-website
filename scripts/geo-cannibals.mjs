#!/usr/bin/env node
/**
 * Pairs of pages that share too much text to be separate pages.
 *
 * The scorer already penalises a document for duplication against the corpus as
 * a whole, but that number cannot tell you WHICH page is the twin, and a
 * rewrite needs the pair. This walks the shingle index and reports, for every
 * pair sharing at least MIN_SHARED nine-word sequences, how much of the smaller
 * document the overlap accounts for.
 *
 * Usage: node scripts/geo-cannibals.mjs [--min 60] [--json] [--top 40]
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildCorpusIndex } from './lib/geo/corpus-signals.mjs';

const CONTENT_ROOT = 'src/content';
const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? Number(args[i + 1]) : fallback;
};
const MIN_SHARED = arg('--min', 60);
const TOP = arg('--top', 40);
const jsonOut = args.includes('--json');

function corpusFiles(dir = CONTENT_ROOT, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) corpusFiles(full, out);
    else if (e.name.endsWith('.mdx') || e.name.endsWith('.md')) out.push(full);
  }
  return out;
}

const files = corpusFiles();
const docs = files.map((f) => ({ id: f, raw: fs.readFileSync(f, 'utf8') }));
const index = buildCorpusIndex(docs);
const sizes = new Map(index.prepared.map((d) => [d.id, d.shingles.size]));

// Count co-occurrences by walking each shingle's owner set rather than
// comparing every pair: the corpus is ~600 files, but most shingles are unique
// so the owner sets are tiny and this stays linear in shared sequences.
const pairs = new Map();
for (const owners of index.shingleOwners.values()) {
  if (owners.size < 2) continue;
  // A sequence owned by a very large number of files is boilerplate-shaped, not
  // evidence that two specific pages are twins.
  if (owners.size > 12) continue;
  const list = [...owners];
  for (let i = 0; i < list.length; i += 1) {
    for (let j = i + 1; j < list.length; j += 1) {
      const key = list[i] < list[j] ? `${list[i]}\t${list[j]}` : `${list[j]}\t${list[i]}`;
      pairs.set(key, (pairs.get(key) || 0) + 1);
    }
  }
}

const rows = [];
for (const [key, shared] of pairs) {
  if (shared < MIN_SHARED) continue;
  const [a, b] = key.split('\t');
  const smaller = Math.min(sizes.get(a) || 1, sizes.get(b) || 1);
  rows.push({ a, b, shared, smaller, share: shared / smaller });
}
rows.sort((x, y) => y.share - x.share || y.shared - x.shared);

if (jsonOut) {
  console.log(JSON.stringify(rows.slice(0, TOP), null, 2));
} else {
  console.log(`=== cannibal pairs (>= ${MIN_SHARED} shared 9-grams) ===`);
  console.log(`corpus ${docs.length} files, ${rows.length} pairs over threshold`);
  console.log('');
  for (const r of rows.slice(0, TOP)) {
    const pct = (r.share * 100).toFixed(1).padStart(5);
    console.log(`${pct}%  ${String(r.shared).padStart(5)}/${String(r.smaller).padEnd(5)}  ${r.a.replace('src/content/', '')}`);
    console.log(`                        ${r.b.replace('src/content/', '')}`);
    console.log('');
  }
}
