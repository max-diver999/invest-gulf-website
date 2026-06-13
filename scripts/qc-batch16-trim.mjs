import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../src/content/guides/');

function trimBetween(content, startMarker, endMarker, replacement) {
  const start = content.indexOf(startMarker);
  if (start === -1) throw new Error(`Start not found: ${startMarker.slice(0, 60)}`);
  const end = endMarker ? content.indexOf(endMarker, start) : content.length;
  if (endMarker && end === -1) throw new Error(`End not found: ${endMarker.slice(0, 60)}`);
  return content.slice(0, start) + replacement + (endMarker ? content.slice(end) : '');
}

// property-management
{
  const p = join(ROOT, 'property-management-dubai-cost.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Technology and automation impact on management costs\n',
    '\n\n## Specialized property types: cost variations and considerations\n',
    '\n'
  );
  c = trimBetween(
    c,
    '\n\n### Future cost drivers (2026-2030)\n',
    '\n\n---\n\n## Cost optimization strategies by investor profile\n',
    '\n'
  );
  c = trimBetween(
    c,
    '\n\n## Performance measurement and benchmarking\n',
    '\n\n*Data in this guide reflects RERA Mollak',
    `

---

## Quick KPI checks for landlords

| Metric | Target (mid-market 1BR) | Action if missed |
|---|---|---|
| Void period | Under 45 days | Review rent vs Ejari comps |
| Management + SC as % of gross | Under 35% | Renegotiate fee or switch provider |
| Maintenance reserve | 1–1.5% of value / year | Inspect building JOPD capex plan |
| Tenant retention | 60%+ renewals | Fix response time or rent level |

Track **net yield after all costs**, not gross rent on the listing portal.

---

`
  );
  writeFileSync(p, c);
  console.log('OK property-management');
}

// muscat-qurum
{
  const p = join(ROOT, 'muscat-qurum-property-investment.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Technology and Market Intelligence for Foreign Investors\n',
    '\n\n## Omani National Investors: Different Playbook\n',
    '\n'
  );
  writeFileSync(p, c);
  console.log('OK muscat-qurum');
}

// off-plan-vs-ready
{
  const p = join(ROOT, 'off-plan-vs-ready-property-dubai.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Technology and Innovation Impact\n',
    '\n\n## Exit Strategy Optimization\n',
    `
**Practical note:** Smart-home and ESG marketing rarely change **net yield math** — prioritise **escrow, developer delivery on your phase, and Ejari on handed-over stock** in the same community before paying off-plan premium.

`
  );
  writeFileSync(p, c);
  console.log('OK off-plan-vs-ready');
}

// town-square
{
  const p = join(ROOT, 'town-square-property-investment.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n### Projected service charge evolution\n',
    '',
    `

---

## Red flags — Town Square deals

- **Expo/Dubai South hype** priced into PSF without Ejari proof on your building
- **SC estimate only** — no JOPD history from handed-over Nshama phase
- **Marina rent comps** used for family-community underwriting
- **Parking not included** on listing marketed to families
- **Investor-heavy tower** with 15+ simultaneous listings — renewal risk

---

## Summary

Town Square fits **family yield investors** who accept southern-Dubai commute in exchange for **lower SC than Marina** and stable tenancy. Model **seasonal void in June–July**, verify **Nshama SC on completed phase**, and compare to [JVC](/guides/jvc-property-investment/) before chasing headline gross yield.

**Related reading:** [Dubai rental yield guide](/guides/dubai-rental-yield-guide/) · [Best areas buy property Dubai](/guides/best-areas-buy-property-dubai/) · [Service charges Dubai by area](/guides/service-charges-dubai-by-area/).

`
  );
  writeFileSync(p, c);
  console.log('OK town-square');
}

// al-barari
{
  const p = join(ROOT, 'al-barari-property-investment.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Due Diligence and Investment Implementation\n',
    '\n\n<FaqBlock items={',
    `
---

## Red flags — Al Barari purchases

- **Yield marketing** on ultra-luxury stock without SC + garden maintenance in net model
- **Quick flip thesis** — resale cycles often run **6–18 months**
- **High leverage** on illiquid trophy stock
- **Generic luxury staging** without botanical/garden upkeep budget
- **Golden Visa only** — no personal use or long hold plan

---

## Summary

Al Barari is **eco-luxury scarcity**, not a yield play — gross **3.5–5%** with **high upkeep** suits UHNW buyers who accept thin liquidity. Verify **community charges, garden maintenance, and recent villa transacts** before pricing off render quality.

For context: [Dubai villa vs apartment](/guides/dubai-villa-vs-apartment-investment/) · [Property management Dubai cost](/guides/property-management-dubai-cost/) · [UAE Golden Visa property](/guides/uae-golden-visa-property/).

`
  );
  writeFileSync(p, c);
  console.log('OK al-barari');
}

console.log('batch 16 trim done');
