// QA audit for invest-gulf content: Pleada/SEO/AEO/GEO compliance
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = decodeURIComponent(new URL('../src/content/', import.meta.url).pathname);
const COLLECTIONS = ['guides', 'compare'];

function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return { fm: null, body: raw };
  const fmRaw = m[1];
  const body = raw.slice(m[0].length);
  const fm = {};
  // simple line parse for top-level scalar keys
  for (const line of fmRaw.split('\n')) {
    const km = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (km) fm[km[1]] = km[2].trim();
  }
  // detect faq block + count questions
  const faqCount = (fmRaw.match(/^\s*-\s*question:/gm) || []).length;
  fm.__faqCount = faqCount;
  fm.__hasFaq = /\nfaq:/.test('\n' + fmRaw);
  fm.__tagsCount = (() => {
    const tline = fmRaw.match(/tags:\s*\[(.*?)\]/s);
    if (tline) return tline[1].split(',').filter((x) => x.trim()).length;
    return (fmRaw.match(/^\s*-\s+["'].*/gm) || []).length; // fallback
  })();
  return { fm, body, fmRaw };
}

const slugsByCollection = {};
const allSlugs = new Set();
for (const c of COLLECTIONS) {
  const dir = join(ROOT, c);
  let files = [];
  try { files = readdirSync(dir).filter((f) => f.endsWith('.mdx')); } catch {}
  slugsByCollection[c] = files.map((f) => f.replace(/\.mdx$/, ''));
  for (const s of slugsByCollection[c]) allSlugs.add(s);
}

const issues = [];
const stats = { total: 0, byColl: {}, wordSum: 0 };
const kwMap = {}; // primary keyword (title-normalized) cannibalization heuristic via slug
const reportRows = [];

for (const c of COLLECTIONS) {
  stats.byColl[c] = 0;
  for (const slug of slugsByCollection[c]) {
    stats.total++;
    stats.byColl[c]++;
    const path = join(ROOT, c, slug + '.mdx');
    const raw = readFileSync(path, 'utf8');
    const { fm, body, fmRaw } = parseFrontmatter(raw);
    const words = body.split(/\s+/).filter(Boolean).length;
    stats.wordSum += words;
    const prob = [];

    if (!fm) { issues.push(`[${c}/${slug}] NO frontmatter`); continue; }

    // required frontmatter
    for (const k of ['title', 'description', 'pubDate', 'category']) {
      if (!fm[k]) prob.push(`missing:${k}`);
    }
    if (!fm.updatedDate) prob.push('missing:updatedDate');
    if (!fm.author) prob.push('missing:author');
    if (!fm.readingTime) prob.push('missing:readingTime');

    // description length
    const desc = (fm.description || '').replace(/^["']|["']$/g, '');
    if (desc && (desc.length < 120 || desc.length > 175)) prob.push(`descLen:${desc.length}`);

    // title length
    const title = (fm.title || '').replace(/^["']|["']$/g, '');
    if (title && title.length > 65) prob.push(`titleLen:${title.length}`);

    // FAQ (AEO)
    if (!fm.__hasFaq) prob.push('no-faq-block');
    else if (fm.__faqCount < 5) prob.push(`faq:${fm.__faqCount}`);

    // word count thresholds
    const minW = c === 'compare' ? 1800 : 2000;
    if (words < minW) prob.push(`words:${words}<${minW}`);

    // AEO quick-answer
    const hasQuick = /quick answer|tl;dr|\*\*quick answer/i.test(body);
    if (!hasQuick) prob.push('no-quick-answer');

    // internal links count + trailing slash
    const links = body.match(/\]\((\/[a-z0-9\-\/]*)\)/gi) || [];
    const internal = links.filter((l) => /\]\(\/(guides|compare|areas)\//i.test(l));
    if (internal.length < 5) prob.push(`intLinks:${internal.length}`);
    const noTrail = internal.filter((l) => !/\/\)$/.test(l));
    if (noTrail.length) prob.push(`noTrailingSlash:${noTrail.length}`);

    // MDX safety
    const angle = (body.match(/<\d/g) || []).length + (body.match(/[^=]>\d/g) || []).length;
    if (/<\d|[\s(]>\d/.test(body)) prob.push('mdx-angle-digit');
    if (/faqs=\{/.test(body)) prob.push('FaqBlock-faqs-prop');

    // GEO: at least one table + numbers
    const tables = (body.match(/^\|.*\|$/gm) || []).length;
    if (tables < 3) prob.push(`tables:${tables}`);

    // relatedSlugs validity
    const relBlock = fmRaw.match(/relatedSlugs:\s*\n([\s\S]*?)(?:\n[a-zA-Z_]+:|$)/);
    if (relBlock) {
      const rels = (relBlock[1].match(/-\s*["']?([a-z0-9\-]+)["']?/g) || [])
        .map((r) => r.replace(/-\s*["']?/, '').replace(/["']$/, ''))
        .filter((r) => r && r !== '--');
      const bad = rels.filter((r) => r && !allSlugs.has(r));
      if (bad.length) prob.push(`relatedSlugsBad:${bad.join('|')}`);
    }

    reportRows.push({ coll: c, slug, words, faq: fm.__faqCount, prob });
    if (prob.length) issues.push(`[${c}/${slug}] (${words}w) ${prob.join(', ')}`);
  }
}

// cannibalization: detect near-duplicate slugs (same stem ignoring known suffixes)
const stems = {};
for (const s of allSlugs) {
  const stem = s.replace(/-(guide|2026|dubai|uae|property|investment|review)$/g, '');
  (stems[stem] ||= []).push(s);
}

// output
console.log('=== INVEST-GULF QA AUDIT ===');
console.log(`Total MDX: ${stats.total} (${Object.entries(stats.byColl).map(([k,v])=>`${k}:${v}`).join(', ')})`);
console.log(`Avg words: ${Math.round(stats.wordSum / stats.total)}`);
console.log(`Clean articles: ${reportRows.filter(r=>!r.prob.length).length}/${stats.total}`);
console.log('');

// aggregate problem types
const counts = {};
for (const r of reportRows) for (const p of r.prob) {
  const key = p.split(':')[0];
  counts[key] = (counts[key] || 0) + 1;
}
console.log('=== PROBLEM SUMMARY (count by type) ===');
for (const [k,v] of Object.entries(counts).sort((a,b)=>b[1]-a[1])) console.log(`  ${k}: ${v}`);
console.log('');

const dup = Object.entries(stems).filter(([,v]) => v.length > 1);
if (dup.length) {
  console.log('=== POSSIBLE CANNIBALIZATION (review angle) ===');
  for (const [stem, arr] of dup.slice(0, 40)) console.log(`  ${stem}: ${arr.join(' | ')}`);
  console.log('');
}

console.log('=== DETAILED ISSUES ===');
for (const i of issues) console.log(i);
console.log(`\nTotal articles with issues: ${reportRows.filter(r=>r.prob.length).length}`);

// machine-readable groups
import { writeFileSync } from 'node:fs';
const groups = {};
for (const r of reportRows) for (const p of r.prob) {
  const key = p.split(':')[0];
  (groups[key] ||= []).push(`${r.coll}/${r.slug}`);
}
writeFileSync('/tmp/qa-groups.json', JSON.stringify(groups, null, 0));
