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

{
  const p = join(ROOT, 'dubai-property-market-cycle-2026.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(c, '\n\n## Technology disruption and proptech impact\n', '\n\n## Supply pipeline: the data that matters most\n', '\n');
  c = trimBetween(c, '\n\n## Institutional investor trends and market impact\n', '\n\n## Related guides\n', '\n');
  writeFileSync(p, c);
  console.log('OK dubai-property-market-cycle');
}

{
  const p = join(ROOT, 'fujairah-beach-property-investment.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(c, '\n\n## Future Development Outlook and Trends\n', '\n\n## Investment Decision Framework for Coastal Properties\n', '\n');
  writeFileSync(p, c);
  console.log('OK fujairah-beach');
}

{
  const p = join(ROOT, 'tilal-al-ghaf-property-investment.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Long-Term Outlook and Investment Potential\n',
    '\n\n<FaqBlock items={',
    `
---

## Red flags — Tilal Al Ghaf

- **Lagoon premium in SPA** without handed-over Ejari on same phase
- **Amenity render timeline** treated as completed in tenant marketing
- **SC estimate only** before lagoon and retail ops are live
- **Dubai South employment thesis** without rush-hour commute test
- **Sustainability label** substituted for net yield after full SC load

---

## Summary

Tilal Al Ghaf suits **family renters and end-users** who value lagoon lifestyle and Majid Al Futtaim master-plan execution — not maximum resale liquidity. Underwrite **SC on completed phase**, **Ejari on your unit type**, and compare to [Town Square](/guides/town-square-property-investment/) and [Arabian Ranches](/guides/arabian-ranches-property-investment/) before paying off-plan premium.

**Related reading:** [Best off-plan areas Dubai 2026](/guides/best-off-plan-areas-dubai-2026/) · [Dubai neighbourhoods for families](/guides/dubai-neighbourhoods-for-families/) · [Service charges Dubai by area](/guides/service-charges-dubai-by-area/).

`
  );
  writeFileSync(p, c);
  console.log('OK tilal-al-ghaf');
}

{
  const p = join(ROOT, 'sharjah-vs-dubai-commute-property.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Technology and remote work impact\n',
    '\n\n## Maintenance and property management for commuter rentals\n',
    `
**Remote work note:** Hybrid **2–3 Dubai office days** keeps Sharjah commute-property math viable; full remote removes commute savings as the main thesis — underwrite on **rent discount vs Dubai Ejari**, not WFH trends.

`
  );
  writeFileSync(p, c);
  console.log('OK sharjah-vs-dubai-commute');
}

{
  const p = join(ROOT, 'dubai-property-investment-for-beginners.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Technology and digital tools for Dubai property investment\n',
    '\n\n## Building professional networks in Dubai property\n',
    `
**Tools that actually matter:** Dubai REST (Ejari + escrow), Mollak service charges, DLD Trakheesi for listing verification — not PropTech dashboards. Start with [Due diligence Dubai property](/guides/due-diligence-dubai-property/) and [Dubai REST app due diligence](/guides/dubai-rest-app-property-due-diligence/).

`
  );
  writeFileSync(p, c);
  console.log('OK dubai-property-investment-for-beginners');
}

console.log('batch 17 trim done');
