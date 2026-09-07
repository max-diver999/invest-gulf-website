#!/usr/bin/env node
/** Regenerate public/llms-full.txt from src/content slugs. */
import { readdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { frontmatterOf, urlPathFrom } from './lib/content-urls.mjs';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://invest-gulf.com';
const COLS = ['guides', 'areas', 'compare', 'projects', 'news', 'hubs'];

const lines = [
  '# Invest Gulf — full site map for AI crawlers',
  '',
  `Site: ${SITE}`,
  'Contact: info@invest-gulf.com',
  `Updated: ${new Date().toISOString().slice(0, 10)}`,
  '',
];

const hubs = [
  '/',
  '/guides/',
  '/areas/',
  '/compare/',
  '/projects/',
  '/news/',
  '/get-shortlist/',
  '/contact/',
  '/methodology/',
  '/about/',
  '/invest-dubai-property/',
  '/golden-visa-dubai-property/',
];
lines.push('## Hubs', ...hubs.map((h) => `- ${SITE}${h}`), '');

for (const coll of COLS) {
  const dir = join(ROOT, 'src/content', coll);
  if (!existsSync(dir)) continue;
  // Only advertise indexable pages: pointing AI crawlers at noindex URLs
  // contradicts the robots directive those same pages send.
  const urls = readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => ({ file: f, fm: frontmatterOf(readFileSync(join(dir, f), 'utf8')) }))
    .filter(({ fm }) => !/^noindex:\s*true\s*$/m.test(fm))
    .map(({ file, fm }) => urlPathFrom(coll, file.replace(/\.mdx$/, ''), fm))
    .sort();
  lines.push(`## ${coll} (${urls.length})`);
  for (const url of urls) {
    lines.push(`- ${SITE}${url}`);
  }
  lines.push('');
}

writeFileSync(join(ROOT, 'public/llms-full.txt'), lines.join('\n') + '\n');
console.log(`Wrote llms-full.txt (${lines.length} lines)`);
