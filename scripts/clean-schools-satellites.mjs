#!/usr/bin/env node
/** Surgical school guide cleanup — remove generic blocks, keep one unique area section. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(import.meta.dirname, '../src/content/guides');

function stripGenericTail(text) {
  return text
    .replace(/\n\n[\w\s]+ resident test:[\s\S]*?(?=\n\n---|\n*$)/g, '')
    .replace(/\n## Local scenario test[\s\S]*?(?=\n\n---|\n*$)/g, '')
    .replace(/\n\*\*[\w\s]+ final rule:\*\*[\s\S]*?(?=\n\n---|\n*$)/g, '');
}

function removePracticalFilter(content) {
  return content.replace(
    /\n## Practical decision filter for Dubai planning[\s\S]*?(?=\n---\n\n## )/g,
    '\n',
  );
}

function removeDuplicateAfterFooter(content) {
  const footer = '*Invest Gulf Editorial — 2026-06-05*';
  const idx = content.indexOf(footer);
  if (idx === -1) return content;
  const before = content.slice(0, idx + footer.length);
  let after = content.slice(idx + footer.length);
  after = stripGenericTail(after);
  // Drop fully duplicated ## section (second copy of same heading)
  const headingMatch = after.match(/\n## ([^\n]+)/);
  if (headingMatch) {
    const h = headingMatch[1];
    const beforeFooter = before;
    const firstOcc = beforeFooter.lastIndexOf(`## ${h}`);
    if (firstOcc !== -1) {
      after = '';
    }
  }
  return before + (after ? `\n${after.trim()}\n` : '\n');
}

function cleanFirstAreaSection(content) {
  const footer = '*Invest Gulf Editorial — 2026-06-05*';
  const idx = content.indexOf(footer);
  if (idx === -1) return content;
  const before = content.slice(0, idx);
  const after = content.slice(idx);
  return stripGenericTail(before) + after;
}

const configs = [
  { file: 'schools-near-dubai-hills.mdx', crossCheck: '\n**Budget cross-check:** stack [school fees by curriculum](/guides/dubai-school-fees-by-curriculum/), [monthly family budget](/guides/dubai-monthly-budget-expat-family/), and Hills rent before signing.\n' },
  { file: 'schools-near-dubai-marina.mdx', crossCheck: '\n**Budget cross-check:** Marina rent plus school bus often exceeds JLT totals — model via [hidden costs living Dubai](/guides/hidden-costs-living-dubai/) and [rent by area](/guides/dubai-rent-prices-by-area/).\n' },
  { file: 'schools-near-arabian-ranches.mdx', crossCheck: '\n**Budget cross-check:** JESS fees plus villa rent — use [Arabian Ranches property investment](/guides/arabian-ranches-property-investment/) yield math with full school line.\n' },
  { file: 'how-to-choose-school-dubai.mdx', crossCheck: '' },
];

for (const { file, crossCheck } of configs) {
  const path = join(DIR, file);
  let content = readFileSync(path, 'utf8');
  content = removePracticalFilter(content);
  content = cleanFirstAreaSection(content);
  content = removeDuplicateAfterFooter(content);
  if (crossCheck && !content.includes('Budget cross-check')) {
    const insertAt = content.indexOf('\n---\n\n## FAQ');
    if (insertAt !== -1) {
      content = content.slice(0, insertAt) + crossCheck + content.slice(insertAt);
    }
  }
  content = content.replace(/updatedDate: 2026-06-0[56]/, 'updatedDate: 2026-06-07');
  writeFileSync(path, content);
  const words = content.split(/^---$/m).slice(2).join('---').split(/\s+/).filter(Boolean).length;
  console.log(`${file}: ${words}w, dup=${(content.match(/Local scenario test/g) || []).length}`);
}
