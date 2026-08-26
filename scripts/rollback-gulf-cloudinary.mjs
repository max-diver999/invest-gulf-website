#!/usr/bin/env node
/** Atomically restore local delivery without deleting uploads or rollback files. */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('..', import.meta.url)));
const source = JSON.parse(readFileSync(join(ROOT, 'scripts/gulf-cloudinary-source-manifest.json'), 'utf8'));
const uploaded = JSON.parse(readFileSync(join(ROOT, 'scripts/gulf-cloudinary-upload-manifest.json'), 'utf8')).uploaded;
const dryRun = process.argv.includes('--dry-run');

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const replacements = source.assets.map((asset) => {
  const record = uploaded[asset.local_url];
  if (!record || record.public_id !== asset.public_id) {
    throw new Error(`Upload mapping mismatch: ${asset.local_url}`);
  }
  const width = asset.role === 'hero' ? 1200 : 960;
  return {
    cloud: `https://res.cloudinary.com/dlrrtf6bq/image/upload/f_auto,q_auto,w_${width}/${record.public_id}`,
    local: asset.local_url,
  };
});

const pending = [];
let restored = 0;
for (const file of walk(join(ROOT, 'src')).filter((item) => /\.(astro|css|js|json|md|mdx|mjs|ts|tsx)$/i.test(item))) {
  const raw = readFileSync(file, 'utf8');
  let next = raw;
  for (const replacement of replacements) {
    const count = next.split(replacement.cloud).length - 1;
    if (!count) continue;
    next = next.split(replacement.cloud).join(replacement.local);
    restored += count;
  }
  if (next !== raw) pending.push({ file, next });
}

if (restored !== source.inventory.total_live_references || restored !== 767) {
  throw new Error(`Rollback blocked: restored ${restored}/767 references`);
}
if (!dryRun) for (const item of pending) writeFileSync(item.file, item.next);
console.log(
  `${dryRun ? 'Would restore' : 'Restored'} ${restored} references in ${pending.length} files; `
  + 'Cloudinary uploads and all local rollback files retained',
);
