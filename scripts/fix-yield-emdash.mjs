#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseMdx,
  humanizeBodyLines,
  humanizeFrontmatter,
  forceUnderEmLimit,
  analyzeHumanSignals,
  EM_DASH_LIMIT,
} from './lib/human-signals.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const FILES = [
  'src/content/compare/dubai-vs-saudi-rental-yield.mdx',
  'src/content/compare/rak-vs-dubai-rental-yield.mdx',
  'src/content/guides/bahrain-rental-yield-guide.mdx',
  'src/content/guides/sharjah-rental-yield-guide.mdx',
  'src/content/guides/jeddah-rental-yield-guide.mdx',
];

for (const rel of FILES) {
  const path = join(ROOT, rel);
  const raw = readFileSync(path, 'utf8');
  const { fm, body } = parseMdx(raw);
  const coll = rel.split('/')[2];
  const emLimit = EM_DASH_LIMIT[coll] ?? 8;

  let newFm = fm;
  let newBody = body;
  const hf = humanizeFrontmatter(fm);
  newFm = hf.fm;
  const hb = humanizeBodyLines(body, { includeTables: true });
  newBody = hb.body;
  newBody = forceUnderEmLimit(newBody, emLimit);

  const check = analyzeHumanSignals(newBody, { emLimit });
  const text = `---\n${newFm}\n---${newBody}`;
  writeFileSync(path, text);
  console.log(rel, 'em/500w:', check.emPer500.toFixed(1), 'issues:', check.issues.length);
}
