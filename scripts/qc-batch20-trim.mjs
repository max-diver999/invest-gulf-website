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
  const p = join(ROOT, 'dubai-relocation-checklist.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Technology and digital life setup\n',
    '\n\n*June 2026 — Invest Gulf Editorial',
    `
**Digital essentials (week 1):** Etisalat or Du fibre, UAE Pass, Wise/ bank app, DEWA app, Dubai REST if renting. Skip smart-home capex until tenancy is stable.

---

*June 2026 — Invest Gulf Editorial`
  );
  writeFileSync(p, c);
  console.log('OK dubai-relocation-checklist');
}

{
  const p = join(ROOT, 'dubai-cooling-off-period-off-plan.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(c, '\n\n## Technology and digital transformation\n', '\n\n## Related guides\n');
  writeFileSync(p, c);
  console.log('OK dubai-cooling-off-period');
}

{
  const p = join(ROOT, 'dubai-ejari-tenancy-contract.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Digital transformation and future Ejari changes\n',
    '\n\n## Ejari checklist for new Dubai tenants\n',
    '\n'
  );
  c = trimBetween(
    c,
    '\n\n## Future-proofing your Dubai tenancy through Ejari\n',
    '\n\n## When Ejari problems arise: tenant solutions\n',
    '\n'
  );
  writeFileSync(p, c);
  console.log('OK dubai-ejari-tenancy-contract');
}

{
  const p = join(ROOT, 'uae-central-bank-mortgage-rules.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Technology and Digital Application Processes\n',
    '\n\n## Cross-Border Considerations for International Borrowers\n',
    `
**Digital applications:** Most UAE banks accept **salary transfer history and API bank statements** for initial approval; final mortgage signing still typically requires **in-person ID** and trustee-centre registration. UAE Pass is increasingly accepted for document upload — not a substitute for Central Bank LTV/DBR rules.

`
  );
  writeFileSync(p, c);
  console.log('OK uae-central-bank-mortgage-rules');
}

{
  const p = join(ROOT, 'how-to-evaluate-dubai-developer.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Technology and Innovation Evaluation\n',
    '\n\n## Dispute Resolution and Escalation Procedures\n',
    `
**Smart-building claims:** Verify **named suppliers, warranty terms, and SC impact** in the SPA — not brochure renders. LEED/Estidama targets matter only if certification is **contractually tied** to handover, not marketing slides.

`
  );
  writeFileSync(p, c);
  console.log('OK how-to-evaluate-dubai-developer');
}

console.log('batch 20 trim done');
