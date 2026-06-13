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
  const p = join(ROOT, 'jebel-ali-village-property-investment.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Future Development Timeline and Investment Outlook\n',
    '\n\n**Further reading:**',
    `

---

## Red flags — Jebel Ali Village

- **Expo/Dubai South hype** priced in without Ejari on handed-over phase
- **Metro future** in underwriting before station is live
- **Industrial adjacency** ignored in tenant marketing
- **SC estimate only** — no JOPD history from completed phase

---

**Further reading:**`
  );
  writeFileSync(p, c);
  console.log('OK jebel-ali-village');
}

{
  const p = join(ROOT, 'meydan-horizon-property-investment.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Future Outlook and Long-Term Investment Potential\n',
    '\n\n<FaqBlock',
    `
---

## Summary

Meydan Horizon suits **end-users and long-hold investors** betting on Meydan City maturation — not maximum resale liquidity. Underwrite **SC on completed phase**, **Ejari on your unit type**, and compare to [Mohammed Bin Rashid City](/guides/mohammed-bin-rashid-city-property-investment/) before paying off-plan premium.

`
  );
  writeFileSync(p, c);
  console.log('OK meydan-horizon');
}

{
  const p = join(ROOT, 'dubai-villa-vs-apartment-investment.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Future supply pipeline impact analysis\n',
    '\n\n## Investment exit strategies by property format\n',
    `
**Supply note:** Apartment pipeline is heavier than villa pipeline in 2026–2028 — favour **villa or low-supply apartment micro-locations** if resale liquidity matters. Verify **DLD transaction volume by community** before assuming appreciation.

`
  );
  writeFileSync(p, c);
  console.log('OK dubai-villa-vs-apartment');
}

{
  const p = join(ROOT, 'best-off-plan-dubai-marina.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Future Marina development phases and investment implications\n',
    '\n\n*Data reflects DLD',
    '\n\n'
  );
  writeFileSync(p, c);
  console.log('OK best-off-plan-dubai-marina');
}

{
  const p = join(ROOT, 'ajman-living-guide.mdx');
  let c = readFileSync(p, 'utf8');
  c = trimBetween(
    c,
    '\n\n## Future supply and market 2026\n',
    '\n\n## FAQ — Ajman extended (body)\n',
    `
**Supply note:** Ajman pipeline is large relative to absorption — underwrite **net yield on transacted rent**, not launch PSF, and compare to [Sharjah vs Dubai rent](/guides/sharjah-vs-dubai-rent/).

---

## FAQ — Ajman extended (body)
`
  );
  writeFileSync(p, c);
  console.log('OK ajman-living');
}

console.log('batch 22 trim done');
