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
  const p = join(ROOT, 'uae-tax-guide-expats.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Future tax developments\n',
    '\n\n<FaqBlock',
    `

**Policy watch:** Treat UAE tax as **stable for personal investors** until MOF publishes a change — model on current 0% employment tax + 9% corporate tax above threshold. Cross-border risk is **home-country CRS/FATCA**, not speculative UAE property tax; keep bank statements and Ejari aligned with [Dubai property taxes explained](/guides/dubai-property-taxes-explained/).

`

  );
  writeFileSync(p, c);
  console.log('OK uae-tax-guide-expats');
}

{
  const p = join(ROOT, 'dubai-hills-estate-property-investment.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n### Future transport projects\n',
    '\n\n## School catchment analysis for investors\n',
    `

**Transport DD:** Underwrite on **today's** Al Khail/MBZ access and the **operational Metro 2020 station** — not hyperloop or unbuilt shuttle decks. Re-run travel-time tests at peak hours before villa/apartment offer.

---

## School catchment analysis for investors
`
  );
  writeFileSync(p, c);
  console.log('OK dubai-hills-estate');
}

{
  const p = join(ROOT, 'oman-property-investment-guide.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Regional Integration and Exit Strategy Planning\n',
    '\n\n## Due Diligence Checklist for Oman ITC Purchase\n',
    `

**Exit reality:** ITC resale is thin — budget **5-year minimum** hold and price 5–10% below peak if you must sell in year 3–5. Best liquidity stays in **handed-over Al Mouj** with Ejari-style lease history; new zones need completed phase + 12 months of rents before you model exit.

---

## Due Diligence Checklist for Oman ITC Purchase
`
  );
  writeFileSync(p, c);
  console.log('OK oman-property-investment-guide');
}

{
  const p = join(ROOT, 'west-bay-doha-property-investment.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n### Strategic Investment Frameworks\n',
    '\n\n## Freehold verification: critical step\n',
    `

**West Bay thesis in one line:** Only buy a **MOJ-verified foreign-freehold tower** with two years of **actual tower leases** — not a generic "2030 vision" CBD story. Compare yields to [The Pearl / Lusail](/guides/the-pearl-lusail-property-investment/) before offer.

---

## Freehold verification: critical step
`
  );
  writeFileSync(p, c);
  console.log('OK west-bay-doha');
}

{
  const p = join(ROOT, 'dubai-ejari-tenancy-contract.mdx');
  let c = readFileSync(p, 'utf8');
  c = c.replace(
    `**Smart Dubai initiative impacts:**
- Blockchain-based contract verification (pilot phase)
- AI-powered document processing for faster registration
- IoT integration with building management systems

`,
    `**Practical tip:** Use **Dubai REST rental index** inside the app before signing — pilot blockchain features do not change Ejari fees or dispute process today.

`
  );
  writeFileSync(p, c);
  console.log('OK dubai-ejari-tenancy');
}

console.log('batch 24 trim done');
