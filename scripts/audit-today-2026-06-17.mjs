#!/usr/bin/env node
/**
 * Deep audit for today's content batch (2026-06-17 QC batches 25–27).
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { analyzeHumanSignals, wordCount, EM_DASH_LIMIT } from './lib/human-signals.mjs';
import {
  BANNED_PHRASES,
  AI_FLUFF_RE,
  DRAFT_MARKERS_RE,
  countNumericFacts,
  countBoldSpans,
  internalLinks,
  linksWithoutTrailingSlash,
} from './lib/more-content-gate.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SITE = 'https://invest-gulf.com';

const TODAY_FILES = [
  'guides/aldar-properties-review',
  'guides/ellington-properties-review',
  'guides/nshama-developer-review',
  'guides/omniyat-developer-review',
  'guides/select-group-developer-review',
  'guides/azizi-developments-review',
  'guides/binghatti-review',
  'guides/damac-properties-review',
  'guides/emaar-properties-review',
  'guides/meraas-properties-review',
  'guides/rak-properties-developer-review',
  'guides/sobha-realty-review',
  'guides/currency-transfer-buy-property-uae',
  'guides/dubai-property-investment-for-beginners',
  'guides/dubai-property-market-cooling-or-growing',
  'guides/dubai-vs-singapore-expat',
  'guides/golden-visa-multiple-properties-uae',
  'guides/gross-vs-net-yield-dubai',
  'guides/uae-free-zone-vs-mainland',
];

function parseFm(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return { fmRaw: '', body: raw, fm: {} };
  const fmRaw = m[1];
  const body = raw.slice(m[0].length);
  const fm = {};
  for (const line of fmRaw.split('\n')) {
    const km = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (km) fm[km[1]] = km[2].trim().replace(/^["']|["']$/g, '');
  }
  fm.__faqCount = (fmRaw.match(/^\s*-\s*question:/gm) || []).length;
  return { fmRaw, body, fm };
}

function h2Count(body) {
  return (body.match(/^## /gm) || []).length;
}

function firstAnswerBlock(body) {
  const first2k = body.slice(0, 2500);
  return /quick answer|tl;dr|\*\*quick answer|\*\*tl;dr/i.test(first2k);
}

function geoCitabilityFlags(body) {
  const flags = [];
  const h2s = [...body.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  if (h2s.length < 5) flags.push(`few-h2:${h2s.length}`);
  const walls = body.split(/\n## /).slice(1);
  let buried = 0;
  for (const sec of walls.slice(0, 8)) {
    const paras = sec.split(/\n\n+/).filter((p) => p.trim() && !p.startsWith('|') && !p.startsWith('#'));
    if (paras[0] && paras[0].length > 400 && !/^\*\*/.test(paras[0].trim())) buried++;
  }
  if (buried >= 3) flags.push(`buried-h2-openings:${buried}`);
  const facts = countNumericFacts(body);
  const w = wordCount(body);
  const factsPer500 = w ? (facts / w) * 500 : 0;
  if (factsPer500 < 3) flags.push(`low-fact-density:${factsPer500.toFixed(1)}/500w`);
  if (!firstAnswerBlock(body)) flags.push('no-answer-first-block');
  return flags;
}

const RENDER_CHECKS = [
  {
    id: 'lead-form',
    test: (html) => {
      const n = (html.match(/id="lead-form"/g) || []).length;
      if (n === 0) return 'missing #lead-form';
      if (n > 1) return `${n}× #lead-form`;
      return null;
    },
  },
  {
    id: 'canonical',
    test: (html) => (/rel="canonical"/i.test(html) ? null : 'no canonical'),
  },
  {
    id: 'og-title',
    test: (html) => (/property="og:title"/i.test(html) ? null : 'no og:title'),
  },
  {
    id: 'og-image',
    test: (html) => (/property="og:image"/i.test(html) ? null : 'no og:image'),
  },
  {
    id: 'article-schema',
    test: (html) =>
      /"@type"\s*:\s*"Article"|"@type":"Article"/.test(html) ? null : 'no Article JSON-LD',
  },
  {
    id: 'faq-schema',
    test: (html) =>
      /FAQPage|faq/i.test(html) && /"@type"/.test(html) ? null : 'no FAQ schema signal',
  },
  {
    id: 'draft-leak',
    test: (html) => (/\[VERIFY\]|source needed|Knowledge base/i.test(html) ? 'draft marker in HTML' : null),
  },
  {
    id: 'placeholder-link',
    test: (html) => (/Related guide [1-9]/i.test(html) ? 'placeholder related guide' : null),
  },
  {
    id: 'html-em-dash',
    test: (html) => {
      const text = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ');
      const n = (text.match(/—/g) || []).length;
      return n > 40 ? `heavy em-dash in rendered text (${n})` : null;
    },
  },
];

async function main() {
const rows = [];
let failCount = 0;

for (const rel of TODAY_FILES) {
  const [coll, slug] = rel.split('/');
  const path = join(ROOT, 'src/content', coll, `${slug}.mdx`);
  const issues = [];
  const warnings = [];

  if (!existsSync(path)) {
    rows.push({ slug, status: 'MISSING', issues: ['file not found'], warnings: [] });
    failCount++;
    continue;
  }

  const raw = readFileSync(path, 'utf8');
  const { fm, body, fmRaw } = parseFm(raw);
  const words = wordCount(body);
  const human = analyzeHumanSignals(body, { emLimit: EM_DASH_LIMIT.guides });

  // qa-audit via subprocess
  try {
    execSync(`node scripts/qa-audit.mjs --file ${coll}/${slug}.mdx`, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
    });
  } catch (e) {
    const out = `${e.stdout || ''}${e.stderr || ''}`;
    const line = out.split('\n').find((l) => l.includes(`[${coll}/${slug}]`));
    if (line) issues.push(line.replace(/^\[.*?\]\s*/, ''));
    else issues.push('qa-audit failed');
  }

  for (const i of human.issues) issues.push(`${i.kind}:${i.detail}`);

  const titleLen = (fm.title || '').length;
  if (titleLen < 50 || titleLen > 60) warnings.push(`titleLen:${titleLen} (target 50–60)`);

  const descLen = (fm.description || '').length;
  if (descLen > 160) issues.push(`descLen:${descLen}>160`);
  else if (descLen < 140) warnings.push(`descLen:${descLen} (target 140–160)`);

  if (!fm.heroImage) warnings.push('missing:heroImage');
  if (!fm.updatedDate) issues.push('missing:updatedDate');
  if (fm.__faqCount < 5) issues.push(`faq:${fm.__faqCount}<5`);

  for (const phrase of BANNED_PHRASES) {
    if (body.includes(phrase)) issues.push(`banned:${phrase.slice(0, 30)}`);
  }
  if (AI_FLUFF_RE.test(body)) warnings.push('ai-fluff-phrase');
  if (DRAFT_MARKERS_RE.test(raw)) issues.push('draft-marker');

  const noSlash = linksWithoutTrailingSlash(body);
  if (noSlash.length) issues.push(`noTrailingSlash:${noSlash.slice(0, 3).join('|')}`);

  const emAbs = (body.match(/—/g) || []).length;
  if (emAbs > 25) warnings.push(`em-dash-count:${emAbs} absolute`);

  issues.push(...geoCitabilityFlags(body).filter((f) => f.startsWith('no-answer')));
  warnings.push(...geoCitabilityFlags(body).filter((f) => !f.startsWith('no-answer')));

  if (!/<FaqBlock/i.test(body) && fm.__faqCount >= 5) {
    warnings.push('faq-yaml-only (no FaqBlock in body — AEO render depends on layout)');
  }

  // Rendered HTML local
  const htmlPath = join(ROOT, 'dist/client', coll, slug, 'index.html');
  if (!existsSync(htmlPath)) {
    issues.push('missing:dist-html');
  } else {
    const html = readFileSync(htmlPath, 'utf8');
    for (const c of RENDER_CHECKS) {
      const d = c.test(html);
      if (d) {
        if (['lead-form', 'canonical', 'og-title', 'draft-leak', 'placeholder-link'].includes(c.id)) {
          issues.push(`html:${c.id}:${d}`);
        } else {
          warnings.push(`html:${c.id}:${d}`);
        }
      }
    }
  }

  // Live HTTP
  const url = `${SITE}/${coll}/${slug}/`;
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (res.status !== 200) issues.push(`live:http-${res.status}`);
  } catch (e) {
    warnings.push(`live:fetch-fail:${e.message}`);
  }

  const status = issues.length ? 'FAIL' : warnings.length ? 'WARN' : 'PASS';
  if (issues.length) failCount++;

  rows.push({
    slug,
    words,
    h2: h2Count(body),
    faq: fm.__faqCount,
    intLinks: internalLinks(body).length,
    emPer500: human.emPer500?.toFixed(1),
    status: issues.length ? 'FAIL' : warnings.length ? 'WARN' : 'PASS',
    issues,
    warnings,
  });
}

console.log('=== DEEP AUDIT — 2026-06-17 BATCH (19 guides) ===\n');
const pass = rows.filter((r) => r.status === 'PASS').length;
const warnN = rows.filter((r) => r.status === 'WARN').length;
const fail = rows.filter((r) => r.status === 'FAIL').length;
console.log(`PASS: ${pass} | WARN: ${warnN} | FAIL: ${fail}\n`);

for (const r of rows) {
  const icon = r.status === 'PASS' ? '✅' : r.status === 'WARN' ? '⚠️' : '❌';
  console.log(`${icon} ${r.slug} (${r.words}w, H2:${r.h2}, FAQ:${r.faq}, links:${r.intLinks}, em/500w:${r.emPer500})`);
  if (r.issues.length) console.log(`   P0: ${r.issues.join('; ')}`);
  if (r.warnings.length) console.log(`   P1: ${r.warnings.join('; ')}`);
}

console.log('\n=== AGGREGATE ===');
const allIssues = {};
const allWarn = {};
for (const r of rows) {
  for (const i of r.issues) {
    const k = i.split(':')[0];
    allIssues[k] = (allIssues[k] || 0) + 1;
  }
  for (const w of r.warnings) {
    const k = w.split(':')[0];
    allWarn[k] = (allWarn[k] || 0) + 1;
  }
}
console.log('P0 buckets:', allIssues);
console.log('P1 buckets:', allWarn);
process.exit(failCount > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
