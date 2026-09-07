#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DELIVERY_CLOUDS } from './lib/cloudinary-clouds.mjs';

// Either cloud may appear: dlrrtf6bq is legacy and read-only, bwppi9gc takes
// new uploads. The transform requirements are the same on both.
const DELIVERY_URL_RE = new RegExp(
  `^https://res\\.cloudinary\\.com/(?:${DELIVERY_CLOUDS.join('|')})`
  + '/image/upload/[^/]*f_auto[^/]*q_auto[^/]*w_\\d+[^/]*/more-group/gulf/',
);

const ROOT = join(fileURLToPath(new URL('..', import.meta.url)));
const source = JSON.parse(readFileSync(join(ROOT, 'scripts/gulf-cloudinary-source-manifest.json'), 'utf8'));
const uploadState = JSON.parse(readFileSync(join(ROOT, 'scripts/gulf-cloudinary-upload-manifest.json'), 'utf8'));
const dimensions = JSON.parse(readFileSync(join(ROOT, 'src/data/gulf-image-dimensions.json'), 'utf8'));
const uploaded = uploadState.uploaded || {};
const errors = [];
// Every count here was frozen at the one-off migration's numbers. The corpus
// keeps gaining pages, so each one is now read off the manifest and the check
// is that the manifest, the uploads, the dimensions and the corpus agree.
const EXPECTED = source.assets.length;
const ALLOWED_LOCAL_HERO_FALLBACKS = new Set([
  '/images/areas/downtown-dubai/hero.jpg',
  '/images/areas/downtown-dubai/hero-360.webp',
  '/images/areas/downtown-dubai/hero-640.webp',
  '/images/areas/downtown-dubai/hero-960.webp',
  '/images/areas/downtown-dubai/hero-1200.webp',
  '/images/projects/address-residences-dubai-hills/hero.webp',
  '/images/projects/address-residences-dubai-hills/hero-360.webp',
  '/images/projects/address-residences-dubai-hills/hero-640.webp',
  '/images/projects/address-residences-dubai-hills/hero-960.webp',
]);

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

if (Object.keys(uploaded).length !== EXPECTED) errors.push(`upload manifest ${Object.keys(uploaded).length}/${EXPECTED}`);
if (Object.keys(dimensions).length !== EXPECTED) errors.push(`dimension cache ${Object.keys(dimensions).length}/${EXPECTED}`);
if (source.inventory.total_live_references !== source.inventory.mdx_references) {
  errors.push('source reference inventory disagrees with the MDX reference count');
}
if (source.inventory.missing_local_files.length) errors.push('source manifest contains missing local files');
if (source.inventory.public_id_collisions.length) errors.push('source manifest contains public ID collisions');

const localFiles = walk(join(ROOT, 'public/images')).filter((file) => /\.(avif|gif|jpe?g|png|webp)$/i.test(file));
const responsiveLocalDerivatives = new Set(
  [...ALLOWED_LOCAL_HERO_FALLBACKS]
    .filter((url) => /hero-(?:360|640|960|1200)\.webp$/.test(url))
    .map((url) => join(ROOT, 'public', url)),
);
const rollbackFiles = localFiles.filter((file) => !responsiveLocalDerivatives.has(file));
if (rollbackFiles.length !== source.inventory.local_files) {
  errors.push(`rollback inventory ${rollbackFiles.length}/${source.inventory.local_files}`);
}
if ([...responsiveLocalDerivatives].some((file) => !existsSync(file))) {
  errors.push('protected local responsive derivative missing');
}

for (const asset of source.assets) {
  const record = uploaded[asset.local_url];
  if (!record) {
    errors.push(`missing upload: ${asset.local_url}`);
    continue;
  }
  if (
    record.public_id !== asset.public_id
    || record.local_path !== asset.local_path
    || record.source_sha256 !== asset.source_sha256
  ) {
    errors.push(`mapping mismatch: ${asset.local_url}`);
  }
  if (JSON.stringify(record.source_metadata) !== JSON.stringify(asset.source_metadata)) {
    errors.push(`source metadata mismatch: ${asset.local_url}`);
  }
  if (!dimensions[asset.public_id]) errors.push(`missing dimensions: ${asset.public_id}`);
  if (!existsSync(join(ROOT, asset.local_path))) errors.push(`rollback file missing: ${asset.local_path}`);
}

const cloudUrls = [];
for (const file of walk(join(ROOT, 'src')).filter((item) => /\.(astro|css|js|json|md|mdx|mjs|ts|tsx)$/i.test(item))) {
  const text = readFileSync(file, 'utf8');
  const isDeliveryHelper = file.endsWith('/src/lib/responsiveImage.ts');
  const localRefs = text.match(/(?:https:\/\/invest-gulf\.com)?\/images\/[A-Za-z0-9%_./@+(),-]+\.(?:avif|gif|jpe?g|png|webp)/gi) || [];
  const unexpectedLocalRefs = localRefs.filter((ref) => (
    !isDeliveryHelper || !ALLOWED_LOCAL_HERO_FALLBACKS.has(ref.replace('https://invest-gulf.com', ''))
  ));
  if (unexpectedLocalRefs.length) {
    errors.push(`unexpected local delivery refs remain in ${file.replace(`${ROOT}/`, '')}: ${unexpectedLocalRefs.length}`);
  }
  for (const raw of text.match(/https:\/\/res\.cloudinary\.com\/[^\s"'`)>\]]+/g) || []) {
    if (isDeliveryHelper) continue;
    cloudUrls.push(raw);
    if (
      !DELIVERY_URL_RE.test(raw)
    ) {
      errors.push(`bare or unsafe Cloudinary URL in ${file.replace(`${ROOT}/`, '')}`);
    }
  }
}
// New pages reference images that are already uploaded, so the reference count
// only ever grows. Equality would fail on the next page written; what matters is
// that nothing the migration recorded has gone missing.
if (cloudUrls.length < source.inventory.total_live_references) {
  errors.push(
    `render-source Cloudinary refs fell to ${cloudUrls.length}, `
    + `below the ${source.inventory.total_live_references} the manifest recorded`,
  );
}

if (errors.length) {
  console.error(errors.slice(0, 40).join('\n'));
  console.error(`Gulf Cloudinary verification failed: ${errors.length} issue(s)`);
  process.exit(1);
}
console.log(
  `Gulf Cloudinary verification passed: ${EXPECTED}/${EXPECTED} assets, `
  + `${cloudUrls.length} refs, ${rollbackFiles.length} local rollback files, `
  + `${responsiveLocalDerivatives.size} protected responsive derivatives, `
  + 'source metadata and dimensions preserved',
);
