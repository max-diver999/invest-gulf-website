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
  const p = join(ROOT, 'al-nakheel-rak-property-investment.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Infrastructure development timeline and impact\n',
    '\n\n*RAK prices, Wynn timelines',
    `

---

## RAK-specific due diligence — Al Nakheel

Before offer:

1. **RAK Land Department** freehold on the plot — not brochure marketing only.
2. **Three years of service charge invoices** from the same phase (OA rules differ from Dubai RERA).
3. **Closed rental receipts** — RAK Ejari depth is thin; do not underwrite on Bayut asking rents.
4. **Peak-hour drive test** to Dubai employer (07:30–08:30) if commute is part of your thesis.
5. **Wynn spillover check** — hospitality jobs help RAK broadly; they do not justify Al Marjan pricing on Nakheel villas.

Compare net yield to [Al Hamra Village property investment](/guides/al-hamra-village-property-investment/) and [Ras Al Khaimah property investment guide](/guides/ras-al-khaimah-property-investment-guide/) before paying suburban Nakheel premium.

---

*RAK prices, Wynn timelines`
  );
  writeFileSync(p, c);
  console.log('OK al-nakheel-rak');
}

{
  const p = join(ROOT, 'dubai-property-for-french-buyers.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n### Technology and remote management\n',
    '\n\n## French community and lifestyle factors\n',
    `
**Remote management:** Use a RERA-licensed manager with **monthly statements in EUR-friendly format** for IFI reporting — not generic PropTech dashboards. Keep Ejari PDFs and bank credits for French fiscaliste review.

`
  );
  c = trimBetween(
    c,
    '\n\n**Cross-border probate considerations:**\n',
    '\n\n## Related guides\n',
    '\n'
  );
  writeFileSync(p, c);
  console.log('OK dubai-property-for-french-buyers');
}

{
  const p = join(ROOT, 'uae-banking-guide-expats.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(c, '\n\n## Industry outlook and trends\n', '\n\n<FaqBlock items={');
  writeFileSync(p, c);
  console.log('OK uae-banking-guide-expats');
}

{
  const p = join(ROOT, 'ajman-freehold-property-guide.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(c, '\n\n## Future Development and Market Outlook\n', '\n\n## Investment Decision Framework\n');
  writeFileSync(p, c);
  console.log('OK ajman-freehold');
}

{
  const p = join(ROOT, 'sharjah-freehold-areas-guide.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(c, '\n\n## Future Outlook and Development Pipeline\n', '\n\n## Decision Framework for Sharjah Freehold Investment\n');
  writeFileSync(p, c);
  console.log('OK sharjah-freehold');
}

console.log('batch 21 trim done');
