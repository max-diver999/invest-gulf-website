#!/usr/bin/env node
/**
 * Atomically switch every live local image reference after all uploads exist.
 * Local files remain untouched as rollback.
 */
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('..', import.meta.url)));
const SOURCE_PATH = join(ROOT, 'scripts/gulf-cloudinary-source-manifest.json');
const UPLOAD_PATH = join(ROOT, 'scripts/gulf-cloudinary-upload-manifest.json');
const CLOUD_DIMENSIONS_PATH = join(ROOT, 'src/data/gulf-image-dimensions.json');
const CLOUD = 'dlrrtf6bq';
const PREFIX = 'more-group/gulf/';
const EXPECTED = 285;
const dryRun = process.argv.includes('--dry-run');
const TEXT_EXTENSIONS = /\.(astro|css|js|json|md|mdx|mjs|ts|tsx)$/i;

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function deliveryUrl(publicId, width) {
  if (!publicId.startsWith(PREFIX)) throw new Error(`Unexpected Gulf public ID: ${publicId}`);
  return `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto,w_${width}/${publicId}`;
}

if (!existsSync(SOURCE_PATH) || !existsSync(UPLOAD_PATH)) {
  throw new Error('Source and upload manifests are required before rollout');
}
const source = JSON.parse(readFileSync(SOURCE_PATH, 'utf8'));
const uploadState = JSON.parse(readFileSync(UPLOAD_PATH, 'utf8'));
const assets = source.assets || [];
const uploaded = uploadState.uploaded || {};
if (
  assets.length !== EXPECTED
  || source.inventory.mapped_assets !== EXPECTED
  || source.inventory.missing_local_files.length
  || source.inventory.public_id_collisions.length
  || Object.keys(uploaded).length !== EXPECTED
) {
  throw new Error(
    `Atomic rollout blocked: expected ${EXPECTED} complete assets, got `
    + `${assets.length} source and ${Object.keys(uploaded).length} uploaded`,
  );
}

const replacements = [];
const dimensions = {};
for (const asset of assets) {
  const record = uploaded[asset.local_url];
  if (!record) throw new Error(`Missing upload: ${asset.local_url}`);
  if (
    record.public_id !== asset.public_id
    || record.source_sha256 !== asset.source_sha256
    || record.local_path !== asset.local_path
  ) {
    throw new Error(`Source/upload mismatch: ${asset.local_url}`);
  }
  if (JSON.stringify(record.source_metadata) !== JSON.stringify(asset.source_metadata)) {
    throw new Error(`Source metadata mismatch: ${asset.local_url}`);
  }
  const width = Number(record.width);
  const height = Number(record.height);
  if (!width || !height || Math.max(width, height) > 1920) {
    throw new Error(`Invalid uploaded dimensions: ${asset.local_url} ${width}x${height}`);
  }
  dimensions[record.public_id] = { width, height };
  const deliveryWidth = asset.role === 'hero' ? 1200 : 960;
  replacements.push({
    local: asset.local_url,
    absolute: asset.absolute_local_url,
    cloud: deliveryUrl(record.public_id, deliveryWidth),
    expected: asset.references.reduce((sum, ref) => sum + ref.count, 0),
  });
}

const files = walk(join(ROOT, 'src')).filter((file) => TEXT_EXTENSIONS.test(file));
const pendingWrites = [];
let replacementCount = 0;
for (const file of files) {
  const raw = readFileSync(file, 'utf8');
  let next = raw;
  for (const replacement of replacements) {
    const absoluteCount = next.split(replacement.absolute).length - 1;
    if (absoluteCount) {
      next = next.split(replacement.absolute).join(replacement.cloud);
      replacementCount += absoluteCount;
    }
    const localCount = next.split(replacement.local).length - 1;
    if (localCount) {
      next = next.split(replacement.local).join(replacement.cloud);
      replacementCount += localCount;
    }
  }
  if (next !== raw) pendingWrites.push({ file, next });
}

const expectedReferences = replacements.reduce((sum, item) => sum + item.expected, 0);
if (replacementCount !== expectedReferences || replacementCount !== source.inventory.total_live_references) {
  throw new Error(
    `Atomic rollout blocked: replacement count ${replacementCount}, expected ${expectedReferences}`,
  );
}

const localFilesBefore = walk(join(ROOT, 'public/images'))
  .filter((file) => /\.(avif|gif|jpe?g|png|webp)$/i.test(file))
  .map((file) => ({
    path: relative(ROOT, file).split(sep).join('/'),
    bytes: statSync(file).size,
  }));
if (localFilesBefore.length !== source.inventory.local_files) {
  throw new Error(`Rollback inventory changed: ${localFilesBefore.length} local files`);
}

if (!dryRun) {
  for (const { file, next } of pendingWrites) writeFileSync(file, next);
  writeFileSync(
    CLOUD_DIMENSIONS_PATH,
    `${JSON.stringify(Object.fromEntries(Object.entries(dimensions).sort()), null, 2)}\n`,
  );
}
console.log(
  `${dryRun ? 'Would replace' : 'Replaced'} ${replacementCount} references in `
  + `${pendingWrites.length} files; ${localFilesBefore.length} rollback files untouched`,
);
