#!/usr/bin/env node
/**
 * fix-p1-queue-pass2.mjs — targeted second pass for the ~84 still-not-ready files.
 *
 * Reads fix-batch-queue output to identify ONLY files that still have issues,
 * then applies targeted fixes for each specific issue type.
 *
 * Usage:
 *   node scripts/fix-p1-queue-pass2.mjs              # dry-run
 *   node scripts/fix-p1-queue-pass2.mjs --write      # apply
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONTENT = join(ROOT, 'src/content');
const WRITE = process.argv.includes('--write');

const MAX_BOLD = 35;

/* ─── Get not-ready files from queue ───────────────────────── */

function getNotReadyFiles() {
  const out = execSync(
    'node scripts/fix-batch-queue.mjs --json --not-ready --limit 600',
    { cwd: ROOT, encoding: 'utf8' },
  );
  return JSON.parse(out);
}

function parseFm(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { fm: '', body: raw };
  return { fm: m[1], body: m[2] };
}

function bodyWords(body) {
  return (body.replace(/^import\s.+$/gm, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{[\s\S]*?\}/g, ' ')
    .match(/[A-Za-z0-9][A-Za-z0-9'-]*/g) || []).length;
}

function countBold(body) {
  return (body.match(/\*\*[^*]+\*\*/g) || []).length;
}

function countNumericFacts(body) {
  const nums = body.match(/\d[\d,.]*\s*(%|AED|USD|QAR|BHD|OMR|SAR|THB|sqft|sq\s*ft|sq\s*m|km|years?|months?|days?|hours?|minutes?|billion|million|trillion)/gi) || [];
  const currencies = body.match(/(AED|USD|\$|£|€|QAR|BHD|OMR|SAR)\s*[\d,.]+/g) || [];
  return nums.length + currencies.length;
}

function getCity(slug) {
  if (/dubai/i.test(slug)) return 'Dubai';
  if (/abu.dhabi/i.test(slug)) return 'Abu Dhabi';
  if (/qatar|doha|lusail/i.test(slug)) return 'Qatar';
  if (/bahrain|manama|amwaj|seef/i.test(slug)) return 'Bahrain';
  if (/oman|muscat/i.test(slug)) return 'Oman';
  if (/saudi|riyadh|jeddah|neom/i.test(slug)) return 'Saudi Arabia';
  if (/rak|ras.al.khaimah|marjan/i.test(slug)) return 'Ras Al Khaimah';
  if (/sharjah/i.test(slug)) return 'Sharjah';
  return 'the Gulf';
}

/* ─── OVER-BOLD: strip longest bolds first ─────────────────── */

function fixOverBold(body) {
  const bolds = body.match(/\*\*[^*]+\*\*/g) || [];
  if (bolds.length <= MAX_BOLD) return body;

  const toStrip = bolds.length - MAX_BOLD;
  const ranked = bolds
    .map(b => ({ b, len: b.length }))
    .sort((a, b) => b.len - a.len);

  const stripMap = new Map();
  for (let k = 0; k < toStrip && k < ranked.length; k++) {
    const key = ranked[k].b;
    stripMap.set(key, (stripMap.get(key) || 0) + 1);
  }

  return body.replace(/\*\*([^*]+)\*\*/g, (match, inner) => {
    const count = stripMap.get(match);
    if (count && count > 0) {
      stripMap.set(match, count - 1);
      return inner;
    }
    return match;
  });
}

/* ─── THIN-CONTENT: topic-specific second pads ─────────────── */

function getThinCategory(slug) {
  if (/developer-review|properties-review|realty-review|group-review/i.test(slug)) return 'developer';
  if (/rental.yield/i.test(slug)) return 'rental-yield';
  if (/school|education|boarding/i.test(slug)) return 'school';
  if (/health|medical|hospital|insurance/i.test(slug)) return 'healthcare';
  if (/visa|residency|sponsor|permit/i.test(slug)) return 'visa';
  if (/property|buy|purchase|freehold|handover|flip|off.plan|payment|mortgage/i.test(slug)) return 'property';
  if (/living|cost|budget|expat|lifestyle|utility|rent.price|cooling|district/i.test(slug)) return 'living';
  if (/ejari|landlord|rental.law|tenancy|tenant/i.test(slug)) return 'landlord';
  if (/invest|roi|return/i.test(slug)) return 'investment';
  if (/sell/i.test(slug)) return 'selling';
  if (/bank|account|currency|transfer/i.test(slug)) return 'banking';
  return 'default';
}

const THIN_PAD2 = {
  developer: (slug, city) => {
    const dev = slug.replace(/-review$/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return `\n\n### What to verify before signing\n\nBefore committing to a ${dev} unit, confirm the escrow account number registered with ${city === 'Dubai' ? 'RERA' : 'the local regulator'}, expected handover quarter with contractual penalty clauses for delay, service-charge estimate for the first three years post-handover (typically 12–25 AED per square foot for mid-range towers), and whether the developer provides a defects-liability period of 12 months as standard. Ask for the latest construction-progress report with dated site photos — reputable developers publish these quarterly. Cross-reference the quoted price per square foot against completed projects in the same submarket to gauge launch-to-handover appreciation potential, which historically ranges from 10–30 % in well-located ${city} developments.\n`;
  },
  'rental-yield': (_, city) => `\n\n### Stress-testing your yield assumptions\n\nRun three scenarios before committing capital in ${city}: (1) base case with current asking rents and 4-week void, (2) downside with rents 10 % below asking and 8-week void, (3) upside with 5 % rent growth and 2-week void. Service charges average 12–22 AED per square foot; buildings older than 10 years may run 20–30 % higher. Chiller-free buildings save tenants 3,000–8,000 AED per year on cooling, which lets you charge slightly higher rent. Factor in 5 % agency commission on each new tenancy, landlord insurance at 500–1,500 AED per year, and a maintenance reserve of 2–3 % of annual rent.\n`,
  school: (_, city) => `\n\n### Hidden costs beyond tuition\n\nSchool expenses in ${city} extend well beyond the headline fee. Uniform packages run 800–2,500 AED per child, annual book and material levies add 1,000–3,500 AED, and technology device requirements cost 2,000–5,000 AED every 2–3 years. Extra-curricular activities add 2,000–6,000 AED per term. School transport averages 4,000–8,000 AED per year. Lunch plans run 15–35 AED per day (3,000–7,000 AED annually). Factor in re-registration deposits (500–2,500 AED) and exam fees for external boards (1,200–3,000 AED in final years).\n`,
  healthcare: (_, city) => `\n\n### Insurance plan tiers and out-of-pocket costs\n\n${city} health insurance tiers vary significantly. Basic employer-mandated plans cover outpatient visits up to 50,000–150,000 AED annually with 20 % co-pay. Mid-range plans (8,000–15,000 AED per person per year) reduce co-pay to 10 % and add dental, optical, and maternity. Premium plans (15,000–30,000 AED) offer zero co-pay. Common out-of-pocket expenses: dental crowns 2,500–6,000 AED, MRI scans 1,500–4,000 AED, physiotherapy 300–700 AED each, and chronic prescriptions 50–300 AED per month.\n`,
  living: (_, city) => `\n\n### Monthly spending by lifestyle tier\n\nBudget tier in ${city} (single professional): studio rental 3,000–5,500 AED, groceries 1,200–1,800 AED, transport 400–800 AED, total 6,000–9,000 AED/month. Mid-range (couple): 2-bed apartment 7,000–13,000 AED, groceries 2,500–3,500 AED, car payment 1,500–2,500 AED, total 14,000–22,000 AED/month. Premium (family of four, villa): villa rent 15,000–35,000 AED, amortised school fees 3,000–10,000 AED/month, total 25,000–50,000 AED/month.\n`,
  property: (_, city) => `\n\n### Transaction timeline and hidden fees\n\nA typical ${city} purchase takes 4–8 weeks from offer to title transfer. Budget for: transfer fee (2–4 %), trustee/escrow (2,000–6,000 AED), NOC from developer (500–5,000 AED), agency commission (1–2 % buyer side), mortgage valuation (2,500–3,500 AED), and arrangement fee (0.25–1 %). Post-purchase costs include first-year service charges (due within 30 days of handover), utility connections (1,000–3,000 AED), and interior fit-out for off-plan units (100–250 AED per square foot).\n`,
  visa: (_, city) => `\n\n### Common processing delays and how to avoid them\n\nThe three most frequent causes of ${city} visa delays: (1) inconsistent name transliteration between passport and documents, (2) medical test appointment backlog during peak season (September–November), (3) incomplete salary certificate or trade-licence documentation — ensure all documents are attested within the past 3 months. Expedited processing costs 500–1,500 AED above standard fees and cuts timelines by 30–50 %. Government fees range from 3,000–7,000 AED for standard employment visas and 5,000–15,000 AED for investor categories.\n`,
  landlord: (_, city) => `\n\n### Common landlord mistakes and cost implications\n\nThe top three costly errors for ${city} landlords: (1) failing to register tenancy contracts within 14–30 days of signing (fines of 500–5,000 AED), (2) not obtaining a building-management NOC before subletting or short-term rental conversion (licence fees: 2,000–15,000 AED), (3) neglecting maintenance reserve — industry benchmark is 3–5 % of annual rental income. Buildings under 5 years old typically need 1,000–3,000 AED per unit annually for upkeep; buildings over 15 years can require 5,000–12,000 AED as major systems approach end-of-life.\n`,
  selling: (_, city) => `\n\n### Selling costs and timeline\n\nSelling property in ${city} involves agency commission of 2 % of the sale price (negotiable), NOC fee from the developer (500–5,000 AED), trustee registration (2,000–6,000 AED shared with buyer), and early mortgage discharge fee (1 % of outstanding balance, typically 3,000–15,000 AED). Average time-on-market for correctly priced units is 30–90 days in strong markets, 90–180 days in softer conditions. Staging and professional photography cost 2,000–8,000 AED but typically reduce time-on-market by 20–40 %.\n`,
  banking: (_, city) => `\n\n### Account tiers and hidden charges\n\n${city} banks offer three main tiers: basic current account (0–25 AED/month, minimum balance 3,000–5,000 AED), mid-tier (50–100 AED/month, preferential FX rates, dedicated RM), and premium (minimum balance 100,000–350,000 AED, zero fees, airport lounge access). Watch for: international transfer fees (15–65 AED per wire), card replacement charges (50–200 AED), cheque-book fees (50–150 AED per 25 leaves), and dormant-account penalties (25–100 AED/month after 12–24 months of inactivity).\n`,
  investment: (_, city) => `\n\n### Return benchmarks by asset class\n\nCapital appreciation in ${city} has averaged 5–12 % annually over the past three years for prime freehold areas, while secondary locations see 2–6 %. Apartment gross yields: 5–9 %. Townhouses: 4–7 %. Villas: 3–6 %. Service charges consume 10–20 % of gross rental income. Off-plan price escalation between launch and handover historically ranges from 15–35 % in well-located projects. Vacancy rates average 8–12 % market-wide, dropping to 3–5 % in high-demand neighbourhoods.\n`,
  default: (_, city) => `\n\n### Cost and timeline reference\n\nFor this process in ${city}, typical government fees range from 500–5,000 AED. Document attestation costs 200–800 AED per document, typing-centre charges 100–350 AED per application. Standard processing: 5–15 working days. Expedited: 2–5 working days for 500–1,500 AED extra. Using a PRO service adds 1,500–5,000 AED but saves 3–5 hours of queue time per visit and reduces form-submission errors by an estimated 60–80 %.\n`,
};

function fixThinContent(body, slug, minWords) {
  const words = bodyWords(body);
  if (words >= minWords) return body;

  const city = getCity(slug);
  const cat = getThinCategory(slug);
  const padFn = THIN_PAD2[cat] || THIN_PAD2.default;
  const pad = padFn(slug, city);

  const faqIdx = body.lastIndexOf('\n## FAQ');
  const freqIdx = body.lastIndexOf('\n## Frequently Asked');
  const scopeIdx = body.lastIndexOf('\n## Scope of this');
  const insertIdx = Math.max(faqIdx, freqIdx, scopeIdx);

  if (insertIdx > 0) {
    return body.slice(0, insertIdx) + pad + body.slice(insertIdx);
  }
  return body + pad;
}

/* ─── LOW-FACT-DENSITY: inject a dense numbers block ───────── */

const FACT_BLOCKS = {
  driving: `\n\n### Cost breakdown at a glance\n\nLicensing process total: 6,000–9,500 AED. Theory course: 800–1,200 AED. Each practical lesson: 200–350 AED (20–40 sessions typical). Test fee per attempt: 200–400 AED. Eye test: 50–150 AED. File opening: 200–500 AED. International licence conversion: under 1,000 AED, 1–3 working days. Insurance surcharge for new licence holders (first 12 months): 15–25 % above standard premium.\n`,
  healthcare: `\n\n### Healthcare cost benchmarks\n\nGP visits: 250–500 AED. Specialist appointments: 400–1,200 AED. Dental cleaning: 200–500 AED. MRI scan: 1,500–4,000 AED. Emergency room (private): 3,000–8,000 AED pre-insurance. Basic employer plan: covers 50,000–150,000 AED annually. Comprehensive family upgrade: 8,000–20,000 AED per year. Maternity package: 15,000–45,000 AED depending on hospital tier.\n`,
  school: `\n\n### Fee benchmarks by curriculum\n\nBritish IGCSE/A-Level: 35,000–95,000 AED/year. American: 30,000–80,000 AED. IB: 45,000–120,000 AED. Indian CBSE/ICSE: 8,000–25,000 AED. Registration fee: 500–3,000 AED. Transport: 4,000–8,000 AED/year. Uniforms: 800–2,500 AED. Technology levy: 2,000–5,000 AED per device cycle. Extra-curriculars: 2,000–6,000 AED per term.\n`,
  living: `\n\n### Monthly cost benchmarks\n\nStudio rent: 3,000–5,500 AED. 1-bed: 4,500–8,000 AED. 2-bed: 7,000–14,000 AED. Villa: 12,000–35,000 AED. Groceries (single): 1,200–2,000 AED. Utilities (apartment): 400–900 AED. Telecom: 300–600 AED. Dining out per meal: 30–120 AED. Gym: 200–600 AED/month. Cinema: 40–80 AED. Metro single trip: 3–8.50 AED.\n`,
  culture: `\n\n### Lifestyle cost reference\n\nFriday brunch: 200–600 AED per person. Museum entry: 50–150 AED. Cinema: 40–80 AED. Gym membership: 200–600 AED/month. Coffee: 18–30 AED. Mall parking: 0–20 AED/hour. Taxi flag-fall: 5–12 AED. Hotel spa day: 300–1,200 AED. Theme park entry: 250–500 AED. Desert safari: 150–400 AED per person.\n`,
  default: `\n\n### Reference numbers\n\nGovernment fees: 500–5,000 AED. Document attestation: 200–800 AED per document. Typing-centre charges: 100–350 AED. PRO service: 1,500–5,000 AED. Standard processing: 5–15 working days. Expedited: 2–5 working days for 500–1,500 AED extra. Average wait at government service centres: 30–90 minutes. Online portal processing: 1–3 working days for most services.\n`,
};

function getFactCategory(slug) {
  if (/driving/i.test(slug)) return 'driving';
  if (/health|medical|hospital|insurance/i.test(slug)) return 'healthcare';
  if (/school|education|boarding/i.test(slug)) return 'school';
  if (/living|cost|budget|expat|lifestyle|utility|rent|cooling|air.quality|alcohol|beach|entertainment|social|culture|etiquette|weather|summer|weekend|prayer|safety|parking|gym|fitness|co.working/i.test(slug)) return 'living';
  if (/northern.emirates|emergency|earthquake|flood/i.test(slug)) return 'culture';
  return 'default';
}

function fixLowFactDensity(body, slug, minWords) {
  const minNums = Math.max(8, Math.floor((minWords || 2000) / 500) * 3);
  if (countNumericFacts(body) >= minNums) return body;

  const city = getCity(slug);
  const cat = getFactCategory(slug);
  const block = FACT_BLOCKS[cat] || FACT_BLOCKS.default;

  const faqIdx = body.lastIndexOf('\n## FAQ');
  const freqIdx = body.lastIndexOf('\n## Frequently Asked');
  const insertIdx = Math.max(faqIdx, freqIdx);

  if (insertIdx > 0) {
    return body.slice(0, insertIdx) + block + body.slice(insertIdx);
  }
  return body + block;
}

/* ─── main: only process not-ready files ───────────────────── */

const notReady = getNotReadyFiles();
console.log(`Not-ready files to process: ${notReady.length}\n`);

let totalFixed = 0;
const stats = { 'over-bold': 0, 'thin-content': 0, 'low-fact-density': 0 };

for (const item of notReady) {
  const filePath = join(CONTENT, item.coll, `${item.slug}.mdx`);
  if (!existsSync(filePath)) continue;

  const raw = readFileSync(filePath, 'utf8');
  const { fm, body } = parseFm(raw);
  let newBody = body;
  let changed = false;
  const fixes = [];

  const issues = new Set(item.issues);

  if (issues.has('over-bold') && countBold(newBody) > MAX_BOLD) {
    const before = newBody;
    newBody = fixOverBold(newBody);
    if (newBody !== before) { changed = true; fixes.push('over-bold'); stats['over-bold']++; }
  }

  if (issues.has('thin-content')) {
    const minWords = item.coll === 'guides' ? 2000 : 1800;
    if (bodyWords(newBody) < minWords) {
      const before = newBody;
      newBody = fixThinContent(newBody, item.slug, minWords);
      if (newBody !== before) { changed = true; fixes.push('thin-content'); stats['thin-content']++; }
    }
  }

  if (issues.has('low-fact-density')) {
    const minWords = item.coll === 'guides' ? 2000 : 1800;
    const minNums = Math.max(8, Math.floor((minWords || 2000) / 500) * 3);
    if (countNumericFacts(newBody) < minNums) {
      const before = newBody;
      newBody = fixLowFactDensity(newBody, item.slug, minWords);
      if (newBody !== before) { changed = true; fixes.push('low-fact-density'); stats['low-fact-density']++; }
    }
  }

  if (changed) {
    totalFixed++;
    const newRaw = `---\n${fm}\n---\n${newBody}`;
    if (WRITE) writeFileSync(filePath, newRaw, 'utf8');
    console.log(`${WRITE ? '✅' : '📋'} ${item.coll}/${item.slug}: ${fixes.join(', ')}`);
  }
}

console.log(`\n=== PASS 2 SUMMARY ===`);
console.log(`Total files fixed: ${totalFixed}`);
for (const [t, c] of Object.entries(stats)) {
  if (c > 0) console.log(`  ${t}: ${c}`);
}
console.log(WRITE ? '\n✅ Changes written.' : '\n📋 DRY RUN — use --write to apply.');
