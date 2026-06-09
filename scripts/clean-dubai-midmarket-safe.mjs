#!/usr/bin/env node
/** Safe mid-market clean: remove Practical filter + everything AFTER editorial footer only. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(import.meta.dirname, '../src/content/guides');
const FILES = [
  'motor-city-property-investment.mdx',
  'dubai-production-city-property-investment.mdx',
  'the-valley-dubai-property-investment.mdx',
];

const PRACTICAL_RE =
  /\n## Practical decision filter for Dubai planning[\s\S]*?(?=\n---\n\n## )/g;
const FOOTER = '*Invest Gulf Editorial — 2026-06-05*';

for (const file of FILES) {
  let content = readFileSync(join(DIR, file), 'utf8');
  content = content.replace(PRACTICAL_RE, '\n');
  content = content.replace(/(\w+) note: \1 note:/g, '$1 note:');
  content = content.replace(/---\*\*/g, '---\n\n**');
  const idx = content.indexOf(FOOTER);
  if (idx !== -1) content = content.slice(0, idx + FOOTER.length) + '\n';
  content = content.replace(/\\n+/g, '\n');
  content = content.replace(/updatedDate: 2026-06-0[56]/, 'updatedDate: 2026-06-07');
  writeFileSync(join(DIR, file), content);
  const w = content.split(/^---$/m).slice(2).join('---').split(/\s+/).filter(Boolean).length;
  console.log(`${file}: ${w}w`);
}
