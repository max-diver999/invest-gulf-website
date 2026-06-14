#!/usr/bin/env node
/**
 * P2 — move map-100 area guides from guides/ → areas/ + rewrite internal links.
 * Usage: node scripts/migrate-areas-p2.mjs [--dry]
 */
import { AREA_SLUGS_MAP100, AREA_SLUGS } from './lib/area-slugs.mjs';
import { migrateAreaSlugs } from './lib/migrate-areas-lib.mjs';

export { AREA_SLUGS, AREA_SLUGS_MAP100 };

const isMain = process.argv[1]?.endsWith('migrate-areas-p2.mjs');
if (isMain) {
  const DRY = process.argv.includes('--dry');
  migrateAreaSlugs(AREA_SLUGS_MAP100, { dry: DRY, label: 'MIGRATE AREAS P2 (map-100)' });
}
