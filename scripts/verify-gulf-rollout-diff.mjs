#!/usr/bin/env node
/** Prove that content files changed only by the declared image URL mapping. */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('..', import.meta.url)));
const source = JSON.parse(readFileSync(join(ROOT, 'scripts/gulf-cloudinary-source-manifest.json'), 'utf8'));
const uploaded = JSON.parse(readFileSync(join(ROOT, 'scripts/gulf-cloudinary-upload-manifest.json'), 'utf8')).uploaded;
const files = new Set(
  source.assets.flatMap((asset) => asset.references.map((reference) => reference.file)),
);
const errors = [];

function deliveryUrl(asset) {
  const width = asset.role === 'hero' ? 1200 : 960;
  return `https://res.cloudinary.com/dlrrtf6bq/image/upload/f_auto,q_auto,w_${width}/${uploaded[asset.local_url].public_id}`;
}

function normalize(text) {
  let result = text;
  for (const asset of source.assets) {
    const token = `__GULF_IMAGE_${asset.source_sha256}__`;
    result = result.split(asset.absolute_local_url).join(token);
    result = result.split(asset.local_url).join(token);
    result = result.split(deliveryUrl(asset)).join(token);
  }
  return result;
}

for (const file of files) {
  const before = execFileSync('git', ['show', `origin/main:${file}`], { cwd: ROOT, encoding: 'utf8' });
  const after = readFileSync(join(ROOT, file), 'utf8');
  if (normalize(before) !== normalize(after)) errors.push(file);
}

if (errors.length) {
  console.error(`Non-image content changes detected in ${errors.length} file(s):`);
  console.error(errors.slice(0, 30).join('\n'));
  process.exit(1);
}
console.log(`Rollout diff verified: ${files.size} content files changed only by declared image URL mapping`);
