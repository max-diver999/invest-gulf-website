#!/usr/bin/env node
/**
 * Add TldrBlock + InlineCta to MDX files missing them.
 * Text priority: Quick answer / TL;DR / ## Quick Answer / description / first paragraph.
 */
import fs from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';

const ROOT = path.resolve(import.meta.dirname, '..');
const CONTENT = path.join(ROOT, 'src/content');

const files = globSync('src/content/{guides,compare,areas,projects,news}/*.mdx', { cwd: ROOT });

function stripMarkdown(s) {
  return s
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return null;
  return { fm: m[1], body: m[2] };
}

function getDescription(fm) {
  const m = fm.match(/^description:\s*["']?(.+?)["']?\s*$/m);
  return m ? stripMarkdown(m[1]) : '';
}

function extractTldrText(body, description) {
  const patterns = [
    /\*\*Quick [Aa]nswer:\*\*\s*([\s\S]+?)(?:\n\n|\n(?=[#<]))/,
    /^Quick answer:\s*([\s\S]+?)(?:\n\n|\n(?=[A-Z#<]))/m,
    /^TL;DR:\s*([\s\S]+?)(?:\n\n|\n(?=[#<]))/im,
    /## Quick Answer\s*\n+([\s\S]+?)(?:\n\n|\n## )/,
  ];
  for (const p of patterns) {
    const m = body.match(p);
    if (m) {
      const t = stripMarkdown(m[1].replace(/\n/g, ' '));
      if (t.length >= 40) return t.slice(0, 500);
    }
  }
  if (description.length >= 40) return description.slice(0, 500);

  const lines = body.split('\n');
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('import ') || t.startsWith('#') || t.startsWith('![') || t.startsWith('>')) continue;
    const clean = stripMarkdown(t);
    if (clean.length >= 80) return clean.slice(0, 500);
  }
  return '';
}

function getCta(slug, collection) {
  const s = slug.toLowerCase();
  if (collection === 'news') {
    return [
      'Following Gulf property market news?',
      'Get a shortlist matched to current market conditions and your budget.',
      'Get Market Shortlist',
      `news_cta_${s.slice(0, 24)}`,
    ];
  }
  if (collection === 'projects') {
    return [
      'Interested in this off-plan project?',
      'Get payment plan details, handover timeline, and comparable alternatives.',
      'Request Project Brief',
      `project_cta_${s.slice(0, 24)}`,
    ];
  }
  if (/yield|rental|roi|return|income/.test(s)) {
    return ['Looking for the best-yield properties in the Gulf?', 'Get a shortlist matched to your yield target and budget.', 'Get Yield Shortlist', `yield_cta_${s.slice(0, 20)}`];
  }
  if (/golden-visa|residency|visa|permit|citizenship/.test(s)) {
    return ['Planning to obtain UAE residency via property?', 'Our team guides you through qualifying properties and the application process.', 'Get Residency Guide', `visa_cta_${s.slice(0, 20)}`];
  }
  if (/school|family|families|children|nursery|education/.test(s)) {
    return ['Planning a family move to the Gulf?', 'Get a shortlist of properties near the best schools in your target area.', 'Find Family Properties', `family_cta_${s.slice(0, 20)}`];
  }
  if (/tax|vat|cgt|capital-gain|zakat|fatca|crs/.test(s)) {
    return ['Buying Gulf property with tax obligations at home?', 'Get guidance on UAE tax treatment and home-country implications.', 'Get Tax Guidance', `tax_cta_${s.slice(0, 20)}`];
  }
  if (/mortgage|finance|loan|bank|transfer|payment/.test(s)) {
    return ['Ready to finance a Gulf property purchase?', 'Our team explains mortgage options and fund transfer processes.', 'Get Finance Guide', `finance_cta_${s.slice(0, 20)}`];
  }
  if (/off-plan|offplan|launch|handover|developer|payment-plan/.test(s)) {
    return ['Looking for verified off-plan projects in the Gulf?', 'Get a curated shortlist with payment plan and handover details.', 'See Current Launches', `offplan_cta_${s.slice(0, 20)}`];
  }
  if (/compare|vs|-or-|versus/.test(s)) {
    return ['Not sure which market fits your goals?', 'Get a personalised comparison matched to your budget and target return.', 'Compare Markets Free', `compare_cta_${s.slice(0, 20)}`];
  }
  if (/living|cost-of-living|relocation|move|expat|commute/.test(s)) {
    return ['Planning to relocate to the Gulf?', 'Find the right area and property for your lifestyle and budget.', 'Get Relocation Guide', `relocation_cta_${s.slice(0, 20)}`];
  }
  if (/property-investment|area|district|community|island|beach|downtown|marina/.test(s)) {
    return ['Interested in properties in this area?', 'Get a shortlist with yield and entry price data.', 'Get Area Shortlist', `area_cta_${s.slice(0, 20)}`];
  }
  return ['Looking for the right Gulf property?', 'Get a free analysis matched to your budget and target market.', 'Request Free Analysis', `inline_cta_${s.slice(0, 20)}`];
}

function jsxStringAttr(name, value) {
  return `${name}={${JSON.stringify(value)}}`;
}

function ensureImports(body) {
  const importBlock =
    "import TldrBlock from '../../components/TldrBlock.astro';\nimport InlineCta from '../../components/InlineCta.astro';\n";
  if (body.includes('import TldrBlock')) return body;
  if (body.includes('import FaqBlock')) {
    return body.replace('import FaqBlock', `${importBlock}import FaqBlock`);
  }
  if (/^\s*import /m.test(body)) {
    return importBlock + body;
  }
  return `\n${importBlock}\n${body}`;
}

function insertBeforeFirstH2(body, snippet) {
  const idx = body.search(/\n## /);
  if (idx === -1) return body.trimEnd() + snippet;
  return body.slice(0, idx) + snippet + body.slice(idx);
}

function insertCta(body, cta) {
  const tag = `
<InlineCta
  ${jsxStringAttr('headline', cta[0])}
  ${jsxStringAttr('subtext', cta[1])}
  ${jsxStringAttr('buttonText', cta[2])}
  buttonHref="/get-shortlist/"
  ${jsxStringAttr('ctaId', cta[3])}
/>
`;
  for (const marker of ['\n## About Invest Gulf', '\n<FaqBlock']) {
    if (body.includes(marker)) {
      return body.replace(marker, `${tag}${marker}`);
    }
  }
  return body.trimEnd() + `\n${tag}`;
}

let changed = 0;
let skipped = 0;
const failed = [];

for (const rel of files) {
  const filePath = path.join(ROOT, rel);
  const raw = fs.readFileSync(filePath, 'utf8');
  if (raw.includes('TldrBlock')) {
    skipped++;
    continue;
  }

  const parsed = parseFrontmatter(raw);
  if (!parsed) {
    failed.push({ rel, reason: 'no frontmatter' });
    continue;
  }

  const collection = rel.split('/')[2];
  const slug = path.basename(rel, '.mdx');
  const description = getDescription(parsed.fm);
  const tldr = extractTldrText(parsed.body, description);
  if (tldr.length < 40) {
    failed.push({ rel, reason: 'no tldr text' });
    continue;
  }

  let body = ensureImports(parsed.body);
  body = body.replace(/(import [^\n]+;\n)(?!\n)/g, '$1\n');

  const tldrTag = `\n<TldrBlock ${jsxStringAttr('text', tldr)} />\n`;
  body = insertBeforeFirstH2(body, tldrTag);
  body = insertCta(body, getCta(slug, collection));

  fs.writeFileSync(filePath, `---\n${parsed.fm}\n---\n${body}`);
  changed++;
}

console.log(`Changed: ${changed}`);
console.log(`Skipped (already had TldrBlock): ${skipped}`);
console.log(`Failed: ${failed.length}`);
if (failed.length) {
  for (const f of failed) console.log(`  ${f.rel}: ${f.reason}`);
}
