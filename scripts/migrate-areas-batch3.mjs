#!/usr/bin/env node
/**
 * Batch3 areas — migrate 4 remaining district guides (guides/ → areas/).
 * Usage: node scripts/migrate-areas-batch3.mjs [--dry]
 */
import { AREA_SLUGS_BATCH3 } from './lib/area-slugs.mjs';
import { migrateAreaSlugs } from './lib/migrate-areas-lib.mjs';

const DRY = process.argv.includes('--dry');
migrateAreaSlugs(AREA_SLUGS_BATCH3, { dry: DRY, label: 'MIGRATE AREAS BATCH3' });
