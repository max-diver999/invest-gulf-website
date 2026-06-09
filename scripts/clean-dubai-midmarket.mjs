#!/usr/bin/env node
/** Clean Dubai mid-market property guides — generic tails + dupes. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(import.meta.dirname, '../src/content/guides');
const FILES = [
  'mudon-property-investment.mdx',
  'al-furjan-property-investment.mdx',
  'villanova-property-investment.mdx',
  'motor-city-property-investment.mdx',
  'dubai-production-city-property-investment.mdx',
  'the-valley-dubai-property-investment.mdx',
];

const PRACTICAL_RE =
  /\n## Practical decision filter for Dubai planning[\s\S]*?(?=\n---\n\n## )/g;
const FOOTER = '*Invest Gulf Editorial — 2026-06-05*';

function stripGenericTail(text) {
  return text
    .replace(/\n\n[\w\s]+ resident test:[\s\S]*?(?=\n\n## |\n*$)/g, '')
    .replace(/\n## Local scenario test[\s\S]*?(?=\n\n## |\n*$)/g, '')
    .replace(/\n\*\*[\w\s]+ final rule:\*\*[\s\S]*?(?=\n\n## |\n*$)/g, '')
    .replace(/\\n+/g, '\n');
}

function removeDuplicateAfterFooter(content) {
  const idx = content.indexOf(FOOTER);
  if (idx === -1) return content;
  const before = content.slice(0, idx + FOOTER.length);
  let after = content.slice(idx + FOOTER.length);
  after = stripGenericTail(after);
  const m = after.match(/\n## ([^\n]+)/);
  if (m && before.includes(`## ${m[1]}`)) after = '';
  return before + (after.trim() ? `\n${after.trim()}\n` : '\n');
}

function cleanFirstAreaSection(content) {
  const idx = content.indexOf(FOOTER);
  if (idx === -1) return content;
  return stripGenericTail(content.slice(0, idx)) + content.slice(idx);
}

function bodyWords(content) {
  return content.split(/^---$/m).slice(2).join('---').split(/\s+/).filter(Boolean).length;
}

for (const file of FILES) {
  const path = join(DIR, file);
  let content = readFileSync(path, 'utf8');
  content = content.replace(PRACTICAL_RE, '\n');
  content = cleanFirstAreaSection(content);
  content = removeDuplicateAfterFooter(content);
  content = content.replace(/updatedDate: 2026-06-0[56]/, 'updatedDate: 2026-06-07');
  writeFileSync(path, content);
  console.log(`${file}: ${bodyWords(content)}w, ls=${(content.match(/Local scenario test/g) || []).length}`);
}
