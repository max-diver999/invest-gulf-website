// QA audit for invest-gulf content — hard gate before publish
// Usage:
//   node scripts/qa-audit.mjs
//   node scripts/qa-audit.mjs --changed
//   node scripts/qa-audit.mjs --file guides/slug.mdx

import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { runCloudinaryDeliveryChecks } from './lib/cloudinary-gate.mjs';
import { frontmatterOf, urlPathFrom } from './lib/content-urls.mjs';

// Hero images resolve through the Gulf dimensions map at build time, so a key
// that is not in it fails the build rather than the validator. Check it here,
// where the error names the file.
const GULF_DIMS = new Set(
  Object.keys(JSON.parse(readFileSync(new URL('../src/data/gulf-image-dimensions.json', import.meta.url), 'utf8')))
);

const ROOT = decodeURIComponent(new URL('../src/content/', import.meta.url).pathname);
const COLLECTIONS = ['guides', 'compare', 'areas', 'projects', 'news', 'hubs'];
// Roots of the geography tree. Links into these are checked against the set of
// paths the site actually builds, the same way slug links are checked.
const PLACE_ROOTS = ['uae', 'saudi-arabia', 'qatar', 'oman', 'bahrain', 'developers', 'living'];

const BANNED_PHRASES = [
  'Regional diversification',
  'Advanced investment strategies',
  'Operational excellence',
  'Comprehensive framework',
  'Future outlook',
  'Extended due diligence checklist',
  '[VERIFY]',
  '**VERIFY:**',
  'Knowledge base',
  'KB §',
  'source needed',
];

const REGULATORY_STALE = [
  { pattern: /AED\s*750[,\s]?000.*(?:minimum|sole|single)\s*owner/i, hint: 'Dubai sole-owner AED 750K floor removed 2026 — verify DLD Cube' },
  { pattern: /750k.*investor visa.*minimum/i, hint: 'Investor visa minimum may be outdated — verify 2026 rules' },
];

const args = process.argv.slice(2);
const changedOnly = args.includes('--changed');
const fileArgIdx = args.indexOf('--file');
const singleFile = fileArgIdx !== -1 ? args[fileArgIdx + 1] : null;

function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return { fm: null, body: raw, fmRaw: '' };
  const fmRaw = m[1];
  const body = raw.slice(m[0].length);
  const fm = {};
  for (const line of fmRaw.split('\n')) {
    const km = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (km) fm[km[1]] = km[2].trim();
  }
  const faqCount = (fmRaw.match(/^\s*-\s*question:/gm) || []).length;
  fm.__faqCount = faqCount;
  fm.__hasFaq = /\nfaq:/.test('\n' + fmRaw);
  return { fm, body, fmRaw };
}

function auditTables(body) {
  const probs = [];
  const lines = body.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes('|')) continue;
    if (/^\|\|/.test(line)) probs.push(`tableDoublePipe:L${i + 1}`);
    if (/^\|[\s\-:|]+\|$/.test(line) && !/^\|[\s\-:|]+\|$/.test(line.replace(/\|\|/g, '|'))) {
      // handled by double pipe
    }
    if (/^\|/.test(line) && /\|/.test(line.slice(1))) {
      const cols = line.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      if (i + 1 < lines.length && /^[\|\s\-:]+$/.test(lines[i + 1]) && lines[i + 1].includes('-')) {
        const sepCols = lines[i + 1].split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        if (sepCols.length && cols.length && sepCols.length !== cols.length) {
          probs.push(`tableColMismatch:L${i + 1}(${cols.length}vs${sepCols.length})`);
        }
      }
    }
  }
  return probs;
}

function getChangedFiles() {
  const repoRoot = decodeURIComponent(new URL('..', import.meta.url).pathname);
  try {
    const out = execSync('git diff --name-only HEAD', { encoding: 'utf8', cwd: repoRoot });
    return out
      .split('\n')
      .filter((f) => f.startsWith('src/content/') && f.endsWith('.mdx'))
      .map((f) => {
        const parts = f.replace('src/content/', '').split('/');
        return { coll: parts[0], slug: parts[1].replace('.mdx', ''), path: f };
      });
  } catch {
    return [];
  }
}

const slugsByCollection = {};
const allSlugs = new Set();
const allPlacePaths = new Set();
for (const c of COLLECTIONS) {
  const dir = join(ROOT, c);
  let files = [];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.mdx'));
  } catch {
    /* missing collection */
  }
  slugsByCollection[c] = files.map((f) => f.replace(/\.mdx$/, ''));
  for (const s of slugsByCollection[c]) allSlugs.add(s);
  for (const f of files) {
    const fmRaw = frontmatterOf(readFileSync(join(dir, f), 'utf8'));
    const urlPath = urlPathFrom(c, f.replace(/\.mdx$/, ''), fmRaw);
    if (PLACE_ROOTS.some((root) => urlPath.startsWith(`/${root}/`))) {
      allPlacePaths.add(urlPath);
    }
  }
}

const issues = [];
const stats = { total: 0, byColl: {}, wordSum: 0 };
const reportRows = [];

function auditFile(c, slug) {
  stats.total++;
  stats.byColl[c] = (stats.byColl[c] || 0) + 1;
  const path = join(ROOT, c, slug + '.mdx');
  const raw = readFileSync(path, 'utf8');
  const { fm, body, fmRaw } = parseFrontmatter(raw);
  const words = body.split(/\s+/).filter(Boolean).length;
  stats.wordSum += words;
  const prob = [];

  if (!fm) {
    issues.push(`[${c}/${slug}] NO frontmatter`);
    return;
  }

  for (const k of ['title', 'description', 'pubDate', 'category']) {
    if (!fm[k]) prob.push(`missing:${k}`);
  }
  if (!fm.updatedDate) prob.push('missing:updatedDate');
  if (!fm.author) prob.push('missing:author');
  if (!fm.readingTime) prob.push('missing:readingTime');

  const desc = (fm.description || '').replace(/^["']|["']$/g, '');
  if (desc && desc.length > 160) prob.push(`descLen:${desc.length}>160`);
  if (desc && desc.length < 120) prob.push(`descLen:${desc.length}<120`);

  const title = (fm.title || '').replace(/^["']|["']$/g, '');
  if (title && (title.length < 45 || title.length > 65)) prob.push(`titleLen:${title.length}`);

  if (!fm.__hasFaq) prob.push('no-faq-block');
  else if (fm.__faqCount < 5) prob.push(`faq:${fm.__faqCount}<5`);

  // Depth is set by what the page has to do, not by which folder it sits in.
  // A pillar page answers a whole market against portals with live inventory and
  // carries a 4,000 word floor. A standard page in the geo tree serves one
  // district and carries 2,500. Article collections keep their own floors, and
  // an area that has not yet moved into the tree keeps the old 1,800.
  //
  // Tier is set from transactional demand rather than from reach. A community
  // name like Mirdif draws 74,000 searches a month and 260 of them are buyers,
  // so tiering it on the larger number would contradict the research that says
  // the larger number is not buying demand.
  const tier = (fm.tier || '').replace(/^["']|["']$/g, '') || (c === 'hubs' ? 'pillar' : 'standard');
  const inGeoTree = c === 'hubs' || Boolean(fm.path);
  const minW =
    inGeoTree ? (tier === 'pillar' ? 4000 : 2500)
    : c === 'guides' ? 2000
    : c === 'projects' ? 1200
    : c === 'news' ? 600
    : 1800;
  if (words < minW) prob.push(`words:${words}<${minW}`);

  const hasQuickIntro = /(?:^|\n)(?:Quick answer|TL;DR|\*\*Quick [Aa]nswer|\*\*TL;DR)/m.test(body);
  const hasTldrBlock = /<TldrBlock\b/.test(body);
  if (!hasQuickIntro && !hasTldrBlock) prob.push('no-quick-answer');

  const links = body.match(/\]\((\/[a-z0-9\-\/]*)\)/gi) || [];
  const placeRootAlt = PLACE_ROOTS.join('|');
  const internalRe = new RegExp(`\\]\\(\\/(guides|compare|areas|projects|news|${placeRootAlt})\\/`, 'i');
  const internal = links.filter((l) => internalRe.test(l));
  if (internal.length < 5) prob.push(`intLinks:${internal.length}<5`);
  const noTrail = internal.filter((l) => !/\/\)$/.test(l));
  if (noTrail.length) prob.push(`noTrailingSlash:${noTrail.length}`);

  if (/<\d|[\s(]>\d/.test(body)) prob.push('mdx-angle-digit');
  if (/faqs=\{/.test(body)) prob.push('FaqBlock-faqs-prop');

  const tableLines = (body.match(/^\|.*\|$/gm) || []).length;
  if (tableLines < 3) prob.push(`tables:${tableLines}<3`);
  prob.push(...auditTables(body));

  for (const phrase of BANNED_PHRASES) {
    if (body.includes(phrase) || (fmRaw && fmRaw.includes(phrase))) {
      prob.push(`banned:${phrase.slice(0, 24)}`);
    }
  }
  runCloudinaryDeliveryChecks({
    prefix: `[${c}/${slug}]`,
    text: raw,
    errors: prob,
    legacyExempt: false,
  });

  const isRegulatory = /visa|golden visa|investor visa|dld|residency/i.test(
    `${fm.title} ${(fm.tags || '').toString()} ${slug}`,
  );
  if (isRegulatory) {
    for (const { pattern, hint } of REGULATORY_STALE) {
      const m = body.match(pattern);
      if (m) {
        const start = Math.max(0, m.index - 80);
        const end = Math.min(body.length, m.index + m[0].length + 80);
        const context = body.slice(start, end);
        if (!/removed|no longer|abolished|suspended|was|previously|until|before april/i.test(context)) {
          prob.push(`regulatoryStale:${hint.slice(0, 40)}`);
        }
      }
    }
  }

  const relBlock = fmRaw.match(/relatedSlugs:\s*\n([\s\S]*?)(?:\n[a-zA-Z_]+:|$)/);
  if (relBlock) {
    const rels = (relBlock[1].match(/-\s*["']?([a-z0-9\-]+)["']?/g) || [])
      .map((r) => r.replace(/-\s*["']?/, '').replace(/["']$/, ''))
      .filter((r) => r && r !== '--');
    const bad = rels.filter((r) => r && !allSlugs.has(r));
    if (bad.length) prob.push(`relatedSlugsBad:${bad.join('|')}`);
  }

  const hero = (fm.heroImage || '').replace(/^["']|["']$/g, '');
  const heroKey = hero.match(/\/(more-group\/gulf\/.+)$/);
  if (heroKey && !GULF_DIMS.has(heroKey[1])) prob.push(`heroImageUnknown:${heroKey[1]}`);

  const bodySlugs = [...body.matchAll(/\]\(\/(?:guides|compare|areas|projects|news)\/([a-z0-9\-]+)\/?\)/gi)].map((m) => m[1]);
  const badLinks = [...new Set(bodySlugs.filter((s) => !allSlugs.has(s)))];
  if (badLinks.length) prob.push(`brokenInternalLinks:${badLinks.join('|')}`);

  const placeLinkRe = new RegExp(`\\]\\((\\/(?:${PLACE_ROOTS.join('|')})\\/[a-z0-9\\-\\/]*)\\)`, 'gi');
  const placeLinks = [...body.matchAll(placeLinkRe)].map((m) =>
    m[1].endsWith('/') ? m[1] : `${m[1]}/`,
  );
  const badPlaces = [...new Set(placeLinks.filter((u) => !allPlacePaths.has(u)))];
  if (badPlaces.length) prob.push(`brokenPlaceLinks:${badPlaces.join('|')}`);

  reportRows.push({ coll: c, slug, words, faq: fm.__faqCount, prob });
  if (prob.length) issues.push(`[${c}/${slug}] (${words}w) ${prob.join(', ')}`);
}

let filesToAudit = [];
if (singleFile) {
  const parts = singleFile.replace(/^src\/content\//, '').split('/');
  filesToAudit = [{ coll: parts[0], slug: parts[1].replace('.mdx', '') }];
} else if (changedOnly) {
  filesToAudit = getChangedFiles();
  if (!filesToAudit.length) {
    console.log('No changed MDX files — skipping audit.');
    process.exit(0);
  }
} else {
  for (const c of COLLECTIONS) {
    for (const slug of slugsByCollection[c] || []) {
      filesToAudit.push({ coll: c, slug });
    }
  }
}

for (const { coll, slug } of filesToAudit) {
  auditFile(coll, slug);
}

console.log('=== INVEST-GULF QA AUDIT ===');
console.log(`Scope: ${changedOnly ? 'changed only' : singleFile ? singleFile : 'full corpus'}`);
console.log(`Files audited: ${stats.total}`);
if (stats.total) console.log(`Avg words: ${Math.round(stats.wordSum / stats.total)}`);
console.log(`Clean: ${reportRows.filter((r) => !r.prob.length).length}/${stats.total}`);
console.log('');

const counts = {};
for (const r of reportRows) {
  for (const p of r.prob) {
    const key = p.split(':')[0];
    counts[key] = (counts[key] || 0) + 1;
  }
}
if (Object.keys(counts).length) {
  console.log('=== PROBLEM SUMMARY ===');
  for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v}`);
  console.log('');
  console.log('=== DETAILED ISSUES ===');
  for (const i of issues) console.log(i);
}

const failCount = reportRows.filter((r) => r.prob.length).length;
console.log(`\nArticles with issues: ${failCount}/${stats.total}`);

if (failCount > 0) {
  console.error('\n❌ validate:content FAILED');
  process.exit(1);
}
console.log('\n✅ validate:content PASSED');
