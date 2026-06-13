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

// golden-visa-mortgage
{
  const p = join(ROOT, 'golden-visa-mortgage-property-uae.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(c, '\n\n## Advanced structuring: Corporate ownership with mortgage financing\n', '\n\n## Market timing strategies:');
  c = trimBetween(c, '\n\n## Market timing strategies: Golden Visa mortgage in different market cycles\n', '\n\n## Dispute resolution and problem scenarios\n');
  c = trimBetween(c, '\n\n## Technology and digital processes for mortgaged Golden Visa\n', '\n\n## Combining Mortgage with Portfolio Aggregation\n');
  writeFileSync(p, c);
  console.log('OK golden-visa-mortgage');
}

// ejari-registration — post-Summary fluff
{
  const p = join(ROOT, 'ejari-registration-landlord-guide.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Advanced Ejari strategies for portfolio landlords\n',
    '\n\nRegister every long-term lease promptly',
    '\n\n**Related reading:** [Dubai Property Investment Guide](/guides/dubai-property-investment-guide/) · [Short-term rental Dubai license](/guides/short-term-rental-dubai-license/) · [RERA rent increase rules](/guides/rera-rent-increase-rules-dubai/).\n\nRegister every long-term lease promptly'
  );
  writeFileSync(p, c);
  console.log('OK ejari-registration');
}

// short-term-vs-long-term
{
  const p = join(ROOT, 'short-term-vs-long-term-rental-dubai.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Advanced STR vs LTR Analysis by Property Type\n',
    '\n\n*DET fees and OA policies',
    `

---

## Red flags — STR listings

- **OA STR ban** ignored because "others do Airbnb in the building"
- **Gross STR math** without DET fee, cleaning, linen, and 15–25% management
- **Platform screenshots** used instead of 12-month Ejari baseline on same unit
- **Furnishing capex** omitted from ROI (AED 25K–60K on 1BR)
- **Holiday-home licence** assumed without building and DTCM checks

**Related reading:** [Short-term rental Dubai license](/guides/short-term-rental-dubai-license/) · [Dubai rental yield guide](/guides/dubai-rental-yield-guide/) · [Property management Dubai cost](/guides/property-management-dubai-cost/) · [Holiday home Dubai investment](/guides/holiday-home-dubai-investment/).

---

*DET fees and OA policies`
  );
  writeFileSync(p, c);
  console.log('OK short-term-vs-long-term');
}

// refinance
{
  const p = join(ROOT, 'refinance-property-dubai-guide.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(c, '\n\n## Technology and digital refinancing tools\n', '\n\n## Advanced exit strategy considerations\n');
  c = trimBetween(c, '\n\n## Advanced exit strategy considerations\n', '\n\n## Related guides\n');
  writeFileSync(p, c);
  console.log('OK refinance');
}

// dubai-property-insurance
{
  const p = join(ROOT, 'dubai-property-insurance-guide.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Technology and smart home coverage\n',
    '\n\n## Islamic insurance (Takaful) options\n',
    `
**Smart-home note:** List IoT devices and STR furnishings on your **contents schedule** — standard building cover rarely includes cyber or guest-data exposure. Photograph inventory at policy start.

`
  );
  writeFileSync(p, c);
  console.log('OK dubai-property-insurance');
}

console.log('batch 18 trim done');
