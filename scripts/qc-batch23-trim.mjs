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
  const p = join(ROOT, 'dubai-property-taxes-explained.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Future Tax Considerations and Scenarios\n',
    '\n\n## Tax Record-Keeping for Dubai Property Investors\n',
    `

**Planning note:** UAE property tax rules have been stable for decades — model returns on **current DLD fees and service charges**, not speculative federal taxes. Home-country reporting (CRS, UK/US/EU) is the variable that actually moves after-tax outcomes; see [UAE tax guide for expats](/guides/uae-tax-guide-expats/) and keep Ejari + transfer receipts for your adviser.

---

## Tax Record-Keeping for Dubai Property Investors
`
  );
  writeFileSync(p, c);
  console.log('OK dubai-property-taxes');
}

{
  const p = join(ROOT, 'freehold-areas-dubai-list.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Regulatory Framework Evolution and Future Considerations\n',
    '\n\n## Verifying Freehold Status: The Process\n',
    `

**Regulatory DD:** Freehold designation is **per unit**, not per marketing brochure. Before relying on zone tables above, pull a **Dubai REST Unit Profile** and confirm ownership type reads Freehold — see [Dubai REST app due diligence](/guides/dubai-rest-app-property-due-diligence/) and [How to buy property Dubai](/guides/how-to-buy-property-dubai-step-by-step/).

---

## Verifying Freehold Status: The Process
`
  );
  writeFileSync(p, c);
  console.log('OK freehold-areas-dubai-list');
}

{
  const p = join(ROOT, 'oman-itc-zones-property.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Future market outlook and development pipeline\n',
    '\n\n## Practical investment execution and timeline\n',
    `

## ITC zone DD — before you model "Vision 2040" upside

| Check | Why it matters |
|---|---|
| Ministry of Housing ITC letter on **this** project | Marketing "ITC" ≠ registered foreign ownership |
| Completed vs off-plan phase | Yield only exists after handover + tenant |
| Compare rent to [Muscat Qurum benchmarks](/guides/muscat-qurum-property-investment/) | ITC must beat Qurum convenience or justify premium |
| ROP residency path separate from title | See [Oman residency by investment](/guides/oman-residency-by-investment/) |
| Exit liquidity | Thin resale — budget 5-year hold |

---

## Practical investment execution and timeline
`
  );
  writeFileSync(p, c);
  console.log('OK oman-itc-zones');
}

{
  const p = join(ROOT, 'muscat-qurum-property-investment.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Regional Economic Integration and Future Outlook\n',
    '\n\n## Omani National Investors: Different Playbook\n',
    `

**Foreign investor takeaway:** Use Qurum **transacted rents** as your ITC floor — not macro Vision decks. If Al Mouj ask implies yield above Qurum + lifestyle premium without verified tenants, walk. Cross-check [Oman ITC zones property](/guides/oman-itc-zones-property/) and [Muscat Al Mouj guide](/guides/muscat-al-mouj-property-investment/) before offer.

---

## Omani National Investors: Different Playbook
`
  );
  writeFileSync(p, c);
  console.log('OK muscat-qurum');
}

{
  const p = join(ROOT, 'rak-healthcare-guide.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Future capacity — Wynn and Marjan\n',
    '\n\n## Reader decision tree\n',
    `

**Capacity red flag:** Wynn/Marjan adds **hospitality clinics**, not tertiary beds — do not underwrite villa health access on resort announcements alone. Verify any new hospital MOHAP licence before citing bed counts; Dubai remains the hub for complex care ([Dubai healthcare guide](/guides/dubai-healthcare-guide-expats/)).

---

## Reader decision tree
`
  );
  writeFileSync(p, c);
  console.log('OK rak-healthcare');
}

console.log('batch 23 trim done');
