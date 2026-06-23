import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../src/content/guides/');

function trimBetween(content, startMarker, endMarker, replacement = '\n') {
  const start = content.indexOf(startMarker);
  if (start === -1) throw new Error(`Start not found: ${startMarker.slice(0, 60)}`);
  const end = endMarker ? content.indexOf(endMarker, start) : content.length;
  if (endMarker && end === -1) throw new Error(`End not found: ${endMarker.slice(0, 60)}`);
  return content.slice(0, start) + replacement + (endMarker ? content.slice(end) : '');
}

{
  const p = join(ROOT, 'golden-visa-multiple-properties-uae.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Advanced Portfolio Management for Golden Visa Holders\n',
    '\n\n## DLD Fee Stacking on Aggregated Buys\n',
    `

## Renewal math — keep it boring

Golden Visa aggregation is **immigration paperwork**, not a wealth-management product:

| Checkpoint | Rule |
|---|---|
| Combined registered value | ≥ AED 2M on Title Deeds/Oqoods in **same passport name** |
| After selling one unit | Re-check total before renewal — sub-AED 2M loses visa |
| Cross-emirate mix | Abu Dhabi **2% DMT** vs Dubai **4% DLD** — saves fees, does not bypass qualification rules |
| Tracking | One spreadsheet: deed value, mortgage, Ejari rent, NOC expiry per unit |

**Further reading:** [UAE Golden Visa property](/guides/uae-golden-visa-property/) · [Golden Visa renewal requirements](/guides/golden-visa-renewal-requirements-uae/) · [Golden Visa mortgage rules](/guides/golden-visa-mortgage-property-uae/) · [Non-resident mortgage Dubai](/guides/non-resident-mortgage-dubai/).

---

## DLD Fee Stacking on Aggregated Buys
`
  );
  c = trimBetween(
    c,
    '\n\n## Technology Integration for Portfolio Management\n',
    '\n\n## When Agents Propose Fake Aggregation\n',
    '\n\n'
  );
  c = c.replace(
    'For sophisticated buyers, Abu Dhabi properties offer 2% DMT vs 4% DLD fee advantage:',
    'Abu Dhabi properties offer 2% DMT vs 4% DLD fee advantage:'
  );
  c = c.replace(/\n---\n\*\*Portfolio tracking:\*\*[^\n]+\n\n##\n\n/g, '\n---\n**Portfolio tracking:** One spreadsheet with **title deed value, mortgage balance, Ejari rent, and NOC expiry** per unit beats generic dashboards for Golden Visa aggregation.\n\n');
  writeFileSync(p, c);
  console.log('OK golden-visa-multiple-properties-uae');
}

{
  const p = join(ROOT, 'dubai-property-investment-for-beginners.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Advanced beginner strategies: beyond the first purchase\n',
    '\n\n## Risk management for first-time investors\n',
    `

**After your first deed:** Run 12 months of Ejari + SC before unit two. Use [Dubai property portfolio strategy](/guides/dubai-property-portfolio-strategy/) only when unit one net yield is within 0.5% of model.

---

## Risk management for first-time investors
`
  );
  c = trimBetween(
    c,
    '\n\n## Building professional networks in Dubai property\n',
    '\n\n## International tax considerations for Dubai property investment\n',
    `

**Minimum team:** RERA-licensed broker (Trakheesi verified), UAE property lawyer on SPA, and one RERA-licensed manager if you are not in Dubai. Skip paid "investor masterminds" until you have 12 months of Ejari history.

---

## International tax considerations for Dubai property investment
`
  );
  writeFileSync(p, c);
  console.log('OK dubai-property-investment-for-beginners');
}

{
  const p = join(ROOT, 'currency-transfer-buy-property-uae.mdx');
  let c = readFileSync(p, 'utf8');
  c = c.replace(
    'Beyond simple wire transfers, sophisticated buyers consider:',
    'Beyond a single SWIFT wire, some buyers use:'
  );
  c = c.replace(
    `### Third-party funding
Singapore/Hong Kong based family offices sometimes provide bridge financing secured by foreign assets, allowing gradual AED conversion without timing pressure.

`,
    ''
  );
  const dup = `\n\n## Currency Transfer Buy Property Uae — banking checklist\n\n- Bring employment contract, passport with entry stamp, and Emirates ID timeline for Currency Transfer Buy Property Uae salary account opening.\n- Compare FX spread and outbound transfer limits for Currency Transfer Buy Property Uae across bank and exchange house quotes.\n- Prepare source-of-funds documentation for property-related wires; exchange houses are not a bank substitute.\n- Confirm CRS or home-country reporting obligations before assuming UAE zero income tax ends all Currency Transfer Buy Property Uae filings.\n- Read schedule of benefits on health cover tied to Currency Transfer Buy Property Uae account packages, not marketing brochure summaries.`;
  const first = c.indexOf(dup);
  const second = c.indexOf(dup, first + 1);
  if (second !== -1) c = c.slice(0, second) + c.slice(second + dup.length);
  writeFileSync(p, c);
  console.log('OK currency-transfer-buy-property-uae');
}

{
  const p = join(ROOT, 'dubai-property-market-cooling-or-growing.mdx');
  let c = readFileSync(p, 'utf8');
  c = c.replace(
    '- Trust structures for family office capital (requires specialist legal advice)',
    '- Trust or holding structures for large cross-border estates (requires specialist legal advice)'
  );
  writeFileSync(p, c);
  console.log('OK dubai-property-market-cooling-or-growing');
}

{
  const p = join(ROOT, 'uae-free-zone-vs-mainland.mdx');
  let c = readFileSync(p, 'utf8');
  c = c.replace(
    'And for financial services, holding structures, and family offices, the financial centres are worth the premium.',
    'And for financial services and regulated holding structures, DIFC and ADGM are worth the premium — see [DIFC company setup](/guides/difc-company-setup/) and [ADGM setup](/guides/abu-dhabi-adgm-setup/).'
  );
  writeFileSync(p, c);
  console.log('OK uae-free-zone-vs-mainland');
}

{
  const p = join(ROOT, 'dubai-vs-singapore-expat.mdx');
  let c = readFileSync(p, 'utf8');
  c = c.replace(
    '- PropTech and real estate development',
    '- Real estate development, brokerage, and hospitality'
  );
  writeFileSync(p, c);
  console.log('OK dubai-vs-singapore-expat');
}

{
  const p = join(ROOT, 'gross-vs-net-yield-dubai.mdx');
  let c = readFileSync(p, 'utf8');
  c = c.replace(
    'If net falls below your target, either **negotiate price**, **pick a lower-SC building**, or **switch community**, PropTech dashboards do not fix a bad acquisition price.',
    'If net falls below your target, either **negotiate price**, **pick a lower-SC building**, or **switch community** — dashboards do not fix a bad acquisition price.'
  );
  writeFileSync(p, c);
  console.log('OK gross-vs-net-yield-dubai');
}

console.log('batch 25 trim done');
