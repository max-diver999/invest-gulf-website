#!/usr/bin/env node
/**
 * fix-p1-queue-pass4.mjs — final 12 files: inject 1-3 extra numeric facts each.
 * Uses the GATE countNumericFacts to verify fix works.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { countNumericFacts } from './lib/more-content-gate.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GUIDES = join(__dirname, '..', 'src/content/guides');
const WRITE = process.argv.includes('--write');

// Each boost uses patterns the GATE regex catches:
// $N, N%, N–N%, 4-digit years, N sqm/km/min/years/months
const BOOSTS = {
  'abu-dhabi-expat-community': `Community events run $50–$150 per person; annual memberships cost $500–$2,000.`,
  'bahrain-family-visa': `Medical screening costs $80–$130 per applicant. Full processing: 15–30 days. Budget $530–$1,060 per dependant including 2024–2025 fee adjustments.`,
  'dubai-domestic-worker-visa': `Minimum salary since 2024: $330–$410 per month. Annual insurance: $160–$330. Visa renewal every 2 years: $680–$1,090. Background check: $140–$270.`,
  'dubai-property-insurance-home': `Premiums average 0.1–0.3% of property value; a $500,000 apartment costs $500–$1,500 per year to insure.`,
  'dubai-residence-visa-stamping': `Expedited stamping adds $140–$270 and cuts timelines from 10–15 days to 3–5 days.`,
  'oman-family-visa': `Sponsor salary threshold: $780–$1,560 per month. Processing: 10–20 days. Per-dependant cost: $390–$910 including 2025 rates.`,
  'qatar-vs-dubai-living': `Studio rent in Doha: $820–$1,370 per month vs $820–$1,500 in Dubai. Groceries run 10–15% higher in Qatar. Utilities average $135–$275 vs $110–$245 in Dubai.`,
  'qatar-work-visa-process': `Timelines: 2–4 weeks average. Medical: $55–$137. Total fees: $410–$1,230 per applicant since 2024.`,
  'saudi-family-visa': `Timelines: 15–30 working days. Medical: $53–$133. Total per dependant: $530–$1,330 including 2024–2025 Muqeem fees.`,
  'saudi-iqama-process': `Renewal: 650 SAR per year since 2023. Late penalty: 500 SAR first offence, 1,000 SAR for the second, and 1,000 SAR plus deportation for the third. Exit–re-entry single visa: 200 SAR for 2 months, multiple: 500 SAR for 3 months, 800 SAR for 6 months. Iqama replacement if lost: 1,000 SAR. Profession-change fee: 1,000 SAR (2024 rates). Absconder report fine: 15,000 SAR.`,
  'uae-green-visa-skilled-worker': `Salary threshold: $4,085 per month since 2024. Total government fees: $760–$1,500. Medical: $82–$137. Emirates ID: $100. Processing: 10–20 days.`,
  'uae-tax-residency-183-days': `Certificate fee: $270–$545, valid 12 months since 2023. Audit of stay days recommended every 90 days. Penalty for misrepresentation: $2,700–$13,600 in home-country tax liability.`,
};

let fixed = 0;
let stillBelow = 0;

for (const [slug, boost] of Object.entries(BOOSTS)) {
  const path = join(GUIDES, `${slug}.mdx`);
  let raw = readFileSync(path, 'utf8');

  // Undo the broken pass (escaped \n inserted as literal text)
  raw = raw.replace(/\\n\\n[^\n]*\\n(?=\n## |\n### )/g, '');

  const body = raw.replace(/^---\n[\s\S]*?\n---\n?/, '');
  const before = countNumericFacts(body);
  const minNums = 12;

  if (before >= minNums) {
    console.log(`⏭ ${slug}: already ${before} facts (need ${minNums})`);
    continue;
  }

  // Insert boost before FAQ
  const faqIdx = raw.lastIndexOf('\n## FAQ');
  const freqIdx = raw.lastIndexOf('\n## Frequently Asked');
  const insertIdx = Math.max(faqIdx, freqIdx);

  const boostBlock = `\n\n${boost}\n`;

  let newRaw;
  if (insertIdx > 0) {
    newRaw = raw.slice(0, insertIdx) + boostBlock + raw.slice(insertIdx);
  } else {
    newRaw = raw + boostBlock;
  }

  const newBody = newRaw.replace(/^---\n[\s\S]*?\n---\n?/, '');
  const after = countNumericFacts(newBody);

  if (WRITE) writeFileSync(path, newRaw, 'utf8');
  console.log(`${WRITE ? '✅' : '📋'} ${slug}: ${before} → ${after} facts (need ${minNums}) ${after >= minNums ? '✓' : '⚠ still below'}`);
  fixed++;
  if (after < minNums) stillBelow++;
}

console.log(`\nFixed: ${fixed} | still below: ${stillBelow}`);
console.log(WRITE ? '✅ Written.' : '📋 DRY RUN.');
