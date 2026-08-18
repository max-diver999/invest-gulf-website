#!/usr/bin/env node
/**
 * Phase 1–2 cleanup: only files in scripts/_flagged-spam-files.json
 * Usage: node scripts/cleanup-flagged-only.mjs [--dry-run] [--verbose]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMdxBody } from './lib/geo-citability-scorer.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LIST = join(ROOT, 'scripts/_flagged-spam-files.json');
const DRY = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

const STRIP_PARAS = [
  /^Gulf investors reviewing .+ typically require .+$/m,
  /^Foreign buyers and Gulf investors reviewing .+ typically require .+$/m,
  /^Invest Gulf underwriting on .+$/m,
  /^Invest Gulf['']s 2026 answer:.+ requires a documented decision for foreign buyers.+$/m,
  /^Invest Gulf['']s 2026 answer is that.+$/m,
  /^Invest Gulf checklist: this decision requires written verification.+$/m,
  /^Key figures for this (\w+ )?section:.+$/m,
  /^Invest Gulf anchors diligence here with.+$/m,
  /^Buyers researching .+ should treat .+$/m,
  /^Invest Gulf reviewed .+ benchmarks on .+ files in Q2 2026.+$/m,
  /^Insider tip: request service charge schedules and trustee and DLD fee quotes in writing on What should buyers verify on key numbers.+$/m,
];

const STRIP_LINES = [
  /^- \*\*12-month evidence check:\*\*.+$/gm,
  /^- \*\*MODELED carry:\*\*.+$/gm,
  /^- Verify the signed SPA, the authority record, and the current developer offer before you decide\.\s*$/gm,
];

function normalizeApostrophes(text) {
  return text.replace(/\u2019/g, "'");
}

const STRIP_BLOCKS = [
  /\nInvest Gulf DD notes for this section:\n\n- \*\*MODELED carry:\*\*.+?(?=\n## |\n<FaqBlock|\n<LeadForm|$)/gs,
  /\n\nInvest Gulf DD checklist for [^\n]+:\n\n- \*\*MODELED carry:\*\*.+?(?=\n\nInvest Gulf underwriting|\n## |\n<FaqBlock)/gs,
  /\n## What do Invest Gulf field notes show for this market\?\n[\s\S]*?(?=\n## |\n<FaqBlock|\n<LeadForm|$)/g,
  /\n\nInvest Gulf checklist:\n- Confirm the section numbers against live listings\n- Re-test assumptions after 30 days in situ\n- Keep a written exit plan before renewal\n/g,
  /\n\nInvest Gulf checklist:\n(?:- [^\n]+\n)+/g,
  /\n\nChecklist:\n(?:- [^\n]+\n)+/g,
  /\n\n- Verify the evidence named below before signing\.\n\n\| Decision check \| Evidence to confirm \|\n\| --- \| --- \|\n\| Current position \| Project-specific documents and comparables \|\n/g,
];

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

function cleanForeignBuyerSuffix(text) {
  let out = text;
  for (let i = 0; i < 5; i += 1) {
    const next = out.replace(/ for foreign buyers in this market/g, '');
    if (next === out) break;
    out = next;
  }
  return out.replace(/ for foreign buyers for foreign buyers/g, ' for foreign buyers');
}

function shouldDropParagraph(p) {
  const t = p.trim();
  if (!t || t.startsWith('import ') || t.startsWith('<')) {
    return false;
  }
  if (/^\| Planning check \| Value to confirm \|/.test(t)) return true;
  if (/^\| Checkpoint \| Target \|/.test(t)) return true;
  if (/^Foreign buyers and Gulf investors reviewing/i.test(t)) return true;
  if (/^Invest Gulf underwriting on/i.test(t)) return true;
  if (/^Invest Gulf['']s 2026 answer:/i.test(t)) return true;
  if (/^Invest Gulf checklist:/i.test(t)) return true;
  if (/^Key figures for this (\w+ )?section:/i.test(t)) return true;
  if (/^Invest Gulf anchors diligence here with/i.test(t)) return true;
  if (/^An informed answer requires a project-specific check rather than a broad market assumption\./.test(t)) return true;
  if (/^Invest Gulf underwriting always rebuilds net cash flow from Ejari or SPA figures rather than accepting a single brochure percentage\.$/.test(t)) return true;
  if (/^Invest Gulf models Fujairah coastal deals with summer vacancy and resort fee drag before comparing them to Dubai waterfront yields\.$/.test(t)) return true;
  if (/^Invest Gulf treats Oqood or REST status as the residency clock start, not SPA signing day or a launch brochure claim\.$/.test(t)) return true;
  if (/^Invest Gulf aligns DLD closing packs with ICP document lists so residency work does not restart after medical fees are spent\.$/.test(t)) return true;
  if (/^Invest Gulf compares early-settlement and title clauses across Islamic structures before ranking a 0\.25% profit-rate difference\.$/.test(t)) return true;
  if (/^Invest Gulf explains to buyers that DLD ownership and ICP identity are separate clocks, even when the same AED 2 million asset funds both plans\.$/.test(t)) return true;
  if (/^- Confirm current official rules on points that affect your file\n- Keep written quotes with the lease pack\n- Re-check figures within 30 days of signing$/s.test(t)) return true;
  if (/^- Verify current official rules before reliance\n- Keep supporting docs dated within 90 days\n- Re-confirm figures at application, not brochure stage$/s.test(t)) return true;
  if (/^- Confirm current official figures within 14 days\n- Keep scans under portal size limits\n- Align calendars before deposits$/s.test(t)) return true;
  if (/^- Confirm the figure against a live quote\n- Keep a 10 percent contingency for the first year\n- Revisit the line item every 90 days$/s.test(t)) return true;
  if (/^- Confirm official register status\n- Confirm fee band in writing\n- Confirm exit liquidity assumptions over 12 months$/s.test(t)) return true;
  if (/^- Confirm current official rules on points that affect your file\n- Keep written quotes with the deal pack\n- Re-check fig/.test(t)) return true;
  if (/^- Confirm the rule or fee in writing\n- Match the document to Dubai REST or the school file\n- Keep dates and amounts with the SPA or enrollment pack$/s.test(t)) return true;
  if (/^- Confirm the opening AED or timeline figure in writing\n- Re-check the official source if data is older than 30 days$/s.test(t)) return true;
  if (/^- Confirm the AED, day, or percent figure in writing\n- Re-check the official source if data is older than 30 days$/s.test(t)) return true;
  if (/^- Keep AED-equivalent columns current\n- Re-check school invoices each term\n- Hold a 10 percent contingency$/s.test(t)) return true;
  if (/^- Confirm MOI building eligibility in writing\n- Keep emergency cash after fees\n- Revisit the file every 90 days$/s.test(t)) return true;
  if (/^- Verify current official rules before you rely on this section\n- Keep documents dated within the last 90 days where banks ask\n- Re-check figures at application, not only at brochure stage$/s.test(t)) return true;
  if (/^- Keep copies of every receipt tied to the table above\n- Re-check current thresholds before travel or wiring funds$/s.test(t)) return true;
  if (/^- Verify RERA escrow before any reservation wire\n- Pull Ejari comps for the same community\n- Count competing handovers/.test(t)) return true;
  if (/^- Verify the claim on an official portal before you wire funds\n- Keep screenshots of escrow, title, and charge schedules\n- Budget AED contingency for legal review inside 14 days\n- Walk away if sellers block documents past day 10$/s.test(t)) return true;
  if (/^- Confirm eligibility documents before paying retainers/.test(t) && /Match passport names/.test(t)) return true;
  if (/^- Confirm figures against current Ejar and REGA documents/.test(t)) return true;
  if (/^- Keep Invest Gulf numeric checks on AED and % lines/.test(t)) return true;
  if (/^- Confirm figures against current official rules within 14 days/.test(t)) return true;
  if (/^- Keep both columns on the same lifestyle tier/.test(t)) return true;
  if (/^- \*\*DLD fees:\*\* 160% transfer band on disposal\./.test(t)) return true;
  if (/^- \*\*DLD fees:\*\* 4% transfer band on disposal\./.test(t)) return true;
  if (t.startsWith('|') && !/^\| [A-Za-z]/.test(t.split('\n')[0]?.replace(/^\| /, '') || '')) {
    // Drop generic repeated markdown tables (not data tables with headers like | Metric |)
    if (/^\| (Planning check|Checkpoint|Decision check) /.test(t)) return true;
  }
  for (const re of STRIP_PARAS) {
    if (re.test(t)) return true;
  }
  return false;
}

function dedupeSection(section) {
  const paras = section.split(/\n{2,}/);
  const seen = new Set();
  const kept = [];
  for (let p of paras) {
    p = cleanForeignBuyerSuffix(p);
    const norm = p.replace(/\s+/g, ' ').trim();
    if (!norm) continue;
    if (shouldDropParagraph(p)) continue;
    if (seen.has(norm)) continue;
    seen.add(norm);
    kept.push(p);
  }
  return kept.join('\n\n');
}

function dedupeParagraphs(body) {
  const parts = body.split(/(\n## [^\n]+\n)/);
  let out = '';
  for (let i = 0; i < parts.length; i += 1) {
    const chunk = parts[i];
    if (!chunk.startsWith('\n## ')) {
      out += dedupeSection(chunk);
      continue;
    }
    out += chunk;
    const section = parts[i + 1] || '';
    out += dedupeSection(section);
    i += 1;
  }
  return out;
}

function dedupeExactLines(body) {
  const lines = body.split('\n');
  const seen = new Set();
  const kept = [];
  for (const line of lines) {
    const norm = line.trim();
    if (norm.startsWith('- **12-month evidence check:**') && seen.has(norm)) continue;
    if (norm.startsWith('Invest Gulf checklist: this decision requires written verification') && seen.has(norm)) {
      continue;
    }
    if (norm) seen.add(norm);
    kept.push(line);
  }
  return kept.join('\n');
}

function fixHeadingSpacing(body) {
  return body.replace(/([^\n])\n(## )/g, '$1\n\n$2');
}

function cleanBody(body) {
  let out = normalizeApostrophes(body);
  for (const re of STRIP_BLOCKS) out = out.replace(re, '\n');
  for (const re of STRIP_LINES) out = out.replace(re, '');
  out = out.replace(/\n## Related reading\n/g, '\n\n**Related reading**\n\n');
  out = dedupeHeadings(out);
  out = dedupeParagraphs(out);
  out = dedupeExactLines(out);
  out = fixHeadingSpacing(out);
  out = out.replace(/\n{4,}/g, '\n\n\n');
  return out.trimEnd() + '\n';
}

if (!existsSync(LIST)) {
  console.error('Missing', LIST);
  process.exit(1);
}

const files = JSON.parse(readFileSync(LIST, 'utf8'));
let touched = 0;

for (const rel of files) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) {
    console.warn('skip missing', rel);
    continue;
  }
  const raw = readFileSync(abs, 'utf8');
  const fm = raw.match(/^---\n[\s\S]*?\n---\n?/)?.[0] || '';
  const body = parseMdxBody(raw);
  const cleaned = cleanBody(body);
  if (cleaned === body) continue;
  touched += 1;
  if (VERBOSE) {
    const beforeLen = body.length;
    const afterLen = cleaned.length;
    console.log(`${rel}: ${beforeLen} → ${afterLen} (-${beforeLen - afterLen})`);
  }
  if (!DRY) writeFileSync(abs, fm + cleaned);
}

console.log(`${DRY ? '[dry-run] ' : ''}Cleaned ${touched} of ${files.length} flagged files`);
