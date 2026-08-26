#!/usr/bin/env node
/** Regenerate scripts/data/image-dimensions.json from public/images. */
import { readdirSync, writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://invest-gulf.com';
const CLOUD = 'dlrrtf6bq';
const UPLOAD_MANIFEST = join(ROOT, 'scripts/gulf-cloudinary-upload-manifest.json');

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (/\.(jpe?g|png|webp)$/i.test(e.name)) out.push(p);
  }
  return out;
}

const map = {};
for (const file of walk(join(ROOT, 'public/images'))) {
  const meta = await sharp(file).metadata();
  const rel = '/' + relative(join(ROOT, 'public'), file).split(sep).join('/');
  const dims = { width: meta.width, height: meta.height };
  map[rel] = dims;
  map[SITE + rel] = dims;
}
let cloudCount = 0;
if (existsSync(UPLOAD_MANIFEST)) {
  const uploaded = JSON.parse(readFileSync(UPLOAD_MANIFEST, 'utf8')).uploaded || {};
  for (const item of Object.values(uploaded)) {
    const dims = { width: Number(item.width), height: Number(item.height) };
    if (!dims.width || !dims.height) continue;
    map[item.public_id] = dims;
    for (const width of [640, 960, 1200]) {
      const url = `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto,w_${width}/${item.public_id}`;
      map[url] = dims;
    }
    cloudCount += 1;
  }
}
mkdirSync(join(ROOT, 'scripts/data'), { recursive: true });
writeFileSync(join(ROOT, 'scripts/data/image-dimensions.json'), JSON.stringify(map));
console.log(`Wrote image-dimensions.json (${cloudCount} Cloudinary assets; local fallback retained)`);
