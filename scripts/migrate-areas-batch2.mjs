#!/usr/bin/env node
/**
 * Batch2 areas — migrate 31 remaining ARE slugs (GULF_RE_CONTENT_MAP_BATCH2).
 * Usage: node scripts/migrate-areas-batch2.mjs [--dry]
 */
import { AREA_SLUGS_BATCH2 } from './lib/area-slugs.mjs';
import { migrateAreaSlugs } from './lib/migrate-areas-lib.mjs';

const DRY = process.argv.includes('--dry');
migrateAreaSlugs(AREA_SLUGS_BATCH2, { dry: DRY, label: 'MIGRATE AREAS BATCH2' });
