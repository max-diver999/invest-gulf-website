#!/usr/bin/env node
/**
 * Import gulf-content-drafts/guides/*.md → invest-gulf-website/src/content/guides/*.mdx
 * Strips non-schema frontmatter, fixes MDX traps, skips existing slugs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRAFTS_DIR = path.resolve(
  __dirname,
  '../../08_Идеи/gulf-content-drafts/guides',
);
const OUT_DIR = path.resolve(__dirname, '../src/content/guides');

const KEEP_KEYS = new Set([
  'title',
  'description',
  'pubDate',
  'updatedDate',
  'author',
  'category',
  'tags',
  'heroImage',
  'readingTime',
  'relatedSlugs',
  'noindex',
  'faq',
]);

function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const yaml = m[1];
  const body = m[2];
  const data = {};
  let key = null;
  let list = null;
  for (const line of yaml.split('\n')) {
    if (line.match(/^\s+-\s+question:/)) {
      if (!list) list = [];
      const q = line.replace(/^\s+-\s+question:\s*/, '').trim();
      list.push({ question: q.replace(/^["']|["']$/g, ''), answer: '' });
      continue;
    }
    if (line.match(/^\s+answer:/) && list?.length) {
      list[list.length - 1].answer = line
        .replace(/^\s+answer:\s*/, '')
        .trim()
        .replace(/^["']|["']$/g, '');
      continue;
    }
    const km = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (km) {
      key = km[1];
      let val = km[2].trim();
      if (val === '') {
        list = [];
        data[key] = list;
        continue;
      }
      list = null;
      if (val.startsWith('[') && val.endsWith(']')) {
        data[key] = val
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
      } else if (val === 'true' || val === 'false') {
        data[key] = val === 'true';
      } else if (/^\d+$/.test(val)) {
        data[key] = Number(val);
      } else {
        data[key] = val.replace(/^["']|["']$/g, '');
      }
    } else if (line.match(/^\s+-\s+/) && Array.isArray(list)) {
      list.push(line.replace(/^\s+-\s+/, '').trim().replace(/^["']|["']$/g, ''));
    }
  }
  return { data, body };
}

function serializeFrontmatter(data) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    if (k === 'faq' && Array.isArray(v)) {
      lines.push('faq:');
      for (const item of v) {
        lines.push(`  - question: "${item.question.replace(/"/g, '\\"')}"`);
        lines.push(`    answer: "${item.answer.replace(/"/g, '\\"')}"`);
      }
      continue;
    }
    if (Array.isArray(v)) {
      if (v.length === 0) lines.push(`${k}: []`);
      else if (typeof v[0] === 'string') {
        lines.push(`${k}:`);
        for (const item of v) lines.push(`  - "${item.replace(/"/g, '\\"')}"`);
      }
      continue;
    }
    if (typeof v === 'number' || typeof v === 'boolean') {
      lines.push(`${k}: ${v}`);
    } else {
      lines.push(`${k}: "${String(v).replace(/"/g, '\\"')}"`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

function fixMdxBody(body) {
  return body
    .replace(/<\s*(\d[\d.,%]*)/g, 'under $1')
    .replace(/>\s*(\d[\d.,%]*)/g, 'over $1')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\*\*<LeadForm\s*\/?>\*\*/g, '')
    .replace(/<LeadForm\s*\/?>/g, '')
    .replace(/\{HUB\}/g, 'hub')
    .replace(/Gulf Property Editorial/g, 'Invest Gulf Editorial');
}

function normalizeData(data, slug) {
  const out = {};
  out.title = data.title || slug;
  out.description = data.description || out.title;
  out.pubDate = data.pubDate || '2026-06-05';
  out.updatedDate = data.updatedDate || '2026-06-05';
  out.author = 'Invest Gulf Editorial';
  out.category = 'guides';
  out.tags = Array.isArray(data.tags)
    ? data.tags
    : data.primary_keyword
      ? String(data.primary_keyword).split(/\s+/).slice(0, 5)
      : ['gulf', 'expat'];
  if (data.heroImage) out.heroImage = data.heroImage;
  out.readingTime = data.readingTime || 12;
  out.relatedSlugs = Array.isArray(data.relatedSlugs) ? data.relatedSlugs : [];
  if (Array.isArray(data.faq) && data.faq.length) out.faq = data.faq;
  return out;
}

const existing = new Set(
  fs.existsSync(OUT_DIR)
    ? fs.readdirSync(OUT_DIR).map((f) => f.replace(/\.mdx?$/, ''))
    : [],
);

let imported = 0;
let skipped = 0;
const errors = [];

for (const file of fs.readdirSync(DRAFTS_DIR).filter((f) => f.endsWith('.md'))) {
  const slug = file.replace(/\.md$/, '');
  if (existing.has(slug)) {
    skipped++;
    continue;
  }
  try {
    const raw = fs.readFileSync(path.join(DRAFTS_DIR, file), 'utf8');
    const { data, body } = parseFrontmatter(raw);
    const normalized = normalizeData(data, slug);
    const mdx =
      serializeFrontmatter(normalized) + '\n' + fixMdxBody(body).trimStart() + '\n';
    fs.writeFileSync(path.join(OUT_DIR, `${slug}.mdx`), mdx);
    imported++;
  } catch (e) {
    errors.push({ file, error: String(e) });
  }
}

console.log(`Imported: ${imported}, skipped (exists): ${skipped}, errors: ${errors.length}`);
if (errors.length) {
  for (const e of errors.slice(0, 10)) console.error(e);
  process.exit(1);
}
