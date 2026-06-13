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

// power-of-attorney
{
  const p = join(ROOT, 'power-of-attorney-property-dubai.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(c, '\n\n## Technology and digital solutions for POA management\n', '\n\n## POA fraud prevention and security measures\n');
  writeFileSync(p, c);
  console.log('OK power-of-attorney');
}

// golden-visa-renewal
{
  const p = join(ROOT, 'golden-visa-renewal-requirements-uae.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Technology and Digital Integration in Renewal Process\n',
    '\n\n## Related Guides\n',
    `
**Digital renewal:** Use **UAE Pass** + GDRFA Smart App for tracking. Upload **PDF title deed, Ejari, and bank NOC** under 5MB each; keep registered property value documentation aligned with the AED 2M rule before you apply.

`
  );
  writeFileSync(p, c);
  console.log('OK golden-visa-renewal');
}

// rent-vs-buy — technology subsection only
{
  const p = join(ROOT, 'rent-vs-buy-dubai-expat.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n### Technology tools for decision support\n',
    '\n\n---\n\n## Real-world case studies: Rent vs buy outcomes\n',
    `
**Research tools:** Dubai REST for transacted rents, RERA calculator for renewals, Bayut/Property Finder for ask prices — run the same **net yield** model on buy vs rent before deciding.

`
  );
  writeFileSync(p, c);
  console.log('OK rent-vs-buy');
}

// golden-visa-multiple-properties
{
  const p = join(ROOT, 'golden-visa-multiple-properties-uae.mdx');
  let c = readFileSync(p, 'utf8');
  if (c.includes('## Technology Integration for Portfolio Management')) {
    c = trimBetween(
      c,
      '\n\n## Technology Integration for Portfolio Management\n',
      '\n\n## ',
      `
**Portfolio tracking:** One spreadsheet with **title deed value, mortgage balance, Ejari rent, and NOC expiry** per unit beats PropTech dashboards for Golden Visa aggregation.

---

## `
    );
  }
  writeFileSync(p, c);
  console.log('OK golden-visa-multiple-properties');
}

// how-to-buy-dubai-property-remotely
{
  const p = join(ROOT, 'how-to-buy-dubai-property-remotely.mdx');
  let c = readFileSync(p, 'utf8');
  if (c.includes('### Technology-Enhanced Due Diligence')) {
    c = trimBetween(
      c,
      '\n\n### Technology-Enhanced Due Diligence\n',
      '\n\n### ',
      `
**Remote DD minimum:** Video walkthrough + Dubai REST escrow check + independent snagging report on a **completed unit in the same tower** — not VR marketing alone.

### `
    );
  }
  writeFileSync(p, c);
  console.log('OK how-to-buy-remotely');
}

console.log('batch 19 trim done');
