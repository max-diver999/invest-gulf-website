#!/usr/bin/env node
/**
 * Route InlineCta buttonHref to intent-specific money landings.
 *
 * Usage:
 *   node scripts/route-inline-cta-hrefs.mjs
 *   node scripts/route-inline-cta-hrefs.mjs --apply
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveCtaRoute, makeCtaId } from './lib/invest-gulf-cta-router.mjs';

const APPLY = process.argv.includes('--apply');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'src/content');
const COLLECTIONS = ['guides', 'compare', 'areas', 'projects', 'news'];

const stats = { scanned: 0, updated: 0, skipped: 0 };

for (const collection of COLLECTIONS) {
  const dir = join(CONTENT, collection);
  if (!existsSync(dir)) continue;

  for (const file of readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
    const slug = file.replace(/\.mdx$/, '');
    const path = join(dir, file);
    let raw = readFileSync(path, 'utf8');
    stats.scanned += 1;

    if (!raw.includes('<InlineCta')) {
      stats.skipped += 1;
      continue;
    }

    const title = raw.match(/^title:\s*"(.*)"/m)?.[1] || '';
    const { buttonHref, ctaIdPrefix } = resolveCtaRoute({ collection, slug, title });
    const ctaId = makeCtaId(ctaIdPrefix, slug);

    const next = raw.replace(
      /<InlineCta([\s\S]*?)buttonHref="[^"]*"([\s\S]*?)>/g,
      (match, a, b) => {
        if (match.includes(`buttonHref="${buttonHref}"`) && match.includes(`ctaId="${ctaId}"`)) return match;
        let block = `<InlineCta${a}buttonHref="${buttonHref}"${b}>`;
        if (/ctaId="/.test(block)) {
          block = block.replace(/ctaId="[^"]*"/, `ctaId="${ctaId}"`);
        } else {
          block = block.replace('<InlineCta', `<InlineCta\n  ctaId="${ctaId}"`);
        }
        return block;
      },
    );

    if (next === raw) {
      stats.skipped += 1;
      continue;
    }

    stats.updated += 1;
    if (APPLY) writeFileSync(path, next);
  }
}

console.log(`Mode: ${APPLY ? 'APPLY' : 'dry-run'}`);
console.log(`Scanned: ${stats.scanned} | Updated: ${stats.updated} | Unchanged: ${stats.skipped}`);
