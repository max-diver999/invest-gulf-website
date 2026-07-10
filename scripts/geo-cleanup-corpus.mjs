#!/usr/bin/env node
/**
 * Remove GEO uplift duplicates and broken boilerplate from MDX bodies.
 * Usage: node scripts/geo-cleanup-corpus.mjs [--dry-run]
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMdxBody } from './lib/geo-citability-scorer.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'src/content');
const DRY = process.argv.includes('--dry-run');

const STRIP_PARAS = [
  /^Gulf investors reviewing .+ typically require .+$/m,
  /^Invest Gulf underwriting on .+ in 2026 usually starts at .+$/m,
  /^Buyers researching .+ should treat .+$/m,
  /^Invest Gulf reviewed .+ benchmarks on .+ files in Q2 2026.+$/m,
  /^Insider tip: request service charge schedules and trustee and DLD fee quotes in writing on What should buyers verify on key numbers.+$/m,
];

const STRIP_BLOCKS = [
  /\nInvest Gulf DD notes for this section:\n\n- \*\*MODELED carry:\*\*.+?(?=\n## |\n<FaqBlock|\n<LeadForm|$)/gs,
  /\n\nInvest Gulf DD checklist for [^\n]+:\n\n- \*\*MODELED carry:\*\*.+?(?=\n\nInvest Gulf underwriting|\n## |\n<FaqBlock)/gs,
];

function listMdx() {
  const out = [];
  for (const coll of readdirSync(CONTENT)) {
    const dir = join(CONTENT, coll);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.mdx'))) {
      out.push(join(dir, f));
    }
  }
  return out;
}

/** Drop repeated ## sections (keeps first occurrence). */
function dedupeHeadings(body) {
  const re = /^## (.+)$/gm;
  const seen = new Set();
  const cuts = [];
  let match;
  const hits = [];
  while ((match = re.exec(body)) !== null) {
    hits.push({ title: match[1], index: match.index });
  }
  for (let i = 0; i < hits.length; i += 1) {
    const { title, index } = hits[i];
    const end = i + 1 < hits.length ? hits[i + 1].index : body.length;
    if (seen.has(title)) {
      cuts.push([index, end]);
      continue;
    }
    seen.add(title);
  }
  if (!cuts.length) return body;
  let out = '';
  let pos = 0;
  for (const [start, end] of cuts) {
    out += body.slice(pos, start);
    pos = end;
  }
  out += body.slice(pos);
  return out.replace(/\n{3,}/g, '\n\n');
}

function dedupeParagraphs(body) {
  const parts = body.split(/(\n## [^\n]+\n)/);
  let out = '';
  for (let i = 0; i < parts.length; i += 1) {
    const chunk = parts[i];
    if (!chunk.startsWith('\n## ')) {
      out += chunk;
      continue;
    }
    out += chunk;
    const section = parts[i + 1] || '';
    const paras = section.split(/\n{2,}/);
    const seen = new Set();
    const kept = [];
    for (const p of paras) {
      const key = p.replace(/\s+/g, ' ').trim().slice(0, 80);
      if (!key) continue;
      if (seen.has(key)) continue;
      let drop = false;
      for (const re of STRIP_PARAS) {
        if (re.test(p.trim())) {
          drop = true;
          break;
        }
      }
      if (drop) continue;
      seen.add(key);
      kept.push(p);
    }
    out += kept.join('\n\n');
    i += 1;
  }
  return out;
}

let touched = 0;
for (const abs of listMdx()) {
  const raw = readFileSync(abs, 'utf8');
  const fm = raw.match(/^---\n[\s\S]*?\n---\n?/)?.[0] || '';
  let body = parseMdxBody(raw);
  const before = body;
  for (const re of STRIP_BLOCKS) body = body.replace(re, '\n');
  body = dedupeHeadings(body);
  body = dedupeParagraphs(body);
  body = body.replace(/\n{4,}/g, '\n\n\n');
  if (body === before) continue;
  touched += 1;
  if (!DRY) writeFileSync(abs, fm + body);
}

console.log(`${DRY ? '[dry-run] ' : ''}Cleaned ${touched} files`);
