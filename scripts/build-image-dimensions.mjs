#!/usr/bin/env node
/** Regenerate scripts/data/image-dimensions.json from public/images. */
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://invest-gulf.com';

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
mkdirSync(join(ROOT, 'scripts/data'), { recursive: true });
writeFileSync(join(ROOT, 'scripts/data/image-dimensions.json'), JSON.stringify(map));
console.log(`Wrote image-dimensions.json (${Object.keys(map).length / 2} images)`);
