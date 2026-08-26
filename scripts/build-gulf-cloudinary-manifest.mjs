#!/usr/bin/env node
import { createHash } from 'node:crypto';
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(fileURLToPath(new URL('..', import.meta.url)));
const SRC = join(ROOT, 'src');
const PUBLIC = join(ROOT, 'public');
const OUTPUT = join(ROOT, 'scripts/gulf-cloudinary-source-manifest.json');
const AREA_SOURCE = join(ROOT, 'scripts/gulf-area-images-all.json');
const SITE = 'https://invest-gulf.com';
const PREFIX = 'more-group/gulf';
const TEXT_EXTENSIONS = /\.(astro|css|js|json|md|mdx|mjs|ts|tsx)$/i;
const LOCAL_IMAGE_RE = /(?:https:\/\/invest-gulf\.com)?(\/images\/[A-Za-z0-9%_./@+(),-]+\.(?:avif|gif|jpe?g|png|webp))/gi;

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function cleanSlug(value) {
  return decodeURIComponent(value)
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'asset';
}

function classify(localUrl, references) {
  const parts = localUrl.split('/').filter(Boolean);
  const pathCollection = cleanSlug(parts[1] || 'editorial');
  const fileBase = cleanSlug(basename(localUrl));
  const folder = parts.length > 3 ? cleanSlug(parts.at(-2)) : fileBase;
  const heroReference = references.some((ref) => ref.context === 'heroImage');
  const role = heroReference || /^hero(?:-|$)/.test(fileBase) ? 'hero' : fileBase;
  const collection = ['areas', 'projects', 'heroes', 'guides'].includes(pathCollection)
    ? pathCollection
    : 'editorial';
  const stableSlug = parts.length > 3 ? folder : fileBase;
  const pathHash = sha256(localUrl).slice(0, 10);
  const roleOrHash = role === 'hero' ? `hero-${pathHash}` : `${role}-${pathHash}`;
  return { collection, stableSlug, role, publicId: `${PREFIX}/${collection}/${stableSlug}/${roleOrHash}` };
}

function referenceContext(text, index) {
  const lineStart = text.lastIndexOf('\n', index) + 1;
  const lineEnd = text.indexOf('\n', index);
  const line = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd);
  return /^\s*heroImage\s*:/.test(line) ? 'heroImage' : 'body';
}

const areaMetadata = new Map();
if (existsSync(AREA_SOURCE)) {
  const source = JSON.parse(readFileSync(AREA_SOURCE, 'utf8'));
  for (const article of source.articles || []) {
    for (const image of article.images || []) {
      const pathname = new URL(image.url, SITE).pathname;
      areaMetadata.set(pathname, {
        article_slug: article.slug,
        article_file: article.file,
        role: image.role,
        alt: image.alt,
        source: image.source,
      });
    }
  }
}

const refsByUrl = new Map();
let totalReferences = 0;
let mdxReferences = 0;
for (const file of walk(SRC).filter((item) => TEXT_EXTENSIONS.test(item))) {
  const text = readFileSync(file, 'utf8');
  const fileRel = relative(ROOT, file).split(sep).join('/');
  for (const match of text.matchAll(LOCAL_IMAGE_RE)) {
    const localUrl = decodeURI(match[1]);
    const ref = { file: fileRel, context: referenceContext(text, match.index ?? 0) };
    const refs = refsByUrl.get(localUrl) || [];
    refs.push(ref);
    refsByUrl.set(localUrl, refs);
    totalReferences += 1;
    if (/\.mdx?$/i.test(file)) mdxReferences += 1;
  }
}

const localFiles = walk(join(PUBLIC, 'images')).filter((file) => /\.(avif|gif|jpe?g|png|webp)$/i.test(file));
const assets = [];
const missing = [];
for (const [localUrl, rawReferences] of [...refsByUrl.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const localPath = join(PUBLIC, localUrl.replace(/^\//, ''));
  if (!existsSync(localPath)) {
    missing.push(localUrl);
    continue;
  }
  const referenceCounts = new Map();
  for (const ref of rawReferences) {
    const key = `${ref.file}\0${ref.context}`;
    referenceCounts.set(key, (referenceCounts.get(key) || 0) + 1);
  }
  const references = [...referenceCounts.entries()].map(([key, count]) => {
    const [file, context] = key.split('\0');
    return { file, context, count };
  });
  const data = readFileSync(localPath);
  const metadata = await sharp(data).metadata();
  const classified = classify(localUrl, references);
  assets.push({
    key: localUrl,
    local_url: localUrl,
    absolute_local_url: `${SITE}${localUrl}`,
    local_path: relative(ROOT, localPath).split(sep).join('/'),
    source_sha256: sha256(data),
    bytes: data.byteLength,
    width: metadata.width,
    height: metadata.height,
    format: metadata.format || extname(localPath).slice(1),
    collection: classified.collection,
    stable_slug: classified.stableSlug,
    role: classified.role,
    public_id: classified.publicId,
    references,
    source_metadata: areaMetadata.get(localUrl) || null,
  });
}

const collisions = [];
const publicIds = new Map();
for (const asset of assets) {
  const previous = publicIds.get(asset.public_id);
  if (previous && previous !== asset.local_url) collisions.push([asset.public_id, previous, asset.local_url]);
  publicIds.set(asset.public_id, asset.local_url);
}

const unreferencedLocalFiles = localFiles
  .map((file) => `/${relative(PUBLIC, file).split(sep).join('/')}`)
  .filter((url) => !refsByUrl.has(url))
  .sort();

const manifest = {
  version: 1,
  generated_at: new Date().toISOString(),
  site: SITE,
  cloud: 'dlrrtf6bq',
  prefix: PREFIX,
  inventory: {
    local_files: localFiles.length,
    distinct_live_local_urls: refsByUrl.size,
    total_live_references: totalReferences,
    mdx_references: mdxReferences,
    mapped_assets: assets.length,
    missing_local_files: missing,
    public_id_collisions: collisions,
    unreferenced_local_files: unreferencedLocalFiles,
  },
  assets,
};

if (missing.length || collisions.length || assets.length !== refsByUrl.size) {
  console.error(JSON.stringify(manifest.inventory, null, 2));
  process.exit(1);
}
writeFileSync(OUTPUT, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest.inventory, null, 2));
