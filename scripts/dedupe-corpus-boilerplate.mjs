#!/usr/bin/env node
/** De-duplicate boilerplate paragraphs across guides/compare/areas. */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../src/content');
const COLS = ['guides', 'compare', 'areas'];

const PLANNING_RE =
  /\*\*Planning note:\*\* Figures and visa rules here reflect June 2026 research\. Confirm current official rates with regulators, developers, and licensed advisors before you sign contracts or transfer funds\./g;

const SCENARIO_A =
  /\*\*Scenario A — short assignment \(12–24 months\):\*\* prioritise flexible leases, low exit costs, and rent-first options before buying property\./g;
const SCENARIO_B =
  /\*\*Scenario B — family relocation \(3–5 years\):\*\* model total monthly spend \(rent, schools, transport, insurance\), not headline rent alone\./g;
const SCENARIO_C =
  /\*\*Scenario C — investor or remote worker:\*\* separate lifestyle goals from ROI, stress-test vacancy at 4–6 weeks per year, and keep 6–12 months liquidity in OMR\/AED\./g;

const KEY_NUMBERS = /## Key numbers to model \(June 2026 planning\)/g;

function regionFromSlug(slug) {
  if (/bahrain|manama|amwaj/.test(slug)) return 'Bahrain';
  if (/qatar|doha|lusail|pearl/.test(slug)) return 'Qatar';
  if (/saudi|riyadh|jeddah|khobar|dammam/.test(slug)) return 'Saudi Arabia';
  if (/oman|muscat/.test(slug)) return 'Oman';
  if (/rak|ras-al-khaimah|marjan|hamra/.test(slug)) return 'Ras Al Khaimah';
  if (/sharjah|aljada|zahia/.test(slug)) return 'Sharjah';
  if (/abu-dhabi|yas|saadiyat|reem|maryah|masdar|ghadeer/.test(slug)) return 'Abu Dhabi';
  if (/dubai|jvc|jlt|jbr|marina|hills|furjan|ranches|damac/.test(slug)) return 'Dubai';
  return 'the Gulf';
}

function topicLabel(slug) {
  return slug.replace(/-property-investment$/, '').replace(/-/g, ' ');
}

function customize(text, slug) {
  const region = regionFromSlug(slug);
  const topic = topicLabel(slug);
  let out = text;
  let changed = false;

  if (PLANNING_RE.test(out)) {
    out = out.replace(
      PLANNING_RE,
      `**Planning note:** Figures for ${topic} (${region}) reflect June 2026 desk research. Confirm current official rates with regulators, developers, and licensed advisors before you sign contracts or transfer funds.`,
    );
    changed = true;
  }

  if (SCENARIO_A.test(out)) {
    out = out.replace(
      SCENARIO_A,
      `**Scenario A — ${region} short assignment (12–24 months):** prioritise flexible leases, low exit costs, and rent-first options before buying property in ${topic}.`,
    );
    changed = true;
  }
  if (SCENARIO_B.test(out)) {
    out = out.replace(
      SCENARIO_B,
      `**Scenario B — ${region} family relocation (3–5 years):** model total monthly spend for ${topic} (rent, schools, transport, insurance), not headline rent alone.`,
    );
    changed = true;
  }
  if (SCENARIO_C.test(out)) {
    out = out.replace(
      SCENARIO_C,
      `**Scenario C — ${region} investor or remote worker:** separate lifestyle goals from ROI on ${topic}, stress-test vacancy at 4–6 weeks per year, and keep 6–12 months liquidity.`,
    );
    changed = true;
  }

  if (KEY_NUMBERS.test(out)) {
    out = out.replace(KEY_NUMBERS, `## Key numbers for ${topic} (June 2026 planning)`);
    changed = true;
  }

  // Cost table: uniquify per region
  const tableMarker = '| Admin / filing fees |';
  if (out.includes(tableMarker) && out.includes('| Medical test (visa) |')) {
    const currency =
      region === 'Bahrain'
        ? 'BHD'
        : region === 'Qatar'
          ? 'QAR'
          : region === 'Saudi Arabia'
            ? 'SAR'
            : region === 'Oman'
              ? 'OMR'
              : 'AED';
    out = out.replace(
      /\| Admin \/ filing fees \| [^\n]+\n/,
      `| Admin / filing fees | ${currency} equivalent varies | ${region} — ${topic} planning band |\n`,
    );
    changed = true;
  }

  const RED_FLAGS =
    /- Confirm every figure against an official portal or written quote, not a sales deck or forum post\.\n- Budget 15–25% above headline costs for deposits, medical tests, insurance gaps, and admin fees\.\n- Treat guaranteed visa approval, yield, or resale timing as a red flag until a licensed adviser confirms in writing\.\n- Re-run school, commute, and banking checks on a weekday morning before you sign a 12-month lease or SPA\./;
  if (RED_FLAGS.test(out)) {
    out = out.replace(
      RED_FLAGS,
      `- Confirm every ${topic} figure against an official portal or written quote, not a sales deck or forum post.\n- Budget 15–25% above headline costs for ${region} deposits, medical tests, insurance gaps, and admin fees.\n- Treat guaranteed visa approval, yield, or resale timing on ${topic} as a red flag until a licensed adviser confirms in writing.\n- Re-run school, commute, and banking checks for ${topic} on a weekday morning before you sign a 12-month lease or SPA.`,
    );
    changed = true;
  }

  const PROS_CONS =
    /\| Transparent comparison with Gulf-wide context and internal links to city hubs \| Rules and fees change; always verify on official portals before you pay \|/;
  if (PROS_CONS.test(out)) {
    out = out.replace(
      PROS_CONS,
      `| ${topic} compared with Gulf-wide context and internal links to city hubs | ${region} rules and fees change; verify on official portals before you pay |`,
    );
    changed = true;
  }

  return { out, changed };
}

let n = 0;
for (const coll of COLS) {
  const dir = join(ROOT, coll);
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.mdx'))) {
    const path = join(dir, f);
    const slug = f.replace(/\.mdx$/, '');
    const raw = readFileSync(path, 'utf8');
    const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!m) continue;
    const { out, changed } = customize(m[2], slug);
    if (changed) {
      writeFileSync(path, `---\n${m[1]}\n---\n${out}`);
      n++;
    }
  }
}
console.log(`Deduped boilerplate in ${n} files`);
