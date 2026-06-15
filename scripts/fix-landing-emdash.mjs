#!/usr/bin/env node
/** Replace typographic em dashes in Astro pages and site config (commercial landings). */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function walkAstro(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkAstro(p, out);
    else if (name.endsWith('.astro')) out.push(p);
  }
  return out;
}

function fixEmDash(text) {
  return text
    .split('\n')
    .map((line) => {
      if (/title=/.test(line)) return line.replace(/ — /g, ': ').replace(/—/g, ': ');
      return line.replace(/ — /g, ', ').replace(/—/g, ', ');
    })
    .join('\n');
}

function fixFile(path) {
  const text = readFileSync(path, 'utf8');
  const next = fixEmDash(text);
  if (next !== text) {
    writeFileSync(path, next);
    return true;
  }
  return false;
}

const targets = [
  ...walkAstro(join(ROOT, 'src/pages')).filter((p) => !p.includes('site-report')),
  join(ROOT, 'src/data/site.ts'),
  join(ROOT, 'src/layouts/ArticleLayout.astro'),
  join(ROOT, 'src/layouts/BaseLayout.astro'),
];

let n = 0;
for (const p of targets) {
  if (fixFile(p)) {
    n++;
    console.log('fixed', p.replace(ROOT + '/', ''));
  }
}
console.log(`Done: ${n} files`);
