#!/usr/bin/env node
/**
 * Deep external audit — live HTML crawl (links, images, typography, dupes).
 * Usage: node scripts/audit-external-deep.mjs [--json]
 */
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const HOST = 'https://invest-gulf.com';
const CONCURRENCY = 8;
const jsonOut = process.argv.includes('--json');

function curl(url, method = 'GET') {
  const r = spawnSync(
    'curl',
    ['-sS', '-A', 'Mozilla/5.0', '-m', '25', '-w', '\n%{http_code}', '-X', method, '-o', '-', url],
    { encoding: 'utf8', maxBuffer: 25 * 1024 * 1024 },
  );
  if (r.error) return { status: 0, body: '', err: r.error.message };
  const lines = r.stdout.split('\n');
  const code = parseInt(lines.pop() || '0', 10);
  return { status: code, body: lines.join('\n') };
}

const WATERMARK_RE = /watermark|shutterstock|gettyimages|istockphoto|alamy|dreamstime|depositphotos|123rf|stockphoto/i;
const BAD_IMG_HOST = /unsplash\.com|picsum\.|placeholder\.|via\.placeholder|loremflickr/i;
const CURLY_RE = /[\u201C\u201D\u2018\u2019]/;

function abs(u, base) {
  if (!u || u.startsWith('#') || u.startsWith('mailto:') || u.startsWith('tel:') || u.startsWith('javascript:')) {
    return null;
  }
  try {
    return new URL(u, base).href;
  } catch {
    return null;
  }
}

function extractImgs(html, base) {
  const out = [];
  for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
    const u = abs(m[1], base);
    if (u) out.push(u);
  }
  for (const m of html.matchAll(/srcset=["']([^"']+)["']/gi)) {
    for (const part of m[1].split(',')) {
      const u = abs(part.trim().split(/\s+/)[0], base);
      if (u) out.push(u);
    }
  }
  return [...new Set(out)];
}

const idx = curl(`${HOST}/sitemap-index.xml`).body;
const maps = [...idx.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const pages = [
  ...new Set(
    maps.flatMap((sm) => [...curl(sm).body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])),
  ),
];

const issues = {
  httpError: [],
  imgBroken: [],
  imgSuspicious: [],
  imgWatermark: [],
  emDash: [],
  curly: [],
  dupLocal: [],
  boiler: [],
  placeholder: [],
  multiLead: [],
};
const globalPara = new Map();
const linkCache = new Map();

function auditPage(url) {
  const { status, body: html } = curl(url);
  if (status !== 200) {
    issues.httpError.push({ url, status });
    return;
  }
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = (text.match(/\b[\w']+\b/g) || []).length;
  const em = (html.match(/—/g) || []).length;
  if (words > 100 && (em / words) * 500 > 12) {
    issues.emDash.push({ url, em, per500: ((em / words) * 500).toFixed(1) });
  }
  if (CURLY_RE.test(html)) issues.curly.push(url);
  if (/Related guide [1-9]/i.test(html)) issues.placeholder.push({ url, what: 'Related guide N' });
  if (/\[verify|source needed/i.test(html)) issues.placeholder.push({ url, what: 'draft' });
  if ((html.match(/id="lead-form"/g) || []).length > 1) issues.multiLead.push(url);
  if (/extra context \d+/i.test(html)) issues.boiler.push({ url, what: 'extra context' });
  if (/holding and exit notes/i.test(html)) issues.boiler.push({ url, what: 'holding exit' });

  const seen = new Set();
  for (const p of text.split(/\. /).map((x) => x.trim().toLowerCase()).filter((x) => x.length > 100)) {
    const h = createHash('md5').update(p).digest('hex');
    if (seen.has(h)) issues.dupLocal.push(url);
    seen.add(h);
    if (!globalPara.has(h)) globalPara.set(h, []);
    globalPara.get(h).push(url);
  }

  for (const img of extractImgs(html, url)) {
    if (BAD_IMG_HOST.test(img)) issues.imgSuspicious.push({ page: url, img });
    if (WATERMARK_RE.test(img)) issues.imgWatermark.push({ page: url, img });
    const h = curl(img, 'HEAD');
    if (h.status !== 200 && h.status !== 405) issues.imgBroken.push({ page: url, img, status: h.status });
  }

  const links = [
    ...new Set(
      [...html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)]
        .map((m) => abs(m[1], url))
        .filter((u) => u && u.includes('invest-gulf.com')),
    ),
  ];
  for (const l of links) {
    if (!linkCache.has(l)) linkCache.set(l, curl(l, 'HEAD').status);
    if (linkCache.get(l) >= 400) issues.httpError.push({ url: l, status: linkCache.get(l), from: url });
  }
}

let i = 0;
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (i < pages.length) {
      const u = pages[i++];
      auditPage(u);
    }
  }),
);

const cross = [...globalPara.values()].filter((u) => new Set(u).size > 1).sort((a, b) => b.length - a.length);

const summary = {
  pages: pages.length,
  linksChecked: linkCache.size,
  httpError: issues.httpError.length,
  imgBroken: issues.imgBroken.length,
  imgSuspicious: issues.imgSuspicious.length,
  imgWatermark: issues.imgWatermark.length,
  emDashHeavy: issues.emDash.length,
  curlyQuotes: issues.curly.length,
  dupLocalPages: new Set(issues.dupLocal).size,
  boilerplate: issues.boiler.length,
  placeholder: issues.placeholder.length,
  multiLeadForm: issues.multiLead.length,
  crossPageDupes: cross.length,
};

if (jsonOut) {
  console.log(JSON.stringify({ summary, issues, crossDupes: cross.slice(0, 20).map((u) => ({ n: u.length, pages: u.slice(0, 5) })) }, null, 2));
} else {
  console.log('=== DEEP EXTERNAL AUDIT (live HTML) ===');
  console.log(summary);
  const show = (label, arr, n = 8) => {
    console.log(`\n${label}: ${arr.length}`);
    for (const x of arr.slice(0, n)) console.log(' ', typeof x === 'string' ? x : JSON.stringify(x));
    if (arr.length > n) console.log(`  ... +${arr.length - n}`);
  };
  show('HTTP errors', issues.httpError);
  show('Broken images', issues.imgBroken);
  show('Unsplash/stock hosts (live)', issues.imgSuspicious);
  show('Watermark URL pattern', issues.imgWatermark);
  show('Em-dash heavy rendered', issues.emDash.sort((a, b) => b.per500 - a.per500));
  show('Curly quotes', issues.curly);
  show('Boilerplate', issues.boiler);
  show('Placeholders', issues.placeholder);
  console.log(`\nCross-page duplicate blocks: ${cross.length}`);
  for (const u of cross.slice(0, 6)) console.log(`  ${u.length}× shared: ${u[0]}`);
}
