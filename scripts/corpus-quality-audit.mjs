#!/usr/bin/env node
/**
 * Full corpus quality audit — cannibalization, duplicates, policy, SEO/AEO/GEO signals.
 * Usage: node scripts/corpus-quality-audit.mjs [--json]
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = decodeURIComponent(new URL('../src/content/', import.meta.url).pathname);
const COLLECTIONS = ['guides', 'compare', 'areas', 'projects', 'news'];
const JSON_OUT = process.argv.includes('--json');

const BANNED = [
  'Regional diversification',
  'Advanced investment strategies',
  'Operational excellence',
  'Comprehensive framework',
  'Future outlook',
  'Extended due diligence checklist',
  '[VERIFY]',
  'Knowledge base',
  'KB §',
  'source needed',
];

const MIN_WORDS = { guides: 2000, compare: 1800, areas: 1800, projects: 1200, news: 600 };

function parseFm(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return { fm: {}, body: raw, fmRaw: '' };
  const fmRaw = m[1];
  const body = raw.slice(m[0].length);
  const fm = {};
  for (const line of fmRaw.split('\n')) {
    const km = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (km) fm[km[1]] = km[2].replace(/^["']|["']$/g, '');
  }
  fm.__faqCount = (fmRaw.match(/^\s*-\s*question:/gm) || []).length;
  fm.__noindex = /\nnoindex:\s*true/.test('\n' + fmRaw);
  return { fm, body, fmRaw };
}

function normText(s) {
  return s
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '');
}

function slugKeywords(slug) {
  const stop = new Set(['guide', 'guides', '2026', '2025', 'dubai', 'uae', 'property', 'investment', 'the', 'and', 'for', 'in']);
  return slug
    .split('-')
    .filter((w) => w.length > 2 && !stop.has(w));
}

const allSlugs = new Map(); // coll/slug -> meta
const issues = {
  dupTitle: [],
  dupDesc: [],
  thinContent: [],
  missingHero: [],
  missingFaq: [],
  missingQuickAnswer: [],
  bannedPhrase: [],
  brokenInternalLink: [],
  brokenRelatedSlug: [],
  mdxAngle: [],
  noFaqBlock: [],
  cannibalClusters: [],
  repeatedParagraphs: [],
  titleLen: [],
  descLen: [],
};

const titleMap = new Map();
const descMap = new Map();
const paraHash = new Map(); // hash -> [{coll, slug}]

for (const coll of COLLECTIONS) {
  const dir = join(ROOT, coll);
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.mdx'))) {
    const slug = file.replace(/\.mdx$/, '');
    const path = join(dir, file);
    const raw = readFileSync(path, 'utf8');
    const { fm, body, fmRaw } = parseFm(raw);
    const words = body.split(/\s+/).filter(Boolean).length;
    const id = `${coll}/${slug}`;

    allSlugs.set(`${coll}/${slug}`, { coll, slug, fm, words, noindex: fm.__noindex });

    const title = fm.title || '';
    const desc = fm.description || '';
    if (title) {
      const k = normText(title);
      if (titleMap.has(k)) titleMap.get(k).push(id);
      else titleMap.set(k, [id]);
      if (title.length < 45 || title.length > 65) issues.titleLen.push({ id, len: title.length, title });
    }
    if (desc) {
      const k = normText(desc);
      if (descMap.has(k)) descMap.get(k).push(id);
      else descMap.set(k, [id]);
      if (desc.length < 120 || desc.length > 160) issues.descLen.push({ id, len: desc.length });
    }

    const minW = MIN_WORDS[coll] || 1800;
    if (words < minW && !fm.__noindex) issues.thinContent.push({ id, words, minW });

    if ((coll === 'guides' || coll === 'compare' || coll === 'areas') && !fm.heroImage && !fm.__noindex) {
      issues.missingHero.push(id);
    }
    if (!fm.__noindex && fm.__faqCount < 5) issues.missingFaq.push({ id, count: fm.__faqCount });
    if (!fm.__noindex && !/quick answer|tl;dr|\*\*quick answer|\*\*tl;dr/i.test(body)) {
      issues.missingQuickAnswer.push(id);
    }
    if (body.includes('<FaqBlock') && !body.includes('import FaqBlock')) {
      // might be ok if layout injects - flag only if FaqBlock without import
    }
    if (/<\d|[\s(]>\d/.test(body)) issues.mdxAngle.push(id);
    for (const b of BANNED) {
      if (body.includes(b) || fmRaw.includes(b)) issues.bannedPhrase.push({ id, phrase: b });
    }

    // internal links
    const links = body.match(/\]\((\/(?:guides|compare|areas|projects|news)\/[a-z0-9\-]+)\/?\)/gi) || [];
    for (const l of links) {
      const sm = l.match(/\/(guides|compare|areas|projects|news)\/([a-z0-9\-]+)/i);
      if (!sm) continue;
      const target = `${sm[1]}/${sm[2]}`;
      if (!allSlugs.has(target) && !existsSync(join(ROOT, sm[1], sm[2] + '.mdx'))) {
        issues.brokenInternalLink.push({ id, link: target });
      }
    }

    // paragraph repeat detection (paragraphs 80+ chars)
    for (const para of body.split(/\n\n+/)) {
      const clean = normText(para.replace(/\[.*?\]\(.*?\)/g, ''));
      if (clean.length < 120) continue;
      const h = createHash('md5').update(clean.slice(0, 400)).digest('hex');
      if (!paraHash.has(h)) paraHash.set(h, []);
      paraHash.get(h).push(id);
    }
  }
}

// second pass relatedSlugs + broken links now that allSlugs populated
for (const [key, meta] of allSlugs) {
  const raw = readFileSync(join(ROOT, meta.coll, meta.slug + '.mdx'), 'utf8');
  const { fmRaw, body } = parseFm(raw);
  const rel = fmRaw.match(/relatedSlugs:\s*\n([\s\S]*?)(?:\n[a-zA-Z_]+:|$)/);
  if (rel) {
    for (const sm of rel[1].matchAll(/-\s*"([^"]+)"/g)) {
      const s = sm[1];
      let found = false;
      for (const c of COLLECTIONS) {
        if (existsSync(join(ROOT, c, s + '.mdx'))) {
          found = true;
          break;
        }
      }
      if (!found) issues.brokenRelatedSlug.push({ id: key, slug: s });
    }
  }
  const links = body.match(/\]\((\/(?:guides|compare|areas|projects|news)\/[a-z0-9\-]+)\/?\)/gi) || [];
  for (const l of links) {
    const sm = l.match(/\/(guides|compare|areas|projects|news)\/([a-z0-9\-]+)/i);
    if (!sm) continue;
    if (!existsSync(join(ROOT, sm[1], sm[2] + '.mdx'))) {
      if (!issues.brokenInternalLink.some((x) => x.id === key && x.link === `${sm[1]}/${sm[2]}`)) {
        issues.brokenInternalLink.push({ id: key, link: `${sm[1]}/${sm[2]}` });
      }
    }
  }
}

for (const [k, ids] of titleMap) {
  if (ids.length > 1) {
    const indexable = ids.filter((id) => !allSlugs.get(id)?.noindex);
    if (indexable.length > 1) issues.dupTitle.push({ title: k.slice(0, 60), ids: indexable });
  }
}
for (const [k, ids] of descMap) {
  if (ids.length > 1) {
    const indexable = ids.filter((id) => !allSlugs.get(id)?.noindex);
    if (indexable.length > 1) issues.dupDesc.push({ desc: k.slice(0, 80), ids: indexable });
  }
}

for (const [h, ids] of paraHash) {
  const unique = [...new Set(ids)];
  if (unique.length >= 3) {
    const indexable = unique.filter((id) => !allSlugs.get(id)?.noindex);
    if (indexable.length >= 3) issues.repeatedParagraphs.push({ count: indexable.length, ids: indexable.slice(0, 6) });
  }
}

// keyword cannibalization: group by significant slug overlap
const indexableGuides = [...allSlugs.entries()].filter(
  ([, m]) => (m.coll === 'guides' || m.coll === 'compare') && !m.noindex,
);
const clusters = new Map();
for (const [idA, a] of indexableGuides) {
  const kwA = slugKeywords(a.slug);
  if (kwA.length < 2) continue;
  for (const [idB, b] of indexableGuides) {
    if (idA >= idB) continue;
    const kwB = slugKeywords(b.slug);
    const overlap = kwA.filter((w) => kwB.includes(w));
    const ratio = overlap.length / Math.min(kwA.length, kwB.length);
    if (overlap.length >= 3 && ratio >= 0.75) {
      const ck = overlap.sort().join('|');
      if (!clusters.has(ck)) clusters.set(ck, new Set());
      clusters.get(ck).add(idA);
      clusters.get(ck).add(idB);
    }
  }
}
for (const [kw, ids] of clusters) {
  if (ids.size >= 2) issues.cannibalClusters.push({ keywords: kw, ids: [...ids].slice(0, 8) });
}

const INTENTIONAL_CANNIBAL_KEYS = new Set([
  'off|off|plan',
  'green|visa|visa',
  'golden|visa|visa',
  'remote|visa|work',
  'remote|visa|visa|work',
  'family|sponsorship|visa',
  'best|country|gulf',
  'area|prices|rent',
  'island|near|schools',
  'abu|dhabi|living',
  'abu|dhabi|golden|visa',
  'abu|dhabi|school',
  'best|off|plan',
  'premium|residency|saudi',
  'rental|short|term',
  'abu|dhabi|rental|yield',
  'oman|rental|yield',
  'qatar|rental|yield',
  'rental|saudi|yield',
  'rak|rental|yield',
  'qatar|visa|work',
]);

issues.cannibalClustersIntentional = issues.cannibalClusters.filter((c) =>
  INTENTIONAL_CANNIBAL_KEYS.has(c.keywords),
);
issues.cannibalClustersActionable = issues.cannibalClusters.filter(
  (c) => !INTENTIONAL_CANNIBAL_KEYS.has(c.keywords),
);

// sort repeated paragraphs by count desc, dedupe by id sets
issues.repeatedParagraphs = issues.repeatedParagraphs
  .sort((a, b) => b.count - a.count)
  .slice(0, 30);

issues.cannibalClusters = issues.cannibalClusters
  .sort((a, b) => b.ids.length - a.ids.length)
  .slice(0, 40);

const summary = {
  totalFiles: allSlugs.size,
  dupTitle: issues.dupTitle.length,
  dupDesc: issues.dupDesc.length,
  cannibalClusters: issues.cannibalClusters.length,
  cannibalClustersIntentional: issues.cannibalClustersIntentional.length,
  cannibalClustersActionable: issues.cannibalClustersActionable.length,
  repeatedParagraphs: issues.repeatedParagraphs.length,
  thinContent: issues.thinContent.length,
  missingHero: issues.missingHero.length,
  missingFaq: issues.missingFaq.length,
  missingQuickAnswer: issues.missingQuickAnswer.length,
  bannedPhrase: issues.bannedPhrase.length,
  brokenInternalLink: issues.brokenInternalLink.length,
  brokenRelatedSlug: issues.brokenRelatedSlug.length,
  mdxAngle: issues.mdxAngle.length,
  titleLen: issues.titleLen.length,
  descLen: issues.descLen.length,
};

if (JSON_OUT) {
  console.log(JSON.stringify({ summary, issues }, null, 2));
} else {
  console.log('=== CORPUS QUALITY AUDIT ===');
  console.log('Files:', summary.totalFiles);
  for (const [k, v] of Object.entries(summary)) {
    if (k === 'totalFiles') continue;
    console.log(`${k}: ${v}`);
  }
  const sections = [
    ['DUPLICATE TITLES (indexable)', issues.dupTitle],
    ['DUPLICATE DESCRIPTIONS (indexable)', issues.dupDesc],
    ['CANNIBALIZATION CLUSTERS (slug overlap)', issues.cannibalClusters],
    ['CANNIBALIZATION ACTIONABLE (non-hub)', issues.cannibalClustersActionable],
    ['REPEATED PARAGRAPHS (3+ files)', issues.repeatedParagraphs],
    ['THIN CONTENT', issues.thinContent.slice(0, 20)],
    ['MISSING heroImage', issues.missingHero.slice(0, 15)],
    ['MISSING FAQ (<5)', issues.missingFaq.slice(0, 15)],
    ['MISSING Quick answer', issues.missingQuickAnswer.slice(0, 15)],
    ['BANNED PHRASES', issues.bannedPhrase],
    ['BROKEN INTERNAL LINKS', issues.brokenInternalLink.slice(0, 30)],
    ['BROKEN relatedSlugs', issues.brokenRelatedSlug.slice(0, 20)],
    ['MDX ANGLE BRACKETS', issues.mdxAngle],
  ];
  for (const [label, arr] of sections) {
    if (!arr.length) continue;
    console.log('\n---', label, `(${arr.length}) ---`);
    for (const item of arr.slice(0, 25)) {
      console.log(typeof item === 'string' ? item : JSON.stringify(item));
    }
  }
}
