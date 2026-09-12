#!/usr/bin/env node
/**
 * Drop from llms.txt and index.md any page the build actually closed.
 *
 * check-agent-index.mjs reads frontmatter, so it catches a page marked noindex in
 * its source. It cannot catch a page the template closes at build time from data,
 * which is how the thin collection pages on several of these sites work. This runs
 * after the build, reads the HTML that was really produced, and removes the entries
 * whose page is missing or carries a noindex robots meta.
 *
 * An answer engine reads these files instead of crawling, so a closed page listed
 * there is a page it will quote wrongly or fail to reach.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, loadConfig } from './lib.mjs';

const cfg = loadConfig();
const OUT_DIRS = ['.vercel/output/static', 'dist/client', 'dist']
  .map((d) => path.join(ROOT, d))
  .filter((d) => fs.existsSync(path.join(d, 'index.html')));

if (OUT_DIRS.length === 0) {
  console.log('[prune-agent-index] no build output found, skipped');
  process.exit(0);
}

const host = cfg.host.replace(/\./g, '\\.');
const urlRx = new RegExp(`https?://${host}(/[^)\\s\\]<>"']*)`);

/** true when the built page is missing or closed to indexing */
function isClosed(outDir, urlPath) {
  const clean = urlPath.replace(/[.,;:]+$/, '');
  if (/\.[a-z0-9]+$/i.test(clean)) return false; // a file, not a page
  const file = path.join(outDir, clean.replace(/^\//, ''), 'index.html');
  if (!fs.existsSync(file)) return true;
  const html = fs.readFileSync(file, 'utf8');
  return /<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);
}

let totalRemoved = 0;
for (const outDir of OUT_DIRS) {
  for (const name of ['llms.txt', 'index.md']) {
    const file = path.join(outDir, name);
    if (!fs.existsSync(file)) continue;
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    const kept = [];
    let removed = 0;
    for (const line of lines) {
      const m = line.match(urlRx);
      if (m && /^\s*[-*]\s/.test(line) && isClosed(outDir, m[1])) {
        removed += 1;
        continue;
      }
      kept.push(line);
    }
    if (removed) {
      fs.writeFileSync(file, kept.join('\n'), 'utf8');
      console.log(`[prune-agent-index] ${path.relative(ROOT, file)}: removed ${removed} closed page(s)`);
      totalRemoved += removed;
    }
  }
}
if (totalRemoved === 0) console.log('[prune-agent-index] nothing to remove, every listed page is open');
