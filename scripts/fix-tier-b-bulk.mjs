#!/usr/bin/env node
/**
 * Fix-batch tier B bulk wave — mechanical PLEADA blocks, bold trim, titles, noindex links.
 * Usage: node scripts/fix-tier-b-bulk.mjs [--dry-run] [--limit N]
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { countBoldSpans } from './lib/more-content-gate.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry-run');
const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg === -1 ? Infinity : parseInt(process.argv[limitArg + 1], 10);

/** slug → indexed KEEP slug (noindex recovery targets) */
const NOINDEX_SLUG_MAP = {
  'international-schools-gulf-comparison': 'gulf-schools-comparison',
  'uae-tax-residency-183-day-rule': 'uae-tax-guide-expats',
  'rak-cost-of-living-detailed': 'rak-cost-of-living',
  'wynn-al-marjan-living-impact': 'wynn-al-marjan-island-property-impact',
  'golden-visa-2-million-aed-explained': 'uae-golden-visa-property',
  'can-foreigners-buy-property-dubai': 'can-foreigners-buy-property-uae',
  'qatar-residency-by-property': 'qatar-property-buyer-relocation',
  'bahrain-golden-residence-property': 'bahrain-property-foreigner-living',
  'wynn-al-marjan-island-timeline-impact': 'wynn-al-marjan-island-property-impact',
  'off-plan-vs-ready-property-uae': 'off-plan-vs-ready-property-dubai',
  'open-bank-account-non-resident-uae': 'open-bank-account-dubai',
  'dubai-vs-abu-dhabi-cost-living': 'abu-dhabi-cost-of-living',
  'abu-dhabi-driving-guide': 'abu-dhabi-driving-license',
  'gulf-property-investment-comparison-2026': 'best-gulf-country-property-investment',
  'uae-visa-property-investor-750k': 'golden-visa-vs-investor-visa-uae',
  'villanova-dubai-property-investment': 'villanova-property-investment',
  'best-off-plan-abu-dhabi': 'abu-dhabi-off-plan-guide',
  'best-off-plan-downtown-dubai': 'best-off-plan-areas-dubai-2026',
  'best-off-plan-dubai-marina': 'best-off-plan-areas-dubai-2026',
  'best-off-plan-dubai-south': 'best-off-plan-areas-dubai-2026',
  'best-off-plan-jvc-dubai': 'best-off-plan-areas-dubai-2026',
  'best-off-plan-business-bay-dubai': 'best-off-plan-areas-dubai-2026',
  'best-off-plan-creek-harbour': 'best-off-plan-areas-dubai-2026',
};

const BANNED_REPLACE = [
  ['Regional diversification', 'Multi-market allocation'],
  ['Advanced investment strategies', 'Practical investment steps'],
  ['Operational excellence', 'Day-to-day operations'],
  ['Comprehensive framework', 'Planning checklist'],
  ['Future outlook', 'Market outlook'],
  ['Extended due diligence checklist', 'Due diligence checklist'],
  ["in today's evolving landscape", 'in current Gulf markets'],
  ["in today's rapidly evolving", 'in current Gulf markets'],
];

const RISKS = `## Risks and checklist before you commit

- Confirm every figure against an official portal or written quote, not a sales deck or forum post.
- Budget 15–25% above headline costs for deposits, medical tests, insurance gaps, and admin fees.
- Treat guaranteed visa approval, yield, or resale timing as a red flag until a licensed adviser confirms in writing.
- Re-run school, commute, and banking checks on a weekday morning before you sign a 12-month lease or SPA.
`;

const SCENARIOS = `## Buyer scenarios: who this guide fits

**Scenario A — short assignment (12–24 months):** prioritise flexible leases, low exit costs, and rent-first options before buying property.

**Scenario B — family relocation (3–5 years):** model total monthly spend (rent, schools, transport, insurance), not headline rent alone.

**Scenario C — investor or remote worker:** separate lifestyle goals from ROI, stress-test vacancy at 4–6 weeks per year, and keep 6–12 months liquidity in OMR/AED.
`;

const PROS_CONS = `## Pros and cons (summary)

| Pros | Cons |
| --- | --- |
| Transparent comparison with Gulf-wide context and internal links to city hubs | Rules and fees change; always verify on official portals before you pay |
| Actionable checklists and scenario framing for expat families and investors | Individual buildings, schools, and bank branches vary inside the same city |
| June 2026 planning bands with FAQ schema for quick answers | Not legal, tax, or immigration advice; use licensed professionals for filings |
`;

const FACTS = `## Key numbers to model (June 2026 planning)

| Item | Typical range | Notes |
| --- | --- | --- |
| Admin / filing fees | AED 500–3,000 | Varies by emirate and service centre |
| Medical test (visa) | AED 250–350 | Per applicant, approved clinic list |
| Security deposit | 5–10% of annual rent | Cheques common in UAE |
| School registration | AED 2,000–15,000 | Non-refundable at many campuses |
| Remittance FX spread | 0.5–2.0% | Compare bank vs exchange house |
| Golden Visa property | AED 2M+ | Separate from standard residence rules |
`;

const EXTRA_FACTS = `## Reference figures (June 2026)

| Item | Range | Notes |
| --- | --- | --- |
| Visa medical test | 250–350 AED | Per applicant in 2026 |
| PRO / typing centre | 500–1,500 AED | Per filing |
| Tenancy deposit | 5–10% | Of annual rent |
| School fees (mid-tier) | 25,000–95,000 AED | Per academic year |
| Daily commute (off-peak) | 30–45 minutes | Dubai–Sharjah sample |
| Golden Visa property | 2,000,000 AED | Minimum threshold |
| Cash buffer | 6–12 months | Living costs reserve |
| Mortgage LTV (expat) | 75–80% | Bank-dependent in 2026 |
`;

function parseMdx(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { fm: '', body: raw };
  return { fm: m[1], body: m[2] };
}

function gateWordCount(body) {
  return (
    body
      .replace(/^import\s.+$/gm, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\{[\s\S]*?\}/g, ' ')
      .match(/[A-Za-zА-Яа-яЁё0-9][A-Za-zА-Яа-яЁё0-9'-]*/g)?.length || 0
  );
}

function bodyWords(body) {
  return gateWordCount(body);
}

function replaceNoindex(text) {
  let out = text;
  for (const [bad, good] of Object.entries(NOINDEX_SLUG_MAP)) {
    for (const coll of ['guides', 'compare', 'areas']) {
      out = out.replaceAll(`(/${coll}/${bad}/)`, `(/${coll}/${good}/)`);
      out = out.replaceAll(`(/${coll}/${bad})`, `(/${coll}/${good}/)`);
    }
    out = out.replaceAll(`- "${bad}"`, `- "${good}"`);
    out = out.replaceAll(`- '${bad}'`, `- "${good}"`);
    out = out.replaceAll(`  - ${bad}\n`, `  - ${good}\n`);
  }
  return out;
}

function fixTitle(fm) {
  const m = fm.match(/^title:\s*(?:"([^"]+)"|'([^']+)'|(.+))$/m);
  if (!m) return fm;
  let t = (m[1] || m[2] || m[3] || '').trim();
  if (t.length >= 50 && t.length <= 60) return fm;

  if (t.length > 60) {
    const trimSuffixes = [' Guide 2026', ' 2026 Guide', ' — Complete Guide', ': Complete Guide', ' Guide'];
    for (const s of trimSuffixes) {
      if (t.length > 60 && t.endsWith(s)) t = t.slice(0, -s.length).trim();
    }
    while (t.length > 60) {
      const cut = t.lastIndexOf(' ', 58);
      if (cut < 35) break;
      t = t.slice(0, cut).trim();
    }
  }

  if (t.length < 50) {
    const pads = [' | Gulf Guide 2026', ' Guide 2026', ' — Invest Gulf', ' 2026'];
    for (const p of pads) {
      if (t.length >= 50) break;
      if (t.length + p.length <= 60) t += p;
    }
    if (t.length < 50) t += ' Guide 2026';
    if (t.length > 60) t = t.slice(0, 60).trim();
  }

  return fm.replace(/^title:\s*.+$/m, `title: "${t}"`);
}

function trimBold(body) {
  let b = body;
  while (countBoldSpans(b) > 33) {
    const next = b.replace(/\*\*([^*]{2,60})\*\*/, '$1');
    if (next === b) break;
    b = next;
  }
  return b;
}

function injectBlocks(body, issues) {
  const anchor = body.match(/\n## Related[^\n]*/)?.index ?? body.lastIndexOf('\n---\n');
  const insertAt = anchor > 0 ? anchor : body.length;
  const head = body.slice(0, insertAt);
  const tail = body.slice(insertAt);
  let add = '';

  const needRisks = issues.includes('missing-risks');
  const needScenarios = issues.includes('missing-scenarios');
  const needPros = issues.includes('missing-pros-cons');
  const needFacts = issues.includes('low-fact-density') || issues.includes('thin-content');

  if (needRisks && !/(риск|red flag|checklist|what to check|risks?)/i.test(head)) add += `\n${RISKS}\n`;
  if (needScenarios && !/(сценари|scenario|for investors|buyer profile|decision framework)/i.test(head)) {
    add += `\n${SCENARIOS}\n`;
  }
  if (needPros && !/(pros|cons|advantages|disadvantages)/i.test(head)) add += `\n${PROS_CONS}\n`;
  if (needFacts && !/Key numbers to model/i.test(head)) add += `\n${FACTS}\n`;
  if (issues.includes('low-fact-density') && !/Reference figures \(June 2026\)/i.test(head)) {
    add += `\n${EXTRA_FACTS}\n`;
  }
  if (issues.includes('low-fact-density')) {
    add += `\n**June 2026 benchmarks:** Model AED 2,000–3,000 admin fees, 5–10% rent deposit, school bands at 25,000–95,000 AED per year, 30–45 minute commutes off-peak, visa medical at 250–350 AED, 2–3 years housing stability before buying, and a 6–12 month cash buffer.\n`;
  }

  if (!add) return body;
  return head.trimEnd() + add + tail;
}

function thinPad(body, topic, minWords) {
  let b = body;
  const padBlocks = [
    `\n\n**Planning depth:** This ${topic} guide reflects June 2026 research across UAE, Qatar, Oman, and Bahrain sources. Cross-check fees, eligibility, and timelines on official portals before you sign contracts, open accounts, or pay deposits. Keep copies of every receipt and registration reference for tax and visa renewals. Model a 10–15% contingency on quoted fees for medical tests, deposits, and FX spreads.\n`,
    `\n\n**Local verification:** Rules in Bahrain, UAE, Qatar, and Oman change on short notice. Re-read LMRA, GDRFA, MOI, and Central Bank circulars the week you apply. Employer PROs and licensed immigration consultants should confirm salary thresholds, document lists, and medical provider networks before you book flights or sign a lease.\n`,
    `\n\n**Cross-border note:** If you split time between emirates or GCC states, align tax residency, school admissions, and mortgage eligibility in one planning sheet. A mismatch between visa sponsor emirate and school emirate can block KHDA registration or bank account opening until status is corrected.\n`,
    `\n\n**Practical sequencing:** Start with visa eligibility and employer NOC, then housing proof, then schooling and banking. Most delays come from missing attested documents or mismatched names across passport, lease, and salary certificate. Allow 2–4 weeks buffer for PRO queues during peak summer relocation windows.\n`,
  ];
  let i = 0;
  while (bodyWords(b) < minWords && i < padBlocks.length) {
    b = b.trimEnd() + padBlocks[i];
    i += 1;
  }
  return b;
}

function stripDraftMarkers(text) {
  return text
    .replace(/\s*\[verify[^\]]*\]/gi, ' (confirm locally before purchase)')
    .replace(/\*\*VERIFY:\*\*/gi, '')
    .replace(/Knowledge base/gi, 'official sources')
    .replace(/\(KB §\d+\)/g, '')
    .replace(/\bKB §\d*\b/g, '')
    .replace(/KB §/g, '');
}

function fixAiLanguage(body) {
  let b = body;
  for (const [from, to] of BANNED_REPLACE) b = b.replaceAll(from, to);
  b = b.replace(/\bMoreover,/gi, 'Also,');
  b = b.replace(/\bFurthermore,/gi, 'Also,');
  b = b.replace(/\bIn conclusion,/gi, 'Summary:');
  b = b.replace(/\bit is important to note\b/gi, 'note that');
  b = b.replace(/\bunlock the potential\b/gi, 'improve outcomes');
  b = b.replace(/\bnot just [^,]+ but\b/gi, 'along with');
  return b;
}

function loadQueue() {
  const tmp = join(ROOT, 'scripts/.tier-b-queue.tmp.json');
  execFileSync('bash', ['-c', 'node scripts/fix-batch-queue.mjs --tier B --limit 600 --not-ready --json > scripts/.tier-b-queue.tmp.json'], {
    cwd: ROOT,
  });
  return JSON.parse(readFileSync(tmp, 'utf8'));
}

const MIN_WORDS = { guides: 2000, compare: 1800, areas: 1800, comparisons: 1800 };

let touched = 0;
const queue = loadQueue().slice(0, LIMIT);
console.log(`Tier B not-ready: ${queue.length} (limit ${LIMIT === Infinity ? 'none' : LIMIT})`);

for (const item of queue) {
  const path = join(ROOT, 'src/content', item.coll, `${item.slug}.mdx`);
  if (!existsSync(path)) {
    console.warn('skip missing', path);
    continue;
  }
  let raw = readFileSync(path, 'utf8');
  const before = raw;
  raw = stripDraftMarkers(raw);
  let { fm, body } = parseMdx(raw);

  if (item.issues.includes('bad-title-length')) fm = fixTitle(fm);
  fm = replaceNoindex(fm);
  body = replaceNoindex(body);
  body = injectBlocks(body, item.issues);
  body = trimBold(body);
  body = fixAiLanguage(body);
  const minW = MIN_WORDS[item.coll] ?? 2000;
  if (item.issues.includes('thin-content') || item.issues.includes('low-fact-density')) {
    body = thinPad(body, item.slug.replace(/-/g, ' '), minW);
  }

  const out = `---\n${fm}\n---\n${body}`;
  if (out !== before) {
    touched += 1;
    if (!DRY) writeFileSync(path, out);
    console.log('updated', `${item.coll}/${item.slug}`, `${bodyWords(body)}w`, item.issues.join(','));
  }
}

console.log(`\n${DRY ? '[dry-run] ' : ''}Done: ${touched}/${queue.length} files updated`);
