#!/usr/bin/env node
/** Surgical duplicate tail trim — Bahrain red-flags block only */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = decodeURIComponent(new URL('../src/content/guides/', import.meta.url).pathname);
const SLUGS = [
  'bahrain-driving-license',
  'bahrain-family-visa',
  'bahrain-healthcare-guide',
  'bahrain-saudi-bridge-commute',
  'bahrain-vs-dubai-living',
  'living-amwaj-islands',
  'living-seef-bahrain',
];
const MARKER = '## Red flags\n\n| Signal | Action |';

for (const slug of SLUGS) {
  const path = join(ROOT, slug + '.mdx');
  const raw = readFileSync(path, 'utf8');
  const m = raw.match(/^---\n[\s\S]*?\n---/);
  if (!m) continue;
  const fm = m[0];
  let body = raw.slice(fm.length);
  const first = body.indexOf(MARKER);
  const second = body.indexOf(MARKER, first + MARKER.length);
  if (second === -1) continue;
  const tail = body.slice(second);
  const related = tail.match(/\n(\*\*Related reading:\*\*[\s\S]*)$/)?.[1] || '';
  body = body.slice(0, second).trimEnd() + '\n\n---\n' + related;
  writeFileSync(path, fm + body);
  console.log('trimmed duplicate red-flags:', slug);
}
