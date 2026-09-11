#!/usr/bin/env node
/**
 * Reads the built output, not the source, and fails when a rendered page links to a
 * URL that vercel.json redirects away, or when a page is built on such a URL.
 *
 * Guessing a page's URL from its file path misses sites where one collection feeds two
 * routes: on this site a district carries an explicit `path` and serves under /uae/,
 * while its old /areas/<id>/ URL is a 301 source. Only the build knows which URLs exist.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = ['.vercel/output/static', 'dist'].map((d) => join(ROOT, d)).find(existsSync);
if (!OUT) { console.log('[links-to-redirects] skipped: no build output'); process.exit(0); }

function normalise(u) {
  let s = String(u).replace(/\{path\*\}/g, '').replace(/\{\/\}\?/g, '').replace(/\(\.\*\)/g, '').replace(/\?$/, '');
  if (!s.startsWith('/')) s = `/${s}`;
  return `${s.replace(/\/$/, '')}/`;
}

function redirectSources() {
  const p = join(ROOT, 'vercel.json');
  if (!existsSync(p)) return new Set();
  const { redirects = [] } = JSON.parse(readFileSync(p, 'utf8'));
  const out = new Set();
  for (const r of redirects) {
    if (r.has?.some((h) => h.type === 'host')) continue;
    if (!r.source || r.source === '/:path*') continue;
    const source = normalise(r.source);
    // A trailing-slash normaliser (/gajdy -> /gajdy/) has the same normalised source and
    // destination. It does not take a URL away from anything, so linking to it is fine.
    if (r.destination && normalise(r.destination) === source) continue;
    out.add(source);
  }
  return out;
}

const redirected = redirectSources();
if (!redirected.size) { console.log('[links-to-redirects] ✓ no redirect rules to check'); process.exit(0); }

const pages = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name === 'index.html') pages.push(p);
  }
})(OUT);

const linking = new Map();
const built = [];
for (const p of pages) {
  const url = `/${relative(OUT, dirname(p))}/`.replace('/./', '/').replace(/^\/\.\//, '/');
  const clean = url === '//' ? '/' : url;
  if (redirected.has(clean)) built.push(clean);
  const html = readFileSync(p, 'utf8');
  for (const m of html.matchAll(/href="(\/[^"#?]*?)"/g)) {
    const href = m[1] === '/' ? '/' : `${m[1].replace(/\/$/, '')}/`;
    if (redirected.has(href)) {
      if (!linking.has(href)) linking.set(href, new Set());
      linking.get(href).add(clean);
    }
  }
}

const total = [...linking.values()].reduce((n, s) => n + s.size, 0);
if (!built.length && !linking.size) {
  console.log(`[links-to-redirects] ✓ ${pages.length} pages, none built on a redirected URL, none linking to one`);
  process.exit(0);
}
console.log('\n[links-to-redirects] ✗ the build disagrees with vercel.json');
if (built.length) {
  console.log(`  ${built.length} page(s) built on a URL that redirects away, so they can never be served:`);
  for (const u of built.slice(0, 10)) console.log(`    ${u}`);
}
if (linking.size) {
  console.log(`  ${linking.size} redirected URL(s) are linked from ${total} page(s):`);
  for (const [u, from] of [...linking].sort((a, b) => b[1].size - a[1].size).slice(0, 10)) {
    console.log(`    ${u}  linked from ${from.size} page(s)`);
  }
}
process.exit(1);
