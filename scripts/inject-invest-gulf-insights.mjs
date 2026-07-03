#!/usr/bin/env node
/**
 * Inject InvestGulfInsight blocks into money-pillar guides (Phase 3 GEO).
 *
 * Usage:
 *   node scripts/inject-invest-gulf-insights.mjs           # dry-run
 *   node scripts/inject-invest-gulf-insights.mjs --apply
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const APPLY = process.argv.includes('--apply');
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SCRIPT_DIR, '..');
const GUIDES = join(ROOT, 'src/content/guides');
const DATA = join(SCRIPT_DIR, 'data/invest-gulf-insights.json');

const insights = JSON.parse(readFileSync(DATA, 'utf8'));
const IMPORT_LINE = "import InvestGulfInsight from '../../components/InvestGulfInsight.astro';";

function buildBlock(text) {
  return `\n<InvestGulfInsight>\n\n${text.trim()}\n\n</InvestGulfInsight>\n`;
}

function inject(slug, text) {
  const path = join(GUIDES, `${slug}.mdx`);
  if (!existsSync(path)) return { slug, status: 'missing' };
  let raw = readFileSync(path, 'utf8');
  if (/InvestGulfInsight/.test(raw)) return { slug, status: 'skip-existing' };

  const fmEnd = raw.indexOf('\n---\n', 4);
  if (fmEnd === -1) return { slug, status: 'no-frontmatter' };
  const body = raw.slice(fmEnd + 5);

  const h2 = body.match(/^## .+$/m);
  if (!h2) return { slug, status: 'no-h2' };
  const h2Idx = body.indexOf(h2[0]);
  const afterH2 = body.slice(h2Idx + h2[0].length);
  const paraEnd = afterH2.search(/\n\n/);
  const insertAt = fmEnd + 5 + h2Idx + h2[0].length + (paraEnd >= 0 ? paraEnd : 0);

  const block = buildBlock(text);
  raw = raw.slice(0, insertAt) + block + raw.slice(insertAt);

  if (!raw.includes(IMPORT_LINE)) {
    const importAnchor = raw.indexOf("import TldrBlock");
    if (importAnchor >= 0) {
      raw = raw.replace("import TldrBlock", `${IMPORT_LINE}\nimport TldrBlock`);
    } else {
      raw = raw.replace('\n---\n\n', `\n---\n\n${IMPORT_LINE}\n\n`);
    }
  }

  if (APPLY) writeFileSync(path, raw);
  return { slug, status: APPLY ? 'applied' : 'would-apply' };
}

const results = [];
for (const [slug, text] of Object.entries(insights)) {
  results.push(inject(slug, text));
}

const applied = results.filter((r) => r.status === 'applied' || r.status === 'would-apply');
console.log(`Mode: ${APPLY ? 'APPLY' : 'dry-run'}`);
console.log(`Insights in data: ${Object.keys(insights).length}`);
console.log(`Injected: ${applied.length}`);
for (const r of results.filter((r) => !['applied', 'would-apply', 'skip-existing'].includes(r.status))) {
  console.log(`  ${r.status}: ${r.slug}`);
}
console.log(`Skipped (already has block): ${results.filter((r) => r.status === 'skip-existing').length}`);
