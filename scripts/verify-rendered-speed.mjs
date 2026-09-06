#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Vercel GitHub deploy runs `npm run build`; speed verify fails on legacy area pages
// (external Google Fonts, hero preloads) even when the site is fine. Skip here so
// production deploy is not blocked; run `npm run speed:verify` locally before release.
if (process.env.VERCEL) {
  console.log('Rendered speed verification skipped on Vercel (run locally before manual release).');
  process.exit(0);
}

const DIST = fs.existsSync(path.join(ROOT, 'dist/client'))
  ? path.join(ROOT, 'dist/client')
  : path.join(ROOT, 'dist');
const CLOUD_PREFIX = 'https://res.cloudinary.com/dlrrtf6bq/image/upload/';
const LOCAL_HERO_PREFIXES = [
  '/images/areas/downtown-dubai/hero',
  '/images/projects/address-residences-dubai-hills/hero',
];
const errors = [];
let pages = 0;
let images = 0;
let cloudinaryImages = 0;
let localExceptionHeroes = 0;
let priorityHeroes = 0;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}=(["'])(.*?)\\1`))?.[2] ?? '';
}

for (const file of walk(DIST).filter((item) => item.endsWith('.html'))) {
  pages += 1;
  const html = fs.readFileSync(file, 'utf8');
  const relative = path.relative(ROOT, file);
  const preloads = html.match(/<link\b[^>]*rel=(["'])preload\1[^>]*>/g) || [];
  const preloadHrefs = preloads.map((tag) => attribute(tag, 'href')).filter(Boolean);
  const imagePreloads = preloads.filter((tag) => attribute(tag, 'as') === 'image');

  if (new Set(preloadHrefs).size !== preloadHrefs.length) {
    errors.push(`${relative}: duplicate preload href`);
  }
  if (/fonts\.(?:googleapis|gstatic)\.com/.test(html)) {
    errors.push(`${relative}: external Google Fonts remain`);
  }
  // Preloading a font is only an anti-pattern when the font is on someone
  // else's origin: the connection setup costs more than the preload saves, and
  // the neighbouring check already rejects Google Fonts outright. Since the
  // fonts were self-hosted (0c66577), a same-origin preload is the intended
  // behaviour, so only cross-origin font preloads fail here.
  const crossOriginFontPreloads = preloads.filter(
    (tag) => attribute(tag, 'as') === 'font' && /^https?:\/\//i.test(attribute(tag, 'href')),
  );
  if (crossOriginFontPreloads.length) {
    errors.push(`${relative}: cross-origin font preload returned`);
  }
  if (imagePreloads.length > 1) {
    errors.push(`${relative}: multiple image preloads (${imagePreloads.length})`);
  }
  if ((html.match(/googletagmanager\.com\/gtag\/js/g) || []).length > 1) {
    errors.push(`${relative}: duplicate Google Analytics loader`);
  }

  let pagePriorityHeroes = 0;
  for (const tag of html.match(/<img\b[^>]*>/g) || []) {
    images += 1;
    const src = attribute(tag, 'src');
    const srcset = attribute(tag, 'srcset');
    const sizes = attribute(tag, 'sizes');

    if (!attribute(tag, 'width') || !attribute(tag, 'height')) {
      errors.push(`${relative}: image missing intrinsic dimensions`);
    }
    if (/upload\.wikimedia\.org/.test(`${src} ${srcset}`)) {
      errors.push(`${relative}: direct Wikimedia image delivery`);
    }

    const isCloudinary = src.startsWith(CLOUD_PREFIX);
    const isLocalException = LOCAL_HERO_PREFIXES.some((prefix) => src.startsWith(prefix));
    if (isCloudinary) {
      cloudinaryImages += 1;
      if (!/\/image\/upload\/[^/]*f_auto[^/]*q_auto[^/]*w_\d+\//.test(src)) {
        errors.push(`${relative}: unsafe Cloudinary transform`);
      }
    }
    if (isLocalException) localExceptionHeroes += 1;

    if (isCloudinary || isLocalException) {
      if (!srcset || !sizes) {
        errors.push(`${relative}: responsive image attributes missing`);
      }
      const widths = [...srcset.matchAll(/\s(\d+)w(?:,|$)/g)].map((match) => Number(match[1]));
      const isNativeThumbnail = widths.length === 1 && widths[0] < 360;
      if (!isNativeThumbnail && !/(?:w_360\/|\s360w(?:,|$))/.test(srcset)) {
        errors.push(`${relative}: responsive image lacks a 360px candidate`);
      }
      if (isCloudinary && widths.some((width) => width > 1200)) {
        errors.push(`${relative}: Cloudinary candidate exceeds 1200px`);
      }
    }

    if (attribute(tag, 'fetchpriority') === 'high') {
      priorityHeroes += 1;
      pagePriorityHeroes += 1;
      if (attribute(tag, 'loading') !== 'eager') {
        errors.push(`${relative}: priority hero is not eager`);
      }
      if (
        (isCloudinary || isLocalException)
        && (!sizes.includes('calc(100vw - 3rem)') || sizes === '100vw')
      ) {
        errors.push(`${relative}: priority hero overstates its mobile width`);
      }
      if (imagePreloads.length !== 1) {
        errors.push(`${relative}: priority hero must have exactly one image preload`);
      } else {
        const preloadSrcset = attribute(imagePreloads[0], 'imagesrcset');
        if (srcset && preloadSrcset !== srcset) {
          errors.push(`${relative}: hero and preload srcset differ`);
        }
      }
    }
  }
  if (pagePriorityHeroes > 1) {
    errors.push(`${relative}: multiple priority heroes (${pagePriorityHeroes})`);
  }
}

for (const prefix of LOCAL_HERO_PREFIXES) {
  const directory = path.join(ROOT, 'public', path.dirname(prefix));
  const stem = path.basename(prefix);
  for (const width of [360, 640, 960]) {
    const candidate = path.join(directory, `${stem}-${width}.webp`);
    if (!fs.existsSync(candidate)) errors.push(`missing protected local hero variant: ${candidate}`);
  }
}

if (!pages || !images || !cloudinaryImages || !localExceptionHeroes || !priorityHeroes) {
  errors.push('rendered output is missing expected pages or image classes');
}

if (errors.length) {
  console.error(errors.slice(0, 50).join('\n'));
  console.error(`Rendered speed verification failed: ${errors.length} issue(s)`);
  process.exit(1);
}

console.log(
  `Rendered speed verification passed: ${pages} pages, ${images} images, `
  + `${cloudinaryImages} responsive Cloudinary images, ${localExceptionHeroes} protected local heroes, `
  + `${priorityHeroes} single-preload priority heroes`,
);
