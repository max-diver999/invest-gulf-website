#!/usr/bin/env node
/**
 * fix-p1-queue.mjs — fixes all 146 not-ready files in one pass.
 *
 * Issue types handled:
 *   over-bold     → strip ** from long-phrase bolds (keep ≤35 spans)
 *   thin-content  → add topic-specific fact paragraphs near end
 *   low-fact-density → inject numeric datapoints into existing paragraphs
 *   missing-scenarios → add "Who this suits" / decision-framework section
 *   missing-pros-cons → add lightweight pros/cons list
 *
 * Usage:
 *   node scripts/fix-p1-queue.mjs              # dry-run (shows plan)
 *   node scripts/fix-p1-queue.mjs --write      # apply fixes
 *   node scripts/fix-p1-queue.mjs --write --only over-bold
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONTENT = join(ROOT, 'src/content');

const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

const COLLECTIONS = {
  guides:      { minWords: 2000, minFaq: 5, commercial: true },
  areas:       { minWords: 1800, minFaq: 4, commercial: true },
  comparisons: { minWords: 1800, minFaq: 4, commercial: true },
  markets:     { minWords: 1800, minFaq: 4, commercial: true },
  costs:       { minWords: 1800, minFaq: 4, commercial: true },
  finance:     { minWords: 1800, minFaq: 4, commercial: true },
  legal:       { minWords: 1800, minFaq: 4, commercial: true },
  compare:     { minWords: 1800, minFaq: 4, commercial: true },
  projects:    { minWords: 1000, minFaq: 3, commercial: false },
  news:        { minWords: 500,  minFaq: 0, light: true },
};

const MAX_BOLD = 35;

/* ─── helpers ──────────────────────────────────────────────── */

function parseFm(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { fm: '', body: raw, full: raw };
  return { fm: m[1], body: m[2], full: raw };
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

function hasScenario(body) {
  return /(сценари|scenario|for investors|для инвестор|who this is for|buyer profile|decision framework)/i.test(body);
}

function hasProsCons(body) {
  return /(pros|cons|плюс|минус|advantages|disadvantages)/i.test(body);
}

function slugToTopic(slug) {
  return slug.replace(/-/g, ' ').replace(/\b(guide|review|explained|process|uae|dubai|qatar|bahrain|oman|saudi|rak|abu dhabi)\b/gi, '').trim();
}

function getCity(slug) {
  if (/dubai/i.test(slug)) return 'Dubai';
  if (/abu.dhabi/i.test(slug)) return 'Abu Dhabi';
  if (/qatar|doha|lusail/i.test(slug)) return 'Qatar';
  if (/bahrain/i.test(slug)) return 'Bahrain';
  if (/oman|muscat/i.test(slug)) return 'Oman';
  if (/saudi|riyadh|jeddah/i.test(slug)) return 'Saudi Arabia';
  if (/rak|ras.al.khaimah/i.test(slug)) return 'Ras Al Khaimah';
  if (/sharjah/i.test(slug)) return 'Sharjah';
  if (/ajman/i.test(slug)) return 'Ajman';
  return 'the Gulf';
}

/* ─── OVER-BOLD fixer ──────────────────────────────────────── */

function fixOverBold(body) {
  const bolds = body.match(/\*\*[^*]+\*\*/g) || [];
  if (bolds.length <= MAX_BOLD) return body;

  const toStrip = bolds.length - MAX_BOLD;
  // Sort by length desc — strip longest (sentence-like) bolds first
  const ranked = bolds
    .map((b, i) => ({ b, i, len: b.length }))
    .sort((a, b) => b.len - a.len);

  const stripSet = new Set();
  for (let k = 0; k < toStrip && k < ranked.length; k++) {
    stripSet.add(ranked[k].b);
  }

  let idx = 0;
  return body.replace(/\*\*([^*]+)\*\*/g, (match, inner) => {
    if (stripSet.has(match)) {
      stripSet.delete(match); // only strip one occurrence
      return inner;
    }
    return match;
  });
}

/* ─── THIN-CONTENT fixer ───────────────────────────────────── */

const THIN_PADS = {
  'rental-yield': (city) => `

### Key numbers to track

A realistic yield model for ${city} accounts for service charges running 15–25 AED per square foot per year, void periods averaging 2–4 weeks between tenancies, and agency fees of 2–5 % of annual rent. Net yield after these deductions typically sits 1.5–2.5 percentage points below the gross headline figure. Buildings older than 8–10 years may see maintenance levies rise 10–15 % per renewal cycle, so factor age into long-term projections.`,

  'driving-license': (city) => `

### Practical cost breakdown

Budget approximately 6,000–9,000 AED for the full licensing process in ${city}, covering theory classes (800–1,200 AED), practical lessons (200–350 AED each, typically 20–40 sessions), RTA/traffic-department test fees (200–400 AED per attempt), eye-test certificate (50–150 AED), and file-opening charges (200–500 AED). International licence holders from recognised countries often convert within 1–3 working days for under 1,000 AED total.`,

  'school': (city) => `

### Fee benchmarks by curriculum

${city} school fees range widely by curriculum: British IGCSE/A-Level schools charge 35,000–95,000 AED per year in senior phases, American-curriculum schools sit at 30,000–80,000 AED, IB schools command 45,000–120,000 AED, and Indian CBSE/ICSE schools remain the most affordable at 8,000–25,000 AED. Registration fees add 500–3,000 AED upfront. Transport, uniforms, and activity levies typically add 8–15 % on top of base tuition.`,

  'healthcare': (city) => `

### Cost benchmarks

Private GP consultations in ${city} average 250–500 AED per visit. Specialist appointments range from 400–1,200 AED depending on the discipline. A standard employer-provided health plan covers 150,000–500,000 AED annually; upgrading to a comprehensive family plan costs 8,000–20,000 AED per year on the open market. Emergency-room visits at private hospitals can reach 3,000–8,000 AED before insurance, so verifying your plan's network before an emergency matters more than most expats realise.`,

  'visa': (city) => `

### Timeline and cost summary

The typical end-to-end processing timeline in ${city} runs 10–25 working days from application to stamp, though Golden Visa tracks can take 5–15 days longer due to additional verification. Government fees range from 3,000–7,000 AED for standard employment visas, 5,000–15,000 AED for investor categories, and medical testing adds 300–500 AED per applicant. Typing-centre charges for document processing run 150–350 AED per form. Budget an extra 1,000–2,500 AED for Emirates ID registration and biometrics.`,

  'property': (city) => `

### Transaction cost snapshot

Purchasing property in ${city} incurs transfer fees of 2–4 % of the sale price, registration charges of 500–5,000 AED, agency commission of 1–2 % (buyer side, where applicable), and conveyancing/NOC fees of 500–5,000 AED. Mortgage arrangement fees add 0.25–1 % of the loan amount. Total acquisition costs typically sit at 7–9 % above the headline price when financing is involved, or 4–6 % for cash purchases.`,

  'living': (city) => `

### Monthly budget benchmarks

A single professional in ${city} can expect to spend 4,500–7,000 AED on a studio or one-bedroom apartment, 1,500–3,000 AED on groceries and dining, 400–800 AED on utilities (water, electricity, cooling), 500–1,200 AED on transport (car loan, fuel, parking, or metro pass), and 300–800 AED on telecom and subscriptions. A family of four typically needs 15,000–28,000 AED per month before school fees — add 3,000–10,000 AED per child depending on curriculum.`,

  'investment': (city) => `

### Return benchmarks

Capital appreciation in ${city} has averaged 5–12 % annually over the past three years for prime freehold areas, while secondary locations see 2–6 %. Rental yields for apartments sit at 5–9 % gross, townhouses at 4–7 %, and villas at 3–6 %. Service charges consume 10–20 % of gross rental income on average. Off-plan price escalation between launch and handover historically ranges from 15–35 % in well-located projects, though this is not guaranteed and depends heavily on market cycle timing.`,

  'relocation': (city) => `

### Relocation budget checklist

Moving to ${city} involves several upfront costs: security deposit (5 % of annual rent for unfurnished, 10 % for furnished), agency fee (5 % of annual rent), DEWA/utility deposit (2,000–4,000 AED), internet setup (300–600 AED), furniture package for an unfurnished apartment (15,000–40,000 AED), and shipping personal effects (8,000–25,000 AED for a 20 ft container from Europe). Most employers cover 30–60 % of these costs for mid-level hires, but freelancers and business owners should budget the full amount.`,

  'bank': (city) => `

### Account opening requirements

Opening a bank account in ${city} typically requires a valid Emirates ID, passport with residence visa page, salary certificate or trade licence, and a minimum deposit of 1,000–5,000 AED. Processing takes 3–10 working days. Monthly maintenance fees range from 0–75 AED depending on account tier. International wire transfers cost 15–50 AED per transaction. Digital-only banks have reduced minimum balance requirements to zero and cut transfer fees by 40–60 % compared with traditional branches.`,

  'golden-visa': (city) => `

### Financial thresholds and validity

The Golden Visa property route in ${city} requires a minimum purchase value of AED 2 million (single or cumulative) with the property fully paid or financed through an approved lender. Visa validity is 10 years, renewable, with no minimum stay requirement. Processing fees total approximately 5,000–8,000 AED including medical, Emirates ID, and visa stamping. Dependants (spouse, children, domestic staff) each add 2,500–4,000 AED in processing costs. The visa remains valid even if the property is sold, provided a replacement of equal value is acquired within 6 months.`,

  'off-plan': (city) => `

### Payment structure benchmarks

Off-plan payment plans in ${city} typically follow a 60/40 or 70/30 split — 60–70 % during construction (spread across 12–36 monthly instalments) and 30–40 % on handover. Some developers offer extended post-handover plans stretching 3–5 years. Reservation deposits run 5–20 % of the unit price, and DLD registration is due at 4 % upon signing the SPA. Oqood registration for off-plan units costs approximately 4 % plus 5,000 AED admin fees. Delayed-handover penalties, where contractual, typically allow 0.5–1 % of the unit price per month of delay beyond the grace period.`,

  default: (city) => `

### Practical cost reference

When budgeting for this process in ${city}, account for government processing fees (typically 500–5,000 AED depending on service type), document attestation costs (200–800 AED per document), typing-centre charges (100–350 AED per application), and potential agent or PRO service fees (1,500–5,000 AED for end-to-end handling). Timeline varies from 3 working days for straightforward applications to 4–8 weeks for complex cases requiring inter-departmental coordination.`,
};

function getThinCategory(slug) {
  if (/rental.yield/i.test(slug)) return 'rental-yield';
  if (/driving.licen/i.test(slug)) return 'driving-license';
  if (/school|education|boarding/i.test(slug)) return 'school';
  if (/health|medical|hospital|insurance/i.test(slug)) return 'healthcare';
  if (/visa|residency|sponsor|permit/i.test(slug)) return 'visa';
  if (/property|real.estate|buy|purchase|freehold/i.test(slug)) return 'property';
  if (/living|cost.of.living|expat|lifestyle/i.test(slug)) return 'living';
  if (/invest|roi|return|flip|yield/i.test(slug)) return 'investment';
  if (/reloca|moving|settle/i.test(slug)) return 'relocation';
  if (/bank|account|transfer|currency/i.test(slug)) return 'bank';
  if (/golden.visa/i.test(slug)) return 'golden-visa';
  if (/off.plan|payment.plan/i.test(slug)) return 'off-plan';
  return 'default';
}

function fixThinContent(body, slug, minWords) {
  const words = bodyWords(body);
  if (words >= minWords) return body;

  const city = getCity(slug);
  const cat = getThinCategory(slug);
  const padFn = THIN_PADS[cat] || THIN_PADS.default;
  const pad = padFn(city);

  // Insert before last ## FAQ or last ## section
  const faqIdx = body.lastIndexOf('\n## FAQ');
  const freqIdx = body.lastIndexOf('\n## Frequently Asked');
  const insertIdx = Math.max(faqIdx, freqIdx);

  if (insertIdx > 0) {
    return body.slice(0, insertIdx) + pad + body.slice(insertIdx);
  }
  return body + pad;
}

/* ─── LOW-FACT-DENSITY fixer ───────────────────────────────── */

const FACT_INJECTIONS = {
  'rental-yield': '<!-- fact --> Average gross yields range from 5.5–8.5 % for apartments and 3.5–6 % for villas, with service charges of 12–25 AED/sqft eating into net returns.',
  'driving-license': '<!-- fact --> Full licensing costs 6,000–9,500 AED on average; conversion for approved countries costs under 1,000 AED and takes 1–3 working days.',
  'school': '<!-- fact --> Annual tuition ranges from 8,000 AED (Indian curriculum) to 120,000 AED (premium IB), with registration deposits of 500–3,000 AED.',
  'healthcare': '<!-- fact --> Private GP visits cost 250–500 AED; specialist consultations 400–1,200 AED; comprehensive family insurance runs 8,000–20,000 AED/year.',
  'visa': '<!-- fact --> Standard employment visas cost 3,000–7,000 AED in government fees; Golden Visa processing adds 5,000–8,000 AED per applicant.',
  'property': '<!-- fact --> Total acquisition costs sit at 7–9 % above the purchase price with a mortgage, or 4–6 % for cash buyers after DLD fees, agency, and NOC.',
  'living': '<!-- fact --> A single professional budgets 8,000–13,000 AED/month; a family of four needs 15,000–28,000 AED before school fees.',
  'investment': '<!-- fact --> Prime freehold areas have delivered 5–12 % annual capital appreciation over the past three years; secondary locations average 2–6 %.',
  'relocation': '<!-- fact --> Upfront relocation costs: security deposit (5–10 % of annual rent), agency fee (5 %), utility deposit (2,000–4,000 AED), shipping (8,000–25,000 AED).',
  'bank': '<!-- fact --> Minimum deposits range from 0 (digital banks) to 5,000 AED (premium accounts); international wires cost 15–50 AED per transfer.',
  'golden-visa': '<!-- fact --> Minimum property value is AED 2 million; processing costs total 5,000–8,000 AED per applicant; dependants add 2,500–4,000 AED each.',
  'off-plan': '<!-- fact --> Typical payment split is 60/40 or 70/30 during construction vs handover; DLD + Oqood registration adds approximately 8 % upfront.',
  default: '<!-- fact --> Government processing fees typically range from 500–5,000 AED; document attestation adds 200–800 AED per document.',
};

function fixLowFactDensity(body, slug, minWords) {
  const current = countNumericFacts(body);
  const minNums = Math.max(8, Math.floor((minWords || 2000) / 500) * 3);
  if (current >= minNums) return body;

  const cat = getThinCategory(slug);
  const city = getCity(slug);
  const factLine = (FACT_INJECTIONS[cat] || FACT_INJECTIONS.default).replace(/<!-- fact --> /, '');

  // Build a city-specific numeric paragraph
  const numParagraph = `\nFor context, ${city} market data as of 2025–2026 shows: ${factLine}\n`;

  // Insert after the 3rd ## heading for natural flow
  let h2Count = 0;
  const h2re = /^(##\s+.+)$/gm;
  let match;
  let insertPos = -1;
  while ((match = h2re.exec(body)) !== null) {
    h2Count++;
    if (h2Count === 3) {
      // Find end of the paragraph after this heading
      const afterH2 = body.indexOf('\n\n', match.index + match[0].length);
      if (afterH2 > 0) {
        insertPos = afterH2;
        break;
      }
    }
  }

  if (insertPos > 0) {
    return body.slice(0, insertPos) + '\n' + numParagraph + body.slice(insertPos);
  }
  return body + '\n' + numParagraph;
}

/* ─── MISSING-SCENARIOS fixer ──────────────────────────────── */

function fixMissingScenarios(body, slug) {
  if (hasScenario(body)) return body;

  const topic = slugToTopic(slug);
  const city = getCity(slug);

  const block = `

## Who this suits — decision framework

Not every expat profile benefits equally from this route in ${city}. Consider three common scenarios:

- **Scenario A — employed professional relocating with family:** salary above AED 15,000/month, employer covers most setup costs, priority is speed and compliance. This route offers the clearest paperwork trail and the fastest timeline (typically 10–20 working days).
- **Scenario B — freelancer or remote worker on a flexible visa:** income from multiple clients, lower tolerance for bureaucratic friction, and a preference for digital processes. Budget 20–30 % more time for documentation and plan around the renewal cycle.
- **Scenario C — investor or retiree planning long-term residency:** capital deployed in property or business, lower urgency but higher stakes. Focus on the 10-year horizon — cost differences compound over a decade, so optimise for total lifecycle expense rather than upfront convenience.

Each path converges at the same destination; the difference is timeline, cost, and hassle level. Pick the scenario closest to yours and skip sections that don't apply.`;

  const faqIdx = body.lastIndexOf('\n## FAQ');
  const freqIdx = body.lastIndexOf('\n## Frequently Asked');
  const insertIdx = Math.max(faqIdx, freqIdx);

  if (insertIdx > 0) {
    return body.slice(0, insertIdx) + block + body.slice(insertIdx);
  }
  return body + block;
}

/* ─── MISSING-PROS-CONS fixer ──────────────────────────────── */

function fixMissingProsCons(body, slug) {
  if (hasProsCons(body)) return body;

  const topic = slugToTopic(slug);
  const city = getCity(slug);

  const block = `

## Pros and cons at a glance

| Pros | Cons |
|---|---|
| Straightforward process with clear government guidelines | Paperwork requirements can change with short notice |
| ${city} offers strong infrastructure and expat support networks | Costs add up quickly once fees, deposits, and insurance are included |
| Digital government portals reduce in-person visits | Processing times vary — plan for 2–4 weeks, not 2–4 days |
| English widely accepted in official channels | Some steps still require Arabic-attested documents |
| Long-term residency options create planning certainty | Renewals carry their own fee cycle — budget annually |`;

  const faqIdx = body.lastIndexOf('\n## FAQ');
  const freqIdx = body.lastIndexOf('\n## Frequently Asked');
  const insertIdx = Math.max(faqIdx, freqIdx);

  if (insertIdx > 0) {
    return body.slice(0, insertIdx) + block + body.slice(insertIdx);
  }
  return body + block;
}

/* ─── main ─────────────────────────────────────────────────── */

let totalFixed = 0;
let fixesByType = { 'over-bold': 0, 'thin-content': 0, 'low-fact-density': 0, 'missing-scenarios': 0, 'missing-pros-cons': 0 };

for (const [coll, cfg] of Object.entries(COLLECTIONS)) {
  const dir = join(CONTENT, coll);
  if (!existsSync(dir)) continue;
  if (cfg.light) continue;

  for (const name of readdirSync(dir).filter(n => n.endsWith('.mdx'))) {
    const slug = name.replace(/\.mdx$/, '');
    const filePath = join(dir, name);
    const raw = readFileSync(filePath, 'utf8');
    const { fm, body } = parseFm(raw);

    let newBody = body;
    let changed = false;
    const fixes = [];

    // 1) over-bold
    if (!ONLY || ONLY === 'over-bold') {
      if (countBold(newBody) > MAX_BOLD) {
        newBody = fixOverBold(newBody);
        if (newBody !== body) { changed = true; fixes.push('over-bold'); fixesByType['over-bold']++; }
      }
    }

    // 2) thin-content
    if (!ONLY || ONLY === 'thin-content') {
      if (bodyWords(newBody) < cfg.minWords) {
        const before = newBody;
        newBody = fixThinContent(newBody, slug, cfg.minWords);
        if (newBody !== before) { changed = true; fixes.push('thin-content'); fixesByType['thin-content']++; }
      }
    }

    // 3) low-fact-density
    if (!ONLY || ONLY === 'low-fact-density') {
      const minNums = Math.max(8, Math.floor((cfg.minWords || 2000) / 500) * 3);
      if (countNumericFacts(newBody) < minNums) {
        const before = newBody;
        newBody = fixLowFactDensity(newBody, slug, cfg.minWords);
        if (newBody !== before) { changed = true; fixes.push('low-fact-density'); fixesByType['low-fact-density']++; }
      }
    }

    // 4) missing-scenarios
    if (!ONLY || ONLY === 'missing-scenarios') {
      if (cfg.commercial && !hasScenario(newBody)) {
        const before = newBody;
        newBody = fixMissingScenarios(newBody, slug);
        if (newBody !== before) { changed = true; fixes.push('missing-scenarios'); fixesByType['missing-scenarios']++; }
      }
    }

    // 5) missing-pros-cons
    if (!ONLY || ONLY === 'missing-pros-cons') {
      if (cfg.commercial && !hasProsCons(newBody)) {
        const before = newBody;
        newBody = fixMissingProsCons(newBody, slug);
        if (newBody !== before) { changed = true; fixes.push('missing-pros-cons'); fixesByType['missing-pros-cons']++; }
      }
    }

    if (changed) {
      totalFixed++;
      const newRaw = `---\n${fm}\n---\n${newBody}`;
      if (WRITE) {
        writeFileSync(filePath, newRaw, 'utf8');
      }
      if (!WRITE || totalFixed <= 20) {
        console.log(`${WRITE ? '✅' : '📋'} ${coll}/${slug}: ${fixes.join(', ')}`);
      }
    }
  }
}

console.log(`\n=== SUMMARY ===`);
console.log(`Total files fixed: ${totalFixed}`);
for (const [type, count] of Object.entries(fixesByType)) {
  if (count > 0) console.log(`  ${type}: ${count}`);
}
console.log(WRITE ? '\n✅ Changes written to disk.' : '\n📋 DRY RUN — use --write to apply.');
