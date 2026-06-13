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

// --- al-furjan ---
{
  const p = `${ROOT}al-furjan-property-investment.mdx`;
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Al Furjan community amenities and lifestyle factors\n',
    '',
    `

---

## Red flags — Al Furjan deals

- **Phase without live metro walk** priced as if Route 2020 is finished
- **Service charge estimate only** — no JOPD history from handed-over phase in same cluster
- **Marina-grade rent in underwriting** when comps are Ibn Battuta / Discovery Gardens Ejari
- **Incomplete retail** marketed as finished amenity stack to tenants
- **Nakheel launch premium** without handed-over tower resale depth in that phase

---

## Summary

Al Furjan fits investors who want **Nakheel west-Dubai exposure** with mixed apartments and townhouses, **mid-tier gross yield**, and metro-linked commute narrative — not Marina liquidity or school-premium addresses.

Model **net yield on Mollak SC by phase**, verify **Ejari on your building**, and compare to [Mudon](/guides/mudon-property-investment/) and [JVC](/guides/jvc-property-investment/) before overpaying for metro-future pricing.

---

*Rents, service charges, and Nakheel phase timelines change. Verify Trakheesi, Mollak, and SPA before commitment. Educational content only — not investment advice.*

**Related reading:** [Dubai rental yield guide](/guides/dubai-rental-yield-guide/) · [Service charges Dubai by area](/guides/service-charges-dubai-by-area/) · [Best areas buy property Dubai](/guides/best-areas-buy-property-dubai/) · [Due diligence Dubai property](/guides/due-diligence-dubai-property/).
`
  );
  writeFileSync(p, c);
  console.log('OK al-furjan');
}

// --- bluewaters ---
{
  const p = `${ROOT}bluewaters-island-property-investment.mdx`;
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Future developments and island expansion plans\n',
    '',
    `

---

## Red flags — Bluewaters purchases

- **STR income in SPA** not backed by building OA rules
- **Listing rent** used instead of Ejari for yield math
- **SC verbally quoted** below Mollak on completed Bluewaters tower
- **Golden Visa** priced on Oqood without registered-value check at handover
- **Trophy thesis only** — no net yield after AED 20–28/sqft SC

---

*Meraas pricing, service charges, and STR rules change. Verify Trakheesi, Mollak, and OA minutes on a completed building. Educational only — not investment advice.*

**Related reading:** [City Walk property investment](/guides/city-walk-property-investment/) · [Dubai rental yield guide](/guides/dubai-rental-yield-guide/) · [Meraas properties review](/guides/meraas-properties-review/) · [Short-term vs long-term rental Dubai](/guides/short-term-vs-long-term-rental-dubai/).
`
  );
  writeFileSync(p, c);
  console.log('OK bluewaters');
}

// --- gross-vs-net-yield ---
{
  const p = `${ROOT}gross-vs-net-yield-dubai.mdx`;
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Technology and PropTech impact on yields\n',
    '\n\n*Yield figures and service charge data',
    `

---

## Net yield checklist before you sign

Use this on any Dubai listing where the agent quotes gross yield:

1. **Pull Mollak SC** on the exact building — not the community average.
2. **Add DEWA/chiller** — district cooling can add AED 800–1,500/month on a 1BR.
3. **Budget 5–8% vacancy + management** on mid-market stock; 10% on heavy investor towers.
4. **DLD + agent + mortgage registration** on acquisition — 6–8% all-in on ready buys.
5. **Ejari transacted rent** on same tower — ignore Property Finder asking rents.
6. **Compare net to home-currency return** after tax if you are non-UAE resident.

| Line item | Typical 1BR (AED 1M, AED 70K gross rent) |
|---|---|
| Gross rent | AED 70,000 |
| Service charge (AED 18/sqft × 700 sqft) | −AED 12,600 |
| DEWA + chiller | −AED 6,000 |
| Management + vacancy (7%) | −AED 4,900 |
| Maintenance reserve | −AED 3,500 |
| **Net before mortgage** | **~AED 43,000 (4.3% on price)** |

If net falls below your target, either **negotiate price**, **pick a lower-SC building**, or **switch community** — PropTech dashboards do not fix a bad acquisition price.

Hub: [Service charges Dubai by area](/guides/service-charges-dubai-by-area/) · [Property management Dubai cost](/guides/property-management-dubai-cost/) · [Dubai rental yield guide](/guides/dubai-rental-yield-guide/).

---

`
  );
  writeFileSync(p, c);
  console.log('OK gross-vs-net-yield');
}

// --- hudayriyat ---
{
  const p = `${ROOT}hudayriyat-island-property-investment.mdx`;
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Technology integration and smart community features\n',
    '\n\n## Acquisition process for foreign buyers\n',
    `
Modon phases include standard **fiber, access control, and community apps** — treat these as baseline Abu Dhabi 2026 stock, not a yield premium. Underwrite **DMT-registered value, SC on handed-over Modon stock, and Al Reem/Yas resale comps** instead.

`
  );
  writeFileSync(p, c);
  console.log('OK hudayriyat');
}

// --- impz ---
{
  const p = `${ROOT}impz-property-investment.mdx`;
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Technology and smart building features\n',
    '\n\n## Maintenance and property management considerations\n',
    `
**Connectivity note:** Most IMPZ towers have **Etisalat fiber**; verify in-unit speed before marketing to media tenants. Smart-lock upgrades can speed letting but rarely justify more than **5–8% rent premium** — model on Ejari, not gadget marketing.

`
  );
  writeFileSync(p, c);
  console.log('OK impz');
}

console.log('batch 15 trim done');
