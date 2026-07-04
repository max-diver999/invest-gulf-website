#!/usr/bin/env node
/**
 * Inject CommercialBridge mid-article on tier-A money pillars.
 *
 * Usage:
 *   node scripts/inject-commercial-bridge.mjs
 *   node scripts/inject-commercial-bridge.mjs --apply
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveCtaRoute, makeCtaId } from './lib/invest-gulf-cta-router.mjs';

const APPLY = process.argv.includes('--apply');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROTECTED = join(ROOT, 'scripts/protected-content-slugs.json');
const CONTENT = join(ROOT, 'src/content');

const IMPORT_LINE = "import CommercialBridge from '../../components/CommercialBridge.astro';";

/** Tier A money pillars from protected list */
function loadTargetSlugs() {
  const data = JSON.parse(readFileSync(PROTECTED, 'utf8'));
  return Object.entries(data.slugs || {})
    .filter(([, v]) => v.tier === 'A' || v.source === 'money-pillar')
    .map(([slug, v]) => ({ slug, collection: v.collection || 'guides' }));
}

function injectBridge(raw, variant, slug) {
  if (/CommercialBridge/.test(raw)) return { raw, status: 'skip-existing' };

  const fmEnd = raw.indexOf('\n---\n', 4);
  if (fmEnd === -1) return { raw, status: 'no-frontmatter' };
  const body = raw.slice(fmEnd + 5);

  const h2matches = [...body.matchAll(/^## .+$/gm)];
  if (h2matches.length < 2) return { raw, status: 'needs-2-h2' };

  const secondH2 = h2matches[1];
  const h2Idx = body.indexOf(secondH2[0]);
  const afterH2 = body.slice(h2Idx + secondH2[0].length);
  const paraEnd = afterH2.search(/\n\n/);
  const insertAt = fmEnd + 5 + h2Idx + secondH2[0].length + (paraEnd >= 0 ? paraEnd : 0);

  const ctaId = makeCtaId(`bridge_${variant}`, slug);
  const block = `\n<CommercialBridge variant="${variant}" ctaId="${ctaId}" />\n`;
  let next = raw.slice(0, insertAt) + block + raw.slice(insertAt);

  if (!next.includes(IMPORT_LINE)) {
    const anchor = next.indexOf('import InlineCta');
    if (anchor >= 0) {
      next = next.replace('import InlineCta', `${IMPORT_LINE}\nimport InlineCta`);
    } else {
      next = next.replace('\n---\n\n', `\n---\n\n${IMPORT_LINE}\n\n`);
    }
  }

  return { raw: next, status: APPLY ? 'applied' : 'would-apply' };
}

const targets = loadTargetSlugs();
const results = [];

function findMdxPath(slug, preferredCollection) {
  const candidates = [preferredCollection, 'guides', 'compare', 'areas', 'projects', 'news'];
  for (const collection of [...new Set(candidates)]) {
    const path = join(CONTENT, collection, `${slug}.mdx`);
    if (existsSync(path)) return { path, collection };
  }
  return null;
}

for (const { slug, collection: preferred } of targets) {
  const found = findMdxPath(slug, preferred);
  if (!found) {
    results.push({ slug, status: 'missing' });
    continue;
  }
  const { path, collection } = found;
  const raw = readFileSync(path, 'utf8');
  const title = raw.match(/^title:\s*"(.*)"/m)?.[1] || '';
  const { bridgeVariant } = resolveCtaRoute({ collection, slug, title });
  const { raw: next, status } = injectBridge(raw, bridgeVariant, slug);
  if (APPLY && status === 'applied') writeFileSync(path, next);
  results.push({ slug, status, variant: bridgeVariant });
}

const applied = results.filter((r) => r.status === 'applied' || r.status === 'would-apply');
console.log(`Mode: ${APPLY ? 'APPLY' : 'dry-run'}`);
console.log(`Targets: ${targets.length} | Bridge injected: ${applied.length}`);
for (const r of results.filter((x) => !['applied', 'would-apply', 'skip-existing'].includes(x.status)).slice(0, 10)) {
  console.log(`  ${r.status}: ${r.slug}`);
}
console.log(`Skipped (already has bridge): ${results.filter((r) => r.status === 'skip-existing').length}`);
